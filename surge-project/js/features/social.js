/* EMOTES (B: wheel), VICTORY POSES (shop), QUICK CHAT (T), PINGS (G / middle mouse) and VOICE LINES.
   Emotes and poses are bought in the shop (or earned from the season pass). Everything here is seen by
   everyone in an online match (sent with netSay). Voice lines use the browser's speech voice (Settings to turn off). */
const EMOTES={wave:{n:'Wave',p:0,ic:'👋'},cheer:{n:'Cheer',p:0,ic:'🙌'},bow:{n:'Bow',p:120,ic:'🙇'},flex:{n:'Flex',p:200,ic:'💪'},
  dance:{n:'Victory Dance',p:300,ic:'🕺'},salute:{n:'Hero Salute',p:150,ic:'🫡'},taunt:{n:'Come At Me',p:200,ic:'👉'},laugh:{n:'Villain Laugh',p:250,ic:'😈'}};
const VPOSES={classic:{n:'Classic',p:0,ic:'🏆'},power:{n:'Power Stance',p:200,ic:'⚡'},hover:{n:'Hero Landing',p:300,ic:'🦸'},salute:{n:'Salute',p:150,ic:'🫡'},
  thinker:{n:'Unbothered',p:250,ic:'😎'},dance:{n:'Dance It Out',p:350,ic:'🕺'}};
const QCHAT=['HELP!','TEAM-UP NOW!','THANKS!','ON MY WAY!','ENEMY HERE!','FALL BACK!','NICE ONE!','PLUS ULTRA!'];
const _ownsS=owns;owns=function(k){if(k==='emote:wave'||k==='emote:cheer'||k==='pose:classic')return true;return _ownsS(k);};
if(!INV.eq.pose)INV.eq.pose='classic';
/* poses as functions of time */
function emotePose(id,t){const B=b_({}),S=Math.sin(t*8),s2=Math.sin(t*4);
  switch(id){
    case 'wave':return b_({rSx:-2.7,rSz:-.35+S*.35,rE:-.5,hd:.05,lSx:-.15,lSz:.18});
    case 'cheer':return b_({lSx:-2.9,rSx:-2.9,lSz:.4,rSz:-.4,hy:Math.abs(s2)*.12,lK:Math.abs(s2)*.4,rK:Math.abs(s2)*.4,hd:-.15});
    case 'bow':return b_({sx:.75,hd:.35,lSx:.2,rSx:.2,lE:-.3,rE:-.3});
    case 'flex':return b_({lSx:-1.5,rSx:-1.5,lSz:1.3,rSz:-1.3,lE:-2.2,rE:-2.2,sy:s2*.15,hd:-.1});
    case 'dance':case 'pose_dance':return b_({sz:s2*.25,hy:Math.abs(S)*.08,lSx:-1.4+S*.8,rSx:-1.4-S*.8,lE:-1.6,rE:-1.6,lHx:S*.4,rHx:-S*.4,lK:.3+Math.max(0,S)*.6,rK:.3+Math.max(0,-S)*.6,hd:s2*.2});
    case 'salute':case 'pose_salute':return b_({rSx:-2.3,rSz:-.85,rE:-2.5,hd:-.05});
    case 'taunt':return b_({rSx:-1.55,rE:-.1+Math.max(0,S)*.6,lSx:-.2,sy:.3,hd:-.1});
    case 'laugh':return b_({sx:-.3+Math.abs(S)*.15,hd:-.4,lSx:-.6,rSx:-.6,lE:-2,rE:-2,lSz:.5,rSz:-.5,hy:Math.abs(Math.sin(t*12))*.05});
    case 'pose_power':return Object.assign({},POSES.charge||B);
    case 'pose_hover':return b_({hy:-.55,lK:2.2,rHx:-1.6,rK:1.4,lHx:.4,sx:.5,lSx:.6,rSx:-.6,lE:-.2,rE:-1.2,hd:-.2});
    case 'pose_thinker':return b_({lSx:-.6,lE:-2.4,rSx:-.5,rE:-2.2,rSz:.4,lSz:-.4,hd:.1,sy:.25});
    default:return Object.assign({},POSES.win||B);}}
// fighters play emotes; winners strike their equipped victory pose
const _tp0=Fighter.prototype.targetPose;
Fighter.prototype.targetPose=function(dt){
  if(this.state==='win'&&this.cos&&this.cos.pose&&this.cos.pose!=='classic')return emotePose('pose_'+this.cos.pose,game.time);
  if(this.emote){const E=this.emote,mv=this.intent&&Math.hypot(this.intent.wx,this.intent.wz)>.2;
    if(game.time>E.until||mv||['idle','run'].indexOf(this.state)<0)this.emote=null;else return emotePose(E.id,game.time-E.t0);}
  return _tp0.call(this,dt);};
onEv('x:emote',o=>{const f=byFid(o.f);if(!f||!EMOTES[o.e])return;f.emote={id:o.e,t0:game.time,until:game.time+(o.e==='dance'?5:3)};bubble(f,EMOTES[o.e].ic,1.6);
  if(o.e==='laugh'&&f.pos.distanceTo(camera.position)<30&&SET.voiceLines!==false)sayLine(f,'Mwa ha ha ha!');});
onEv('x:qc',o=>{const f=byFid(o.f);if(!f||!QCHAT[o.i])return;bubble(f,QCHAT[o.i],2.6);
  if(!ME||ally(f,ME)||game.mode!=='duos')feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b>: ${QCHAT[o.i]}`);AU.scale=1;AU.tone('sine',880,1100,.12,.06);});
/* speech bubbles over heads */
const BUBS=[];function bubble(f,txt,dur){const e=document.createElement('div');e.className='bub';e.textContent=txt;$('bubs').appendChild(e);BUBS.push({f,e,until:game.time+dur});}
onEv('frame',()=>{for(let i=BUBS.length-1;i>=0;i--){const b=BUBS[i];if(game.time>b.until||!inMatch()||b.f.dead){b.e.remove();BUBS.splice(i,1);continue;}
  const v=b.f.chest(TMP2);v.y+=1.5*b.f.hero.scale+.6;v.project(camera);if(v.z>1){b.e.style.display='none';continue;}b.e.style.display='';b.e.style.transform=`translate(${(v.x+1)/2*innerWidth}px,${(1-v.y)/2*innerHeight}px) translate(-50%,-100%)`;}});
/* ---- the wheel: emotes (B) or quick chat (T); pick with the mouse, number keys, or the left stick ---- */
const WH={open:false,page:'emote',mx:0,my:0,sel:-1,items:[]};
function wheelOpen(page){if(!ME||ME.dead||!inMatch())return;WH.open=true;WH.page=page;WH.mx=WH.my=0;WH.sel=-1;
  WH.items=page==='emote'?Object.keys(EMOTES).filter(k=>owns('emote:'+k)).map(k=>({id:k,t:EMOTES[k].ic+' '+EMOTES[k].n})):QCHAT.map((q,i)=>({id:i,t:q}));
  const W=$('wheel');W.innerHTML=`<div class="whc">${page==='emote'?'EMOTES':'QUICK CHAT'}<small>${page==='emote'?'B again: chat':''}</small></div>`+WH.items.map((it,i)=>{const a=i/WH.items.length*6.283-1.571;return `<div class="whi" style="left:calc(50% + ${Math.cos(a)*150}px);top:calc(50% + ${Math.sin(a)*150}px)"><b>${i+1}</b>${it.t}</div>`;}).join('');W.classList.add('on');}
function wheelClose(pick){const W=$('wheel');W.classList.remove('on');if(!WH.open)return;WH.open=false;const it=WH.items[pick!=null?pick:WH.sel];if(!it||!ME)return;
  if(WH.page==='emote')netSay({k:'emote',f:ME.id,e:it.id});else netSay({k:'qc',f:ME.id,i:it.id});}
function wheelHi(){const W=$('wheel');[...W.querySelectorAll('.whi')].forEach((e,i)=>e.classList.toggle('hi',i===WH.sel));}
addEventListener('mousemove',e=>{if(!WH.open)return;WH.mx+=e.movementX;WH.my+=e.movementY;const l=Math.hypot(WH.mx,WH.my);if(l>160){WH.mx*=160/l;WH.my*=160/l;}
  if(l>30){let a=Math.atan2(WH.my,WH.mx)+1.571;if(a<0)a+=6.283;WH.sel=Math.round(a/6.283*WH.items.length)%WH.items.length;wheelHi();}});
addEventListener('mousedown',e=>{if(WH.open&&e.button===0){e.stopPropagation();wheelClose();}},true);
addEventListener('keydown',e=>{const code=mapKey(e.code);
  if(WH.open){const n=parseInt((e.code.match(/^(?:Digit|Numpad)(\d)$/)||[])[1]);if(n>=1&&n<=WH.items.length){e.stopImmediatePropagation();wheelClose(n-1);return;}
    if(code==='KeyB'){e.stopImmediatePropagation();if(WH.page==='emote')wheelOpen('chat');else wheelClose(-1);return;}if(code==='KeyT'||e.code==='Escape'){e.stopImmediatePropagation();wheelClose(-1);return;}}
  if(e.repeat||!inMatch())return;if(code==='KeyB')wheelOpen('emote');else if(code==='KeyT')wheelOpen('chat');else if(code==='KeyG')doPing();},true);
addEventListener('mousedown',e=>{if(e.button===1&&inMatch()){e.preventDefault();doPing();}});
onEv('input',()=>{if(WH.open){pressed.delete('MouseL');pressed.delete('KeyJ');}
  const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;if(!gp)return;const v=!!(gp.buttons[8]&&gp.buttons[8].pressed),l3=!!(gp.buttons[10]&&gp.buttons[10].pressed);
  if(v&&!WH.pv){if(!WH.open)wheelOpen('emote');else if(WH.page==='emote')wheelOpen('chat');else wheelClose(-1);}WH.pv=v;if(l3&&!WH.pl3)doPing();WH.pl3=l3;
  if(WH.open){const x=gp.axes[0]||0,y=gp.axes[1]||0;if(Math.hypot(x,y)>.6){let a=Math.atan2(y,x)+1.571;if(a<0)a+=6.283;WH.sel=Math.round(a/6.283*WH.items.length)%WH.items.length;wheelHi();}
    if(gp.buttons[0]&&gp.buttons[0].pressed&&WH.sel>=0)wheelClose();}});
onEv('intent',()=>{if(WH.open&&ME){ME.intent.light=ME.intent.heavy=false;if(PAD&&(PAD.lx||PAD.ly)){ME.intent.wx=ME.intent.wz=0;}}});
onEv('matchEnd',()=>{wheelClose(-1);BUBS.forEach(b=>b.e.remove());BUBS.length=0;PINGS.forEach(p=>{scene.remove(p.m);p.e.remove();});PINGS.length=0;});
/* ---- pings: mark a spot (or an enemy) where you're looking ---- */
const PINGS=[];const ray=new THREE.Raycaster();
function doPing(){if(!ME||ME.dead)return;const dir=new V3();camera.getWorldDirection(dir);let tgt=null,best=.12;
  for(const f of FS){if(f===ME||f.dead||f.dormant||ally(f,ME))continue;const to=f.chest(new V3()).sub(camera.position),d=to.length();if(d>70)continue;const ang=to.normalize().angleTo(dir);if(ang<best){best=ang;tgt=f;}}
  let p;if(tgt)p=tgt.pos;else{ray.set(camera.position,dir);ray.far=150;const hit=ray.intersectObjects(world.children,true)[0];p=hit?hit.point:camera.position.clone().addScaledVector(dir,40);}
  netSay({k:'ping',f:ME.id,x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),t:tgt?tgt.id:-1});}
onEv('x:ping',o=>{const f=byFid(o.f);if(!f||(NET.role!=='off'&&ME&&f!==ME&&!ally(f,ME)))return;
  const enemy=o.t>=0,col=enemy?0xff3a3a:0x5af0ff;const m=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshBasicMaterial({color:col,depthTest:false,transparent:true}));m.renderOrder=9;scene.add(m);
  const e=document.createElement('div');e.className='pingl'+(enemy?' en':'');$('bubs').appendChild(e);PINGS.push({m,e,x:o.x,y:o.y,z:o.z,tf:enemy?byFid(o.t):null,until:game.time+6,who:f.name});
  AU.scale=1;AU.tone('sine',enemy?660:990,enemy?440:1320,.15,.08);if(f!==ME)feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> pinged ${enemy?'an enemy':'a spot'}`);});
onEv('frame',dt=>{for(let i=PINGS.length-1;i>=0;i--){const P=PINGS[i];if(game.time>P.until){scene.remove(P.m);P.e.remove();PINGS.splice(i,1);continue;}
  const p=P.tf&&!P.tf.dead?P.tf.chest(TMP2).clone().add(new V3(0,1.8*P.tf.hero.scale,0)):new V3(P.x,P.y+1.2,P.z);P.m.position.copy(p);P.m.rotation.y+=dt*3;
  const v=p.clone().project(camera);const on=v.z<1;const x=clamp((v.x+1)/2*innerWidth,20,innerWidth-20),y=clamp((1-v.y)/2*innerHeight,20,innerHeight-20);
  P.e.style.transform=`translate(${on?x:(v.x>0?20:innerWidth-20)}px,${y}px) translate(-50%,-140%)`;P.e.textContent=(P.tf?'⚠ ':'◆ ')+(ME?Math.round(ME.pos.distanceTo(p))+'m':'');}});
/* ---- voice lines (browser speech) ---- */
/* ---------- voices ----------
   Each fighter gets one consistent voice: the best-sounding voice on this device for their build (natural/neural voices first),
   a pitch and speed of their own, and a personal battle cry before each ultimate. */
const VOICE_LOW={titan:1,bastion:1,quake:1,marrow:1,sovereign:1,sawback:1,resect:1,cushion:1,verdict:1,legion:1,snare:1,piston:1,nitro:1,umbra:1,scathe:1,void:1,marble:1,ronin:1,pyre:1,hex:1};
const ULT_CRY={cinder:'Everything burns!',riptide:'Ride the current!',gale:'Feel the storm!',nitro:'Light it up!',titan:'Stand aside!',volta:'Full voltage!',umbra:'From the dark!',
  drift:'Look up!',bastion:'Nothing gets through!',quill:'Take flight!',void:'Into nothing!',ronin:'One clean cut.',quake:'Shake the earth!',marrow:'Bones of steel!',entropy:'All things fade.',
  sovereign:'Your power is mine!',strobe:'Time is up!',pyre:'Blue and bright!',warp:'Nowhere to run!',hex:'You are cursed!',scathe:'You never saw it.',solstice:'Fire and frost!',
  piston:'Full throttle!',snare:'Your power is gone.',marble:'And now, the finale!',legion:'All of us!',recoil:'Target locked.',crimson:'Let me taste it!',sawback:'Feel every blade!',
  resect:'Fall apart.',cushion:'Right back at you!',corrosa:'Melt away!',verdict:'Judgment is here.',decree:'By my order!'};
let VOICES=[];function loadVoices(){try{VOICES=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));}catch(e){}}
if(window.speechSynthesis){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
const V_MALE=/male\b|guy|davis|tony|jason|ryan|christopher|eric|roger|brian|thomas|daniel|george|alex|fred|mark|david|james|liam|andrew/i,V_FEM=/female|aria|jenny|sonia|libby|natasha|samantha|zira|susan|karen|moira|tessa|victoria|serena|emma|ava|michelle|hazel|fiona/i;
function voiceFor(f){if(!VOICES.length)loadVoices();if(!VOICES.length)return null;const id=f.hero.id||f.hero.name,low=!!VOICE_LOW[id]||f.hero.scale>1.3;
  const q=v=>(/natural|neural|online/i.test(v.name)?4:0)+(/google/i.test(v.name)?2:0)+(v.localService?0:1);
  let L=VOICES.filter(v=>low?V_MALE.test(v.name):V_FEM.test(v.name));if(!L.length)L=VOICES;L=L.slice().sort((a,b)=>q(b)-q(a));const top=L.filter(v=>q(v)===q(L[0]));
  return top[hashStr(id)%top.length];}
function vSpeak(f,text,o){const u=new SpeechSynthesisUtterance(text);const v=voiceFor(f);if(v)u.voice=v;const h=hashStr(f.hero.id||f.hero.name),low=!!VOICE_LOW[f.hero.id]||f.hero.scale>1.3;
  u.pitch=Math.max(.1,Math.min(2,(low?.75:1.05)+((h%21)-10)/100+(f.hero.faction==='villain'?-.12:0)+(o.dp||0)));if(f.hero.scale>1.6)u.pitch=.35;
  u.rate=(o.rate||1.05)+((h>>3)%9-4)/100;u.volume=Math.min(1,(SET.sfx||85)/100*(o.vol||1));return u;}
function duckMusic(sec){if(!AU.ctx||!AU.mus)return;try{const g=AU.mus.gain,t=AU.ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(g.value*.35,t+.15);g.linearRampToValueAtTime(g.value,t+sec);}catch(e){}}
function sayLine(f,text,o){if(SET.voiceLines===false||!window.speechSynthesis)return;try{speechSynthesis.cancel();speechSynthesis.speak(vSpeak(f,text,o||{}));}catch(e){}}
// ultimates: personal battle cry, then the ult name called out slower and louder, music dips underneath
function ultCry(f){if(SET.voiceLines===false||!window.speechSynthesis)return;try{speechSynthesis.cancel();const name=(f.ultAlt&&f.hero.altName?f.hero.altName:f.hero.ultName||'ultimate').toLowerCase();
  const cry=ULT_CRY[f.hero.id];if(cry)speechSynthesis.speak(vSpeak(f,cry,{rate:1.12}));speechSynthesis.speak(vSpeak(f,name+'!',{rate:.82,dp:-.08,vol:1.15}));duckMusic(2.6);}catch(e){}}
onEv('ult',f=>{if(f===ME||(ME&&f.pos.distanceTo(ME.pos)<16&&Math.random()<.5))setTimeout(()=>ultCry(f),30);});
onEv('teamupMe',()=>{if(ME)setTimeout(()=>sayLine(ME,'Team up! Plus Ultra!'),100);});
onEv('awakenMe',()=>{if(ME)sayLine(ME,'I won\'t lose here!');});
onEv('win',w=>{if(w&&ME&&ally(w,ME))setTimeout(()=>sayLine(ME,ME.hero.faction==='villain'?'Too easy.':'That\'s what heroes do!'),1200);});
/* shop: emotes are owned, not equipped */
const _rsS=renderShop;renderShop=function(){_rsS();if(SH.tab==='emotes'){const b=$('shBuy');if(owns('emote:'+SH.sel)){b.textContent='OWNED · PRESS B IN A MATCH';b.disabled=true;}$('shBig').innerHTML='<div class="mdnote">Emotes play with the emote wheel (B, or View on a controller). Everyone nearby sees them.</div>';}
  else if(SH.tab==='poses')$('shBig').innerHTML='<div class="mdnote">Your fighter strikes this pose when you win a match. Other players see it too.</div>';};

/* ---------- inspired fighters: voices closer to their inspirations ----------
   Each gets a matching voice (male/female), pitch, pace and loudness, and an ultimate battle cry written in that
   character's personality (original lines — not quotes from the show). A line can be a list of [text, pitch shift]
   parts spoken back-to-back (Legion argues with himself). Edit VPROF / VCRY to tune them. */
const VPROF={ // sex: m/f · p: pitch · r: rate · v: volume
  solstice:{sex:'m',p:.9,r:.92},piston:{sex:'m',p:1,r:1.22,v:1.1},snare:{sex:'m',p:.78,r:.82,v:.85},marble:{sex:'m',p:1.05,r:.92},
  legion:{sex:'m',p:.95,r:1.15},recoil:{sex:'f',p:.82,r:.86},crimson:{sex:'f',p:1.55,r:1.12},sawback:{sex:'m',p:.82,r:1.08},
  resect:{sex:'m',p:.7,r:.86,v:.9},cushion:{sex:'m',p:.6,r:.95,v:1.1},corrosa:{sex:'f',p:1.35,r:1.15},verdict:{sex:'m',p:.5,r:.84},
  decree:{sex:'f',p:.98,r:1,v:1.15},skitter:{sex:'m',p:1.12,r:1.1},oldguard:{sex:'m',p:.58,r:.88},hopstar:{sex:'f',p:1.45,r:1.15,v:1.1},
  headliner:{sex:'m',p:.92,r:1.02,v:1.15},zanshin:{sex:'m',p:.88,r:1.05,v:1.1}};
const VCRY={
  solstice:'This time I\'ll use all of it. Ice... and fire.',
  piston:'Engines at full output! Everyone, please stand clear!',
  snare:'Sigh... Let\'s make this quick. I\'m tired.',
  marble:'Ladies and gentlemen... the grand finale!',
  legion:[['Leave it to me!',.15],['No — leave it to us!',-.2],['We\'ve totally got this!',.15],['We\'re doomed!',-.25]],
  recoil:'Hold still. I don\'t miss.',
  crimson:[['Ehehe~',.25],['Hold still... I just want a little taste!',0]],
  sawback:'This is for everyone the world threw away!',
  resect:'Filthy. I\'ll take you apart... and put you back together properly.',
  cushion:'Hah! Took all that and I\'m still hungry! Here it comes!',
  corrosa:'Let\'s dance! Acid style!',
  verdict:'Fakes. Only a true hero may stand before me.',
  decree:'New rule — you lose!',
  skitter:'Coming through — watch your step!',
  oldguard:'Listen up, kid. Power isn\'t everything.',
  hopstar:'Showtime! Everybody, eyes on me!',
  headliner:'Smile for the cameras, folks — the star has arrived!',
  zanshin:'I\'ll protect them. No matter what!'};
const _vfOld=voiceFor;
voiceFor=function(f){const P=VPROF[KIT(f.hero,'elem')];if(!P)return _vfOld(f);if(!VOICES.length)loadVoices();if(!VOICES.length)return null;
  const q=v=>(/natural|neural|online/i.test(v.name)?4:0)+(/google/i.test(v.name)?2:0)+(v.localService?0:1);
  let L=VOICES.filter(v=>P.sex==='f'?V_FEM.test(v.name):V_MALE.test(v.name));if(!L.length)L=VOICES;L=L.slice().sort((a,b)=>q(b)-q(a));const top=L.filter(v=>q(v)===q(L[0]));
  return top[hashStr(f.hero.id)%top.length];};
const _vsOld=vSpeak;
vSpeak=function(f,text,o){const P=VPROF[KIT(f.hero,'elem')];if(!P)return _vsOld(f,text,o);o=o||{};const u=new SpeechSynthesisUtterance(text);const v=voiceFor(f);if(v)u.voice=v;
  u.pitch=Math.max(.1,Math.min(2,P.p+(o.dp||0)));u.rate=Math.max(.5,Math.min(2,(P.r||1)*((o.rate||1.05)/1.05)));u.volume=Math.min(1,(SET.sfx||85)/100*(P.v||1)*(o.vol||1));return u;};
const _ucOld=ultCry;
ultCry=function(f){const id=KIT(f.hero,'elem'),C=VCRY[id];if(!C)return _ucOld(f);if(SET.voiceLines===false||!window.speechSynthesis)return;
  try{speechSynthesis.cancel();const parts=Array.isArray(C)?C:[[C,0]];parts.forEach(([t,dp])=>speechSynthesis.speak(vSpeak(f,t,{rate:1.05,dp})));
    const name=(f.ultAlt&&f.hero.altName?f.hero.altName:f.hero.ultName||'ultimate').toLowerCase();speechSynthesis.speak(vSpeak(f,name+'!',{rate:.88,dp:-.06,vol:1.15}));duckMusic(3.4);}catch(e){}};
