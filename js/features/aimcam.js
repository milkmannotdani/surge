/* Over-the-shoulder camera for every fighter (the third-person-shooter view), with AIM on RIGHT CLICK.
   - The camera sits behind your right shoulder and the crosshair is the middle of the screen. Your swings, shots and
     specials go where the crosshair points (it ray-casts into the world: walls, floors and fighters).
   - RIGHT CLICK toggles AIM: the camera tucks in closer over the shoulder, the view zooms, mouse sensitivity drops, you
     move slower, can't sprint, and your fighter turns to face the crosshair. Click again to stop aiming.
     (Left click / J = light attack, K = heavy. On a controller, L3 toggles aim; on touch there's an AIM button.)
   - Settings > CAMERA VIEW switches back to the classic centred camera (right click is a heavy attack there again). */
if(SET.camStyle==null)SET.camStyle='shoulder';
(function(){const i=SET_ROWS.findIndex(r=>r[0]==='cursorLock');SET_ROWS.splice(i<0?SET_ROWS.length:i,0,['camStyle','CAMERA VIEW','choice',[['shoulder','OVER THE SHOULDER · RIGHT CLICK AIMS'],['classic','CLASSIC (CENTRED, RIGHT CLICK = HEAVY)']]]);})();
function shoulderCam(){return SET.camStyle!=='classic';}
var AIM={on:false,k:0,pt:new V3(0,1,0),tgt:null,dist:60,o:new V3(),d:new V3(0,0,1)};   // var: other files check it with typeof
function aimSens(){return AIM.on&&shoulderCam()?.6:1;}
function camPitchMin(){return shoulderCam()?-1:-.25;}
function aimFov(f){return shoulderCam()?lerp(f,48,AIM.k):f;}

/* ---------- the camera ---------- */
function camShoulder(F,dt){if(!shoulderCam())return false;
  AIM.k+=((AIM.on&&F===ME?1:0)-AIM.k)*(1-Math.exp(-13*dt));const a=AIM.k;
  const sc=Math.min(1.6,Math.max(.85,(F.hero&&F.hero.scale)||1)),spr=F.sprinting&&!AIM.on?.55:0;
  const D=lerp(3.85+spr,2.15,a)*sc,O=lerp(.74,.9,a)*Math.min(1.35,sc),up=lerp(1.62,1.58,a)*sc;
  const cp=Math.cos(camPitch),sp=Math.sin(camPitch),fx=Math.sin(camYaw)*cp,fy=-sp,fz=Math.cos(camYaw)*cp,rx=-Math.cos(camYaw),rz=Math.sin(camYaw);
  const hx=F.pos.x,hy=F.pos.y+up,hz=F.pos.z,head=TMP2.set(hx,hy,hz);
  // shoulder: shrink the offset if there's a wall right there, then pull the camera in front of anything behind
  let off=O;{const sh=new V3(hx+rx*O,hy,hz+rz*O),k=rayBld(head,sh,4);if(k<1)off=O*Math.max(0,k*.8);}
  const px=hx+rx*off,pz=hz+rz*off;camT.set(px-fx*D,hy-fy*D,pz-fz*D);
  if(typeof camClampY==='function')camClampY(F,camT);else if(camT.y<.4)camT.y=.4;
  const piv=new V3(px,hy,pz),k=rayBld(piv,camT,14);if(k<1)camT.lerpVectors(piv,camT,Math.max(.08,k*.9));
  lookT.set(camT.x+fx*30,camT.y+fy*30,camT.z+fz*30);
  if(F.hardLock&&F.tgt&&!F.tgt.dead)lookT.lerp(TMP.set(F.tgt.pos.x,F.tgt.pos.y+1.2,F.tgt.pos.z),.35);
  return true;}

/* ---------- what the crosshair is on ---------- */
function aimCast(){const o=AIM.o,d=AIM.d;camera.getWorldPosition(o);camera.getWorldDirection(d);
  const t0=ME?Math.max(0,(ME.pos.x-o.x)*d.x+(ME.pos.y+1.2-o.y)*d.y+(ME.pos.z-o.z)*d.z):0;
  let best=150,tg=null;const c=new V3();
  for(const f of FS){if(f===ME||f.dead||f.dormant||!f.rig||!f.rig.root.visible)continue;f.chest(c);const t=(c.x-o.x)*d.x+(c.y-o.y)*d.y+(c.z-o.z)*d.z;if(t<t0||t>best)continue;
    const qx=o.x+d.x*t-c.x,qy=o.y+d.y*t-c.y,qz=o.z+d.z*t-c.z,r=.72*((f.hero&&f.hero.scale)||1);if(qx*qx+qy*qy*.42+qz*qz<r*r){best=t;tg=f;}}
  let t=t0+.3,step=.35;
  while(t<best){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;
    if(insideBld(x,z,0,y)||y<floorAt(x,z,y+.3)-.03||Math.abs(x)>BOUND+60||Math.abs(z)>BOUND+60){best=t;tg=null;break;}t+=step;step=Math.min(2.2,step*1.07);}
  AIM.pt.set(o.x+d.x*best,o.y+d.y*best,o.z+d.z*best);AIM.tgt=tg;AIM.dist=best;}
// where a shot from `from` should go to land on the crosshair
function aimDir(from){const v=AIM.pt.clone().sub(from);if(v.lengthSq()<1)v.copy(AIM.d);return v.normalize();}
function aimingMe(f){return f===ME&&!!ME&&shoulderCam()&&inMatch();}

/* ---------- input: right click toggles, everything faces the crosshair ---------- */
const _aimPI=playerIntent;
playerIntent=function(dt){_aimPI.apply(this,arguments);if(!ME)return;const I=ME.intent;
  if(!shoulderCam()||!inMatch()){AIM.on=false;AIM.tgt=null;return;}
  if(pressed.has('MouseR')&&!paused&&!ME.dead&&game.phase!=='over'){AIM.on=!AIM.on;AU.scale=.6;AU.tone('triangle',AIM.on?660:520,AIM.on?880:400,.06,.05);AU.scale=1;}
  if(typeof PAD!=='undefined'&&PAD.on){if(PAD.lt&&!AIM.padOn){AIM.on=true;AIM.padOn=true;}else if(!PAD.lt&&AIM.padOn){AIM.on=false;AIM.padOn=false;}}   // controller: hold LT
  if(ME.dead||game.phase==='over')AIM.on=false;
  aimCast();
  if(!ME.hardLock&&!ME.dead){const dx=AIM.pt.x-ME.pos.x,dz=AIM.pt.z-ME.pos.z;if(dx*dx+dz*dz>2.2)I.aim=Math.atan2(dx,dz);}
  if(AIM.on){I.sprint=false;I.wx*=.62;I.wz*=.62;
    if(AIM.tgt&&!AIM.tgt.dead&&!ally(AIM.tgt,ME)&&!ME.hardLock){ME.tgt=AIM.tgt;manualTgtT=game.time;}}};
onEv('tick',dt=>{if(!ME||ME.dead||!AIM.on||ME.hardLock||!shoulderCam())return;if(['idle','run','air','block'].indexOf(ME.state)<0)return;ME.face=angLerp(ME.face,ME.intent.aim,Math.min(1,18*dt));});
onEv('matchStart',()=>{AIM.on=false;AIM.k=0;AIM.tgt=null;});
onEv('matchEnd',()=>{AIM.on=false;AIM.tgt=null;});

/* ---------- ranged weapons shoot at the crosshair (up and down too) ---------- */
const _aimGS=gearShot;
gearShot=function(f,M){if(aimingMe(f)&&!f.hardLock){const c=f.chest(new V3()),d=aimDir(c);f.fwd=function(v){return (v||new V3()).copy(d);};try{return _aimGS.apply(this,arguments);}finally{delete f.fwd;}}
  return _aimGS.apply(this,arguments);};

/* ---------- crosshair ---------- */
(function(){const d=document.createElement('div');d.id='axh';d.innerHTML='<i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><b></b><em></em>';document.body.appendChild(d);
  const v=document.createElement('div');v.id='aimVig';document.body.appendChild(v);
  const st=document.createElement('style');st.textContent=`#axh{position:fixed;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:7;display:none}
#axh i{position:absolute;background:#fff;box-shadow:0 0 2px #000,0 0 5px rgba(0,0,0,.55);border-radius:1px;transition:all .12s ease-out}
#axh .t,#axh .b{width:2px;height:8px;left:-1px}#axh .l,#axh .r{height:2px;width:8px;top:-1px}
#axh .t{top:-17px}#axh .b{top:9px}#axh .l{left:-17px}#axh .r{left:9px}
#axh b{position:absolute;width:4px;height:4px;left:-2px;top:-2px;border-radius:50%;background:#fff;box-shadow:0 0 3px #000}
#axh em{position:absolute;left:-15px;top:-15px;width:26px;height:26px;border:2px solid rgba(255,255,255,.85);border-radius:50%;opacity:0;transform:scale(1.6);transition:all .14s ease-out;box-shadow:0 0 3px rgba(0,0,0,.6)}
#axh.aim .t{top:-10px;height:5px}#axh.aim .b{top:5px;height:5px}#axh.aim .l{left:-10px;width:5px}#axh.aim .r{left:5px;width:5px}#axh.aim em{opacity:1;transform:scale(1)}
#axh.foe i,#axh.foe b{background:#ff4a4a}#axh.foe em{border-color:#ff4a4a}
#aimVig{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .18s;background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,.42) 100%)}
#aimVig.on{opacity:1}`;document.head.appendChild(st);})();
onEv('frame',()=>{const x=$('axh'),v=$('aimVig');const on=inMatch()&&shoulderCam()&&!!ME&&!ME.dead&&!paused&&!game.cine&&game.phase!=='over'&&!(typeof KC!=='undefined'&&KC.on)&&!(typeof HCAM!=='undefined'&&HCAM.on)&&!(typeof DCAM!=='undefined'&&DCAM.on);
  if(x){x.style.display=on?'block':'none';x.classList.toggle('aim',on&&AIM.on);x.classList.toggle('foe',on&&!!AIM.tgt&&!ally(AIM.tgt,ME));}
  if(v)v.classList.toggle('on',on&&AIM.on&&AIM.k>.4);
  if(on){const xh=$('xh');if(xh)xh.style.display='none';}});
