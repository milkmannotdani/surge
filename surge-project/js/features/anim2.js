/* ANIMATION 2 — a layer of secondary motion on top of every fighter's poses, so movement reads as alive and weighty:
   • idle: breathing (chest and shoulders rise), a slow weight shift from foot to foot, small head and hand fidgets
   • head tracking: fighters turn their head (and a little of the chest) toward their target or the nearest enemy
   • running: hips and shoulders counter-rotate with each stride, arms pump with the stride, the head stays steady
   • attacks: wind-up twist away from the striking side, a snap through the strike, a lunge of the chest, follow-through
     that settles out; heavy attacks swing bigger
   • hit reactions: the body recoils away from where the hit came from (bends, twists, the head snaps, arms fly),
     scaled by damage, and wobbles back
   • landing: knees absorb the fall, the chest dips, arms drop — harder landings absorb more
   • jumping: knees tuck at the top of the jump; dashing stretches the body into the dash
   Purely visual. */
const A2_ANIM={};
function a2Look(f){let T=f.tgt&&!f.tgt.dead?f.tgt:null;if(!T){let bd=14;for(const o of FS){if(o===f||o.dead||ally(o,f))continue;const d=o.pos.distanceTo(f.pos);if(d<bd){bd=d;T=o;}}}return T;}
onEv('hit',(a,d,dmg)=>{if(!d||!a||a===d||!d.rig)return;const dx=d.pos.x-a.pos.x,dz=d.pos.z-a.pos.z;const yaw=Math.atan2(dx,dz)-d.face;   // where the push goes, in the defender's frame
  const k=Math.min(1.2,.35+(dmg||4)/14);d._fl={x:Math.cos(yaw)*k,z:Math.sin(yaw)*k,t:0};});
const _a2AP=Fighter.prototype.applyPose;Fighter.prototype.applyPose=function(dt){const r=_a2AP.apply(this,arguments);if(!dt||this.state==='framed')return r;const R=this.rig;if(!R||!R.spine||!R.head)return r;
  const f=this,st=f.state,t=game.time+(f.id||0)*1.7,sp=Math.hypot(f.vel.x,f.vel.z);if(!nearCam(f.pos,60))return r;
  if(typeof isChi==='function'&&isChi(f)&&f.chi&&(f.chi.l===0||f.chi.amal||f._chSplit))return r;
  const S=f._a2||(f._a2={look:0,lookP:0,land:0,wasAir:false,tw:0});
  // the base pose only sets the hips' pitch and the head's nod: start these extra axes from zero every frame
  R.hips.rotation.y=0;R.hips.rotation.z=0;R.head.rotation.y=0;R.head.rotation.z=0;
  // ---- head tracking ----
  let ly=0,lp=0;if(!f.dead&&st!=='down'&&st!=='ko'&&st!=='fly'&&st!=='downed'){const T=a2Look(f);if(T){const dx=T.pos.x-f.pos.x,dz=T.pos.z-f.pos.z;let a=Math.atan2(dx,dz)-f.face;a=Math.atan2(Math.sin(a),Math.cos(a));
      if(Math.abs(a)<2.2){ly=clamp(a,-1,1)*.75;const dy=(T.pos.y-f.pos.y)/Math.max(2,Math.hypot(dx,dz));lp=clamp(-dy,-.4,.4);}}
    else if(st==='idle')ly=Math.sin(t*.37)*.35*Math.max(0,Math.sin(t*.13));}
  const kL=1-Math.exp(-6*dt);S.look+=(ly-S.look)*kL;S.lookP+=(lp-S.lookP)*kL;R.head.rotation.y+=S.look;R.head.rotation.x+=S.lookP;R.spine.rotation.y+=S.look*.18;
  // ---- idle: breathing and weight shift ----
  if(st==='idle'){const br=Math.sin(t*1.9),ws=Math.sin(t*.55);R.spine.rotation.x+=br*.018;R.lS.rotation.z+=br*.025;R.rS.rotation.z-=br*.025;
    R.hips.rotation.z+=ws*.035;R.spine.rotation.z-=ws*.03;R.lH.rotation.z-=ws*.03;R.rH.rotation.z-=ws*.03;R.lK.rotation.x+=Math.max(0,ws)*.08;R.rK.rotation.x+=Math.max(0,-ws)*.08;
    R.lE.rotation.x+=Math.sin(t*.9)*.03;R.rE.rotation.x+=Math.sin(t*.8+1)*.03;}
  // ---- running: counter-rotation ----
  if(st==='run'&&sp>1){const ph=f.runPh||0,s=Math.sin(ph),A=Math.min(1,sp/9);R.hips.rotation.y+=s*.16*A;R.spine.rotation.y-=s*.28*A;R.head.rotation.y+=s*.12*A;
    R.lE.rotation.x-=Math.max(0,s)*.25*A;R.rE.rotation.x-=Math.max(0,-s)*.25*A;R.hips.position.y+=Math.abs(Math.cos(ph))*.025*A;}
  // ---- attacks: wind-up, snap, follow-through ----
  if(st==='attack'&&f.move){const M=f.move,tt=f.stateT,side=M.limb==='l'?-1:1,big=M.heavy?1.5:1;let tw=0,lu=0;
    if(tt<M.st){const u=tt/Math.max(.01,M.st);tw=-side*.32*u*big;lu=-.05*u;}
    else if(tt<M.st+M.ac){const u=(tt-M.st)/Math.max(.01,M.ac);tw=side*(.42*Math.sin(u*Math.PI*.5))*big-side*.32*big*(1-u);lu=.16*Math.sin(u*Math.PI*.5)*big;}
    else{const u=Math.min(1,(tt-M.st-M.ac)/Math.max(.01,M.rc));tw=side*.42*big*(1-u)*(1+.15*Math.sin(u*9)*(1-u));lu=.16*big*(1-u);}
    S.tw+=(tw-S.tw)*(1-Math.exp(-22*dt));R.spine.rotation.y+=S.tw;R.hips.rotation.y-=S.tw*.35;R.spine.rotation.x+=lu;R.head.rotation.y-=S.tw*.4;}
  else S.tw*=Math.exp(-10*dt);
  // ---- hit reactions ----
  if(f._fl){const F=f._fl;F.t+=dt;const e=Math.exp(-F.t*7)*(1+Math.sin(F.t*24)*.25*Math.exp(-F.t*5));if(e<.01)f._fl=null;else{
    R.spine.rotation.x-=F.x*.38*e;R.spine.rotation.z+=F.z*.32*e;R.head.rotation.x-=F.x*.45*e;R.head.rotation.z+=F.z*.3*e;R.spine.rotation.y+=F.z*.25*e;
    R.lS.rotation.z+=.35*e*Math.abs(F.x);R.rS.rotation.z-=.35*e*Math.abs(F.x);R.lS.rotation.x-=.3*e;R.rS.rotation.x-=.3*e;R.hips.position.y-=.04*e;}}
  // ---- landing ----
  const air=!f.onGround;if(S.wasAir&&!air){S.land=Math.min(1,Math.max(.25,(S.fallV||0)/16));}S.wasAir=air;if(air)S.fallV=Math.max(0,-f.vel.y);
  if(S.land>.01){const e=S.land;R.lK.rotation.x+=.7*e;R.rK.rotation.x+=.7*e;R.lH.rotation.x-=.45*e;R.rH.rotation.x-=.45*e;R.hips.position.y-=.12*e;R.spine.rotation.x+=.28*e;R.lS.rotation.z+=.3*e;R.rS.rotation.z-=.3*e;S.land*=Math.exp(-9*dt);}
  // ---- jumping and dashing ----
  if(st==='air'){const up=clamp(f.vel.y/10,-1,1),apex=1-Math.abs(up);R.lK.rotation.x+=apex*.45;R.rK.rotation.x+=apex*.6;R.lH.rotation.x-=apex*.3;R.rH.rotation.x-=apex*.4;
    if(up>0){R.lS.rotation.z+=.2*up;R.rS.rotation.z-=.2*up;}}
  if(st==='dash'){R.spine.rotation.x+=.22;R.lS.rotation.x+=.5;R.rS.rotation.x+=.5;R.head.rotation.x-=.15;}
  return r;};
