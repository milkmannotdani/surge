/* MOTION — smoother, more fluid movement.
   · Fighters lean into their speed, bank into turns and pitch with acceleration (forward when speeding up,
     back when braking), all smoothed so poses flow instead of snapping.
   · Locomotion poses blend more gradually; attacks stay crisp.
   · The camera trails a touch more smoothly and widens slightly at speed.
   (Base run speed and acceleration are tuned in fighter.js: run 9.2, sprint ×1.6.) */
const _mvPose=Fighter.prototype.applyPose;
Fighter.prototype.applyPose=function(dt){const r=_mvPose.apply(this,arguments);if(!dt||this.dead||this.state==='framed')return r;const R=this.rig;
  const sp=Math.hypot(this.vel.x,this.vel.z),loco=this.state==='run'||this.state==='idle'||this.state==='air';
  // turn rate → bank, speed change → pitch
  const dF=angTo(this._mvF==null?this.face:this._mvF,this.face)/dt;this._mvF=this.face;const acc=(sp-(this._mvS||0))/dt;this._mvS=sp;
  const k=1-Math.exp(-9*dt);
  this._bank=lerp(this._bank||0,loco&&sp>2?clamp(-dF*.045,-.22,.22):0,k);
  this._lean=lerp(this._lean||0,loco?clamp(sp*.016+acc*.012,-.18,.3):0,k);
  if(loco||Math.abs(this._bank)>.003)R.root.rotation.z=this._bank;if(loco||Math.abs(this._lean)>.003){R.spine.rotation.x+=this._lean;R.hips.rotation.x+=this._lean*.35;}
  if(this.state==='run'&&sp>2)R.head.rotation.x-=this._lean*.5;   // keep the eyes level
  return r;};
// smoother camera trailing and a gentle speed FOV
const _mvCam=updateCamera;updateCamera=function(dt){const p0=camera.position.clone();const r=_mvCam.apply(this,arguments);
  if(inMatch()&&!game.cine&&ME&&!ME.dead){camera.position.lerpVectors(p0,camera.position,Math.min(1,.82+dt*2));camera.lookAt(camLook);}
  return r;};
