/* Game mode rules */
/* ================= ARENA MODE (no storm, respawns) + POINTS =================
   Arena: nobody is out for good. Knocked-out fighters respawn after 3 s far from enemies;
   the first player (or duo) to 25 kills wins, and an 8-minute timer crowns the leader if nobody gets there.
   Points: +5 per kill (online and vs bots), +100 for winning an online match. Saved on this device. */
const ARENA_KILLS=25,ARENA_TIME=480,RESPAWN_T=3;
game.rules=normRules(store.get('surge.rules'));
let POINTS=Math.max(0,+(store.get('surge.points')||0)||0);
function isArena(){return game.rules==='arena';}
function renderPoints(){const t='★ '+POINTS.toLocaleString();if($('ptsTitle'))$('ptsTitle').textContent=t+' POINTS';if($('ptsHud'))$('ptsHud').textContent=t;}
function addPoints(n,why){if(game.practice||!n)return;POINTS+=n;store.set('surge.points',String(POINTS));game.ptsEarned=(game.ptsEarned||0)+n;renderPoints();
  const e=document.createElement('div');e.className='ptpop';e.textContent='+'+n+' '+why;$('me').appendChild(e);setTimeout(()=>e.remove(),1700);AU.scale=1;AU.tone('triangle',880,1320,.18,.08);AU.tone('triangle',1320,1760,.2,.06,.08);}
function teamScore(t){return FS.filter(f=>f.team===t).reduce((a,f)=>a+(f.kills||0),0);}
function arenaLead(){const teams=[...new Set(FS.map(f=>f.team))];let best=null,bs=-1,tie=false;teams.forEach(t=>{const s=teamScore(t);if(s>bs){bs=s;best=t;tie=false;}else if(s===bs)tie=true;});return {team:tie?null:best,score:Math.max(0,bs)};}
function arenaTop(team){return FS.filter(f=>f.team===team).sort((a,b)=>b.kills-a.kills)[0]||null;}
function spawnFar(f){let best=null,bd=-1;for(let k=0;k<16;k++){const p=randomOpenPoint(0,0,BOUND-8);let d=1e9;for(const o of FS){if(o===f||o.dead||ally(o,f))continue;d=Math.min(d,Math.hypot(o.pos.x-p.x,o.pos.z-p.z));}
  if(d>bd){bd=d;best=p;}}return best||{x:0,z:0};}
function respawnFighter(f,x,z){if(!f)return;const k=f.kills,pl=f.place,mt=f.meter;f.reset(x,z,rand(0,6.28));f.kills=k;f.place=pl;f.meter=mt;f.invuln=2;f.respT=0;
  const c=f.chest(new V3());ring(c,f.hero.color,3,.45,false,2.6);ring(TMP.set(x,.2,z).clone(),f.hero.accent,4,.5,true,2.2);burst(ADD,c,40,{colors:[f.hero.color,f.hero.accent,0xffffff],speed:6,up:3,life:.6,size:.32,bright:2.4});
  if(f===ME){announceSmall('RESPAWNED');showSpec(false);camYaw=f.face;}}
function arenaTick(dt){if(!isArena()||game.phase!=='fight'||game.practice)return;
  if(NET.role==='client'){for(const f of FS)if(f.dead)f.respT=Math.max(0,(f.respT!=null?f.respT:RESPAWN_T)-dt);return;}
  for(const f of FS){if(!f.dead)continue;if(f.respT==null)f.respT=RESPAWN_T;f.respT-=dt;if(f.respT<=0){const p=spawnFar(f);respawnFighter(f,p.x,p.z);netEvent({k:'resp',v:f.id,x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10});}}
  if(game.matchT>=ARENA_TIME){const L=arenaLead();endMatch(L.team!=null?arenaTop(L.team):null);}}
/* eliminations: arena counts kills and schedules a respawn instead of ending anyone's match */
const _onElimBR=game.onElim;
game.onElim=function(v,k){if(NET.role==='client')return;if(!isArena())return _onElimBR(v,k);
  if(k&&!ally(k,v))k.kills++;v.respT=RESPAWN_T;netEvent({k:'elim',v:v.id,a:k?k.id:-1,pl:0});handleElim(v,k,0);
  if(k&&!ally(k,v)&&teamScore(k.team)>=ARENA_KILLS&&game.phase==='fight')endMatch(arenaTop(k.team));};
function arenaHUD(F){const L=arenaLead(),left=Math.max(0,ARENA_TIME-game.matchT),m=Math.floor(left/60),s=Math.floor(left%60);
  const mine=F?teamScore(F.team):0;$('alive').textContent=`${game.mode==='duos'?'TEAM':'YOU'} ${mine} · LEAD ${L.score} / ${ARENA_KILLS}`;
  $('zinfo').textContent=game.phase==='countdown'?'DROPPING IN…':(F&&F.dead?`RESPAWNING IN ${Math.max(1,Math.ceil(F.respT!=null?F.respT:RESPAWN_T))}`:`ARENA · ${m}:${String(s).padStart(2,'0')} LEFT`);}
function rulesChips(id,cur,on){const el=$(id);if(!el)return;el.innerHTML='';[['br','BATTLE ROYALE'],['arena','ARENA · RESPAWNS'],['raid','BOSS RAID · CO-OP'],['patrol','PATROL · FREE ROAM']].forEach(([k,n])=>{const b=document.createElement('div');b.className='chip'+(cur===k?' sel':'');b.textContent=n;
  b.title=k==='patrol'?'Roam the whole city as a hero. Villain attacks break out at random spots: get there, stop them, save the people.':k==='arena'?'No storm. Respawn after 3 s. First to 25 kills wins.':k==='raid'?'Everyone teams up against one giant boss. 6 shared lives.':'Shrinking storm. Last one standing wins.';b.onclick=()=>{AU.ui();on(k);};el.appendChild(b);});}
renderPoints();
