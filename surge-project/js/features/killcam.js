/* KILL CAM · SPECTATE · MATCH RECAP
   When you're knocked out: a ~3 s slow-motion orbit around whoever got you (letterboxed), then a recap card,
   then spectating — cycle who you watch with ◀ ▶ (or the ← → keys).
   The recap (also shown when the match ends): place, KOs, damage dealt / taken, best combo, your nemesis, time survived.
   Stats are tracked for everyone (exact on the host / offline; on clients, damage dealt by others isn't known). */
const RC={st:{},start:0,died:0,shown:false};
function rcS(id){return RC.st[id]||(RC.st[id]={dmg:0,taken:0,best:0,kos:0,by:{}});}
onEv('matchStart',()=>{RC.st={};RC.start=game.time;RC.died=0;RC.shown=false;KC.on=false;kcUI(false);rcHide();FS.forEach(f=>{f._lhp=f.hp;f._cmb=null;});});
onEv('hit',(a,d,dmg)=>{if(!a||!d||a===d||!(dmg>0))return;const A=rcS(a.id),D=rcS(d.id);A.dmg+=dmg;D.by[a.id]=(D.by[a.id]||0)+dmg;
  const c=a._cmb;if(c&&c.d===d&&game.time-c.t<1){c.n++;c.t=game.time;}else a._cmb={d,n:1,t:game.time};A.best=Math.max(A.best,a._cmb.n);});
onEv('kill',(d,a)=>{if(a&&a!==d)rcS(a.id).kos++;});
// damage taken works everywhere (from health drops)
onEv('tick',()=>{for(const f of FS){if(f._lhp!=null&&f.hp<f._lhp)rcS(f.id).taken+=f._lhp-f.hp;f._lhp=f.hp;}
  if(ME&&ME.dead&&!RC.died&&inMatch()){RC.died=game.time;if(game.rules!=='arena'&&game.rules!=='raid'&&!game.story)startKillCam();}
  if(ME&&!ME.dead&&RC.died&&game.rules==='arena')RC.died=0;
  if(game.phase==='over'&&!RC.shown&&ME){RC.shown=true;setTimeout(()=>{if(game.phase==='over')rcShow();},1800);}});

/* ---------- kill cam ---------- */
const KC={on:false,t:0,k:null,a0:0};
function startKillCam(){const k=ME.lastHitBy&&ME.lastHitBy!==ME&&!ME.lastHitBy.dead?ME.lastHitBy:(game.specF&&game.specF!==ME?game.specF:null);
  KC.on=true;KC.t=0;KC.k=k;KC.p=ME.pos.clone();KC.a0=k?Math.atan2(k.pos.x-ME.pos.x,k.pos.z-ME.pos.z)+Math.PI*.75:0;
  if(NET.role==='off')game.slowT=Math.max(game.slowT||0,1.1);
  kcUI(true,k?`KO'd by <b style="color:${k.hero.css}">${esc(k.name)}</b> · ${esc(k.hero.name)}`:'Knocked out');}
function kcUI(on,txt){let e=$('kcam');if(!e){e=document.createElement('div');e.id='kcam';e.innerHTML='<div class="kcb t"></div><div class="kcb b"></div><div class="kct"><i>KILL CAM</i><span></span></div>';document.body.appendChild(e);}
  e.classList.toggle('on',!!on);if(txt)e.querySelector('span').innerHTML=txt;}
onEv('frame',dt=>{if(!KC.on)return;KC.t+=dt;if(KC.t>3||!inMatch()){KC.on=false;kcUI(false);if(inMatch()&&game.phase!=='over')rcShow(true);}});
const _kcCam=updateCamera;
updateCamera=function(dt){_kcCam(dt);if(!KC.on)return;const f=KC.k&&!KC.k.dead?KC.k:null,c=f?f.pos:KC.p,ang=KC.a0+KC.t*.8;
  const tgt=TMP2.set(c.x+Math.sin(ang)*4.8,c.y+1.8+Math.sin(KC.t)*.3,c.z+Math.cos(ang)*4.8);camera.position.lerp(tgt,Math.min(1,dt*6));camera.lookAt(c.x,c.y+1.2,c.z);};

/* ---------- spectate cycling ---------- */
function specCycle(d){const L=aliveList().filter(f=>f!==ME);if(!L.length)return;const i=L.indexOf(game.specF);game.specF=L[((i<0?0:i+d)%L.length+L.length)%L.length];if(AU.ui)AU.ui();}
(function(){const s=$('spec');if(!s||$('specPrev'))return;const p=document.createElement('button'),n=document.createElement('button');p.className=n.className='btn ghost';p.id='specPrev';n.id='specNext';
  p.textContent='◀';n.textContent='▶';p.onclick=()=>specCycle(-1);n.onclick=()=>specCycle(1);s.insertBefore(p,s.firstChild);s.appendChild(n);})();
addEventListener('keydown',e=>{if(!inMatch()||!ME||!ME.dead||KC.on)return;if(e.code==='ArrowLeft')specCycle(-1);if(e.code==='ArrowRight')specCycle(1);});

/* ---------- recap card ---------- */
function rcShow(dead){if(!ME)return;const S=rcS(ME.id);let nem=null,nd=0;for(const id in S.by)if(S.by[id]>nd){nd=S.by[id];nem=FS.find(f=>f.id===+id);}
  const alive=Math.round(((RC.died||game.time)-RC.start));const pl=ME.place||(ME.dead?'—':1);
  let e=$('recap');if(!e){e=document.createElement('div');e.id='recap';document.body.appendChild(e);}
  const row=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`;
  e.innerHTML=`<h4>MATCH RECAP<em>${esc(ME.hero.name)}</em></h4>`+row('PLACE','#'+pl)+row('KOs',S.kos||ME.kills||0)+(S.dmg>0||NET.role!=='client'?row('DAMAGE DEALT',Math.round(S.dmg)):'')+row('DAMAGE TAKEN',Math.round(S.taken))+
    (S.best>1?row('BEST COMBO',S.best+' hits'):'')+(nem?row('NEMESIS',`<span style="color:${nem.hero.css}">${esc(nem.name)}</span> (${Math.round(nd)} dmg)`):'')+row('SURVIVED',Math.floor(alive/60)+':'+String(alive%60).padStart(2,'0'))+
    (typeof rcExtra==='function'?rcExtra():'')+`<button class="btn ghost" id="rcClose">${dead?'KEEP WATCHING':'CLOSE'}</button>`;
  e.classList.add('on');$('rcClose').onclick=rcHide;emitEv('recap',S);}
function rcHide(){const e=$('recap');if(e)e.classList.remove('on');}
onEv('matchEnd',()=>{rcHide();KC.on=false;kcUI(false);});
