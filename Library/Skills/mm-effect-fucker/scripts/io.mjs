import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const Root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const hash=Bytes=>crypto.createHash('sha256').update(Bytes).digest('hex');
export const readJson=async File=>JSON.parse((await fs.readFile(File,'utf8')).replace(/^\uFEFF/,''));
export const writeJson=async (File,Value)=>fs.writeFile(File,JSON.stringify(Value,null,2)+'\n',{flag:'wx'});
export const writePng=async (File,Data)=>{
  if(!Data.startsWith('data:image/png;base64,'))throw new Error('Expected PNG data URL');
  await fs.writeFile(File,Buffer.from(Data.split(',')[1],'base64'),{flag:'wx'});
};
export async function exists(File) {
  try {await fs.access(File);return true;} catch(Error) {if(Error.code==='ENOENT')return false;throw Error;}
}
export async function newDirectory(Directory) {
  const Resolved=path.resolve(Directory);
  await fs.mkdir(path.dirname(Resolved),{recursive:true});
  await fs.mkdir(Resolved);
  return Resolved;
}
export async function verifyRuntime() {
  const Manifest=await readJson(path.join(Root,'runtime/manifest.json'));
  const Bytes=await fs.readFile(path.join(Root,'runtime',Manifest.browser.file));
  if(hash(Bytes)!==Manifest.browser.sha256)throw new Error('Bundled renderer hash differs from runtime/manifest.json');
  return Manifest;
}
export async function removeOwnTemp(Directory,Prefix) {
  const Actual=await fs.realpath(Directory),Base=await fs.realpath(os.tmpdir());
  const Normalize=Value=>process.platform==='win32'?Value.toLowerCase():Value;
  if(Normalize(path.dirname(Actual))!==Normalize(Base)||!path.basename(Actual).startsWith(Prefix)||(await fs.lstat(Directory)).isSymbolicLink())throw new Error(`Unexpected temporary cleanup target ${Directory}`);
  await fs.rm(Actual,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
export async function executable(Explicit,Kind) {
  if(Explicit) {
    const Resolved=path.resolve(Explicit);
    if(!await exists(Resolved))throw new Error(`${Kind} executable missing ${Resolved}`);
    return Resolved;
  }
  const Windows=process.platform==='win32';
  const CandidateList=Kind==='browser'?[
    ...(Windows?[path.join(process.env.ProgramFiles??'C:/Program Files','Google/Chrome/Application/chrome.exe'),path.join(process.env['ProgramFiles(x86)']??'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'),path.join(process.env.LOCALAPPDATA??'','Google/Chrome/Application/chrome.exe')]:['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']),
    ...(process.env.PATH??'').split(path.delimiter).flatMap(Directory=>(Windows?['chrome.exe','msedge.exe']:['chromium','chromium-browser','google-chrome']).map(Name=>path.join(Directory,Name)))
  ]:(process.env.PATH??'').split(path.delimiter).map(Directory=>path.join(Directory,Kind+(Windows?'.exe':'')));
  for(const Candidate of CandidateList)if(await exists(Candidate))return Candidate;
  throw new Error(`${Kind} not found; supply --${Kind} with its absolute path`);
}
export function run(Exe,ArgumentList,{timeout=180000,cwd}={}) {
  return new Promise((Resolve,Reject)=>{
    const Child=spawn(Exe,ArgumentList,{windowsHide:true,stdio:['ignore','pipe','pipe'],cwd});
    let Stdout='',Stderr='',TimedOut=false;
    Child.stdout.on('data',Data=>Stdout+=Data);
    Child.stderr.on('data',Data=>Stderr+=Data);
    const Timer=setTimeout(()=>{TimedOut=true;Child.kill();},timeout);
    Child.once('error',Error=>{clearTimeout(Timer);Reject(Error);});
    Child.once('exit',Code=>{clearTimeout(Timer);if(Code!==0||TimedOut)Reject(new Error(`${path.basename(Exe)} ${TimedOut?'timed out':`exited ${Code}`}\n${Stderr.slice(-12000)}\n${Stdout.slice(-12000)}`));else Resolve({stdout:Stdout,stderr:Stderr});});
  });
}
export function number(Value,Default,Min,Max,Name) {
  const Result=Value===undefined?Default:Number(Value);
  if(!Number.isFinite(Result)||Result<Min||Result>Max)throw new Error(`${Name} must be ${Min}..${Max}`);
  return Result;
}
export function safeRelative(Value) {
  if(!Value||path.isAbsolute(Value)||Value.includes('\\')||Value.includes(':')||Value.split('/').some(Part=>!Part||Part==='..'||Part==='.'||/[\x00-\x1f]/.test(Part)))throw new Error(`Invalid relative path ${Value}`);
  return Value;
}
