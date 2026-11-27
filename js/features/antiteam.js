/* ANTI-TEAMING — the Truce Meter (online solo matches only; bots and offline play are never affected).
   The host watches every pair of real players. The meter for a pair fills ONLY while the two:
     • stay within 16 m of each other,  • never hurt each other,  • and both damage the same third player.
   Hurting each other drains it hard. Each time it fills, the pair gets a strike:
     STRIKE 1  MARKED    — a red TEAMING tag shows them through walls to everyone, plus a warning
     STRIKE 2  WEAKENED  — they deal 30% less damage for 40 s
     STRIKE 3  DESTROYED — both explode, are eliminated, and lose ALL saved progress
                           (skins, pets, points, levels, season pass, skills, missions, story, training, created fighters)
   Safeguard: before wiping, each player's own game double-checks that it really saw them spend a long time
   next to that same player this match — a host alone can't trigger a wipe on someone it never saw teaming.
   Strikes fade after 90 s without cooperating. Settings, keybinds and your name are never erased. */
const TRUCE={pairs:{},hitLog:{},near:{},R:16,FILL:4,FADE:90,CONFIRM:45};
const PROGRESS_KEYS=['surge.inv','surge.points','surge.prog','surge.meta','surge.mis','surge.story','surge.vstory','surge.train','surge.customs','surge.hero','surge.armor','surge.ach','surge.rank','surge.mastery'];
const isHuman=f=>f&&!f.isBot&&!f.dummy&&!f.raidBoss;
function truceOn(){return (NET.role==='host'||window.__truceTest)&&inMatch()&&!game.story&&!game.practice&&game.rules!=='raid';}
const pairKey=(a,b)=>a.id<b.id?a.id+':'+b.id:b.id+':'+a.id;

onEv('matchStart',()=>{TRUCE.pairs={};TRUCE.hitLog={};TRUCE.near={};FS.forEach(f=>{f.teamMark=0;f.teamWeak=0;});truceTag();
  if(NET.role&&NET.role!=='off'&&!game.story&&game.rules!=='raid')setTimeout(()=>announceSmall('SOLO MATCH: TEAMING IS DETECTED — 3 STRIKES AND YOU\'RE DESTROYED AND LOSE ALL PROGRESS'),3000);});

// record who damaged whom; betrayal between a pair drains their meter
onEv('hit',(a,d,dmg)=>{if(!a||!d||a===d||!(dmg>0))return;(TRUCE.hitLog[a.id]||(TRUCE.hitLog[a.id]={}))[d.id]=game.time;
  const P=TRUCE.pairs[pairKey(a,d)];if(P){P.m=Math.max(0,P.m-60);P.betray=game.time;}});

let truceAcc=0;
onEv('tick',dt=>{
  // every player's own game keeps its own record of time spent near each other player (used to confirm a wipe)
  if(ME&&!ME.dead&&inMatch())for(const o of FS){if(o===ME||o.dead)continue;if(Math.hypot(o.pos.x-ME.pos.x,o.pos.z-ME.pos.z)<TRUCE.R)TRUCE.near[o.id]=(TRUCE.near[o.id]||0)+dt;}
  if(!truceOn())return;truceAcc+=dt;if(truceAcc<.25)return;const st=truceAcc;truceAcc=0;
  const H=FS.filter(f=>isHuman(f)&&!f.dead&&!f.dormant);
  for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){const a=H[i],b=H[j];if(ally(a,b))continue;const k=pairKey(a,b);const P=TRUCE.pairs[k]||(TRUCE.pairs[k]={m:0,s:0,last:game.time});
    const near=Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z)<TRUCE.R;const LA=TRUCE.hitLog[a.id]||{},LB=TRUCE.hitLog[b.id]||{};
    let coop=false;if(near&&!(game.time-(P.betray||-99)<10))for(const v in LA){if(+v===a.id||+v===b.id)continue;if(game.time-LA[v]<6&&LB[v]&&game.time-LB[v]<6){coop=true;break;}}
    if(coop){P.m+=st*TRUCE.FILL;P.last=game.time;}else P.m=Math.max(0,P.m-st*(near?.5:3));
    if(P.s>0&&game.time-P.last>TRUCE.FADE){P.s--;P.last=game.time;truceStage(a,b,P.s,true);}
    if(P.m>=100){P.m=0;P.s++;truceStage(a,b,P.s);}}});

function truceStage(a,b,s,fade){const msg={k:'truce',a:a.id,b:b.id,s,fade:!!fade};if(NET.role==='host')netEvent(msg);applyTruce(msg);}
onEv('net:truce',e=>applyTruce(e));
function applyTruce(e){const a=FS.find(f=>f.id===e.a),b=FS.find(f=>f.id===e.b);if(!a||!b)return;const pair=[a,b];
  if(e.fade){pair.forEach(f=>{f.teamMark=Math.min(f.teamMark||0,e.s);if(e.s<2)f.teamWeak=0;});truceTag();return;}
  const meIn=pair.indexOf(ME)>=0,other=pair.find(f=>f!==ME);
  if(e.s===1){pair.forEach(f=>f.teamMark=1);truceTag();
    if(meIn)announce('TEAMING DETECTED','#ff3a3a'),setTimeout(()=>announceSmall('STRIKE 1/3 with '+other.name.toUpperCase()+' — FIGHT EACH OTHER OR SPLIT UP. STRIKE 3 ERASES ALL YOUR PROGRESS.'),900);
    else announceSmall(a.name.toUpperCase()+' & '+b.name.toUpperCase()+' ARE TEAMING — THEY\'RE MARKED');}
  if(e.s===2){pair.forEach(f=>{f.teamMark=2;f.teamWeak=40;});truceTag();
    if(meIn)announce('STRIKE 2/3 — WEAKENED','#ff3a3a'),setTimeout(()=>announceSmall('ONE MORE STRIKE WITH '+other.name.toUpperCase()+' AND YOU EXPLODE AND LOSE EVERYTHING'),900);}
  if(e.s>=3){pair.forEach(f=>destroyTeamer(f));announceSmall(a.name.toUpperCase()+' & '+b.name.toUpperCase()+' WERE DESTROYED FOR TEAMING');
    if(meIn)wipeIfConfirmed(other);}}

// weakened teamers deal 30% less damage
onEv('tick',dt=>{for(const f of FS)if(f.teamWeak>0){f.teamWeak-=dt;if(f.teamWeak<=0)f.teamWeak=0;}});
const _atHit=applyHit;applyHit=function(att,def,o){if(att&&att.teamWeak>0&&o&&o.dmg){o=Object.assign({},o);o.dmg*=.7;}return _atHit(att,def,o);};

function destroyTeamer(f){if(!f||f.dead)return;const c=f.chest(new V3());explosion(c,4,[0xff3a1a,0xffd23f,0xffffff]);ring(c,0xff3a3a,8,.5,false,2.8);shake(.8,c);xSnd(c,()=>AU.boom(true));
  if(NET.role!=='client'){f.hp=0;killFighter(f,null,new V3(0,1,0));}}

function wipeIfConfirmed(other){const seen=TRUCE.near[other&&other.id]||0;
  if(seen<TRUCE.CONFIRM){announceSmall('ELIMINATED — but your game didn\'t see enough teaming to erase progress');return;}
  PROGRESS_KEYS.forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});
  let e=$('teamWipe');if(!e){e=document.createElement('div');e.id='teamWipe';document.body.appendChild(e);}
  e.innerHTML='<b>DESTROYED FOR TEAMING</b><span>You teamed up in a solo match three times. All your progress — skins, pets, points, levels, season pass, skills, missions and story — has been erased.</span><i>Restarting…</i>';
  if(!window.__noReload)setTimeout(()=>location.reload(),5000);}

// the red TEAMING tag: shows through walls above marked players
const TEAMTAGS=[];
function truceTag(){TEAMTAGS.forEach(t=>{if(t.s.parent)t.s.parent.remove(t.s);});TEAMTAGS.length=0;
  for(const f of FS){if(!f.teamMark)continue;const m=new THREE.SpriteMaterial({map:fxTextTex(f.teamMark>=2?'TEAMING ×2':'TEAMING',0xff3a3a),transparent:true,depthTest:false,depthWrite:false});
    const s=new THREE.Sprite(m);s.scale.set(3.2,.8,1);s.renderOrder=999;scene.add(s);TEAMTAGS.push({f,s});}}
onEv('tick',()=>{for(const t of TEAMTAGS){if(t.f.dead||!t.f.teamMark){t.s.visible=false;continue;}t.s.visible=true;t.s.position.set(t.f.pos.x,t.f.pos.y+3.1+Math.sin(game.time*4)*.08,t.f.pos.z);}});
onEv('matchEnd',()=>{FS.forEach(f=>{f.teamMark=0;f.teamWeak=0;});truceTag();});
