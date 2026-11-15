import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {Root,executable,verifyRuntime,removeOwnTemp} from './io.mjs';

const delay=Milliseconds=>new Promise(Resolve=>setTimeout(Resolve,Milliseconds));

export async function withBrowser(Options,Action) {
  if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node 22 or newer is required');
  await verifyRuntime();
  const Exe=await executable(Options.browser,'browser');
  const Temp=await fs.mkdtemp(path.join(os.tmpdir(),'mm-effect-render-'));
  const Token=crypto.randomBytes(20).toString('hex');
  const Engine=await fs.readFile(path.join(Root,'runtime/browser/engine.js'));
  const PendingDict=new Map();
  const ErrorList=[];
  const RequestList=[];
  let Browser,Socket,Counter=0,Closing=false,Failure;
  const Server=http.createServer((Request,Response)=>{
    if(Request.method!=='GET'){Response.writeHead(405);Response.end();return;}
    Response.setHeader('Cache-Control','no-store');
    Response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; img-src data: blob:; style-src 'unsafe-inline'; connect-src 'none'");
    if(Request.url===`/${Token}/index.html`){Response.setHeader('Content-Type','text/html; charset=utf-8');Response.end('<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><script type="module" src="./engine.js"></script>');}
    else if(Request.url===`/${Token}/engine.js`){Response.setHeader('Content-Type','application/javascript');Response.end(Engine);}
    else {Response.writeHead(404);Response.end();}
  });
  try {
    await new Promise((Resolve,Reject)=>{Server.once('error',Reject);Server.listen(0,'127.0.0.1',Resolve);});
    const Origin=`http://127.0.0.1:${Server.address().port}`;
    let ChromeErrors='';
    const Profile=path.join(Temp,'profile');
    Browser=spawn(Exe,['--headless=new','--remote-debugging-port=0','--user-data-dir='+Profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-extensions','--disable-sync','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    Browser.stderr.on('data',Data=>{ChromeErrors=(ChromeErrors+Data).slice(-6000);});
    Browser.on('error',Error=>ErrorList.push(Error.message));
    let Port;
    for(let I=0;I<120;I++) {
      if(ErrorList.length)throw new Error(ErrorList.join('\n'));
      if(Browser.exitCode!==null)throw new Error(`Browser exited ${Browser.exitCode}\n${ChromeErrors}`);
      try {Port=(await fs.readFile(path.join(Profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}
      catch(Error){if(Error.code!=='ENOENT')throw Error;}
      await delay(250);
    }
    if(!Port)throw new Error(`Browser startup timed out\n${ChromeErrors}`);
    const TabList=await (await fetch(`http://127.0.0.1:${Port}/json/list`)).json();
    const Tab=TabList.find(Value=>Value.type==='page');
    if(!Tab)throw new Error('No page in isolated browser');
    Socket=new WebSocket(Tab.webSocketDebuggerUrl);
    await new Promise((Resolve,Reject)=>{Socket.addEventListener('open',Resolve,{once:true});Socket.addEventListener('error',Reject,{once:true});});
    Socket.addEventListener('message',Event=>{
      const Message=JSON.parse(Event.data);
      if(Message.id){const Pending=PendingDict.get(Message.id);if(!Pending)return;clearTimeout(Pending.timer);PendingDict.delete(Message.id);Message.error?Pending.reject(new Error(JSON.stringify(Message.error))):Pending.resolve(Message.result);}
      else if(Message.method==='Runtime.exceptionThrown')ErrorList.push(JSON.stringify(Message.params.exceptionDetails));
      else if(Message.method==='Runtime.consoleAPICalled'&&Message.params.type==='error')ErrorList.push(JSON.stringify(Message.params.args));
      else if(Message.method==='Network.requestWillBeSent'){
        const Url=Message.params.request.url;RequestList.push(Url);
        if(!Url.startsWith(Origin+'/')&&!Url.startsWith('data:'))ErrorList.push(`Unexpected renderer request ${Url}`);
      }
    });
    Socket.addEventListener('close',()=>{for(const Pending of PendingDict.values()){clearTimeout(Pending.timer);Pending.reject(new Error('Renderer connection closed'));}PendingDict.clear();if(!Closing)ErrorList.push('Renderer closed unexpectedly');});
    const send=(Method,Params={})=>new Promise((Resolve,Reject)=>{
      const Id=++Counter;
      const Timer=setTimeout(()=>{PendingDict.delete(Id);Reject(new Error(`Renderer timeout ${Method}`));},60000);
      PendingDict.set(Id,{resolve:Resolve,reject:Reject,timer:Timer});
      Socket.send(JSON.stringify({id:Id,method:Method,params:Params}));
    });
    const evaluate=async Expression=>{
      if(ErrorList.length)throw new Error(ErrorList.join('\n'));
      const Result=await send('Runtime.evaluate',{expression:Expression,awaitPromise:true,returnByValue:true});
      if(Result.exceptionDetails)throw new Error(JSON.stringify(Result.exceptionDetails));
      if(ErrorList.length)throw new Error(ErrorList.join('\n'));
      return Result.result.value;
    };
    await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
    await send('Page.navigate',{url:`${Origin}/${Token}/index.html`});
    let Ready=false;
    for(let I=0;I<120;I++){if(await evaluate('window.effectReady===true')){Ready=true;break;}await delay(250);}
    if(!Ready)throw new Error('Renderer bundle did not initialize');
    return await Action({call:(Method,...ArgumentList)=>evaluate(`window.effectApi[${JSON.stringify(Method)}](...${JSON.stringify(ArgumentList)})`),temp:Temp,requests:RequestList,browser:Exe});
  } catch(Error) {Failure=Error;throw Error;}
  finally {
    Closing=true;Socket?.close();
    if(Browser&&Browser.exitCode===null){Browser.kill();for(let I=0;I<25&&Browser.exitCode===null;I++)await delay(100);}
    await new Promise(Resolve=>Server.close(Resolve));
    try {await removeOwnTemp(Temp,'mm-effect-render-');}
    catch(Error){throw new AggregateError(Failure?[Failure,Error]:[Error],`Temporary cleanup failed ${Temp}`);}
  }
}
