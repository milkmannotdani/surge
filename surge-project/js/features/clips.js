/* CLIPS — recording, instant replay, a clip gallery with trimming, download and share.
   F8  start / stop a recording (any length, up to 10 min)
   F9  save the last 15–30 seconds (instant replay, always running during matches)
   Auto-highlights: your KOs (multi-KOs merge into one clip) and your wins are clipped automatically.
   Video = the 3D view plus a light HUD drawn on top; audio = all game sound and music (spoken text-to-speech lines can't be captured by browsers).
   Clips are stored in this browser (IndexedDB) — nothing is uploaded unless you share/download it yourself. */
const CLIP_L=15,CLIP_MANUAL_MAX=600,CLIP_AUTO_KEEP=15;
const REC={cv:null,cx:null,stream:null,aDest:null,mime:'',ext:'webm',slots:[],man:null,manT0:0,feed:[],ultB:null,kos:0,autoT:0,autoWhy:'',db:null,busy:0};
['replay','autoClip','clipHud'].forEach(k=>{if(SET[k]===undefined)SET[k]=true;});

function recMime(){if(!window.MediaRecorder)return '';const L=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  for(const m of L){try{if(MediaRecorder.isTypeSupported(m))return m;}catch(e){}}return '';}
function recSupported(){return !!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream&&recMime());}
function recInit(){if(REC.stream)return true;if(!recSupported())return false;
  REC.mime=recMime();REC.ext=/mp4/.test(REC.mime)?'mp4':'webm';
  const cv=document.createElement('canvas');REC.cv=cv;REC.cx=cv.getContext('2d');recSize();
  REC.stream=cv.captureStream(30);
  try{if(!AU.ctx)AU.init();if(AU.ctx&&AU.master){REC.aDest=AU.ctx.createMediaStreamDestination();AU.master.connect(REC.aDest);REC.aDest.stream.getAudioTracks().forEach(t=>REC.stream.addTrack(t));}}catch(e){}
  return true;}
function recSize(){const src=renderer.domElement,w=src.width||1280,h=src.height||720,s=Math.min(1,1280/w,720/h);
  const W=Math.max(2,Math.round(w*s/2)*2),H=Math.max(2,Math.round(h*s/2)*2);if(REC.cv&&(REC.cv.width!==W||REC.cv.height!==H)){REC.cv.width=W;REC.cv.height=H;}}
function recActive(){return !!(REC.man||REC.slots.some(s=>s.rec));}

// ---------- compositing: copy the 3D frame right after it renders, draw a light HUD over it ----------
const _recRender=render;render=function(){const r=_recRender.apply(this,arguments);if(recActive())try{recFrame();}catch(e){}return r;};
function recFrame(){recSize();const c=REC.cx,W=REC.cv.width,H=REC.cv.height;c.drawImage(renderer.domElement,0,0,W,H);
  if(SET.clipHud===false)return;const u=H/720;c.save();c.textBaseline='middle';
  if(typeof KC!=='undefined'&&KC.on){c.fillStyle='#000';c.fillRect(0,0,W,H*.09);c.fillRect(0,H*.91,W,H*.09);}
  c.font=`${Math.round(30*u)}px "Bebas Neue",Impact,sans-serif`;c.globalAlpha=.75;c.fillStyle='#ffd23f';c.textAlign='right';c.fillText('SURGE',W-18*u,H-24*u);c.globalAlpha=1;
  if(ME&&inMatch()){const x=22*u,y=H-70*u,bw=260*u;c.textAlign='left';c.font=`${Math.round(26*u)}px "Bebas Neue",Impact,sans-serif`;
    c.fillStyle='#fff';c.fillText(((ME.hero.name||'')+' · '+(ME.name||'')).toUpperCase(),x,y-20*u);
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x,y,bw,14*u);c.fillStyle=ME.hp>35?'#5dff8a':'#ff4d4d';c.fillRect(x,y,bw*Math.max(0,ME.hp)/100,14*u);
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x,y+18*u,bw,7*u);c.fillStyle=ME.meter>=100?'#ffd23f':'#4fd2ff';c.fillRect(x,y+18*u,bw*Math.min(100,ME.meter||0)/100,7*u);
    const alive=FS.filter(f=>!f.dead).length;c.textAlign='right';c.font=`${Math.round(24*u)}px "Bebas Neue",Impact,sans-serif`;c.fillStyle='#fff';
    c.fillText(`${alive} ALIVE · ${REC.kos} KO`,W-18*u,26*u);
    const now=performance.now();REC.feed=REC.feed.filter(e=>now-e.t<5000);c.font=`${Math.round(19*u)}px Rajdhani,sans-serif`;
    REC.feed.forEach((e,i)=>{c.globalAlpha=Math.min(1,(5000-(now-e.t))/600);c.fillStyle='rgba(0,0,0,.5)';const tw=c.measureText(e.s).width;c.fillRect(W-24*u-tw,48*u+i*26*u,tw+12*u,23*u);c.fillStyle=e.c;c.fillText(e.s,W-18*u,60*u+i*26*u);});c.globalAlpha=1;
    if(REC.ultB&&now-REC.ultB.t<1700){const a=Math.min(1,(1700-(now-REC.ultB.t))/400);c.globalAlpha=a;c.textAlign='center';c.font=`${Math.round(64*u)}px "Bebas Neue",Impact,sans-serif`;
      c.lineWidth=6*u;c.strokeStyle='#000';c.strokeText(REC.ultB.s,W/2,H*.3);c.fillStyle=REC.ultB.c;c.fillText(REC.ultB.s,W/2,H*.3);c.globalAlpha=1;}}
  if(REC.man){const s=Math.floor((performance.now()-REC.manT0)/1000);c.textAlign='left';c.fillStyle='#ff3b3b';c.beginPath();c.arc(24*u,24*u,8*u,0,7);c.fill();
    c.font=`${Math.round(20*u)}px Rajdhani,sans-serif`;c.fillStyle='#fff';c.fillText(`REC ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,38*u,25*u);}
  c.restore();}
onEv('kill',(d,a)=>{if(!d)return;const nm=f=>(f.name||f.hero.name||'?').toUpperCase();
  REC.feed.unshift({t:performance.now(),s:a&&a!==d?`${nm(a)}  ✕  ${nm(d)}`:`${nm(d)} WAS KO'D`,c:a===ME?'#ffd23f':d===ME?'#ff6a6a':'#fff'});REC.feed.length=Math.min(REC.feed.length,4);
  if(a===ME&&d!==ME){REC.kos++;if(SET.autoClip!==false&&SET.replay!==false&&inMatch()){REC.autoT=performance.now()+3000;REC.autoWhy=REC.autoWhy?REC.autoWhy.replace(/^(\d+)?x?\s?KO/,(m,n)=>`${(+n||1)+1}x KO`):'KO on '+nm(d);}}});
onEv('ult',f=>{if(f===ME||(ME&&f.pos&&f.pos.distanceTo(ME.pos)<25))REC.ultB={t:performance.now(),s:(typeof ultLabel==='function'?ultLabel(f):'ULTIMATE').toUpperCase(),c:f.hero.css||'#ffd23f'};});

// ---------- instant replay: two staggered recorders, so one always holds 15–30 s ----------
function slotStart(s){if(!REC.stream)return;s.chunks=[];s.want=null;s.restart=false;let r;
  try{r=new MediaRecorder(REC.stream,{mimeType:REC.mime,videoBitsPerSecond:5e6,audioBitsPerSecond:128e3});}catch(e){s.rec=null;return;}
  s.rec=r;s.t0=performance.now();r.ondataavailable=e=>{if(e.data&&e.data.size)s.chunks.push(e.data);};
  r.onstop=()=>{const want=s.want,ch=s.chunks,dur=(performance.now()-s.t0)/1000;s.rec=null;s.chunks=[];
    if(want)clipSave(new Blob(ch,{type:REC.mime.split(';')[0]}),Math.min(dur,CLIP_L*2),want);if(s.restart&&REC.replayOn)slotStart(s);};
  try{r.start(1000);}catch(e){s.rec=null;}}
function replayStart(){if(SET.replay===false||REC.replayOn||!recInit())return;REC.replayOn=true;REC.slots=[{},{}];slotStart(REC.slots[0]);
  REC.slotT=setTimeout(()=>{if(REC.replayOn)slotStart(REC.slots[1]);},CLIP_L*1000);}
function replayStop(){REC.replayOn=false;clearTimeout(REC.slotT);REC.slots.forEach(s=>{if(s.rec){s.restart=false;try{s.rec.stop();}catch(e){}}});}
setInterval(()=>{const now=performance.now();
  REC.slots.forEach(s=>{if(s.rec&&!s.want&&now-s.t0>CLIP_L*2000){s.restart=true;try{s.rec.stop();}catch(e){}}});
  if(REC.autoT&&now>REC.autoT){REC.autoT=0;const w=REC.autoWhy;REC.autoWhy='';clipNow({auto:true,why:w});}
  if(REC.man&&now-REC.manT0>CLIP_MANUAL_MAX*1000)recToggle();
  const d=$('recDot');if(d){d.style.display=REC.man?'flex':'none';if(REC.man){const s=Math.floor((now-REC.manT0)/1000);d.lastChild.textContent=` REC ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}}},250);
function clipNow(o){o=o||{};if(!REC.replayOn){if(!o.auto)announceSmall(SET.replay===false?'INSTANT REPLAY IS OFF (SETTINGS)':recSupported()?'INSTANT REPLAY STARTS WHEN A MATCH DOES':'THIS BROWSER CAN\'T RECORD VIDEO');return false;}
  const L=REC.slots.filter(s=>s.rec&&!s.want).sort((a,b)=>a.t0-b.t0),s=L[0];if(!s||performance.now()-s.t0<3000){if(!o.auto)announceSmall('NOT ENOUGH FOOTAGE YET');return false;}
  s.want={auto:!!o.auto,why:o.why||(o.auto?'':'INSTANT REPLAY'),thumb:clipThumb(),hero:ME&&ME.hero.name};s.restart=true;try{s.rec.stop();}catch(e){}return true;}
onEv('matchStart',()=>{REC.kos=0;REC.feed=[];REC.autoT=0;REC.autoWhy='';setTimeout(replayStart,500);});
onEv('win',w=>{const won=ME&&w&&(w===ME||(typeof ally==='function'&&ally(w,ME)));
  if(won&&SET.autoClip!==false&&REC.replayOn){REC.autoT=0;const why='VICTORY'+(REC.autoWhy?' · '+REC.autoWhy:'');REC.autoWhy='';setTimeout(()=>clipNow({auto:true,why}),2500);}});
onEv('matchEnd',()=>{if(REC.autoT){REC.autoT=0;clipNow({auto:true,why:REC.autoWhy});REC.autoWhy='';}setTimeout(replayStop,300);});

// ---------- manual recording ----------
function recToggle(){if(REC.man){const r=REC.man;REC.man=null;try{r.stop();}catch(e){}return;}
  if(!recInit()){announceSmall('THIS BROWSER CAN\'T RECORD VIDEO');return;}let r;
  try{r=new MediaRecorder(REC.stream,{mimeType:REC.mime,videoBitsPerSecond:6e6,audioBitsPerSecond:128e3});}catch(e){announceSmall('RECORDING FAILED TO START');return;}
  const ch=[],t0=performance.now(),thumb=clipThumb();r.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data);};
  r.onstop=()=>{const dur=(performance.now()-t0)/1000;if(dur<1)return;clipSave(new Blob(ch,{type:REC.mime.split(';')[0]}),dur,{auto:false,why:'RECORDING',thumb:clipThumb()||thumb,hero:ME&&ME.hero.name});};
  r.start(1000);REC.man=r;REC.manT0=t0;announceSmall('● RECORDING · F8 TO STOP');AU.ui&&AU.ui();}
function clipThumb(){try{if(!REC.cv)return '';const t=document.createElement('canvas');t.width=320;t.height=180;t.getContext('2d').drawImage(REC.cv,0,0,320,180);return t.toDataURL('image/jpeg',.7);}catch(e){return '';}}
addEventListener('keydown',e=>{if(e.repeat)return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
  if(e.code==='F8'){e.preventDefault();recToggle();}else if(e.code==='F9'){e.preventDefault();if(clipNow())announceSmall('💾 SAVING CLIP…');}});

// ---------- storage ----------
function clipDB(){return new Promise((res,rej)=>{if(REC.db)return res(REC.db);if(!window.indexedDB)return rej('no storage');const r=indexedDB.open('surge-clips',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});r.onsuccess=()=>{REC.db=r.result;res(REC.db);};r.onerror=()=>rej(r.error);});}
function clipStore(mode){return REC.db.transaction('clips',mode).objectStore('clips');}
function clipAll(){return clipDB().then(()=>new Promise(res=>{const q=clipStore('readonly').getAll();q.onsuccess=()=>res((q.result||[]).sort((a,b)=>b.date-a.date));q.onerror=()=>res([]);})).catch(()=>[]);}
function clipPut(c){return clipDB().then(()=>new Promise((res,rej)=>{const q=clipStore('readwrite').put(c);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);}));}
function clipDel(id){return clipDB().then(()=>new Promise(res=>{const q=clipStore('readwrite').delete(id);q.onsuccess=q.onerror=()=>res();}));}
async function clipSave(blob,dur,o){if(!blob||blob.size<2000)return;const d=new Date();
  const c={id:'c'+d.getTime()+Math.random().toString(36).slice(2,6),blob,mime:blob.type,ext:/mp4/.test(blob.type)?'mp4':'webm',dur:Math.round(dur*10)/10,date:d.getTime(),
    auto:!!o.auto,thumb:o.thumb||'',name:[o.hero,o.why].filter(Boolean).join(' · ').toUpperCase()||'CLIP'};
  try{await clipPut(c);}catch(e){announceSmall('CLIP NOT SAVED: BROWSER STORAGE IS FULL');return;}
  if(c.auto){const L=(await clipAll()).filter(x=>x.auto);for(const x of L.slice(CLIP_AUTO_KEEP))await clipDel(x.id);}
  clipToast(c);const n=(await clipAll()).length;if(typeof achGive==='function'){achGive('clip1');if(n>=10)achGive('clip10');}
  if($('clipBox')&&$('clipBox').classList.contains('on'))clipUI();}
function clipToast(c){let t=$('clipToast');if(!t){t=document.createElement('div');t.id='clipToast';document.body.appendChild(t);}
  t.innerHTML=`${c.thumb?`<img src="${c.thumb}">`:''}<div><b>${c.auto?'HIGHLIGHT SAVED':'CLIP SAVED'}</b><span>${clipEsc(c.name)} · ${clipDur(c.dur)}</span><span class="ct2">🎬 CLIPS on the title screen or pause menu</span></div>`;
  t.classList.remove('on');void t.offsetWidth;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),4200);}
function clipEsc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function clipDur(s){s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function clipFile(c){const nm=('surge-'+c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).slice(0,60)+'.'+c.ext;return new File([c.blob],nm,{type:c.mime||c.blob.type});}
// inside the published Claude page, files are handed over through its downloads capability (the viewer confirms); elsewhere a normal download link
let CLIP_DL=null;try{if(window.claude&&typeof window.claude.use==='function')CLIP_DL=window.claude.use('downloads').catch(()=>null);}catch(e){}
async function clipDownload(c){const f=clipFile(c);const dl=CLIP_DL?await CLIP_DL:null;
  if(dl){try{await dl.save({filename:f.name,data:c.blob});if(typeof achGive==='function')achGive('share');announceSmall('⬇ CLIP SAVED TO YOUR DEVICE');}
    catch(e){const k=e&&e.code;if(k!=='declined')announceSmall(k==='rate_limited'?'A SAVE IS ALREADY WAITING, TRY AGAIN IN A MOMENT':'DOWNLOADS AREN\'T AVAILABLE HERE');}return;}
  clipDownloadLink(c);}
function clipDownloadLink(c){const f=clipFile(c),u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);
  try{a.click();}catch(e){window.open(u,'_blank');}setTimeout(()=>{a.remove();URL.revokeObjectURL(u);},60000);if(typeof achGive==='function')achGive('share');}
async function clipShare(c){const f=clipFile(c);
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'SURGE clip',text:c.name+' — played in SURGE'});if(typeof achGive==='function')achGive('share');return;}}
  catch(e){if(e&&e.name==='AbortError')return;}
  announceSmall('SHARING ISN\'T AVAILABLE HERE, SO THE CLIP WAS DOWNLOADED');clipDownload(c);}

// trimming: replays the chosen part and re-records it (takes as long as the trimmed part)
function clipTrim(c,a,b,onP){return new Promise((res,rej)=>{const v=document.createElement('video');v.src=URL.createObjectURL(c.blob);v.muted=false;v.playsInline=true;v.style.cssText='position:fixed;left:-9999px;width:2px;height:2px';document.body.appendChild(v);
  const done=(e,blob)=>{try{v.pause();URL.revokeObjectURL(v.src);v.remove();}catch(_){}e?rej(e):res(blob);};
  v.onloadedmetadata=async()=>{try{await clipFixDur(v);v.currentTime=a;await new Promise(r=>{v.onseeked=r;});
    const st=v.captureStream?v.captureStream():v.mozCaptureStream(),out=new MediaStream(st.getVideoTracks());let ctxA=null;
    // the clip's sound goes into the recording only, not out of the speakers
    try{ctxA=new (window.AudioContext||window.webkitAudioContext)();const src=ctxA.createMediaElementSource(v),dst=ctxA.createMediaStreamDestination();src.connect(dst);dst.stream.getAudioTracks().forEach(t=>out.addTrack(t));}
    catch(_){st.getAudioTracks().forEach(t=>out.addTrack(t));}
    const mime=recMime(),r=new MediaRecorder(out,{mimeType:mime,videoBitsPerSecond:6e6});const ch=[];r.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data);};
    r.onstop=()=>{try{ctxA&&ctxA.close();}catch(_){}done(null,new Blob(ch,{type:mime.split(';')[0]}));};
    r.start(500);await v.play();
    const tk=setInterval(()=>{onP&&onP((v.currentTime-a)/Math.max(.1,b-a));if(v.currentTime>=b||v.ended){clearInterval(tk);v.pause();r.stop();}},50);}catch(e){done(e);}};
  v.onerror=()=>done('could not read the clip');});}
// MediaRecorder files often report an unknown length; seek far ahead once so the browser works it out
function clipFixDur(v){return new Promise(res=>{if(isFinite(v.duration)&&v.duration>0)return res();const f=()=>{if(isFinite(v.duration)){v.removeEventListener('durationchange',f);v.currentTime=0;res();}};
  v.addEventListener('durationchange',f);v.currentTime=1e7;setTimeout(()=>{v.removeEventListener('durationchange',f);try{v.currentTime=0;}catch(e){}res();},2500);});}

// ---------- gallery ----------
async function clipUI(){let box=$('clipBox');if(!box){box=document.createElement('div');box.id='clipBox';document.body.appendChild(box);
    box.addEventListener('keydown',e=>{if(e.code!=='F8'&&e.code!=='F9')e.stopPropagation();});box.addEventListener('mousedown',e=>e.stopPropagation());}
  const L=await clipAll(),mb=L.reduce((n,c)=>n+c.blob.size,0)/1048576;box.classList.add('on');
  box.innerHTML=`<div class="clIn"><div class="cvHd"><b>🎬 CLIPS</b><button class="chip" id="clX">✕ CLOSE</button></div>
    <div class="clKeys"><span><kbd>F8</kbd> start / stop recording</span><span><kbd>F9</kbd> save the last 15–30 s</span><span>KOs and wins are clipped automatically</span></div>
    <div class="rowb" style="justify-content:flex-start;gap:8px;margin:6px 0 10px"><button class="chip" id="clRec">${REC.man?'⏹ STOP RECORDING':'⏺ START RECORDING'}</button><button class="chip" id="clSave"${REC.replayOn?'':' disabled'}>💾 SAVE LAST 30 s</button>
      <span class="clInfo">${L.length} clip${L.length===1?'':'s'} · ${mb.toFixed(0)} MB · stored in this browser only</span></div>
    ${recSupported()?'':'<div class="cvErr">This browser can\'t record video. Try Chrome, Edge or Firefox.</div>'}
    <div class="clGrid">${L.map(c=>`<div class="clCard" data-id="${c.id}"><div class="clTh" data-a="play">${c.thumb?`<img src="${c.thumb}">`:''}<span class="clD">${clipDur(c.dur)}</span>${c.auto?'<span class="clA">AUTO</span>':''}<span class="clPl">▶</span></div>
      <div class="clNm" title="${clipEsc(c.name)}">${clipEsc(c.name)}</div><div class="clDt">${new Date(c.date).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · ${(c.blob.size/1048576).toFixed(1)} MB · ${c.ext.toUpperCase()}</div>
      <div class="clBt"><button class="chip" data-a="play" title="Play / trim">▶</button><button class="chip" data-a="share" title="Share">📤</button><button class="chip" data-a="dl" title="Download">⬇</button><button class="chip" data-a="ren" title="Rename">✎</button><button class="chip" data-a="del" title="Delete">🗑</button></div></div>`).join('')
      ||'<div class="cvEmpty" style="padding:30px;text-align:center;font-size:16px">No clips yet. Press F9 in a match to save the last 30 seconds, or F8 to record.</div>'}</div></div>`;
  $('clX').onclick=()=>{box.classList.remove('on');AU.ui&&AU.ui();};
  $('clRec').onclick=()=>{recToggle();setTimeout(clipUI,100);};$('clSave').onclick=()=>{if(clipNow())announceSmall('💾 SAVING CLIP…');};
  box.querySelectorAll('.clCard [data-a]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=b.closest('.clCard').dataset.id,c=L.find(x=>x.id===id);if(!c)return;const a=b.dataset.a;
    if(a==='play')clipPlayer(c);else if(a==='share')clipShare(c);else if(a==='dl')clipDownload(c);
    else if(a==='ren'){const nm=b.closest('.clCard').querySelector('.clNm');nm.innerHTML=`<input class="clRen" maxlength="60" value="${clipEsc(c.name)}">`;const i=nm.firstChild;i.focus();i.select();
      const save=async()=>{const n=i.value.trim();if(n&&n.toUpperCase()!==c.name){c.name=n.toUpperCase().slice(0,60);await clipPut(c);}clipUI();};
      i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')save();if(e.key==='Escape')clipUI();};i.onblur=save;}
    else if(a==='del'){if(b.dataset.sure){await clipDel(id);clipUI();}else{b.dataset.sure=1;b.textContent='SURE?';b.classList.add('warn');setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent='🗑';b.classList.remove('warn');}},2500);}}});}
function clipPlayer(c){const box=$('clipBox');let P=$('clipPlay');if(P)P.remove();P=document.createElement('div');P.id='clipPlay';box.appendChild(P);const u=URL.createObjectURL(c.blob);
  P.innerHTML=`<div class="clPIn"><div class="cvHd"><b style="font-size:24px">${clipEsc(c.name)}</b><button class="chip" id="cpX">✕ BACK</button></div>
    <video id="cpV" src="${u}" controls playsinline></video>
    <div class="clTrim"><b>TRIM</b><label>START <input type="range" id="cpA" min="0" max="${c.dur}" step="0.1" value="0"><span id="cpAv">0:00</span></label>
      <label>END <input type="range" id="cpB" min="0" max="${c.dur}" step="0.1" value="${c.dur}"><span id="cpBv">${clipDur(c.dur)}</span></label></div>
    <div class="rowb" style="justify-content:flex-start;gap:8px"><button class="chip" id="cpSetA">⇤ START HERE</button><button class="chip" id="cpSetB">END HERE ⇥</button>
      <button class="chip" id="cpT">✂ SAVE TRIMMED COPY</button><button class="chip" id="cpS">📤 SHARE</button><button class="chip" id="cpD">⬇ DOWNLOAD</button><span class="clInfo" id="cpMsg"></span></div></div>`;
  const v=$('cpV'),A=$('cpA'),B=$('cpB'),fmt=()=>{$('cpAv').textContent=clipDur(+A.value);$('cpBv').textContent=clipDur(+B.value);};
  v.onloadedmetadata=()=>clipFixDur(v).then(()=>{if(isFinite(v.duration)&&v.duration>0){A.max=B.max=v.duration.toFixed(1);if(+B.value>v.duration||+B.value===c.dur)B.value=v.duration.toFixed(1);fmt();}});
  A.oninput=()=>{if(+A.value>+B.value-1)A.value=Math.max(0,+B.value-1);v.currentTime=+A.value;fmt();};
  B.oninput=()=>{if(+B.value<+A.value+1)B.value=+A.value+1;v.currentTime=+B.value;fmt();};
  v.ontimeupdate=()=>{if(!v.paused&&v.currentTime>=+B.value&&+B.value<+B.max-.05){v.pause();}};
  $('cpSetA').onclick=()=>{A.value=v.currentTime.toFixed(1);A.oninput();};$('cpSetB').onclick=()=>{B.value=v.currentTime.toFixed(1);B.oninput();};
  $('cpX').onclick=()=>{v.pause();URL.revokeObjectURL(u);P.remove();};
  $('cpS').onclick=()=>clipShare(c);$('cpD').onclick=()=>clipDownload(c);
  $('cpT').onclick=async()=>{const a=+A.value,b=+B.value;if(b-a<1)return;if(REC.busy){return;}REC.busy=1;v.pause();const m=$('cpMsg');
    try{const blob=await clipTrim(c,a,b,p=>{m.textContent='✂ TRIMMING… '+Math.round(Math.min(1,p)*100)+'%';});
      await clipPut({id:'c'+Date.now()+Math.random().toString(36).slice(2,6),blob,mime:blob.type,ext:/mp4/.test(blob.type)?'mp4':'webm',dur:Math.round((b-a)*10)/10,date:Date.now(),auto:false,thumb:c.thumb,name:(c.name+' (TRIMMED)').slice(0,60)});
      m.textContent='✔ TRIMMED COPY SAVED';setTimeout(()=>{if($('clipPlay'))$('clipPlay').remove();clipUI();},900);}
    catch(e){m.textContent='TRIM FAILED: '+e;}REC.busy=0;};}

// ---------- entry points: title screen, pause menu, settings ----------
(function(){const t=$('bSettings');if(t&&!$('bClips')){const b=document.createElement('button');b.className='chip tb2';b.id='bClips';b.textContent='🎬 CLIPS';b.onclick=()=>clipUI();t.parentNode.insertBefore(b,t);}
  const p=$('bQuit');if(p&&!$('bPClips')){const b=document.createElement('button');b.className='btn ghost';b.id='bPClips';b.textContent='🎬 CLIPS';b.onclick=()=>clipUI();p.parentNode.insertBefore(b,p);}
  if(!$('recDot')){const d=document.createElement('div');d.id='recDot';d.innerHTML='<i></i><span> REC</span>';d.onclick=()=>recToggle();d.title='Recording · F8 to stop';document.body.appendChild(d);}})();
const _clSS=showSettings;showSettings=function(){const r=_clSS.apply(this,arguments);try{const L=$('setList');const h=document.createElement('div');h.className='seth';h.textContent='CLIPS & RECORDING';L.appendChild(h);
  [['replay','INSTANT REPLAY (F9 SAVES THE LAST 15–30 S)'],['autoClip','AUTO-CLIP MY KOs AND WINS'],['clipHud','SHOW HUD IN CLIPS']].forEach(([k,n])=>{const row=document.createElement('div');row.className='setrow';
    row.innerHTML=`<span class="setl">${n}</span>`;const b=document.createElement('button');b.className='chip'+(SET[k]!==false?' on':'');b.textContent=SET[k]!==false?'ON':'OFF';
    b.onclick=()=>{SET[k]=SET[k]===false;setSave();if(k==='replay'){if(SET.replay===false)replayStop();else if(inMatch())replayStart();}showSettings();};row.appendChild(b);L.appendChild(row);});
  const row=document.createElement('div');row.className='setrow';row.innerHTML='<span class="setl">YOUR CLIPS</span>';const b=document.createElement('button');b.className='chip';b.textContent='🎬 OPEN';b.onclick=()=>clipUI();row.appendChild(b);L.appendChild(row);}catch(e){}return r;};
