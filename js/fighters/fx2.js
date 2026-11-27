/* SIGNATURE VFX — effects that make each inspired fighter's moves look like their inspiration's power.
   Hooks into the existing moves (no kit rewrites). Shared pieces: aura pillars, motion trails, glowing eyes,
   compression cubes, mud/blood goo, bullet tracers, floating words, impact lines, giant ice crags.
   SOLSTICE glaciers are huge, with frost mist; Heat Flash is a roaring fire jet · PISTON blue engine flames + speed trail
   SNARE red glowing eyes while erasing · MARBLE a folding cube before the marble · LEGION mud bursts when copies form / melt
   RECOIL muzzle flash + long tracer · CRIMSON blood trail, melting disguise goo · SAWBACK sparks off the blade bundle
   CUSHION ripples when he soaks a hit · CORROSA bubbling, steaming acid · RESECT red breakdown crackle
   VERDICT red after-trail · DECREE the order written in the air · ZANSHIN black-red spirit aura when released
   HEADLINER golden flight trail · HOPSTAR music notes · OLD GUARD impact lines on vital strikes */
const FX2=[];
function fx2Add(o,life,upd){FX2.push({o,t:0,life,upd});if(o&&!o.parent)scene.add(o);return o;}
function fx2Free(o){if(!o)return;if(o.parent)o.parent.remove(o);o.traverse&&o.traverse(m=>{if(m.geometry&&!m.geometry.__keep)m.geometry.dispose();if(m.material&&!m.material.__keep)m.material.dispose();});}
onEv('tick',dt=>{for(let i=FX2.length-1;i>=0;i--){const e=FX2[i];e.t+=dt;const k=e.t/e.life;if(k>=1||!inMatch()){fx2Free(e.o);FX2.splice(i,1);continue;}try{e.upd&&e.upd(e.o,k,dt);}catch(_){e.t=e.life;}}});
const fxMat=(c,op)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op==null?.8:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const G_BOX=new THREE.BoxGeometry(1,1,1);G_BOX.__keep=1;const G_CYL=new THREE.CylinderGeometry(1,1,1,20,1,true);G_CYL.__keep=1;
const G_SPH=new THREE.SphereGeometry(1,10,8);G_SPH.__keep=1;const G_SHARD=new THREE.ConeGeometry(1,1,5);G_SHARD.translate(0,.5,0);G_SHARD.__keep=1;

/* ---------- primitives ---------- */
function trailSeg(a,b,col,w,life){const L=a.distanceTo(b);if(L<.05)return;const m=new THREE.Mesh(G_BOX,fxMat(col,.55));m.scale.set(w,w*.6,L);m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);
  fx2Add(m,life||.3,(o,k)=>{o.material.opacity=.55*(1-k);o.scale.x=o.scale.y=w*(1-k*.7);});}
function trailOn(f,col,w){const c=f.chest(new V3());if(f._tr&&f._tr.distanceTo(c)<6)trailSeg(f._tr,c,col,w||.5,.3);f._tr=c;}
function aura(f,c1,c2,dur){if(f._aura)fx2Free(f._aura.g);const g=new THREE.Group();const a=new THREE.Mesh(G_CYL,fxMat(c1,.2)),b=new THREE.Mesh(G_CYL,fxMat(c2,.16));
  a.scale.set(.75,3.2,.75);b.scale.set(1.05,2.6,1.05);a.position.y=1.5;b.position.y=1.2;g.add(a);g.add(b);scene.add(g);f._aura={g,t:dur};
  fx2Add(g,dur,(o,k)=>{if(f.dead){f._aura=null;return;}o.position.set(f.pos.x,f.pos.y,f.pos.z);const fl=.75+Math.sin(game.time*22)*.12+Math.random()*.1;a.scale.set(.75*fl,3.2+Math.random()*.4,.75*fl);b.scale.set(1.05/fl,2.6,1.05/fl);
    a.material.opacity=.2*(1-k*k);b.material.opacity=.15*(1-k*k);a.rotation.y+=.2;
    if(Math.random()<.8)burst(ADD,TMP2.set(f.pos.x+rand(-.6,.6),f.pos.y+rand(0,1),f.pos.z+rand(-.6,.6)),1,{colors:[c1,c2],speed:.3,up:6,life:.5,size:.3,size1:0,bright:2.2});});}
function fxEyes(f,col,on){const H=f.rig&&f.rig.head;if(!H)return;if(!f._eyes){const g=new THREE.Group();[-1,1].forEach(s=>{const e=new THREE.Mesh(G_SPH,new THREE.MeshBasicMaterial({color:col}));e.scale.setScalar(.028);e.position.set(s*.06,.13,.158);g.add(e);});
  const glow=new THREE.Mesh(G_SPH,fxMat(col,.35));glow.scale.set(.14,.05,.03);glow.position.set(0,.13,.16);g.add(glow);H.add(g);f._eyes=g;}f._eyes.visible=!!on;}
function cubeFold(p,col){const m=new THREE.Mesh(G_BOX,fxMat(col,.45));m.position.copy(p);const w=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true}));m.add(w);
  fx2Add(m,.45,(o,k)=>{const s=2.2*(1-k)+.08;o.scale.setScalar(s);o.rotation.set(k*3,k*4,k*2);o.material.opacity=.45*(1-k*.5);w.material.opacity=1-k*.6;});
  setTimeout(()=>{if(inMatch()){ring(p,col,1.6,.25,false,2.6);burst(ADD,p,16,{colors:[col,0xffffff],speed:5,life:.3,size:.18,size1:0,bright:2.6});}},430);}
function goo(p,col,n,puddle){for(let i=0;i<(n||14);i++)burst(SMK,TMP2.set(p.x+rand(-.5,.5),p.y+rand(.2,1.8),p.z+rand(-.5,.5)),1,{colors:[col],speed:1.4,up:1.5,life:.7,size:.28,size1:.12,grav:14});
  if(puddle!==false){const d=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.75,depthWrite:false}));d.rotation.x=-Math.PI/2;d.position.set(p.x,floorAt(p.x,p.z,p.y+1)+.04,p.z);
    fx2Add(d,2.2,(o,k)=>{o.scale.setScalar(.2+Math.min(1,k*5)*1.1);o.material.opacity=.75*(1-k);});}}
function tracer(a,b,col){const m=new THREE.Mesh(G_BOX,fxMat(col,.9));const L=a.distanceTo(b);m.scale.set(.06,.06,L);m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);
  fx2Add(m,.35,(o,k)=>{o.material.opacity=.9*(1-k);o.scale.x=o.scale.y=.06+k*.12;});}
const TXT={};function fxTextTex(s,col){const key=s+col;if(TXT[key])return TXT[key];const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
  g.font='bold 84px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=10;g.strokeStyle='rgba(0,0,0,.75)';g.strokeText(s,256,64);g.fillStyle='#'+new THREE.Color(col).getHexString();g.fillText(s,256,64);
  const t=new THREE.CanvasTexture(c);t.__keep=1;TXT[key]=t;return t;}
function glyph(s,p,col,scale,life){const m=new THREE.SpriteMaterial({map:fxTextTex(s,col),transparent:true,depthWrite:false});const sp=new THREE.Sprite(m);const sc=scale||1;sp.scale.set(3.2*sc,.8*sc,1);sp.position.copy(p);
  fx2Add(sp,life||1.4,(o,k)=>{o.position.y+=.012;o.material.opacity=k<.15?k/.15:1-Math.max(0,(k-.6)/.4);});}
function impactLines(p,col,n){for(let i=0;i<(n||10);i++){const a=i/(n||10)*6.283+rand(-.2,.2),r0=.6,r1=rand(2.2,3.4),q=new V3(Math.cos(a),rand(-.4,.6),Math.sin(a)).normalize();
  trailSeg(p.clone().addScaledVector(q,r0),p.clone().addScaledVector(q,r1),col,.07,.22);}}
function crackle(p,col){for(let i=0;i<7;i++){let a=p.clone().add(new V3(rand(-.3,.3),rand(-.6,.6),rand(-.3,.3)));for(let j=0;j<4;j++){const b=a.clone().add(new V3(rand(-.5,.5),rand(-.5,.5),rand(-.5,.5)));trailSeg(a,b,col,.05,.3);a=b;}}}
function crag(x,z,h,life,col){const m=new THREE.Mesh(G_SHARD,new THREE.MeshStandardMaterial({color:col||0xcff4ff,emissive:0x5ab8e8,emissiveIntensity:.35,roughness:.15,metalness:.1,transparent:true,opacity:.88,flatShading:true}));
  const y=floorAt(x,z,10);m.position.set(x,y-.2,z);m.rotation.set(rand(-.35,.35),rand(0,6.28),rand(-.35,.35));const w=h*rand(.22,.32);
  fx2Add(m,life,(o,k)=>{const g=Math.min(1,k*life/.12),s=k>.85?1-(k-.85)/.15:1;o.scale.set(w*s,h*g*s,w*s);});}

/* ---------- hooks into existing moves ---------- */
const inSp=(f,name,v)=>f.state==='special'&&f.curSpecial&&f.curSpecial()===name&&(!v||f.specVar===v);
// SOLSTICE: glaciers twice as tall, with crags and frost mist; Permafrost's glacier is enormous
const _fxIce=iceWave;iceWave=function(f,dir,o){if(heroIs(f,'solstice')){o=Object.assign({},o);o.h=(o.h||1)*2.2;o.w=(o.w||1.3)*1.3;
  const L=Math.min(o.len||16,30);for(let d=2;d<L;d+=1.6){const x=f.pos.x+dir.x*d,z=f.pos.z+dir.z*d,s=new V3(dir.z,0,-dir.x);setTimeout(()=>{if(!inMatch())return;
    crag(x+s.x*rand(-1,1)*o.w,z+s.z*rand(-1,1)*o.w,o.h*rand(1.6,2.6)*(.7+d/L*.6),2.6);if(Math.random()<.6)burst(SMK,TMP2.set(x,.6,z),2,{colors:[0xe8f8ff,0xbfe4ff],speed:1,up:1,life:1.2,size:.9,size1:2.2});},d/(o.sp||30)*1000);}}
  return _fxIce.call(this,f,dir,o);};
// MARBLE: the space around the target folds into a cube first
const _fxCmp=compressO;compressO=function(f,o,t,pop){const ok=_fxCmp.apply(this,arguments);if(ok!==false&&o)cubeFold(o.chest(new V3()),0x9ad8ff);return ok;};
// LEGION: copies are made of mud
const _fxSc=spawnClone;spawnClone=function(f,x,z){const r=_fxSc.apply(this,arguments);if(heroIs(f,'legion'))goo(new V3(x,floorAt(x,z,f.pos.y+2),z),0x3a2a1a,12);return r;};
const _fxMc=meltClone;meltClone=function(c,silent){if(c&&c.pos&&c.f&&heroIs(c.f,'legion'))goo(c.pos.clone(),0x3a2a1a,16);return _fxMc.apply(this,arguments);};
// RECOIL: muzzle flash and a long tracer
const _fxFb=fireBullet;fireBullet=function(f,T,o){const r=_fxFb.apply(this,arguments);if(heroIs(f,'recoil')){const st=(o&&o.from)||muzOf(f);let d=o&&o.dir?o.dir.clone():(T?T.chest(new V3()).sub(st).normalize():f.fwd());
  tracer(st,st.clone().addScaledVector(d,30),0xff4ad8);burst(ADD,st,14,{colors:[0xffffff,0xff9af0],speed:6,life:.15,size:.3,size1:0,bright:3});ring(st,0xff4ad8,1.2,.15,false,2.6);}return r;};
// CORROSA: acid bubbles and steams
const _fxAc=acidAt;acidAt=function(f,x,z,r,life){const res=_fxAc.apply(this,arguments);const y=floorAt(x,z,(f&&f.pos.y||0)+2);let n=0;
  const iv=setInterval(()=>{if(!inMatch()||++n>12){clearInterval(iv);return;}for(let i=0;i<3;i++)burst(ADD,TMP2.set(x+rand(-r,r)*.7,y+.1,z+rand(-r,r)*.7),1,{colors:[0xb8ff3a,0xe8ff9a],speed:.3,up:1.2,life:.4,size:.22,size1:0,bright:1.8});
    if(n%3===0)burst(SMK,TMP2.set(x,y+.3,z),1,{colors:[0xd8ffb0],speed:.4,up:1.2,life:1,size:.6,size1:1.6});},180);return res;};
// RESECT: red breakdown crackle when he takes someone apart
const _fxDis=disO;disO=function(f,o){const ok=_fxDis.apply(this,arguments);if(ok!==false&&o){const c=o.chest(new V3());crackle(c,0xff2a3a);impactLines(c,0xff4a5a,8);}return ok;};
// DECREE: the order appears written in the air
if(typeof giveOrder==='function'){const _fxGo=giveOrder;giveOrder=function(f,k,heard,opt){const r=_fxGo.apply(this,arguments);try{const O=ORDERS[k];if(!O||!f)return r;
  const T=opt&&opt.tid>=0?FS.find(q=>q.id===opt.tid):null;glyph(k==='law'?'§ LAW':O.name,f.pos.clone().add(new V3(0,3,0)),0xffd86a,1,1.6);if(T)glyph(k==='law'?'IF YOU MOVE…':O.name,T.pos.clone().add(new V3(0,2.8,0)),0xffd86a,.8,1.6);}catch(_){}return r;};}
// CRIMSON: the disguise melts on and off
if(typeof disguise==='function'){const _fxDg=disguise;disguise=function(f,T,d){goo(f.pos.clone(),0xc4102a,18);return _fxDg.apply(this,arguments);};
  const _fxUd=undisguise;undisguise=function(f){if(f&&f.dg)goo(f.pos.clone(),0xc4102a,14,false);return _fxUd.apply(this,arguments);};}

onEv('hit',(a,d,dmg)=>{if(!a||!d)return;const c=d.chest(new V3());
  if(heroIs(d,'cushion')&&d.absT>0){ring(c,0xffd23f,1.4,.25,false,2.2);ring(c,0xffa21a,2.2,.35,false,2);}
  if(heroIs(a,'oldguard')&&a.state==='special'&&dmg>6)impactLines(c,0xffffff,12);
  if((heroIs(a,'crimson')||heroIs(a,'verdict'))&&dmg>3)burst(SMK,c,6,{colors:[0x9a0a1a,0xc4102a],speed:3,up:1,life:.5,size:.14,size1:.06,grav:16});});

onEv('ult',f=>{if(heroIs(f,'solstice'))aura(f,0xbfefff,0xff6a1a,1.6);if(heroIs(f,'zanshin'))setTimeout(()=>{if(inMatch()&&!f.dead)aura(f,0xff2a3a,0x1a0a10,f.ultAlt?8.5:13);},800);
  if(heroIs(f,'snare'))f._eyeT=3;if(heroIs(f,'headliner'))aura(f,0xffd86a,0xffffff,1.2);});

// per-frame looks while a move is running
onEv('tick',dt=>{for(const f of FS){if(f.dead)continue;
  // PISTON: blue-white engine flames from the calves + speed trail during Recipro / ult
  if(heroIs(f,'piston')&&(inSp(f,'recipro')||f.state==='ult')){[f.rig.lK,f.rig.rK].forEach(q=>{if(!q)return;q.getWorldPosition(TMP2);burst(ADD,TMP2,2,{colors:[0x9ad8ff,0xffffff,0x3a8aff],speed:2.5,life:.25,size:.35,size1:0,bright:2.8});});trailOn(f,0x7ac8ff,.3);}
  // SNARE: red eyes while erasing (stare trait) or during his ultimate
  if(heroIs(f,'snare')){f._eyeT=Math.max(0,(f._eyeT||0)-dt);fxEyes(f,0xff2a2a,!!f._gz||f._eyeT>0||(f.state==='ult'));}
  // SOLSTICE heat flash: a roaring fire jet from his left side
  if(heroIs(f,'solstice')&&inSp(f,'glacier','alt')&&f.stateT<.4){const fw=f.fwd(),c=f.chest(new V3());for(let i=0;i<6;i++){const d=fw.clone().applyAxisAngle(UP,rand(-.5,.5));burst(ADD,c,1,{colors:[0xff6a1a,0xffd23f,0xff3a1a],speed:rand(10,18),life:.35,size:.5,size1:.1,bright:2.6,dir:d});}}
  // SAWBACK: sparks off the blade bundle
  if(heroIs(f,'sawback')&&(inSp(f,'cleave')||f.state==='ult')&&Math.random()<.7){const c=f.chest(new V3()).addScaledVector(f.fwd(),1.4);burst(ADD,c,3,{colors:[0xffe8a0,0xffffff],speed:5,life:.25,size:.1,size1:0,bright:2.6,grav:12});}
  // VERDICT / CRIMSON: red after-trail on their lunges
  if((heroIs(f,'verdict')||heroIs(f,'crimson'))&&(f.state==='special'||f.state==='ult')&&Math.hypot(f.vel.x,f.vel.z)>10)trailOn(f,0xff1a3a,.45);
  // HEADLINER: golden flight trail · HOPSTAR: leap trail and music notes during her show
  if(heroIs(f,'headliner')&&(inSp(f,'flyby')||f.state==='ult')&&Math.hypot(f.vel.x,f.vel.y,f.vel.z)>12)trailOn(f,0xffd86a,.7);
  if(heroIs(f,'hopstar')){if(inSp(f,'skyhop')&&!f.onGround)trailOn(f,0xb06aff,.4);if(f.state==='ult'&&!f.ultAlt&&Math.random()<dt*5)glyph(pick(['♪','♫','♬']),f.pos.clone().add(new V3(rand(-2.5,2.5),rand(1.5,3),rand(-2.5,2.5))),pick([0xb06aff,0x6affe0]),.7,1.2);}
  // ZANSHIN: flash step leaves an after-image streak
  if(heroIs(f,'zanshin')&&inSp(f,'crescent','alt')&&f.stateT<.12){if(!f._fsp)f._fsp=f.chest(new V3());}else if(f._fsp&&heroIs(f,'zanshin')){trailSeg(f._fsp,f.chest(new V3()),0xff2a3a,.5,.35);f._fsp=null;}
  if(f.state!=='special'&&f.state!=='ult')f._tr=null;}});
onEv('matchEnd',()=>FS.forEach(f=>{f._aura=null;f._tr=null;if(f._eyes)f._eyes.visible=false;}));
