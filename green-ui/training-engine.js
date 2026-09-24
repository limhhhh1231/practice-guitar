(function(root){
  'use strict';
  const E=root.GrooveEngine,C=root.PracticeCatalog;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const targets={nearest:'最近和弦音',guide:'三音 / 七音落点',common:'共同音连接',free:'自由练习'};
  const changes={rhythm:'只变节奏',ending:'只变结尾',onset:'只变入拍',octave:'只变八度音区'};
  const kindNames={connection:'和弦连接',ear:'听感辨认',motif:'动机发展',rhythm:'律动稳定性'};
  const defaults={key:0,scale:'major',tempo:80,min:3,max:7,strings:'all',progression:'1,4,0',beats:4,target:'nearest',difficulty:'medium'};
  function checkConfig(c){
    if(!Object.hasOwn(E.scales,c.scale)||!Number.isInteger(c.key)||c.key<0||c.key>11)throw Error('主音或调式无效。');
    if(!Number.isFinite(c.tempo)||c.tempo<40||c.tempo>220)throw Error('速度范围为 40–220 BPM。');
  }
  function question(events,c,seed=Date.now(),extra={}){
    const config={...E.defaults,...c,tuning:'standard'},bar=E.ticks(config);
    const end=Math.max(24,...events.map(e=>e.start+e.duration));
    return {seed,key:config.key,scale:config.scale,config,events:clone(events),totalTicks:Math.ceil(end/bar)*bar,phraseTicks:end,drums:[],count:events.filter(e=>!e.rest).length,...extra};
  }
  function connection(input={},seed=Date.now()){
    const c={...defaults,...input};checkConfig(c);
    if(!Number.isInteger(c.min)||!Number.isInteger(c.max)||c.min<0||c.max>12||c.min>c.max)throw Error('把位范围应为 0–12 品，起始品不能大于结束品。');
    if(!['all','treble','bass'].includes(c.strings)||![2,4,8].includes(c.beats)||!targets[c.target])throw Error('弦组、每和弦拍数或落点规则无效。');
    const degrees=String(c.progression).split(',').map(Number);
    if(degrees.length<2||degrees.length>8||degrees.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('请选择有效和弦进行。');
    if(!['easy','medium','hard'].includes(c.difficulty))throw Error('请选择有效的连接句型难度。');
    const harmonies=degrees.map(d=>C.chord(c.scale,c.key,d)),events=[],warnings=[],rng=E.rng(seed),filter=p=>c.strings==='all'||(c.strings==='treble'?p.string<=3:p.string>=4);
    const chordPools=harmonies.map((h,bar)=>{const pool=E.positions({...c,tuning:'standard'},h.pcs).filter(filter);if(!pool.length)throw Error('第 '+(bar+1)+' 个和弦在当前把位 / 弦组没有可用音，请扩大范围。');return pool;});
    const scalePcs=E.scales[c.scale].map(v=>E.mod(c.key+v)),scalePool=E.positions({...c,tuning:'standard'},scalePcs).filter(filter),allPool=E.positions({...c,tuning:'standard'}).filter(filter);
    const center=(c.min+c.max)/2,landingTargets=[];
    for(let bar=0;bar<harmonies.length;bar++){
      const h=harmonies[bar],pool=chordPools[bar],previous=landingTargets.at(-1);let candidates=pool,reason=c.target==='free'?'自由落点':'最近和弦音';
      if(c.target==='guide'){
        candidates=pool.filter(p=>[h.intervals[1],h.intervals[3]].includes(E.mod(p.midi-h.root)));reason='三音 / 七音';
        if(!candidates.length)throw Error(h.name+' 在此范围没有三音 / 七音，请扩大范围。');
      }else if(c.target==='common'&&bar){
        const shared=pool.filter(p=>harmonies[bar-1].pcs.includes(E.mod(p.midi)));
        if(shared.length){candidates=shared;reason='共同音';}
        else {reason='无共同音 · 最近音';warnings.push(harmonies[bar-1].name+' → '+h.name+' 无可用共同音，改用最近和弦音。');}
      }
      candidates=candidates.map(p=>({p,score:(previous?Math.abs(p.midi-previous.note.midi)*2+Math.abs(p.fret-previous.note.fret)*.75+Math.abs(p.string-previous.note.string)*.5:Math.abs(p.midi-55)+Math.abs(p.fret-center))+(c.target==='free'?rng()*7:0)})).sort((a,b)=>a.score-b.score);
      landingTargets.push({note:candidates[0].p,reason});
    }
    const patterns={
      easy:{2:[24,12,12],4:[24,12,12,24,12,12]},
      medium:{2:[12,12,12,12],4:[12,12,24,12,12,12,12]},
      hard:{2:[6,12,6,12,12],4:[6,12,6,12,12,6,6,12,12,12]}
    };
    const rhythm=beats=>{const base=patterns[c.difficulty][beats===2?2:4],copies=beats===8?2:1;return Array.from({length:copies},()=>base).flat();};
    const chooseNote=(pool,previous,used,direction,targetMidi)=>{
      const preferred=pool.filter(p=>!previous||Math.abs(p.midi-previous.midi)<=7),candidates=preferred.length?preferred:pool;
      return candidates.map(p=>{const leap=previous?Math.abs(p.midi-previous.midi):0,stepPenalty=previous?Math.abs(leap-3):0,directionPenalty=previous&&direction&&Math.sign(p.midi-previous.midi)!==direction?2.4:0,repeat=previous&&p.midi===previous.midi?12:0,novel=used.has(E.mod(p.midi))?2.8:-2,targetPenalty=targetMidi===undefined?0:Math.abs(p.midi-targetMidi)*.15;return {p,score:stepPenalty+directionPenalty+repeat+novel+Math.abs(p.fret-center)*.18+(previous?Math.abs(p.fret-previous.fret)*.45+Math.abs(p.string-previous.string)*.35:0)+targetPenalty+rng()*.6};}).sort((a,b)=>a.score-b.score)[0].p;
    };
    let previous=null;
    for(let bar=0;bar<harmonies.length;bar++){
      const h=harmonies[bar],durations=rhythm(c.beats),barStart=bar*c.beats*24,used=new Set(),direction=bar%2===0?1:-1;let cursor=0;
      for(let i=0;i<durations.length;i++){
        const duration=durations[i],strong=cursor%24===0,last=i===durations.length-1;let note,role=null,nextTarget=landingTargets[bar+1]?.note;
        if(i===0){note=landingTargets[bar].note;role=landingTargets[bar].reason;}
        else if(last&&nextTarget){
          let nextPool=chordPools[bar+1];
          if(c.target==='guide')nextPool=nextPool.filter(p=>[harmonies[bar+1].intervals[1],harmonies[bar+1].intervals[3]].includes(E.mod(p.midi-harmonies[bar+1].root)));
          else if(c.target==='common'&&landingTargets[bar+1].reason==='共同音')nextPool=nextPool.filter(p=>harmonies[bar].pcs.includes(E.mod(p.midi)));
          if(nextPool.length){
            nextTarget=nextPool.map(p=>({p,score:Math.abs(p.midi-previous.midi)*2+Math.abs(p.fret-previous.fret)*.5+Math.abs(p.string-previous.string)*.35+rng()*.05})).sort((a,b)=>a.score-b.score)[0].p;
            landingTargets[bar+1].note=nextTarget;
          }
          if(c.target==='common'&&landingTargets[bar+1].reason==='共同音')note=nextTarget;
          else{
            const approaches=allPool.filter(p=>p.midi!==nextTarget.midi&&Math.abs(p.midi-nextTarget.midi)<=2),diatonic=approaches.filter(p=>scalePcs.includes(E.mod(p.midi))),pool=diatonic.length?diatonic:approaches;
            const playable=pool.filter(p=>!previous||Math.abs(p.midi-previous.midi)<=7);
            if(playable.length){
              note=chooseNote(playable,previous,used,0,nextTarget.midi);
              role=scalePcs.includes(E.mod(note.midi))?'调内趋近':'半音趋近';
            }else note=chooseNote(chordPools[bar],previous,used,direction,nextTarget.midi);
          }
        }else{
          const melodicPool=strong?chordPools[bar]:(rng()<.62?scalePool:chordPools[bar]);
          note=chooseNote(melodicPool,previous,used,direction,nextTarget?.midi);
        }
        used.add(E.mod(note.midi));events.push({start:barStart+cursor,duration,material:Object.keys(E.materials).find(k=>E.materials[k]===duration)||'phrase',rest:false,note,velocity:i===0?.9:strong?.78:.66,gate:c.difficulty==='hard'?.78:.86,chordIndex:bar,target:role});previous=note;cursor+=duration;
      }
    }
    return question(events,c,seed,{harmonies,warnings,connection:c,totalTicks:degrees.length*c.beats*24});
  }
  function motif(input={},seed=Date.now()){
    const c={...defaults,phrase:'mixed',...input};checkConfig(c);const h=C.chord(c.scale,c.key,c.degree??0),r=E.rng(seed),events=[];let previous,cursor=0;
    const phrases=[[0,1,2,1,0,2,3,0],[0,2,1,3,2,1,3,0],[2,1,0,1,2,3,1,0]];
    const pattern=c.pitches?null:phrases[Math.floor(r()*phrases.length)];
    const pcs=c.pitches||pattern.map(i=>h.pcs[i]),durations=c.phrase==='steady'?Array(8).fill(24):c.phrase==='sync'?[18,6,24,48,18,6,24,48]:[24,12,12,48,24,12,12,48];
    if(pcs.length!==8||pcs.some(pc=>!h.pcs.includes(E.mod(pc))))throw Error('原句应为八个当前和弦内音。');
    for(let i=0;i<8;i++){
      const pool=E.positions({...E.defaults,...c},[E.mod(pcs[i])]);
      if(!pool.length)throw Error('当前把位缺少原句需要的和弦音，请扩大范围。');
      const next=pool.map(p=>({p,score:previous?Math.abs(p.midi-previous.midi)+Math.abs(p.fret-previous.fret)*.7+Math.abs(p.string-previous.string)*.4:Math.abs(p.midi-55)})).sort((a,b)=>a.score-b.score)[0].p;
      const duration=durations[i];events.push({start:cursor,duration,material:Object.keys(E.materials).find(k=>E.materials[k]===duration)||'quarter',rest:false,note:next,velocity:i%4===0?.88:.7,gate:.85});previous=next;cursor+=duration;
    }
    return question(events,c,seed,{chord:h});
  }
  function vary(source,type,seed=Date.now()){
    if(!changes[type])throw Error('请选择变奏方式。');
    const q=clone(source),r=E.rng(seed),notes=q.events.filter(e=>!e.rest);
    if(notes.length<2)throw Error('至少需要两个音才能进行动机发展。');
    if(type==='rhythm'){
      const pairs=[];for(let i=0;i<notes.length-1;i++)if(notes[i].duration>=12&&notes[i+1].duration>=12)pairs.push(i);
      if(!pairs.length)throw Error('原动机时值过短，请换一条原动机。');
      const i=pairs[Math.floor(r()*pairs.length)],shift=notes[i].duration>=24?-6:6;
      notes[i].duration+=shift;notes[i+1].start+=shift;notes[i+1].duration-=shift;
      notes[i].material=notes[i+1].material='variation';
    }else if(type==='ending'){
      const pcs=q.chord?.pcs||E.scales[q.scale].map(v=>E.mod(v+q.key));
      for(const last of notes.slice(-2)){
        const pool=E.positions({...E.defaults,...q.config,tuning:'standard'},pcs).filter(p=>p.midi!==last.note.midi&&Math.abs(p.midi-last.note.midi)<=7);
        if(!pool.length)throw Error('当前范围没有可替换的结尾音。');last.note=pool[Math.floor(r()*pool.length)];
      }
    }else if(type==='onset'){
      q.events.forEach(e=>e.start+=12);
    }else{
      const positions=E.positions({...E.defaults,...q.config,tuning:'standard'}),choices=[12,-12].map(shift=>({shift,matches:notes.map(e=>positions.filter(p=>p.midi===e.note.midi+shift))})).sort((a,b)=>b.matches.filter(x=>x.length).length-a.matches.filter(x=>x.length).length);
      const best=choices[0];if(!best.matches.some(x=>x.length))throw Error('当前把位没有可用的八度回应音，请扩大范围。');
      notes.forEach((e,i)=>{const pool=best.matches[i];if(pool.length)e.note=pool.sort((a,b)=>Math.abs(a.fret-e.note.fret)-Math.abs(b.fret-e.note.fret))[0];});
    }
    q.seed=seed;q.variation=type;const bar=E.ticks(q.config);q.totalTicks=Math.ceil(Math.max(...q.events.map(e=>e.start+e.duration))/bar)*bar;q.phraseTicks=Math.max(...q.events.map(e=>e.start+e.duration));return q;
  }
  function combine(a,b,silent=false){
    const q=clone(a);q.events=q.events.concat(silent?[]:b.events.map(e=>({...clone(e),start:e.start+a.totalTicks})));q.totalTicks=a.totalTicks+b.totalTicks;q.phraseTicks=q.totalTicks;q.count=q.events.filter(e=>!e.rest).length;return q;
  }
  function localDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
  function plan(input={},seed=Date.now(),day=localDay()){
    const prefs={minutes:20,focus:'all',difficulty:'easy',scales:['major'],...input};
    if(!Array.isArray(prefs.scales)||!prefs.scales.length||prefs.scales.some(s=>!Object.hasOwn(E.scales,s)))throw Error('基础调式范围至少选择一种有效调式。');
    if(![10,20,30,45].includes(prefs.minutes)||!['all','harmony','ear','rhythm'].includes(prefs.focus)||!['easy','medium','hard'].includes(prefs.difficulty))throw Error('日课设置无效。');
    const r=E.rng(seed),order={all:['connection','ear','motif','rhythm'],harmony:['connection','connection','ear'],ear:['ear','ear','motif'],rhythm:['rhythm','motif','rhythm']}[prefs.focus];
    const tasks=order.map((kind,i)=>{
      const scale=prefs.scales[Math.floor(r()*prefs.scales.length)],key=Math.floor(r()*12),tempo={easy:70,medium:85,hard:100}[prefs.difficulty];
      return {id:day+'-'+seed+'-'+i,kind,title:kindNames[kind],status:'todo',elapsed:0,progress:0,goal:kind==='ear'?5:3,minutes:Math.floor(prefs.minutes/order.length)+(i<prefs.minutes%order.length?1:0),params:{key,scale,tempo,difficulty:prefs.difficulty,min:3,max:7,target:i%2?'guide':'nearest',progression:'1,4,0',beats:4,strings:'all',variation:'ending',style:'rock',count:prefs.difficulty==='easy'?3:5},snapshot:null,feedback:null,seen:[]};
    });
    return {id:day+'-'+seed,day,seed,prefs,tasks};
  }
  class Timer{
    constructor(now=()=>performance.now()){this.now=now;this.elapsed=0;this.since=null;}
    resume(){if(this.since===null)this.since=this.now();}
    pause(){this.elapsed=this.value();this.since=null;return this.elapsed;}
    value(){return this.elapsed+(this.since===null?0:Math.max(0,this.now()-this.since));}
    load(ms=0){this.since=null;this.elapsed=Math.max(0,Number(ms)||0);}
  }
  function validateQuestion(q){
    if(!q||!Array.isArray(q.events)||q.events.length>128||!q.events.length)throw Error('练习音符数据无效。');
    checkConfig(q.config);if(q.key!==q.config.key||q.scale!==q.config.scale)throw Error('练习调式不一致。');
    if(!['4/4','3/4','6/8','5/4'].includes(q.config.meter)||!Number.isFinite(q.seed))throw Error('拍号或题目编号无效。');
    if(!Number.isFinite(q.totalTicks)||q.totalTicks<=0||q.totalTicks>6144)throw Error('练习时长无效。');
    for(const e of q.events){
      if(!Number.isFinite(e.start)||!Number.isFinite(e.duration)||e.start<0||e.duration<=0||e.start+e.duration>q.totalTicks||!Number.isFinite(e.velocity)||e.velocity<0||e.velocity>1||!Number.isFinite(e.gate)||e.gate<=0||e.gate>1)throw Error('音符节奏数据无效。');
      if(!e.rest){const n=e.note;if(!n||!Number.isInteger(n.string)||n.string<1||n.string>6||!Number.isInteger(n.fret)||n.fret<0||n.fret>12||n.midi!==[64,59,55,50,45,40][n.string-1]+n.fret)throw Error('六弦音高数据无效。');}
    }
    if(!Array.isArray(q.drums)||q.drums.length>4096||q.drums.some(d=>!['kick','snare','hat','openhat','ride','rim','tom','crash'].includes(d.track)||!Number.isFinite(d.bar)||!Number.isFinite(d.start)||!Number.isFinite(d.velocity)||d.velocity<0||d.velocity>1))throw Error('鼓组数据无效。');
    return q;
  }
  function validateBackup(value){
    if(!value||value.version!==1||!Array.isArray(value.plans)||value.plans.length>366||!Array.isArray(value.reviews)||value.reviews.length>500||!Array.isArray(value.favorites)||value.favorites.length>100)throw Error('备份格式或数量无效。');
    const visit=(obj,depth=0)=>{if(depth>30)throw Error('备份嵌套过深。');if(typeof obj==='string'&&(obj.length>2000||/[<>"'`]/.test(obj)))throw Error('备份含不安全的文本。');if(obj&&typeof obj==='object')for(const key of Object.keys(obj)){if(['__proto__','constructor','prototype'].includes(key))throw Error('不安全的数据字段。');visit(obj[key],depth+1);}};visit(value);
    function earRecord(r){
      if(r.hints!==undefined&&(!Array.isArray(r.hints)||r.hints.some(x=>!['answer','contour','note'].includes(x))))throw Error('提示记录无效。');
      if(r.revealedNotes!==undefined&&(!Array.isArray(r.revealedNotes)||r.revealedNotes.some(n=>!Number.isInteger(n)||n<0||n>7)))throw Error('提示音符无效。');
      const s=r.settings;if(!s)return;
      if(!Number.isFinite(s.tempo)||s.tempo<40||s.tempo>220||!Number.isInteger(s.repeats)||s.repeats<0||s.repeats>99||![0,1,2].includes(s.gap)||![0,1,2].includes(s.countIn)||!['off','count','all'].includes(s.clickMode)||!['acoustic','tight','power'].includes(s.kit)||!Array.isArray(s.materials)||s.materials.some(m=>!C.materials[m]))throw Error('听感播放设置无效。');
      for(const key of ['guitarVolume','drumVolume','clickVolume'])if(!Number.isFinite(s[key])||s[key]<0||s[key]>100)throw Error('听感音量无效。');
    }
    const ids=new Set();for(const p of value.plans){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(p.day)||typeof p.id!=='string'||!Array.isArray(p.tasks)||p.tasks.length>12)throw Error('计划数据无效。');
      plan(p.prefs,1,p.day);
      for(const t of p.tasks){
        if(typeof t.id!=='string'||ids.has(t.id)||!kindNames[t.kind]||!['todo','doing','done','skipped'].includes(t.status)||!Number.isFinite(t.elapsed)||t.elapsed<0||t.elapsed>1e10||!Number.isInteger(t.goal)||t.goal<1||t.goal>100||!Number.isInteger(t.progress)||t.progress<0||t.progress>t.goal||!Array.isArray(t.seen)||t.seen.length>100)throw Error('任务数据无效。');
        ids.add(t.id);checkConfig(t.params);if(!p.prefs.scales.includes(t.params.scale))throw Error('任务超出计划调式范围。');if(t.kind==='ear'&&t.snapshot)earRecord(t.snapshot);
        if(!Number.isFinite(t.minutes)||t.minutes<=0||t.minutes>45)throw Error('任务预计时长无效。');
        if(t.snapshot){if(t.kind==='motif'){validateQuestion(t.snapshot.a);validateQuestion(t.snapshot.b);if(!changes[t.snapshot.type])throw Error('动机变化方式无效。');}else if(t.kind!=='rhythm'){validateQuestion(t.snapshot.question||t.snapshot);if(t.kind==='connection'){const canonical=connection(t.snapshot.connection,t.snapshot.seed);if(JSON.stringify(canonical)!==JSON.stringify(t.snapshot))throw Error('和弦连接数据不一致。');}}else {
          const s=t.snapshot;checkConfig(s.config);if(!['standard','dropD'].includes(s.config.tuning)||!['4/4','3/4','6/8','5/4'].includes(s.config.meter)||!['modal','riff'].includes(s.config.mode)||!C.styles[s.config.style]||!Array.isArray(s.config.materials)||s.config.materials.some(m=>!C.materials[m])||!Array.isArray(s.result?.bars)||!s.result.bars.length||s.result.bars.length>8||!Array.isArray(s.result.drums)||s.result.drums.length>4096)throw Error('律动数据无效。');
          if(s.config.min<0||s.config.max>12||s.config.min>s.config.max)throw Error('律动把位无效。');
          for(const b of s.result.bars){if(!b.harmony||!Array.isArray(b.harmony.pcs)||!Array.isArray(b.events)||b.events.length>128)throw Error('律动小节无效。');for(const e of b.events){if(!Array.isArray(e.notes)||e.notes.length>6||!Number.isFinite(e.start)||!Number.isFinite(e.duration)||e.start<0||e.duration<=0||e.start>=E.ticks(s.config))throw Error('律动音符无效。');for(const n of e.notes){if(!Number.isInteger(n.string)||n.string<1||n.string>6||!Number.isInteger(n.fret)||n.fret<0||n.fret>12||n.midi!==(s.config.tuning==='dropD'?[64,59,55,50,45,38]:[64,59,55,50,45,40])[n.string-1]+n.fret)throw Error('律动六弦音高无效。');}}}
          for(const d of s.result.drums)if(!['kick','snare','hat','openhat','ride','rim','tom','crash'].includes(d.track)||!Number.isFinite(d.start)||d.start<0||!Number.isFinite(d.velocity)||d.velocity<0||d.velocity>1)throw Error('律动鼓组无效。');
        }}
      }
    }
    value.reviews.forEach(r=>{validateQuestion(r.question);earRecord(r);if(!['independent','hinted','difficult'].includes(r.rating))throw Error('听感评价无效。');});
    value.favorites.forEach(f=>{validateQuestion(f.a);validateQuestion(f.b);if(!changes[f.type])throw Error('动机收藏类型无效。');});return clone(value);
  }
  root.TrainingEngine={clone,targets,changes,kindNames,defaults,question,connection,motif,vary,combine,localDay,plan,Timer,validateQuestion,validateBackup};
  if(typeof module!=='undefined')module.exports=root.TrainingEngine;
})(globalThis);
