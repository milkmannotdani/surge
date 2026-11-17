/* Points and the shop */
/* ================= SHOP & COSMETICS =================
   Spend points on calling cards, per-fighter skins, pets and name tags. Owned items and the equipped loadout
   are saved on this device; equipped cosmetics travel with you online so other players see them. */
const CARDS={
  none:{n:'No card',p:0,c:['#1a1d33','#2a2f52'],pt:'plain',em:''},
  dusk:{n:'Dusk City',p:100,c:['#ff7a3a','#5a1a6a'],pt:'skyline',em:'◆'},
  inferno:{n:'Inferno',p:150,c:['#ffb347','#a8120a'],pt:'flames',em:'✹'},
  tide:{n:'Riptide',p:150,c:['#1fb8ff','#06204a'],pt:'waves',em:'≋'},
  circuit:{n:'Overclock',p:200,c:['#3fe0c5','#071a24'],pt:'circuit',em:'⌁'},
  hexgrid:{n:'Hex Core',p:200,c:['#b57bff','#120a2a'],pt:'hex',em:'⬢'},
  stars:{n:'Starfall',p:250,c:['#8ac4ff','#05061a'],pt:'stars',em:'★'},
  blood:{n:'Bloodline',p:250,c:['#ff3048','#1a0006'],pt:'drips',em:'✚'},
  thunder:{n:'Thunderhead',p:300,c:['#ffe03a','#1a1a2e'],pt:'bolts',em:'⚡'},
  royal:{n:'Royal Decree',p:350,c:['#ffd23f','#3a0a6a'],pt:'damask',em:'♛'},
  skulls:{n:'Last Rites',p:350,c:['#e8e8f0','#0a0a0e'],pt:'skulls',em:'☠'},
  sakura:{n:'Sakura',p:300,c:['#ffb8d8','#3a0a2a'],pt:'petals',em:'✿'},
  glitch:{n:'Glitch',p:400,c:['#ff3ad8','#00ffd0'],pt:'glitch',em:'▣'},
  champion:{n:'Champion',p:600,c:['#ffd23f','#7a4a00'],pt:'rays',em:'♚'},
  void:{n:'Event Horizon',p:500,c:['#000000','#8ac4ff'],pt:'rings',em:'◉'}};
const TAGS={none:{n:'Standard',p:0},gold:{n:'Gold',p:100},neon:{n:'Neon Blue',p:100},toxic:{n:'Toxic',p:120},ice:{n:'Frostbite',p:120},
  inferno:{n:'Inferno',p:200},royal:{n:'Royal',p:250},shadow:{n:'Shadow',p:200},rainbow:{n:'Rainbow',p:400},glitch:{n:'Glitch',p:350}};
const PETS={none:{n:'No pet',p:0},orb:{n:'Crystal Orb',p:150},slime:{n:'Slime',p:200},ghost:{n:'Ghost',p:250},drone:{n:'Drone',p:300},meteor:{n:'Mini Meteor',p:350},
  robocat:{n:'Robo-Cat',p:400},fox:{n:'Fox Spirit',p:450},phoenix:{n:'Phoenix Chick',p:500},dragon:{n:'Dragonling',p:600}};
// skins: [name, suit, main, trim, glow, material]
const SKINS_U={gilded:['Gilded',0x2a2010,0xffd23f,0xb8862a,0xfff2b0,'gold',500],obsidian:['Obsidian',0x08080c,0x16161e,0x2a2a34,null,'gloss',350],
  neon:['Neon Night',0x08061a,0x1a1040,0xff3ad8,0x00ffd0,'gloss',400],chrome:['Chrome',0x2a2c34,0xd8dce6,0x9aa0aa,0x8ad8ff,'chrome',450],prism:['Prism',0x1a1a2a,0xf0f0ff,0xffb8f0,0x8afff0,'pearl',600]};
const SKINS_H={cinder:[['Blue Flame',0x0e1a3a,0x2a6aff,0x9ad0ff,0x4fd2ff],['Magma',0x1a0a06,0x3a1a10,0xff5a1f,0xffa040]],riptide:[['Abyssal',0x020818,0x0a1a3a,0x1fffc0,0x1fffc0],['Coral',0x2a0a1a,0xff6a7a,0xffd0a0,0xff9ab8]],
  gale:[['Storm Grey',0x1a1c22,0x6a7080,0xcfe4ff,0xffffff],['Sakura',0x2a1020,0xffb8d8,0xff6aa8,0xffe0f0]],nitro:[['Toxic Bomb',0x0a1a0a,0x3aff3a,0x1a8a1a,0xb8ff3a],['Firework',0x0a0a2a,0xd02030,0x2a6aff,0xffffff]],
  titan:[['Bronze Colossus',0x2a1a0a,0xb8862a,0x8a5a2a,0xffd27a],['Jade',0x0a1a14,0x2ad88a,0x1a8a5a,0xb8ffd8]],volta:[['Red Static',0x1a0606,0xff3a3a,0xff8a3a,0xffd0a0],['Ice Volt',0x061a2a,0x8ae8ff,0xffffff,0xbff8ff]],
  umbra:[['Blood Moon',0x1a0004,0x6a0010,0xff3048,0xff6a7a],['Ghost White',0xd8dce6,0xf4f6ff,0x9aa0aa,0x8ac4ff]],drift:[['Sunrise',0x2a1006,0xff9a3a,0xffd23f,0xfff2b0],['Nebula',0x0a0620,0x5a2a9a,0xff6ad8,0xd8a8ff]],
  bastion:[['Black Knight',0x0a0a0e,0x22222a,0x6a0a10,0xff3048],['Royal Guard',0x0a1030,0x2a3a8a,0xffd23f,0xfff2b0]],quill:[['Raven',0x06060a,0x1a1a24,0x3a3a4a,0x8a5aff],['Peacock',0x041a1a,0x1a8a8a,0x2a4aff,0x3affd8]],
  void:[['Supernova',0x1a0a00,0xff7a1a,0xffd23f,0xffffff],['Aurora',0x041014,0x1affa8,0x8a5aff,0xb8fff0]],ronin:[['Oni',0x1a0606,0xc4102a,0x1a1a1a,0xffd23f],['Moonlight',0x0a0e1a,0xc8d8ff,0x6a7aaa,0xe8f0ff]],
  quake:[['Obsidian Rock',0x060608,0x1a1a20,0xff5a1f,0xff8a3a],['Desert',0x2a1a0a,0xd8b080,0x9a6a3a,0xffe0a0]],marrow:[['Bone White',0xd8ccb8,0xf0e6d6,0x8a1020,0xff3048],['Venom',0x0a1a06,0x3a8a1a,0x8aff3a,0xd8ff8a]],
  entropy:[['Rust',0x2a1006,0x8a4a2a,0xd87a3a,0xffb87a],['Ivory',0xe8e0d0,0xf4f0e8,0xa89a80,0xffe8b8]],sovereign:[['Gold Tyrant',0x1a1006,0xd8a830,0x6a0a6a,0xffe08a],['Emerald',0x061a0e,0x1ab86a,0x0a5a3a,0x8affc0]],
  strobe:[['Film Noir',0x0a0a0a,0xe8e8e8,0x3a3a3a,0xffffff],['Retro Pink',0x1a0618,0xff6ad8,0x3affd8,0xfff0ff]],pyre:[['Green Wildfire',0x06120a,0x1a3a1a,0x3aff6a,0xa8ffb8],['White Hot',0xd8dce6,0xffffff,0xffd8a0,0xfff8e8]],
  warp:[['Solar Gate',0x1a0e04,0xff9a3a,0xffd23f,0xfff2b0],['Glitch Gate',0x04040a,0x1a1a2a,0xff3ad8,0x00ffd0]],hex:[['Blood Hex',0x1a0004,0x4a0a10,0xff3048,0xff8a8a],['Frost Rune',0x06121a,0xbfefff,0x4a8aaa,0xe8fbff]],
  scathe:[['Ashen',0x2a2a2e,0x6a6a72,0xa8a8b0,0xffffff],['Hellfire',0x1a0400,0x3a0a00,0xff7a1a,0xffd23f]],
  solstice:[['Inverted',0x1a0a0a,0xc4202a,0x6ac8ff,0xcff4ff],['Eclipse',0x06060a,0x1a1a24,0xff6a3a,0xffd27a]],piston:[['Racing Red',0x1a0606,0xd8202a,0xf0f0f0,0xffd23f],['Midnight Engine',0x06060c,0x1a1c28,0x3a8aff,0x7ad8ff]],
  snare:[['Underground',0x0a0a0c,0x16161a,0x8a8e9a,0xffd23f],['Pro Hero',0x0a1430,0x2a4aa8,0xffffff,0x8ad8ff]],marble:[['Ringmaster',0x2a0606,0xc4102a,0xffd23f,0xffe08a],['Emerald Act',0x061a0e,0x0a4a2a,0x1ab86a,0x8affc0]],
  crimson:[['School Uniform',0x0a0a1a,0x2a3a6a,0xd81a3a,0xffd23f],['Vampire',0x06000a,0x1a0010,0xff2a4a,0xff8a9a]],sawback:[['Reptile Gold',0x14100a,0x6a5a2a,0xffd23f,0xfff2b0],['Rusted',0x1a0a06,0x5a2a1a,0xa86a3a,0xffb070]],
  resect:[['Plague White',0xe8e8ee,0x8a8a96,0x2a2a32,0xff3a4a],['Eight Bullets',0x0a0a0c,0x2a0a0e,0xffd23f,0xffe08a]],cushion:[['Slim Mode',0x0a1a2a,0x2a4a8a,0xffd23f,0xffffff],['Gold Medal',0x1a1406,0xd8a820,0xffffff,0xfff2b0]],
  zanshin:[['White Release',0xe8e8f0,0x8a8a92,0x3ad8ff,0xb0f0ff],['Ember Coat',0x3a0a0a,0x1a0a0a,0xffa21a,0xffd88a]],
  oldguard:[['Night Shift',0x0a0a10,0x1a1a22,0xc8ccd4,0xffffff],['Rust Belt',0x8a3a1a,0x4a2a1a,0xffa21a,0xffd88a]],hopstar:[['Encore Pink',0xff6ab0,0x8a2a5a,0xffe03a,0xfff4a0],['Midnight Set',0x0a0a1e,0x1a1a3a,0x6affe0,0xb0fff0]],headliner:[['Red Carpet',0xc4102a,0x5a0a12,0xffd86a,0xfff4d8],['Silver Screen',0xd8dce4,0x8a8e9a,0x3ad8ff,0xb0f0ff]],
  skitter:[['Night Courier',0x0a0a12,0x1a1a26,0xff8a2a,0xffc87a],['Sunset Run',0xe86a2a,0x8a3a1a,0x3affc8,0xb0fff0]],
  decree:[['Night Court',0x0a0a14,0x1a1a2a,0x9a8aff,0xe0d8ff],['Marble Hall',0xe8e4da,0xbab4a8,0x3ad8c8,0xb0fff0]],
  verdict:[['Bone White',0xe8e4da,0x8a8a92,0xc4102a,0xff3a3a],['Night Judge',0x05050a,0x14141e,0x6a6ad8,0xb0b0ff]],
  corrosa:[['Alien Queen',0x0a1406,0x3aa82a,0xff7ad8,0xe0ff8a],['Pinky Pop',0x1a0614,0xff4ab8,0x2a0a3a,0xffd0f0]],
  legion:[['Mud Brown',0x1a1006,0x5a4a32,0x8a7a58,0xffd27a],['Sanctuary',0x0a0a1a,0x2a2a4a,0xff3a6a,0xff8ab8]],recoil:[['Pink Bullet',0x1a0614,0xff6ad8,0xffffff,0xffd0f0],['Steel Sight',0x0a0c10,0x3a3e48,0x9aa0aa,0x8ad8ff]]};
function skinList(hid){const out=[['default','Default',0]];(SKINS_H[hid]||[]).forEach((s,i)=>out.push(['h'+i,s[0],200]));for(const k in SKINS_U)out.push([k,SKINS_U[k][0],SKINS_U[k][6]]);return out;}
function skinDef(hid,sid){if(!sid||sid==='default')return null;if(SKINS_U[sid]){const s=SKINS_U[sid];return {n:s[0],suit:s[1],main:s[2],trim:s[3],glow:s[4],mat:s[5]};}
  const m=/^h(\d)$/.exec(sid);const s=m&&(SKINS_H[hid]||[])[+m[1]];return s?{n:s[0],suit:s[1],main:s[2],trim:s[3],glow:s[4],mat:null}:null;}
function skinHero(h,sid){const d=skinDef(h.id,sid);if(!d)return h;const glow=d.glow!=null?d.glow:h.accent;
  return Object.assign({},h,{suit:d.suit,mainCol:d.main,color:d.trim,accent:glow,css:hexCss(glow),skinMat:d.mat,skinName:d.n});}
function applySkinMat(h,M){const k=h.skinMat;if(!k)return;
  if(k==='gold'){[M.main,M.trim].forEach(m=>{m.metalness=1;m.roughness=.16;m.clearcoat=1;});M.main.emissiveIntensity*=.4;}
  else if(k==='chrome'){[M.main,M.trim,M.suit].forEach(m=>{m.metalness=1;m.roughness=.05;m.clearcoat=1;});}
  else if(k==='gloss'){[M.main,M.trim].forEach(m=>{m.metalness=.3;m.roughness=.12;m.clearcoat=1;m.clearcoatRoughness=.05;});}
  else if(k==='pearl'){[M.main,M.trim].forEach(m=>{m.metalness=.6;m.roughness=.18;m.clearcoat=1;if('sheen' in m){m.sheen=1;}});M.main.emissiveMap=patternTex('stars');M.main.emissive=new THREE.Color(0xd8a8ff);M.main.emissiveIntensity=.6;}}
/* ---- inventory ---- */
let INV={own:{},eq:{card:'none',tag:'none',pet:'none',skins:{}}};
try{const s=JSON.parse(store.get('surge.inv')||'null');if(s&&s.own&&s.eq)INV={own:s.own,eq:Object.assign({card:'none',tag:'none',pet:'none',skins:{}},s.eq)};}catch(e){}
function saveInv(){store.set('surge.inv',JSON.stringify(INV));}
function owns(key){return key.endsWith(':none')||key.endsWith(':default')||!!INV.own[key];}
function myCos(){const h=heroAt(mySel);return sanitizeCos({human:typeof ARMOR_OFF!=='undefined'&&ARMOR_OFF&&!h.custom,pose:INV.eq.pose,card:INV.eq.card,tag:INV.eq.tag,pet:INV.eq.pet,skin:h.custom?'default':(INV.eq.skins[h.id]||'default')},h.id);}
function sanitizeCos(c,hid){if(!c||typeof c!=='object')return null;const one=(v,o)=>o[v]?v:'none';const sk=skinList(hid||'').map(x=>x[0]).indexOf(c.skin)>=0?c.skin:'default';
  return {card:one(c.card,CARDS),tag:one(c.tag,TAGS),pet:one(c.pet,PETS),skin:sk,pose:(typeof VPOSES!=='undefined'&&VPOSES[c.pose])?c.pose:'classic',human:!!c.human};}
/* ---- calling cards ---- */
const CARD_CACHE={};
function drawCard(id,name){const key=id+'|'+name;if(CARD_CACHE[key])return CARD_CACHE[key];const C=CARDS[id]||CARDS.none;const [c,g]=cv(512,112);
  const gr=g.createLinearGradient(0,0,512,112);gr.addColorStop(0,C.c[1]);gr.addColorStop(1,C.c[0]);g.fillStyle=gr;g.fillRect(0,0,512,112);
  const R=(()=>{let s=[...id].reduce((a,ch)=>a*31+ch.charCodeAt(0),7);return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})();
  g.globalAlpha=.35;g.strokeStyle=C.c[0];g.fillStyle=C.c[0];
  const P=C.pt;
  if(P==='flames')for(let i=0;i<26;i++){const x=R()*512,hh=30+R()*70;g.beginPath();g.moveTo(x-12,112);g.quadraticCurveTo(x-14,112-hh*.6,x,112-hh);g.quadraticCurveTo(x+14,112-hh*.6,x+12,112);g.fill();}
  else if(P==='waves')for(let k=0;k<6;k++){g.lineWidth=3;g.beginPath();for(let x=0;x<=512;x+=8)g.lineTo(x,20+k*16+Math.sin(x/30+k)*6);g.stroke();}
  else if(P==='circuit')for(let i=0;i<30;i++){g.lineWidth=2;let x=R()*512,y=R()*112;g.beginPath();g.moveTo(x,y);for(let k=0;k<3;k++){R()<.5?x+=R()*60-30:y+=R()*40-20;g.lineTo(x,y);}g.stroke();g.fillRect(x-3,y-3,6,6);}
  else if(P==='hex')for(let y=0;y<130;y+=22)for(let x=(y/22%2)*19;x<530;x+=38){g.lineWidth=1.5;g.beginPath();for(let k=0;k<7;k++){const a=k/6*Math.PI*2;g.lineTo(x+Math.cos(a)*12,y+Math.sin(a)*12);}g.stroke();}
  else if(P==='stars')for(let i=0;i<90;i++){g.globalAlpha=R()*.8;g.fillRect(R()*512,R()*112,R()*2.5+.5,R()*2.5+.5);}
  else if(P==='drips')for(let i=0;i<22;i++){const x=R()*512,hh=20+R()*60;g.fillRect(x,0,6,hh);g.beginPath();g.arc(x+3,hh,6,0,7);g.fill();}
  else if(P==='bolts')for(let i=0;i<6;i++){g.lineWidth=3;let x=R()*512,y=0;g.beginPath();g.moveTo(x,y);while(y<112){x+=R()*30-15;y+=14;g.lineTo(x,y);}g.stroke();}
  else if(P==='damask')for(let y=10;y<112;y+=34)for(let x=10;x<520;x+=40){g.font='26px serif';g.fillText('❦',x,y+20);}
  else if(P==='skulls')for(let y=6;y<112;y+=34)for(let x=(y%2)*20;x<520;x+=44){g.font='24px serif';g.fillText('☠',x,y+22);}
  else if(P==='petals')for(let i=0;i<40;i++){g.save();g.translate(R()*512,R()*112);g.rotate(R()*6);g.beginPath();g.ellipse(0,0,8,4,0,0,7);g.fill();g.restore();}
  else if(P==='glitch'){for(let i=0;i<24;i++){g.fillStyle=R()<.5?C.c[0]:C.c[1];g.globalAlpha=.5;g.fillRect(0,R()*112,512,R()*6+1);}g.globalAlpha=.35;}
  else if(P==='rays'){g.save();g.translate(420,56);for(let k=0;k<20;k++){g.rotate(Math.PI/10);g.beginPath();g.moveTo(0,0);g.lineTo(400,-30);g.lineTo(400,30);g.fill();}g.restore();}
  else if(P==='rings')for(let k=1;k<9;k++){g.lineWidth=2;g.beginPath();g.ellipse(420,56,k*22,k*9,-.2,0,7);g.stroke();}
  else if(P==='skyline')for(let x=0;x<512;x+=22){const hh=20+R()*60;g.fillRect(x,112-hh,18,hh);}
  g.globalAlpha=1;const sh=g.createLinearGradient(0,0,0,112);sh.addColorStop(0,'rgba(255,255,255,.12)');sh.addColorStop(.5,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=sh;g.fillRect(0,0,512,112);
  if(C.em){g.font='64px serif';g.textAlign='center';g.fillStyle='rgba(255,255,255,.9)';g.shadowColor=C.c[0];g.shadowBlur=18;g.fillText(C.em,64,78);g.shadowBlur=0;}
  g.textAlign='left';g.font='bold 44px "Bebas Neue",Rajdhani,sans-serif';g.fillStyle='#fff';g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=6;g.fillText(String(name||'PLAYER').toUpperCase().slice(0,16),C.em?118:24,70);g.shadowBlur=0;
  g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=3;g.strokeRect(1.5,1.5,509,109);
  const url=c.toDataURL('image/png');CARD_CACHE[key]=url;return url;}
let cardTO=0;
function showCard(f,label){if(!f||!f.cos||f.cos.card==='none')return;const el=$('cardShow');el.innerHTML=`<div class="cl">${label}</div><img src="${drawCard(f.cos.card,f.name)}" alt="">`;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(cardTO);cardTO=setTimeout(()=>el.classList.remove('on'),3200);}
/* ---- name tags (styled names) ---- */
function tagName(f,name){const t=f&&f.cos?f.cos.tag:'none';return `<span class="ntag nt-${t}">${t==='royal'?'♛ ':''}${esc(name)}</span>`;}
const NTAGS={};
function updateTags(){const seen={};if(inMatch())for(const f of FS){if(f.isBot&&!(f.cos&&f.cos.tag!=='none'))continue;if(f.dead||!f.cos)continue;
    const p=TMP3.set(f.pos.x,f.pos.y+2.5*f.hero.scale,f.pos.z).project(camera);const d=f.pos.distanceTo(camera.position);if(p.z>1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05||d>45)continue;
    seen[f.id]=1;let m=NTAGS[f.id];if(!m){m=document.createElement('div');m.className='ovtag';document.body.appendChild(m);NTAGS[f.id]=m;}
    const key=f.name+f.cos.tag;if(m.dataset.k!==key){m.dataset.k=key;m.innerHTML=tagName(f,f.name);}m.style.left=((p.x+1)/2*innerWidth)+'px';m.style.top=((1-p.y)/2*innerHeight)+'px';m.style.opacity=clamp(1.3-d/40,0,1);}
  for(const k in NTAGS)if(!seen[k]){NTAGS[k].remove();delete NTAGS[k];}}
/* ---- pets ---- */
function petMesh(id,col,acc){const g=new THREE.Group(),A=(c,b,o)=>addMat(c,b||1.6,o||.9),S=(c,r,m)=>new THREE.MeshPhysicalMaterial({color:c,roughness:r==null?.35:r,metalness:m||0,clearcoat:.6}),M=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);g.add(o);return o;};
  const eyes=(y,z,s,c)=>[-1,1].forEach(k=>M(new THREE.SphereGeometry(.035*(s||1),10,8),A(c||0xffffff,2.4),k*.07*(s||1),y,z));const anim={};
  switch(id){
    case 'orb':M(new THREE.OctahedronGeometry(.16,0),S(acc,.1,.3));M(new THREE.SphereGeometry(.26,16,12),A(acc,.8,.25));anim.spin=1;break;
    case 'slime':{const b=M(new THREE.SphereGeometry(.2,24,16),new THREE.MeshPhysicalMaterial({color:0x6aff8a,roughness:.1,transparent:true,opacity:.8,clearcoat:1}));b.scale.set(1,.75,1);eyes(.04,.17,1,0x0a2a0a);anim.squish=b;break;}
    case 'ghost':{const b=M(new THREE.SphereGeometry(.18,24,16,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshPhysicalMaterial({color:0xe8f0ff,transparent:true,opacity:.75,emissive:0x6a8aff,emissiveIntensity:.4}));
      const t=M(new THREE.ConeGeometry(.15,.22,16,1,true),b.material,0,-.1,0);t.rotation.x=Math.PI;eyes(.04,.15,1,0x10102a);anim.wave=t;break;}
    case 'drone':{M(new THREE.BoxGeometry(.24,.08,.18),S(0x3a3e4a,.3,.8));M(new THREE.SphereGeometry(.05,10,8),A(acc,2.6),0,0,.1);anim.rot=[];[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z])=>{M(new THREE.CylinderGeometry(.015,.015,.06,6),S(0x22222a),x*.14,.04,z*.1);
      const r=M(new THREE.CylinderGeometry(.08,.08,.006,16),A(acc,1,.35),x*.14,.075,z*.1);anim.rot.push(r);});break;}
    case 'meteor':{const r=M(new THREE.DodecahedronGeometry(.15,1),new THREE.MeshStandardMaterial({color:0x5a4a3a,roughness:.9,flatShading:true,emissive:0xff4a10,emissiveIntensity:.6}));M(new THREE.SphereGeometry(.22,16,12),A(0xff7a1a,1,.3));anim.spin=1;anim.trail=0xff7a1a;break;}
    case 'robocat':{const m=S(0xd8dce6,.25,.7);M(new THREE.BoxGeometry(.26,.16,.32),m);const hd=M(new THREE.BoxGeometry(.2,.17,.17),m,0,.12,.16);[-1,1].forEach(k=>{const e=M(new THREE.ConeGeometry(.04,.08,4),m,k*.06,.24,.16);});
      eyes(.13,.25,1,acc);M(new THREE.BoxGeometry(.03,.03,.22),m,0,.06,-.24).rotation.x=-.6;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z])=>M(new THREE.BoxGeometry(.05,.1,.05),S(0x3a3e4a),x*.09,-.11,z*.11));anim.walk=1;break;}
    case 'fox':{const m=new THREE.MeshPhysicalMaterial({color:0xff9a3a,emissive:0xff5a1a,emissiveIntensity:.5,transparent:true,opacity:.9});M(new THREE.SphereGeometry(.13,16,12),m).scale.set(1,.9,1.3);
      const hd=M(new THREE.ConeGeometry(.1,.2,12),m,0,.07,.19);hd.rotation.x=Math.PI/2;[-1,1].forEach(k=>M(new THREE.ConeGeometry(.035,.09,6),m,k*.05,.17,.13));
      for(let i=0;i<3;i++){const t=M(new THREE.ConeGeometry(.05,.3,8),A(0xffb86a,1.4,.7),(i-1)*.06,.05,-.2);t.rotation.x=-1.1;t.rotation.z=(i-1)*.4;}eyes(.1,.25,.8,0x3affd8);anim.float=1;break;}
    case 'phoenix':{const m=new THREE.MeshPhysicalMaterial({color:0xffb347,emissive:0xff5a1f,emissiveIntensity:.8});M(new THREE.SphereGeometry(.13,16,12),m);M(new THREE.ConeGeometry(.03,.07,8),S(0xffd23f),0,0,.14).rotation.x=Math.PI/2;
      anim.wings=[-1,1].map(k=>{const w=M(new THREE.PlaneGeometry(.22,.12),A(0xff7a1a,1.6,.85),k*.15,0,0);w.material.side=THREE.DoubleSide;w.userData.k=k;return w;});eyes(.04,.11,.7,0x1a0a00);anim.trail=0xffb347;break;}
    case 'dragon':{const m=S(acc,.3,.3);M(new THREE.SphereGeometry(.12,16,12),m).scale.set(1,.9,1.4);const hd=M(new THREE.SphereGeometry(.09,14,10),m,0,.08,.17);M(new THREE.ConeGeometry(.04,.1,8),m,0,.07,.26).rotation.x=Math.PI/2;
      [-1,1].forEach(k=>M(new THREE.ConeGeometry(.02,.08,6),S(0xf0e6d6),k*.04,.17,.14));const t=M(new THREE.ConeGeometry(.05,.3,8),m,0,0,-.25);t.rotation.x=-Math.PI/2;
      anim.wings=[-1,1].map(k=>{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.3,.1);sh.lineTo(.25,-.02);sh.lineTo(.12,-.06);sh.lineTo(0,0);const w=M(new THREE.ShapeGeometry(sh),A(acc,1.2,.85),k*.06,.05,0);w.material.side=THREE.DoubleSide;if(k<0)w.scale.x=-1;w.rotation.x=-Math.PI/2;w.userData.k=k;return w;});
      eyes(.11,.24,.7,0xffd23f);break;}}
  g.traverse(o=>{if(o.isMesh)o.castShadow=false;});g.userData.anim=anim;return g;}
function attachPet(f){if(!f.cos||!f.cos.pet||f.cos.pet==='none')return;f.pet=petMesh(f.cos.pet,f.hero.color,f.hero.accent);f.pet.position.copy(f.pos);f.pet.position.y=2;scene.add(f.pet);f.petT=Math.random()*6;}
function updatePets(dt){for(const f of FS){const p=f.pet;if(!p)continue;f.petT+=dt;const t=f.petT,an=p.userData.anim,side=f.id%2?1:-1;
    const tx=f.pos.x+Math.sin(f.face+side*2.2)*.9,tz=f.pos.z+Math.cos(f.face+side*2.2)*.9,ty=(an.walk?f.pos.y+.18:f.pos.y+1.9*f.hero.scale+Math.sin(t*2.4)*.12);
    const k=1-Math.exp(-dt*5);const px=p.position.x,pz=p.position.z;p.position.x+=(tx-p.position.x)*k;p.position.z+=(tz-p.position.z)*k;p.position.y+=(ty-p.position.y)*k;
    const vx=p.position.x-px,vz=p.position.z-pz;if(vx*vx+vz*vz>1e-5)p.rotation.y=Math.atan2(vx,vz);else p.rotation.y=angLerp(p.rotation.y,f.face,dt*3);
    if(an.spin){p.children[0].rotation.y+=dt*2;p.children[0].rotation.x+=dt*1.3;}if(an.squish)an.squish.scale.set(1+Math.sin(t*6)*.08,.75-Math.sin(t*6)*.08,1+Math.sin(t*6)*.08);
    if(an.wave)an.wave.rotation.z=Math.sin(t*5)*.2;if(an.rot)an.rot.forEach(r=>r.rotation.y+=dt*30);if(an.wings)an.wings.forEach(w=>{w.rotation.z=Math.sin(t*14)*.6*w.userData.k;});
    if(an.walk)p.position.y=f.pos.y+.18+Math.abs(Math.sin(t*8))*.04*Math.min(1,Math.hypot(vx,vz)/dt/3);
    if(an.trail&&Math.random()<.5)burst(ADD,p.position,1,{colors:[an.trail,0xffffff],speed:.3,life:.4,size:.12,size1:0,bright:2});
    if(an.float&&Math.random()<.2)burst(ADD,p.position,1,{colors:[0xffb86a,0x3affd8],speed:.2,life:.5,size:.08,size1:0,bright:2});}}
/* ---- arena tweaks: regen + keep Surge ---- */
function arenaRegen(dt){if(game.rules!=='arena'||game.phase!=='fight'||NET.role==='client'||game.practice)return;for(const f of FS){if(f.dead||f.hp>=100)continue;if(game.time-f.lastHitT>4){f.hp=Math.min(100,f.hp+(game.time-f.lastHitT>7?12:6)*dt);if(f===ME&&Math.random()<.15)burst(ADD,f.chest(TMP2),1,{colors:[0x3dff8a,0xffffff],speed:.5,up:1.5,life:.5,size:.2,size1:0,bright:2});}}}
/* ================= the shop screen ================= */
const SH={tab:'cards',hero:0,sel:null,open:false,raf:0,obj:null,home:null};
function shopPrice(cat,id,hid){if(cat==='emotes')return EMOTES[id].p;if(cat==='poses')return VPOSES[id].p;if(cat==='cards')return CARDS[id].p;if(cat==='tags')return TAGS[id].p;if(cat==='pets')return PETS[id].p;const s=skinList(hid).find(x=>x[0]===id);return s?s[2]:0;}
function shopKey(cat,id,hid){return cat==='skins'?'skin:'+hid+':'+id:cat.slice(0,-1)+':'+id;}
function isEq(cat,id,hid){if(cat==='emotes')return false;if(cat==='skins')return (INV.eq.skins[hid]||'default')===id;return INV.eq[cat.slice(0,-1)]===id;}
function openShop(){SH.open=true;SH.home=$('pv').parentNode;$('shView').appendChild($('pv'));showScreen('shop');renderShop();shopLoop();}
function closeShop(){SH.open=false;cancelAnimationFrame(SH.raf);shopClear();SH.home.insertBefore($('pv'),SH.home.firstChild);PV.ped.visible=true;showScreen('title');renderPoints();}
function shopClear(){if(SH.obj){PV.scene.remove(SH.obj);SH.obj=null;}}
function shopShow3D(){shopClear();Object.values(PV.rigs).forEach(r=>r.root.visible=false);PV.ped.visible=true;const H=HEROES[SH.hero];
  if(SH.tab==='skins'||SH.tab==='emotes'||SH.tab==='poses'){const R=buildRig(skinHero(H,SH.tab==='skins'?(SH.sel||'default'):(INV.eq.skins[H.id]||'default')),PV.scene);poseRig(R,POSES.showcase,0);SH.obj=R.root;SH.rig=R;}
  else if(SH.tab==='pets'){const g=new THREE.Group();const R=buildRig(skinHero(H,INV.eq.skins[H.id]||'default'),PV.scene);poseRig(R,POSES.showcase,0);g.add(R.root);SH.rig=R;
    if(SH.sel&&SH.sel!=='none'){const p=petMesh(SH.sel,H.color,H.accent);p.scale.setScalar(1.6);p.position.set(.75,1.9,.2);g.add(p);SH.pet=p;}else SH.pet=null;SH.obj=g;}
  if(SH.obj)PV.scene.add(SH.obj);}
function shopLoop(){if(!SH.open)return;SH.raf=requestAnimationFrame(shopLoop);const cvs=$('pv'),w=cvs.clientWidth,h=cvs.clientHeight;const show=SH.tab==='skins'||SH.tab==='pets'||SH.tab==='emotes'||SH.tab==='poses';$('shView').style.display=show?'':'none';if(!show||!w||!h)return;
  if(cvs.width!==Math.floor(w*PV.r.getPixelRatio())||cvs.height!==Math.floor(h*PV.r.getPixelRatio()))PV.r.setSize(w,h,false);
  if(SH.obj){SH.obj.rotation.y+=.008;if(SH.rig)poseRig(SH.rig,(SH.tab==='emotes'||SH.tab==='poses')&&typeof emotePose==='function'?emotePose(SH.tab==='poses'?'pose_'+SH.sel:SH.sel,game.time):(SH.rig.P||POSES.showcase),game.time);if(SH.pet){const t=game.time;SH.pet.position.y=1.9+Math.sin(t*2.4)*.1;const an=SH.pet.userData.anim;
    if(an.wings)an.wings.forEach(w2=>w2.rotation.z=Math.sin(t*14)*.6*w2.userData.k);if(an.rot)an.rot.forEach(r=>r.rotation.y+=.5);if(an.spin)SH.pet.children[0].rotation.y+=.03;if(an.squish)an.squish.scale.set(1+Math.sin(t*6)*.08,.75-Math.sin(t*6)*.08,1+Math.sin(t*6)*.08);}}
  const c=PV.cam;c.aspect=w/h;c.fov=30;c.updateProjectionMatrix();c.position.set(0,1.35,6.2);c.lookAt(0,1.1,0);PV.r.render(PV.scene,c);}
function renderShop(){$('shPts').textContent='★ '+POINTS.toLocaleString();document.querySelectorAll('#shTabs span').forEach(s=>s.classList.toggle('sel',s.dataset.t===SH.tab));
  const H=HEROES[SH.hero],cat=SH.tab;let items=[];
  if(cat==='cards')items=Object.keys(CARDS).map(k=>[k,CARDS[k].n,CARDS[k].p]);else if(cat==='tags')items=Object.keys(TAGS).map(k=>[k,TAGS[k].n,TAGS[k].p]);
  else if(cat==='pets')items=Object.keys(PETS).map(k=>[k,PETS[k].n,PETS[k].p]);else if(cat==='emotes')items=Object.keys(EMOTES).map(k=>[k,EMOTES[k].n,EMOTES[k].p]);else if(cat==='poses')items=Object.keys(VPOSES).map(k=>[k,VPOSES[k].n,VPOSES[k].p]);else items=skinList(H.id);
  if(!SH.sel||!items.some(x=>x[0]===SH.sel))SH.sel=cat==='skins'?(INV.eq.skins[H.id]||'default'):cat==='emotes'?'wave':cat==='poses'?(INV.eq.pose||'classic'):INV.eq[cat.slice(0,-1)];
  $('shHero').style.display=cat==='skins'||cat==='pets'||cat==='emotes'||cat==='poses'?'':'none';
  $('shHero').innerHTML=`<span class="lblx">FIGHTER</span><select id="shHeroSel">${HEROES.map((h,i)=>`<option value="${i}"${i===SH.hero?' selected':''}>${h.name}</option>`).join('')}</select>`;
  $('shHeroSel').onchange=e=>{SH.hero=+e.target.value;SH.sel=null;AU.ui();renderShop();};
  const g=$('shGrid');g.innerHTML='';items.forEach(([id,n,p])=>{const own=owns(shopKey(cat,id,H.id)),eq=isEq(cat,id,H.id);const d=document.createElement('div');d.className='shit'+(SH.sel===id?' sel':'')+(own?' own':'');
    let pv='';if(cat==='cards')pv=`<img src="${drawCard(id,myName())}" alt="">`;else if(cat==='tags')pv=`<div class="shtag">${tagName({cos:{tag:id}},myName())}</div>`;
    else if(cat==='skins'){const s=skinDef(H.id,id)||{suit:H.suit,main:H.mainCol||H.color,trim:H.color,glow:H.accent};pv=`<div class="shsw">${[s.suit,s.main,s.trim,s.glow!=null?s.glow:H.accent].map(c=>`<i style="background:${hexCss(c)}"></i>`).join('')}</div>`;}
    else if(cat==='emotes'||cat==='poses')pv=`<div class="shpet">${(cat==='emotes'?EMOTES:VPOSES)[id].ic}</div>`;
    else pv=`<div class="shpet">${({none:'—',orb:'◆',slime:'●',ghost:'👻',drone:'⌖',meteor:'☄',robocat:'🐱',fox:'🦊',phoenix:'🔥',dragon:'🐉'})[id]}</div>`;
    d.innerHTML=pv+`<div class="shn">${n}</div><div class="shp">${eq?'EQUIPPED':own?'OWNED':'★ '+p}</div>`;d.onclick=()=>{SH.sel=id;AU.ui();renderShop();};g.appendChild(d);});
  const sel=SH.sel,own=owns(shopKey(cat,sel,H.id)),eq=isEq(cat,sel,H.id),price=shopPrice(cat,sel,H.id);const b=$('shBuy');
  b.textContent=eq?'EQUIPPED':own?'EQUIP':POINTS>=price?`BUY · ★ ${price}`:`NEED ★ ${price}`;b.disabled=eq||(!own&&POINTS<price);
  const nm=(cat==='emotes'?EMOTES[sel].n:cat==='poses'?VPOSES[sel].n:cat==='cards'?CARDS[sel].n:cat==='tags'?TAGS[sel].n:cat==='pets'?PETS[sel].n:(skinList(H.id).find(x=>x[0]===sel)||[0,''])[1]);
  $('shName').textContent=(cat==='skins'?H.name+' · ':'')+nm;
  $('shBig').innerHTML=cat==='cards'?`<img src="${drawCard(sel,myName())}" alt=""><div class="mdnote">Enemies you eliminate see this card. It also shows in lobbies and on the results screen when you win.</div>`:
    cat==='tags'?`<div class="shtag big">${tagName({cos:{tag:sel}},myName())}</div><div class="mdnote">Your name shows in this style above your fighter, in the kill feed and in lobbies.</div>`:'';
  if(cat==='skins'||cat==='pets'||cat==='emotes'||cat==='poses')shopShow3D();else shopClear();}
$('shBuy').onclick=()=>{const H=HEROES[SH.hero],cat=SH.tab,id=SH.sel,key=shopKey(cat,id,H.id);AU.init();
  if(!owns(key)){const p=shopPrice(cat,id,H.id);if(POINTS<p)return;POINTS-=p;store.set('surge.points',String(POINTS));INV.own[key]=1;AU.scale=1;AU.tone('triangle',660,1320,.25,.1);AU.tone('triangle',990,1980,.3,.08,.1);}
  else AU.ui();if(cat==='skins')INV.eq.skins[H.id]=id;else INV.eq[cat.slice(0,-1)]=id;saveInv();clearSkinRigs();renderShop();};
function clearSkinRigs(){Object.keys(PV.rigs).forEach(k=>{PV.scene.remove(PV.rigs[k].root);delete PV.rigs[k];delete PV.portraits[k];});makePortraits();}
document.querySelectorAll('#shTabs span').forEach(s=>s.onclick=()=>{SH.tab=s.dataset.t;SH.sel=null;AU.ui();renderShop();});
$('shBack').onclick=()=>{AU.ui();closeShop();};$('bShop').onclick=()=>{AU.init();AU.ui();SH.hero=Math.min(mySel,HEROES.length-1);openShop();};

let decorateBotsLater=0;
// bots wear free fighter skins, the odd pet and calling card so matches look lived-in (decided once by the host, sent to everyone)
function decorateBots(roster){roster.forEach(r=>{if(!r.bot||r.cos||r.dummy||r.cust)return;const h=HEROES[r.hero|0]||HEROES[0];const sk=Math.random()<.45?pick(['h0','h1']):'default';
  r.cos={skin:sk,pet:Math.random()<.18?pick(Object.keys(PETS).slice(1,6)):'none',card:Math.random()<.5?pick(Object.keys(CARDS).slice(1,9)):'none',tag:'none'};});}
