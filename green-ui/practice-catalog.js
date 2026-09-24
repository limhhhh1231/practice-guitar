(function(root){
  'use strict';
  const E=root.GrooveEngine;
  const scales={major:'Ionian · 大调',minor:'Aeolian · 自然小调',dorian:'Dorian · 多利亚',mixolydian:'Mixolydian · 混合利底亚',phrygian:'Phrygian · 弗里几亚',lydian:'Lydian · 利底亚',locrian:'Locrian · 洛克里亚',majorPent:'Major Pentatonic · 大调五声',minorPent:'Minor Pentatonic · 小调五声',blues:'Blues · 布鲁斯'};
  const styles={funk:'Funk',rock:'Rock',motown:'Motown',rnb:'R&B / Neo Soul',reggae:'Reggae',jazz:'Jazz Swing',bossa:'Bossa Nova'};
  const materials={whole:'全音符',half:'二分音符',quarter:'四分音符',eighth:'八分音符',sixteenth:'十六分音符','dotted-half':'附点二分','dotted-quarter':'附点四分','dotted-eighth':'附点八分','half-triplet':'二分三连音','quarter-triplet':'四分三连音','eighth-triplet':'八分三连音','sixteenth-triplet':'十六分三连音',tie:'跨拍延音',shuffle:'Shuffle',sync:'十六分切分','332':'3-3-2 分组',rest:'休止'};
  const degrees={major:['1','2','3','4','5','6','7'],minor:['1','2','♭3','4','5','♭6','♭7'],dorian:['1','2','♭3','4','5','6','♭7'],mixolydian:['1','2','3','4','5','6','♭7'],phrygian:['1','♭2','♭3','4','5','♭6','♭7'],lydian:['1','2','3','♯4','5','6','7'],locrian:['1','♭2','♭3','4','♭5','♭6','♭7'],majorPent:['1','2','3','5','6'],minorPent:['1','♭3','4','5','♭7'],blues:['1','♭3','4','♭5','5','♭7']};
  const parentScale=scale=>E.scales[scale].length===7?scale:scale==='majorPent'?'major':'minor';
  function chord(scale,key,degree){return E.harmony({...E.defaults,scale,key,voicing:'seventh'},degree);}
  function degree(scale,interval){return degrees[scale][E.scales[scale].indexOf(E.mod(interval))]||['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'][E.mod(interval)];}
  const api={scales,styles,materials,degrees,parentScale,chord,degree};
  root.PracticeCatalog=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
