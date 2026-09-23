const pitch=midi=>440*Math.pow(2,(midi-69)/12);

export function createMusic(){
  let context=null,master=null,timer=null,tick=0,volume=.45,playing=false;
  const chords=[[48,55,60],[45,52,57],[41,48,53],[43,50,55]];
  const melody=[72,76,79,76,69,72,74,67,72,79,81,79,76,74,72,69];
  function setup(){
    context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=0;master.connect(context.destination);
    const delay=context.createDelay(1),feedback=context.createGain(),wet=context.createGain();delay.delayTime.value=.31;feedback.gain.value=.16;wet.gain.value=.18;
    master.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(context.destination);
  }
  function note(midi,at,length,loudness,shape='sine',attack=.02){
    const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=shape;oscillator.frequency.setValueAtTime(pitch(midi),at);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(loudness,at+attack);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
    oscillator.connect(gain).connect(master);oscillator.start(at);oscillator.stop(at+length+.05);
  }
  function step(){
    if(!playing||context.state!=='running')return;const at=context.currentTime+.03;
    if(tick%16===0){const chord=chords[Math.floor(tick/16)%chords.length];chord.forEach((midi,i)=>note(midi,at,8.1,i===0?.045:.034,'triangle',1.4))}
    if(tick%2===0){const index=Math.floor(tick/2)%melody.length;note(melody[index],at,1.35,index%4===0?.10:.075,'sine',.018)}
    if(tick%8===0)note(chords[Math.floor(tick/16)%chords.length][0]-12,at,2.8,.065,'sine',.08);
    tick++;
  }
  async function start(){
    if(!window.AudioContext&&!window.webkitAudioContext)throw Error('当前浏览器不支持音频');
    if(!context)setup();await context.resume();playing=true;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(volume*.5,context.currentTime,.15);step();timer=setInterval(step,500);
  }
  async function stop(){playing=false;clearInterval(timer);timer=null;if(context){master.gain.setTargetAtTime(0,context.currentTime,.07);setTimeout(()=>{if(!playing)context.suspend()},300)}}
  function setVolume(value){volume=Math.max(0,Math.min(1,value));if(context&&playing)master.gain.setTargetAtTime(volume*.5,context.currentTime,.08)}
  return {start,stop,setVolume,get playing(){return playing}};
}
