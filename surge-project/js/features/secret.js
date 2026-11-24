/* SECRET: on the title screen, press every letter A–Z (any order). Unlocks everything and maxes out every fighter:
   all shop items, costumes and season rewards owned; every fighter at level 20 with all skills at rank 5 and mastery 10;
   +100,000 points. Ranked and achievements stay earned the normal way.
   Saved like normal progress (and wiped with it by the anti-teaming penalty). */
const SECRET={keys:new Set()};
PROGRESS_KEYS.push('surge.secret');
ACH.push({id:'secret',n:'ALPHABET SOUP',d:'Find the title-screen secret'});
function secretOn(){return store.get('surge.secret')==='1';}
const _secOwns=owns;owns=function(key){return secretOn()||_secOwns.apply(this,arguments);};

function secretUnlock(){store.set('surge.secret','1');
  // every fighter (built-in and your created ones): max level, max skills, max mastery
  const ids=HEROES.map((h,i)=>i).concat(CSPECS.map((c,i)=>CUST0+i));let xp=0;for(let L=1;L<MAXLV;L++)xp+=lvNeed(L);
  ids.forEach(i=>{try{const k=heroKey(i);PROG[k]=Math.max(PROG[k]||0,xp);const S={};SKILLS.forEach(([s])=>S[s]=SK_MAX);META.skills[k]=S;}catch(e){}});
  HEROES.forEach(h=>{MAST[h.id]=Math.max(MAST[h.id]||0,MLV[MLV.length-1]);});
  progSave();store.set('surge.mastery',JSON.stringify(MAST));
  // season pass complete (its item rewards are covered by owning everything)
  META.sxp=Math.max(META.sxp,SEASON.tiers.length*SEASON.per);META.claimed=SEASON.tiers.length;metaSave();
  POINTS+=100000;store.set('surge.points',String(POINTS));try{renderPoints();}catch(e){}
  try{achGive('secret');}catch(e){}
  secretShow();}
function secretShow(){let b=$('secretBox');if(!b){b=document.createElement('div');b.id='secretBox';document.body.appendChild(b);}
  b.innerHTML=`<div><small>SECRET FOUND</small><b>EVERYTHING UNLOCKED</b><span>All fighters maxed · every costume, emote, pose, card, tag and pet · +100,000 points</span></div>`;
  b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('on'),5200);
  try{AU.init();AU.scale=1;AU.levelUp&&AU.levelUp();setTimeout(()=>AU.fanfare&&AU.fanfare(),350);}catch(e){}
  try{if(typeof buildCards==='function')buildCards();if(typeof previewHero==='function'&&PV&&PV.idx!=null)previewHero(PV.idx);}catch(e){}}
addEventListener('keydown',e=>{const t=$('title');if(!t||!t.classList.contains('on')||inMatch()){SECRET.keys.clear();return;}
  const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
  const m=/^Key([A-Z])$/.exec(e.code);if(!m||e.ctrlKey||e.metaKey||e.altKey)return;SECRET.keys.add(m[1]);
  if(SECRET.keys.size===26){SECRET.keys.clear();secretUnlock();}});
