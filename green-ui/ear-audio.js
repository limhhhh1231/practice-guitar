(function(root){
  'use strict';
  // Independent playback state; shared recordings and drum/timing rules.
  class EarPlayer {
    constructor(status=()=>{}){this.status=status;this.context=null;this.buffers=new Map();this.sources=new Set();this.token=0;this.playing=false;this.preparing=false;this.timer=null;this.cycle=0;}
    stop(message='已停止'){
      this.token++;this.playing=false;this.preparing=false;clearInterval(this.timer);this.timer=null;
      for(const source of this.sources){try{source.stop();}catch{}}
      this.sources.clear();this.status(message,false);
    }
    async prepare(settings){
      const C=root.AudioContext||root.webkitAudioContext;
      if(!C)throw Error('浏览器不支持音频播放。');
      if(!this.context||this.context.state==='closed'){
        this.context=new C();this.master=this.context.createGain();this.master.gain.value=.72;this.master.connect(this.context.destination);
        this.buses={};for(const name of ['guitar','drum','click']){const bus=this.context.createGain();bus.connect(this.master);this.buses[name]=bus;}
      }
      this.settings={...settings};this.mix(settings);
      let timeout;
      try{await Promise.race([this.context.resume(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('音频启动超时，请点击播放重试。')),5000);})]);}finally{clearTimeout(timeout);}
      if(this.context.state!=='running')throw Error('浏览器未允许音频启动，请再次点击播放并确认设备未静音。');
    }
    async load(items){
      const jobs=items.map(([name,data])=>{
        if(this.buffers.has(name))return this.buffers.get(name);
        const bytes=Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));
        const pending=new Promise((resolve,reject)=>{
          let settled=false;
          const done=value=>{if(!settled){settled=true;resolve(value);}};
          const fail=error=>{if(!settled){settled=true;reject(error);}};
          try{
            const result=this.context.decodeAudioData(bytes.buffer.slice(0),done,fail);
            if(result&&typeof result.then==='function')result.then(done,fail);
          }catch(error){fail(error);}
        }).then(buffer=>{
          let peak=0;for(let ch=0;ch<buffer.numberOfChannels;ch++)for(const value of buffer.getChannelData(ch))peak=Math.max(peak,Math.abs(value));
          if(peak<.0001)throw Error('音色采样为空。');
          for(let ch=0;ch<buffer.numberOfChannels;ch++){const channel=buffer.getChannelData(ch);for(let i=0;i<channel.length;i++)channel[i]*=.85/peak;}
          this.buffers.set(name,buffer);return buffer;
        }).catch(error=>{this.buffers.delete(name);throw error;});
        this.buffers.set(name,pending);return pending;
      });
      await Promise.all(jobs);
    }
    nearestRoot(midi){return Object.keys(root.GuitarSampleBank.guitars.steel).map(Number).sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0];}
    assets(plan){
      const bank=root.GuitarSampleBank,items=new Map();
      for(const item of plan.items)if(item.kind==='guitar'){const midi=this.nearestRoot(item.midi);items.set('g'+midi,bank.guitars.steel[midi]);}
      else if(item.kind==='drum')items.set('d'+item.track,bank.drums[item.track].data);
      return [...items];
    }
    mix(settings){
      Object.assign(this.settings||={},settings);
      if(!this.buses)return;
      for(const track of ['guitar','drum','click'])this.buses[track].gain.setTargetAtTime(settings[track+'Volume']/100,this.context.currentTime,.015);
    }
    register(source,gain){this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};}
    sample(buffer,time,velocity,rate,duration,track){
      if(!buffer||typeof buffer.then==='function')throw Error('音色尚未就绪。');
      const ctx=this.context,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=rate;
      const length=Math.max(.025,Math.min(buffer.duration/rate,duration??buffer.duration/rate)),end=time+length;
      gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(velocity,time+.003);
      gain.gain.setValueAtTime(velocity,Math.max(time+.004,end-.02));gain.gain.linearRampToValueAtTime(0,end);
      source.connect(gain).connect(this.buses[track]);this.register(source,gain);source.start(time);source.stop(end+.002);
    }
    emit(item,time){
      if(item.kind==='guitar'){
        const midi=this.nearestRoot(item.midi);
        this.sample(this.buffers.get('g'+midi),time,item.velocity,2**((item.midi-midi)/12),item.duration,'guitar');
      }else if(item.kind==='drum'){
        const kit=this.settings.kit,info=root.GuitarSampleBank.drums[item.track];
        this.sample(this.buffers.get('d'+item.track),time,item.velocity*(item.track==='hat'?.45:.85)*(kit==='power'?1.1:1),info.ratio*(kit==='tight'?1.08:kit==='power'?.92:1),kit==='tight'?(item.track==='kick'?.18:.12):undefined,'drum');
      }else{
        const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),sound=this.settings.click;
        osc.type=sound==='wood'?'triangle':sound==='electronic'?'square':'sine';osc.frequency.value=sound==='cowbell'?(item.strong?780:620):(item.strong?1320:960);
        gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(item.strong?.72:.58,time+.002);gain.gain.exponentialRampToValueAtTime(.0001,time+.09);
        osc.connect(gain).connect(this.buses.click);this.register(osc,gain);osc.start(time);osc.stop(time+.1);
      }
    }
    async play(question,settings){
      this.stop();this.plan=null;this.firstStart=undefined;const token=++this.token;this.preparing=true;this.status('正在准备音色…','preparing');
      try{
        const E=root.GrooveEngine,plan=root.EarEngine.timeline(question,settings),c=plan.config,bar=E.ticks(c);
        if(!plan.items.some(item=>item.kind==='guitar'))throw Error('当前练习没有可播放的吉他音符。');
        const intro=[],cueTicks=settings.cue?bar:0;
        if(settings.cue){const h=E.harmony({...c,voicing:'triad'},0);h.intervals.forEach((interval,i)=>intro.push({kind:'guitar',time:i*.02,duration:E.time(c,bar)*.8,midi:48+question.key+interval,velocity:.45}));}
        if(settings.clickMode!=='off')for(let t=0;t<bar*settings.countIn;t+=c.meter==='6/8'?36:24)intro.push({kind:'click',time:E.time(c,cueTicks+t),strong:t%bar===0});
        await this.prepare(settings);if(token!==this.token)return;
        this.status('正在载入本题音色…','preparing');
        await this.load(this.assets({items:plan.items.concat(intro)}));if(token!==this.token)return;
        this.intro=intro.sort((a,b)=>a.time-b.time);this.introIndex=0;this.origin=this.context.currentTime+.08;
        this.start=this.origin+E.time(c,cueTicks+bar*settings.countIn);this.firstStart=this.start;
        this.plan=plan;this.cycle=0;this.itemIndex=0;this.maxCycles=settings.repeats===0?Infinity:settings.repeats;this.preparing=false;this.playing=true;
        this.lastStatus='';this.status('音频已启动 · 正在进入预备拍',true);this.tick();this.timer=setInterval(()=>this.tick(),25);
      }catch(error){if(token===this.token)this.stop('播放失败：'+error.message);}
    }
    tick(){
      if(!this.playing)return;
      if(this.context.state!=='running'){this.stop('音频已中断，请重新播放。');return;}
      try{
        const now=this.context.currentTime,horizon=now+.12;
        while(this.introIndex<this.intro.length&&this.origin+this.intro[this.introIndex].time<horizon){const item=this.intro[this.introIndex++];this.emit(item,Math.max(now+.004,this.origin+item.time));}
        while(this.itemIndex<this.plan.items.length&&this.start+this.plan.items[this.itemIndex].time<horizon){const item=this.plan.items[this.itemIndex++];this.emit(item,Math.max(now+.004,this.start+item.time));}
        const end=this.start+this.plan.duration;
        if(now>=end&&this.cycle+1>=this.maxCycles){this.stop('已完成 '+this.maxCycles+' 遍 · 可重听或揭晓答案');return;}
        const next=end+this.plan.gap;
        const heardCycle=Math.floor(Math.max(0,now-this.firstStart)/(this.plan.duration+this.plan.gap))+1;
        if(this.cycle+1<this.maxCycles&&this.itemIndex===this.plan.items.length&&horizon>=next){this.cycle++;this.itemIndex=0;this.start=Math.max(next,now+.01);}
        const within=(now-this.firstStart)%(this.plan.duration+this.plan.gap);
        const message=now<this.firstStart?'预备 / 调性提示':within<this.plan.duration?'第 '+heardCycle+' / '+(this.maxCycles===Infinity?'∞':this.maxCycles)+' 遍 · 聆听旋律':'留白练习 · 下一遍即将开始';
        if(message!==this.lastStatus){this.lastStatus=message;this.status(message,true);}
      }catch(error){this.stop('播放失败：'+error.message);}
    }
    async preview(midi,settings){
      this.stop();const token=++this.token;this.preparing=true;this.status('正在准备试听…','preparing');
      try{await this.prepare(settings);if(token!==this.token)return;const rootMidi=this.nearestRoot(midi);await this.load([['g'+rootMidi,root.GuitarSampleBank.guitars.steel[rootMidi]]]);if(token!==this.token)return;this.preparing=false;this.emit({kind:'guitar',midi,duration:1,velocity:.8},this.context.currentTime+.03);this.status('已试听音符',false);}
      catch(error){if(token===this.token)this.stop('试听失败：'+error.message);}
    }
  }
  root.EarPlayer=EarPlayer;if(typeof module!=='undefined')module.exports=EarPlayer;
})(globalThis);
