/* Menus, screens and the main loop (step) */
/* ================= SCREENS ================= */
game.mode=store.get('surge.mode')==='duos'?'duos':'solo';game.teamN=3;
let mySel=(()=>{const v=+(store.get('surge.hero')||0)||0;return v>=CUST0&&CSPECS[v-CUST0]?v:clamp(v,0,HEROES.length-1);})(),paused=false,setupMode='off';
const BOTN=['Vex','Kairo','Nyx','Brakk','Sola','Juno','Ryze','Mako','Tess','Orin','Pike','Zara','Dax','Lumen'];
function botName(){return pick(BOTN)+' (BOT)';}
function myName(){return cleanName($('nameIn').value||store.get('surge.name')||'Player');}
function showScreen(id){['title','setup','lobby','pause','result','msg','shop','missions','gmodes','settings','prog','credits'].forEach(s=>$(s).classList.toggle('on',s===id));}
function showMsg(t){$('msgT').textContent=t;showScreen('msg');}
/* ---- fighter select: rendered portraits + 3D pedestal ---- */
const PV={r:null,scene:null,cam:null,rigs:{},idx:0,ped:null,beams:[],portraits:{},filter:'all'};
function initPreview(){
  try{PV.r=new THREE.WebGLRenderer({canvas:$('pv'),antialias:true,alpha:true});}catch(e){PV.r=null;return;}
  PV.r.setPixelRatio(Math.min(devicePixelRatio,1.75));PV.r.outputEncoding=THREE.sRGBEncoding;PV.r.toneMapping=THREE.ACESFilmicToneMapping;PV.r.toneMappingExposure=1.15;PV.r.setClearColor(0,0);
  const S=PV.scene=new THREE.Scene();PV.cam=new THREE.PerspectiveCamera(28,1,.1,100);
  try{if(THREE.RoomEnvironment){const pm=new THREE.PMREMGenerator(PV.r);window.__PVENV=pm.fromScene(new THREE.RoomEnvironment(),.04).texture;pm.dispose();}}catch(e){}
  S.add(new THREE.HemisphereLight(0xbfe8ff,0x0a1a3a,.9));
  const key=new THREE.SpotLight(0xffffff,2.4,30,.5,.6);key.position.set(2.5,7,5);key.target.position.set(0,1,0);S.add(key,key.target);
  const rimL=new THREE.DirectionalLight(0x6fd8ff,1.6);rimL.position.set(-4,3,-4);S.add(rimL);
  const rimR=new THREE.DirectionalLight(0x9fb8ff,1);rimR.position.set(4,2,-3);S.add(rimR);
  const pm=new THREE.MeshPhysicalMaterial({color:0xc8d4e8,metalness:.6,roughness:.25,clearcoat:1});
  const ped=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.38,.22,96),pm);base.position.y=-.11;ped.add(base);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.04,96),new THREE.MeshPhysicalMaterial({color:0xe8f6ff,metalness:.2,roughness:.15,clearcoat:1}));top.position.y=.01;ped.add(top);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.2,.025,12,128),new THREE.MeshBasicMaterial({color:0x7fe8ff}));ring.rotation.x=Math.PI/2;ring.position.y=.02;ped.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.36,.02,12,128),new THREE.MeshBasicMaterial({color:0x2fc6ff}));ring2.rotation.x=Math.PI/2;ring2.position.y=-.2;ped.add(ring2);
  for(const x of [-1,1]){const g=new THREE.ConeGeometry(.9,4.5,48,1,true);g.translate(0,2.25,0);const b=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x7fe8ff,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    b.position.set(x*.9,-.2,-.4);b.rotation.z=-x*.32;ped.add(b);PV.beams.push(b);}
  const glow=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({color:0x2fc6ff,transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=-.21;ped.add(glow);
  S.add(ped);PV.ped=ped;
}
// armor on/off (the fighter-select toggle): 'h'-prefixed keys hold the unarmored preview rigs
let ARMOR_OFF=store.get('surge.armor')==='off';   // armored suits are the default; ARMOR OFF switches to the costume outfits
function pvKey(i,hm){return (hm===undefined?ARMOR_OFF:hm)?'h'+i:i;}
function pvRig(i,hm){if(hm===undefined)hm=ARMOR_OFF;const k=pvKey(i,hm);if(PV.rigs[k])return PV.rigs[k];let h=i<CUST0?skinHero(heroAt(i),(INV.eq.skins||{})[HEROES[i].id]):heroAt(i);h=hm?Object.assign({},h,{human:true}):Object.assign({},h,{armor:true});
  const R=buildRig(h,PV.scene);PV.scene.add(R.root);R.root.visible=false;R.P=Object.assign({},POSES.showcase);PV.rigs[k]=R;return R;}
function poseRig(R,P,t){
  R.hips.position.y=(R.hipY||.95)+P.hy+Math.sin(t*2.2)*.012;R.hips.rotation.x=P.hx;R.spine.rotation.set(P.sx+Math.sin(t*2.2)*.02,P.sy,P.sz);R.head.rotation.x=P.hd;
  R.lS.rotation.set(P.lSx,0,P.lSz);R.lE.rotation.x=P.lE;R.rS.rotation.set(P.rSx,0,P.rSz);R.rE.rotation.x=P.rE;
  R.lH.rotation.set(P.lHx,0,P.lHz);R.lK.rotation.x=P.lK;R.rH.rotation.set(P.rHx,0,P.rHz);R.rK.rotation.x=P.rK;
  if(R.cloth)updateCloth(R.cloth,t,1.2);
  if(R.wings)R.wings.forEach((w,i)=>{w.rotation.y=(i?-1:1)*(.25+Math.sin(t*2)*.08);});
  if(R.orbiters)R.orbiters.forEach((o,k)=>{const a=t*1.6+k*Math.PI/2;o.position.set(Math.cos(a)*.48,1.05+Math.sin(t*2+k)*.15,Math.sin(a)*.48);});
  if(R.beast){R.beast.group.position.set(0,.95+Math.sin(t*2)*.05,-.42);R.beast.head.rotation.y=Math.sin(t*1.2)*.3;R.beast.jaw.rotation.x=.15+Math.sin(t*1.7)*.1;}
  if(R.spikes)R.spikes.forEach(c=>c.visible=true);
}
function renderPortrait(i){if(!PV.r)return;const cvs=$('pv');const h=heroAt(i),R=pvRig(i);Object.values(PV.rigs).forEach(r=>r.root.visible=false);R.root.visible=true;PV.ped.visible=false;
  poseRig(R,POSES.showcase,0);R.root.rotation.y=.35;R.root.position.set(0,0,0);
  const sc=h.scale,hy=1.8*sc;PV.cam.aspect=.82;PV.cam.fov=26;PV.cam.updateProjectionMatrix();PV.cam.position.set(.22*sc,hy+.06,1.35*sc);PV.cam.lookAt(0,hy-.1,0);
  PV.r.setSize(205,250,false);PV.r.render(PV.scene,PV.cam);try{PV.portraits[i]=cvs.toDataURL('image/png');}catch(e){}
  Object.values(PV.rigs).forEach(r=>r.root.visible=false);const cur=PV.rigs[pvKey(PV.idx)];if(cur)cur.root.visible=true;R.root.rotation.y=-.5;
  PV.r.setSize(cvs.clientWidth||400,cvs.clientHeight||400,false);PV.ped.visible=true;}
function makePortraits(){
  if(!PV.r)return;let i=0;const ids=HEROES.map((h,k)=>k).concat(CSPECS.map((s,k)=>CUST0+k));
  const next=()=>{if(i>=ids.length){buildCards();return;}renderPortrait(ids[i]);
    if($('setup').classList.contains('on')&&i%4===3)buildCards();i++;setTimeout(next,0);};
  next();
}
function previewHero(i){PV.idx=i;const h=heroAt(i);
  $('pvDiff').textContent=h.diff;$('pvName').textContent=h.name;
  $('pvTags').innerHTML=`<span class="tag ${h.faction==='hero'?'h':'v'}">${h.faction==='hero'?'HERO':'VILLAIN'}</span><span class="tag">${h.cls}</span><span class="tag">${h.power}</span>`;
  $('pvTags2').innerHTML=h.tags.map(t=>`<span class="tag o">${t}</span>`).join('')+`<span class="tag o">Ult: ${h.ultName}</span>`;
  $('pvDesc').textContent=h.desc;$('pvDesc').style.setProperty('--c',h.css);$('pvMoves').innerHTML=movesHTML(h);$('pvEdit').style.display='none';if(!PV.mvb){PV.mvb=1;$('pvMvBtn').onclick=()=>{const pi=document.querySelector('.pvinfo');pi.classList.toggle('mv');$('pvMvBtn').textContent=pi.classList.contains('mv')?'ABOUT':'MOVE LIST';AU.ui();};}$('pvMoves').style.setProperty('--c',h.css);
  if(PV.r){const R=pvRig(i,ARMOR_OFF);Object.values(PV.rigs).forEach(r=>r.root.visible=false);R.root.visible=true;R.root.rotation.y=-.5;}
  const ab=$('armorBtn');if(ab){ab.textContent=ARMOR_OFF?'🧍 ARMOR: OFF':'🛡 ARMOR: ON';ab.classList.toggle('on',!ARMOR_OFF);ab.style.display=i<CUST0?'':'none';}
}
function renderPreview(dt){
  if(!PV.r||!$('setup').classList.contains('on'))return;const cvs=$('pv');const w=cvs.clientWidth,h=cvs.clientHeight;if(!w||!h)return;
  if(cvs.width!==Math.floor(w*PV.r.getPixelRatio())||cvs.height!==Math.floor(h*PV.r.getPixelRatio()))PV.r.setSize(w,h,false);
  const R=PV.rigs[pvKey(PV.idx)];if(!R)return;PV.ped.visible=true;const t=game.time,sc=heroAt(PV.idx).scale;
  R.root.rotation.y+=dt*.35;R.root.position.y=.02;poseRig(R,R.P,t);PV.ped.rotation.y-=dt*.1;PV.beams.forEach((b,k)=>b.material.opacity=.07+Math.sin(t*1.5+k)*.025);
  PV.cam.aspect=w/h;PV.cam.fov=w/h>1?26:34;PV.cam.updateProjectionMatrix();const off=w/h>1.05?-.55:0;
  PV.cam.position.set(off,1.35*sc,6.8);PV.cam.lookAt(off,1.0*sc,0);PV.r.render(PV.scene,PV.cam);
}
function buildCards(){
  const f=$('filters');f.innerHTML='';[['all','ALL'],['hero','HEROES'],['villain','VILLAINS'],['vigilante','VIGILANTES']].forEach(([k,n])=>{const b=document.createElement('span');b.textContent=n;b.className=PV.filter===k?'sel':'';b.onclick=()=>{PV.filter=k;AU.ui();buildCards();};f.appendChild(b);});
  const g=$('grid');g.innerHTML='';
  const ids=HEROES.map((h,k)=>k).concat(CSPECS.map((s,k)=>CUST0+k));
  ids.forEach(i=>{const h=heroAt(i),cu=i>=CUST0;if(PV.filter==='custom'?!cu:PV.filter==='vigilante'?!h.vig:(PV.filter!=='all'&&h.faction!==PV.filter))return;const t=document.createElement('div');t.className='tile'+(h.faction==='villain'?' vil':'')+(mySel===i?' sel':'');t.style.setProperty('--c',h.css);
    t.innerHTML=(PV.portraits[i]?`<img src="${PV.portraits[i]}" alt="">`:'')+`<div class="fx">${h.faction==='hero'?'★':'☠'}</div><div class="tn">${h.name}</div>${typeof progBadge==='function'?progBadge(i):''}<div class="bar"></div><div class="ck">✔ Selected</div>`+(cu?'<div class="del" title="Delete">✕</div>':'');
    if(cu){const d=t.querySelector('.del');d.onclick=e=>{e.stopPropagation();AU.ui();if(d.dataset.arm){deleteCustom(i);}else{d.dataset.arm=1;d.textContent='DEL?';d.style.width='44px';d.style.background='#c4102a';setTimeout(()=>{d.dataset.arm='';d.textContent='✕';d.style.width='';d.style.background='';},2500);}};}
    t.onmouseenter=()=>previewHero(i);t.onmouseleave=()=>previewHero(mySel);
    t.onclick=()=>{mySel=i;store.set('surge.hero',i);AU.init();AU.ui();buildCards();previewHero(i);};g.appendChild(t);});
  const dd=$('diffs');dd.innerHTML='';['ROOKIE','PRO','LEGEND'].forEach((n,i)=>{const b=document.createElement('div');b.className='chip'+(game.diff===i?' sel':'');b.textContent=n;b.onclick=()=>{game.diff=i;AU.ui();buildCards();};dd.appendChild(b);});
  const md=$('modes');md.innerHTML='';[['solo','SOLO'],['duos','DUOS']].forEach(([k,n])=>{const b=document.createElement('div');b.className='chip'+(game.mode===k?' sel':'');b.textContent=n;b.onclick=()=>{game.mode=k;store.set('surge.mode',k);AU.ui();buildCards();};md.appendChild(b);});
  rulesChips('rules',game.rules,k=>{game.rules=k;store.set('surge.rules',k);buildCards();});$('modeTab').textContent=game.rules==='arena'?'ARENA':game.rules==='raid'?'BOSS RAID':game.rules==='patrol'?'PATROL':'BATTLE ROYALE';
  $('botLbl').textContent=game.mode==='duos'?'RIVAL TEAMS':'BOTS';$('botN').textContent=game.mode==='duos'?Math.min(3,Math.max(1,game.teamN)):game.botN;
}
function openSetup(mode){setupMode=mode;game.phase='menu';$('setupTitle').textContent=mode==='off'?'VS BOTS':mode==='prac'?'PRACTICE':'ONLINE';
  if(mode==='off')game.rules=normRules(store.get('surge.rules'));$('rulesRow').style.display=mode==='off'?'':'none';
  $('offPanel').style.display=mode==='off'?'flex':'none';$('onPanel').style.display=mode==='on'?'flex':'none';$('bGo').style.display=mode!=='on'?'':'none';$('bGo').textContent=mode==='prac'?'START PRACTICE':'DROP IN';netStatus('');
  if(mode==='on'&&NET.local)netStatus('Same-device test mode (#local).');
  $('nameIn').value=store.get('surge.name')||'';buildCards();previewHero(mySel);showScreen('setup');}
$('nameIn').addEventListener('change',()=>store.set('surge.name',myName()));
$('bOnline').onclick=()=>{AU.init();AU.ui();openSetup('on');};
$('bOffline').onclick=()=>{AU.init();AU.ui();openSetup('off');};
$('bBack1').onclick=()=>{AU.ui();netShutdown();showScreen('gmodes');};
$('bDec').onclick=()=>{if(game.mode==='duos')game.teamN=Math.max(1,game.teamN-1);else game.botN=Math.max(1,game.botN-1);buildCards();AU.ui();};
$('bInc').onclick=()=>{if(game.mode==='duos')game.teamN=Math.min(3,game.teamN+1);else game.botN=Math.min(7,game.botN+1);buildCards();AU.ui();};
function startOffline(){store.set('surge.name',myName());netShutdown();NET.role='off';NET.myId=0;
  const roster=[Object.assign({id:0,name:myName(),bot:false,team:0},selEntry())];
  if(game.mode==='duos'){roster.push({id:100,name:botName(),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:0});
    for(let t=1;t<=game.teamN;t++)for(let k=0;k<2;k++)roster.push({id:100+t*2+k,name:botName(),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:t});
    startMatch(roster,teamSpawns(roster),game.diff,'duos');}
  else{for(let i=0;i<game.botN;i++)roster.push({id:100+i,name:botName(),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:1+i});startMatch(roster,spawnPoints(roster.length),game.diff,'solo');}}
$('bGo').onclick=()=>{AU.init();AU.ui();if(setupMode==='prac')startPractice();else startOffline();};
$('bHost').onclick=()=>{AU.init();AU.ui();store.set('surge.name',myName());NET.diff=game.diff;hostStart();};
$('bJoin').onclick=()=>{AU.init();AU.ui();store.set('surge.name',myName());clientJoin($('codeIn').value);};
$('codeIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('bJoin').click();});
function showLobby(){game.phase='lobby';$('hud').classList.remove('on');$('hint').style.display='none';$('spec').style.display='none';showScreen('lobby');renderLobby();}
function renderLobby(){
  $('lbCode').textContent=NET.code;const host=NET.role==='host';
  const duo=NET.mode==='duos';$('lbList').innerHTML=NET.lobby.slice().sort((a,b)=>duo?(a.team-b.team):0).map(p=>{const h=rosterHero(p);const cd=p.cos&&p.cos.card&&p.cos.card!=='none'?`background-image:linear-gradient(90deg,rgba(6,10,28,.85),rgba(6,10,28,.25)),url(${drawCard(p.cos.card,p.name)});background-size:cover`:'';return `<div class="lp" style="--c:${h.css};${cd}">${duo?`<span class="t" style="opacity:1;color:#4fd2ff">TEAM ${p.team+1}</span>`:''}<span class="n">${tagName({cos:p.cos},p.name)}${p.id===NET.myId?' (you)':''}</span><span class="h">${h.name}</span><span class="t">${p.host?'HOST':''}</span></div>`;}).join('')+
    (NET.fill?`<div class="lp" style="--c:#555"><span class="n" style="opacity:.6">+ ${Math.max(0,8-NET.lobby.length)} bots fill the empty slots</span></div>`:'');
  const mh=$('lbHeroes');mh.innerHTML='';HEROES.map((h,k)=>k).concat(CSPECS.map((s,k)=>CUST0+k)).forEach(i=>{const h=heroAt(i);const b=document.createElement('div');b.className='mini'+(i===mySel?' sel':'');b.style.setProperty('--c',h.css);b.textContent=h.name;
    b.onclick=()=>{mySel=i;store.set('surge.hero',i);AU.ui();const se=selEntry();if(host){NET.lobby[0].hero=se.hero;NET.lobby[0].cust=se.cust||null;NET.lobby[0].cos=se.cos;broadcastLobby();}else if(NET.host){NET.host.send(Object.assign({t:'pick'},se));}renderLobby();};mh.appendChild(b);});
  rulesChips('rules2',NET.rules||'br',k=>{if(NET.role!=='host')return;NET.rules=k;store.set('surge.rules',k);broadcastLobby();});
  const m2=$('modes2');m2.innerHTML='';[['solo','SOLO'],['duos','DUOS']].forEach(([k,n])=>{const b=document.createElement('div');b.className='chip'+(NET.mode===k?' sel':'');b.textContent=n;b.onclick=()=>{NET.mode=k;broadcastLobby();AU.ui();};m2.appendChild(b);});
  $('teamRow').style.display=duo?'block':'none';const me=NET.lobby.find(p=>p.id===NET.myId);const tc=$('teamChips');tc.innerHTML='';
  if(duo)for(let t=0;t<4;t++){const n=NET.lobby.filter(p=>p.team===t).length;const b=document.createElement('div');b.className='chip'+(me&&me.team===t?' sel':'');b.textContent=`TEAM ${t+1} (${n}/2)`;
    b.onclick=()=>{if(host){if(n<2||me.team===t){me.team=t;broadcastLobby();}}else if(NET.host)NET.host.send({t:'team',team:t});AU.ui();};tc.appendChild(b);}
  $('lbHost').style.display=host?'flex':'none';$('lbWait').style.display=host?'none':'block';
  const fc=$('fillChips');fc.innerHTML='';[['ON',true],['OFF',false]].forEach(([n,v])=>{const b=document.createElement('div');b.className='chip'+(NET.fill===v?' sel':'');b.textContent=n;b.onclick=()=>{NET.fill=v;broadcastLobby();AU.ui();};fc.appendChild(b);});
  const d2=$('diffs2');d2.innerHTML='';['ROOKIE','PRO','LEGEND'].forEach((n,i)=>{const b=document.createElement('div');b.className='chip'+(NET.diff===i?' sel':'');b.textContent=n;b.onclick=()=>{NET.diff=i;broadcastLobby();AU.ui();};d2.appendChild(b);});
  $('bStartM').disabled=!NET.fill&&NET.lobby.length<2;
}
$('lbCode').onclick=()=>{try{navigator.clipboard.writeText(NET.code).then(()=>announceSmall('CODE COPIED'),()=>{});}catch(e){}};
$('bStartM').onclick=()=>{AU.ui();hostStartMatch();};
$('bLeave').onclick=()=>{AU.ui();netShutdown();openSetup('on');};
function togglePause(){if(game.phase==='over')return;paused=!paused;$('pauseNote').textContent=NET.role==='off'?'':'Online matches keep running while this menu is open.';showScreen(paused?'pause':null);
  if(paused&&document.pointerLockElement)document.exitPointerLock();}
function endMatchCleanup(){emitEv('matchEnd');if(window.__story)__story.STG.on=false;$('bossBar').classList.remove('on');if(PR.on)endPractice();paused=false;FS.forEach(f=>f.dispose());FS=[];AIS=[];ME=null;clearProjs();clearOrbs();resetProps();game.cine=null;
  $('hud').classList.remove('on');$('hint').style.display='none';$('spec').style.display='none';$('storm').style.opacity=0;AU.stopMusic();AU.stopAmb();CUTS.length=0;TINT.target=0;if(document.pointerLockElement)document.exitPointerLock();}
function leaveToTitle(){endMatchCleanup();game.phase='menu';showScreen('title');}
function leaveMatch(){AU.ui();netShutdown();leaveToTitle();}
$('bResume').onclick=()=>{togglePause();};
$('bQuit').onclick=leaveMatch;$('bSpecLeave').onclick=leaveMatch;
$('bAgain').onclick=()=>{AU.ui();if(NET.role==='off'){endMatchCleanup();startOffline();}else if(NET.role==='host'){endMatchCleanup();showLobby();broadcastLobby();}};
$('bMenu').onclick=leaveMatch;
$('bMsgOk').onclick=()=>{AU.ui();showScreen('title');};

/* ================= LOOP ================= */
const clock=new THREE.Clock();let tgtT=0;
let lastStep=performance.now();
function loop(){requestAnimationFrame(loop);step(true);}
// keeps the host's match running while its tab is in the background (browsers pause requestAnimationFrame there)
try{const wb=new Blob(['setInterval(()=>postMessage(0),33)'],{type:'text/javascript'});const tw=new Worker(URL.createObjectURL(wb));
  tw.onmessage=()=>{if(document.hidden&&inMatch()&&NET.role!=='off')step(false);};}catch(e){}
function step(draw){
  const now=performance.now();const rdt=Math.min((now-lastStep)/1000,.05);lastStep=now;if(rdt<=0)return;game.time+=rdt;
  if(game.slowT>0){game.slowT-=rdt;game.timeScale=game.slowT>0?.3:1;}
  if(game.cine){game.cine.t+=rdt;if(game.cine.t>1.1)game.cine=null;}
  let dt=rdt*game.timeScale;if(hitStopT>0){hitStopT-=rdt;dt*=.08;}
  emitEv('frame',rdt);emitEv('input',rdt);
  if(inMatch()){
    if(game.phase==='countdown'){if(NET.role!=='client'){game.cdT-=rdt;if(game.cdT<=0){game.phase='fight';announce('FIGHT!','#ffd23f');AU.scale=1;AU.boom(false);}}
      const n=Math.ceil(game.cdT);if(n!==game.lastCd&&n>0&&n<=3){game.lastCd=n;announce(String(n));AU.scale=1;AU.bell();}}
    playerIntent(rdt);emitEv('intent',rdt);tgtT-=rdt;if(tgtT<=0){tgtT=.25;autoTarget();}
    if(NET.role!=='client')AIS.forEach(a=>a.think(rdt));
    for(const f of FS){
      if(f!==ME&&(NET.role==='client'||!f.isBot)){applyBits(f.intent,f.netPress);f.netPress=0;}
      if(NET.role==='host')f.sentPress=(f.sentPress|0)|pressBits(f.intent);
    }
    for(const f of FS)f.update(dt);
    updateProjs(dt);updateCab(dt);updateMHA(dt);arenaTick(dt);arenaRegen(dt);storyTick(dt);emitEv('tick',dt);updatePets(dt);if(game.practice)practiceTick(rdt);
    if(game.phase==='fight'&&!game.practice){
      zoneUpdate(dt);
      if(NET.role!=='client'){game.matchT+=dt;orbsHost(dt);if(game.mode==='duos')teamTick(dt);
        for(const f of FS){if(f.dead||f.downed||!outsideZone(f.pos))continue;f.hp-=ZONE.dps*dt;if(Math.random()<.2)burst(ADD,f.chest(TMP2),1,{colors:[0xb57bff,0xffffff],speed:1,life:.4,size:.3,bright:1.6,rad:.5});
          if(f.hp<=0){const k=f.lastHitBy&&!f.lastHitBy.dead&&game.time-f.lastHitT<6?f.lastHitBy:null;killFighter(f,k,null);}}}
    }
    orbsAnimate();netTick(rdt);
  }
  pressed.clear();
  updateFX(rdt*game.timeScale);updateScathe(rdt*game.timeScale);if(window.__cineOn&&!inMatch())cineUpdate(rdt);
  TINT.k=lerp(TINT.k,TINT.target,1-Math.exp(-3*rdt));TINT.target=0;sky.material.uniforms.tint.value=TINT.k;scene.fog.color.copy(FOG0).lerp(FOGR,TINT.k*.7);sun.color.copy(SUN0).lerp(SUNR,TINT.k*.8);
  if(PATS.waves)PATS.waves.offset.y-=rdt*.12;if(PATS.circuit)PATS.circuit.offset.x+=rdt*.04;if(PATS.veins)PATS.veins.offset.y+=rdt*.03;
  if(inMatch()&&ME&&!ME.dead&&!noStorm()){const dz=Math.abs(ZONE.r-Math.hypot(ME.pos.x-ZONE.cx,ME.pos.z-ZONE.cz));AU.zoneHum(clamp(1-dz/14,0,1));}else AU.zoneHum(0);
  AU.intensity=inMatch()?clamp(ZONE.pi/4+(game.phase==='fight'?.15:0),0,1):0;
  if(GFX.high&&Math.random()<.6){const a=rand(0,6.28),r=rand(2,16);ADD.spawn(camera.position.x+Math.cos(a)*r,rand(.5,6),camera.position.z+Math.sin(a)*r,rand(-.2,.2),rand(-.05,.15),rand(-.2,.2),.32,.24,.16,rand(3,5),.07,.07,0,0);}
  AU.pan=0;AU.scale=1;
  zoneMesh.visible=zoneNext.visible=inMatch()&&!noStorm();
  if(inMatch()){zoneMesh.position.set(ZONE.cx,35,ZONE.cz);zoneMesh.scale.set(Math.max(.5,ZONE.r),1,Math.max(.5,ZONE.r));zoneMat.uniforms.t.value=game.time;
    zoneNext.position.set(ZONE.tx,.15,ZONE.tz);zoneNext.scale.setScalar(Math.max(.5,ZONE.tr));}
  walls.forEach(w=>{w.material.opacity=lerp(w.material.opacity,.3,Math.min(1,rdt*2));});
  holoT.offset.x+=rdt*.05;holoMats.forEach(m=>m.opacity=.85+Math.sin(game.time*7)*.05);
  blinkers.forEach(([l,o])=>{l.visible=Math.sin(game.time*2+o)>.6;});
  const c=(ME&&!ME.dead)?ME.pos:camLook;sun.position.set(c.x+sunDir.x*90,sunDir.y*90,c.z+sunDir.z*90);sun.target.position.set(c.x,0,c.z);
  if(!draw)return;
  updateCamera(rdt);updateHUD(rdt);updateTags();if(!window.__norender){render();renderPreview(rdt);}
}
function render(){if(window.FINAL){FINAL.uniforms.time.value=game.time;const sp=TMP3.copy(sunDir).multiplyScalar(600).add(camera.position).project(camera);
  const v=(sp.z<1&&Math.abs(sp.x)<1.4&&Math.abs(sp.y)<1.4)?clamp(1-Math.max(Math.abs(sp.x),Math.abs(sp.y))/1.4,0,1):0;FINAL.uniforms.sunUV.value.set((sp.x+1)/2,(sp.y+1)/2);FINAL.uniforms.sunVis.value=GFX.high?v:0;}if(window.__ctxLost)return;if(composer){try{composer.render();}catch(e){console.warn('post-processing failed, using direct render',e);composer=null;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.render(scene,camera);}}else renderer.render(scene,camera);}
window.applyGfxLow=()=>{applyGfx(false);buildGfx();};
function buildGfx(){const g=$('gfxChips');g.innerHTML='';[['HIGH',true],['PERFORMANCE',false]].forEach(([n,v])=>{const b=document.createElement('div');b.className='chip'+(GFX.high===v?' sel':'');b.textContent=n;
  b.onclick=()=>{if(GFX.high===v)return;store.set('surge.gfx',v?'high':'low');AU.ui();applyGfx(v);buildGfx();};g.appendChild(b);});}
function applyGfx(v){GFX.high=v;renderer.setPixelRatio(Math.min(devicePixelRatio,v?1.75:1));const ms=v?Math.min(4096,renderer.capabilities.maxTextureSize):2048;
  sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}lampConeMat.visible=v;dispatchEvent(new Event('resize'));}
window.__SND=SND;window.__AU=AU;window.__pshot=(i,rot,pose)=>{if(!PV.r)return '';const cvs=$('pv');const h=heroAt(i),R=pvRig(i);Object.values(PV.rigs).forEach(r=>r.root.visible=false);R.root.visible=true;PV.ped.visible=false;
  poseRig(R,POSES[pose||'showcase'],0);R.root.rotation.y=rot||0;R.root.position.set(0,0,0);const sc=h.scale;PV.cam.aspect=.75;PV.cam.fov=30;PV.cam.updateProjectionMatrix();PV.cam.position.set(0,1.1*sc,4.6*sc);PV.cam.lookAt(0,1.0*sc,0);
  PV.r.setSize(360,480,false);PV.r.render(PV.scene,PV.cam);const u=cvs.toDataURL('image/png');R.root.visible=false;PV.ped.visible=true;PV.r.setSize(cvs.clientWidth||400,cvs.clientHeight||400,false);return u;};
window.__dbg={pvcam:()=>PV.cam,au:()=>[AU.live,!!AU.ctx&&AU.ctx.state],applyHit,H:HEROES.map(h=>h.name),g:()=>({FS,ME,game,ZONE,NET,AIS,ORBS,camera,scene,composer,renderer}),
  lum(){render();const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(4);let s=0,n=0;
    for(let i=1;i<8;i++)for(let j=1;j<6;j++){gl.readPixels((w*i/8)|0,(h*j/6)|0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);s+=px[0]+px[1]+px[2];n++;}return s/n/3;}};

// collapse the settings + details over the fighter preview (remembered between visits)
(function(){const R=document.querySelector('.selR'),b=$('menuTog');const set=c=>{R.classList.toggle('collapsed',c);b.textContent=c?'▴ SHOW MENU':'▾ HIDE MENU';store.set('surge.selMenu',c?'hide':'show');};
  set(store.get('surge.selMenu')==='hide');b.onclick=()=>{AU.ui();set(!R.classList.contains('collapsed'));};})();
