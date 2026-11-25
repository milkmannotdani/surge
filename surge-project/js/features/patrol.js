/* PATROL (rules 'patrol'): free-roam the whole city as a hero. Every so often a VILLAIN ATTACK breaks out somewhere —
   a street crossing, a plaza, a shrine, a mall (either floor) or the SURGE LINE station — and villains start
   terrorising the people there. The minimap shows a pulsing red ring (stuck to the edge when it's far), an arrow
   points the way, and the objective panel counts down. Stop every villain before time runs out:
     - +5 per villain KO, saved civilians pay out as usual (npcs.js), and clearing the incident pays a bonus
     - incidents get bigger as you clear them (more villains, more people in danger); your HERO RANK climbs
     - if the timer runs out the villains get away
   No storm, no last-one-standing: knocked out heroes respawn after 5 s. The match runs until you leave.
   Offline and online: the host runs the incidents (netEvent 'pat'); every player sees the same villains and site.
   The villains come from a pool of sleeping villain fighters added to the roster at the start (matchPrep). */
const PAT={on:false,inc:null,next:0,level:1,cleared:0,failed:0,pool:[],sites:null,best:+(store.get('surge.patBest')||0)};
const PAT_POOL=8,PAT_IDS=980,PAT_TIME=110;
const PAT_RANKS=[[0,'ROOKIE'],[3,'SIDEKICK'],[7,'PRO HERO'],[12,'TOP TEN HERO'],[20,'SYMBOL OF PEACE']];
function patRank(){let r=PAT_RANKS[0][1];for(const [n,t] of PAT_RANKS)if(PAT.cleared>=n)r=t;return r;}
// add the villain pool to the roster (same on every machine), heroes start in the middle of the city
const _patPrep=matchPrep;
matchPrep=function(roster,spawns,mode,rules){if(rules!=='patrol'||game.story||(typeof PR!=='undefined'&&PR.on))return _patPrep(roster,spawns,mode,rules);
  const hum=roster.filter(r=>!r.bot||r.team===0&&mode==='duos').map(r=>Object.assign({},r,{team:0,keepTeam:true}));
  const V=HEROES.map((h,i)=>[h,i]).filter(([h])=>h.faction==='villain'&&!h.raidBoss&&h.id!=='chimera');const seed=hashStr(hum.map(r=>r.name).join('|')+'patrol');
  const R=hum.slice(),S=hum.map((r,i)=>[-12+(i%4)*2.5,18+Math.floor(i/4)*2.5]);
  for(let k=0;k<PAT_POOL;k++){const [h,i]=V[(seed+k*7)%V.length];R.push({id:PAT_IDS+k,name:h.name,hero:i,bot:true,team:9,keepTeam:true});S.push([BOUND-4-k*3,BOUND-4]);}
  return [R,S];};
function patSleep(f){f.dormant=true;f.hold=true;f.rig.root.visible=false;f.invuln=99;f.pos.set(BOUND-4,0,BOUND-4);f.vel.set(0,0,0);f.npcV=null;f.patInc=false;}
function patWake(f,x,y,z,lv){f.reset(x,z,rand(0,6.28));f.pos.y=y;f.dormant=false;f.hold=false;f.invuln=1.2;f.rig.root.visible=true;f.take=Math.max(.72,1-.04*(lv-1));f.patInc=true;f.meter=Math.min(100,lv*12);
  const c=f.chest(new V3());ring(c,f.hero.color,3,.45,false,2.6);burst(ADD,c,30,{colors:[f.hero.color,0x1a0a1a,0xffffff],speed:5,up:2,life:.6,size:.3,bright:2});}
onEv('matchStart',()=>{PAT.on=game.rules==='patrol'&&!game.story&&!(typeof PR!=='undefined'&&PR.on);PAT.inc=null;PAT.level=1;PAT.cleared=0;PAT.failed=0;patMark.x=patMark.z=0;
  PAT.pool=FS.filter(f=>f.id>=PAT_IDS&&f.id<PAT_IDS+PAT_POOL);PAT.pool.forEach(f=>{f.patV=true;patSleep(f);});
  if(!PAT.on)return;PAT.next=game.time+12;setTimeout(()=>{if(inMatch()&&PAT.on)announceSmall('🦸 ON PATROL — WATCH THE MINIMAP FOR VILLAIN ATTACKS');},3800);});
onEv('matchEnd',()=>{PAT.on=false;PAT.inc=null;if(typeof setObj==='function'){setObj('');setArrow(null);}});
/* ---------- where trouble can start ---------- */
const PAT_COLS='ABCDEFGHJKLMNOPQRSTU';
function patSites(){if(PAT.sites)return PAT.sites;const L=[];const nm=(x,z)=>PAT_COLS[Math.max(0,Math.min(19,Math.floor((x+BOUND)/48)))]+(1+Math.floor((z+BOUND)/48));
  INNER.forEach(a=>INNER.forEach(b=>{if(Math.abs(a)>BOUND-30||Math.abs(b)>BOUND-30)return;L.push({x:a,y:0,z:b,r:9,name:'CROSSING '+nm(a,b),w:1});}));
  PLAZAS.forEach(([x,z])=>L.push({x,y:0,z,r:10,name:(SHRINES.some(s=>s[0]===x&&s[1]===z)?'SHRINE ':'PLAZA ')+nm(x,z),w:2}));
  MALLS_INFO.forEach((m,i)=>{L.push({x:m.x,y:0,z:m.z-7,r:3.5,name:'SKY MALL '+nm(m.x,m.z)+' · GROUND FLOOR',w:2,rects:m.walk.filter(q=>q[4]===0)});
    L.push({x:m.x,y:m.H1,z:m.z+7.5,r:3,name:'SKY MALL '+nm(m.x,m.z)+' · FOOD COURT',w:2,rects:m.walk.filter(q=>q[4]===m.H1)});});
  L.push({x:UG.cx,y:UG.plat,z:41.5,r:4,name:'CENTRAL STATION · PLATFORM 1',w:2,rects:[[UG.hx0+4,UG.hx1-4,UG.hz0+1,UG.pS-1.2,UG.plat]]});
  L.push({x:UG.cx-10,y:UG.plat,z:54.5,r:4,name:'CENTRAL STATION · PLATFORM 2',w:1,rects:[[UG.hx0+4,UG.hx1-4,UG.pN+1.2,UG.hz1-1,UG.plat]]});
  return PAT.sites=L;}
function patPoint(S){if(S.rects){for(let k=0;k<30;k++){const r=pick(S.rects),x=rand(r[0],r[1]),z=rand(r[2],r[3]);if(Math.hypot(x-S.x,z-S.z)>14&&k<20)continue;if(!insideBld(x,z,.6,r[4]+.5))return {x,y:r[4],z};}return {x:S.x,y:S.y,z:S.z};}
  const p=randomOpenPoint(S.x,S.z,S.r);return {x:p.x,y:0,z:p.z};}
function patHeroes(){return FS.filter(f=>!f.patV&&!f.dead);}
/* ---------- the host runs incidents ---------- */
function patStart(){const H=patHeroes(),c=H.length?H.reduce((a,f)=>a.add(f.pos),new V3()).multiplyScalar(1/H.length):new V3();
  const S=patSites();let C=S.filter(s=>{const d=Math.hypot(s.x-c.x,s.z-c.z);return d>55&&d<190;});if(!C.length)C=S;
  const tot=C.reduce((a,s)=>a+s.w,0);let r=Math.random()*tot,site=C[0];for(const s of C){r-=s.w;if(r<=0){site=s;break;}}
  const lv=PAT.level,n=Math.min(4,1+Math.floor(lv/2)),free=PAT.pool.filter(f=>f.dormant||f.dead);if(!free.length)return;
  const vs=free.sort(()=>Math.random()-.5).slice(0,n).map(f=>{const p=patPoint(site);return [f.id,+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)];});
  const e={k:'pat',s:'start',si:S.indexOf(site),vs,lv,t:PAT_TIME};netEvent(e);patBegin(e);}
function patBegin(e){const S=patSites(),site=S[e.si];if(!site)return;PAT.level=e.lv;
  const vs=e.vs.map(([id,x,y,z])=>{const f=byFid(id);if(f)patWake(f,x,y,z,e.lv);return f;}).filter(Boolean);
  // people caught up in it (everyone gets their own, like all civilians)
  const civ=[];if(typeof npcMake==='function'&&SET.crowds!==false){const k=6+Math.min(6,e.lv);for(let i=0;i<k;i++){const p=patPoint(site);
      const area=site.rects?site.rects:[[site.x-site.r-4,site.x+site.r+4,site.z-site.r-4,site.z+site.r+4,0]];const n=npcMake(site.rects?'shopper':'shopper',{x:p.x,z:p.z,y:p.y,area});
      if(vs.length){n.danger={by:pick(vs),t:game.time+8};n.mode=Math.random()<.5?'cower':'flee';n.modeT=2;n.from=n.danger.by;}civ.push(n);}}
  PAT.inc={site,vs,t:e.t,start:game.time,civ};patMark.x=site.x;patMark.z=site.z;
  const d=ME?Math.round(Math.hypot(ME.pos.x-site.x,ME.pos.z-site.z)):0;
  announce('🚨 VILLAIN ATTACK!','#ff3a3a');announceSmall(`${site.name} — ${vs.length} VILLAIN${vs.length>1?'S':''} · ${d} m`);feed(`<b style="--c:#ff4a5a">VILLAIN ATTACK</b> at ${esc(site.name)}`);
  AU.scale=1;AU.sting&&AU.sting(true);[660,880,660,880].forEach((f,i)=>AU.tone('square',f,f,.16,.05,i*.2));}
function patEnd(ok,net){const I=PAT.inc;if(!I)return;PAT.inc=null;if(!net&&NET.role!=='client')netEvent({k:'pat',s:ok?'clear':'fail'});
  if(ok){PAT.cleared++;const safe=I.civ.filter(n=>n.mode!=='down'&&n.mode!=='gone').length;announce('INCIDENT CLEARED','#5aff8a');
    if(ME&&!ME.patV){addPoints(20+10*PAT.level,'INCIDENT CLEARED');if(safe)addPoints(2*safe,'CIVILIANS SAFE');if(typeof progAddXP==='function')progAddXP(mySel,60+20*PAT.level,'PATROL');}
    if(PAT.cleared>PAT.best){PAT.best=PAT.cleared;store.set('surge.patBest',String(PAT.best));}
    PAT.level++;AU.scale=1;AU.bell&&AU.bell();}
  else{PAT.failed++;announce('THE VILLAINS GOT AWAY','#ff8a3a');I.vs.forEach(f=>{if(!f.dead&&!f.dormant){portal(f.chest(new V3()),2.2,true,1);patSleep(f);}});}
  setTimeout(()=>{I.vs.forEach(f=>{if(f.dead&&!f.patInc)patSleep(f);});},2600);
  PAT.next=game.time+rand(14,24);}
onEv('net:pat',e=>{if(e.s==='start')patBegin(e);else if(e.s==='clear')patEnd(true,true);else if(e.s==='fail')patEnd(false,true);else if(e.s==='sleep'){const f=byFid(e.f);if(f)patSleep(f);}});
/* ---------- knock-outs: villains go back to the pool, heroes respawn ---------- */
const _patElim=game.onElim;
game.onElim=function(v,k){if(!PAT.on)return _patElim(v,k);if(NET.role==='client')return;if(k&&!ally(k,v))k.kills++;netEvent({k:'elim',v:v.id,a:k?k.id:-1,pl:0});
  if(v.patV){v.patInc=false;handleElim(v,k,0);setTimeout(()=>{if(PAT.on&&v.dead){patSleep(v);netEvent({k:'pat',s:'sleep',f:v.id});}},2600);return;}
  handleElim(v,k,0);};
onEv('tick',dt=>{if(!PAT.on||game.phase!=='fight')return;
  // respawns (host)
  if(NET.role!=='client')for(const f of FS){if(f.patV||!f.dead||f.respT==null)continue;f.respT-=dt;if(f.respT<=0){const p=randomOpenPoint(f.pos.x,f.pos.z,25);respawnFighter(f,p.x,p.z);netEvent({k:'resp',v:f.id,x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10});}}
  const I=PAT.inc;if(!I){if(NET.role!=='client'&&game.time>PAT.next)patStart();return;}
  I.t-=dt;if(NET.role==='client')return;
  if(I.vs.every(f=>f.dead||f.dormant))patEnd(true);else if(I.t<=0)patEnd(false);});
/* ---------- HUD: objective panel, arrow, minimap ring ---------- */
const patMark={x:0,z:0,col:'#ff3a3a',r:8,pulse:true,ring:true,edge:true,label:'!',tcol:'#fff',on:()=>PAT.on&&!!PAT.inc};MAP_MARKS.push(patMark);
function patHUD(F){$('alive').textContent=`${patRank()} · ${PAT.cleared} CLEARED · BEST ${PAT.best}`;
  const I=PAT.inc;if(game.phase==='countdown'){$('zinfo').textContent='STARTING PATROL…';return;}
  if(F&&F.dead){$('zinfo').textContent=`KNOCKED OUT · BACK IN ${Math.max(1,Math.ceil(F.respT||0))}`;}
  else $('zinfo').textContent=I?`🚨 ${I.site.name}`:`ON PATROL · LEVEL ${PAT.level}`;
  if(!ME)return;
  if(I){const left=Math.max(0,I.t),m=Math.floor(left/60),s=Math.floor(left%60),alive=I.vs.filter(f=>!f.dead&&!f.dormant).length,d=Math.round(Math.hypot(ME.pos.x-I.site.x,ME.pos.z-I.site.z));
    const danger=I.civ.filter(n=>n.danger&&game.time<n.danger.t&&n.mode!=='down'&&n.mode!=='gone').length,down=I.civ.filter(n=>n.mode==='down').length;
    setObj(`<b>🚨 VILLAIN ATTACK · ${esc(I.site.name)}</b> · ${alive}/${I.vs.length} VILLAINS LEFT<br><span>${m}:${String(s).padStart(2,'0')} LEFT · ${d} m · ${danger} IN DANGER${down?` · ${down} HURT (HOLD R TO CARRY)`:''}</span>`);
    setArrow(d>8?{x:I.site.x,z:I.site.z}:null);}
  else{setObj(`<b>ON PATROL</b> · ${patRank()} · LEVEL ${PAT.level}<br><span>${PAT.cleared} incidents cleared · ${PAT.failed} got away · listening for trouble…</span>`);setArrow(null);}}
