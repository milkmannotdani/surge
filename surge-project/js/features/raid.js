/* BOSS RAID (rules 'raid'): everyone teams up against one giant boss with phases, area attacks and a weak point.
   Players share 6 lives and respawn after 6 s. Works offline (with up to 3 bot partners) and online.
   VILLAIN ATTACK EVENT: in battle royale, a giant monster drops into the city at 1:15. Anyone can fight it for a
   big reward (or ignore it); it leaves after 90 s. Bosses are giant versions of existing rigs (RAID_BOSSES). */
const RAID_BOSSES={
  goliath:{base:'titan',name:'GOLIATH, THE NOMU KING',color:0x6a2a8a,accent:0xff3a6a,suit:0x0a0a10,mainCol:0x2a2a34,css:'#c84aff'},
  magma:{base:'quake',name:'MAGMA TYRANT',color:0xff5a1f,accent:0xffd23f,suit:0x1a0804,mainCol:0x3a1a10,css:'#ff7a3a'},
  leviathan:{base:'riptide',name:'THE LEVIATHAN',color:0x1affc0,accent:0x8afff0,suit:0x02101a,mainCol:0x0a3a4a,css:'#3affd8'},
  nomu:{base:'bastion',name:'GIGA NOMU',color:0x3a3a4a,accent:0xff2a4a,suit:0x0a0a0e,mainCol:0x2a1a2a,css:'#ff4a6a'}};
const _bossCache={};
function raidBossHero(id){if(_bossCache[id])return _bossCache[id];const B=RAID_BOSSES[id]||RAID_BOSSES.goliath,h=HEROES[heroIdx(B.base)];
  return _bossCache[id]=Object.assign({},h,{name:B.name,color:B.color,accent:B.accent,suit:B.suit,mainCol:B.mainCol,css:B.css,scale:id==='nomu'?2.2:2.6,bulk:1.35,spd:.9,pow:1.35,faction:'villain',raidBoss:id});}
const RAID={lives:6,boss:null,phase:1,nextT:0,stagT:0,core:null,baseTake:.07,marks:[]};
const EVT={boss:null,wakeAt:75,leaveT:0,on:false,done:false};
function hashStr(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);}
// reshapes the roster before the match is built (same result on every player's machine)
function matchPrep(roster,spawns,mode,rules){
  if(game.story||(typeof PR!=='undefined'&&PR.on))return [roster,spawns];
  if(rules==='raid'){const hum=roster.filter(r=>!r.bot),bots=roster.filter(r=>r.bot).slice(0,Math.max(0,4-hum.length));
    const R=hum.concat(bots).map(r=>Object.assign({},r,{team:0,keepTeam:true}));const ids=Object.keys(RAID_BOSSES).filter(k=>k!=='nomu');
    const bid=ids[hashStr(R.map(r=>r.name).join('|'))%ids.length];R.push({id:950,name:RAID_BOSSES[bid].name,raid:bid,bot:true,team:9,keepTeam:true});
    const S=R.map((r,i)=>r.raid?[0,22]:[(i%4-1.5)*3,-22-Math.floor(i/4)*3]);return [R,S];}
  if(rules==='br'){const R=roster.concat([{id:960,name:'GIGA NOMU',raid:'nomu',bot:true,team:960,keepTeam:true}]);const S=spawns.concat([[BOUND-3,BOUND-3]]);return [R,S];}
  return [roster,spawns];}
onEv('matchStart',()=>{RAID.boss=null;EVT.boss=null;EVT.on=false;EVT.done=false;clearRaidFX();
  if(game.rules==='raid'&&!game.story){RAID.boss=FS.find(f=>f.id===950);RAID.lives=6;RAID.phase=1;RAID.nextT=game.time+8;RAID.stagT=0;
    if(RAID.boss){RAID.boss.take=RAID.baseTake;RAID.boss.boss=true;}if(ME)setTimeout(()=>{if(inMatch())announceSmall('BOSS RAID · DEFEAT '+(RAID.boss?RAID.boss.name:'THE BOSS'));},3800);}
  const E=FS.find(f=>f.id===960);if(E){E.evt=true;sleepEvt(E);EVT.boss=E;}});
/* ---------- raid rules ---------- */
const _onElimRaid=game.onElim;
game.onElim=function(v,k){if(game.rules!=='raid'||game.story)return _onElimRaid(v,k);if(NET.role==='client')return;
  if(k&&!ally(k,v))k.kills++;netEvent({k:'elim',v:v.id,a:k?k.id:-1,pl:0});
  if(v===RAID.boss){handleElim(v,k,0);const w=FS.find(f=>f.team===0&&!f.dead)||FS.find(f=>f.team===0);endMatch(w);return;}
  RAID.lives--;v.raidOut=RAID.lives<0;netEvent({k:'rlives',n:RAID.lives});handleElim(v,k,0);
  if(RAID.lives<0&&FS.filter(f=>f.team===0).every(f=>f.dead))endMatch(RAID.boss);};
onEv('net:rlives',e=>{RAID.lives=e.n;});
function raidHUD(F){const B=RAID.boss;$('alive').textContent=`LIVES ${Math.max(0,RAID.lives)} · BOSS ${B?Math.max(0,Math.ceil(B.hp)):0}%`;
  $('zinfo').textContent=game.phase==='countdown'?'DROPPING IN…':(F&&F.dead?(F.raidOut?'OUT OF LIVES — SPECTATING':'RESPAWNING…'):['','PHASE 1','PHASE 2 · ENRAGED','PHASE 3 · FINAL FORM'][RAID.phase]);}
function raidSpot(){const al=FS.filter(f=>f.team===0&&!f.dead);const c=al.length?al[0].pos:new V3(0,0,-20);const p=randomOpenPoint(c.x,c.z,10);return p;}
function bossRing(B,r){return FS.filter(f=>!f.dead&&!ally(f,B)&&!f.dormant&&Math.hypot(f.pos.x-B.pos.x,f.pos.z-B.pos.z)<r);}
function raidHit(B,f,dmg,kb,up){applyHit(B,f,{dmg,kb,up,launch:up>8,heavy:true,pt:f.chest(new V3())});}
onEv('tick',dt=>{
  // boss bar
  const B=RAID.boss||(EVT.on?EVT.boss:null),bb=$('bossBar');
  if(B&&!B.dead&&!game.story){bb.classList.add('on');$('bossName').textContent=B.name+(RAID.stagT>0?' · WEAK POINT EXPOSED!':'');$('bossFill').style.width=Math.max(0,B.hp)+'%';$('bossFill').style.background=B.hero.css;}
  else if(!game.story&&(RAID.boss||EVT.boss))bb.classList.remove('on');
  if(RAID.core){const C=RAID.core;if(C.userData.f&&!C.userData.f.dead){C.position.copy(C.userData.f.chest(TMP2));C.position.y+=.6;C.scale.setScalar(1.4+Math.sin(game.time*12)*.15);}if(game.time>C.userData.until){scene.remove(C);RAID.core=null;}}
  updRaidMarks(dt);
  if(NET.role==='client'||game.phase!=='fight')return;
  // raid boss
  if(RAID.boss&&!RAID.boss.dead){const R=RAID.boss;
    const ph=R.hp<33?3:R.hp<66?2:1;if(ph!==RAID.phase){RAID.phase=ph;netEvent({k:'raidfx',t:'phase',n:ph});raidFX({t:'phase',n:ph});}
    if(RAID.stagT>0){RAID.stagT-=dt;R.take=RAID.baseTake*3;R.hold=true;if(RAID.stagT<=0){R.hold=false;R.take=RAID.baseTake;}}
    else if(game.time>RAID.nextT){bossMove(R,RAID.phase);RAID.nextT=game.time+[0,8,6.5,5][RAID.phase];}
    for(const f of FS)if(f.team===0&&f.dead&&!f.raidOut){f.respT=(f.respT==null?6:f.respT)-dt;if(f.respT<=0){const p=raidSpot();respawnFighter(f,p.x,p.z);netEvent({k:'resp',v:f.id,x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10});}}}
  // villain attack event
  const E=EVT.boss;if(E&&!EVT.done){
    if(!EVT.on&&game.matchT>=EVT.wakeAt&&game.rules==='br'){const al=aliveList();if(al.length>2){const c=al[Math.floor(Math.random()*al.length)].pos;const p=randomOpenPoint(c.x,c.z,14);wakeEvt(E,p.x,p.z);netEvent({k:'evt',s:'wake',x:p.x,z:p.z});}}
    else if(EVT.on&&!E.dead){EVT.leaveT-=dt;if(game.time>(E.nextT||0)){bossMove(E,1);E.nextT=game.time+7;}if(EVT.leaveT<=0){EVT.done=true;netEvent({k:'evt',s:'leave'});leaveEvt(E);}}
    else if(!EVT.on&&E.dormant){E.hp=100;E.invuln=1;}}});
function bossMove(B,ph){const r=Math.random(),near=bossRing(B,60);if(!near.length)return;
  if(r<.4){netEvent({k:'raidfx',t:'stomp',id:B.id});raidFX({t:'stomp',id:B.id});setTimeout(()=>{if(!inMatch()||B.dead)return;for(const f of bossRing(B,11))if(f.onGround)raidHit(B,f,14,14,12);},700);}
  else if(r<.75||B.evt){const pts=near.slice(0,4).map(f=>[Math.round((f.pos.x+rand(-2,2))*10)/10,Math.round((f.pos.z+rand(-2,2))*10)/10]);for(let i=0;i<ph;i++)pts.push(pts[0].map(v=>v+rand(-6,6)));
    netEvent({k:'raidfx',t:'meteor',pts,id:B.id});raidFX({t:'meteor',pts,id:B.id});
    setTimeout(()=>{if(!inMatch()||B.dead)return;for(const [x,z] of pts)for(const f of FS)if(!f.dead&&!ally(f,B)&&Math.hypot(f.pos.x-x,f.pos.z-z)<3.4)raidHit(B,f,16,10,10);},1600);}
  else{RAID.stagT=5;netEvent({k:'raidfx',t:'stagger',id:B.id});raidFX({t:'stagger',id:B.id});}}
/* ---------- effects (run on every player) ---------- */
const RMK=[];const markMat=new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
function updRaidMarks(dt){for(let i=RMK.length-1;i>=0;i--){const m=RMK[i];m.t+=dt;m.mesh.material.opacity=.25+.35*Math.abs(Math.sin(m.t*10));m.mesh.scale.setScalar(Math.min(1,m.t/1.2)*3.4);
  if(m.t>=1.6){scene.remove(m.mesh);RMK.splice(i,1);const p=new V3(m.x,floorAt(m.x,m.z,2)+.3,m.z);explosion(p,3.4,[0xff7a20,0xffc24a,0xff3b10]);if(typeof crater==='function')crater(m.x,m.z,2);shake(.4,p);AU.scale=sndAt(p);AU.boom(false);AU.scale=1;}}}
function clearRaidFX(){RMK.forEach(m=>scene.remove(m.mesh));RMK.length=0;if(RAID.core){scene.remove(RAID.core);RAID.core=null;}$('bossBar').classList.remove('on');}
onEv('matchEnd',clearRaidFX);
function raidFX(e){const B=byFid(e.id)||RAID.boss;
  if(e.t==='stomp'&&B){B.set('ult');const p=B.pos.clone();setTimeout(()=>{if(!inMatch())return;ring(new V3(p.x,p.y+.2,p.z),B.hero.accent,11,.6,true,2.4);ring(new V3(p.x,p.y+.4,p.z),0xffffff,8,.4,true,2);dust(p,30,2.4);shake(.7,p);AU.scale=sndAt(p);AU.boom(true);AU.scale=1;if(typeof crater==='function')crater(p.x,p.z,3);B.set('idle');},700);
    if(ME&&B.pos.distanceTo(ME.pos)<14)announceSmall('STOMP INCOMING — JUMP!');}
  else if(e.t==='meteor'){for(const [x,z] of e.pts){const m=new THREE.Mesh(new THREE.CircleGeometry(1,24),markMat.clone());m.rotation.x=-Math.PI/2;m.position.set(x,floorAt(x,z,2)+.06,z);scene.add(m);RMK.push({mesh:m,t:0,x,z});}
    if(ME&&e.pts.some(([x,z])=>Math.hypot(ME.pos.x-x,ME.pos.z-z)<5))announceSmall('METEORS — MOVE!');}
  else if(e.t==='stagger'&&B){B.set('down');const c=new THREE.Mesh(new THREE.SphereGeometry(.45,16,12),new THREE.MeshBasicMaterial({color:0xffe03a}));c.userData={f:B,until:game.time+5};if(RAID.core)scene.remove(RAID.core);RAID.core=c;scene.add(c);
    ring(B.chest(new V3()),0xffe03a,4,.5,false,2.6);if(ME)announce('WEAK POINT!','#ffe03a');AU.scale=1;AU.tone('sawtooth',400,120,.8,.12);}
  else if(e.t==='phase'){if(ME)announce(e.n===2?'BOSS ENRAGED!':'FINAL FORM!','#ff3a4a');AU.scale=1;AU.sting(true);const m=B&&B.rig.mats;if(m&&m[1]){m[1].emissive&&m[1].emissive.set(0xff2a2a);m[1].emissiveIntensity=(m[1].emissiveIntensity||0)+.6*e.n;}}}
onEv('net:raidfx',raidFX);
/* ---------- villain event ---------- */
function sleepEvt(E){E.dormant=true;E.hold=true;E.rig.root.visible=false;E.invuln=99;E.take=.12;}
function wakeEvt(E,x,z){EVT.on=true;EVT.leaveT=90;E.dormant=false;E.hold=false;E.invuln=1.5;E.reset(x,z,0);E.pos.y=30;E.vel.y=-30;E.rig.root.visible=true;E.take=.12;
  setTimeout(()=>{if(!inMatch())return;const p=E.pos.clone();ring(new V3(p.x,.2,p.z),0xff2a4a,12,.7,true,2.6);dust(p,40,2.6);shake(.9,p);if(typeof crater==='function')crater(p.x,p.z,3.5,0);AU.scale=sndAt(p);AU.boom(true);AU.scale=1;},900);
  announce('VILLAIN ATTACK!','#ff2a4a');announceSmall('A GIGA NOMU HAS LANDED — DEFEAT IT FOR A BIG REWARD');feed('<b style="--c:#ff4a6a">GIGA NOMU</b> has landed in the city!');AU.scale=1;AU.sting(true);}
function leaveEvt(E){EVT.on=false;if(!E.dead){portal(E.chest(new V3()),4,true,1.4);sleepEvt(E);feed('<b style="--c:#ff4a6a">GIGA NOMU</b> escaped…');}}
onEv('net:evt',e=>{const E=EVT.boss;if(!E)return;if(e.s==='wake')wakeEvt(E,e.x,e.z);else{EVT.done=true;leaveEvt(E);}});
onEv('kill',(def,att)=>{if(!def.evt)return;EVT.done=true;EVT.on=false;announce('GIGA NOMU DEFEATED!','#ffd23f');
  if(att&&att===ME){addPoints(60,'NOMU');if(typeof progAddXP==='function')progAddXP(mySel,150,'NOMU');}
  for(const f of FS)if(!f.dead&&!f.evt&&f.pos.distanceTo(def.pos)<30){f.meter=100;}if(ME&&!ME.dead&&ME.pos.distanceTo(def.pos)<30)announceSmall('HERO BONUS: ULT METER FULL!');});
onEv('win',w=>{if(game.rules==='raid'&&w&&ME&&ally(w,ME)){addPoints(80,'RAID');if(typeof progAddXP==='function')progAddXP(mySel,200,'RAID');}});
