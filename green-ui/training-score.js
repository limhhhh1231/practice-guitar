(function(root){
  'use strict';
  const E=root.GrooveEngine,C=root.PracticeCatalog;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Actual MIDI/string/fret events drive both the score and audio; no decorative notes.
  function render(q,{from=0,to=q.totalTicks,original=null,notation='movable',view='tab',id='score'}={}){
    const span=to-from,beats=span/24,width=Math.max(360,beats*70+54),height=272,left=40,right=22,lane=(width-left-right)/beats;
    const x=t=>left+(t-from)/24*lane,y=s=>52+(s-1)*34;
    const degree=midi=>notation==='fixed'?['1','♭2','2','♭3','3','4','♯4','5','♭6','6','♭7','7'][E.mod(midi)]:C.degree(q.scale,midi-q.key);
    const previous=original?.events.filter(e=>!e.rest)||[];let ni=0;
    const events=q.events.map((e,index)=>({e,index,old:e.rest?null:previous[ni++]})).filter(({e})=>e.start<to&&e.start+e.duration>from);
    const marks=events.filter(({e})=>!e.rest).map(({e,index,old})=>{
      const changed=old&&(old.start!==e.start||old.duration!==e.duration||old.note.midi!==e.note.midi),rootNote=E.mod(e.note.midi)===(q.chord?.root??q.harmonies?.[e.chordIndex]?.root??q.key),pos=x(Math.max(from,e.start))+Math.min(lane*.3,18);
      const note=E.names[E.mod(e.note.midi)]+(Math.floor(e.note.midi/12)-1),label=view==='pitch'?note:e.note.fret;
      return `<g class="ts-note ${rootNote?'ts-root':''} ${changed?'ts-changed':''} ${e.target?'ts-target':''}" data-score-event="${index}" transform="translate(${pos},${y(e.note.string)})"><title>${esc(note+' · '+degree(e.note.midi)+' · '+e.note.string+'弦 '+e.note.fret+'品 · 第 '+((e.start-from)/24+1)+' 拍 · '+e.duration/24+' 拍长'+(e.target?' · '+e.target:''))}</title><rect x="-17" y="-15" width="34" height="29" rx="4"/><text text-anchor="middle" y="4">${esc(label)}</text><text class="ts-degree" text-anchor="middle" y="26">${esc(degree(e.note.midi))}</text><path class="ts-length" d="M0 17h${Math.max(5,Math.min(e.duration,to-e.start)/24*lane-12)}"/></g>`;
    }).join('');
    let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="六线谱，一弦在上六弦在下；数字为${view==='pitch'?'音名':'品位'}，下方为简谱"><g class="ts-beats">`;
    for(let b=0;b<beats;b++)svg+=`<text x="${left+b*lane+16}" y="19">${b+1}</text><path d="M${left+b*lane} 28V232"/>`;
    svg+='</g>';
    for(let s=1;s<=6;s++)svg+=`<text class="ts-string" x="4" y="${y(s)+4}">${s}弦</text><path class="ts-wire" d="M${left} ${y(s)}H${width-right}"/>`;
    svg+=marks+`<text class="ts-caption" x="${left}" y="264">横线长度 = 时值 · 蓝色 = 根音 · 亮框 = 变化 / 目标音</text></svg>`;
    return `<div class="training-tab" data-score-id="${esc(id)}">${svg}</div>`;
  }
  root.TrainingScore={render};if(typeof module!=='undefined')module.exports=root.TrainingScore;
})(globalThis);
