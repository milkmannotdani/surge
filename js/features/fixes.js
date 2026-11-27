/* Glitch fixes that cut across systems.
   1. No dashing / flying / lunging through walls. The physics step only pushed a fighter out of whatever wall it ENDED
      inside, so a fast dash (or a launch, or a frame hitch) could carry it past the middle of a thin wall and out the
      far side. Now the whole stretch a fighter covered this frame is checked against the static walls at chest height,
      and it stops at the first one it would have passed through (dashes stop dead; launched fighters slam into it).
      Teleports (more than 7 m in one frame) are left alone, and so is ending up standing on top of the thing (vaults,
      steps). A slow frame used to be enough to walk through a thin wall: from the station hall that meant popping up
      through the street (anything outside the hall has the street as its floor).
   2. Never pop up through the street from underground (outside the stairwell): whatever caused it, you're put back. */
function sweepWall(x,z,y){if(BG_N!==BLD.length||BG_F!==BLD[0])bgBuild();const L=BG.get(Math.floor(x/BG_CELL)*1000+Math.floor(z/BG_CELL));if(!L)return null;
  for(const b of L)if(x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&y<b.h&&y>=(b.y0||0))return b;return null;}
const _tnUpd=Fighter.prototype.update;
Fighter.prototype.update=function(dt){const ox=this.pos.x,oy=this.pos.y,oz=this.pos.z;const r=_tnUpd.apply(this,arguments);
  if(this.dead||!world.visible||this.state==='framed'||this.state==='climb'||this.dormant)return r;
  const dx=this.pos.x-ox,dz=this.pos.z-oz,d=Math.hypot(dx,dz);
  if(oy<-1.2&&this.pos.y>-.45&&d<7&&typeof ugStair==='function'&&!ugStair(this.pos.x,this.pos.z)&&!ugStair(ox,oz)){
    this.pos.set(ox,oy,oz);this.vel.x=this.vel.z=0;if(this.vel.y>0)this.vel.y=0;if(this.rig&&this.rig.root)this.rig.root.position.copy(this.pos);return r;}
  if(d<.22||d>7)return r;
  if(sweepWall(ox,oz,oy+.9))return r;   // already overlapping something at the start: let the normal push-out deal with it
  const dy=this.pos.y-oy,n=Math.ceil(d/.18);
  for(let i=1;i<=n;i++){const k=i/n,x=ox+dx*k,z=oz+dz*k,b=sweepWall(x,z,oy+dy*k+.9);if(!b)continue;
    if(Math.abs(this.pos.y-b.h)<.12&&dy<1.6)continue;   // ended up standing on it: a vault / step-up, not a pass-through
    const kb=Math.max(0,(i-1)/n-.01),px=ox+dx*kb,pz=oz+dz*kb;
    this.pos.set(px,dy>.6?oy:oy+dy*kb,pz);if(dy>.6&&this.vel.y>0)this.vel.y=0;
    const ax=(px<=b.x0||px>=b.x1)?'x':'z',sp=Math.hypot(this.vel.x,this.vel.z);
    if(this.state==='fly'&&sp>7){wallHit(this);this.vel[ax]=-this.vel[ax]*.3;}else this.vel[ax]=0;
    this.wallT=game.time;this.wallN=ax==='x'?new V3(px<=b.x0?-1:1,0,0):new V3(0,0,pz<=b.z0?-1:1);this.wallB=b;
    pushOutBld(this.pos,.45);if(this.rig&&this.rig.root)this.rig.root.position.copy(this.pos);
    if(this.dashDir&&this.state==='dash'&&this===ME&&typeof shake==='function')shake(.12,this.pos);
    break;}
  return r;};
