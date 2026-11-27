/* HOLLOW — a synthetic shadow-stalker (villain). Kit inspired by Revenant from Apex Legends (Respawn Entertainment);
   the look is original: a tall, thin black-chrome frame with a single violet visor slit, wrapped in a tattered
   shroud that streams behind him, and a long dagger.
     J / K     dagger strings (light / heavy)
     passive   STALKER: jumps a third higher
     1  SHADOW POUNCE   leap at whatever you aim at and land on them (damage + stagger). HOLD 1 to charge a much
                        longer pounce.
     2  SILENCE         throw a device; it bursts into a violet cloud. Enemies caught in it lose their powers
                        (no specials, moves or ultimate) for 6 s and take damage.
     3  DEATH TOTEM     plant a totem. You and your allies who touch it become SHADOWS for 25 s: if a shadow would
                        die, it's pulled back to the totem with 50 HP instead.
     4  SILENT BLADE    a lunging stab that silences briefly. If they're on 25 HP or less, he executes them.
     Q  FORGED SHADOWS  a 75-point shadow shield for 25 s that regenerates when he hasn't been hit for 3 s;
                        he moves faster.   Q + back / in the air: NIGHTFALL — silences everyone around him,
                        drops a death totem at his feet and makes his nearby allies shadows.
   Mode (5): ECLIPSE — see FORMS.hollow in forms.js. */
const HOL={c:0x1a1a22,a:0xb04aff,glow:0xd08aff,red:0xff3a5a};
Object.assign(SPNAME,{holpounce:'SHADOW POUNCE'});Object.assign(HERO_SND,{hollow:'blade'});Object.assign(ULT_RANGE,{forged:30});
Object.assign(SPECIAL_AI,{holpounce:[6,22,.5]});Object.assign(XSPK,{holpounce:1});Object.assign(DULT_OF,{hollow:'vengeance'});
if(typeof PROJ_SIG!=='undefined')PROJ_SIG.hollow='shard';
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.hollow='STALKER: jumps a third higher';
function isHol(f){return !!f&&!!f.hero&&KIT(f.hero,'elem')==='hollow';}

/* ---------- the look: always the black-chrome frame (never the plain-clothes outfit), visor slit, shroud ---------- */
const HOL_M={slit:new THREE.MeshBasicMaterial({color:HOL.glow}),cloth:new THREE.MeshStandardMaterial({color:0x14121a,roughness:.95,side:THREE.DoubleSide}),
  clothD:new THREE.MeshStandardMaterial({color:0x221a2a,roughness:.95,side:THREE.DoubleSide}),chrome:new THREE.MeshStandardMaterial({color:0x101014,metalness:1,roughness:.18,envMapIntensity:1.5}),
  seam:new THREE.MeshBasicMaterial({color:HOL.a})};
HOL_M.slit.color.multiplyScalar(2.4);HOL_M.seam.color.multiplyScalar(1.6);
const _holBR=buildRig;
buildRig=function(h){if(!h||!isHol({hero:h}))return _holBR.apply(this,arguments);const a=[].slice.call(arguments);a[0]=Object.assign({},h,{human:false,armor:true});
  const R=_holBR.apply(this,a);try{holDress(R);}catch(e){console.warn('hollow look',e);}return R;};
function holDress(R){
  // faceless head shell with one violet slit
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.165,20,14),HOL_M.chrome);shell.scale.set(.95,1.12,1.05);shell.position.set(0,.11,.02);R.head.add(shell);
  const slit=new THREE.Mesh(new THREE.BoxGeometry(.2,.018,.02),HOL_M.slit);slit.position.set(0,.125,.185);slit.rotation.x=-.12;R.head.add(slit);
  [-1,1].forEach(s=>{const fin=new THREE.Mesh(new THREE.BoxGeometry(.012,.1,.16),HOL_M.chrome);fin.position.set(s*.15,.16,-.02);fin.rotation.z=s*.25;R.head.add(fin);});
  // glowing seams down the arms
  [R.lS,R.rS].forEach(S=>{if(!S)return;const g=new THREE.Mesh(new THREE.BoxGeometry(.012,.3,.012),HOL_M.seam);g.position.set(0,-.18,.07);S.add(g);});
  // tattered shroud: strips from the shoulders and the waist that stream behind him
  R.holCloth=[];const strip=(par,x,y,z,w,l,mat,base)=>{const p=new THREE.Group();p.position.set(x,y,z);par.add(p);const g=new THREE.PlaneGeometry(w,l,1,4);g.translate(0,-l/2,0);
    const pa=g.attributes.position;for(let i=0;i<pa.count;i++){if(pa.getY(i)<-l*.7)pa.setX(i,pa.getX(i)*(.5+Math.random()*.6));}const m=new THREE.Mesh(g,mat);p.add(m);p.userData.base=base;R.holCloth.push(p);};
  [-.16,-.06,.06,.16].forEach((x,i)=>strip(R.spine,x,.52,-.15,.12,.8+(i%2)*.25,i%2?HOL_M.clothD:HOL_M.cloth,.15));
  [-.14,0,.14].forEach((x,i)=>strip(R.hips,x,-.02,-.12,.13,.55+(i%2)*.2,HOL_M.cloth,.1));
  [-.15,.15].forEach(x=>strip(R.hips,x,-.02,.12,.1,.42,HOL_M.clothD,-.08));
  const hood=new THREE.Mesh(new THREE.SphereGeometry(.2,18,12,0,Math.PI*2,0,Math.PI*.55),HOL_M.cloth);hood.position.set(0,.1,-.04);hood.scale.set(1.05,1.05,1.12);hood.rotation.x=-.5;R.head.add(hood);}
const _holAP=Fighter.prototype.applyPose;
Fighter.prototype.applyPose=function(dt){const r=_holAP.apply(this,arguments);if(!isHol(this)||!this.rig||!this.rig.holCloth)return r;
  const sp=Math.min(1,Math.hypot(this.vel.x,this.vel.z)/12),air=this.onGround?0:.4,t=game.time;
  this.rig.holCloth.forEach((p,i)=>{p.rotation.x=p.userData.base+sp*1.1+air+Math.sin(t*(3+i*.4)+i)*(.06+sp*.1);p.rotation.z=Math.sin(t*2.3+i*1.7)*.07;});return r;};

/* ---------- poses ---------- */
Object.assign(POSES,{
  holIdle:b_({hy:-.12,sx:.32,sy:.05,hd:-.28,lSx:.12,lSz:.28,lE:-.3,rSx:-.25,rSz:-.25,rE:-.9,lHx:-.3,lK:.42,rHx:.1,rK:.35}),
  holCrouch:b_({hy:-.52,sx:.75,hd:-.45,lSx:.65,lSz:.42,lE:-.35,rSx:.65,rSz:-.42,rE:-.35,lHx:-1.35,lK:2.05,rHx:-1.05,rK:1.85}),
  holLeap:b_({hy:0,sx:.55,hd:-.35,lSx:-2.55,lSz:.2,lE:-.2,rSx:-2.55,rSz:-.2,rE:-.2,lHx:.35,lK:.9,rHx:-.65,rK:1.3}),
  holLand:b_({hy:-.48,sx:.62,hd:-.2,lSx:-.4,lSz:.75,lE:-.3,rSx:-.5,rSz:-.75,rE:-.3,lHx:-1.15,lK:1.75,rHx:-.35,rK:1.15}),
  holPlant:b_({hy:-.55,sx:.55,hd:.15,lSx:-1,lSz:.2,lE:-.6,rSx:-1.7,rSz:-.05,rE:-.25,lHx:-1.45,lK:2.1,rHx:.35,rK:1.95}),
  holExecW:b_({hy:-.1,sx:-.2,sy:.35,hd:-.25,rSx:-2.95,rSz:-.2,rE:-1.1,lSx:-1.3,lSz:.2,lE:-.3,lHx:-.4,lK:.45,rHx:.25,rK:.3}),
  holExecH:b_({hy:-.35,sx:.75,sy:-.2,hd:.1,rSx:-.95,rSz:-.1,rE:-.15,lSx:-1.1,lSz:.3,lE:-.5,lHx:-.95,lK:1.1,rHx:.4,rK:.4}),
  holUlt:b_({hy:-.08,sx:-.32,hd:-.55,lSx:-.35,lSz:1.45,lE:-.1,rSx:-.35,rSz:-1.45,rE:-.1,lHx:-.3,lK:.3,rHx:.2,rK:.25})});
const _holTP=Fighter.prototype.targetPose;
Fighter.prototype.targetPose=function(dt){const P=_holTP.apply(this,arguments);if(!isHol(this))return P;
  if(this.state==='special'&&this.spPend&&this.curSpecial()==='holpounce')return POSES.holCrouch;
  if(this.state==='idle'&&!this.locked){const Q=Object.assign({},POSES.holIdle);Q.hd+=Math.sin(game.time*.9)*.08;Q.sy+=Math.sin(game.time*.6)*.1;return Q;}
  return P;};

/* ---------- passive: STALKER (higher jumps) ---------- */
const _holUpd=Fighter.prototype.update;
Fighter.prototype.update=function(dt){const g0=this.onGround;const r=_holUpd.apply(this,arguments);
  if(isHol(this)&&g0&&!this.onGround&&this.vel.y>4&&this.state!=='special'&&this.state!=='fly'&&this.state!=='ult')this.vel.y*=1.33;return r;};

/* ---------- 1 SHADOW POUNCE (hold to charge) ---------- */
SPECIALS.holpounce=function(f,dt){const V=f.vf,t=f.stateT;
  if(!V.go){if(t<(f.specVar==='chg'?.05:.18)){f.poseKey='holCrouch';f.vel.x*=.6;f.vel.z*=.6;return 10;}
    const maxD=f.specVar==='chg'?16+14*(f.chgK||0):13,A=hemAimPoint(f,maxD+4);let to=A.T?A.T.pos.clone():A.p.clone();
    const d=to.clone().sub(f.pos);d.y=0;let L=d.length();if(L<3){d.copy(f.fwd());L=3;}if(L>maxD)L=maxD;d.setLength(L);to=f.pos.clone().add(d);to.y=floorAt(to.x,to.z,Math.max(f.pos.y,to.y)+4);
    V.go=1;V.p0=f.pos.clone();V.p1=to;V.T0=t;V.dur=.42+L/34;V.h=1.6+L*.12;V.exp=f.pos.clone();f.face=Math.atan2(d.x,d.z);
    dust(f.pos,8,.6);xSnd(f.pos,()=>{AU.whoosh&&AU.whoosh(true);AU.noise(.15,.3,'lowpass',700,200,1);});}
  const k=Math.min(1,(t-V.T0)/V.dur);
  // knocked off course (a wall, a hit): land where we are
  if(f.pos.distanceTo(V.exp)>.5&&k<1)V.land=1;
  if(k<1&&!V.land){const p=V.p0.clone().lerp(V.p1,k);p.y+=Math.sin(k*Math.PI)*V.h;f.pos.copy(p);f.vel.set(0,0,0);f.onGround=false;   // moved directly along the arc (the wall sweep in fixes.js still stops it at walls)
    V.exp.copy(p);f.poseKey=k<.75?'holLeap':'holLand';
    if(nearCam(p,60)&&Math.random()<.8)burst(SMK,f.chest(TMP2),1,{colors:[0x14121a,0x3a1a5a,HOL.a],speed:.4,life:.5,size:.4,size1:.8});return 0;}
  if(!V.hit){V.hit=1;V.tl=t;f.vel.set(0,0,0);const c=new V3(f.pos.x,f.pos.y+.2,f.pos.z),chg=f.specVar==='chg';
    if(NET.role!=='client')for(const o of FS){if(o===f||o.dead||o.dormant||ally(o,f))continue;if(o.pos.distanceTo(f.pos)<2.8)hitO(f,o,{dmg:chg?16:11,kb:7,up:4,stun:.7,launch:chg,heavy:true});}
    if(nearCam(c,80)){ring(c,HOL.a,3.2,.4,true,2);burst(SMK,c,16,{colors:[0x14121a,0x3a1a5a],speed:4,up:1,life:.6,size:.5,size1:1.1});dust(c,12,.9);shake(.35,c);}
    if(typeof crater==='function'&&chg)crater(c.x,c.z,1,f.pos.y);xSnd(c,()=>{AU.hit&&AU.hit(1);AU.noise(.2,.4,'lowpass',400,120,1);});}
  f.poseKey='holLand';if(t-V.tl>.32)f.set('idle');return 10;};
SPECVAR.holpounce={chg:['SHADOW POUNCE · CHARGED',(f,dt)=>SPECIALS.holpounce(f,dt)],alt:['SILENCE',(f,dt)=>{const V=f.vf,t=f.stateT;f.vel.x*=.8;f.vel.z*=.8;
  if(t<.25){f.poseKey='hemThrowW';return 10;}
  if(!V.thr){V.thr=1;const A=hemAimPoint(f,18);let to=A.T?A.T.pos.clone():A.p.clone();const d=to.clone().sub(f.pos);d.y=0;if(d.length()>18)d.setLength(18);if(d.length()<2)d.setLength(2);to=f.pos.clone().add(d);
    to.y=floorAt(to.x,to.z,Math.max(f.pos.y,to.y)+3);f.face=Math.atan2(d.x,d.z);holThrowSilence(f,limbPos(f,'r',new V3()),to);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false));}
  f.poseKey=t<.5?'hemThrowH':'holIdle';endAt(f,.6);return 10;}]};

/* ---------- 2 SILENCE ---------- */
const HOL_SIL=[],HOL_DEV=[];
function holThrowSilence(f,from,to){const m=new THREE.Group();const b=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),HOL_M.chrome);m.add(b);const g=new THREE.Mesh(new THREE.OctahedronGeometry(.07,0),HOL_M.slit);m.add(g);
  m.position.copy(from);scene.add(m);HOL_DEV.push({f,m,from:from.clone(),to:to.clone(),t:0,dur:.65});}
function holSilenceAt(f,p,R,dur){const q=p.clone();const disc=new THREE.Mesh(HEM_DISC,new THREE.MeshBasicMaterial({color:0x6a2aaa,transparent:true,opacity:.3,depthWrite:false}));disc.scale.setScalar(R);disc.position.set(q.x,q.y+.05,q.z);scene.add(disc);
  HOL_SIL.push({f,p:q,R,t:0,dur,tick:0,hit:new Set(),disc});ring(new V3(q.x,q.y+.2,q.z),HOL.a,R,.5,true,2.2);flashLight(new V3(q.x,q.y+1,q.z),HOL.a,6);
  xSnd(q,()=>{AU.tone('square',900,120,.35,.08);AU.noise(.5,.3,'bandpass',800,300,1);});}
function holSilTick(dt){
  for(let i=HOL_DEV.length-1;i>=0;i--){const D=HOL_DEV[i];D.t+=dt;const k=Math.min(1,D.t/D.dur),p=D.from.clone().lerp(D.to,k);p.y+=Math.sin(k*Math.PI)*2;D.m.position.copy(p);D.m.rotation.x+=dt*12;D.m.rotation.y+=dt*9;
    if(k>=1){scene.remove(D.m);HOL_DEV.splice(i,1);holSilenceAt(D.f,D.to,3.6,4);}}
  for(let i=HOL_SIL.length-1;i>=0;i--){const S=HOL_SIL[i];S.t+=dt;if(S.t>S.dur||!inMatch()){scene.remove(S.disc);HOL_SIL.splice(i,1);continue;}const fade=Math.min(1,(S.dur-S.t)/.6);S.disc.material.opacity=.3*fade;
    if(nearCam(S.p,70))for(let k=0;k<2;k++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*S.R;burst(SMK,TMP2.set(S.p.x+Math.cos(a)*r,S.p.y+rand(.1,1.6),S.p.z+Math.sin(a)*r),1,{colors:[0x2a0a4a,0x6a2aaa,0x14121a],speed:.4,up:.4,life:1.4,size:.7,size1:1.6*fade,drag:1});}
    S.tick-=dt;const tick=S.tick<=0;if(tick)S.tick=.5;
    for(const o of FS){if(o.dead||o.dormant||ally(o,S.f)||o===S.f)continue;if(Math.hypot(o.pos.x-S.p.x,o.pos.z-S.p.z)>S.R||Math.abs(o.pos.y-S.p.y)>2.6)continue;
      if(!S.hit.has(o)){S.hit.add(o);if(NET.role!=='client'){eraseO(o,6);hitO(S.f,o,{dmg:6,kb:1,up:0,stun:.35});}else eraseO(o,6);}
      else if(tick&&NET.role!=='client'&&typeof hemDot==='function')hemDot(o,S.f,1.2);}}}

/* ---------- 3 DEATH TOTEM / shadows ---------- */
const HOL_TOT=[];
function holTotemMesh(){const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,.18,6),HOL_M.chrome);base.position.y=.09;g.add(base);
  const ob=new THREE.Mesh(new THREE.CylinderGeometry(.05,.2,1.9,4),HOL_M.chrome);ob.position.y=1.1;g.add(ob);
  for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(.015,.5,.015),HOL_M.seam);const a=i*Math.PI/2+Math.PI/4;r.position.set(Math.cos(a)*.12,.9,Math.sin(a)*.12);r.rotation.set(Math.sin(a)*.08,0,-Math.cos(a)*.08);g.add(r);}
  const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),HOL_M.slit);orb.position.y=2.35;g.add(orb);g.userData.orb=orb;
  const ring_=new THREE.Mesh(new THREE.TorusGeometry(.34,.015,6,32),HOL_M.seam);ring_.position.y=2.35;g.add(ring_);g.userData.ring=ring_;
  const pad=new THREE.Mesh(HEM_DISC,new THREE.MeshBasicMaterial({color:HOL.a,transparent:true,opacity:.18,depthWrite:false}));pad.scale.setScalar(1.4);pad.position.y=.03;g.add(pad);return g;}
function holPlantTotem(f,p){HOL_TOT.filter(T=>T.f===f).forEach(holTotemGone);const m=holTotemMesh();m.position.copy(p);scene.add(m);const T={f,p:p.clone(),m,t:0,life:30};HOL_TOT.push(T);
  dust(p,10,.7);ring(new V3(p.x,p.y+.1,p.z),HOL.a,2.4,.5,true,2);xSnd(p,()=>{AU.tone('sawtooth',70,55,1.2,.12);AU.tone('sine',440,330,.6,.05);});return T;}
function holTotemGone(T){const i=HOL_TOT.indexOf(T);if(i>=0)HOL_TOT.splice(i,1);scene.remove(T.m);burst(SMK,new V3(T.p.x,T.p.y+1,T.p.z),10,{colors:[0x14121a,0x3a1a5a],speed:2,up:1,life:.6,size:.4,size1:.8});
  for(const o of FS)if(o.shadowTot===T){o.shadowTot=null;o.shadowT=0;}}
function holMakeShadow(o,T){o.shadowT=game.time+25;o.shadowTot=T;ring(o.chest(new V3()),HOL.a,1.4,.4,false,2);if(o===ME)announceSmall('☠ YOU ARE A SHADOW — DIE AND YOU RETURN TO THE TOTEM');}
XCUSTOM.holtotem=function(f,dt){const V=f.vf,t=f.stateT;f.vel.x*=.6;f.vel.z*=.6;f.poseKey='holPlant';
  if(!V.p&&t>.32){V.p=1;const p=f.pos.clone().addScaledVector(f.fwd(),.9);p.y=floorAt(p.x,p.z,f.pos.y+1);holPlantTotem(f,p);if(f===ME)announceSmall('☠ DEATH TOTEM — TOUCH IT TO BECOME A SHADOW');}
  endAt(f,.75);return 10;};
function holTotTick(dt){const now=game.time;
  for(let i=HOL_TOT.length-1;i>=0;i--){const T=HOL_TOT[i];T.t+=dt;if(T.t>T.life||!inMatch()){holTotemGone(T);continue;}T.m.userData.orb.rotation.y+=dt*2;T.m.userData.orb.position.y=2.35+Math.sin(now*2)*.08;T.m.userData.ring.rotation.x=now*1.3;
    if(nearCam(T.p,60)&&Math.random()<.3)burst(SMK,TMP2.set(T.p.x+rand(-.3,.3),T.p.y+rand(.2,2),T.p.z+rand(-.3,.3)),1,{colors:[0x14121a,0x3a1a5a],speed:.3,up:.4,life:1,size:.3,size1:.6});
    for(const o of FS){if(o.dead||o.dormant||!(o===T.f||ally(o,T.f))||o.shadowT>now)continue;if(Math.hypot(o.pos.x-T.p.x,o.pos.z-T.p.z)<1.4&&Math.abs(o.pos.y-T.p.y)<2)holMakeShadow(o,T);}}
  for(const o of FS){if(!(o.shadowT>now)||o.dead)continue;if(nearCam(o.pos,60)&&Math.random()<.6)burst(SMK,o.chest(TMP2).add(TMP.set(rand(-.3,.3),rand(-.6,.4),rand(-.3,.3))),1,{colors:[0x0a0810,0x2a1a3a],speed:.3,up:.6,life:.6,size:.35,size1:.7});}}
// a shadow that would die goes back to its totem instead
const _holKill=killFighter;
killFighter=function(def,att,dir){if(def&&def.shadowT>game.time&&def.shadowTot&&HOL_TOT.indexOf(def.shadowTot)>=0&&!game.practice){const T=def.shadowTot;
    def.shadowT=0;def.shadowTot=null;def.hp=50;def.dead=false;def.pos.set(T.p.x+.9,T.p.y,T.p.z);def.vel.set(0,0,0);def.set('idle');def.invuln=1.5;def.onGround=true;
    const c=def.chest(new V3());ring(c,HOL.a,2,.5,false,2.4);burst(SMK,c,24,{colors:[0x0a0810,0x3a1a5a,HOL.a],speed:3,up:1,life:.7,size:.5,size1:1});
    xSnd(c,()=>{AU.tone('sawtooth',300,80,.6,.1);AU.tone('sine',220,440,.4,.06);});if(def===ME)announceSmall('☠ PULLED BACK FROM DEATH');return;}
  return _holKill.apply(this,arguments);};

/* ---------- 4 SILENT BLADE ---------- */
XCUSTOM.holexec=function(f,dt){const V=f.vf,t=f.stateT;
  if(!V.a){V.a=1;const T=tgtOf(f,6);if(T)faceTo(f,T);}
  if(t<.2){f.poseKey='holExecW';f.vel.x*=.6;f.vel.z*=.6;return 10;}
  f.poseKey='holExecH';if(t<.34){const fw=f.fwd();f.vel.x=fw.x*9;f.vel.z=fw.z*9;}else{f.vel.x*=.7;f.vel.z*=.7;}
  if(!V.chk&&t>.28){V.chk=1;const o=foes(f,2.8,null,.55)[0];
    if(o){const p=o.chest(new V3());if(NET.role!=='client'){if(o.hp<=25){hitO(f,o,{dmg:200,kb:4,up:2,stun:1,heavy:true});if(f===ME)announceSmall('☠ EXECUTED');else if(o===ME)announceSmall('☠ EXECUTED BY HOLLOW');}
        else{hitO(f,o,{dmg:12,kb:2,up:0,stun:.5});eraseO(o,1.5);}}
      if(typeof bloodBurst==='function'&&typeof goreOn==='function'&&goreOn())bloodBurst(p,o.hp<=25?50:20,6);burst(ADD,p,10,{colors:[HOL.a,0xffffff],speed:3,life:.2,size:.2,size1:0,bright:2});xSnd(p,()=>AU.hit&&AU.hit(1));}}
  endAt(f,.62);return 10;};

/* ---------- Q FORGED SHADOWS / NIGHTFALL ---------- */
ULTX.forged={r:30,s(f){f.uEnd=2.1;f.poseKey='holUlt';f.vf.t0=null;},
  u(f,t){const V=f.vf;if(V.t0==null)V.t0=t;f.poseKey=t-V.t0<1?'holUlt':'holIdle';f.vel.x*=.8;f.vel.z*=.8;
    atT(f,'fs',V.t0+.4,()=>{f.fsT=game.time+25;f.fsHp=75;f.fsMax=75;f.fsLast=game.time;f.hasteT=Math.max(f.hasteT||0,25);const c=f.chest(new V3());
      ring(c,HOL.a,4,.6,false,2.4);ring(new V3(f.pos.x,f.pos.y+.1,f.pos.z),HOL.a,8,.6,true,2);burst(SMK,c,40,{colors:[0x0a0810,0x3a1a5a,HOL.a],speed:4,up:1,life:.8,size:.5,size1:1.2});flashLight(c,HOL.a,10);shake(.4,c);
      xSnd(f.pos,()=>{AU.tone('sawtooth',80,60,1.5,.15);AU.noise(1,.2,'lowpass',300,150,1);});if(f===ME)announceSmall('☠ FORGED SHADOWS — 75 SHADOW SHIELD');});
    return 10;}};
ALTULT.hollow={name:'NIGHTFALL',r:14,s(f){f.uEnd=2.3;f.poseKey='holUlt';f.vf.t0=null;},
  u(f,t){const V=f.vf;if(V.t0==null)V.t0=t;f.poseKey=t-V.t0<.9?'holUlt':'holPlant';f.vel.x*=.7;f.vel.z*=.7;
    atT(f,'nf',V.t0+.5,()=>{const T=holPlantTotem(f,f.pos.clone());holSilenceAt(f,f.pos.clone(),12,1.2);
      for(const o of FS){if(o.dead||o.dormant)continue;const d=o.pos.distanceTo(f.pos);if(d>12)continue;if(o===f||ally(o,f))holMakeShadow(o,T);}
      if(f===ME)announceSmall('☠ NIGHTFALL');});
    return 10;}};
// the shadow shield soaks damage first and regenerates out of combat
const _holAH=applyHit;
applyHit=function(att,def,o){if(!def||!(def.fsT>game.time)||!(def.fsHp>0)||def.dead)return _holAH.apply(this,arguments);
  const h0=def.hp,extra=def.fsHp;def.hp+=extra;const r=_holAH.apply(this,arguments);
  if(!def.dead){if(def.hp>h0){def.fsHp=def.hp-h0;def.hp=h0;}else def.fsHp=0;if(def.fsHp<extra){def.fsLast=game.time;burst(ADD,def.chest(TMP2),6,{colors:[HOL.a,0x3a1a5a],speed:2.5,life:.2,size:.25,size1:0,bright:2});}}else def.fsHp=0;
  return r;};
function holShieldTick(dt){for(const f of FS){if(!(f.fsT>game.time)||f.dead){if(f.fsHp)f.fsHp=0;continue;}if(game.time-f.fsLast>3&&f.fsHp<f.fsMax)f.fsHp=Math.min(f.fsMax,f.fsHp+20*dt);
    if(nearCam(f.pos,50)&&Math.random()<.5)burst(SMK,f.chest(TMP2).add(TMP.set(rand(-.35,.35),rand(-.7,.5),rand(-.35,.35))),1,{colors:[0x0a0810,0x3a1a5a,HOL.a],speed:.4,up:.5,life:.5,size:.3,size1:.6});}}
onEv('tick',()=>{const e=document.getElementById('holHud');if(!ME||!isHol(ME)||!inMatch()){if(e)e.style.display='none';return;}let d=e;
  if(!d){d=document.createElement('div');d.id='holHud';d.style.cssText='position:fixed;left:50%;top:64px;transform:translateX(-50%);font:700 12px/1 system-ui,sans-serif;color:#e8dcff;background:rgba(20,10,30,.72);padding:6px 10px;border-radius:8px;letter-spacing:.06em;pointer-events:none;z-index:20';document.body.appendChild(d);}
  const sh=ME.fsT>game.time?` · SHADOW SHIELD ${Math.round(ME.fsHp)}/${ME.fsMax} (${Math.ceil(ME.fsT-game.time)}s)`:'',sd=ME.shadowT>game.time?` · SHADOW ${Math.ceil(ME.shadowT-game.time)}s`:'',tot=HOL_TOT.some(T=>T.f===ME)?' · TOTEM UP':'';
  const s='☠ HOLLOW'+tot+sd+sh;if(d._s!==s){d._s=s;d.textContent=s;}d.style.display=(sh||sd||tot)?'block':'none';});

/* ---------- per frame ---------- */
onEv('tick',dt=>{if(!inMatch())return;try{holSilTick(dt);holTotTick(dt);holShieldTick(dt);}catch(e){console.warn('hollow',e);}});
onEv('matchStart',()=>{FS.forEach(f=>{f.shadowT=0;f.shadowTot=null;f.fsT=0;f.fsHp=0;});});
onEv('matchEnd',()=>{HOL_SIL.forEach(S=>scene.remove(S.disc));HOL_SIL.length=0;HOL_DEV.forEach(D=>scene.remove(D.m));HOL_DEV.length=0;HOL_TOT.slice().forEach(holTotemGone);});
(function(){const h=HEROES.find(x=>x.id==='hollow');if(!h)return;const ab=o=>sanitizeAbil(Object.assign({colors:[HOL.a,0x14121a]},o));
  h._xm=[Object.assign(ab({name:'DEATH TOTEM',form:'zone',style:'shadow',shape:'orb',range:12,fx:[]}),{custom:'holtotem'}),Object.assign(ab({name:'SILENT BLADE',form:'burst',style:'shadow',shape:'knife',size:.75,fx:[]}),{custom:'holexec'})];
  if(typeof UO!=='undefined')UO.hollow=(f,t,c)=>{if(uo1(f,'a'))aura(f,HOL.c,HOL.a,1);uoSwirl(f,c,HOL.a,0x14121a,4,SMK);};})();
