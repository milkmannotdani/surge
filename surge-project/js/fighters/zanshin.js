/* ZANSHIN — a spirit swordsman with a huge black greatsword that fires crescent waves of spirit energy.
   Original design (long black battle coat with a torn red-lined hem, silver hair, a jagged black greatsword);
   credited in credits.js as inspired by Ichigo Kurosaki from Bleach by Tite Kubo.
   FINAL RELEASE turns the greatsword into a slim black blade: he gets much faster, and every swing throws a crescent. */
Object.assign(SPNAME,{crescent:'CRESCENT FANG'});
Object.assign(HERO_SND,{zanshin:'blade'});
Object.assign(ULT_RANGE,{finalrelease:20});
Object.assign(SPECIAL_AI,{crescent:[3,20,.6]});
Object.assign(XSPK,{crescent:1});
Object.assign(DULT_OF,{zanshin:'vengeance'});
const ZC=0x1a0a10,ZR=0xff2a3a,ZW=0xfff0f0;

/* ---------- crescent waves ---------- */
const CRS=[];let crsGeo=null;
function crescent(f,dir,o){o=o||{};if(!crsGeo)crsGeo=new THREE.TorusGeometry(1,.16,6,28,Math.PI*.95);
  const s=o.size||1,g=new THREE.Group();
  const core=new THREE.Mesh(crsGeo,new THREE.MeshBasicMaterial({color:o.black?ZC:ZW,transparent:true,opacity:.95,depthWrite:false}));
  const glow=new THREE.Mesh(crsGeo,new THREE.MeshBasicMaterial({color:ZR,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(1.12,1.12,2.2);
  g.add(core);g.add(glow);g.scale.setScalar(1.6*s);const c=f.chest(new V3());g.position.copy(c).addScaledVector(dir,.8);g.position.y=c.y-.1;
  g.rotation.set(0,Math.atan2(dir.x,dir.z),0);g.rotateX(Math.PI/2);g.rotateZ(Math.PI*.025+(o.tilt||0));scene.add(g);
  CRS.push({f,g,dir:dir.clone(),sp:o.speed||34,life:o.life||.7,t:0,dmg:o.dmg||12,w:1.4*s,hs:new Set(),kb:o.kb||10});
  xSnd(f.pos,()=>{AU.whoosh(true);SND.blade.spec&&SND.blade.spec();});}
onEv('tick',dt=>{for(let i=CRS.length-1;i>=0;i--){const C=CRS[i];C.t+=dt;C.g.position.addScaledVector(C.dir,C.sp*dt);const k=C.t/C.life;
  C.g.children.forEach(m=>m.material.opacity=(m===C.g.children[0]?.95:.7)*(1-k*k));C.g.scale.multiplyScalar(1+dt*.6);
  if(Math.random()<.7)burst(ADD,C.g.position,2,{colors:[ZR,ZW],speed:1.2,life:.3,size:.3,size1:0,bright:2.2});
  if(NET.role!=='client'&&inMatch())for(const o of FS){if(o.dead||ally(o,C.f)||C.hs.has(o))continue;const dx=o.pos.x-C.g.position.x,dz=o.pos.z-C.g.position.z;
    if(Math.hypot(dx,dz)<C.w+.6&&Math.abs(o.pos.y+1-C.g.position.y)<2.2){C.hs.add(o);hitO(C.f,o,{dmg:C.dmg,kb:C.kb,up:6,launch:true,heavy:C.dmg>14,stun:.6});
      burst(ADD,o.chest(new V3()),18,{colors:[ZR,ZW],speed:6,life:.35,size:.25,size1:0,bright:2.4});}}
  if(k>=1||!inMatch()){scene.remove(C.g);C.g.children.forEach(m=>m.material.dispose());CRS.splice(i,1);}}});

/* CRESCENT FANG (1): one big swing that throws a crescent of spirit energy. HOLD to charge a bigger one. */
SPECIALS.crescent=function(f){const t=f.stateT,V=f.vf;
  once(f,.2,()=>{const T=tgtOf(f,26);if(T)faceTo(f,T);const rel=f.relT>0;crescent(f,f.fwd(),{dmg:rel?16:13,size:rel?1.1:1,black:rel,speed:rel?40:34});shake(.2,f.pos);});
  vpose(f,.2,'heavyw','slash');endAt(f,.55);return 10;};
SPECVAR.crescent={
  chg:['GREAT CRESCENT',(f,dt,k)=>{once(f,.28,()=>{const T=tgtOf(f,30);if(T)faceTo(f,T);crescent(f,f.fwd(),{dmg:16+12*k,size:1.4+.8*k,speed:38,life:.8,kb:14,black:f.relT>0});shake(.4+.2*k,f.pos);});
    vpose(f,.28,'heavyw','slash');endAt(f,.65);return 10;}],
  // FLASH STEP (2): vanish and reappear behind a foe with a cut (or dart forward if no one is close)
  alt:['FLASH STEP',f=>{once(f,.06,()=>{const T=tgtOf(f,14);burst(SMK,f.chest(new V3()),12,{colors:[0x1a1a22,0x3a0a12],speed:2,life:.35,size:.4,size1:.1});
      if(T){const d=xDirTo(f,T);f.pos.set(T.pos.x+d.x*1.3,T.pos.y,T.pos.z+d.z*1.3);faceTo(f,T);cutLine(T.chest(new V3()).add(new V3(-.9,.7,0)),T.chest(new V3()).add(new V3(.9,-.7,0)),ZR,.08,.35);
        hitO(f,T,{dmg:9,kb:6,up:4,stun:.6});}
      else{const fw=f.fwd();f.pos.x+=fw.x*8;f.pos.z+=fw.z*8;}
      f.invuln=Math.max(f.invuln,.25);burst(SMK,f.chest(new V3()),12,{colors:[0x1a1a22,0x3a0a12],speed:2,life:.35,size:.4,size1:.1});xSnd(f.pos,()=>AU.whoosh(false));});
    vpose(f,.06,'dash','slash');endAt(f,.35);return 10;}]};

/* FINAL RELEASE (ult): a pillar of black-red spirit, a giant black crescent, then 12 s released:
   the greatsword becomes a slim black blade, he's much faster, and every basic swing throws a crescent */
ULTX.finalrelease={r:20,s(f){f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,2);f.poseKey='charge';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;f.uEnd=t+1.7;}const r=t-V.t0;
    if(r<.9){f.poseKey='charge';if(Math.random()<.9)burst(ADD,TMP2.set(f.pos.x+rand(-.6,.6),f.pos.y+rand(0,3),f.pos.z+rand(-.6,.6)),2,{colors:[ZR,ZC,ZW],speed:1,up:6,life:.5,size:.4,size1:0,bright:2.4});}
    atT(f,'rel',V.t0+.9,()=>{const c=f.chest(new V3());ring(c,ZR,8,.5,false,2.8);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),ZC,9,.5,true,2);shake(.6,c);xSnd(c,()=>AU.boom(true));
      setRelease(f,12);if(f===ME)announceSmall('FINAL RELEASE');});
    atT(f,'big',V.t0+1.2,()=>{const T=tgtOf(f,30);if(T)faceTo(f,T);crescent(f,f.fwd(),{dmg:30,size:2.6,speed:42,life:.9,kb:18,black:true});shake(.7,f.pos);f.poseKey='slash';});
    if(r>1.2)f.poseKey='slash';return 10;}};
function zBlades(f){if(!f.rig)return null;if(f.rig.zB!==undefined)return f.rig.zB;let big=null,slim=null;f.rig.root.traverse(o=>{if(o.userData.zBig)big=o;if(o.userData.zSlim)slim=o;});f.rig.zB=big&&slim?{big,slim}:null;return f.rig.zB;}
function setRelease(f,dur){f.relT=dur;f.hasteT=Math.max(f.hasteT||0,dur);f.powT=Math.max(f.powT||0,dur);f.auraC=ZR;const B=zBlades(f);if(B){B.big.visible=false;B.slim.visible=true;}}
onEv('tick',dt=>{for(const f of FS){if(!(f.relT>0))continue;f.relT-=dt;if(f.relT<=0||f.dead){f.relT=0;const B=zBlades(f);if(B){B.big.visible=true;B.slim.visible=false;}}}});
onEv('matchEnd',()=>FS.forEach(f=>{if(f.relT>0){f.relT=0;const B=zBlades(f);if(B){B.big.visible=true;B.slim.visible=false;}}}));
// released: each basic swing throws a small crescent (host decides; at most one every .3 s)
const _zAtk=Fighter.prototype.attack;
Fighter.prototype.attack=function(k){const r=_zAtk.apply(this,arguments);if(this.relT>0&&heroIs(this,'zanshin')&&NET.role!=='client'&&!(this._zc>game.time)){this._zc=game.time+.3;const f=this;
  setTimeout(()=>{if(inMatch()&&!f.dead)crescent(f,f.fwd(),{dmg:7,size:.7,speed:36,life:.5,kb:7,black:true});},120);}return r;};
// INNER BEAST (alt ult): 8 s of fury — tougher, harder-hitting, and every hit heals him
ALTULT.zanshin={name:'INNER BEAST',r:8,s(f){f.uEnd=1;f.poseKey='charge';},u(f,t){atT(f,'b',.5,()=>{f.beastT=8;f.powT=Math.max(f.powT||0,8);f.armorT=Math.max(f.armorT||0,8);f.auraC=0xff2a3a;
  ring(f.chest(new V3()),ZR,5,.5,false,2.8);shake(.4,f.pos);xSnd(f.pos,()=>AU.boom(false));if(f===ME)announceSmall('INNER BEAST: TOUGHER · STRONGER · HITS HEAL');});return 10;}};
onEv('hit',(a,d,dmg)=>{if(a&&a.beastT>0&&!a.dead&&dmg>0)a.hp=Math.min(100,a.hp+dmg*.35);});
onEv('tick',dt=>{for(const f of FS)if(f.beastT>0)f.beastT-=dt;});
Object.assign(PFX,{zanshin(a,d,t){if(t>=2&&NET.role!=='client')setTimeout(()=>{if(inMatch()&&!a.dead)crescent(a,a.fwd(),{dmg:6,size:.6,speed:34,life:.4,kb:6,black:a.relT>0});},60);}});
Object.assign(PFX_DESC,{zanshin:'charged hits throw a small crescent'});
Object.assign(XMOVES,{zanshin:[['BLADE RUSH','dash','blade','blade',['pierce']],['SKY SPLITTER','slam','blade','blade',['launch']]]});
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.zanshin='Final Release: faster, and every swing throws a crescent';

/* ---------- look: black battle coat, torn red-lined hem, silver hair, jagged greatsword on the back (original) ---------- */
const _mhaPartsZ=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsZ(h,X);if(h.id!=='zanshin')return out;const {M,head,spine}=X;
  const coat=new THREE.MeshStandardMaterial({color:0x0e0c10,roughness:.85,side:THREE.FrontSide}),lin=new THREE.MeshStandardMaterial({color:0x3a060c,roughness:.8,side:THREE.BackSide}),
    blk=new THREE.MeshStandardMaterial({color:0x101014,metalness:.85,roughness:.3}),edge=new THREE.MeshStandardMaterial({color:0xe8e8f0,metalness:.95,roughness:.15}),
    grip=new THREE.MeshStandardMaterial({color:0x3a0a12,roughness:.7});
  const hair=M(new THREE.SphereGeometry(.17,12,8),new THREE.MeshStandardMaterial({color:0xd8d8e0,roughness:.6}));hair.scale.set(1,.55,1.05);hair.position.set(0,.24,-.01);head.add(hair);
  const tail=M(new THREE.CylinderGeometry(.28,.5,1.3,18,1,true,Math.PI/2+.3,Math.PI-.6),coat);tail.position.set(0,-.3,-.02);spine.add(tail);
  const tl=M(new THREE.CylinderGeometry(.275,.49,1.28,18,1,true,Math.PI/2+.32,Math.PI-.64),lin);tl.position.set(0,-.3,-.01);spine.add(tl);
  for(let k=0;k<7;k++){const s=M(new THREE.BoxGeometry(.1,rand(.12,.3),.01),coat);const a=Math.PI/2+.45+k*.32;s.position.set(Math.sin(a)*.5,-.98,Math.cos(a)*.5);s.rotation.y=a;spine.add(s);}
  // the greatsword: wide black blade with a jagged spine and a silver edge
  const big=new THREE.Group();const bl=M(new THREE.BoxGeometry(.3,1.35,.03),blk);bl.position.y=.68;big.add(bl);const eg=M(new THREE.BoxGeometry(.04,1.35,.035),edge);eg.position.set(.15,.68,0);big.add(eg);
  for(let k=0;k<5;k++){const tooth=M(new THREE.ConeGeometry(.05,.12,4),blk);tooth.rotation.z=Math.PI/2;tooth.position.set(-.17,.25+k*.24,0);big.add(tooth);}
  const hd=M(new THREE.CylinderGeometry(.03,.03,.32,8),grip);hd.position.y=-.14;big.add(hd);const gd=M(new THREE.BoxGeometry(.36,.05,.06),blk);gd.position.y=.02;big.add(gd);
  big.position.set(.05,.15,-.24);big.rotation.z=.5;spine.add(big);
  // the released blade: slim, all black, red glow along the edge
  const slim=new THREE.Group();const sb=M(new THREE.BoxGeometry(.07,1.25,.02),blk);sb.position.y=.63;slim.add(sb);const se=M(new THREE.BoxGeometry(.015,1.25,.025),new THREE.MeshBasicMaterial({color:ZR}));se.position.set(.035,.63,0);slim.add(se);
  const sh=M(new THREE.CylinderGeometry(.025,.025,.28,8),grip);sh.position.y=-.12;slim.add(sh);slim.position.set(.05,.15,-.24);slim.rotation.z=.5;slim.visible=false;spine.add(slim);
  big.userData.zBig=1;slim.userData.zSlim=1;return out;};
