/* Settings menu, the Game Modes menu, shift lock / lock-on camera, and controller button prompts.
   Settings are saved on this device ('surge.settings'). To add a setting: add a default to SET_DEF and a row to SET_ROWS. */
const SET_DEF={cursorLock:true,music:70,sfx:85,sens:50,invertY:false,shake:100,shiftLock:false,slKey:'KeyC',hint:true,touch:'auto',pad:'xbox',dmgNums:true,voiceLines:true,voice:'ptt',vcVol:80,tod:'random',weather:'random',crowds:true,surgeEv:true,decreeVoice:true};
const SET=Object.assign({},SET_DEF);try{Object.assign(SET,JSON.parse(store.get('surge.settings')||'{}'));}catch(e){}
function setSave(){store.set('surge.settings',JSON.stringify(SET));}
const SL_KEYS=[['KeyC','C'],['KeyV','V'],['KeyZ','Z'],['KeyG','G'],['KeyB','B'],['CapsLock','CAPS LOCK'],['AltLeft','LEFT ALT']];
const SET_ROWS=[
  ['AUDIO'],
  ['music','MUSIC VOLUME','range',0,100],['sfx','SOUND EFFECTS VOLUME','range',0,100],['voiceLines','FIGHTER VOICE LINES','toggle'],
  ['VOICE CHAT (ONLINE ROOMS)'],
  ['voice','VOICE CHAT','choice',[['off','OFF'],['ptt','PUSH TO TALK (V)'],['open','OPEN MIC']]],['vcVol','VOICE CHAT VOLUME','range',0,100],
  ['WORLD (OFFLINE MATCHES)'],
  ['tod','TIME OF DAY','choice',[['random','RANDOM'],['dusk','DUSK'],['day','DAY'],['night','NIGHT']]],['weather','WEATHER','choice',[['random','RANDOM'],['clear','CLEAR'],['rain','RAIN'],['storm','STORM']]],
  ['crowds','CIVILIAN CROWDS','toggle'],
  ['surgeEv','SURGE EVENTS','toggle'],
  ['decreeVoice','DECREE: SPOKEN ORDERS (MIC)','toggle'],
  ['CAMERA & CONTROLS'],
  ['cursorLock','LOCK CURSOR WHEN YOU CLICK INTO THE GAME','toggle'],['sens','MOUSE SENSITIVITY','range',10,150],['invertY','INVERT CAMERA Y','toggle'],['shake','SCREEN SHAKE','range',0,150],
  ['shiftLock','SHIFT LOCK ON AT START','toggle'],['slKey','SHIFT LOCK KEY','choice',SL_KEYS],
  ['pad','CONTROLLER BUTTONS','choice',[['xbox','XBOX (A B X Y)'],['ps','PLAYSTATION (✕ ○ □ △)']]],
  ['touch','TOUCH CONTROLS','choice',[['auto','AUTO'],['on','ALWAYS ON'],['off','OFF']]],
  ['INTERFACE'],
  ['hint','SHOW CONTROLS HINT IN MATCHES','toggle']];
function applySettings(){if(AU.ctx){if(AU.mus)AU.mus.gain.value=.2*SET.music/70;if(AU.sfx)AU.sfx.gain.value=SET.sfx/85;}
  if(typeof TOUCH!=='undefined'){const want=SET.touch==='on'||(SET.touch==='auto'&&(('ontouchstart' in window)||navigator.maxTouchPoints>0));if(want&&!TOUCH.on){TOUCH.on=true;buildTouch();}else if(!want){TOUCH.on=false;document.body.classList.remove('touchdev');}}
  document.body.classList.toggle('nohint',!SET.hint);refreshGlyphs();}
function showSettings(){showScreen('settings');const L=$('setList');L.innerHTML='';
  SET_ROWS.forEach(r=>{if(r.length===1){const h=document.createElement('div');h.className='seth';h.textContent=r[0];L.appendChild(h);return;}
    const [k,label,type,a,b]=r,row=document.createElement('div');row.className='setrow';row.innerHTML=`<span class="setl">${label}</span>`;
    if(type==='range'){const i=document.createElement('input');i.type='range';i.min=a;i.max=b;i.value=SET[k];const v=document.createElement('b');v.className='setv';v.textContent=SET[k];
      i.oninput=()=>{SET[k]=+i.value;v.textContent=i.value;setSave();applySettings();};i.onchange=()=>{if(k==='sfx'||k==='music'){AU.init();AU.ui();}};row.appendChild(i);row.appendChild(v);}
    else if(type==='toggle'){const t=document.createElement('button');t.className='chip'+(SET[k]?' on':'');t.textContent=SET[k]?'ON':'OFF';t.onclick=()=>{SET[k]=!SET[k];setSave();applySettings();AU.ui();showSettings();};row.appendChild(t);}
    else{const w=document.createElement('div');w.className='rowb';w.style.margin='0';a.forEach(([v,n])=>{const c=document.createElement('button');c.className='chip'+(SET[k]===v?' on':'');c.textContent=n;c.onclick=()=>{SET[k]=v;setSave();applySettings();AU.ui();showSettings();};w.appendChild(c);});row.appendChild(w);}
    L.appendChild(row);});}
$('bSettings').onclick=()=>{AU.init();AU.ui();showSettings();};
$('setBack').onclick=()=>{AU.ui();showScreen('title');};
$('setReset').onclick=()=>{Object.assign(SET,SET_DEF);setSave();applySettings();AU.ui();showSettings();};
$('bPlay').onclick=()=>{AU.init();AU.ui();showScreen('gmodes');};
$('bModesBack').onclick=()=>{AU.ui();showScreen('title');};
const _auInitS=AU.init;AU.init=function(){const first=!this.ctx;_auInitS.call(this);if(first)applySettings();};

/* ---- shift lock (toggle with the shift lock key) ---- */
function toggleShiftLock(force){SET.shiftLock=force!=null?force:!SET.shiftLock;setSave();
  if(SET.shiftLock){try{const r=cvs.requestPointerLock&&cvs.requestPointerLock();if(r&&r.catch)r.catch(()=>{game.plFail=true;});}catch(e){game.plFail=true;}game.plTried=true;}
  else if(document.pointerLockElement&&!SET.cursorLock)document.exitPointerLock();
  announceSmall(SET.shiftLock?'SHIFT LOCK ON':'SHIFT LOCK OFF');AU.ui();}
onEv('frame',()=>{const e=$('slIcon');if(e)e.classList.toggle('on',inMatch()&&SET.shiftLock&&!!ME);const x=$('xh');if(x&&inMatch())x.style.display=document.pointerLockElement?'block':'none';
  const cp=$('clickLock');if(cp)cp.classList.toggle('on',inMatch()&&game.phase!=='over'&&!paused&&!!ME&&!ME.dead&&(SET.cursorLock||SET.shiftLock)&&!document.pointerLockElement&&!game.plFail&&!TOUCH.on);});
// with shift lock on, your fighter faces where the camera points (unless you're locked on with Tab)
onEv('tick',dt=>{if(!ME||ME.dead||!SET.shiftLock||ME.hardLock)return;if(['idle','run','air','block'].indexOf(ME.state)<0)return;ME.face=angLerp(ME.face,camYaw,Math.min(1,14*dt));});
/* ---- lock-on (Tab / R3): locks onto the nearest enemy, then cycles; after the last one it lets go ---- */
function lockOnCycle(silent){if(!ME||ME.dead)return;const L=enemiesOf(ME).filter(o=>!o.dead&&o.pos.distanceTo(ME.pos)<32).sort((a,b)=>a.pos.distanceTo(ME.pos)-b.pos.distanceTo(ME.pos));
  if(!L.length){ME.hardLock=false;return;}
  if(!ME.hardLock||!ME.tgt||ME.tgt.dead){ME.hardLock=true;ME.tgt=L[0];}
  else{const i=L.indexOf(ME.tgt);if(i<0)ME.tgt=L[0];else if(i===L.length-1){ME.hardLock=false;if(!silent){announceSmall('LOCK-ON OFF');AU.ui();}return;}else ME.tgt=L[i+1];}
  manualTgtT=game.time;if(!silent){announceSmall('LOCKED ON: '+ME.tgt.name.toUpperCase());AU.ui();}}
onEv('matchStart',()=>{if(ME)ME.hardLock=false;if(SET.shiftLock||SET.cursorLock)game.plTried=false;});

/* ---- button prompts: keyboard keys, or controller buttons when you're playing on a gamepad ---- */
const INDEV={dev:'kb'};
const KB_NAMES={m1:'1',m2:'2',m3:'3',m4:'4',ult:'Q',awk:'X',res:'R',jump:'SPACE',dash:'SHIFT',light:'J',heavy:'K',block:'F',lock:'TAB',pause:'ESC'};
const PAD_GLYPH={xbox:{m1:['RB','sh'],m2:['LT','tr'],m3:['↑','dp'],m4:['→','dp'],ult:['RT','tr'],awk:['↓','dp'],res:['←','dp'],jump:['A','fa a'],dash:['B','fa b'],light:['X','fa x'],heavy:['Y','fa y'],block:['LB','sh'],lock:['R3','st'],pause:['☰','st']},
  ps:{m1:['R1','sh'],m2:['L2','tr'],m3:['↑','dp'],m4:['→','dp'],ult:['R2','tr'],awk:['↓','dp'],res:['←','dp'],jump:['✕','fa ps-x'],dash:['○','fa ps-o'],light:['□','fa ps-s'],heavy:['△','fa ps-t'],block:['L1','sh'],lock:['R3','st'],pause:['≡','st']}};
function onPad(){return INDEV.dev==='pad';}
function keyName(a){return onPad()?PAD_GLYPH[SET.pad][a][0]:KB_NAMES[a];}
function padGlyph(a,cls){if(!onPad())return '';const g=PAD_GLYPH[SET.pad][a];return `<em class="pg ${g[1]} ${cls||''}">${g[0]}</em>`;}
function keyHTML(a){if(!onPad())return `<kbd>${KB_NAMES[a]}</kbd>`;return padGlyph(a);}
function refreshGlyphs(){document.querySelectorAll('[data-a]').forEach(e=>{e.outerHTML=`<span data-a="${e.dataset.a}">${keyHTML(e.dataset.a)}</span>`;});
  document.body.classList.toggle('padui',onPad());if(typeof buildSlots==='function'&&inMatch())buildSlots();}
function setDev(d){if(INDEV.dev===d)return;INDEV.dev=d;refreshGlyphs();}
addEventListener('keydown',()=>setDev('kb'),true);addEventListener('mousedown',()=>setDev('kb'),true);
onEv('input',()=>{const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;if(!gp)return;
  if(gp.buttons.some(b=>b.pressed)||gp.axes.some(v=>Math.abs(v)>.4))setDev('pad');
  const r3=!!(gp.buttons[11]&&gp.buttons[11].pressed);if(r3&&!INDEV.r3&&inMatch())lockOnCycle();INDEV.r3=r3;});
// prompts that name a button
[['awkP','AWAKEN READY · PRESS ','awk'],['tuP','TEAM-UP! PRESS ','ult'],['civHint','HOLD ','res']].forEach(([id,t,a])=>{const e=$(id);if(e)e.innerHTML=t+`<span data-a="${a}"><kbd>${KB_NAMES[a]}</kbd></span>`+(id==='tuP'?' NOW':id==='civHint'?' TO RESCUE':'');});
// tutorial lessons: show controller buttons when on a gamepad
const TUT_PAD={'MOVE':'L-STICK','JUMP':'jump','DASH':'dash','BASIC ATTACKS':'light heavy','SPECIAL MOVE':'m1','EXTRA MOVES':'m3 m4','BLOCK':'block','BREAK OUT':'dash','CLIMB':'jump','ULTIMATE':'ult','AWAKENING':'awk'};
onEv('tick',()=>{if(!onPad())return;const o=$('objP');if(!o||!o.classList.contains('on'))return;const k=o.querySelector('kbd');if(!k)return;const m=/LESSON \d+\/\d+ · ([A-Z ]+)/.exec(o.textContent);if(!m)return;
  const v=TUT_PAD[m[1].trim()];if(!v)return;const html=v.split(' ').map(a=>KB_NAMES[a]?padGlyph(a):`<b>${a}</b>`).join(' ');const sp=document.createElement('span');sp.innerHTML=html;k.replaceWith(sp);});
applySettings();
