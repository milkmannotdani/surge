/* Team-up combos: when two teammates fire their ultimates within 2 seconds of each other while
   less than 16 m apart, their powers combine into a TEAM-UP strike on the nearest enemy group.
   Works in Duos and in story missions with allies. Bot partners join in when they have a full meter. */
const TU_WIN=2,TU_RANGE=16,TU_RAD=8.5;
// combo names by the pair's main power tags; anything else gets a generic name
const TU_NAMES={'Fire+Ice':'STEAM CATACLYSM','Explosive+Strength':'DETROIT DETONATION','Ice+Explosive':'SHATTER BLAST','Electric+Water':'STORM SURGE',
  'Fire+Wind':'FIRESTORM','Explosive+Fire':'NAPALM NOVA','Water+Wind':'TYPHOON','Gravity+Strength':'METEOR DROP','Shadow+Electric':'BLACK LIGHTNING',
  'Armor+Strength':'IRON WALL CRUSH','Speed+Strength':'FULL COWL CANNON','Speed+Explosive':'HOWITZER DRIVE','Erase Powers+Strength':'ZERO HOUR',
  'Ice+Water':'ABSOLUTE ZERO','Flight+Wind':'SKY RAID','Electric+Explosive':'THUNDER BOMB','Earth+Decay':'RUINATION','Blue Fire+Decay':'ASHEN END',
  'Teleport+Clones':'INFINITE LEGION','Capture+Long Range':'TRICK SHOT','Earth+Blue Fire':'MAGMA BURST'};
const TU_GEN=['UNITED STRIKE','DOUBLE IMPACT','PLUS CHAIN','TWIN SURGE','HERO COMBINATION','ALL-OUT ASSAULT'];
function tuName(a,b){const ta=(a.hero.tags||[])[0]||'',tb=(b.hero.tags||[])[0]||'';const n=TU_NAMES[ta+'+'+tb]||TU_NAMES[tb+'+'+ta];
  if(n)return n;let h=0;for(const ch of a.hero.id+b.hero.id)h=(h*31+ch.charCodeAt(0))|0;return TU_GEN[Math.abs(h)%TU_GEN.length];}
function teamUpFX(a,b,pt,name){const ca=a.chest(new V3()),cb=b.chest(new V3());
  cutLine(ca,pt,a.hero.color,.22,1.1);cutLine(cb,pt,b.hero.color,.22,1.1);cutLine(ca,pt,0xffffff,.07,1.1);cutLine(cb,pt,0xffffff,.07,1.1);
  implode(pt,50,3,[a.hero.color,b.hero.color,0xffffff],.6,2.2);
  setTimeout(()=>{if(!inMatch())return;ring(new V3(pt.x,pt.y+.2,pt.z),a.hero.color,TU_RAD+2,.8,true,2.8);ring(pt,b.hero.color,TU_RAD,.6,false,2.8);
    burst(ADD,pt,120,{colors:[a.hero.color,b.hero.color,a.hero.accent,b.hero.accent,0xffffff],speed:16,up:6,life:.9,size:.5,size1:0,bright:2.8});
    burst(SMK,pt,24,{colors:[0x3a3a3a,0x6a6a6a],speed:6,up:3,life:1.4,size:1,size1:2});flashLight(pt,a.hero.color,20);shake(.6,pt);AU.scale=sndAt(pt);AU.boom(true);AU.scale=1;},650);
  const near=ME&&(a===ME||b===ME||pt.distanceTo(ME.pos)<30);
  if(near){announce('TEAM-UP!','#ffd23f');announceSmall(name);game.slowT=Math.max(game.slowT,.8);}
  feed(`<b style="--c:${a.hero.css}">${esc(a.name)}</b> + <b style="--c:${b.hero.css}">${esc(b.name)}</b>: ${name}!`);}
function teamUp(a,b){a.tuT=b.tuT=game.time;if(a===ME||b===ME)emitEv('teamupMe');
  // aim at the densest enemy spot near the pair
  const mid=a.pos.clone().add(b.pos).multiplyScalar(.5);let best=null,bs=-1;
  for(const e of FS){if(e.dead||ally(e,a))continue;const d=e.pos.distanceTo(mid);if(d>28)continue;let s=0;for(const o of FS)if(!o.dead&&!ally(o,a)&&o.pos.distanceTo(e.pos)<TU_RAD)s++;s-=d*.02;if(s>bs){bs=s;best=e;}}
  const pt=best?best.chest(new V3()):mid.clone().add(new V3(Math.sin(a.face)*8,1.2,Math.cos(a.face)*8));const name=tuName(a,b);
  teamUpFX(a,b,pt,name);netEvent({k:'tu',a:a.id,b:b.id,x:pt.x,y:pt.y,z:pt.z});
  setTimeout(()=>{if(!inMatch()||NET.role==='client')return;for(const e of FS){if(e.dead||ally(e,a))continue;const d=e.pos.distanceTo(pt);if(d>TU_RAD)continue;
    const src=d<TU_RAD*.5?a:b;applyHit(src,e,{dmg:34*(1-d/TU_RAD*.4),kb:15,up:13,launch:true,heavy:true,pt:e.chest(new V3()),noSpark:false});}},680);}
onEv('net:tu',e=>{const a=FS.find(f=>f.id===e.a),b=FS.find(f=>f.id===e.b);if(a&&b)teamUpFX(a,b,new V3(e.x,e.y,e.z),tuName(a,b));});
onEv('ult',f=>{f.ultAt=game.time;if(NET.role==='client')return;
  for(const m of mates(f)){if(m.dead||m.downed||m.pos.distanceTo(f.pos)>TU_RANGE)continue;
    if(m.ultAt&&game.time-m.ultAt<TU_WIN&&!(game.time-(m.tuT||-9)<6)&&!(game.time-(f.tuT||-9)<6)){teamUp(m,f);return;}
    // a bot partner with a full meter answers the call
    if(m.isBot&&m.meter>=100)m.tuCall=game.time+rand(.2,.6);}
  if(f===ME){/* nothing to wait for */}});
onEv('tick',()=>{for(const f of FS){if(f.tuCall&&game.time>=f.tuCall){f.tuCall=0;if(!f.dead&&f.meter>=100&&['idle','run','air','block'].indexOf(f.state)>=0)f.startUlt();}}
  // prompt the player when a partner just ulted nearby
  const el=$('tuP');if(el){let on=false;if(ME&&!ME.dead&&ME.meter>=100)for(const m of mates(ME))if(m.ultAt&&game.time-m.ultAt<TU_WIN&&m.pos.distanceTo(ME.pos)<TU_RANGE&&!(game.time-(m.tuT||-9)<6))on=true;el.classList.toggle('on',on);}});
