/* SKITTER — a street-level vigilante who slides over any surface on three points of contact:
   along the ground, up walls and across rooftops. Original design (courier gear, grip-pad gloves, orange visor);
   credited in credits.js as inspired by Koichi Haimawari ("The Crawler") from My Hero Academia: Vigilantes. */
Object.assign(SPNAME,{skate:'SKID RUN'});
Object.assign(HERO_SND,{skitter:'wind'});
Object.assign(ULT_RANGE,{streetsurge:22});
Object.assign(SPECIAL_AI,{skate:[3,16,.6]});
Object.assign(XSPK,{skate:1});
Object.assign(DULT_OF,{skitter:'barrage'});
// low three-point slide pose: chest down, one hand skimming the ground
POSES.crawl=b_({sx:1.15,hy:-.55,lSx:-1.45,lSz:.3,lE:-.05,rSx:.45,rSz:-.45,rE:-.7,lHx:-.95,lK:1.65,rHx:.15,rK:1.25});

const SKC=0x3affc8,SKO=0xff8a2a;
function skTrail(f){if(Math.random()<.7)burst(ADD,TMP2.set(f.pos.x,f.pos.y+.15,f.pos.z),2,{colors:[SKC,0xffffff],speed:.6,up:.3,life:.3,size:.18,size1:0,bright:2});
  if(Math.random()<.25)dust(f.pos,2,.5);}

/* SKID RUN (1): drop to three points and surf forward fast, steering with the movement keys.
   Slams through foes (knock-up) and rides straight UP any wall it meets, then pops over the top. */
SPECIALS.skate=function(f,dt){const t=f.stateT,V=f.vf,dur=1.25;
  if(!V.d){const T=tgtOf(f,16);V.d=T?xDirTo(f,T):f.fwd();V.hs=new Set();V.up=0;xSnd(f.pos,()=>AU.whoosh(true));}
  if(t<dur){f.poseKey='crawl';const I=f.intent||{};
    if(I.wx||I.wz){const want=new V3(I.wx,0,I.wz).normalize();V.d.lerp(want,Math.min(1,dt*4)).normalize();}
    f.face=Math.atan2(V.d.x,V.d.z);const sp=21*(f.hasteT>0?1.25:1);
    if(f.wallT&&game.time-f.wallT<.08&&V.up<1.4){V.up+=dt;f.vel.y=Math.max(f.vel.y,13);f.onGround=false;f.vel.x=V.d.x*4;f.vel.z=V.d.z*4;if(f===ME&&V.up<dt*1.5)announceSmall('WALL SLIDE');}
    else{f.vel.x=V.d.x*sp;f.vel.z=V.d.z*sp;if(f.onGround)f.vel.y=Math.min(f.vel.y,0);else f.vel.y=Math.max(f.vel.y,-6);}
    skTrail(f);
    for(const o of foes(f,1.6))if(!V.hs.has(o)){V.hs.add(o);hitO(f,o,{dmg:9,kb:8,up:12,launch:true,stun:.5});xSnd(o.pos,()=>SND.wind.hit(1.1));}
    return 6;}
  f.poseKey='airh';if(t>dur+.18)f.set(f.onGround?'idle':'air');return 10;};

/* SKIM SHOT (2): flick a pebble that skims along the ground at high speed and pops up into the first foe it reaches */
const SKP=[];const skGeo=new THREE.SphereGeometry(.12,8,6),skMat=new THREE.MeshBasicMaterial({color:SKO});
SPECVAR.skate={alt:['SKIM SHOT',f=>{once(f,.12,()=>{const T=tgtOf(f,30),d=T?xDirTo(f,T):f.fwd();const m=new THREE.Mesh(skGeo,skMat);m.position.set(f.pos.x+d.x*.8,f.pos.y+.2,f.pos.z+d.z*.8);scene.add(m);
    SKP.push({f,m,d,t:0,hs:new Set()});xSnd(f.pos,()=>SND.wind.spec());});vpose(f,.12,'crawl','throwS');endAt(f,.45);return 10;}]};
onEv('tick',dt=>{for(let i=SKP.length-1;i>=0;i--){const p=SKP[i];p.t+=dt;const m=p.m;m.position.x+=p.d.x*34*dt;m.position.z+=p.d.z*34*dt;
  m.position.y=floorAt(m.position.x,m.position.z,m.position.y+2)+.2+Math.abs(Math.sin(p.t*18))*.25;
  if(Math.random()<.8)burst(ADD,m.position,1,{colors:[SKO,0xffd23f],speed:.3,life:.25,size:.16,size1:0,bright:2});
  let done=p.t>1.1||!inMatch();
  if(!done&&NET.role!=='client')for(const o of FS){if(o.dead||ally(o,p.f)||p.hs.has(o))continue;if(Math.hypot(o.pos.x-m.position.x,o.pos.z-m.position.z)<1.1&&Math.abs(o.pos.y-m.position.y)<2){
    hitO(p.f,o,{dmg:11,kb:6,up:14,launch:true,stun:.6});burst(ADD,o.chest(new V3()),18,{colors:[SKO,0xffffff],speed:5,life:.35,size:.22,size1:0,bright:2.3});done=true;break;}}
  if(done){scene.remove(m);SKP.splice(i,1);}}});

/* STREET SURGE (ult): skid through up to five foes in a zig-zag, knocking each up, then a spinning launch kick */
ULTX.streetsurge={r:22,s(f){f.vf.L=foes(f,22).slice(0,5);f.vf.i=0;f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,6);f.poseKey='charge';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;V.leg=.35;f.uEnd=t+.35+Math.max(1,V.L.length)*.42+.9;}const r=t-V.t0;
    if(r<.35){f.poseKey='charge';return 10;}
    if(V.i<V.L.length){const o=V.L[V.i];f.poseKey='crawl';skTrail(f);
      if(o.dead){V.i++;V.leg=r;}else{const d=new V3(o.pos.x-f.pos.x,0,o.pos.z-f.pos.z),L=d.length();d.normalize();f.face=Math.atan2(d.x,d.z);
        if(L<1.6||r-V.leg>.42){V.i++;V.leg=r;f.vel.x*=.3;f.vel.z*=.3;if(L<3.5){hitO(f,o,{dmg:9,kb:3,up:13,launch:true,stun:.8});ring(o.chest(new V3()),SKC,2,.3,false,2.4);xSnd(o.pos,()=>SND.wind.hit(1.3));}}
        else{const sp=Math.min(40,Math.max(18,L/.1));f.vel.x=d.x*sp;f.vel.z=d.z*sp;}}
      return 6;}
    f.vel.x*=.85;f.vel.z*=.85;f.poseKey='kickSpin';
    atT(f,'fin',V.t0+V.leg+.12,()=>{const c=f.chest(new V3());ring(c,SKC,7,.4,false,2.6);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),SKO,6,.4,true,2.4);shake(.4,c);
      foes(f,7).forEach(o=>hitO(f,o,{dmg:20,kb:16,up:14,launch:true,heavy:true,stun:.8}));if(f===ME)announceSmall('STREET SURGE!');xSnd(c,()=>AU.boom(false));f.uEnd=Math.min(f.uEnd,t+.5);f.invuln=Math.max(f.invuln,.5);});
    return 10;}};
/* ROOFTOP RUN (alt ult): 10 s of free gliding — faster, falls turn into a slow glide, and every dash is a skid that hits */
ALTULT.skitter={name:'ROOFTOP RUN',r:8,s(f){f.uEnd=.6;f.poseKey='crawl';},u(f,t){atT(f,'o',.3,()=>{f.glideT=10;f.hasteT=Math.max(f.hasteT||0,10);f.auraC=SKC;
  ring(f.chest(new V3()),SKC,3,.4,false,2.4);if(f===ME)announceSmall('ROOFTOP RUN: GLIDE ANYWHERE');});return 10;}};
onEv('tick',dt=>{for(const f of FS){if(!(f.glideT>0))continue;f.glideT-=dt;if(f.dead){f.glideT=0;continue;}
  if(!f.onGround&&f.vel.y<-3)f.vel.y=-3;                                  // glide instead of falling
  if(f.wallT&&game.time-f.wallT<.08&&f.vel.y<9){f.vel.y=9;f.onGround=false;} // run straight up walls
  if(Math.hypot(f.vel.x,f.vel.z)>9){skTrail(f);if(NET.role!=='client')for(const o of foes(f,1.4)){if(o._skCD>game.time)continue;o._skCD=game.time+.8;hitO(f,o,{dmg:6,kb:7,up:8,stun:.4});}}}});
Object.assign(PFX,{skitter(a,d,t){const sp=Math.hypot(a.vel.x,a.vel.z);if(sp>8)d.vel.addScaledVector(a.fwd(),sp*.4);}});
Object.assign(PFX_DESC,{skitter:'hits while moving fast send foes flying further'});
Object.assign(XMOVES,{skitter:[['GLIDE STEP','dash','wind','arrow',['push']],['ROOFTOP DROP','slam','wind','ring',['launch']]]});

/* look: teal courier suit, orange visor band, glowing grip pads on the palms, a messenger satchel (original design) */
const _mhaPartsK=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsK(h,X);if(h.id!=='skitter')return out;const {M,head,spine,hips,lF,rF}=X;
  const orange=new THREE.MeshStandardMaterial({color:SKO,emissive:SKO,emissiveIntensity:.9,roughness:.3}),strap=new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.8}),
    bag=new THREE.MeshStandardMaterial({color:0xd8d0c0,roughness:.85}),pad=new THREE.MeshBasicMaterial({color:SKC});
  const band=M(new THREE.TorusGeometry(.17,.022,8,32,Math.PI*1.2),orange);band.rotation.set(0,0,Math.PI*-.1);band.position.set(0,.14,.01);band.rotation.x=Math.PI/2;band.rotation.z=-Math.PI*.1-Math.PI*.1;head.add(band);
  const vis=M(new THREE.BoxGeometry(.24,.05,.04),orange);vis.position.set(0,.14,.15);head.add(vis);
  const sl=M(new THREE.BoxGeometry(.05,.75,.02),strap);sl.position.set(0,.3,.17);sl.rotation.z=-.65;spine.add(sl);
  const sl2=M(new THREE.BoxGeometry(.05,.75,.02),strap);sl2.position.set(0,.3,-.17);sl2.rotation.z=.65;spine.add(sl2);
  const sat=M(new THREE.BoxGeometry(.28,.22,.1),bag);sat.position.set(.22,-.02,-.12);if(hips)hips.add(sat);else spine.add(sat);
  [lF,rF].forEach(F=>{if(!F)return;const p=M(new THREE.CylinderGeometry(.05,.05,.015,12),pad);p.position.set(0,-.33,.035);p.rotation.x=Math.PI/2;F.add(p);});
  return out;};

/* GLIDE (Skitter's dash): HOLD Shift to drop to three points and glide — steer with the movement keys.
   He only keeps moving while it's held. Gliding into a wall carries him straight up it and over the top.
   A quick tap (and bot dashes) gives a short burst of glide. */
const GLIDE_OK={idle:1,run:1,air:1,dash:1,climb:1};
function isSkitter(f){return f&&f.hero&&KIT(f.hero,'elem')==='skitter';}
const _skDash=Fighter.prototype.startDash;
Fighter.prototype.startDash=function(mv,dirO){if(!isSkitter(this))return _skDash.call(this,mv,dirO);
  this.glideKick=.45;this.dashCD=.25;if(mv&&mv.lengthSq()>.05)this.face=Math.atan2(mv.x,mv.z);xSnd(this.pos,()=>AU.whoosh(false));};
const _skPhys=Fighter.prototype.physics;
Fighter.prototype.physics=function(dt,fr,grav){
  if(isSkitter(this)){const I=this.intent||{};this.glideKick=Math.max(0,(this.glideKick||0)-dt);
    const want=!this.dead&&!this.downed&&inMatch()&&GLIDE_OK[this.state]&&(I.sprint||this.glideKick>0);
    if(want){if(!this.glideOn){this.glideOn=true;this.glUp=0;this.glFresh=false;dust(this.pos,6,.6);}
      if(this.state==='climb'||this.state==='dash')this.set(this.onGround?'run':'air');
      let dx=I.wx||0,dz=I.wz||0;const m=Math.hypot(dx,dz);if(m>.1){dx/=m;dz/=m;}else{const fw=this.fwd();dx=fw.x;dz=fw.z;}
      this.face=angLerp(this.face,Math.atan2(dx,dz),Math.min(1,10*dt));
      const sp=17*(this.hasteT>0?1.25:1)*(this.slowT>0?.6:1);
      if(!this.glDir)this.glDir=new V3(dx,0,dz);if(!this.glFresh){this.glDir.set(dx,0,dz);}this.glFresh=true;
      this.glDir.lerp(TMP2.set(dx,0,dz),Math.min(1,8*dt)).normalize();dx=this.glDir.x;dz=this.glDir.z;
      const onWall=this.wallT&&game.time-this.wallT<.12;
      if(onWall){                                   // ride straight up the wall
        this.vel.y=Math.max(this.vel.y,18);this.vel.x=dx*4;this.vel.z=dz*4;this.onGround=false;this.glUp=.3;
        if(Math.random()<.6)burst(ADD,TMP2.set(this.pos.x+dx*.4,this.pos.y+.4,this.pos.z+dz*.4),2,{colors:[SKC,0xffffff],speed:.8,life:.3,size:.2,size1:0,bright:2});}
      else{this.vel.x=dx*sp;this.vel.z=dz*sp;
        if(this.glUp>0){this.glUp-=dt;this.vel.y=Math.max(this.vel.y,6);}   // pop over the top edge
        else if(!this.onGround)this.vel.y=Math.max(this.vel.y,-3.5);}     // glide instead of dropping
      if(Math.hypot(this.vel.x,this.vel.z)>6)skTrail(this);}
    else if(this.glideOn){this.glideOn=false;this.glFresh=false;this.vel.x*=.55;this.vel.z*=.55;}}
  return _skPhys.call(this,dt,fr,grav);};
const _skPose=Fighter.prototype.targetPose;
Fighter.prototype.targetPose=function(dt){if(this.glideOn&&isSkitter(this))return POSES.crawl;return _skPose.call(this,dt);};
onEv('matchEnd',()=>FS.forEach(f=>{f.glideOn=false;f.glideKick=0;}));
onEv('matchStart',()=>setTimeout(()=>{if(ME&&isSkitter(ME))announceSmall('SKITTER: HOLD SHIFT TO GLIDE — GLIDE INTO A WALL TO RIDE UP IT');},2500));
