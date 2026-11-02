"""Inspect rigged sources or export explicit Actions in a standalone Blender process."""

import argparse
import json
import sys
from pathlib import Path


# region Source inspection
def parse_arguments():
    """Read arguments after Blender's double dash."""
    Parser = argparse.ArgumentParser(description=__doc__)
    Parser.add_argument("mode", choices=("inspect", "export"))
    Parser.add_argument("--source", required=True, type=Path)
    Parser.add_argument("--output", required=True, type=Path)
    Parser.add_argument("--armature")
    Parser.add_argument("--action", action="append", default=[])
    Parser.add_argument("--forward", default="-Z", choices=("X", "Y", "Z", "-X", "-Y", "-Z"))
    Parser.add_argument("--up", default="Y", choices=("X", "Y", "Z", "-X", "-Y", "-Z"))
    Parser.add_argument("--apply-modifiers", action="store_true")
    Parser.add_argument("--overwrite", action="store_true")
    ArgumentList = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    return Parser.parse_args(ArgumentList)


def curve_groups(Action):
    """Read legacy curves or Blender 4.4+ layered slot channel bags."""
    if hasattr(Action, "layers") and Action.is_action_layered:
        return [(Bag.slot_handle, list(Bag.fcurves)) for Layer in Action.layers
                for Strip in Layer.strips for Bag in Strip.channelbags]
    return [(None, list(Action.fcurves))]


def action_report(Action):
    """Describe clip ranges slots and the actual keyed channels."""
    GroupList = []
    for Handle, CurveList in curve_groups(Action):
        GroupList.append({"slot_handle": Handle, "curve_count": len(CurveList),
                          "keyframe_count": sum(len(Curve.keyframe_points) for Curve in CurveList),
                          "sampled_point_count": sum(len(Curve.sampled_points) for Curve in CurveList),
                          "data_paths": sorted({Curve.data_path for Curve in CurveList})})
    return {"name": Action.name, "frame_range": list(Action.frame_range),
            "use_frame_range": Action.use_frame_range, "fake_user": Action.use_fake_user,
            "slots": [{"handle": Slot.handle, "identifier": Slot.identifier,
                       "target_id_type": Slot.target_id_type} for Slot in getattr(Action, "slots", [])],
            "channels": GroupList}


def inspect_source(Bpy, Source):
    """Report scene facts without editing or saving the source."""
    ImageList = []
    for Image in Bpy.data.images:
        PathString = Bpy.path.abspath(Image.filepath, library=Image.library)
        Packed = bool(Image.packed_file or Image.packed_files)
        ImageList.append({"name": Image.name, "source": Image.source, "path": PathString,
                          "packed": Packed, "size": list(Image.size),
                          "color_space": Image.colorspace_settings.name,
                          "file_exists": Path(PathString).is_file() if Image.source == "FILE" else None})
    MaterialList = []
    for Material in Bpy.data.materials:
        Tree = Material.node_tree
        MaterialList.append({"name": Material.name,
            "image_nodes": [{"name": Node.name, "image": Node.image.name if Node.image else None,
                             "output_linked": any(Socket.is_linked for Socket in Node.outputs)}
                            for Node in Tree.nodes if Node.type == "TEX_IMAGE"] if Tree else [],
            "links": [{"from_node": Link.from_node.name, "from_socket": Link.from_socket.name,
                       "to_node": Link.to_node.name, "to_socket": Link.to_socket.name}
                      for Link in Tree.links] if Tree else []})
    RigList = []
    MeshList = []
    for Object in Bpy.context.scene.objects:
        Animation = Object.animation_data
        if Object.type == "ARMATURE":
            RigList.append({"name": Object.name, "parent": Object.parent.name if Object.parent else None,
                "matrix_world": [list(Row) for Row in Object.matrix_world],
                "active_action": Animation.action.name if Animation and Animation.action else None,
                "nla_tracks": [{"name": Track.name, "mute": Track.mute,
                    "strips": [{"name": Strip.name, "action": Strip.action.name if Strip.action else None,
                                "frame_start": Strip.frame_start, "frame_end": Strip.frame_end}
                               for Strip in Track.strips]} for Track in Animation.nla_tracks] if Animation else [],
                "bones": [{"name": Bone.name, "parent": Bone.parent.name if Bone.parent else None,
                           "deform": Bone.use_deform, "matrix_local": [list(Row) for Row in Bone.matrix_local]}
                          for Bone in Object.data.bones]})
        elif Object.type == "MESH":
            Rig = Object.find_armature()
            MeshList.append({"name": Object.name, "armature": Rig.name if Rig else None,
                "vertices": len(Object.data.vertices), "polygons": len(Object.data.polygons),
                "uv_layers": [Layer.name for Layer in Object.data.uv_layers],
                "vertex_groups": [Group.name for Group in Object.vertex_groups],
                "materials": [Slot.material.name if Slot.material else None for Slot in Object.material_slots]})
    Scene = Bpy.context.scene
    return {"schema_version": 1, "source": str(Source), "blender_version": Bpy.app.version_string,
            "fps": Scene.render.fps / Scene.render.fps_base, "fps_integer": Scene.render.fps,
            "fps_base": Scene.render.fps_base, "unit_scale": Scene.unit_settings.scale_length,
            "scene_range": [Scene.frame_start, Scene.frame_end],
            "armatures": RigList, "meshes": MeshList, "actions": [action_report(Action) for Action in Bpy.data.actions],
            "images": ImageList, "materials": MaterialList}


# endregion

# region Action export
def export_source(Bpy, Arguments, Output):
    """Export only a named rig its bound meshes and explicitly requested Actions."""
    if not Arguments.armature or not Arguments.action:
        raise ValueError("Export requires --armature and one or more --action arguments")
    Rig = Bpy.context.scene.objects.get(Arguments.armature)
    if Rig is None or Rig.type != "ARMATURE":
        raise ValueError(f"Armature not found: {Arguments.armature}")
    ActionList = []
    for Name in Arguments.action:
        Action = Bpy.data.actions.get(Name)
        if Action is None:
            raise ValueError(f"Action not found: {Name}")
        if len(getattr(Action, "slots", [])) > 1:
            raise ValueError(f"Multiple Action slots require a dedicated export: {Name}")
        CurveList = [Curve for Handle, Group in curve_groups(Action) for Curve in Group]
        if not CurveList or not any(Curve.keyframe_points or Curve.sampled_points for Curve in CurveList):
            raise ValueError(f"Action has no keyed curves: {Name}")
        for Curve in CurveList:
            try:
                CurvePath = Curve.data_path + f"[{Curve.array_index}]" if Curve.array_index else Curve.data_path
                Rig.path_resolve(CurvePath)
            except ValueError as Error:
                raise ValueError(f"Action {Name} is incompatible with {Rig.name}: {Curve.data_path}") from Error
        ActionList.append(Action)
    MeshList = [Object for Object in Bpy.context.scene.objects
                if Object.type == "MESH" and Object.find_armature() == Rig]
    if not MeshList:
        raise ValueError(f"No bound meshes found for armature: {Rig.name}")
    for Object in [Rig] + MeshList:
        if Object.parent and Object.parent not in [Rig] + MeshList:
            raise ValueError(f"External parent requires a dedicated export: {Object.name} -> {Object.parent.name}")
        if Object.name not in Bpy.context.view_layer.objects:
            raise ValueError(f"Object is excluded from active view layer: {Object.name}")
    for Mesh in MeshList:
        if Mesh.animation_data or (Mesh.data.shape_keys and Mesh.data.shape_keys.animation_data):
            raise ValueError(f"Mesh animation requires a dedicated export: {Mesh.name}")
    if Arguments.forward.lstrip("-") == Arguments.up.lstrip("-"):
        raise ValueError("Forward and up must use different axes")
    # Isolate exporter all-actions in this disposable process never save this scene
    for Action in list(Bpy.data.actions):
        if Action not in ActionList:
            Bpy.data.actions.remove(Action)
    Rig.animation_data_create()
    Rig.animation_data.use_nla = False
    Rig.animation_data.action_blend_type = "REPLACE"
    Rig.animation_data.action_influence = 1.0
    Rig.animation_data.action = ActionList[0]
    if getattr(ActionList[0], "slots", []):
        Rig.animation_data.action_slot = ActionList[0].slots[0]
    for Object in Bpy.context.view_layer.objects:
        Object.select_set(False)
    for Object in [Rig] + MeshList:
        Object.hide_set(False)
        Object.hide_select = False
        Object.select_set(True)
    Bpy.context.view_layer.objects.active = Rig
    Result = Bpy.ops.export_scene.fbx(filepath=str(Output), use_selection=True,
        object_types={"ARMATURE", "MESH"}, axis_forward=Arguments.forward, axis_up=Arguments.up,
        apply_unit_scale=True, apply_scale_options="FBX_SCALE_ALL", add_leaf_bones=False,
        use_armature_deform_only=False, use_mesh_modifiers=Arguments.apply_modifiers,
        bake_anim=True, bake_anim_use_all_actions=True, bake_anim_use_nla_strips=False,
        bake_anim_force_startend_keying=True, bake_anim_simplify_factor=0.0,
        path_mode="AUTO", embed_textures=False)
    if "FINISHED" not in Result or not Output.is_file() or Output.stat().st_size == 0:
        raise RuntimeError(f"FBX export did not produce a file: {Result} {Output}")
    return {"fbx": str(Output), "armature": Rig.name, "meshes": [Mesh.name for Mesh in MeshList],
            "requested_actions": [{"name": Action.name, "frame_range": list(Action.frame_range),
                                   "slots": [Slot.identifier for Slot in getattr(Action, "slots", [])]}
                                  for Action in ActionList],
            "settings": {"forward": Arguments.forward, "up": Arguments.up, "animation_source": "actions_only",
                         "apply_modifiers": Arguments.apply_modifiers, "curve_simplify": 0.0,
                         "fps": Bpy.context.scene.render.fps / Bpy.context.scene.render.fps_base},
            "bytes": Output.stat().st_size}


# endregion

# region Entry point
def main():
    """Load a source in background and write an audit report or staged FBX."""
    Arguments = parse_arguments()
    import bpy

    if not bpy.app.background:
        raise RuntimeError("Run this helper in a standalone background Blender process")
    Source = Arguments.source.resolve(strict=True)
    Output = Arguments.output.resolve()
    if Source == Output:
        raise ValueError("Output must differ from source")
    ExpectedSuffix = ".json" if Arguments.mode == "inspect" else ".fbx"
    if Output.suffix.lower() != ExpectedSuffix:
        raise ValueError(f"Output must use {ExpectedSuffix}")
    if Output.exists() and not Arguments.overwrite:
        raise FileExistsError(f"Output already exists use --overwrite explicitly: {Output}")
    if Source.suffix.lower() == ".blend":
        bpy.ops.wm.open_mainfile(filepath=str(Source), use_scripts=False)
    elif Source.suffix.lower() == ".fbx":
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(Source))
    else:
        raise ValueError(f"Unsupported source format: {Source.suffix}")
    Output.parent.mkdir(parents=True, exist_ok=True)
    if Arguments.mode == "inspect":
        Report = inspect_source(bpy, Source)
        Output.write_text(json.dumps(Report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"report": str(Output), "armatures": len(Report["armatures"]),
                          "actions": len(Report["actions"])}, ensure_ascii=False))
    else:
        print(json.dumps(export_source(bpy, Arguments, Output), ensure_ascii=False))


if __name__ == "__main__":
    main()
# endregion
