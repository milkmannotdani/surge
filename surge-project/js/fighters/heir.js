/* HEIR — successor to a power handed down through generations. Original design (green suit with white accents,
   curly dark-green hair, freckles, constant green lightning); credited in credits.js as inspired by Izuku Midoriya (Deku)
   from My Hero Academia by Kōhei Horikoshi. Moves are original takes on that kind of fighter, with original names.
     1  BLACKWHIP     black tendrils snatch the nearest foe and yank them in — or grapple a wall and pull him there
        hold 1        BLACKWHIP BIND: tendrils seize everyone nearby, bind them and drag them in
     2  GEARSHIFT     spins his speed up through the gears, then rockets through the line with a kick (+4 s of haste)
     3  FA JIN        releases stored kinetic energy: an explosive burst of movement in any direction, even mid-air
     4  SMOKESCREEN   a thick cloud of smoke; while inside it he and his allies can't be targeted from range
     Q  LEGACY STRIKE every inherited power at once, then a single super punch: everyone around the impact is taken
                      out in one hit (story bosses take a huge hit instead). Its own cinematic camera, slow motion, the works.
     Q+back FLICK STORM  air-pressure finger flicks at everyone nearby
   Mode (5): FULL POWER — see FORMS.heir in forms.js. Signature: green lightning always crackles over him. */
const HEIR_G=0x2aff6a,HEIR_G2=0x9affb0,HEIR_W=0xeaffee,HEIR_K=0x050806;
Object.assign(SPNAME,{blackwhip:'BLACKWHIP'});Object.assign(HERO_SND,{heir:'power'});Object.assign(ULT_RANGE,{legacy:22});
Object.assign(SPECIAL_AI,{blackwhip:[3,18,.6]});Object.assign(XSPK,{blackwhip:1});Object.assign(DULT_OF,{heir:'barrage'});
if(typeof PROJ_SIG!=='undefined')PROJ_SIG.heir='ring';
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.heir='inherited power: green lightning makes his kicks and punches hit a little harder';
setTimeout(()=>{try{VCRY.heir=[['Here goes everything!',0],['This is my legacy!',.04]];}catch(e){}},0);
function isHeir(f){return f&&f.hero&&(f.hero.id==='heir');}
function hHand(f){return limbPos(f,'r',new V3());}
function hBolt(a,b,col,w){bolt(a,b,col||HEIR_G,w||.05,.1);}

/* ---------- BLACKWHIP tendrils (dark tubes with a green sheen) ---------- */
const WHIPS=[];
function whip(f,toFn,o){o=o||{};const g=new THREE.Group();scene.add(g);const W={f,toFn,t:0,ext:o.ext||.22,hold:o.hold||.35,ret:.18,n:o.n||3,g,ph:Math.random()*6,onReach:o.onReach,reached:false,meshes:[]};WHIPS.push(W);return W;}
const WHIP_DARK=new THREE.MeshBasicMaterial({color:HEIR_K}),WHIP_GLOW=new THREE.MeshBasicMaterial({color:HEIR_G,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
onEv('tick',dt=>{for(let i=WHIPS.length-1;i>=0;i--){const W=WHIPS[i];W.t+=dt;const f=W.f;const end=W.ext+W.hold+W.ret;
    W.meshes.forEach(m=>{m.geometry.dispose();W.g.remove(m);});W.meshes.length=0;
    if(W.t>=end||!f||f.dead||!inMatch()){scene.remove(W.g);WHIPS.splice(i,1);continue;}
    const a=hHand(f),b=W.toFn();if(!b)continue;let k=W.t<W.ext?W.t/W.ext:W.t<W.ext+W.hold?1:1-(W.t-W.ext-W.hold)/W.ret;k=clamp(k,0,1);
    if(!W.reached&&W.t>=W.ext){W.reached=true;if(W.onReach)W.onReach();}
    if(!nearCam(a,80))continue;
    for(let n=0;n<W.n;n++){const pts=[];const side=new V3(b.z-a.z,0,a.x-b.x).normalize();
      for(let s=0;s<=10;s++){const u=s/10*k,p=a.clone().lerp(b,u);const wob=Math.sin(u*9+W.t*18+n*2.1+W.ph)*.55*(1-u*.6)*Math.sin(u*Math.PI);
        p.addScaledVector(side,wob*(n-1)*.8+wob*.3);p.y+=Math.cos(u*7+n+W.t*14)*.35*Math.sin(u*Math.PI);pts.push(p);}
      if(pts.length<2)continue;const cv=new THREE.CatmullRomCurve3(pts),r=.055*(1-n*.15);
      const m1=new THREE.Mesh(new THREE.TubeGeometry(cv,18,r,5,false),WHIP_DARK),m2=new THREE.Mesh(new THREE.TubeGeometry(cv,18,r*2.1,5,false),WHIP_GLOW);
      W.g.add(m1,m2);W.meshes.push(m1,m2);}
    if(Math.random()<.5){const p=a.clone().lerp(b,k*Math.random());burst(ADD,p,1,{colors:[HEIR_G,HEIR_G2],speed:1,life:.25,size:.18,size1:0,bright:2.4});}}});
onEv('matchEnd',()=>{WHIPS.forEach(W=>{W.meshes.forEach(m=>m.geometry.dispose());scene.remove(W.g);});WHIPS.length=0;});
function yank(f,T,dur){const from=T.pos.clone(),t0=game.time;T.set('hit');
  const step=()=>{if(!inMatch()||T.dead||f.dead)return;const k=Math.min(1,(game.time-t0)/dur),fw=f.fwd(),to=new V3(f.pos.x+fw.x*1.6,f.pos.y,f.pos.z+fw.z*1.6);
    T.pos.lerpVectors(from,to,k*k*(3-2*k));T.vel.set(0,0,0);if(k<1)requestAnimationFrame(step);};step();}

/* 1 — BLACKWHIP */
SPECIALS.blackwhip=function(f){const V=f.vf;
  once(f,.12,()=>{const T=tgtOf(f,20);if(T)faceTo(f,T);const fw=f.fwd(),c=f.chest(new V3());
    if(T){V.T=T;whip(f,()=>T.chest(new V3()),{ext:.2,hold:.4,onReach:()=>{if(T.dead||NET.role==='client')return;hitO(f,T,{dmg:9,kb:0,up:0,stun:1});yank(f,T,.32);burst(ADD,T.chest(new V3()),14,{colors:[HEIR_G,HEIR_K],speed:5,life:.3,size:.3,size1:0,bright:2});}});}
    else{const L=clearLen(f.pos,fw,18,c.y),tip=c.clone().addScaledVector(fw,L);const wall=L<17.5;
      whip(f,()=>tip,{ext:.2,hold:wall?.45:.05,onReach:()=>{if(!wall)return;const from=f.pos.clone(),to=f.pos.clone().addScaledVector(fw,Math.max(0,L-1.2)),t0=game.time;
        const step=()=>{if(!inMatch()||f.dead)return;const k=Math.min(1,(game.time-t0)/.4);f.pos.lerpVectors(from,to,k);f.pos.y=from.y+Math.sin(k*Math.PI)*1.6;f.vel.set(0,0,0);if(k<1)requestAnimationFrame(step);};step();}});}
    xSnd(f.pos,()=>AU.whoosh(false));});
  vpose(f,.12,'specw','spech');endAt(f,.62);return 10;};
SPECVAR.blackwhip={
  chg:['BLACKWHIP BIND',(f,dt,k)=>{once(f,.2,()=>{const L=foes(f,16+4*k).slice(0,4);if(!L.length){const fw=f.fwd(),c=f.chest(new V3());whip(f,()=>c.clone().addScaledVector(fw,12),{n:5,hold:.1});return;}
      L.forEach(T=>whip(f,()=>T.chest(new V3()),{n:2,ext:.22,hold:.55,onReach:()=>{if(T.dead||NET.role==='client')return;hitO(f,T,{dmg:10+8*k,kb:0,up:0,stun:1.4+k*.6});yank(f,T,.45);}}));shake(.3,f.pos);xSnd(f.pos,()=>AU.whoosh(true));});
    vpose(f,.2,'charge','spech');endAt(f,.85);return 10;}],
  // 2 — GEARSHIFT
  alt:['GEARSHIFT',(f,dt)=>{const V=f.vf,t=f.stateT;
    if(t<.38){f.poseKey='charge';if(!V.g){V.g=1;const T=tgtOf(f,20);if(T)faceTo(f,T);}
      const lg=limbPos(f,'f',new V3());if(Math.random()<.7)ring(lg,Math.random()<.5?HEIR_G:HEIR_W,.6+t*1.6,.15,true,2.6);if(Math.random()<.5)hBolt(lg,lg.clone().add(TMP2.set(rand(-.6,.6),rand(-.3,.6),rand(-.6,.6))));
      if(!V.s0&&t>.05){V.s0=1;xSnd(f.pos,()=>{AU.whoosh(false);});}return 10;}
    if(!V.go){V.go=1;V.from=f.pos.clone();const fw=f.fwd();V.to=f.pos.clone().addScaledVector(fw,clearLen(f.pos,fw,14,f.pos.y+1)-.8);V.hit={};f.invuln=Math.max(f.invuln,.35);f.hasteT=Math.max(f.hasteT||0,4);shake(.3,f.pos);xSnd(f.pos,()=>{AU.boom(false);AU.whoosh(true);});
      ring(f.chest(new V3()),HEIR_G,3,.3,false,2.6);}
    const k=Math.min(1,(t-.38)/.22);const prev=f.pos.clone();f.pos.lerpVectors(V.from,V.to,k);f.vel.set(0,0,0);f.poseKey='kickh';
    trailSeg(prev.clone().add(TMP2.set(0,1,0)),f.pos.clone().add(TMP2.set(0,1,0)),HEIR_G,.18,.3);if(Math.random()<.8)hBolt(prev.clone().add(TMP2.set(0,1.1,0)),f.chest(new V3()));
    for(const o of foes(f,2.4)){if(V.hit[o.id])continue;V.hit[o.id]=1;hitO(f,o,{dmg:14,kb:15,up:6,stun:.6,heavy:true});burst(ADD,o.chest(new V3()),20,{colors:[HEIR_G,HEIR_W],speed:9,life:.35,size:.35,size1:0,bright:2.6});}
    endAt(f,.8);return 10;}]};

/* ---------- extra moves with custom code ---------- */
const XCUSTOM={
  // 3 — FA JIN: stored kinetic energy → explosive burst of movement (works in the air)
  fajin(f,dt){const V=f.vf,t=f.stateT;if(!V.go){V.go=1;let d=f.fwd();const I=f.intent;if(I&&(I.wx||I.wz)&&!f.isBot)d=new V3(I.wx,0,I.wz).normalize();
      V.from=f.pos.clone();const L=clearLen(f.pos,d,15,f.pos.y+1);V.to=f.pos.clone().addScaledVector(d,Math.max(0,L-.8));V.air=!f.onGround;V.hit={};
      f.face=Math.atan2(d.x,d.z);f.invuln=Math.max(f.invuln,.28);const c=f.chest(new V3());
      ring(c,HEIR_G,2.4,.25,false,2.6);ring(new V3(f.pos.x,f.pos.y+.15,f.pos.z),HEIR_W,2.8,.3,true,2);burst(ADD,c,26,{colors:[HEIR_G,HEIR_G2,HEIR_W],speed:9,life:.3,size:.3,size1:0,bright:2.6});
      for(let q=0;q<5;q++)hBolt(c,c.clone().add(TMP2.set(rand(-1.4,1.4),rand(-1,1.2),rand(-1.4,1.4))));dust(f.pos,8,.9);shake(.25,f.pos);xSnd(f.pos,()=>{AU.whoosh(true);AU.boom(false);});}
    const k=Math.min(1,t/.2),e=1-(1-k)*(1-k),prev=f.pos.clone();f.pos.lerpVectors(V.from,V.to,e);f.pos.y=V.from.y+(V.air?.4:Math.sin(k*Math.PI)*.8)*k;f.vel.set(0,V.air?2:0,0);f.poseKey='dash';
    if(k<1){trailSeg(prev.clone().add(TMP2.set(0,1,0)),f.pos.clone().add(TMP2.set(0,1,0)),HEIR_G,.12,.22);if(Math.random()<.6)hBolt(prev.clone().add(TMP2.set(0,1,0)),f.chest(new V3()));}
    for(const o of foes(f,1.8)){if(V.hit[o.id])continue;V.hit[o.id]=1;hitO(f,o,{dmg:5,kb:9,up:3,stun:.3});}
    if(t>.3){f.set(f.onGround?'idle':'air');}return 10;},
  // 4 — SMOKESCREEN
  smoke(f,dt){const t=f.stateT;once(f,.12,()=>{smokeCloud(f,f.pos.clone(),7,6);xSnd(f.pos,()=>AU.whoosh(false));});f.poseKey=t<.12?'specw':'spech';endAt(f,.4);return 10;}};
const _hXm=SPECIALS.xm;SPECIALS.xm=function(f,dt){const A=f.xmA;if(A&&A.custom&&XCUSTOM[A.custom])return XCUSTOM[A.custom](f,dt);return _hXm.apply(this,arguments);};

/* ---------- SMOKESCREEN cloud ---------- */
const SMOKES=[];
function smokeCloud(f,p,R,dur){const S={f,p,R,t:0,dur};SMOKES.push(S);burst(SMK,TMP2.set(p.x,p.y+1,p.z).clone(),40,{colors:[0x8a8a8a,0xb0b0b0,0x6a6a6a],speed:6,up:1,life:2.4,size:1.6,size1:4,drag:3,rad:1});}
function inSmoke(o){for(const S of SMOKES){if(ally(o,S.f)||o===S.f){if(Math.hypot(o.pos.x-S.p.x,o.pos.z-S.p.z)<S.R)return true;}}return false;}
onEv('tick',dt=>{for(let i=SMOKES.length-1;i>=0;i--){const S=SMOKES[i];S.t+=dt;if(S.t>S.dur||!inMatch()){SMOKES.splice(i,1);continue;}
  const fade=S.t>S.dur-1.5?(S.dur-S.t)/1.5:1;if(nearCam(S.p,90)&&Math.random()<.9*fade){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*S.R;
    burst(SMK,TMP2.set(S.p.x+Math.cos(a)*r,S.p.y+rand(.3,2.6),S.p.z+Math.sin(a)*r).clone(),2,{colors:[0x8a8a8a,0xa6a6a6,0x707070],speed:.6,up:.4,life:2.2,size:1.8,size1:3.2,drag:1});}}});
// hidden in the smoke: can't be picked as a target from outside 3 m
const _hTgt=tgtOf;tgtOf=function(f,R){const T=_hTgt.apply(this,arguments);if(!T||!SMOKES.length||!inSmoke(T)||T.pos.distanceTo(f.pos)<3)return T;
  let best=null,bd=1e9;for(const o of FS){if(ally(o,f)||o.dead||o.downed||o===f)continue;const d=o.pos.distanceTo(f.pos);if(d>(R||30)||(inSmoke(o)&&d>=3))continue;if(d<bd){bd=d;best=o;}}return best;};
onEv('matchEnd',()=>{SMOKES.length=0;});
// anyone (bot or player lock-on) targeting someone hidden in the smoke from more than 3 m away loses them
onEv('tick',()=>{if(!SMOKES.length)return;for(const f of FS){const T=f.tgt;if(T&&!ally(T,f)&&inSmoke(T)&&T.pos.distanceTo(f.pos)>3){f.tgt=null;if(f.hardLock)f.hardLock=false;}}});
const _hNeIv=setInterval(()=>{if(typeof nearestEnemy!=='function')return;clearInterval(_hNeIv);const _ne=nearestEnemy;nearestEnemy=function(f,maxD){const T=_ne.apply(this,arguments);if(!T||!SMOKES.length||!inSmoke(T)||T.pos.distanceTo(f.pos)<3)return T;
  let best=null,bd=maxD||1e9;for(const o of FS){if(ally(o,f)||o.dead||o.dormant||o===f)continue;const d=Math.hypot(o.pos.x-f.pos.x,o.pos.z-f.pos.z)+(o.downed?6:0);if(d<bd&&!(inSmoke(o)&&d>=3)){bd=d;best=o;}}return best;};},5);

/* ---------- signature: green lightning crackles over him ---------- */
onEv('tick',dt=>{for(const f of FS){if(!isHeir(f)||f.dead||!nearCam(f.pos,40))continue;const busy=f.state==='special'||f.state==='ult'||f.state==='attack'||f.state==='dash';
  if(Math.random()<(busy?.7:.28)){const c=f.chest(new V3()),a=c.clone().add(TMP2.set(rand(-.5,.5),rand(-.9,.8),rand(-.5,.5))),b=a.clone().add(TMP2.set(rand(-.5,.5),rand(-.5,.5),rand(-.5,.5)));hBolt(a,b,Math.random()<.8?HEIR_G:HEIR_W,.035);}}});
onEv('hit',(a,d,dmg)=>{if(isHeir(a)&&d&&dmg>0&&a.state==='attack'&&nearCam(d.pos,40)){const p=d.chest(new V3());for(let q=0;q<2;q++)hBolt(p,p.clone().add(TMP2.set(rand(-1,1),rand(-.6,.9),rand(-1,1))));}});

/* ---------- LEGACY STRIKE (ult) ---------- */
const HCAM={on:false};
ULTX.legacy={r:22,s(f){f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,3);f.poseKey='charge';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;V.y0=f.pos.y;V.T=tgtOf(f,30);if(V.T)faceTo(f,V.T);f.uEnd=t+2.7;f.invuln=Math.max(f.invuln,3);
      if(ME&&(f===ME||f.pos.distanceTo(ME.pos)<40)){HCAM.on=true;HCAM.f=f;HCAM.t0=game.time;HCAM.T=V.T;HCAM.imp=null;}
      if(typeof duckMusic==='function')duckMusic(3);xSnd(f.pos,()=>{AU.whoosh(true);});}
    const r=t-V.t0,c=f.chest(new V3());
    // 1) every inherited power at once (0 – 1.0 s): lightning storm, black tendrils lashing, smoke, he rises
    if(r<1){f.poseKey='charge';f.pos.y=V.y0+r*1.4;f.vel.set(0,0,0);
      for(let q=0;q<3;q++)hBolt(c,c.clone().add(TMP2.set(rand(-2.2,2.2),rand(-1.4,2.4),rand(-2.2,2.2))),Math.random()<.7?HEIR_G:HEIR_W,.06);
      if(Math.random()<.25){const a=Math.random()*6.28;whip(f,()=>c.clone().add(TMP2.set(Math.cos(a)*1.5,rand(-.4,1.2),Math.sin(a)*1.5)),{n:1,ext:.12,hold:.08});}
      if(Math.random()<.5)burst(SMK,TMP2.set(f.pos.x,V.y0+.2,f.pos.z).clone(),2,{colors:[0x8a8a8a,0x5a5a5a],speed:4,up:.5,life:1,size:1,size1:2.4,drag:2});
      if(Math.random()<.6)ring(c,HEIR_G,1+r*3,.2,false,2.8);
      atT(f,'s1',V.t0+.3,()=>{xSnd(f.pos,()=>AU.boom(false));shake(.3,f.pos);});atT(f,'s2',V.t0+.7,()=>{xSnd(f.pos,()=>{AU.zap&&AU.zap(.9);AU.whoosh(true);});shake(.4,f.pos);});
      return 10;}
    // 2) the dive (1.0 – 1.3 s)
    if(r<1.3){if(!V.dv){V.dv=1;const T=V.T&&!V.T.dead?V.T:null,fw=f.fwd();V.from=f.pos.clone();
        V.imp=T?T.pos.clone().addScaledVector(xDirTo(f,T),-1):f.pos.clone().addScaledVector(fw,8);V.imp.y=floorAt(V.imp.x,V.imp.z,V.from.y+2);HCAM.imp=V.imp.clone();xSnd(f.pos,()=>AU.whoosh(true));}
      const k=(r-1)/.3,prev=f.pos.clone();f.pos.lerpVectors(V.from,V.imp,k*k);f.vel.set(0,0,0);f.poseKey='kickh';
      trailSeg(prev.clone().add(TMP2.set(0,1,0)),f.pos.clone().add(TMP2.set(0,1,0)),HEIR_G,.35,.4);hBolt(prev.clone().add(TMP2.set(0,1,0)),f.chest(new V3()),HEIR_W,.08);return 10;}
    // 3) IMPACT (1.3 s): one hit takes out everything around it
    if(!V.imp2){V.imp2=1;const p=V.imp||f.pos.clone();f.pos.copy(p);f.poseKey='slamLand';heirImpact(f,p);}
    f.poseKey=r<1.9?'slamLand':'charge';return 10;}};
function heirImpact(f,p){const R=13,c=TMP3.set(p.x,p.y+1.2,p.z).clone();
  if(NET.role!=='client')for(const o of FS){if(o===f||ally(o,f)||o.dead||o.downed)continue;if(Math.hypot(o.pos.x-p.x,o.pos.z-p.z)>R||Math.abs(o.pos.y-p.y)>8)continue;
    const boss=o.boss||(o.take&&o.take<.6);o.invuln=0;hitO(f,o,{dmg:boss?60:999,kb:32,up:20,launch:true,heavy:true,ult:true,stun:1.5,pt:o.chest(new V3()),_pw:1});}
  // the blast
  explosion(c,5,[HEIR_G,HEIR_G2,0x1a8a3a]);explosion(TMP2.set(p.x,p.y+.6,p.z).clone(),4,[HEIR_G,HEIR_G2,0x0a3a1a]);
  for(let k=0;k<4;k++)setTimeout(()=>{if(!inMatch())return;ring(TMP2.set(p.x,p.y+.2+k*.1,p.z).clone(),k%2?HEIR_W:HEIR_G,R*(.7+k*.35),.6+k*.1,true,2.4);ring(c,k%2?HEIR_G:HEIR_W,4+k*4,.4,false,2.8);},k*90);
  for(let q=0;q<14;q++){const a=q/14*6.283;hBolt(c,c.clone().add(TMP2.set(Math.cos(a)*rand(5,11),rand(-1,5),Math.sin(a)*rand(5,11))),q%3?HEIR_G:HEIR_W,.12);}
  burst(ADD,c,110,{colors:[HEIR_G,HEIR_G2,HEIR_G,HEIR_W],speed:24,up:6,life:.9,size:.45,size1:0,bright:2.2});
  dust(p,14,2);debris(TMP2.set(p.x,p.y+.8,p.z).clone(),18,0,18,.45);if(typeof crater==='function')crater(p.x,p.z,6,p.y);
  if(typeof smashArea==='function'){smashArea(p,R,true);}
  if(typeof bigFist==='function'){const A={shape:'fist',style:'wind',size:2.4,c1:HEIR_G,c2:HEIR_W,colors:[HEIR_G,HEIR_W]};try{bigFist(f,A,c,f.fwd());}catch(e){}}
  flashLight(c,HEIR_G,22);shake(1.4,p);hitStop(.22);if(typeof impactFlash==='function')impactFlash(.35,HEIR_G);if(NET.role==='off')game.slowT=Math.max(game.slowT,.9);
  xSnd(p,()=>{AU.boom(true);AU.crash&&AU.crash();});setTimeout(()=>xSnd(p,()=>{AU.boom(true);AU.zap&&AU.zap(1);}),120);setTimeout(()=>xSnd(p,()=>AU.boom(false)),320);
  }
// director's camera for LEGACY STRIKE (for the user and anyone within 40 m)
const _hCamIv=setInterval(()=>{if(typeof updateCamera!=='function')return;clearInterval(_hCamIv);const _hCam=updateCamera;updateCamera=function(dt){const r=_hCam.apply(this,arguments);if(!HCAM.on)return r;const f=HCAM.f,e=game.time-HCAM.t0;
  if(!f||!inMatch()||e>3.4||(f.dead&&e<1.3)){HCAM.on=false;return r;}
  const fw=f.fwd(),side=new V3(fw.z,0,-fw.x),c=f.chest(new V3());let pos,look,fov;
  if(e<1){const a=.5+e*1.3;pos=c.clone().addScaledVector(fw,Math.cos(a)*6.5).addScaledVector(side,Math.sin(a)*6.5).add(TMP2.set(0,.3,0));look=c.clone().add(TMP2.set(0,.3,0));fov=46;}
  else if(e<1.3||!HCAM.imp){pos=c.clone().addScaledVector(fw,-5.5).addScaledVector(side,1.5).add(TMP2.set(0,2,0));look=c.clone().addScaledVector(fw,4);fov=60;}
  else{const p=HCAM.imp;pos=p.clone().addScaledVector(side,11).addScaledVector(fw,-4).add(TMP2.set(0,4.2,0));look=p.clone().add(TMP2.set(0,1.2,0));fov=72;}
  {const kk=rayBld(look,pos,16);if(kk<1)pos=look.clone().lerp(pos,Math.max(.25,kk*.9));}
  const k=1-Math.exp(-(e<1.3?14:6)*dt);camera.position.lerp(pos,k);camera.lookAt(look);camera.fov=lerp(camera.fov,fov,k);camera.updateProjectionMatrix();
  const bars=$('cineBars');if(bars&&SET.cinematic!==false)bars.classList.add('on');return r;};},5);   // installed once the camera code has loaded

/* ---------- FLICK STORM (alt ult) ---------- */
ALTULT.heir={name:'FLICK STORM',r:16,s(f){f.uEnd=1.9;f.poseKey='charge';},u(f,t){
  const L=foes(f,24).slice(0,6);for(let i=0;i<6;i++)atT(f,'f'+i,.25+i*.22,()=>{const T=L[i%Math.max(1,L.length)];const c=hHand(f);f.poseKey=i%2?'jabL':'jabR';
    const d=T?xDirTo(f,T):f.fwd();const to=T?T.chest(new V3()):c.clone().addScaledVector(d,18);if(T)faceTo(f,T);
    ring(c,HEIR_W,1.6,.2,false,2.4);trailSeg(c,to,HEIR_W,.25,.25);ring(to,HEIR_G,2.2,.3,false,2.4);burst(ADD,to,18,{colors:[HEIR_G,HEIR_W],speed:10,life:.3,size:.35,size1:0,bright:2.6});
    if(T&&!T.dead&&NET.role!=='client')hitO(f,T,{dmg:10,kb:14,up:5,stun:.5});shake(.25,c);xSnd(c,()=>{AU.boom(false);AU.whoosh(false);});});return 10;}};

/* ---------- moves, combo and opening ---------- */
(function(){const h=HEROES.find(x=>x.id==='heir');if(!h)return;
  const ab=o=>sanitizeAbil(Object.assign({colors:[HEIR_G,HEIR_W]},o));
  h._xm=[Object.assign(ab({name:'FA JIN',form:'dash',style:'wind',shape:'ring',fx:[]}),{custom:'fajin'}),Object.assign(ab({name:'SMOKESCREEN',form:'zone',style:'shadow',shape:'orb',fx:[]}),{custom:'smoke'})];
  // his combo: kick-heavy fighting style — jab into kicks, finishing with an axe kick; heavy: a rising kick
  UATK.heir={c:'jR hk lk sk ax',h:'up',fx:'ofa'};
  const toks=UATK.heir.c.split(' '),raw=toks.reduce((s,t)=>s+TPL[t].dmg,0),k=15/raw*1.08;
  toks.forEach((t,i)=>{const M=Object.assign({},TPL[t]);M.dmg=+(M.dmg*k).toFixed(1);const last=i===toks.length-1;
    if(last){M.launch=true;M.heavy=true;M.kb=Math.max(M.kb,9);M.up=Math.max(M.up,5);}else{delete M.launch;if(t!=='ax')delete M.heavy;delete M.shock;M.kb=Math.min(M.kb,4);M.up=Math.min(M.up,2);M.next='u_heir_'+(i+1);}
    MOVES['u_heir_'+i]=M;});
  const H=Object.assign({},TPL.up);H.dmg=13;H.launch=true;H.heavy=true;H.kb=10;H.up=10;H.vfx=2;MOVES.u_heir_H=H;
  if(typeof UO!=='undefined')UO.heir=(f,t,c)=>{if(uo1(f,'a'))aura(f,HEIR_G,HEIR_W,1.2);uoSwirl(f,c,HEIR_G,HEIR_W,5,ADD);if(Math.random()<.6)hBolt(c,c.clone().add(TMP2.set(rand(-1.5,1.5),rand(-1,1.5),rand(-1.5,1.5))));};})();
