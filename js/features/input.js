/* Controller and touch controls. Both feed "virtual keys" into the same keys/pressed tables the keyboard uses, so
   every move works the same way. Gamepad layout (Xbox names; PlayStation in brackets):
     L-stick move · R-stick camera (smooth curve, aim slows near a target) · L3 ultimate · R3 lock-on
     A [✕] jump · B [○] dash (hold: sprint) · X [□] light · Y [△] heavy (hold: charge)
     LT [L2] AIM (hold, over-the-shoulder camera) · RT [R2] special (1) · RB [R1] alt special (2) · LB [L1] block
     LB + RB ultimate (Q; hold back on the stick or be in the air for the alt ult)
     D-pad ↑ move 3 · → move 4 · ↓ switch mode (5) · ← rescue / revive / lift (R) · View [Share] ping · Menu [Options] pause
   In menus: D-pad / left stick moves between buttons and fighters, A picks, B goes back, LB/RB flip the filter tabs,
   Menu starts the match from fighter select. Rumble on big hits. In cutscenes A advances. */
const VIN={held:new Set()};
function vDown(code){if(!keys[code])pressed.add(code);keys[code]=true;VIN.held.add(code);}
function vUp(code){if(VIN.held.has(code)){keys[code]=false;VIN.held.delete(code);}}
const PAD_MAP={0:'Space',1:'ShiftLeft',2:'KeyJ',3:'KeyK',4:'KeyF',7:'Digit1',12:'Digit3',15:'Digit4',14:'KeyR',13:'Digit5',10:'KeyQ',8:'KeyG'};
const PAD={on:false,prev:[],lx:0,ly:0,rx:0,ry:0,lt:false,rbCode:null,nav:{el:null,rep:0,dir:null},vib:null};
addEventListener('gamepadconnected',()=>{PAD.on=true;try{announceSmall('CONTROLLER CONNECTED');}catch(e){}});
function padDz(v){return Math.abs(v)<.16?0:(v-Math.sign(v)*.16)/.84;}
// look curve: fine control near the centre, fast turns at full tilt
function padCurve(v){const a=Math.abs(v);return Math.sign(v)*(a*.35+a*a*a*.65)*(a>.97?1.25:1);}
function padRumble(ms,weak,strong){try{const gp=[...navigator.getGamepads()].find(g=>g&&g.connected);const A=gp&&gp.vibrationActuator;if(A&&A.playEffect)A.playEffect('dual-rumble',{duration:ms,weakMagnitude:weak,strongMagnitude:strong});}catch(e){}}
onEv('input',dt=>{const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;if(!gp){PAD.lx=PAD.ly=PAD.rx=PAD.ry=0;PAD.lt=false;return;}PAD.on=true;
  const b=gp.buttons.map(x=>x.pressed||x.value>.5),pv=PAD.prev,menu=!inMatch()||paused;
  PAD.lx=padDz(gp.axes[0]||0);PAD.ly=padDz(gp.axes[1]||0);PAD.rx=padDz(gp.axes[2]||0);PAD.ry=padDz(gp.axes[3]||0);
  if(menu){padMenu(b,pv,dt);for(const i in PAD_MAP)if(!b[i]&&pv[i])vUp(PAD_MAP[i]);if(PAD.rbCode&&!b[5]){vUp(PAD.rbCode);PAD.rbCode=null;}PAD.prev=b;PAD.lt=false;return;}
  for(const i in PAD_MAP){const c=PAD_MAP[i];if(b[i]&&!pv[i])vDown(c);else if(!b[i]&&pv[i])vUp(c);}
  // View: HEMLOCK switches arrows with it (everyone else pings)
  if(b[8]&&!pv[8]&&ME&&typeof isHem==='function'&&isHem(ME)){vUp('KeyG');pressed.delete('KeyG');dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX',key:'x'}));}
  // RB: alt special, or the ultimate when LB is held with it
  if(b[5]&&!pv[5]){PAD.rbCode=b[4]?'KeyQ':'Digit2';if(PAD.rbCode==='KeyQ'){vUp('KeyF');}vDown(PAD.rbCode);}else if(!b[5]&&pv[5]&&PAD.rbCode){vUp(PAD.rbCode);PAD.rbCode=null;}
  if(b[4]&&!pv[4]&&b[5]&&PAD.rbCode==='Digit2'){vDown('KeyQ');setTimeout(()=>vUp('KeyQ'),80);}
  // LT: hold to aim (the classic camera has no aim, so it's a second block button there)
  const ltOn=(gp.buttons[6]&&(gp.buttons[6].pressed||gp.buttons[6].value>.35))||false;
  if(typeof shoulderCam==='function'&&shoulderCam())PAD.lt=ltOn;else{PAD.lt=false;if(ltOn&&!pv[6])vDown('KeyF');else if(!ltOn&&pv[6])vUp('KeyF');}
  b[6]=ltOn;
  if(b[9]&&!pv[9])dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
  if(b[0]&&!pv[0]&&typeof CUT!=='undefined'&&CUT)cutNext();
  PAD.prev=b;
  if(PAD.rx||PAD.ry){let s=(typeof aimSens==='function'?aimSens():1)*(SET.sens/50);
    if(typeof AIM!=='undefined'&&AIM&&AIM.on&&AIM.tgt&&!AIM.tgt.dead)s*=.55;   // aim assist: slow down over a target
    camYaw-=padCurve(PAD.rx)*3.1*dt*s;camPitch=clamp(camPitch+padCurve(PAD.ry)*1.9*dt*s*(SET.invertY?-1:1),typeof camPitchMin==='function'?camPitchMin():-.25,1.1);lastMouseT=game.time;}});
// rumble: getting hit hard, landing a heavy, ultimates, KOs
onEv('hit',(att,def,dmg,o)=>{if(!PAD.on||!ME)return;if(def===ME)padRumble(o&&o.heavy?260:120,.5,o&&o.heavy?.8:.35);else if(att===ME&&o&&o.heavy)padRumble(90,.3,.45);});
onEv('kill',(def,att)=>{if(PAD.on&&ME&&(att===ME||def===ME))padRumble(def===ME?500:220,.6,1);});

/* ---- controller in menus: move between buttons / fighters, A = pick, B = back ---- */
const PADNAV_SEL='button,.btn,.chip,.tile,.filters span,.tabs .tb,.mvbtn,.mini,.tbx,input,select,.card,.sitem,.shItem,[data-nav],.lp .kick';
function padNavList(){const scr=[...document.querySelectorAll('.screen.on')].pop()||document.body;
  return [...scr.querySelectorAll(PADNAV_SEL)].filter(e=>{if(e.disabled||e.offsetParent===null)return false;const r=e.getBoundingClientRect();return r.width>4&&r.height>4&&r.bottom>0&&r.top<innerHeight&&getComputedStyle(e).visibility!=='hidden';});}
function padScrollTo(e){let p=e.parentElement;while(p&&p!==document.body){const cs=getComputedStyle(p);if(/(auto|scroll)/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+2){const r=e.getBoundingClientRect(),q=p.getBoundingClientRect();if(r.top<q.top+6)p.scrollTop-=q.top+6-r.top;else if(r.bottom>q.bottom-6)p.scrollTop+=r.bottom-(q.bottom-6);return;}p=p.parentElement;}}
function padFocus(e){const N=PAD.nav;if(N.el)N.el.classList.remove('padfocus');N.el=e;if(!e)return;e.classList.add('padfocus');try{padScrollTo(e);}catch(_){}
  if(e.classList.contains('tile')&&e.onmouseenter)e.onmouseenter();AU.scale=.35;AU.tone('triangle',880,990,.03,.04);AU.scale=1;}
function padMove(dx,dy){const L=padNavList();if(!L.length)return;const N=PAD.nav;
  if(!N.el||!L.includes(N.el)){padFocus(L.find(e=>e.classList.contains('tile')&&e.classList.contains('sel'))||L.find(e=>e.classList.contains('sel'))||L[0]);return;}
  const r0=N.el.getBoundingClientRect(),cx=r0.left+r0.width/2,cy=r0.top+r0.height/2;let best=null,bs=1e9;
  for(const e of L){if(e===N.el)continue;const r=e.getBoundingClientRect(),ex=r.left+r.width/2,ey=r.top+r.height/2,vx=ex-cx,vy=ey-cy,along=vx*dx+vy*dy;if(along<=4)continue;
    const across=Math.abs(vx*dy-vy*dx);if(across>along*1.6+40)continue;const sc=along+across*2.2;if(sc<bs){bs=sc;best=e;}}
  if(best)padFocus(best);}
function padBack(){const scr=[...document.querySelectorAll('.screen.on')].pop();if(scr){const bk=[...scr.querySelectorAll('button,.btn,.chip')].find(e=>/^\s*(BACK|CLOSE|RESUME|CANCEL)\b/i.test(e.textContent)&&e.offsetParent!==null);if(bk){bk.click();return;}}
  dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));}
function padMenu(b,pv,dt){const N=PAD.nav;let dx=0,dy=0;if(b[14]||PAD.lx<-.5)dx=-1;else if(b[15]||PAD.lx>.5)dx=1;else if(b[12]||PAD.ly<-.5)dy=-1;else if(b[13]||PAD.ly>.5)dy=1;
  const dir=dx||dy?dx+','+dy:null;if(dir){if(dir!==N.dir){N.rep=.38;padMove(dx,dy);}else{N.rep-=dt;if(N.rep<=0){N.rep=.11;padMove(dx,dy);}}}N.dir=dir;
  if(b[0]&&!pv[0]){if(typeof CUT!=='undefined'&&CUT){cutNext();return;}if(!N.el||!padNavList().includes(N.el))padMove(0,0);else{const e=N.el;if(e.tagName==='INPUT'){e.focus();}else{e.click();AU.ui&&AU.ui();}
      // the DOM may have been rebuilt (cards re-render): keep the focus on the same spot
      setTimeout(()=>{if(!document.body.contains(e)){const r=N.lastR;if(r){const L=padNavList();let bb=null,bd=1e9;for(const q of L){const k=q.getBoundingClientRect(),d=Math.hypot(k.left-r.left,k.top-r.top);if(d<bd){bd=d;bb=q;}}if(bb)padFocus(bb);}}},30);}}
  if(N.el)N.lastR=N.el.getBoundingClientRect();
  if(b[1]&&!pv[1]){if(document.activeElement&&document.activeElement.tagName==='INPUT')document.activeElement.blur();else padBack();}
  if((b[4]&&!pv[4])||(b[5]&&!pv[5])){const f=[...document.querySelectorAll('.screen.on .filters span, .screen.on .tabs .tb[data-t]')].filter(e=>e.offsetParent!==null);if(f.length){let i=f.findIndex(e=>e.classList.contains('sel'));i=(i+(b[5]?1:-1)+f.length)%f.length;f[i].click();}}
  if(b[9]&&!pv[9]){const go=$('bGo');if($('setup').classList.contains('on')&&go&&go.offsetParent!==null)go.click();else dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));}
  if(b[3]&&!pv[3]&&$('setup').classList.contains('on')){const m=$('pvMvBtn');if(m)m.click();}}
(function(){const st=document.createElement('style');st.textContent='.padfocus{outline:3px solid #ffd23f!important;outline-offset:2px;box-shadow:0 0 0 6px rgba(255,210,63,.25),0 0 18px rgba(255,210,63,.55)!important;z-index:5}';document.head.appendChild(st);})();
/* ---- touch ---- */
const TOUCH={on:('ontouchstart' in window)||navigator.maxTouchPoints>0,stick:null,cam:null,mx:0,my:0};
function analogMove(x,y){if(!ME||(!x&&!y))return;const I=ME.intent,fx=Math.sin(camYaw),fz=Math.cos(camYaw),mz=-y,mx=x;I.wx=fx*mz-fz*mx;I.wz=fz*mz+fx*mx;const l=Math.hypot(I.wx,I.wz);if(l>1){I.wx/=l;I.wz/=l;}}
onEv('intent',()=>{if(PAD.lx||PAD.ly)analogMove(PAD.lx,PAD.ly);else if(TOUCH.stick)analogMove(TOUCH.mx,TOUCH.my);});
function buildTouch(){const T=$('touch');if(!T||!TOUCH.on)return;document.body.classList.add('touchdev');
  const btns=[['tAtk','ATK','KeyJ'],['tHvy','HVY','KeyK'],['tJump','JUMP','Space'],['tDash','DASH','ShiftLeft'],['tBlock','BLOCK','KeyF'],['tUlt','ULT','KeyQ'],
    ['tM1','1','Digit1'],['tM2','2','Digit2'],['tM3','3','Digit3'],['tM4','4','Digit4'],['tAwk','MODE','Digit5'],['tRes','RESCUE','KeyR'],['tAim','AIM','MouseR']];
  T.innerHTML='<div id="tStick"><i></i></div><button id="tPause">❚❚</button>'+btns.map(([id,t])=>`<button class="tb" id="${id}">${t}</button>`).join('');
  btns.forEach(([id,,code])=>{const e=$(id);e.addEventListener('touchstart',ev=>{ev.preventDefault();ev.stopPropagation();vDown(code);e.classList.add('dn');},{passive:false});
    const up=ev=>{ev.preventDefault();vUp(code);e.classList.remove('dn');};e.addEventListener('touchend',up,{passive:false});e.addEventListener('touchcancel',up,{passive:false});});
  $('tPause').addEventListener('touchstart',ev=>{ev.preventDefault();dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));},{passive:false});
  const S=$('tStick'),knob=S.querySelector('i');
  T.addEventListener('touchstart',ev=>{for(const t of ev.changedTouches){if(t.target.closest('.tb')||t.target.id==='tPause')continue;
      if(t.clientX<innerWidth*.42&&!TOUCH.stick){TOUCH.stick={id:t.identifier,x:t.clientX,y:t.clientY};S.style.left=(t.clientX-60)+'px';S.style.top=(t.clientY-60)+'px';S.classList.add('on');}
      else if(!TOUCH.cam)TOUCH.cam={id:t.identifier,x:t.clientX,y:t.clientY};}ev.preventDefault();},{passive:false});
  T.addEventListener('touchmove',ev=>{for(const t of ev.changedTouches){if(TOUCH.stick&&t.identifier===TOUCH.stick.id){let dx=(t.clientX-TOUCH.stick.x)/55,dy=(t.clientY-TOUCH.stick.y)/55;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}TOUCH.mx=dx;TOUCH.my=dy;knob.style.transform=`translate(${dx*42}px,${dy*42}px)`;}
    else if(TOUCH.cam&&t.identifier===TOUCH.cam.id){camYaw-=(t.clientX-TOUCH.cam.x)*.007;camPitch=clamp(camPitch+(t.clientY-TOUCH.cam.y)*.005,typeof camPitchMin==='function'?camPitchMin():-.25,1.1);TOUCH.cam.x=t.clientX;TOUCH.cam.y=t.clientY;lastMouseT=game.time;}}ev.preventDefault();},{passive:false});
  const end=ev=>{for(const t of ev.changedTouches){if(TOUCH.stick&&t.identifier===TOUCH.stick.id){TOUCH.stick=null;TOUCH.mx=TOUCH.my=0;knob.style.transform='';S.classList.remove('on');}if(TOUCH.cam&&t.identifier===TOUCH.cam.id)TOUCH.cam=null;}};
  T.addEventListener('touchend',end);T.addEventListener('touchcancel',end);}
onEv('frame',()=>{const T=$('touch');if(T)T.classList.toggle('on',TOUCH.on&&inMatch()&&!paused);});
buildTouch();

/* ---- controller cheat-sheet along the bottom of the screen while you play on a pad ---- */
(function(){const d=document.createElement('div');d.id='padHint';document.body.appendChild(d);const st=document.createElement('style');
  st.textContent='#padHint{position:fixed;bottom:6px;left:50%;transform:translateX(-50%);display:none;gap:12px;flex-wrap:wrap;justify-content:center;font:700 11px/1.6 system-ui,sans-serif;letter-spacing:.08em;opacity:.7;z-index:11;width:min(1200px,96vw);pointer-events:none}#padHint span{white-space:nowrap}#padHint i{font-style:normal;display:inline-block;min-width:18px;padding:0 5px;margin-right:4px;border-radius:9px;background:rgba(255,255,255,.18);text-align:center}body.padui.inmatchpad #padHint{display:flex}body.nohint #padHint{display:none!important}';document.head.appendChild(st);
  let last='';onEv('frame',()=>{const on=typeof onPad==='function'&&onPad()&&inMatch()&&!paused;document.body.classList.toggle('inmatchpad',on);if(!on)return;
    const G=PAD_GLYPH[SET.pad]||PAD_GLYPH.xbox,k=a=>G[a]?G[a][0]:'?',L=[['L-STICK','MOVE'],['R-STICK','LOOK'],[k('jump'),'JUMP'],[k('dash'),'DASH / SPRINT'],[k('light'),'LIGHT'],[k('heavy'),'HEAVY (HOLD)'],[k('aim'),'AIM (HOLD)'],[k('m1'),'SPECIAL'],[k('m2'),'ALT SPECIAL'],[k('block'),'BLOCK'],[k('ult'),'ULTIMATE'],['L3','ULT'],['↑ →','MOVES 3/4'],['↓','MODE'],['←','RESCUE'],['R3','LOCK-ON']];
    if(ME&&typeof isHem==='function'&&isHem(ME))L.push([k('arrow'),'ARROWS']);const s=L.map(([g,t])=>`<span><i>${g}</i>${t}</span>`).join('');if(s!==last){last=s;d.innerHTML=s;}});})();
