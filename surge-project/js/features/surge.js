/* SURGE EVENTS — every so often in a battle royale or arena match, the whole map gets a 20-second twist.
   LOW GRAVITY · POWER SWAP · OVERCHARGE · METEOR SHOWER · GOLD RUSH
   The host (or the offline game) picks the event; clients get it through netEvent({k:'surge'}).
   To add an event: add an entry to SURGE_EV with name/col/desc and any of start/tick/end. */
const SURGE={ev:null,t:0,next:0,dur:20,warn:0,pending:null,orbs:[],mT:0,meteors:[]};
const SURGE_EV={
  lowgrav:{name:'LOW GRAVITY',col:'#9ad8ff',desc:'Jumps go sky-high. Fights move to the rooftops!'},
  swap:{name:'POWER SWAP',col:'#ff9af0',desc:'Everyone borrows a random power for 20 s.',
    start(){if(NET.role==='client')return;for(const f of FS){if(f.dead)continue;const L=STEALABLE.filter(s=>s!==f.hero.special);f.stolen=pick(L);f.stolenT=SURGE.dur;
      burst(ADD,f.chest(new V3()),24,{colors:[0xff9af0,0xffffff],speed:5,life:.5,size:.25,size1:0,bright:2.2});if(f===ME)announceSmall('YOUR SPECIAL IS NOW '+(SPNAME[f.stolen]||f.stolen).toUpperCase());}}},
  overcharge:{name:'OVERCHARGE',col:'#ffe03a',desc:'Cooldowns fly by and ultimates charge fast.',
    tick(dt){for(const f of FS){if(f.dead)continue;f.specCD=Math.max(0,(f.specCD||0)-dt*1.5);if(f.xcd)f.xcd=f.xcd.map(c=>Math.max(0,c-dt*1.5));if(NET.role!=='client')f.meter=Math.min(100,f.meter+dt*4);
      if(Math.random()<dt*3&&nearCam(f.pos,50))burst(ADD,TMP2.set(f.pos.x+rand(-.4,.4),f.pos.y+rand(.2,1.8),f.pos.z+rand(-.4,.4)),1,{colors:[0xffe03a,0xffffff],speed:.6,up:2,life:.4,size:.2,size1:0,bright:2});}}},
  meteors:{name:'METEOR SHOWER',col:'#ff7a20',desc:'Watch the ground for red circles!',
    tick(dt){if(NET.role==='client')return;SURGE.mT-=dt;if(SURGE.mT>0)return;SURGE.mT=.45;const L=FS.filter(f=>!f.dead&&!f.dormant);if(!L.length)return;
      const f=pick(L),x=f.pos.x+rand(-7,7),z=f.pos.z+rand(-7,7);surgeMeteor(x,z);netEvent({k:'surgeM',x,z});}},
  gold:{name:'GOLD RUSH',col:'#ffd23f',desc:'Grab the golden orbs for meter and health!',
    start(){if(NET.role==='client')return;const L=FS.filter(f=>!f.dead);const P=[];for(let i=0;i<14;i++){const f=pick(L);if(!f)break;P.push([f.pos.x+rand(-12,12),f.pos.z+rand(-12,12)]);}
      surgeGold(P);netEvent({k:'surgeG',p:P});},
    tick(dt){for(const o of SURGE.orbs){if(!o.m.visible)continue;o.m.position.y=o.y+1+Math.sin(game.time*3+o.x)*.25;o.m.rotation.y+=dt*2;
      if(NET.role==='client')continue;for(const f of FS){if(f.dead||f.dormant)continue;if(Math.hypot(f.pos.x-o.x,f.pos.z-o.z)<1.4&&Math.abs(f.pos.y-o.y)<2.5){surgeTake(o.i,f);netEvent({k:'surgeT',i:o.i,f:f.id});break;}}}},
    end(){SURGE.orbs.forEach(o=>scene.remove(o.m));SURGE.orbs.length=0;}}};
const SURGE_KEYS=Object.keys(SURGE_EV);

function surgeOn(){return !game.story&&!game.practice&&game.rules!=='raid'&&!PR.on;}

/* ---------- meteors ---------- */
const mtrGeo=new THREE.DodecahedronGeometry(.9,0),mtrMat=new THREE.MeshStandardMaterial({color:0x3a2a20,emissive:0xff5a10,emissiveIntensity:1.4,flatShading:true});
function surgeMeteor(x,z){const y=floorAt(x,z,60);const warn=new THREE.Mesh(new THREE.RingGeometry(1.6,2.2,32),new THREE.MeshBasicMaterial({color:0xff3a1a,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
  warn.rotation.x=-Math.PI/2;warn.position.set(x,y+.06,z);scene.add(warn);const rock=new THREE.Mesh(mtrGeo,mtrMat);rock.position.set(x+14,y+45,z+6);scene.add(rock);
  SURGE.meteors.push({x,z,y,t:0,warn,rock});}
function surgeMeteorTick(dt){for(let i=SURGE.meteors.length-1;i>=0;i--){const m=SURGE.meteors[i];m.t+=dt;const k=Math.min(1,m.t/1.2);
  m.rock.position.set(m.x+14*(1-k),m.y+45*(1-k)+.5,m.z+6*(1-k));m.rock.rotation.x+=dt*6;m.warn.material.opacity=.4+.4*Math.sin(m.t*20);m.warn.scale.setScalar(1-k*.4);
  if(Math.random()<.6&&nearCam(m.rock.position,90))burst(ADD,m.rock.position,2,{colors:[0xff7a20,0xffd23f],speed:1,life:.4,size:.5,size1:0,bright:2});
  if(m.t>=1.2||!inMatch()){SURGE.meteors.splice(i,1);scene.remove(m.warn);scene.remove(m.rock);m.warn.geometry.dispose();if(!inMatch())continue;
    const p=new V3(m.x,m.y+.5,m.z);explosion(p,2.6,[0xff7a20,0xffc24a,0xff3b10]);shake(.35,p);if(typeof crater==='function')crater(m.x,m.z,1.6);xSnd(p,()=>AU.boom(false));
    if(NET.role!=='client')for(const f of FS){if(f.dead||f.dormant||f.invuln>0)continue;const d=Math.hypot(f.pos.x-m.x,f.pos.z-m.z);if(d<2.6&&Math.abs(f.pos.y-m.y)<3){
      f.hp-=16*DMG_SCALE*(f.take||1);const dir=new V3(f.pos.x-m.x,0,f.pos.z-m.z).normalize();f.vel.set(dir.x*9,12,dir.z*9);f.onGround=false;
      if(f.hp<=0&&!f.dead){f.hp=0;killFighter(f,null,dir);}else if(f===ME)announceSmall('HIT BY A METEOR!');}}}}}

/* ---------- gold orbs ---------- */
const goldGeo=new THREE.OctahedronGeometry(.45,0),goldMat=new THREE.MeshStandardMaterial({color:0xffd23f,emissive:0xffa21a,emissiveIntensity:1.6,metalness:.8,roughness:.2});
function surgeGold(P){P.forEach((p,i)=>{const y=floorAt(p[0],p[1],60);const m=new THREE.Mesh(goldGeo,goldMat);m.position.set(p[0],y+1,p[1]);scene.add(m);SURGE.orbs.push({i,x:p[0],z:p[1],y,m});
  ring(new V3(p[0],y+.2,p[1]),0xffd23f,1.6,.4,true,2);});}
function surgeTake(i,f){const o=SURGE.orbs.find(q=>q.i===i);if(!o||!o.m.visible)return;o.m.visible=false;const c=o.m.position.clone();
  burst(ADD,c,24,{colors:[0xffd23f,0xffffff],speed:5,life:.45,size:.25,size1:0,bright:2.4});ring(c,0xffd23f,2,.3,false,2.4);xSnd(c,()=>AU.levelUp&&AU.levelUp());
  if(f&&NET.role!=='client'){f.meter=Math.min(100,f.meter+25);f.hp=Math.min(100,f.hp+10);}if(f===ME)announceSmall('GOLD! +25 METER · +10 HP');}

/* ---------- HUD chip ---------- */
function surgeChip(){let e=$('surgeChip');if(!e){e=document.createElement('div');e.id='surgeChip';document.body.appendChild(e);}return e;}
function surgeHUD(){const e=surgeChip();if(!inMatch()||(!SURGE.ev&&!SURGE.pending)){e.style.display='none';return;}e.style.display='';
  if(SURGE.ev){const E=SURGE_EV[SURGE.ev];e.style.setProperty('--c',E.col);e.innerHTML=`<i>SURGE EVENT</i><b>${E.name}</b><span>${Math.ceil(SURGE.t)}s</span>`;}
  else{const E=SURGE_EV[SURGE.pending];e.style.setProperty('--c',E.col);e.innerHTML=`<i>SURGE INCOMING</i><b>${E.name}</b><span>${Math.ceil(SURGE.warn)}…</span>`;}}

/* ---------- flow ---------- */
function surgeWarn(key){SURGE.pending=key;SURGE.warn=3;const E=SURGE_EV[key];announceSmall('SURGE INCOMING: '+E.name+' — '+E.desc);AU.sting&&AU.sting();}
function surgeStart(key,dur){const E=SURGE_EV[key];if(!E)return;surgeEnd();SURGE.pending=null;SURGE.ev=key;SURGE.t=dur||SURGE.dur;SURGE.mT=.6;
  announce(E.name,E.col);if(E.start)E.start();if(typeof AU!=='undefined'&&AU.fanfare)AU.fanfare();}
function surgeEnd(){const E=SURGE.ev&&SURGE_EV[SURGE.ev];if(E&&E.end)E.end();if(SURGE.ev==='swap')FS.forEach(f=>{if(f.stolenT>0&&NET.role!=='client')f.stolenT=Math.min(f.stolenT,.1);});SURGE.ev=null;}
onEv('net:surgeW',e=>surgeWarn(e.e));
onEv('net:surge',e=>surgeStart(e.e,e.t));
onEv('net:surgeEnd',()=>surgeEnd());
onEv('net:surgeM',e=>surgeMeteor(e.x,e.z));
onEv('net:surgeG',e=>surgeGold(e.p));
onEv('net:surgeT',e=>surgeTake(e.i,FS.find(f=>f.id===e.f)));
onEv('matchStart',()=>{surgeEnd();SURGE.pending=null;SURGE.next=35;SURGE.last=null;SURGE.meteors.forEach(m=>{scene.remove(m.warn);scene.remove(m.rock);});SURGE.meteors.length=0;});
onEv('matchEnd',()=>{surgeEnd();SURGE.pending=null;surgeHUD();});
onEv('tick',dt=>{surgeMeteorTick(dt);
  if(SURGE.ev){const E=SURGE_EV[SURGE.ev];if(E.tick&&game.phase==='fight')E.tick(dt);SURGE.t-=dt;if(SURGE.t<=0&&NET.role!=='client'){surgeEnd();netEvent({k:'surgeEnd'});announceSmall('SURGE OVER');}}
  if(SURGE.pending){SURGE.warn-=dt;if(SURGE.warn<=0&&NET.role!=='client'){const k=SURGE.pending;surgeStart(k);netEvent({k:'surge',e:k,t:SURGE.dur});}}
  if(NET.role!=='client'&&game.phase==='fight'&&surgeOn()&&!SURGE.ev&&!SURGE.pending&&SET.surgeEv!==false){SURGE.next-=dt;
    if(SURGE.next<=0){SURGE.next=50;const k=pick(SURGE_KEYS.filter(x=>x!==SURGE.last));SURGE.last=k;surgeWarn(k);netEvent({k:'surgeW',e:k});}}
  surgeHUD();});
// low gravity: give back most of the fall speed gravity took this frame
const _surgePhys=Fighter.prototype.physics;
Fighter.prototype.physics=function(dt,fr,grav){if(SURGE.ev==='lowgrav'&&grav&&!this.onGround)this.vel.y+=(this.state==='fly'?26:30)*.62*dt;return _surgePhys.call(this,dt,fr,grav);};
