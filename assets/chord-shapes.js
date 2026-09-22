(function(){
'use strict';
const tuning=[40,45,50,55,59,64];
const qualities=[
 {id:'major',name:'大三和弦',formula:['R','3','5'],shapes:[['C','C',[null,3,2,0,1,0]],['A','A',[null,0,2,2,2,0]],['G','G',[3,2,0,0,0,3]],['E','E',[0,2,2,1,0,0]],['D','D',[null,null,0,2,3,2]]]},
 {id:'minor',name:'小三和弦',formula:['R','b3','5'],shapes:[['C','Cm',[null,3,1,0,1,3]],['A','Am',[null,0,2,2,1,0]],['G','Gm',[3,1,0,0,3,3]],['E','Em',[0,2,2,0,0,0]],['D','Dm',[null,null,0,2,3,1]]]},
 {id:'dom7',name:'属七和弦',formula:['R','3','5','b7'],shapes:[['C','C7',[null,3,2,3,1,3]],['A','A7',[null,0,2,0,2,0]],['G','G7',[3,2,0,0,0,1]],['E','E7',[0,2,0,1,0,0]],['D','D7',[null,null,0,2,1,2]]]},
 {id:'maj7',name:'大七和弦',formula:['R','3','5','7'],shapes:[['C','Cmaj7',[null,3,2,0,0,0]],['A','Amaj7',[null,0,2,1,2,0]],['G','Gmaj7',[3,2,0,0,0,2]],['E','Emaj7',[0,2,1,1,0,0]],['D','Dmaj7',[null,null,0,2,2,2]]]},
 {id:'min7',name:'小七和弦',formula:['R','b3','5','b7'],shapes:[['C','Cm7',[null,3,1,3,1,3]],['A','Am7',[null,0,2,0,1,0]],['G','Gm7',[3,1,3,3,3,3]],['E','Em7',[0,2,0,0,0,0]],['D','Dm7',[null,null,0,2,1,1]]]},
 {id:'sus2',name:'挂二和弦',formula:['R','2','5'],shapes:[['C','Csus2',[null,3,0,0,1,3]],['A','Asus2',[null,0,2,2,0,0]],['G','Gsus2',[3,0,0,2,3,3]],['E','Esus2',[0,2,4,4,0,0]],['D','Dsus2',[null,null,0,2,3,0]]]},
 {id:'sus4',name:'挂四和弦',formula:['R','4','5'],shapes:[['C','Csus4',[null,3,3,0,1,1]],['A','Asus4',[null,0,2,2,3,0]],['G','Gsus4',[3,3,0,0,1,3]],['E','Esus4',[0,2,2,2,0,0]],['D','Dsus4',[null,null,0,2,3,3]]]},
 {id:'halfdim',name:'半减七和弦',formula:['R','b3','b5','b7'],shapes:[['C','Cm7b5',[null,3,4,3,4,null]],['A','Am7b5',[5,null,5,5,4,null]],['G','Gm7b5',[3,null,3,3,2,null]],['E','Em7b5',[0,null,2,3,3,3]],['D','Dm7b5',[null,5,6,5,6,null]]]},
];
const pitchClasses={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const intervalNames={0:'R',1:'b2',2:'2',3:'b3',4:'3',5:'4',6:'b5',7:'5',8:'#5',9:'6',10:'b7',11:'7'};
const specialCatalog={
 slash:{title:'常用斜杠和弦',subtitle:'斜杠后的音是最低音；用于连接低音线、制造转位与保持共同音。',shapes:[
  ['','C/E',[0,3,2,0,1,0]],['','C/G',[3,3,2,0,1,0]],['','C/B',[null,2,2,0,1,0]],['','Am/E',[0,0,2,2,1,0]],['','Am/G',[3,0,2,2,1,0]],['','Am7/G',[3,0,2,0,1,0]],['','D/F#',[2,0,0,2,3,2]],['','Em/G',[3,2,2,0,0,0]],['','C/F',[1,3,2,0,1,0]],['','G/F',[1,2,0,0,0,3]],['','Am/F',[1,0,2,2,1,0]],['','F/G',[3,3,3,2,1,1]],['','Dm7/G',[3,null,0,2,1,1]],['','Em7/B',[null,2,0,0,0,0]]]},
 extendedSus:{title:'常用挂留和弦',subtitle:'补充常用根音上的 sus2、sus4，以及属七挂四和弦。',shapes:[
  ['','Asus2',[null,0,2,2,0,0]],['','Bsus2',[null,2,4,4,2,2]],['','Csus2',[null,3,0,0,1,3]],['','Dsus2',[null,null,0,2,3,0]],['','Esus2',[0,2,4,4,0,0]],['','Fsus2',[null,null,3,0,1,1]],['','Gsus2',[3,0,0,2,3,3]],
  ['','Asus4',[null,0,2,2,3,0]],['','Bsus4',[null,2,4,4,5,2]],['','Csus4',[null,3,3,0,1,1]],['','Dsus4',[null,null,0,2,3,3]],['','Esus4',[0,2,2,2,0,0]],['','Fsus4',[null,null,3,3,1,1]],['','Gsus4',[3,3,0,0,1,3]],
  ['','G7sus4',[3,3,0,0,1,1]],['','C7sus4',[null,3,3,3,1,1]],['','D7sus4',[null,null,0,2,1,3]],['','B7sus4',[null,2,2,2,0,0]],['','A7sus4',[null,0,2,0,3,0]]]},
 add:{title:'常用加音和弦',subtitle:'在基础三和弦上加入色彩音，保留三音，因此不同于 sus 和弦。',shapes:[
  ['','Cadd9',[null,3,2,0,3,0]],['','Gadd9',[3,2,0,2,0,3]],['','Dadd11',[null,null,0,0,3,2]],['','Eadd9',[0,2,4,1,0,0]],['','Emadd9',[0,2,4,0,0,0]],['','Fadd9',[null,null,3,2,1,3]],['','Fadd9/A',[null,0,3,2,1,3]]]},
 power:{title:'常用强力和弦',subtitle:'强力和弦主要由根音与五音构成，不含三音，适合失真音色与移动把位。',shapes:[
  ['','E5',[0,2,2,null,null,null]],['','F5',[1,3,3,null,null,null]],['','G5',[3,5,5,null,null,null]],['','A5',[null,0,2,2,null,null]],['','B5',[null,2,4,4,null,null]],['','C5',[null,3,5,5,null,null]],['','D5',[null,null,0,2,3,null]]]},
};
function rootPc(name){const match=name.match(/^([A-G])([b#]?)/),base=pitchClasses[match[1]];return (base+(match[2]==='b'?-1:match[2]==='#'?1:0)+12)%12}
function roles(shape){const root=rootPc(shape[1]);return shape[2].map((f,i)=>f===null?null:intervalNames[(tuning[i]+f-root+120)%12])}
function chordDiagram(shape){
 const [form,name,frets]=shape,labels=roles(shape),pressed=frets.filter(f=>f!==null&&f>0),base=Math.max(1,Math.min(...pressed)),start=base>3?base:1,rows=5;
 const width=230,height=278,left=34,top=48,stringGap=32,fretGap=37,x=i=>left+i*stringGap,y=f=>top+(f-start+.5)*fretGap;
 let svg='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+name+' '+form+' 型和弦图"><title>'+name+' · '+form+' 型</title>';
 for(let i=0;i<6;i++)svg+='<text x="'+x(i)+'" y="18" class="cs-string">'+(6-i)+'</text><path d="M '+x(i)+' '+top+' V '+(top+rows*fretGap)+'" class="cs-wire"/>';
 for(let r=0;r<=rows;r++)svg+='<path d="M '+left+' '+(top+r*fretGap)+' H '+x(5)+'" class="cs-fret"/>';
 if(start===1)svg+='<path d="M '+left+' '+top+' H '+x(5)+'" class="cs-nut"/>';else svg+='<text x="4" y="'+(top+fretGap*.65)+'" class="cs-base">'+start+'fr</text>';
 frets.forEach((f,i)=>{
  if(f===null)svg+='<text x="'+x(i)+'" y="39" class="cs-open">×</text>';
  else if(f===0)svg+='<circle cx="'+x(i)+'" cy="34" r="7" class="cs-open-circle"/><text x="'+x(i)+'" y="38" class="cs-open-label">'+labels[i]+'</text>';
  else svg+='<circle cx="'+x(i)+'" cy="'+y(f)+'" r="13" class="'+(labels[i]==='R'?'cs-root':'cs-tone')+'"/><text x="'+x(i)+'" y="'+(y(f)+4)+'" class="cs-dot">'+labels[i]+'</text>';
 });
 return svg+'</svg>';
}
function quality(id){return qualities.find(q=>q.id===id)}
function transposeShape(shape,semitones,name){return [shape[0],name,shape[2].map(f=>f===null?null:f+semitones)]}
function toRoot(shape,target,name){return transposeShape(shape,(target-rootPc(shape[1])+12)%12,name)}
function shapeCenter(shape){const frets=shape[2].filter(f=>f!==null);return frets.reduce((a,b)=>a+b,0)/frets.length}
function card(shape,formula){return '<article class="cs-card"><header><h3>'+shape[1]+'</h3><span class="cs-formula">'+formula.join(' · ')+'</span></header>'+chordDiagram(shape)+'</article>'}
function matrix(title,subtitle,rows,columns){
 const cells=rows.map(row=>'<div class="cs-row-title"><b>'+row.title+'</b><span>'+row.caption+'</span></div>'+row.shapes.map((shape,i)=>card(shape,columns[i].formula)).join('')).join('');
 return '<section class="cs-book-section"><div class="cs-book-title"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div><div class="cs-matrix-wrap"><div class="cs-matrix" style="--cs-columns:'+columns.length+'"><div class="cs-corner">把位 / 型</div>'+columns.map(c=>'<div class="cs-column-title"><b>'+c.title+'</b><span>'+c.formula.join(' · ')+'</span></div>').join('')+cells+'</div></div></section>';
}
function catalogSection(section){return '<section class="cs-book-section"><div class="cs-book-title"><div><h2>'+section.title+'</h2><p>'+section.subtitle+'</p></div></div><div class="cs-catalog">'+section.shapes.map(shape=>card(shape,Array.from(new Set(roles(shape).filter(Boolean))))).join('')+'</div></section>'}
function cagedRows(ids){
 const columns=ids.map(id=>quality(id));
 const names={major:'C',minor:'Cm',maj7:'Cmaj7',dom7:'C7',min7:'Cm7',halfdim:'Cø7',sus2:'Csus2',sus4:'Csus4'};
 const rows=['C','A','G','E','D'].map((form,index)=>({title:form+' 型',caption:'C 根音',shapes:columns.map(q=>toRoot(q.shapes[index],0,names[q.id]))}));
 return {columns:columns.map(q=>({title:q.name,formula:q.formula})),rows};
}
function fullFretboardRows(){
 const chords=[
  {title:'C',pc:0,id:'major'},{title:'Dm7',pc:2,id:'min7'},{title:'Em7',pc:4,id:'min7'},
  {title:'F',pc:5,id:'major'},{title:'G',pc:7,id:'major'},{title:'Am7',pc:9,id:'min7'},{title:'Bø7',pc:11,id:'halfdim'}
 ];
 const candidates=chords.map(chord=>quality(chord.id).shapes.map(shape=>toRoot(shape,chord.pc,chord.title)).sort((a,b)=>shapeCenter(a)-shapeCenter(b)));
 const rows=Array.from({length:5},(_,i)=>({title:'第 '+(i+1)+' 把位',caption:'约 '+Math.round(candidates.reduce((n,list)=>n+shapeCenter(list[i]),0)/candidates.length)+' 品',shapes:candidates.map(list=>list[i])}));
 return {columns:chords.map(c=>({title:c.title,formula:quality(c.id).formula})),rows};
}
function render(panel,view){
 const full=fullFretboardRows(),core=cagedRows(['major','minor','maj7','dom7','min7','halfdim']),sus=cagedRows(['sus2','sus4']);
 const sections={full:matrix('全指板和弦终极练习','按把位横向练习 C 大调调内和弦；同一行尽量保持左手在相近区域。',full.rows,full.columns),caged:matrix('CAGED 所有和弦指型','每一行固定一种 CAGED 外形，横向比较同根音 C 的不同和弦性质。',core.rows,core.columns),sus:matrix('CAGED 挂留和弦','单独比较 sus2 与 sus4；它们用 2 或 4 替代三音。',sus.rows,sus.columns),special:Object.values(specialCatalog).map(catalogSection).join('')};
 panel.querySelector('#csGroups').innerHTML=view==='all'?sections.full+sections.caged+sections.sus+sections.special:sections[view];
}
function init(){
 const nav=document.createElement('button');nav.id='navChordShapes';nav.type='button';nav.textContent='常用和弦指型';nav.title='常用和弦指型';document.querySelector('.tool-nav').append(nav);
 const panel=document.createElement('section');panel.id='chordShapesPanel';panel.hidden=true;document.querySelector('#knowledgePanel').after(panel);
 panel.innerHTML='<section class="card cs-intro"><div><h2>常用和弦指型</h2><p>参照书页按标题和矩阵排布。从上往下看品位，从左到右为 6 弦到 1 弦；红色 R 是根音，蓝色圆点标注其他音程。</p></div><label>练习章节<select id="csFilter"><option value="all">全部章节</option><option value="full">全指板和弦终极练习</option><option value="caged">CAGED 所有和弦指型</option><option value="sus">CAGED 挂留和弦</option><option value="special">常用特殊和弦</option></select></label></section><div id="csGroups"></div>';
 const filter=panel.querySelector('#csFilter');filter.onchange=()=>render(panel,filter.value);render(panel,'all');nav.onclick=()=>showTool('chordShapes');
}
globalThis.ChordShapes={init,qualities,specialCatalog,roles,chordDiagram,toRoot,cagedRows,fullFretboardRows};
})();
