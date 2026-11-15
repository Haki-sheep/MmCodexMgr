// Mesh assets for mesh particles. FX Forge exports each built-in mesh as
// Meshes/fx_mesh_<kind>.json (Unity coordinates, the same data the preview
// draws); this turns it into Meshes/fx_mesh_<kind>.asset.

#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace FXForge.Editor
{
    internal static class FxMeshes
    {
        [Serializable]
        class MeshJson
        {
            public float[] positions = new float[0], normals = new float[0], uvs = new float[0];
            public int[] indices = new int[0];
        }

        public static Mesh Get(string root, string kind)
        {
            var jsonPath = $"{root}/Meshes/fx_mesh_{kind}.json";
            var assetPath = $"{root}/Meshes/fx_mesh_{kind}.asset";
            var text = AssetDatabase.LoadAssetAtPath<TextAsset>(jsonPath);
            var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
            if (text == null)
            {
                if (mesh == null) Debug.LogWarning($"[FX Forge] Missing mesh {jsonPath}");
                return mesh;
            }
            var data = JsonUtility.FromJson<MeshJson>(text.text);
            bool created = mesh == null;
            if (created) mesh = new Mesh { name = $"fx_mesh_{kind}" };
            mesh.Clear();
            int n = data.positions.Length / 3;
            var v = new Vector3[n];
            var nr = new Vector3[n];
            var uv = new Vector2[n];
            for (int i = 0; i < n; i++)
            {
                v[i] = new Vector3(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2]);
                nr[i] = i * 3 + 2 < data.normals.Length ? new Vector3(data.normals[i * 3], data.normals[i * 3 + 1], data.normals[i * 3 + 2]) : Vector3.forward;
                uv[i] = i * 2 + 1 < data.uvs.Length ? new Vector2(data.uvs[i * 2], data.uvs[i * 2 + 1]) : Vector2.zero;
            }
            mesh.vertices = v;
            mesh.normals = nr;
            mesh.uv = uv;
            mesh.triangles = data.indices;
            mesh.RecalculateBounds();
            if (created) AssetDatabase.CreateAsset(mesh, assetPath);
            else EditorUtility.SetDirty(mesh);
            return mesh;
        }
    }
}
#endif
