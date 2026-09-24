const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('green-ui/index.html','utf8');
const script=source.slice(source.indexOf("const chrom="),source.indexOf("['root','mode','display','notation']"));
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',classList:{toggle(){},contains(){return false}}});return elements.get(id)},querySelectorAll(){return []}};
const E=require('../green-ui/groove-engine.js');global.GrooveEngine=E;const C=require('../green-ui/practice-catalog.js');
const ctx={document,GrooveEngine:E,PracticeCatalog:C};vm.createContext(ctx);vm.runInContext(script,ctx);
function run(code){return vm.runInContext(code,ctx)}
const opens=[4,11,7,2,9,4],names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
let cases=0;
for(const mode of ['major','minor','dorian','mixolydian'])for(let root=0;root<12;root++)for(const notation of ['fixed','movable'])for(let chord=-1;chord<7;chord++){
 run(`state={root:${root},mode:'${mode}',notation:'${notation}',display:'scale',start:0,end:12,only:true,chord:${chord}};render()`);
 const scale=Array.from(run('modes[state.mode].interval.map(x=>(state.root+x)%12)'));
 const tones=chord<0?[]:Array.from(run('currentHarmony().pcs'));
 const html=elements.get('notes').innerHTML;
 for(let string=1;string<=6;string++)for(let fret=1;fret<=12;fret++){
  const pc=(opens[string-1]+fret)%12;
  const match=html.match(new RegExp(`<div class="([^"]+)" style="grid-column:${fret};grid-row:${string}" title="([^"]+)"`));
  assert.equal(Boolean(match),scale.includes(pc),`${string} string ${fret} fret`);
  if(match){assert.ok(match[2].startsWith(names[pc]+' ·'));assert.equal(match[1].includes('chord'),tones.includes(pc));assert.equal(match[1].includes('root'),pc===(chord<0?root:scale[chord]));}
 }
 for(let string=1;string<=6;string++)assert.ok(elements.get('openNotes').innerHTML.includes(`grid-row:${string}" title="${names[opens[string-1]]} · 空弦`));
 cases++;
}
run("state={root:0,mode:'major',notation:'fixed',display:'scale',start:0,end:12,only:true,chord:-1};render()");
assert.ok(elements.get('notes').innerHTML.includes('grid-column:3;grid-row:5" title="C · 简谱 1"'));
assert.ok(!elements.get('notes').innerHTML.includes('grid-column:1;grid-row:5'));
console.log(`PASS ${cases} arpeggio renders; all strings, frets, roots, modes and chord highlights`);
