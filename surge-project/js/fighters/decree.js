/* DECREE — a commander whose spoken orders become rules of the world. Up to two orders stand at once;
   a third replaces the oldest. Press 1 and SAY an order into your mic (uses the browser's speech recognition —
   the same mic as voice chat), or pick one with 1–9 / a click while the order panel is open.
   Original design; credited in credits.js as inspired by Star and Stripe (My Hero Academia, Kōhei Horikoshi).
   To add an order: add an entry to ORDERS with the words that trigger it and what it does. */
Object.assign(SPNAME,{decree:'ISSUE ORDER'});
Object.assign(HERO_SND,{decree:'power'});
Object.assign(ULT_RANGE,{absolute:16});
Object.assign(SPECIAL_AI,{decree:[0,16,.5]});
Object.assign(XSPK,{decree:1});
Object.assign(DULT_OF,{decree:'nova'});
COPY_BAN.decree=1;

const DGOLD=0xffd86a,DGLOW=0xfff2b0;
const ORDERS={
  rise:{name:'RISE',say:'Rise!',words:['fly','float','rise','soar','levitate','up','air','sky','lift'],self:true,dur:10,
    start(f){f.vel.y=Math.max(f.vel.y,11);f.onGround=false;f.pos.y+=.1;},tick(f,dt){if(!f.onGround)f.vel.y+=30*.82*dt;if(Math.random()<dt*8)dGlow(f);}},
  swift:{name:'SWIFT',say:'Faster!',words:['fast','faster','speed','quick','quickly','run','hurry','swift','haste'],self:true,dur:12,tick(f){f.hasteT=Math.max(f.hasteT||0,.2);}},
  might:{name:'MIGHT',say:'Strength!',words:['strong','stronger','power','strength','punch','hit','mighty','might','smash','attack'],self:true,dur:12,tick(f){f.powT=Math.max(f.powT||0,.2);}},
  iron:{name:'IRON',say:'Iron body!',words:['shield','armor','armour','hard','harden','protect','defend','iron','tough','block'],self:true,dur:9,tick(f){f.armorT=Math.max(f.armorT||0,.2);}},
  mend:{name:'MEND',say:'Heal!',words:['heal','recover','regenerate','mend','life','health','fix','cure'],self:true,dur:8,start(f){f.hp=Math.min(100,f.hp+10);},tick(f,dt){f.hp=Math.min(100,f.hp+5*dt);}},
  halt:{name:'HALT',say:'Halt!',words:['stop','freeze','halt','stay','still','dont move','wait','pause'],dur:2.6,
    start(f){const T=tgtOf(f,18);if(T){dLine(f,T);hitO(f,T,{dmg:4,kb:0,up:0,stun:.2,frame:2.4,noSpark:true});}}},
  silence:{name:'SILENCE',say:'Silence!',words:['silence','silent','quiet','erase','cancel','no powers','powerless','shut up','mute'],dur:5,
    start(f){const T=tgtOf(f,18);if(T){dLine(f,T);T.eraseT=Math.max(T.eraseT||0,5);hitO(f,T,{dmg:3,kb:2,stun:.4});}}},
  kneel:{name:'KNEEL',say:'Kneel!',words:['kneel','fall','down','drop','sit','bow','ground','crash'],dur:1.6,
    start(f){ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),DGOLD,10,.5,true,2.6);foes(f,10).forEach(o=>{o.vel.y=-22;hitO(f,o,{dmg:8,kb:0,up:-6,stun:1.4,heavy:true});dust(o.pos,6,.8);});shake(.35,f.pos);}},
  repel:{name:'REPEL',say:'Begone!',words:['push','away','back','repel','go','begone','leave','get out','blast'],dur:1,
    start(f){ring(f.chest(new V3()),DGOLD,12,.45,false,2.6);foes(f,12).forEach(o=>hitO(f,o,{dmg:9,kb:24,up:8,launch:true,heavy:true}));}},
  summon:{name:'SUMMON',say:'Come here!',words:['come','pull','here','closer','approach','summon'],dur:1,
    start(f){const T=tgtOf(f,20);if(T){dLine(f,T);const fw=f.fwd();T.pos.set(f.pos.x+fw.x*1.6,f.pos.y,f.pos.z+fw.z*1.6);hitO(f,T,{dmg:6,kb:0,up:2,stun:.9});}}},
  slow:{name:'SLOW',say:'Slow down!',words:['slow','slower','heavy','crawl','sluggish','weak'],dur:6,
    start(f){foes(f,14).forEach(o=>{o.slowT=Math.max(o.slowT||0,6);dLine(f,o);});}},
  ignite:{name:'IGNITE',say:'Burn!',words:['burn','fire','ignite','explode','blow up','flame','boom'],dur:4,
    start(f){const T=tgtOf(f,18);if(T){dLine(f,T);explosion(T.chest(new V3()),1.8,[0xffa21a,DGOLD,0xff5a10]);burnOn(T,4,5);hitO(f,T,{dmg:12,kb:8,up:6,launch:true});}}}};
const ORDER_KEYS=Object.keys(ORDERS);

function dGlow(f){burst(ADD,TMP2.set(f.pos.x+rand(-.4,.4),f.pos.y+rand(.1,1.9),f.pos.z+rand(-.4,.4)),1,{colors:[DGOLD,DGLOW],speed:.4,up:1.4,life:.5,size:.22,size1:0,bright:2});}
function dLine(f,o){cutLine(f.chest(new V3()),o.chest(new V3()),DGOLD,.06,.35);ring(o.chest(new V3()),DGOLD,1.6,.3,false,2.4);}

/* match spoken / typed words to an order (the order that matches the most words wins; unknown = MIGHT) */
function parseOrder(text){const t=' '+String(text||'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ')+' ';let best=null,bs=0;
  for(const k of ORDER_KEYS){let s=0;for(const w of ORDERS[k].words)if(t.indexOf(' '+w+' ')>=0||t.indexOf(' '+w+'s ')>=0)s+=w.indexOf(' ')>0?2:1;if(s>bs){bs=s;best=k;}}return best;}

/* apply an order to fighter f (host/offline only; clients ask the host) */
function giveOrder(f,k,heard){const O=ORDERS[k];if(!O||!f||f.dead)return;f.orders=f.orders||[];
  if(f.orders.length>=2){const old=f.orders.shift();if(ORDERS[old.k].end)ORDERS[old.k].end(f);}
  f.orders.push({k,t:O.dur});if(O.start)O.start(f);
  burst(ADD,f.chest(new V3()),26,{colors:[DGOLD,DGLOW,0xffffff],speed:5,life:.5,size:.26,size1:0,bright:2.4});ring(f.chest(new V3()),DGOLD,2.4,.35,false,2.6);
  xSnd(f.pos,()=>SND.power.hit(1.2));showOrder(f,k,heard);}
function showOrder(f,k,heard){const O=ORDERS[k];if(!O)return;if(f===ME||(ME&&f.pos.distanceTo(ME.pos)<25)){
  announceSmall(`${f.name.toUpperCase()}: “${(heard||O.say).toUpperCase()}” → NEW ORDER: ${O.name}`);if(typeof sayLine==='function'&&!heard)sayLine(f,O.say,{rate:.95,vol:1.1});}}
function requestOrder(f,k,heard){if(NET.role==='client'){netSay({k:'decree',id:f.id,o:k,h:heard||''});showOrder(f,k,heard);}else{giveOrder(f,k,heard);if(NET.role==='host')netSay({k:'decreeFx',id:f.id,o:k,h:heard||''});}}
onEv('x:decree',e=>{if(NET.role==='host'&&e.from!==NET.myId){const f=FS.find(q=>q.id===e.id);if(f)giveOrder(f,e.o,e.h);}});
onEv('x:decreeFx',e=>{if(NET.role==='client'){const f=FS.find(q=>q.id===e.id);if(f&&f!==ME)showOrder(f,e.o,e.h);}});
onEv('tick',dt=>{for(const f of FS){if(!f.orders||!f.orders.length)continue;if(f.dead||!inMatch()||f.eraseT>0){f.orders.forEach(o=>ORDERS[o.k].end&&ORDERS[o.k].end(f));f.orders=[];continue;}
  for(let i=f.orders.length-1;i>=0;i--){const o=f.orders[i],O=ORDERS[o.k];o.t-=dt;if(O.tick)O.tick(f,dt);if(o.t<=0){f.orders.splice(i,1);if(O.end)O.end(f);}}}
  dOrdersHUD();});
onEv('matchStart',()=>{FS.forEach(f=>f.orders=[]);dListenStop();});
onEv('matchEnd',()=>{FS.forEach(f=>f.orders=[]);dListenStop();});

/* ---------- the order panel + speech recognition ---------- */
const DL={on:false,rec:null,t:0,heard:''};
function dPanel(){let e=$('decreeBox');if(!e){e=document.createElement('div');e.id='decreeBox';document.body.appendChild(e);
  e.addEventListener('mousedown',ev=>{const b=ev.target.closest('[data-o]');if(b){ev.preventDefault();ev.stopPropagation();dPick(b.dataset.o,'');}},true);}return e;}
function dPanelDraw(msg){const e=dPanel();e.style.display='';const sr=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
  e.innerHTML=`<div class="dt">${sr?'🎙 SAY AN ORDER':'PICK AN ORDER'} <span>${msg||''}</span></div><div class="dh">${DL.heard?'“'+esc(DL.heard)+'”':(sr?'e.g. “Rise!”, “Halt!”, “Faster!”, “Kneel!” — or press a number':'press a number or click')}</div>`+
  `<div class="dg">${ORDER_KEYS.map((k,i)=>`<b data-o="${k}">${i<9?'<i>'+(i+1)+'</i>':''}${ORDERS[k].name}</b>`).join('')}</div><div class="ds">Up to 2 orders stand at once · the oldest is replaced</div>`;}
function dListen(){if(DL.on)return;DL.on=true;DL.t=5;DL.heard='';dPanelDraw('');const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR||SET.decreeVoice===false)return;try{const r=new SR();DL.rec=r;r.lang='en-US';r.interimResults=true;r.maxAlternatives=3;r.continuous=false;
    r.onresult=ev=>{let txt='';for(const res of ev.results)txt+=res[0].transcript+' ';DL.heard=txt.trim();dPanelDraw('');
      const last=ev.results[ev.results.length-1];if(last.isFinal){let k=null;for(let a=0;a<last.length&&!k;a++)k=parseOrder(last[a].transcript);if(!k)k=parseOrder(DL.heard);dPick(k||'might',DL.heard);}};
    r.onerror=ev=>{if(DL.on)dPanelDraw(ev.error==='not-allowed'?'(mic blocked — pick one)':'(didn’t catch that — pick one)');};
    r.onend=()=>{DL.rec=null;};r.start();}catch(e){dPanelDraw('(speech not available — pick one)');}}
function dListenStop(){DL.on=false;if(DL.rec){try{DL.rec.abort();}catch(e){}DL.rec=null;}const e=$('decreeBox');if(e)e.style.display='none';}
function dPick(k,heard){if(!DL.on||!ME)return;dListenStop();requestOrder(ME,k,heard);}
addEventListener('keydown',e=>{if(!DL.on)return;const m=/^(Digit|Numpad)([1-9])$/.exec(e.code);if(m){const k=ORDER_KEYS[+m[2]-1];if(k){e.preventDefault();e.stopImmediatePropagation();dPick(k,'');}}
  else if(e.code==='Escape'){e.stopImmediatePropagation();dListenStop();}},true);
onEv('tick',dt=>{if(!DL.on)return;DL.t-=dt;if(DL.t<=0||!ME||ME.dead||!inMatch()){const h=DL.heard;if(h&&ME&&!ME.dead&&inMatch()){dPick(parseOrder(h)||'might',h);}else dListenStop();}});

function dOrdersHUD(){let e=$('decreeHud');const on=ME&&ME.hero.id==='decree'&&inMatch()&&!ME.dead;if(!e){if(!on)return;e=document.createElement('div');e.id='decreeHud';document.body.appendChild(e);}
  if(!on){e.style.display='none';return;}e.style.display='';const L=ME.orders||[];
  e.innerHTML='<i>ORDERS</i>'+[0,1].map(i=>L[i]?`<b>${ORDERS[L[i].k].name}<span>${Math.ceil(L[i].t)}s</span></b>`:'<b class="em">—</b>').join('');}

/* ---------- kit ---------- */
SPECIALS.decree=function(f){const t=f.stateT,V=f.vf;f.poseKey=t<.25?'command':'spech';
  once(f,.05,()=>{ring(f.chest(new V3()),DGOLD,2,.3,false,2.4);
    if(f===ME)dListen();
    else if(f.isBot&&NET.role!=='client'){const T=tgtOf(f,16),d=T?f.pos.distanceTo(T.pos):99;let k;
      if(f.hp<45&&Math.random()<.6)k='mend';else if(d<9&&Math.random()<.4)k=pick(['kneel','repel','halt']);else if(d<18&&Math.random()<.5)k=pick(['halt','silence','ignite','summon','slow']);else k=pick(['might','swift','iron','rise']);
      giveOrder(f,k);}});
  if(t>.5)f.set(f.onGround?'idle':'air');return 10;};
// move 2: REVOKE — strip a foe's buffs and borrowed powers
SPECVAR.decree={alt:['REVOKE',f=>{once(f,.15,()=>{const T=tgtOf(f,16);if(!T)return;dLine(f,T);
    T.armorT=0;T.powT=0;T.hasteT=0;T.fieldT=0;T.vowT=0;T.bladeT=0;T.stolenT=0;T.oathT=0;T.ovT=0;if(T.orders){T.orders=[];}
    hitO(f,T,{dmg:8,kb:4,up:2,stun:.7});burst(ADD,T.chest(new V3()),24,{colors:[DGOLD,0xffffff],speed:6,life:.4,size:.24,size1:0,bright:2.4});if(f===ME)announceSmall('REVOKED: '+T.name.toUpperCase()+'\'S BUFFS ARE GONE');xSnd(f.pos,()=>SND.power.spec());});
  vpose(f,.15,'command','spech');endAt(f,.5);return 10;}]};
// ULT: ABSOLUTE DECREE — every foe nearby must kneel, then pillars of gold light strike each one
ULTX.absolute={r:16,s(f){f.vf.L=foes(f,16);f.uEnd=2.3;f.poseKey='command';f.invuln=Math.max(f.invuln,.6);},
  u(f,t){const V=f.vf;f.poseKey=t<.7?'command':'spech';
    atT(f,'kneel',.5,()=>{ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),DGOLD,16,.6,true,2.8);shake(.5,f.pos);if(f===ME)announceSmall('“KNEEL.”');
      V.L.forEach(o=>{if(o.dead)return;dLine(f,o);o.vel.y=-20;hitO(f,o,{dmg:6,kb:0,up:-5,stun:.3,frame:1.6,noSpark:true});});});
    V.L.forEach((o,i)=>atT(f,'p'+i,1.3+i*.08,()=>{if(o.dead)return;const p=o.pos.clone();if(o.state==='framed')o.framedT=0;
      const col=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,30,16,1,true),new THREE.MeshBasicMaterial({color:DGOLD,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      col.position.set(p.x,p.y+15,p.z);scene.add(col);let k=0;const iv=setInterval(()=>{k+=.06;col.material.opacity=.8*(1-k);col.scale.set(1+k,1,1+k);if(k>=1){clearInterval(iv);scene.remove(col);col.geometry.dispose();col.material.dispose();}},30);
      burst(ADD,new V3(p.x,p.y+1,p.z),30,{colors:[DGOLD,DGLOW,0xffffff],speed:8,up:6,life:.6,size:.3,size1:0,bright:2.6});
      hitO(f,o,{dmg:24,kb:8,up:14,launch:true,heavy:true,stun:.9});xSnd(p,()=>AU.boom(false));}));
    return 10;}};
// ALT ULT: TWIN DECREE — instantly fills both order slots with IRON and MIGHT, plus a burst of speed
ALTULT.decree={name:'TWIN DECREE',r:10,s(f){f.uEnd=1;f.poseKey='command';},u(f,t){atT(f,'o',.45,()=>{if(NET.role==='client')return;f.orders=[];giveOrder(f,'iron');giveOrder(f,'might');f.hasteT=Math.max(f.hasteT||0,8);
  if(f===ME)announceSmall('TWIN DECREE: IRON + MIGHT');});return 10;}};
Object.assign(PFX,{decree(a,d,t){if(t>=2)d.slowT=Math.max(d.slowT||0,1.2);}});
Object.assign(PFX_DESC,{decree:'charged hits slow the target'});
Object.assign(XMOVES,{decree:[['LAW SPEAR','beam','light','arrow',['pierce']],['EDICT WAVE','wave','light','ring',['push']]]});

/* ---------- look: ivory + deep teal commander coat, gold epaulettes, high collar, glowing script halo (original design) ---------- */
const _mhaPartsD=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsD(h,X);if(h.id!=='decree')return out;const {M,head,spine,lS,rS}=X;
  const gold=new THREE.MeshStandardMaterial({color:0xe8c24a,metalness:.9,roughness:.25}),coat=new THREE.MeshStandardMaterial({color:0x0e3a3a,roughness:.7,side:THREE.DoubleSide}),
    glow=new THREE.MeshBasicMaterial({color:DGLOW,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false});
  const halo=M(new THREE.TorusGeometry(.26,.012,8,48),glow);halo.position.set(0,.16,-.16);head.add(halo);
  for(let k=0;k<12;k++){const a=k/12*6.283,g=M(new THREE.BoxGeometry(.035,.014,.01),glow);g.position.set(Math.cos(a)*.3,.16+Math.sin(a)*.3,-.16);g.rotation.z=a;head.add(g);}
  const collar=M(new THREE.CylinderGeometry(.16,.2,.14,20,1,true,Math.PI*.25,Math.PI*1.5),coat);collar.position.set(0,.62,0);collar.rotation.y=Math.PI;spine.add(collar);
  const tail=M(new THREE.CylinderGeometry(.27,.42,.9,18,1,true,Math.PI/2+.25,Math.PI-.5),coat);tail.position.set(0,-.25,-.02);spine.add(tail);
  [lS,rS].forEach(S=>{if(!S)return;const ep=M(new THREE.CylinderGeometry(.11,.11,.03,16),gold);ep.position.set(0,.04,0);S.add(ep);
    for(let k=0;k<5;k++){const fr=M(new THREE.CylinderGeometry(.008,.008,.07,4),gold);const a=k/5*Math.PI-Math.PI/2;fr.position.set(Math.sin(a)*.1,0,Math.cos(a)*.1);S.add(fr);}});
  const sash=M(new THREE.BoxGeometry(.06,.62,.02),gold);sash.position.set(0,.3,.2);sash.rotation.z=.6;spine.add(sash);
  return out;};
