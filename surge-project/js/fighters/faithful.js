/* SIGNATURE TRAITS — always-on habits that make each inspired fighter fight like their inspiration.
   (Names and looks stay original; these are about HOW they fight.)
   SOLSTICE   right hand freezes, left hand burns: basic hits alternate chill and burn; sprinting skates on an ice trail
   PISTON     engines stall: after Recipro Extend or his ultimate the engines sputter (slowed for a moment); exhaust when sprinting
   SNARE      erasure stare: the foe he's looking at can't use specials — until his eyes dry out and he has to blink
   CRIMSON    knife and blood: basic hits make foes bleed and heal her a little; MASQUERADE disguises her as the victim
   LEGION     panic doubles: the first time he drops low, two copies burst out to cover him
   RECOIL     high-ground sniper: hits on foes well below her deal +30%
   SAWBACK    lizard grip: climbs walls much faster
   CUSHION    sink in: anyone who punches him while he absorbs gets stuck in his body for a moment
   CORROSA    acid skating: sprinting lays down a trail of acid that burns foes */
function heroIs(f,id){return f&&f.hero&&KIT(f.hero,'elem')===id;}
const TRAIT_DESC={solstice:'basic hits alternate freezing and burning · sprinting skates on ice',piston:'engines stall briefly after Recipro Extend / ultimate',
  snare:'the foe he stares at can\'t use specials — until he blinks',crimson:'basic hits draw blood (bleed + heal) · Masquerade disguises her',
  legion:'panic doubles when he first drops low',recoil:'+30% damage from high ground',sawback:'climbs walls fast',cushion:'attackers get stuck in him while absorbing',corrosa:'sprinting leaves burning acid'};

onEv('hit',(a,d,dmg,o)=>{if(!a||!d||a===d||d.dead||NET.role==='client')return;
  const basic=a.state==='attack';
  // SOLSTICE: right = ice, left = fire
  if(heroIs(a,'solstice')&&basic){a._side=(a._side||0)+1;const c=d.chest(new V3());
    if(a._side%2){d.slowT=Math.max(d.slowT||0,1.2);burst(ADD,c,10,{colors:[0xbfefff,0xffffff],speed:3,life:.35,size:.2,size1:0,bright:2});}
    else{burnOn(d,1.6,3);burst(ADD,c,10,{colors:[0xff6a1a,0xffd23f],speed:3,up:2,life:.35,size:.2,size1:0,bright:2.2});}}
  // CRIMSON: every cut draws blood
  if(heroIs(a,'crimson')&&basic){if(typeof dotOn==='function')dotOn(d,'bleed',2,2,a);a.hp=Math.min(100,a.hp+1.5);}
  // RECOIL: shooting down from a rooftop
  if(heroIs(a,'recoil')&&a.pos.y-d.pos.y>4&&dmg>0){d.hp-=dmg*.3;if(a===ME)announceSmall('HIGH GROUND +30%');if(d.hp<=0&&!d.dead){d.hp=0;killFighter(d,a,a.fwd());}}
  // CUSHION: punching him while he absorbs = stuck in his body
  if(heroIs(d,'cushion')&&d.absT>0&&!a.dead&&a.pos.distanceTo(d.pos)<3.2&&a.state!=='framed'){const v=new V3(a.pos.x-d.pos.x,0,a.pos.z-d.pos.z).normalize();
    a.pos.set(d.pos.x+v.x*1.05,a.pos.y,d.pos.z+v.z*1.05);a.vel.set(0,0,0);a.set('framed');a.framedT=.9;ring(a.chest(new V3()),0xffd23f,1.8,.3,false,2.4);
    if(a===ME||d===ME)announceSmall('STUCK IN THE CUSHION!');}
  // LEGION: panic copies
  if(heroIs(d,'legion')&&d.hp<30&&!d._panic&&typeof spawnClone==='function'){d._panic=1;const [fw,sd]=xBasis(d);[-1,1].forEach(s=>spawnClone(d,d.pos.x+sd.x*s*1.8,d.pos.z+sd.z*s*1.8,6));
    if(d===ME)announceSmall('PANIC DOUBLES!');}});
onEv('matchStart',()=>FS.forEach(f=>{f._panic=0;f.eyeT=0;f.blinkT=0;f.stallT=0;}));

/* SNARE: erasure stare + dry eyes */
const ERASE_MAX=5,BLINK=1.6;
onEv('tick',dt=>{for(const f of FS){if(!heroIs(f,'snare')||f.dead||f.downed)continue;
  if(f.blinkT>0){f.blinkT-=dt;f.eyeT=0;if(f._gz){f._gz=null;}continue;}
  const ok=['idle','run','attack','block','air','special'].indexOf(f.state)>=0;let T=null;
  if(ok){const L=foes(f,16,null,.93);T=f.tgt&&L.indexOf(f.tgt)>=0?f.tgt:L[0]||null;}
  if(T){f.eyeT=(f.eyeT||0)+dt;T.eraseT=Math.max(T.eraseT||0,.25);
    if(f._gz!==T){f._gz=T;if(T===ME)announceSmall('YOUR POWER IS ERASED — GET OUT OF HIS SIGHT');else if(f===ME)announceSmall('ERASING '+T.name.toUpperCase());}
    if(Math.random()<dt*8)burst(ADD,TMP2.set(T.pos.x,T.pos.y+2.1,T.pos.z),1,{colors:[0xff2a2a,0xffffff],speed:.2,up:.4,life:.35,size:.16,size1:0,bright:2.2});
    if(f.eyeT>=ERASE_MAX){f.blinkT=BLINK;f._gz=null;if(f===ME)announceSmall('DRY EYES — BLINK!');if(T===ME)announceSmall('HE BLINKED — POWERS BACK!');}}
  else{f._gz=null;f.eyeT=Math.max(0,(f.eyeT||0)-dt*.8);}}});

/* PISTON: engine stall after the big bursts; exhaust while sprinting */
onEv('tick',dt=>{for(const f of FS){if(!heroIs(f,'piston')||f.dead)continue;
  const was=f._pst;f._pst=f.state;
  if(was!==f.state&&(was==='ult'||(was==='special'&&f._pVar==='chg'))){f.stallT=was==='ult'?1.6:1.2;f.slowT=Math.max(f.slowT||0,f.stallT);if(f===ME)announceSmall('ENGINE STALL');}
  if(f.state==='special')f._pVar=f.specVar;
  if(f.stallT>0){f.stallT-=dt;if(Math.random()<dt*14)burst(SMK,TMP2.set(f.pos.x+rand(-.3,.3),f.pos.y+.4,f.pos.z+rand(-.3,.3)),1,{colors:[0x4a4a50,0x2a2a2e],speed:.4,up:1.5,life:.7,size:.4,size1:.9});}
  else if(f.sprinting&&f.onGround&&Math.random()<dt*20)[f.rig.lK,f.rig.rK].forEach(q=>{if(!q)return;q.getWorldPosition(TMP2);burst(ADD,TMP2,1,{colors:[0xffb03a,0xff5a1f],speed:.6,life:.25,size:.22,size1:0,bright:2.2});});}});

/* SOLSTICE ice skating trail · CORROSA acid trail · SAWBACK fast climbing */
const _ftPhys=Fighter.prototype.physics;
Fighter.prototype.physics=function(dt,fr,grav){
  if(this.state==='climb'&&heroIs(this,'sawback'))this.vel.y=Math.max(this.vel.y,7.5);
  if(this.sprinting&&this.onGround&&!this.dead){
    if(heroIs(this,'solstice')&&Math.random()<dt*16)burst(ADD,TMP2.set(this.pos.x+rand(-.3,.3),this.pos.y+.08,this.pos.z+rand(-.3,.3)),1,{colors:[0xbfefff,0xffffff],speed:.2,life:.6,size:.35,size1:.1,bright:1.6});
    if(heroIs(this,'corrosa')){this._acT=(this._acT||0)-dt;if(Math.random()<dt*12)burst(ADD,TMP2.set(this.pos.x,this.pos.y+.1,this.pos.z),1,{colors:[0xb8ff3a,0x6aff2a],speed:.3,life:.4,size:.25,size1:0,bright:1.8});
      if(this._acT<=0&&NET.role!=='client'&&typeof acidAt==='function'){this._acT=.45;acidAt(this,this.pos.x,this.pos.z,1.2,3);}}}
  return _ftPhys.call(this,dt,fr,grav);};

/* CRIMSON: MASQUERADE also disguises her — the victim's colors and name for 12 s */
if(ALTULT.crimson){const A=ALTULT.crimson,_u=A.u;A.u=function(f,t){const r=_u.call(this,f,t);const T=f.vf.T;
  if(T&&!f.vf.dg&&f.stateT>.9){f.vf.dg=1;disguise(f,T,12);}return r;};}
function disguise(f,T,dur){undisguise(f);const mats=[];f.rig.root.traverse(o=>{if(!o.isMesh||!o.material||!o.material.color)return;if(!o.userData.dgOrig){o.userData.dgOrig=o.material;o.material=o.material.clone();}
  const c=o.material.color,l=(c.r+c.g+c.b)/3;o.material.color.setHex(l>.55?T.hero.accent:l>.25?T.hero.color:T.hero.suit);mats.push(o);});
  f.dg={meshes:mats,name:f.name,t:dur};f.name=T.name;burst(ADD,f.chest(new V3()),40,{colors:[T.hero.color,T.hero.accent,0xffffff],speed:6,life:.6,size:.3,size1:0,bright:2.4});
  if(f===ME)announceSmall('DISGUISED AS '+T.name.toUpperCase());}
function undisguise(f){if(!f.dg)return;f.dg.meshes.forEach(o=>{if(o.userData.dgOrig){o.material.dispose();o.material=o.userData.dgOrig;o.userData.dgOrig=null;}});f.name=f.dg.name;f.dg=null;}
onEv('tick',dt=>{for(const f of FS){if(!f.dg)continue;f.dg.t-=dt;if(f.dg.t<=0||f.dead)undisguise(f);}});
onEv('matchEnd',()=>FS.forEach(undisguise));

/* show the trait in the fighter select move list */
if(typeof movesHTML==='function'){const _mh=movesHTML;movesHTML=function(h){const s=_mh(h),d=TRAIT_DESC[KIT(h,'elem')];return d?s+`<br><b>TRAIT</b><i> ${d}</i>`:s;};}
