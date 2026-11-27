/* VOICE CHAT for online rooms (PeerJS audio calls, peer to peer, in the lobby and in matches).
   Settings → VOICE CHAT: OFF / PUSH TO TALK (hold V, or the controller's left bumper+right bumper) / OPEN MIC, plus volume.
   The host shares everyone's connection id; each pair of players makes one call. Your mic is only asked for when voice chat is on. */
const VC={stream:null,calls:new Map(),audio:new Map(),list:[],talking:false,asked:false,meters:new Map()};
function vcOn(){return SET.voice&&SET.voice!=='off'&&NET.role!=='off'&&!NET.local&&!!NET.peer;}
async function vcMic(){if(VC.stream||VC.asked)return VC.stream;VC.asked=true;
  try{VC.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});vcGate();announceSmall('🎙 VOICE CHAT ON');}
  catch(e){announceSmall('MICROPHONE BLOCKED — YOU CAN STILL HEAR OTHERS');}return VC.stream;}
function vcGate(){const on=SET.voice==='open'||(SET.voice==='ptt'&&VC.ptt);VC.talking=!!VC.stream&&on;if(VC.stream)VC.stream.getAudioTracks().forEach(t=>t.enabled=VC.talking);}
function vcAttach(){const P=NET.peer;if(!P||P.__vc)return;P.__vc=true;
  P.on('call',call=>{if(!vcOn()){try{call.close();}catch(e){}return;}vcMic().then(s=>{try{call.answer(s||undefined);}catch(e){}});vcWire(call);});}
function vcWire(call){VC.calls.set(call.peer,call);call.on('stream',s=>vcPlay(call.peer,s));call.on('close',()=>vcDrop(call.peer));call.on('error',()=>vcDrop(call.peer));}
function vcPlay(pid,s){let a=VC.audio.get(pid);if(!a){a=new Audio();a.autoplay=true;VC.audio.set(pid,a);}a.srcObject=s;a.volume=(SET.vcVol!=null?SET.vcVol:80)/100;a.play().catch(()=>{});
  try{if(AU.ctx){const an=AU.ctx.createAnalyser();an.fftSize=256;AU.ctx.createMediaStreamSource(s).connect(an);VC.meters.set(pid,{an,buf:new Uint8Array(an.frequencyBinCount),lvl:0});}}catch(e){}}
function vcDrop(pid){VC.calls.delete(pid);const a=VC.audio.get(pid);if(a){a.srcObject=null;VC.audio.delete(pid);}VC.meters.delete(pid);}
function vcCloseAll(){VC.calls.forEach(c=>{try{c.close();}catch(e){}});VC.calls.clear();VC.audio.forEach(a=>a.srcObject=null);VC.audio.clear();VC.meters.clear();VC.list=[];}
// the host tells everyone who is in the room (peer id + player id)
function vcRoster(){if(NET.role!=='host'||!NET.peer)return;const ids=[{peer:NET.peer.id,pid:0}];NET.conns.forEach(c=>{if(c.pid!=null)ids.push({peer:c.id,pid:c.pid});});const m={t:'vc',ids};NET.conns.forEach(c=>c.send(m));vcConnect(ids);}
const _bl0=broadcastLobby;broadcastLobby=function(){_bl0();vcRoster();};
onEv('cmsg',m=>{if(m.t==='vc'&&Array.isArray(m.ids))vcConnect(m.ids);});
async function vcConnect(ids){VC.list=ids;if(!vcOn())return;vcAttach();const me=NET.peer.id;await vcMic();
  for(const {peer} of ids){if(peer===me||VC.calls.has(peer)||!(me<peer))continue;try{const call=NET.peer.call(peer,VC.stream||vcSilence());if(call)vcWire(call);}catch(e){}}}
function vcSilence(){try{const ctx=AU.ctx||new AudioContext();const d=ctx.createMediaStreamDestination();return d.stream;}catch(e){return undefined;}}
const _ns0=netShutdown;netShutdown=function(){vcCloseAll();_ns0();};
// push to talk (V, or hold both bumpers on a controller) + who is talking
onEv('frame',()=>{let ptt=!!keys.KeyV;const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;if(gp&&gp.buttons[4]&&gp.buttons[5]&&gp.buttons[4].pressed&&gp.buttons[5].pressed&&!inMatch())ptt=true;
  if(ptt!==VC.ptt){VC.ptt=ptt;vcGate();}
  const el=$('vcBox');if(!el)return;const on=NET.role!=='off'&&SET.voice&&SET.voice!=='off';el.classList.toggle('on',!!on);if(!on)return;
  if(NET.local){el.innerHTML='<i>VOICE CHAT NEEDS A REAL ONLINE ROOM</i>';return;}
  const names=pid=>{const L=NET.lobby.find(p=>p.id===pid);return L?L.name:'Player';};let h=`<b class="${VC.talking?'tk':''}">🎙 ${VC.stream?(VC.talking?'TALKING':(SET.voice==='ptt'?'HOLD '+(KB_NAMES.ptt||'V')+' TO TALK':'MUTED')):'NO MIC'}</b>`;
  VC.meters.forEach((M,peer)=>{M.an.getByteFrequencyData(M.buf);let s=0;for(const v of M.buf)s+=v;M.lvl=M.lvl*.7+(s/M.buf.length)*.3;const ent=VC.list.find(x=>x.peer===peer);h+=`<span class="${M.lvl>12?'tk':''}">${M.lvl>12?'🔊':'🔈'} ${esc(ent?names(ent.pid):'Player')}</span>`;});
  if(el.__h!==h){el.innerHTML=h;el.__h=h;}});
// settings changes take effect right away
const _apply0=applySettings;applySettings=function(){_apply0();VC.audio.forEach(a=>a.volume=(SET.vcVol!=null?SET.vcVol:80)/100);vcGate();if(vcOn()&&VC.list.length)vcConnect(VC.list);if(SET.voice==='off'&&VC.calls.size)vcCloseAll();};
