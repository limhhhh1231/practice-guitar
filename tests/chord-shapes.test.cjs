const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/chord-shapes.js','utf8'),context);
const {qualities,specialCatalog,roles,chordDiagram,cagedRows,fullFretboardRows}=context.ChordShapes;
assert.equal(qualities.length,8);
assert.equal(qualities.reduce((n,q)=>n+q.shapes.length,0),40);
for(const quality of qualities)for(const shape of quality.shapes){
 const actual=Array.from(new Set(roles(shape).filter(Boolean)));
 assert.deepEqual(new Set(actual),new Set(quality.formula),`${shape[1]} must contain exactly ${quality.formula.join(', ')}`);
 const svg=chordDiagram(shape);
 assert.ok(svg.includes('6 弦到 1 弦')===false);
 assert.ok(svg.includes('<svg'));
}
const caged=cagedRows(['major','minor','maj7','dom7','min7','halfdim']);
assert.equal(caged.rows.length,5);
assert.equal(caged.columns.length,6);
for(const row of caged.rows)row.shapes.forEach((shape,i)=>assert.deepEqual(new Set(roles(shape).filter(Boolean)),new Set(caged.columns[i].formula)));
const full=fullFretboardRows();
assert.equal(full.rows.length,5);
assert.equal(full.columns.length,7);
for(const row of full.rows)row.shapes.forEach((shape,i)=>assert.deepEqual(new Set(roles(shape).filter(Boolean)),new Set(full.columns[i].formula)));
assert.equal(Object.values(specialCatalog).reduce((n,section)=>n+section.shapes.length,0),47);
for(const section of Object.values(specialCatalog))for(const shape of section.shapes){
 const labels=roles(shape).filter(Boolean);
 assert.ok(labels.includes('R'),`${shape[1]} must contain its named root`);
 assert.ok(chordDiagram(shape).includes(shape[1]));
}
assert.deepEqual(Array.from(new Set(roles(specialCatalog.slash.shapes[0]).filter(Boolean))),['3','R','5']);
console.log('PASS 40 common chord shapes and interval labels');
