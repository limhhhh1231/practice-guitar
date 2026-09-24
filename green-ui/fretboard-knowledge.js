(function(){
'use strict';
const intervals=[['纯一度','1',0],['小二度','♭2',1],['大二度','2',2],['小三度','♭3',3],['大三度','3',4],['纯四度','4',5],['增四度 / 减五度','♯4 / ♭5',6],['纯五度','5',7],['小六度','♭6',8],['大六度','6',9],['小七度','♭7',10],['大七度','7',11],['纯八度','8',12]];
const tuning=[64,59,55,50,45,40],names=['E4','B3','G3','D3','A2','E2'];
const tableIntervals=intervals.flatMap((row,i)=>i===6?[['增四度','♯4',6,4],['减五度','♭5',6,5]]:[[...row,[1,2,2,3,3,4,4,5,6,6,7,7,8][i]]]);
function consonance(semitones){return [0,12].includes(semitones)?'极完全协和':[5,7].includes(semitones)?'完全协和':[3,4,8,9].includes(semitones)?'不完全协和':'不协和'}
function intervalPairs(semitones,degree){
 const natural=[0,2,4,5,7,9,11];
 return natural.map((pitch,i)=>{const target=i+degree-1,octave=Math.floor(target/7),letter=target%7,alter=pitch+semitones-(natural[letter]+12*octave);return (i+1)+'–'+(alter<0?'♭'.repeat(-alter):'♯'.repeat(alter))+(letter+1)+(octave?'↑':'')});
}
function installIntervalTable(panel){
 const section=panel.querySelector('.ik-section');
 section.innerHTML='<h2>常见音程关系</h2><p>以 C 大调音高为参照：1=C、2=D…7=B。每行枚举从七个自然音向上构建的音程；♯ / ♭ 为升降半音，↑ 表示进入高八度。音程名称同时取决于音级跨度和半音数，因此增四度与减五度分开列出。</p><div class="ik-controls"><label>音程独显<select id="ikIntervalFilter"><option value="all">全部音程</option>'+tableIntervals.map((r,i)=>'<option value="'+i+'">'+r[0]+'</option>').join('')+'</select></label><label>协和程度<select id="ikConsonanceFilter"><option value="all">全部类别</option>'+['极完全协和','完全协和','不完全协和','不协和'].map(n=>'<option>'+n+'</option>').join('')+'</select></label><button type="button" class="btn" id="ikClearFilters">显示全部</button></div><p id="ikTableCount" role="status"></p><div class="ik-table-wrap"><table class="ik-interval-table"><thead><tr><th scope="col">音程</th><th scope="col">标记</th><th scope="col">半音数</th><th scope="col">常见音级距离（七个起音）</th><th scope="col">协和程度</th></tr></thead><tbody id="ikIntervalRows"></tbody></table></div><p class="ik-tip">采用基础乐理的细分口径：纯一度、纯八度为极完全协和；纯四度、纯五度为完全协和；大小三度、大小六度为不完全协和。部分教材将前两类合称“完全协和”。纯四度在传统和声中相对低音时常作不协和处理；协和程度也受音区、音色和音乐语境影响。</p>';
 const interval=document.getElementById('ikIntervalFilter'),category=document.getElementById('ikConsonanceFilter');
 function filter(){const rows=tableIntervals.filter((r,i)=>(interval.value==='all'||+interval.value===i)&&(category.value==='all'||category.value===consonance(r[2])));document.getElementById('ikIntervalRows').innerHTML=rows.map(([n,l,v,d])=>'<tr><th scope="row">'+n+'</th><td>'+l+'</td><td>'+v+'</td><td><div class="ik-pairs">'+intervalPairs(v,d).map(pair=>'<span>'+pair+'</span>').join('')+'</div></td><td><span class="ik-consonance ik-consonance-'+({极完全协和:'perfect',完全协和:'stable',不完全协和:'soft',不协和:'tense'}[consonance(v)])+'">'+consonance(v)+'</span></td></tr>').join('')||'<tr><td colspan="5">没有符合两个筛选条件的音程，可点击“显示全部”重置。</td></tr>';document.getElementById('ikTableCount').textContent='显示 '+rows.length+' / '+tableIntervals.length+' 种音程（筛选仅影响此表）'}
 interval.onchange=category.onchange=filter;document.getElementById('ikClearFilters').onclick=()=>{interval.value=category.value='all';filter()};filter();
}
function targetFret(rootString,targetString,rootFret,semitones){return tuning[rootString-1]+rootFret+semitones-tuning[targetString-1]}
function diagram(rs,ts,rf,tf,label){
 const lo=Math.max(0,Math.min(rf,tf)-1),hi=Math.max(lo+5,rf+1,tf+1),width=480,left=58,step=(width-left-22)/(hi-lo+1),x=f=>left+(f-lo+.5)*step,y=s=>35+(s-1)*25;
 let svg='<svg viewBox="0 0 480 186" role="img" aria-label="'+rs+' 弦 '+rf+' 品到 '+ts+' 弦 '+tf+' 品"><title>'+rs+' 弦 '+rf+' 品 → '+ts+' 弦 '+tf+' 品</title>';
 for(let f=lo;f<=hi;f++)svg+='<text x="'+x(f)+'" y="17" class="ik-fret">'+f+'</text><path d="M '+(left+(f-lo)*step)+' 26 V 169" class="ik-wire"/>';
 for(let s=1;s<=6;s++)svg+='<text x="4" y="'+(y(s)+4)+'" class="ik-string">'+s+' '+names[s-1].replace(/[0-9]/g,'')+'</text><path d="M '+left+' '+y(s)+' H 463" class="ik-wire"/>';
 svg+='<path d="M '+x(rf)+' '+y(rs)+' L '+x(tf)+' '+y(ts)+'" class="ik-link"/>';
 for(const [s,f,text,color]of [[rs,rf,'1','#4aa8ff'],[ts,tf,label,'#ef9b65']])svg+='<circle cx="'+x(f)+'" cy="'+y(s)+'" r="11" fill="'+color+'"/><text x="'+x(f)+'" y="'+(y(s)+4)+'" class="ik-dot">'+text+'</text>';
 return svg+'</svg>';
}
function openStringDiagram(){
 const x=f=>116+f*75,y=s=>43+(s-1)*32;
 let svg='<svg class="ik-open-board" viewBox="0 0 760 220" role="img" aria-label="标准调弦六根空弦：6 到 5、5 到 4、4 到 3、2 到 1 为纯四度；3 到 2 为大三度"><title>六弦标准调弦空弦音程</title>';
 for(let f=0;f<=5;f++)svg+='<text x="'+x(f)+'" y="20" class="ik-fret">'+f+' 品</text><path d="M '+(x(f)+37)+' 31 V 207" class="ik-wire"/>';
 for(let s=1;s<=6;s++)svg+='<text x="8" y="'+(y(s)+5)+'" class="ik-string">'+s+' 弦 '+names[s-1]+'</text><path d="M 98 '+y(s)+' H 570" class="ik-wire"/><circle cx="'+x(0)+'" cy="'+y(s)+'" r="12" fill="#4aa8ff"/><text x="'+x(0)+'" y="'+(y(s)+4)+'" class="ik-dot">'+names[s-1].replace(/[0-9]/g,'')+'</text>';
 for(let s=6;s>=2;s--)svg+='<path d="M 588 '+y(s)+' V '+y(s-1)+'" class="ik-link"/><text x="605" y="'+((y(s)+y(s-1))/2+4)+'" class="ik-open-interval">'+(s===3?'大三度 · 4 半音':'纯四度 · 5 半音')+'</text>';
 return svg+'</svg>';
}
const maxFretSpan=5;
const shapeColors=['#55b8ff','#ff9f6e','#65d6a6','#ffd166','#d99cff','#ff82b2','#79d8dc','#b6df6a'];
function practicalShapes(rootFret,semitones){
 const shapes=[];
 for(let root=6;root>=1;root--)for(let target=root;target>=1;target--){
  const fret=targetFret(root,target,rootFret,semitones);
  if(fret>=0&&fret<=12&&Math.abs(fret-rootFret)<=maxFretSpan)shapes.push({root,target,fret,span:Math.abs(fret-rootFret)});
 }
 return shapes;
}
function uniqueShapes(shapes,rootFret){
 const seen=new Set();
 return shapes.filter(shape=>{
  const key=(shape.root-shape.target)+':'+(shape.fret-rootFret);
  if(seen.has(key))return false;
  seen.add(key);
  return true;
 });
}
function staggerShapes(shapes,rootFret,semitones){
 const occupied=new Set(),placed=[];
 for(const shape of [...shapes].sort((a,b)=>b.span-a.span)){
  let choice;
  for(const limit of [12,18]){
   const candidates=Array.from({length:limit+1},(_,f)=>({rootFret:f,targetFret:targetFret(shape.root,shape.target,f,semitones)}))
    .filter(({targetFret:f})=>f>=0&&f<=limit)
    .sort((a,b)=>Math.abs(a.rootFret-rootFret)-Math.abs(b.rootFret-rootFret)||a.rootFret-b.rootFret);
   choice=candidates.find(({rootFret:r,targetFret:t})=>!occupied.has(shape.root+':'+r)&&!occupied.has(shape.target+':'+t));
   if(choice)break;
  }
  if(!choice)throw new Error('Cannot place interval shape on the board');
  occupied.add(shape.root+':'+choice.rootFret);
  occupied.add(shape.target+':'+choice.targetFret);
  placed.push({...shape,...choice});
 }
 return placed;
}
function combinedDiagram(shapes,label,semitones,rootFret){
 const placed=staggerShapes(shapes,rootFret,semitones),last=Math.max(12,...placed.flatMap(x=>[x.rootFret,x.targetFret]));
 const step=58,left=74,width=left+(last+1)*step+18,x=f=>left+(f+.5)*step,y=s=>42+(s-1)*38;
 let svg='<svg viewBox="0 0 '+width+' 244" role="img" aria-label="'+semitones+' 半音的 '+shapes.length+' 种六弦指型"><title>'+semitones+' 半音：每种颜色代表一种结构，1 为起音，'+label+' 为目标音</title>';
 for(let f=0;f<=last;f++)svg+='<text x="'+x(f)+'" y="19" class="ik-fret">'+f+'</text><path d="M '+(left+f*step)+' 28 V 235" class="ik-wire"/>';
 for(let s=1;s<=6;s++)svg+='<text x="5" y="'+(y(s)+5)+'" class="ik-string">'+s+' '+names[s-1].replace(/[0-9]/g,'')+'</text><path d="M '+left+' '+y(s)+' H '+(width-18)+'" class="ik-wire"/>';
 placed.forEach(({root,target,rootFret:r,targetFret:t},i)=>svg+='<path d="M '+x(r)+' '+y(root)+' L '+x(t)+' '+y(target)+'" class="ik-link" style="stroke:'+shapeColors[i%shapeColors.length]+'"/>');
 placed.forEach(({root,target,rootFret:r,targetFret:t},i)=>{
  const color=shapeColors[i%shapeColors.length];
  for(const [s,f,text]of [[root,r,'1'],[target,t,label]])svg+='<circle cx="'+x(f)+'" cy="'+y(s)+'" r="12" fill="'+color+'"/><text x="'+x(f)+'" y="'+(y(s)+4)+'" class="ik-dot">'+text+'</text>';
 });
 return svg+'</svg>';
}
function shapeCard(name,label,semitones,rs,ts,rf,kind){
 const tf=targetFret(rs,ts,rf,semitones),valid=tf>=0;
 return '<article class="ik-card"><div class="ik-card-head"><h3>'+name+'</h3><span>'+semitones+' 半音</span></div>'+ (kind?'<p class="ik-shape-kind">'+kind+'</p>':'')+(valid?diagram(rs,ts,rf,tf,semitones===6?'♭5':semitones===12?'8':label):'<div class="ik-unavailable">当前组合需负品位，请提高起音品位</div>')+'<p>'+rs+' 弦 '+rf+' 品 → '+ts+' 弦 '+tf+' 品'+(valid&&tf===0?'（空弦）':'')+'</p></article>';
}
function typicalShapes(rootFret){return intervals.slice(1).map(([name,label,semitones])=>{const shapes=uniqueShapes(practicalShapes(rootFret,semitones),rootFret);return '<section class="ik-shape-group"><h3>'+name+' <small>'+semitones+' 半音 · '+shapes.length+' 种典型结构</small></h3>'+(shapes.length?'<div class="ik-combined-board">'+combinedDiagram(shapes,semitones===6?'♭5':label,semitones,rootFret)+'</div>':'<p class="ik-unavailable">当前起音品位没有符合跨度限制的指型，可调整起音品位。</p>')+'</section>'}).join('')}
function init(){
 const nav=document.createElement('button');nav.id='navKnowledge';nav.type='button';nav.textContent='指板知识';nav.title='指板知识';document.querySelector('.tool-nav').append(nav);
 const panel=document.createElement('section');panel.id='knowledgePanel';panel.hidden=true;document.querySelector('#rhythmPanel').after(panel);
 panel.innerHTML='<section class="card ik-section"><h2>常见音程关系</h2><p>音程是两个音之间的距离。下面的数字是相对起音的音程标记，不是固定调简谱；1 表示起音。</p><div class="ik-table-wrap"><table><thead><tr><th>音程</th><th>标记</th><th>半音数</th><th>C 起音示例</th></tr></thead><tbody>'+intervals.map(([n,l,v],i)=>'<tr><td>'+n+'</td><td>'+l+'</td><td>'+v+'</td><td>C → '+['C','D♭','D','E♭','E','F','F♯ / G♭','G','A♭','A','B♭','B','高音 C'][i]+'</td></tr>').join('')+'</tbody></table></div></section><section class="card ik-section"><h2>先认识空弦音程</h2><p>标准调弦，从粗弦到细弦：E2 → A2 → D3 → G3 → B3 → E4。图中最上方是 1 弦（最细），最下方是 6 弦（最粗）。</p><div class="ik-open-board-wrap">'+openStringDiagram()+'</div><p class="ik-tip">3 弦 G → 2 弦 B 为大三度，其余相邻弦为纯四度；跨 G/B 弦时指型向高品位移动 1 品。</p></section><section class="card ik-section"><h2>在六弦指板上构建音程</h2><p>蓝色为起音 1，橙色为目标音；连线表示两音位置关系。全部示例为向上音程，目标音更高。“全部典型结构”不依赖起音品位；手动选弦可查看具体品位。</p><div class="ik-view-toggle" role="group" aria-label="音程指型查看方式"><button type="button" class="active" id="ikAllShapes" aria-pressed="true">全部典型结构</button><button type="button" id="ikCustomShapes" aria-pressed="false">手动选弦</button></div><div class="ik-controls"><label class="ik-custom-control">起音弦<select id="ikRootString">'+[6,5,4,3,2,1].map(s=>'<option value="'+s+'">'+s+' 弦 · '+names[s-1]+'</option>').join('')+'</select></label><label class="ik-custom-control">目标弦<select id="ikTargetString"></select></label><label class="ik-custom-control ik-root-fret-control">起音品位<select id="ikRootFret">'+Array.from({length:13},(_,i)=>'<option value="'+i+'" '+(i===4?'selected':'')+'>'+i+' 品</option>').join('')+'</select></label></div><p class="ik-tip" id="ikHint"></p><div class="ik-cards" id="ikShapes"></div></section>';
 panel.querySelector('#ikAllShapes').textContent='全部典型结构';
 panel.querySelector('.ik-section:last-child > p').textContent='同色圆点和连线属于同一结构；圆点内的 1 为起音，音程数字为目标音。向上音程的相同指型只展示一个代表；手动选弦仍可查看具体弦组。';
 const root=document.getElementById('ikRootString'),target=document.getElementById('ikTargetString'),fret=document.getElementById('ikRootFret');
 function targets(){const previous=+target.value;target.innerHTML=Array.from({length:+root.value},(_,i)=>+root.value-i).map(s=>'<option value="'+s+'">'+s+' 弦 · '+names[s-1]+(s===+root.value?'（同弦）':'')+'</option>').join('');target.value=previous&&previous<=+root.value?previous:Math.max(1,+root.value-1);draw()}
 function draw(){const rs=+root.value,ts=+target.value,rf=+fret.value,all=document.getElementById('ikAllShapes').classList.contains('active');document.querySelectorAll('.ik-custom-control').forEach(el=>el.hidden=all);document.getElementById('ikHint').textContent=all?'每种音程一张指板；相同弦距、相同相对品位的指型只显示一个代表。典型结构按统一参考位置排布，不需要设置起音品位；展示位置会自动错开。':'目标品位 = 起音品位 + 音程半音数 − 两根空弦的半音差（当前为 '+(tuning[ts-1]-tuning[rs-1])+'）。负品位无法按出，请提高起音品位或选择更近的弦。';const shapes=document.getElementById('ikShapes');shapes.classList.toggle('ik-all-shapes',all);shapes.innerHTML=all?typicalShapes(4):intervals.slice(1).map(([n,l,v])=>shapeCard(n,l,v,rs,ts,rf)).join('')}
 root.onchange=targets;target.onchange=draw;fret.onchange=draw;for(const id of ['ikAllShapes','ikCustomShapes'])document.getElementById(id).onclick=()=>{for(const button of document.querySelectorAll('.ik-view-toggle button')){const active=button.id===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))}draw()};targets();
 installIntervalTable(panel);nav.onclick=()=>showTool('knowledge');
}
globalThis.FretboardKnowledge={init,targetFret,intervals,intervalPairs,consonance,tableIntervals,practicalShapes,uniqueShapes,staggerShapes,typicalShapes};
})();
