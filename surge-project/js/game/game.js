/* Match flow, controls (MOVE_SLOTS / ULT_KEYS), camera, HUD */
/* ================= ZONE / ORBS ================= */
const ZONE={cx:0,cz:0,r:200,fx:0,fz:0,fr:135,tx:0,tz:0,tr:80,pi:0,st:'wait',t:0,dps:2};
const ZPH=[{w:26,s:22,r:125,d:2},{w:22,s:20,r:80,d:2},{w:18,s:18,r:50,d:4},{w:15,s:15,r:26,d:7},{w:12,s:12,r:10,d:11},{w:10,s:10,r:2,d:16},{w:999,s:1,r:2,d:20}];
function zoneReset(){Object.assign(ZONE,{cx:0,cz:0,r:200,pi:0,st:'wait',t:0,dps:2});zonePick();}
function zonePick(){const ph=ZPH[Math.min(ZONE.pi,ZPH.length-1)];ZONE.fx=ZONE.cx;ZONE.fz=ZONE.cz;ZONE.fr=ZONE.r;
  let tx=0,tz=0;for(let k=0;k<30;k++){const a=rand(0,6.28),m=rand(0,Math.max(0,Math.min(ZONE.r,BOUND+10)-ph.r)*.8);tx=ZONE.cx+Math.cos(a)*m;tz=ZONE.cz+Math.sin(a)*m;
    if(Math.abs(tx)+ph.r*.3<BOUND&&Math.abs(tz)+ph.r*.3<BOUND&&!insideBld(tx,tz,2))break;}
  ZONE.tx=clamp(tx,-BOUND+ph.r*.3,BOUND-ph.r*.3);ZONE.tz=clamp(tz,-BOUND+ph.r*.3,BOUND-ph.r*.3);ZONE.tr=ph.r;ZONE.dps=ph.d;}
function noStorm(){return game.rules==='arena'||!!game.story;}
function zoneUpdate(dt){if(noStorm())return;const ph=ZPH[Math.min(ZONE.pi,ZPH.length-1)];ZONE.t+=dt;
  if(ZONE.st==='wait'){if(ZONE.t>=ph.w){ZONE.st='shrink';ZONE.t=0;if(NET.role!=='client')netEvent({k:'zone'});zoneMsg();}}
  else{const k=Math.min(1,ZONE.t/ph.s);ZONE.cx=lerp(ZONE.fx,ZONE.tx,k);ZONE.cz=lerp(ZONE.fz,ZONE.tz,k);ZONE.r=lerp(ZONE.fr,ZONE.tr,k);
    if(k>=1){ZONE.pi++;ZONE.st='wait';ZONE.t=0;zonePick();}}}
function zoneMsg(){announceSmall('THE ZONE IS CLOSING');AU.scale=1;AU.tone('sawtooth',220,110,.6,.12);}
function zoneLabel(){const ph=ZPH[Math.min(ZONE.pi,ZPH.length-1)];if(ZONE.pi>=ZPH.length-1)return 'FINAL ZONE';
  const left=Math.max(0,(ZONE.st==='wait'?ph.w:ph.s)-ZONE.t);const m=Math.floor(left/60),s=Math.floor(left%60);return (ZONE.st==='wait'?'ZONE CLOSES IN ':'ZONE CLOSING · ')+m+':'+String(s).padStart(2,'0');}
function outsideZone(p){if(noStorm())return false;return Math.hypot(p.x-ZONE.cx,p.z-ZONE.cz)>ZONE.r;}

let ORBS=[],orbId=1,orbT=0;
function randomOpenPoint(cx,cz,R){for(let k=0;k<40;k++){const a=rand(0,6.28),m=Math.sqrt(Math.random())*R;const x=clamp(cx+Math.cos(a)*m,-BOUND+3,BOUND-3),z=clamp(cz+Math.sin(a)*m,-BOUND+3,BOUND-3);
  if(insideBld(x,z,1.5))continue;if(solids.some(s=>Math.hypot(s.x-x,s.z-z)<s.r+1))continue;return {x,z};}return {x:cx,z:cz};}
function nearestOrb(p,type,maxD){let b=null,bd=maxD;for(const o of ORBS){if(type&&o.type!==type)continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd){bd=d;b=o;}}return b;}
function addOrb(id,x,z,type){const o={id,x,z,type,mesh:makeOrbMesh(type)};o.mesh.position.set(x,1,z);ORBS.push(o);return o;}
function removeOrb(o,fx){scene.remove(o.mesh);ORBS.splice(ORBS.indexOf(o),1);if(fx){const p=new V3(o.x,1,o.z);AU.scale=sndAt(p);AU.pick();AU.scale=1;
  burst(ADD,p,30,{colors:[o.type==='hp'?0x3dff8a:0xffd23f,0xffffff],speed:5,up:3,life:.5,size:.3,bright:2.2});ring(p,o.type==='hp'?0x3dff8a:0xffd23f,2,.3,false,2.2);}}
function clearOrbs(){ORBS.slice().forEach(o=>removeOrb(o,false));}
function orbsHost(dt){
  orbT-=dt;if(orbT<=0&&ORBS.length<14){orbT=2.5;const p=randomOpenPoint(ZONE.cx,ZONE.cz,Math.min(ZONE.r*.85,95));addOrb(orbId++,p.x,p.z,Math.random()<.6?'hp':'surge');}
  for(const o of ORBS.slice()){if(Math.hypot(o.x-ZONE.cx,o.z-ZONE.cz)>ZONE.r+2){removeOrb(o,false);continue;}
    for(const f of FS){if(f.dead)continue;if(Math.hypot(f.pos.x-o.x,f.pos.z-o.z)<1.7&&f.pos.y<2.5){
      if(o.type==='hp'){if(f.hp>=100)continue;f.hp=Math.min(100,f.hp+30);}else f.meter=Math.min(100,f.meter+40);
      removeOrb(o,true);netEvent({k:'pick',id:o.id,f:f.id});break;}}}
}
function orbsAnimate(){ORBS.forEach(o=>{o.mesh.position.y=1+Math.sin(game.time*2.5+o.id)*.2;o.mesh.rotation.y+=.03;o.mesh.children[1].rotation.x=Math.PI/2+Math.sin(game.time+o.id)*.4;});}

/* ================= GAME FLOW ================= */
const game={mode:'solo',phase:'menu',time:0,matchT:0,cine:null,slowT:0,timeScale:1,winner:null,diff:1,botN:7,cdT:0,specF:null,lastCd:0};
let AIS=[];
function aliveList(){return FS.filter(f=>!f.dead);}
function aliveTeams(){const s=new Set();FS.forEach(f=>{if(!f.dead&&!f.downed)s.add(f.team);});FS.forEach(f=>{if(!f.dead&&f.downed&&mates(f).some(m=>!m.dead))s.add(f.team);});return s;}
function spawnPoints(n){const base=[];INNER.forEach(a=>INNER.forEach(b=>base.push([a,b])));PLAZAS.forEach(p=>base.push([p[0]+(p[0]>0?-12:12),p[1]]));
  base.sort(()=>Math.random()-.5);const out=[];for(let i=0;i<n;i++){const b=base[i%base.length];out.push([b[0]+rand(-4,4),b[1]+rand(-4,4)]);}return out;}
function startMatch(roster,spawns,diff,mode,rules){
  game.story=game._storyNext||null;game._storyNext=null;
  if(rules)game.rules=rules==='arena'?'arena':'br';game.ptsEarned=0;game.winPaid=0;game.practice=false;if(!PR.on)setWorld('city');game.mode=mode||'solo';FS.forEach(f=>f.dispose());FS=[];AIS=[];clearProjs();clearOrbs();resetProps();clearMarks();
  decorateBots(roster);roster.forEach((r,i)=>{r.cos=r.cos?sanitizeCos(r.cos,(rosterHero(Object.assign({},r,{cos:null}))||{}).id):null;const f=new Fighter(rosterHero(r),r.id,r.name,r.bot,game.mode==='duos'||game.story?r.team:r.id);const s=spawns[i];f.reset(s[0],s[1],Math.atan2(-s[0],-s[1]));f.cos=r.cos||{card:'none',tag:'none',pet:'none',skin:'default'};attachPet(f);FS.push(f);
    if(r.bot&&NET.role!=='client')AIS.push(new AI(f,diff));});
  ME=FS.find(f=>f.id===NET.myId)||null;game.specF=null;
  zoneReset();orbT=0;game.matchT=0;game.winner=null;game.timeScale=1;game.slowT=0;game.cine=null;
  game.phase='countdown';game.cdT=3.6;game.lastCd=0;
  if(ME){camYaw=ME.face;camPitch=.3;}
  showScreen(null);$('hud').classList.add('on');$('hint').style.display='block';$('spec').style.display='none';$('feed').innerHTML='';
  buildSlots();$('meName').innerHTML=(ME?esc(ME.hero.name)+' · '+tagName(ME,ME.name):'');$('meMB').style.setProperty('--c',ME?ME.hero.css:'#fff');$('meM').style.setProperty('--c',ME?ME.hero.css:'#fff');
  AU.startMusic();AU.startAmb();
}
game.onElim=function(v,k){
  if(NET.role==='client')return;
  if(k&&!ally(k,v))k.kills++;
  // a downed teammate with nobody left to revive them goes down for good
  mates(v).forEach(m=>{if(m.downed&&!m.dead&&!mates(m).some(x=>!x.dead&&!x.downed))killFighter(m,m.lastHitBy,null);});
  const teams=aliveTeams();const teamOut=!teams.has(v.team);
  const pl=teamOut?teams.size+1:0;if(teamOut)FS.forEach(f=>{if(f.team===v.team&&!f.place)f.place=pl;});
  netEvent({k:'elim',v:v.id,a:k?k.id:-1,pl});handleElim(v,k,pl);
  if(game.story)return;   // story missions decide their own ending
  if(teams.size<=1&&game.phase==='fight'){const w=FS.find(f=>teams.has(f.team)&&!f.dead)||null;endMatch(w);}
};
game.onDowned=function(v,k){if(NET.role==='client')return;netEvent({k:'down',v:v.id,a:k?k.id:-1});handleDown(v,k);};
function handleDown(v,k){v.downed=true;
  const kn=k?`<b style="--c:${k.hero.css}">${esc(k.name)}</b>`:'THE ZONE';feed(`${kn} knocked down <b style="--c:${v.hero.css}">${esc(v.name)}</b>`);
  if(v===ME){announceSmall('KNOCKED DOWN — CRAWL TO YOUR TEAMMATE');AU.scale=1;AU.hit(1.2);}
  else if(ME&&ally(v,ME))announceSmall(v.name.toUpperCase()+' IS DOWN — HOLD R TO REVIVE');
  else if(k===ME)announceSmall('KNOCKED '+v.name.toUpperCase());}
function revived(f){f.downed=false;f.bleed=0;f.revT=0;f.hp=35;f.set('getup');f.invuln=1.2;ring(f.chest(TMP2),0x3dff8a,2.4,.4,false,2.4);
  burst(ADD,f.chest(TMP2),40,{colors:[0x3dff8a,0xffffff],speed:5,up:2,life:.6,size:.3,bright:2.2});AU.scale=sndAt(f.pos);AU.pick();AU.scale=1;
  if(f===ME)announceSmall('REVIVED!');else if(ME&&ally(f,ME))feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> was revived`);}
function teamTick(dt){
  // host: bleed-out and revives
  for(const f of FS){if(f.dead||!f.downed)continue;
    const helper=mates(f).find(m=>!m.dead&&!m.downed&&m.intent.revive&&m.pos.distanceTo(f.pos)<2.6&&['idle','run','block'].indexOf(m.state)>=0);
    if(helper){f.revT+=dt;helper.vel.x*=.5;helper.vel.z*=.5;if(Math.random()<.4)burst(ADD,f.chest(TMP2),1,{colors:[0x3dff8a],speed:1,up:1.5,life:.5,size:.3,bright:2});
      if(f.revT>=3){revived(f);netEvent({k:'rev',v:f.id});}}
    else{f.revT=Math.max(0,f.revT-dt*1.5);f.bleed-=(outsideZone(f.pos)?ZONE.dps*2:0)*dt+3.2*dt;if(f.bleed<=0)killFighter(f,f.lastHitBy,null);}}
}
function handleElim(v,k,pl){
  if(pl)FS.forEach(f=>{if(f.team===v.team&&!f.place)f.place=pl;});v.downed=false;
  const kn=k&&k!==v?`<b style="--c:${k.hero.css}">${tagName(k,k.name)}</b>`:(v.lastHitBy&&game.time-v.lastHitT<6&&!v.lastHitBy.dead?`<b style="--c:${v.lastHitBy.hero.css}">${esc(v.lastHitBy.name)}</b>`:'THE ZONE');
  feed(`${kn} eliminated <b style="--c:${v.hero.css}">${tagName(v,v.name)}</b>`);
  if(v===ME&&k&&k!==ME&&!ally(k,v))showCard(k,'ELIMINATED BY');
  if(k===ME&&v!==ME&&!ally(k,v))addPoints(5,'KILL');
  if(v===ME&&game.rules==='arena'){v.respT=RESPAWN_T;announce('ELIMINATED','#ff4a3f');AU.scale=1;AU.ko();announceSmall('RESPAWNING IN 3…');}
  else if(v===ME){const mt=mates(ME).find(m=>!m.dead);game.specF=mt||(k&&!k.dead?k:null);announce('ELIMINATED','#ff4a3f');AU.scale=1;AU.ko();showSpec(true);}
  else if(game.rules==='arena')v.respT=RESPAWN_T;
  else if(k===ME){announceSmall('ELIMINATED '+v.name.toUpperCase());}
}
function endMatch(w){
  if(game.phase==='over')return;game.phase='over';game.winner=w;game.slowT=1.4;if(w){w.place=1;if(w.onGround)w.set('win');}
  netEvent({k:'win',w:w?w.id:-1});showWin(w);
}
function showWin(w){
  game.phase='over';game.winner=w;if(w)w.place=1;
  const myWin=w&&ME&&ally(w,ME);if(myWin&&NET.role!=='off'&&!game.practice&&!game.winPaid){game.winPaid=1;addPoints(100,'WIN');}const tn=w?(game.mode==='duos'?mates(w).concat([w]).map(f=>f.name).join(' & '):w.name):'';
  announce(myWin?'VICTORY':(w?tn.toUpperCase()+' WIN':'DRAW'),myWin?'#ffd23f':'#fff');AU.scale=1;AU.bell();
  setTimeout(()=>{if(game.phase!=='over')return;
    const nT=new Set(FS.map(f=>f.team)).size;const p=ME?(myWin?1:(ME.place||2)):0;$('rwho').textContent=myWin?(game.rules==='arena'?(game.mode==='duos'?'DUO VICTORY':'ARENA VICTORY'):(game.mode==='duos'?'DUO VICTORY':'VICTORY ROYALE')):'MATCH OVER';
    if(game.rules==='arena'){const L=arenaLead();$('rname').textContent=ME?`${game.mode==='duos'?'TEAM':'YOU'}: ${teamScore(ME.team)} KILLS · ${w?'WINNER '+teamScore(w.team):'TIME UP · DRAW'}`:(w?w.name:'');}
    else $('rname').textContent=ME?'#'+p+' OF '+nT+(game.mode==='duos'?' TEAMS':''):(w?w.name:'');
    $('rname').style.color=myWin?'#ffd23f':'#fff';$('rstats').innerHTML=ME?`ELIMINATIONS: ${ME.kills} · FIGHTER: ${esc(ME.hero.name)}<br><span class="rpts">+${game.ptsEarned||0} POINTS THIS MATCH · ★ ${POINTS.toLocaleString()} TOTAL${NET.role==='off'?' · (wins earn points online)':''}</span>`:'';
    $('bAgain').textContent=NET.role==='off'?'PLAY AGAIN':(NET.role==='host'?'BACK TO LOBBY':'WAIT FOR HOST');$('bAgain').disabled=NET.role==='client';
    if(w&&w.cos&&w.cos.card!=='none')$('rstats').innerHTML+=`<div class="wcard"><div class="cl">${myWin?'YOUR CARD':'WINNER'}</div><img src="${drawCard(w.cos.card,w.name)}" alt=""></div>`;
    showSpec(false);showScreen('result');AU.stopMusic();if(document.pointerLockElement)document.exitPointerLock();},4200);
}
function showSpec(on){$('spec').style.display=on?'block':'none';}
function specTarget(){if(game.specF&&!game.specF.dead)return game.specF;const a=aliveList();game.specF=(ME&&a.find(f=>ally(f,ME)))||a[0]||null;return game.specF;}

/* ================= HUD helpers ================= */
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function feed(html){const d=document.createElement('div');d.className='fd';d.innerHTML=html;$('feed').prepend(d);setTimeout(()=>d.remove(),6000);while($('feed').children.length>6)$('feed').lastChild.remove();}
function announce(t,col){const a=$('announce');a.textContent=t;a.style.color=col||'#fff';a.classList.remove('show');void a.offsetWidth;a.classList.add('show');}
function announceSmall(t){const e=$('toast');e.textContent=t;e.classList.remove('show');void e.offsetWidth;e.classList.add('show');}
let bannerTO=0;
function banner(h){const b=$('banner');b.style.setProperty('--c',h.css);$('btx').textContent=h.ultName;$('btx').style.animation='none';void b.offsetWidth;$('btx').style.animation='';
  b.classList.add('on');$('lbt').classList.add('on');$('lbb').classList.add('on');clearTimeout(bannerTO);bannerTO=setTimeout(()=>{b.classList.remove('on');$('lbt').classList.remove('on');$('lbb').classList.remove('on');},850);}

/* ================= INPUT / CAMERA ================= */
const keys={},pressed=new Set();let camYaw=0,camPitch=.3,lastMouseT=-9,manualTgtT=0;
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
  if(!e.repeat)pressed.add(e.code);keys[e.code]=true;
  if(e.code==='Escape'&&inMatch()){togglePause();}
  if(e.code==='KeyM')AU.music=!AU.music;
  if(e.code==='Tab'&&ME&&!ME.dead)cycleTarget();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function inMatch(){return ['countdown','fight','over'].indexOf(game.phase)>=0;}
const cvs=renderer.domElement;
cvs.addEventListener('mousedown',e=>{
  if(!inMatch()||paused)return;
  if(!document.pointerLockElement&&cvs.requestPointerLock&&!game.plTried){try{const r=cvs.requestPointerLock();if(r&&r.catch)r.catch(()=>{game.plFail=true;});}catch(err){game.plFail=true;}game.plTried=true;return;}
  if(!document.pointerLockElement&&game.plTried&&!game.plFail){try{const r=cvs.requestPointerLock();if(r&&r.catch)r.catch(()=>{game.plFail=true;});}catch(err){}}
  if(e.button===0){pressed.add('MouseL');keys.MouseL=true;}if(e.button===2){pressed.add('MouseR');keys.MouseR=true;}
});
addEventListener('mouseup',e=>{if(e.button===0)keys.MouseL=false;if(e.button===2)keys.MouseR=false;});
addEventListener('mousemove',e=>{if(!inMatch()||paused)return;const locked=document.pointerLockElement===cvs;
  if(locked||(e.buttons&&game.plFail)){camYaw-=e.movementX*.0026;camPitch=clamp(camPitch+e.movementY*.002,-.25,1.1);lastMouseT=game.time;}});
document.addEventListener('pointerlockchange',()=>{$('xh').style.display=document.pointerLockElement===cvs?'block':'none';if(!document.pointerLockElement&&inMatch()&&!paused&&game.phase!=='over'&&game.plTried&&!game.plFail){/* user pressed Esc */}});
document.addEventListener('pointerlockerror',()=>{game.plFail=true;});
addEventListener('contextmenu',e=>e.preventDefault());
function cycleTarget(){const L=enemiesOf(ME).filter(o=>o.pos.distanceTo(ME.pos)<32).sort((a,b)=>a.pos.distanceTo(ME.pos)-b.pos.distanceTo(ME.pos));if(!L.length)return;
  const i=L.indexOf(ME.tgt);ME.tgt=L[(i+1)%L.length];manualTgtT=game.time;AU.ui();}
function autoTarget(){if(!ME||ME.dead)return;
  if(ME.tgt&&!ME.tgt.dead&&game.time-manualTgtT<8&&ME.tgt.pos.distanceTo(ME.pos)<32)return;
  const fx=Math.sin(camYaw),fz=Math.cos(camYaw);let best=null,bs=1e9;
  for(const o of FS){if(ally(o,ME)||o.dead)continue;const dx=o.pos.x-ME.pos.x,dz=o.pos.z-ME.pos.z,d=Math.hypot(dx,dz)+(o.downed?5:0);if(d>20)continue;
    const facing=(dx*fx+dz*fz)/(d||1);const s=d+(1-facing)*5;if(s<bs){bs=s;best=o;}}
  if(ME.tgt&&!ME.tgt.dead){const d=ME.tgt.pos.distanceTo(ME.pos);if(d<20&&best&&best!==ME.tgt&&d<bs+2)best=ME.tgt;}
  ME.tgt=best;}
let netPressAcc=0;
// moves live on the number keys; add a slot here for each new move (Q/E stay as shortcuts)
const MOVE_SLOTS=[
  {keys:['Digit1','Numpad1','KeyU'],act:'special',hold:'S',kind:'sp'},
  {keys:['Digit2','Numpad2'],act:'spB',hold:'S',kind:'spB'},
  {keys:['Digit3','Numpad3'],act:'x1',kind:'x1'},
  {keys:['Digit4','Numpad4'],act:'x2',kind:'x2'}];
// the ultimate stays on Q (E and I work too); hold back or use it in the air for the alternate ultimate
const ULT_KEYS=['KeyQ','KeyE','KeyI'];
function slotName(h,kind){const sp=h.special,V=SPECVAR[sp]||{},A=ALTULT[KIT(h,'alt')],C=h.cab;
  if(kind==='sp')return h.spName||spLabel(sp);if(kind==='spB')return sp==='cab'&&C?(C.spAlt||C.sp).name:(V.alt?V.alt[0]:(h.spName||spLabel(sp)));
  if(kind==='x1'||kind==='x2'){const X=xMoves(h)[kind==='x1'?0:1];return X?X.name:'';}return h.ultName;}
function buildSlots(){const el=$('slots');if(!el)return;if(!ME){el.innerHTML='';return;}
  el.innerHTML=MOVE_SLOTS.map((s,i)=>`<div class="slot ${s.kind}" data-k="${s.kind}"><b>${i+1}</b><span>${esc(slotName(ME.hero,s.kind))}</span><i></i></div>`).join('');}
function updateSlots(F){const el=$('slots');if(!el||!el.children.length)return;for(const d of el.children){const k=d.dataset.k,sp=k==='sp'||k==='spB',xi=k==='x1'?0:1,xc=(F.xcd||[0,0])[xi];
  const ready=!(F.eraseT>0)&&(sp?F.specCD<=0:xc<=0);d.classList.toggle('ready',ready);d.classList.toggle('busy',F.state==='special'&&(sp?!F.xmOn:F.xmOn&&F.xmA===xMoves(F.hero)[xi]));
  d.querySelector('i').style.width=(sp?(F.specCD>0?100-F.specCD/((F.hero.specCD||2.2))*100:100):(xc>0?100-xc/XM_CD[xi]*100:100))+'%';}}
function playerIntent(dt){if(!ME)return;const I=ME.intent,k=keys;
  if(k.ArrowLeft){camYaw+=2.4*dt;lastMouseT=game.time;}if(k.ArrowRight){camYaw-=2.4*dt;lastMouseT=game.time;}
  if(k.ArrowUp)camPitch=clamp(camPitch-1.2*dt,-.25,1.1);if(k.ArrowDown)camPitch=clamp(camPitch+1.2*dt,-.25,1.1);
  const fx=Math.sin(camYaw),fz=Math.cos(camYaw);const mz=(k.KeyW?1:0)-(k.KeyS?1:0),mx=(k.KeyD?1:0)-(k.KeyA?1:0);
  I.wx=fx*mz-fz*mx;I.wz=fz*mz+fx*mx;const l=Math.hypot(I.wx,I.wz);if(l>1){I.wx/=l;I.wz/=l;}
  I.aim=camYaw;I.block=!!(k.KeyF||k.KeyL);I.revive=!!k.KeyR;I.sprint=!!(k.ShiftLeft||k.ShiftRight);
  I.light=pressed.has('KeyJ')||pressed.has('MouseL');I.heavy=pressed.has('KeyK')||pressed.has('MouseR');
  I.jump=pressed.has('Space');I.dash=pressed.has('ShiftLeft')||pressed.has('ShiftRight');I.hH=!!(k.KeyK||k.MouseR);
  I.special=I.spB=I.ult=I.ultB=I.x1=I.x2=false;I.hS=I.hU=false;
  for(const s of MOVE_SLOTS){const ks=s.keys;if(ks.some(x=>pressed.has(x)))I[s.act]=true;if(s.hold==='S'&&ks.some(x=>k[x]))I.hS=true;}
  if(ULT_KEYS.some(x=>pressed.has(x)))I.ult=true;if(ULT_KEYS.some(x=>k[x]))I.hU=true;
  if(paused||ME.dead){Object.assign(I,blankIntent());I.aim=camYaw;I.hH=I.hS=I.hU=false;if(ME.dead&&!paused&&ME.dsT>0&&ULT_KEYS.some(x=>pressed.has(x)))I.ult=true;}
  if(window.__forceMv){I.wx=window.__forceMv[0];I.wz=window.__forceMv[1];if(window.__forceMv[2]){I.jump=true;window.__forceMv[2]=0;}}
  netPressAcc|=pressBits(I);
}
const camLook=new V3(0,1,0),camT=new V3(),lookT=new V3();
function updateCamera(dt){
  if(window.__cineOn&&!inMatch())return;   // story cutscene is directing the camera
  if(!inMatch()){const a=game.time*.05;camT.set(Math.cos(a)*70,32+Math.sin(game.time*.2)*4,Math.sin(a)*70);lookT.set(0,6,0);}
  else{
    const F=ME&&!ME.dead?ME:specTarget();
    if(game.cine&&game.cine.f&&!game.cine.f.dead){const f=game.cine.f;const ang=f.face+2.4+game.cine.t*.7;camT.set(f.pos.x+Math.sin(ang)*4.4,f.pos.y+1.5,f.pos.z+Math.cos(ang)*4.4);lookT.set(f.pos.x,f.pos.y+1.3,f.pos.z);}
    else if(game.phase==='over'&&game.winner){const f=game.winner;const ang=f.face+.6+game.time*.25;camT.set(f.pos.x+Math.sin(ang)*5.5,f.pos.y+2,f.pos.z+Math.cos(ang)*5.5);lookT.set(f.pos.x,f.pos.y+1.2,f.pos.z);}
    else if(F){
      if(F===ME){const idle=game.time-lastMouseT>1.1;
        if(ME.tgt&&!ME.tgt.dead&&ME.locked&&idle){const ty=Math.atan2(ME.tgt.pos.x-ME.pos.x,ME.tgt.pos.z-ME.pos.z);camYaw=angLerp(camYaw,ty,Math.min(1,2.6*dt));}
        else if(idle&&Math.hypot(ME.vel.x,ME.vel.z)>6&&!ME.locked){camYaw=angLerp(camYaw,Math.atan2(ME.vel.x,ME.vel.z),Math.min(1,1.2*dt));}}
      else{camYaw=angLerp(camYaw,F.face,Math.min(1,1.5*dt));}
      const dist=(F.sprinting?7.6:6.6),cp=Math.cos(camPitch),sp=Math.sin(camPitch);
      const hx=F.pos.x,hy=F.pos.y+1.75,hz=F.pos.z;
      camT.set(hx-Math.sin(camYaw)*cp*dist,hy+sp*dist,hz-Math.cos(camYaw)*cp*dist);
      if(camT.y<.4)camT.y=.4;
      const head=TMP2.set(hx,hy,hz);const k=rayBld(head,camT,16);if(k<1)camT.lerpVectors(head,camT,Math.max(.12,k*.92));
      lookT.set(hx+Math.sin(camYaw)*2.2,hy-.2,hz+Math.cos(camYaw)*2.2);
      if(F.locked&&F.tgt&&!F.tgt.dead){lookT.lerp(TMP.set(F.tgt.pos.x,F.tgt.pos.y+1.2,F.tgt.pos.z),.25);}
    }
  }
  if(!isFinite(camT.x+camT.y+camT.z))camT.set(60,40,60);if(!isFinite(lookT.x+lookT.y+lookT.z))lookT.set(0,1,0);
  if(!isFinite(camera.position.x+camera.position.y+camera.position.z))camera.position.copy(camT);if(!isFinite(camLook.x+camLook.y+camLook.z))camLook.copy(lookT);
  const k=1-Math.exp(-(game.cine?9:16)*dt);camera.position.lerp(camT,k);camLook.lerp(lookT,1-Math.exp(-18*dt));
  camera.lookAt(camLook);
  if(shakeAmt>0){camera.position.x+=rand(-1,1)*shakeAmt*.3;camera.position.y+=rand(-1,1)*shakeAmt*.3;camera.rotation.z+=rand(-1,1)*shakeAmt*.02;shakeAmt=Math.max(0,shakeAmt-dt*2.8);}
  const fov=game.cine?46:(ME&&ME.sprinting?68:(ME&&ME.state==='dash'?70:60));if(Math.abs(camera.fov-fov)>.05){camera.fov=lerp(camera.fov,fov,Math.min(1,dt*6));camera.updateProjectionMatrix();}
}

/* ================= HUD ================= */
const mmCtx=$('mini').getContext('2d');let hudT=0;
function updateHUD(dt){
  if(!inMatch())return;
  const F=ME;
  if(F){F.dhp=F.dhp>F.hp?Math.max(F.hp,F.dhp-dt*25):F.hp;$('meH').style.width=Math.max(0,F.hp)+'%';$('meH').classList.toggle('low',F.hp<30);$('meD').style.width=Math.max(0,F.dhp)+'%';
    $('meM').style.width=F.meter+'%';$('meMB').classList.toggle('full',F.meter>=100);{const bk=F.brk||0;$('meBK').style.width=bk+'%';$('meBB').classList.toggle('full',bk>=100);$('meBKk').classList.toggle('on',bk>=100&&BRK_STATES.indexOf(F.state)>=0);}
    updateSlots(F);$('meCD').textContent=(F.meter>=100?'ULTIMATE READY [Q] · ':'')+(F.stolenT>0?'STOLEN: '+SPNAME[F.stolen]+' '+F.stolenT.toFixed(0)+'s · ':'')+
      (F.bladeT>0?'BLADE FORM '+F.bladeT.toFixed(1)+'s':(F.specCD>0?'SPECIAL '+F.specCD.toFixed(1)+'s':'SPECIAL READY [1]'))+(F.decay>0?' · DECAY x'+F.decay:'');
    $('storm').style.opacity=!F.dead&&outsideZone(F.pos)&&game.phase==='fight'?1:0;
    const mt=game.mode==='duos'?mates(F)[0]:null;$('mate').style.display=mt?'block':'none';
    if(mt){$('mtN').innerHTML=`<span style="color:${mt.hero.css}">${mt.hero.name}</span> · ${esc(mt.name)}${mt.dead?' · OUT':mt.downed?' · DOWNED':''}`;
      $('mtH').style.width=(mt.dead?0:mt.downed?mt.bleed:mt.hp)+'%';$('mtH').style.background=mt.downed?'linear-gradient(90deg,#ff3b3b,#ff8a6a)':'';}
    let rp='';
    if(F.downed){rp=`<b>KNOCKED DOWN</b><div class="rbar"><div style="width:${F.bleed}%;background:#ff4a5a"></div></div>`+(F.revT>0?`<div>REVIVING… </div><div class="rbar"><div style="width:${F.revT/3*100}%"></div></div>`:'<div>Crawl to your teammate</div>');}
    else if(mt&&mt.downed&&!mt.dead&&mt.pos.distanceTo(F.pos)<2.6){rp=`<b>HOLD R TO REVIVE ${esc(mt.name.toUpperCase())}</b><div class="rbar"><div style="width:${mt.revT/3*100}%"></div></div>`;}
    else if(mt&&mt.downed&&!mt.dead){rp=`<div>${esc(mt.name.toUpperCase())} IS DOWN · ${Math.round(mt.pos.distanceTo(F.pos))} m</div>`;}
    $('revp').innerHTML=rp;$('revp').style.display=rp?'block':'none';}
  const T=F&&!F.dead?F.tgt:null;
  if(T&&!T.dead&&T.pos.distanceTo(F.pos)<32){$('tgt').style.display='block';$('tgN').innerHTML=`<span style="color:${T.hero.css}">${T.hero.name}</span> · ${esc(T.name)}`;$('tgH').style.width=Math.max(0,T.hp)+'%';}
  else $('tgt').style.display='none';
  if(game.story){$('alive').textContent=FS.filter(f=>f.team===1&&!f.dead).length+' ENEMIES LEFT';$('zoneT')&&($('zoneT').textContent='');}else if(game.rules==='arena')arenaHUD(F);else{$('alive').textContent=(game.mode==='duos'?aliveTeams().size+' TEAMS':aliveList().length+' ALIVE')+(F?' · '+F.kills+' KO':'');
  $('zinfo').textContent=game.phase==='countdown'?'DROPPING IN…':zoneLabel();}updateMarks();
  if(comboT>0){comboT-=dt;if(comboT<=0)$('combo').style.opacity=0;}
  if(F&&F.dead&&game.phase!=='over'&&game.rules!=='arena'&&!game.story){const s=specTarget();$('specT').textContent=`ELIMINATED · #${F.place} — SPECTATING ${s?s.name.toUpperCase():''}`;}
  hudT-=dt;if(hudT>0)return;hudT=.08;
  const g=mmCtx,P=x=>(x+MAPH)*MS;g.drawImage(mmBase,0,0);
  if(!noStorm()){g.save();g.fillStyle='rgba(120,40,200,.35)';g.beginPath();g.rect(0,0,MM,MM);g.arc(P(ZONE.cx),P(ZONE.cz),ZONE.r*MS,0,7,true);g.fill('evenodd');g.restore();
  g.strokeStyle='#c58bff';g.lineWidth=3;g.beginPath();g.arc(P(ZONE.cx),P(ZONE.cz),ZONE.r*MS,0,7);g.stroke();
  g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();g.arc(P(ZONE.tx),P(ZONE.tz),ZONE.tr*MS,0,7);g.stroke();g.setLineDash([]);}
  ORBS.forEach(o=>{g.fillStyle=o.type==='hp'?'#3dff8a':'#ffd23f';g.fillRect(P(o.x)-3,P(o.z)-3,6,6);});
  const C=F&&!F.dead?F:specTarget();
  FS.forEach(o=>{if(o.dead||o===C)return;const fr=C&&ally(o,C);if(!fr&&C&&o.pos.distanceTo(C.pos)>45)return;g.fillStyle=fr?'#4fd2ff':(o===(C&&C.tgt)?'#ffd23f':'#ff4a5a');g.beginPath();g.arc(P(o.pos.x),P(o.pos.z),fr?7:5,0,7);g.fill();if(fr){g.strokeStyle='#fff';g.lineWidth=2;g.stroke();}});
  if(C){g.save();g.translate(P(C.pos.x),P(C.pos.z));g.rotate(-camYaw+Math.PI);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-11);g.lineTo(7,8);g.lineTo(0,4);g.lineTo(-7,8);g.closePath();g.fill();g.restore();}
}

/* ---- teammate markers ---- */
const MARKS={};
function clearMarks(){for(const k in MARKS){MARKS[k].remove();delete MARKS[k];}}
function updateMarks(){
  const C=ME&&!ME.dead?ME:specTarget();const seen={};
  if(C&&game.mode==='duos')for(const f of FS){if(f===C||f.dead||!ally(f,C))continue;seen[f.id]=1;
    let m=MARKS[f.id];if(!m){m=document.createElement('div');m.className='mark';document.body.appendChild(m);MARKS[f.id]=m;}
    const p=TMP3.set(f.pos.x,f.pos.y+2.35*f.hero.scale,f.pos.z).project(camera);const vis=p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1;
    m.style.display=vis?'block':'none';if(!vis)continue;m.style.left=((p.x+1)/2*innerWidth)+'px';m.style.top=((1-p.y)/2*innerHeight)+'px';
    m.innerHTML=`<div class="mn">${esc(f.name)}</div><div class="md ${f.downed?'dn':''}">${f.downed?'✚':'◆'}</div><div class="mh"><div style="width:${f.downed?f.bleed:f.hp}%;${f.downed?'background:#ff4a5a':''}"></div></div>`;}
  for(const k in MARKS)if(!seen[k]){MARKS[k].remove();delete MARKS[k];}
}
function teamSpawns(roster){const teams=[...new Set(roster.map(r=>r.team))];const pts=spawnPoints(teams.length);
  return roster.map(r=>{const p=pts[teams.indexOf(r.team)];const k=roster.filter(x=>x.team===r.team).indexOf(r);return [p[0]+(k?2.2:-1.1),p[1]+(k?1.2:0)];});}
