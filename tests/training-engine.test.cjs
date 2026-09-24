const assert=require('node:assert/strict');
global.GrooveEngine=require('../green-ui/groove-engine.js');
global.PracticeCatalog=require('../green-ui/practice-catalog.js');
const E=global.GrooveEngine,C=global.PracticeCatalog,T=require('../green-ui/training-engine.js'),G=require('../green-ui/ear-engine.js');
let count=0;
for(const scale of Object.keys(E.scales))for(let key=0;key<12;key++)for(const target of Object.keys(T.targets))for(const strings of ['all','bass','treble']){
  const q=T.connection({scale,key,target,strings},91);T.validateQuestion(q);
  for(let bar=0;bar<q.harmonies.length;bar++){
    const events=q.events.filter(e=>e.chordIndex===bar),h=q.harmonies[bar],start=bar*q.connection.beats*24;
    assert.equal(events[0].start,start);assert.equal(events.at(-1).start+events.at(-1).duration,start+q.connection.beats*24);
    events.forEach((e,i)=>{
      if(i)assert.equal(e.start,events[i-1].start+events[i-1].duration);
      assert.ok(e.note.fret>=3&&e.note.fret<=7);
      if(strings==='bass')assert.ok(e.note.string>=4);if(strings==='treble')assert.ok(e.note.string<=3);
      if((e.start-start)%24===0)assert.ok(h.pcs.includes(E.mod(e.note.midi)));
    });
    assert.ok(h.pcs.includes(E.mod(events[0].note.midi)));
    if(target==='guide')assert.ok([h.intervals[1],h.intervals[3]].includes(E.mod(events[0].note.midi-h.root)));
    if(target==='common'&&bar&&events[0].target==='共同音')assert.ok(q.harmonies[bar-1].pcs.includes(E.mod(events[0].note.midi)));
    assert.ok(new Set(events.map(e=>E.mod(e.note.midi))).size>=Math.min(2,events.length));
  }
  q.events.slice(1).forEach((e,i)=>assert.ok(Math.abs(e.note.midi-q.events[i].note.midi)<=12));
  assert.deepEqual(q,T.connection({scale,key,target,strings},91));count++;
}
for(const difficulty of ['easy','medium','hard'])for(const beats of [2,4,8]){
  const q=T.connection({difficulty,beats},123),perBar=q.events.filter(e=>e.chordIndex===0);
  assert.equal(perBar.reduce((sum,e)=>sum+e.duration,0),beats*24);
}
const densities=['easy','medium','hard'].map(difficulty=>T.connection({difficulty,beats:4},123).events.filter(e=>e.chordIndex===0).length);
assert.ok(densities[0]<densities[1]&&densities[1]<densities[2]);
assert.throws(()=>T.connection({min:8,max:4}),/范围/);
assert.throws(()=>T.connection({target:'guide',min:0,max:0,strings:'treble',key:1}),/没有/);
for(const scale of Object.keys(E.scales))for(let key=0;key<12;key++){
  const a=T.motif({scale,key,min:0,max:12},42),before=JSON.stringify(a);
  for(const type of Object.keys(T.changes)){
    const b=T.vary(a,type,13);T.validateQuestion(b);assert.equal(JSON.stringify(a),before);assert.equal(a.count,b.count);assert.notDeepEqual(a.events,b.events);
    if(type==='rhythm'){assert.deepEqual(a.events.map(e=>e.note),b.events.map(e=>e.note));assert.equal(a.phraseTicks,b.phraseTicks);}
    if(type==='ending')assert.deepEqual(a.events.slice(0,-2),b.events.slice(0,-2));
    if(type==='onset')a.events.forEach((e,i)=>{assert.equal(b.events[i].start,e.start+12);assert.deepEqual(e.note,b.events[i].note);assert.equal(e.duration,b.events[i].duration);});
    if(type==='octave'){assert.ok(a.events.some((e,i)=>Math.abs(e.note.midi-b.events[i].note.midi)===12));a.events.forEach((e,i)=>{assert.ok([0,12].includes(Math.abs(e.note.midi-b.events[i].note.midi)));assert.equal(E.mod(e.note.midi),E.mod(b.events[i].note.midi));assert.equal(e.start,b.events[i].start);});}
  }
  const silent=T.combine(a,a,true);assert.equal(silent.events.length,a.events.length);assert.equal(silent.totalTicks,a.totalTicks*2);
}
for(let seed=0;seed<200;seed++){
 const p=T.plan({scales:['dorian','blues'],minutes:20},seed,'2026-09-24');assert.ok(p.tasks.every(t=>['dorian','blues'].includes(t.params.scale)));assert.equal(p.tasks.reduce((s,t)=>s+t.minutes,0),20);assert.deepEqual(p,T.plan({scales:['dorian','blues'],minutes:20},seed,'2026-09-24'));
}
assert.throws(()=>T.plan({scales:[]}),/范围/);
let now=0;const timer=new T.Timer(()=>now);timer.resume();now=2500;assert.equal(timer.value(),2500);timer.resume();now=4000;assert.equal(timer.pause(),4000);now=999999;assert.equal(timer.value(),4000);timer.resume();now+=1000;assert.equal(timer.pause(),5000);timer.load(7200);now+=100000;assert.equal(timer.value(),7200);
const p=T.plan(),a=T.motif({min:0,max:12},2);p.tasks[0].snapshot=T.connection(p.tasks[0].params,1);p.tasks[1].snapshot={question:G.generate({...p.tasks[1].params,count:3},2)};p.tasks[2].snapshot={a,b:T.vary(a,'ending',3),type:'ending'};
const cfg={...E.defaults,...p.tasks[3].params,mode:'riff'};p.tasks[3].snapshot={config:cfg,result:E.generate(cfg,13)};
const backup={version:1,plans:[p],reviews:[{question:G.generate({},15),rating:'difficult'}],favorites:[{a,b:T.vary(a,'ending',3),type:'ending'}]};assert.deepEqual(T.validateBackup(backup),backup);
const bad=T.clone(backup);bad.plans[0].tasks[0].snapshot.events[0].note.midi++;assert.throws(()=>T.validateBackup(bad),/音高/);
const xss=T.clone(backup);xss.plans[0].tasks[0].title='<img src=x onerror=alert(1)>';assert.throws(()=>T.validateBackup(xss),/不安全/);
const pollute=JSON.parse('{"version":1,"plans":[],"reviews":[],"favorites":[],"__proto__":{}}');assert.throws(()=>T.validateBackup(pollute),/不安全/);
console.log('PASS '+count+' chord connections; 480 single-dimension variations; plans, timer, backups and unsafe imports.');
