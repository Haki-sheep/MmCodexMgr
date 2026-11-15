import {setAssetImage} from '@forge/engine/assetImages';
import {setCustomShader} from '@forge/engine/customShaders';
import {buildMesh} from '@forge/engine/meshes/build';
import {setCustomMesh} from '@forge/engine/meshes/customMeshes';
import type {MeshRecord} from '@forge/meshes/types';

const AssetDict = new Map<string, any>();
const ShaderDict = new Map<string, any>();

export const assetLibrary = {
  get: (Id: string) => AssetDict.get(Id),
  get all() { return [...AssetDict.values()]; },
  async register(Record: any) {
    if (AssetDict.get(Record.id)?.dataUrl === Record.dataUrl) return;
    const Bitmap = new Image();
    await new Promise<void>((Resolve, Reject) => {
      Bitmap.onload = () => Resolve();
      Bitmap.onerror = () => Reject(new Error(`Cannot decode asset ${Record.id}`));
      Bitmap.src = Record.dataUrl;
    });
    if (Bitmap.naturalWidth !== Record.width || Bitmap.naturalHeight !== Record.height) throw new Error(`Asset dimensions differ ${Record.id}`);
    const Canvas = document.createElement('canvas');
    Canvas.width = Bitmap.naturalWidth;
    Canvas.height = Bitmap.naturalHeight;
    Canvas.getContext('2d')!.drawImage(Bitmap, 0, 0);
    AssetDict.set(Record.id, Record);
    setAssetImage(Record.id, {canvas: Canvas, kind: Record.kind, tilesX: Record.tilesX, tilesY: Record.tilesY});
  },
};

export const shaderLibrary = {
  get: (Id: string) => ShaderDict.get(Id),
  get all() { return [...ShaderDict.values()]; },
  register(Record: any) {
    if (ShaderDict.get(Record.id)?.code === Record.code) return;
    ShaderDict.set(Record.id, Record);
    setCustomShader(Record.id, Record.code);
  },
};

const MeshDict = new Map<string, MeshRecord>();

export const meshLibrary = {
  register(Record: MeshRecord) {
    if (MeshDict.get(Record.id) === Record) return;
    setCustomMesh(Record.id, buildMesh(Record.source));
    MeshDict.set(Record.id, Record);
  },
};
