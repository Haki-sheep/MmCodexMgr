import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {removeOwnTemp} from './io.mjs';

const Root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {values:Options}=parseArgs({options:{source:{type:'string'},'source-commit':{type:'string'},toolchain:{type:'string'}}});
if(!Options.toolchain)throw new Error('Supply --toolchain containing node_modules with vite three fflate gifenc');
const Modules=path.resolve(Options.toolchain,'node_modules');
const Source=Options.source?path.resolve(Options.source):path.join(Root,'assets/forge-core');
const Vendor=path.join(Root,'assets/forge-core');
const ManifestPath=path.join(Root,'runtime/manifest.json');
if(Options['source-commit']&&(!Options.source||!/^[0-9a-f]{40}$/.test(Options['source-commit'])))throw new Error('--source-commit requires --source and a full Git commit hash');
const SourceCommit=Options.source?Options['source-commit']:JSON.parse(await fs.readFile(ManifestPath,'utf8')).sourceCommit;
const Temp=await fs.mkdtemp(path.join(os.tmpdir(),'mm-effect-build-'));
const Hash=Bytes=>crypto.createHash('sha256').update(Bytes).digest('hex');
try {
  const {build}=await import(pathToFileURL(path.join(Modules,'vite/dist/node/index.js')));
  const ModuleHashList=new Set();
  const Result=await build({configFile:false,root:Root,cacheDir:path.join(Temp,'vite-cache'),logLevel:'warn',resolve:{alias:[
    {find:/^.*\/shaders\/ShaderLibrary(?:\.ts)?$/,replacement:path.join(Root,'assets/browser/libraries.ts')},
    {find:/^.*\/assets\/AssetLibrary(?:\.ts)?$/,replacement:path.join(Root,'assets/browser/libraries.ts')},
    {find:'@forge',replacement:path.join(Source,'src')},
    {find:/^three$/,replacement:path.join(Modules,'three/build/three.module.js')},
    {find:/^three\//,replacement:path.join(Modules,'three/')},
    {find:/^fflate$/,replacement:path.join(Modules,'fflate/esm/browser.js')},
    {find:/^gifenc$/,replacement:path.join(Modules,'gifenc/dist/gifenc.esm.js')},
  ]},plugins:[{name:'record-source',generateBundle(){for(const Id of this.getModuleIds()){const File=Id.split('?')[0];if(File.replaceAll('\\','/').startsWith(Source.replaceAll('\\','/')+'/src/'))ModuleHashList.add(File);}}}],build:{write:false,minify:true,sourcemap:false,lib:{entry:path.join(Root,'assets/browser/entry.ts'),formats:['es'],fileName:()=> 'engine.js'},rollupOptions:{output:{codeSplitting:false}}}});
  const BuildList=Array.isArray(Result)?Result:[Result];
  await fs.mkdir(path.join(Root,'runtime/browser'),{recursive:true});
  for(const Chunk of BuildList.flatMap(Value=>Value.output)) {
    if(Chunk.fileName!=='engine.js')throw new Error(`Unexpected build output ${Chunk.fileName}`);
    await fs.writeFile(path.join(Root,'runtime/browser/engine.js'),Chunk.code??Chunk.source);
  }
  const FileList=[];
  for(const File of [...ModuleHashList].sort()) {
    const Relative=path.relative(Source,File).replaceAll('\\','/');
    const Bytes=await fs.readFile(File);
    if(Options.source){const Dest=path.join(Vendor,Relative);await fs.mkdir(path.dirname(Dest),{recursive:true});await fs.writeFile(Dest,Bytes);}
    FileList.push({path:Relative,sha256:Hash(Bytes),bytes:Bytes.length});
  }
  const DependencyList=[];
  for(const Name of ['three','fflate','gifenc','vite']) {
    const Package=JSON.parse(await fs.readFile(path.join(Modules,Name,'package.json'),'utf8'));
    DependencyList.push({name:Name,version:Package.version,license:Package.license,buildOnly:Name==='vite'});
    if(Name==='vite')continue;
    const License=(await fs.readdir(path.join(Modules,Name))).find(Value=>/^license(?:\.|$)/i.test(Value));
    if(!License)throw new Error(`License missing ${Name}`);
    await fs.mkdir(path.join(Root,'runtime/licenses'),{recursive:true});
    await fs.copyFile(path.join(Modules,Name,License),path.join(Root,'runtime/licenses',Name+'.txt'));
  }
  const Bundle=await fs.readFile(path.join(Root,'runtime/browser/engine.js'));
  const Manifest={format:'mm-effect-runtime',version:1,source:'FX Forge source snapshot',sourceCommit:SourceCommit,builtAt:new Date().toISOString(),sources:FileList,dependencies:DependencyList,browser:{file:'browser/engine.js',sha256:Hash(Bundle),bytes:Bundle.length}};
  await fs.writeFile(ManifestPath,JSON.stringify(Manifest,null,2));
  console.log(JSON.stringify({ok:true,sourceFiles:FileList.length,browserBytes:Bundle.length,output:path.join(Root,'runtime')}));
} finally {await removeOwnTemp(Temp,'mm-effect-build-');}
