/* ACHIEVEMENTS · RANKED · FIGHTER MASTERY  (new tabs on the PROGRESS screen)
   ACHIEVEMENTS  ~30 badges, unlocked with a toast. Add one: push {id,n:'NAME',d:'description'} to ACH and call achGive(id) somewhere.
   RANKED        every battle royale (not story/practice) moves your Rank Points by placement and KOs.
                 Tiers: ROOKIE → SIDEKICK → PRO → ACE → LEGEND → SYMBOL. A new season starts each month (RP halves).
   MASTERY       XP per fighter: titles at levels 3 (ADEPT), 6 (EXPERT), 10 (MASTER); level 7+ adds a gold ring to their
                 ultimate opening; MASTER shows a gold title next to your name in matches. */
const ACH=[
  ['first','FIRST BLOOD','Get your first KO'],['ko10','BRAWLER','10 KOs'],['ko100','HEADHUNTER','100 KOs'],['ko500','LEGEND OF THE STREETS','500 KOs'],
  ['win1','PLUS ULTRA','Win a battle royale'],['win10','REGULAR HERO','Win 10 battle royales'],['win50','SYMBOL OF VICTORY','Win 50 battle royales'],
  ['noult','NO SHORTCUTS','Win without using your ultimate'],['clutch','BY A THREAD','Win with under 15 HP'],['fresh','UNTOUCHABLE','Win with over 75 HP'],
  ['combo10','COMBO KING','Land a 10-hit combo'],['dmg1k','HEAVY HITTER','Deal 1,000 damage in one match'],['ko5','RAMPAGE','5 KOs in one match'],
  ['car','CAR TOSS','KO someone with a thrown car'],['meteor','DUCK AND COVER','Survive a Meteor Shower'],['gold','GOLD DIGGER','Grab 5 gold orbs in one match'],
  ['clip1','DIRECTOR','Save your first clip'],['clip10','HIGHLIGHT REEL','Save 10 clips'],['train','LAST STOP','Get hit by the train'],
  ['awaken','AWAKENED','Awaken your power'],['teamup','TEAM PLAYER','Pull off a team-up'],['civ','RESCUER','Save 10 civilians'],
  ['share','GOING VIRAL','Share or download a clip'],['roster10','VERSATILE','Win with 10 different fighters'],['roster','FULL ROSTER','Play every fighter'],
  ['law','THE LAW','Lay down a law as Decree'],['erase','NOT ON MY WATCH','Erase a power for 5 s as Snare'],['wall','STRAIGHT UP','Glide up a 30 m wall as Skitter'],
  ['rankpro','GOING PRO','Reach PRO rank'],['master','MASTER','Reach mastery 10 with any fighter']].map(([id,n,d])=>({id,n,d}));
const ACHS=(()=>{try{return JSON.parse(store.get('surge.ach')||'{}');}catch(e){return {};}})();ACHS.u=ACHS.u||{};ACHS.c=ACHS.c||{};
function achSave(){store.set('surge.ach',JSON.stringify(ACHS));}
function achGive(id){if(ACHS.u[id]||game.practice)return;const A=ACH.find(a=>a.id===id);if(!A)return;ACHS.u[id]=Date.now();achSave();
  const e=document.createElement('div');e.className='achpop';e.innerHTML=`<i>ACHIEVEMENT UNLOCKED</i><b>${A.n}</b><span>${A.d}</span>`;document.body.appendChild(e);setTimeout(()=>e.remove(),4200);
  if(AU.levelUp)AU.levelUp();}
function achAdd(k,n){ACHS.c[k]=(ACHS.c[k]||0)+(n||1);achSave();return ACHS.c[k];}
const real=()=>inMatch()&&!game.practice&&!game.story;

/* ---------- tracking ---------- */
const AM={};onEv('matchStart',()=>{AM.ult=false;AM.kos=0;AM.gold=0;AM.carT=0;AM.ended=false;AM.mapk=game.mapK||'city';if(ME&&real()){const L=ACHS.c.played||{};L[ME.hero.id]=1;ACHS.c.played=L;achSave();if(Object.keys(L).length>=HEROES.length)achGive('roster');}});
onEv('ult',f=>{if(f===ME)AM.ult=true;});
onEv('kill',(d,a)=>{if(!real()||!ME)return;if(a===ME&&d!==ME){AM.kos++;const n=achAdd('kos');achGive('first');if(n>=10)achGive('ko10');if(n>=100)achGive('ko100');if(n>=500)achGive('ko500');if(AM.kos>=5)achGive('ko5');if(game.time-AM.carT<3)achGive('car');}});
onEv('carMe',()=>{AM.carT=game.time;});
onEv('awakenMe',()=>achGive('awaken'));onEv('teamupMe',()=>achGive('teamup'));onEv('civSaved',()=>{if(achAdd('civ')>=10)achGive('civ');});
onEv('recap',S=>{if(S.best>=10)achGive('combo10');if(S.dmg>=1000)achGive('dmg1k');});
onEv('tick',dt=>{if(!ME||!real())return;
  if(typeof SURGE!=='undefined'){if(SURGE.ev==='meteors'){AM.met=true;}else if(AM.met){AM.met=false;if(!ME.dead)achGive('meteor');}
}
  if(ME.glideOn&&ME.pos.y>30)achGive('wall');
  if(heroIs(ME,'snare')&&ME.eyeT>=5)achGive('erase');
  if(ME.trainT>game.time&&!AM.tr){AM.tr=1;achGive('train');}});
if(typeof surgeTake==='function'){const _st=surgeTake;surgeTake=function(i,f){const r=_st.apply(this,arguments);if(f===ME&&real()){AM.gold++;if(AM.gold>=5)achGive('gold');}return r;};}
if(typeof giveOrder==='function'){const _go=giveOrder;giveOrder=function(f,k){const r=_go.apply(this,arguments);if(f===ME&&k==='law')achGive('law');return r;};}

/* ---------- end of match: wins, rank, mastery ---------- */
function matchDone(){if(AM.ended||!ME||!real())return;AM.ended=true;const won=game.winner&&ally(game.winner,ME),S=typeof rcS==='function'?rcS(ME.id):{dmg:0,kos:0};
  if(won){const n=achAdd('wins');achGive('win1');if(n>=10)achGive('win10');if(n>=50)achGive('win50');if(!AM.ult)achGive('noult');if(ME.hp<15)achGive('clutch');if(ME.hp>75)achGive('fresh');
    const W=ACHS.c.wonWith||{};W[ME.hero.id]=1;ACHS.c.wonWith=W;achSave();
    if(Object.keys(W).length>=10)achGive('roster10');}
  if(game.rules==='br')rankApply(won);masteryApply(won,S);}
onEv('tick',()=>{if(game.phase==='over')matchDone();if(ME&&ME.dead&&RC.died&&game.rules==='br'&&!game.story&&game.time-RC.died>.5)matchDone();});

/* ranked */
const TIERS=[['ROOKIE',0,'#9aa4b4'],['SIDEKICK',150,'#5ad8a0'],['PRO',350,'#3a9aff'],['ACE',650,'#b06aff'],['LEGEND',1000,'#ffb03a'],['SYMBOL',1500,'#ff3a4a']];
const RANK=(()=>{try{return JSON.parse(store.get('surge.rank')||'{}');}catch(e){return {};}})();
function seasonId(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1);}
function rankSeason(){if(RANK.season!==seasonId()){if(RANK.season)RANK.rp=Math.floor((RANK.rp||0)*.5);RANK.season=seasonId();RANK.best=RANK.rp||0;store.set('surge.rank',JSON.stringify(RANK));}}
function tierOf(rp){let t=TIERS[0];for(const T of TIERS)if(rp>=T[1])t=T;return t;}
function rankApply(won){rankSeason();const N=Math.max(2,FS.length),pl=won?1:(ME.place||N),k=AM.kos;
  let d=Math.round((N-pl)/(N-1)*40-12)+k*5+(won?15:0);const before=RANK.rp||0;RANK.rp=Math.max(0,before+d);RANK.best=Math.max(RANK.best||0,RANK.rp);RANK.last=RANK.rp-before;
  store.set('surge.rank',JSON.stringify(RANK));const t0=tierOf(before),t1=tierOf(RANK.rp);if(t1!==t0&&RANK.rp>before)setTimeout(()=>announce('RANK UP: '+t1[0],t1[2]),2500);
  if(RANK.rp>=350)achGive('rankpro');}
/* mastery */
const MAST=(()=>{try{return JSON.parse(store.get('surge.mastery')||'{}');}catch(e){return {};}})();
const MLV=[0,100,250,450,700,1000,1400,1900,2500,3200];
function mLevel(id){const x=MAST[id]||0;let l=1;MLV.forEach((v,i)=>{if(x>=v)l=i+1;});return l;}
function mTitle(l){return l>=10?'MASTER':l>=6?'EXPERT':l>=3?'ADEPT':'';}
function masteryApply(won,S){const id=ME.hero.id,l0=mLevel(id);const gain=20+15*AM.kos+(won?60:0)+Math.floor((S.dmg||0)/20);MAST[id]=(MAST[id]||0)+gain;MAST._last={id,gain};store.set('surge.mastery',JSON.stringify(MAST));
  const l1=mLevel(id);if(l1>l0)setTimeout(()=>announce(ME.hero.name+' MASTERY '+l1+(mTitle(l1)?' · '+mTitle(l1):''),ME.hero.css),3200);if(l1>=10)achGive('master');}
// shown in the recap
function rcExtra(){let s='';if(!real()&&!(game.phase==='over'))return s;rankSeason();const t=tierOf(RANK.rp||0);
  s+=`<div><span>RANK</span><b style="color:${t[2]}">${t[0]} · ${RANK.rp||0} RP${RANK.last!=null&&AM.ended?` (${RANK.last>=0?'+':''}${RANK.last})`:''}</b></div>`;
  if(ME){const l=mLevel(ME.hero.id);s+=`<div><span>MASTERY</span><b>LV ${l}${mTitle(l)?' · '+mTitle(l):''}${MAST._last&&MAST._last.id===ME.hero.id&&AM.ended?' (+'+MAST._last.gain+' XP)':''}</b></div>`;}return s;}
// mastery 7+: gold ring on the ultimate opening · MASTER: gold title next to your name
onEv('ult',f=>{if(f===ME&&mLevel(f.hero.id)>=7)setTimeout(()=>{if(!f.dead)ring(f.chest(new V3()),0xffd23f,4,.4,false,2.8);},300);});
onEv('matchStart',()=>{if(!ME)return;const l=mLevel(ME.hero.id),t=mTitle(l);if(t&&$('meName'))$('meName').innerHTML+=` <span class="mtitle ${l>=10?'gold':''}">${t}</span>`;});
// fighter select: mastery tag
const _acPv=previewHero;previewHero=function(i){const r=_acPv.apply(this,arguments);try{const h=heroAt(i),l=mLevel(h.id),T=$('pvTags2');if(T&&!(i>=CUST0))T.innerHTML+=`<span class="tag o">MASTERY ${l}${mTitle(l)?' · '+mTitle(l):''}</span>`;}catch(e){}return r;};

/* ---------- progress screen tabs ---------- */
const _acProg=showProgress;
showProgress=function(tab){const want=tab||PG.tab||'ch',mine=['ach','rank','mas'].indexOf(want)>=0;_acProg.call(this,mine?'ch':want);PG.tab=want;
  const T=$('pgTabs');T.innerHTML=[['ch','CHALLENGES'],['sp','SEASON PASS'],['sk','SKILLS'],['ach','ACHIEVEMENTS'],['rank','RANKED'],['mas','MASTERY']].map(([k,n])=>`<button class="chip ${want===k?'on':''}" data-t="${k}">${n}</button>`).join('');
  [...T.children].forEach(b=>b.onclick=()=>{AU.ui();showProgress(b.dataset.t);});if(!mine)return;const B=$('pgBody');
  if(want==='ach'){const n=ACH.filter(a=>ACHS.u[a.id]).length;B.innerHTML=`<div class="seth">${n} / ${ACH.length} UNLOCKED</div><div class="achgrid">${ACH.map(a=>`<div class="ach ${ACHS.u[a.id]?'got':''}"><b>${ACHS.u[a.id]?'★ ':''}${a.n}</b><span>${a.d}</span></div>`).join('')}</div>`;}
  if(want==='rank'){rankSeason();const rp=RANK.rp||0,t=tierOf(rp),i=TIERS.indexOf(t),nx=TIERS[i+1];
    B.innerHTML=`<div class="sph"><b style="color:${t[2]}">${t[0]}</b> · ${rp} RP · SEASON ${RANK.season}<div class="chb big"><i style="width:${nx?Math.min(100,(rp-t[1])/(nx[1]-t[1])*100):100}%;background:${t[2]}"></i></div><span>${nx?(nx[1]-rp)+' RP TO '+nx[0]:'TOP TIER!'} · season best ${RANK.best||rp} RP</span></div>
      <div class="ranktiers">${TIERS.map(T=>`<div class="${rp>=T[1]?'got':''}" style="--c:${T[2]}"><b>${T[0]}</b><span>${T[1]} RP</span></div>`).join('')}</div>
      <div class="mdnote">Every battle royale counts: better placements and KOs earn RP, early knockouts cost a little. A new season starts each month and your RP is halved.</div>`;}
  if(want==='mas'){const L=HEROES.map(h=>({h,l:mLevel(h.id),x:MAST[h.id]||0})).sort((a,b)=>b.x-a.x);
    B.innerHTML=`<div class="mdnote">Mastery XP comes from playing a fighter: KOs, damage and wins. LV 3 ADEPT · LV 6 EXPERT · LV 7 gold ultimate ring · LV 10 MASTER (gold title in matches).</div><div class="mastgrid">${L.map(({h,l,x})=>{const nx=MLV[l]||null,pv=MLV[l-1];
      return `<div class="mast"><b style="color:${h.css}">${h.name}</b><span>LV ${l}${mTitle(l)?' · '+mTitle(l):''}</span><div class="chb"><i style="width:${nx?(x-pv)/(nx-pv)*100:100}%"></i></div></div>`;}).join('')}</div>`;}};
