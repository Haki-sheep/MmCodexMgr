import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {withBrowser} from './browser.mjs';
import {capture} from './media.mjs';
import {executable,readJson,writeJson,writePng,newDirectory,hash,safeRelative,verifyRuntime} from './io.mjs';

const StringOptionList=['input','before','after','out','name','space','kind','browser','ffmpeg','width','height','fps','speed','start','end','times','view-file','generator','params-file','id'];
const {values:Options,positionals:CommandList}=parseArgs({allowPositionals:true,options:Object.fromEntries([...StringOptionList.map(Key=>[Key,{type:'string'}]),['mp4',{type:'boolean'}],['help',{type:'boolean'}]])});
const Command=CommandList[0];
let Directory;
function requireOption(Name) {if(!Options[Name])throw new Error(`--${Name} is required`);return Options[Name];}
try {
  if(Options.help||!Command) {
    console.log('mm-effect-fucker\nCommands: doctor | init | schema | validate | render | compare | generate-texture | export-unity\nAll commands emit JSON except help. New output files/directories only. See references/commands.md.');
    process.exit(0);
  }
  if(CommandList.length!==1)throw new Error('Supply exactly one command');
  if(Command==='doctor') {
    const Manifest=await verifyRuntime();
    const Browser=await executable(Options.browser,'browser');
    const Ffmpeg=await executable(Options.ffmpeg,'ffmpeg');
    console.log(JSON.stringify({ok:true,node:process.version,browser:Browser,ffmpeg:Ffmpeg,runtimeSha256:Manifest.browser.sha256,builtAt:Manifest.builtAt},null,2));
  } else {
    const Allowed=new Set(['init','schema','validate','render','compare','generate-texture','export-unity']);
    if(!Allowed.has(Command))throw new Error(`Unknown command ${Command}`);
    if(['render','compare','generate-texture','export-unity'].includes(Command))Directory=await newDirectory(requireOption('out'));
    const Result=await withBrowser(Options,async Api=>{
      if(Command==='init') {
        const Space=Options.space??'3d';if(!['2d','3d'].includes(Space))throw new Error('--space must be 2d or 3d');
        const Bundle=await Api.call('defaults',Space,Options.name??'New Effect');
        await writeJson(requireOption('out'),Bundle);
        return {ok:true,file:path.resolve(Options.out),space:Space};
      }
      if(Command==='schema') {
        const Schema=await Api.call('schema');
        if(Options.kind&&!(Options.kind in Schema))throw new Error('kind must be emitter3d effect3d emitter2d effect2d generators');
        return Options.kind?Schema[Options.kind]:Schema;
      }
      if(Command==='generate-texture') {
        const Asset=await Api.call('generate',requireOption('generator'),Options['params-file']?await readJson(Options['params-file']):{},Options.name??Options.generator,Options.id??'a_'+Date.now().toString(36));
        await writeJson(path.join(Directory,'asset.json'),Asset);
        await writePng(path.join(Directory,'texture.png'),Asset.dataUrl);
        return {ok:true,output:Directory,id:Asset.id,width:Asset.width,height:Asset.height,kind:Asset.kind};
      }
      if(Command==='compare') {
        const Before=await Api.call('load',await readJson(requireOption('before')));
        const After=await Api.call('load',await readJson(requireOption('after')));
        return {ok:true,output:Directory,capture:await capture(Api,Options,Directory,Before,After)};
      }
      const Loaded=await Api.call('load',await readJson(requireOption('input')));
      if(Command==='validate')return {ok:true,layers:Loaded.bundle.effect.layers.length,shaderCompile:'passed',shaderCount:Loaded.shaderCount,analysis:Loaded.analysis,unityValidation:'not_run'};
      if(Command==='render') {
        const Report=await capture(Api,Options,Directory,Loaded);
        await writeJson(path.join(Directory,'effect.fxpreset.json'),Loaded.bundle);
        return {ok:true,output:Directory,capture:Report};
      }
      const Package=await Api.call('unity',Loaded.index);
      const FileList=[];
      for(const [Name,Data] of Object.entries(Package.files)) {
        safeRelative(Name);
        const Bytes=Buffer.from(Data,'base64');
        const Target=path.join(Directory,'package',Name);
        await fs.mkdir(path.dirname(Target),{recursive:true});await fs.writeFile(Target,Bytes,{flag:'wx'});
        FileList.push({path:Name,sha256:hash(Bytes),bytes:Bytes.length});
      }
      await fs.writeFile(path.join(Directory,'unity.zip'),Buffer.from(Package.zip,'base64'),{flag:'wx'});
      await writeJson(path.join(Directory,'package.json'),{format:'mm-effect-unity-package',version:1,scope:Package.scope,effect:FileList.find(Value=>Value.path.includes('/Effects/')&&Value.path.endsWith('.fxforge.json'))?.path,files:FileList});
      return {ok:true,output:Directory,files:FileList.length,unityValidation:'not_run'};
    });
    console.log(JSON.stringify(Result,null,2));
  }
} catch(Error) {
  const Failure={ok:false,command:Command,error:Error.stack??String(Error),output:Directory};
  if(Directory)await writeJson(path.join(Directory,'failure.json'),Failure);
  console.error(JSON.stringify(Failure,null,2));process.exitCode=1;
}
