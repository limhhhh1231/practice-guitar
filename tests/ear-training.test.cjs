const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.GrooveEngine=require('../green-ui/groove-engine.js');
const E=global.GrooveEngine,C=require('../green-ui/practice-catalog.js'),G=require('../green-ui/ear-engine.js');
assert.deepEqual(Object.keys(C.scales),Object.keys(E.scales));
assert.equal(G.defaults.scale,'major');assert.equal(E.defaults.scale,'major');
let cases=0;
for(const scale of Object.keys(E.scales))for(let key=0;key<12;key++)for(let count=1;count<=8;count++)for(const style of Object.keys(C.styles)){
 const q=G.generate({scale,key,count,style},++cases),notes=q.events.filter(e=>!e.rest);
 assert.equal(notes.length,count);assert.equal(q.totalTicks%E.ticks(q.config),0);
 for(const e of notes){assert.ok(E.scales[scale].includes(E.mod(e.note.midi-key)));assert.equal([64,59,55,50,45,40][e.note.string-1]+e.note.fret,e.note.midi);assert.ok(e.note.fret>=0&&e.note.fret<=12);}
 assert.ok(Math.max(...notes.map(e=>e.note.midi))-Math.min(...notes.map(e=>e.note.midi))<=12);
 const slow=G.timeline(q,{...G.defaults,tempo:60}),fast=G.timeline(q,{...G.defaults,tempo:120});
 assert.equal(slow.duration,fast.duration*2);
 assert.equal(slow.items.filter(i=>i.kind==='guitar').length,count);
}
for(const [material,duration]of Object.entries(E.materials)){
 const q=G.generate({materials:[material],count:8},7);assert.equal(q.events.length,8);assert.ok(q.events.every(e=>e.duration===duration&&e.material===material));
}
for(const [material,durations]of Object.entries({shuffle:[16,8],sync:[6,12,6],'332':[18,18,12]})){
 const q=G.generate({materials:[material],count:durations.length*2},7);assert.deepEqual(q.events.map(e=>e.duration),durations.concat(durations));
 assert.throws(()=>G.generate({materials:[material],count:1}),/分组/);
}
assert.throws(()=>G.generate({materials:['rest','tie']}),/至少选/);
assert.throws(()=>G.generate({scale:'random',scalePool:[]}),/范围/);
for(let i=0;i<100;i++){const q=G.generate({scale:'random',scalePool:['dorian','blues']},i);assert.ok(['dorian','blues'].includes(q.scale));}
const q=G.generate({materials:['eighth'],style:'bossa'},88);
assert.deepEqual(q.drums,E.drums(q.config,Array.from({length:q.totalTicks/E.ticks(q.config)},(_,b)=>({events:q.events.filter(e=>!e.rest&&Math.floor(e.start/E.ticks(q.config))===b).map(e=>({start:e.start%E.ticks(q.config),rest:false}))})),88+771));
// Exercise arpeggio rendering across all keys/modes, including mother-scale chords.
const elements=new Map(),doc={getElementById(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',classList:{toggle(){},contains(){return false}}});return elements.get(id);},querySelectorAll(){return [];}};
const source=fs.readFileSync('green-ui/index.html','utf8');
const context={document:doc,GrooveEngine:E,PracticeCatalog:C};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('const chrom='),source.indexOf("['root','mode','display','notation']")),context);
let renders=0;
for(const mode of Object.keys(E.scales))for(let root=0;root<12;root++)for(let chord=-1;chord<7;chord++){
 vm.runInContext(`state={root:${root},mode:'${mode}',notation:'movable',display:'${chord<0?'scale':'chord'}',start:0,end:12,only:true,chord:${chord}};render();`,context);
 const pcs=[...new Set([...E.scales[mode].map(i=>E.mod(i+root)),...(chord<0?[]:C.chord(mode,root,chord).pcs)])];
 const rootPitch=chord<0?root:C.chord(mode,root,chord).root;
 for(let string=1;string<=6;string++)for(let fret=1;fret<=12;fret++){
  const midi=[64,59,55,50,45,40][string-1]+fret;
  const match=elements.get('notes').innerHTML.match(new RegExp('<div class="([^"]+)" style="grid-column:'+fret+';grid-row:'+string+'"'));
  assert.equal(!!match,pcs.includes(E.mod(midi)));
  if(match)assert.equal(match[1].includes('root'),E.mod(midi)===rootPitch);
 }
 assert.ok(!elements.get('chords').innerHTML.includes('undefined'));renders++;
}
console.log(`PASS ${cases} ear scenarios; all materials/groups, shared drums, 960 arpeggio renders (${renders}), exact six-string pitches.`);
// Mock the audio clock to verify finite loops don't accidentally schedule a fourth round.
const Player=require('../green-ui/ear-audio.js');
async function playbackChecks(){
 const scheduled=[],statuses=[],p=new Player((s,playing)=>statuses.push({s,playing}));
 p.prepare=async function(settings){this.settings=settings;this.context={currentTime:0,state:'running'};};
 p.emit=(item,time)=>scheduled.push({item,time});
 const question=G.generate({count:4,key:0,materials:['quarter']},9);
 for(const gap of [0,1,2])for(const repeats of [1,2,4]){
  scheduled.length=0;await p.play(question,{...G.defaults,tempo:120,countIn:0,drums:false,clickMode:'off',gap,repeats});
  clearInterval(p.timer);let checks=0;
  while(p.playing&&checks++<10000){p.context.currentTime+=.025;p.tick();}
  assert.ok(!p.playing);assert.equal(scheduled.filter(x=>x.item.kind==='guitar').length,4*repeats);
  assert.ok(statuses.at(-1).s.includes('已完成 '+repeats+' 遍'));
  for(let i=1;i<scheduled.length;i++)assert.ok(scheduled[i].time>scheduled[i-1].time);
 }
 scheduled.length=0;await p.play(question,{...G.defaults,repeats:0,countIn:0,drums:false,clickMode:'off',gap:0});clearInterval(p.timer);
 for(let i=0;i<800;i++){p.context.currentTime+=.025;p.tick();}
 assert.ok(p.playing);assert.ok(scheduled.length>4);p.stop();const length=scheduled.length;p.tick();assert.equal(scheduled.length,length);
 let unlock;const waiting=new Player();waiting.prepare=()=>new Promise(resolve=>{unlock=resolve;});waiting.emit=()=>{throw Error('cancelled playback must not emit');};
 const pending=waiting.play(question,G.defaults);waiting.stop();unlock();await pending;assert.equal(waiting.playing,false);
 console.log('PASS audio clock: finite/infinite cycles, gaps, stop and asynchronous cancellation.');
}
playbackChecks().catch(error=>{console.error(error);process.exitCode=1;});
