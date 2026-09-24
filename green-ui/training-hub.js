(function(root){
  'use strict';
  const T=root.TrainingEngine,E=root.GrooveEngine,C=root.PracticeCatalog,$=id=>document.getElementById(id),clone=T.clone,KEY='practiceTogetherTrainingV1';
  let data={version:1,plans:[],reviews:[],favorites:[]},currentTool='chord',activeId=null,loading=false,deviated=false,collapsed=false,storageBlocked=false;
  const freeSnapshots=new Map();
  const timer=new T.Timer();let saveWarning='',lastSaved=0;
  const destinations={connection:'chord',ear:'ear',motif:'chord',rhythm:'rhythm'};
  const goals={connection:'实际弹奏 3 次连接，检查换和弦时的落点',ear:'完成 5 道题的听辨与自评',motif:'实际尝试 3 个不同的结尾变奏',rhythm:'关闭吉他示范，跟拍实际演奏 3 轮'};
  const statusNames={todo:'待开始',doing:'进行中',done:'已完成',skipped:'已跳过'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clock=ms=>{const s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  const allTasks=()=>data.plans.flatMap(p=>p.tasks);
  const task=()=>allTasks().find(t=>t.id===activeId);
  const today=()=>data.plans.filter(p=>p.day===T.localDay()).at(-1);
  const taskPlan=t=>data.plans.find(p=>p.tasks.some(x=>x.id===t.id));
  function save(){try{if(task())task().elapsed=timer.value();data.activeId=activeId;if(!storageBlocked){localStorage.setItem(KEY,JSON.stringify(data));saveWarning='';}}catch{saveWarning='本地存储失败，请导出备份；当前页面内仍可使用。';}if($('thStorage'))$('thStorage').textContent=saveWarning||'练习记录仅保存在当前浏览器。定期导出备份，可跨设备导入；不含云同步。';}
  function pause(){if(task())task().elapsed=timer.pause();save();renderDock();}
  function init(){
    try{const stored=localStorage.getItem(KEY);if(stored)data=T.validateBackup(JSON.parse(stored));}catch{storageBlocked=true;saveWarning='未能读取本地记录，已保护旧数据免被覆盖。请先导出旧记录，再导入有效备份；当前新练习只保存在内存中。';}
    activeId=data.activeId||null;if(!task()||task().status!=='doing')activeId=null;if(task()){timer.load(task().elapsed);deviated=true;}
    const nav=document.createElement('button');nav.id='navToday';nav.textContent='今日练习';nav.onclick=()=>showTool('daily');document.querySelector('.tool-nav').append(nav);
    const panel=document.createElement('section');panel.id='todayPanel';panel.hidden=true;document.querySelector('.topbar').after(panel);
    panel.innerHTML=`<section class="card training-section"><div class="card-head"><h2>今日练习计划</h2><span class="small">听 · 想 · 弹 · 复盘</span></div><div class="training-body"><div class="training-fields"><label>练习时间<select id="thMinutes"><option value="10">10 分钟</option><option value="20" selected>20 分钟</option><option value="30">30 分钟</option><option value="45">45 分钟</option></select></label><label>重点<select id="thFocus"><option value="all">综合练习</option><option value="harmony">和声连接</option><option value="ear">听感辨认</option><option value="rhythm">律动与动机</option></select></label><label>难度<select id="thDifficulty"><option value="easy">基础巩固</option><option value="medium">进阶</option><option value="hard">挑战</option></select></label></div><fieldset class="training-pool"><legend>基础调式范围 · 可多选</legend>${Object.entries(C.scales).map(([key,label])=>`<label><input type="checkbox" value="${key}" ${key==='major'?'checked':''}>${label}</label>`).join('')}</fieldset><p class="training-help">只在所选范围生成新任务，不会偷偷加入其他调式。五声 / Blues 的和弦任务采用母调七和弦；听感旋律仍严格使用所选音阶。</p><label class="training-check"><input id="thPrioritize" type="checkbox" checked>优先延续所选调式范围内的未完成任务与困难题</label><div class="training-actions"><button class="btn primary" id="thGenerate">生成今日计划</button><button class="btn" id="thExport">导出练习备份</button><button class="btn" id="thImport">导入备份</button><input type="file" id="thImportFile" accept=".json,application/json" hidden></div><p id="thStatus" role="status"></p><p id="thStorage" class="training-help"></p></div></section><section class="card training-section"><div class="card-head"><h2>今日任务</h2><span id="thSummary"></span></div><div class="training-body" id="thTasks"></div></section><section class="card training-section"><div class="card-head"><h2>练习记录与复盘</h2></div><div class="training-body" id="thHistory"></div></section>`;
    const dock=document.createElement('aside');dock.id='trainingTaskDock';dock.setAttribute('aria-label','全局练习任务');dock.hidden=true;document.body.append(dock);
    collapsed=true;
    $('thGenerate').onclick=generatePlan;$('thExport').onclick=exportBackup;$('thImport').onclick=()=>$('thImportFile').click();$('thImportFile').onchange=importBackup;
    panel.addEventListener('click',event=>{const b=event.target.closest('[data-task-action]');if(!b)return;const t=allTasks().find(x=>x.id===b.dataset.task);if(!t)return;const action=b.dataset.taskAction;if(action==='start')start(t);else if(action==='replace')replace(t);else if(action==='skip')skipTask(t);else if(action==='review'){const p=taskPlan(t),copy=clone(t);copy.id=t.id+'-review-'+Date.now();copy.status='todo';copy.progress=0;copy.elapsed=0;copy.seen=[];copy.feedback=null;copy.title=T.kindNames[t.kind]+' · 复习';if(copy.kind==='ear'){copy.snapshot.rated=false;copy.snapshot.hints=[];copy.snapshot.revealedNotes=[];copy.snapshot.answerVisible=false;}const reviewPlan={id:T.localDay()+'-review-'+Date.now(),day:T.localDay(),seed:Date.now(),prefs:clone(p.prefs),tasks:[copy]};data.plans.push(reviewPlan);start(copy);}});
    dock.addEventListener('click',event=>{const b=event.target.closest('[data-dock]');if(!b)return;const t=task();switch(b.dataset.dock){case 'collapse':collapsed=!collapsed;renderDock();break;case 'pause':if(timer.since===null){if(t&&currentTool===destinations[t.kind]&&!deviated){timer.resume();save();renderDock();}else if(t)start(t);}else pause();break;case 'return':if(t)start(t);break;case 'step':if(t)step(t.kind);break;case 'complete':complete();break;case 'next':next();break;case 'free':pause();if(t)restoreFree(t.kind);activeId=null;deviated=false;save();renderDock();break;}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
    // Background time is never charged. Reload always restores a paused session.
    setInterval(()=>{renderClock();if(timer.since!==null&&Date.now()-lastSaved>10000){save();lastSaved=Date.now();}},1000);
    document.addEventListener('change',event=>{
      if(loading||!task())return;
      if(task().kind==='rhythm'&&(event.target.closest('.groove-settings')||['ggLadderStart','ggLadderTarget','ggLadderStep','ggLadderRepeats'].includes(event.target.id)))deviate('rhythm');
      if(task().kind==='ear'&&['etCount','etKey','etScale','etMeter','etStyle','etDifficulty','etTempo','etTempoSlider'].includes(event.target.id))deviate('ear');
    });
    document.addEventListener('click',event=>{if(loading||!task())return;const b=event.target.closest('button');if(!b)return;if(task().kind==='rhythm'&&b.closest('#rhythmPanel')&&(['ggGenerate','ggRegGuitar','ggRegDrums','ggRestore','ggLoadFavorite','ggUndo','ggAddBar','ggLadderStartBtn','ggSlower','ggFaster'].includes(b.id)||b.closest('#ggMaterials')||b.closest('#ggLink')||b.hasAttribute('data-remove')))deviate('rhythm');if(task().kind==='ear'&&b.closest('#etMaterials'))deviate('ear');});
    const existing=today();if(existing){$('thMinutes').value=existing.prefs.minutes;$('thFocus').value=existing.prefs.focus;$('thDifficulty').value=existing.prefs.difficulty;document.querySelectorAll('.training-pool input').forEach(n=>n.checked=existing.prefs.scales.includes(n.value));}
    root.TrainingStudio.refreshFavorites(data.favorites);render();$('thStorage').textContent=saveWarning||'练习记录仅保存在当前浏览器。定期导出备份，可跨设备导入；不含云同步。';
  }
  function generatePlan(){try{
    if(today()&&!confirm('今天已有计划。重新生成将保留旧计划在历史记录中，是否继续？'))return;
    const prefs={minutes:+$('thMinutes').value,focus:$('thFocus').value,difficulty:$('thDifficulty').value,scales:[...document.querySelectorAll('.training-pool input:checked')].map(n=>n.value)};
    const p=T.plan(prefs);
    if($('thPrioritize').checked){const used=new Set();for(const t of p.tasks){
      const past=allTasks().slice().reverse().find(x=>x.kind===t.kind&&x.snapshot&&prefs.scales.includes(x.params.scale)&&!used.has(x.id)&&(['todo','doing'].includes(x.status)||['review','difficult'].includes(x.feedback)));
      if(past){used.add(past.id);t.params=clone(past.params);t.snapshot=clone(past.snapshot);t.from=past.id;t.title+=' · 延续 / 复习';if(past.status==='doing'){t.progress=past.progress;t.seen=clone(past.seen);}if(t.kind==='ear'&&past.status==='done'){t.snapshot.rated=false;t.snapshot.hints=[];t.snapshot.answerVisible=false;}}
      else if(t.kind==='ear'){const review=data.reviews.slice().reverse().find(x=>x.rating!=='independent'&&prefs.scales.includes(x.question.scale));if(review){t.params.key=review.question.key;t.params.scale=review.question.scale;t.params.tempo=review.question.config.tempo;t.params.count=review.question.count;t.snapshot={question:clone(review.question),settings:clone(review.settings),rated:false,hints:[],answerVisible:false};t.title+=' · 困难题';}}
    }}
    pause();activeId=null;data.plans.push(p);if(data.plans.length>366)data.plans.shift();save();render();$('thStatus').textContent='计划已保存。点击「去完成」会自动配置指定内容，不自动播放。';
  }catch(e){$('thStatus').textContent=e.message;}}
  function buildSnapshot(t){const p=t.params;if(t.kind==='connection')return T.connection(p);if(t.kind==='ear'){const settings={...root.EarEngine.defaults,...p,key:p.key,materials:['quarter','eighth'],visibility:'show',scalePool:[p.scale],difficulty:p.difficulty};return {question:root.EarEngine.generate(settings),settings};}if(t.kind==='motif'){const a=T.motif({...p,min:0,max:12});return {a,b:T.vary(a,p.variation),type:p.variation};}
    const config={...E.defaults,...p,mode:'riff',practice:'normal',bars:[0,3,4,0],materials:['quarter','eighth','rest'],voicing:'seventh',extension:0};return {config,result:E.generate(config,Date.now()),practice:{count:1,alternate:true,a:0,b:null},loop:true};}
  function stopAll(){root.TrainingStudio.stop();root.EarTraining.stop();root.GuitarGroove.stop();stopArpeggio();}
  function captureFree(kind){if(freeSnapshots.has(kind))return;const free=kind==='ear'?root.EarTraining.snapshot():kind==='rhythm'?root.GuitarGroove.snapshot():root.TrainingStudio.snapshot(kind);freeSnapshots.set(kind,clone(free));}
  function loadTask(t,snapshot){showTool(destinations[t.kind]);if(t.kind==='ear')root.EarTraining.load(snapshot);else if(t.kind==='rhythm')root.GuitarGroove.loadTask(snapshot);else root.TrainingStudio.load(t.kind,snapshot);if(t.kind==='motif')root.TrainingStudio.openMotif();}
  function restoreFree(kind){
    if(!freeSnapshots.has(kind))return true;
    const old=freeSnapshots.get(kind);freeSnapshots.delete(kind);
    try{if(kind==='ear')root.EarTraining.load(old);else if(kind==='rhythm')root.GuitarGroove.loadTask(old);else root.TrainingStudio.load(kind,old);return true;}
    catch(error){console.warn('恢复自由练习失败，已丢弃损坏快照：',error);return false;}
  }
  function start(t){
    if(loading)return;
    const previous=task(),previousId=activeId,previousElapsed=previousId===t.id?timer.value():previous?.elapsed||0;
    let nextSnapshot;
    try{
      // Validate/build everything that can fail before changing the active task.
      nextSnapshot=clone(t.snapshot||buildSnapshot(t));
      loading=true;
      if(previous)previous.elapsed=timer.pause();else timer.pause();
      stopAll();
      if(previous&&previous.kind!==t.kind)restoreFree(previous.kind);
      captureFree(t.kind);
      loadTask(t,nextSnapshot);
      if(!t.snapshot)t.snapshot=clone(nextSnapshot);
      activeId=t.id;t.status='doing';deviated=false;timer.load(t.elapsed);timer.resume();save();render();
      const target=t.kind==='connection'?'connectionPanel':t.kind==='motif'?'motifDevelopment':t.kind==='ear'?'earPanel':'rhythmPanel';if(t.kind!=='motif')$(target).scrollIntoView({block:'start'});
    }catch(e){
      timer.pause();activeId=previousId;
      if(previous){previous.elapsed=previousElapsed;timer.load(previousElapsed);}
      showTool('daily');$('thStatus').textContent='任务启动失败：'+e.message;save();render();
    }finally{loading=false;}
  }
  function skipTask(t){
    if(loading||['done','skipped'].includes(t.status))return;
    loading=true;
    try{
      if(t.id===activeId){t.elapsed=timer.pause();stopAll();restoreFree(t.kind);activeId=null;deviated=false;}
      t.status='skipped';save();render();
    }catch(e){$('thStatus').textContent='跳过任务失败：'+e.message;save();render();}
    finally{loading=false;}
  }
  function replace(t){if(t.status!=='todo')return;const p=taskPlan(t),fresh=T.plan(p.prefs,Date.now(),p.day).tasks.find(x=>x.kind===t.kind);if(!fresh)return;const oldId=t.id;Object.assign(t,fresh,{id:oldId+'-r'+Date.now(),minutes:t.minutes});save();render();}
  function render(){
    const p=today();$('thSummary').textContent=p?p.tasks.filter(t=>t.status==='done').length+' / '+p.tasks.length+' 项完成':'尚未生成';
    $('thTasks').innerHTML=p?p.tasks.map(t=>`<article class="training-task"><header><h3>${esc(t.title)}</h3><span class="training-badge ${t.status==='done'?'done':''}">${statusNames[t.status]}</span></header><p>${esc(goals[t.kind])} · 预计 ${t.minutes} 分钟</p><p class="training-help">${E.names[t.params.key]} · ${C.scales[t.params.scale]} · ${t.params.tempo} BPM${t.kind==='connection'?' · II–V–I · '+t.params.min+'–'+t.params.max+' 品 · '+T.targets[t.params.target]:''}${t.kind==='ear'?' · '+t.params.count+' 音 · 四分 / 八分':''}${t.kind==='motif'?' · '+T.changes[t.params.variation]:''}</p><p>${t.progress} / ${t.goal} 次记录 · 已练 ${clock(t.id===activeId?timer.value():t.elapsed)}</p><div class="training-actions"><button class="btn primary" data-task-action="${t.status==='done'?'review':'start'}" data-task="${esc(t.id)}">${t.status==='done'?'再练一次':t.status==='doing'?'继续练习':'去完成 →'}</button>${t.status==='todo'?'<button class="btn" data-task-action="replace" data-task="'+esc(t.id)+'">换一个任务</button>':''}${!['done','skipped'].includes(t.status)?'<button class="btn" data-task-action="skip" data-task="'+esc(t.id)+'">跳过</button>':''}</div></article>`).join(''):'<p class="training-help">选好时间、重点和调式范围，建立一份可持续完成的计划。</p>';
    $('thHistory').innerHTML=data.plans.slice().reverse().slice(0,30).map(p=>`<details class="training-history"><summary>${esc(p.day)} · ${p.tasks.filter(t=>t.status==='done').length}/${p.tasks.length} 项 · ${clock(p.tasks.reduce((s,t)=>s+t.elapsed,0))}</summary>${p.tasks.map(t=>`<p>${esc(t.title)} · ${statusNames[t.status]} · ${t.progress}/${t.goal} · ${({good:'状态不错',review:'需要复习',difficult:'较困难'})[t.feedback]||'未评价'} <button class="btn" data-task-action="${t.status==='done'?'review':'start'}" data-task="${esc(t.id)}">${t.status==='done'?'复习':'继续'}</button></p>`).join('')}</details>`).join('')||'<p class="training-help">完成任务后在这里复盘。计时、次数和自评分别记录。</p>';renderDock();
  }
  function renderDock(){
    const t=task(),dock=$('trainingTaskDock');if(!dock)return;dock.hidden=!t;document.body.classList.toggle('training-task-open',!!t&&!collapsed);if(!t)return;
    dock.classList.toggle('collapsed',collapsed);const p=taskPlan(t);
    dock.innerHTML=`<div class="task-mini"><button class="btn task-dock-handle" data-dock="collapse" aria-expanded="${!collapsed}" aria-label="${collapsed?'固定展开任务面板':'收起任务面板'}">${collapsed?'‹':'›'}</button><span>${p.tasks.filter(x=>x.status==='done').length}/${p.tasks.length} 项 · <b id="thClock">${clock(timer.value())}</b></span><button class="btn" data-dock="pause">${timer.since===null?'继续':'暂停'}</button></div><div class="task-expanded"><h3>${esc(t.title)}</h3><p>${esc(goals[t.kind])}</p><p id="thTaskState">${deviated?'参数已偏离任务，请恢复指定内容或转为自由练习':timer.since===null?'计时暂停 · 返回后请手动继续':'正在计时 · 停止声音不会停止计时'}</p><progress max="${t.goal}" value="${t.progress}"></progress><p>${t.progress} / ${t.goal} 次 · 今日累计 <b id="thDayClock"></b></p><div class="training-actions"><button class="btn" data-dock="return">${deviated?'恢复指定任务':'回到任务'}</button>${['connection','rhythm'].includes(t.kind)?'<button class="btn" data-dock="step">记录一次实际练习</button>':''}<button class="btn" data-dock="free">转自由练习</button></div><label>本次自评<select id="thFeedback"><option value="good">状态不错</option><option value="review">需要复习</option><option value="difficult">较困难</option></select></label><div class="training-actions"><button class="btn primary" data-dock="complete" ${t.progress<t.goal||deviated?'disabled':''}>确认完成</button><button class="btn" data-dock="next">下一任务</button></div><p class="training-help">达到时长不自动完成。听感请逐题自评，动机请逐个尝试后记录。</p></div>`;renderClock();
  }
  function renderClock(){if($('thClock'))$('thClock').textContent=clock(timer.value());if($('thDayClock'))$('thDayClock').textContent=clock(data.plans.filter(p=>p.day===T.localDay()).flatMap(p=>p.tasks).reduce((s,t)=>s+(t.id===activeId?timer.value():t.elapsed),0));}
  function step(kind,token){const t=task();if(!t||t.kind!==kind||deviated||currentTool!==destinations[kind]||timer.since===null||t.progress>=t.goal)return false;if(token&&t.seen.includes(token))return false;if(token)t.seen.push(token);t.progress=Math.min(t.goal,t.progress+1);save();render();return true;}
  function complete(){const t=task();if(!t||t.progress<t.goal||deviated)return;const feedback=$('thFeedback').value;pause();t.status='done';t.feedback=feedback;root.TrainingStudio.stop();root.EarTraining.stop();root.GuitarGroove.stop();stopArpeggio();restoreFree(t.kind);activeId=null;save();render();showTool('daily');$('thStatus').textContent='已记录完成。可开始下一项，或在历史记录中复习。';}
  function next(){const t=task(),p=t?taskPlan(t):today();const nextTask=p?.tasks.find(x=>x.id!==activeId&&!['done','skipped'].includes(x.status));if(nextTask)start(nextTask);else {pause();showTool('daily');}}
  function navigate(tool){if(!loading&&task()&&tool!==destinations[task().kind])pause();currentTool=tool;$('todayPanel').hidden=tool!=='daily';root.TrainingStudio.navigate(tool);if(tool==='daily')render();}
  function deviate(kind){if(loading||!task()||task().kind!==kind)return;deviated=true;pause();renderDock();}
  function exerciseChanged(kind,snapshot){const t=task();if(loading||!t||t.kind!==kind||deviated)return;if(kind==='motif'&&JSON.stringify(t.snapshot.a)===JSON.stringify(snapshot.a)&&snapshot.type===t.params.variation){t.snapshot=clone(snapshot);save();}else if(kind==='connection')deviate(kind);else if(kind==='motif')deviate(kind);}
  function earChanged(snapshot){const t=task();if(loading||!t||t.kind!=='ear'||deviated)return;const p=t.params,q=snapshot.question;if(q.scale!==p.scale||q.key!==p.key||q.count!==p.count||snapshot.settings.tempo!==p.tempo){deviate('ear');return;}t.snapshot=clone(snapshot);save();}
  function rateEar(record){const index=data.reviews.findIndex(x=>x.question.seed===record.question.seed&&x.question.scale===record.question.scale&&x.question.key===record.question.key);if(index>=0)data.reviews[index]=clone(record);else data.reviews.push(clone(record));if(data.reviews.length>500)data.reviews.shift();earChanged(record);step('ear',String(record.question.seed));save();}
  function reviewEar(){const candidates=data.reviews.filter(r=>r.rating!=='independent');if(!candidates.length){$('etRatingStatus').textContent='还没有困难题。先完成一题并自评。';return;}const current=root.EarTraining.snapshot()?.question?.seed;const item=candidates.find(r=>r.question.seed!==current)||candidates[0];deviate('ear');root.EarTraining.load({...clone(item),hints:[],revealedNotes:[],rated:false,answerVisible:false});$('etRatingStatus').textContent='已载入原始困难题 · 重新听辨并自评';}
  function saveMotif(m){data.favorites.unshift(clone(m));data.favorites=data.favorites.slice(0,100);save();root.TrainingStudio.refreshFavorites(data.favorites);$('tmStatus').textContent='已收藏 A / B。随练习备份一起导出。';}
  function loadMotif(index){if(index===''||!data.favorites[+index])return;deviate('motif');root.TrainingStudio.load('motif',data.favorites[+index]);}
  function exportBackup(){pause();const raw=storageBlocked?localStorage.getItem(KEY):JSON.stringify(data,null,2);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='一起练琴吧-练习备份-'+T.localDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('thStatus').textContent=storageBlocked?'已导出受保护的原始记录，请保留以便恢复。':'已导出计划、计时、听感复习与动机收藏。';}
  async function importBackup(){const file=$('thImportFile').files[0];if(!file)return;try{if(file.size>5000000)throw Error('备份不能超过 5 MB。');const imported=T.validateBackup(JSON.parse(await file.text()));if(!confirm('导入会替换当前计划、计时与复习记录，建议先导出。是否继续？'))return;pause();root.TrainingStudio.stop();root.EarTraining.stop();root.GuitarGroove.stop();data=imported;storageBlocked=false;activeId=null;timer.load();freeSnapshots.clear();save();root.TrainingStudio.refreshFavorites(data.favorites);render();$('thStatus').textContent='备份已导入，计时保持暂停。';}catch(e){$('thStatus').textContent='导入失败：'+e.message;}finally{$('thImportFile').value='';}}
  root.TrainingHub={init,navigate,deviate,exerciseChanged,earChanged,rateEar,reviewEar,saveMotif,loadMotif,step,get activeKind(){return !deviated&&task()?.kind;}};
})(globalThis);
