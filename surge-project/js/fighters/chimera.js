/* ROTTEN CHIMERA — an original fighter. He starts every life as nothing but a rotting torso that ROLLS around the arena,
   and builds himself a body out of the battlefield: walk (roll) over a torn-off limb or head (see gore.js) and he grafts
   it on. He can wear up to 10 ARMS, 10 LEGS and 10 HEADS.
     arms  → each one: +4% damage, and ammunition for ARM JAVELIN
     legs  → he stands up and walks once he has one; each leg: +3% speed (no legs = rolling)
     heads → each one: 2.5% less damage taken
     1       ARM JAVELIN   hurls one of his collected arms: it skewers the enemy and PINS them to the wall behind them
                           (or to the ground), damaging them. The arm stays stuck where it lands until he takes it back.
                           Hold 1: JAVELIN VOLLEY — up to three arms at once in a fan.
     2       SPLIT         a counter: his body bursts apart into a cloud of limbs. Anyone who hits him while he's apart
                           takes no hit on him — he snaps back together around them and buries them in a PILE OF LIMBS
                           that holds them for 2 seconds.
     3       BILE          vomits a stream of very acidic, sticky bile: it burns, slows, and leaves corrosive puddles.
     4       ABSORPTION    pulls flesh to him: every torn limb and gore chunk around flies in and is grafted on (chunks heal),
                           his thrown arms come back, and enemies near him are dragged in — anyone who ends up close
                           has flesh ripped off them (damage, and he gains a limb).
     Q       AMALGAMATION  he swallows all the gore around him and swells into a towering amalgamation of limbs, heads and
                           meat — a permanent form that lasts until he dies (more damage, less damage taken, faster, +4 of
                           every limb). His ult meter charges at half speed to make up for it. Used again in that form:
                           FLESH ERUPTION, a huge burst of meat and bone around him.
     Q+back  LIMB STORM    flings every arm he has (at least four) at everyone nearby, pinning each one.
   Mode (5): FESTER — see FORMS.chimera in forms.js. */
const CHI_R=0x7a1420,CHI_M=0x5a6a2a,CHI_B=0xb8d83a,CHI_P=0xd88a8a,CHI_MAX=10;
Object.assign(SPNAME,{chimjav:'ARM JAVELIN'});Object.assign(HERO_SND,{chimera:'power'});Object.assign(ULT_RANGE,{amalgam:12});
Object.assign(SPECIAL_AI,{chimjav:[3,22,.6]});Object.assign(XSPK,{chimjav:1});Object.assign(DULT_OF,{chimera:'barrage'});
if(typeof PROJ_SIG!=='undefined')PROJ_SIG.chimera='shard';
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.chimera='grafts torn-off limbs onto himself: arms hit harder, legs run faster, heads soak damage';
setTimeout(()=>{try{VCRY.chimera=[['More… I need MORE!',0],['Become part of me!',-.06]];}catch(e){}},0);
function isChi(f){return !!f&&!!f.hero&&f.hero.id==='chimera';}
function chiS(f){if(!f.chi)f.chi={a:0,l:0,h:0,amal:false,x:[],roll:0,sig:''};return f.chi;}
const CHI_MEAT=new THREE.MeshStandardMaterial({color:0x7a1a22,roughness:.5,metalness:0});
const CHI_MEAT2=new THREE.MeshStandardMaterial({color:0xa84a4a,roughness:.6,metalness:0});
const CHI_BONE=new THREE.MeshStandardMaterial({color:0xe8dcc0,roughness:.7,metalness:0});
const CHI_BILE=new THREE.MeshBasicMaterial({color:CHI_B,transparent:true,opacity:.7,depthWrite:false});
const CHI_G=[new THREE.DodecahedronGeometry(.16,0),new THREE.IcosahedronGeometry(.14,0),new THREE.SphereGeometry(.15,8,6)];
const CHI_DISC=new THREE.CircleGeometry(1,20);CHI_DISC.rotateX(-Math.PI/2);
function chiAdd(f,kind,n){if(NET.role==='client')return 0;const S=chiS(f),k=kind==='arm'?'a':kind==='leg'?'l':'h';const before=S[k];S[k]=Math.min(CHI_MAX,S[k]+(n||1));
  if(S[k]!==before){netEvent({k:'chl',id:f.id,a:S.a,l:S.l,h:S.h,m:S.amal?1:0});const c=f.chest(new V3());burst(SMK,c,10,{colors:[0x6a0010,0x8a1a20],speed:2.5,up:1,life:.5,size:.16,size1:.06,grav:9});
    if(f===ME&&typeof announceSmall==='function')announceSmall('');xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false));}
  return S[k]-before;}
onEv('net:chl',e=>{const f=FS.find(o=>o.id===e.id);if(!f)return;const S=chiS(f);S.a=e.a;S.l=e.l;S.h=e.h;S.amal=!!e.m;});
function limbKind(key){return key==='head'?'head':(key==='lH'||key==='rH')?'leg':'arm';}

/* ---------- the body he has built: which parts show, extra grafted limbs, rolling when he has no legs ---------- */
function chiRebuild(f){const S=chiS(f),R=f.rig;S.x.forEach(m=>{if(m.parent)m.parent.remove(m);});S.x.length=0;
  const graft=(src,off,rot,sc)=>{if(!src||!src.parent)return;const c=src.clone(true);c.visible=true;c.position.copy(src.position).add(off);c.rotation.set(rot.x,rot.y,rot.z);if(sc)c.scale.multiplyScalar(sc);src.parent.add(c);S.x.push(c);};
  const rs=k=>{let s=0;for(const ch of (f.id+'')+k)s=(s*31+ch.charCodeAt(0))|0;return()=>{s=(s*1103515245+12345)|0;return ((s>>>8)&0xffff)/0xffff;};};
  let r=rs('a');for(let i=2;i<S.a;i++){const sd=i%2?1:-1;graft(R.lS,new V3((sd>0?0:-2*R.lS.position.x)+sd*(r()-.5)*.12,-(r()*.45),(r()-.5)*.3),new V3((r()-.5)*1.6,(r()-.5)*1.2,sd*(.4+r()*1.1)),.85+r()*.2);}
  r=rs('l');for(let i=2;i<S.l;i++){const sd=i%2?1:-1;graft(R.lH,new V3((sd>0?0:-2*R.lH.position.x)+sd*r()*.12,r()*.12,(r()-.5)*.35),new V3((r()-.5)*.6,(r()-.5)*.8,sd*(.5+r()*.7)),.8+r()*.2);}
  r=rs('h');for(let i=1;i<S.h;i++){const a=(i/(S.h))*Math.PI*2+r();graft(R.head,new V3(Math.cos(a)*(.22+r()*.12),-.12-r()*.25,Math.sin(a)*.18-.05),new V3((r()-.5)*.8,a,(r()-.5)*.9),.7+r()*.25);}
  if(S.amal){const sp=R.spine,hp=R.hips;for(let i=0;i<26;i++){const m=new THREE.Mesh(pick(CHI_G),i%3?CHI_MEAT:CHI_MEAT2);const on=i%3?sp:hp;m.position.set(rand(-.32,.32),rand(0,on===sp?.75:.2),rand(-.25,.25));m.scale.setScalar(rand(.8,1.9));on.add(m);S.x.push(m);}
    for(let i=0;i<8;i++){const b=new THREE.Mesh(new THREE.ConeGeometry(.035,.32,5),CHI_BONE);b.position.set(rand(-.3,.3),rand(.1,.7),rand(-.25,-.1));b.rotation.set(rand(-2.4,-1.2),rand(-1,1),rand(-.8,.8));sp.add(b);S.x.push(b);}}
  S.sig=S.a+'|'+S.l+'|'+S.h+'|'+(S.amal?1:0);}
function chiPartsVis(f){const S=chiS(f),R=f.rig;if(R.lS)R.lS.visible=S.a>=1;if(R.rS)R.rS.visible=S.a>=2;if(R.lH)R.lH.visible=S.l>=1;if(R.rH)R.rH.visible=S.l>=2;if(R.head)R.head.visible=S.h>=1;}
const _chiAP=Fighter.prototype.applyPose;Fighter.prototype.applyPose=function(dt){const r=_chiAP.apply(this,arguments);if(!isChi(this))return r;const f=this,S=chiS(f),R=f.rig;
  if(f.dead)return r;const sig=S.a+'|'+S.l+'|'+S.h+'|'+(S.amal?1:0);if(sig!==S.sig)chiRebuild(f);chiPartsVis(f);
  const sc=f.hero.scale*(S.amal?1.4:1);if(!f._chSplit&&f.state!=='ult')R.root.scale.setScalar(sc);
  let rolling=false;
  if(S.l===0&&R.hips&&!S.amal){const sp=Math.hypot(f.vel.x,f.vel.z),busy=f.state==='special'||f.state==='ult'||f.state==='attack';
    if(sp>.8&&!busy){rolling=true;S.roll+=sp*dt/.42;const q=new THREE.Quaternion().setFromAxisAngle(new V3(1,0,0),S.roll).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0,0,1),Math.PI/2));
      R.hips.quaternion.copy(q);R.hips.position.set(0,.42,0).sub(new V3(0,.45,0).applyQuaternion(q));if(R.spine)R.spine.rotation.set(0,0,0);
      if(Math.random()<.25&&nearCam(f.pos,40))burst(SMK,TMP2.set(f.pos.x,f.pos.y+.1,f.pos.z),1,{colors:[0x5a0a10,0x3a2a10],speed:.6,up:.3,life:.6,size:.14,size1:.05,grav:6});}
    else{R.hips.position.y=Math.min(R.hips.position.y,.26);}}
  // not rolling (or he has legs now): undo the roll so he sits / stands upright — the pose only sets the hips' pitch
  if(!rolling&&R.hips){R.hips.rotation.y=0;R.hips.rotation.z=0;R.hips.position.x=0;R.hips.position.z=0;}
  chiBlobPose(f,dt);
  return r;};
// speed from legs (and the amalgamation), damage from arms, toughness from heads
const _chiUp=Fighter.prototype.update;Fighter.prototype.update=function(dt){if(!isChi(this))return _chiUp.apply(this,arguments);const S=chiS(this),h=this.hero,b=h.spd;
  h.spd=b*(S.amal?.92:S.l===0?.95:1+.03*S.l);try{return _chiUp.apply(this,arguments);}finally{h.spd=b;}};
const _chiReset=Fighter.prototype.reset;Fighter.prototype.reset=function(){const r=_chiReset.apply(this,arguments);if(isChi(this)){const S=chiS(this);S.x.forEach(m=>{if(m.parent)m.parent.remove(m);});S.x.length=0;S.a=0;S.l=0;S.h=0;S.amal=false;S.sig='';S.roll=0;this._chSplit=false;this._chSplitT=0;
  if(this.rig&&this.rig.hips){this.rig.hips.quaternion.identity();this.rig.hips.visible=true;}chiBlobKill(this);this._stainAt=null;}return r;};

/* ---------- picking gore up off the ground ---------- */
onEv('tick',dt=>{if(!inMatch()||typeof GORE==='undefined')return;for(const f of FS){if(!isChi(f)||f.dead)continue;
  for(let i=GORE.limbs.length-1;i>=0;i--){const L=GORE.limbs[i];if(L.f===f&&L.t<1)continue;const p=L.m.position;if(Math.hypot(p.x-f.pos.x,p.z-f.pos.z)>1.7||Math.abs(p.y-f.pos.y)>2.2)continue;
    scene.remove(L.m);GORE.limbs.splice(i,1);chiAdd(f,limbKind(L.key||'lS'));}
  for(let i=GORE.chunks.length-1;i>=0;i--){const C=GORE.chunks[i];if(!C.rest)continue;const p=C.m.position;if(Math.hypot(p.x-f.pos.x,p.z-f.pos.z)>1.3)continue;scene.remove(C.m);GORE.chunks.splice(i,1);
    if(NET.role!=='client'&&!(typeof healLocked==='function'&&healLocked(f)))f.hp=Math.min(100,f.hp+1.5);}
  // his thrown arms: walk over one to take it back
  for(let i=CHI_ARMS.length-1;i>=0;i--){const A=CHI_ARMS[i];if(A.owner!==f||A.fly||A.pinT>0)continue;const p=A.m.position;if(Math.hypot(p.x-f.pos.x,p.z-f.pos.z)<1.8&&Math.abs(p.y-f.pos.y)<3){chiArmGone(i);chiAdd(f,'arm');}}}});
// rotten signature: drips and flies
onEv('tick',dt=>{for(const f of FS){if(!isChi(f)||f.dead||!nearCam(f.pos,40))continue;const S=chiS(f),c=f.chest(new V3());
  if(Math.random()<(S.amal?.6:.2))burst(SMK,c.clone().add(TMP2.set(rand(-.4,.4),rand(-.5,.4),rand(-.4,.4))),1,{colors:[0x6a0a12,0x8a8a2a],speed:.3,up:0,life:.8,size:.09,size1:.05,grav:12});
  if(Math.random()<.15){const a=game.time*6+f.id;burst(ADD,c.clone().add(TMP2.set(Math.cos(a)*.7,rand(-.2,.8),Math.sin(a)*.7)),1,{colors:[0x1a1a10],speed:1.2,life:.4,size:.05,size1:.04,bright:.4});}}});
// his ult meter charges at half speed (the amalgamation is permanent)
onEv('tick',()=>{if(NET.role==='client')return;for(const f of FS){if(!isChi(f))continue;if(f._mPrev!=null&&f.meter>f._mPrev&&f.state!=='ult')f.meter=f._mPrev+(f.meter-f._mPrev)*.5;f._mPrev=f.meter;}});

/* ---------- thrown arms (javelins) and pins ---------- */
const CHI_ARMS=[],CHI_PINS=[],CHI_TRAPS=[],CHI_PUD=[],CHI_SPLITS=[];
function chiArmMesh(f){const src=f.rig.lS||f.rig.rS;let m;if(src){m=src.clone(true);m.visible=true;m.scale.setScalar(f.hero.scale*1.05);}
  else{m=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.7,6),CHI_MEAT);}const g=new THREE.Group();m.position.set(0,.35,0);g.add(m);scene.add(g);return g;}
function chiAim(g,d){g.quaternion.setFromUnitVectors(new V3(0,-1,0),d.clone().normalize());}
function chiThrow(f,dir,T,phantom){const S=chiS(f);if(!phantom){if(S.a<=0)return false;if(NET.role!=='client')S.a--;netEvent({k:'chl',id:f.id,a:S.a,l:S.l,h:S.h,m:S.amal?1:0});}
  const c=hHandC(f),g=chiArmMesh(f);g.position.copy(c);const d=dir.clone().normalize();chiAim(g,d);
  CHI_ARMS.push({m:g,owner:f,fly:true,v:d.multiplyScalar(40),T,from:c.clone(),dist:0,pinT:0,life:0,phantom:!!phantom});
  xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));return true;}
function hHandC(f){return limbPos(f,'r',new V3());}
function chiArmGone(i){const A=CHI_ARMS[i];scene.remove(A.m);CHI_ARMS.splice(i,1);}
function chiPin(f,T,dir,A){// throw them to the wall right behind them, or pin them to the ground
  const L=clearLen(T.pos,dir,6,T.pos.y+1),wall=L<5.8;const to=wall?T.pos.clone().addScaledVector(dir,Math.max(0,L-.45)):T.pos.clone();if(wall)to.y=T.pos.y+.5;else to.y=floorAt(to.x,to.z,T.pos.y+1);
  CHI_PINS.push({T,f,pos:to,t:0,dur:1.8,wall,A,dir:dir.clone()});A.pinT=1.8;A.T=T;
  if(nearCam(to,60)){const p=TMP3.set(to.x,to.y+1.1,to.z).clone();if(typeof bloodBurst==='function')bloodBurst(p,40,7);if(wall&&typeof wallSplat==='function')wallSplat(p.clone().addScaledVector(dir,.3),dir.clone().negate());shake(.35,p);}
  xSnd(to,()=>{AU.boom&&AU.boom(false);});netEvent({k:'chpin',d:T.id,x:to.x,y:to.y,z:to.z,w:wall?1:0});}
onEv('net:chpin',e=>{const T=FS.find(o=>o.id===e.d);if(!T)return;const p=TMP3.set(e.x,e.y+1.1,e.z).clone();if(typeof bloodBurst==='function')bloodBurst(p,40,7);shake(.3,p);});
onEv('tick',dt=>{if(!CHI_ARMS.length&&!CHI_PINS.length)return;
  for(let i=CHI_ARMS.length-1;i>=0;i--){const A=CHI_ARMS[i];A.life+=dt;if(!inMatch()||(A.owner&&A.owner.dead&&!A.fly)||A.life>40){chiArmGone(i);continue;}
    if(A.pinT>0){A.pinT-=dt;if(A.T&&!A.T.dead){const c=A.T.chest(new V3());A.m.position.copy(c).addScaledVector(A.v.clone().normalize(),-.1);}if(A.pinT<=0){A.T=null;if(A.phantom){chiArmGone(i);continue;}A.m.position.y=Math.max(A.m.position.y,floorAt(A.m.position.x,A.m.position.z,A.m.position.y+1)+.25);}continue;}
    if(!A.fly)continue;
    const step=A.v.clone().multiplyScalar(dt),p=A.m.position;
    if(A.T&&!A.T.dead){const want=A.T.chest(new V3()).sub(p).normalize().multiplyScalar(A.v.length());A.v.lerp(want,Math.min(1,dt*3));chiAim(A.m,A.v);}
    p.add(step);A.dist+=step.length();if(Math.random()<.5&&nearCam(p,50))burst(SMK,p,1,{colors:[0x7a0010,0xa01a20],speed:.4,life:.4,size:.1,size1:.04,grav:10});
    let hitT=null;for(const o of FS){if(o===A.owner||o.dead||o.downed||ally(o,A.owner))continue;const c=o.chest(new V3());if(c.distanceTo(p)<1.15){hitT=o;break;}}
    if(hitT){A.fly=false;const d=A.v.clone().setY(0).normalize();if(NET.role!=='client'){hitO(A.owner,hitT,{dmg:A.phantom?12:16,kb:0,up:0,stun:1.8,heavy:true,pt:hitT.chest(new V3())});chiPin(A.owner,hitT,d,A);}else{A.pinT=1.8;A.T=hitT;}continue;}
    const g=floorAt(p.x,p.z,p.y+1);if(p.y<g+.1||insideBld(p.x,p.z,0,p.y)||A.dist>34){A.fly=false;if(p.y<g+.1)p.y=g+.25;if(A.phantom){chiArmGone(i);continue;}
      if(nearCam(p,50)){burst(SMK,p,10,{colors:[0x6a0010,0x5a4a3a],speed:3,up:1,life:.5,size:.15,size1:.05,grav:9});}xSnd(p,()=>AU.hit&&AU.hit(false));}}
  for(let i=CHI_PINS.length-1;i>=0;i--){const P=CHI_PINS[i];P.t+=dt;const T=P.T;if(P.t>=P.dur||!T||T.dead||!inMatch()){CHI_PINS.splice(i,1);continue;}
    T.pos.copy(P.pos);T.vel.set(0,0,0);if(NET.role!=='client'&&T.state!=='hit'&&T.state!=='dash'){T.set('hit');}if(T.state==='hit')T.stunT=Math.max(T.stunT||0,P.dur-P.t+T.stateT);
    if(Math.random()<.3&&nearCam(P.pos,40))burst(SMK,T.chest(new V3()),1,{colors:[0x7a0010,0xb01a2a],speed:1.5,up:.5,life:.5,size:.1,size1:.05,grav:12});}});

/* 1 — ARM JAVELIN */
SPECIALS.chimjav=function(f){once(f,.16,()=>{const T=tgtOf(f,30);if(T)faceTo(f,T);const d=T?T.chest(new V3()).sub(hHandC(f)):f.fwd();
    if(!chiThrow(f,d,T,false)){// no arms: he spits a shard of bone instead (no pin)
      const c=f.chest(new V3()),to=T?T.chest(new V3()):c.clone().addScaledVector(f.fwd(),14);trailSeg(c,to,0xe8dcc0,.08,.2);
      if(T&&NET.role!=='client'&&T.pos.distanceTo(f.pos)<18)hitO(f,T,{dmg:6,kb:3,up:0,stun:.3});if(f===ME)announceSmall('NO ARMS TO THROW — GRAB SOME');}});
  vpose(f,.16,'specw','spech');endAt(f,.5);return 10;};
SPECVAR.chimjav={
  chg:['JAVELIN VOLLEY',(f,dt,k)=>{once(f,.2,()=>{const T=tgtOf(f,30);if(T)faceTo(f,T);const fw=f.fwd(),L=foes(f,30).slice(0,3);const n=Math.min(3,Math.max(1,chiS(f).a));
      for(let i=0;i<n;i++){const tg=L[i]||T;const d=tg?tg.chest(new V3()).sub(hHandC(f)):fw.clone().applyAxisAngle(UP,(i-1)*.25);chiThrow(f,d,tg,false);}});
    vpose(f,.2,'charge','spech');endAt(f,.7);return 10;}],
  // 2 — SPLIT (counter)
  alt:['SPLIT',(f,dt)=>{const V=f.vf,t=f.stateT;
    if(!V.sp){V.sp=1;f._chSplit=true;f._chSplitT=game.time+.95;chiSplitFX(f,false);xSnd(f.pos,()=>{AU.whoosh&&AU.whoosh(true);});}
    f.vel.set(0,f.vel.y,0);f.rig.root.scale.setScalar(.001);
    if(t>.95){f._chSplit=false;f._chSplitT=0;chiSplitFX(f,true);f.set(f.onGround?'idle':'air');}return 10;}]};
function chiSplitFX(f,back){const c=f.chest(new V3());if(!nearCam(c,70))return;if(typeof bloodBurst==='function')bloodBurst(c,back?30:70,back?4:9);
  if(!back){for(let i=0;i<10;i++){const m=i<4?chiArmMesh(f):new THREE.Mesh(pick(CHI_G),i%2?CHI_MEAT:CHI_MEAT2);if(i>=4)scene.add(m);m.position.copy(c);const a=i/10*6.283;
      CHI_SPLITS.push({m,f,v:new V3(Math.cos(a)*rand(3,6),rand(2,5),Math.sin(a)*rand(3,6)),t:0,w:new V3(rand(-8,8),rand(-8,8),rand(-8,8))});}}
  shake(.2,c);}
onEv('tick',dt=>{for(let i=CHI_SPLITS.length-1;i>=0;i--){const P=CHI_SPLITS[i];P.t+=dt;const f=P.f;
  if(P.t>1.1||!inMatch()||!f._chSplit&&P.t>.15){// fly back into him
    if(!P.back){P.back=1;P.t0=P.t;P.from=P.m.position.clone();}const k=Math.min(1,(P.t-P.t0)/.14);P.m.position.lerpVectors(P.from,f.chest(new V3()),k);if(k>=1){scene.remove(P.m);CHI_SPLITS.splice(i,1);}continue;}
  P.v.y-=9*dt;P.v.multiplyScalar(1-dt*2.5);P.m.position.addScaledVector(P.v,dt);P.m.rotation.x+=P.w.x*dt;P.m.rotation.y+=P.w.y*dt;}});
// the counter itself: a hit on him while he's apart lands on nothing — he reforms around the attacker and buries them
const _chiAH=applyHit;applyHit=function(att,def,o){
  if(def&&isChi(def)&&def._chSplit&&att&&att!==def&&!att.dead&&!ally(att,def)){def._chSplit=false;def._chSplitT=0;chiCounter(def,att);return;}
  if(att&&isChi(att)&&o){o=Object.assign({},o);const S=chiS(att);o.dmg=(o.dmg||0)*(1+.04*S.a)*(S.amal?1.4:1);}
  if(def&&isChi(def)&&o){o=Object.assign({},o);const S=chiS(def);o.dmg=(o.dmg||0)*(1-.025*S.h)*(S.amal?.7:1);}
  return _chiAH.call(this,att,def,o);};
function chiCounter(f,A){const p=A.pos.clone();const back=A.pos.clone().sub(f.pos).setY(0);if(back.lengthSq()<.01)back.set(0,0,1);back.normalize();
  f.pos.copy(p).addScaledVector(back,-1.6);f.pos.y=floorAt(f.pos.x,f.pos.z,p.y+1);faceTo(f,A);chiSplitFX(f,true);f.set('idle');f.invuln=Math.max(f.invuln,.5);
  _chiAH(f,A,{dmg:12,kb:0,up:0,stun:2,heavy:true,pt:A.chest(new V3())});chiTrap(f,A,2);netEvent({k:'chtrap',a:f.id,d:A.id});}
onEv('net:chtrap',e=>{const f=FS.find(o=>o.id===e.a),A=FS.find(o=>o.id===e.d);if(f&&A)chiTrap(f,A,2);});
function chiTrap(f,A,dur){const p=A.pos.clone(),ms=[];
  for(let i=0;i<14;i++){const m=i<6?chiArmMesh(f):new THREE.Mesh(pick(CHI_G),i%2?CHI_MEAT:CHI_MEAT2);if(i>=6)scene.add(m);const a=i/14*6.283+rand(-.2,.2),r=rand(.25,.75);
    m.position.set(p.x+Math.cos(a)*r,p.y+rand(.1,1.3),p.z+Math.sin(a)*r);m.rotation.set(rand(-3,3),rand(-3,3),rand(-3,3));if(i>=6)m.scale.setScalar(rand(1.2,2.4));ms.push(m);}
  CHI_TRAPS.push({f,T:A,pos:p,t:0,dur,ms});if(typeof bloodBurst==='function')bloodBurst(TMP2.set(p.x,p.y+1,p.z).clone(),50,6);shake(.45,p);xSnd(p,()=>{AU.boom&&AU.boom(false);AU.hit&&AU.hit(true);});}
onEv('tick',dt=>{for(let i=CHI_TRAPS.length-1;i>=0;i--){const P=CHI_TRAPS[i];P.t+=dt;const T=P.T;
  if(P.t>=P.dur||!inMatch()){P.ms.forEach(m=>scene.remove(m));CHI_TRAPS.splice(i,1);continue;}
  if(T&&!T.dead){T.pos.copy(P.pos);T.vel.set(0,0,0);if(NET.role!=='client'&&T.state!=='hit')T.set('hit');if(T.state==='hit')T.stunT=Math.max(T.stunT||0,P.dur-P.t+T.stateT);}
  P.ms.forEach((m,k)=>{m.rotation.x+=Math.sin(P.t*9+k)*dt*1.5;if(P.t>P.dur-.3)m.position.y-=dt*3;});}});

/* ---------- extra moves ---------- */
// 3 — BILE: an acidic, sticky stream
XCUSTOM.bile=function(f,dt){const V=f.vf,t=f.stateT;if(!V.b){V.b=1;V.hit={};const T=tgtOf(f,14);if(T)faceTo(f,T);xSnd(f.pos,()=>{AU.whoosh&&AU.whoosh(false);});}
  f.poseKey=t<.15?'specw':'roar';f.vel.x*=.8;f.vel.z*=.8;
  if(t>.15&&t<1){const R=f.rig,mo=R.head&&R.head.visible?R.head.getWorldPosition(new V3()):f.chest(new V3()).add(TMP2.set(0,.3,0)),fw=f.fwd();
    if(nearCam(mo,70))for(let q=0;q<7;q++){const d=rand(.3,9),sp=d*.12;burst(SMK,mo.clone().addScaledVector(fw,d).add(TMP2.set(rand(-sp,sp),-d*d*.025+rand(-sp,sp),rand(-sp,sp))),1,{colors:[CHI_B,0x8ab02a,0xd8f05a],speed:.8,up:0,life:.35,size:.18+d*.05,size1:.3+d*.06,grav:6});}
    if(Math.random()<.5&&nearCam(mo,70))for(let q=0;q<3;q++)burst(ADD,mo.clone().addScaledVector(fw,rand(1,8)).add(TMP2.set(rand(-.6,.6),rand(-1,.3),rand(-.6,.6))),1,{colors:[CHI_B],speed:1,life:.35,size:.25,size1:0,bright:1.4});
    if(!V.pt||t-V.pt>.15){V.pt=t;const L=foes(f,9.5,null,.82);if(NET.role!=='client')for(const o of L){hitO(f,o,{dmg:1.2,kb:.5,up:0,stun:.25,pt:o.chest(new V3())});o.slowT=Math.max(o.slowT||0,3);}
      if(Math.random()<.6){const d=rand(2.5,8.5),q=f.pos.clone().addScaledVector(fw,d).add(TMP2.set(rand(-1,1),0,rand(-1,1)));chiPuddle(f,q,rand(1.1,1.7));}}}
  endAt(f,1.15);return 10;};
function chiPuddle(f,p,r){p.y=floorAt(p.x,p.z,p.y+2)+.04;const m=new THREE.Mesh(CHI_DISC,CHI_BILE.clone());m.scale.setScalar(r);m.position.copy(p);scene.add(m);CHI_PUD.push({f,p,r,m,t:0,dur:6,tick:0});if(CHI_PUD.length>30){const P=CHI_PUD.shift();scene.remove(P.m);}}
onEv('tick',dt=>{for(let i=CHI_PUD.length-1;i>=0;i--){const P=CHI_PUD[i];P.t+=dt;if(P.t>P.dur||!inMatch()){scene.remove(P.m);CHI_PUD.splice(i,1);continue;}
  P.m.material.opacity=.7*Math.min(1,(P.dur-P.t)/1);if(Math.random()<.12&&nearCam(P.p,50))burst(ADD,TMP2.set(P.p.x+rand(-P.r,P.r)*.6,P.p.y+.05,P.p.z+rand(-P.r,P.r)*.6),1,{colors:[CHI_B,0xffffff],speed:.4,up:1,life:.5,size:.12,size1:0,bright:1.2});
  P.tick-=dt;if(P.tick<=0&&NET.role!=='client'){P.tick=.5;for(const o of FS){if(o===P.f||ally(o,P.f)||o.dead||o.downed)continue;if(Math.hypot(o.pos.x-P.p.x,o.pos.z-P.p.z)<P.r&&Math.abs(o.pos.y-P.p.y)<1.2){if(o._pudT!=null&&game.time-o._pudT<.45)continue;o._pudT=game.time;o.slowT=Math.max(o.slowT||0,1.2);_chiAH(P.f,o,{dmg:1.6,kb:0,up:0,stun:0,pt:o.chest(new V3())});}}}}});
// 4 — ABSORPTION: everything fleshy flies to him
const CHI_PULL=[];
XCUSTOM.absorb=function(f,dt){const V=f.vf,t=f.stateT,c=f.chest(new V3());f.poseKey=t<.2?'burstIn':'armsUp';f.vel.x*=.85;f.vel.z*=.85;
  if(!V.a){V.a=1;V.hit={};V.got=0;xSnd(f.pos,()=>{AU.whoosh&&AU.whoosh(true);});
    if(typeof GORE!=='undefined'){for(let i=GORE.limbs.length-1;i>=0;i--){const L=GORE.limbs[i];if(L.m.position.distanceTo(f.pos)>26)continue;GORE.limbs.splice(i,1);CHI_PULL.push({m:L.m,f,kind:limbKind(L.key||'lS'),from:L.m.position.clone(),t:0,d:rand(.35,.7)});}
      for(let i=GORE.chunks.length-1;i>=0;i--){const C=GORE.chunks[i];if(C.m.position.distanceTo(f.pos)>26)continue;GORE.chunks.splice(i,1);CHI_PULL.push({m:C.m,f,kind:'chunk',from:C.m.position.clone(),t:0,d:rand(.3,.7)});}}
    for(let i=CHI_ARMS.length-1;i>=0;i--){const A=CHI_ARMS[i];if(A.owner!==f||A.fly)continue;CHI_ARMS.splice(i,1);if(A.T&&A.pinT>0){const P=CHI_PINS.find(q=>q.A===A);if(P)P.dur=0;}CHI_PULL.push({m:A.m,f,kind:'arm',from:A.m.position.clone(),t:0,d:rand(.3,.55)});}}
  if(t<1.2){if(nearCam(c,60)){for(let q=0;q<3;q++){const a=Math.random()*6.283,r=rand(4,12),p=c.clone().add(TMP2.set(Math.cos(a)*r,rand(-1,2),Math.sin(a)*r));trailSeg(p,p.clone().lerp(c,.45),0x7a0010,.06,.18);}
      if(Math.random()<.4)ring(c,CHI_R,3-t*2,.15,false,1.4);}
    // drag enemies in, tearing at them
    if(NET.role!=='client')for(const o of foes(f,12)){const d=f.pos.clone().sub(o.pos).setY(0),L=d.length();if(L>1.4){o.vel.x+=d.x/L*30*dt;o.vel.z+=d.z/L*30*dt;}
      if(!V.hit[o.id]||t-V.hit[o.id]>.3){V.hit[o.id]=t;if(L<3.5)hitO(f,o,{dmg:3,kb:0,up:0,stun:.3});}}}
  else if(!V.fin){V.fin=1;// whoever ended up close has flesh ripped off
    for(const o of foes(f,3)){if(NET.role!=='client'){hitO(f,o,{dmg:10,kb:6,up:2,stun:.5,heavy:true});if(V.got<2){V.got++;chiAdd(f,Math.random()<.5?'arm':'leg');}}
      if(typeof bloodBurst==='function')bloodBurst(o.chest(new V3()),40,6);bolt(o.chest(new V3()),c,CHI_R,.06,.25);}
    shake(.3,c);xSnd(f.pos,()=>AU.boom&&AU.boom(false));}
  endAt(f,1.45);return 10;};
onEv('tick',dt=>{for(let i=CHI_PULL.length-1;i>=0;i--){const P=CHI_PULL[i];P.t+=dt;const f=P.f;if(!inMatch()||f.dead){scene.remove(P.m);CHI_PULL.splice(i,1);continue;}
  const k=Math.min(1,P.t/P.d),e=k*k,to=f.chest(new V3());P.m.position.lerpVectors(P.from,to,e);P.m.position.y+=Math.sin(k*Math.PI)*1.2;P.m.rotation.x+=dt*9;
  if(Math.random()<.4&&nearCam(to,50))burst(SMK,P.m.position,1,{colors:[0x7a0010,0xa01a20],speed:.3,life:.4,size:.1,size1:.04,grav:10});
  if(k>=1){scene.remove(P.m);CHI_PULL.splice(i,1);if(P.kind==='chunk'){if(NET.role!=='client'&&!(typeof healLocked==='function'&&healLocked(f)))f.hp=Math.min(100,f.hp+2);}else chiAdd(f,P.kind);}}});

/* ---------- AMALGAMATION (ult): a permanent form, until he dies ---------- */
ULTX.amalgam={r:12,s(f){f.uEnd=2.2;f.invuln=Math.max(f.invuln,2.3);f.poseKey='charge';f.vf.t0=null;},
  u(f,t){const V=f.vf,S=chiS(f),c=f.chest(new V3());if(V.t0==null){V.t0=t;if(typeof duckMusic==='function')duckMusic(2.4);V.erupt=S.amal;f.uEnd=t+(S.amal?1.4:2.3);
      if(!S.amal&&typeof GORE!=='undefined'){// swallow every scrap of gore nearby
        for(let i=GORE.limbs.length-1;i>=0;i--){const L=GORE.limbs[i];if(L.m.position.distanceTo(f.pos)>40)continue;GORE.limbs.splice(i,1);CHI_PULL.push({m:L.m,f,kind:limbKind(L.key||'lS'),from:L.m.position.clone(),t:0,d:rand(.5,1.3)});}
        for(let i=GORE.chunks.length-1;i>=0;i--){const C=GORE.chunks[i];if(C.m.position.distanceTo(f.pos)>40)continue;GORE.chunks.splice(i,1);CHI_PULL.push({m:C.m,f,kind:'chunk',from:C.m.position.clone(),t:0,d:rand(.5,1.3)});}}
      xSnd(f.pos,()=>{AU.whoosh&&AU.whoosh(true);});}
    const r=t-V.t0;f.vel.set(0,f.vel.y,0);
    if(V.erupt){// FLESH ERUPTION
      f.poseKey=r<.6?'burstIn':'burstOut';
      atT(f,'e',V.t0+.6,()=>{if(NET.role!=='client')for(const o of foes(f,11))hitO(f,o,{dmg:26,kb:20,up:12,launch:true,heavy:true,ult:true,stun:1});
        for(let i=0;i<20;i++){const a=i/20*6.283;const q=f.pos.clone().add(TMP2.set(Math.cos(a)*rand(2,9),0,Math.sin(a)*rand(2,9)));spike(q.x,q.z,rand(1.2,2.6));}
        if(typeof bloodBurst==='function'){bloodBurst(c,160,16);}if(typeof gibs==='function')gibs(c,f.fwd(),24);ring(TMP2.set(f.pos.x,f.pos.y+.2,f.pos.z).clone(),CHI_R,11,.6,true,1.6);
        shake(1.1,c);hitStop(.12);flashLight(c,0xff2a2a,14);xSnd(f.pos,()=>{AU.boom&&AU.boom(true);AU.crash&&AU.crash();});});
      return 10;}
    // swelling: flesh pours in from everywhere
    f.poseKey=r<1.4?'roar':'armsUp';const grow=Math.min(1,r/1.5);f.rig.root.scale.setScalar(f.hero.scale*(1+.4*grow));
    if(nearCam(c,70)){for(let q=0;q<4;q++){const a=Math.random()*6.283,rr=rand(3,10),p=c.clone().add(TMP2.set(Math.cos(a)*rr,rand(-1,3),Math.sin(a)*rr));trailSeg(p,p.clone().lerp(c,.6),q%2?0x7a0010:0xa84a4a,.1,.22);}
      if(Math.random()<.3&&typeof bloodBurst==='function')bloodBurst(c.clone().add(TMP2.set(rand(-.6,.6),rand(-.5,.8),rand(-.6,.6))),8,4);}
    atT(f,'g1',V.t0+.5,()=>{shake(.4,c);xSnd(f.pos,()=>AU.boom&&AU.boom(false));});
    atT(f,'g2',V.t0+1.5,()=>{S.amal=true;if(NET.role!=='client'){chiAdd(f,'arm',4);chiAdd(f,'leg',4);chiAdd(f,'head',4);if(!(typeof healLocked==='function'&&healLocked(f)))f.hp=Math.min(100,f.hp+40);}
      netEvent({k:'chl',id:f.id,a:S.a,l:S.l,h:S.h,m:1});
      if(typeof bloodBurst==='function')bloodBurst(c,180,14);if(NET.role!=='client')for(const o of foes(f,7))hitO(f,o,{dmg:22,kb:16,up:8,launch:true,heavy:true,ult:true});
      ring(TMP2.set(f.pos.x,f.pos.y+.2,f.pos.z).clone(),CHI_R,9,.5,true,1.6);flashLight(c,0xff2a2a,14);shake(1,c);hitStop(.12);if(typeof impactFlash==='function')impactFlash(.25,0xa01020);
      xSnd(f.pos,()=>{AU.boom&&AU.boom(true);});});
    return 10;}};
/* ---------- LIMB STORM (alt ult) ---------- */
ALTULT.chimera={name:'LIMB STORM',r:20,s(f){f.uEnd=1.6;f.poseKey='charge';},u(f,t){const S=chiS(f);
  atT(f,'ls',.3,()=>{const L=foes(f,22);const n=Math.max(4,S.a);const real=S.a;for(let i=0;i<n;i++){const T=L.length?L[i%L.length]:null;const a=i/n*6.283;
      const d=T?T.chest(new V3()).sub(hHandC(f)):new V3(Math.cos(a),.05,Math.sin(a));setTimeout(()=>{if(inMatch()&&!f.dead)chiThrow(f,d,T,i>=real);},i*70);}
    shake(.4,f.pos);if(typeof bloodBurst==='function')bloodBurst(f.chest(new V3()),60,8);});
  f.poseKey=t<.3?'charge':'burstOut';return 10;}};
onEv('matchEnd',()=>{CHI_ARMS.forEach(A=>scene.remove(A.m));CHI_ARMS.length=0;CHI_PINS.length=0;CHI_TRAPS.forEach(P=>P.ms.forEach(m=>scene.remove(m)));CHI_TRAPS.length=0;
  CHI_PUD.forEach(P=>scene.remove(P.m));CHI_PUD.length=0;CHI_SPLITS.forEach(P=>scene.remove(P.m));CHI_SPLITS.length=0;CHI_PULL.forEach(P=>scene.remove(P.m));CHI_PULL.length=0;});
// HUD: limb counts next to his meter
onEv('tick',()=>{const el=document.getElementById('chiHud');if(!ME||!isChi(ME)||!inMatch()){if(el)el.style.display='none';return;}
  let e=el;if(!e){e=document.createElement('div');e.id='chiHud';e.style.cssText='position:fixed;left:50%;top:64px;transform:translateX(-50%);font:700 13px/1 system-ui,sans-serif;color:#e8d0c0;background:rgba(40,8,10,.65);padding:6px 10px;border-radius:8px;letter-spacing:.06em;pointer-events:none;z-index:20';document.body.appendChild(e);}
  const S=chiS(ME),s=`ARMS ${S.a}/10 · LEGS ${S.l}/10 · HEADS ${S.h}/10${S.amal?' · AMALGAMATION':''}`;if(e.textContent!==s)e.textContent=s;e.style.display='block';});
/* ---------- moves, combo and opening ---------- */
(function(){const h=HEROES.find(x=>x.id==='chimera');if(!h)return;
  const ab=o=>sanitizeAbil(Object.assign({colors:[CHI_R,CHI_B]},o));
  h._xm=[Object.assign(ab({name:'BILE',form:'cone',style:'poison',shape:'orb',fx:[]}),{custom:'bile'}),Object.assign(ab({name:'ABSORPTION',form:'grab',style:'blood',shape:'ring',fx:[]}),{custom:'absorb'})];
  // brawling with whatever he's got: shoulder ram, body slams, and a crushing slam
  UATK.chimera={c:'el bk el sm',h:'sm',fx:'blood'};
  const toks=UATK.chimera.c.split(' '),raw=toks.reduce((s,t)=>s+TPL[t].dmg,0),k=15/raw*1.08;
  toks.forEach((t,i)=>{const M=Object.assign({},TPL[t]);M.dmg=+(M.dmg*k).toFixed(1);const last=i===toks.length-1;
    if(last){M.launch=true;M.heavy=true;M.kb=Math.max(M.kb,9);M.up=Math.max(M.up,5);}else{delete M.launch;delete M.heavy;delete M.shock;M.kb=Math.min(M.kb,4);M.up=Math.min(M.up,2);M.next='u_chimera_'+(i+1);}
    MOVES['u_chimera_'+i]=M;});
  const H=Object.assign({},TPL.sm);H.dmg=13;H.launch=true;H.heavy=true;H.kb=11;H.up=7;H.vfx=2;MOVES.u_chimera_H=H;
  if(typeof UO!=='undefined')UO.chimera=(f,t,c)=>{if(uo1(f,'a'))aura(f,CHI_R,CHI_B,1.1);uoSwirl(f,c,CHI_R,CHI_P,5,SMK);};})();
/* ---------- the look: a stitched-together corpse, no suit or armor ----------
   Every suit / armor / trim surface becomes dead skin (grey-green, bruised, rotting), glowing trims are gone,
   and he gets stitches, open wounds, exposed ribs and a rag around the hips. Applied after the rig (and the costume
   and face layers) are built, so nothing armored survives. */
const CORPSE_SKIN=[0x5a6044,0x6a6a4a,0x50583e],CORPSE_BRUISE=0x4a3a44,CORPSE_ROT=0x2a1e16;
function corpsify(R,h){const sk=new THREE.MeshStandardMaterial({color:CORPSE_SKIN[0],roughness:.85,metalness:0}),sk2=new THREE.MeshStandardMaterial({color:CORPSE_BRUISE,roughness:.9,metalness:0}),
  rot=new THREE.MeshStandardMaterial({color:CORPSE_ROT,roughness:.95,metalness:0}),wound=new THREE.MeshStandardMaterial({color:0x5a0a10,roughness:.35,metalness:0}),
  stitch=new THREE.MeshStandardMaterial({color:0x1a120c,roughness:1,metalness:0}),rag=new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:1,metalness:0,side:THREE.DoubleSide}),
  eye=new THREE.MeshBasicMaterial({color:0xd8f03a});
  // rot veins instead of a glowing suit pattern
  if(h.mainCol!=null)sk.color.lerp(new THREE.Color(h.mainCol),.18);
  const veins=R.mats&&R.mats[1]&&R.mats[1].emissiveMap;if(veins){sk.emissiveMap=veins;sk.emissive=new THREE.Color(0x3a0610);sk.emissiveIntensity=.9;}
  const under=(o,p)=>{for(let q=o;q;q=q.parent)if(q===p)return true;return false;};
  const lum=c=>c?(c.r*.3+c.g*.59+c.b*.11):.5;
  R.root.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m=o.material;
    const glowy=(m.emissiveIntensity>.6&&m.emissive&&lum(m.emissive)>.05)||m.blending===THREE.AdditiveBlending||(m.isMeshBasicMaterial&&m.transparent);
    const inHead=R.head&&under(o,R.head);
    if(inHead){if(glowy){o.visible=false;return;}if(m.isMeshBasicMaterial){if(lum(m.color)<.9)o.material=eye;return;}
      // face skin → dead skin; small dark features (brows, mouth) stay
      if(typeof SKIN!=='undefined'&&SKIN.some(c=>m.color.getHex()===c))o.material=sk;return;}
    if(glowy){o.visible=false;return;}
    if(m.isMeshBasicMaterial)return;
    if(o.geometry&&o.geometry.type==='TorusGeometry'&&(o.parent===R.spine||o.parent===R.hips||o.parent===R.root)){o.visible=false;return;}
    o.material=lum(m.color)<.08?rot:(o.position.y<-.2?sk2:sk);});
  // sewn together from different bodies: an arm and a leg from someone else
  const skB=sk.clone();skB.color.setHex(CORPSE_SKIN[1]);const skC=sk.clone();skC.color.setHex(0x625a52);
  [[R.lS,skB],[R.rH,skC]].forEach(([p,mt])=>{if(p)p.traverse(o=>{if(o.isMesh&&o.material===sk)o.material=mt;});});
  if(R.cloth)R.cloth.visible=false;if(R.frame)R.frame.visible=false;
  const add=(par,g,mat,x,y,z,rx,ry,rz,s)=>{if(!par)return;const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,rz||0);if(s)m.scale.set(s[0],s[1],s[2]);par.add(m);return m;};
  const B=h.bulk||1,fz=.15*B,sp=R.spine,hp=R.hips,st=new THREE.BoxGeometry(.012,.05,.012);
  // a long stitched seam down the chest and one across the belly
  add(sp,new THREE.BoxGeometry(.012,.5,.008),stitch,.02,.32,fz+.012);for(let i=0;i<9;i++)add(sp,st,stitch,.02,.1+i*.055,fz+.016,0,0,Math.PI/2);
  add(sp,new THREE.BoxGeometry(.3,.012,.008),stitch,0,.12,fz+.01);for(let i=0;i<6;i++)add(sp,st,stitch,-.13+i*.052,.12,fz+.014);
  // stitched rings where arms and legs were sewn on
  [R.lS,R.rS].forEach(s=>{if(s)add(s,new THREE.TorusGeometry(.1,.012,5,16),stitch,0,-.02,0,Math.PI/2);});
  [R.lH,R.rH].forEach(s=>{if(s)add(s,new THREE.TorusGeometry(.11,.012,5,16),stitch,0,-.03,0,Math.PI/2);});
  if(R.neck)add(R.neck,new THREE.TorusGeometry(.075,.01,5,16),stitch,0,0,0,Math.PI/2);
  // open wounds and exposed ribs on his left side
  add(sp,new THREE.SphereGeometry(.09,10,8),wound,-.12*B,.36,fz*.8,0,0,0,[1,1.2,.35]);
  for(let i=0;i<4;i++)add(sp,new THREE.TorusGeometry(.085,.012,5,10,Math.PI*.9),CHI_BONE,-.11*B,.28+i*.045,fz*.75,0,.5,Math.PI*1.05);
  add(sp,new THREE.SphereGeometry(.06,8,6),wound,.13*B,.18,fz*.85,0,0,0,[1.3,.8,.3]);
  add(sp,new THREE.SphereGeometry(.07,8,6),rot,.05,.45,-fz*.95,0,0,0,[1.4,1,.3]);
  // a torn rag around the hips
  const ragG=new THREE.CylinderGeometry(.215*B,.25*B,.2,10,1,true);const rg=add(hp,ragG,rag,0,-.04,0);if(rg)rg.scale.set(1,1,.9);
  for(let i=0;i<5;i++)add(hp,new THREE.PlaneGeometry(.08,.16),rag,-.16+i*.08,-.2,.17*B,.1,0,(i%2?.15:-.12));}
const _chiBR=buildRig;buildRig=function(h){if(h&&h.id==='chimera'&&!h.human){const a=[].slice.call(arguments);a[0]=Object.assign({},h,{human:true});h=a[0];const R=_chiBR.apply(this,a);try{corpsify(R,h);}catch(e){console.warn('corpsify',e);}return R;}const R=_chiBR.apply(this,arguments);if(h&&h.id==='chimera'){try{corpsify(R,h);}catch(e){console.warn('corpsify',e);}}return R;};

/* ---------- arm javelin needs an arm, bile needs a head (in his base mode) ---------- */
function chiBase(f){return isChi(f)&&!(typeof inMode==='function'&&inMode(f));}
function chiNeed(f,msg){if(f===ME&&typeof announceSmall==='function'&&(!f._needT||game.time-f._needT>1)){f._needT=game.time;announceSmall(msg);}if(f===ME&&AU.deny)AU.deny();}
const _chiSS=Fighter.prototype.startSpecial;Fighter.prototype.startSpecial=function(){if(chiBase(this)){const alt=(typeof inDir==='function'&&inDir(this)==='b')||this.bufSB>0;
    if(!alt&&chiS(this).a<1){this.bufSB=0;chiNeed(this,'NEED AN ARM — PICK ONE UP');return false;}}return _chiSS.apply(this,arguments);};
const _chiTX=Fighter.prototype.tryExtra;Fighter.prototype.tryExtra=function(){if(chiBase(this)&&this.bufXi===0&&chiS(this).h<1){this.bufX=0;chiNeed(this,'NEED A HEAD — PICK ONE UP');return false;}return _chiTX.apply(this,arguments);};
// the ability bar shows those two as locked until he has the part
const _chiSlIv=setInterval(()=>{if(typeof updateSlots!=='function')return;clearInterval(_chiSlIv);const _us=updateSlots;updateSlots=function(F){const r=_us.apply(this,arguments);const el=$('slots');if(!el)return r;
  for(const d of el.children){const k=d.dataset.k;let lock='';if(F&&chiBase(F)){if(k==='sp'&&chiS(F).a<1)lock='NEED AN ARM';if(k==='x1'&&chiS(F).h<1)lock='NEED A HEAD';}
    if((d.dataset.lock||'')!==lock){d.dataset.lock=lock;d.style.opacity=lock?'.35':'';d.style.filter=lock?'grayscale(1)':'';const sp=d.querySelector('span');if(sp){if(!sp.dataset.n)sp.dataset.n=sp.textContent;sp.textContent=lock?sp.dataset.n+' · '+lock:sp.dataset.n;}}
    if(lock)d.classList.remove('ready');}return r;};},5);

/* ---------- AMALGAMATION body: a heaving pile of meat with limbs, mouths and eyes, sliding like a snail ---------- */
const BLOB_LUMP=new THREE.SphereGeometry(.13,14,10),LUMP_A=new THREE.MeshStandardMaterial({color:0x4e0a12,roughness:.3,metalness:0}),LUMP_B=new THREE.MeshStandardMaterial({color:0x6a3424,roughness:.5,metalness:0});
const BLOB_MATS={flesh:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:0}),
  eyeW:new THREE.MeshStandardMaterial({color:0xe8e0c8,roughness:.25,metalness:0}),pupil:new THREE.MeshBasicMaterial({color:0x0a0505}),iris:new THREE.MeshBasicMaterial({color:0xc8d030}),
  maw:new THREE.MeshStandardMaterial({color:0x1a0204,roughness:.6,metalness:0}),lip:new THREE.MeshStandardMaterial({color:0x8a2a34,roughness:.35,metalness:0}),
  tooth:new THREE.MeshStandardMaterial({color:0xd8cca8,roughness:.5,metalness:0}),tongue:new THREE.MeshStandardMaterial({color:0xb04a5a,roughness:.3,metalness:0})};
function blobRad(x,y,z,seed){return .85*(1+.16*Math.sin(3.1*x+seed)*Math.sin(2.7*y+seed*.7)*Math.sin(3.7*z+seed*1.3)+.08*Math.sin(7*x+5*z+seed));}
function blobGeo(seed){const g=new THREE.SphereGeometry(1,40,28),P=g.attributes.position,C=[],v=new V3(),cA=new THREE.Color(0x4a0a10),cB=new THREE.Color(0x240306),cC=new THREE.Color(0x7a3634),cD=new THREE.Color(0x4e5238),c=new THREE.Color();
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const r=blobRad(v.x,v.y,v.z,seed);let y=v.y*r*.8+.55;if(y<.05)y=.05+(y-.05)*.15;P.setXYZ(i,v.x*r*1.15,y,v.z*r*1.25);
    const n=Math.sin(v.x*9+seed)*Math.sin(v.y*8)*Math.sin(v.z*7+seed*2);c.copy(cA).lerp(n>.3?cC:cB,Math.abs(n));if(Math.abs(Math.sin(v.y*22+v.x*6+seed))<.12)c.lerp(new THREE.Color(0xd8c8a8),.55);if(Math.sin(v.x*4+v.z*3+seed)>.8)c.lerp(cD,.7);C.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;}
function blobSurf(dir,seed){const d=dir.clone().normalize(),r=blobRad(d.x,d.y,d.z,seed);let y=d.y*r*.8+.55;if(y<.05)y=.05;return new V3(d.x*r*1.15,y,d.z*r*1.25);}
function chiBlobKill(f){const S=f.chi;if(!S||!S.blob)return;if(S.blob.g.parent)S.blob.g.parent.remove(S.blob.g);S.blob.g.traverse(o=>{if(o.geometry&&o.userData.own)o.geometry.dispose();});S.blob=null;}
function chiBlobBuild(f){const S=chiS(f),R=f.rig;chiBlobKill(f);const seed=(f.id%7)+1.3,g=new THREE.Group(),B={g,seed,eyes:[],mouths:[],limbs:[],sig:S.a+'|'+S.l+'|'+S.h,ph:Math.random()*6};
  const body=new THREE.Mesh(blobGeo(seed),BLOB_MATS.flesh);body.userData.own=1;g.add(body);B.body=body;
  // lumps of meat piled on top
  for(let i=0;i<14;i++){const a=i*2.4+seed,d=new V3(Math.cos(a),rand(.1,.9),Math.sin(a));const p=blobSurf(d,seed);const m=new THREE.Mesh(BLOB_LUMP,i%3?LUMP_A:LUMP_B);m.position.copy(p);m.scale.set(rand(1.3,2.6),rand(1,1.8),rand(1.3,2.4));m.rotation.set(rand(0,6),rand(0,6),rand(0,6));g.add(m);}
  const place=(o,d,sink)=>{const p=blobSurf(d,seed);o.position.copy(p).addScaledVector(d.clone().normalize(),-(sink||0));o.lookAt(p.clone().add(d.clone().normalize()));return o;};
  // bones jutting out of the mass
  for(let i=0;i<7;i++){const a=i*0.9+seed*1.7,d=new V3(Math.cos(a),rand(.2,.8),Math.sin(a));const bo=new THREE.Group();place(bo,d,.05);
    const rib=new THREE.Mesh(new THREE.TorusGeometry(.22,.025,6,12,Math.PI*.8),CHI_BONE);rib.userData.own=1;rib.rotation.set(0,Math.PI/2,rand(0,3));bo.add(rib);
    if(i%2){const sp=new THREE.Mesh(new THREE.ConeGeometry(.04,.4,6),CHI_BONE);sp.userData.own=1;sp.rotation.x=Math.PI/2;sp.position.z=.15;bo.add(sp);}g.add(bo);}
  // eyes, everywhere
  const ne=Math.min(16,5+S.h);for(let i=0;i<ne;i++){const a=i*2.39996+seed,y=rand(-.05,.85),d=new V3(Math.cos(a)*(1-y*.5),y,Math.sin(a)*(1-y*.5));if(d.z<-.2&&i%2)d.z*=-1;
    const e=new THREE.Group(),sz=rand(.06,.15);const w=new THREE.Mesh(new THREE.SphereGeometry(sz,12,10),BLOB_MATS.eyeW);w.userData.own=1;e.add(w);
    const ir=new THREE.Mesh(new THREE.CircleGeometry(sz*.55,14),BLOB_MATS.iris);ir.userData.own=1;ir.position.z=sz*.98;e.add(ir);const pu=new THREE.Mesh(new THREE.CircleGeometry(sz*.28,10),BLOB_MATS.pupil);pu.userData.own=1;pu.position.z=sz*1.0;e.add(pu);
    place(e,d,sz*.35);g.add(e);B.eyes.push({e,w,ir,pu,sz,ph:Math.random()*9,blink:0});}
  // mouths with teeth and tongues
  const nm=Math.min(7,3+Math.floor(S.h/2));for(let i=0;i<nm;i++){const a=i*2.1+seed+.6,y=rand(.05,.6),d=new V3(Math.cos(a),y,Math.sin(a));if(i===0)d.set(0,.25,1);
    const mo=new THREE.Group(),sz=i===0?.26:rand(.12,.2);const inner=new THREE.Mesh(new THREE.SphereGeometry(sz,14,10),BLOB_MATS.maw);inner.scale.set(1.3,.55,.4);inner.userData.own=1;mo.add(inner);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(sz*1.05,sz*.18,6,18),BLOB_MATS.lip);lip.scale.set(1.25,.55,1);lip.userData.own=1;mo.add(lip);
    const top=new THREE.Group(),bot=new THREE.Group();mo.add(top,bot);const tg=new THREE.ConeGeometry(sz*.12,sz*.38,5);
    for(let k=0;k<7;k++){const x=(k/6-.5)*sz*2.1;const t1=new THREE.Mesh(tg,BLOB_MATS.tooth);t1.position.set(x,sz*.2,sz*.1);t1.rotation.z=Math.PI;top.add(t1);const t2=new THREE.Mesh(tg,BLOB_MATS.tooth);t2.position.set(x*.9,-sz*.2,sz*.1);bot.add(t2);}
    const tn=new THREE.Mesh(new THREE.SphereGeometry(sz*.45,10,8),BLOB_MATS.tongue);tn.scale.set(1.2,.4,1.4);tn.position.set(0,-sz*.15,sz*.15);tn.userData.own=1;mo.add(tn);
    place(mo,d,sz*.25);g.add(mo);B.mouths.push({mo,inner,top,bot,sz,ph:Math.random()*9,sp:rand(2,5)});}
  // his collected heads, half sunk into the mass
  for(let i=0;i<Math.min(S.h,10);i++){if(!R.head)break;const c=R.head.clone(true);c.visible=true;const a=i*1.7+seed,d=new V3(Math.cos(a)*.6,.75+rand(0,.3),Math.sin(a)*.6);place(c,d,.12);c.rotateX(-Math.PI/2+rand(-.4,.4));c.scale.setScalar(rand(.75,1));g.add(c);}
  // arms reaching out, legs twitching underneath
  const limb=(src,n,low)=>{if(!src)return;for(let i=0;i<Math.min(n,10);i++){const a=i*(6.283/Math.max(1,Math.min(n,10)))+seed*(low?2:1),d=new V3(Math.cos(a),low?rand(-.1,.15):rand(.15,.65),Math.sin(a));
    const piv=new THREE.Group();place(piv,d,.15);const c=src.clone(true);c.visible=true;c.position.set(0,0,0);c.rotation.set(-Math.PI/2,0,0);c.scale.setScalar(low?.9:1);piv.add(c);g.add(piv);
    B.limbs.push({piv,base:piv.quaternion.clone(),ph:Math.random()*9,low,d});}};
  limb(R.lS,S.a,false);limb(R.lH,S.l,true);
  R.root.add(g);S.blob=B;}
function chiBlobPose(f,dt){const S=chiS(f),R=f.rig;
  if(!S.amal){if(S.blob){chiBlobKill(f);}return;}
  if(!S.blob||S.blob.sig!==S.a+'|'+S.l+'|'+S.h)chiBlobBuild(f);const B=S.blob;if(R.hips)R.hips.visible=false;
  const t=game.time+B.ph,sp=Math.hypot(f.vel.x,f.vel.z),mv=Math.min(1,sp/6),atk=f.state==='attack'||f.state==='special'||f.state==='ult';
  // the heave and the snail's glide: a wave rolls front to back while it slides
  const br=Math.sin(t*2.2)*.04,wave=Math.sin(t*7)*.09*mv;B.g.scale.set(1+br-wave*.4,1-br*.6+wave*.3,1+br+wave);B.g.position.y=0;B.g.rotation.x=-mv*.06;
  for(const E of B.eyes){E.blink-=dt;if(E.blink<-rand(1.5,5))E.blink=.14;const sh=E.blink>0?.1:1;E.w.scale.y=sh;E.ir.visible=E.pu.visible=E.blink<=0;
    const lx=Math.sin(t*1.3+E.ph)*.4,ly=Math.cos(t*.9+E.ph)*.25;E.ir.position.x=E.pu.position.x=lx*E.sz*.5;E.ir.position.y=E.pu.position.y=ly*E.sz*.5;}
  for(const M of B.mouths){const o=Math.max(0,Math.sin(t*M.sp+M.ph))*(atk?1:.6);M.inner.scale.y=.25+o*.6;M.top.position.y=o*M.sz*.25;M.bot.position.y=-o*M.sz*.25;}
  const q=new THREE.Quaternion(),ax=new V3();
  for(const L of B.limbs){const k=L.low?Math.sin(t*9+L.ph)*(.15+mv*.35):Math.sin(t*2.5+L.ph)*.45+(atk?Math.sin(t*16+L.ph)*.6:0);ax.set(Math.cos(L.ph),Math.sin(L.ph),0).normalize();q.setFromAxisAngle(ax,k);L.piv.quaternion.copy(L.base).multiply(q);}
  // the red trail it leaves behind
  if(f.onGround&&!f.dead){const p=f.pos;if(!f._stainAt)f._stainAt=p.clone();if(Math.hypot(p.x-f._stainAt.x,p.z-f._stainAt.z)>.5){f._stainAt.copy(p);chiStain(p,rand(.85,1.25)*f.hero.scale);}}
  if(Math.random()<.2*mv+.05&&nearCam(f.pos,40))burst(SMK,TMP2.set(f.pos.x+rand(-1,1),f.pos.y+rand(.3,1.4),f.pos.z+rand(-1,1)),1,{colors:[0x6a0010,0x8a1a20],speed:.3,life:.7,size:.12,size1:.06,grav:10});}
const CHI_STAINS=[];const STAIN_MAT=new THREE.MeshStandardMaterial({color:0x4a0008,roughness:.25,metalness:0,transparent:true,opacity:.88,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function chiStain(p,r){if(!nearCam(p,90))return;const m=new THREE.Mesh(CHI_DISC,STAIN_MAT.clone());m.scale.set(r,1,r*rand(1,1.4));m.rotation.y=rand(0,6.28);m.position.set(p.x,floorAt(p.x,p.z,p.y+1)+.03,p.z);scene.add(m);CHI_STAINS.push({m,t:0});
  if(CHI_STAINS.length>180){const o=CHI_STAINS.shift();scene.remove(o.m);o.m.material.dispose();}}
onEv('tick',dt=>{for(let i=CHI_STAINS.length-1;i>=0;i--){const o=CHI_STAINS[i];o.t+=dt;if(o.t>30){scene.remove(o.m);o.m.material.dispose();CHI_STAINS.splice(i,1);continue;}if(o.t>24)o.m.material.opacity=.88*(30-o.t)/6;}});
onEv('matchEnd',()=>{CHI_STAINS.forEach(o=>{scene.remove(o.m);o.m.material.dispose();});CHI_STAINS.length=0;});
// when the amalgamation dies it bursts
onEv('kill',d=>{if(!isChi(d)||!d.chi||!d.chi.amal)return;const c=d.chest(new V3());if(typeof bloodBurst==='function')bloodBurst(c,160,14);if(typeof gibs==='function')gibs(c,new V3(rand(-1,1),0,rand(-1,1)).normalize(),30);
  for(let i=0;i<14;i++)chiStain(new V3(d.pos.x+rand(-3,3),d.pos.y,d.pos.z+rand(-3,3)),rand(.6,1.6));chiBlobKill(d);shake(.6,c);});
