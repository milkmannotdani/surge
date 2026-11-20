/* Controller and touch controls. Both feed "virtual keys" into the same keys/pressed tables the
   keyboard uses, so every move works the same way. Gamepad layout (standard / Xbox names):
   L-stick move · R-stick camera · A jump · B dash (hold: sprint) · X light · Y heavy · LB block · RB special (1)
   LT alt special (2) · RT ultimate (Q) · D-pad up/right extra moves (3/4) · D-pad left rescue/revive (R)
   D-pad down switch mode (5) · R3 lock-on (Tab) · Start pause. In cutscenes A advances. */
const VIN={held:new Set()};
function vDown(code){if(!keys[code])pressed.add(code);keys[code]=true;VIN.held.add(code);}
function vUp(code){if(VIN.held.has(code)){keys[code]=false;VIN.held.delete(code);}}
const PAD_MAP={0:'Space',1:'ShiftLeft',2:'KeyJ',3:'KeyK',4:'KeyF',5:'Digit1',6:'Digit2',7:'KeyQ',12:'Digit3',15:'Digit4',14:'KeyR',13:'Digit5'};
const PAD={on:false,prev:[],lx:0,ly:0,rx:0,ry:0};
addEventListener('gamepadconnected',()=>{PAD.on=true;try{announceSmall('CONTROLLER CONNECTED');}catch(e){}});
function padDz(v){return Math.abs(v)<.18?0:(v-Math.sign(v)*.18)/.82;}
onEv('input',dt=>{const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;if(!gp){PAD.lx=PAD.ly=PAD.rx=PAD.ry=0;return;}PAD.on=true;
  const b=gp.buttons.map(x=>x.pressed||x.value>.5),pv=PAD.prev;
  for(const i in PAD_MAP){const c=PAD_MAP[i];if(b[i]&&!pv[i])vDown(c);else if(!b[i]&&pv[i])vUp(c);}
  if(b[9]&&!pv[9])dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
  if(b[0]&&!pv[0]&&typeof CUT!=='undefined'&&CUT)cutNext();
  PAD.prev=b;PAD.lx=padDz(gp.axes[0]||0);PAD.ly=padDz(gp.axes[1]||0);PAD.rx=padDz(gp.axes[2]||0);PAD.ry=padDz(gp.axes[3]||0);
  if(inMatch()&&(PAD.rx||PAD.ry)){camYaw-=PAD.rx*2.8*dt;camPitch=clamp(camPitch+PAD.ry*1.6*dt,-.25,1.1);lastMouseT=game.time;}});
/* ---- touch ---- */
const TOUCH={on:('ontouchstart' in window)||navigator.maxTouchPoints>0,stick:null,cam:null,mx:0,my:0};
function analogMove(x,y){if(!ME||(!x&&!y))return;const I=ME.intent,fx=Math.sin(camYaw),fz=Math.cos(camYaw),mz=-y,mx=x;I.wx=fx*mz-fz*mx;I.wz=fz*mz+fx*mx;const l=Math.hypot(I.wx,I.wz);if(l>1){I.wx/=l;I.wz/=l;}}
onEv('intent',()=>{if(PAD.lx||PAD.ly)analogMove(PAD.lx,PAD.ly);else if(TOUCH.stick)analogMove(TOUCH.mx,TOUCH.my);});
function buildTouch(){const T=$('touch');if(!T||!TOUCH.on)return;document.body.classList.add('touchdev');
  const btns=[['tAtk','ATK','KeyJ'],['tHvy','HVY','KeyK'],['tJump','JUMP','Space'],['tDash','DASH','ShiftLeft'],['tBlock','BLOCK','KeyF'],['tUlt','ULT','KeyQ'],
    ['tM1','1','Digit1'],['tM2','2','Digit2'],['tM3','3','Digit3'],['tM4','4','Digit4'],['tAwk','MODE','Digit5'],['tRes','RESCUE','KeyR']];
  T.innerHTML='<div id="tStick"><i></i></div><button id="tPause">❚❚</button>'+btns.map(([id,t])=>`<button class="tb" id="${id}">${t}</button>`).join('');
  btns.forEach(([id,,code])=>{const e=$(id);e.addEventListener('touchstart',ev=>{ev.preventDefault();ev.stopPropagation();vDown(code);e.classList.add('dn');},{passive:false});
    const up=ev=>{ev.preventDefault();vUp(code);e.classList.remove('dn');};e.addEventListener('touchend',up,{passive:false});e.addEventListener('touchcancel',up,{passive:false});});
  $('tPause').addEventListener('touchstart',ev=>{ev.preventDefault();dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));},{passive:false});
  const S=$('tStick'),knob=S.querySelector('i');
  T.addEventListener('touchstart',ev=>{for(const t of ev.changedTouches){if(t.target.closest('.tb')||t.target.id==='tPause')continue;
      if(t.clientX<innerWidth*.42&&!TOUCH.stick){TOUCH.stick={id:t.identifier,x:t.clientX,y:t.clientY};S.style.left=(t.clientX-60)+'px';S.style.top=(t.clientY-60)+'px';S.classList.add('on');}
      else if(!TOUCH.cam)TOUCH.cam={id:t.identifier,x:t.clientX,y:t.clientY};}ev.preventDefault();},{passive:false});
  T.addEventListener('touchmove',ev=>{for(const t of ev.changedTouches){if(TOUCH.stick&&t.identifier===TOUCH.stick.id){let dx=(t.clientX-TOUCH.stick.x)/55,dy=(t.clientY-TOUCH.stick.y)/55;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}TOUCH.mx=dx;TOUCH.my=dy;knob.style.transform=`translate(${dx*42}px,${dy*42}px)`;}
    else if(TOUCH.cam&&t.identifier===TOUCH.cam.id){camYaw-=(t.clientX-TOUCH.cam.x)*.007;camPitch=clamp(camPitch+(t.clientY-TOUCH.cam.y)*.005,-.25,1.1);TOUCH.cam.x=t.clientX;TOUCH.cam.y=t.clientY;lastMouseT=game.time;}}ev.preventDefault();},{passive:false});
  const end=ev=>{for(const t of ev.changedTouches){if(TOUCH.stick&&t.identifier===TOUCH.stick.id){TOUCH.stick=null;TOUCH.mx=TOUCH.my=0;knob.style.transform='';S.classList.remove('on');}if(TOUCH.cam&&t.identifier===TOUCH.cam.id)TOUCH.cam=null;}};
  T.addEventListener('touchend',end);T.addEventListener('touchcancel',end);}
onEv('frame',()=>{const T=$('touch');if(T)T.classList.toggle('on',TOUCH.on&&inMatch()&&!paused);});
buildTouch();
