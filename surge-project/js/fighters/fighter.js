/* Fighter class: physics, states, climbing, blocking, animation */
/* ================= FIGHTER ================= */
let FS=[], ME=null;
function ally(a,b){return a===b||(a.team!==undefined&&a.team===b.team);}
function enemiesOf(f){return FS.filter(o=>!ally(o,f)&&!o.dead&&!o.dormant);}
function mates(f){return FS.filter(o=>o!==f&&o.team===f.team);}
function blankIntent(){return {wx:0,wz:0,aim:0,block:false,sprint:false,revive:false,light:false,heavy:false,special:false,ult:false,jump:false,dash:false,spB:false,ultB:false,x1:false,x2:false,awk:false,team:false};}
// basic (non-variant) punches and shots wait a moment before the next one; variant moves are exempt
// BREAK bar: fills as you take damage; when full, dash while being hit to burst out of the combo
// while blocking you turn to face the nearest enemy (or where you aim), so hits from the side and from range get blocked
function blockThreat(f){let best=null,bd=16;for(const o of FS){if(ally(o,f)||o.dead||o.downed)continue;const d=Math.hypot(o.pos.x-f.pos.x,o.pos.z-f.pos.z)-(o.state==='attack'||o.state==='special'||o.state==='ult'?4:0);if(d<bd){bd=d;best=o;}}return best;}
const CLIMB_SPD=8;
const BRK_PER_DMG=3.4,BRK_STATES=['hit','fly','down','bstun','float','framed'];
const BASE_CHAIN=.75,BASE_CD_L=.22,BASE_CD_H=.38;
function isVarMove(k){return !!k&&/^v[A-Z]/.test(k);}
class Fighter{
  constructor(hero,id,name,isBot,team){
    this.hero=hero;this.id=id;this.team=team===undefined?id:team;this.name=name;this.isBot=isBot;this.rig=buildRig(hero);scene.add(this.rig.root);
    this.pos=new V3();this.vel=new V3();this.P=Object.assign({},GUARD);this.intent=blankIntent();this.meter=0;this.kills=0;this.tgt=null;
    this.netPress=0;this.place=0;this.trail=new Trail(14);this.reset(0,0,0);mhaInit(this);
  }
  clearUltFX(){if(this.xMesh){this.xMesh.forEach(m=>scene.remove(m));this.xMesh=null;}if(this.domClaws){this.domClaws.forEach(c=>scene.remove(c));this.domClaws=null;}if(this.singMesh){scene.remove(this.singMesh);this.singMesh=null;}if(this.arMesh){scene.remove(this.arMesh);this.arMesh=null;}}
  dispose(){if(this.pet){scene.remove(this.pet);this.pet=null;}mhaDispose(this);this.clearUltFX();this.trail.dispose();scene.remove(this.rig.root);if(this.rig.whip)scene.remove(this.rig.whip.group);if(this.rig.beam)scene.remove(this.rig.beam.group);}
  reset(x,z,face){
    this.pos.set(x,0,z);this.vel.set(0,0,0);this.face=face;this.hp=100;this.dhp=100;this.meter=0;this.kills=0;
    this.state='idle';this.stateT=0;this.brk=0;this.xcd=[0,0];this.xmOn=false;this.bufX=0;this.onGround=true;this.flash=0;this.specCD=0;this.dashCD=0;this.invuln=0;this.bufL=this.bufH=this.bufS=0;
    this.combo=0;this.dead=false;this.poseKey='guard';this.runPh=0;this.bounce=0;this.lat=0;this.rig.root.visible=true;
    this.bladeT=0;this.stolenT=0;this.stolen=null;this.decay=0;this.decayT=0;this.framedT=0;this.dj=false;this.airDash=false;this.flipT=0;this.landT=0;this.turnV=0;
    this.lastHitBy=null;this.lastHitT=-99;this.place=0;this.armorT=0;this.floatT=0;this.downed=false;this.bleed=0;this.revT=0;this.fieldT=0;this.vowT=0;this.marks=0;this.markT=0;this.dropDmg=0;this.beastReach=0;this.hitMap={};
    this.burnT=0;this.burnD=0;this.burnB=false;this.slowT=0;this.parryT=0;this.hist=[];this.histT=0;this.vf={};this.specVar='n';this.spPend=false;this.chgK=0;this.ultAlt=false;this.ultPow=1;this.ocChk=false;this.aiVar=null;this.hasteT=0;this.powT=0;this.auraC=0;
    if(this.rig.beam)this.rig.beam.group.visible=false;if(this.rig.whip)this.rig.whip.group.visible=false;this.rig.frame.visible=false;
  }
  fwd(v){return (v||new V3()).set(Math.sin(this.face),0,Math.cos(this.face));}
  chest(v){return (v||new V3()).set(this.pos.x,this.pos.y+1.25*this.hero.scale,this.pos.z);}
  set(s){if(this.state==='ult'&&s!=='ult')this.clearUltFX();if(s!=='special')this.xmOn=false;this.state=s;this.stateT=0;}
  curSpecial(){return this.xmOn?'xm':this.stolenT>0?this.stolen:this.hero.special;}
  lightMove(){if(this.hero.gear&&this.hero.gear.type!=='none'){const mv=GEAR_MV[gearCls(this.hero.gear)];if(mv)return mv[0];}const id=KIT(this.hero,'wpn');return id==='recoil'?'shotA':id==='piston'?'kickA':id==='marrow'?(this.bladeT>0?'bladeA':'whipA'):id==='umbra'?'shadowA':id==='ronin'?'swordA':id==='scathe'?'clawA':'jabR';}
  heavyMove(){if(this.hero.gear&&this.hero.gear.type!=='none'){const mv=GEAR_MV[gearCls(this.hero.gear)];if(mv)return mv[1];}const id=KIT(this.hero,'wpn');return id==='recoil'?'shotH':id==='piston'?'kickH':id==='marrow'?(this.bladeT>0?'bladeH':'whipH'):id==='umbra'?'shadowH':id==='titan'?'smash':id==='ronin'?'swordH':id==='scathe'?'clawH':'heavy';}
  attack(k){const M=MOVES[k];this.move=M;this.moveName=k;this.set('attack');this.hitDone=false;this.swung=false;this.relH=false;this.chgK=1;if(M.inv)this.invuln=Math.max(this.invuln,M.inv);if(M.air)this.vel.y=Math.min(this.vel.y,2);}
  aimAt(lock){if(!lock&&!this.isBot)this.face=this.intent.aim;}
  startSpecial(){this.xmOn=false;this.set('special');this.fired=false;this._sndF=false;this.vf={};this.chgK=0;this.specVar=(inDir(this)==='b'||this.bufSB>0)?'alt':'n';this.bufSB=0;if(this.specVar==='alt'&&!(SPECVAR[this.curSpecial()]||{}).alt)this.specVar='n';this.spPend=this.specVar==='n'&&held(this,'S');this.specCD=this.stolenT>0?1.6:(this.hero.specCD||2.2);}
  update(dt){
    if(!isFinite(this.pos.x+this.pos.y+this.pos.z)||!isFinite(this.vel.x+this.vel.y+this.vel.z)){if(this._good)this.pos.copy(this._good);else this.pos.set(0,0,0);this.vel.set(0,0,0);}
    else{if(!this._good)this._good=new V3();this._good.copy(this.pos);}
    const I=this.intent,R=this.rig;AU.scale=sndAt(this.pos);
    if(this.state==='special'&&this.fired&&!this._sndF){this._sndF=true;sfx(this,'spec',this.curSpecial());}
    this.flash=Math.max(0,this.flash-dt*5);this.landT=Math.max(0,this.landT-dt);
    if(this.dead){this.physics(dt,0,false);this.applyPose(dt);return;}
    this.atkCDL=Math.max(0,(this.atkCDL||0)-dt);this.atkCDH=Math.max(0,(this.atkCDH||0)-dt);this.climbCD=Math.max(0,(this.climbCD||0)-dt);if(this._spc){this._spc.n=Math.max(0,this._spc.n-dt);this._spc.alt=Math.max(0,this._spc.alt-dt);}this.dashCD=Math.max(0,this.dashCD-dt);this.invuln=Math.max(0,this.invuln-dt);
    this.bufL-=dt;this.bufH-=dt;this.bufS-=dt;if(I.light)this.bufL=.28;if(I.heavy)this.bufH=.28;if(I.special)this.bufS=.35;this.bufSB=Math.max(0,(this.bufSB||0)-dt);if(I.spB){this.bufS=.35;this.bufSB=.35;}this.bufX=Math.max(0,(this.bufX||0)-dt);if(I.x1){this.bufX=.3;this.bufXi=0;}if(I.x2){this.bufX=.3;this.bufXi=1;}if(this.xcd){this.xcd[0]=Math.max(0,this.xcd[0]-dt);this.xcd[1]=Math.max(0,this.xcd[1]-dt);}
    if(this.bladeT>0){this.bladeT=Math.max(0,this.bladeT-dt);if(this.bladeT===0)burst(SMK,this.chest(TMP2),14,{colors:[0x8a1020,0x5a0010],speed:3,life:.6,size:.25,size1:.05,grav:9});}
    if(this.stolenT>0){this.stolenT=Math.max(0,this.stolenT-dt);if(Math.random()<.4)burst(ADD,this.chest(TMP2),1,{colors:[0x8a3cff,0xe0c8ff],speed:.8,up:1.2,life:.5,size:.3,size1:0,bright:1.8,rad:.6});}
    if(this.fieldT>0){this.fieldT=Math.max(0,this.fieldT-dt);
      for(const o of FS){if(ally(o,this)||o.dead||o.downed)continue;const dx=o.pos.x-this.pos.x,dz=o.pos.z-this.pos.z,d=Math.hypot(dx,dz);
        if(d<2.4&&d>.01){o.pos.x=this.pos.x+dx/d*2.4;o.pos.z=this.pos.z+dz/d*2.4;o.vel.x=dx/d*6;o.vel.z=dz/d*6;
          if(game.time-(this.hitMap['f'+o.id]||0)>.5){this.hitMap['f'+o.id]=game.time;applyHit(this,o,{dmg:2,kb:3,stun:.3,pt:o.chest(new V3()),noSpark:true});}}}}
    if(this.vowT>0){this.vowT=Math.max(0,this.vowT-dt);if(Math.random()<.6)burst(ADD,TMP2.set(this.pos.x+rand(-.4,.4),this.pos.y+rand(.1,1.8),this.pos.z+rand(-.4,.4)),1,{colors:[0xff3030,0xff8080],speed:.5,up:2,life:.5,size:.3,size1:0,bright:2});}
    if(this.markT>0){this.markT-=dt;if(this.markT<=0)this.marks=0;if(this.marks>0&&Math.random()<.35*this.marks){const a=game.time*4+Math.random()*6;burst(ADD,TMP2.set(this.pos.x+Math.cos(a)*.6,this.pos.y+1+Math.sin(a*1.3)*.5,this.pos.z+Math.sin(a)*.6),1,{colors:[0x5aff8a,0xd8ffe0],speed:.3,life:.5,size:.25,size1:0,bright:2});}}
    if(this.armorT>0){this.armorT=Math.max(0,this.armorT-dt);if(Math.random()<.3)burst(ADD,this.chest(TMP2),1,{colors:[0xffc08a,0xff6a2a],speed:1,life:.3,size:.2,bright:2,rad:.5});}
    if(this.decayT>0){this.decayT-=dt;if(game.phase==='fight'&&NET.role!=='client')this.hp=Math.max(1,this.hp-this.decay*1.1*dt);
      if(Math.random()<.25*this.decay)burst(SMK,TMP2.set(this.pos.x+rand(-.3,.3),this.pos.y+rand(.3,1.7),this.pos.z+rand(-.3,.3)),1,{colors:[0x8a8290,0x5a5560],speed:.6,up:.8,life:.9,size:.18,size1:.05,grav:2});
      if(this.decayT<=0)this.decay=0;}
    if(this.burnT>0){this.burnT-=dt;if(game.phase==='fight'&&NET.role!=='client')this.hp=Math.max(1,this.hp-this.burnD*dt);
      if(Math.random()<.5)burst(ADD,TMP2.set(this.pos.x+rand(-.35,.35),this.pos.y+rand(.2,1.7),this.pos.z+rand(-.35,.35)),1,{colors:this.burnB?[0x2a8aff,0xaee0ff]:[0xff5a1f,0xffb347],speed:.6,up:2.5,life:.45,size:.3,size1:0,bright:2.2});}
    if(this.slowT>0){this.slowT-=dt;if(Math.random()<.2)burst(ADD,TMP2.set(this.pos.x+rand(-.3,.3),this.pos.y+rand(.2,1.6),this.pos.z+rand(-.3,.3)),1,{colors:[0x9af0ff,0x1fb8ff],speed:.3,life:.5,size:.18,bright:1.6,grav:6});}
    if(this.parryT>0)this.parryT-=dt;if(this.hasteT>0)this.hasteT-=dt;
    if(this.powT>0){this.powT-=dt;if(Math.random()<.4)burst(ADD,TMP2.set(this.pos.x+rand(-.4,.4),this.pos.y+rand(.2,1.8),this.pos.z+rand(-.4,.4)),1,{colors:[this.auraC||this.hero.color,0xffffff],speed:.4,up:1.6,life:.5,size:.28,size1:0,bright:2});}
    this.histT-=dt;if(this.histT<=0){this.histT=.1;this.hist.push({x:this.pos.x,y:this.pos.y,z:this.pos.z});if(this.hist.length>13)this.hist.shift();}
    if(this.state==='ult'&&!this.ocChk&&this.stateT>.82){this.ocChk=true;if(held(this,'U')){this.ultPow=1.3;const c=this.chest(TMP2);ring(c,0xffffff,3,.35,false,2.8);ring(c,this.hero.color,4,.45,false,2.4);flashLight(c,this.hero.color,10);
      if(this===ME)announceSmall('OVERCHARGED');sndHere(this,()=>{AU.sub(60,120,.5,.6);AU.swell(.4,.4,'bandpass',300,3000,2);});}}
    this.stateT+=dt;
    const fight=game.phase==='fight';
    const o=(this.tgt&&!this.tgt.dead)?this.tgt:null;
    let dist=99,dirO=this.fwd();
    if(o){const dx=o.pos.x-this.pos.x,dz=o.pos.z-this.pos.z;dist=Math.hypot(dx,dz);if(dist>.01)dirO=new V3(dx/dist,0,dz/dist);}
    const lock=!!o&&(this===ME?(!!this.hardLock&&dist<40):dist<9);this.locked=lock;
    const mv=new V3(I.wx||0,0,I.wz||0);if(mv.lengthSq()>1)mv.normalize();
    if(!fight&&['idle','run','block'].indexOf(this.state)>=0)mv.set(0,0,0);
    let canTurn=true,fr=0,grav=true;this.sprinting=false;
    if(fight&&I.dash&&(this.brk||0)>=100&&!this.downed&&BRK_STATES.indexOf(this.state)>=0)this.breakOut(mv);
    switch(this.state){
      case 'idle':case 'run':{
        if(!this.onGround){this.set('air');break;}
        if(fight){
          if(I.block){this.set('block');break;}
          if(this.bufL>0){const mk=this.lightMove();if(isVarMove(mk)||!(this.atkCDL>0)){this.bufL=0;this.aimAt(lock);this.attack(mk);break;}this.bufL=Math.max(this.bufL,.05);}
          if(this.bufH>0){const mk=this.heavyMove();if(isVarMove(mk)||!(this.atkCDH>0)){this.bufH=0;this.aimAt(lock);this.attack(mk);break;}this.bufH=Math.max(this.bufH,.05);}
          if(this.bufS>0&&this.specCD<=0){this.bufS=0;this.aimAt(lock);this.startSpecial();break;}
          if(this.bufX>0&&this.tryExtra(lock))break;
          if((I.ult||I.ultB)&&this.meter>=100){this.aimAt(lock);this.startUlt();break;}
          if(I.jump){this.vel.y=this.hero.jump||11.5;this.onGround=false;this.pos.y+=.02;this.dj=false;this.airDash=false;this.set('air');AU.jump();dust(this.pos,5,.6);break;}
          if(I.dash&&this.dashCD<=0){this.startDash(mv,dirO);break;}
        }
        const moving=mv.lengthSq()>.02;
        this.sprinting=moving&&I.sprint&&!lock;
        const sp=8.4*this.hero.spd*(this.sprinting?1.5:1)*(this.vowT>0?1.2:1)*(this.slowT>0?.62:1)*(this.hasteT>0?1.3:1);
        const k=1-Math.exp(-(moving?10:13)*dt);
        this.vel.x=lerp(this.vel.x,mv.x*sp,k);this.vel.z=lerp(this.vel.z,mv.z*sp,k);
        const hs=Math.hypot(this.vel.x,this.vel.z);this.state=hs>.7?'run':'idle';
        if(lock){const r=new V3(-dirO.z,0,dirO.x);this.lat=lerp(this.lat,(this.vel.x*r.x+this.vel.z*r.z)/Math.max(sp,1),Math.min(1,8*dt));}else this.lat=lerp(this.lat,0,Math.min(1,8*dt));
        if(this.sprinting&&Math.random()<.25)dust(this.pos,1,.5);
        break;}
      case 'air':{
        const ac=18*dt,mx=9*this.hero.spd*(this.slowT>0?.62:1)*(this.hasteT>0?1.3:1);this.vel.x+=mv.x*ac;this.vel.z+=mv.z*ac;const hs=Math.hypot(this.vel.x,this.vel.z),cap=Math.max(mx,this.carry||0);
        if(hs>cap){this.vel.x*=cap/hs;this.vel.z*=cap/hs;}this.carry=Math.max(0,(this.carry||0)-dt*6);
        if(fight){
          if(this.canWallJump()&&I.jump){this.wallJump();break;}
          if(this.canClimb(mv)){this.startClimb();break;}
          if(I.jump&&!this.dj){this.dj=true;this.vel.y=10.5;this.flipT=.42;AU.jump();burst(ADD,TMP2.set(this.pos.x,this.pos.y+.2,this.pos.z),10,{colors:[this.hero.accent],speed:3,life:.3,size:.3,bright:1.8,flat:true});ring(TMP2.set(this.pos.x,this.pos.y+.1,this.pos.z),this.hero.color,1.2,.25,true,2);}
          else if(I.dash&&!this.airDash&&this.dashCD<=0){this.airDash=true;this.startDash(mv,dirO);}
          else if(this.bufL>0){this.bufL=0;this.aimAt(lock);this.attack('air');}
          else if(this.bufH>0){this.bufH=0;this.aimAt(lock);this.attack('air');}
          else if((I.ult||I.ultB)&&this.meter>=100){this.aimAt(lock);this.startUlt();}
          else if(this.bufS>0&&this.specCD<=0&&this.hero.special!=='rocket'){this.bufS=0;this.aimAt(lock);this.startSpecial();}
          else if(this.bufX>0)this.tryExtra(lock);
        }
        break;}
      case 'climb':{grav=false;canTurn=false;const n=this.wallN;if(!n||!fight){this.set('air');break;}
        const into=-(mv.x*n.x+mv.z*n.z);this.face=Math.atan2(-n.x,-n.z);
        this.vel.x=-n.x*2;this.vel.z=-n.z*2;this.vel.y=into>.3?CLIMB_SPD*this.hero.spd:into<-.3?-6:-1.2;
        const top=this.wallB?this.wallB.h:0,touching=game.time-(this.wallT||0)<.12;
        if(this.wallB&&!this.wallB.top&&this.pos.y+1.6>top){const up=insideBld(this.pos.x-n.x*.8,this.pos.z-n.z*.8,0,top+.5);if(up&&up!==this.wallB){this.wallB=up;}}
        if(this.wallB&&this.pos.y>=this.wallB.h-1.15&&this.wallB.top){this.pos.y=this.wallB.h+.02;this.pos.x-=n.x*1.1;this.pos.z-=n.z*1.1;this.vel.set(-n.x*3,3,-n.z*3);this.onGround=false;
          this.set('air');this.climbCD=.3;dust(this.pos,6,.6);AU.land();break;}
        if(I.jump){this.wallJump();break;}
        if(I.dash||(!touching&&this.stateT>.1)||this.onGround&&into<=0){this.climbCD=.35;this.set(this.onGround?'idle':'air');break;}
        this.climbPh=(this.climbPh||0)+dt*(Math.abs(this.vel.y)>1?9:0);this.poseKey=into>.3||into<-.3?(Math.sin(this.climbPh)>0?'climbA':'climbB'):'climbHang';
        if(into>.3&&Math.random()<.08)burst(ADD,TMP2.set(this.pos.x-n.x*.4,this.pos.y+.4,this.pos.z-n.z*.4),2,{colors:[0xb8bcc8,0x8a8e9a],speed:1.5,life:.4,size:.12,size1:0,grav:8,bright:1});
        break;}
      case 'block':fr=12;if(!I.block||!fight)this.set('idle');break;
      case 'bstun':fr=8;if(this.stateT>.16)this.set(I.block?'block':'idle');break;
      case 'dash':{if(!this.dashDir)this.dashDir=this.fwd();const D=.3,k=1-this.stateT/D,sp=34*(this.hero.dashMul||1)*(.35+.65*Math.max(0,k));
        this.vel.x=this.dashDir.x*sp;this.vel.z=this.dashDir.z*sp;this.vel.y=Math.max(this.vel.y,0)*.5;grav=false;
        elemOf(this).dash(this,false);
        if(KIT(this.hero,'elem')==='strobe'&&Math.floor(this.stateT/.05)!==this.lastPan){this.lastPan=Math.floor(this.stateT/.05);panel(this.pos,this.face,0x3fe0c5,.4);if(this.lastPan%2===0)AU.shutter(1);}
        if(this.stateT>D){const keep=.55;this.vel.x*=keep;this.vel.z*=keep;this.carry=Math.hypot(this.vel.x,this.vel.z);this.set(this.onGround?'idle':'air');}
        break;}
      case 'attack':fr=this.doAttack(dt);if(this.move.air)grav=this.stateT>this.move.st;break;
      case 'hit':fr=7;canTurn=false;if(this.stateT>this.stunT)this.set(this.onGround?'idle':'air');break;
      case 'framed':fr=0;canTurn=false;grav=false;this.vel.set(0,0,0);if(this.stateT>this.framedT){shatterFrame(this,false);this.set(this.onGround?'idle':'air');}break;
      case 'fly':canTurn=false;break;
      case 'float':canTurn=false;grav=false;this.vel.x*=.9;this.vel.z*=.9;this.vel.y=this.pos.y<3.2?2.6:0;this.face+=dt*1.5;
        if(Math.random()<.4)burst(ADD,this.chest(TMP2),1,{colors:[0xb58cff,0xf2e8ff],speed:.8,life:.5,size:.3,bright:1.8,rad:.7});
        if(this.stateT>this.floatT){this.set('fly');this.vel.y=-5;this.dropDmg=this.floatDrop||6;this.bounce=1;}break;
      case 'down':canTurn=false;fr=10;this.invuln=Math.max(this.invuln,.1);if(this.stateT>.7)this.set('getup');break;
      case 'getup':fr=10;this.invuln=Math.max(this.invuln,.1);if(this.stateT>.32)this.set('idle');break;
      case 'special':{const sp=this.curSpecial();
        if(this.spPend){if(held(this,'S')&&this.stateT<1.2&&fight){this.poseKey='charge';chargeFX(this,this.stateT>.6?0xffffff:null);fr=12;if(!this.onGround)this.vel.y=Math.max(this.vel.y,-1);break;}
          this.spPend=false;if(this.stateT>.22&&SPECVAR[sp]&&SPECVAR[sp].chg){this.specVar='chg';this.chgK=Math.min(1,(this.stateT-.22)/.9);}this.stateT=0;}
        if(this.specVar!=='n'){const r=runSpecVar(this,dt);if(r!=null){fr=r;if(!this.onGround&&this.vel.y<0)this.vel.y=Math.max(this.vel.y,-1);break;}}
        if(sp==='rocket'){fr=this.doRocket(dirO);break;}
        if(sp==='framelock'){fr=this.doFrameLock();grav=false;break;}
        if(SPECIALS[sp]){fr=SPECIALS[sp](this,dt);if(!this.onGround)this.vel.y=Math.max(this.vel.y,-1);break;}
        fr=10;if(!this.onGround)this.vel.y=Math.max(this.vel.y,-1);
        if(!this.fired&&this.stateT>.22){this.fired=true;if(sp==='bladeform')this.activateBlades();else spawnProj(this,sp);}
        if(this.stateT>.5)this.set(this.onGround?'idle':'air');break;}
      case 'ult':if(this.hero.cab&&(this.ultAlt?KIT(this.hero,'alt')==='cab':this.hero.ult==='cab')){fr=this.doCabUlt(dt);canTurn=this.stateT<.9&&!!o;break;}
        if(this.ultAlt){fr=this.doAltUlt(dt,dirO,dist,o);canTurn=this.stateT<.9&&!!o;break;}fr=this.doUlt(dt,dirO,dist,o);canTurn=this.stateT<.9&&!!o;if(['bloodarrow','chain','collapse','arsenal','singularity','sealedarena','dominion'].indexOf(this.hero.ult)>=0&&this.onGround)fr=12;if(this.hero.ult==='thousandcuts')fr=0;if(this.hero.ult==='stopmotion'||this.hero.ult==='tempest')grav=this.stateT<.9;if(this.hero.ult==='skyfall'){grav=!(this.stateT>.9&&this.stateT<2.15);if(!grav&&this.pos.y>=7&&this.vel.y>0)this.vel.y=0;}if(this.hero.ult==='unbreakable'&&this.stateT>.9&&this.stateT<1.6)fr=0;break;
      case 'win':fr=10;canTurn=false;break;
      case 'downed':{const sp=1.9,k=1-Math.exp(-8*dt);this.vel.x=lerp(this.vel.x,mv.x*sp,k);this.vel.z=lerp(this.vel.z,mv.z*sp,k);
        if(Math.random()<.15)burst(ADD,this.chest(TMP2),1,{colors:[0xff4a5a,0xffffff],speed:.6,up:1,life:.5,size:.25,bright:1.6,rad:.4});break;}
    }
    if(['idle','run','block','dash'].indexOf(this.state)>=0)this.combo=0;
    this.physics(dt,fr,grav);
    // facing
    const hs=Math.hypot(this.vel.x,this.vel.z);const prev=this.face;
    if(canTurn&&!this.frozenFace){
      if(this.state==='block'||this.state==='bstun'){const th=blockThreat(this);const want=th?Math.atan2(th.pos.x-this.pos.x,th.pos.z-this.pos.z):(this.isBot?null:I.aim);if(want!=null)this.face=angLerp(this.face,want,Math.min(1,20*dt));}
      else if(lock&&this.state!=='dash')this.face=angLerp(this.face,Math.atan2(dirO.x,dirO.z),Math.min(1,16*dt));
      else if(hs>1.2&&['run','air','dash'].indexOf(this.state)>=0)this.face=angLerp(this.face,Math.atan2(this.vel.x,this.vel.z),Math.min(1,(this.state==='dash'?22:13)*dt));
    }
    this.turnV=lerp(this.turnV,dt>0?angDiff(prev,this.face)/dt:0,Math.min(1,10*dt));
    // ambient
    if(this.meter>=100&&Math.random()<.5)burst(ADD,TMP2.set(this.pos.x,this.pos.y+rand(.2,1.8),this.pos.z),1,{colors:[this.hero.color,this.hero.accent],speed:.6,up:2.5,life:.6,size:.35,size1:0,bright:1.8,rad:.5});
    const id=KIT(this.hero,'elem');
    if(nearCam(this.pos,40))elemOf(this).aura(this);
    if(id==='cinder'&&Math.random()<.7){R.head.getWorldPosition(TMP2);TMP2.y+=.25;burst(ADD,TMP2,1,{colors:[0xff5a1f,0xffb347],speed:.4,up:1.6,life:.35,size:.18,size1:.02,bright:2,rad:.1});}
    if(id==='entropy'&&Math.random()<.5){const fp=(Math.random()<.5?R.lF:R.rF).getWorldPosition(TMP2);burst(SMK,fp,1,{colors:[0x8a8290,0x6a6470],speed:.3,up:.6,life:1,size:.12,size1:.03,grav:1.5});}
    if(id==='sovereign'&&Math.random()<.3)burst(ADD,TMP2.set(this.pos.x+rand(-.5,.5),this.pos.y+.05,this.pos.z+rand(-.5,.5)),1,{colors:[0x8a3cff],speed:.2,up:1.4,life:.7,size:.35,size1:0,bright:1.4});
    if(id==='strobe'&&hs>9&&Math.random()<.3)panel(this.pos,this.face,0x3fe0c5,.3);
    this.applyPose(dt);
  }
  physics(dt,fr,grav){
    if(grav&&!this.onGround)this.vel.y-=(this.state==='fly'?26:30)*dt;
    if(fr>0&&this.onGround){const k=Math.max(0,1-fr*dt);this.vel.x*=k;this.vel.z*=k;}
    const py=this.pos.y;this.pos.addScaledVector(this.vel,dt);
    const gy=floorAt(this.pos.x,this.pos.z,Math.max(py,this.pos.y)+.05);this.floorY=gy;
    if(this.pos.y<=gy){this.pos.y=gy;if(!this.onGround)this.land();else if(this.vel.y<0)this.vel.y=0;}else this.onGround=false;
    for(const ax of ['x','z']){if(Math.abs(this.pos[ax])>BOUND){const s=Math.sign(this.pos[ax]);
      if(this.state==='fly'&&Math.abs(this.vel[ax])>6)wallHit(this);this.pos[ax]=s*BOUND;this.vel[ax]*=-.3;}}
    const sp=Math.hypot(this.vel.x,this.vel.z);
    const hb=pushOutBld(this.pos,.45);
    if(hb&&hb.ceil){if(this.vel.y>0)this.vel.y=0;}
    else if(hb){this.wallT=game.time;this.wallN=hb.ax==='x'?new V3(hb.s,0,0):new V3(0,0,hb.s);this.wallB=hb.b;}
    if(hb&&!hb.ceil){if(this.state==='fly'&&sp>7){wallHit(this);this.vel[hb.ax]=-this.vel[hb.ax]*.3;}else if(this.state==='dash'){this.vel[hb.ax]=0;}}
    for(const s of solids){const dx=this.pos.x-s.x,dz=this.pos.z-s.z,d=Math.hypot(dx,dz),r=s.r+.4;if(d<r&&d>.001&&this.pos.y<2.5){this.pos.x=s.x+dx/d*r;this.pos.z=s.z+dz/d*r;}}
    for(const p of props){if(p.broken)continue;const dx=this.pos.x-p.x,dz=this.pos.z-p.z;if(Math.abs(dx)>3||Math.abs(dz)>3)continue;const d=Math.hypot(dx,dz),r=p.r+.4;
      if(d<r){if((this.state==='fly'&&sp>4)||this.state==='dash'||this.state==='ult'){breakProp(p);continue;}
        if(this.pos.y<(p.kind==='car'?1.6:p.kind==='cone'?.7:1.25)&&d>.001){this.pos.x=p.x+dx/d*r;this.pos.z=p.z+dz/d*r;}}}
    if(!this.dead&&this.state!=='down')for(const o of FS){if(o===this||o.dead||o.state==='down')continue;const dx=o.pos.x-this.pos.x,dz=o.pos.z-this.pos.z;const d=Math.hypot(dx,dz);
      if(d<.95&&d>.001&&Math.abs(this.pos.y-o.pos.y)<1.6){const p=(.95-d)/2;this.pos.x-=dx/d*p;this.pos.z-=dz/d*p;}}
  }
  breakOut(mv){this.brk=0;if(this.xHold==='marble'||this.xHold==='dis')this.xBy=null;if(this.state==='framed'){this.rig.frame.visible=false;}
    const A=this.lastHitBy&&!this.lastHitBy.dead?this.lastHitBy:null;let d=mv.lengthSq()>.05?mv.clone().normalize():null;
    if(!d&&A){d=new V3(this.pos.x-A.pos.x,0,this.pos.z-A.pos.z);if(d.lengthSq()<.01)d=this.fwd().negate();d.normalize();}if(!d)d=this.fwd().negate();
    this.set('dash');this.dashDir=d;this.face=Math.atan2(d.x,d.z);this.invuln=1;this._comboAt=-99;this.dashCD=.3;this.vel.set(d.x*20,Math.max(this.vel.y,this.onGround?0:3),d.z*20);this.stunT=0;this.bounce=0;this.dropDmg=0;
    const c=this.chest(new V3());ring(c,0xffffff,3.4,.35,false,2.8);ring(c,this.hero.color,4.6,.45,false,2.4);ring(TMP.set(this.pos.x,.2,this.pos.z),this.hero.color,7,.4,true,2.2);
    burst(ADD,c,50,{colors:[0xffffff,this.hero.color,this.hero.accent],speed:9,life:.4,size:.3,size1:0,bright:2.6});
    for(const o of FS){if(ally(o,this)||o.dead)continue;const dx=o.pos.x-this.pos.x,dz=o.pos.z-this.pos.z,l=Math.hypot(dx,dz);if(l<3.2&&l>.01){o.vel.x+=dx/l*9;o.vel.z+=dz/l*9;if(o.state==='attack')o.set(o.onGround?'idle':'air');}}
    sndHere(this,()=>{AU.noise(.05,.5,'highpass',2000,6000,1);AU.sub(90,180,.25,.5);AU.swell(.25,.35,'bandpass',300,3000,2);});sfx(this,'dash');
    if(this===ME){announceSmall('BREAK!');shake(.4,this.pos);}}
  // wall climbing: jump into a wall and keep holding toward it to scale it; jump off it to wall jump
  canClimb(mv){if(this.climbCD>0||!this.wallN||game.time-(this.wallT||0)>.1||this.vel.y<-14)return false;const into=-(mv.x*this.wallN.x+mv.z*this.wallN.z);return into>.55;}
  canWallJump(){return !this.onGround&&this.wallN&&game.time-(this.wallT||0)<.15;}
  startClimb(){this.set('climb');this.vel.set(0,Math.max(this.vel.y,0),0);this.dj=false;this.airDash=false;AU.jump();}
  wallJump(){const n=this.wallN;this.set('air');this.vel.set(n.x*11,13,n.z*11);this.face=Math.atan2(n.x,n.z);this.dj=false;this.airDash=false;this.climbCD=.35;this.wallT=0;this.flipT=.42;
    AU.jump();burst(ADD,TMP2.set(this.pos.x-n.x*.3,this.pos.y+.8,this.pos.z-n.z*.3),12,{colors:[this.hero.accent,0xffffff],speed:4,life:.3,size:.3,size1:0,bright:1.8});}
  startDash(mv,dirO){
    this.dashDir=mv.lengthSq()>.05?mv.clone().normalize():(this.locked?dirO.clone():this.fwd());
    this.set('dash');this.invuln=.22;this.dashCD=KIT(this.hero,'elem')==='strobe'?.38:.55;sfx(this,'dash');dust(this.pos,8,.8);this.lastPan=-1;
    if(!this.locked)this.face=Math.atan2(this.dashDir.x,this.dashDir.z);
    if(KIT(this.hero,'elem')==='nitro')miniBlast(this.chest(new V3()).addScaledVector(this.dashDir,-.7),.7);
    ring(this.chest(TMP2),this.hero.color,1.6,.25,false,1.8);elemOf(this).dash(this,true);
  }
  doAttack(dt){
    let M=this.move,t=this.stateT;
    if(M.hold&&!this.relH){
      if(held(this,'H')&&t<1.3&&game.phase==='fight'){this.poseKey='charge';chargeFX(this,t>.5?0xffffff:null);if(t>.16&&!this.vf.chgSnd){this.vf.chgSnd=1;sndHere(this,()=>AU.charge(.5));}return 12;}
      this.relH=true;if(t<.16){this.attack(dirHeavy(this));return 8;}
      this.chgK=1+Math.min(1,(t-.16)/1.0)*1.1;this.stateT=t=M.st*.6;this.vf.chgSnd=0;if(this.chgK>1.8){ring(this.chest(TMP2),0xffffff,2.4,.3,false,2.6);if(this===ME)announceSmall('MAX CHARGE');}}
    if(t<M.st){this.poseKey=M.w;if(t>M.st*.4&&!M.air){const f=this.fwd(TMP2);this.vel.x=f.x*M.lunge;this.vel.z=f.z*M.lunge;}}
    else if(t<M.st+M.ac){this.poseKey=M.h;if(!this.swung){this.swung=true;sfx(this,'swing',!!M.heavy);if(KIT(this.hero,'wpn')==='recoil'&&!(this.hero.gear&&this.hero.gear.type!=='none'))recoilShot(this,M);else if(M.shot)gearShot(this,M);if(this.vowT>0&&M.limb==='s')spawnProj(this,'slashwave',0,{quiet:true});if(M.air){const f=this.fwd(TMP2);this.vel.x=f.x*M.lunge;this.vel.z=f.z*M.lunge;this.vel.y=M.dive?-26:-7;}}if(!this.hitDone)this.tryHit(M);}
    else{
      this.poseKey=t<M.st+M.ac+M.rc*.6?M.h:'guard';
      if(game.phase==='fight'){
        const base=!isVarMove(this.moveName),ready=!base||t>=M.st+M.ac+M.rc*BASE_CHAIN;
        if(M.next&&this.bufL>0){if(ready){this.bufL=0;this.attack(M.next);return 8;}this.bufL=Math.max(this.bufL,.05);}
        if(M.next&&this.bufH>0){if(ready){this.bufH=0;this.attack(this.heavyMove());return 8;}this.bufH=Math.max(this.bufH,.05);}
      }
      if(t>=M.st+M.ac+M.rc){if(!isVarMove(this.moveName)){if(M.heavy)this.atkCDH=BASE_CD_H;else this.atkCDL=BASE_CD_L;}this.set(this.onGround?'idle':'air');}
    }
    return M.air?0:(t<M.st+M.ac?3:9);
  }
  tryHit(M){if(M.shot||(KIT(this.hero,'wpn')==='recoil'&&!(this.hero.gear&&this.hero.gear.type!=='none')))return;
    if(M.whip&&M.ac&&(this.stateT-M.st)/M.ac<.45)return;
    const f=this.fwd(TMP2);let any=false;
    for(const o of FS){if(ally(o,this)||o.dead||o.invuln>0||o.state==='down')continue;
      const rx=o.pos.x-this.pos.x,rz=o.pos.z-this.pos.z;const along=rx*f.x+rz*f.z,lat=Math.abs(rx*f.z-rz*f.x),dy=Math.abs(o.pos.y-this.pos.y);
      if(along>-.3&&along<M.rng+.45&&lat<(M.lat||1.15)&&dy<1.9){any=true;
        const pt=this.chest(new V3()).addScaledVector(f,M.whip?along:Math.min(along,M.rng)*.75);pt.y=lerp(pt.y,o.chest(TMP).y,.5);
        const ck=M.hold?(this.chgK||1):1;const hr=applyHit(this,o,{dmg:M.dmg*ck,kb:M.kb*Math.sqrt(ck),up:M.up,stun:M.stun,launch:M.launch,heavy:M.heavy,pt,shock:M.shock,gb:M.gb});const tier=M.vfx||(M.heavy?2:M.launch?1:0);if(hr===true&&tier)punchFX(this,o,tier,pt);}}
    if(any)this.hitDone=true;
  }
  activateBlades(){this.bladeT=9;const c=this.chest(new V3());
    burst(SMK,c,40,{colors:[0x8a1020,0xc4102a,0x5a0010],speed:6,life:.7,size:.25,size1:.06,grav:12});
    burst(ADD,c,30,{colors:[0xff3048,0xffffff],speed:5,life:.35,size:.3,bright:2.2});ring(c,0xff3048,2.2,.3,false,2.5);flashLight(c,0xff3048,8);}
  doRocket(){
    const t=this.stateT;
    if(!this.fired&&t>.15){this.fired=true;this.hitDone=false;const f=this.fwd();this.rocketDir=f.clone();
      miniBlast(this.chest(new V3()).addScaledVector(f,-.8),1.2);shake(.3,this.pos);}
    if(this.fired&&t<.55){const k=Math.max(0,1-(t-.15)/.45);this.vel.x=this.rocketDir.x*30*k;this.vel.z=this.rocketDir.z*30*k;
      burst(ADD,this.chest(TMP2).addScaledVector(this.rocketDir,-.6),3,{colors:[0xff7a10,0xffd04a,0xffffff],speed:2,life:.25,size:.45,size1:0,bright:2.2,dir:this.rocketDir,dirSp:-8});
      if(!this.hitDone)this.tryHit(MOVES.rocket);}
    if(t>.65)this.set(this.onGround?'idle':'air');
    return this.fired?(t<.55?0:10):10;
  }
  doFrameLock(LM,DM,FM){LM=LM||11;
    const t=this.stateT;this.poseKey='dash';
    if(!this.fired&&t>.08){this.fired=true;const f=this.fwd(),start=this.pos.clone();let L=LM;
      for(let d=.5;d<=LM;d+=.5){const x=start.x+f.x*d,z=start.z+f.z*d;if(Math.abs(x)>BOUND||Math.abs(z)>BOUND||insideBld(x,z,.5,this.pos.y+.5)){L=d-.5;break;}}
      const end=start.clone().addScaledVector(f,L);
      for(let k=0;k<=6;k++){const p=start.clone().lerp(end,k/6);panel(p,this.face,k%2?0x3fe0c5:0xe8fffb,.5+k*.03);}
      for(let k=0;k<40;k++){const p=start.clone().lerp(end,Math.random());ADD.spawn(p.x,p.y+rand(.3,1.8),p.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),..._rgb(pick([0x3fe0c5,0xe8fffb]),2.2),.4,.35,0,0,0);}
      for(const o of FS){if(ally(o,this)||o.dead||o.invuln>0)continue;const rx=o.pos.x-start.x,rz=o.pos.z-start.z,al=rx*f.x+rz*f.z,lt=Math.abs(rx*f.z-rz*f.x);
        if(al>-.5&&al<L+1&&lt<1.6&&Math.abs(o.pos.y-this.pos.y)<2.2){applyHit(this,o,{dmg:DM||5,kb:0,stun:.3,pt:o.chest(new V3()),frame:FM||1.4});}}
      this.pos.copy(end);this.vel.set(0,0,0);
    }
    if(t>.32)this.set(this.onGround?'idle':'air');
    return 10;
  }
  updateWhip(){
    const W=this.rig.whip;if(!W)return;const M=this.move;const on=this.state==='attack'&&M&&M.whip&&!this.dead;
    W.group.visible=!!on;if(!on)return;
    this.rig.root.updateMatrixWorld(true);
    const O=(M.whip==='l'?this.rig.lF:this.rig.rF).getWorldPosition(new V3());
    const t=this.stateT;let e,ph=0;
    if(t<M.st)e=.12*t/M.st;else if(t<M.st+M.ac){ph=(t-M.st)/M.ac;e=.12+.88*Math.min(1,ph*1.6);}else{ph=1;e=Math.max(.05,1-(t-M.st-M.ac)/(M.rc*.85));}
    const f=this.fwd(new V3()),r=new V3(-f.z,0,f.x),tip=new V3(),ctrl=new V3();const L=M.rng+.3;
    if(M.wt==='thrust'){tip.copy(O).addScaledVector(f,L*e);tip.y=lerp(O.y,1.1+this.pos.y,e);ctrl.copy(O).lerp(tip,.5);ctrl.y+=.7*Math.sin(e*Math.PI);ctrl.addScaledVector(r,(M.whip==='l'?-.6:.6)*Math.sin(e*Math.PI));}
    else if(M.wt==='sweep'){const a=t<M.st?1.3:1.3-2.6*Math.min(1,ph);tip.copy(O).addScaledVector(f,Math.cos(a)*L*e).addScaledVector(r,Math.sin(a)*L*e);tip.y=lerp(O.y,1.05+this.pos.y,e);ctrl.copy(O).lerp(tip,.5).addScaledVector(r,Math.sin(a)*.8);ctrl.y+=.3;}
    else{const b=t<M.st?0:.15+1.45*Math.min(1,ph*1.3);tip.copy(O).addScaledVector(f,Math.sin(b)*L*e);tip.y=Math.max(.1,O.y+Math.cos(b)*L*e*.7);ctrl.copy(O).lerp(tip,.5);ctrl.y+=1.2*(1-ph*.6);}
    const N=W.segs.length,pts=[];
    for(let i=0;i<=N;i++){const u=i/N,a=(1-u)*(1-u),b=2*(1-u)*u,c=u*u;const p=new V3(O.x*a+ctrl.x*b+tip.x*c,O.y*a+ctrl.y*b+tip.y*c,O.z*a+ctrl.z*b+tip.z*c);
      const w=Math.sin(game.time*28+u*9)*.06*u*(1-e*.7);p.addScaledVector(r,w);p.y+=w*.6;pts.push(p);}
    for(let i=0;i<N;i++){const m=W.segs[i],a=pts[i],b=pts[i+1],d=TMP.subVectors(b,a),len=d.length()||.001;
      m.position.copy(a).add(b).multiplyScalar(.5);const rr=lerp(.11,.04,i/N);m.scale.set(rr,len*1.05,rr);m.quaternion.setFromUnitVectors(UP,d.divideScalar(len));}
    const last=TMP.subVectors(pts[N],pts[N-1]).normalize();W.tip.position.copy(pts[N]);W.tip.quaternion.setFromUnitVectors(UP,last);
    if(e>.7&&Math.random()<.5)burst(SMK,pts[N],1,{colors:[0x8a1020,0xc4102a],speed:2,life:.5,size:.12,size1:.03,grav:12});
  }
  updateExtras(dt){
    const R=this.rig,t=game.time,M=this.move;
    if(R.beast){const B=R.beast.group;let e=0;
      if(this.state==='attack'&&M&&M.beast){const st=this.stateT;e=st<M.st?.2*st/M.st:(st<M.st+M.ac?.2+.8*((st-M.st)/M.ac):Math.max(0,1-(st-M.st-M.ac)/(M.rc*.8)));e*=M.rng*.85;}
      this.beastReach=Math.max(0,this.beastReach-dt*14);e=Math.max(e,this.beastReach);
      const big=this.state==='ult'&&this.hero.ult==='eclipse'&&this.stateT>.8&&this.stateT<2.2?2.3:1;
      const sc=lerp(B.scale.x,big,Math.min(1,6*dt));B.scale.setScalar(sc);
      B.position.z=lerp(B.position.z,-.42+e/this.hero.scale+(big>1?.9:0),Math.min(1,22*dt));B.position.y=lerp(B.position.y,.85+(big>1?.9:0)-Math.min(e,2)*.12+Math.sin(t*2.2)*.05,Math.min(1,10*dt));
      R.beast.head.rotation.y=big>1?Math.sin(t*6)*.6:Math.sin(t*1.3)*.2;R.beast.jaw.rotation.x=Math.min(.7,e*.25+(big>1?.4+Math.sin(t*9)*.2:0));
      R.beast.body.forEach((b,k)=>{b.position.x=Math.sin(t*3+k)*.05*k;});
      if((e>.5||big>1)&&Math.random()<.5){R.beast.head.getWorldPosition(TMP2);burst(SMK,TMP2,1,{colors:[0x0a0814,0x2a1a5a],speed:.8,life:.6,size:.4*sc,size1:.05,drag:2});}}
    if(R.wings){const open=!this.onGround||this.state==='dash'||this.state==='ult'||this.state==='special';
      R.wings.forEach((w,i)=>{const s=i?1:-1;const flap=open?Math.sin(t*12)*.35:Math.sin(t*2)*.05;const tgt=open?.1+flap:.9;w.rotation.y=lerp(w.rotation.y,-s*tgt,Math.min(1,10*dt));w.rotation.x=open?-.2:.15;});
      if(open&&Math.random()<.3){R.spine.getWorldPosition(TMP2);burst(ADD,TMP2.set(TMP2.x,TMP2.y+.4,TMP2.z),1,{colors:[0xff4f8b,0xffd0e0],speed:1.5,life:.5,size:.25,bright:1.8,rad:.6});}}
    if(R.orbiters)R.orbiters.forEach((o,k)=>{const a=t*1.6+k*Math.PI/2;o.position.set(Math.cos(a)*.48,1.05+Math.sin(t*2+k)*.15,Math.sin(a)*.48);o.rotation.x+=dt*2;o.rotation.y+=dt*3;});
    if(R.spikes){const on=this.armorT>0;R.spikes.forEach(c=>{c.visible=on;});}
    if(R.field&&HAS(this.hero,'void')){R.field.visible=this.fieldT>0;if(R.field.visible){R.field.material.uniforms.t.value=t;R.field.scale.setScalar(Math.min(1,(3.2-this.fieldT)*6+.05)*(1+Math.sin(t*6)*.02));}}
    if(R.field&&HAS(this.hero,'hex')){R.field.rotation.z+=dt*(this.state==='ult'?6:.8);}
    const id=KIT(this.hero,'elem');
    if(id==='volta'&&Math.random()<.08&&nearCam(this.pos,40)){const fp=(Math.random()<.5?R.lF:R.rF).getWorldPosition(new V3());bolt(fp,fp.clone().add(new V3(rand(-.5,.5),rand(-.4,.3),rand(-.5,.5))),0xffe03a,.025,.08);}
    if(id==='pyre'&&Math.random()<.5){R.lS.getWorldPosition(TMP2);burst(ADD,TMP2,1,{colors:[0x2a8aff,0xaee0ff],speed:.4,up:1.8,life:.4,size:.25,size1:0,bright:2.2,rad:.15});}
    if(id==='warp'&&Math.random()<.5)burst(SMK,TMP2.set(this.pos.x+rand(-.4,.4),this.pos.y+rand(.2,1.6),this.pos.z+rand(-.4,.4)),1,{colors:[0x2a1a5a,0x4a3a8a],speed:.4,up:.4,life:1,size:.4,size1:.9,drag:1});
    // swing trail
    let act=false,limb='r';
    if(this.state==='attack'&&M&&M.limb&&!this.dead){const st=this.stateT;act=st>=M.st*.6&&st<M.st+M.ac+M.rc*.35;limb=M.limb;}
    if(this.state==='special'&&this.hero.special==='rocket'&&this.fired&&this.stateT<.55)act=true;
    if(this.cabSwing){this.cabSwing=false;act=true;limb=R.sword?'s':'r';}
    if(act||this.trail.mesh.visible){
      if(act){R.root.updateMatrixWorld(true);const a=new V3(),b=new V3();
        if(limb==='s'&&R.sword){R.rF.getWorldPosition(a);R.sword.localToWorld(b.set(0,R.swordTip||1.05,0));a.lerp(b,.15);}
        else if(limb==='f'){R.rK.getWorldPosition(a);R.rK.localToWorld(b.set(0,-.48,.12));}
        else{(limb==='l'?R.lE:R.rE).getWorldPosition(a);(limb==='l'?R.lF:R.rF).getWorldPosition(b);b.addScaledVector(TMP3.subVectors(b,a),.3);a.lerp(b,.35);}
        this.trail.update(dt,true,a,b,this.hero.accent);elemOf(this).tip(b,this);}
      else this.trail.update(dt,false,null,null,this.hero.accent);}
  }
  land(){
    if(this.state==='fly'&&this.dropDmg){const d=this.dropDmg;this.dropDmg=0;dust(this.pos,20,1.6);shake(.4,this.pos);AU.land();AU.hit(1.2);
      ring(TMP2.set(this.pos.x,.15,this.pos.z),0xb58cff,3,.4,true,2);
      if(NET.role!=='client'&&!this.dead){this.hp-=d;this.flash=1;if(this.hp<=0){this.hp=0;const k=this.lastHitBy&&!this.lastHitBy.dead?this.lastHitBy:null;this.onGround=true;killFighter(this,k,null);return;}}}
    if(this.state==='fly'){
      if(this.bounce<1&&this.vel.y<-7){this.vel.y=-this.vel.y*.35;this.vel.x*=.6;this.vel.z*=.6;this.bounce++;this.pos.y+=.01;dust(this.pos,12,1.1);shake(.35,this.pos);AU.land();AU.hit(.6);return;}
      this.onGround=true;this.vel.y=0;this.set(this.dead?'ko':'down');this.invuln=.9;dust(this.pos,10,1);AU.land();shake(.2,this.pos);return;
    }
    this.onGround=true;this.dj=false;this.airDash=false;
    if(this.state==='ult'){this.slamLanded=true;this.vel.set(0,0,0);return;}
    const hard=this.vel.y<-8;this.vel.y=0;this.landT=.18;
    if(this.state==='attack'&&this.move&&this.move.dive)diveLand(this);
    if(this.state==='air'||(this.state==='attack'&&this.move.air)){this.set(Math.hypot(this.vel.x,this.vel.z)>.7?'run':'idle');dust(this.pos,hard?10:4,hard?1:.5);AU.scale=sndAt(this.pos);AU.landW(this.hero.scale*(this.hero.bulk||1),hard);}
  }
  startUlt(){
    this.meter=0;this.set('ult');emitEv('ult',this);this.u1=false;this.uStep=0;this.slamLanded=false;this.uEnd=99;this.invuln=1.2;this.hitMap={};this.vf={};this.ultPow=1;this.ocChk=false;
    this.ultAlt=!!ALTULT[KIT(this.hero,'alt')]&&(inDir(this)==='b'||!this.onGround||!!this.intent.ultB);
    if(this===ME){game.cine={f:this,t:0};banner({css:this.hero.css,ultName:ultLabel(this)});}
    else if(ME&&this.pos.distanceTo(ME.pos)<40)feed(`<b style="--c:${this.hero.css}">${esc(this.name)}</b> unleashed ${ultLabel(this)}`);
    sfx(this,'charge');this.vel.x=this.vel.z=0;
  }
  doUlt(dt,dirO,dist,tg){
    const H=this.hero,t=this.stateT,c=this.chest(new V3()),E=enemiesOf(this);
    if(t<.9){this.poseKey='charge';this.invuln=Math.max(this.invuln,.2);
      if(typeof ultOpening==='function'&&ultOpening(this,t,c,dt))return 10;
      for(let k=0;k<4;k++){const a=rand(0,6.28),r=rand(2,3.5),p=new V3(c.x+Math.cos(a)*r,c.y+rand(-1.2,1.2),c.z+Math.sin(a)*r);
        ADD.spawn(p.x,p.y,p.z,(c.x-p.x)*3,(c.y-p.y)*3,(c.z-p.z)*3,..._rgb(pick([H.color,H.accent,0xffffff]),2.2),.33,.3,.05,0,0);}
      if(Math.random()<.2)ring(c,H.color,rand(1.5,2.5),.3,false,2);return 10;}
    const near=(p,R,maxY)=>E.filter(o=>Math.hypot(o.pos.x-p.x,o.pos.z-p.z)<R&&o.pos.y<(maxY||99));
    const big=(o,x)=>Object.assign({dmg:20,kb:13,up:12,launch:true,heavy:true,pt:o.chest(new V3()),noSpark:true,chip:.25},x||{});
    const XU=ULTX[H.ult];
    if(XU){if(!this.u1){this.u1=true;sfx(this,'ult');if(game.cine&&game.cine.f===this)game.cine=null;this.uEnd=1.6;XU.s(this,c,E,tg&&!tg.dead&&dist<(XU.r||14)+4?tg:null,dist,dirO);}
      const xr=XU.u?XU.u(this,t,dt):12;if(t>this.uEnd){this.set(this.onGround?'idle':'air');this.invuln=.2;this.clearUltFX();}return xr==null?12:xr;}
    if(!this.u1){this.u1=true;sfx(this,'ult');if(game.cine&&game.cine.f===this)game.cine=null;
      if(H.ult==='supernova'){this.poseKey='spech';explosion(c,7.5,[0xff5a1f,0xffb347,0xff2a10]);screenFlash(.6,this.pos);
        near(this.pos,7.5).forEach(o=>applyHit(this,o,big(o,{dmg:26,kb:15,up:13})));
        for(let k=0;k<14;k++){const a=k/14*6.28;spikeFire(this.pos.x+Math.cos(a)*4,this.pos.z+Math.sin(a)*4);}
        props.forEach(pp=>{if(Math.hypot(pp.x-this.pos.x,pp.z-this.pos.z)<7.5)breakProp(pp);});this.uEnd=1.6;}
      if(H.ult==='tidal'){this.poseKey='spech';spawnProj(this,'wave');this.uEnd=1.4;}
      if(H.ult==='tempest'){if(tg&&dist<16){this.uStep=1;this.rushT=tg;}else{const f=this.fwd();this.vel.copy(f.multiplyScalar(26));this.uEnd=1.2;}}
      if(H.ult==='tectonic'){this.poseKey='slamAir';const hd=tg?Math.min(dist,16):10,dd=tg?dirO:this.fwd();this.vel.set(dd.x*hd/.87,13,dd.z*hd/.87);this.onGround=false;this.pos.y+=.05;dust(this.pos,14,1.2);}
      if(H.ult==='bloodarrow'){this.poseKey='spech';this.beamDir=this.fwd();this.uEnd=2.35;let L=48;const o0=c.clone();
        for(let d=1;d<48;d+=1){const x=o0.x+this.beamDir.x*d,z=o0.z+this.beamDir.z*d;if(insideBld(x,z,0,o0.y)){L=d;break;}}this.beamLen=L;
        screenFlash(.5,this.pos);this.rig.beam.group.visible=true;}
      if(H.ult==='chain'){this.poseKey='spech';const dd=tg?dirO:this.fwd(),D=tg?Math.min(Math.max(dist,4),16):12;const st=this.pos.clone().addScaledVector(dd,1.6),en=this.pos.clone().addScaledVector(dd,D);
        this.chainPts=[];for(let k=0;k<7;k++)this.chainPts.push(st.clone().lerp(en,k/6));this.uStep=0;miniBlast(this.chest(new V3()).addScaledVector(dd,.8),1);}
      if(H.ult==='collapse'){this.poseKey='slamLand';this.uEnd=2.4;screenFlash(.35,this.pos);
        ring(TMP.set(this.pos.x,.2,this.pos.z),0xc9a0ff,26,1.1,true,2.4);ring(TMP.set(this.pos.x,.3,this.pos.z),0x8a8290,24,1.25,true,1.5);}
      if(H.ult==='arsenal'){this.poseKey='spech';this.arsenal=['fireball','blade','cyclone','fault','erode'].sort(()=>Math.random()-.5).slice(0,4);this.uStep=0;this.uEnd=2.3;this.arsTgt=tg;}
      if(H.ult==='thunderdome'){this.poseKey='command';this.uEnd=2.35;this.lastBoltT=0;this.domeDone=false;orb(c,0xffe03a,10,1.3,.6);ring(TMP.set(this.pos.x,.2,this.pos.z),0xffe03a,20,.8,true,2.4);}
      if(H.ult==='eclipse'){this.poseKey='command';this.uEnd=2.35;this.lastSw=0;this.eclDone=false;ring(TMP.set(this.pos.x,.2,this.pos.z),0x7a4cff,16,.7,true,2);}
      if(H.ult==='meteor'){this.poseKey='command';this.uEnd=2.3;const T=E.filter(o=>o.pos.distanceTo(this.pos)<16);
        T.forEach(o=>applyHit(this,o,{dmg:2,kb:0,stun:.3,pt:o.chest(new V3()),float:1.7,drop:4,noSpark:true}));
        const base=tg&&dist<18?tg.pos:this.pos.clone().addScaledVector(this.fwd(),9);this.metPts=[];
        for(let k=0;k<14;k++){const T0=T.length?T[k%T.length].pos:base;this.metPts.push({x:T0.x+rand(-3,3)*(k<T.length?0.2:1),z:T0.z+rand(-3,3)*(k<T.length?0.2:1),t:.95+k*.075});}
        this.uStep=0;}
      if(H.ult==='unbreakable'){this.poseKey='dash';this.armorT=Math.max(this.armorT,2.4);this.rushDir=tg&&dist<18?dirO.clone():this.fwd();this.face=Math.atan2(this.rushDir.x,this.rushDir.z);this.uEnd=99;this.punched=false;}
      if(H.ult==='skyfall'){this.poseKey='spech';this.vel.set(0,16,0);this.onGround=false;this.pos.y+=.05;this.uEnd=2.6;this.lastFeather=0;this.skyTgt=tg&&dist<22?tg:null;this.skyPt=this.pos.clone().addScaledVector(this.fwd(),10);}
      if(H.ult==='cataclysm'){this.poseKey='smashh';this.uEnd=1.75;const f=this.fwd(),o0=this.pos.clone();
        E.forEach(o=>{const rx=o.pos.x-o0.x,rz=o.pos.z-o0.z,al=rx*f.x+rz*f.z,lt=Math.abs(rx*f.z-rz*f.x);if(al>-1&&al<24&&lt<2+al*.32&&o.pos.y<6)applyHit(this,o,big(o,{dmg:30,kb:24,up:10}));});
        props.forEach(pp=>{const rx=pp.x-o0.x,rz=pp.z-o0.z,al=rx*f.x+rz*f.z,lt=Math.abs(rx*f.z-rz*f.x);if(al>0&&al<24&&lt<2+al*.32)breakProp(pp);});
        for(let k=1;k<=7;k++){const p=o0.clone().addScaledVector(f,k*3.2);p.y=1.2;const rr=ring(p,0xcfe4ff,1.5+k*.55,.35+k*.05,false,2.6);}
        for(let k=0;k<160;k++){const a=rand(0,24),w=(2+a*.32)*rand(-1,1);const p=o0.clone().addScaledVector(f,a).add(new V3(-f.z*w,rand(.3,3),f.x*w));ADD.spawn(p.x,p.y,p.z,f.x*rand(25,45),rand(-1,1),f.z*rand(25,45),..._rgb(pick([0xcfe4ff,0xffffff,0x3a7dff]),1.6),.45,.35,0,0,1);}
        burst(SMK,this.pos,30,{colors:[0x8a8076,0x6a625a],speed:12,up:1,life:1.2,size:1,size1:3,drag:2,flat:true});debris(TMP.set(this.pos.x,.3,this.pos.z).addScaledVector(f,3),14,0,14,.4);
        screenFlash(.75,this.pos);shake(1.4,this.pos);}
      if(H.ult==='azureinferno'){this.poseKey='charge';this.uEnd=2.35;this.infDone=false;}
      if(H.ult==='abyss'){this.poseKey='command';this.uEnd=1.95;this.abC=tg&&dist<22?tg.pos.clone():this.pos.clone().addScaledVector(this.fwd(),10);this.abC.y=.1;this.abDone=false;
        portal(this.abC,6.5,true,1.6);}
      if(H.ult==='dominion'){this.poseKey='command';this.uEnd=2.6;this.domC=this.pos.clone();this.domDone=false;this.lastDom=0;this.domA=rand(0,6.28);
        this.domClaws=[];for(let k=0;k<5;k++){const cl=makeDomClaw();scene.add(cl);this.domClaws.push(cl);}
        screenFlash(.3,this.pos);ring(TMP.set(this.pos.x,.2,this.pos.z),0xff3a1a,20,.8,true,2.4);}
      if(H.ult==='singularity'){this.poseKey='command';this.uEnd=2.6;this.singP=(tg&&dist<18?tg.pos.clone():this.pos.clone().addScaledVector(this.fwd(),10));this.singP.y=1.6;this.singDone=false;
        this.singMesh=makeSingularity();this.singMesh.position.copy(this.singP);scene.add(this.singMesh);}
      if(H.ult==='sealedarena'){this.poseKey='command';this.uEnd=4.2;this.arC=this.pos.clone();this.arDone=false;this.lastCut=0;this.arMesh=makeArena();this.arMesh.position.set(this.arC.x,0,this.arC.z);scene.add(this.arMesh);
        screenFlash(.25,this.pos);}
      if(H.ult==='thousandcuts'){this.poseKey='dash';this.cutDir=tg&&dist<16?dirO.clone():this.fwd();this.face=Math.atan2(this.cutDir.x,this.cutDir.z);this.cutFrom=this.pos.clone();this.uEnd=99;this.cutStage=0;this.cutList=[];this.cutK=-1;}
      if(H.ult==='stopmotion'){this.poseKey='dash';this.rushList=E.filter(o=>o.pos.distanceTo(this.pos)<18&&o.invuln<=0);
        if(this.rushList.length){this.rushList.forEach(o=>applyHit(this,o,{dmg:3,kb:0,stun:.3,pt:o.chest(new V3()),frame:3,noSpark:true}));screenFlash(.4,this.pos);this.uStep=1;}
        else{this.uEnd=1.2;const f=this.fwd();this.vel.copy(f.multiplyScalar(30));}}
    }
    if(H.ult==='tempest'&&this.uStep>0){
      this.invuln=.5;this.vel.set(0,0,0);const o=this.rushT;const times=[.92,1.02,1.12,1.22,1.32,1.42,1.62];
      if(o&&!o.dead&&this.uStep<=times.length&&t>=times[this.uStep-1]){
        const last=this.uStep===times.length,from=this.chest(new V3());const a=rand(0,6.28);
        this.pos.set(clamp(o.pos.x+Math.cos(a)*1.5,-BOUND,BOUND),o.pos.y,clamp(o.pos.z+Math.sin(a)*1.5,-BOUND,BOUND));
        this.face=Math.atan2(o.pos.x-this.pos.x,o.pos.z-this.pos.z);const to=this.chest(new V3());
        for(let k=0;k<24;k++){const p=from.clone().lerp(to,k/24);ADD.spawn(p.x,p.y,p.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),..._rgb(pick([H.color,H.accent]),2.2),.35,.45,0,0,0);}
        this.poseKey=this.uStep%2?'slash':'jabRh';AU.whoosh(true);
        applyHit(this,o,last?big(o,{dmg:9,kb:14,up:10}):{dmg:3.5,kb:.2,stun:.6,hold:true,pt:o.chest(new V3()),chip:.25});
        this.uStep++;if(last)this.uEnd=t+.35;
      }else if(!o||o.dead)this.uEnd=Math.min(this.uEnd,t+.2);
      if(t>this.uEnd){this.set(this.onGround?'idle':'air');this.invuln=.2;}return 0;
    }
    if(H.ult==='stopmotion'&&this.uStep>0){
      this.invuln=.5;this.vel.set(0,0,0);const L=this.rushList.filter(o=>!o.dead);const steps=9,T0=1.0,dtS=.11;
      if(L.length&&this.uStep<=steps&&t>=T0+(this.uStep-1)*dtS){
        const last=this.uStep===steps,o=L[(this.uStep-1)%L.length],from=this.pos.clone();const a=rand(0,6.28);
        this.pos.set(clamp(o.pos.x+Math.cos(a)*1.4,-BOUND,BOUND),o.pos.y,clamp(o.pos.z+Math.sin(a)*1.4,-BOUND,BOUND));this.face=Math.atan2(o.pos.x-this.pos.x,o.pos.z-this.pos.z);
        for(let k=0;k<=3;k++)panel(from.clone().lerp(this.pos,k/3),this.face,k%2?0x3fe0c5:0xe8fffb,.45);
        this.poseKey=this.uStep%2?'slash':'kickh';AU.shutter(2);AU.whoosh(true);
        if(last){L.forEach(e=>applyHit(this,e,big(e,{dmg:9,kb:12,up:11})));AU.glass();screenFlash(.35,this.pos);}
        else applyHit(this,o,{dmg:3.2,kb:0,stun:.3,pt:o.chest(new V3()),keepFrame:true,chip:.25});
        this.uStep++;if(last)this.uEnd=t+.4;
      }else if(!L.length)this.uEnd=Math.min(this.uEnd,t+.2);
      if(t>this.uEnd){this.set(this.onGround?'idle':'air');this.invuln=.2;}return 0;
    }
    if(H.ult==='dominion'&&this.domClaws){
      const C=this.domC;if(ME&&ME.pos.distanceTo(C)<50)TINT.target=1;
      const rise=Math.min(1,Math.max(0,(t-.9)/.22));if(t<2)this.domA+=dt*2.4;const R=t<2?10.5:Math.max(2.5,10.5-(t-2)*34);
      this.domClaws.forEach((cl,k)=>{const a=this.domA+k/5*Math.PI*2;cl.position.set(C.x+Math.cos(a)*R,0,C.z+Math.sin(a)*R);cl.rotation.set(0,Math.atan2(C.x-cl.position.x,C.z-cl.position.z),0);
        const fade=t>2.2?Math.max(.01,1-(t-2.2)/.3):1;cl.scale.set(fade,Math.max(.01,rise*fade),fade);
        cl.visible=Math.hypot(camera.position.x-cl.position.x,camera.position.z-cl.position.z)>3.6;
        if(Math.random()<.5)burst(ADD,TMP2.set(cl.position.x,rand(.2,5),cl.position.z),1,{colors:[0xff6a4a,0xffb08a],end:0x3a0000,speed:.5,up:2,life:.6,size:.4,size1:0,bright:2.2});});
      if(t>1.05&&t<2&&t-this.lastDom>.18){this.lastDom=t;
        E.forEach(o=>{const d=Math.hypot(o.pos.x-C.x,o.pos.z-C.z);if(d<10&&o.pos.y<6){o.pos.x+=(C.x-o.pos.x)*.08;o.pos.z+=(C.z-o.pos.z)*.08;const pt=o.chest(new V3());slashFX(pt,0xff3a1a,2.4);applyHit(this,o,{dmg:2.6,kb:0,stun:.4,hold:true,pt,noSpark:true,cut:true,chip:.3});}});
        for(let q=0;q<4;q++){const a=rand(0,6.28),r=rand(1,9.5);slashFX(new V3(C.x+Math.cos(a)*r,rand(.4,3),C.z+Math.sin(a)*r),0xff3a1a,rand(1.5,3));}
        for(let q=0;q<2;q++){const a=rand(0,6.28);groundScar(new V3(C.x+Math.cos(a)*rand(1,4),0,C.z+Math.sin(a)*rand(1,4)),new V3(C.x+Math.cos(a)*rand(6,9.5),0,C.z+Math.sin(a)*rand(6,9.5)),0xff3a1a);}
        const sc=AU.scale;AU.scale=sndAt(C);SND.demon.cut();AU.scale=sc;shake(.3,C);
        props.forEach(pp=>{if(Math.hypot(pp.x-C.x,pp.z-C.z)<10)breakProp(pp);});}
      if(t>=2.05&&!this.domDone){this.domDone=true;const f=this.fwd();const a1=Math.atan2(f.x,f.z)+Math.PI/4;
        [a1,a1-Math.PI/2].forEach(a=>{const d=new V3(Math.sin(a),0,Math.cos(a));const A=new V3(C.x-d.x*12,1.4,C.z-d.z*12),Bp=new V3(C.x+d.x*12,1.4,C.z+d.z*12);
          cutLine(A,Bp,0xffffff,.7,.5);cutLine(A,Bp,0xff3a1a,1.6,.55);groundScar(new V3(C.x-d.x*11,0,C.z-d.z*11),new V3(C.x+d.x*11,0,C.z+d.z*11),0xff3a1a,true);});
        explosion(TMP.set(C.x,1.2,C.z),6.5,[0xff3a1a,0xffb08a,0x3a0000]);AU.boom(true);const sc=AU.scale;AU.scale=sndAt(C);SND.demon.rend();AU.scale=sc;screenFlash(.55,C);
        E.forEach(o=>{if(Math.hypot(o.pos.x-C.x,o.pos.z-C.z)<10.5)applyHit(this,o,big(o,{dmg:12,kb:13,up:12}));});}
    }
    if(H.ult==='singularity'&&this.singMesh){
      const sp=this.singP,m=this.singMesh;m.rotation.y+=dt*3;m.children[1].rotation.z+=dt*5;const g=Math.min(1,(t-.9)/.3);m.scale.setScalar(Math.max(.01,g)*(1+Math.sin(t*20)*.04));
      if(nearCam(sp,90))for(let q=0;q<10;q++){const a=rand(0,6.28),r=rand(3,9),y=rand(-2,3);ADD.spawn(sp.x+Math.cos(a)*r,sp.y+y,sp.z+Math.sin(a)*r,-Math.cos(a)*r*1.6,-y*1.6,-Math.sin(a)*r*1.6,..._rgb(pick([0x8ac4ff,0xeaf6ff,0x3a4aff]),1.8),.6,.3,0,0,0);}
      if(t<2.1){shake(.2,sp);E.forEach(o=>{const dx=sp.x-o.pos.x,dz=sp.z-o.pos.z,d=Math.hypot(dx,dz);if(d<15&&d>.6){const k=Math.min(1,dt*3.5);o.pos.x+=dx*k*.6;o.pos.z+=dz*k*.6;}
          if(d<15&&t-(this.hitMap['s'+o.id]||0)>.2){this.hitMap['s'+o.id]=t;applyHit(this,o,{dmg:2.5,kb:0,stun:.4,hold:true,pt:o.chest(new V3()),noSpark:true,chip:.3});}});
        props.forEach(pp=>{if(Math.hypot(pp.x-sp.x,pp.z-sp.z)<6)breakProp(pp);});if(Math.random()<.2){const sc=AU.scale;AU.scale=sndAt(sp);AU.tone('sine',50,40,.3,.25);AU.scale=sc;}}
      else if(!this.singDone){this.singDone=true;explosion(sp,6,[0x8ac4ff,0xeaf6ff,0x3a4aff]);AU.boom(true);screenFlash(.5,sp);
        E.forEach(o=>{if(o.pos.distanceTo(sp)<7)applyHit(this,o,big(o,{dmg:14,kb:14,up:12}));});scene.remove(m);this.singMesh=null;}
    }
    if(H.ult==='sealedarena'&&this.arMesh){
      const C=this.arC,R=11,m=this.arMesh;m.children[0].material.uniforms.t.value=t;m.children[1].rotation.z+=dt*.6;const g=Math.min(1,(t-.9)/.25);m.scale.setScalar(Math.max(.01,g));
      if(t<4){E.forEach(o=>{const dx=o.pos.x-C.x,dz=o.pos.z-C.z,d=Math.hypot(dx,dz);if(d<R+1.5&&d>R-.6){o.pos.x=C.x+dx/d*(R-.6);o.pos.z=C.z+dz/d*(R-.6);}});
        if(t-this.lastCut>.22){this.lastCut=t;E.forEach(o=>{if(Math.hypot(o.pos.x-C.x,o.pos.z-C.z)<R){const oc=o.chest(new V3());slashFX(oc,0x5aff8a,2.2);applyHit(this,o,{dmg:2.4,kb:.2,stun:.4,hold:true,pt:oc,noSpark:true,chip:.3});}});
          for(let k=0;k<3;k++){const a=rand(0,6.28),r=rand(1,R);slashFX(new V3(C.x+Math.cos(a)*r,rand(.5,3),C.z+Math.sin(a)*r),0x5aff8a,rand(1.2,2.4));}
          const sc=AU.scale;AU.scale=sndAt(C);SND.curse.hit(.7);AU.scale=sc;}}
      else if(!this.arDone){this.arDone=true;E.forEach(o=>{if(Math.hypot(o.pos.x-C.x,o.pos.z-C.z)<R){for(let k=0;k<4;k++)slashFX(o.chest(new V3()),0xd8ffe0,3);applyHit(this,o,big(o,{dmg:9,kb:10,up:12}));}});
        explosion(TMP.set(C.x,1,C.z),5,[0x5aff8a,0xd8ffe0,0x1a6a3a],false);AU.boom(true);scene.remove(m);this.arMesh=null;}
    }
    if(H.ult==='thousandcuts'&&this.cutList){
      if(this.cutStage===0){this.invuln=.3;const d=this.cutDir;this.vel.x=d.x*34;this.vel.z=d.z*34;
        if(Math.random()<.9)panel(this.pos,this.face,0xff6060,.35);
        E.forEach(o=>{if(this.cutList.indexOf(o)<0&&o.pos.distanceTo(this.pos)<2.4&&o.invuln<=0){this.cutList.push(o);applyHit(this,o,{dmg:3,kb:0,stun:1.2,hold:true,pt:o.chest(new V3()),noSpark:true});}});
        if(t>1.35||this.pos.distanceTo(this.cutFrom)>15){this.cutStage=1;this.vel.set(0,0,0);this.poseKey='slash';this.cutT=t;sfx(this,'swing',true);}}
      else if(this.cutStage===1){this.vel.set(0,0,0);const k=Math.floor((t-this.cutT)/.07);
        if(k>this.cutK&&k<12){this.cutK=k;const L=this.cutList.filter(o=>!o.dead);L.forEach(o=>{slashFX(o.chest(new V3()),k%2?0xffffff:0xff6060,2.6);});
          for(let q=0;q<2;q++){const p=this.cutFrom.clone().lerp(this.pos,Math.random());p.y=rand(.4,2.2);slashFX(p,0xff6060,2);}
          if(k%3===0){const sc=AU.scale;AU.scale=sndAt(this.pos);SND.blade.hit(.6);AU.scale=sc;}L.forEach(o=>applyHit(this,o,{dmg:1.8,kb:0,stun:.3,hold:true,pt:o.chest(new V3()),noSpark:true}));}
        if(t-this.cutT>.9){this.cutStage=2;this.cutList.filter(o=>!o.dead).forEach(o=>applyHit(this,o,big(o,{dmg:10,kb:12,up:11})));AU.boom(false);this.uEnd=t+.35;}}
    }
    if(H.ult==='thunderdome'&&t<2.2){
      if(t<2.0&&t-this.lastBoltT>.1){this.lastBoltT=t;
        near(this.pos,10.5,8).forEach(o=>{const oc=o.chest(new V3());bolt(new V3(oc.x+rand(-2,2),26,oc.z+rand(-2,2)),oc,0xffe03a,.06);applyHit(this,o,{dmg:2.4,kb:0,stun:.5,hold:true,pt:oc,chip:.25,noSpark:true});});
        for(let q=0;q<2;q++){const a=rand(0,6.28),r=rand(2,10);const g=new V3(this.pos.x+Math.cos(a)*r,.1,this.pos.z+Math.sin(a)*r);bolt(new V3(g.x+rand(-2,2),26,g.z+rand(-2,2)),g,0xffe03a,.08);
          burst(ADD,g,12,{colors:[0xffe03a,0xffffff],speed:6,up:3,life:.3,size:.25,bright:2.4});scorch(g.x,g.z,1.2);}
        AU.zap(1);shake(.25,this.pos);}
      if(t>=2.0&&!this.domeDone){this.domeDone=true;explosion(c,6,[0xffe03a,0xfff6b0,0xffffff],false);AU.boom(true);
        near(this.pos,10.5,8).forEach(o=>{bolt(new V3(o.pos.x,30,o.pos.z),o.chest(new V3()),0xffffff,.22,.3);applyHit(this,o,big(o,{dmg:8,kb:12,up:12}));});}
    }
    if(H.ult==='eclipse'&&t<2.2){
      if(t>1&&t<1.9&&t-this.lastSw>.17){this.lastSw=t;near(this.pos,7.5,5).forEach(o=>applyHit(this,o,{dmg:3,kb:.3,stun:.5,hold:true,pt:o.chest(new V3()),chip:.25}));AU.whoosh(true);AU.noise(.3,.4,'lowpass',400,80,1);
        for(let k=0;k<40;k++){const a=rand(0,6.28),r=rand(1,7.5);SMK.spawn(this.pos.x+Math.cos(a)*r,rand(.2,3),this.pos.z+Math.sin(a)*r,-Math.sin(a)*8,rand(-1,1),Math.cos(a)*8,.06,.04,.12,.6,.8,.1,0,2);}
        ring(TMP.set(this.pos.x,.3,this.pos.z),0x7a4cff,15,.35,true,2);shake(.35,this.pos);}
      if(t>=1.95&&!this.eclDone){this.eclDone=true;near(this.pos,8,5).forEach(o=>applyHit(this,o,big(o,{dmg:10,kb:12,up:13})));explosion(TMP.set(this.pos.x,1,this.pos.z),5,[0x7a4cff,0x2a1a6a,0xd8c4ff]);AU.boom(true);
        props.forEach(pp=>{if(Math.hypot(pp.x-this.pos.x,pp.z-this.pos.z)<8)breakProp(pp);});}
    }
    if(H.ult==='meteor'&&this.metPts){
      while(this.uStep<this.metPts.length&&t>=this.metPts[this.uStep].t){const m=this.metPts[this.uStep++];const from=new V3(m.x+rand(-7,7),32,m.z+rand(-7,7)),to=new V3(m.x,0,m.z);
        spawnProj(this,'meteor',0,{pos:from,dir:to.sub(from).normalize(),speed:36});}
    }
    if(H.ult==='unbreakable'){
      if(t<1.6){const d=this.rushDir;this.vel.x=d.x*26;this.vel.z=d.z*26;this.invuln=.2;if(Math.random()<.8)dust(this.pos,2,1);
        burst(ADD,this.chest(TMP2).addScaledVector(d,.6),3,{colors:[0xffc08a,0xff6a2a,0xffffff],speed:3,life:.25,size:.4,bright:2.2});
        E.forEach(o=>{if(!this.hitMap[o.id]&&o.pos.distanceTo(this.pos)<2.1&&Math.abs(o.pos.y-this.pos.y)<2.5){this.hitMap[o.id]=1;applyHit(this,o,big(o,{dmg:14,kb:14,up:9}));}});
        shake(.2,this.pos);}
      else if(!this.punched){this.punched=true;this.vel.set(0,0,0);this.poseKey='slamLand';explosion(TMP.set(this.pos.x,.5,this.pos.z),4.5,[0xff6a2a,0xffc08a,0xffffff]);debris(TMP.set(this.pos.x,.4,this.pos.z),16,0,12,.4);AU.boom(true);AU.rock();
        near(this.pos,6,3).forEach(o=>applyHit(this,o,big(o,{dmg:10,kb:10,up:13})));for(let k=0;k<16;k++){const a=k/16*6.28;spike(this.pos.x+Math.cos(a)*3,this.pos.z+Math.sin(a)*3,1.2);}this.uEnd=t+.5;}
    }
    if(H.ult==='skyfall'&&t>1.15&&t<2.1&&t-this.lastFeather>.035){this.lastFeather=t;
      const base=this.skyTgt&&!this.skyTgt.dead?this.skyTgt.pos:this.skyPt;const o0=this.chest(new V3());const to=new V3(base.x+rand(-3,3),0,base.z+rand(-3,3));
      spawnProj(this,'feather',0,{pos:o0,dir:to.sub(o0).normalize(),speed:42,quiet:true});if(Math.random()<.3)AU.whoosh(false);}
    if(H.ult==='azureinferno'&&t<2.2){
      if(t<2.0){this.poseKey='spech';const R=2+(t-.9)/1.1*10;
        if(nearCam(this.pos,90))for(let q=0;q<24;q++){const a=rand(0,6.28);ADD.spawn(this.pos.x+Math.cos(a)*R,rand(0,.5),this.pos.z+Math.sin(a)*R,rand(-.5,.5),rand(5,11),rand(-.5,.5),..._rgb(pick([0x2a8aff,0x5aa8ff,0x1a4aff]),1.7),.55,.6,0,0,1);}
        near(this.pos,R+1.6,4).forEach(o=>{const d=Math.hypot(o.pos.x-this.pos.x,o.pos.z-this.pos.z);if(Math.abs(d-R)<1.8&&t-(this.hitMap[o.id]||0)>.15){this.hitMap[o.id]=t;applyHit(this,o,{dmg:3,kb:.5,stun:.45,hold:true,pt:o.chest(new V3()),chip:.25});}});
        if(Math.random()<.3){const a=rand(0,6.28);scorch(this.pos.x+Math.cos(a)*R,this.pos.z+Math.sin(a)*R,1.6);}shake(.2,this.pos);flashLight(c,0x2a8aff,10);}
      if(t>=2.0&&!this.infDone){this.infDone=true;explosion(c,7,[0x2a8aff,0xaee0ff,0x1a3aaa]);AU.boom(true);near(this.pos,11.5,5).forEach(o=>applyHit(this,o,big(o,{dmg:10,kb:13,up:12})));
        props.forEach(pp=>{if(Math.hypot(pp.x-this.pos.x,pp.z-this.pos.z)<11)breakProp(pp);});}
    }
    if(H.ult==='abyss'&&this.abC){
      if(Math.random()<.6)burst(SMK,TMP2.set(this.abC.x+rand(-5,5),.3,this.abC.z+rand(-5,5)),1,{colors:[0x2a1a5a,0x4a3a8a],speed:2,up:.5,life:1,size:.8,size1:1.6,drag:1});
      if(t>=1.25&&!this.abDone){this.abDone=true;AU.boom(false);AU.tone('sine',300,60,.6,.3);
        E.forEach(o=>{if(Math.hypot(o.pos.x-this.abC.x,o.pos.z-this.abC.z)<6.8&&o.pos.y<4&&o.invuln<=0){applyHit(this,o,{dmg:8,kb:0,stun:.2,hold:true,pt:o.chest(new V3()),noSpark:true,chip:.4});
          if(o.state!=='block'&&o.state!=='bstun'){o.pos.y+=22;o.set('fly');o.onGround=false;o.vel.set(0,-6,0);o.dropDmg=16;o.bounce=1;portal(new V3(o.pos.x,o.pos.y+1,o.pos.z),2.6,true,1);}}});}
    }
    if(H.ult==='tectonic'){
      if(!this.slamLanded){this.invuln=.5;return 0;}
      if(this.uEnd===99){this.poseKey='slamLand';this.uEnd=t+.55;const p=this.pos.clone();
        explosion(TMP.set(p.x,.5,p.z),5,[0xffb52a,0xff7a20,0xffe08a]);debris(TMP.set(p.x,.4,p.z),20,1,13,.45);AU.boom(true);AU.rock();screenFlash(.35,p);
        for(let rr=1;rr<=3;rr++){const n=8+rr*5;for(let k=0;k<n;k++){const a=k/n*6.28+rr;setTimeout(()=>spike(p.x+Math.cos(a)*rr*2.4,p.z+Math.sin(a)*rr*2.4,1+rr*.5),rr*70);}}
        near(p,8.5,3).forEach(o=>applyHit(this,o,big(o,{dmg:25,kb:10,up:15})));
        props.forEach(pp=>{if(Math.hypot(pp.x-p.x,pp.z-p.z)<8)breakProp(pp);});}
    }
    if(H.ult==='bloodarrow'){
      const B=this.rig.beam,end=1.95,k=t<end?Math.min(1,(t-.9)/.08):Math.max(0,1-(t-end)/.3);
      if(k<=0||!this.beamDir){B.group.visible=false;}else{
        const org=this.chest(new V3()).addScaledVector(this.beamDir,.7),Lb=this.beamLen||48,rad=(1.05+Math.sin(t*55)*.12)*k;
        B.group.visible=true;B.group.position.copy(org);B.group.rotation.set(0,Math.atan2(this.beamDir.x,this.beamDir.z),0);
        B.tubes.forEach(m=>m.scale.z=Lb);B.group.scale.set(rad,rad,1);
        B.rings.forEach((r,i)=>{r.position.z=((t*30+i*8)%Lb);r.scale.setScalar(1+Math.sin(t*20+i)*.15);});B.muzzle.scale.setScalar(.75+Math.sin(t*40)*.12);
        for(let q=0;q<10;q++){const d=rand(0,Lb),p=org.clone().addScaledVector(this.beamDir,d);const a=rand(0,6.28),rr=rand(.5,1.4)*rad;
          ADD.spawn(p.x+Math.cos(a)*rr*this.beamDir.z,p.y+Math.sin(a)*rr,p.z-Math.cos(a)*rr*this.beamDir.x,this.beamDir.x*20+rand(-2,2),rand(-2,2),this.beamDir.z*20+rand(-2,2),..._rgb(pick([0xff3048,0xc4102a,0xffd0d0]),2.2),.3,.4,0,0,0);}
        if(t<end){shake(.35,this.pos);flashLight(org,0xff3048,10);
          E.forEach(o=>{const oc=o.chest(new V3()),rel=oc.sub(org),al=rel.dot(this.beamDir),lt=Math.hypot(rel.x-this.beamDir.x*al,rel.z-this.beamDir.z*al);
            if(al>-.5&&al<Lb&&lt<1.7&&Math.abs(rel.y)<2.2&&t-(this.hitMap[o.id]||0)>.11){this.hitMap[o.id]=t;const fin=t>end-.12;
              applyHit(this,o,fin?big(o,{dmg:8,kb:16,up:8}):{dmg:2.2,kb:.4,stun:.4,hold:true,pt:o.chest(new V3()),chip:.25});}});
          props.forEach(pp=>{if(pp.broken)return;const rx=pp.x-org.x,rz=pp.z-org.z,a2=rx*this.beamDir.x+rz*this.beamDir.z;if(a2>0&&a2<Lb&&Math.abs(rx*this.beamDir.z-rz*this.beamDir.x)<pp.r+1.3)breakProp(pp);});}
      }
    }
    if(H.ult==='chain'&&this.chainPts){
      const i=this.uStep;if(i<7&&t>=.95+i*.11+(i===6?.12:0)){const last=i===6,p=this.chainPts[i];const ep=new V3(p.x,last?.9:.5,p.z);
        if(last){explosion(ep,5.5,[0xff7a10,0xffd04a,0xff3010]);AU.boom(true);screenFlash(.45,ep);debris(ep,12,0,12,.35);}else{explosion(ep,2.3,[0xff7a10,0xffd04a],false);AU.boom(false);}
        near(p,last?5.5:2.8,4).forEach(o=>applyHit(this,o,last?big(o,{dmg:15,kb:14,up:13}):{dmg:3.2,kb:.3,stun:.55,hold:true,pt:o.chest(new V3()),noSpark:true,chip:.25}));
        props.forEach(pp=>{if(Math.hypot(pp.x-p.x,pp.z-p.z)<(last?5.5:2.6))breakProp(pp);});
        this.uStep++;if(last)this.uEnd=t+.45;}
    }
    if(H.ult==='collapse'&&t<2.05){
      const R=Math.min(13,(t-.9)/1.0*13),p=this.pos;shake(.3,p);
      for(let q=0;q<14;q++){const a=rand(0,6.28),x=p.x+Math.cos(a)*R,z=p.z+Math.sin(a)*R;if(Math.abs(x)>BOUND+2||Math.abs(z)>BOUND+2)continue;
        if(q<5)burst(SMK,TMP2.set(x,.2,z),1,{colors:[0x8a8290,0x5a5560,0x3a363e],speed:1.5,up:3,life:1.2,size:.6,size1:1.8,drag:1.5,grav:-.3});
        else if(nearCam(TMP2.set(x,0,z),90))ADD.spawn(x,.2,z,rand(-1,1),rand(2,6),rand(-1,1),..._rgb(pick([0xc9a0ff,0x9a6aff]),2),.5,.35,0,2,0);}
      if(Math.random()<.4){const a=rand(0,6.28),r=rand(0,R);debris(TMP2.set(p.x+Math.cos(a)*r,.2,p.z+Math.sin(a)*r),1,0,5,.25);}
      if(Math.random()<.15){const a=rand(0,6.28),r=rand(1,R);scorch(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,rand(1.5,3));}
      props.forEach(pp=>{if(Math.hypot(pp.x-p.x,pp.z-p.z)<R)breakProp(pp);});
      near(p,R,3).forEach(o=>{if(t-(this.hitMap[o.id]||0)>.14){this.hitMap[o.id]=t;const fin=t>1.9;
        applyHit(this,o,fin?big(o,{dmg:8,kb:8,up:14}):{dmg:2.4,kb:.2,stun:.5,hold:true,pt:o.chest(new V3()),chip:.25});}});
    }
    if(H.ult==='arsenal'&&this.arsenal){
      if(this.uStep<4&&t>=.95+this.uStep*.14){spawnProj(this,this.arsenal[this.uStep],(this.uStep-1.5)*.13);this.uStep++;burst(ADD,this.chest(TMP2),20,{colors:[0x8a3cff,0xe0c8ff],speed:6,life:.3,size:.3,bright:2.2});}
      if(this.uStep===4&&t>=1.8){this.uStep=5;const T=this.arsTgt&&!this.arsTgt.dead?this.arsTgt.pos.clone():this.pos.clone().addScaledVector(this.fwd(),10);const ep=T.clone();ep.y+=1;
        explosion(ep,6,[0x8a3cff,0xe0c8ff,0x3a0a7a]);AU.boom(true);screenFlash(.5,ep);
        E.forEach(o=>{if(o.chest(TMP2).distanceTo(ep)<6)applyHit(this,o,big(o,{dmg:16,kb:14,up:12}));});
        props.forEach(pp=>{if(Math.hypot(pp.x-ep.x,pp.z-ep.z)<6)breakProp(pp);});}
    }
    if(H.ult==='supernova'&&t<1.0)props.forEach(pp=>{if(Math.hypot(pp.x-this.pos.x,pp.z-this.pos.z)<7.5)breakProp(pp);});
    if(t>this.uEnd){this.set(this.onGround?'idle':'air');this.invuln=.2;if(this.rig.beam)this.rig.beam.group.visible=false;this.clearUltFX();}
    return 10;
  }
  targetPose(dt){
    const s=this.state,t=game.time;
    if(s==='idle'){const b=Math.sin(t*2.6)*.025;const P=Object.assign({},this.locked?GUARD:POSES.relaxed);P.hy+=b;P.lE+=b*3;P.rE-=b*3;P.sz=-this.lat*.12;return P;}
    if(s==='run'){const sp=Math.hypot(this.vel.x,this.vel.z);this.runPh+=sp*dt*(this.sprinting?1.05:1.25);const ph=this.runPh,S=Math.sin(ph),C=Math.cos(ph);const stp=Math.floor(ph/Math.PI);if(stp!==this.lastStep){this.lastStep=stp;if(this.onGround&&AU.scale>.12)stepSound(this);}
      const f=this.fwd(TMP2);const fwdSp=(this.vel.x*f.x+this.vel.z*f.z)/Math.max(sp,.1);const sign=fwdSp<-.3?-1:1;const A=this.sprinting?1.15:.85;
      const lean=clamp(-this.turnV*.06,-.35,.35);
      if(this.sprinting&&(KIT(this.hero,'elem')==='strobe'||KIT(this.hero,'elem')==='gale'))
        return Object.assign({},BASE,{hy:-.1+Math.abs(C)*.08,sx:.6,sz:lean,hd:-.35,lSx:1.1,rSx:1.1,lSz:.25,rSz:-.25,lE:-.2,rE:-.2,
          lHx:S*1.1-.25,rHx:-S*1.1-.25,lK:.3+Math.max(0,Math.sin(ph+1.3))*1.5,rK:.3+Math.max(0,Math.sin(ph+Math.PI+1.3))*1.5});
      return Object.assign({},BASE,{hy:-.06+Math.abs(C)*.07,sx:(this.sprinting?.45:.28)*sign,sy:-.1*(this.locked?1:0),sz:-this.lat*.18+lean,hd:-.1,
        lSx:-S*A*sign-.35,rSx:S*A*sign-.35,lE:-1.5,rE:-1.5,lSz:.18,rSz:-.18,
        lHx:S*A*sign-.15,rHx:-S*A*sign-.15,lK:.25+Math.max(0,Math.sin(ph+1.3))*1.3,rK:.25+Math.max(0,Math.sin(ph+Math.PI+1.3))*1.3});}
    if(s==='air')return this.vel.y>0?POSES.jump:POSES.fall;
    if(s==='block'||s==='bstun')return POSES.block;
    if(s==='dash')return POSES.dash;
    if(s==='hit')return POSES.hit;
    if(s==='framed')return this.P;
    if(s==='fly')return POSES.fly;
    if(s==='float')return POSES.float;
    if(s==='down'||s==='ko')return POSES.down;
    if(s==='getup')return POSES.getup;
    if(s==='downed'){const sp=Math.hypot(this.vel.x,this.vel.z);this.runPh+=sp*dt*3;const S=Math.sin(this.runPh);const P=Object.assign({},POSES.downedP);if(sp>.3){P.lSx+=S*.5;P.rSx-=S*.5;P.lHx+=S*.3;P.rHx-=S*.3;}return P;}
    if(s==='climb')return POSES[this.poseKey]||POSES.climbHang;
    if(s==='special'&&(this.spPend||this.specVar!=='n'||this.curSpecial()==='cab'||XSPK[this.curSpecial()]))return POSES[this.poseKey]||GUARD;
    if(s==='special'){const sp=this.stolenT>0?'proj':this.hero.special;
      if(sp==='rocket')return this.stateT<.15?POSES.jabRw:POSES.dash;if(sp==='framelock')return POSES.dash;
      if(sp==='bladeform'||sp==='harden')return this.stateT<.22?POSES.charge:POSES.heavyh;
      if(sp==='chainbolt'||sp==='gate'||sp==='shadowgrab'||sp==='nullfield'||sp==='vow')return this.stateT<.12?POSES.specw:POSES.command;
      if(sp==='rend')return this.stateT<.16?POSES.heavyw:POSES.slash;
      if(sp==='airburst')return this.stateT<.2?POSES.heavyw:POSES.smashh;
      return this.stateT<.22?POSES.specw:POSES.spech;}
    if(s==='win'){const P=Object.assign({},POSES.win);P.rSx+=Math.sin(t*3)*.08;return P;}
    return POSES[this.poseKey]||GUARD;
  }
  applyPose(dt){
    const R=this.rig;
    if(this.state!=='framed'){const T=this.targetPose(dt),P=this.P;
      const rate=(this.state==='attack'||this.state==='ult'||this.state==='hit'||this.state==='dash')?28:(this.state==='fly'||this.state==='down')?10:14;
      const k=Math.min(1,rate*dt);for(const key in T)P[key]+=(T[key]-P[key])*k;}
    const P=this.P;
    R.root.position.copy(this.pos);R.root.rotation.y=this.face;
    let flip=0;if(this.flipT>0){this.flipT=Math.max(0,this.flipT-dt);flip=(1-this.flipT/.42)*Math.PI*2;}
    R.hips.position.y=(R.hipY||.95)+P.hy-this.landT*.6;R.hips.rotation.x=P.hx+flip;
    R.spine.rotation.set(P.sx,P.sy,P.sz);R.head.rotation.x=P.hd;
    R.lS.rotation.set(P.lSx,0,P.lSz);R.lE.rotation.x=P.lE;R.rS.rotation.set(P.rSx,0,P.rSz);R.rE.rotation.x=P.rE;
    R.lH.rotation.set(P.lHx,0,P.lHz);R.lK.rotation.x=P.lK;R.rH.rotation.set(P.rHx,0,P.rHz);R.rK.rotation.x=P.rK;
    const fl=this.flash;R.mats.forEach(m=>{if(m.userData.add)m.userData.add.set(fl,fl,fl);});if(this.armorT>0){const a=.25+Math.sin(game.time*10)*.1;R.main.userData.add.set(fl+a,fl+a*.35,fl);}
    if(R.flames)R.flames.children.forEach((f,k)=>{f.scale.y=.85+Math.sin(game.time*17+k*2.1)*.15+Math.random()*.08;});
    R.glow.emissiveIntensity=this.meter>=100?2.4+Math.sin(game.time*12)*1.2:2.2;
    if(R.cloth&&nearCam(this.pos,45))updateCloth(R.cloth,game.time,Math.hypot(this.vel.x,this.vel.z)+Math.abs(this.vel.y)*.5);
    if(R.blades){const on=this.bladeT>0;R.blades.forEach(b=>{b.visible=on;if(on){const g=Math.min(1,(9-this.bladeT)*5);b.scale.set(g,g,.3*g);}});}
    const fr=R.frame;fr.visible=this.state==='framed';if(fr.visible){fr.rotation.y=-this.face;fr.children[1].material.opacity=.6+Math.sin(game.time*30)*.3;}
    this.updateWhip();this.updateExtras(dt);
    if(this.rig.beam&&this.state!=='ult')this.rig.beam.group.visible=false;
  }
}
