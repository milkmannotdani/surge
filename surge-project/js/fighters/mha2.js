/* Five more MHA-inspired fighters (original characters):
   CRIMSON  (blood mimic)   – Blood Draw: knife dash; a hit lets her use the victim's special for 12 s.  Ult BLOOD FRENZY.
   SAWBACK  (blade bundle)  – Blade Cleave: huge bundled-sword swing with long reach.                    Ult COLOSSAL BLADE.
   RESECT   (disassembly)   – Fault Spikes: a line of ground spikes toward a foe.                         Ult REASSEMBLY.
   CUSHION  (fat absorb)    – Absorb: soak hits for 2.2 s (70% less damage; press again to let go early), then punch it all back. Ult FULL RELEASE.
   CORROSA  (acid)          – Acid Slide: skate forward leaving acid puddles that burn and slow.          Ult ACID VEIL.
   Uses the shared helpers from mha.js (hitO, foes, once, atT, tgtOf, xBasis, xDirTo, xSnd...). */
Object.assign(HERO_SND,{crimson:'blade',sawback:'blade',resect:'rock',cushion:'power',corrosa:'decay'});
Object.assign(SPNAME,{bloodsip:'BLOOD DRAW',cleave:'BLADE CLEAVE',spikeline:'FAULT SPIKES',absorb:'ABSORB',acidslide:'ACID SLIDE',disassemble:'DISASSEMBLE',condemn:'CONDEMN'});
Object.assign(HERO_SND,{verdict:'blade'});
Object.assign(ULT_RANGE,{bloodfrenzy:16,colossus:24,reassemble:12,release:12,acidveil:12,execution:18});
Object.assign(SPECIAL_AI,{bloodsip:[2,14,.55],cleave:[0,7,.6],spikeline:[3,18,.55],absorb:[0,6,.35],acidslide:[2,14,.5],disassemble:[0,6,.6],condemn:[2,12,.6]});
Object.assign(XSPK,{bloodsip:1,cleave:1,spikeline:1,absorb:1,acidslide:1,disassemble:1,condemn:1});
Object.assign(DULT_OF,{verdict:'vengeance',crimson:'vengeance',sawback:'vengeance',resect:'curse',cushion:'nova',corrosa:'barrage'});

/* ---------- damage over time (bleed / acid) ---------- */
function dotOn(o,kind,t,dps,by){o.dotK=kind;o.dotT=Math.max(o.dotT||0,t);o.dotD=dps;o.dotBy=by;}
onEv('tick',dt=>{for(const o of FS){if(!(o.dotT>0)||o.dead)continue;o.dotT-=dt;
  if(NET.role!=='client'&&game.phase==='fight'){o.hp-=o.dotD*dt*DMG_SCALE*(o.take||1);if(o.hp<=0&&!o.dead){o.hp=0;killFighter(o,o.dotBy||null,new V3(0,0,1));continue;}}
  if(Math.random()<dt*14&&nearCam(o.pos,60)){const c=o.chest(TMP2);burst(o.dotK==='acid'?ADD:SMK,TMP2.set(c.x+rand(-.3,.3),c.y+rand(-.6,.4),c.z+rand(-.3,.3)),1,
    o.dotK==='acid'?{colors:[0xb8ff3a,0x6aff2a],speed:.6,up:1.4,life:.5,size:.18,size1:0,bright:1.6}:{colors:[0xc4102a,0x8a0a1a],speed:.4,up:-2,life:.6,size:.12,size1:.06,grav:9});}}});

/* ---------- ground spikes (Resect) ---------- */
const SPKS=[];const spkGeo=new THREE.ConeGeometry(.45,1,6),spkMat=new THREE.MeshStandardMaterial({color:0x8a7a6a,roughness:.85,flatShading:true});
function spikeAt(f,x,z,h,dmg,hitSet){const y=floorAt(x,z,(f?f.pos.y:0)+1.5);let s=SPKS.find(q=>!q.m.visible);if(!s){if(SPKS.length>90)return;s={m:new THREE.Mesh(spkGeo,spkMat)};s.m.castShadow=true;scene.add(s.m);SPKS.push(s);}
  s.m.visible=true;s.x=x;s.z=z;s.y=y;s.h=h;s.t=0;s.m.rotation.set(rand(-.25,.25),rand(0,6.28),rand(-.25,.25));s.m.position.set(x,y-h,z);s.m.scale.set(1,h,1);
  dust(new V3(x,y,z),3,.6);if(f&&NET.role!=='client')for(const o of FS){if(ally(o,f)||o.dead||o.downed||(hitSet&&hitSet.has(o)))continue;
    if(Math.hypot(o.pos.x-x,o.pos.z-z)<1.1&&Math.abs(o.pos.y-y)<2){if(hitSet)hitSet.add(o);hitO(f,o,{dmg,kb:4,up:13,launch:true,stun:.6});}}}
onEv('frame',dt=>{for(const s of SPKS){if(!s.m.visible)continue;s.t+=dt;const k=s.t<.12?s.t/.12:s.t<1.4?1:Math.max(0,1-(s.t-1.4)/.4);s.m.position.y=s.y-s.h+s.h*k*.98+s.h*.5*k;if(s.t>1.8||!inMatch())s.m.visible=false;}});
/* ---------- acid puddles (Corrosa) ---------- */
const ACIDP=[];const acidMat=new THREE.MeshBasicMaterial({color:0x9aff2a,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});const acidGeo=new THREE.CircleGeometry(1,20);
function acidAt(f,x,z,r,life){let a=ACIDP.find(q=>!q.m.visible);if(!a){if(ACIDP.length>60)a=ACIDP[0];else{a={m:new THREE.Mesh(acidGeo,acidMat.clone())};a.m.rotation.x=-Math.PI/2;scene.add(a.m);ACIDP.push(a);}}
  const y=floorAt(x,z,(f?f.pos.y:0)+1);a.m.visible=true;a.m.position.set(x,y+.04,z);a.m.scale.setScalar(r);a.x=x;a.z=z;a.y=y;a.r=r;a.t=0;a.life=life||5;a.f=f;}
onEv('frame',dt=>{for(const a of ACIDP){if(!a.m.visible)continue;a.t+=dt;a.m.material.opacity=.5*Math.min(1,(a.life-a.t)/1)+.05*Math.sin(game.time*8);
  if(a.t>a.life||!inMatch()){a.m.visible=false;continue;}if(Math.random()<dt*3&&nearCam(a.m.position,50))burst(ADD,TMP2.set(a.x+rand(-a.r,a.r)*.7,a.y+.1,a.z+rand(-a.r,a.r)*.7),1,{colors:[0xd8ff6a,0x9aff2a],speed:.3,up:1.2,life:.5,size:.18,size1:0,bright:1.4});
  if(a.f)for(const o of FS){if(ally(o,a.f)||o.dead||o.dormant)continue;if(Math.hypot(o.pos.x-a.x,o.pos.z-a.z)<a.r&&o.pos.y-a.y<.6){o.slowT=Math.max(o.slowT||0,.4);dotOn(o,'acid',.6,6,a.f);}}}});
onEv('matchEnd',()=>{SPKS.forEach(s=>s.m.visible=false);ACIDP.forEach(a=>a.m.visible=false);FS.forEach(o=>o.dotT=0);});

/* ---------- specials ---------- */
const COPY_BAN={bloodsip:1,xm:1,cab:1,absorb:1};
Object.assign(COPY_BAN,{});
Object.assign(SPECIALS,{
  bloodsip(f){const t=f.stateT,V=f.vf;
    if(t<.12){f.poseKey='charge';if(!V.d){V.T=tgtOf(f,15);V.d=xDirTo(f,V.T);f.face=Math.atan2(V.d.x,V.d.z);}return 14;}
    if(t<.42&&!V.hit){f.poseKey='airh';f.vel.x=V.d.x*30;f.vel.z=V.d.z*30;if(Math.random()<.6)burst(ADD,f.chest(TMP2),2,{colors:[0xff2a4a,0xffd23f],speed:1,life:.25,size:.25,size1:0,bright:2});
      for(const o of foes(f,1.8)){V.hit=1;f.vel.x*=.2;f.vel.z*=.2;if(hitO(f,o,{dmg:9,kb:5,up:2,stun:.6})===true){dotOn(o,'bleed',4,3,f);f.hp=Math.min(100,f.hp+3);
        const sp=o.curSpecial?o.curSpecial():o.hero.special;if(sp&&!COPY_BAN[sp]){f.stolen=sp;f.stolenT=12;f.copyOf=o;if(f===ME){announceSmall('BLOOD DRAWN: YOUR NEXT SPECIALS ARE '+(SPNAME[sp]||sp).toUpperCase());}
          const m=f.rig.mats;if(m&&m[1]){f._cpE=f._cpE==null?(m[1].emissiveIntensity||0):f._cpE;m[1].emissive&&m[1].emissive.set(o.hero.color);m[1].emissiveIntensity=f._cpE+.8;}}
        burst(ADD,o.chest(new V3()),18,{colors:[0xff1a3a,0xffffff],speed:5,life:.35,size:.25,size1:0,bright:2.2});xSnd(f.pos,()=>SND.blade.hit(1));}break;}
      return 6;}
    f.poseKey='spech';if(t>.62)f.set(f.onGround?'idle':'air');return 10;},
  cleave(f){const t=f.stateT,V=f.vf;f.poseKey=t<.22?'charge':'spech';const S=f._saw||(f._saw=f.rig.root.getObjectByName('sawBundle'));if(S)S.scale.setScalar(t<.22?1+t*6:t<.6?2.3:Math.max(1,2.3-(t-.6)*6));
    once(f,.24,()=>{const [fw,sd]=xBasis(f),c=f.pos;shake(.25,c);xSnd(c,()=>{SND.blade.spec();AU.crash();});
      for(let k=1;k<=7;k++){const p=new V3(c.x+fw.x*k,c.y+.2,c.z+fw.z*k);setTimeout(()=>{if(!inMatch())return;burst(ADD,p,6,{colors:[0xd8e0e8,0x7acc5a,0xffffff],speed:4,up:2,life:.3,size:.18,size1:0,bright:2});dust(p,2,.5);},k*20);}
      foes(f,7.5,f.pos,.55).forEach(o=>hitO(f,o,{dmg:14,kb:12,up:5,launch:true,heavy:true,stun:.7}));});
    if(t>.75){if(S)S.scale.setScalar(1);f.set(f.onGround?'idle':'air');}return 12;},
  spikeline(f){const t=f.stateT,V=f.vf;f.poseKey=t<.18?'specw':'slamL'in POSES?'slamL':'spech';
    once(f,.18,()=>{V.T=tgtOf(f,20);V.d=xDirTo(f,V.T);V.hs=new Set();V.o=f.pos.clone();xSnd(f.pos,()=>SND.rock.spec());});
    if(V.d)for(let k=0;k<12;k++)atT(f,'s'+k,.2+k*.035,()=>{const D=1.6+k*1.4;spikeAt(f,V.o.x+V.d.x*D+rand(-.3,.3),V.o.z+V.d.z*D+rand(-.3,.3),1.3+k*.08,10,V.hs);if(k%3===0)shake(.12,V.o);});
    if(t>.7)f.set(f.onGround?'idle':'air');return 12;},
  absorb(f,dt){const t=f.stateT,V=f.vf,R=f.rig.root;
    if(!V.on){V.on=1;f.absT=2.2;f.absStore=0;xSnd(f.pos,()=>SND.power.charge&&SND.power.charge());}
    if(t<2.2){f.armorT=Math.max(f.armorT||0,.1);f.poseKey='charge';const s=1+Math.min(.35,t*.6)+Math.sin(t*14)*.02;R.scale.set(s*f.hero.scale,s*.92*f.hero.scale,s*f.hero.scale);f.vel.x*=.85;f.vel.z*=.85;
      if(f.absStore>0&&Math.random()<.4)burst(ADD,f.chest(TMP2),1,{colors:[0xffd23f,0xff8a1a],speed:1.5,life:.3,size:.3,size1:0,bright:1.8});
      if(f===ME&&t>.35&&(pressed.has('Digit1')||pressed.has('KeyU')))V.early=1;if(!V.early)return 4;}
    if(!V.rel){V.rel=1;f.absT=0;const st=f.absStore||0,k=1+Math.min(2,st/14);R.scale.setScalar(f.hero.scale);f.poseKey='spech';
      const fw=f.fwd();ring(f.chest(new V3()).addScaledVector(fw,1.4),0xffd23f,2+k,.4,false,2.4);shake(.2+.1*k,f.pos);xSnd(f.pos,()=>{SND.power.hit(1.5);AU.boom(false);});
      foes(f,4+k*1.2,f.pos,.5).forEach(o=>hitO(f,o,{dmg:8+st*.9,kb:10+k*5,up:5+k*2,launch:true,heavy:true,stun:.6}));if(f===ME&&st>0)announceSmall('RELEASED '+Math.round(st)+' DAMAGE!');}
    if(t>2.55||(V.early&&t>.85)){f.absT=0;R.scale.setScalar(f.hero.scale);f.set(f.onGround?'idle':'air');}return 10;},
  acidslide(f){const t=f.stateT,V=f.vf;
    if(!V.d){V.d=xDirTo(f,tgtOf(f,14));f.face=Math.atan2(V.d.x,V.d.z);V.n=0;xSnd(f.pos,()=>SND.decay.spec());}
    if(t<.55){f.poseKey='airh';const sp=26*(1-t*.8);f.vel.x=V.d.x*sp;f.vel.z=V.d.z*sp;if(t>V.n*.09){V.n++;acidAt(f,f.pos.x,f.pos.z,1.2,4.5);}
      for(const o of foes(f,1.6))if(!V['h'+o.id]){V['h'+o.id]=1;hitO(f,o,{dmg:6,kb:7,up:6,launch:true,stun:.4});dotOn(o,'acid',2.5,5,f);}return 6;}
    f.poseKey='spech';if(t>.75)f.set(f.onGround?'idle':'air');return 10;}});
// Cushion takes far less damage while absorbing, and stores it
// (absorbing also gives super armor, which already cuts damage to 45% and stops flinching; this brings it down to 30%)
onEv('hit',(a,d,dmg)=>{if(d.absT>0&&!d.dead){d.hp+=dmg/3;d.absStore=(d.absStore||0)+dmg/.45;}});
onEv('tick',()=>{for(const f of FS){if(f.stolenT<=0&&f._cpE!=null){const m=f.rig&&f.rig.mats;if(m&&m[1]){m[1].emissive&&m[1].emissive.set(f.hero.color);m[1].emissiveIntensity=f._cpE;}f._cpE=null;}}});

/* ---------- ultimates ---------- */
Object.assign(ULTX,{
  bloodfrenzy:{r:16,s(f){f.vf.L=foes(f,16).slice(0,6);f.vf.i=0;f.vf.next=.9;f.uEnd=.9+Math.max(1,f.vf.L.length)*.32+.4;f.poseKey='charge';f.invuln=Math.max(f.invuln,f.uEnd);},
    u(f,t){const V=f.vf;if(t>=V.next&&V.i<V.L.length){const o=V.L[V.i++];V.next=t+.32;if(o&&!o.dead){const d=xDirTo(f,o);f.pos.set(o.pos.x-d.x*1.2,o.pos.y,o.pos.z-d.z*1.2);faceTo(f,o);f.poseKey=V.i%2?'spech':'airh';
        cutLine(f.chest(new V3()).add(new V3(-d.z,0,d.x).multiplyScalar(1.4)),o.chest(new V3()).add(new V3(d.z,0,-d.x).multiplyScalar(1.4)),0xff1a3a,.12,.4);
        hitO(f,o,{dmg:9,kb:4,up:3,stun:.7});dotOn(o,'bleed',5,4,f);f.hp=Math.min(100,f.hp+4);burst(ADD,o.chest(new V3()),20,{colors:[0xff1a3a,0xffd23f,0xffffff],speed:6,life:.35,size:.28,size1:0,bright:2.4});xSnd(o.pos,()=>SND.blade.hit(1.4));}}
      return 10;}},
  colossus:{r:24,s(f,c,E,T){f.vf.d=xDirTo(f,T);f.face=Math.atan2(f.vf.d.x,f.vf.d.z);f.uEnd=2.3;f.poseKey='command';const B=new THREE.Group();
      const bm=new THREE.MeshStandardMaterial({color:0xd8e0e8,metalness:.9,roughness:.25,emissive:0x2a4a2a,emissiveIntensity:.3});for(let k=0;k<9;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.6,24,.12),bm);b.position.set((k-4)*.38,12,rand(-.2,.2));b.rotation.z=rand(-.05,.05);B.add(b);}
      const hilt=new THREE.Mesh(new THREE.BoxGeometry(4,.8,.8),new THREE.MeshStandardMaterial({color:0x3a2a1a}));B.add(hilt);B.position.copy(f.pos);B.rotation.y=f.face;B.scale.setScalar(.05);scene.add(B);f.vf.B=B;},
    u(f,t){const V=f.vf,B=V.B;if(!B)return 10;B.position.set(f.pos.x,f.pos.y+1.5,f.pos.z);
      if(t<1){B.scale.setScalar(Math.min(1,t*1.3));B.rotation.x=0;if(Math.random()<.3)burst(ADD,f.chest(TMP2),2,{colors:[0xd8e0e8,0x7acc5a],speed:2,up:6,life:.4,size:.25,size1:0,bright:2});}
      else{const k=Math.min(1,(t-1)/.35);B.rotation.x=k*k*Math.PI/2;}
      atT(f,'slam',1.35,()=>{const d=V.d,o=f.pos;shake(.9,o);xSnd(o,()=>{AU.boom(true);AU.crash();});for(let s=2;s<=24;s+=2){const p=new V3(o.x+d.x*s,o.y,o.z+d.z*s);dust(p,4,1.2);if(typeof crater==='function'&&s%6===0)crater(p.x,p.z,1.6);}
        FS.forEach(q=>{if(ally(q,f)||q.dead)return;const rx=q.pos.x-o.x,rz=q.pos.z-o.z,al=rx*d.x+rz*d.z,lt=Math.abs(rx*d.z-rz*d.x);if(al>0&&al<25&&lt<2.4)hitO(f,q,{dmg:30,kb:6,up:14,launch:true,heavy:true,stun:1});});});
      if(t>2.1&&B.parent){scene.remove(B);}return 10;}},
  reassemble:{r:12,s(f){f.vf.o=f.pos.clone();f.vf.hs=new Set();f.uEnd=2.2;f.poseKey='specw';},
    u(f,t){const V=f.vf,o=V.o;f.poseKey=t<.9?'specw':'command';
      for(let r=0;r<5;r++)atT(f,'r'+r,.9+r*.16,()=>{const R=2.2+r*2.2,n=8+r*5;for(let k=0;k<n;k++){const a=k/n*6.283+r*.3;spikeAt(f,o.x+Math.cos(a)*R,o.z+Math.sin(a)*R,1.6+r*.25,14,V.hs);}shake(.35,o);xSnd(o,()=>SND.rock.hit(1.4));});
      atT(f,'heal',1.8,()=>{f.hp=Math.min(100,f.hp+20);burst(ADD,f.chest(new V3()),30,{colors:[0xff4a5a,0xffffff],speed:3,up:3,life:.6,size:.25,size1:0,bright:2});if(f===ME)announceSmall('REASSEMBLED +20 HP');});
      return 10;}},
  release:{r:12,s(f){f.vf.st=0;f.uEnd=2.6;f.poseKey='charge';f.absT=2.1;f.absStore=0;f.invuln=Math.max(f.invuln,.2);},
    u(f,t){const V=f.vf,R=f.rig.root;if(t<2.1){f.armorT=Math.max(f.armorT||0,.1);const s=1+Math.min(.9,t*.8);R.scale.set(s*f.hero.scale,s*.9*f.hero.scale,s*f.hero.scale);f.vel.x*=.8;f.vel.z*=.8;
        // pull nearby foes into the belly
        if(NET.role!=='client')foes(f,9).forEach(o=>{const d=new V3(f.pos.x-o.pos.x,0,f.pos.z-o.pos.z);if(d.length()>1.8){d.normalize();o.vel.x+=d.x*.9;o.vel.z+=d.z*.9;}});return 4;}
      atT(f,'boom',2.1,()=>{R.scale.setScalar(f.hero.scale);f.absT=0;const st=(f.absStore||0)+20,c=f.chest(new V3());ring(c,0xffd23f,12,.6,false,2.8);ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0xff8a1a,13,.7,true,2.8);
        burst(ADD,c,80,{colors:[0xffd23f,0xff8a1a,0xffffff],speed:14,up:4,life:.7,size:.45,size1:0,bright:2.6});shake(.8,c);xSnd(c,()=>{AU.boom(true);SND.power.hit(2);});
        foes(f,12).forEach(o=>hitO(f,o,{dmg:Math.min(40,14+st*.6),kb:20,up:12,launch:true,heavy:true,stun:1}));if(f===ME)announceSmall('FULL RELEASE: '+Math.round(st)+' DAMAGE');});
      f.poseKey='spech';return 10;}},
  acidveil:{r:12,s(f){f.vf.o=f.pos.clone();f.uEnd=2.6;f.poseKey='command';},
    u(f,t){const V=f.vf,o=V.o;f.poseKey=t<.9?'charge':'command';
      atT(f,'wall',.9,()=>{for(let k=0;k<20;k++){const a=k/20*6.283;acidAt(f,o.x+Math.cos(a)*5,o.z+Math.sin(a)*5,1.6,7);}ring(new V3(o.x,o.y+.2,o.z),0x9aff2a,7,.6,true,2.4);
        burst(ADD,new V3(o.x,o.y+1,o.z),70,{colors:[0xb8ff3a,0x6aff2a,0xffffff],speed:10,up:8,life:.8,size:.35,size1:0,grav:12,bright:2});foes(f,7).forEach(q=>{hitO(f,q,{dmg:12,kb:12,up:9,launch:true,heavy:true});dotOn(q,'acid',4,6,f);});xSnd(o,()=>SND.decay.hit(1.5));});
      for(let k=0;k<10;k++)atT(f,'d'+k,1.1+k*.13,()=>{const a=rand(0,6.283),r=rand(2,11),x=o.x+Math.cos(a)*r,z=o.z+Math.sin(a)*r;acidAt(f,x,z,1.3,6);
        burst(ADD,new V3(x,o.y+.3,z),12,{colors:[0xb8ff3a,0x6aff2a],speed:3,up:4,life:.4,size:.25,size1:0,bright:1.8});for(const q of FS)if(!ally(q,f)&&!q.dead&&Math.hypot(q.pos.x-x,q.pos.z-z)<1.6)hitO(f,q,{dmg:6,kb:3,up:3,stun:.3});});
      return 10;}}});
Object.assign(ALTULT,{
  crimson:{name:'MASQUERADE',r:14,s(f){f.uEnd=1.8;f.poseKey='command';const T=foes(f,20)[0];f.vf.T=T;},u(f,t){atT(f,'m',.9,()=>{const T=f.vf.T;if(T){f.stolen=T.hero.special&&!COPY_BAN[T.hero.special]?T.hero.special:f.stolen;f.stolenT=20;f.meter=Math.min(100,f.meter+30);
      burst(ADD,f.chest(new V3()),40,{colors:[T.hero.color,T.hero.accent,0xffffff],speed:6,life:.6,size:.3,size1:0,bright:2.4});if(f===ME)announceSmall('MASQUERADE: '+T.name.toUpperCase()+'\'S POWER FOR 20 s');}});return 10;}},
  sawback:{name:'BLADE STORM',r:9,s(f){f.uEnd=2;f.vf.hs={};},u(f,t){f.face+=.35;f.poseKey='spech';if(t>.8&&t<1.9&&Math.random()<.5){const c=f.chest(new V3());ring(c,0xd8e0e8,4,.2,false,2);foes(f,5).forEach(o=>{const k='h'+o.id+Math.floor(t*4);if(!f.vf.hs[k]){f.vf.hs[k]=1;hitO(f,o,{dmg:4,kb:5,up:2,stun:.3});}});}return 10;}},
  resect:{name:'OVERHAUL',r:6,s(f){f.uEnd=1.6;},u(f,t){f.poseKey='spech';atT(f,'o',.9,()=>{foes(f,5,f.pos,.3).forEach(o=>{hitO(f,o,{dmg:22,kb:12,up:10,launch:true,heavy:true});for(let k=0;k<5;k++)spikeAt(f,o.pos.x+rand(-1.5,1.5),o.pos.z+rand(-1.5,1.5),1.8,6,new Set([o]));});});return 10;}},
  cushion:{name:'BOUNCE BACK',r:8,s(f){f.uEnd=1.4;f.vel.y=16;f.onGround=false;f.pos.y+=.1;},u(f,t){f.poseKey='airh';atT(f,'land',1.05,()=>{const c=f.pos.clone();ring(new V3(c.x,c.y+.2,c.z),0xffd23f,8,.5,true,2.4);dust(c,20,1.6);shake(.5,c);foes(f,8).forEach(o=>hitO(f,o,{dmg:18,kb:14,up:12,launch:true,heavy:true}));});return 10;}},
  corrosa:{name:'ACID SHOWER',r:14,s(f){f.uEnd=2;f.vf.o=f.pos.clone();},u(f,t){f.poseKey='command';for(let k=0;k<14;k++)atT(f,'a'+k,.8+k*.08,()=>{const T=foes(f,16)[k%Math.max(1,foes(f,16).length)];const p=T?T.pos:f.vf.o;acidAt(f,p.x+rand(-1.5,1.5),p.z+rand(-1.5,1.5),1.2,5);});return 10;}}});
Object.assign(PFX,{
  crimson(a,d,t){dotOn(d,'bleed',1.5+t,2.5,a);},sawback(a,d,t,p){burst(ADD,p,8*t,{colors:[0xd8e0e8,0xffffff],speed:6,life:.25,size:.15,size1:0,bright:2});if(t>=2)d.slowT=Math.max(d.slowT||0,1);},
  verdict(a,d,t){dotOn(d,'bleed',1+t,2.5,a);},
  resect(a,d,t){if(t>=2||a.ovT>0)spikeAt(a,d.pos.x,d.pos.z,1.4,4,new Set());},cushion(a,d,t){d.vel.x*=1+t*.2;d.vel.z*=1+t*.2;},corrosa(a,d,t){dotOn(d,'acid',1.5+t,4,a);}});
Object.assign(PFX_DESC,{crimson:'cuts cause bleeding',sawback:'blade shards, charged = slow',resect:'charged hits raise a spike; in Overhaul Form every hit does',verdict:'cuts cause bleeding',cushion:'bouncy knockback',corrosa:'hits leave acid burns'});
Object.assign(XMOVES,{
  crimson:[['KNIFE TOSS','volley','blood','blade',['drain'],{count:3}],['BLOOD MIST','zone','blood','orb',['slow','drain']]],
  sawback:[['BLADE SPIN','burst','blade','blade',['push']],['SPINNING CHARGE','dash','blade','blade',['launch']]],
  resect:[['RESTORE','buff','earth','shard',[],{self:['heal','shield']}],['STONE SURGE','wave','earth','spike',['launch']]],
  verdict:[['SHADOW STEP','blink','shadow','blade',['mark']],['CROSS CUT','cone','blade','blade',['slow','pierce']]],
  cushion:[['BELLY BUMP','dash','earth','orb',['push']],['FAT SHIELD','shield','light','orb',[]]],
  corrosa:[['ACID SPLASH','cone','poison','orb',['poison','slow']],['ACID GEYSER','pillar','poison','orb',['poison','launch'],{count:3}]]});

/* ---------- looks ---------- */
const _mhaParts0=mhaParts;
mhaParts=function(h,X){const out=_mhaParts0(h,X);const {M,head,rF,lF,spine,hips,main}=X;const env=m=>{m.envMap=main.envMap;m.envMapIntensity=main.envMapIntensity;return m;};
  if(HAS(h,'crimson')){const hair=env(new THREE.MeshStandardMaterial({color:0xe8b8c8,roughness:.5}));const cap=M(new THREE.SphereGeometry(.178,24,14,0,Math.PI*2,0,Math.PI*.5),hair);cap.position.y=.11;cap.scale.set(1.04,1.05,1.1);head.add(cap);
    const tail=M(new THREE.CylinderGeometry(.05,.015,.42,10),hair);tail.position.set(0,.18,-.2);tail.rotation.x=.9;head.add(tail);
    for(let k=0;k<4;k++){const v=M(new THREE.CylinderGeometry(.022,.022,.08,10),new THREE.MeshStandardMaterial({color:0xff1a3a,emissive:0x8a0010,emissiveIntensity:.8,transparent:true,opacity:.85}));v.position.set(-.12+k*.08,.36-k*.05,.21);v.rotation.z=.5;X.spine.add(v);}
    const knife=M(new THREE.BoxGeometry(.03,.32,.06),env(new THREE.MeshStandardMaterial({color:0xe8eef4,metalness:1,roughness:.15})));knife.position.set(0,-.2,.06);rF.add(knife);
    const mask=M(new THREE.BoxGeometry(.26,.07,.05),new THREE.MeshStandardMaterial({color:0x14060a,emissive:0x5a0010,emissiveIntensity:.5}));mask.position.set(0,.15,.145);head.add(mask);}
  if(HAS(h,'sawback')){const bm=env(new THREE.MeshStandardMaterial({color:0xd8e0e8,metalness:.95,roughness:.2})),g=new THREE.Group();for(let k=0;k<6;k++){const b=M(new THREE.BoxGeometry(.05,.9,.02),bm);b.position.set((k-2.5)*.04,-.5,rand(-.03,.03));b.rotation.z=rand(-.08,.08);g.add(b);}
    const wrap=M(new THREE.BoxGeometry(.18,.16,.08),new THREE.MeshStandardMaterial({color:0x3a2a1a}));wrap.position.y=-.06;g.add(wrap);g.position.set(0,-.12,.05);g.name='sawBundle';rF.add(g);
    const scarf=M(new THREE.TorusGeometry(.12,.04,8,16),new THREE.MeshStandardMaterial({color:0xc4302a}));scarf.rotation.x=Math.PI/2;scarf.position.y=-.14;head.add(scarf);
    for(let k=0;k<5;k++){const sp=M(new THREE.ConeGeometry(.03,.12,5),env(new THREE.MeshStandardMaterial({color:0x3a6a2a})));sp.position.set(0,.18-k*.06,-.16+k*.01);sp.rotation.x=-1.2;head.add(sp);}}
  if(HAS(h,'resect')){const wh=env(new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:.4,metalness:.2})),gm=env(new THREE.MeshStandardMaterial({color:0x2a2e36,metalness:.8,roughness:.3}));
    const resp=M(new THREE.SphereGeometry(.12,20,12,Math.PI*.15,Math.PI*.7,Math.PI*.45,Math.PI*.35),wh);resp.position.set(0,.08,.04);resp.scale.set(1.1,1,1.2);head.add(resp);
    [-1,1].forEach(s=>{const c=M(new THREE.CylinderGeometry(.04,.04,.07,14),gm);c.rotation.z=Math.PI/2;c.position.set(s*.12,.02,.11);head.add(c);const g=M(new THREE.CylinderGeometry(.03,.03,.072,14),new THREE.MeshStandardMaterial({color:0xd84a5a,emissive:0xd84a5a,emissiveIntensity:1}));g.rotation.z=Math.PI/2;g.position.set(s*.12,.02,.11);head.add(g);});
    const hair=M(new THREE.SphereGeometry(.176,16,10,0,Math.PI*2,0,Math.PI*.42),new THREE.MeshStandardMaterial({color:0xd8d4cc}));hair.position.y=.11;head.add(hair);
    const col=M(new THREE.CylinderGeometry(.2,.14,.22,24,1,true,Math.PI*.25,Math.PI*1.5),wh);col.position.set(0,.6,-.02);col.rotation.y=Math.PI;spine.add(col);}
  if(HAS(h,'cushion')){const belly=M(new THREE.SphereGeometry(.42,24,18),env(new THREE.MeshStandardMaterial({color:0xffd23f,roughness:.5})));belly.position.set(0,-.05,.08);belly.scale.set(1,.95,.9);spine.add(belly);
    const hb=M(new THREE.SphereGeometry(.17,16,10,0,Math.PI*2,0,Math.PI*.5),new THREE.MeshStandardMaterial({color:0x2a1a10}));hb.position.y=.07;head.add(hb);}
  if(HAS(h,'corrosa')){const vis=M(new THREE.SphereGeometry(.175,24,10,Math.PI*.12,Math.PI*.76,Math.PI*.4,Math.PI*.16),new THREE.MeshStandardMaterial({color:0x3a6a10,emissive:0x9aff2a,emissiveIntensity:1.4,roughness:.1}));vis.position.y=.12;vis.scale.set(1,1.1,1.07);head.add(vis);
    const hair=M(new THREE.SphereGeometry(.178,20,14,0,Math.PI*2,0,Math.PI*.5),env(new THREE.MeshStandardMaterial({color:0xff9ae0,roughness:.5})));hair.position.y=.1;hair.scale.set(1.12,1.12,1.12);head.add(hair);
    for(let k=0;k<5;k++){const b=M(new THREE.SphereGeometry(.035+k*.006,12,10),new THREE.MeshStandardMaterial({color:0xb8ff3a,emissive:0x6aff2a,emissiveIntensity:1.2,transparent:true,opacity:.8}));b.position.set(.13+(k%2)*.03,.2+k*.04,-.04-k*.02);head.add(b);}}
  return out;};
/* ---------- move 2 (alternate specials) ---------- */
Object.assign(SPECVAR,{
  bloodsip:{alt:['BACKSTAB',f=>{once(f,.1,()=>{const T=tgtOf(f,12);if(T){const d=xDirTo(f,T);f.pos.set(T.pos.x+d.x*1.1,T.pos.y,T.pos.z+d.z*1.1);f.face=Math.atan2(-d.x,-d.z);
      burst(ADD,f.chest(new V3()),20,{colors:[0xff1a3a,0xffd23f],speed:4,life:.3,size:.25,size1:0,bright:2.2});if(hitO(f,T,{dmg:11,kb:6,up:3,stun:.7})===true)dotOn(T,'bleed',4,3,f);xSnd(f.pos,()=>SND.blade.hit(1.2));}});
    vpose(f,.1,'charge','spech');endAt(f,.45);return 10;}]},
  cleave:{alt:['BLADE THROW',f=>{once(f,.18,()=>{const fw=f.fwd(),c=f.chest(new V3());[-.12,0,.12].forEach(a=>{const d=fw.clone().applyAxisAngle(UP,a);cutLine(c,c.clone().addScaledVector(d,15),0xd8e0e8,.06,.3);});
      FS.forEach(o=>{if(ally(o,f)||o.dead)return;const rx=o.pos.x-f.pos.x,rz=o.pos.z-f.pos.z,al=rx*fw.x+rz*fw.z,lt=Math.abs(rx*fw.z-rz*fw.x);if(al>0&&al<15&&lt<1.8)hitO(f,o,{dmg:9,kb:7,up:2,stun:.5});});xSnd(f.pos,()=>SND.blade.spec());});
    vpose(f,.18,'charge','throwS');endAt(f,.5);return 10;}]},
  spikeline:{alt:['SPIKE WALL',f=>{once(f,.2,()=>{const [fw,sd]=xBasis(f),hs=new Set();for(let k=-3;k<=3;k++)spikeAt(f,f.pos.x+fw.x*3+sd.x*k*1.1,f.pos.z+fw.z*3+sd.z*k*1.1,2.2,9,hs);xSnd(f.pos,()=>SND.rock.spec());});
    vpose(f,.2,'specw','spech');endAt(f,.55);return 10;}]},
  absorb:{alt:['BELLY BOUNCE',f=>{once(f,.05,()=>{const fw=f.fwd();f.vel.set(fw.x*6,11,fw.z*6);f.onGround=false;f.pos.y+=.1;});
    if(f.stateT>.45)once2(f,()=>{f.pos.y=floorAt(f.pos.x,f.pos.z,f.pos.y+.1);f.vel.set(0,0,0);f.onGround=true;const c=f.pos.clone();ring(new V3(c.x,c.y+.2,c.z),0xffd23f,5,.4,true,2.2);dust(c,12,1.2);shake(.3,c);foes(f,6).forEach(o=>hitO(f,o,{dmg:10,kb:11,up:9,launch:true}));});
    f.poseKey='airh';endAt(f,.9);return 10;}]},
  acidslide:{alt:['ACID POOL',f=>{once(f,.12,()=>{acidAt(f,f.pos.x,f.pos.z,2.8,6);const fw=f.fwd();f.vel.set(-fw.x*12,8,-fw.z*12);f.onGround=false;f.pos.y+=.1;xSnd(f.pos,()=>SND.decay.spec());});
    vpose(f,.12,'specw','airh');endAt(f,.6);return 10;}]}});
function once2(f,fn){if(!f.vf.o2){f.vf.o2=1;fn();}}

/* ================= RESECT: take apart, put back together ================= */
// Disassemble: the target is broken into floating pieces, then rebuilt — painfully — when the hold ends
const DISP=[];
function disO(f,o,t,dmg){if(o.dead||o.downed||o.state==='framed')return false;o.set('framed');o.framedT=t;o.vel.set(0,0,0);o.xHold='dis';o.xBy=f;o.xPop=dmg||12;
  o.rig.root.scale.setScalar(.02);const c=o.chest(new V3());
  burst(ADD,c,30,{colors:[o.hero.color,0xff4a5a,0xffffff],speed:6,life:.4,size:.22,size1:0,bright:2.2});debris(c,8,1,5,.18);
  if(!o.xDis){const g=new THREE.Group();const mm=new THREE.MeshStandardMaterial({color:o.hero.color,roughness:.6,flatShading:true});
    for(let k=0;k<14;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(rand(.12,.26),rand(.12,.3),rand(.1,.22)),mm);b.userData.a=rand(0,6.28);b.userData.r=rand(.3,.8);b.userData.y=rand(-.6,.6);b.userData.s=rand(1.5,4);g.add(b);}
    o.xDis=g;scene.add(g);}
  o.xDis.visible=true;xSnd(o.pos,()=>SND.rock.hit(1.1));return true;}
XHOLD_REL.dis=o=>{o.rig.root.scale.setScalar(o.hero.scale);if(o.xDis)o.xDis.visible=false;const c=o.chest(new V3());
  implode(c,26,1.4,[0xff4a5a,0xffffff],.3,2.2);ring(c,0xff4a5a,2.2,.3,false,2.4);const by=o.xBy;o.xBy=null;
  if(by&&!o.dead&&!o.downed){hitO(by,o,{dmg:o.xPop||12,kb:5,up:10,launch:true,heavy:true,noSpark:true});xSnd(o.pos,()=>SND.rock.spec());}};
onEv('frame',dt=>{for(const o of FS){if(!o.xDis||!o.xDis.visible)continue;if(o.xHold!=='dis'||o.dead){o.xDis.visible=false;continue;}
  if(o.rig.root.scale.x>.05)o.rig.root.scale.setScalar(.02);o.xDis.position.set(o.pos.x,o.pos.y+1,o.pos.z);
  o.xDis.children.forEach(b=>{const u=b.userData;u.a+=dt*u.s;b.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(game.time*3+u.a)*.1,Math.sin(u.a)*u.r);b.rotation.x+=dt*u.s;b.rotation.y+=dt;});}});
onEv('matchEnd',()=>FS.forEach(o=>{if(o.xDis)o.xDis.visible=false;}));

SPECIALS.disassemble=function(f){const t=f.stateT,V=f.vf;
  if(t<.14){f.poseKey='charge';if(!V.d){V.T=tgtOf(f,10);V.d=xDirTo(f,V.T);f.face=Math.atan2(V.d.x,V.d.z);}return 14;}
  if(t<.4&&!V.hit){f.poseKey='airh';f.vel.x=V.d.x*20;f.vel.z=V.d.z*20;if(Math.random()<.5)burst(ADD,f.rig.root.position.clone().add(new V3(0,1.1,0)).addScaledVector(V.d,.6),2,{colors:[0xff4a5a,0xffffff],speed:1,life:.2,size:.18,size1:0,bright:2});
    for(const o of foes(f,1.7)){V.hit=1;f.vel.x*=.1;f.vel.z*=.1;if(NET.role!=='client'){hitO(f,o,{dmg:5,kb:0,up:0,stun:.3});disO(f,o,1.3,14);}
      if(f===ME)announceSmall('DISASSEMBLED');break;}return 6;}
  if(!V.hit)once(f,.42,()=>{const fw=f.fwd(),hs=new Set();for(let k=0;k<3;k++)spikeAt(f,f.pos.x+fw.x*(1.5+k),f.pos.z+fw.z*(1.5+k),1.1,6,hs);});
  f.poseKey='spech';if(t>.65)f.set(f.onGround?'idle':'air');return 10;};
SPECVAR.disassemble={alt:['FAULT SPIKES',(f,dt)=>SPECIALS.spikeline(f,dt)]};

// REASSEMBLY: take apart every foe around him, spike the ground they stood on, rebuild his side
ULTX.reassemble={r:12,s(f){f.vf.o=f.pos.clone();f.vf.L=foes(f,12);f.vf.hs=new Set(f.vf.L);f.uEnd=2.4;f.poseKey='specw';f.invuln=Math.max(f.invuln,.8);},
  u(f,t){const V=f.vf,o=V.o;f.poseKey=t<.6?'specw':'command';
    atT(f,'dis',.6,()=>{ring(new V3(o.x,o.y+.2,o.z),0xff4a5a,12,.5,true,2.6);shake(.5,o);if(NET.role!=='client')V.L.forEach(q=>disO(f,q,1.6,16));xSnd(o,()=>SND.rock.spec());});
    for(let r=0;r<4;r++)atT(f,'r'+r,.85+r*.16,()=>{const R=2.5+r*2.4,n=8+r*5;for(let k=0;k<n;k++){const a=k/n*6.283+r*.3;spikeAt(f,o.x+Math.cos(a)*R,o.z+Math.sin(a)*R,1.6+r*.25,12,V.hs);}shake(.3,o);xSnd(o,()=>SND.rock.hit(1.3));});
    atT(f,'heal',1.9,()=>{FS.forEach(q=>{if(!q.dead&&(q===f||ally(q,f))&&q.pos.distanceTo(f.pos)<15){q.hp=Math.min(100,q.hp+25);burst(ADD,q.chest(new V3()),24,{colors:[0xff4a5a,0xffffff],speed:3,up:3,life:.6,size:.25,size1:0,bright:2});}});
      if(f===ME)announceSmall('REASSEMBLED: +25 HP TO YOU AND ALLIES');});
    return 10;}};
// OVERHAUL FORM: fuses with the street into a giant stone brute for 9 s
ALTULT.resect={name:'OVERHAUL FORM',r:6,s(f){f.uEnd=1.3;f.poseKey='charge';const o=f.pos.clone();dust(o,30,2);shake(.6,o);xSnd(o,()=>{AU.boom(true);SND.rock.spec();});
    for(let k=0;k<10;k++){const a=k/10*6.283;spikeAt(f,o.x+Math.cos(a)*2.5,o.z+Math.sin(a)*2.5,1.5,10,new Set());}},
  u(f,t){f.poseKey=t<.8?'charge':'command';atT(f,'on',.8,()=>{f.ovT=9;f.armorT=Math.max(f.armorT||0,9);f.powT=Math.max(f.powT||0,9);f.auraC=0xff4a5a;
    if(!f.rig.ovShell){const g=new THREE.Group(),st=new THREE.MeshStandardMaterial({color:0x8a7a6a,roughness:.9,flatShading:true});
      [-1,1].forEach(s=>{const sh=new THREE.Mesh(new THREE.DodecahedronGeometry(.28,0),st);sh.position.set(s*.38,1.45,0);g.add(sh);
        const fist=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),st);fist.position.set(s*.45,.85,.15);g.add(fist);});
      for(let k=0;k<5;k++){const sp=new THREE.Mesh(spkGeo,st);sp.scale.set(.35,.7,.35);sp.position.set((k-2)*.13,1.2+Math.abs(k-2)*-.06,-.28);sp.rotation.x=-.7;g.add(sp);}
      f.rig.root.add(g);f.rig.ovShell=g;}f.rig.ovShell.visible=true;if(f===ME)announceSmall('OVERHAUL FORM');});return 10;}};
onEv('tick',dt=>{for(const f of FS){if(!(f.ovT>0))continue;f.ovT-=dt;const R=f.rig.root;
  if(f.ovT<=0||f.dead){f.ovT=0;if(f.rig.ovShell)f.rig.ovShell.visible=false;if(!f.xHold)R.scale.setScalar(f.hero.scale);continue;}
  if(!f.xHold)R.scale.setScalar(f.hero.scale*1.4);}});
onEv('matchEnd',()=>FS.forEach(f=>{if(f.ovT>0){f.ovT=0;if(f.rig.ovShell)f.rig.ovShell.visible=false;f.rig.root.scale.setScalar(f.hero.scale);}}));

/* ================= VERDICT: blood judgment ================= */
// Paralyze: frozen where they stand (still visible), with a red pulse
function paraO(f,o,t){if(o.dead||o.downed||o.state==='framed')return false;o.set('framed');o.framedT=t;o.vel.set(0,0,0);o.xHold='para';o.xBy=f;
  const c=o.chest(new V3());ring(c,0xff1a3a,1.6,.3,false,2.4);burst(ADD,c,16,{colors:[0xff1a3a,0xffffff],speed:3,life:.35,size:.2,size1:0,bright:2.2});return true;}
XHOLD_REL.para=o=>{o.xBy=null;};
onEv('frame',dt=>{for(const o of FS)if(o.xHold==='para'&&!o.dead&&Math.random()<dt*10&&nearCam(o.pos,60)){
  burst(ADD,TMP2.set(o.pos.x+rand(-.4,.4),o.pos.y+rand(.2,1.8),o.pos.z+rand(-.4,.4)),1,{colors:[0xff1a3a,0x8a0a1a],speed:.2,up:.5,life:.4,size:.16,size1:0,bright:1.8});}});
const XSTRIKE=(f,o,dmg,para)=>{if(hitO(f,o,{dmg,kb:2,up:1,stun:.5,hold:true})===true){dotOn(o,'bleed',3,3,f);if(para&&NET.role!=='client')paraO(f,o,para);
  burst(ADD,o.chest(new V3()),18,{colors:[0xff1a3a,0xffffff],speed:5,life:.3,size:.22,size1:0,bright:2.3});xSnd(o.pos,()=>SND.blade.hit(1.2));return true;}return false;};
SPECIALS.condemn=function(f){const t=f.stateT,V=f.vf;
  if(t<.12){f.poseKey='charge';if(!V.d){V.T=tgtOf(f,12);V.d=xDirTo(f,V.T);f.face=Math.atan2(V.d.x,V.d.z);xSnd(f.pos,()=>SND.blade.spec());}return 14;}
  if(t<.4&&!V.hit){f.poseKey='airh';f.vel.x=V.d.x*28;f.vel.z=V.d.z*28;if(Math.random()<.6)burst(ADD,f.chest(TMP2),2,{colors:[0xff1a3a,0xd8d8e0],speed:1,life:.2,size:.2,size1:0,bright:2});
    for(const o of foes(f,1.8)){V.hit=1;f.vel.x*=.15;f.vel.z*=.15;const c=f.chest(new V3());cutLine(c.clone().add(new V3(-.8,.6,0)),o.chest(new V3()).add(new V3(.8,-.6,0)),0xff1a3a,.08,.35);
      if(XSTRIKE(f,o,10,1.5)&&f===ME)announceSmall('PARALYZED');break;}return 6;}
  f.poseKey='spech';if(t>.62)f.set(f.onGround?'idle':'air');return 10;};
SPECVAR.condemn={alt:['KNIFE VOLLEY',f=>{once(f,.16,()=>{const fw=f.fwd(),c=f.chest(new V3());const hit=new Set();
    [-.32,-.16,0,.16,.32].forEach(a=>{const d=fw.clone().applyAxisAngle(UP,a);cutLine(c,c.clone().addScaledVector(d,14),0xd8d8e0,.04,.3);
      FS.forEach(o=>{if(ally(o,f)||o.dead||hit.has(o))return;const rx=o.pos.x-f.pos.x,rz=o.pos.z-f.pos.z,al=rx*d.x+rz*d.z,lt=Math.abs(rx*d.z-rz*d.x);
        if(al>0&&al<14&&lt<1){hit.add(o);if(hitO(f,o,{dmg:6,kb:4,up:1,stun:.4})===true)dotOn(o,'bleed',2.5,2.5,f);}});});xSnd(f.pos,()=>SND.blade.spec());});
  vpose(f,.16,'charge','throwS');endAt(f,.5);return 10;}]};
// HERO HUNT: blink behind up to four foes, paralyzing each, then one cross slash through all of them
ULTX.execution={r:18,s(f){f.vf.L=foes(f,18).slice(0,4);f.vf.i=0;f.vf.next=.7;f.uEnd=.7+Math.max(1,f.vf.L.length)*.35+.9;f.poseKey='charge';f.invuln=Math.max(f.invuln,f.uEnd);},
  u(f,t){const V=f.vf;if(t>=V.next&&V.i<V.L.length){const o=V.L[V.i++];V.next=t+.35;if(o&&!o.dead){const d=xDirTo(f,o);
      burst(SMK,f.chest(new V3()),14,{colors:[0x1a1a22,0x3a0a12],speed:2,life:.4,size:.4,size1:.1});
      f.pos.set(o.pos.x+d.x*1.2,o.pos.y,o.pos.z+d.z*1.2);faceTo(f,o);f.poseKey=V.i%2?'spech':'airh';
      cutLine(o.chest(new V3()).add(new V3(-.9,.9,0)),o.chest(new V3()).add(new V3(.9,-.9,0)),0xff1a3a,.1,.5);
      if(NET.role!=='client'){hitO(f,o,{dmg:6,kb:0,up:0,stun:.4,hold:true});dotOn(o,'bleed',5,3,f);o.state==='framed'?(o.framedT=Math.max(o.framedT,o.stateT+2.5)):paraO(f,o,2.5);}}}
    const fin=.7+V.L.length*.35+.2;f.poseKey=t>fin?'spech':f.poseKey;
    atT(f,'fin',fin,()=>{const c=f.chest(new V3());ring(c,0xff1a3a,6,.4,false,2.6);shake(.6,c);xSnd(c,()=>{SND.blade.hit(2);AU.boom(false);});
      V.L.forEach(o=>{if(o.dead)return;o.framedT=0;const p=o.chest(new V3());cutLine(p.clone().add(new V3(-1.2,1.2,0)),p.clone().add(new V3(1.2,-1.2,0)),0xffffff,.14,.6);cutLine(p.clone().add(new V3(1.2,1.2,0)),p.clone().add(new V3(-1.2,-1.2,0)),0xff1a3a,.14,.6);
        setTimeout(()=>{if(inMatch()&&!o.dead)hitO(f,o,{dmg:22,kb:10,up:8,launch:true,heavy:true,stun:.8});},60);});if(f===ME)announceSmall('VERDICT: GUILTY');});
    return 10;}};
// BLOOD OATH: for 8 s every cut he lands paralyzes (once per foe every 2.5 s)
ALTULT.verdict={name:'BLOOD OATH',r:8,s(f){f.uEnd=1.1;f.poseKey='command';},u(f,t){atT(f,'o',.6,()=>{f.oathT=8;f.powT=Math.max(f.powT||0,8);f.hasteT=Math.max(f.hasteT||0,8);f.auraC=0xff1a3a;
    ring(f.chest(new V3()),0xff1a3a,4,.5,false,2.6);if(f===ME)announceSmall('BLOOD OATH: EVERY CUT PARALYZES');});return 10;}};
onEv('tick',dt=>{for(const f of FS)if(f.oathT>0)f.oathT-=dt;});
onEv('hit',(a,d)=>{if(!(a&&a.oathT>0)||d.dead||NET.role==='client')return;d._oathCD=d._oathCD||0;if(game.time<d._oathCD)return;d._oathCD=game.time+2.5;setTimeout(()=>{if(inMatch())paraO(a,d,.9);},0);});

/* Verdict's look: hooded cloak, slit-visor mask, blades sheathed along both forearms (original design) */
const _mhaParts1=mhaParts;
mhaParts=function(h,X){const out=_mhaParts1(h,X);if(h.id!=='verdict')return out;const {M,head,spine,hips,lF,rF}=X;
  const cloth=new THREE.MeshStandardMaterial({color:0x2a2830,roughness:.95,side:THREE.DoubleSide}),steel=new THREE.MeshStandardMaterial({color:0xd8dce4,metalness:.95,roughness:.2}),
    red=new THREE.MeshStandardMaterial({color:0xff1a3a,emissive:0xff1a3a,emissiveIntensity:1.6});
  const hood=M(new THREE.SphereGeometry(.205,24,16,Math.PI*.15,Math.PI*1.7,0,1.95),cloth);hood.rotation.y=Math.PI;hood.position.set(0,.13,-.01);hood.scale.set(1.08,1.12,1.12);head.add(hood);
  const vis=M(new THREE.BoxGeometry(.2,.024,.03),red);vis.position.set(0,.13,.163);head.add(vis);
  const cape=M(new THREE.CylinderGeometry(.3,.52,1.15,18,1,true,Math.PI/2+.35,Math.PI-.7),cloth);cape.position.set(0,.02,-.04);spine.add(cape);
  for(let k=0;k<6;k++){const s=M(new THREE.BoxGeometry(.09,rand(.15,.32),.01),cloth);const a=Math.PI/2+.5+k*.38;s.position.set(Math.sin(a)*.5,-.6,Math.cos(a)*.5-.04);s.rotation.y=a;spine.add(s);}
  [lF,rF].forEach((F,i)=>{if(!F)return;const sh=M(new THREE.BoxGeometry(.06,.3,.05),new THREE.MeshStandardMaterial({color:0x1a1a20,roughness:.6}));sh.position.set(0,-.12,-.05);F.add(sh);
    const bl=M(new THREE.BoxGeometry(.012,.42,.05),steel);bl.position.set(0,-.2,-.09);F.add(bl);});
  return out;};
