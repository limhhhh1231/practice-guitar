(function(root){
  'use strict';
  const E=root.GrooveEngine,C=root.PracticeCatalog,G=root.EarEngine,$=id=>document.getElementById(id);
  let question=null,keyVisible=true,answerVisible=false,focused=false,settings={...G.defaults};
  const player=new root.EarPlayer((message,playing)=>{if($('etStatus'))$('etStatus').textContent=message;if($('etPlay')){$('etPlay').textContent=playing?'■ 停止':'▶ 播放';$('etPlay').setAttribute('aria-pressed',String(playing));}});
  const options=(map,current)=>Object.entries(map).map(([value,label])=>`<option value="${value}"${String(current)===value?' selected':''}>${label}</option>`).join('');
  const select=(label,id,map,value)=>`<div class="field"><label for="${id}">${label}</label><select id="${id}">${options(map,value)}</select></div>`;
  const number=(label,id,value,min,max)=>`<div class="field"><label for="${id}">${label}</label><input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="1"></div>`;
  function init(){
    const nav=document.createElement('button');nav.id='navEar';nav.type='button';nav.textContent='听感练习';nav.title='听感练习';$('navRhythm').after(nav);nav.onclick=()=>showTool('ear');
    const panel=document.createElement('section');panel.id='earPanel';panel.hidden=true;$('rhythmPanel').after(panel);
    panel.innerHTML=`<section class="card et-settings"><div class="card-head"><h2>听感设置</h2><button class="btn" id="etGenerate">↻ 生成新练习</button></div><div class="et-settings-body"><div class="et-fields">
      ${select('旋律音符数量','etCount',Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,(i+1)+' 个音'])),4)}
      ${select('主音','etKey',{random:'随机主音',...Object.fromEntries(E.names.map((name,i)=>[i,name]))},'random')}
      ${select('调式 / 音阶','etScale',{...C.scales,random:'随机调式（从下方范围选择）'},'major')}
      ${select('拍号','etMeter',{'4/4':'4/4','3/4':'3/4','6/8':'6/8','5/4':'5/4'},'4/4')}
      ${select('风格','etStyle',C.styles,'rock')}
      ${select('旋律难度','etDifficulty',{easy:'入门 · 小跳进',medium:'进阶 · 七度以内',hard:'挑战 · 八度内自由'},'easy')}
    </div><div id="etScalePool" class="et-section" hidden><h3>随机调式范围</h3><div class="rhythm-chipset">${Object.entries(C.scales).map(([id,name])=>`<label class="et-choice"><input type="checkbox" value="${id}" ${['major','minor'].includes(id)?'checked':''}>${name}</label>`).join('')}</div></div>
    <div class="et-section"><h3>节奏材料 · 可多选</h3><div id="etMaterials" class="rhythm-chipset">${Object.entries(C.materials).map(([id,name])=>`<button type="button" class="rhythm-chip ${['quarter','eighth'].includes(id)?'active':''}" data-material="${id}" aria-pressed="${['quarter','eighth'].includes(id)}">${name}</button>`).join('')}</div><p class="et-help">音符数量按实际拨弦次数计算；分组保持完整。休止、延音需搭配音符时值，句尾自动留白至小节结束。</p></div>
    <div class="et-fields et-section">
      ${number('速度 BPM','etTempo',80,40,220)}
      <label class="slider-label et-tempo-slider">速度推子 <output id="etTempoOut">80 BPM</output><input id="etTempoSlider" type="range" min="40" max="220" value="80" aria-label="听感练习速度"></label>
      ${select('播放方式','etRepeatMode',{finite:'播放指定遍数',infinite:'无限循环'},'finite')}
      ${number('当前练习播放遍数','etRepeats',3,1,99)}
      ${select('每遍间隔','etGap',{0:'连续播放',1:'留 1 小节自己弹',2:'留 2 小节自己弹'},1)}
      ${select('预备拍','etCountIn',{0:'无',1:'1 小节',2:'2 小节'},1)}
      ${select('新题调性展示','etVisibility',{show:'生成后显示',auto:'开始播放后隐藏',hidden:'新题默认隐藏'},'show')}
      <label class="et-choice"><input id="etCue" type="checkbox">播放前提示一次主和弦</label>
    </div><p class="et-help">6/8 的 BPM 按附点四分计拍。间隔小节完全静音；节拍器关闭时，预备拍仍留出时间。1–2 个音不足以唯一判断调性，先练模唱和找音。</p>
    <details class="audio-options et-audio"><summary>音轨与音色设置</summary><div class="et-fields">
      ${select('鼓组','etKit',{acoustic:'原声套鼓',tight:'紧凑套鼓',power:'强力套鼓'},'acoustic')}
      <label class="et-choice"><input id="etDrums" type="checkbox" checked>开启鼓组（跟随风格）</label>
      ${select('节拍器','etClickMode',{off:'关闭',count:'只在预备拍播放',all:'预备拍 + 正式播放'},'count')}
      ${select('节拍器音色','etClick',{classic:'经典 Click',wood:'木质 Click',cowbell:'Cowbell',electronic:'电子 Click'},'classic')}
    </div><div class="et-volumes">${[['Guitar','吉他',90],['Drum','鼓组',55],['Click','节拍器',50]].map(([id,name,value])=>`<label class="slider-label">${name}音量 <output id="et${id}Out">${value}%</output><input id="et${id}Volume" aria-label="${name}音量" type="range" min="0" max="100" value="${value}"></label>`).join('')}</div></details>
    </div></section>
    <div id="etError" class="error-note" role="alert" hidden></div>
    <section class="card et-session"><div class="card-head"><h2>先听，再模唱，最后在琴上找音</h2><button class="btn" id="etFocus">专注练习</button></div><div class="et-session-body"><div class="et-key-row"><strong id="etKeyReadout"></strong><button class="btn" id="etToggleKey" aria-pressed="true">隐藏当前调</button></div><p id="etMeta" class="et-help"></p><p id="etStatus" role="status" aria-live="polite">准备好后开始</p><div class="et-actions"><button class="btn primary" id="etPlay" aria-pressed="false">▶ 播放</button><button class="btn" id="etReplay">↺ 从头重听</button><button class="btn" id="etNext">下一题</button><button class="btn" id="etReveal" aria-expanded="false" aria-controls="etAnswer">揭晓旋律答案</button></div><p class="et-help et-shortcut">空格播放 / 停止 · 重听保持同一道题 · 揭晓后可点音符试听</p></div></section>
    <section class="card et-answer" id="etAnswer" hidden><div class="card-head"><h2>旋律答案</h2>${select('简谱','etNotation',{movable:'首调（当前主音 = 1）',fixed:'固定调（C = 1）'},'movable')}</div><div class="et-answer-body"><p class="et-help">音名数字标记八度；首调数字相对主音，↑ 表示高八度。时值以四分音符为 1 拍；6/8 的 1 拍口令为附点四分。</p><div class="et-note-list" id="etNotes"></div><div class="et-score-wrap" id="etScore"></div><h3>推荐指板位置 · 标准六弦调弦</h3><div class="et-board-wrap" id="etBoard"></div><p class="et-help">图中数字是旋律出现顺序；蓝色为主音。详细弦品标在上方音符卡片中。</p></div></section>`;
    $('etGenerate').onclick=$('etNext').onclick=generate;
    $('etPlay').onclick=togglePlay;$('etReplay').onclick=()=>play();
    $('etToggleKey').onclick=()=>{keyVisible=!keyVisible;renderKey();};
    $('etReveal').onclick=()=>{answerVisible=!answerVisible;renderAnswer();};
    $('etNotation').onchange=renderAnswer;
    $('etFocus').onclick=()=>{focused=!focused;applyFocus();};
    $('etScale').onchange=()=>{$('etScalePool').hidden=$('etScale').value!=='random';};
    $('etRepeatMode').onchange=()=>{$('etRepeats').disabled=$('etRepeatMode').value==='infinite';};
    $('etVisibility').onchange=()=>{keyVisible=$('etVisibility').value!=='hidden';renderKey();};
    for(const button of panel.querySelectorAll('[data-material]'))button.onclick=()=>{const on=button.classList.toggle('active');button.setAttribute('aria-pressed',String(on));markPending();};
    panel.querySelector('.et-settings').addEventListener('change',event=>{
      if(['etGuitarVolume','etDrumVolume','etClickVolume'].includes(event.target.id))return;
      if(['etCount','etKey','etScale','etMeter','etStyle','etDifficulty'].includes(event.target.id)||event.target.closest('#etScalePool'))markPending();
      else if(player.playing)player.stop('设置已更改，点击播放重听本题');
    });
    for(const id of ['etTempo','etTempoSlider'])$(id).oninput=()=>{const value=Number($(id).value);if(!Number.isFinite(value)||value<40||value>220)return;$('etTempo').value=$('etTempoSlider').value=value;$('etTempoOut').value=value+' BPM';if(player.playing)player.stop('速度已更改，重听时按新速度播放');renderMeta();};
    for(const id of ['Guitar','Drum','Click'])$('et'+id+'Volume').oninput=()=>{$('et'+id+'Out').value=$('et'+id+'Volume').value+'%';player.mix(mixSettings());};
    generate();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)player.stop();});
    window.addEventListener('pagehide',()=>player.stop());
  }
  function mixSettings(){return {guitarVolume:+$('etGuitarVolume').value,drumVolume:+$('etDrumVolume').value,clickVolume:+$('etClickVolume').value};}
  function read(){
    const tempo=+$('etTempo').value,repeats=$('etRepeatMode').value==='infinite'?0:+$('etRepeats').value;
    if(!Number.isFinite(tempo)||tempo<40||tempo>220)throw Error('速度范围为 40–220 BPM。');
    if(!Number.isInteger(repeats)||repeats<0||repeats>99||($('etRepeatMode').value==='finite'&&repeats===0))throw Error('播放遍数请选择 1–99。');
    return {key:$('etKey').value,scale:$('etScale').value,scalePool:[...$('etScalePool').querySelectorAll('input:checked')].map(e=>e.value),count:+$('etCount').value,materials:[...$('etMaterials').querySelectorAll('.active')].map(e=>e.dataset.material),tempo,meter:$('etMeter').value,style:$('etStyle').value,difficulty:$('etDifficulty').value,repeats,gap:+$('etGap').value,countIn:+$('etCountIn').value,visibility:$('etVisibility').value,cue:$('etCue').checked,kit:$('etKit').value,drums:$('etDrums').checked,click:$('etClick').value,clickMode:$('etClickMode').value,...mixSettings()};
  }
  function markPending(){if(question)$('etStatus').textContent='生成参数已更改 · 点击「生成新练习」应用；重听仍为原题';}
  function error(message){$('etError').hidden=!message;$('etError').textContent=message;}
  function generate(){
    player.stop();try{const next=read();const generated=G.generate(next,Math.floor(Math.random()*0x7fffffff));settings=next;question=generated;keyVisible=settings.visibility!=='hidden';answerVisible=false;error('');renderKey();renderMeta();renderAnswer();$('etStatus').textContent='新练习已生成 · 点击播放开始';}catch(e){error(e.message);}
  }
  function renderKey(){if(!question)return;$('etKeyReadout').textContent=keyVisible?E.names[question.key]+' · '+C.scales[question.scale]:'当前调已隐藏';$('etToggleKey').textContent=keyVisible?'隐藏当前调':'显示当前调';$('etToggleKey').setAttribute('aria-pressed',String(keyVisible));if(answerVisible)renderAnswer();}
  function renderMeta(){if(question)$('etMeta').textContent=question.count+' 个音 · '+$('etTempo').value+' BPM · '+question.config.meter+' · '+C.styles[question.config.style]+' · '+question.totalTicks/E.ticks(question.config)+' 小节';}
  function label(midi){return $('etNotation').value==='fixed'?['1','♭2','2','♭3','3','4','♯4','5','♭6','6','♭7','7'][E.mod(midi)]:C.degree(question.scale,midi-question.key)+(midi>=60+question.key?'↑':'');}
  function renderAnswer(){
    $('etAnswer').hidden=!answerVisible;$('etReveal').setAttribute('aria-expanded',String(answerVisible));$('etReveal').textContent=answerVisible?'收起旋律答案':'揭晓旋律答案';
    // Clear hidden answers so notes are not exposed in tooltips/accessibility text.
    if(!answerVisible){$('etNotes').replaceChildren();$('etBoard').replaceChildren();$('etScore').replaceChildren();return;}
    const events=question.events,notes=events.filter(e=>!e.rest);
    $('etNotes').innerHTML=notes.map((e,i)=>`<button type="button" class="et-note ${E.mod(e.note.midi)===question.key?'et-root':''}" data-et-note="${i}"><span>第 ${i+1} 音</span><strong>${label(e.note.midi)}</strong><b>${E.names[E.mod(e.note.midi)]}${Math.floor(e.note.midi/12)-1}</b><span>${e.note.string} 弦 · ${e.note.fret} 品</span><small>${C.materials[e.material]}${e.tie?' × 2 延音':''}</small></button>`).join('');
    $('etNotes').querySelectorAll('[data-et-note]').forEach(button=>button.onclick=()=>{try{stopOthers();player.preview(notes[+button.dataset.etNote].note.midi,read());}catch(e){error(e.message);}});
    const bar=E.ticks(question.config);let index=0;
    const rhythm=Array.from({length:question.totalTicks/bar},(_,b)=>{
      const from=b*bar,to=from+bar;
      return '<div class="et-rhythm-bar"><span>第 '+(b+1)+' 小节</span><div class="et-rhythm-lane" style="--beats:'+bar/24+'">'+events.filter(e=>e.start<to&&e.start+e.duration>from).map(e=>{
        const left=Math.max(from,e.start),right=Math.min(to,e.start+e.duration),continued=e.start<from;
        return '<span class="et-rhythm-event '+(e.rest?'et-rest':'')+'" style="left:'+((left-from)/bar*100)+'%;width:'+((right-left)/bar*100)+'%" title="'+(e.rest?'休止':C.materials[e.material])+'">'+(e.rest?'休':continued?'⌒':label(e.note.midi))+'</span>';
      }).join('')+'</div></div>';
    }).join('');
    $('etScore').innerHTML=rhythm+'<details class="et-timing"><summary>查看精确节奏落点与时值</summary><table class="et-score"><thead><tr><th>顺序</th><th>小节</th><th>起点（四分拍）</th><th>时值（四分拍）</th></tr></thead><tbody>'+events.map(e=>`<tr><th>${e.rest?'休止':++index}</th><td>${Math.floor(e.start/bar)+1}</td><td>${(e.start%bar/24+1).toFixed(2)}</td><td>${(e.duration/24).toFixed(2)}${e.tie?' · 延音':''}</td></tr>`).join('')+'</tbody></table></details>';
    const width=820,height=250,x=f=>54+f*58,y=s=>35+(s-1)*37;
    let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="六弦指板，显示旋律顺序和位置">`;
    for(let s=1;s<=6;s++)svg+=`<text x="8" y="${y(s)+4}" class="et-board-label">${s} 弦</text><path d="M 44 ${y(s)} H 786" class="et-wire"/>`;
    for(let f=0;f<=12;f++)svg+=`<text x="${x(f)}" y="17" text-anchor="middle" class="et-board-label">${f}</text><path d="M ${x(f)+29} 25 V 230" class="et-fret"/>`;
    const positions=new Map();notes.forEach((e,i)=>{const key=e.note.string+','+e.note.fret;if(!positions.has(key))positions.set(key,[]);positions.get(key).push(i+1);});
    for(const [pos,order]of positions){const [s,f]=pos.split(',').map(Number),rootNote=E.mod([64,59,55,50,45,40][s-1]+f)===question.key;
      svg+=`<rect x="${x(f)-25}" y="${y(s)-15}" width="50" height="30" rx="4" fill="${rootNote?'#65b8ed':'#85dfa1'}"/><text x="${x(f)}" y="${y(s)+4}" text-anchor="middle" class="et-board-order">${order.slice(0,4).join('·')}</text>`;
      if(order.length>4)svg+=`<text x="${x(f)}" y="${y(s)+13}" text-anchor="middle" class="et-board-order">${order.slice(4).join('·')}</text>`;
    }
    $('etBoard').innerHTML=svg+'</svg>';
  }
  function stopOthers(){stopArpeggio();GuitarGroove.stop();}
  function play(){
    if(!question)return;try{settings=read();error('');if(settings.visibility==='auto'){keyVisible=false;renderKey();}stopOthers();player.play(question,settings);}catch(e){error(e.message);}
  }
  function togglePlay(){if(player.playing)player.stop();else play();}
  function applyFocus(){document.body.classList.toggle('ear-focus',focused);$('etFocus').textContent=focused?'退出专注':'专注练习';$('etFocus').setAttribute('aria-pressed',String(focused));}
  function stop(){player.stop();focused=false;if($('etFocus'))applyFocus();}
  root.EarTraining={init,stop,togglePlay};
})(globalThis);
