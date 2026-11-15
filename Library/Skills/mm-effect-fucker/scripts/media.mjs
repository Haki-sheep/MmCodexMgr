import fs from 'node:fs/promises';
import path from 'node:path';
import {executable,number,readJson,run,writePng,writeJson,hash} from './io.mjs';

export async function configure(Api,Options,Compare=false) {
  const Width=number(Options.width,Compare?640:960,64,3840,'width');
  const Height=number(Options.height,Compare?360:540,64,2160,'height');
  if(!Number.isInteger(Width)||!Number.isInteger(Height))throw new Error('Width and height must be integers');
  const View=Options['view-file']?await readJson(Options['view-file']):{position:[5,3.4,7.2],target:[0,1,0],fov:40};
  for(const Key of ['position','target'])if(!Array.isArray(View[Key])||View[Key].length!==3||!View[Key].every(Number.isFinite))throw new Error(`Invalid view ${Key}`);
  if(View.position.every((Value,I)=>Value===View.target[I]))throw new Error('Camera position must differ from target');
  View.fov=number(View.fov,40,5,120,'fov');
  await Api.call('configure',{width:Width,height:Height,view:View});
  return {width:Width,height:Height,view:View};
}

export async function capture(Api,Options,Directory,Before,After) {
  const Compare=After!==undefined;
  const Format=await configure(Api,Options,Compare);
  const Fps=number(Options.fps,25,1,60,'fps');
  const Speed=number(Options.speed,1,0.1,4,'speed');
  const Duration=Compare?Math.max(Before.bundle.effect.duration,After.bundle.effect.duration):Before.bundle.effect.duration;
  const Start=number(Options.start,0,0,Duration,'start');
  const End=number(Options.end,Duration,0,Duration,'end');
  if(End<=Start)throw new Error('end must exceed start');
  const Count=Math.ceil((End-Start)*Fps-1e-9);
  const Frames=await fs.mkdtemp(path.join(Api.temp,'frames-'));
  const Encoder=await executable(Options.ffmpeg,'ffmpeg');
  for(let I=0;I<Count;I++) {
    const Time=Start+I/Fps;
    const Png=Compare?await Api.call('compare',Before.index,After.index,Time):await Api.call('frame',Before.index,Time);
    await writePng(path.join(Frames,String(I).padStart(5,'0')+'.png'),Png);
    if(I%25===0)process.stderr.write(`render ${I}/${Count}\n`);
  }
  const Filter='[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle';
  const InputList=['-hide_banner','-loglevel','error','-n','-framerate',String(Fps*Speed),'-i',path.join(Frames,'%05d.png')];
  const Gif=Compare?'comparison.gif':'preview.gif';
  await run(Encoder,[...InputList,'-filter_complex',Filter,'-loop','0',path.join(Directory,Gif)]);
  if(Options.mp4)await run(Encoder,[...InputList,'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(Directory,Compare?'comparison.mp4':'preview.mp4')]);
  const TimeList=Options.times?Options.times.split(',').map(Value=>number(Value,0,Start,End,'sample time')):Array.from({length:8},(_,I)=>Start+(End-Start)*I/8);
  if(TimeList.length>16)throw new Error('Contact sheet accepts at most 16 times');
  await writePng(path.join(Directory,Compare?'before-contact.png':'contact.png'),await Api.call('contact',Before.index,TimeList));
  if(Compare)await writePng(path.join(Directory,'after-contact.png'),await Api.call('contact',After.index,TimeList));
  const First=await Api.call('frame',Before.index,0),Last=await Api.call('frame',Before.index,Before.bundle.effect.duration);
  const Report={format:'mm-effect-capture',version:1,kind:Compare?'comparison':'preview',...Format,sourceFps:Fps,speed:Speed,start:Start,end:End,frameCount:Count,playbackSeconds:Count/(Fps*Speed),gifDelayQuantizationMs:10,cameraCoordinates:'Three.js right-handed Y up; Unity camera Z must be negated',analysis:Before.analysis,afterAnalysis:After?.analysis,firstEqualsDuration:First===Last,renderer:'Bundled FX Forge / Three.js',unityValidation:'not_run',externalRendererRequests:0,gif:{file:Gif,sha256:hash(await fs.readFile(path.join(Directory,Gif)))}};
  await writeJson(path.join(Directory,'capture.json'),Report);
  return Report;
}
