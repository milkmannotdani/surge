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
  const sc=f.hero.scale*(S.amal?1.4:1);if(!f._chSplit&&!f._chBloat&&f.state!=='ult')R.root.scale.setScalar(sc);
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
  if(f.onGround&&!f.dead){const p=f.pos;if(!f._stainAt)f._stainAt=p.clone();if(Math.hypot(p.x-f._stainAt.x,p.z-f._stainAt.z)>.7){const d=new V3(p.x-f._stainAt.x,0,p.z-f._stainAt.z).normalize();f._stainAt.copy(p);chiStain(p,rand(1,1.4)*f.hero.scale,d);}}
  if(Math.random()<.2*mv+.05&&nearCam(f.pos,40))burst(SMK,TMP2.set(f.pos.x+rand(-1,1),f.pos.y+rand(.3,1.4),f.pos.z+rand(-1,1)),1,{colors:[0x6a0010,0x8a1a20],speed:.3,life:.7,size:.12,size1:.06,grav:10});}
const CHI_STAINS=[];const STAIN_MAT=new THREE.MeshStandardMaterial({color:0x4a0008,roughness:.25,metalness:0,transparent:true,opacity:.88,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function chiStain(p,r,dir){if(!nearCam(p,90))return;let m;
  if(typeof splatMat==='function'){m=new THREE.Mesh(SPLAT_GEO,splatMat(dir?'smear':'splat',(Math.random()*4)|0));m.rotation.x=-Math.PI/2;m.rotation.z=dir?Math.atan2(-dir.z,dir.x):rand(0,6.28);m.scale.set(r*(dir?1.4:1),r,1);}
  else{m=new THREE.Mesh(CHI_DISC,STAIN_MAT);m.scale.set(r,1,r);}
  m.position.set(p.x,floorAt(p.x,p.z,p.y+1)+.03+Math.random()*.004,p.z);m.renderOrder=1;scene.add(m);CHI_STAINS.push({m,t:0});
  if(CHI_STAINS.length>180){const o=CHI_STAINS.shift();scene.remove(o.m);}}
onEv('tick',dt=>{for(let i=CHI_STAINS.length-1;i>=0;i--){const o=CHI_STAINS[i];o.t+=dt;if(o.t>30){scene.remove(o.m);CHI_STAINS.splice(i,1);}}});
onEv('matchEnd',()=>{CHI_STAINS.forEach(o=>scene.remove(o.m));CHI_STAINS.length=0;});
// when the amalgamation dies it bursts
onEv('kill',d=>{if(!isChi(d)||!d.chi||!d.chi.amal)return;const c=d.chest(new V3());if(typeof bloodBurst==='function')bloodBurst(c,160,14);if(typeof gibs==='function')gibs(c,new V3(rand(-1,1),0,rand(-1,1)).normalize(),30);
  for(let i=0;i<14;i++)chiStain(new V3(d.pos.x+rand(-3,3),d.pos.y,d.pos.z+rand(-3,3)),rand(.6,1.6));chiBlobKill(d);shake(.6,c);});

/* ---------- FESTER mode (5): his own rot moves ----------
     1       MAGGOT SWARM  he retches up a writhing swarm of maggots and flies that crawls onto the nearest enemy and eats
                           at them for 4 s (damage over time, slowed). Hold 1: CORPSE GAS — a choking cloud of green rot.
     2       RIB CAGE      his ribs burst out of his chest as bone spears that snap shut around the enemy in front,
                           impaling and caging them for 1.6 s
     3       GUT ROPE      he rips out his own intestines and lashes them in a wide arc — the first enemy hit is reeled in
     4       PUTRID BLOAT  he swells up with rot gas and bursts: a ring of rotten gore and acid that burns and slows
     Q       MASS GRAVE    the ground splits and dozens of corpse hands claw out of it, grabbing everyone in the area,
                           holding them and dragging them under */
const FEST_G=0x8ab02a,FEST_D=0x3a4a10;
const GUT_MAT=new THREE.MeshStandardMaterial({color:0xb86a6a,roughness:.3,metalness:0}),GUT_G=new THREE.SphereGeometry(.09,10,8);
SPECIALS.festswarm=function(f){once(f,.22,()=>{const T=tgtOf(f,24)||foes(f,24)[0];if(T)faceTo(f,T);const c=f.chest(new V3()).add(TMP2.set(0,.25,0));
    if(typeof bloodBurst==='function')bloodBurst(c.clone().addScaledVector(f.fwd(),.4),18,4);burst(SMK,c.clone().addScaledVector(f.fwd(),.5),16,{colors:[0xe8e0c0,0xd8d0a8,FEST_D],speed:4,up:1,life:.6,size:.1,size1:.05,grav:9});
    SWARMS.push({f,T,p:c.clone(),t:0,state:T?'fly':'fade',dmgT:0});xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false));});
  f.poseKey=f.stateT<.22?'burstIn':'roar';endAt(f,.6);return 10;};
SPECVAR.festswarm={chg:['CORPSE GAS',(f,dt,k)=>{once(f,.25,()=>{GASES.push({f,p:f.pos.clone(),R:5.5+k*2.5,t:0,dur:4.5,tick:0});shake(.3,f.pos);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));});
    f.poseKey=f.stateT<.25?'burstIn':'burstOut';endAt(f,.75);return 10;}],
  alt:['RIB CAGE',(f,dt)=>{once(f,.18,()=>{const T=tgtOf(f,9)||foes(f,8,null,.5)[0];const c=f.chest(new V3()),fw=f.fwd();if(T)faceTo(f,T);
      if(typeof bloodBurst==='function')bloodBurst(c.clone().addScaledVector(fw,.3),40,7);
      // ribs shoot out of his chest
      for(let i=0;i<6;i++){const to=(T?T.chest(new V3()):c.clone().addScaledVector(fw,7)).add(TMP2.set(rand(-.6,.6),rand(-.4,.6),rand(-.6,.6)));trailSeg(c.clone().add(TMP2.set((i-2.5)*.08,rand(-.15,.2),0)),to,0xe8dcc0,.07,.3);}
      if(T){ribCage(f,T);if(NET.role!=='client')hitO(f,T,{dmg:14,kb:0,up:0,stun:1.6,heavy:true,pt:T.chest(new V3())});netEvent({k:'chrib',a:f.id,d:T.id});}
      shake(.35,c);xSnd(f.pos,()=>{AU.hit&&AU.hit(true);AU.boom&&AU.boom(false);});});
    f.poseKey=f.stateT<.18?'burstIn':'burstOut';endAt(f,.65);return 10;}]};
onEv('net:chrib',e=>{const f=FS.find(o=>o.id===e.a),T=FS.find(o=>o.id===e.d);if(f&&T)ribCage(f,T);});
/* maggot swarms */
const SWARMS=[],GASES=[],RIBS=[],GUTS=[],GRAVES=[];
onEv('tick',dt=>{for(let i=SWARMS.length-1;i>=0;i--){const W=SWARMS[i];W.t+=dt;const T=W.T;if(!inMatch()||W.t>5.2||(T&&T.dead&&W.state!=='fade')){SWARMS.splice(i,1);continue;}
  if(W.state==='fly'){const to=T.chest(new V3()),d=to.clone().sub(W.p),L=d.length();W.p.addScaledVector(d.normalize(),Math.min(L,16*dt));if(L<.6){W.state='eat';W.t0=W.t;if(typeof bloodBurst==='function')bloodBurst(to,14,3);}}
  else if(W.state==='eat'){W.p.copy(T.chest(new V3()));if(W.t-W.t0>4){SWARMS.splice(i,1);continue;}
    W.dmgT-=dt;if(W.dmgT<=0&&NET.role!=='client'){W.dmgT=.5;_chiAH(W.f,T,{dmg:2.6,kb:0,up:0,stun:0,pt:W.p});T.slowT=Math.max(T.slowT||0,.8);}}
  if(!nearCam(W.p,60))continue;const n=W.state==='eat'?4:6;
  for(let q=0;q<n;q++){const a=Math.random()*6.283,r=W.state==='eat'?rand(.15,.55):rand(0,.5);const p=TMP2.set(W.p.x+Math.cos(a)*r,W.p.y+rand(-.8,.6),W.p.z+Math.sin(a)*r);
    burst(SMK,p,1,{colors:q%3?[0xe8e0c0,0xd8d0a8]:[0x0a0a08],speed:q%3?.3:2.2,up:0,life:q%3?.35:.25,size:q%3?.07:.04,size1:q%3?.05:.03,grav:q%3?2:0});}
  if(W.state==='eat'&&Math.random()<.15&&typeof bloodBurst==='function')bloodBurst(W.p.clone().add(TMP2.set(rand(-.3,.3),rand(-.5,.4),rand(-.3,.3))),4,2);}});
/* corpse gas */
onEv('tick',dt=>{for(let i=GASES.length-1;i>=0;i--){const G=GASES[i];G.t+=dt;if(G.t>G.dur||!inMatch()){GASES.splice(i,1);continue;}
  if(nearCam(G.p,80)&&Math.random()<.9){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*G.R;burst(SMK,TMP2.set(G.p.x+Math.cos(a)*r,G.p.y+rand(.2,2.2),G.p.z+Math.sin(a)*r).clone(),2,{colors:[0x6a7a1a,0x4a5a10,0x8a9a3a],speed:.5,up:.3,life:1.8,size:1.2,size1:2.4,drag:1});}
  G.tick-=dt;if(G.tick<=0&&NET.role!=='client'){G.tick=.5;for(const o of FS){if(o===G.f||ally(o,G.f)||o.dead||o.downed)continue;if(Math.hypot(o.pos.x-G.p.x,o.pos.z-G.p.z)<G.R&&Math.abs(o.pos.y-G.p.y)<3){_chiAH(G.f,o,{dmg:2.2,kb:0,up:0,stun:0,pt:o.chest(new V3())});o.slowT=Math.max(o.slowT||0,1);
    if(Math.random()<.25&&o.state!=='hit'){o.set('hit');o.stunT=.35;}}}}}});   // choking: they double over now and then
/* rib cage */
function ribCage(f,T){const p=T.pos.clone(),g=new THREE.Group();g.position.copy(p);scene.add(g);const ribs=[];
  for(let i=0;i<8;i++){const piv=new THREE.Group();piv.rotation.y=i/8*6.283;g.add(piv);const r=new THREE.Mesh(new THREE.TorusGeometry(.9,.05,6,14,Math.PI*.55),CHI_BONE);r.position.set(.9,0,0);r.rotation.z=Math.PI*.5;piv.add(r);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.06,.35,6),CHI_BONE);tip.position.set(.05,1.55,0);tip.rotation.z=.6;piv.add(tip);ribs.push(piv);}
  RIBS.push({f,T,p,g,ribs,t:0,dur:1.6});if(typeof bloodBurst==='function')bloodBurst(TMP2.set(p.x,p.y+1,p.z).clone(),50,7);}
onEv('tick',dt=>{for(let i=RIBS.length-1;i>=0;i--){const C=RIBS[i];C.t+=dt;const T=C.T;
  if(C.t>C.dur+.4||!inMatch()){C.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.remove(C.g);RIBS.splice(i,1);continue;}
  const close=Math.min(1,C.t/.18),open=C.t>C.dur?(C.t-C.dur)/.4:0;C.g.scale.set(1,Math.max(.01,close*(1-open)),1);C.ribs.forEach((r,k)=>{r.rotation.z=(1-close)*.9+open*.9;});
  if(T&&!T.dead&&C.t<C.dur){T.pos.copy(C.p);T.vel.set(0,0,0);if(NET.role!=='client'&&T.state!=='hit')T.set('hit');if(T.state==='hit')T.stunT=Math.max(T.stunT||0,C.dur-C.t+T.stateT);
    if(Math.random()<.2&&nearCam(C.p,40))burst(SMK,T.chest(new V3()),2,{colors:[0x7a0010,0xa01a20],speed:1.5,up:.5,life:.5,size:.1,size1:.05,grav:12});}}});
/* GUT ROPE */
XCUSTOM.gutrope=function(f,dt){const V=f.vf,t=f.stateT;if(!V.g){V.g=1;V.hit={};const T=tgtOf(f,9);if(T)faceTo(f,T);const segs=[];for(let i=0;i<18;i++){const m=new THREE.Mesh(GUT_G,GUT_MAT);m.scale.set(1,1,1.4);scene.add(m);segs.push(m);}
    V.G={f,segs};GUTS.push(V.G);const c=f.chest(new V3());if(typeof bloodBurst==='function')bloodBurst(c.clone().add(TMP2.set(0,-.35,0)).addScaledVector(f.fwd(),.3),40,6);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));}
  f.poseKey=t<.15?'specw':'slashWind';f.vel.x*=.8;f.vel.z*=.8;
  const fw=f.fwd(),side=new V3(fw.z,0,-fw.x),belly=f.chest(new V3()).add(TMP2.set(0,-.35,0));
  // the lash sweeps from his right to his left
  const k=clamp((t-.12)/.35,0,1),ext=Math.sin(Math.min(1,t/.5)*Math.PI*.5)*(t>.7?Math.max(0,1-(t-.7)/.25):1),ang=(k-.5)*2.2,R=7.5*ext;
  const tip=belly.clone().addScaledVector(fw,Math.cos(ang)*R).addScaledVector(side,-Math.sin(ang)*R);tip.y=belly.y+Math.sin(t*14)*.3;
  V.G.segs.forEach((m,i)=>{const u=i/(V.G.segs.length-1),p=belly.clone().lerp(tip,u);const sag=Math.sin(u*Math.PI)*(.6-ext*.4);p.y-=sag;p.addScaledVector(side,Math.sin(u*Math.PI*2+t*12)*.25*u);m.position.copy(p);m.rotation.set(u*9+t*6,u*4,0);});
  if(Math.random()<.4&&nearCam(tip,40))burst(SMK,tip,1,{colors:[0x7a0010,0xa04a4a],speed:1,life:.4,size:.1,size1:.04,grav:12});
  if(t>.12&&t<.5){for(const o of foes(f,R+.6)){if(V.hit[o.id])continue;const d=o.pos.clone().sub(f.pos).setY(0),L=d.length();if(L<.5)continue;const a=Math.atan2(d.dot(side)*-1,d.dot(fw));if(Math.abs(a-ang)>.45)continue;
      V.hit[o.id]=1;if(NET.role!=='client'){hitO(f,o,{dmg:9,kb:0,up:0,stun:.8,pt:o.chest(new V3())});if(!V.reel){V.reel=o;yankTo(f,o,.35);}}if(typeof bloodBurst==='function')bloodBurst(o.chest(new V3()),16,4);}}
  if(t>.95){f.set(f.onGround?'idle':'air');}return 10;};
function yankTo(f,T,dur){const from=T.pos.clone(),t0=game.time;T.set('hit');const step=()=>{if(!inMatch()||T.dead||f.dead)return;const k=Math.min(1,(game.time-t0)/dur),fw=f.fwd(),to=new V3(f.pos.x+fw.x*1.5,f.pos.y,f.pos.z+fw.z*1.5);
  T.pos.lerpVectors(from,to,k*k*(3-2*k));T.vel.set(0,0,0);if(k<1)requestAnimationFrame(step);};step();}
onEv('tick',()=>{for(let i=GUTS.length-1;i>=0;i--){const G=GUTS[i];if(!inMatch()||G.f.dead||G.f.state!=='special'||!G.f.vf||G.f.vf.G!==G){G.segs.forEach(m=>scene.remove(m));GUTS.splice(i,1);}}});
/* PUTRID BLOAT */
XCUSTOM.bloat=function(f,dt){const V=f.vf,t=f.stateT,c=f.chest(new V3());f.vel.x*=.7;f.vel.z*=.7;
  if(t<.8){f._chBloat=true;const s=1+t*.55+Math.sin(t*40)*.03*t;f.rig.root.scale.set(f.hero.scale*s,f.hero.scale*(1+t*.3),f.hero.scale*s);f.poseKey='burstIn';
    if(Math.random()<.5&&nearCam(c,50))burst(SMK,c.clone().add(TMP2.set(rand(-.5,.5),rand(-.5,.6),rand(-.5,.5))),1,{colors:[0x6a7a1a,0x8a9a3a],speed:.6,up:.5,life:.6,size:.25,size1:.5});
    atT(f,'b0',.05,()=>xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false)));return 10;}
  if(!V.pop){V.pop=1;f._chBloat=false;f.poseKey='burstOut';const R=6.5;
    if(NET.role!=='client')for(const o of foes(f,R)){hitO(f,o,{dmg:16,kb:12,up:5,stun:.6,heavy:true,pt:o.chest(new V3())});o.slowT=Math.max(o.slowT||0,3);}
    if(typeof bloodBurst==='function'){bloodBurst(c,130,13);}burst(SMK,c,40,{colors:[FEST_G,0x6a7a1a,0x5a0008],speed:12,up:3,life:.9,size:.3,size1:.6,grav:6});
    if(typeof gibs==='function')gibs(c,f.fwd(),16);for(let i=0;i<8;i++){const a=i/8*6.283;chiPuddle(f,f.pos.clone().add(TMP2.set(Math.cos(a)*rand(2,5),0,Math.sin(a)*rand(2,5))),rand(1,1.6));}
    for(let i=0;i<10;i++)chiStain(new V3(f.pos.x+rand(-4,4),f.pos.y,f.pos.z+rand(-4,4)),rand(.5,1.2));
    ring(TMP2.set(f.pos.x,f.pos.y+.3,f.pos.z).clone(),FEST_G,R,.4,true,1.4);shake(.6,c);hitStop(.08);xSnd(f.pos,()=>{AU.boom&&AU.boom(true);AU.hit&&AU.hit(true);});}
  endAt(f,1.15);return 10;};
onEv('tick',()=>{for(const f of FS)if(f._chBloat&&(f.state!=='special'||f.dead)){f._chBloat=false;}});
/* MASS GRAVE (FESTER ultimate) */
ULTX.massgrave={r:14,s(f){f.uEnd=99;f.vf.t0=null;f.invuln=Math.max(f.invuln,1);f.poseKey='kneelPalm';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;f.uEnd=t+2.8;const T=tgtOf(f,26);if(T)faceTo(f,T);V.c=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),8);V.c.y=floorAt(V.c.x,V.c.z,f.pos.y+2);
      if(typeof duckMusic==='function')duckMusic(2.6);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));}
    const r=t-V.t0,C=V.c;f.vel.set(0,f.vel.y,0);f.poseKey=r<.4?'kneelPalm':r<1.9?'armsUp':'slamLand';
    atT(f,'m0',V.t0+.25,()=>{ring(TMP2.set(C.x,C.y+.2,C.z).clone(),0x5a0008,7,.6,true,1.2);dust(C,14,2);if(typeof crater==='function')crater(C.x,C.z,5,C.y);shake(.6,C);
      for(let i=0;i<10;i++)chiStain(new V3(C.x+rand(-5,5),C.y,C.z+rand(-5,5)),rand(.8,1.8));
      const G={f,C,t:0,hands:[],held:[]};GRAVES.push(G);V.G=G;
      for(let i=0;i<20;i++){const a=rand(0,6.283),rr=Math.sqrt(Math.random())*6.5,p=new V3(C.x+Math.cos(a)*rr,0,C.z+Math.sin(a)*rr);p.y=floorAt(p.x,p.z,C.y+2);const m=chiArmMesh(f);m.position.set(p.x,p.y-1.1,p.z);
        chiAim(m,new V3(rand(-.3,.3),1,rand(-.3,.3)));G.hands.push({m,base:p,d:rand(0,.35)});}
      if(NET.role!=='client')for(const o of FS){if(o===f||ally(o,f)||o.dead||o.downed)continue;if(Math.hypot(o.pos.x-C.x,o.pos.z-C.z)>7||Math.abs(o.pos.y-C.y)>4)continue;
        hitO(f,o,{dmg:10,kb:0,up:0,stun:2,ult:true,pt:o.chest(new V3())});G.held.push({o,p:o.pos.clone()});}
      netEvent({k:'chgrave',a:f.id,x:C.x,y:C.y,z:C.z});xSnd(C,()=>{AU.boom&&AU.boom(true);AU.crash&&AU.crash();});});
    atT(f,'m1',V.t0+1.9,()=>{const G=V.G;if(!G)return;// dragged under
      if(NET.role!=='client')for(const H of G.held){const o=H.o;if(o.dead)continue;hitO(f,o,{dmg:30,kb:4,up:9,launch:true,heavy:true,ult:true,pt:o.chest(new V3())});}
      for(const H of G.held)if(typeof bloodBurst==='function')bloodBurst(H.o.chest(new V3()),70,9);G.crush=true;shake(.9,C);hitStop(.1);flashLight(TMP2.set(C.x,C.y+1,C.z).clone(),0xa01020,12);xSnd(C,()=>{AU.boom&&AU.boom(true);AU.hit&&AU.hit(true);});});
    return 10;}};
onEv('net:chgrave',e=>{const f=FS.find(o=>o.id===e.a);if(!f)return;const C=new V3(e.x,e.y,e.z);const G={f,C,t:0,hands:[],held:[]};GRAVES.push(G);
  for(let i=0;i<20;i++){const a=rand(0,6.283),rr=Math.sqrt(Math.random())*6.5,p=new V3(C.x+Math.cos(a)*rr,0,C.z+Math.sin(a)*rr);p.y=floorAt(p.x,p.z,C.y+2);const m=chiArmMesh(f);m.position.set(p.x,p.y-1.1,p.z);chiAim(m,new V3(0,1,0));G.hands.push({m,base:p,d:rand(0,.35)});}});
onEv('tick',dt=>{for(let i=GRAVES.length-1;i>=0;i--){const G=GRAVES[i];G.t+=dt;if(G.t>2.8||!inMatch()){G.hands.forEach(h=>scene.remove(h.m));GRAVES.splice(i,1);continue;}
  for(const h of G.hands){const k=clamp((G.t-h.d)/.35,0,1),sink=G.t>2.1?(G.t-2.1)/.7:0;h.m.position.y=h.base.y-1.1+k*1.3-sink*1.5;h.m.rotation.y+=Math.sin(G.t*12+h.d*20)*dt*2;
    if(k>0&&k<1&&Math.random()<.3&&nearCam(h.base,60))burst(SMK,TMP2.set(h.base.x,h.base.y+.1,h.base.z).clone(),2,{colors:[0x3a2a1a,0x5a0008],speed:2,up:3,life:.5,size:.15,size1:.05,grav:10});}
  for(const H of G.held){const o=H.o;if(o.dead||G.t>2.1)continue;o.pos.copy(H.p);o.pos.y=H.p.y-Math.min(.6,G.t*.25);o.vel.set(0,0,0);if(NET.role!=='client'&&o.state!=='hit')o.set('hit');if(o.state==='hit')o.stunT=Math.max(o.stunT||0,o.stateT+.3);
    if(Math.random()<.15&&typeof bloodBurst==='function')bloodBurst(o.chest(new V3()).add(TMP2.set(0,-.6,0)),5,3);}}});
onEv('matchEnd',()=>{SWARMS.length=0;GASES.length=0;RIBS.forEach(C=>scene.remove(C.g));RIBS.length=0;GUTS.forEach(G=>G.segs.forEach(m=>scene.remove(m)));GUTS.length=0;GRAVES.forEach(G=>G.hands.forEach(h=>scene.remove(h.m)));GRAVES.length=0;});
Object.assign(SPNAME,{festswarm:'MAGGOT SWARM'});Object.assign(SPECIAL_AI,{festswarm:[3,20,.6]});Object.assign(XSPK,{festswarm:1});Object.assign(ULT_RANGE,{massgrave:14});
// plug them into his FESTER mode
const _chiMHIv=setInterval(()=>{if(typeof modeHero!=='function')return;clearInterval(_chiMHIv);const _mh=modeHero;modeHero=function(base){const had=!!(base&&base._mode);const H=_mh.apply(this,arguments);
  if(H&&!had&&base.id==='chimera'){const ab=o=>sanitizeAbil(Object.assign({colors:[FEST_G,CHI_R]},o));
    Object.assign(H,{special:'festswarm',spName:'MAGGOT SWARM',specCD:2.8,ult:'massgrave',ultName:'MASS GRAVE',
      _xm:[Object.assign(ab({name:'GUT ROPE',form:'grab',style:'blood',shape:'ring',fx:[]}),{custom:'gutrope'}),Object.assign(ab({name:'PUTRID BLOAT',form:'burst',style:'poison',shape:'orb',fx:[]}),{custom:'bloat'})]});
    if(H.cab)H.cab=Object.assign({},H.cab);}
  return H;};},5);

/* ---------- AMALGAMATION moves: the meat pile fights differently ----------
     1  ENGULF          the mass lunges and swallows the first enemy it reaches, digests them inside for 2.5 s, then
                        spits what's left back out (he grows a limb from it)
     2  BONE ERUPTION   bones spear out of the mass in every direction, impaling everyone around him
     3  BLOOD TORRENT   every mouth vomits a heavy torrent of blood in front of him that he can sweep around
     4  HUNDRED HANDS   every arm in the pile stretches out, grabs everyone nearby and drags them in to be crushed
     Q  FLESH ERUPTION  (as before) */
const AMAL_N={sp:'ENGULF',spB:'BONE ERUPTION',x1:'BLOOD TORRENT',x2:'HUNDRED HANDS'};
function chiAmal(f){return isChi(f)&&chiS(f).amal&&chiBase(f);}
const ENGULFED=[],ERUPTS=[],HANDS=[];
function amalEngulf(f,dt){const V=f.vf,t=f.stateT;if(!V.e){V.e=1;V.from=f.pos.clone();const T=tgtOf(f,10);if(T)faceTo(f,T);const fw=f.fwd();V.to=f.pos.clone().addScaledVector(fw,Math.max(0,clearLen(f.pos,fw,6,f.pos.y+1)-1));xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));}
  const k=Math.min(1,t/.32);if(!V.got){f.pos.lerpVectors(V.from,V.to,k*k);f.vel.set(0,f.vel.y,0);
    for(const o of foes(f,2.6)){if(o.boss||ENGULFED.some(E=>E.T===o))continue;V.got=o;chiSwallow(f,o);if(NET.role!=='client')netEvent({k:'chengulf',a:f.id,d:o.id});break;}}
  f.poseKey='burstIn';endAt(f,.6);return 10;}
function chiSwallow(f,T){ENGULFED.push({f,T,t:0,tick:0});if(T.rig)T.rig.root.visible=false;bloodBurst(T.chest(new V3()),60,6);shake(.4,f.pos);xSnd(f.pos,()=>{AU.hit&&AU.hit(true);});}
onEv('net:chengulf',e=>{const f=FS.find(o=>o.id===e.a),T=FS.find(o=>o.id===e.d);if(f&&T&&!ENGULFED.some(E=>E.T===T))chiSwallow(f,T);});
onEv('tick',dt=>{for(let i=ENGULFED.length-1;i>=0;i--){const E=ENGULFED[i],f=E.f,T=E.T;E.t+=dt;
  const out=()=>{ENGULFED.splice(i,1);if(T.rig)T.rig.root.visible=!T.dead||true;};
  if(!inMatch()){out();continue;}
  if(T.dead){out();continue;}
  if(f.dead||E.t>2.5){// spat back out
    out();const fw=f.fwd();T.pos.copy(f.pos).addScaledVector(fw,2.2);T.pos.y=f.pos.y+.6;bloodBurst(T.chest(new V3()),110,10);bloodDrops(T.chest(new V3()),60,12,fw,.5,2);
    if(NET.role!=='client'&&!f.dead){_chiAH(f,T,{dmg:8,kb:14,up:6,launch:true,heavy:true,pt:T.chest(new V3())});chiAdd(f,Math.random()<.5?'arm':'leg');}xSnd(f.pos,()=>AU.boom&&AU.boom(false));continue;}
  T.pos.copy(f.pos);T.pos.y+=.4;T.vel.set(0,0,0);if(NET.role!=='client'&&T.state!=='hit')T.set('hit');if(T.state==='hit')T.stunT=Math.max(T.stunT||0,T.stateT+.3);
  E.tick-=dt;if(E.tick<=0){E.tick=.4;if(NET.role!=='client')_chiAH(f,T,{dmg:2.4,kb:0,up:0,stun:0,pt:f.chest(new V3())});if(nearCam(f.pos,50))bloodDrops(f.chest(new V3()).add(TMP2.set(rand(-.6,.6),rand(0,.6),rand(-.6,.6))),8,4,null,null,2);}
  const B=f.chi&&f.chi.blob;if(B)B.g.scale.multiplyScalar(1+Math.sin(E.t*18)*.03);}});
function amalErupt(f,dt){const V=f.vf,t=f.stateT;f.vel.set(0,f.vel.y,0);f.poseKey=t<.25?'burstIn':'burstOut';
  atT(f,'er',.25,()=>{const g=new THREE.Group();g.position.copy(f.pos);scene.add(g);const sp=[];for(let i=0;i<18;i++){const a=i/18*6.283+rand(-.1,.1),el=rand(-.05,.55);
      const m=new THREE.Mesh(new THREE.ConeGeometry(.11,1,6),CHI_BONE);m.geometry.translate(0,.5,0);m.position.set(0,rand(.4,1.1),0);m.quaternion.setFromUnitVectors(new V3(0,1,0),new V3(Math.cos(a),el,Math.sin(a)).normalize());g.add(m);sp.push(m);}
    ERUPTS.push({g,sp,t:0});
    if(NET.role!=='client')for(const o of foes(f,6)){hitO(f,o,{dmg:13,kb:12,up:6,launch:true,heavy:true,pt:o.chest(new V3())});}
    for(const o of foes(f,6))bloodDrops(o.chest(new V3()),40,8,o.pos.clone().sub(f.pos).setY(.3).normalize(),.5,2);
    bloodBurst(f.chest(new V3()),60,8);shake(.6,f.pos);hitStop(.06);xSnd(f.pos,()=>{AU.hit&&AU.hit(true);AU.boom&&AU.boom(false);});});
  endAt(f,.85);return 10;}
onEv('tick',dt=>{for(let i=ERUPTS.length-1;i>=0;i--){const E=ERUPTS[i];E.t+=dt;if(E.t>.9||!inMatch()){E.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.remove(E.g);ERUPTS.splice(i,1);continue;}
  const k=E.t<.12?E.t/.12:E.t<.55?1:Math.max(0,1-(E.t-.55)/.35);E.sp.forEach((m,j)=>m.scale.set(1,Math.max(.01,k*(4.6+(j%3)*.6)),1));}});
function amalTorrent(f,dt){const V=f.vf,t=f.stateT;f.vel.x*=.7;f.vel.z*=.7;f.poseKey='roar';
  if(!V.tr){V.tr=1;V.hit={};const T=tgtOf(f,14);if(T)faceTo(f,T);if(!f._lb2)f._lb2=liquidBeam();xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));}
  // he can sweep it while it pours
  const T=tgtOf(f,16);if(T){const want=Math.atan2(T.pos.x-f.pos.x,T.pos.z-f.pos.z);let d=want-f.face;d=Math.atan2(Math.sin(d),Math.cos(d));f.face+=clamp(d,-1.6*dt,1.6*dt);}
  const k=t<.15?t/.15:t<1.35?1:Math.max(0,1-(t-1.35)/.2),fw=f.fwd(),org=f.chest(new V3()).add(TMP2.set(0,.2,0)).addScaledVector(fw,1.1),dir=fw.clone().add(TMP2.set(0,-.12,0)).normalize();
  const len=Math.max(1,clearLen(f.pos,fw,13,org.y)*k);
  if(k>0){f._lb2.update(org,dir,len,.55*k+.05,game.time);}else f._lb2.hide();
  if(t>.15&&t<1.4&&(!V.pt||t-V.pt>.18)){V.pt=t;for(const o of foes(f,len+.5,null,.86)){if(NET.role!=='client'){_chiAH(f,o,{dmg:1.3,kb:2.5,up:0,stun:.2,pt:o.chest(new V3())});o.slowT=Math.max(o.slowT||0,1.5);}}}
  if(t>1.6){f._lb2.hide();f.set(f.onGround?'idle':'air');}return 10;}
onEv('tick',()=>{for(const f of FS)if(f._lb2&&(f.state!=='special'||f.dead))f._lb2.hide();});
function amalHands(f,dt){const V=f.vf,t=f.stateT;f.vel.set(0,f.vel.y,0);f.poseKey='armsUp';
  if(!V.h){V.h=1;V.L=foes(f,10).slice(0,6);const H={f,L:V.L,t:0,segs:[]};V.L.forEach(()=>{const ss=[];for(let i=0;i<12;i++){const m=new THREE.Mesh(GUT_G,i%2?CHI_MEAT:CHI_MEAT2);m.scale.set(1.2,1.2,1.6);scene.add(m);ss.push(m);}H.segs.push(ss);});HANDS.push(H);V.H=H;
    if(NET.role!=='client')V.L.forEach(o=>hitO(f,o,{dmg:4,kb:0,up:0,stun:1.2,pt:o.chest(new V3())}));xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));}
  // reel everyone in, then crush
  if(t<.9){const kk=Math.min(1,t/.9);for(const o of V.L){if(o.dead)continue;const d=f.pos.clone().sub(o.pos).setY(0),L=d.length();if(L>2.2&&t>.25){o.pos.addScaledVector(d.normalize(),Math.min(L-2.2,14*dt));}o.vel.set(0,0,0);}}
  atT(f,'cr',.95,()=>{if(NET.role!=='client')for(const o of V.L){if(o.dead)continue;hitO(f,o,{dmg:10,kb:10,up:9,launch:true,heavy:true,pt:o.chest(new V3())});}
    for(const o of V.L)bloodBurst(o.chest(new V3()),50,8);shake(.6,f.pos);xSnd(f.pos,()=>{AU.boom&&AU.boom(true);});});
  endAt(f,1.25);return 10;}
onEv('tick',dt=>{for(let i=HANDS.length-1;i>=0;i--){const H=HANDS[i],f=H.f;H.t+=dt;if(H.t>1.25||!inMatch()||f.dead){H.segs.forEach(ss=>ss.forEach(m=>scene.remove(m)));HANDS.splice(i,1);continue;}
  const c=f.chest(new V3());H.L.forEach((o,j)=>{const ss=H.segs[j];const tip=o.chest(new V3()),ext=Math.min(1,H.t/.2);ss.forEach((m,q)=>{const u=q/(ss.length-1)*ext;m.position.copy(c).lerp(tip,u);m.position.y+=Math.sin(u*Math.PI)*.8;m.visible=!o.dead;});});}});
// route his moves while he's the amalgamation
const _chiJav=SPECIALS.chimjav;SPECIALS.chimjav=function(f,dt){if(chiAmal(f))return amalEngulf(f,dt);return _chiJav.apply(this,arguments);};
const _chiChg=SPECVAR.chimjav.chg[1];SPECVAR.chimjav.chg[1]=function(f,dt,k){if(chiAmal(f))return amalEngulf(f,dt);return _chiChg.apply(this,arguments);};
const _chiAlt=SPECVAR.chimjav.alt[1];SPECVAR.chimjav.alt[1]=function(f,dt){if(chiAmal(f))return amalErupt(f,dt);return _chiAlt.apply(this,arguments);};
const _chiBile=XCUSTOM.bile;XCUSTOM.bile=function(f,dt){if(chiAmal(f))return amalTorrent(f,dt);return _chiBile.apply(this,arguments);};
const _chiAbs=XCUSTOM.absorb;XCUSTOM.absorb=function(f,dt){if(chiAmal(f))return amalHands(f,dt);return _chiAbs.apply(this,arguments);};
// a split can't happen as a pile of meat
onEv('tick',()=>{for(const f of FS)if(f._chSplit&&chiS(f).amal&&isChi(f)){f._chSplit=false;}});
// the ability bar shows the amalgamation's moves
onEv('tick',()=>{const el=document.getElementById('slots');if(!el||!ME||!isChi(ME))return;const am=chiAmal(ME);
  for(const d of el.children){const sp=d.querySelector('span');if(!sp)continue;if(!sp.dataset.n)sp.dataset.n=sp.textContent;if(!sp.dataset.base)sp.dataset.base=sp.dataset.n;
    const want=am&&AMAL_N[d.dataset.k]?AMAL_N[d.dataset.k]:sp.dataset.base;if(sp.dataset.n!==want){sp.dataset.n=want;sp.textContent=want;d.dataset.lock='';}}});
onEv('matchEnd',()=>{ENGULFED.forEach(E=>{if(E.T.rig)E.T.rig.root.visible=true;});ENGULFED.length=0;ERUPTS.forEach(E=>scene.remove(E.g));ERUPTS.length=0;HANDS.forEach(H=>H.segs.forEach(ss=>ss.forEach(m=>scene.remove(m))));HANDS.length=0;
  for(const f of FS)if(f._lb2){f._lb2.dispose();f._lb2=null;}});
