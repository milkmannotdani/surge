/* SIGNATURES — every inspired fighter gets the HEIR treatment:
   1) a constant signature look (like HEIR's green lightning) that says who they are at a glance
   2) moves that didn't fit the inspiration replaced with ones that do
   3) a directed cinematic for their ultimate: a slow close-up while it charges, then a wide shot of it landing,
      letterbox bars, and the camera follows the impact (for the user and anyone within 35 m)
   All original designs; inspirations are credited in credits.js. */
const SIG_C={},nc=(f,R)=>nearCam(f.pos,R||38);
function sHead(f){return f.chest(new V3()).add(TMP2.set(0,.55,0));}
function sSide(f,s,up){const fw=f.fwd(),sd=new V3(fw.z,0,-fw.x).multiplyScalar(s);return f.chest(new V3()).add(sd).add(TMP2.set(0,up||0,0));}
function pf(p,col,o){burst(o&&o.smk?SMK:ADD,p,1,Object.assign({colors:Array.isArray(col)?col:[col],speed:.6,up:1.5,life:.5,size:.18,size1:0,bright:2},o||{}));}
const SIG={
  // half ice, half fire: frost mist rises off his right side, embers off his left
  solstice(f){if(Math.random()<.5)pf(sSide(f,-.3,rand(-.2,.4)),[0xcff4ff,0xffffff],{up:1.2,life:.6,size:.22});if(Math.random()<.5)pf(sSide(f,.3,rand(-.2,.4)),[0xff6a1a,0xffc04a],{up:2.4,life:.4,size:.18,bright:2.4});},
  // engines in his calves: exhaust jets behind his legs while moving
  piston(f){const sp=Math.hypot(f.vel.x,f.vel.z);if(sp<3||Math.random()>.8)return;const fw=f.fwd();for(const s of [-.14,.14]){const p=f.pos.clone().add(TMP2.set(fw.z*s-fw.x*.25,.45,-fw.x*s-fw.z*.25));
    ADD.spawn(p.x,p.y,p.z,-fw.x*sp*.6,rand(0,.5),-fw.z*sp*.6,..._rgb(Math.random()<.5?0x8ad8ff:0xffffff,2),.18,.2,.02,0,0);}},
  // red glowing eyes and floating hair while his stare is erasing someone
  snare(f){const on=f.eyeT>(f._eyeP||0);f._eyeP=f.eyeT||0;if(!on)return;const h=sHead(f),fw=f.fwd(),sd=new V3(fw.z,0,-fw.x);
    for(const s of [-.07,.07]){const e=h.clone().addScaledVector(fw,.2).addScaledVector(sd,s);pf(e,[0xff2a2a,0xffffff],{speed:.05,up:0,life:.12,size:.12,bright:3});}if(Math.random()<.3)pf(h.clone().add(TMP2.set(0,.25,0)),0x2a2a2a,{smk:1,up:1.5,life:.4,size:.12});},
  // two compressed marbles orbit his hand
  marble(f){if(!SIG_C.mb)SIG_C.mb=0;const h=limbPos(f,'r',new V3()),t=game.time*4;for(let k=0;k<2;k++){const a=t+k*Math.PI;const p=h.clone().add(TMP2.set(Math.cos(a)*.35,.15+Math.sin(a*1.3)*.1,Math.sin(a)*.35));pf(p,[0x6ad8ff,0xffffff],{speed:0,up:0,life:.07,size:.13,bright:2.6});}},
  // unstable doubles: ghostly afterimages flicker off him when he moves fast
  legion(f){const sp=Math.hypot(f.vel.x,f.vel.z);if(sp<6||Math.random()>.25)return;pf(f.chest(new V3()).add(TMP2.set(rand(-.3,.3),rand(-.6,.6),rand(-.3,.3))),[0x5affd8,0xd8d8ff],{speed:.3,up:0,life:.35,size:.5,bright:1.4});},
  // a sniper's laser sight to her target, and a hot glow at the rifle arm
  recoil(f){const h=limbPos(f,'r',new V3());if(Math.random()<.4)pf(h,[0xffd23f,0xff7a2a],{speed:.2,up:.3,life:.15,size:.1,bright:2.6});const T=f.tgt;
    if(T&&!T.dead&&T.pos.distanceTo(f.pos)<45&&Math.random()<.35){const to=T.chest(new V3());bolt(h,to,0xff2a2a,.012,.06);pf(to,0xff2a2a,{speed:0,up:0,life:.08,size:.14,bright:3});}},
  // blood drips from her hands
  crimson(f){if(Math.random()<.25){const h=limbPos(f,Math.random()<.5?'r':'l',new V3());ADD.spawn(h.x,h.y,h.z,rand(-.2,.2),-.5,rand(-.2,.2),..._rgb(0xc4102a,1.3),.6,.08,.06,9,0);}},
  // steel glints run along the blade bundle
  sawback(f){if(Math.random()<.3){const h=limbPos(f,'r',new V3()).add(TMP2.set(rand(-.3,.3),rand(0,.8),rand(-.3,.3)));pf(h,[0xffffff,0xd8e0e8],{speed:.4,up:.2,life:.15,size:.12,bright:3});}},
  // red restructuring cracks crawl over his hands
  resect(f){if(Math.random()<.35){const h=limbPos(f,Math.random()<.5?'r':'l',new V3());const b=h.clone().add(TMP2.set(rand(-.25,.25),rand(-.25,.25),rand(-.25,.25)));bolt(h,b,0xff2a3a,.02,.1);}},
  // stored kinetic energy glows inside him while he holds it
  cushion(f){if(!(f.absT>0||f.stored>0)&&Math.random()>.12)return;pf(f.chest(new V3()).add(TMP2.set(rand(-.5,.5),rand(-.4,.4),rand(-.5,.5))),[0xffd23f,0xfff0a0],{speed:.4,up:.4,life:.4,size:.2,bright:2});},
  // acid drips off her hands and feet and sizzles
  corrosa(f){if(Math.random()<.3){const h=limbPos(f,pick(['r','l','f']),new V3());ADD.spawn(h.x,h.y,h.z,rand(-.2,.2),-.3,rand(-.2,.2),..._rgb(pick([0x9aff3a,0xff6ad8]),1.6),.5,.09,.05,8,0);}},
  // a long blood-red scarf streams behind him
  verdict(f){const sp=Math.hypot(f.vel.x,f.vel.z);const n=sHead(f).add(TMP2.set(0,-.35,0));if(f._vp&&(sp>2||Math.random()<.3)){const tail=f._vp.clone().add(TMP2.set(0,-.15,0));trailSeg(tail,n,0x9a0a1a,.09,.5);}f._vp=n;},
  // stars sparkle around her
  decree(f){if(Math.random()<.4){const a=Math.random()*6.28;pf(f.chest(new V3()).add(TMP2.set(Math.cos(a)*.8,rand(-.6,1),Math.sin(a)*.8)),[0xffffff,0xff4a5a,0x4a8aff],{speed:.2,up:.3,life:.45,size:.16,bright:2.8});}},
  // skid streaks under his hands and feet when he's sliding fast
  skitter(f){const sp=Math.hypot(f.vel.x,f.vel.z);if(sp<8||Math.random()>.7)return;const p=f.pos.clone().add(TMP2.set(rand(-.3,.3),.08,rand(-.3,.3)));pf(p,[0x2aff6a,0xffffff],{speed:.2,up:0,life:.3,size:.16,bright:2});if(Math.random()<.3)dust(f.pos,1,.4);},
  // dust kicks up from his heavy steps; steam off his knuckles
  oldguard(f){if(Math.random()<.15)pf(limbPos(f,Math.random()<.5?'r':'l',new V3()),[0xd8d8d8],{smk:1,up:.8,life:.6,size:.12,size1:.4});},
  // music notes float off her as she moves
  hopstar(f){if(Math.random()<.12)pf(f.chest(new V3()).add(TMP2.set(rand(-.6,.6),rand(.2,1),rand(-.6,.6))),[0xff6ad8,0x6af0ff,0xffffff],{speed:.3,up:1.2,life:.8,size:.22,bright:2.4});},
  // celebrity glamour: sparkles and the odd camera flash
  headliner(f){if(Math.random()<.25)pf(f.chest(new V3()).add(TMP2.set(rand(-.6,.6),rand(-.8,1),rand(-.6,.6))),[0xffd23f,0xffffff],{speed:.2,up:.4,life:.35,size:.14,bright:3});if(Math.random()<.01)flashLight(f.chest(new V3()),0xffffff,4);},
  // spirit pressure rises off him (red-black while released)
  zanshin(f){if(Math.random()<.45){const rel=f.relT>0;pf(f.pos.clone().add(TMP2.set(rand(-.5,.5),rand(0,1.6),rand(-.5,.5))),rel?[0xff2a2a,0x2a0a0a]:[0x9ad8ff,0xffffff],{speed:.2,up:2.6,life:.5,size:.2,bright:rel?1.6:2.2});}},
  // raw output flickers off his fingertips
  torrent(f){if(Math.random()<.4){const h=limbPos(f,Math.random()<.5?'r':'l',new V3());bolt(h,h.clone().add(TMP2.set(rand(-.3,.3),rand(-.3,.3),rand(-.3,.3))),0x9ad8ff,.025,.08);}}};
onEv('tick',dt=>{for(const f of FS){if(f.dead||!nc(f))continue;const id=f.hero&&f.hero.id,fn=SIG[id];if(!fn)continue;try{fn(f,dt);}catch(e){}}});

/* ---------- moves that now match the inspiration (custom extra moves, run by XCUSTOM in heir.js) ---------- */
Object.assign(XCUSTOM,{
  // SOLSTICE — GLACIER WALL: a towering wall of ice tears across the ground, freezing everyone it catches
  icewall(f){const t=f.stateT,V=f.vf;if(!V.go){V.go=1;const T=tgtOf(f,20);if(T)faceTo(f,T);V.fw=f.fwd();V.o=f.pos.clone();V.d=1;V.hit={};shake(.35,f.pos);xSnd(f.pos,()=>{AU.boom(false);AU.whoosh(true);});}
    f.poseKey=t<.15?'specw':'spech';const reach=Math.min(16,1+t*42);
    while(V.d<reach){const p=V.o.clone().addScaledVector(V.fw,V.d),sd=new V3(V.fw.z,0,-V.fw.x);for(let k=-1;k<=1;k++){const q=p.clone().addScaledVector(sd,k*1.1);crag(q.x,q.z,(k?2.2:3.6)+V.d*.1+rand(0,.6),3.5,0xcff4ff);}
      burst(ADD,p.clone().add(TMP2.set(0,1,0)),5,{colors:[0xcff4ff,0xffffff],speed:4,up:3,life:.5,size:.3,size1:0,bright:2});dust(p,2,.6);
      for(const o of foes(f,3,p)){if(V.hit[o.id])continue;V.hit[o.id]=1;hitO(f,o,{dmg:12,kb:2,up:6,stun:1.3,freeze:1});}V.d+=1.3;}
    if(t>.65)f.set(f.onGround?'idle':'air');return 10;},
  // MARBLE — UNPACK: tosses a marble that unpacks into a burst of compressed rubble where it lands
  unpack(f){const t=f.stateT,V=f.vf;if(!V.go){V.go=1;const T=tgtOf(f,18);if(T)faceTo(f,T);V.to=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),10);V.to.y=floorAt(V.to.x,V.to.z,f.pos.y+2);V.from=limbPos(f,'r',new V3());
      V.m=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshStandardMaterial({color:0x6ad8ff,emissive:0x2a8aff,emissiveIntensity:1.2,roughness:.1}));scene.add(V.m);xSnd(f.pos,()=>AU.whoosh(false));}
    f.poseKey=t<.12?'throwS':'spech';const k=Math.min(1,t/.45);if(V.m){V.m.position.lerpVectors(V.from,V.to,k);V.m.position.y+=Math.sin(k*Math.PI)*2.2;}
    if(k>=1&&!V.pop){V.pop=1;if(V.m){scene.remove(V.m);V.m.geometry.dispose();V.m.material.dispose();V.m=null;}const p=V.to;
      flashLight(p.clone().add(TMP2.set(0,1,0)),0x6ad8ff,10);ring(p.clone().add(TMP2.set(0,.6,0)),0x6ad8ff,3,.25,false,2.6);
      if(typeof physRing==='function')physRing({style:'earth',size:1.1,c1:0x8a7a6a},p,2.4,9);debris(p.clone().add(TMP2.set(0,.8,0)),16,0,12,.5);shake(.4,p);xSnd(p,()=>{AU.boom(false);AU.crash&&AU.crash();});
      for(const o of foes(f,3.6,p))hitO(f,o,{dmg:15,kb:10,up:8,stun:.6,launch:true});}
    if(t>.75){if(V.m){scene.remove(V.m);V.m=null;}f.set(f.onGround?'idle':'air');}return 10;},
  // RECOIL — CURVED SHOT: a round that bends through the air around cover to find its target
  curve(f){const t=f.stateT,V=f.vf;f.poseKey='aim';if(!V.go){V.go=1;V.T=tgtOf(f,60)||nearestEnemy(f,60);if(V.T)faceTo(f,V.T);xSnd(f.pos,()=>{AU.gun?AU.gun():AU.boom(false);});}
    if(t>.18&&!V.f){V.f=1;const a=limbPos(f,'r',new V3()),T=V.T,b=T&&!T.dead?T.chest(new V3()):a.clone().addScaledVector(f.fwd(),40);const fw=f.fwd(),sd=new V3(fw.z,0,-fw.x);
      const mid=a.clone().lerp(b,.5).addScaledVector(sd,a.distanceTo(b)*.35*(Math.random()<.5?1:-1)).add(TMP2.set(0,a.distanceTo(b)*.18,0));const cv=new THREE.QuadraticBezierCurve3(a,mid,b);let prev=a;
      for(let s=1;s<=14;s++){const p=cv.getPoint(s/14);trailSeg(prev,p,0xffd23f,.05,.35);prev=p;}burst(ADD,b,16,{colors:[0xffd23f,0xffffff],speed:7,life:.3,size:.3,size1:0,bright:2.6});
      if(T&&!T.dead)hitO(f,T,{dmg:18,kb:8,up:3,stun:.5,mark:1});}
    if(t>.5)f.set(f.onGround?'idle':'air');return 10;}});
// assign them to the fighters' extra-move slots (and fix Corrosa's doubled Acid Pool → Acid Shot)
(function(){const ab=(h,o)=>sanitizeAbil(Object.assign({colors:[h.color,h.accent]},o));
  const SET1=[['solstice',1,{name:'GLACIER WALL',form:'wave',style:'ice',shape:'snowflake',fx:['freeze']},'icewall'],['marble',0,{name:'UNPACK',form:'bolt',style:'crystal',shape:'orb',fx:[]},'unpack'],
    ['recoil',0,{name:'CURVED SHOT',form:'bolt',style:'metal',shape:'bullet',fx:[]},'curve']];
  for(const [id,i,o,c] of SET1){const h=HEROES.find(x=>x.id===id);if(!h)continue;const L=xMoves(h);L[i]=Object.assign(ab(h,o),{custom:c});}
  const C=HEROES.find(x=>x.id==='corrosa');if(C){const L=xMoves(C);L[0]=ab(C,{name:'ACID SHOT',form:'volley',style:'poison',shape:'bubble',fx:['poison'],count:4});}})();

/* ---------- directed ultimates ---------- */
const DCAM={on:false};
const DCAM_SKIP={heir:1};   // HEIR has his own director
onEv('ult',f=>{if(!f||!f.hero||!INSPIRED[f.hero.id]||DCAM_SKIP[f.hero.id]||SET.cinematic===false||!ME)return;if(f!==ME&&f.pos.distanceTo(ME.pos)>35)return;
  const T=tgtOf(f,30);DCAM.on=true;DCAM.f=f;DCAM.t0=game.time;DCAM.T=T;DCAM.hit=null;DCAM.side=Math.random()<.5?1:-1;});
onEv('hit',(a,d)=>{if(DCAM.on&&a===DCAM.f&&a.state==='ult'&&!DCAM.hit){DCAM.hit=d;DCAM.hitT=game.time;}});
const _dcCam=updateCamera;updateCamera=function(dt){const r=_dcCam.apply(this,arguments);if(!DCAM.on)return r;const f=DCAM.f,e=game.time-DCAM.t0;
  if(!f||f.dead||!inMatch()||e>4||(e>.6&&f.state!=='ult')){DCAM.on=false;return r;}
  const fw=f.fwd(),sd=new V3(fw.z,0,-fw.x).multiplyScalar(DCAM.side),c=f.chest(new V3());let pos,look,fov;
  if(e<.9){const a=.6+e*1.1;pos=c.clone().addScaledVector(fw,Math.cos(a)*5.8).addScaledVector(sd,Math.sin(a)*5.8).add(TMP2.set(0,.1,0));look=c;fov=46;}
  else{const tgt=DCAM.hit&&!DCAM.hit.dead?DCAM.hit.pos:DCAM.T&&!DCAM.T.dead?DCAM.T.pos:f.pos.clone().addScaledVector(fw,9);const mid=f.pos.clone().lerp(tgt,.5),span=Math.max(6,f.pos.distanceTo(tgt));
    pos=mid.clone().addScaledVector(sd,span*.9+5).addScaledVector(fw,-span*.25).add(TMP2.set(0,3.5+span*.12,0));look=mid.clone().add(TMP2.set(0,1.2,0));fov=DCAM.hit&&game.time-DCAM.hitT<.25?56:64;}
  {const kk=rayBld(look,pos,16);if(kk<1)pos=look.clone().lerp(pos,Math.max(.3,kk*.9));}
  const k=1-Math.exp(-(e<.9?12:5)*dt);camera.position.lerp(pos,k);camera.lookAt(look);camera.fov=lerp(camera.fov,fov,k);camera.updateProjectionMatrix();
  const bars=$('cineBars');if(bars)bars.classList.add('on');return r;};
onEv('matchEnd',()=>{DCAM.on=false;});
