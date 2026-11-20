/* MARROW · DREAD FORM — a second moveset built on FEAR as an energy. Press 5 to switch between BONE and DREAD.
   DREAD swaps everything: specials, extra moves, ultimates, punches (shadow claws that spread fear) and the look
   (violet-black body, sickly green glow, rising fear wisps).
   TERROR (the fear status): foes deal 25% less damage, move slower and sometimes freeze up in panic.
   Marrow FEEDS on fear: every terrified foe within 15 m charges his ultimate and heals him a little.
     1  DREAD WAVE        a cone of ghostly fear — damages and terrifies       (hold: PANIC BURST — a terrifying ring around him)
     2  NIGHTMARE GRASP   a spectral hand drags a far foe to him, terrified
     3  PHANTOM SWARM     a volley of fear phantoms        4  SCREAM   a stunning cone of sound
     Q  ABSOLUTE DREAD    darkness falls: every foe nearby is terrified for 6 s and drained each second (he heals)
     Q+back  FEAR INCARNATE  8 s as a towering shadow — armored, stronger, and everyone close to him is terrified
   The form switch goes through the host, so everyone sees the same form online. */
const DR_V=0x6a2a9a,DR_G=0x8aff6a,DR_D=0x120a1a;
Object.assign(SPNAME,{dread:'DREAD WAVE'});
Object.assign(HERO_SND,{dread:SND.curse?'curse':'power'});
Object.assign(ULT_RANGE,{absdread:18});
Object.assign(SPECIAL_AI,{dread:[0,9,.6]});
Object.assign(XSPK,{dread:1});
Object.assign(XMOVES,{dread:[['PHANTOM SWARM','volley','shadow','orb',['slow']],['SCREAM','cone','sound','ring',['stun']]]});
// (the voice tables load later, so register once everything is loaded)
setTimeout(()=>{try{VPROF.dread={sex:'m',a:'au',p:.48,r:.82,v:1.05,vi:3};VCRY.dread=[['Can you feel it?',0],['Your fear... it tastes wonderful.',-.06]];}catch(e){}},0);
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.dread='feeds on fear: terrified foes nearby charge his ultimate and heal him · press 5 to switch form';
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.marrow='press 5 to switch to DREAD form (fear energy)';

/* ---------- the two forms ---------- */
function dreadHero(base){if(base._dread)return base._dread;const D=Object.assign({},base,{as:{elem:'dread',alt:'dread',wpn:'umbra'},special:'dread',specCD:2.4,ult:'absdread',
  ultName:'ABSOLUTE DREAD',altName:'FEAR INCARNATE',power:'Fear Energy',color:DR_V,accent:DR_G,css:'#a46aff',_xm:null,_bone:base});base._dread=D;return D;}
function isDread(f){return !!(f&&f.hero&&f.hero._bone);}
function canSwitch(f){return f&&!f.dead&&HAS(f.hero._bone||f.hero,'marrow')&&KIT(f.hero._bone||f.hero,'elem')==='marrow'&&['idle','run','air','attack','block'].indexOf(f.state)>=0&&!(f._formCD>game.time);}
function setForm(f,dread){if(!f||isDread(f)===!!dread)return;const base=f.hero._bone||f.hero;f.hero=dread?dreadHero(base):base;f._formCD=game.time+1.5;f.stolen=null;f.stolenT=0;f.bladeT=0;
  formSkin(f,dread);const c=f.chest(new V3());
  if(dread){burst(SMK,c,30,{colors:[DR_D,DR_V],speed:4,up:2,life:.9,size:.6,size1:1.6});ring(c,DR_G,3.2,.35,false,2.6);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),DR_V,4,.4,true,2.4);}
  else{burst(ADD,c,24,{colors:[0xe8e4dc,0xc4102a],speed:6,life:.4,size:.25,size1:0,bright:2.2});ring(c,0xe8e4dc,3,.3,false,2.4);}
  xSnd(f.pos,()=>{AU.whoosh(true);if(SND.curse&&dread)SND.curse.hit(1.2);});
  if(f===ME){announceSmall(dread?'DREAD FORM — FEAR IS ENERGY':'BONE FORM');if(typeof buildSlots==='function')buildSlots();}}
// recolor the body: dark violet-black with a sickly green glow (originals are restored when switching back)
function formSkin(f,dread){f.rig.root.traverse(o=>{if(!o.isMesh||!o.material||!o.material.color)return;
  if(dread){if(!o.userData.drOrig){o.userData.drOrig=o.material;o.material=o.material.clone();}const c=o.userData.drOrig.color,l=(c.r+c.g+c.b)/3;
    o.material.color.setHex(l>.6?DR_G:l>.3?DR_V:DR_D);if(o.material.emissive){o.material.emissive.setHex(l>.6?DR_G:0x1a0a2a);o.material.emissiveIntensity=l>.6?1.2:.4;}}
  else if(o.userData.drOrig){o.material.dispose();o.material=o.userData.drOrig;o.userData.drOrig=null;}});}
// press 5 (players) — goes through the host online
// (switching is handled by forms.js — the SWITCH MODE action, 5)
function formReq(f,on){if(NET.role==='client'){netSay({k:'mform',id:f.id,on:on?1:0});return;}setForm(f,on);if(NET.role==='host')netSay({k:'mformFx',id:f.id,on:on?1:0});}
onEv('x:mform',e=>{if(NET.role==='host'&&e.from!==NET.myId){const f=FS.find(q=>q.id===e.id);if(f&&!(f._formCD>game.time)){setForm(f,!!e.on);netSay({k:'mformFx',id:f.id,on:e.on});}}});
onEv('x:mformFx',e=>{if(NET.role==='client'){const f=FS.find(q=>q.id===e.id);if(f)setForm(f,!!e.on);}});
// bots switch now and then
onEv('matchEnd',()=>FS.forEach(f=>{if(isDread(f)){f.hero=f.hero._bone;formSkin(f,false);}}));

/* ---------- TERROR ---------- */
function terrify(f,o,t){if(!o||o.dead||ally(o,f))return;const was=o.terrorT>0;o.terrorT=Math.max(o.terrorT||0,t);o.terrorBy=f;o.slowT=Math.max(o.slowT||0,Math.min(t,2.5));
  if(!was){burst(SMK,o.chest(new V3()),12,{colors:[DR_V,DR_D],speed:2,up:2,life:.7,size:.4,size1:1});if(o===ME)announceSmall('TERRIFIED — YOUR HITS ARE WEAKER');}}
const _drHit=applyHit;applyHit=function(att,def,o){if(att&&att.terrorT>0&&o&&o.dmg){o=Object.assign({},o);o.dmg*=.75;}return _drHit(att,def,o);};
onEv('hit',(a,d,dmg)=>{if(a&&isDread(a)&&a.state==='attack'&&d!==a)terrify(a,d,1.6);});
onEv('tick',dt=>{for(const o of FS){if(!(o.terrorT>0))continue;o.terrorT-=dt;if(o.dead){o.terrorT=0;continue;}
    if(Math.random()<dt*7&&nearCam(o.pos,60))burst(SMK,TMP2.set(o.pos.x+rand(-.3,.3),o.pos.y+2.1,o.pos.z+rand(-.3,.3)),1,{colors:[DR_V,DR_G],speed:.2,up:.8,life:.6,size:.25,size1:.5});
    // panic: now and then they freeze up for a moment
    if(NET.role!=='client'&&Math.random()<dt*.35&&['idle','run'].indexOf(o.state)>=0){o.set('hit');o.stunT=.45;o.vel.set(0,o.vel.y,0);}}
  // feeding on fear
  for(const f of FS){if(!isDread(f)||f.dead)continue;let n=0;for(const o of FS)if(o.terrorT>0&&!o.dead&&o.pos.distanceTo(f.pos)<15)n++;
    if(n&&NET.role!=='client'){f.meter=Math.min(100,f.meter+n*2.2*dt);f.hp=Math.min(100,f.hp+n*.8*dt);}
    if(Math.random()<dt*10&&nearCam(f.pos,60)){const a=rand(0,6.28);burst(Math.random()<.5?ADD:SMK,TMP2.set(f.pos.x+Math.cos(a)*.5,f.pos.y+rand(.1,1.8),f.pos.z+Math.sin(a)*.5),1,{colors:[DR_G,DR_V],speed:.2,up:1.6,life:.6,size:.22,size1:.4,bright:1.8});}}});

/* ---------- moves ---------- */
SPECIALS.dread=function(f){once(f,.22,()=>{const T=tgtOf(f,10);if(T)faceTo(f,T);const fw=f.fwd(),c=f.chest(new V3());
    for(let i=0;i<14;i++){const d=fw.clone().applyAxisAngle(UP,rand(-.55,.55));burst(SMK,c,1,{colors:[DR_V,DR_D],speed:rand(8,13),life:.6,size:.6,size1:1.4,dir:d});burst(ADD,c,1,{colors:[DR_G],speed:rand(9,14),life:.4,size:.25,size1:0,bright:2,dir:d});}
    ring(c,DR_G,2.4,.25,false,2.4);xSnd(f.pos,()=>{SND.curse?SND.curse.spec():AU.whoosh(true);});
    if(NET.role!=='client')for(const o of foes(f,9,null,.35)){hitO(f,o,{dmg:8,kb:6,up:2,stun:.5});terrify(f,o,3.5);}});
  vpose(f,.22,'charge','command');endAt(f,.6);return 10;};
SPECVAR.dread={
  chg:['PANIC BURST',(f,dt,k)=>{once(f,.25,()=>{const R=6+3*k,c=f.chest(new V3());ring(c,DR_G,R,.4,false,2.6);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),DR_V,R,.45,true,2.4);
      burst(SMK,c,40,{colors:[DR_V,DR_D],speed:8+4*k,life:.8,size:.7,size1:1.6,flat:true});shake(.4,f.pos);xSnd(f.pos,()=>AU.boom(false));
      if(NET.role!=='client')for(const o of foes(f,R)){hitO(f,o,{dmg:10+8*k,kb:9,up:5,launch:true});terrify(f,o,3+2*k);}});
    vpose(f,.25,'charge','command');endAt(f,.65);return 10;}],
  alt:['NIGHTMARE GRASP',f=>{once(f,.2,()=>{const T=tgtOf(f,18);if(!T)return;const a=f.chest(new V3()),b=T.chest(new V3());
      for(let i=0;i<3;i++)trailSeg(a.clone().add(new V3(0,i*.15-.15,0)),b,i===1?DR_G:DR_V,.12,.45);burst(SMK,b,20,{colors:[DR_V,DR_D],speed:3,life:.6,size:.5,size1:1.2});
      if(NET.role!=='client'){const fw=f.fwd();T.pos.set(f.pos.x+fw.x*1.6,f.pos.y,f.pos.z+fw.z*1.6);T.vel.set(0,0,0);hitO(f,T,{dmg:6,kb:0,up:0,stun:.9});terrify(f,T,2.5);}
      xSnd(f.pos,()=>SND.curse?SND.curse.hit(1):AU.whoosh(false));});
    vpose(f,.2,'charge','point');endAt(f,.55);return 10;}]};
// ABSOLUTE DREAD: darkness falls; every foe nearby terrified for 6 s and drained each second
ULTX.absdread={r:18,s(f){f.vf.t0=null;f.uEnd=99;f.invuln=Math.max(f.invuln,1);f.poseKey='command';},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;V.L=foes(f,18);f.uEnd=t+2.4;}const r=t-V.t0;f.poseKey=r<.5?'charge':'command';
    atT(f,'dark',V.t0+.4,()=>{const c=f.chest(new V3());ring(c,DR_V,18,.6,false,2.4);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),DR_G,18,.6,true,2);shake(.6,c);xSnd(c,()=>AU.boom(true));
      V.L.forEach(o=>{terrify(f,o,6);if(o===ME)dreadDark(5);dreadDrain(f,o,5);});if(f===ME)announceSmall('ABSOLUTE DREAD');});
    if(r>.4&&r<2.2&&Math.random()<.7){const o=pick(V.L);if(o&&!o.dead)burst(SMK,TMP2.set(o.pos.x+rand(-1,1),o.pos.y+rand(.5,2.5),o.pos.z+rand(-1,1)),2,{colors:[DR_V,DR_D,DR_G],speed:1,up:1,life:.8,size:.5,size1:1.2});}
    return 10;}};
function dreadDrain(f,o,n){let k=0;const iv=setInterval(()=>{if(++k>n||!inMatch()||o.dead||f.dead){clearInterval(iv);return;}if(NET.role!=='client'){hitO(f,o,{dmg:4,kb:0,up:0,stun:.15,noSpark:true});f.hp=Math.min(100,f.hp+3);}
  trailSeg(o.chest(new V3()),f.chest(new V3()),DR_G,.06,.4);},1000);}
function dreadDark(sec){let e=$('dreadDark');if(!e){e=document.createElement('div');e.id='dreadDark';document.body.appendChild(e);}e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),sec*1000);}
// FEAR INCARNATE: 8 s as a towering shadow — armored, stronger, foes close to him are terrified
ALTULT.dread={name:'FEAR INCARNATE',r:8,s(f){f.uEnd=1;f.poseKey='charge';},u(f,t){atT(f,'i',.5,()=>{f.incT=8;f.armorT=Math.max(f.armorT||0,8);f.powT=Math.max(f.powT||0,8);f.auraC=DR_V;
  const c=f.chest(new V3());ring(c,DR_V,6,.5,false,2.8);burst(SMK,c,50,{colors:[DR_D,DR_V],speed:5,up:4,life:1.2,size:.9,size1:2});shake(.5,c);if(f===ME)announceSmall('FEAR INCARNATE');});return 10;}};
onEv('tick',dt=>{for(const f of FS){if(!(f.incT>0))continue;f.incT-=dt;const R=f.rig.root;if(f.incT<=0||f.dead){f.incT=0;if(!f.xHold)R.scale.setScalar(f.hero.scale);continue;}
  if(!f.xHold)R.scale.setScalar(f.hero.scale*1.35);if(NET.role!=='client')for(const o of foes(f,7))terrify(f,o,.6);
  if(Math.random()<dt*20)burst(SMK,TMP2.set(f.pos.x+rand(-.8,.8),f.pos.y+rand(0,2.6),f.pos.z+rand(-.8,.8)),1,{colors:[DR_D,DR_V],speed:.4,up:1.4,life:.8,size:.6,size1:1.4});}});
Object.assign(PFX,{dread(a,d,t){terrify(a,d,t>=2?3:1.6);}});
Object.assign(PFX_DESC,{dread:'every hit terrifies; charged hits terrify longer'});
if(typeof UO!=='undefined')UO.dread=(f,t,c)=>{uoSwirl(f,c,DR_V,DR_G,5,SMK);if(uo1(f,'r',.4))ring(c,DR_G,4,.3,false,2.6);};
onEv('matchStart',()=>setTimeout(()=>{if(ME&&KIT(ME.hero._bone||ME.hero,'elem')==='marrow')announceSmall('MARROW: PRESS 5 TO SWITCH BETWEEN BONE AND DREAD FORM');},2500));
