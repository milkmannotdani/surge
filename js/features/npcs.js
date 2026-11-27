/* Civilians: people on the sidewalks, shoppers in both malls (both floors), commuters on the station platforms.
   - Each person is built from rounded shapes in five vertex-coloured meshes (body + two arms + two legs): faces, hair
     (short / long / ponytail / bun / cap), jackets, skirts or trousers, shoes, and something to carry (backpack,
     shoulder bag, briefcase, phone, shopping bags). They walk with a proper gait, stop to check their phones or browse,
     flee from fights, cower with their hands over their heads, stumble when hit and lie down when knocked out.
   - They only run from VILLAINS (heroes walking or fighting nearby don't scare them).
   - VILLAINS can attack and KILL them. Villain bots go after people when no hero is near; any villain's punches,
     specials and ultimates hurt the people in reach, and impacts / craters hurt anyone close (villains earn CHAOS points).
     Someone being attacked shouts HELP! and stays "in danger" for a few seconds. Knocked down = badly hurt (a hero can
     still carry them out); a villain who hits someone who's down, or overkills them with a heavy blow, kills them:
     blood pool, and heavy blows can tear an arm or leg off. The dead can't be rescued. Heroes' stray heavy hits can
     knock people down, never kill them.
   - HEROES save them: land a hit on (or KO) the villain who is attacking someone and everyone that villain was
     terrorising is SAVED (+8 points each, +4 more for a KO). Hold R next to someone who's been knocked out to carry
     them to safety (+5). Heroes who hurt people themselves still lose points.
   Civilians are local to each player's game (scenery + your own score), like the old crowds. Settings > CIVILIAN CROWDS. */
const NPC=[];
// who counts as a villain / a hero here (in PATROL only the incident villains are villains, and you're always the hero)
function isVil(f){return !!f&&(game.rules==='patrol'?!!f.patV:!!(f.hero&&f.hero.faction==='villain'));}
function meHero(){return !!ME&&(game.rules==='patrol'?!ME.patV:ME.hero.faction==='hero');}
const NPC_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,envMapIntensity:.5});
const NPC_SKIN=[0xf6d7bd,0xeac3a0,0xd9a87e,0xb98260,0x8a5a3c,0x5e3c28],NPC_HAIR=[0x1a1410,0x2e2018,0x5a3a20,0x8a6a40,0xc8b080,0xd8d0c8,0x6a2a1a,0x2a2a2e],
  NPC_TOP=[0xe8e8e8,0x2a3a5a,0xc84a4a,0x4a7ac8,0xe8c84a,0x5aa87a,0x8a5ac8,0xf08a50,0x3a3a3e,0xd8a0b0,0x6a8a9a,0xf4f0e6],NPC_BOT=[0x22283a,0x3a3a40,0x4a3a2a,0x2a3a5a,0x6a6a70,0xc8b890,0x1a1a1e,0x5a2a3a],
  NPC_JKT=[0x2a2a30,0x3a4a6a,0x6a4a34,0x8a8a90,0x2a3a2a,0xc8b890,0x7a2a2a],NPC_SHOE=[0x1a1a1e,0xf0f0f0,0x5a3a24,0xc84a4a,0x3a4a6a];
const thanksTex=(()=>{const c=document.createElement('canvas');c.width=160;c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=5;
  g.beginPath();g.roundRect?g.roundRect(4,4,152,44,12):g.rect(4,4,152,44);g.fill();g.stroke();g.beginPath();g.moveTo(70,48);g.lineTo(80,62);g.lineTo(90,48);g.fill();
  g.fillStyle='#1a9a4a';g.font='900 26px Impact,sans-serif';g.textAlign='center';g.fillText('THANK YOU!',80,36);return new THREE.CanvasTexture(c);})();
const NPC_HELP=new THREE.SpriteMaterial({map:helpTex,depthTest:false}),NPC_THX=new THREE.SpriteMaterial({map:thanksTex,depthTest:false});
function npcBuild(kind){
  const wide=rand(.88,1.18),skin=pick(NPC_SKIN),hair=pick(NPC_HAIR),top=pick(NPC_TOP),bot=pick(NPC_BOT),shoe=pick(NPC_SHOE);
  const skirt=Math.random()<.28,jacket=Math.random()<.42,jc=pick(NPC_JKT),shortS=!jacket&&Math.random()<.45,shorts=!skirt&&Math.random()<.12;
  const hs=pick(['short','short','long','long','pony','bun','cap','bald']);
  const acc=kind==='shopper'?pick(['bags','bags','bag','bags']):kind==='commuter'?pick(['brief','pack','phone','bag','none']):pick(['none','pack','bag','phone','brief','none','pack']);
  const B=[],AL=[],AR=[],LL=[],LR=[],cyl=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||10);
  const add=(arr,g,c,x,y,z,sx,sy,sz)=>{if(sx)g.scale(sx,sy,sz);g.translate(x,y,z);arr.push(mColor(g,c));};
  // body
  add(B,cyl(.19*wide,.165*wide,.56,14),jacket?jc:top,0,1.15,0,1,1,.62);
  add(B,new THREE.SphereGeometry(.19*wide,14,8,0,Math.PI*2,0,Math.PI/2),jacket?jc:top,0,1.43,0,1,.38,.62);
  if(jacket){add(B,new THREE.BoxGeometry(.11,.5,.02),top,0,1.16,.118*wide);add(B,new THREE.BoxGeometry(.24*wide,.06,.14),jc,0,1.43,.02);}
  add(B,cyl(.168*wide,.168*wide,.16,14),bot,0,.88,0,1,1,.66);
  if(skirt)add(B,cyl(.17*wide,.27*wide,.42,16),bot,0,.7,0,1,1,.8);
  add(B,cyl(.05,.056,.12,8),skin,0,1.48,0);
  add(B,new THREE.SphereGeometry(.118,16,12),skin,0,1.625,0,1,1.12,1.04);
  [-.041,.041].forEach(x=>{add(B,new THREE.BoxGeometry(.026,.017,.01),0x16120e,x,1.64,.119);add(B,new THREE.BoxGeometry(.036,.008,.01),hair,x,1.668,.116);});
  add(B,new THREE.BoxGeometry(.02,.03,.025),skin,0,1.61,.123);add(B,new THREE.BoxGeometry(.045,.01,.01),0x8a4a3a,0,1.575,.115);
  [-.118,.118].forEach(x=>add(B,new THREE.SphereGeometry(.024,8,6),skin,x,1.625,0,.6,1,1));
  const cap=c=>add(B,new THREE.SphereGeometry(.129,16,9,0,Math.PI*2,0,Math.PI*.56),c,0,1.64,-.01,1,1.12,1.07);
  if(hs!=='bald')cap(hs==='cap'?pick([0xc84a4a,0x2a3a5a,0x1a1a1e,0xe8e8e8]):hair);
  if(hs==='cap')add(B,new THREE.BoxGeometry(.2,.016,.13),0x1a1a1e,0,1.715,.11);
  if(hs==='long')add(B,new THREE.BoxGeometry(.25,.32,.07),hair,0,1.5,-.09);
  if(hs==='pony'){const p=cyl(.04,.02,.24,8);p.rotateX(.5);add(B,p,hair,0,1.56,-.15);}
  if(hs==='bun')add(B,new THREE.SphereGeometry(.058,10,8),hair,0,1.76,-.07);
  if(acc==='pack')add(B,new THREE.BoxGeometry(.28,.34,.13),pick([0x2a3a5a,0xc84a4a,0x1a1a1e,0x4a7a4a]),0,1.17,-.17);
  if(acc==='bag'){add(B,new THREE.BoxGeometry(.24,.2,.08),pick([0x6a3a24,0x1a1a1e,0xd8b890,0xa83a5a]),.25*wide,.93,0);const s=new THREE.BoxGeometry(.02,.62,.02);s.rotateZ(.55);add(B,s,0x2a1a10,.05,1.2,.1);}
  // arms (pivot at the shoulder) and legs (pivot at the hip)
  const sl=jacket?jc:top,fa=jacket||!shortS?sl:skin;
  [[AL,-1],[AR,1]].forEach(([A,s])=>{add(A,cyl(.054,.048,.31,8),sl,0,-.15,0);add(A,cyl(.046,.04,.27,8),fa,0,-.43,.01);add(A,new THREE.SphereGeometry(.047,8,6),skin,0,-.6,.015,.9,1.2,1);});
  if(acc==='brief')add(AR,new THREE.BoxGeometry(.08,.26,.34),0x3a2418,.02,-.76,.02);
  if(acc==='phone')add(AR,new THREE.BoxGeometry(.045,.085,.012),0x14161a,0,-.63,.06);
  if(acc==='bags'){add(AR,new THREE.BoxGeometry(.1,.3,.26),pick([0xe84a7a,0xf0f0f0,0x2a8ad8,0xe8c84a]),.04,-.8,0);if(Math.random()<.6)add(AL,new THREE.BoxGeometry(.1,.26,.24),pick([0xc8a070,0x3a3a3e,0x5ac88a]),-.04,-.78,0);}
  const th=skirt?skin:bot,sh=skirt||shorts?skin:bot;
  [LL,LR].forEach(L=>{add(L,cyl(.08,.066,.44,10),skirt?0xe8d8c8:th,0,-.22,0);add(L,cyl(.062,.05,.42,10),sh,0,-.64,0);add(L,new THREE.BoxGeometry(.1,.08,.25),shoe,0,-.88,.045);});
  const mk=(list,shadow)=>{const m=new THREE.Mesh(geoMerge(list),NPC_MAT);m.castShadow=!!shadow;return m;};
  const g=new THREE.Group(),body=mk(B,true);g.add(body);
  const piv=(list,x,y)=>{const p=new THREE.Group();p.position.set(x,y,0);p.add(mk(list,false));g.add(p);return p;};
  const aL=piv(AL,-.235*wide,1.4),aR=piv(AR,.235*wide,1.4),lL=piv(LL,-.09*wide,.92),lR=piv(LR,.09*wide,.92);
  g.scale.setScalar(rand(.92,1.07));return {g,aL,aR,lL,lR,acc};}

// kinds: walker (sidewalk line), shopper / commuter (wander inside an area at one floor height)
function npcMake(kind,o){const P=npcBuild(kind);const n=Object.assign(P,{kind,x:o.x,z:o.z,y:o.y||0,face:Math.random()*6.28,sp:rand(1.1,1.7),ph:Math.random()*6,mode:'walk',modeT:0,hp:40,
    ax:o.ax,base:o.base,dir:Math.random()<.5?1:-1,panic:Math.random()<.55,area:o.area,tx:o.x,tz:o.z,wait:rand(0,3),flinch:0,kx:0,kz:0,danger:null,bub:null,lift:0,prog:0});
  n.g.position.set(n.x,n.y,n.z);scene.add(n.g);NPC.push(n);return n;}
// the city is big: sidewalk walkers that end up far from the camera are moved to a sidewalk near it, so the streets
// around you always have people on them
function npcRelocate(n){const c=camera.position;for(let k=0;k<12;k++){const ax=Math.random()<.5?'x':'z',near=INNER.filter(a=>Math.abs(a-(ax==='x'?c.z:c.x))<110);if(!near.length)return;
    const a=pick(near),sd=Math.random()<.5?-1:1,along=clamp((ax==='x'?c.x:c.z)+rand(-110,110),-BOUND+8,BOUND-8),x=ax==='x'?along:a+sd*7.6,z=ax==='x'?a+sd*7.6:along;
    if(Math.hypot(x-c.x,z-c.z)<45||insideBld(x,z,.6)||ugStair(x,z))continue;Object.assign(n,{x,z,y:0,ax,base:ax==='x'?z:x,mode:'walk',hp:40,danger:null,kx:0,kz:0,wait:0,spurtT:0,stump:null});
    [n.aL,n.aR,n.lL,n.lR].forEach(p=>p.visible=true);n.g.rotation.set(0,0,0);n.g.position.set(x,0,z);return;}}
function npcClear(){NPC.forEach(n=>{scene.remove(n.g);n.g.traverse(o=>{if(o.isMesh)o.geometry.dispose();});});NPC.length=0;if(typeof NPC_LIMBS!=='undefined'){NPC_LIMBS.forEach(L=>scene.remove(L.m));NPC_LIMBS.length=0;}}
function npcSpawn(){npcClear();if(game.story||(typeof PR!=='undefined'&&PR.on)||SET.crowds===false)return;
  let n=0;for(let k=0;k<260&&n<26;k++){const a=INNER[Math.floor(Math.random()*INNER.length)],sd=Math.random()<.5?-1:1,along=rand(-BOUND+10,BOUND-10),ax=Math.random()<.5?'x':'z';
    const x=ax==='x'?along:a+sd*7.6,z=ax==='x'?a+sd*7.6:along;if(insideBld(x,z,.6)||ugStair(x,z))continue;npcMake('walker',{x,z,ax,base:ax==='x'?z:x});n++;}
  MALLS_INFO.forEach(m=>{let c=0;for(let k=0;k<60&&c<8;k++){const r=pick(m.walk),x=rand(r[0],r[1]),z=rand(r[2],r[3]);if(insideBld(x,z,.4,r[4]+.5))continue;
    npcMake('shopper',{x,z,y:r[4],area:m.walk.filter(q=>q[4]===r[4])});c++;}});
  const plats=[[UG.hx0+3,UG.hx1-3,UG.hz0+1.4,UG.pS-1.3,UG.plat],[UG.hx0+3,UG.hx1-3,UG.pN+1.3,UG.hz1-1.4,UG.plat]];
  for(let k=0,c=0;k<40&&c<10;k++){const r=pick(plats),x=rand(r[0],r[1]),z=rand(r[2],r[3]);if(insideBld(x,z,.4,r[4]+.5))continue;npcMake('commuter',{x,z,y:r[4],area:[r]});c++;}}
onEv('matchStart',npcSpawn);onEv('matchEnd',()=>{npcClear();npcUI(null);});

/* ---------- moving ---------- */
function npcFree(n,x,z){if(Math.abs(x)>BOUND-2||Math.abs(z)>BOUND-2)return false;if(insideBld(x,z,.3,n.y+.5))return false;
  if(n.kind!=='walker'){const f=floorAt(x,z,n.y+.6);if(Math.abs(f-n.y)>.45)return false;}else if(ugStair(x,z))return false;
  if(n.y<2.5&&n.y>-1)for(const s of solidsNear(x,z))if(Math.abs(s.x-x)<s.r+.3&&Math.abs(s.z-z)<s.r+.3&&Math.hypot(s.x-x,s.z-z)<s.r+.3)return false;return true;}
function npcStep(n,dx,dz){const nx=n.x+dx,nz=n.z+dz;if(npcFree(n,nx,nz)){n.x=nx;n.z=nz;return true;}
  if(npcFree(n,n.x+dx,n.z)){n.x+=dx;return true;}if(npcFree(n,n.x,n.z+dz)){n.z+=dz;return true;}return false;}
function npcPickTarget(n){const r=pick(n.area);n.tx=rand(r[0],r[1]);n.tz=rand(r[2],r[3]);}
function npcThreat(n){let thr=null,td=1e9;for(const f of FS){if(f.dead||f.dormant||!isVil(f))continue;const dy=Math.abs(f.pos.y-n.y);if(dy>3)continue;const d=Math.hypot(f.pos.x-n.x,f.pos.z-n.z);
    const fight=f.state==='attack'||f.state==='special'||f.state==='ult'||f.state==='fly';const r=fight?12:5.5;if(d<r&&d<td){td=d;thr=f;}}return thr?{f:thr,d:td}:null;}
function npcMove(n,dt){const t=game.time;
  if(n.kx||n.kz){npcStep(n,n.kx*dt,n.kz*dt);n.kx*=Math.max(0,1-6*dt);n.kz*=Math.max(0,1-6*dt);if(Math.abs(n.kx)+Math.abs(n.kz)<.05)n.kx=n.kz=0;}
  if(n.mode==='down'||n.mode==='dead'||n.mode==='gone')return 0;
  const dng=n.danger&&t<n.danger.t&&!n.danger.by.dead?n.danger:null;if(!dng)n.danger=null;
  const thr=npcThreat(n);
  if(n.mode==='saved'){n.modeT-=dt;if(n.modeT<=0){n.mode='flee';n.modeT=4;}}
  else if(dng&&Math.hypot(dng.by.pos.x-n.x,dng.by.pos.z-n.z)<3.2&&n.mode!=='flee'){n.mode='cower';}
  else if(thr||dng){if(n.mode!=='cower'||!dng){n.mode='flee';n.modeT=2.6;n.from=(thr?thr.f:dng.by);}}
  if(n.mode==='cower'){if(!dng){n.mode='flee';n.modeT=2;}return 0;}
  if(n.mode==='flee'){n.modeT-=dt;const fr=n.from&&!n.from.dead?n.from.pos:null;if(n.modeT<=0&&!thr){n.mode='walk';return 0;}
    let ax=fr?n.x-fr.x:Math.sin(n.face),az=fr?n.z-fr.z:Math.cos(n.face);if(n.kind==='walker'){if(n.ax==='x'){az=0;ax=ax>=0?1:-1;}else{ax=0;az=az>=0?1:-1;}}
    const l=Math.hypot(ax,az)||1;ax/=l;az/=l;const sp=n.sp*3.1;
    if(!npcStep(n,ax*sp*dt,az*sp*dt)){const s=(n.ph|0)%2?1:-1;if(!npcStep(n,-az*s*sp*dt,ax*s*sp*dt))npcStep(n,az*s*sp*dt,-ax*s*sp*dt);}
    n.face=Math.atan2(ax,az);return sp;}
  if(n.mode==='saved')return 0;
  // calm: walk the sidewalk line, or browse around the area
  if(n.kind==='walker'){if(n.wait>0){n.wait-=dt;return 0;}if(Math.random()<dt*.04){n.wait=rand(1.5,4);n.phone=n.acc==='phone'||Math.random()<.4;return 0;}
    const dx=n.ax==='x'?n.dir:0,dz=n.ax==='z'?n.dir:0;if(!npcStep(n,dx*n.sp*dt,dz*n.sp*dt))n.dir=-n.dir;else{if(n.ax==='x')n.z+=(n.base-n.z)*Math.min(1,dt*2);else n.x+=(n.base-n.x)*Math.min(1,dt*2);}
    n.face=Math.atan2(dx,dz);return n.sp;}
  if(n.wait>0){n.wait-=dt;return 0;}const dx=n.tx-n.x,dz=n.tz-n.z,d=Math.hypot(dx,dz);
  if(d<.4){n.wait=rand(1.5,6);n.phone=n.acc==='phone'||Math.random()<.35;npcPickTarget(n);return 0;}
  const ok=npcStep(n,dx/d*n.sp*dt,dz/d*n.sp*dt);if(!ok){npcPickTarget(n);return 0;}n.face=Math.atan2(dx,dz);return n.sp;}

/* ---------- poses ---------- */
function npcPose(n,dt,sp){const g=n.g,t=game.time;
  g.rotation.set(0,n.face,0);let y=n.y,lean=0;
  if(n.mode==='gone'){g.visible=false;return;}
  if(n.lift>0){n.lift+=dt;g.position.set(n.x,n.y+n.lift*n.lift*9,n.z);g.rotation.y+=n.lift*8;if(n.lift>1.3){n.mode='gone';g.visible=false;n.lift=0;}return;}
  if(n.mode==='down'){n.downA=Math.min(1,(n.downA||0)+dt*3);g.rotation.x=-n.downA*Math.PI/2;g.position.set(n.x,y+.14*n.downA,n.z);
    // badly hurt: still moving a little
    const w=Math.sin(t*2.2+n.ph)*.12;n.aL.rotation.set(-2.6*n.downA+w,0,-.4);n.aR.rotation.set(-2.2*n.downA,0,.5+w*.5);n.lL.rotation.set(.15+w*.4,0,-.1);n.lR.rotation.set(-.1,0,.12);return;}
  if(n.mode==='dead'){const k=Math.min(1,(game.time-n.deadT)*3.2),e=1-Math.pow(1-k,3);g.rotation.x=-e*Math.PI/2*(n.back?-1:1);g.rotation.z=n.roll*e;g.position.set(n.x,y+.12*e,n.z);
    // limp: a couple of twitches, then still
    const tw=game.time-n.deadT<1.6?Math.sin(t*31+n.ph)*.18*(1.6-(game.time-n.deadT)):0;
    n.aL.rotation.set(-2.9*e+tw,0,-.9*e);n.aR.rotation.set(-.4*e,0,1.2*e-tw);n.lL.rotation.set(.35*e+tw*.6,0,-.25*e);n.lR.rotation.set(-.2*e,0,.3*e);return;}
  n.downA=0;
  if(n.mode==='cower'){const s=Math.sin(t*20)*.04;g.position.set(n.x,y-.34,n.z);g.rotation.x=.42;n.lL.rotation.set(-1.5,0,-.15);n.lR.rotation.set(-1.25,0,.15);
    n.aL.rotation.set(-2.5+s,0,.75);n.aR.rotation.set(-2.5-s,0,-.75);return;}
  n.ph+=dt*sp*3.4;const s=Math.sin(n.ph),run=sp>3;const sw=run?1.05:.62;
  n.lL.rotation.set(s*sw,0,0);n.lR.rotation.set(-s*sw,0,0);
  if(run){if(n.panic){n.aL.rotation.set(-2.7+s*.35,0,.18);n.aR.rotation.set(-2.7-s*.35,0,-.18);}else{n.aL.rotation.set(-s*1.1,0,.1);n.aR.rotation.set(s*1.1,0,-.1);}lean=.25;}
  else if(sp>0){n.aL.rotation.set(-s*.5,0,.06);n.aR.rotation.set(n.acc==='bags'||n.acc==='brief'?s*.2:s*.5,0,-.06);}
  else{const b=Math.sin(t*1.7+n.ph)*.03;n.aL.rotation.set(b,0,.07);n.aR.rotation.set(n.phone?-1.25:-b,0,n.phone?.25:-.07);n.lL.rotation.set(0,0,0);n.lR.rotation.set(0,0,0);
    if(!n.phone&&Math.sin(t*.7+n.ph*3)>.6)g.rotation.y=n.face+Math.sin(t*1.3+n.ph)*.6;}
  if(n.mode==='saved'){n.aR.rotation.set(-2.9+Math.sin(t*14)*.4,0,-.3);n.aL.rotation.set(-.2,0,.1);}
  if(n.flinch>0){n.flinch-=dt;lean-=.5*n.flinch/.35;}
  g.rotation.x=lean;g.position.set(n.x,y+(sp>0?Math.abs(s)*.035:0),n.z);}

/* ---------- getting hurt (villains), getting saved (heroes) ---------- */
function npcBubble(n,mat){if(n.bub&&n.bub.material===mat)return;if(n.bub){n.g.remove(n.bub);n.bub=null;}if(!mat)return;const s=new THREE.Sprite(mat);s.scale.set(mat===NPC_THX?1.7:1.4,.7,1);s.position.y=2.35;n.g.add(s);n.bub=s;}
let npcWarnT=0;
function npcHurt(n,src,dmg,dir,heavy){if(n.mode==='dead'||n.mode==='gone'||n.lift>0)return;const vil=isVil(src);
  // someone who's down: a villain finishes them, anyone else leaves them be
  if(n.mode==='down'){if(vil){n.dhits=(n.dhits||0)+(heavy||dmg>=24?2:1);if(n.dhits>=2)npcKill(n,src,dir,heavy||dmg>=20);else{n.flinch=.35;if(src&&src.isBot)src.npcPause=game.time+rand(.8,1.6);}}return;}
  n.hp-=dmg;n.flinch=.35;if(dir){n.kx=dir.x*4;n.kz=dir.z*4;}if(vil){n.danger={by:src,t:game.time+6};n.mode=Math.random()<.55?'cower':'flee';n.modeT=2.5;n.from=src;
    if(meHero()&&!ME.dead&&game.time>npcWarnT&&Math.hypot(ME.pos.x-n.x,ME.pos.z-n.z)<45){npcWarnT=game.time+8;announceSmall('⚠ A VILLAIN IS ATTACKING CIVILIANS — STOP THEM!');}}
  const c=new V3(n.x,n.y+1.2,n.z);if(nearCam(c,70)){burst(ADD,c,8,{colors:[0xffffff,0xffd23f],speed:3,up:2,life:.3,size:.18,size1:0,bright:2});AU.scale=sndAt(c)*.6;AU.tone('triangle',520,300,.12,.07);AU.scale=1;}
  if(n.hp<=0){if(vil&&(n.hp<=-22||(heavy&&Math.random()<.45))){npcKill(n,src,dir,heavy);return;}
    else{n.hp=0;n.mode='down';n.downT=game.time;n.dhits=0;n.danger=null;if(vil&&src&&src.isBot)src.npcPause=game.time+rand(1.2,2.2);npcBubble(n,null);dust(new V3(n.x,n.y,n.z),6,.6);if(vil&&typeof bloodDecal==='function'&&goreOn())bloodDecal(n.x,n.z,n.y,rand(.35,.55),true);}}
  if(src===ME&&ME){if(isVil(ME))addPoints(n.mode==='down'?3:1,'CHAOS');
    else{const lose=Math.min(POINTS,3);if(lose){POINTS-=lose;store.set('surge.points',String(POINTS));renderPoints();}announceSmall('CIVILIAN HURT! −3 POINTS — HEROES PROTECT PEOPLE');}}}
function npcArea(p,r,src,dmg,heavy){for(const n of NPC){if(n.mode==='dead'||n.mode==='gone')continue;const d=Math.hypot(n.x-p.x,n.z-p.z);if(d<r&&Math.abs(n.y-(p.y!=null?p.y:n.y))<2.2)npcHurt(n,src,dmg,new V3(n.x-p.x,0,n.z-p.z).normalize(),heavy);}}
/* ---------- killed ---------- */
const NPC_LIMBS=[];let npcDeadWarnT=0;
function npcKill(n,by,dir,heavy){if(n.mode==='dead')return;n.mode='dead';n.hp=-1;n.danger=null;n.deadT=game.time;n.prog=0;n.back=Math.random()<.4;n.roll=rand(-.35,.35);npcBubble(n,null);
  n.kx=n.kz=0;if(dir){n.kx=dir.x*5;n.kz=dir.z*5;}
  const c=new V3(n.x,n.y+1.1,n.z),near=nearCam(c,80),gore=typeof goreOn==='function'&&goreOn();
  if(near){if(gore&&typeof bloodBurst==='function'){bloodBurst(c,heavy?60:34,heavy?9:6);}AU.scale=sndAt(c)*.7;AU.tone('sawtooth',300,120,.18,.06);AU.scale=1;}
  if(gore&&typeof bloodDecal==='function')setTimeout(()=>{if(n.mode==='dead')bloodDecal(n.x,n.z,n.y,rand(1,1.5),true);},350);
  if(gore&&(heavy?Math.random()<.7:Math.random()<.25))npcTearLimb(n,dir);
  emitEv('civKilled',n,by);
  if(by===ME&&ME&&isVil(ME))addPoints(5,'CHAOS');
  if(meHero()&&ME&&!ME.dead&&game.time>npcDeadWarnT&&Math.hypot(ME.pos.x-n.x,ME.pos.z-n.z)<60){npcDeadWarnT=game.time+6;announceSmall('☠ A CIVILIAN WAS KILLED');}}
// heavy blows can tear an arm or leg off: the limb flies, the stump bleeds
function npcTearLimb(n,dir){const L=[n.aL,n.aR,n.lL,n.lR].filter(p=>p.visible);if(!L.length)return;const p=pick(L);
  n.g.updateMatrixWorld(true);const wp=p.getWorldPosition(new V3()),wq=p.getWorldQuaternion(new THREE.Quaternion()),ws=p.getWorldScale(new V3());
  const m=p.children[0].clone();m.position.copy(wp);m.quaternion.copy(wq);m.scale.copy(ws);m.castShadow=true;scene.add(m);p.visible=false;
  const d=dir&&dir.lengthSq()>.01?dir.clone():new V3(rand(-1,1),0,rand(-1,1)).normalize();
  NPC_LIMBS.push({m,v:new V3(d.x*rand(4,8)+rand(-1,1),rand(4,7),d.z*rand(4,8)+rand(-1,1)),w:new V3(rand(-10,10),rand(-10,10),rand(-10,10)),t:0,rest:false});
  if(NPC_LIMBS.length>24){const o=NPC_LIMBS.shift();scene.remove(o.m);}
  n.stump=p;n.spurtT=game.time+1.8;if(typeof bloodBurst==='function')bloodBurst(wp,40,8);}
function npcLimbsTick(dt){for(let i=NPC_LIMBS.length-1;i>=0;i--){const L=NPC_LIMBS[i];L.t+=dt;if(L.t>30){scene.remove(L.m);NPC_LIMBS.splice(i,1);continue;}if(L.rest)continue;
    L.v.y-=20*dt;L.m.position.addScaledVector(L.v,dt);L.m.rotation.x+=L.w.x*dt;L.m.rotation.y+=L.w.y*dt;L.m.rotation.z+=L.w.z*dt;
    if(insideBld(L.m.position.x,L.m.position.z,0,L.m.position.y)){L.m.position.x-=L.v.x*dt;L.m.position.z-=L.v.z*dt;L.v.x*=-.3;L.v.z*=-.3;}
    if(Math.random()<.5&&nearCam(L.m.position,60))burst(SMK,L.m.position,1,{colors:[0x7a0010,0x9a0a18],speed:.4,life:.5,size:.08,size1:.04,grav:12});
    const g=floorAt(L.m.position.x,L.m.position.z,L.m.position.y+.4)+.06;if(L.m.position.y<g){L.m.position.y=g;if(L.v.y<-3){L.v.y*=-.3;L.v.x*=.5;L.v.z*=.5;L.w.multiplyScalar(.5);if(typeof bloodDecal==='function')bloodDecal(L.m.position.x,L.m.position.z,g-.06,rand(.25,.4),false);}
      else{L.rest=true;L.m.rotation.x=Math.PI/2*(Math.random()<.5?1:-1);L.m.rotation.z=0;}}}}
function npcSave(n,why){if(n.mode==='dead'||n.mode==='gone')return;n.mode='saved';n.modeT=2.2;n.danger=null;n.from=why;npcBubble(n,NPC_THX);n.thxT=game.time+2.4;emitEv('civSaved',n);
  const c=new V3(n.x,n.y+1,n.z);ring(new V3(n.x,n.y+.15,n.z),0x5aff8a,2.4,.45,true,2.2);burst(ADD,c,18,{colors:[0x5aff8a,0xffffff],speed:3,up:4,life:.6,size:.25,size1:0,bright:2});}
function npcSavedBy(vil,bonus){if(!meHero())return;let k=0;for(const n of NPC){if(n.danger&&n.danger.by===vil&&game.time<n.danger.t&&n.mode!=='down'&&n.mode!=='dead'&&n.mode!=='gone'&&Math.hypot(n.x-vil.pos.x,n.z-vil.pos.z)<16){npcSave(n,vil);k++;}}
  if(k){addPoints((8+bonus)*k,'SAVED');announceSmall(k>1?`🦸 ${k} CIVILIANS SAVED! +${(8+bonus)*k}`:`🦸 CIVILIAN SAVED! +${8+bonus}`);AU.scale=1;AU.bell&&AU.bell();}}
// every new attack swing / special / ult opens a short window where it can hit people in reach (villains only)
const _npcSet=Fighter.prototype.set;Fighter.prototype.set=function(s){const r=_npcSet.apply(this,arguments);if(s==='attack'||s==='special'||s==='ult')this._npcA={t:game.time,k:s,hit:new Set()};return r;};
function npcStrikes(){for(const f of FS){const A=f._npcA;if(!A||f.dead||!isVil(f))continue;const t=game.time-A.t;if(t>.9){f._npcA=null;continue;}
  const melee=A.k==='attack',rng=melee?2.2:A.k==='special'?4.2:6,w0=melee?.06:.12,w1=melee?.32:.8;if(t<w0||t>w1)continue;const fx=Math.sin(f.face),fz=Math.cos(f.face);
  const heavy=A.k!=='attack'||!!(f.move&&f.move.heavy),dmg=A.k==='ult'?60:A.k==='special'?24:heavy?20:14;
  for(const n of NPC){if(n.mode==='dead'||n.mode==='gone'||A.hit.has(n))continue;const dx=n.x-f.pos.x,dz=n.z-f.pos.z,d=Math.hypot(dx,dz);if(d>rng||Math.abs(n.y-f.pos.y)>1.8)continue;
    if(melee&&dx*fx+dz*fz<d*.25)continue;A.hit.add(n);npcHurt(n,f,dmg,new V3(dx,0,dz).normalize(),heavy);if(n.mode==='dead'&&f.isBot)f.npcPause=game.time+rand(2,3.5);}}}
onEv('hit',(att,def,dmg,o)=>{const heroHit=att&&!isVil(att);if(NPC.length&&o&&o.pt&&(!heroHit||o.heavy))npcArea(o.pt,o.heavy?3:1.8,att,10,!!o.heavy&&!heroHit);
  if(att===ME&&meHero()&&isVil(def))npcSavedBy(def,0);});
onEv('kill',(def,att)=>{if(att===ME&&isVil(def))npcSavedBy(def,4);});
const _npcCrater=crater;crater=function(x,z,s,y){_npcCrater.apply(this,arguments);if(NPC.length)npcArea({x,z,y:y!=null?y:null},s*1.6,null,18);};
// villain bots go looking for people to terrorise when no hero is close
const _npcThink=AI.prototype.think;AI.prototype.think=function(dt){_npcThink.call(this,dt);const f=this.f;
  if(f.dead||f.hold||f.downed||!NPC.length||!isVil(f)||!inMatch())return;
  if(nearestEnemy(f,13)){f.npcV=null;return;}
  if(f.npcPause&&game.time<f.npcPause){f.intent.wx=f.intent.wz=0;f.intent.light=f.intent.heavy=false;return;}
  if(f.npcV&&(f.npcV.mode==='dead'||f.npcV.mode==='gone'||game.time>f.npcVT))f.npcV=null;
  if(!f.npcV&&Math.random()<dt*.35){let b=null,bd=26;for(const n of NPC){if(n.mode==='dead'||n.mode==='gone'||n.lift>0||Math.abs(n.y-f.pos.y)>1.5)continue;const d=Math.hypot(n.x-f.pos.x,n.z-f.pos.z);if(d<bd){bd=d;b=n;}}if(b){f.npcV=b;f.npcVT=game.time+14;}}
  const n=f.npcV;if(!n)return;const d=this.goTo(n.x,n.z);f.intent.sprint=d>5;n.danger={by:f,t:game.time+4};
  if(d<1.8){f.intent.wx=f.intent.wz=0;f.face=Math.atan2(n.x-f.pos.x,n.z-f.pos.z);if(Math.random()<dt*1.4)f.intent.light=true;else if(Math.random()<dt*.35)f.intent.heavy=true;}};

/* ---------- carry knocked-out people to safety (hold R) ---------- */
let npcNear=null;function npcBusy(){return !!npcNear;}
function npcUI(n,prog){if(typeof CIVS!=='undefined'&&CIVS.length)return;const pe=$('civProg'),he=$('civHint');if(!pe||!he)return;
  if(!n){pe.classList.remove('on');he.classList.remove('on');return;}if(prog>0){pe.classList.add('on');pe.style.setProperty('--p',Math.min(1,prog/1.1)*360+'deg');he.classList.remove('on');}else{pe.classList.remove('on');he.classList.add('on');}}
function npcRescueTick(dt){npcNear=null;if(!ME||ME.dead||!meHero()||(typeof CIVS!=='undefined'&&CIVS.length)){if(!(typeof CIVS!=='undefined'&&CIVS.length))npcUI(null);return;}
  let b=null,bd=2.4;for(const n of NPC){if(n.mode!=='down'||n.lift>0)continue;const d=Math.hypot(n.x-ME.pos.x,n.z-ME.pos.z);if(d<bd&&Math.abs(n.y-ME.pos.y)<2){bd=d;b=n;}}
  npcNear=b;if(!b){npcUI(null);return;}
  if(ME.intent.revive&&['idle','run','block'].indexOf(ME.state)>=0){b.prog+=dt;npcUI(b,b.prog);if(b.prog>=1.1){b.lift=.01;b.prog=0;emitEv('civSaved',b);addPoints(5,'RESCUE');announceSmall('🚑 CIVILIAN CARRIED TO SAFETY +5');
      ring(new V3(b.x,b.y+.2,b.z),0x5aff8a,3,.5,true,2.4);burst(ADD,new V3(b.x,b.y+1,b.z),30,{colors:[0x5aff8a,0xffffff],speed:4,up:5,life:.7,size:.3,size1:0,bright:2.2});AU.scale=1;AU.bell&&AU.bell();npcUI(null);}}
  else{b.prog=Math.max(0,b.prog-dt*2);npcUI(b,0);}}

/* ---------- per frame ---------- */
onEv('frame',dt=>{if(NPC_LIMBS.length)npcLimbsTick(dt);if(!NPC.length)return;if(!inMatch()){return;}
  npcStrikes();npcRescueTick(dt);
  for(const n of NPC){if(n.mode==='gone'){n.g.visible=false;continue;}const near=nearCam(n.g.position,88);
    if(!near&&n.lift<=0){n.g.visible=false;if(n.danger&&game.time>n.danger.t)n.danger=null;if(n.kind==='walker'&&(n.mode!=='down'||game.time-(n.downT||0)>60)&&(n.mode!=='dead'||game.time-n.deadT>40)&&!n.danger&&Math.random()<.03&&!nearCam(n.g.position,130))npcRelocate(n);continue;}n.g.visible=true;
    if(n.spurtT&&game.time<n.spurtT&&n.stump&&Math.random()<.8){const sp=n.stump.getWorldPosition(TMP2);burst(SMK,sp,2,{colors:[0x9a0a18,0x7a0010],speed:2.4,up:1.5,life:.5,size:.07,size1:.04,grav:14});}
    const sp=n.lift>0?0:npcMove(n,dt);if(n.kind!=='walker'&&n.mode!=='down'&&n.mode!=='dead')n.y=floorAt(n.x,n.z,n.y+.6);
    npcPose(n,dt,sp);
    const help=n.danger&&game.time<n.danger.t&&n.mode!=='down'&&n.mode!=='dead'&&n.mode!=='saved';npcBubble(n,help?NPC_HELP:n.mode==='saved'||(n.thxT&&game.time<n.thxT)?NPC_THX:null);
    if(n.bub)n.bub.position.y=2.35+Math.sin(game.time*4+n.ph)*.06;}});
