const assert=require('node:assert/strict'),E=require('../green-ui/groove-engine');
const config=extra=>({...E.defaults,materials:[...E.defaults.materials],bars:[0,3,4,0],...extra});
for(const voicing of ['extension','mixed'])for(let degree=0;degree<7;degree++){
 const h=E.harmony(config({voicing,extension:0}),degree,2);
 assert.equal(h.kind,'seventh');
 assert.equal(h.intervals.length,4);
 assert.ok(!h.name.includes('add'));
 assert.deepEqual(h.pcs,E.harmony(config({voicing:'seventh'}),degree).pcs);
}
assert.deepEqual(E.positions(config({min:0,max:0})).map(n=>n.midi),[64,59,55,50,45,40]);
assert.deepEqual(E.positions(config({min:0,max:0,tuning:'dropD'})).map(n=>n.midi),[64,59,55,50,45,38]);
assert.equal(E.positions(config()).length,78);
assert.deepEqual([...new Set(E.positions(config()).map(n=>n.string))],[1,2,3,4,5,6]);
let cases=0;
function verify(c,r){for(const b of r.bars){assert.equal(b.events.reduce((sum,e)=>sum+e.duration,0),E.ticks(c));let cursor=0;for(const e of b.events){assert.equal(e.start,cursor);cursor+=e.duration;for(const n of e.notes){assert.ok(n.fret>=c.min&&n.fret<=c.max);assert.equal((c.tuning==='dropD'?[64,59,55,50,45,38]:[64,59,55,50,45,40])[n.string-1]+n.fret,n.midi);assert.ok(Number.isFinite(n.midi));}assert.ok(e.velocity>0&&e.velocity<=1)}}for(const d of r.drums){assert.ok(d.start>=0&&d.start<E.ticks(c));assert.ok(d.bar<r.bars.length)}cases++}
for(const meter of ['4/4','3/4','5/4','6/8'])for(const scale of Object.keys(E.scales))for(const mode of ['strum','muted','root','chord','arpeggio','walking','modal','riff']){const c=config({meter,scale,mode});verify(c,E.generate(c,42));}
for(const key of Array.from({length:12},(_,i)=>i))for(const voicing of ['triad','seventh','extension','sus','inversion','mixed']){const c=config({key,voicing,extension:13});const r=E.generate(c,32);verify(c,r);for(const bar of r.bars)if(bar.voicing){assert.equal(E.mod(bar.voicing[0].midi),bar.harmony.bass);assert.equal(new Set(bar.voicing.map(n=>n.string)).size,bar.voicing.length)}}
assert.deepEqual(E.harmony(config(),0).pcs,[0,4,7,11]);assert.deepEqual(E.harmony(config(),1).pcs,[2,5,9,0]);assert.equal(E.harmony(config({voicing:'triad'}),0).name,'C');assert.equal(E.harmony(config({voicing:'inversion'}),0).name,'Cmaj7/E');
for(const material of Object.keys(E.materials)){const c=config({materials:[material]});if(E.ticks(c)%E.materials[material]===0){const r=E.generate(c,99);verify(c,r);assert.ok(r.bars.every(b=>b.events.every(e=>e.duration===E.materials[material])))}else assert.throws(()=>E.generate(c,99))}
for(const material of ['shuffle','332','sync'])verify(config({materials:[material]}),E.generate(config({materials:[material]}),90));
for(const pattern of Object.keys(E.patterns))for(const direction of ['up','down'])for(const sequenceLogic of ['scale','harmony']){const c=config({practice:'sequence',pattern,direction,sequenceLogic});verify(c,E.generate(c,8))}
const flow=config({practice:'sequence',sequenceFlow:true});const flowResult=E.generate(flow,8);verify(flow,flowResult);assert.equal(flowResult.bars.at(-1).harmony.name,'↺ 回到起点');
const locked=E.generate(config(),77);locked.bars[1].locked=true;assert.deepEqual(E.generate(config(),98,locked.bars).bars[1],locked.bars[1]);
const low=E.generate(config({mode:'arpeggio',position:'low'}),55),high=E.generate(config({mode:'arpeggio',position:'high'}),55);assert.notDeepEqual(low.bars,high.bars);
for(const range of [[0,4],[5,9],[9,12]]){const c=config({min:range[0],max:range[1],mode:'riff',tuning:'dropD'});verify(c,E.generate(c,90))}
assert.throws(()=>E.generate(config({materials:['rest']}),1));assert.throws(()=>E.generate(config({tempo:0}),1));
const baseline=E.generate(config(),1);for(const link of ['loose','balanced','tight','inverse'])assert.ok(E.drums(config({link}),baseline.bars,33).length>0);
assert.equal(E.time(config({tempo:60}),96),4);assert.equal(E.time(config({tempo:60,meter:'6/8'}),72),2);assert.equal(E.time(config({tempo:60,feel:'swing'}),12),2/3);
console.log('PASS',cases,'generation scenarios; harmony, exact durations, sequences, locks, fret constraints, loop duration');
