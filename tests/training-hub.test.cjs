// DOM-independent controller integration test. This is not a visual browser test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.GrooveEngine=require('../green-ui/groove-engine');global.PracticeCatalog=require('../green-ui/practice-catalog');
const E=global.GrooveEngine,C=global.PracticeCatalog,T=require('../green-ui/training-engine'),G=require('../green-ui/ear-engine');
let now=0,stored=null,interval,loaded=null,freeEar={question:G.generate({key:0},99),settings:G.defaults};
const elements=new Map(),listeners={};
function element(id=''){
 const el={id,hidden:false,value:'',checked:false,textContent:'',classList:{toggle(){},contains(){return false}},events:{},addEventListener(name,fn){this.events[name]=fn;},setAttribute(){},prepend(){},append(){},after(){},scrollIntoView(){},replaceChildren(){},click(){this.onclick?.();}};
 Object.defineProperty(el,'innerHTML',{get(){return this.html||'';},set(html){this.html=html;for(const m of html.matchAll(/id="([^"]+)"/g))if(!elements.has(m[1]))elements.set(m[1],element(m[1]));}});return el;
}
for(const id of ['thMinutes','thFocus','thDifficulty','thPrioritize','thFeedback','etRatingStatus','tmStatus','connectionPanel','earPanel','rhythmPanel','motifDevelopment'])elements.set(id,element(id));
const doc={hidden:false,body:element(),createElement(){const e=element();Object.defineProperty(e,'id',{get(){return this._id||'';},set(id){this._id=id;elements.set(id,this);}});return e;},getElementById:id=>elements.get(id),querySelector:()=>element(),querySelectorAll(selector){return selector.includes('training-pool')?[{value:'dorian',checked:true},{value:'major',checked:true}]:[];},addEventListener:(n,fn)=>{(listeners[n]??=[]).push(fn);}};
const context={console,TrainingEngine:T,GrooveEngine:E,PracticeCatalog:C,EarEngine:G,performance:{now:()=>now},document:doc,localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;}},matchMedia:()=>({matches:false}),setInterval:f=>{interval=f;},setTimeout:()=>1,window:{addEventListener(){}},confirm:()=>true,stopArpeggio(){},TrainingStudio:{openMotif(){},stop(){},navigate(){},refreshFavorites(){},snapshot:()=>null,load:(kind,v)=>{loaded={kind,data:T.clone(v)};}},EarTraining:{stop(){},snapshot:()=>freeEar,load:v=>{freeEar=T.clone(v);loaded={kind:'ear',data:T.clone(v)};}},GuitarGroove:{stop(){},snapshot:()=>({config:E.defaults,result:E.generate(E.defaults,17)}),loadTask:v=>{loaded={kind:'rhythm',data:T.clone(v)};}}};
context.TrainingEngine={...T,Timer:class extends T.Timer{constructor(){super(()=>now);}}};
context.showTool=tool=>context.TrainingHub.navigate(tool);context.globalThis=context;
vm.createContext(context);vm.runInContext(fs.readFileSync('green-ui/training-hub.js','utf8'),context);context.TrainingHub.init();
const el=id=>elements.get(id),get=()=>JSON.parse(stored),active=()=>get().plans.flatMap(p=>p.tasks).find(t=>t.id===get().activeId);
el('thMinutes').value='20';el('thFocus').value='all';el('thDifficulty').value='easy';el('thGenerate').onclick();
let plan=get().plans[0];assert.equal(plan.tasks.length,4);assert.ok(plan.tasks.every(t=>['major','dorian'].includes(t.params.scale)));
function action(type,t){el('todayPanel').events.click({target:{closest:()=>({dataset:{taskAction:type,task:t.id}})}});}
function dock(action){el('trainingTaskDock').events.click({target:{closest:()=>({dataset:{dock:action}})}});}
action('start',plan.tasks[0]);assert.equal(loaded.kind,'connection');const first=T.clone(loaded.data);assert.equal(active().status,'doing');
now+=5000;interval();context.showTool('knowledge');assert.equal(active().elapsed,5000);now+=120000;interval();assert.equal(active().elapsed,5000);
dock('return');assert.deepEqual(loaded.data,first);now+=2000;context.TrainingHub.step('connection');assert.equal(active().progress,1);assert.equal(active().elapsed,7000);
context.TrainingHub.deviate('connection');assert.equal(context.TrainingHub.step('connection'),false);assert.equal(active().progress,1);dock('return');assert.deepEqual(loaded.data,first);
context.TrainingHub.step('connection');context.TrainingHub.step('connection');el('thFeedback').value='good';dock('complete');assert.equal(get().plans[0].tasks[0].status,'done');assert.equal(get().activeId,null);
action('start',plan.tasks[1]);assert.equal(loaded.kind,'ear');const q=loaded.data.question;const record={...loaded.data,question:q,rating:'difficult',rated:true};context.TrainingHub.rateEar(record);assert.equal(active().progress,1);context.TrainingHub.rateEar(record);assert.equal(active().progress,1);assert.equal(get().reviews.length,1);
context.showTool('daily');const earBefore=T.clone(active().snapshot);action('start',active());assert.deepEqual(loaded.data,earBefore);
action('start',plan.tasks[2]);assert.equal(loaded.kind,'motif');let motif=T.clone(loaded.data);const b=T.vary(motif.a,'ending',900);motif.b=b;context.TrainingHub.exerciseChanged('motif',motif);assert.deepEqual(active().snapshot,motif);context.TrainingHub.step('motif','same-variation');context.TrainingHub.step('motif','same-variation');assert.equal(active().progress,1);context.showTool('daily');action('start',active());assert.deepEqual(loaded.data,motif);
action('start',plan.tasks[3]);assert.equal(loaded.kind,'rhythm');const groove=T.clone(loaded.data);context.showTool('daily');action('start',active());assert.deepEqual(loaded.data,groove);
now+=3100;doc.hidden=true;listeners.visibilitychange.forEach(fn=>fn());const paused=active().elapsed;now+=100000;interval();assert.equal(active().elapsed,paused);
T.validateBackup(get());
// Reload restores the active task paused, and requires restoring its exact content.
vm.runInContext(fs.readFileSync('green-ui/training-hub.js','utf8'),context);context.TrainingHub.init();assert.equal(context.TrainingHub.activeKind,false);now+=90000;interval();assert.equal(active().elapsed,paused);dock('return');assert.deepEqual(loaded.data,groove);
// Regression: skipping an earlier task must not poison routing for later tasks.
context.showTool('daily');el('thGenerate').onclick();plan=get().plans.at(-1);
action('skip',plan.tasks[0]);assert.equal(get().plans.at(-1).tasks[0].status,'skipped');assert.equal(get().activeId,null);
action('start',plan.tasks[1]);assert.equal(loaded.kind,'ear');assert.equal(active().id,plan.tasks[1].id);assert.equal(active().status,'doing');
action('skip',plan.tasks[1]);assert.equal(get().plans.at(-1).tasks[1].status,'skipped');assert.equal(get().activeId,null);
action('start',plan.tasks[2]);assert.equal(loaded.kind,'motif');assert.equal(active().id,plan.tasks[2].id);
action('skip',plan.tasks[3]);assert.equal(active().id,plan.tasks[2].id);assert.equal(get().plans.at(-1).tasks[3].status,'skipped');
console.log('PASS task routing, exact snapshots, skip-to-next regression, free-practice restore, pause/background/reload, self-rating deduplication, motif preservation and backup round trip.');
