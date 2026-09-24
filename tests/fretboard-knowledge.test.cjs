const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={};
vm.createContext(context);
vm.runInContext(fs.readFileSync('green-ui/fretboard-knowledge.js','utf8'),context);
const {targetFret,practicalShapes,uniqueShapes,staggerShapes,typicalShapes,intervals}=context.FretboardKnowledge;
for(const [, ,semitones]of intervals.slice(1)){
 const combinations=practicalShapes(4,semitones);
 const expected=[];
 for(let root=6;root>=1;root--)for(let target=root;target>=1;target--){
  const fret=targetFret(root,target,4,semitones);
  if(fret>=0&&fret<=12&&Math.abs(fret-4)<=5)expected.push(`${root}-${target}-${fret}`);
 }
 assert.deepEqual(Array.from(combinations,x=>`${x.root}-${x.target}-${x.fret}`),expected);
 for(const {root,target,fret,span} of combinations){
 const midi=[0,64,59,55,50,45,40];
 assert.equal(midi[target]+fret-(midi[root]+4),semitones);
 assert.ok(fret>=0&&fret<=12&&span<=5);
 }
}
assert.equal(targetFret(6,5,4,1),0);
assert.equal(targetFret(3,2,4,1),1);
assert.ok(practicalShapes(4,1).some(x=>x.root===6&&x.target===6));
assert.ok(practicalShapes(4,1).some(x=>x.root===6&&x.target===5));
assert.ok(practicalShapes(4,1).some(x=>x.root===3&&x.target===2));
assert.ok(practicalShapes(4,12).every(x=>x.root!==x.target));
assert.ok(practicalShapes(4,12).some(x=>x.root===6&&x.target===4));
const minorSecond=uniqueShapes(practicalShapes(4,1),4);
assert.deepEqual(Array.from(minorSecond,x=>`${x.root}-${x.target}-${x.fret}`),['6-6-5','6-5-0','3-2-1']);
for(let start=0;start<=12;start++)for(const [,,semitones]of intervals.slice(1)){
 const all=practicalShapes(start,semitones),unique=uniqueShapes(all,start);
 const structures=Array.from(unique,x=>`${x.root-x.target}:${x.fret-start}`);
 assert.equal(new Set(structures).size,structures.length);
 assert.deepEqual(new Set(structures),new Set(Array.from(all,x=>`${x.root-x.target}:${x.fret-start}`)));
}
for(let start=0;start<=12;start++)for(const [,,semitones]of intervals.slice(1)){
 const original=uniqueShapes(practicalShapes(start,semitones),start),placed=staggerShapes(original,start,semitones),positions=new Set();
 assert.equal(placed.length,original.length);
 for(const shape of placed){
  assert.equal(targetFret(shape.root,shape.target,shape.rootFret,semitones),shape.targetFret);
  assert.ok(shape.rootFret>=0&&shape.targetFret>=0&&shape.rootFret<=18&&shape.targetFret<=18);
  assert.ok(Math.abs(shape.rootFret-shape.targetFret)<=5);
  for(const key of [`${shape.root}:${shape.rootFret}`,`${shape.target}:${shape.targetFret}`]){
   assert.ok(!positions.has(key),`overlapping dot at ${key}`);
   positions.add(key);
  }
 }
}
const html=typicalShapes(4);
assert.equal((html.match(/class="ik-shape-group"/g)||[]).length,12);
assert.equal((html.match(/class="ik-combined-board"/g)||[]).length,12);
assert.equal((html.match(/<svg /g)||[]).length,12);
assert.equal((html.match(/class="ik-card"/g)||[]).length,0);
assert.ok(html.includes('小二度 <small>1 半音 · 3 种典型结构</small>'));
for(const color of ['#55b8ff','#ff9f6e','#65d6a6','#ffd166','#d99cff','#ff82b2','#79d8dc','#b6df6a']){
 const uses=(html.match(new RegExp(color,'g'))||[]).length;
 assert.equal(uses%3,0,'each structure color is used by one line and two dots');
}
assert.ok(html.includes('每种颜色代表一种结构'));
console.log('PASS all practical six-string combinations across 12 intervals');
