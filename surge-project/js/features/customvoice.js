/* CUSTOM VOICES — players attach their own audio files to a fighter's voice moments.
   Clips are stored in this browser only (IndexedDB). They are never uploaded, never sent to
   other players online and never included in the game files — only the person who added them hears them.
   Slots: ult (ultimate), kill (scores a KO), hurt (takes a big hit), win (wins the match). Several clips per slot = random pick. */
const CV_SLOTS=[['ult','ULTIMATE'],['kill','SCORES A KO'],['hurt','TAKES A BIG HIT'],['win','WINS THE MATCH'],['theme','BATTLE THEME (WHEN YOU PLAY THEM)']];
const CVM_SLOTS=[['menu','IDLE / MENU MUSIC'],['battle','BATTLE MUSIC'],['boss','BOSS FIGHT MUSIC'],['victory','VICTORY MUSIC']];
const CV_MAX_MB=6,CV_MUS_MB=30,CV_MUS='_music';
const CV={db:null,map:{},urls:{},playing:null,hurtT:{},sel:null,tab:'voice'};
if(SET.customVoice===undefined)SET.customVoice=true;

function cvOpen(){return new Promise((res,rej)=>{if(CV.db)return res(CV.db);if(!window.indexedDB)return rej('no idb');
  const r=indexedDB.open('surge-customvoice',1);r.onupgradeneeded=()=>{r.result.createObjectStore('clips',{keyPath:'id'});};
  r.onsuccess=()=>{CV.db=r.result;res(CV.db);};r.onerror=()=>rej(r.error);});}
function cvTx(mode){return CV.db.transaction('clips',mode).objectStore('clips');}
function cvLoad(){return cvOpen().then(()=>new Promise(res=>{const q=cvTx('readonly').getAll();q.onsuccess=()=>{CV.map={};
  Object.values(CV.urls).forEach(u=>{try{URL.revokeObjectURL(u);}catch(e){}});CV.urls={};
  (q.result||[]).forEach(c=>{const k=c.fid+':'+c.slot;(CV.map[k]=CV.map[k]||[]).push(c);CV.urls[c.id]=URL.createObjectURL(c.blob);});res();};q.onerror=()=>res();})).catch(()=>{});}
function cvAdd(fid,slot,file){return cvOpen().then(()=>new Promise((res,rej)=>{
  const mx=(fid===CV_MUS||slot==='theme')?CV_MUS_MB:CV_MAX_MB;if(file.size>mx*1048576)return rej(file.name+' is over '+mx+' MB');
  const c={id:fid+':'+slot+':'+Date.now()+':'+Math.random().toString(36).slice(2,7),fid,slot,name:file.name,blob:file};
  const q=cvTx('readwrite').put(c);q.onsuccess=()=>res();q.onerror=()=>rej(q.error&&q.error.message||'could not save');}));}
function cvDel(id){return cvOpen().then(()=>new Promise(res=>{const q=cvTx('readwrite').delete(id);q.onsuccess=q.onerror=()=>res();}));}

// which voice a fighter uses: Marrow's DREAD form gets its own set
function cvId(f){try{return (f.hero&&KIT(f.hero,'elem'))||f.hero.id;}catch(e){return f.hero&&f.hero.id;}}
function cvClips(fid,slot){return CV.map[fid+':'+slot]||[];}
function cvHas(f,slot){return SET.customVoice!==false&&cvClips(cvId(f),slot).length>0;}
function cvStop(){if(CV.playing){try{CV.playing.pause();}catch(e){}CV.playing=null;}}
function cvPlayClip(c,vol){cvStop();const u=CV.urls[c.id];if(!u)return null;const a=new Audio(u);
  a.volume=Math.max(0,Math.min(1,(SET.sfx==null?85:SET.sfx)/100*(vol||1)));CV.playing=a;
  a.onloadedmetadata=()=>{if(typeof duckMusic==='function'&&isFinite(a.duration))duckMusic(Math.min(6,a.duration+.3));};
  a.play().catch(()=>{});return a;}
function cvPlay(f,slot,vol){if(!cvHas(f,slot))return false;const L=cvClips(cvId(f),slot);
  try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}cvPlayClip(L[Math.floor(Math.random()*L.length)],vol);return true;}
function cvNear(f,R){return f===ME||(ME&&f&&f.pos&&f.pos.distanceTo(ME.pos)<(R||16));}

// hook the voice moments (custom clip replaces the spoken line when one is set)
const _cvUlt=ultCry;ultCry=function(f){if(cvPlay(f,'ult'))return;if(SET.ultSfx)return _cvUlt.apply(this,arguments);};
/* built-in ultimate sounds (spoken cry, orchestral sting, charge-up, per-element ult sound) are OFF unless
   SET.ultSfx is turned on in Settings — only custom ULTIMATE clips play. Attack impacts during an ult still sound. */
if(SET.ultSfx===undefined)SET.ultSfx=false;
const _cvSfx=sfx;sfx=function(f,kind){if(!SET.ultSfx&&(kind==='ult'||(kind==='charge'&&f&&f.state==='ult')))return;return _cvSfx.apply(this,arguments);};
const _cvStartUlt=Fighter.prototype.startUlt;Fighter.prototype.startUlt=function(){CV.inUlt=1;try{return _cvStartUlt.apply(this,arguments);}finally{CV.inUlt=0;}};
const _cvSting=AU.sting;AU.sting=function(){if(CV.inUlt&&!SET.ultSfx)return;return _cvSting.apply(this,arguments);};
Object.keys(SND).forEach(k=>{const P=SND[k];if(P&&typeof P.ult==='function'){const o=P.ult;P.ult=function(){if(SET.ultSfx)return o.apply(this,arguments);};}});
const _cvSay=sayLine;sayLine=function(f,text,o){if(f&&f.__cvWin&&cvPlay(f,'win'))return;return _cvSay.apply(this,arguments);};
onEv('kill',(d,a)=>{if(a&&a!==d&&cvNear(a)&&cvHas(a,'kill'))setTimeout(()=>cvPlay(a,'kill'),250);});
onEv('hit',(a,d,dmg)=>{if(!d||d.dead||dmg<12||!cvNear(d,12)||!cvHas(d,'hurt'))return;const now=performance.now();
  if(now-(CV.hurtT[d.id||d.name]||0)<4000)return;CV.hurtT[d.id||d.name]=now;if(CV.playing&&!CV.playing.paused&&!CV.playing.ended)return;cvPlay(d,'hurt',.9);});
onEv('win',w=>{if(w&&cvHas(w,'win')){w.__cvWin=1;setTimeout(()=>{cvPlay(w,'win');w.__cvWin=0;},1250);}});
onEv('matchEnd',()=>{setTimeout(cvStop,1500);});

// ---------- manager screen ----------
function cvFighters(){const L=HEROES.map(h=>({id:(h.as&&h.as.elem)||h.id,name:h.name}));L.push({id:'dread',name:'MARROW · DREAD FORM'});return L;}
function cvEsc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function cvSlotHTML(fid,s,n){return `<div class="cvSlot"><div class="cvSt"><b>${n}</b><label class="chip">+ ADD AUDIO<input type="file" accept="audio/*" multiple data-s="${s}" hidden></label></div>
  ${cvClips(fid,s).map(c=>`<div class="cvClip"><span>${cvEsc(c.name)}</span><button class="chip" data-p="${c.id}">▶</button><button class="chip" data-d="${c.id}">✕</button></div>`).join('')||`<div class="cvEmpty">${fid===CV_MUS||s==='theme'?'No track: uses the built-in music':s==='ult'?'No clip: ultimate is silent (built-in ult sounds are off)':'No clip: uses the built-in voice'}</div>`}</div>`;}
function cvUI(fid,tab){let box=$('cvBox');
  if(!box){box=document.createElement('div');box.id='cvBox';document.body.appendChild(box);
    box.addEventListener('keydown',e=>e.stopPropagation());box.addEventListener('mousedown',e=>e.stopPropagation());}
  if(tab)CV.tab=tab;const F=cvFighters();CV.sel=fid||CV.sel||F[0].id;if(!F.some(x=>x.id===CV.sel))CV.sel=F[0].id;
  const count=id=>CV_SLOTS.reduce((n,[s])=>n+cvClips(id,s).length,0),mus=CV.tab==='music',tgt=mus?CV_MUS:CV.sel;
  box.innerHTML=`<div class="cvIn"><div class="cvHd"><b>CUSTOM SOUNDS</b><button class="chip" id="cvX">✕ CLOSE</button></div>
    <div class="cvNote">🔒 Your clips stay in this browser only. They're never uploaded, never sent to other players online and never included in the game files. Only you hear them.</div>
    <div class="cvRow"><button class="chip cvTab${mus?'':' on'}" data-t="voice">🎙 FIGHTER VOICES</button><button class="chip cvTab${mus?' on':''}" data-t="music">🎵 MUSIC</button>
    <button class="chip${SET.customVoice!==false?' on':''}" id="cvOn" style="margin-left:auto">${SET.customVoice!==false?'CUSTOM SOUNDS ON':'CUSTOM SOUNDS OFF'}</button></div>
    ${mus?'':`<div class="cvRow"><span>FIGHTER</span><select id="cvSel">${F.map(x=>`<option value="${x.id}"${x.id===CV.sel?' selected':''}>${cvEsc(x.name)}${count(x.id)?'  ♪'+count(x.id):''}</option>`).join('')}</select></div>`}
    <div id="cvSlots">${(mus?CVM_SLOTS:CV_SLOTS).map(([s,n])=>cvSlotHTML(tgt,s,n)).join('')}</div>
    <div class="cvErr" id="cvErr"></div><div class="cvNote">${mus?`Music loops; several tracks in one slot shuffle. A fighter's own BATTLE THEME (Fighter Voices tab) replaces Battle Music when you play them. Max ${CV_MUS_MB} MB per track. Plays at your Music volume (M toggles music).`:`Several clips in one slot play at random. Max ${CV_MAX_MB} MB per clip (${CV_MUS_MB} MB for a battle theme). Clips play at your SFX volume.`}</div></div>`;
  box.classList.add('on');
  $('cvX').onclick=()=>{cvStop();box.classList.remove('on');CVM.key=null;AU.ui&&AU.ui();};
  if($('cvSel'))$('cvSel').onchange=e=>{cvStop();cvUI(e.target.value);};
  box.querySelectorAll('.cvTab').forEach(b=>b.onclick=()=>{cvStop();cvUI(CV.sel,b.dataset.t);});
  $('cvOn').onclick=()=>{SET.customVoice=SET.customVoice===false;setSave();CVM.key=null;cvUI(CV.sel);};
  box.querySelectorAll('input[type=file]').forEach(inp=>inp.onchange=async()=>{const err=[];
    for(const f of inp.files){if(!/^audio\//.test(f.type)&&!/\.(mp3|wav|ogg|m4a|aac|webm|flac)$/i.test(f.name)){err.push(f.name+' is not an audio file');continue;}
      try{await cvAdd(tgt,inp.dataset.s,f);}catch(e){err.push(String(e));}}
    await cvLoad();CVM.key=null;cvUI(CV.sel);if(err.length)$('cvErr').textContent=err.join(' · ');});
  box.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const c=Object.values(CV.map).flat().find(x=>x.id===b.dataset.p);if(c)cvPlayClip(c,(c.fid===CV_MUS||c.slot==='theme')?.6:1);});
  box.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{cvStop();await cvDel(b.dataset.d);await cvLoad();CVM.key=null;cvUI(CV.sel);});}

/* ---------- custom music: replaces the procedural soundtrack for the matching situation ---------- */
const CVM={key:null,el:null,g:null,list:null};
function cvmWant(){if(SET.customVoice===false||!AU.ctx||!AU.music||!AU.timer||!AU.mus)return null;const t=AU.theme;
  if(t==='menu'){const L=cvClips(CV_MUS,'menu');return L.length?{key:'menu',L}:null;}
  if(t==='boss'){const L=cvClips(CV_MUS,'boss');return L.length?{key:'boss',L}:null;}
  if(t==='battle'){if(ME){const id=cvId(ME),L=cvClips(id,'theme');if(L.length)return {key:'theme:'+id,L};}const L=cvClips(CV_MUS,'battle');return L.length?{key:'battle',L}:null;}
  return null;}
function cvmStop(){const el=CVM.el,g=CVM.g;CVM.el=CVM.g=null;if(!el)return;try{const t=AU.ctx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.6);}catch(e){}
  setTimeout(()=>{try{el.pause();el.src='';g.disconnect();}catch(e){}},700);}
function cvmStart(L,loop){const c=L[Math.floor(Math.random()*L.length)],u=CV.urls[c.id];if(!u||!AU.ctx)return;
  const el=new Audio(u);el.loop=!!loop&&L.length===1;let g;
  try{const src=AU.ctx.createMediaElementSource(el);g=AU.ctx.createGain();g.gain.value=0;src.connect(g);g.connect(AU.mus);const t=AU.ctx.currentTime;g.gain.linearRampToValueAtTime(3.5,t+.8);}
  catch(e){g={gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},disconnect(){}};el.volume=(SET.music==null?70:SET.music)/100;}
  el.onended=()=>{if(CVM.el!==el)return;if(CVM.key==='victory'){cvmStop();CVM.key=null;return;}cvmStop();cvmStart(CVM.list,loop);};
  CVM.el=el;CVM.g=g;el.play().catch(()=>{});}
function cvmSync(){if(CVM.key==='victory'&&CVM.el)return;const w=cvmWant(),k=w?w.key:null;
  if(k===CVM.key&&(!k||CVM.el))return;cvmStop();CVM.key=k;CVM.list=w?w.L:null;if(w)cvmStart(w.L,true);}
setInterval(()=>{try{cvmSync();}catch(e){}},300);
// procedural music stays silent (but keeps time) while a custom track is playing
const _cvSched=AU.sched;AU.sched=function(){if(CVM.el&&this.ctx){const c=this.ctx;while(this.nextT<c.currentTime+.12){this.nextT+=.03;this.step=(this.step+1)%64;}return;}return _cvSched.apply(this,arguments);};
const _cvStopM=AU.stopMusic;AU.stopMusic=function(){const r=_cvStopM.apply(this,arguments);if(CVM.key!=='victory'){cvmStop();CVM.key=null;}return r;};
const _cvFan=AU.fanfare;AU.fanfare=function(){const L=SET.customVoice!==false&&AU.ctx&&AU.mus&&cvClips(CV_MUS,'victory');
  if(L&&L.length){cvmStop();CVM.key='victory';CVM.list=L;cvmStart(L,false);return;}return _cvFan.apply(this,arguments);};
onEv('matchStart',()=>{if(CVM.key==='victory'){cvmStop();CVM.key=null;}});

// entry points: Settings and the fighter preview
const _cvSS=showSettings;showSettings=function(){const r=_cvSS.apply(this,arguments);try{const L=$('setList');
  const h=document.createElement('div');h.className='seth';h.textContent='CUSTOM SOUNDS';L.appendChild(h);
  const row=document.createElement('div');row.className='setrow';row.innerHTML='<span class="setl">YOUR OWN VOICE CLIPS AND MUSIC (THIS BROWSER ONLY)</span>';
  const b=document.createElement('button');b.className='chip';b.textContent='🎙 MANAGE';b.onclick=()=>cvUI(null,'voice');row.appendChild(b);L.appendChild(row);
  const r2=document.createElement('div');r2.className='setrow';r2.innerHTML='<span class="setl">BUILT-IN ULTIMATE SOUNDS (CRY, STING, CHARGE)</span>';const t=document.createElement('button');t.className='chip'+(SET.ultSfx?' on':'');t.textContent=SET.ultSfx?'ON':'OFF';
  t.onclick=()=>{SET.ultSfx=!SET.ultSfx;setSave();showSettings();};r2.appendChild(t);L.appendChild(r2);}catch(e){}return r;};
const _cvPv=previewHero;previewHero=function(i){const r=_cvPv.apply(this,arguments);try{const h=heroAt(i);let b=$('pvCVoice');
  if(!b){b=document.createElement('button');b.id='pvCVoice';b.className='chip';b.title='Use your own audio clips for this fighter';b.textContent='🎙 CUSTOM';
    const v=$('pvVoice')||$('pvName');if(v&&v.parentNode)v.parentNode.insertBefore(b,v.nextSibling);}
  const id=(h.as&&h.as.elem)||h.id;const n=CV_SLOTS.reduce((k,[s])=>k+cvClips(id,s).length,0);b.textContent=n?'🎙 CUSTOM ♪'+n:'🎙 CUSTOM';
  b.onclick=e=>{e.stopPropagation();cvUI(id,'voice');};const pv=$('pvVoice');if(pv)pv.style.display=(SET.ultSfx||cvClips(id,'ult').length)?'':'none';}catch(e){}return r;};
cvLoad();
