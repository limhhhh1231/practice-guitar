const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('green-ui/groove-app.js','utf8');
const E=require('../green-ui/groove-engine.js');
function extract(name,next){return code.slice(code.indexOf('function '+name+'('),code.indexOf('function '+next+'('));}
for(const meter of ['4/4','3/4','6/8','5/4']){
 const config={...E.defaults,meter},notes=[{midi:60,role:'root',string:2,fret:1}];
 const bars=Array.from({length:4},(_,bar)=>({events:[{notes,start:0,duration:24,velocity:1}]}));
 const state={playing:true,audio:{currentTime:0},config,result:{bars,drums:bars.map((_,bar)=>({bar,track:'kick',start:0,velocity:1}))},buffers:new Map([['d-kick',{}]]),nextCycle:1,loop:true};
 const practice={a:1,b:2,alternate:true,cycle:0};const played=[],clicks=[];
 const context={state,practice,E,B:{drums:{kick:{ratio:1}}},nearestSample:()=>({buffer:'guitar',root:60}),source:(...args)=>played.push(args),clickBeat:(...args)=>clicks.push(args),setTimeout:()=>1,stop:()=>{}};
 vm.createContext(context);vm.runInContext(extract('range','read').split('function setup')[0],context);
 vm.runInContext(extract('schedule','clickBeat'),context);
 context.schedule();assert.equal(played.filter(x=>x[0]==='guitar').length,2);assert.equal(played.filter(x=>x[5]==='drum').length,2);
 const barSec=E.time(config,E.ticks(config));assert.equal(state.nextCycle,1+barSec*2);
 assert.equal(clicks.length,meter==='6/8'?4:Number(meter[0])*2);
 played.length=0;context.schedule();assert.equal(played.filter(x=>x[0]==='guitar').length,0);assert.equal(played.filter(x=>x[5]==='drum').length,2);
 assert.equal(practice.cycle,2);
}
console.log('PASS practice range scheduling, listen/play alternation and metronome in four meters');
