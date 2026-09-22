(function(root){
'use strict';
const mod=(n,m=12)=>(n%m+m)%m, names=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const scales={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],mixolydian:[0,2,4,5,7,9,10],phrygian:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11],locrian:[0,1,3,5,6,8,10],majorPent:[0,2,4,7,9],minorPent:[0,3,5,7,10],blues:[0,3,5,6,7,10]};
// 24 ticks per quarter: all supported binary and triplet durations are exact integers.
const materials={whole:96,half:48,quarter:24,eighth:12,sixteenth:6,'dotted-half':72,'dotted-quarter':36,'dotted-eighth':18,'half-triplet':32,'quarter-triplet':16,'eighth-triplet':8,'sixteenth-triplet':4};
const patterns={'1353':[0,2,4,2],'1351':[0,2,4,7],'123':[0,1,2],'1234':[0,1,2,3],'135':[0,2,4],'1357':[0,2,4,6],'321':[2,1,0],'4321':[3,2,1,0]};
const defaults={key:0,scale:'major',meter:'4/4',tempo:90,mode:'strum',practice:'normal',style:'rock',difficulty:'medium',density:'medium',feel:'style',dynamics:'natural',sync:42,link:'balanced',position:'lowmid',min:0,max:12,tuning:'standard',voicing:'seventh',extension:9,pattern:'1353',direction:'up',sequenceLogic:'scale',variation:'fixed',materials:['quarter','eighth','rest'],bars:[0,3,4,0],guitar:'steel',kit:'acoustic',click:'classic'};
function ticks(c){return c.meter==='6/8'?72:Number(c.meter.split('/')[0])*24}
function seconds(c,t){return t/24*60/c.tempo/(c.meter==='6/8'?1.5:1)}
function time(c,t){if(c.meter==='6/8')return seconds(c,t);const swing=c.feel==='swing'||c.feel==='style'&&c.style==='jazz';if(!swing)return seconds(c,t);const q=Math.floor(t/24),r=t%24;return seconds(c,q*24+(r<12?r*4/3:16+(r-12)*2/3))}
function harmony(c,degree,index=0){
 const source=scales[c.scale],s=source.length===7?source:(c.scale==='majorPent'?scales.major:scales.minor),d=mod(degree,7),r=mod(c.key+s[d]);
 const interval=o=>s[(d+o)%7]+12*Math.floor((d+o)/7)-s[d];
 let kind=c.voicing==='mixed'?['triad','seventh','extension','sus','inversion'][index%5]:c.voicing;
 if(kind==='extension'&&Number(c.extension)===0)kind='seventh';
 const third=interval(2),fifth=interval(4),seventh=interval(6),tri=third===3?(fifth===6?'dim':'m'):(fifth===8?'aug':'');
 let ints=[0,third,fifth],suffix=tri,bass=r;
 if(kind!=='triad'&&kind!=='sus'){ints.push(seventh);suffix=tri==='dim'?(seventh===9?'dim7':'m7♭5'):tri==='m'?(seventh===11?'m(maj7)':'m7'):tri==='aug'?(seventh===11?'maj7♯5':'7♯5'):(seventh===11?'maj7':'7');}
 if(kind==='extension'){const ext=Number(c.extension)||9;for(let o=8;o<=ext-1;o+=2)ints.push(interval(o));suffix+='(add'+ints.slice(4).map((v,i)=>{const expected=[14,17,21][i],num=9+2*i;return(v<expected?'♭':v>expected?'♯':'')+num}).join(',')+')'}
 if(kind==='sus'){const sus=index%2?2:5;ints=[0,sus,7];suffix=sus===2?'sus2':'sus4'}
 if(kind==='inversion')bass=mod(r+third);
 const pcs=[...new Set(ints.map(v=>mod(r+v)))];
 return {root:r,bass,pcs,intervals:ints,name:names[r]+suffix+(kind==='inversion'?'/'+names[bass]:''),kind,degree:d};
}
function positions(c,pcs){const open=c.tuning==='dropD'?[64,59,55,50,45,38]:[64,59,55,50,45,40],out=[];for(let s=0;s<6;s++)for(let f=c.min;f<=c.max;f++){const midi=open[s]+f;if(!pcs||pcs.includes(mod(midi)))out.push({midi,string:s+1,fret:f})}return out}
function targetFret(c){return {low:1,lowmid:4,center:(c.min+c.max)/2,high:c.max-1}[c.position]??4}
function choose(c,pcs,prev,target){const candidates=positions(c,pcs);if(!candidates.length)return null;return candidates.sort((a,b)=>score(a)-score(b))[0];function score(p){return Math.abs(p.fret-targetFret(c))*.65+(prev?Math.abs(p.fret-prev.fret)*.6+Math.abs(p.string-prev.string)*.5:0)+(target===undefined?Math.abs(p.midi-55)*.15:Math.abs(p.midi-target)*3)}}
function voicing(c,h,previous){
 const all=positions(c,h.pcs);let best=null,bestScore=Infinity;
 // Beam search: at most one note per string, no more than four frets of hand span.
 let beam=[[]];for(let string=6;string>=1;string--){const choices=all.filter(p=>p.string===string);const next=[];for(const v of beam)for(const p of [null,...choices]){const w=p?[...v,p]:v;if(w.length&&mod(w[0].midi)!==h.bass)continue;if(p&&v.length&&p.midi<=v.at(-1).midi)continue;const fretted=w.filter(x=>x.fret>0).map(x=>x.fret);if(fretted.length&&Math.max(...fretted)-Math.min(...fretted)>4)continue;next.push(w)}beam=next.sort((a,b)=>rank(a)-rank(b)).slice(0,180)}
 for(const v of beam){if(v.length<3)continue;const unique=new Set(v.map(p=>mod(p.midi)));if(!unique.has(h.root)||!unique.has(mod(h.root+h.intervals[1])))continue;if(h.kind!=='triad'&&h.kind!=='sus'&&!unique.has(mod(h.root+h.intervals[3])))continue;if(h.kind==='extension'&&!unique.has(mod(h.root+h.intervals.at(-1))))continue;const score=rank(v);if(score<bestScore){best=v;bestScore=score}}
 return best;
 function rank(v){const unique=new Set(v.map(p=>mod(p.midi)));return (h.pcs.length-unique.size)*18-v.length*2+v.reduce((a,p)=>a+Math.abs(p.fret-targetFret(c))*.5+(previous?.find(x=>x.string===p.string)?Math.abs(p.fret-previous.find(x=>x.string===p.string).fret)*.8:0),0)}
}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rhythm(c,random){
 const total=ticks(c),allowed=new Set(c.materials),atoms=Object.entries(materials).filter(([k])=>allowed.has(k));
 const groups=[];if(allowed.has('shuffle'))groups.push({name:'shuffle',durations:[16,8]});if(allowed.has('332'))groups.push({name:'332',durations:[18,18,12]});if(allowed.has('sync'))groups.push({name:'sync',durations:[6,12,6]});
 if(!atoms.length&&!groups.length)throw Error('至少选择一种音符时值或节奏分组。');
 const units=[...atoms.map(([name,d])=>({name,durations:[d]})),...groups],can=Array(total+1).fill(false);can[0]=true;
 for(let n=1;n<=total;n++)can[n]=units.some(u=>{const d=u.durations.reduce((a,b)=>a+b,0);return d<=n&&can[n-d]});
 if(!can[total])throw Error('所选时值无法完整填满 '+c.meter+'，请加入四分或八分音符。');
 let cursor=0,events=[];const target={sparse:36,medium:16,dense:8}[c.density]*(c.difficulty==='easy'?1.6:c.difficulty==='hard'?.75:1);
 while(cursor<total){const candidates=units.filter(u=>{const d=u.durations.reduce((a,b)=>a+b,0);return d<=total-cursor&&can[total-cursor-d]});const weights=candidates.map(u=>{const avg=u.durations.reduce((a,b)=>a+b,0)/u.durations.length,end=cursor+u.durations.reduce((a,b)=>a+b,0),off=end%24!==0;const styleBonus=c.style==='funk'&&avg<=12?.9:c.style==='motown'&&avg===12?1.2:c.style==='rock'&&avg===24?1.3:c.style==='rnb'&&avg>=18?.8:c.style==='jazz'&&u.name.includes('triplet')?1.3:c.style==='bossa'&&(u.name==='eighth'||u.name==='sync'||u.name==='332')?1.45:0;return 1/(1+Math.abs(Math.log2(avg/target)))+(off?c.sync/60:0)+styleBonus+(u.name==='sync'?c.sync/50:0)});let value=random()*weights.reduce((a,b)=>a+b,0),pick=candidates.at(-1);for(let i=0;i<candidates.length;i++){value-=weights[i];if(value<=0){pick=candidates[i];break}}
 for(const duration of pick.durations){const off=cursor%24!==0;let rest=allowed.has('rest')&&random()<(cursor===0?.03:{sparse:.35,medium:.17,dense:.07}[c.density]);if(c.style==='reggae'&&allowed.has('rest')&&cursor%24===0)rest=random()<.8;events.push({start:cursor,duration,rest,material:pick.name,accent:cursor%(c.meter==='6/8'?36:24)===0,velocity:Math.min(1,(cursor%24===0?.9:.64)+(random()-.5)*(c.dynamics==='strong'?.32:.12)+(off?c.sync/100*.08:0))});cursor+=duration;}
 }
 if(events.every(e=>e.rest))events[0].rest=false;
 if(allowed.has('tie'))for(let i=0;i<events.length-1;i++){const a=events[i],b=events[i+1];if(!a.rest&&!b.rest&&random()<.3){a.duration+=b.duration;a.tie=true;events.splice(i+1,1)}}
 return events;
}
const styles={rock:{kick:[0,2],snare:[1,3],hat:.5},funk:{kick:[0,.75,2,2.75],snare:[1,3],hat:.5},motown:{kick:[0,1,2,3],snare:[1,3],hat:.5},rnb:{kick:[0,1.75,2.5],snare:[1,3],hat:.5},reggae:{kick:[2],snare:[2],hat:.5},jazz:{kick:[0,2],snare:[1,3],hat:1},bossa:{kick:[0,1.5,2.5],snare:[1,3],hat:.5}};
function drums(c,bars,seed){const random=rng(seed),profile=styles[c.style]||styles.rock,result=[],total=ticks(c),quarterCount=total/24;bars.forEach((bar,b)=>{const add=(track,start,v)=>{if(start<total&&!result.some(e=>e.bar===b&&e.track===track&&e.start===start))result.push({bar:b,track,start,duration:6,velocity:Math.max(.15,Math.min(1,v+(random()-.5)*(c.dynamics==='strong'?.25:.1)))})};
 let kick=c.meter==='6/8'?[0,36]:profile.kick.map(q=>q*24).filter(t=>t<total),snare=c.meter==='6/8'?[36]:profile.snare.map(q=>q*24).filter(t=>t<total);if(c.style==='bossa'&&c.meter==='4/4'){kick=[0,36,48,84];snare=[12,36,60,84]}
 if(c.meter==='5/4')kick.push(96);if(c.meter==='3/4')snare.splice(0,snare.length,24);
 const onsets=bar.events.filter(e=>!e.rest).map(e=>e.start);
 kick.forEach(t=>{if(c.link!=='inverse'||!onsets.includes(t)||t===0)add('kick',t,t===0?.95:.75)});snare.forEach(t=>add('snare',t,.86));
 if(c.link==='tight')onsets.filter(t=>t%24!==0).forEach(t=>{if(random()<.65)add('kick',t,.75)});
 if(c.link==='balanced'&&random()<.65){const p=onsets.filter(t=>t%24!==0);if(p.length)add('kick',p[Math.floor(random()*p.length)],.7)}
 if(c.link==='inverse')for(let t=12;t<total;t+=12)if(!onsets.includes(t)&&random()<.5)add('kick',t,.75);
 const step=c.style==='bossa'?12:c.density==='dense'?6:c.density==='sparse'?24:12;
 for(let t=0;t<total;t+=step)add('hat',t,t%24===0?.57:.36);
 if(c.style==='jazz')for(let t=16;t<total;t+=24)add('hat',t,.4);if(c.style==='bossa')for(let t=6;t<total;t+=12)add('hat',t,.23);
 if(c.difficulty!=='easy'&&c.density!=='sparse')for(const t of snare)if(t>=6&&random()<.6)add('snare',t-6,.22);
 if(c.difficulty==='hard'&&b===bars.length-1){add('snare',total-12,.52);add('snare',total-6,.7)}
 });return result.sort((a,b)=>a.bar-b.bar||a.start-b.start)}
function generate(c,seed=Date.now(),old=[],only='all'){
 if(!scales[c.scale]||!['4/4','3/4','5/4','6/8'].includes(c.meter))throw Error('不支持的调式或拍号');if(!Number.isFinite(c.tempo)||c.tempo<40||c.tempo>220)throw Error('速度范围为 40–220 BPM');if(!Number.isInteger(c.min)||!Number.isInteger(c.max)||c.min<0||c.max>12||c.min>c.max)throw Error('品位范围必须为 0–12 的整数');if(!c.bars.length||c.bars.length>8)throw Error('请选择 1–8 小节');
 const random=rng(seed),bars=[],warnings=[];let prev=null,prevVoicing=null,seqIndex=0,seqBase=0,seqDir=c.direction==='down'?-1:1;
 const offsets=patterns[c.pattern],s=scales[c.scale],tonics=positions(c,[c.key]).sort((a,b)=>a.midi-b.midi),tonic=tonics[0]?.midi;
 const scaleMidi=d=>tonic+s[mod(d,s.length)]+12*Math.floor(d/s.length),fits=d=>offsets.every(o=>{const m=scaleMidi(d+o);return m>=tonic&&m<=tonic+24&&positions(c,[mod(m)]).some(p=>p.midi===m)});
 const validBases=Array.from({length:s.length*2+1},(_,i)=>i).filter(fits);seqBase=seqDir<0?validBases.at(-1)||0:validBases[0]||0;
 const shared=c.practice==='sequence'&&c.variation==='fixed'?rhythm(c,random):null;
 const initialBase=seqBase;let reversed=false,flowDone=false;
 const barCount=c.practice==='sequence'&&c.sequenceFlow?64:c.bars.length;
 for(let b=0;b<barCount;b++){
  if(old[b]?.locked){bars.push(JSON.parse(JSON.stringify(old[b])));prev=old[b].events.filter(e=>e.notes?.length).at(-1)?.notes.at(-1)||prev;continue}
  const currentDegree=c.bars[b%c.bars.length],h=harmony(c,c.practice==='normal'&&c.mode==='modal'?c.bars[0]:currentDegree,b),v=voicing(c,h,prevVoicing);if(v)prevVoicing=v;
  let events=(shared?JSON.parse(JSON.stringify(shared)):rhythm(c,random));
  let melodic=0;for(const e of events){e.bar=b;e.notes=[];e.direction=(e.start%24>=12)?'up':'down';if(flowDone&&c.sequenceFlow){e.rest=true;continue}if(e.rest)continue;let selected=null;
   if(c.practice==='sequence'){
    if(!tonics.length||!validBases.length)throw Error('这个把位无法容纳完整模进动机，请扩大品位范围。');
    const off=offsets[seqIndex%offsets.length];let target;
    if(c.sequenceLogic==='harmony'){const chordIndex=off===7?0:Math.min(h.intervals.length-1,Math.round(off/2));target=48+h.root+h.intervals[chordIndex]+(off===7?12:0);selected=choose(c,[mod(target)],prev,target)}else{target=scaleMidi(seqBase+off);selected=positions(c,[mod(target)]).filter(p=>p.midi===target).sort((a,b)=>Math.abs(a.fret-targetFret(c))-Math.abs(b.fret-targetFret(c)))[0];}
    seqIndex++;if(seqIndex%offsets.length===0){if(reversed&&seqBase===initialBase)flowDone=true;let next=seqBase+seqDir;if(!fits(next)){seqDir*=-1;reversed=true;next=seqBase+seqDir}if(fits(next))seqBase=next;else flowDone=true}
   }else if(c.mode==='strum'||c.mode==='muted'){
    if(!v){e.rest=true;warnings.push('第 '+(b+1)+' 小节：把位内没有满足低音、三音和七音的可按指型，请扩大范围或改为分解。');continue}e.notes=v.map(n=>({...n}));
   }else if(c.mode==='root')selected=choose(c,[h.bass],prev,45);
   else if(c.mode==='arpeggio')selected=choose(c,[h.pcs[melodic%h.pcs.length]],prev,50+melodic%h.pcs.length*4);
   else if(c.mode==='walking'){const next=harmony(c,c.bars[(b+1)%c.bars.length],b+1);const pc=e.start+e.duration===ticks(c)&&c.difficulty==='hard'?mod(next.root-1):h.pcs[melodic%h.pcs.length];selected=choose(c,[pc],prev,46+melodic%4*2)}
   else {const pool=c.mode==='chord'?h.pcs:(e.accent?h.pcs:s.map(x=>mod(c.key+x)));const pc=pool[(c.mode==='riff'?([0,2,1,2][melodic%4]):Math.floor(random()*pool.length))%pool.length];selected=choose(c,[pc],prev,c.mode==='modal'?57:prev?.midi)}
   if(selected)e.notes=[selected];if(!e.notes.length){e.rest=true;warnings.push('第 '+(b+1)+' 小节有目标音超出把位，已显示为休止。')}else{e.notes=e.notes.map(n=>({...n,role:mod(n.midi)===h.root?'root':h.pcs.includes(mod(n.midi))?'chord':s.some(x=>mod(c.key+x)===mod(n.midi))?'scale':'passing'}));prev=e.notes.at(-1)}
   e.muted=c.mode==='muted'||c.style==='funk'&&c.difficulty==='hard'&&!e.accent&&random()<.2;e.gate=e.muted?.2:c.style==='reggae'?.28:c.style==='rnb'?.92:.78;melodic++;
  }
  bars.push({harmony:h,events,locked:false,voicing:v});
  if(flowDone&&c.practice==='sequence'&&c.sequenceFlow){const first=bars.flatMap(x=>x.events).find(e=>e.notes.length);if(first){const note={...first.notes[0]};bars.push({harmony:{...h,name:'↺ 回到起点'},events:[{bar:bars.length,start:0,duration:ticks(c),rest:false,material:'whole',notes:[note],velocity:.85,gate:.96,direction:'down'}],locked:false,voicing:null})}break}
 }
 return {bars,drums:only==='guitar'?[]:drums(c,bars,seed+771),warnings:[...new Set(warnings)],seed};
}
const api={mod,names,scales,materials,patterns,defaults,ticks,time,seconds,harmony,positions,voicing,choose,rhythm,generate,drums,rng};root.GrooveEngine=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
