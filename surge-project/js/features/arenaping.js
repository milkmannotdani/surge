/* ARENA PING — in Arena mode, PING (G · middle mouse · L3) sends out a sonar pulse that reveals every enemy for 5 s:
   a red marker over each one (seen through walls) with its distance, and an arrow at the screen edge for anyone
   off-screen. 10 s cooldown; while it's cooling down, G falls back to the normal team ping. Bots don't use it.
   Outside Arena, G is the normal ping. */
const APING={cd:0,until:0,els:{}};
function arenaPing(){if(!ME||ME.dead||!isArena())return false;if(game.time<APING.cd)return false;
  APING.cd=game.time+10;APING.until=game.time+5;const p=ME.pos.clone();
  for(let k=0;k<3;k++)setTimeout(()=>{if(inMatch())ring(TMP2.set(p.x,p.y+.15,p.z).clone(),0xff3a4a,60,1.1,true,1.6);},k*180);
  try{AU.init();AU.tone('sine',1200,700,.5,.07);setTimeout(()=>AU.tone('sine',1200,700,.4,.05),220);}catch(e){}
  return true;}
const _apPing=doPing;doPing=function(){if(isArena()&&arenaPing())return;return _apPing.apply(this,arguments);};
// markers
onEv('tick',()=>{const box=$('apMarks');if(!box)return;const on=inMatch()&&isArena()&&ME&&game.time<APING.until;
  const hint=$('apHint');if(hint){const show=inMatch()&&isArena()&&ME&&!ME.dead;hint.style.display=show?'block':'none';if(show){const cd=Math.max(0,APING.cd-game.time);hint.innerHTML=cd>0?`<kbd>G</kbd> PING · ${Math.ceil(cd)}s`:`<kbd>G</kbd> PING ENEMIES`;hint.classList.toggle('ready',cd<=0);}}
  const seen={};if(on){const W=innerWidth,H=innerHeight,v=new V3();
    for(const f of FS){if(f===ME||f.dead||ally(f,ME))continue;seen[f.id]=1;let el=APING.els[f.id];if(!el){el=document.createElement('div');el.className='apm';el.innerHTML='<i></i><span></span>';box.appendChild(el);APING.els[f.id]=el;}
      v.copy(f.pos);v.y+=2.4;const d=Math.round(f.pos.distanceTo(ME.pos));v.project(camera);let x=(v.x*.5+.5)*W,y=(-v.y*.5+.5)*H;const behind=v.z>1;
      let off=behind||x<20||x>W-20||y<20||y>H-20;if(behind){x=W-x;y=H-y;}
      if(off){const cx=W/2,cy=H/2,dx=x-cx,dy=y-cy,s=Math.min((W/2-34)/Math.abs(dx||1e-3),(H/2-34)/Math.abs(dy||1e-3));x=cx+dx*s;y=cy+dy*s;el.style.setProperty('--r',Math.atan2(dy,dx)+'rad');}
      el.classList.toggle('off',off);el.style.transform=`translate(${x}px,${y}px)`;el.querySelector('span').textContent=d+'m';el.style.setProperty('--c',f.hero.css);el.style.opacity=Math.min(1,(APING.until-game.time)/1);}}
  for(const id in APING.els){if(!seen[id]){APING.els[id].remove();delete APING.els[id];}}});
onEv('matchStart',()=>{APING.cd=0;APING.until=0;});
(function(){if(!$('apMarks')){const d=document.createElement('div');d.id='apMarks';document.body.appendChild(d);}if(!$('apHint')){const d=document.createElement('div');d.id='apHint';document.body.appendChild(d);}})();
