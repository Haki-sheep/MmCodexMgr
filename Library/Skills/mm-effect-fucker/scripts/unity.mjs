import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {parseArgs} from 'node:util';
import {Root,readJson,writeJson,hash,safeRelative,newDirectory} from './io.mjs';

const {values:Options,positionals:CommandList}=parseArgs({allowPositionals:true,options:{export:{type:'string'},project:{type:'string'},out:{type:'string'},plan:{type:'string'},fuc:{type:'string'},times:{type:'string'},'view-file':{type:'string'},yes:{type:'boolean'}}});
function required(Name){if(!Options[Name])throw new Error(`--${Name} is required`);return Options[Name];}

async function packageFiles(Directory) {
  const Manifest=await readJson(path.join(Directory,'package.json'));
  if(Manifest.format!=='mm-effect-unity-package'||Manifest.version!==1)throw new Error('Expected exported package.json');
  for(const File of Manifest.files) {
    safeRelative(File.path);
    if(!File.path.startsWith('FXForge/')||!['.cs','.shader','.png','.json','.txt'].includes(path.extname(File.path)))throw new Error(`Unsupported package file ${File.path}`);
    if(hash(await fs.readFile(path.join(Directory,'package',File.path)))!==File.sha256)throw new Error(`Package changed ${File.path}`);
  }
  if(!Manifest.files.some(File=>File.path===Manifest.effect))throw new Error('Effect file missing from package');
  return Manifest;
}

async function fuc(Exe,Project,ArgumentList,Input,Receipt) {
  const Result=await new Promise((Resolve,Reject)=>{
    const Child=spawn(Exe,[...ArgumentList,'--project',Project,'--json'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    let Stdout='',Stderr='';
    Child.stdout.on('data',Data=>Stdout+=Data);Child.stderr.on('data',Data=>Stderr+=Data);
    Child.on('error',Reject);Child.stdin.end(Input??'');
    Child.on('exit',Code=>Resolve({code:Code,stdout:Stdout,stderr:Stderr}));
  });
  let Reply;
  try{Reply=JSON.parse(Result.stdout);}catch{throw new Error(`FakeUnityCLI returned non-JSON exit=${Result.code}\n${Result.stderr}\n${Result.stdout}`);}
  await writeJson(Receipt,{argv:ArgumentList,exitCode:Result.code,stderr:Result.stderr,response:Reply});
  if(Result.code!==0||!Reply.ok)throw new Error(`FakeUnityCLI stopped ${Reply.error?.code??Result.code} ${Reply.error?.message??''}\nReceipt: ${Receipt}\nFor processing_timeout or outcome_unknown query the same request ID Do not rerun this plan`);
  return Reply.data;
}

async function code(Name,Job) {
  const Template=await fs.readFile(path.join(Root,'assets/unity',Name+'.cs.txt'),'utf8');
  if(!Template.includes('__MM_EFFECT_JOB__'))throw new Error('Unity template marker missing');
  return Template.replace('__MM_EFFECT_JOB__',JSON.stringify(Job).replaceAll('"','""'));
}
async function templateHashes() {
  return Object.fromEntries(await Promise.all(['StagePackage','CaptureEffect'].map(async Name=>[Name,hash(await fs.readFile(path.join(Root,'assets/unity',Name+'.cs.txt')))])));
}

try {
  if(CommandList.length!==1)throw new Error('Use unity.mjs plan or run');
  if(CommandList[0]==='plan') {
    const Export=path.resolve(required('export'));
    const Project=path.resolve(required('project'));
    const Package=await packageFiles(Export);
    const Effect=await readJson(path.join(Export,'package',Package.effect));
    const View=Options['view-file']?await readJson(Options['view-file']):{position:[5,3.4,7.2],target:[0,1,0],fov:40};
    for(const Key of ['position','target'])if(!Array.isArray(View[Key])||View[Key].length!==3||!View[Key].every(Number.isFinite))throw new Error(`Invalid camera ${Key}`);
    const TimeList=Options.times?Options.times.split(',').map(Number):[0.15,0.35,0.55,0.75].map(Value=>Value*Effect.duration);
    if(TimeList.length>16||TimeList.some(Value=>!Number.isFinite(Value)||Value<0||Value>Effect.duration))throw new Error('Invalid sample times');
    const Plan={format:'mm-effect-unity-plan',version:1,id:crypto.randomUUID(),project:Project,export:Export,effect:Package.effect,fileList:Package.files,templateHashDict:await templateHashes(),view:View,timeList:TimeList,background:Effect.background??'#171820',width:960,height:540,scope:'Append new FXForge assets or preserve identical files then import compile and capture in an isolated preview scene'};
    await writeJson(required('out'),Plan);
    console.log(JSON.stringify({ok:true,plan:path.resolve(Options.out),target:Project,files:Plan.fileList.length,writesPerformed:false,unityValidation:'not_run'},null,2));
  } else if(CommandList[0]==='run') {
    if(!Options.yes)throw new Error('run requires --yes after the task authorizes target Unity asset import and sampling');
    const Plan=await readJson(required('plan'));
    if(Plan.format!=='mm-effect-unity-plan'||Plan.version!==1)throw new Error('Invalid Unity plan');
    if(JSON.stringify(Plan.templateHashDict)!==JSON.stringify(await templateHashes()))throw new Error('Unity adapter changed after plan Recreate the plan before execution');
    const Package=await packageFiles(Plan.export);
    if(JSON.stringify(Package.files)!==JSON.stringify(Plan.fileList))throw new Error('Package changed after plan');
    const Exe=path.resolve(required('fuc'));
    const Directory=await newDirectory(required('out'));
    const invoke=(ArgumentList,Input,Name)=>fuc(Exe,Plan.project,ArgumentList,Input,path.join(Directory,Name+'.json'));
    const Status=await invoke(['editor','status'],undefined,'01-status');
    if(!Status.online)throw new Error('Target Editor is not online Install or update Bridge through mm-fake-unity-fucker and open the target project first');
    const Preparation=await invoke(['editor','operation-prepare','edit-required'],undefined,'02-prepare');
    if(Preparation.allowed!==true)throw new Error('FakeUnityCLI did not explicitly allow this generation and import operation');
    const StageCode=await code('StagePackage',{project:Plan.project,package:path.join(Plan.export,'package'),pathList:Plan.fileList.map(File=>File.path),hashList:Plan.fileList.map(File=>File.sha256)});
    const Stage=await invoke(['editor','exec','--code-file','-','--timeout','180','--request-id','effect-stage-'+Plan.id],StageCode,'03-stage');
    const Changed=Stage.result?.createdList;
    if(!Array.isArray(Changed))throw new Error('Stage receipt lacks structured createdList');
    const ChangedScripts=Changed.filter(File=>File.endsWith('.cs'));
    const ChangedAssets=Changed.filter(File=>!File.endsWith('.cs'));
    let Compile;
    if(ChangedScripts.length) {
      Compile=await invoke(['editor','import',...ChangedScripts,'--await-compile','--timeout','180','--request-id','effect-import-'+Plan.id],undefined,'04-compile');
    } else {
      if(Changed.length)await invoke(['editor','import',...Changed,'--timeout','180','--request-id','effect-import-'+Plan.id],undefined,'03-import');
      Compile=await invoke(['editor','compile-await','--request','--timeout','180'],undefined,'04-compile');
    }
    const Watermark=Compile.compile?.compile_watermark;
    if(Compile.state!=='completed'||Compile.observed_generation<=Compile.baseline_generation||!Watermark?.complete||Watermark.history_gap||Watermark.error_count!==0||!Compile.compile?.coverage?.complete)throw new Error('Compile receipt does not establish a complete new error-free generation');
    const ReadyDeadline=Date.now()+60000;
    let Ready;
    for(let Attempt=0;;Attempt++) {
      Ready=await invoke(['editor','status'],undefined,'04-ready-'+String(Attempt).padStart(3,'0'));
      if(Ready.editor_instance_id!==Status.editor_instance_id)throw new Error('Editor instance changed after compilation');
      if(Ready.online&&Ready.state==='ready'&&!Ready.activity?.is_compiling&&!Ready.activity?.is_updating)break;
      if(!['ready','compiling','reloading','updating'].includes(Ready.state)||Date.now()>=ReadyDeadline)throw new Error(`Editor did not return to ready after compilation state=${Ready.state}`);
      await new Promise(Resolve=>setTimeout(Resolve,500));
    }
    if(ChangedScripts.length&&ChangedAssets.length)await invoke(['editor','import',...ChangedAssets,'--timeout','180','--request-id','effect-assets-'+Plan.id],undefined,'04-assets');
    const Job={effect:'Assets/'+Plan.effect,output:path.join(Directory,'images'),timeList:Plan.timeList,positionList:Plan.view.position,targetList:Plan.view.target,fov:Plan.view.fov??40,width:Plan.width,height:Plan.height,background:Plan.background,saveImportedMaterials:Changed.includes('Assets/'+Plan.effect)};
    const Capture=await invoke(['editor','exec','--code-file','-','--timeout','180','--request-id','effect-capture-'+Plan.id],await code('CaptureEffect',Job),'05-capture');
    const Result=Capture.result;
    if(!Result||!Array.isArray(Result.imageList)||Result.imageList.length!==Plan.timeList.length||!Result.activeSceneUnchanged)throw new Error('Capture receipt incomplete or scene changed');
    for(const Image of Result.imageList)await fs.access(Image);
    await writeJson(path.join(Directory,'result.json'),{ok:true,planId:Plan.id,compileReceipt:'04-compile.json',capture:Result});
    console.log(JSON.stringify({ok:true,output:Directory,capture:Result},null,2));
  } else throw new Error('Use unity.mjs plan or run');
} catch(Error) {console.error(JSON.stringify({ok:false,error:Error.stack??String(Error)},null,2));process.exitCode=1;}
