/* Bot AI */
/* ================= BOT AI ================= */
const ULT_RANGE={dominion:9,singularity:16,sealedarena:10,thousandcuts:14,collapse:10,arsenal:20,bloodarrow:26,chain:14,supernova:6,tectonic:12,tidal:18,tempest:14,stopmotion:14,thunderdome:10,eclipse:7,meteor:16,unbreakable:16,skyfall:18,cataclysm:20,azureinferno:10,abyss:22};
const SPECIAL_AI={rend:[0,12,.5],nullfield:[0,4,.35],vow:[0,8,.5],chainbolt:[0,16,.5],bluelash:[0,6,.6],gate:[4,22,.4],shadowgrab:[3,10,.45],harden:[0,5,.5],featherfan:[4,20,.5],airburst:[2,12,.45],bubble:[3,16,.45],bladeform:[0,7,.35],rocket:[2.5,8,.3],framelock:[2.5,10,.35]};
function nearestEnemy(f,maxD){let best=null,bd=maxD||1e9;for(const o of FS){if(ally(o,f)||o.dead)continue;const d=Math.hypot(o.pos.x-f.pos.x,o.pos.z-f.pos.z)+(o.downed?6:0);if(d<bd){bd=d;best=o;}}return best;}
class AI{
  constructor(f,d){this.f=f;this.t=0;this.blockT=0;this.str=Math.random()<.5?1:-1;this.react=[.42,.26,.15][d];this.def=[.2,.42,.62][d];this.aggr=[.45,.7,.9][d];
    this.retgt=0;this.wp=null;this.wpT=0;this.stuckT=0;this.avoidT=0;this.avoid=new V3();}
  vary(k){const r=Math.random(),f=this.f;const dir=r<.3?'f':r<.55?'b':'n';const hold=(k==='H'||k==='S')&&Math.random()<.3?rand(.4,1.1):(k==='U'&&Math.random()<.4?1.2:0);
    f.aiVar={dir,k,until:game.time+.4,holdUntil:game.time+hold};}
  setRel(dirO,mz,mx){const I=this.f.intent;I.wx=dirO.x*mz-dirO.z*mx;I.wz=dirO.z*mz+dirO.x*mx;}
  goTo(x,z){const f=this.f,I=f.intent;const dx=x-f.pos.x,dz=z-f.pos.z,d=Math.hypot(dx,dz)||1;I.wx=dx/d;I.wz=dz/d;return d;}
  think(dt){if(this.f.hold){Object.assign(this.f.intent,blankIntent());return;}this.think0(dt);const f=this.f,I=f.intent;if(f.dead)return;
    // walking into a building wall: slide along it (toward a door or corner) instead of pushing forever
    const n=f.wallN;if(n&&f.onGround&&f.state!=='climb'&&game.time-(f.wallT||0)<.25){const into=-(I.wx*n.x+I.wz*n.z);
      if(into>.3){const T=f.tgt,up=T&&T.pos.y-f.pos.y>2.5;if(!up){if(!this.slideT||game.time>this.slideT){this.slideT=game.time+1.6;const tx=-n.z,tz=n.x;
          this.slideS=T?Math.sign((T.pos.x-f.pos.x)*tx+(T.pos.z-f.pos.z)*tz)||1:(Math.random()<.5?-1:1);}
        I.wx=-n.z*this.slideS+n.x*.2;I.wz=n.x*this.slideS+n.z*.2;}}}}
  think0(dt){
    const f=this.f,I=f.intent;if(f.dead)return;
    I.light=I.heavy=I.special=I.ult=I.jump=I.dash=I.x1=I.x2=I.spB=false;I.revive=false;
    if((f.brk||0)>=100&&BRK_STATES.indexOf(f.state)>=0&&f.stateT>this.react&&Math.random()<this.aggr*.06){I.dash=true;I.wx=I.wz=0;return;}
    const M=mates(f).filter(m=>!m.dead);
    if(f.downed){const m=M.find(x=>!x.downed);if(m&&m.pos.distanceTo(f.pos)>1.5)this.goTo(m.pos.x,m.pos.z);else{I.wx=I.wz=0;}return;}
    const dm=M.find(m=>m.downed);
    if(dm){const ne=nearestEnemy(f,9);if(!ne||ne.downed){const d=this.goTo(dm.pos.x,dm.pos.z);I.sprint=d>4;if(d<2){I.wx=I.wz=0;I.revive=true;}return;}}
    // stuck → sidestep
    const want=Math.hypot(I.wx,I.wz)>.3,hs=Math.hypot(f.vel.x,f.vel.z);
    if(want&&hs<1.5&&(f.state==='run'||f.state==='idle'))this.stuckT+=dt;else this.stuckT=0;
    if(this.stuckT>.45){this.avoidT=rand(.7,1.3);this.stuckT=0;const s=Math.random()<.5?1:-1;this.avoid.set(-I.wz*s,0,I.wx*s);if(Math.random()<.4)I.jump=true;}
    if(this.avoidT>0){this.avoidT-=dt;I.wx=this.avoid.x;I.wz=this.avoid.z;I.sprint=true;return;}
    this.retgt-=dt;if(this.retgt<=0){this.retgt=.6;let t=nearestEnemy(f,40);if(f.lastHitBy&&!f.lastHitBy.dead&&game.time-f.lastHitT<3&&f.lastHitBy.pos.distanceTo(f.pos)<20)t=f.lastHitBy;f.tgt=t;}
    if(this.blockT>0){this.blockT-=dt;I.block=this.blockT>0;if(I.block){I.wx=I.wz=0;return;}}
    this.t-=dt;if(this.t>0)return;this.t=this.react*rand(.6,1.4);
    I.block=false;I.sprint=false;
    const o=f.tgt&&!f.tgt.dead?f.tgt:null;const d=o?Math.hypot(o.pos.x-f.pos.x,o.pos.z-f.pos.z):99;
    const zd=Math.hypot(f.pos.x-ZONE.cx,f.pos.z-ZONE.cz),outside=zd>ZONE.r-5;
    if(!o||d>24||(outside&&d>5)){
      I.sprint=true;
      if(outside){this.goTo(ZONE.cx,ZONE.cz);return;}
      if(f.hp<60){const ob=nearestOrb(f.pos,'hp',35);if(ob){this.goTo(ob.x,ob.z);return;}}
      if(f.meter<70){const ob=nearestOrb(f.pos,'surge',20);if(ob){this.goTo(ob.x,ob.z);return;}}
      const mate=M.find(m=>!m.downed);if(mate&&mate.pos.distanceTo(f.pos)>16&&(!o||d>20)){this.goTo(mate.pos.x,mate.pos.z);return;}
      this.wpT-=this.react;
      if(!this.wp||this.wpT<=0||Math.hypot(this.wp.x-f.pos.x,this.wp.z-f.pos.z)<3){this.wp=randomOpenPoint(ZONE.cx,ZONE.cz,Math.max(8,ZONE.r*.6));this.wpT=8;}
      if(o&&d<40){this.goTo(o.pos.x,o.pos.z);}else this.goTo(this.wp.x,this.wp.z);
      return;
    }
    const dirO=new V3((o.pos.x-f.pos.x)/(d||1),0,(o.pos.z-f.pos.z)/(d||1));
    const incoming=projs.some(p=>p.owner!==f&&p.pos.distanceTo(f.pos)<9&&p.vel.dot(TMP.subVectors(f.pos,p.pos))>0);
    const threat=(o.state==='attack'&&d<3.2)||(o.state==='ult'&&o.stateT>.6&&d<14);
    if((threat||incoming)&&Math.random()<this.def){
      if(incoming&&Math.random()<.5){if(Math.random()<.5)I.jump=true;else{I.dash=true;this.setRel(dirO,0,this.str);}return;}
      this.blockT=rand(.3,.65);I.block=true;I.wx=I.wz=0;return;}
    // target up on a roof: run at the wall, jump and climb it
    if(o.pos.y-f.pos.y>2.5&&d<30){this.setRel(dirO,1,0);if(f.onGround&&f.wallN&&game.time-(f.wallT||0)<.3)I.jump=true;if(f.state==='climb')return;}
    if(f.meter>=100&&Math.random()<.55){this.vary('U');const A=ALTULT[KIT(f.hero,'alt')],alt=A&&f.aiVar.dir==='b';const R=f.hero.cab&&(alt?KIT(f.hero,'alt')==='cab':f.hero.ult==='cab')?Math.max(5,cabAI(alt?(f.hero.cab.ultAlt||f.hero.cab.ult):f.hero.cab.ult)[1]):alt?A.r:(ULT_RANGE[f.hero.ult]||12);if(d<R){I.ult=true;this.setRel(dirO,0,0);return;}}
    if(o.state==='down'||o.state==='getup'){this.setRel(dirO,d<3?-1:0,this.str);return;}
    const wk=KIT(f.hero,'wpn'),gc=f.hero.gear&&f.hero.gear.type!=='none'?gearCls(f.hero.gear):null,atkR=gc?({gpole:3.6,gshot:12,gheavy:2.7,gblade:2.6,whip:4.4,claw:2.3})[gc]||2.2:(wk==='marrow'&&f.bladeT<=0)?4.4:(wk==='umbra'?3.2:wk==='ronin'?2.6:2.2),sp=f.curSpecial();
    const SR=sp==='cab'&&f.hero.cab?cabAI(f.hero.cab.sp):(SPECIAL_AI[sp]||[6,22,.5]);
    if(f.specCD<=0&&!(sp==='harden'&&f.armorT>0)&&d>=SR[0]&&d<=SR[1]&&Math.random()<SR[2]){I.special=true;this.vary('S');if(SR[0]<3)this.setRel(dirO,0,0);return;}
    {const X=xMoves(f.hero);f.xcd=f.xcd||[0,0];for(let i=0;i<2;i++){if(f.xcd[i]>0||!X[i])continue;const R=cabAI(X[i]);if(d>=R[0]&&d<=R[1]&&Math.random()<.18){I['x'+(i+1)]=true;return;}}}
    const proj=false;
    if(d>8){if(f.specCD<=0&&proj&&Math.random()<.5)I.special=true;else{this.setRel(dirO,1,Math.random()<.35?this.str*.6:0);if(Math.random()<.2)I.dash=true;}}
    else if(d>atkR){this.setRel(dirO,1,Math.random()<.45?this.str*.8:0);if(Math.random()<.12)this.str*=-1;if(f.specCD<=0&&proj&&Math.random()<.18)I.special=true;if(Math.random()<.06)I.jump=true;if(Math.random()<.08)I.dash=true;}
    else{this.setRel(dirO,Math.random()<.15?-1:0,Math.random()<.25?this.str:0);const r=Math.random();if(r<this.aggr*.78){I.light=true;if(Math.random()<.35)this.vary('L');}else if(r<this.aggr){I.heavy=true;this.vary('H');}}
    if(o.state==='fly'&&d<atkR+1.8&&Math.random()<.5)I.light=true;
    if(f.state==='attack'&&Math.random()<this.aggr)I.light=true;
  }
}
