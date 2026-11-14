/* Practice mode */
/* ================= PRACTICE MODE =================
   A separate training ground with dummies: test every punch, special and ultimate with
   damage numbers, combo totals and toggles (infinite Surge, no cooldowns, invincible). */
const PR={on:false,world:'city',count:3,act:'stand',look:'dummy',inf:true,nocd:true,god:true,last:0,combo:0,comboT:0,total:0,dps:[],built:false,panel:true};
const PR_R=58;
let TRAIN=null;
function dummyHero(){if(PR._dh)return PR._dh;const b=HEROES.find(h=>h.id==='titan');
  PR._dh=Object.assign({},b,{id:'dummy',name:'DUMMY',faction:'villain',color:0xc8ccd6,accent:0xff8a1a,css:'#ff8a1a',pat:'hexgrid',patK:.6,desc:'Training dummy.',
    as:{look:'dummy',elem:'dummy',wpn:'fist',alt:'titan',parts:[]}});return PR._dh;}
function buildTraining(){if(TRAIN)return TRAIN;const G=new THREE.Group();G.visible=false;scene.add(G);
  // floor: dark tiles with a glowing grid, range rings and distance marks
  const [c,g]=cv(1024,1024);g.fillStyle='#0c1424';g.fillRect(0,0,1024,1024);
  for(let i=0;i<=32;i++){const p=i*32;g.strokeStyle=i%4===0?'rgba(80,220,255,.55)':'rgba(80,160,255,.18)';g.lineWidth=i%4===0?3:1.5;g.beginPath();g.moveTo(p,0);g.lineTo(p,1024);g.stroke();g.beginPath();g.moveTo(0,p);g.lineTo(1024,p);g.stroke();}
  const ft=tex(c);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(4,4);
  const [hc,hg]=cv(256,256);hg.fillStyle='#808080';hg.fillRect(0,0,256,256);for(let i=0;i<=8;i++){hg.fillStyle='#606060';hg.fillRect(i*32-1,0,3,256);hg.fillRect(0,i*32-1,256,3);}
  const nm=normalFromHeight(hc,2);nm.repeat.set(16,16);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(PR_R+8,96),new THREE.MeshStandardMaterial({map:ft,normalMap:nm,roughness:.55,metalness:.35,envMapIntensity:.6}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.002;floor.receiveShadow=true;G.add(floor);
  const glow=(col,o)=>new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  [6,12,20,30,42].forEach((r,i)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-.06,r+.06,128),glow(i%2?0xff8a1a:0x4fd2ff,.35));m.rotation.x=-Math.PI/2;m.position.y=.02;G.add(m);});
  // distance marks along the firing lane
  const [lc,lg]=cv(512,64);lg.font='bold 44px Rajdhani,sans-serif';lg.textAlign='center';lg.fillStyle='#bff2ff';
  for(let d=5;d<=40;d+=5){const [cc,cg]=cv(128,64);cg.font='bold 46px Rajdhani,sans-serif';cg.textAlign='center';cg.fillStyle='#bff2ff';cg.fillText(d+'m',64,48);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(2,1),new THREE.MeshBasicMaterial({map:tex(cc),transparent:true,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.set(-3.2,.03,d);G.add(p);
    const tick=new THREE.Mesh(new THREE.PlaneGeometry(4,.08),glow(0xbff2ff,.5));tick.rotation.x=-Math.PI/2;tick.position.set(0,.025,d);G.add(tick);}
  // arena wall and light pillars
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(PR_R,PR_R,3.2,128,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{t:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float t;varying vec2 vU;void main(){float h=1.-vU.y;float l=step(.92,fract(vU.x*96.))*.5+step(.9,fract(vU.y*6.-t*.3))*.3;gl_FragColor=vec4(vec3(.3,.85,1.)*(h*.6+l)*h,1.);}'}));
  wall.position.y=1.6;G.add(wall);PR.wall=wall;
  const pm=new THREE.MeshStandardMaterial({color:0x1a2236,metalness:.8,roughness:.3});
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=Math.cos(a)*(PR_R+3),z=Math.sin(a)*(PR_R+3);const p=new THREE.Mesh(new THREE.BoxGeometry(1.4,14,1.4),pm);p.position.set(x,7,z);p.castShadow=true;G.add(p);
    const s=new THREE.Mesh(new THREE.BoxGeometry(.3,12.6,.3),new THREE.MeshBasicMaterial({color:k%2?0xff8a1a:0x4fd2ff}));s.position.set(x-Math.cos(a)*.72,7,z-Math.sin(a)*.72);G.add(s);}
  // dummy pads and sign
  for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.RingGeometry(.9,1.1,48),glow(0xff8a1a,.6));m.rotation.x=-Math.PI/2;const sp=practiceSpot(k);m.position.set(sp[0],.03,sp[1]);G.add(m);}
  const [sc,sg]=cv(1024,160);sg.fillStyle='rgba(8,14,30,.85)';sg.fillRect(0,0,1024,160);sg.strokeStyle='#4fd2ff';sg.lineWidth=6;sg.strokeRect(6,6,1012,148);
  sg.font='bold 96px "Bebas Neue",Rajdhani,sans-serif';sg.textAlign='center';sg.fillStyle='#e8fbff';sg.fillText('TRAINING GROUND',512,115);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(22,3.4),new THREE.MeshBasicMaterial({map:tex(sc),transparent:true,side:THREE.DoubleSide}));sign.position.set(0,11,PR_R+2.4);sign.rotation.y=Math.PI;G.add(sign);
  const fill=new THREE.PointLight(0x4fd2ff,1.2,90,2);fill.position.set(0,18,0);G.add(fill);
  TRAIN=G;return G;}
function practiceSpot(k){return [[0,7],[-4.5,10],[4.5,10],[-9,15],[9,15]][k%5];}
const SAVED_COL={};
function setWorld(w){if(PR.world===w)return;PR.world=w;const tr=w==='train';if(tr)buildTraining();
  CITY.forEach(o=>{if(tr){o.userData._v=o.visible;o.visible=false;}else o.visible=o.userData._v!==undefined?o.userData._v:true;});if(TRAIN)TRAIN.visible=tr;
  [['BLD',BLD],['solids',solids],['props',props],['walls',walls]].forEach(([k,a])=>{if(tr){SAVED_COL[k]=a.slice();a.length=0;}else if(SAVED_COL[k]){a.length=0;SAVED_COL[k].forEach(x=>a.push(x));}});
  if(tr){PR.fog=scene.fog.density;scene.fog.density=.0028;}else if(PR.fog)scene.fog.density=PR.fog;
  $('mapw').style.display=tr?'none':'';}
/* dummies */
class DummyAI{constructor(f,k){this.f=f;this.k=k;this.t=rand(0,2);this.real=new AI(f,1);}
  think(dt){const f=this.f,I=f.intent;I.light=I.heavy=I.special=I.ult=I.jump=I.dash=false;I.block=false;I.sprint=false;I.wx=I.wz=0;this.t+=dt;
    if(f.dead||!ME)return;const dx=ME.pos.x-f.pos.x,dz=ME.pos.z-f.pos.z,d=Math.hypot(dx,dz)||1;f.tgt=ME;
    if(PR.act==='fight'){this.real.think(dt);return;}
    if(['idle','run','block'].indexOf(f.state)>=0&&f.onGround)f.face=angLerp(f.face,Math.atan2(dx,dz),Math.min(1,dt*6));
    if(PR.act==='block'){I.block=true;}
    else if(PR.act==='move'){const s=Math.sin(this.t*1.3+this.k*1.7);I.wx=-dz/d*s;I.wz=dx/d*s;}
    else if(PR.act==='jump'){if(f.onGround&&f.state!=='hit'&&Math.random()<dt*1.4)I.jump=true;}
    else{const sp=practiceSpot(this.k);const ox=sp[0]-f.pos.x,oz=sp[1]-f.pos.z,od=Math.hypot(ox,oz);if(od>1.2&&['idle','run'].indexOf(f.state)>=0&&game.time-f.lastHitT>2.5){I.wx=ox/od;I.wz=oz/od;}}}}
function startPractice(){store.set('surge.name',myName());netShutdown();NET.role='off';NET.myId=0;PR.on=true;setWorld('train');
  const roster=[Object.assign({id:0,name:myName(),bot:false,team:0},selEntry())];
  for(let k=0;k<PR.count;k++)roster.push(PR.look==='dummy'?{id:200+k,name:'DUMMY '+(k+1),dummy:true,bot:true,team:1+k}:{id:200+k,name:'TARGET '+(k+1),hero:Math.floor(Math.random()*HEROES.length),bot:true,team:1+k});
  const sp=[[0,0]].concat(roster.slice(1).map((r,k)=>practiceSpot(k)));
  startMatch(roster,sp,1,'solo');game.practice=true;game.phase='fight';game.cdT=0;
  ME.face=0;camYaw=0;FS.forEach((f,i)=>{if(f!==ME){f.face=Math.PI;}});AIS=FS.filter(f=>f!==ME).map((f,k)=>new DummyAI(f,k));
  PR.last=0;PR.combo=0;PR.total=0;PR.dps=[];$('prac').classList.add('on');renderPracPanel();announce('PRACTICE','#4fd2ff');}
function practiceRespawn(){FS.forEach((f,i)=>{if(f===ME){f.pos.set(0,0,0);f.vel.set(0,0,0);f.face=0;camYaw=0;}else{const s=practiceSpot(i-1);f.pos.set(s[0],0,s[1]);f.vel.set(0,0,0);f.face=Math.PI;}
  f.hp=100;f.burnT=0;f.slowT=0;f.decay=0;f.decayT=0;f.marks=0;f.armorT=0;f.set('idle');f.onGround=true;});PR.total=0;PR.combo=0;PR.last=0;renderPracStats();AU.ui();}
function endPractice(){PR.on=false;game.practice=false;DMGN.forEach(n=>{n.t=0;n.el.style.display='none';});$('prac').classList.remove('on');setWorld('city');}
function practiceTick(dt){if(!PR.on||!ME)return;
  if(PR.inf)ME.meter=100;if(PR.nocd){ME.specCD=Math.min(ME.specCD,.15);if(ME.xcd)ME.xcd=ME.xcd.map(v=>Math.min(v,.15));ME.dashCD=Math.min(ME.dashCD,.25);}if(PR.god)ME.hp=Math.max(ME.hp,100);
  for(const f of FS){const r=Math.hypot(f.pos.x,f.pos.z);if(r>PR_R-.8){f.pos.x*=(PR_R-.8)/r;f.pos.z*=(PR_R-.8)/r;}if(f!==ME&&f.hp<100&&game.time-f.lastHitT>3)f.hp=Math.min(100,f.hp+40*dt);}
  if(PR.wall)PR.wall.material.uniforms.t.value=game.time;
  if(PR.comboT>0){PR.comboT-=dt;if(PR.comboT<=0){PR.combo=0;renderPracStats();}}
  const now=game.time;while(PR.dps.length&&now-PR.dps[0][0]>3)PR.dps.shift();
  if(Math.floor(now*4)!==PR._q){PR._q=Math.floor(now*4);renderPracStats();}
  updateDmgNums(dt);}
/* hit log, damage numbers */
const DMGN=[];
function practiceHit(att,def,dmg,pt){if(!PR.on)return;if(att===ME&&def!==ME){PR.last=dmg;PR.combo+=dmg;PR.comboT=1.4;PR.total+=dmg;PR.dps.push([game.time,dmg]);}
  let n=DMGN.find(x=>x.t<=0);if(!n){if(DMGN.length>40)return;const el=document.createElement('div');el.className='dmgn';$('dmgl').appendChild(el);n={el,t:0,p:new V3()};DMGN.push(n);}
  n.p.copy(pt).add(new V3(rand(-.35,.35),.4,rand(-.35,.35)));n.t=.9;n.el.textContent=Math.round(dmg*10)/10;n.el.style.color=def===ME?'#ff6a6a':(dmg>=12?'#ffd23f':'#ffffff');n.el.style.fontSize=(18+Math.min(22,dmg*1.1))+'px';}
function updateDmgNums(dt){for(const n of DMGN){if(n.t<=0){n.el.style.display='none';continue;}n.t-=dt;n.p.y+=dt*1.4;const s=TMP3.copy(n.p).project(camera);
  if(s.z>1){n.el.style.display='none';continue;}n.el.style.display='block';n.el.style.left=((s.x+1)/2*innerWidth)+'px';n.el.style.top=((1-s.y)/2*innerHeight)+'px';n.el.style.opacity=Math.min(1,n.t*2.5);}}
/* panel */
function prChips(id,opts,cur,fn){const el=$(id);el.innerHTML='';opts.forEach(([v,n,key])=>{const b=document.createElement('span');b.className='chip'+(cur===v?' sel':'');b.innerHTML=n+(key?`<i>${key}</i>`:'');b.onclick=()=>{AU.ui();fn(v);renderPracPanel();};el.appendChild(b);});}
function renderPracPanel(){
  prChips('prAct',[['stand','STAND','Z'],['block','BLOCK','X'],['move','MOVE','C'],['jump','JUMP','V'],['fight','FIGHT BACK','B']],PR.act,v=>{PR.act=v;});
  prChips('prCount',[[1,'1'],[3,'3'],[5,'5']],PR.count,v=>{if(PR.count!==v){PR.count=v;startPractice();}});
  prChips('prLook',[['dummy','DUMMIES'],['fighters','FIGHTERS']],PR.look,v=>{if(PR.look!==v){PR.look=v;startPractice();}});
  prChips('prTog',[['inf','INFINITE SURGE','N'],['nocd','NO COOLDOWNS','O'],['god','INVINCIBLE','G']],null,v=>{PR[v]=!PR[v];});
  [...$('prTog').children].forEach((b,i)=>b.classList.toggle('sel',!!PR[['inf','nocd','god'][i]]));
  $('prMoves').innerHTML=ME?movesHTML(ME.hero):'';$('prMoves').style.setProperty('--c',ME?ME.hero.css:'#fff');renderPracStats();}
function renderPracStats(){if(!PR.on)return;const d=PR.dps.reduce((a,b)=>a+b[1],0)/3;
  $('prStats').innerHTML=`<span>LAST HIT <b>${PR.last.toFixed(1)}</b></span><span>COMBO <b>${PR.combo.toFixed(0)}</b></span><span>DPS <b>${d.toFixed(1)}</b></span><span>TOTAL <b>${PR.total.toFixed(0)}</b></span>`;}
addEventListener('keydown',e=>{if(!PR.on||!inMatch()||paused||e.repeat)return;const k=e.code;const acts={KeyZ:'stand',KeyX:'block',KeyC:'move',KeyV:'jump',KeyB:'fight'};
  if(acts[k]){PR.act=acts[k];renderPracPanel();AU.ui();}else if(k==='KeyN'){PR.inf=!PR.inf;renderPracPanel();}else if(k==='KeyO'){PR.nocd=!PR.nocd;renderPracPanel();}else if(k==='KeyG'){PR.god=!PR.god;renderPracPanel();}
  else if(k==='KeyH'){practiceRespawn();}else if(k==='KeyP'){PR.panel=!PR.panel;$('prac').classList.toggle('min',!PR.panel);}});
$('prReset').onclick=practiceRespawn;
$('prFighter').onclick=()=>{AU.ui();endMatchCleanup();openSetup('prac');};
$('prExit').onclick=()=>{AU.ui();leaveMatch();};
$('prHide').onclick=()=>{PR.panel=!PR.panel;$('prac').classList.toggle('min',!PR.panel);AU.ui();};
$('bPractice').onclick=()=>{AU.init();AU.ui();openSetup('prac');};
$('bCreate').onclick=()=>{AU.init();AU.ui();setupMode='off';openCreator();};
