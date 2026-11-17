/* TUTORIAL — TUTORIAL button on the title screen. Runs in the training room with dummies.
   Each step waits until you actually do the thing: move, double jump, dash, light combo, heavy, block, special,
   extra moves, ultimate, break out, awaken. SKIP moves on, EXIT leaves. Edit TUTL_STEPS to change the lessons. */
const TUT={on:false,i:0,acc:0,p0:null,hits:0};
const TUTL_STEPS=[
  {t:'MOVE',d:'Move around with <b>WASD</b> (or the left stick). Look around with the mouse.',start(){TUT.p0=ME.pos.clone();},ok(){return ME.pos.distanceTo(TUT.p0)>8;}},
  {t:'DOUBLE JUMP',d:'Press <b>SPACE</b> to jump — press it again in the air to jump a second time.',ok(){return !!ME.dj||ME.pos.y>3.2;}},
  {t:'DASH',d:'Press <b>SHIFT</b> to dash. You\'re briefly untouchable while dashing.',ok(){return ME.state==='dash'||!!ME.glideOn;}},
  {t:'LIGHT COMBO',d:'Walk up to a dummy and <b>left-click</b> (or <b>J</b>) three times for a combo.',start(){TUT.hits=0;},ok(){return TUT.hits>=3;}},
  {t:'HEAVY HIT',d:'<b>Right-click</b> (or <b>K</b>) for a slower, stronger heavy hit. Heavies and combo finishers trigger your power hits.',start(){TUT.hv=0;},ok(){return TUT.hv>0;}},
  {t:'BLOCK',d:'Hold <b>F</b> to block for a second. Blocking takes much less damage — but guard breaks get through.',start(){TUT.acc=0;},ok(dt){if(ME.state==='block'||ME.state==='bstun')TUT.acc+=dt;return TUT.acc>1;}},
  {t:'SPECIAL',d:'Press <b>1</b> for your special. Hold it to charge a stronger version; press <b>2</b> for its alternate.',ok(){return ME.state==='special';}},
  {t:'EXTRA MOVES',d:'Press <b>3</b> or <b>4</b> for your two extra moves.',ok(){return ME.state==='special'&&ME.xmOn||(ME.xcd&&(ME.xcd[0]>0||ME.xcd[1]>0));}},
  {t:'ULTIMATE',d:'Your ultimate fills as you fight — here it\'s full. Press <b>Q</b>! (Hold back or be in the air for your alternate ultimate.)',start(){ME.meter=100;},ok(){return ME.state==='ult';}},
  {t:'BREAK OUT',d:'Taking hits fills your <b>BREAK</b> bar. When it\'s full and you\'re being combo\'d, press <b>SHIFT</b> to burst out. Try it now!',
    start(){TUT.bt=0;},ok(dt){TUT.bt-=dt;if(TUT.bt<=0&&ME.state!=='hit'){TUT.bt=1.2;ME.brk=100;const d=FS.find(f=>f!==ME&&!f.dead);if(d)hitO(d,ME,{dmg:1,kb:1,stun:1.4});}return ME.brk<50&&TUT.bt<1.1;}},
  {t:'AWAKEN',d:'At low health with a full BREAK bar you can <b>AWAKEN</b> — press <b>X</b> for a huge power-up.',start(){TUT.aw=false;ME.hp=25;ME.brk=100;},ok(){if(ME.hp>30)ME.hp=25;ME.brk=Math.max(ME.brk,100);return TUT.aw;}},
  {t:'YOU\'RE READY!',d:'That\'s everything. Battle royale: be the last one standing while the zone closes in. Good luck — go beyond!',ok(){return false;},last:true}];
onEv('awakenMe',()=>{if(TUT.on)TUT.aw=true;});
onEv('hit',(a,d)=>{if(TUT.on&&a===ME)TUT.hits++;});
function startTutorial(){TUT.wait=false;if(typeof startPractice!=='function')return;PR.count=2;PR.look='dummy';PR.act='stand';startPractice();TUT.on=true;TUT.i=0;tutStep();
  $('prac').classList.remove('on');}
function tutStep(){const S=TUTL_STEPS[TUT.i];if(!S)return tutEnd();if(S.start)try{S.start();}catch(e){}
  let e=$('tutBox');if(!e){e=document.createElement('div');e.id='tutBox';document.body.appendChild(e);}
  e.innerHTML=`<div class="tdots">${TUTL_STEPS.map((s,i)=>`<i class="${i<TUT.i?'d':i===TUT.i?'c':''}"></i>`).join('')}</div><i class="tn">STEP ${TUT.i+1} / ${TUTL_STEPS.length}</i><b>${S.t}</b><span>${S.d}</span>
    <div class="tbtn">${S.last?'<button class="btn" id="tutDone">FINISH</button>':'<button class="btn ghost" id="tutSkip">SKIP</button>'}<button class="btn ghost" id="tutExit">EXIT</button></div>`;
  e.classList.add('on');const sk=$('tutSkip'),dn=$('tutDone');if(sk)sk.onclick=()=>{TUT.i++;tutStep();};if(dn)dn.onclick=tutEnd;$('tutExit').onclick=tutEnd;}
function tutEnd(){TUT.on=false;const e=$('tutBox');if(e)e.classList.remove('on');store.set('surge.tutDone','1');if(inMatch()&&typeof leaveToTitle==='function')leaveToTitle();}
onEv('tick',dt=>{if(!TUT.on)return;if(!ME||!PR.on){TUT.on=false;const e=$('tutBox');if(e)e.classList.remove('on');return;}
  if(ME.intent&&(ME.intent.heavy||ME.bufH>0))TUT.hv=(TUT.hv||0)+1;
  const S=TUTL_STEPS[TUT.i];if(TUT.wait||!S||S.last)return;
  if(S.ok(dt)){TUT.wait=true;if(AU.levelUp)AU.levelUp();announceSmall('✔ '+S.t);setTimeout(()=>{TUT.wait=false;if(TUT.on){TUT.i++;tutStep();}},700);}});
(function(){const c=$('bCreate');if(c&&!$('bTutorial')){const b=document.createElement('button');b.className='chip tb2';b.id='bTutorial';b.textContent='TUTORIAL';b.onclick=()=>{AU.ui&&AU.ui();startTutorial();};c.parentNode.insertBefore(b,c);}})();
// first launch: point new players at it
setTimeout(()=>{if(!store.get('surge.tutDone')&&!inMatch()){const b=$('bTutorial');if(b)b.classList.add('pulse');}},1500);
