/* Online play (PeerJS) */
/* ================= NETWORKING (peer-to-peer, host-authoritative) ================= */
const NET={mode:'solo',role:'off',myId:0,peer:null,host:null,conns:new Map(),code:'',lobby:[],nextId:1,events:[],snapT:0,inT:0,fill:true,diff:1,
  uid:Math.random().toString(36).slice(2,10),local:location.hash==='#local',welcomed:false,bc:null};
function netEvent(e){if(NET.role==='host')NET.events.push(e);}
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}
function cleanName(n){return String(n||'').replace(/[^\w \-.]/g,'').trim().slice(0,14)||'Player';}
const r2=v=>Math.round(v*100)/100;
function netStatus(t){$('status').textContent=t||'';}
function wrapPeerConn(c){return {id:c.peer,raw:c,send:o=>{try{if(c.open)c.send(o);}catch(e){}},close:()=>{try{c.close();}catch(e){}}};}
function netShutdown(){
  try{if(NET.role==='client'&&NET.host)NET.host.send({t:'bye'});}catch(e){}
  try{if(NET.role==='host')NET.conns.forEach(c=>c.send({t:'closed'}));}catch(e){}
  try{if(NET.peer)NET.peer.destroy();}catch(e){}try{if(NET.bc)NET.bc.close();}catch(e){}
  Object.assign(NET,{role:'off',myId:0,peer:null,host:null,conns:new Map(),lobby:[],events:[],welcomed:false,bc:null});
}
function hostStart(){
  netShutdown();NET.role='host';NET.myId=0;NET.nextId=1;NET.code=genCode();
  NET.mode=game.mode;NET.rules=normRules(store.get('surge.rules'));NET.lobby=[Object.assign({id:0,name:myName(),host:true,team:0,cust:null},selEntry())];
  if(NET.local){NET.bc=new BroadcastChannel('surge-'+NET.code);NET.bc.onmessage=e=>{const m=e.data;if(!m||m.to!=='host')return;let c=NET.conns.get(m.from);
      if(!c){c={id:m.from,send:o=>NET.bc.postMessage({from:'host',to:m.from,d:o}),close:()=>{}};NET.conns.set(m.from,c);}hostRecv(c,m.d);};showLobby();return;}
  if(!window.Peer){netStatus('Online play could not load. Check your connection, or host the game on its own web page (see the README).');NET.role='off';return;}
  netStatus('Creating room…');
  let peer;try{peer=new Peer('surgebr-'+NET.code.toLowerCase(),{debug:1});}catch(e){netStatus('Online play is blocked here. Open the game from its own web page to play online.');NET.role='off';return;}
  NET.peer=peer;
  peer.on('open',()=>{netStatus('');showLobby();});
  peer.on('error',e=>{if(e.type==='unavailable-id'){hostStart();}else{netStatus('Network error: '+e.type+'. Online play needs the game opened from its own web page.');}});
  peer.on('connection',c=>{const w=wrapPeerConn(c);NET.conns.set(c.peer,w);c.on('data',d=>hostRecv(w,d));c.on('close',()=>hostDrop(w));c.on('error',()=>hostDrop(w));});
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
}
function clientJoin(code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==5){netStatus('Enter the 5-letter room code.');return;}
  netShutdown();NET.role='client';NET.code=code;NET.welcomed=false;netStatus('Connecting to room '+code+'…');
  const hello=()=>NET.host.send(Object.assign({t:'hello',name:myName()},selEntry()));
  const to=setTimeout(()=>{if(NET.role==='client'&&!NET.welcomed){netShutdown();netStatus('Could not reach room '+code+'. Check the code and that the host is still in the lobby.');}},12000);
  if(NET.local){NET.bc=new BroadcastChannel('surge-'+code);NET.bc.onmessage=e=>{const m=e.data;if(!m||m.to!==NET.uid)return;clientRecv(m.d);};
    NET.host={send:o=>NET.bc.postMessage({from:NET.uid,to:'host',d:o}),close:()=>{}};hello();return;}
  if(!window.Peer){clearTimeout(to);netStatus('Online play could not load here.');NET.role='off';return;}
  let peer;try{peer=new Peer(undefined,{debug:1});}catch(e){clearTimeout(to);netStatus('Online play is blocked here. Open the game from its own web page to play online.');NET.role='off';return;}
  NET.peer=peer;
  peer.on('open',()=>{const c=peer.connect('surgebr-'+code.toLowerCase(),{serialization:'json',reliable:true});NET.host=wrapPeerConn(c);
    c.on('open',hello);c.on('data',clientRecv);c.on('close',hostLost);c.on('error',hostLost);});
  peer.on('error',e=>{clearTimeout(to);if(NET.role!=='client')return;netShutdown();netStatus(e.type==='peer-unavailable'?'Room '+code+' was not found.':'Network error: '+e.type);});
}
function hostLost(){if(NET.role!=='client')return;const wasIn=NET.welcomed;netShutdown();if(wasIn){leaveToTitle();showMsg('The host left, so the match ended.');}}
function hostRecv(c,m){
  if(!m||!m.t)return;
  if(m.t==='hello'){
    if(game.phase!=='lobby'&&game.phase!=='menu'){c.send({t:'busy'});return;}
    if(NET.lobby.length>=8){c.send({t:'full'});return;}
    if(c.pid!==undefined)return;
    const id=NET.nextId++;c.pid=id;NET.lobby.push({id,name:cleanName(m.name),hero:clamp(m.hero|0,0,HEROES.length-1),cust:m.cust?sanitizeSpec(m.cust):null,cos:sanitizeCos(m.cos,(HEROES[m.hero|0]||{}).id),cid:c.id,team:freeTeam()});
    c.send({t:'welcome',id,code:NET.code});broadcastLobby();AU.ui();return;}
  if(m.t==='team'){const L=NET.lobby.find(p=>p.id===c.pid);const t=clamp(m.team|0,0,3);if(L&&(NET.lobby.filter(p=>p.team===t).length<2)){L.team=t;broadcastLobby();}return;}
  if(m.t==='pick'){const L=NET.lobby.find(p=>p.id===c.pid);if(L){L.hero=clamp(m.hero|0,0,HEROES.length-1);L.cust=m.cust?sanitizeSpec(m.cust):null;L.cos=sanitizeCos(m.cos,(HEROES[m.hero|0]||{}).id);broadcastLobby();}return;}
  if(m.t==='in'){const f=FS.find(x=>x.id===c.pid);if(f&&!f.isBot){const I=f.intent;I.wx=+m.wx||0;I.wz=+m.wz||0;I.aim=+m.aim||0;I.block=!!m.b;I.sprint=!!m.s;I.revive=!!m.r;I.hH=!!(m.h&1);I.hS=!!(m.h&2);I.hU=!!(m.h&4);f.netPress|=(m.p|0);}return;}
  if(m.t==='bye'){hostDrop(c);return;}
  emitEv('hmsg',m,c);
}
function hostDrop(c){
  if(!NET.conns.has(c.id))return;NET.conns.delete(c.id);
  const i=NET.lobby.findIndex(p=>p.id===c.pid);if(i>=0)NET.lobby.splice(i,1);
  const f=FS.find(x=>x.id===c.pid);if(f&&inMatch()&&!f.isBot){f.isBot=true;AIS.push(new AI(f,NET.diff));feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> disconnected (bot takes over)`);}
  broadcastLobby();
}
function freeTeam(){for(let t=0;t<4;t++)if(NET.lobby.filter(p=>p.team===t).length<(NET.mode==='duos'?2:9))return t;return 0;}
function lobbyMsg(){return {t:'lobby',players:NET.lobby.map(p=>({id:p.id,name:p.name,hero:p.hero,cust:p.cust||null,cos:p.cos||null,host:!!p.host,team:p.team})),fill:NET.fill,diff:NET.diff,rules:NET.rules||'br',mode:NET.mode};}
function broadcastLobby(){const m=lobbyMsg();NET.conns.forEach(c=>c.send(m));if(game.phase==='lobby')renderLobby();}
function hostStartMatch(){
  const duo=NET.mode==='duos';let bid=100;
  decorateBotsLater=1;const roster=NET.lobby.map(p=>({id:p.id,name:p.name,hero:p.hero,cust:p.cust||null,cos:p.cos||null,bot:false,team:duo?p.team:p.id}));
  if(duo){const cnt=t=>roster.filter(r=>r.team===t).length;
    roster.forEach(r=>{if(cnt(r.team)>2){for(let t=0;t<4;t++)if(cnt(t)<2){r.team=t;break;}}});
    for(let t=0;t<4;t++){const n=cnt(t);if(!NET.fill&&n===0)continue;if(NET.fill||n>0)while(cnt(t)<2&&(NET.fill||n===1)&&roster.length<8)roster.push({id:bid++,name:botName(),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:t});}
    if(new Set(roster.map(r=>r.team)).size<2){const t=[0,1,2,3].find(x=>!roster.some(r=>r.team===x));roster.push({id:bid++,name:botName(),hero:0,bot:true,team:t},{id:bid++,name:botName(),hero:1,bot:true,team:t});}}
  else{const want=NET.fill?8:Math.max(2,roster.length);while(roster.length<want){const id=bid++;roster.push({id,name:botName(),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:id});}}
  const spawns=(duo?teamSpawns(roster):spawnPoints(roster.length)).map(s=>[r2(s[0]),r2(s[1])]);
  decorateBots(roster);const msg={t:'start',roster,spawns,diff:NET.diff,mode:NET.mode,rules:NET.rules||'br'};NET.conns.forEach(c=>c.send(msg));
  startMatch(roster,spawns,NET.diff,NET.mode,NET.rules||'br');
}
function clientRecv(m){
  if(!m||!m.t)return;
  if(m.t==='welcome'){NET.welcomed=true;NET.myId=m.id;NET.code=m.code;netStatus('');showLobby();AU.ui();return;}
  if(m.t==='busy'){netShutdown();netStatus('That match is already in progress. Try again when it ends.');return;}
  if(m.t==='full'){netShutdown();netStatus('That room is full (8 players).');return;}
  if(m.t==='closed'){hostLost();return;}
  if(m.t==='lobby'){NET.lobby=m.players;NET.fill=m.fill;NET.diff=m.diff;NET.rules=normRules(m.rules);NET.mode=m.mode||'solo';if(inMatch()){endMatchCleanup();}if(game.phase!=='lobby')showLobby();else renderLobby();return;}
  if(m.t==='start'){startMatch(m.roster,m.spawns,m.diff,m.mode,m.rules);return;}
  if(m.t==='s'){applySnap(m);return;}
  emitEv('cmsg',m);
}
// --- snapshots ---
const SPKN=STEALABLE;
function pressBits(I){return (I.light?1:0)|(I.heavy?2:0)|(I.special?4:0)|(I.ult?8:0)|(I.jump?16:0)|(I.dash?32:0)|(I.spB?64:0)|(I.ultB?128:0)|(I.x1?256:0)|(I.x2?512:0)|(I.awk?1024:0)|(I.team?2048:0);}
function applyBits(I,b){I.light=!!(b&1);I.heavy=!!(b&2);I.special=!!(b&4);I.ult=!!(b&8);I.jump=!!(b&16);I.dash=!!(b&32);I.spB=!!(b&64);I.ultB=!!(b&128);I.x1=!!(b&256);I.x2=!!(b&512);I.awk=!!(b&1024);I.team=!!(b&2048);}
function buildSnap(){
  const f=FS.map(x=>{const I=x.intent;const a=[x.id,r2(x.pos.x),r2(x.pos.y),r2(x.pos.z),r2(x.vel.x),r2(x.vel.y),r2(x.vel.z),r2(x.face),STATES.indexOf(x.state),r2(x.stateT),
    x.state==='attack'?MOVEK.indexOf(x.moveName):-1,POSEK.indexOf(x.poseKey),r2(x.hp),r2(x.meter),x.dead?1:0,r2(I.wx||0),r2(I.wz||0),r2(I.aim||0),
    (I.block?1:0)|(I.sprint?2:0)|(x.onGround?4:0)|(I.revive?8:0)|(I.hH?16:0)|(I.hS?32:0)|(I.hU?64:0),x.sentPress|0,x.tgt?x.tgt.id:-1,r2(x.bladeT),x.stolen?SPKN.indexOf(x.stolen):-1,r2(x.stolenT),x.decay,x.kills,x.place,r2(x.framedT||0),r2(x.armorT||0),x.downed?1:0,r2(x.bleed||0),r2(x.revT||0),r2(x.fieldT||0),r2(x.vowT||0),x.marks||0,r2((x.burnT||0)*(x.burnB?-1:1)),r2(x.burnD||0),r2(x.slowT||0),SVAR.indexOf(x.specVar),x.ultAlt?1:0,x.ultPow>1?1:0,r2(x.parryT||0),Math.round(x.brk||0)];x.sentPress=0;return a;});
  return {t:'s',ph:game.phase,cd:r2(game.cdT),z:[r2(ZONE.cx),r2(ZONE.cz),r2(ZONE.r),r2(ZONE.tx),r2(ZONE.tz),r2(ZONE.tr),ZONE.st==='wait'?0:1,r2(ZONE.t),ZONE.pi,r2(ZONE.fx),r2(ZONE.fz),r2(ZONE.fr)],
    o:ORBS.map(o=>[o.id,r2(o.x),r2(o.z),o.type==='hp'?0:1]),pb:props.filter(p=>p.broken).map(p=>p.i),ev:NET.events.splice(0),f};
}
const INVOL=['hit','fly','down','getup','ko','framed','bstun','win','downed','float'];
function adopt(f,s,stT,mi,pi){
  f.state=s;f.stateT=stT;f.poseKey=POSEK[pi]||'guard';
  if(s==='attack'&&mi>=0){f.moveName=MOVEK[mi];f.move=MOVES[f.moveName];f.hitDone=true;f.swung=true;}
  if(s==='special'){f.fired=stT>.15;f.rocketDir=f.fwd();f.vf=f.vf||{};f.vf.named=1;f.spPend=false;}
  if(s==='ult'){f.vf=f.vf||{};}
  if(s==='ult'){f.u1=stT>.9;f.uStep=f.uStep||0;f.hitMap=f.hitMap||{};f.uEnd=f.uEnd||99;}
  if(s==='framed')f.rig.frame.visible=true;
  if(s==='float'){f.floatT=Math.max(f.floatT||0,1.6);}
  if(s==='special'){f.lastLash=0;f.beastReach=0;}
  if(s==='dash'){const h=Math.hypot(f.vel.x,f.vel.z);f.dashDir=h>.5?new V3(f.vel.x/h,0,f.vel.z/h):f.fwd();f.lastPan=-1;}
}
function applySnap(m){
  if(!inMatch())return;
  if(m.ph!==game.phase){if(m.ph==='fight'&&game.phase==='countdown'){announce('FIGHT!','#ffd23f');AU.scale=1;AU.boom(false);}if(m.ph!=='over')game.phase=m.ph;}
  game.cdT=m.cd;
  const z=m.z;Object.assign(ZONE,{cx:z[0],cz:z[1],r:z[2],tx:z[3],tz:z[4],tr:z[5],st:z[6]?'shrink':'wait',t:z[7],pi:z[8],fx:z[9],fz:z[10],fr:z[11]});
  const ids=new Set(m.o.map(o=>o[0]));ORBS.slice().forEach(o=>{if(!ids.has(o.id))removeOrb(o,false);});m.o.forEach(o=>{if(!ORBS.some(x=>x.id===o[0]))addOrb(o[0],o[1],o[2],o[3]?'surge':'hp');});
  m.pb.forEach(i=>{if(props[i]&&!props[i].broken)breakProp(props[i],true);});
  const byId=id=>FS.find(x=>x.id===id);
  for(const a of m.f){const f=byId(a[0]);if(!f)continue;
    const [id,x,y,z2,vx,vy,vz,face,si,stT,mi,pi,hp,me,dead,wx,wz,aim,fl,pr,tg,bl,soI,soT,dc,ki,pl,frT,arT,dn,bld,rv,fdT,vwT,mk,bu,bd,sl,sv,ua,uo,pa,bk]=a;f.brk=bk||0;f.burnT=Math.abs(bu||0);f.burnB=(bu||0)<0;f.burnD=bd||0;f.slowT=sl||0;f.parryT=pa||0;f.fieldT=fdT||0;f.vowT=vwT||0;f.marks=mk||0;if(mk)f.markT=Math.max(f.markT,.3);f.armorT=arT||0;f.downed=!!dn&&!dead;f.bleed=bld||0;f.revT=rv||0;const hs=STATES[si];const isMe=f===ME;
    f.hp=hp;f.meter=me;f.bladeT=bl;f.stolen=soI>=0?SPKN[soI]:null;f.stolenT=soT;f.decay=dc;if(dc>0)f.decayT=Math.max(f.decayT,.3);f.kills=ki;f.place=pl;f.framedT=frT;
    if(dead&&!f.dead){f.dead=true;f.rig.frame.visible=false;}
    else if(!dead&&f.dead&&(game.rules==='arena'||game.rules==='raid')){respawnFighter(f,x,z2);}
    if(!isMe){const I=f.intent;I.wx=wx;I.wz=wz;I.aim=aim;I.block=!!(fl&1);I.sprint=!!(fl&2);I.revive=!!(fl&8);I.hH=!!(fl&16);I.hS=!!(fl&32);I.hU=!!(fl&64);
      if(hs==='special'&&sv>0&&f.specVar!==SVAR[sv]){f.specVar=SVAR[sv];f.spPend=false;}if(hs==='ult'){f.ultAlt=!!ua;f.ultPow=uo?1.3:1;}f.netPress|=pr;f.tgt=tg>=0?byId(tg):null;}
    if(hs!==f.state){if(isMe?(INVOL.indexOf(hs)>=0||(INVOL.indexOf(f.state)>=0&&f.stateT>.3)):(f.stateT>.1||INVOL.indexOf(hs)>=0))adopt(f,hs,stT,mi,pi);}
    const tx=x+vx*.05,tz=z2+vz*.05,d=Math.hypot(tx-f.pos.x,tz-f.pos.z);
    if(isMe){if(d>5)f.pos.set(tx,y,tz);else if(d>1.2){f.pos.x=lerp(f.pos.x,tx,.15);f.pos.z=lerp(f.pos.z,tz,.15);}if(INVOL.indexOf(hs)>=0)f.vel.set(vx,vy,vz);}
    else{if(d>3.5)f.pos.set(tx,y,tz);else{f.pos.x=lerp(f.pos.x,tx,.35);f.pos.z=lerp(f.pos.z,tz,.35);f.pos.y=lerp(f.pos.y,y,.5);}f.vel.set(vx,vy,vz);f.face=angLerp(f.face,face,.5);f.onGround=!!(fl&4);}
  }
  for(const e of m.ev){
    if(e.k==='elim'){const v=byId(e.v),k=byId(e.a);if(v){if(!v.dead){v.dead=true;v.hp=0;}handleElim(v,k,e.pl);}}
    else if(e.k==='win'){showWin(byId(e.w)||null);}
    else if(e.k==='resp'){respawnFighter(byId(e.v),e.x,e.z);}
    else if(e.k==='down'){const v=byId(e.v);if(v)handleDown(v,byId(e.a));}
    else if(e.k==='rev'){const v=byId(e.v);if(v)revived(v);}
    else if(e.k==='pick'){const o=ORBS.find(x=>x.id===e.id);if(o)removeOrb(o,true);}
    else if(e.k==='zone'){zoneMsg();}
    else emitEv('net:'+e.k,e);
  }
}
function netTick(rdt){
  if(NET.role==='host'&&NET.conns.size){NET.snapT-=rdt;if(NET.snapT<=0){NET.snapT=.05;const s=buildSnap();NET.conns.forEach(c=>c.send(s));}}
  else if(NET.role==='host')NET.events.length=0;
  if(NET.role==='client'&&ME&&NET.host){NET.inT-=rdt;if(NET.inT<=0){NET.inT=.033;const I=ME.intent;NET.host.send({t:'in',wx:r2(I.wx),wz:r2(I.wz),aim:r2(I.aim),b:I.block?1:0,s:I.sprint?1:0,r:I.revive?1:0,h:(I.hH?1:0)|(I.hS?2:0)|(I.hU?4:0),p:netPressAcc});netPressAcc=0;}}
  else netPressAcc=0;
}
addEventListener('beforeunload',()=>{try{netShutdown();}catch(e){}});
