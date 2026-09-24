(function(root){
  'use strict';
  const E=root.GrooveEngine;
  const groups={shuffle:[16,8],sync:[6,12,6],'332':[18,18,12]};
  const defaults={key:'random',scale:'major',scalePool:['major','minor'],count:4,materials:['quarter','eighth'],tempo:80,meter:'4/4',style:'rock',difficulty:'easy',repeats:3,gap:1,countIn:1,visibility:'show',cue:false,kit:'acoustic',drums:true,click:'classic',clickMode:'count',guitarVolume:90,drumVolume:55,clickVolume:50};
  const choose=(list,r)=>list[Math.floor(r()*list.length)];
  function generate(input={},seed=Date.now()){
    const c={...defaults,...input},r=E.rng(seed);
    if(!Number.isInteger(c.count)||c.count<1||c.count>8)throw Error('音符数量请选择 1–8。');
    if(!Number.isFinite(c.tempo)||c.tempo<40||c.tempo>220)throw Error('速度范围为 40–220 BPM。');
    if(!['4/4','3/4','6/8','5/4'].includes(c.meter))throw Error('不支持的拍号。');
    if(c.key!=='random'&&(!Number.isInteger(+c.key)||+c.key<0||+c.key>11))throw Error('请选择有效主音。');
    const pool=(c.scalePool||[]).filter(s=>E.scales[s]);
    if(c.scale==='random'&&!pool.length)throw Error('随机调式范围至少选择一种。');
    const scale=c.scale==='random'?choose(pool,r):c.scale;
    if(!E.scales[scale])throw Error('请选择有效调式。');
    const key=c.key==='random'?Math.floor(r()*12):+c.key;
    const allowed=new Set(c.materials),units=[];
    for(const [name,duration]of Object.entries(E.materials))if(allowed.has(name))units.push({name,durations:[duration]});
    for(const [name,durations]of Object.entries(groups))if(allowed.has(name))units.push({name,durations});
    if(!units.length)throw Error('至少选一种音符时值或节奏分组；休止、延音不能单独生成。');
    const can=Array(c.count+1).fill(false);can[0]=true;
    for(let n=1;n<=c.count;n++)can[n]=units.some(u=>u.durations.length<=n&&can[n-u.durations.length]);
    if(!can[c.count])throw Error('当前分组无法组成 '+c.count+' 个音；请增加单音时值或调整音符数量。');
    const config={...E.defaults,key,scale,tempo:c.tempo,meter:c.meter,style:c.style,difficulty:c.difficulty,density:'medium',feel:'style',min:0,max:12,voicing:'seventh',link:'loose',kit:c.kit};
    let cursor=0,left=c.count,previous=null,lastIndex=-1;
    const events=[],tonic=48+key,notes=E.scales[scale].map(x=>tonic+x).concat(tonic+12);
    const h=E.harmony(config,0);
    function add(duration,material,rest=false,tie=false){
      let position=null;
      if(!rest){
        let candidates=notes.map((midi,index)=>({midi,index}));
        if(previous&&c.difficulty==='easy')candidates=candidates.filter(n=>Math.abs(n.midi-previous.midi)<=5);
        else if(previous&&c.difficulty==='medium')candidates=candidates.filter(n=>Math.abs(n.midi-previous.midi)<=7);
        if(!events.some(e=>!e.rest)&&c.difficulty==='easy')candidates=candidates.filter(n=>h.pcs.includes(E.mod(n.midi)));
        // Prefer movement; repeating notes remain possible and count as new attacks.
        const moving=candidates.filter(n=>n.index!==lastIndex);
        const target=choose(moving.length&&r()>.18?moving:candidates,r);
        position=E.choose(config,[E.mod(target.midi)],previous,target.midi);
        if(!position||position.midi!==target.midi)throw Error('当前旋律没有合适的六弦指板位置。');
        lastIndex=target.index;previous=position;
      }
      events.push({start:cursor,duration,material,rest,tie,note:position,velocity:cursor%24===0?.85:.68,gate:c.style==='reggae'?.4:c.style==='rnb'?.94:.82});
      cursor+=duration;
    }
    while(left){
      const candidates=units.filter(u=>u.durations.length<=left&&can[left-u.durations.length]);
      const weights=candidates.map(u=>1+(c.style==='bossa'&&['eighth','sync','332'].includes(u.name)?2:0)+(c.style==='funk'&&['sixteenth','sync'].includes(u.name)?2:0)+(c.style==='rock'&&u.name==='quarter'?2:0)+(c.style==='jazz'&&u.name.includes('triplet')?2:0)+(c.style==='rnb'&&u.name.startsWith('dotted')?2:0));
      let value=r()*weights.reduce((a,b)=>a+b,0),unit=candidates.at(-1);
      for(let i=0;i<candidates.length;i++){value-=weights[i];if(value<=0){unit=candidates[i];break;}}
      if(allowed.has('rest')&&cursor>0&&r()<.28)add(unit.durations[0],unit.name,true);
      for(const duration of unit.durations){
        const tie=allowed.has('tie')&&cursor%24+duration>=24&&r()<.25;
        add(tie?duration*2:duration,unit.name,false,tie);
      }
      left-=unit.durations.length;
    }
    const barTicks=E.ticks(config),totalTicks=Math.ceil(cursor/barTicks)*barTicks;
    // Padding is silence after the phrase, not another selected rhythm material.
    const bars=Array.from({length:totalTicks/barTicks},(_,b)=>({events:events.filter(e=>!e.rest&&Math.floor(e.start/barTicks)===b).map(e=>({start:e.start%barTicks,rest:false}))}));
    return {seed,key,scale,config,events,totalTicks,phraseTicks:cursor,drums:E.drums(config,bars,seed+771),count:c.count};
  }
  function timeline(question,settings){
    const c={...question.config,tempo:settings.tempo},bar=E.ticks(c),items=[];
    for(const e of question.events)if(!e.rest)items.push({kind:'guitar',time:E.time(c,e.start),duration:(E.time(c,e.start+e.duration)-E.time(c,e.start))*e.gate,midi:e.note.midi,velocity:e.velocity});
    if(settings.drums)for(const d of question.drums)items.push({kind:'drum',time:E.time(c,d.bar*bar+d.start),track:d.track,velocity:d.velocity});
    if(settings.clickMode==='all')for(let tick=0;tick<question.totalTicks;tick+=c.meter==='6/8'?36:24)items.push({kind:'click',time:E.time(c,tick),strong:tick%bar===0});
    return {items:items.sort((a,b)=>a.time-b.time),duration:E.time(c,question.totalTicks),gap:E.time(c,bar*settings.gap),config:c};
  }
  root.EarEngine={defaults,generate,timeline};if(typeof module!=='undefined')module.exports=root.EarEngine;
})(globalThis);
