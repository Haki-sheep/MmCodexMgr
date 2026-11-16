import {Preview3D} from '@forge/engine/preview3d/Preview3D';
import {Renderer} from '@forge/engine/render';
import {defaultEffect3D, defaultEmitter3D, sanitizeEffect3D} from '@forge/engine/types3d';
import {defaultEffect, defaultEmitter, sanitizeEffect} from '@forge/engine/types';
import {sanitizeAsset} from '@forge/assets/types';
import {sanitizeShader} from '@forge/shaders/types';
import {compileCheck} from '@forge/shaders/compileCheck';
import {unityPackageFiles} from '@forge/export/export3d';
import {analyzeEffect} from '@forge/agent/analyze';
import {GENERATORS, runGenerator} from '@forge/engine/textures/generators/registry';
import {trailTexture} from '@forge/engine/sprites';
import {zipSync} from 'fflate';
import {isCustomMesh} from '@forge/engine/meshes/customMeshes';
import {sanitizeMesh} from '@forge/meshes/types';
import {assetLibrary, meshLibrary, shaderLibrary} from './libraries';

const BundleList: any[] = [];
const Canvas = document.createElement('canvas');
const Output = document.createElement('canvas');
const Flat = new Renderer();
let Preview: Preview3D;
let Config: any = {width:960,height:540,view:{position:[4.6,4.8,10.3],target:[0,1.8,0],fov:40}};

function changed(Original: any, Clean: any, Path = ''): string[] {
  if (Original === null || typeof Original !== 'object') return Object.is(Original, Clean) ? [] : [Path];
  if (!Clean || typeof Clean !== 'object' || Array.isArray(Original) !== Array.isArray(Clean)) return [Path];
  if (Array.isArray(Original) && Original.length !== Clean.length) return [Path];
  return Object.keys(Original).flatMap(Key => Key in Clean ? changed(Original[Key], Clean[Key], `${Path}/${Key}`) : [`${Path}/${Key}`]);
}

function normalize(Raw: any) {
  const Wrapped = Raw?.format === 'fxforge-preset';
  if (Raw?.format && (!Wrapped || Raw.version !== 1)) throw new Error('Expected fxforge-preset version 1');
  const {assets, shaders, meshes, ...PlainEffect} = Raw ?? {};
  const Input = Wrapped ? Raw.effect : PlainEffect;
  if (!Input || !Array.isArray(Input.layers) || Input.layers.length === 0) throw new Error('Effect must contain layers');
  const Effect = Input.space === '3d' ? sanitizeEffect3D(Input) : sanitizeEffect(Input);
  const DifferenceList = changed(Input, Effect, 'effect');
  if (DifferenceList.length) throw new Error(`Sanitizer would change supplied values: ${DifferenceList.join(', ')}`);
  const AssetList = (assets ?? []).map((Value: any) => {
    const Clean = sanitizeAsset(Value);
    if (!Clean || changed(Value, Clean).length) throw new Error(`Invalid asset ${Value?.id}`);
    if (!Clean.dataUrl.startsWith('data:image/png;base64,')) throw new Error(`Only embedded PNG assets are accepted ${Clean.id}`);
    return Clean;
  });
  const ShaderList = (shaders ?? []).map((Value: any) => {
    const Clean = sanitizeShader(Value);
    if (!Clean || changed(Value, Clean).length) throw new Error(`Invalid shader ${Value?.id}`);
    const Result = compileCheck(Clean.code);
    if (!Result.ok) throw new Error(`${Clean.id}: ${Result.errors.join('; ')}`);
    return Clean;
  });
  const MeshList = (meshes ?? []).map((Value: any) => {
    const Clean = sanitizeMesh(Value);
    if (!Clean || changed(Value, Clean).length) throw new Error('Invalid mesh ' + Value?.id);
    return Clean;
  });
  for (const [Name, List] of [['layers',Effect.layers],['assets',AssetList],['shaders',ShaderList],['meshes',MeshList]] as any) {
    if (new Set(List.map((Item: any) => Item.id)).size !== List.length) throw new Error(`Duplicate IDs in ${Name}`);
  }
  const AssetHashList = new Set(AssetList.map((Value: any) => Value.id));
  const ShaderHashList = new Set(ShaderList.map((Value: any) => Value.id));
  const MeshHashList = new Set(MeshList.map((Value: any) => Value.id));
  for (const Layer of Effect.layers as any[]) {
    if (Layer.mesh && isCustomMesh(Layer.mesh) && !MeshHashList.has(Layer.mesh)) {
      throw new Error('Missing mesh ' + Layer.mesh + ' in ' + Layer.id);
    }
    for (const Ref of [Layer.material?.texture, Layer.material?.dissolveTexture, Layer.sheet?.asset, Layer.trailTexture, Layer.texture]) {
      if (Ref?.startsWith('a_') && !AssetHashList.has(Ref)) throw new Error(`Missing asset ${Ref} in ${Layer.id}`);
    }
    if (Layer.material?.shader && !ShaderHashList.has(Layer.material.shader)) throw new Error(`Missing shader ${Layer.material.shader} in ${Layer.id}`);
    for (const Ref of [Layer.parentId, Layer.subEmitterOf]) if (Ref && !Effect.layers.some((Other: any) => Other.id === Ref)) throw new Error(`Missing layer ${Ref} in ${Layer.id}`);
    const Seen = new Set<string>();
    let Current: any = Layer;
    while (Current) {
      if (Seen.has(Current.id)) throw new Error(`Hierarchy cycle at ${Current.id}`);
      Seen.add(Current.id);
      Current = Effect.layers.find((Other: any) => Other.id === (Current.subEmitterOf || Current.parentId));
    }
  }
  return {format:'fxforge-preset',version:1,title:Raw.title ?? Effect.name,category:Raw.category ?? '原创特效',tags:Raw.tags ?? [],effect:Effect,thumb:Raw.thumb ?? '',assets:AssetList,shaders:ShaderList,...(MeshList.length ? {meshes:MeshList} : {})};
}

async function activate(Index: number) {
  const Bundle = BundleList[Index];
  if (!Bundle) throw new Error(`Unknown bundle ${Index}`);
  for (const Asset of Bundle.assets) await assetLibrary.register(Asset);
  for (const Shader of Bundle.shaders) shaderLibrary.register(Shader);
  for (const Mesh of Bundle.meshes ?? []) meshLibrary.register(Mesh);
  return Bundle;
}

function draw(Effect: any, Time: number): HTMLCanvasElement {
  if (Effect.space === '3d') {
    Preview ??= new Preview3D(Canvas);
    Preview.renderer.setPixelRatio(1);
    Preview.setSize(Config.width, Config.height);
    Preview.controls.enableDamping = false;
    Preview.setView(Config.view);
    Preview.camera.fov = Config.view.fov ?? 40;
    Preview.camera.updateProjectionMatrix();
    (Preview as any).stage.grid.visible = false;
    Preview.render(Effect, Time, null);
    return Canvas;
  }
  Output.width=Config.width;Output.height=Config.height;
  const Context=Output.getContext('2d')!;
  Context.fillStyle=Effect.background;Context.fillRect(0,0,Output.width,Output.height);
  const Frame=Flat.render(Effect,Time,1);
  const Scale=Math.min(Output.width/Effect.width,Output.height/Effect.height);
  const Width=Effect.width*Scale, Height=Effect.height*Scale;
  Context.drawImage(Frame.canvas,(Output.width-Width)/2,(Output.height-Height)/2,Width,Height);
  return Output;
}

function base64(Bytes: Uint8Array): string {
  let Raw='';
  for(let I=0;I<Bytes.length;I+=32768) Raw+=String.fromCharCode(...Bytes.subarray(I,I+32768));
  return btoa(Raw);
}

const Api = {
  configure(Value: any) {Config={...Config,...Value};},
  textureStats() {
    const Texture=trailTexture();
    const Context=Texture.getContext('2d')!;
    const Alpha=(X:number,Y:number)=>Context.getImageData(Math.floor(X*(Texture.width-1)),Math.floor(Y*(Texture.height-1)),1,1).data[3];
    return {trail:{head:Alpha(0,0.5),middle:Alpha(0.5,0.5),tail:Alpha(0.95,0.5),edge:Alpha(0.5,0)}};
  },
  defaults(Space='3d', Name='New Effect') {
    const Effect=Space==='3d'?defaultEffect3D({name:Name}):defaultEffect({name:Name});
    return {format:'fxforge-preset',version:1,title:Name,category:'原创特效',tags:[],effect:Effect,thumb:'',assets:[],shaders:[]};
  },
  schema() {
    return {emitter3d:defaultEmitter3D(),effect3d:defaultEffect3D(),emitter2d:defaultEmitter(),effect2d:defaultEffect(),generators:GENERATORS.map(({draw,grid,...Value}: any)=>Value)};
  },
  async load(Raw: any) {
    const Bundle=normalize(Raw);
    BundleList.push(Bundle);
    const Index=BundleList.length-1;
    await activate(Index);
    return {index:Index,bundle:Bundle,analysis:analyzeEffect(Bundle.effect),shaderCount:Bundle.shaders.length};
  },
  async frame(Index: number, Time: number) {
    const Bundle=await activate(Index);
    return draw(Bundle.effect,Time).toDataURL('image/png');
  },
  async compare(Before: number, After: number, Time: number) {
    const Compare=document.createElement('canvas');Compare.width=Config.width*2;Compare.height=Config.height+40;
    const Context=Compare.getContext('2d')!;
    Context.fillStyle='#eee9df';Context.fillRect(0,0,Compare.width,Compare.height);
    for(const [Column,Index] of [Before,After].entries()) {
      const Bundle=await activate(Index);
      Context.drawImage(draw(Bundle.effect,Time),Column*Config.width,40);
      Context.fillStyle='#292c2c';Context.font='18px "Microsoft YaHei", sans-serif';
      Context.fillText(`${Column===0?'Before / 原版':'After / 新版'}   ${Time.toFixed(2)} s`,Column*Config.width+14,27);
    }
    return Compare.toDataURL('image/png');
  },
  async contact(Index: number, TimeList: number[]) {
    const Bundle=await activate(Index);
    const Contact=document.createElement('canvas');const Columns=Math.min(4,TimeList.length);
    Contact.width=Columns*320;Contact.height=Math.ceil(TimeList.length/Columns)*202;
    const Context=Contact.getContext('2d')!;Context.fillStyle=Bundle.effect.background;Context.fillRect(0,0,Contact.width,Contact.height);
    for(const [I,Time] of TimeList.entries()) {
      const X=I%Columns*320,Y=Math.floor(I/Columns)*202;
      Context.drawImage(draw(Bundle.effect,Time),X,Y+22,320,180);
      Context.fillStyle='#888888';Context.font='15px sans-serif';Context.fillText(`${Time.toFixed(3)} s`,X+8,Y+17);
    }
    return Contact.toDataURL('image/png');
  },
  async unity(Index: number) {
    const Bundle=await activate(Index);
    if(Bundle.effect.space!=='3d')throw new Error('Unity ParticleSystem export requires a 3D effect');
    const Content = {
      effect: Bundle.effect,
      assets: Bundle.assets.map((Value:any) => ({id:Value.id,dataUrl:Value.dataUrl})),
      shaders: Bundle.shaders.map((Value:any) => ({id:Value.id,code:Value.code})),
      ...(Bundle.meshes ? {meshes:Bundle.meshes.map((Value:any) => ({id:Value.id,source:Value.source}))} : {}),
    };
    const IdentityBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(Content)));
    const Identity=[...new Uint8Array(IdentityBytes)].map(Value=>Value.toString(16).padStart(2,'0')).join('').slice(0,20);
    const Scope=`FXForge/Variants/fx_${Identity}`;
    const Original=await unityPackageFiles(Bundle.effect);
    const Files: Record<string,Uint8Array>={};
    for(const [Name,Bytes] of Object.entries(Original)) {
      const Target=Name==='FXForge/README.txt'||/^FXForge\/(Effects|Textures|Meshes)\//.test(Name)?Name.replace('FXForge/',Scope+'/'):Name;
      Files[Target]=Name==='FXForge/README.txt'?new TextEncoder().encode(new TextDecoder().decode(Bytes).replaceAll('FXForge/Effects/',Scope+'/Effects/').replaceAll('FXForge/Materials',Scope+'/Materials').replaceAll('FXForge/Textures',Scope+'/Textures').replaceAll('FXForge/Meshes',Scope+'/Meshes')):Bytes;
    }
    return {scope:Scope,zip:base64(zipSync(Files)),files:Object.fromEntries(Object.entries(Files).map(([Name,Bytes])=>[Name,base64(Bytes)]))};
  },
  generate(Id: string, Params: any, Name: string, AssetId: string) {
    const Result=runGenerator(Id,Params);
    const Asset={id:AssetId,name:Name,kind:Result.kind,tilesX:Result.tilesX,tilesY:Result.tilesY,width:Result.canvas.width,height:Result.canvas.height,dataUrl:Result.canvas.toDataURL('image/png'),source:{type:'procedural',generator:Id,params:Result.params},createdAt:Date.now()};
    if(!sanitizeAsset(Asset))throw new Error('Invalid generated asset ID');
    return Asset;
  },
};
(window as any).effectApi=Api;
(window as any).effectReady=true;
