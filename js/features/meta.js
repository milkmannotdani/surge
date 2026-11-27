/* PROGRESS screen: daily & weekly CHALLENGES, the free SEASON PASS track, and per-fighter SKILL upgrades.
   Challenges count events (see CH_POOL 'ev'); new ones each day / week. Season XP comes from all fighter XP plus challenges.
   Skills: every fighter gets 1 skill point per level after 1. Skills apply in offline matches, story and missions
   (online matches stay even for everyone). */
const CH_POOL=[
  {id:'ko',t:'Knock out {n} fighters',ev:'ko',d:[5,8],w:[40,60]},{id:'win',t:'Win {n} matches',ev:'win',d:[1,2],w:[5,8]},
  {id:'civ',t:'Rescue {n} civilians',ev:'civ',d:[5,8],w:[25,40]},{id:'tu',t:'Land {n} team-up combos',ev:'tu',d:[1,2],w:[5,8]},
  {id:'ult',t:'Use {n} ultimates',ev:'ult',d:[5,8],w:[25,40]},{id:'awk',t:'Switch modes {n} times',ev:'awk',d:[3,5],w:[10,15]},
  {id:'play',t:'Finish {n} matches',ev:'play',d:[3,4],w:[12,18]},{id:'dmg',t:'Deal {n} damage',ev:'dmg',d:[1500,2500],w:[9000,14000]},
  {id:'car',t:'Throw {n} cars',ev:'car',d:[2,3],w:[8,12]},{id:'mis',t:'Clear {n} story missions or missions',ev:'mis',d:[1,2],w:[5,7]},
  {id:'vwin',t:'Win {n} matches as a villain',ev:'vwin',d:[1,1],w:[3,5]},{id:'raid',t:'Defeat {n} raid bosses',ev:'raid',d:[1,1],w:[3,4]},
  {id:'nomu',t:'Help defeat {n} Giga Nomu',ev:'nomu',d:[1,1],w:[2,3]}];
let META={};try{META=JSON.parse(store.get('surge.meta')||'{}')||{};}catch(e){META={};}
META.sxp=META.sxp||0;META.claimed=META.claimed||0;META.skills=META.skills||{};
function metaSave(){store.set('surge.meta',JSON.stringify(META));}
function dayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function weekKey(){const d=new Date(),j=new Date(d.getFullYear(),0,1);return d.getFullYear()+'-W'+Math.ceil(((d-j)/864e5+j.getDay()+1)/7);}
function seededPick(seed,n){const ids=CH_POOL.map((c,i)=>i);let h=hashStr(seed);const out=[];while(out.length<n){h=(h*1103515245+12345)&0x7fffffff;const i=ids.splice(h%ids.length,1)[0];out.push(i);}return out;}
function chRefresh(){const dk=dayKey(),wk=weekKey();
  if(META.day!==dk){META.day=dk;META.d=seededPick('d'+dk,3).map(i=>{const C=CH_POOL[i];return {id:C.id,n:C.d[hashStr(dk+C.id)%2],p:0,done:false};});}
  if(META.week!==wk){META.week=wk;META.w=seededPick('w'+wk,3).map(i=>{const C=CH_POOL[i];return {id:C.id,n:C.w[hashStr(wk+C.id)%2],p:0,done:false};});}metaSave();}
function chBump(ev,amt){chRefresh();let any=false;for(const [L,pts,sx] of [[META.d,40,150],[META.w,150,500]])for(const c of L){const C=CH_POOL.find(x=>x.id===c.id);if(!C||C.ev!==ev||c.done)continue;
    c.p=Math.min(c.n,c.p+(amt||1));any=true;if(c.p>=c.n){c.done=true;setTimeout(()=>{announceSmall('CHALLENGE COMPLETE: '+C.t.replace('{n}',c.n).toUpperCase());addPoints(pts,'CHALLENGE');seasonXP(sx);},300);}}
  if(any)metaSave();}
// what counts
onEv('kill',(d,a)=>{if(a&&a===ME&&!ally(a,d)){chBump('ko');if(d.evt)chBump('nomu');}else if(d.evt&&ME&&!ME.dead&&ME.pos.distanceTo(d.pos)<30)chBump('nomu');});
onEv('win',w=>{if(!w||!ME||!ally(w,ME)||game.story)return;chBump('win');if(ME.hero.faction==='villain')chBump('vwin');if(game.rules==='raid')chBump('raid');});
onEv('civSaved',()=>chBump('civ'));onEv('teamupMe',()=>chBump('tu'));onEv('modeMe',()=>chBump('awk'));onEv('carMe',()=>chBump('car'));
onEv('ult',f=>{if(f===ME)chBump('ult');});
onEv('hit',(a,d,dmg)=>{if(a===ME&&!game.practice&&!ally(a,d)){META._dmg=(META._dmg||0)+dmg;if(META._dmg>=50){chBump('dmg',Math.floor(META._dmg));META._dmg=0;}}});
onEv('matchEnd',()=>{if(ME&&!game.practice&&game.matchT>30&&!game.story)chBump('play');});
onEv('missionEnd',(win,S)=>{if(win)chBump('mis');});
/* ---------------- season pass ---------------- */
const SEASON={name:'SEASON 1 · PLUS ULTRA',per:500,tiers:[
  ['pts',100],['card','dusk'],['emote','flex'],['tag','neon'],['pts',150],['pet','orb'],['pose','power'],['card','circuit'],['emote','dance'],['pts',200],
  ['tag','toxic'],['pet','slime'],['card','stars'],['emote','salute'],['pts',250],['pose','hover'],['tag','ice'],['pet','ghost'],['card','sakura'],['pts',300],
  ['emote','laugh'],['pet','drone'],['pose','salute'],['card','glitch'],['pts',400],['tag','rainbow'],['pet','fox'],['card','champion'],['pet','dragon'],['skin','season1']]};
Object.assign(SKINS_U,{season1:['Season 1: Plus Ultra',0x0a0a1a,0xf2f2f2,0xe8262c,0xffd23f,'gloss',LOCKED]});
UNLOCKS.season1={why:'Reach tier 30 of the Season 1 pass',ok:()=>seasonTier()>=30};
function seasonTier(){return Math.min(SEASON.tiers.length,Math.floor(META.sxp/SEASON.per));}
function rewardName(r){const [k,v]=r;if(k==='pts')return '★ '+v+' POINTS';if(k==='card')return 'CARD · '+CARDS[v].n;if(k==='tag')return 'NAME TAG · '+TAGS[v].n;if(k==='pet')return 'PET · '+PETS[v].n;
  if(k==='emote')return 'EMOTE · '+((typeof EMOTES!=='undefined'&&EMOTES[v])?EMOTES[v].n:v);if(k==='pose')return 'VICTORY POSE · '+((typeof VPOSES!=='undefined'&&VPOSES[v])?VPOSES[v].n:v);if(k==='skin')return 'COSTUME · '+SKINS_U[v][0];return k;}
function grantReward(r){const [k,v]=r;if(k==='pts'){POINTS+=v;store.set('surge.points',String(POINTS));renderPoints();return;}if(k==='skin')return;INV.own[k+':'+v]=1;saveInv();}
function seasonXP(n){if(!n)return;const before=seasonTier();META.sxp+=n;const now=seasonTier();
  while(META.claimed<now){const r=SEASON.tiers[META.claimed];grantReward(r);META.claimed++;const tn=META.claimed;setTimeout(()=>{announceSmall(`SEASON TIER ${tn}: ${rewardName(r)}`);AU.levelUp();},900+tn*50);}metaSave();}
const _progAddXP0=progAddXP;progAddXP=function(i,n,why){_progAddXP0(i,n,why);if(i!=null&&!game.practice&&n)seasonXP(n);};
/* ---------------- skills ---------------- */
const SKILLS=[['pow','POWER','+3% damage per rank'],['vit','VITALITY','−3% damage taken per rank'],['spd','SPEED','+2% move speed per rank'],['foc','FOCUS','−5% special cooldown per rank'],['srg','SURGE','+8% ultimate meter gain per rank']];
const SK_MAX=5;
function skOf(i){const k=heroKey(i);return META.skills[k]||(META.skills[k]={});}
function skPoints(i){const lv=progLevel(heroKey(i)),S=skOf(i);return Math.max(0,lv-1-Object.values(S).reduce((a,b)=>a+b,0));}
function skOn(){return NET.role==='off'&&!game.practice;}
onEv('matchStart',()=>{if(!ME||!skOn())return;const i=myHeroIdx(),S=skOf(i);ME.sk=S;if(!Object.keys(S).length)return;const h=ME.hero;
  ME.hero=Object.assign({},h,{pow:h.pow*(1+.03*(S.pow||0)),spd:h.spd*(1+.02*(S.spd||0)),specCD:(h.specCD||2.2)*(1-.05*(S.foc||0))});});
onEv('hit',(a,d,dmg)=>{if(!skOn())return;if(d===ME&&ME.sk&&ME.sk.vit)d.hp+=dmg*.03*ME.sk.vit;if(a===ME&&ME.sk&&ME.sk.srg)a.meter=Math.min(100,a.meter+dmg*1.3*.08*ME.sk.srg);});
/* ---------------- the PROGRESS screen ---------------- */
const PG={tab:'ch',hero:0};
function showProgress(tab){if(tab)PG.tab=tab;chRefresh();showScreen('prog');const T=$('pgTabs');T.innerHTML=[['ch','CHALLENGES'],['sp','SEASON PASS'],['sk','SKILLS']].map(([k,n])=>`<button class="chip ${PG.tab===k?'on':''}" data-t="${k}">${n}</button>`).join('');
  [...T.children].forEach(b=>b.onclick=()=>{AU.ui();showProgress(b.dataset.t);});const B=$('pgBody');
  if(PG.tab==='ch'){const row=(c,pts)=>{const C=CH_POOL.find(x=>x.id===c.id);return `<div class="chrow ${c.done?'done':''}"><div class="cht">${C.t.replace('{n}',c.n.toLocaleString())}</div><div class="chb"><i style="width:${c.p/c.n*100}%"></i></div><div class="chn">${c.done?'✔ DONE':c.p.toLocaleString()+' / '+c.n.toLocaleString()}</div><div class="chr">+${pts} ★</div></div>`;};
    B.innerHTML=`<div class="seth">DAILY · NEW EVERY DAY</div>${META.d.map(c=>row(c,40)).join('')}<div class="seth">WEEKLY · NEW EVERY WEEK</div>${META.w.map(c=>row(c,150)).join('')}<div class="mdnote">Challenges also give Season XP.</div>`;}
  else if(PG.tab==='sp'){const t=seasonTier(),into=META.sxp-t*SEASON.per;
    B.innerHTML=`<div class="sph"><b>${SEASON.name}</b> · TIER ${t} / ${SEASON.tiers.length}<div class="chb big"><i style="width:${t>=SEASON.tiers.length?100:into/SEASON.per*100}%"></i></div><span>${t>=SEASON.tiers.length?'SEASON COMPLETE!':into+' / '+SEASON.per+' SEASON XP TO NEXT TIER · earn it by playing anything'}</span></div>
      <div class="sptrack">${SEASON.tiers.map((r,i)=>`<div class="spt ${i<t?'got':''} ${i===t?'next':''}"><b>${i+1}</b><span>${rewardName(r)}</span></div>`).join('')}</div>`;
    const nx=B.querySelector('.spt.next');if(nx)nx.scrollIntoView({block:'nearest',inline:'center'});}
  else{const h=heroAt(PG.hero),S=skOf(PG.hero),pts=skPoints(PG.hero);
    B.innerHTML=`<div class="skh"><select id="pgHero">${HEROES.map((x,i)=>`<option value="${i}" ${i===PG.hero?'selected':''}>${x.name}</option>`).join('')}</select> <b style="color:${h.css}">LV ${progLevel(heroKey(PG.hero))}</b> · <span>${pts} SKILL POINT${pts===1?'':'S'}</span></div>
      ${SKILLS.map(([k,n,d])=>`<div class="setrow"><span class="setl">${n}<small>${d}</small></span><div class="skr">${[1,2,3,4,5].map(r=>`<i class="${(S[k]||0)>=r?'on':''}"></i>`).join('')}</div><button class="chip" data-k="${k}" ${pts<=0||(S[k]||0)>=SK_MAX?'disabled':''}>+ UPGRADE</button></div>`).join('')}
      <div class="rowb" style="margin-top:8px"><button class="btn ghost sm" id="skReset">REFUND POINTS</button></div><div class="mdnote">Earn 1 skill point per level. Skills work in offline matches, story mode and missions — online matches stay fair for everyone.</div>`;
    $('pgHero').onchange=e=>{PG.hero=+e.target.value;AU.ui();showProgress();};
    B.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(skPoints(PG.hero)>0&&(S[k]||0)<SK_MAX){S[k]=(S[k]||0)+1;metaSave();AU.levelUp();showProgress();}});
    $('skReset').onclick=()=>{META.skills[heroKey(PG.hero)]={};metaSave();AU.ui();showProgress();};}}
$('bProgress').onclick=()=>{AU.init();AU.ui();PG.hero=Math.min(mySel,HEROES.length-1);showProgress('ch');};
$('pgBack').onclick=()=>{AU.ui();showScreen('title');};
chRefresh();
