/* CINEMATIC MOVES — moves speak for themselves: no text pop-ups during fights, more weight and drama instead.
   With Cinematic Moves on (Settings, default on), during a match:
   · no move callouts or flavour pop-ups (ultimate name banners, PARRY!, GUARD BREAK, POWER STOLEN, mode and clash text…).
     Messages you need still show: the zone, eliminations / knock-downs / revives, hazard warnings, objectives,
     anti-teaming strikes, recording and settings messages, and effects that are happening to you.
   · achievement pop-ups wait until the match is over.
   · big hits land with a freeze-frame, a camera punch-in and an impact flash; ultimates get letterbox bars and
     a slow-motion beat when they connect (offline); knock-outs near you get a slow-motion moment (offline). */
if(SET.cinematic===undefined)SET.cinematic=true;
try{SET_ROWS.push(['cinematic','CINEMATIC MOVES (NO MOVE TEXT POP-UPS)','toggle']);}catch(e){}
function cineOn(){return SET.cinematic!==false&&inMatch();}
const CINE_KEEP=/ZONE|ELIMINATED|KNOCKED|REVIV|RESPAWN|STRIKE|TEAMING|SOLO MATCH|CLIP|RECORD|FOOTAGE|DOWNLOAD|SHARING|BROWSER|MICROPHONE|VOICE CHAT|CONTROLLER|LOCK-ON|LOCKED ON|INCOMING|METEORS|SURGE OVER|CIVILIAN|TRIAL|UNLOCKED|SEASON|LEVEL|^YOUR |DRY EYES|BLINKED|TERRIFIED|PARALYZED|STUCK|PRESS |HOLD |HIT BY|FIGHT|CAN'T|MOVE!|JUMP!/;
const _ciSmall=announceSmall;announceSmall=function(t){if(cineOn()&&!CINE_KEEP.test(String(t)))return;return _ciSmall.apply(this,arguments);};
const _ciBig=announce;announce=function(t){if(cineOn()&&!CINE_KEEP.test(String(t)))return;return _ciBig.apply(this,arguments);};
const _ciBan=banner;banner=function(){if(cineOn())return;return _ciBan.apply(this,arguments);};
const _ciFeed=feed;feed=function(h){if(cineOn()&&/beam clash/i.test(String(h)))return;return _ciFeed.apply(this,arguments);};
// achievements: hold the pop-up until the match ends
const CINE_ACH=[];const _ciAch=achGive;achGive=function(id){if(cineOn()&&!ACHS.u[id]&&!game.practice){if(CINE_ACH.indexOf(id)<0)CINE_ACH.push(id);return;}return _ciAch.apply(this,arguments);};
onEv('matchEnd',()=>{const L=CINE_ACH.splice(0);L.forEach((id,i)=>setTimeout(()=>_ciAch(id),1800+i*900));});

/* ---------- weight & drama ---------- */
const CN={punch:0};
onEv('hit',(att,def,dmg,o)=>{if(!att||!def||SET.cinematic===false)return;const meIn=att===ME||def===ME,near=ME&&def.pos.distanceTo(ME.pos)<22;if(!meIn&&!near)return;
  const ult=att.state==='ult',sp=att.state==='special',big=ult||(o&&o.heavy&&dmg>=10)||dmg>=14;if(!big)return;
  hitStop(ult?.16:sp?.12:.1);CN.punch=Math.min(10,CN.punch+(ult?8:5));
  if(meIn||dmg>=18)impactFlash(ult?.55:.32,ult?att.hero.color:0xffffff);
  if(ult&&o&&(o.launch||o.kb>12)&&NET.role==='off'&&!game.slowT)game.slowT=.35;});
onEv('kill',(d,a)=>{if(SET.cinematic===false||NET.role!=='off'||!ME)return;if(a===ME||d.pos.distanceTo(ME.pos)<18){if(!(typeof KC!=='undefined'&&KC.on))game.slowT=Math.max(game.slowT,.55);}});
function impactFlash(a,col){const e=$('impactFx');if(!e)return;e.style.setProperty('--c','#'+new THREE.Color(col).getHexString());e.style.setProperty('--a',a);e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}
const _ciCam=updateCamera;updateCamera=function(dt){const r=_ciCam.apply(this,arguments);
  if(CN.punch>.01){camera.fov-=CN.punch;camera.updateProjectionMatrix();CN.punch*=Math.exp(-dt*7);camera.fov+=CN.punch;camera.updateProjectionMatrix();}
  const bars=$('cineBars');if(bars)bars.classList.toggle('on',!!((game.cine||(typeof HCAM!=='undefined'&&HCAM.on)||(typeof DCAM!=='undefined'&&DCAM.on))&&SET.cinematic!==false&&inMatch()));return r;};
(function(){if(!$('impactFx')){const d=document.createElement('div');d.id='impactFx';document.body.appendChild(d);}
  if(!$('cineBars')){const d=document.createElement('div');d.id='cineBars';d.innerHTML='<i></i><i></i>';document.body.appendChild(d);}
  document.body.classList.toggle('cineM',SET.cinematic!==false);setInterval(()=>document.body.classList.toggle('cineM',SET.cinematic!==false),1000);})();
