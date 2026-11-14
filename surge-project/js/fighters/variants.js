/* Move variants */
/* ================= MOVE VARIANTS =================
   Every fighter's punches, specials and ultimates change with:
   - direction: holding forward / back / nothing (relative to where you face)
   - holding the button: charged heavy, charged special, overcharged ultimate
   - situation: in the air, sprinting */
function inDir(f){
  if(f.isBot)return (f.aiVar&&game.time<f.aiVar.until&&f.aiVar.dir)||'n';
  const I=f.intent,m=Math.hypot(I.wx||0,I.wz||0);if(m<.3)return 'n';
  let fx=Math.sin(I.aim||0),fz=Math.cos(I.aim||0);
  const d=(I.wx*fx+I.wz*fz)/m;return d>.5?'f':d<-.5?'b':'n';}
function held(f,k){if(f.isBot)return !!(f.aiVar&&f.aiVar.k===k&&game.time<f.aiVar.holdUntil);return !!f.intent['h'+k];}
const SVAR=['n','chg','alt'];

/* ---- punch variants, built for each weapon style ---- */
function wcls(f){if(f.hero.gear&&f.hero.gear.type!=='none')return gearCls(f.hero.gear);const id=KIT(f.hero,'wpn');return id==='recoil'?'gshot':id==='marrow'?(f.bladeT>0?'blade':'whip'):id==='umbra'?'beast':id==='ronin'?'sword':id==='scathe'?'claw':'fist';}
const WCLS={fist:{},whip:{rng:2.6,whip:'r',lm:.3},blade:{rng:.5},beast:{rng:1.4,beast:1,lat:.6,lm:.4},sword:{rng:.8,limb:'s',lat:.5},claw:{rng:.4,lat:.5}};
const VMOVES={
  vLunge:{st:.1,ac:.1,rc:.26,dmg:6,rng:2,kb:7,up:3,stun:.5,lunge:13,w:'jabRw',h:'jabRh',limb:'r',vfx:1},
  vSweep:{st:.14,ac:.14,rc:.3,dmg:6,rng:2.7,lat:2.6,kb:5,up:8,stun:.5,lunge:11,launch:true,w:'heavyw',h:'slash',limb:'f',vfx:1},
  vRush:{st:.08,ac:.14,rc:.34,dmg:8,rng:2.2,kb:15,up:6,stun:.5,lunge:16,launch:true,heavy:true,w:'dash',h:'kickh',limb:'f',vfx:2},
  vDrive:{st:.26,ac:.1,rc:.4,dmg:12,rng:2.3,kb:19,up:4,stun:.5,lunge:9,launch:true,heavy:true,shock:true,w:'heavyw',h:'smashh',limb:'r',vfx:2},
  vRise:{st:.14,ac:.12,rc:.4,dmg:10,rng:2.4,kb:2,up:17,stun:.5,lunge:10,launch:true,heavy:true,inv:.22,w:'charge',h:'heavyh',limb:'r',vfx:2},
  vCharge:{st:.3,ac:.12,rc:.42,dmg:12,rng:2.4,kb:12,up:9,stun:.5,lunge:8,launch:true,heavy:true,gb:true,hold:true,w:'charge',h:'smashh',limb:'r',vfx:3},
  vDive:{st:.1,ac:.6,rc:.3,dmg:9,rng:1.9,kb:8,up:8,stun:.5,lunge:4,launch:true,heavy:true,air:true,dive:true,w:'slamAir',h:'slamAir',limb:'f',vfx:2},
};
for(const c in WCLS)for(const v in VMOVES){const b=VMOVES[v],w=WCLS[c],m=Object.assign({},b);m.rng=b.rng+(w.rng||0);
  if(w.whip&&!b.air){m.whip=w.whip;m.wt=v==='vSweep'?'sweep':(v==='vRise'||v==='vCharge'?'over':'thrust');m.lunge=b.lunge*w.lm;}
  if(w.beast&&!b.air){m.beast=1;m.lat=(b.lat||1.2)+w.lat;m.lunge=b.lunge*w.lm;}
  if(w.limb&&!b.air)m.limb=w.limb;if(w.lat&&!w.beast)m.lat=(b.lat||1.15)+w.lat;
  MOVES[v+'_'+c]=m;MOVEK.push(v+'_'+c);}
const NEUTRAL_H={fist:'heavy',whip:'whipH',blade:'bladeH',beast:'shadowH',sword:'swordH',claw:'clawH'};
function variantLight(f){const I=f.intent,c=wcls(f),sp=Math.hypot(f.vel.x,f.vel.z);
  if(I.sprint&&sp>9&&!f.locked)return 'vRush_'+c;const d=inDir(f);if(d==='f')return 'vLunge_'+c;if(d==='b')return 'vSweep_'+c;return null;}
function dirHeavy(f){const c=wcls(f),d=inDir(f);if(d==='f')return 'vDrive_'+c;if(d==='b')return 'vRise_'+c;return KIT(f.hero,'wpn')==='titan'?'smash':NEUTRAL_H[c];}
function chargeFX(f,col){if(Math.random()<.7){const c=f.chest(TMP3),a=rand(0,6.28),r=rand(1.2,2.2);ADD.spawn(c.x+Math.cos(a)*r,c.y+rand(-.8,.8),c.z+Math.sin(a)*r,-Math.cos(a)*r*4,0,-Math.sin(a)*r*4,..._rgb(col||f.hero.color,2.2),.25,.3,.05,0,0);}}
function vName(f,n){if(f===ME)announceSmall(n);}

/* ---- shared helpers for variant moves ---- */
function foes(f,R,p,cone){p=p||f.pos;const fw=f.fwd(),out=[];for(const o of FS){if(ally(o,f)||o.dead||o.downed)continue;const dx=o.pos.x-p.x,dz=o.pos.z-p.z,d=Math.hypot(dx,dz);
  if(d>R||Math.abs(o.pos.y-p.y)>4)continue;if(cone!=null&&d>.6&&(dx*fw.x+dz*fw.z)/d<cone)continue;out.push(o);}return out;}
function hitO(f,o,x){return applyHit(f,o,Object.assign({dmg:8,kb:6,up:0,stun:.5,pt:o.chest(new V3())},x||{}));}
function lineFoes(f,from,dir,L,w){const out=[];for(const o of FS){if(ally(o,f)||o.dead||o.downed)continue;const rx=o.pos.x-from.x,rz=o.pos.z-from.z,al=rx*dir.x+rz*dir.z,lt=Math.abs(rx*dir.z-rz*dir.x);
  if(al>-.5&&al<L+.8&&lt<w&&Math.abs(o.pos.y-f.pos.y)<3)out.push(o);}return out;}
function clearLen(p,dir,max,y){let L=max;for(let d=.5;d<=max;d+=.5){const x=p.x+dir.x*d,z=p.z+dir.z*d;if(Math.abs(x)>BOUND||Math.abs(z)>BOUND||insideBld(x,z,.3,y==null?1:y)){L=d-.5;break;}}return Math.max(0,L);}
function endAt(f,t){if(f.stateT>t)f.set(f.onGround?'idle':'air');}
function once(f,t0,fn){if(!f.fired&&f.stateT>t0){f.fired=true;fn();}}
function atT(f,key,t0,fn){if(!f.vf[key]&&f.stateT>t0){f.vf[key]=1;fn();}}
function projX(f,type,ang,o){o=o||{};spawnProj(f,type,ang,Object.assign({quiet:true},o));const p=projs[projs.length-1];if(!p||p.owner!==f)return null;
  if(o.sc){p.mesh.scale.multiplyScalar(o.sc);p.r*=o.sc;}if(o.dm)p.dmg*=o.dm;if(o.vm)p.vel.multiplyScalar(o.vm);if(o.pierce)p.pierce=true;if(o.mark)p.mark=o.mark;return p;}
function blink(f,x,z){x=clamp(x,-BOUND+1,BOUND-1);z=clamp(z,-BOUND+1,BOUND-1);if(insideBld(x,z,.6,f.pos.y+.5))return false;
  portal(f.chest(new V3()),1.1,false,.5,f.face);f.pos.x=x;f.pos.z=z;f.vel.x=f.vel.z=0;portal(f.chest(new V3()),1.1,false,.5,f.face);return true;}
function faceTo(f,o){f.face=Math.atan2(o.pos.x-f.pos.x,o.pos.z-f.pos.z);}
function tgtOf(f,R){return (f.tgt&&!f.tgt.dead&&!f.tgt.downed&&f.tgt.pos.distanceTo(f.pos)<R)?f.tgt:enemyInFront(f,R,0);}
function pullTo(o,x,z){if(!insideBld(x,z,.5,o.pos.y+.5)){o.pos.x=x;o.pos.z=z;}}
function heal(f,n){if(NET.role!=='client')f.hp=Math.min(100,f.hp+n);}
function burnOn(o,t,d,blue){o.burnT=Math.max(o.burnT||0,t);o.burnD=d;o.burnB=!!blue;}
function reflectProjs(f,R){for(const p of projs){if(p.dead||ally(p.owner,f)||p.pos.distanceTo(f.pos)>R)continue;p.vel.negate();p.owner=f;p.hitSet={};p.t=0;
  burst(ADD,p.pos,12,{colors:[0xffc08a,0xffffff],speed:6,life:.25,size:.2,bright:2.4});}}
function sndHere(f,fn){const s=AU.scale;AU.scale=sndAt(f.pos);fn();AU.scale=s;}
function vpose(f,t0,a,b){f.poseKey=f.stateT<t0?(a||'specw'):(b||'spech');}

/* ---- each fighter's power adds an effect to its variant punches (tier 1 light, 2 heavy, 3 charged) ---- */
const PFX={
  cinder(a,d,t,p){burnOn(d,1.5+t,2.5+t);burst(ADD,p,10*t,{colors:[0xff5a1f,0xffb347,0xffffff],speed:5,up:2,life:.4,size:.3,bright:2.2});
    if(t===3){explosion(p,2.4,[0xff5a1f,0xffb347]);foes(a,3,d.pos).forEach(o=>{if(o!==d)hitO(a,o,{dmg:6,kb:8,up:6,launch:true,noSpark:true});});}},
  riptide(a,d,t,p){d.slowT=Math.max(d.slowT||0,1.5+t);burst(ADD,p,12*t,{colors:[0x1fb8ff,0x9af0ff,0xffffff],speed:6,up:3,life:.45,size:.25,bright:1.8,grav:9});
    if(t>=2)ring(TMP.set(d.pos.x,.2,d.pos.z),0x1fb8ff,3+t,.4,true,2);},
  gale(a,d,t,p){d.vel.y=Math.max(d.vel.y,3+t*2.5);ring(p,0xcfe4ff,1.6+t*.4,.3,false,2);
    if(t>=2)foes(a,4.5,a.pos,.3).forEach(o=>{if(o!==d)hitO(a,o,{dmg:3,kb:11,up:5,launch:true,noSpark:true});});},
  nitro(a,d,t,p){miniBlast(p,.6+t*.3);const fw=a.fwd(TMP3);d.vel.x+=fw.x*3*t;d.vel.z+=fw.z*3*t;
    if(t===3){explosion(p,3,[0xff7a10,0xffd04a]);foes(a,3.2,d.pos).forEach(o=>{if(o!==d)hitO(a,o,{dmg:8,kb:10,up:7,launch:true,noSpark:true});});}},
  titan(a,d,t,p){if(t>=2){ring(TMP.set(a.pos.x,.2,a.pos.z),0xffb04a,3+t,.4,true,2.2);dust(a.pos,10,1.3);foes(a,2.5+t).forEach(o=>{if(o!==d)hitO(a,o,{dmg:5,kb:8,up:6,launch:true,noSpark:true});});}
    else{d.stunT=(d.stunT||0)+.15;dust(d.pos,6,.8);}},
  volta(a,d,t,p){let from=d;const hs=[d];for(let i=0;i<(t===3?3:1);i++){let N=null,nd=7;for(const o of FS){if(ally(o,a)||o.dead||hs.indexOf(o)>=0)continue;const q=o.pos.distanceTo(from.pos);if(q<nd){nd=q;N=o;}}
      if(!N)break;bolt(from.chest(new V3()),N.chest(new V3()),0xffe03a,.07,.2);hitO(a,N,{dmg:4,kb:1,stun:.6,noSpark:true});hs.push(N);from=N;}
    bolt(p,p.clone().add(new V3(rand(-1,1),rand(1,2),rand(-1,1))),0xffe03a,.05,.15);d.stunT=(d.stunT||0)+.1*t;},
  umbra(a,d,t,p){const fw=a.fwd();d.vel.x-=fw.x*(3+2*t);d.vel.z-=fw.z*(3+2*t);burst(SMK,p,8*t,{colors:[0x1a0a2a,0x4a2a8a],speed:3,life:.7,size:.4,size1:.9,drag:2});
    if(t>=2)bolt(TMP.set(d.pos.x,0,d.pos.z).clone(),d.chest(new V3()),0x7a4cff,.08,.25);},
  drift(a,d,t,p){ring(p,0xb58cff,1.4+t*.3,.3,false,2);if(t>=2&&!d.dead&&d.state!=='float')applyHit(a,d,{dmg:1,float:.7+.35*t,noSpark:true,pt:p});},
  bastion(a,d,t,p){a.armorT=Math.max(a.armorT,.6*t);ring(a.chest(TMP),0xff6a2a,1.8,.3,false,2);burst(ADD,p,8*t,{colors:[0xffc08a,0xffffff],speed:8,life:.25,size:.18,bright:2.5});},
  quill(a,d,t,p){for(let k=0;k<t*2;k++)projX(a,'feather',(k-(t-.5))*.12);},
  void(a,d,t,p){const dx=d.pos.x-a.pos.x,dz=d.pos.z-a.pos.z,l=Math.hypot(dx,dz)||1;d.vel.x+=dx/l*4*t;d.vel.z+=dz/l*4*t;implode(p,10*t,1.4,[0x8ac4ff,0xffffff],.35,2.2);if(t===3)a.fieldT=Math.max(a.fieldT,1.2);},
  ronin(a,d,t,p){slashFX(p,0xff6060,1.6);if(t>=2)for(let k=0;k<t-1;k++)projX(a,'slashwave',(k-(t-2)*.5)*.15);},
  quake(a,d,t,p){spike(d.pos.x,d.pos.z,.8+t*.3);debris(p,3*t,1,6,.2);
    if(t>=2){const fw=a.fwd();for(let k=1;k<=t+1;k++)spike(a.pos.x+fw.x*k*1.3,a.pos.z+fw.z*k*1.3,.9);d.vel.y=Math.max(d.vel.y,8);}},
  marrow(a,d,t,p){heal(a,2.5*t);burst(SMK,p,10*t,{colors:[0x8a1020,0xc4102a],speed:4,life:.6,size:.22,size1:.05,grav:12});
    const c=a.chest(TMP3);for(let k=0;k<4*t;k++)ADD.spawn(p.x,p.y,p.z,(c.x-p.x)*2.5+rand(-1,1),(c.y-p.y)*2.5+rand(0,1),(c.z-p.z)*2.5+rand(-1,1),..._rgb(0xff3048,2),.35,.18,.05,0,0);},
  entropy(a,d,t,p){d.decay=Math.min(5,(d.decay||0)+t);d.decayT=4;},
  sovereign(a,d,t,p){const s=Math.min(d.meter,6*t);d.meter-=s;a.meter=Math.min(100,a.meter+s);bolt(d.chest(new V3()),a.chest(new V3()),0x8a3cff,.04,.25);},
  strobe(a,d,t,p){panel(d.pos,a.face,0x3fe0c5,.3);if(t>=2&&!d.dead&&d.state!=='framed'){d.set('framed');d.framedT=.35+.25*t;d.vel.set(0,0,0);d.rig.frame.visible=true;}},
  pyre(a,d,t,p){burnOn(d,2+t,3+t*1.2,true);burst(ADD,p,10*t,{colors:[0x2a8aff,0xaee0ff,0xffffff],speed:5,up:3,life:.45,size:.3,bright:2.4});},
  warp(a,d,t,p){if(t===1){const b=d.fwd();if(blink(a,d.pos.x-b.x*1.4,d.pos.z-b.z*1.4))faceTo(a,d);}
    else{portal(d.chest(new V3()),1.2,false,.5,a.face);d.pos.y+=.2;d.onGround=false;d.vel.y=Math.max(d.vel.y,9+t*2);}},
  hex(a,d,t,p){d.marks=(d.marks||0)+(t-1);d.markT=6;},
  scathe(a,d,t,p){for(let k=0;k<t;k++)CUTS.push({att:a,def:d,t:game.time+.2+k*.12});},
};
function punchFX(a,d,t,p){const fn=PFX[KIT(a.hero,'elem')];if(fn&&!d.dead)fn(a,d,t,p);}
function diveLand(f){const p=f.pos.clone();ring(TMP.set(p.x,.2,p.z),f.hero.color,4.5,.4,true,2.4);dust(p,16,1.4);shake(.5,p);sndHere(f,()=>AU.landW(1.4,true));
  foes(f,3.4).forEach(o=>{if(Math.abs(o.pos.y-f.pos.y)<2&&hitO(f,o,{dmg:9,kb:9,up:9,launch:true,heavy:true})===true)punchFX(f,o,2,o.chest(new V3()));});}

/* ---- special variants: [name, fn] — 'chg' = held button, 'alt' = holding back ---- */
const SPECVAR={
  fireball:{
    chg:['GIGA FIREBALL',(f,dt,k)=>{once(f,.12,()=>{const p=projX(f,'fireball',0,{sc:1.6+k,dm:1.6+k*1.2,vm:.85});if(p){p.pierce=true;p.kb*=1.4;}});vpose(f,.12);endAt(f,.4);return 10;}],
    alt:['FLAME RING',f=>{once(f,.15,()=>{const c=f.pos.clone();explosion(f.chest(new V3()),3.5,[0xff5a1f,0xffb347,0xff2a10]);for(let i=0;i<10;i++){const a=i/10*6.28;spikeFire(c.x+Math.cos(a)*3,c.z+Math.sin(a)*3);}
      foes(f,5.5).forEach(o=>{hitO(f,o,{dmg:9,kb:11,up:8,launch:true,heavy:true});burnOn(o,3,3);});});vpose(f,.15,'charge');endAt(f,.5);return 12;}]},
  blade:{
    chg:['TRIPLE CRESCENT',(f,dt,k)=>{once(f,.12,()=>{[-.28,0,.28].forEach(a=>projX(f,'blade',a,{sc:1+k*.4,dm:1+k*.6}));});vpose(f,.12);endAt(f,.4);return 10;}],
    alt:['UNDERTOW',f=>{once(f,.14,()=>{const fw=f.fwd(),c=f.chest(new V3());for(let d=1;d<10;d+=.5)burst(ADD,TMP.copy(c).addScaledVector(fw,d),2,{colors:[0x1fb8ff,0x9af0ff],speed:2,life:.4,size:.3,bright:1.8,dir:fw,dirSp:-12});
      foes(f,10,f.pos,.5).forEach(o=>{pullTo(o,f.pos.x+fw.x*1.8,f.pos.z+fw.z*1.8);hitO(f,o,{dmg:6,kb:0,stun:.8,hold:true});o.slowT=3;});});vpose(f,.14);endAt(f,.5);return 10;}]},
  cyclone:{
    chg:['TWIN CYCLONES',(f,dt,k)=>{once(f,.15,()=>{[-.35,.35].forEach(a=>projX(f,'cyclone',a,{sc:1.3,dm:1+k}));});vpose(f,.15);endAt(f,.45);return 10;}],
    alt:['UPDRAFT',f=>{once(f,.1,()=>{f.vel.y=17;f.onGround=false;f.pos.y+=.1;ring(TMP.set(f.pos.x,.2,f.pos.z),0xcfe4ff,5,.4,true,2.2);swirl(f.chest(new V3()),30,2.5,[0xcfe4ff,0xffffff],6,.5,1.8);
      foes(f,4.5).forEach(o=>hitO(f,o,{dmg:7,kb:3,up:14,launch:true}));});f.poseKey='jump';endAt(f,.35);return 0;}]},
  rocket:{
    chg:['MEGA ROCKET',(f,dt,k)=>{const t=f.stateT;f.poseKey=t<.15?'jabRw':'dash';
      if(!f.fired&&t>.15){f.fired=true;f.hitDone=false;f.rocketDir=f.fwd();miniBlast(f.chest(new V3()).addScaledVector(f.rocketDir,-.8),1.8);shake(.4,f.pos);}
      if(f.fired&&t<.75){const sp=(30+18*k)*Math.max(.2,1-(t-.15)/.6);f.vel.x=f.rocketDir.x*sp;f.vel.z=f.rocketDir.z*sp;
        burst(ADD,f.chest(TMP2).addScaledVector(f.rocketDir,-.6),4,{colors:[0xff7a10,0xffd04a,0xffffff],speed:2,life:.25,size:.5,size1:0,bright:2.2,dir:f.rocketDir,dirSp:-8});if(!f.hitDone)f.tryHit(MOVES.rocket);}
      if(f.fired)atT(f,'boom',.75,()=>{explosion(f.chest(new V3()),3.2,[0xff7a10,0xffd04a,0xffffff]);sndHere(f,()=>AU.boom(false));foes(f,3.4).forEach(o=>hitO(f,o,{dmg:9+6*k,kb:13,up:9,launch:true,heavy:true,noSpark:true}));});
      endAt(f,.85);return f.fired&&t<.75?0:10;}],
    alt:['BLAST JUMP',f=>{once(f,.1,()=>{const fw=f.fwd();explosion(TMP.set(f.pos.x,.5,f.pos.z).clone(),2.8,[0xff7a10,0xffd04a]);f.vel.set(-fw.x*11,16,-fw.z*11);f.onGround=false;f.pos.y+=.1;
      foes(f,5.2).forEach(o=>hitO(f,o,{dmg:8,kb:12,up:9,launch:true,heavy:true,noSpark:true}));});f.poseKey='jump';endAt(f,.35);return 0;}]},
  airburst:{
    chg:['SHOCK CANNON',(f,dt,k)=>{once(f,.2,()=>projX(f,'airburst',0,{sc:1.5+k*.5,dm:1.3+k}));vpose(f,.2,'heavyw','smashh');endAt(f,.5);return 12;}],
    alt:['GROUND POUND',f=>{once(f,.25,()=>{const p=f.pos.clone();ring(TMP.set(p.x,.2,p.z),0xffb04a,10,.5,true,2.4);ring(TMP.set(p.x,.3,p.z),0xffffff,7,.4,true,2);dust(p,24,1.8);debris(TMP.set(p.x,.5,p.z),8,1,9,.3);shake(.7,p);
      foes(f,5.2).forEach(o=>hitO(f,o,{dmg:11,kb:12,up:12,launch:true,heavy:true}));});vpose(f,.25,'heavyw','smashh');endAt(f,.55);return 12;}]},
  chainbolt:{
    chg:['THUNDER SPEAR',(f,dt,k)=>{once(f,.2,()=>{const fw=f.fwd(),c=f.chest(new V3()),L=clearLen(f.pos,fw,18,c.y);const e=c.clone().addScaledVector(fw,L);
      for(let i=0;i<3;i++)bolt(c,e,0xffe03a,.12-i*.03,.3);scorch(e.x,e.z,1.6);flashLight(e,0xffe03a,8);
      lineFoes(f,f.pos,fw,L,1.6).forEach(o=>hitO(f,o,{dmg:9+7*k,kb:3,stun:.9,noSpark:true}));});vpose(f,.2);endAt(f,.5);return 10;}],
    alt:['STATIC FIELD',f=>{once(f,.15,()=>{const c=f.chest(new V3());ring(c,0xffe03a,5,.35,false,2.4);ring(TMP.set(f.pos.x,.2,f.pos.z),0xffe03a,5,.35,true,2.4);
      for(let i=0;i<6;i++){const a=i/6*6.28;bolt(c,c.clone().add(new V3(Math.cos(a)*4,rand(-1,1),Math.sin(a)*4)),0xffe03a,.05,.2);}
      foes(f,5).forEach(o=>{bolt(c,o.chest(new V3()),0xffe03a,.07,.25);hitO(f,o,{dmg:7,kb:4,stun:.9,noSpark:true});});});vpose(f,.15,'charge','command');endAt(f,.45);return 12;}]},
  shadowgrab:{
    chg:['DEVOUR',(f,dt,k)=>{once(f,.15,()=>{const fw=f.fwd();f.vf.list=foes(f,13,f.pos,.6);f.beastReach=13;f.vf.list.forEach(o=>{hitO(f,o,{dmg:5,kb:0,stun:.9,hold:true});});});
      if(f.vf.list&&f.stateT<.5){const fw=f.fwd();f.vf.list.forEach((o,i)=>{if(!o.dead)pullTo(o,lerp(o.pos.x,f.pos.x+fw.x*(1.7+i*.4),.2),lerp(o.pos.z,f.pos.z+fw.z*(1.7+i*.4),.2));});}
      atT(f,'bite',.5,()=>{(f.vf.list||[]).forEach(o=>{if(!o.dead)hitO(f,o,{dmg:8+6*k,kb:5,up:12,launch:true,heavy:true});});});vpose(f,.15,'specw','command');endAt(f,.75);return 10;}],
    alt:['SHADOW STEP',f=>{once(f,.1,()=>{const T=tgtOf(f,14);f.vf.T=T;if(T){const b=T.fwd();if(!blink(f,T.pos.x-b.x*1.5,T.pos.z-b.z*1.5))blink(f,T.pos.x+b.z*1.5,T.pos.z-b.x*1.5);faceTo(f,T);}
      burst(SMK,f.chest(new V3()),20,{colors:[0x1a0a2a,0x4a2a8a],speed:3,life:.8,size:.5,size1:1.2,drag:2});});
      atT(f,'hit',.26,()=>{const T=f.vf.T;if(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.4)hitO(f,T,{dmg:9,kb:9,up:8,launch:true,heavy:true});});vpose(f,.26,'heavyw','command');endAt(f,.5);return 10;}]},
  bubble:{
    chg:['GRAVITY WELL',(f,dt,k)=>{once(f,.15,()=>{const T=tgtOf(f,12),fw=f.fwd();f.vf.wp=T?T.pos.clone():f.pos.clone().addScaledVector(fw,7);f.vf.wp.y=1.2;orb(f.vf.wp,0xb58cff,2.2+k,1,2);});
      if(f.vf.wp&&f.stateT<1.1){const w=f.vf.wp;if(Math.random()<.6)implode(w,4,3,[0xb58cff,0xf2e8ff],.4,2);
        foes(f,6+2*k,w).forEach(o=>{pullTo(o,lerp(o.pos.x,w.x,.06),lerp(o.pos.z,w.z,.06));});}
      atT(f,'pop',1.1,()=>{const w=f.vf.wp;if(!w)return;ring(w,0xb58cff,4,.4,false,2.4);foes(f,3.5,w).forEach(o=>hitO(f,o,{dmg:7+5*k,float:1.6,noSpark:true}));});
      vpose(f,.15,'specw','command');endAt(f,1.2);return 12;}],
    alt:['ANTIGRAV',f=>{once(f,.1,()=>{f.vel.y=13;f.onGround=false;f.pos.y+=.1;ring(TMP.set(f.pos.x,.2,f.pos.z),0xb58cff,4.5,.4,true,2.2);
      foes(f,5.5).forEach(o=>hitO(f,o,{dmg:5,float:1.4,noSpark:true}));});f.poseKey='float';endAt(f,.4);return 0;}]},
  harden:{
    chg:['IRON CHARGE',(f,dt,k)=>{once(f,.15,()=>{f.armorT=Math.max(f.armorT,2.5);f.vf.dir=f.fwd();ring(f.chest(new V3()),0xff6a2a,2.2,.3,false,2.4);f.vf.hit={};});
      const t=f.stateT;if(f.vf.dir&&t<.6){f.vel.x=f.vf.dir.x*24;f.vel.z=f.vf.dir.z*24;burst(ADD,f.chest(TMP2),3,{colors:[0xffc08a,0xff6a2a],speed:2,life:.25,size:.4,bright:2,dir:f.vf.dir,dirSp:-6});
        foes(f,2,f.pos,.2).forEach(o=>{if(!f.vf.hit[o.id]){f.vf.hit[o.id]=1;hitO(f,o,{dmg:9+6*k,kb:16,up:7,launch:true,heavy:true});}});}
      f.poseKey=t<.15?'charge':'dash';endAt(f,.7);return f.vf.dir&&t<.6?0:12;}],
    alt:['REFLECT WALL',f=>{once(f,.08,()=>{f.armorT=Math.max(f.armorT,1.2);ring(f.chest(new V3()),0xffc08a,2.6,.4,false,2.6);});if(f.fired&&f.stateT<.9){reflectProjs(f,3.6);if(Math.random()<.4)ring(f.chest(TMP),0xffc08a,2.2,.2,false,1.8);}
      f.poseKey='block';endAt(f,.9);return 14;}]},
  featherfan:{
    chg:['FEATHER STORM',(f,dt,k)=>{[.15,.3,.45].forEach((t0,w)=>atT(f,'w'+w,t0,()=>{f.fired=true;for(let j=-3;j<=3;j++)projX(f,'feather',j*.15+(w-1)*.05,{dm:1+k*.5});}));vpose(f,.15);endAt(f,.6);return 10;}],
    alt:['WING VAULT',f=>{once(f,.1,()=>{const fw=f.fwd();f.vel.set(-fw.x*14,10,-fw.z*14);f.onGround=false;f.pos.y+=.1;for(let j=-2;j<=2;j++)projX(f,'feather',j*.14);
      burst(ADD,f.chest(new V3()),20,{colors:[0xffe0ea,0xff4f8b],speed:5,life:.5,size:.3,bright:2});});f.poseKey='jump';endAt(f,.35);return 0;}]},
  nullfield:{
    chg:['COLLAPSE POINT',(f,dt,k)=>{const t=f.stateT;if(t>.1&&t<.75){f.fired=true;if(Math.random()<.7)implode(f.chest(TMP2).clone(),5,4,[0x8ac4ff,0xffffff],.35,2);
        foes(f,8+2*k).forEach(o=>pullTo(o,lerp(o.pos.x,f.pos.x,.05),lerp(o.pos.z,f.pos.z,.05)));}
      atT(f,'blast',.75,()=>{const c=f.chest(new V3());ring(c,0x8ac4ff,6,.4,false,2.6);ring(TMP.set(f.pos.x,.2,f.pos.z),0xffffff,7,.4,true,2.2);screenFlash(.25,f.pos);
        foes(f,6).forEach(o=>hitO(f,o,{dmg:8+8*k,kb:15,up:8,launch:true,heavy:true}));});vpose(f,.1,'specw','command');endAt(f,.95);return 12;}],
    alt:['STAR STEP',f=>{once(f,.1,()=>{const star=p=>{burst(ADD,p,30,{colors:[0xffffff,0x8ac4ff,0xffe8a0],speed:7,life:.4,size:.25,bright:2.6});ring(p,0x8ac4ff,2.6,.3,false,2.4);
        foes(f,2.6,p).forEach(o=>hitO(f,o,{dmg:6,kb:8,up:6,launch:true,noSpark:true}));};
      star(f.chest(new V3()));const T=tgtOf(f,12),fw=f.fwd();if(T){const b=T.fwd();blink(f,T.pos.x-b.x*1.6,T.pos.z-b.z*1.6);faceTo(f,T);}else{const L=clearLen(f.pos,fw,9);blink(f,f.pos.x+fw.x*L,f.pos.z+fw.z*L);}
      star(f.chest(new V3()));});vpose(f,.1);endAt(f,.35);return 10;}]},
  vow:{
    chg:['IAI DRAW',(f,dt,k)=>{once(f,.25,()=>{const fw=f.fwd(),s=f.pos.clone(),L=clearLen(s,fw,10+3*k);const e=s.clone().addScaledVector(fw,L);
      cutLine(TMP.copy(s).setY(1.2).clone(),e.clone().setY(1.2),0xff6060,.25,.4);lineFoes(f,s,fw,L,1.6).forEach(o=>hitO(f,o,{dmg:12+8*k,kb:10,up:9,launch:true,heavy:true}));f.pos.copy(e);f.vel.set(0,0,0);});
      vpose(f,.25,'charge','slash');endAt(f,.5);return 10;}],
    alt:['PARRY STANCE',f=>{once(f,.05,()=>{f.parryT=.9;ring(f.chest(new V3()),0xff6060,1.8,.3,false,2);});f.poseKey='block';if(f.parryT<=0&&f.stateT>.1)f.set('idle');endAt(f,.9);return 14;}]},
  fault:{
    chg:['GREAT FISSURE',(f,dt,k)=>{once(f,.2,()=>{projX(f,'fault',0,{sc:1.6,dm:1.4+k});projX(f,'fault',-.3,{dm:.8});projX(f,'fault',.3,{dm:.8});});vpose(f,.2,'heavyw','smashh');endAt(f,.5);return 12;}],
    alt:['SPIKE RING',f=>{once(f,.2,()=>{for(let i=0;i<12;i++){const a=i/12*6.28;spike(f.pos.x+Math.cos(a)*2.6,f.pos.z+Math.sin(a)*2.6,1.3);}dust(f.pos,16,1.4);shake(.4,f.pos);
      foes(f,4.6).forEach(o=>hitO(f,o,{dmg:9,kb:6,up:14,launch:true,heavy:true}));});vpose(f,.2,'heavyw','smashh');endAt(f,.5);return 12;}]},
  bladeform:{
    chg:['BONE SPEAR',(f,dt,k)=>{once(f,.22,()=>{const fw=f.fwd(),L=clearLen(f.pos,fw,10+2*k);for(let d=1;d<=L;d+=1.1)spike(f.pos.x+fw.x*d,f.pos.z+fw.z*d,.9+d*.06);
      lineFoes(f,f.pos,fw,L,1.5).forEach(o=>{if(hitO(f,o,{dmg:11+7*k,kb:6,up:13,launch:true,heavy:true})===true)heal(f,4);});});vpose(f,.22,'charge','spech');endAt(f,.5);return 12;}],
    alt:['FLESH TETHER',f=>{once(f,.15,()=>{const T=tgtOf(f,11);if(T){bolt(f.chest(new V3()),T.chest(new V3()),0xff3048,.09,.4);const fw=f.fwd();pullTo(T,f.pos.x+fw.x*1.8,f.pos.z+fw.z*1.8);
      hitO(f,T,{dmg:6,kb:0,stun:.9,hold:true});heal(f,4);burst(SMK,T.chest(new V3()),14,{colors:[0x8a1020,0xc4102a],speed:4,life:.6,size:.22,size1:.05,grav:12});}});vpose(f,.15);endAt(f,.45);return 10;}]},
  erode:{
    chg:['WIDE ERODE',(f,dt,k)=>{once(f,.2,()=>{[-.3,0,.3].forEach(a=>projX(f,'erode',a,{dm:1+k*.5}));});vpose(f,.2,'heavyw','smashh');endAt(f,.5);return 12;}],
    alt:['DECAY TOUCH',f=>{once(f,.18,()=>{foes(f,2.8,f.pos,.3).forEach(o=>{hitO(f,o,{dmg:7,kb:4,stun:.6});o.decay=Math.min(5,(o.decay||0)+3);o.decayT=5;
      burst(SMK,o.chest(new V3()),20,{colors:[0x8a8290,0x5a5560],speed:3,life:.9,size:.3,size1:.08,grav:3});});});vpose(f,.18,'specw','point');endAt(f,.45);return 12;}]},
  siphon:{
    chg:['GREATER SIPHON',(f,dt,k)=>{once(f,.18,()=>projX(f,'siphon',0,{sc:1.5,vm:1.3,dm:1.5+k}));vpose(f,.18);endAt(f,.45);return 10;}],
    alt:["TYRANT'S GRASP",f=>{once(f,.2,()=>{foes(f,10,f.pos,.15).forEach(o=>{bolt(f.chest(new V3()),o.chest(new V3()),0x8a3cff,.05,.35);hitO(f,o,{dmg:5,float:1.5,noSpark:true});});});vpose(f,.2,'specw','command');endAt(f,.5);return 12;}]},
  framelock:{
    chg:['LONG TAKE',(f,dt,k)=>{f.poseKey='dash';const r=f.doFrameLock(16+4*k,7+5*k,1.4+.6*k);return r;}],
    alt:['REWIND',f=>{once(f,.1,()=>{const h=f.hist&&f.hist[0];panel(f.pos,f.face,0x3fe0c5,.5);if(h&&!insideBld(h.x,h.z,.5,h.y+.5)){f.pos.set(h.x,h.y,h.z);f.vel.set(0,0,0);}heal(f,6);
      for(let k=0;k<5;k++)panel(f.pos,f.face+k*.2,k%2?0x3fe0c5:0xe8fffb,.4);sndHere(f,()=>AU.shutter(4));});f.poseKey='dash';endAt(f,.3);return 10;}]},
  bluelash:{
    chg:['INFERNO LASH',(f,dt,k)=>{const t=f.stateT;if(t>.12&&t<.8){f.fired=true;f.face+=dt*9;const c=f.chest(TMP2).clone();
        for(let q=0;q<6;q++){const a=rand(0,6.28),sp=rand(9,15);ADD.spawn(c.x,c.y,c.z,Math.cos(a)*sp,rand(-.5,1.5),Math.sin(a)*sp,..._rgb(pick([0x2a8aff,0x5aa8ff,0xaee0ff]),1.5),.4,.25,1.2,0,0);}
        if(!f.vf.lt||t-f.vf.lt>.12){f.vf.lt=t;foes(f,6.5).forEach(o=>{hitO(f,o,{dmg:2.5+k,kb:.6,stun:.35,hold:true,noSpark:true});burnOn(o,2.5,3.5,true);});}}
      f.poseKey=t<.12?'specw':'slash';endAt(f,.9);return 12;}],
    alt:['BLUE FLARE',f=>{once(f,.1,()=>{const fw=f.fwd(),p=f.pos.clone();explosion(TMP.set(p.x,.8,p.z).clone(),2.8,[0x2a8aff,0xaee0ff,0x1a4aff]);for(let i=0;i<3;i++)spikeFire(p.x+rand(-1,1),p.z+rand(-1,1));
      f.vel.set(-fw.x*18,6,-fw.z*18);f.onGround=false;f.pos.y+=.1;foes(f,5,p).forEach(o=>{hitO(f,o,{dmg:8,kb:9,up:7,launch:true});burnOn(o,3,4,true);});});f.poseKey='dash';endAt(f,.4);return 0;}]},
  gate:{
    chg:['TWIN GATES',(f,dt,k)=>{once(f,.12,()=>{const T=tgtOf(f,22);f.vf.T=T;if(T){portal(T.chest(new V3()),1.6,false,.8,T.face);const b=T.fwd();if(!blink(f,T.pos.x-b.x*1.5,T.pos.z-b.z*1.5))blink(f,T.pos.x+b.z*1.5,T.pos.z-b.x*1.5);faceTo(f,T);}});
      atT(f,'h1',.28,()=>{const T=f.vf.T;if(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.4){hitO(f,T,{dmg:6,kb:0,stun:.6,hold:true});}});
      atT(f,'h2',.48,()=>{const T=f.vf.T;if(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.6){portal(T.chest(new V3()),1.4,false,.6,f.face);hitO(f,T,{dmg:8+7*k,kb:12,up:10,launch:true,heavy:true});}});
      vpose(f,.28,'specw','command');endAt(f,.7);return 10;}],
    alt:['RECALL',f=>{once(f,.15,()=>{const T=tgtOf(f,16);if(T){portal(TMP.set(T.pos.x,.1,T.pos.z).clone(),1.8,true,.8);hitO(f,T,{dmg:6,kb:0,up:0,launch:true});T.pos.y+=9;T.vel.set(0,-4,0);T.dropDmg=10;T.bounce=1;
      portal(T.chest(new V3()),1.8,false,.8,T.face);}});vpose(f,.15,'specw','command');endAt(f,.45);return 10;}]},
  sigil:{
    chg:['GRAND SIGIL',(f,dt,k)=>{once(f,.18,()=>projX(f,'sigil',0,{sc:1.7,dm:1.5+k,mark:3}));vpose(f,.18);endAt(f,.45);return 10;}],
    alt:['CURSE FIELD',f=>{once(f,.15,()=>{ring(TMP.set(f.pos.x,.2,f.pos.z),0x5aff8a,11,.6,true,2.4);ring(f.chest(new V3()),0x5aff8a,5,.4,false,2);
      foes(f,5.5).forEach(o=>{o.marks=(o.marks||0)+1;o.markT=6;o.slowT=Math.max(o.slowT||0,2.5);hitO(f,o,{dmg:4,kb:2,stun:.4,mark:0});});});vpose(f,.15,'specw','command');endAt(f,.45);return 12;}]},
  rend:{
    chg:['WORLD REND',(f,dt,k)=>{once(f,.2,()=>{const fw=f.fwd(),c=f.chest(new V3()),hit={};for(let j=0;j<11;j++){const d=fw.clone().applyAxisAngle(UP,(j-5)*.12),L=clearLen(f.pos,d,20,c.y);
        const e=c.clone().addScaledVector(d,L);e.y=c.y+rand(-.4,.6);cutLine(c.clone().addScaledVector(d,.8),e,j%2?0xff3a1a:0xffb08a,.34,.35);
        lineFoes(f,f.pos,d,L,1).forEach(o=>{if(!hit[o.id]){hit[o.id]=1;hitO(f,o,{dmg:8+6*k,kb:8,up:7,launch:true,heavy:true,cut:true});}});}
      groundScar(f.pos.clone().addScaledVector(fw,1),f.pos.clone().addScaledVector(fw,14),0xff3a1a,true);sndHere(f,()=>SND.demon.rend());});vpose(f,.2,'heavyw','slash');endAt(f,.55);return 10;}],
    alt:['CLEAVE',f=>{once(f,.22,()=>{const fw=f.fwd(),L=clearLen(f.pos,fw,18);const s=f.pos.clone(),e=s.clone().addScaledVector(fw,L);
      cutLine(TMP.copy(s).setY(2.6).clone(),e.clone().setY(.2),0xff3a1a,.6,.5);groundScar(s.clone().addScaledVector(fw,1),e,0xff3a1a,true);shake(.5,f.pos);
      lineFoes(f,s,fw,L,1.6).forEach(o=>hitO(f,o,{dmg:15,kb:10,up:12,launch:true,heavy:true,cut:true}));});vpose(f,.22,'heavyw','slash');endAt(f,.55);return 10;}]},
};
function runSpecVar(f,dt){const sp=f.curSpecial(),V=SPECVAR[sp]&&SPECVAR[sp][f.specVar];if(!V)return null;
  if(!f.vf.named){f.vf.named=1;const C=f.hero.cab,nm=sp==='cab'&&C?(f.specVar==='chg'?f.hero.spName:((C.spAlt||C.sp).name)):V[0];vName(f,(f.specVar==='chg'?'CHARGED · ':'')+nm);}return V[1](f,dt,f.chgK||0);}

/* ---- alternate ultimates (hold back or use in the air) ---- */
function meteorAt(f,x,z){spawnProj(f,'meteor',0,{pos:new V3(x+rand(-2,2),18,z+rand(-2,2)),dir:new V3(rand(-.12,.12),-1,rand(-.12,.12)).normalize(),speed:30,quiet:true});}
const ALTULT={
  cinder:{name:'SOLAR RAIN',r:20,s(f,c,T){f.vf.c=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),10);f.uEnd=2.5;f.poseKey='command';},
    u(f,t){if(t<2.2&&(!f.vf.n||t-f.vf.n>.14)){f.vf.n=t;const a=rand(0,6.28),r=rand(0,5.5);meteorAt(f,f.vf.c.x+Math.cos(a)*r,f.vf.c.z+Math.sin(a)*r);}return 12;}},
  riptide:{name:'MAELSTROM',r:9,s(f){f.vf.c=f.pos.clone();f.uEnd=2.4;f.poseKey='command';},
    u(f,t){const c=f.vf.c;if(t<2.1){swirl(TMP.set(c.x,.6,c.z).clone(),6,7,[0x1fb8ff,0x9af0ff,0xffffff],8,.5,1.8);
        if(!f.vf.n||t-f.vf.n>.2){f.vf.n=t;foes(f,8,c).forEach(o=>{const dx=c.x-o.pos.x,dz=c.z-o.pos.z,d=Math.hypot(dx,dz)||1;pullTo(o,o.pos.x+dx/d*Math.min(1.2,d),o.pos.z+dz/d*Math.min(1.2,d));hitO(f,o,{dmg:3,kb:0,stun:.4,hold:true,noSpark:true});o.slowT=2;});}}
      atT(f,'gey',2.1,()=>{explosion(TMP.set(c.x,1,c.z).clone(),5,[0x1fb8ff,0x9af0ff,0xffffff]);foes(f,5,c).forEach(o=>hitO(f,o,{dmg:14,kb:4,up:17,launch:true,heavy:true}));});return 12;}},
  gale:{name:'EYE OF THE STORM',r:12,s(f){for(let k=0;k<8;k++)projX(f,'cyclone',k/8*6.28,{sc:1.4,dm:1.3});f.vel.y=8;f.onGround=false;f.uEnd=1.5;f.poseKey='command';ring(TMP.set(f.pos.x,.2,f.pos.z),0xcfe4ff,10,.6,true,2.2);}},
  nitro:{name:'CARPET BOMB',r:18,s(f){f.vf.d=f.fwd();f.vf.o=f.pos.clone();f.uEnd=2.2;f.poseKey='command';},
    u(f,t){const i=Math.floor((t-.95)/.12);if(i>=0&&i<9&&!f.vf['b'+i]){f.vf['b'+i]=1;const p=f.vf.o.clone().addScaledVector(f.vf.d,2.5+i*2.2);p.y=.8;
      explosion(p,2.6,[0xff7a10,0xffd04a,0xffffff]);sndHere(f,()=>AU.boom(false));foes(f,2.8,p).forEach(o=>hitO(f,o,{dmg:9,kb:10,up:10,launch:true,heavy:true,noSpark:true}));}return 12;}},
  titan:{name:'TITAN DROP',r:16,s(f,c,T,dist){const d=T?TMP.subVectors(T.pos,f.pos).setY(0).normalize().clone():f.fwd(),D=T?Math.min(dist,16):9;f.vel.set(d.x*D/1.5,21,d.z*D/1.5);f.onGround=false;f.pos.y+=.1;f.uEnd=3.5;f.poseKey='slamAir';},
    u(f,t){if(!f.vf.land&&t>1.1&&f.onGround){f.vf.land=1;const p=f.pos.clone();f.poseKey='slamLand';explosion(TMP.set(p.x,1,p.z).clone(),7,[0xffb04a,0xffffff,0x8a6a4a]);ring(TMP.set(p.x,.2,p.z),0xffb04a,14,.6,true,2.4);
      debris(TMP.set(p.x,.5,p.z).clone(),12,1,12,.35);shake(1.2,p);screenFlash(.4,p);foes(f,7).forEach(o=>hitO(f,o,{dmg:24,kb:15,up:14,launch:true,heavy:true,noSpark:true}));f.uEnd=t+.5;}return f.vf.land?12:0;}},
  volta:{name:'ION CANNON',r:24,s(f){f.vf.d=f.fwd();f.uEnd=2.2;f.poseKey='spech';},
    u(f,t){if(t<2.05&&(!f.vf.n||t-f.vf.n>.1)){f.vf.n=t;const c=f.chest(new V3()),d=f.vf.d,L=clearLen(f.pos,d,30,c.y),e=c.clone().addScaledVector(d,L);
      bolt(c,e,0xffe03a,.16,.12);bolt(c,e,0xffffff,.06,.12);flashLight(e,0xffe03a,5);lineFoes(f,f.pos,d,L,1.7).forEach(o=>hitO(f,o,{dmg:3,kb:.5,stun:.4,hold:true,noSpark:true}));}return 14;}},
  umbra:{name:'NIGHTFALL',r:14,s(f){f.vf.L=foes(f,14);f.uEnd=2.05;f.poseKey='command';ring(TMP.set(f.pos.x,.2,f.pos.z),0x7a4cff,28,.8,true,2);},
    u(f,t){[.95,1.35,1.75].forEach((t0,i)=>atT(f,'s'+i,t0,()=>{(f.vf.L||[]).forEach(o=>{if(o.dead)return;const g=TMP.set(o.pos.x,0,o.pos.z).clone();bolt(g,o.chest(new V3()),0x7a4cff,.14,.3);
      burst(SMK,g,14,{colors:[0x1a0a2a,0x4a2a8a],speed:4,up:5,life:.8,size:.5,size1:1.1,drag:2});hitO(f,o,i<2?{dmg:8,kb:1,stun:.6,hold:true}:{dmg:12,kb:6,up:14,launch:true,heavy:true});});}));return 12;}},
  drift:{name:'ZERO-G',r:14,s(f){f.vf.L=foes(f,14);f.vf.L.forEach(o=>hitO(f,o,{dmg:4,float:1.9,noSpark:true}));ring(TMP.set(f.pos.x,.2,f.pos.z),0xb58cff,28,.8,true,2.2);f.uEnd=2.4;f.poseKey='command';},
    u(f,t){atT(f,'slam',2.0,()=>{(f.vf.L||[]).forEach(o=>{if(!o.dead){ring(o.chest(new V3()),0xb58cff,2.4,.3,false,2.4);hitO(f,o,{dmg:14,kb:2,up:-22,launch:true,heavy:true});}});});return 12;}},
  bastion:{name:'AEGIS',r:8,s(f){f.armorT=Math.max(f.armorT,3);f.uEnd=3.1;f.poseKey='block';},
    u(f,t){if(t<2.8){reflectProjs(f,4.5);if(Math.random()<.3)ring(f.chest(TMP),0xffc08a,3,.25,false,1.8);}
      atT(f,'wave',2.8,()=>{const p=f.pos.clone();ring(TMP.set(p.x,.2,p.z),0xff6a2a,12,.5,true,2.4);ring(f.chest(new V3()),0xffc08a,5,.4,false,2.6);shake(.7,p);
        foes(f,6).forEach(o=>hitO(f,o,{dmg:16,kb:15,up:10,launch:true,heavy:true}));f.poseKey='smashh';});return 14;}},
  quill:{name:'PHOENIX DIVE',r:18,s(f,c,T){f.vf.T=T;f.vel.set(0,18,0);f.onGround=false;f.pos.y+=.1;f.uEnd=3.4;f.poseKey='jump';},
    u(f,t){if(!f.vf.dv&&t>1.4){f.vf.dv=1;const T=f.vf.T&&!f.vf.T.dead?f.vf.T.pos:f.pos.clone().addScaledVector(f.fwd(),8);const d=TMP.subVectors(T,f.pos);const l=Math.hypot(d.x,d.z)||1;f.vel.set(d.x/l*Math.min(l*2.2,26),-26,d.z/l*Math.min(l*2.2,26));f.poseKey='slamAir';}
      if(f.vf.dv){burst(ADD,f.chest(TMP2),4,{colors:[0xff4f8b,0xffe0ea,0xffb347],speed:2,life:.35,size:.5,size1:0,bright:2.4});}
      if(f.vf.dv&&!f.vf.land&&f.onGround){f.vf.land=1;const p=f.pos.clone();explosion(TMP.set(p.x,1,p.z).clone(),5,[0xff4f8b,0xffb347,0xffffff]);for(let k=0;k<12;k++)projX(f,'feather',k/12*6.28);
        foes(f,5).forEach(o=>hitO(f,o,{dmg:20,kb:13,up:12,launch:true,heavy:true,noSpark:true}));f.uEnd=t+.45;f.poseKey='slamLand';}return f.vf.dv&&!f.vf.land?0:12;}},
  void:{name:'BIG BANG',r:9,s(f){f.uEnd=2.05;f.poseKey='command';},
    u(f,t){const c=f.chest(new V3());if(t<1.6){implode(c,8,6,[0x8ac4ff,0xffffff,0xffe8a0],.4,2.4);foes(f,10).forEach(o=>pullTo(o,lerp(o.pos.x,f.pos.x,.04),lerp(o.pos.z,f.pos.z,.04)));}
      atT(f,'bang',1.6,()=>{explosion(c,9,[0xffffff,0x8ac4ff,0xffe8a0]);screenFlash(.7,f.pos);shake(1.3,f.pos);foes(f,9).forEach(o=>hitO(f,o,{dmg:24,kb:16,up:13,launch:true,heavy:true,noSpark:true}));});return 12;}},
  ronin:{name:'MOONLIT SEVERANCE',r:16,s(f){f.vf.L=foes(f,16).slice(0,5);f.uEnd=.95+Math.max(1,f.vf.L.length)*.24+.4;f.poseKey='slash';},
    u(f,t){const L=f.vf.L||[],i=Math.floor((t-.95)/.24);if(i>=0&&i<L.length&&!f.vf['c'+i]){f.vf['c'+i]=1;const o=L[i];if(o&&!o.dead){const b=o.fwd();blink(f,o.pos.x-b.x*1.3,o.pos.z-b.z*1.3);faceTo(f,o);
        const c=o.chest(new V3());slashFX(c,0xff6060,2.6);slashFX(c,0xffffff,1.8);hitO(f,o,i===L.length-1?{dmg:16,kb:12,up:12,launch:true,heavy:true}:{dmg:10,kb:1,stun:.9,hold:true});f.poseKey=i%2?'slash':'slashL';}}
      if(!L.length)atT(f,'solo',.95,()=>{const fw=f.fwd(),Ln=clearLen(f.pos,fw,10);blink(f,f.pos.x+fw.x*Ln,f.pos.z+fw.z*Ln);});return 12;}},
  quake:{name:'AFTERSHOCK',r:12,s(f){f.vf.c=f.pos.clone();f.uEnd=2.15;f.poseKey='slamLand';},
    u(f,t){[4,8,12].forEach((R,i)=>atT(f,'r'+i,.95+i*.4,()=>{const c=f.vf.c;ring(TMP.set(c.x,.2,c.z),0xc9a0ff,R*2,.5,true,2.2);for(let k=0;k<R*2;k++){const a=k/(R*2)*6.28;if(Math.random()<.6)spike(c.x+Math.cos(a)*R,c.z+Math.sin(a)*R,1);}shake(.6,c);
      foes(f,R,c).forEach(o=>{if(o.pos.distanceTo(c)>R-4.2)hitO(f,o,{dmg:12,kb:6,up:14,launch:true,heavy:true});});}));return 12;}},
  marrow:{name:'CRIMSON GARDEN',r:8,s(f){f.uEnd=2.4;f.poseKey='command';ring(TMP.set(f.pos.x,.2,f.pos.z),0xff3048,16,.8,true,2.2);},
    u(f,t){if(t<2.2&&(!f.vf.n||t-f.vf.n>.25)){f.vf.n=t;for(let k=0;k<6;k++){const a=rand(0,6.28),r=rand(1.5,8),x=f.pos.x+Math.cos(a)*r,z=f.pos.z+Math.sin(a)*r;spike(x,z,1.3);
        burst(SMK,TMP.set(x,.5,z),6,{colors:[0x8a1020,0xc4102a],speed:3,up:4,life:.6,size:.25,size1:.06,grav:12});foes(f,1.7,TMP.set(x,f.pos.y,z).clone()).forEach(o=>{if(hitO(f,o,{dmg:6,kb:3,up:11,launch:true})===true)heal(f,2);});}}return 12;}},
  entropy:{name:'DUST TO DUST',r:6,s(f){f.uEnd=2.7;f.poseKey='command';},
    u(f,t){if(Math.random()<.8)burst(SMK,TMP.set(f.pos.x+rand(-6,6),rand(.2,2),f.pos.z+rand(-6,6)),2,{colors:[0x8a8290,0x5a5560],speed:1,up:1,life:1,size:.3,size1:.1,grav:1});
      if(t<2.6&&(!f.vf.n||t-f.vf.n>.3)){f.vf.n=t;ring(TMP.set(f.pos.x,.2,f.pos.z),0x8a8290,12,.4,true,1.6);foes(f,6).forEach(o=>{o.decay=Math.min(5,(o.decay||0)+1);o.decayT=5;hitO(f,o,{dmg:3,kb:.5,stun:.35,hold:true,noSpark:true});});}return 12;}},
  sovereign:{name:'SOVEREIGN DECREE',r:14,s(f){const L=foes(f,14).slice(0,3);f.uEnd=1.7;f.poseKey='command';
    L.forEach((o,i)=>{bolt(f.chest(new V3()),o.chest(new V3()),0x8a3cff,.1,.5);const m=Math.min(o.meter,40);o.meter-=m;f.meter=Math.min(60,f.meter+m*.5);if(i===0&&STEALABLE.indexOf(o.hero.special)>=0)steal(f,o);
      hitO(f,o,{dmg:12,kb:8,up:10,launch:true,heavy:true});});ring(f.chest(new V3()),0x8a3cff,5,.5,false,2.4);}},
  strobe:{name:'FINAL CUT',r:16,s(f){f.vf.L=foes(f,16);f.vf.L.forEach(o=>{if(!o.dead){o.set('framed');o.framedT=1.5;o.vel.set(0,0,0);o.rig.frame.visible=true;}});f.uEnd=2.35;f.poseKey='command';
    for(let k=0;k<8;k++)panel(f.pos,f.face+k*.785,k%2?0x3fe0c5:0xe8fffb,.6);},
    u(f,t){atT(f,'cut',2.1,()=>{(f.vf.L||[]).forEach(o=>{if(!o.dead)hitO(f,o,{dmg:18,kb:12,up:10,launch:true,heavy:true});});screenFlash(.3,f.pos);});return 12;}},
  pyre:{name:'BLUE SUN',r:16,s(f){f.vf.sun=f.pos.clone().add(new V3(0,9,0));orb(f.vf.sun,0x2a8aff,3.2,1.6,2.6);f.uEnd=2.4;f.poseKey='command';},
    u(f,t){if(t>1&&t<2.25&&(!f.vf.n||t-f.vf.n>.2)){f.vf.n=t;const L=foes(f,16);const o=L.length?pick(L):null;const p=o?o.pos.clone():f.pos.clone().add(new V3(rand(-8,8),0,rand(-8,8)));p.y=.8;
      bolt(f.vf.sun,p,0x2a8aff,.14,.25);explosion(p,2.2,[0x2a8aff,0xaee0ff,0x1a4aff]);foes(f,2.4,p).forEach(q=>{hitO(f,q,{dmg:7,kb:6,up:7,launch:true,noSpark:true});burnOn(q,3,4,true);});}
      if(Math.random()<.5)burst(ADD,f.vf.sun,3,{colors:[0x2a8aff,0xaee0ff],speed:3,life:.4,size:.6,bright:2.4});return 12;}},
  warp:{name:'EVENT HORIZON',r:18,s(f){f.vf.L=foes(f,18);f.vf.L.forEach(o=>portal(TMP.set(o.pos.x,.1,o.pos.z).clone(),1.8,true,1));f.uEnd=1.75;f.poseKey='command';},
    u(f,t){atT(f,'drop',1.3,()=>{(f.vf.L||[]).forEach(o=>{if(o.dead)return;hitO(f,o,{dmg:6,kb:0,up:0,launch:true,noSpark:true});o.pos.y+=10;o.vel.set(0,-6,0);o.dropDmg=12;o.bounce=1;portal(o.chest(new V3()),1.8,false,.8,o.face);});});return 12;}},
  hex:{name:'HEXFALL',r:16,s(f,c,T){f.vf.c=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),8);ring(TMP.set(f.vf.c.x,.15,f.vf.c.z),0x5aff8a,12,1,true,2.4);f.uEnd=2.05;f.poseKey='command';},
    u(f,t){const c=f.vf.c;if(t<1.7&&Math.random()<.5)ring(TMP.set(c.x,.15,c.z),0x5aff8a,rand(4,12),.4,true,2);if(t<1.7)foes(f,6,c).forEach(o=>{o.slowT=Math.max(o.slowT||0,.4);});
      atT(f,'det',1.7,()=>{explosion(TMP.set(c.x,1,c.z).clone(),6,[0x5aff8a,0xd8ffe0,0x1a6a3a]);foes(f,6,c).forEach(o=>{o.marks=2;o.markT=6;hitO(f,o,{dmg:18,kb:10,up:12,launch:true,heavy:true});});});return 12;}},
  scathe:{name:'HELLMOUTH',r:12,s(f,c,T){f.vf.c=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),7);const p=f.vf.c;ring(TMP.set(p.x,.15,p.z),0xff3a1a,10,1,true,2.4);f.uEnd=2.45;f.poseKey='command';},
    u(f,t){const c=f.vf.c;if(t>.95&&t<2.05&&(!f.vf.n||t-f.vf.n>.07)){f.vf.n=t;const a=rand(0,6.28),r=5;const A=new V3(c.x+Math.cos(a)*r,rand(.3,2.4),c.z+Math.sin(a)*r),B=new V3(c.x-Math.cos(a)*r,rand(.3,2.4),c.z-Math.sin(a)*r);
        cutLine(A,B,Math.random()<.5?0xff3a1a:0xffb08a,.22,.25);foes(f,5,c).forEach(o=>hitO(f,o,{dmg:2.2,kb:.4,stun:.35,hold:true,noSpark:true,cut:true}));}
      atT(f,'bite',2.1,()=>{explosion(TMP.set(c.x,1,c.z).clone(),5.5,[0xff3a1a,0xffb08a,0x3a0000]);groundScar(c.clone().add(new V3(-4,0,-4)),c.clone().add(new V3(4,0,4)),0xff3a1a,true);
        groundScar(c.clone().add(new V3(4,0,-4)),c.clone().add(new V3(-4,0,4)),0xff3a1a,true);foes(f,5.5,c).forEach(o=>hitO(f,o,{dmg:16,kb:12,up:13,launch:true,heavy:true}));});return 12;}},
};
Fighter.prototype.doAltUlt=function(dt,dirO,dist,tg){const t=this.stateT,A=ALTULT[KIT(this.hero,'alt')],c=this.chest(new V3());
  if(t<.9){this.poseKey='charge';this.invuln=Math.max(this.invuln,.2);
    for(let k=0;k<4;k++){const a=rand(0,6.28),r=rand(2,3.5),p=new V3(c.x+Math.cos(a)*r,c.y+rand(-1.2,1.2),c.z+Math.sin(a)*r);
      ADD.spawn(p.x,p.y,p.z,(c.x-p.x)*3,(c.y-p.y)*3,(c.z-p.z)*3,..._rgb(pick([this.hero.accent,this.hero.color,0xffffff]),2.2),.33,.3,.05,0,0);}
    if(Math.random()<.2)ring(c,this.hero.accent,rand(1.5,2.5),.3,false,2);return 10;}
  if(!this.u1){this.u1=true;if(game.cine&&game.cine.f===this)game.cine=null;sfx(this,'ult');this.uEnd=1.6;A.s(this,c,tg&&!tg.dead&&dist<(A.r||14)+4?tg:null,dist);}
  const fr=A.u?A.u(this,t,dt):12;
  if(t>this.uEnd){this.set(this.onGround?'idle':'air');this.invuln=.2;this.clearUltFX();}
  return fr==null?12:fr;};
function ultLabel(f){const A=ALTULT[KIT(f.hero,'alt')];return f.ultAlt&&A?(f.hero.altName||A.name):f.hero.ultName;}

const PFX_DESC={cinder:'sets foes on fire',riptide:'soaks and slows',gale:'lifts foes, gusts nearby',nitro:'explodes on impact',titan:'shockwave hits a crowd',volta:'arcs to nearby foes',umbra:'drags foes toward you',
  drift:'floats foes',bastion:'armors you up',quill:'fires feathers',void:'repels, charged = null field',ronin:'sends slash waves',quake:'stone spikes erupt',marrow:'drinks blood to heal',entropy:'stacks decay',
  sovereign:'steals Surge meter',strobe:'freezes foes in a frame',pyre:'blue fire burn',warp:'blinks behind / flings up',hex:'extra curse marks',scathe:'leaves delayed cuts'};
function movesHTML(h){const V=SPECVAR[h.special]||{},A=ALTULT[KIT(h,'alt')];
  const sn=h.spName||spLabel(h.special);
  if(h.cab&&h.special==='cab'){const C=h.cab,d=a=>a?`<br><i>&nbsp;&nbsp;${esc(a.name)}: ${esc(cabDescribe(a))}</i>`:'';
    return `<b>[1] SPECIAL</b> ${sn}<i> · hold: charged · [2]:</i> ${(C.spAlt||C.sp).name}${d(C.sp)}${C.spAlt?d(C.spAlt):''}<br>`+
      `<b>[3]</b> ${xMoves(h)[0].name} <b>[4]</b> ${xMoves(h)[1].name}<br><b>[Q] ULTIMATE</b> ${h.ultName}<i> · back/air:</i> ${h.altName||(A?A.name:'—')}<i> · hold:</i> OVERCHARGE${h.ult==='cab'?d(C.ult):''}${KIT(h,'alt')==='cab'?d(C.ultAlt):''}<br>`+
      `<b>DEATH ULT</b> ${DULT_TYPES[dultOf(h)].name}<i> · knocked out with half Surge? press Q</i><br><b>PUNCHES</b><i> light combo · heavy · air attack</i><br><b>POWER HITS</b> ${PFX_DESC[KIT(h,'elem')]||''}`;}
  return `<b>[1] SPECIAL</b> ${sn}<i> · hold:</i> ${V.chg?V.chg[0]:'—'}<i> · [2]:</i> ${V.alt?V.alt[0]:'—'}<br>`+
    `<b>[3]</b> ${xMoves(h)[0].name} <b>[4]</b> ${xMoves(h)[1].name}<br><b>[Q] ULTIMATE</b> ${h.ultName}<i> · back/air:</i> ${A?(h.altName||A.name):'—'}<i> · hold:</i> OVERCHARGE<br>`+
    `<b>DEATH ULT</b> ${DULT_TYPES[dultOf(h)].name}<i> · knocked out with half Surge? press Q</i><br><b>PUNCHES</b><i> light combo · heavy · air attack (combo finishers and heavies trigger power hits)</i><br>`+
    `<b>POWER HITS</b> ${PFX_DESC[KIT(h,'elem')]||''}`;}
