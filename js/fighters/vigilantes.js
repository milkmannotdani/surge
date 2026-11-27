/* VIGILANTES — street heroes without licenses. Original designs; credited in credits.js as inspired by characters
   from My Hero Academia: Vigilantes (Hideyuki Furuhashi & Betten Court, based on Kōhei Horikoshi's series).
     OLD GUARD  ← Knuckleduster   a powerless veteran brawler: vital-point punches, counters, sheer grit
     HOPSTAR    ← Pop☆Step        a street idol with a huge leap: sky hops, stomps, a show that stuns the crowd
     HEADLINER  ← Captain Celebrity  a flying showman: flying punches, camera flashes, a spotlight premiere
   Every fighter with vig:true in roster.js shows under the VIGILANTES tab. */
Object.assign(SPNAME,{vital:'VITAL STRIKE',skyhop:'SKY HOP',flyby:'FLYING PUNCH'});
Object.assign(HERO_SND,{oldguard:'power',hopstar:'wind',headliner:'light'});
Object.assign(ULT_RANGE,{beatdown:6,showstopper:10,premiere:24});
Object.assign(SPECIAL_AI,{vital:[0,5,.6],skyhop:[4,18,.55],flyby:[4,20,.55]});
Object.assign(XSPK,{vital:1,skyhop:1,flyby:1});
Object.assign(DULT_OF,{oldguard:'vengeance',hopstar:'barrage',headliner:'nova'});
for(const k of ['oldguard','hopstar','headliner'])if(!SND[HERO_SND[k]])HERO_SND[k]='power';

/* ================= OLD GUARD ================= */
// VITAL STRIKE (1): a short lunge into one precise punch — breaks guards, ignores armor, staggers hard
SPECIALS.vital=function(f){const t=f.stateT,V=f.vf;
  if(t<.18){f.poseKey='charge';if(!V.d){V.T=tgtOf(f,6);V.d=xDirTo(f,V.T);f.face=Math.atan2(V.d.x,V.d.z);}return 14;}
  if(t<.34&&!V.hit){f.poseKey='smashh';f.vel.x=V.d.x*16;f.vel.z=V.d.z*16;
    for(const o of foes(f,1.9,null,.3)){V.hit=1;f.vel.x*=.1;f.vel.z*=.1;const a=o.armorT;o.armorT=0;
      hitO(f,o,{dmg:15,kb:9,up:4,stun:1.2,gb:true,heavy:true});if(a)o.armorT=a*.5;
      const c=o.chest(new V3());ring(c,0xffd23f,2.4,.25,false,2.6);burst(ADD,c,24,{colors:[0xffd23f,0xffffff],speed:7,life:.3,size:.22,size1:0,bright:2.4});shake(.3,c);
      xSnd(c,()=>AU.hit(1.6));if(f===ME)announceSmall('VITAL POINT!');break;}return 6;}
  f.poseKey='heavyh';if(t>.62)f.set(f.onGround?'idle':'air');return 10;};
// IRON COUNTER (2): brace for a moment — the first hit that lands is answered with a crushing counter
SPECVAR.vital={alt:['IRON COUNTER',f=>{const V=f.vf;if(!V.on){V.on=1;f.counterT=.8;f.armorT=Math.max(f.armorT||0,.8);ring(f.chest(new V3()),0xc8c8d0,1.8,.3,false,2.2);}
  f.poseKey=f.counterT>0?'block':'smashh';endAt(f,.9);return 10;}]};
onEv('hit',(a,d)=>{if(!d||!(d.counterT>0)||!a||a===d||NET.role==='client')return;d.counterT=0;const A=a;
  setTimeout(()=>{if(!inMatch()||d.dead||A.dead)return;faceTo(d,A);d.poseKey='smashh';hitO(d,A,{dmg:18,kb:14,up:8,launch:true,heavy:true,stun:.9,gb:true});
    ring(A.chest(new V3()),0xffd23f,2.6,.3,false,2.6);xSnd(A.pos,()=>AU.hit(1.7));if(d===ME||A===ME)announceSmall('COUNTER!');},40);});
onEv('tick',dt=>{for(const f of FS){if(f.counterT>0)f.counterT-=dt;if(f.gritT>0){f.gritT-=dt;if(!f.dead&&f.hp<1)f.hp=1;}}});
// BACK-ALLEY BEATDOWN (ult): grabs the closest foe for a flurry of punches and a final uppercut
ULTX.beatdown={r:6,s(f){f.vf.T=foes(f,6)[0]||null;f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,3);f.poseKey='charge';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;f.uEnd=t+(V.T?2.2:.8);}const r=t-V.t0,T=V.T;
    if(!T||T.dead){f.poseKey='heavyh';return 10;}
    const fw=f.fwd();if(r<1.6){T.pos.set(f.pos.x+fw.x*1.3,f.pos.y,f.pos.z+fw.z*1.3);T.vel.set(0,0,0);if(NET.role!=='client'&&T.state!=='hit')T.set('hit');}
    for(let k=0;k<9;k++)atT(f,'p'+k,V.t0+.2+k*.15,()=>{f.poseKey=k%2?'smashh':'heavyh';const c=T.chest(new V3());burst(ADD,c,10,{colors:[0xffd23f,0xffffff],speed:5,life:.2,size:.18,size1:0,bright:2.2});
      hitO(f,T,{dmg:3,kb:0,up:0,stun:.4,noSpark:true});xSnd(c,()=>AU.hit(.9+k*.05));});
    atT(f,'up',V.t0+1.65,()=>{f.poseKey='airh';const c=T.chest(new V3());ring(c,0xffd23f,3.4,.35,false,2.8);shake(.5,c);hitO(f,T,{dmg:18,kb:6,up:20,launch:true,heavy:true,stun:1});xSnd(c,()=>AU.boom(false));if(f===ME)announceSmall('BEATDOWN!');});
    return 10;}};
// GRIT (alt ult): 8 s where hits can't knock him out, and he hits harder
ALTULT.oldguard={name:'GRIT',r:6,s(f){f.uEnd=.9;f.poseKey='command';},u(f,t){atT(f,'g',.4,()=>{f.gritT=8;f.powT=Math.max(f.powT||0,8);f.auraC=0xffd23f;ring(f.chest(new V3()),0xffd23f,3,.4,false,2.6);
  if(f===ME)announceSmall('GRIT: NOTHING PUTS YOU DOWN FOR 8 S');});return 10;}};
const _vigHit=applyHit;
applyHit=function(att,def,o){if(def&&def.gritT>0&&o&&o.dmg){o=Object.assign({},o);o.dmg=Math.min(o.dmg,Math.max(0,(def.hp-1)/2.2));}return _vigHit(att,def,o);};

/* ================= HOPSTAR ================= */
const HPC=0xb06aff,HPA=0x6affe0;
function hopLand(f,r,dmg,hs){const p=new V3(f.pos.x,f.pos.y+.2,f.pos.z);ring(p,HPC,r,.35,true,2.6);ring(p,HPA,r*.7,.3,true,2.4);dust(f.pos,14,1.2);shake(.25,p);xSnd(p,()=>AU.hit(1.3));
  for(const o of foes(f,r)){if(hs&&hs.has(o))continue;if(hs)hs.add(o);hitO(f,o,{dmg,kb:9,up:10,launch:true,stun:.6});}}
// her jumps follow an exact arc (specials normally fall slowly), so she lands right where she aimed
const HG=34;
function hopArc(f,dt,V){const t=f.stateT-V.t0;const y=V.y0+V.vy*t-.5*HG*t*t;f.pos.x=V.x0+V.vx*t;f.pos.z=V.z0+V.vz*t;f.vel.set(0,0,0);f.onGround=false;
  const fl=floorAt(f.pos.x,f.pos.z,Math.max(y,V.y0)+1);if(t>.12&&V.vy-HG*t<0&&y<=fl+.02){f.pos.y=fl;f.onGround=true;return true;}f.pos.y=Math.max(y,fl);return false;}
function hopTo(f,V,dist,vy,dir){V.t0=f.stateT;V.vy=vy;V.x0=f.pos.x;V.y0=f.pos.y;V.z0=f.pos.z;const T=2*vy/HG,h=Math.min(dist,22)/T;V.vx=dir.x*h;V.vz=dir.z*h;}
// SKY HOP (1): a huge arcing leap that lands right on a foe, with a stomp
SPECIALS.skyhop=function(f,dt){const V=f.vf;dt=dt||1/60;
  if(!V.go){V.go=1;const T=tgtOf(f,22),dir=xDirTo(f,T),d=T?Math.hypot(T.pos.x-f.pos.x,T.pos.z-f.pos.z):10;f.face=Math.atan2(dir.x,dir.z);
    hopTo(f,V,d,14,dir);ring(new V3(f.pos.x,f.pos.y+.1,f.pos.z),HPA,2.4,.3,true,2.4);xSnd(f.pos,()=>AU.whoosh(true));}
  if(!V.land){f.poseKey=f.stateT-V.t0<.12?'charge':'airh';if(Math.random()<.5)burst(ADD,f.chest(TMP2),1,{colors:[HPC,HPA],speed:.4,life:.4,size:.25,size1:0,bright:2});
    if(hopArc(f,dt,V)||f.stateT>2){V.land=f.stateT;hopLand(f,4,12);}return 6;}
  f.poseKey='slamLand';if(f.stateT>V.land+.25)f.set('idle');return 10;};
// ENCORE (2): three quick bouncing hops toward a foe, a shockwave on every landing
SPECVAR.skyhop={alt:['ENCORE',(f,dt)=>{const V=f.vf;dt=dt||1/60;
  if(!V.n){V.n=1;V.hs=new Set();const T=tgtOf(f,14),dir=xDirTo(f,T);V.dir=dir;f.face=Math.atan2(dir.x,dir.z);hopTo(f,V,4,8,dir);}
  f.poseKey='airh';
  if(V.n<=3&&hopArc(f,dt,V)){hopLand(f,V.n===3?3.4:2.6,V.n===3?9:6,null);V.n++;if(V.n<=3)hopTo(f,V,4,8,V.dir);}
  if(V.n>3||f.stateT>3){f.poseKey='slamLand';f.set(f.onGround?'idle':'air');}return 6;}]};
// SHOWSTOPPER (ult): a 4-second show — sound rings pulse out, dazing and hurting foes, cheering up allies
ULTX.showstopper={r:10,s(f){f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,1);f.poseKey='command';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;f.uEnd=t+4.3;}const r=t-V.t0;f.vel.x*=.8;f.vel.z*=.8;f.poseKey=Math.floor(r*3)%2?'showcase':'command';
    for(let k=0;k<8;k++)atT(f,'b'+k,V.t0+.2+k*.5,()=>{const c=f.chest(new V3());ring(c,k%2?HPC:HPA,10,.45,false,2.6);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),HPA,10,.45,true,2.2);
      for(let j=0;j<6;j++)burst(ADD,TMP2.set(f.pos.x+rand(-3,3),f.pos.y+rand(1,3),f.pos.z+rand(-3,3)),2,{colors:[HPC,HPA,0xffffff],speed:1,up:2,life:.6,size:.3,size1:0,bright:2.2});
      if(typeof AU!=='undefined'&&AU.ctx&&AU.mBus&&typeof OR!=='undefined'){const n=[74,77,81,79,77,74,72,74][k];sndHere(f,()=>{OR.choir(mtof(n),0,.45,.05,AU.sfx);OR.bell(mtof(n+12),0,.05,AU.sfx);});}
      if(NET.role==='client')return;for(const o of foes(f,10)){hitO(f,o,{dmg:4,kb:2,up:2,stun:.55,noSpark:true});o.slowT=Math.max(o.slowT||0,1.5);}
      for(const q of FS)if(!q.dead&&q!==f&&ally(q,f)&&q.pos.distanceTo(f.pos)<10)q.hp=Math.min(100,q.hp+3);f.hp=Math.min(100,f.hp+2);});
    return 10;}};
// SKY HIGH (alt ult): launch sky-high, then dive-bomb the nearest foe with a huge stomp
ALTULT.hopstar={name:'SKY HIGH',r:20,s(f){f.uEnd=99;f.vf.t0=null;f.poseKey='charge';f.invuln=Math.max(f.invuln,2.5);},u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;V.T=foes(f,20)[0]||null;f.vel.set(0,30,0);f.onGround=false;f.pos.y+=.1;xSnd(f.pos,()=>AU.whoosh(true));}
  const r=t-V.t0;f.poseKey=r<.9?'airh':'slamAir';
  if(r>.9&&!V.dive){V.dive=1;const p=V.T&&!V.T.dead?V.T.pos:f.pos.clone().addScaledVector(f.fwd(),6);const d=new V3(p.x-f.pos.x,0,p.z-f.pos.z);f.vel.set(d.x*1.6,-34,d.z*1.6);}
  if(V.dive&&!V.land&&f.vel.y<0){f.vel.y=-34;}if(V.dive&&(f.onGround||r>3||f.pos.y<=floorAt(f.pos.x,f.pos.z,f.pos.y+1)+.1)&&!V.land){V.land=1;hopLand(f,7,24);f.uEnd=t+.4;if(f===ME)announceSmall('SKY HIGH!');}
  if(r>.9&&!V.land&&Math.random()<.8)burst(ADD,f.chest(TMP2),2,{colors:[HPC,HPA],speed:.5,life:.4,size:.35,size1:0,bright:2.2});return 6;}};

/* ================= HEADLINER ================= */
const HLG=0xffd86a,HLW=0xfff4d8;
// FLYING PUNCH (1): rockets in a straight line toward a foe, fist first
SPECIALS.flyby=function(f){const t=f.stateT,V=f.vf;
  if(!V.d){const T=tgtOf(f,20);V.d=T?new V3(T.chest(new V3()).x-f.chest(new V3()).x,T.chest(new V3()).y-f.chest(new V3()).y,T.chest(new V3()).z-f.chest(new V3()).z).normalize():f.fwd();V.hs=new Set();f.face=Math.atan2(V.d.x,V.d.z);xSnd(f.pos,()=>AU.whoosh(true));}
  if(t<.55){f.poseKey='fly';f.vel.set(V.d.x*30,V.d.y*30+2,V.d.z*30);f.onGround=false;if(Math.random()<.8)burst(ADD,f.chest(TMP2),2,{colors:[HLG,HLW],speed:.6,life:.3,size:.28,size1:0,bright:2.2});
    for(const o of foes(f,1.9))if(!V.hs.has(o)){V.hs.add(o);hitO(f,o,{dmg:13,kb:14,up:7,launch:true,heavy:true,stun:.7});ring(o.chest(new V3()),HLG,2.4,.3,false,2.6);shake(.3,o.pos);}return 6;}
  f.poseKey='airh';f.vel.x*=.7;f.vel.z*=.7;if(t>.75)f.set(f.onGround?'idle':'air');return 10;};
// PHOTO OP (2): strikes a pose — a blinding camera flash dazes every foe in front of him
SPECVAR.flyby={alt:['PHOTO OP',f=>{if(!f.vf.fc){f.vf.fc=1;const T=tgtOf(f,12);if(T)faceTo(f,T);}once(f,.25,()=>{const c=f.chest(new V3());ring(c,0xffffff,6,.25,false,3);burst(ADD,c,40,{colors:[0xffffff,HLG],speed:9,life:.3,size:.3,size1:0,bright:3});
    if(f===ME||(ME&&ME.pos.distanceTo(f.pos)<12))screenFlash(.55,f.pos);xSnd(f.pos,()=>AU.shutter&&AU.shutter(3));
    if(NET.role!=='client')for(const o of foes(f,9,null,-.1))hitO(f,o,{dmg:5,kb:3,up:1,stun:1.1,noSpark:true});});
  vpose(f,.25,'showcase','point');endAt(f,.7);return 10;}]};
// GRAND PREMIERE (ult): rises into the sky, spotlights lock onto every foe nearby, then comet-dives through the brightest
ULTX.premiere={r:24,s(f){f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,3);f.poseKey='command';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;V.L=foes(f,24).slice(0,6);f.vel.set(0,16,0);f.onGround=false;f.pos.y+=.1;f.uEnd=t+3;}const r=t-V.t0;
    if(r<.6){f.poseKey='fly';}else if(r<1.9){f.vel.set(0,0,0);f.poseKey='showcase';}
    V.L.forEach((o,i)=>atT(f,'s'+i,V.t0+.7+i*.12,()=>{if(o.dead)return;const p=o.pos.clone();const col=new THREE.Mesh(new THREE.CylinderGeometry(.4,1.6,26,16,1,true),new THREE.MeshBasicMaterial({color:HLW,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      col.position.set(p.x,p.y+13,p.z);scene.add(col);let k=0;const iv=setInterval(()=>{k+=.04;if(!o.dead)col.position.set(o.pos.x,o.pos.y+13,o.pos.z);col.material.opacity=.35+(k>.7?.5:0);
        if(k>=1){clearInterval(iv);scene.remove(col);col.geometry.dispose();col.material.dispose();if(NET.role!=='client'&&!o.dead&&inMatch()){hitO(f,o,{dmg:14,kb:4,up:10,launch:true,stun:.8});burst(ADD,o.chest(new V3()),24,{colors:[HLG,0xffffff],speed:7,life:.4,size:.3,size1:0,bright:2.6});}}},40);}));
    atT(f,'dive',V.t0+1.9,()=>{const T=V.L.find(o=>!o.dead);const p=T?T.pos:f.pos.clone().addScaledVector(f.fwd(),8);const d=new V3(p.x-f.pos.x,p.y-f.pos.y,p.z-f.pos.z);V.dd=d.normalize();});
    if(V.dd&&!V.hitG){f.poseKey='fly';f.vel.set(V.dd.x*40,V.dd.y*40,V.dd.z*40);burst(ADD,f.chest(TMP2),3,{colors:[HLG,HLW],speed:.6,life:.35,size:.4,size1:0,bright:2.4});
      if(f.onGround||r>2.8){V.hitG=1;const c=new V3(f.pos.x,f.pos.y+.4,f.pos.z);explosion(c,3,[HLG,0xffffff,0xff9a3a]);shake(.6,c);xSnd(c,()=>AU.boom(true));
        for(const o of foes(f,6))hitO(f,o,{dmg:22,kb:14,up:12,launch:true,heavy:true,stun:.9});f.uEnd=t+.4;if(f===ME)announceSmall('GRAND PREMIERE!');}}
    return 6;}};
// FAN SERVICE (alt ult): the crowd goes wild — heals 30 and pumps him up (faster + stronger) for 8 s
ALTULT.headliner={name:'FAN SERVICE',r:8,s(f){f.uEnd=1.1;f.poseKey='showcase';},u(f,t){atT(f,'c',.5,()=>{f.hp=Math.min(100,f.hp+30);f.powT=Math.max(f.powT||0,8);f.hasteT=Math.max(f.hasteT||0,8);f.auraC=HLG;
  for(let j=0;j<20;j++)burst(ADD,TMP2.set(f.pos.x+rand(-4,4),f.pos.y+rand(.5,3),f.pos.z+rand(-4,4)),2,{colors:[HLG,0xffffff,0xff6ab0],speed:2,up:3,life:.7,size:.25,size1:0,bright:2.2});
  if(typeof AU!=='undefined'&&AU.fanfare)sndHere(f,()=>AU.fanfare());if(f===ME)announceSmall('FAN SERVICE: +30 HP · FASTER · STRONGER');});return 10;}};

Object.assign(PFX,{oldguard(a,d,t){if(t>=2)d.slowT=Math.max(d.slowT||0,1);},hopstar(a,d,t){if(t>=2&&!a.onGround)d.vel.y-=8;},headliner(a,d,t){if(t>=2)d.vel.addScaledVector(a.fwd(),6);}});
Object.assign(PFX_DESC,{oldguard:'charged hits stagger and slow',hopstar:'charged air hits spike foes into the ground',headliner:'charged hits send foes flying'});
Object.assign(XMOVES,{
  oldguard:[['HAYMAKER','dash','metal','orb',['stun']],['TAKEDOWN','grab','earth','orb',['stun']]],
  hopstar:[['BEAT DROP','slam','sound','ring',['launch']],['HIGH NOTE','wave','sound','ring',['slow']]],
  headliner:[['STAR TURN','burst','light','ring',['push']],['SPOTLIGHT','beam','light','arrow',['stun']]]});

/* ---------- looks (all original designs) ---------- */
const _mhaPartsV=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsV(h,X);const id=h.id;if(id!=='oldguard'&&id!=='hopstar'&&id!=='headliner')return out;const {M,head,spine,lF,rF,lS,rS}=X;
  const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6},o||{}));
  if(id==='oldguard'){ // brown bomber jacket collar, short-brim cap, white beard, steel knuckle plates
    const cap=M(new THREE.CylinderGeometry(.17,.18,.08,20),mat(0x3a3028));cap.position.set(0,.25,0);head.add(cap);const brim=M(new THREE.BoxGeometry(.24,.02,.12),mat(0x3a3028));brim.position.set(0,.22,.14);head.add(brim);
    const beard=M(new THREE.SphereGeometry(.12,14,10,0,Math.PI*2,Math.PI*.45,Math.PI*.55),mat(0xe8e4dc,{roughness:.95}));beard.position.set(0,.06,.07);head.add(beard);
    const col=M(new THREE.TorusGeometry(.17,.05,8,20),mat(0x6a4a2a,{roughness:.8}));col.rotation.x=Math.PI/2;col.position.set(0,.62,0);spine.add(col);
    [lF,rF].forEach(F=>{if(!F)return;const k=M(new THREE.BoxGeometry(.11,.035,.06),mat(0xc8ccd4,{metalness:.9,roughness:.25}));k.position.set(0,-.38,.05);F.add(k);});}
  if(id==='hopstar'){ // over-ear headphones with a glowing band, music-note hair clips, a short layered skirt
    const band=M(new THREE.TorusGeometry(.19,.018,8,24,Math.PI),new THREE.MeshBasicMaterial({color:HPA}));band.position.set(0,.14,0);head.add(band);
    [-1,1].forEach(s=>{const cup=M(new THREE.CylinderGeometry(.07,.07,.05,16),mat(HPC,{emissive:HPC,emissiveIntensity:.5}));cup.rotation.z=Math.PI/2;cup.position.set(s*.18,.12,0);head.add(cup);});
    const note=M(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:HPA}));note.position.set(.1,.27,.06);head.add(note);const stem=M(new THREE.BoxGeometry(.012,.09,.012),new THREE.MeshBasicMaterial({color:HPA}));stem.position.set(.13,.31,.06);head.add(stem);
    const sk=M(new THREE.CylinderGeometry(.22,.34,.22,18,1,true),mat(HPC,{side:THREE.DoubleSide}));sk.position.set(0,-.12,0);spine.add(sk);}
  if(id==='headliner'){ // gold-and-white showman: tinted shades, slicked crest, a long cape with a spotlight lining
    const sh=M(new THREE.BoxGeometry(.24,.05,.04),new THREE.MeshStandardMaterial({color:0x101014,metalness:.9,roughness:.1}));sh.position.set(0,.14,.155);head.add(sh);
    const crest=M(new THREE.SphereGeometry(.13,12,8),mat(0xf2d27a,{roughness:.4}));crest.scale.set(.8,.6,1.2);crest.position.set(0,.27,-.02);head.add(crest);
    const cape=M(new THREE.CylinderGeometry(.3,.5,1.2,18,1,true,Math.PI/2+.35,Math.PI-.7),mat(0xf4efe2,{side:THREE.DoubleSide}));cape.position.set(0,0,-.05);spine.add(cape);
    const lin=M(new THREE.CylinderGeometry(.29,.49,1.18,18,1,true,Math.PI/2+.4,Math.PI-.8),mat(HLG,{side:THREE.DoubleSide,emissive:HLG,emissiveIntensity:.3}));lin.position.set(0,0,-.04);spine.add(lin);
    [lS,rS].forEach(S=>{if(!S)return;const ep=M(new THREE.SphereGeometry(.1,12,8),mat(HLG,{metalness:.8,roughness:.3}));ep.scale.set(1,.55,1);ep.position.set(0,.04,0);S.add(ep);});}
  return out;};
