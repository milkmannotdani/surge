/* COSTUME UPGRADE: an extra layer of original costume detail on every fighter, themed to their power.
   Each entry in LOOKS picks: em (chest emblem shape), belt, br (bracers), bt (boot style), sh (shoulders), col (collar)
   and an optional sig(X,h) function for one signature accessory. Colors come from the fighter (so shop skins recolor it).
   Emblem shapes: star bolt flame wave drop wing bomb eye orbit shield feather spiral blade crack bone gear crown clock
   portal rune fang snow cross diamond mirror target heart hex.  To restyle a fighter, edit their LOOKS line. */
const LOOKS={
  cinder:{em:'flame',belt:1,br:'plate',bt:'armor',sh:'plate',sig:X=>vents(X,0xff6a1a)},
  riptide:{em:'wave',belt:1,br:'band',bt:'cuff',sh:'none',sig:X=>pendant(X,0x3ad8ff)},
  gale:{em:'wing',belt:1,br:'band',bt:'wing',sh:'none',sig:X=>backRing(X,0xd8e4ff,6)},
  nitro:{em:'bomb',belt:1,br:'spike',bt:'armor',sh:'plate'},
  titan:{em:'star',belt:2,br:'band',bt:'armor',sh:'none',sig:X=>buckleStar(X)},
  volta:{em:'bolt',belt:1,br:'coil',bt:'cuff',sh:'none',sig:X=>antenna(X,0xffe03a)},
  umbra:{em:'eye',belt:1,br:'glove',bt:'cuff',sh:'spike',col:'hood'},
  drift:{em:'orbit',belt:1,br:'band',bt:'cuff',sh:'none',sig:X=>halo(X,0xb07bff)},
  bastion:{em:'shield',belt:2,br:'plate',bt:'armor',sh:'plate'},
  quill:{em:'feather',belt:1,br:'band',bt:'wing',sh:'none',sig:X=>earFeathers(X)},
  void:{em:'spiral',belt:1,br:'glove',bt:'cuff',sh:'none',col:'high'},
  ronin:{em:'blade',belt:'sash',br:'plate',bt:'cuff',sh:'plate',sig:X=>sheath(X)},
  quake:{em:'crack',belt:2,br:'rock',bt:'armor',sh:'rock'},
  marrow:{em:'bone',belt:1,br:'bone',bt:'cuff',sh:'bone'},
  entropy:{em:'crack',belt:1,br:'glove',bt:'cuff',sh:'none',col:'hood'},
  sovereign:{em:'crown',belt:2,br:'plate',bt:'armor',sh:'plate',col:'high',sig:X=>chain(X)},
  strobe:{em:'clock',belt:1,br:'band',bt:'cuff',sh:'none',sig:X=>watch(X)},
  pyre:{em:'flame',belt:1,br:'glove',bt:'cuff',sh:'none',col:'high',sig:X=>vents(X,0x3a8aff)},
  warp:{em:'portal',belt:1,br:'band',bt:'cuff',sh:'none',sig:X=>backRing(X,0x8a5aff,0)},
  hex:{em:'rune',belt:'tags',br:'band',bt:'cuff',sh:'none',col:'hood'},
  scathe:{em:'fang',belt:1,br:'claw',bt:'armor',sh:'spike'},
  solstice:{em:'snow',belt:1,br:'plate',bt:'armor',sh:'half',sig:X=>pendant(X,0x9ae8ff)},
  piston:{em:'gear',belt:2,br:'band',bt:'armor',sh:'plate',sig:X=>exhaust(X)},
  snare:{em:'cross',belt:1,br:'band',bt:'cuff',sh:'none'},
  marble:{em:'diamond',belt:1,br:'glove',bt:'cuff',sh:'none',col:'high'},
  legion:{em:'mirror',belt:1,br:'band',bt:'cuff',sh:'none'},
  recoil:{em:'target',belt:'ammo',br:'band',bt:'armor',sh:'plate',sig:X=>headset(X)},
  crimson:{em:'drop',belt:1,br:'band',bt:'cuff',sh:'none'},
  sawback:{em:'blade',belt:2,br:'spike',bt:'armor',sh:'spike'},
  skitter:{em:'wing',belt:1,br:'band',bt:'cuff',sh:'none'},
  decree:{em:'rune',belt:2,br:'band',bt:'armor',sh:'plate'},
  verdict:{em:'blade',belt:1,br:'band',bt:'cuff',sh:'none'},
  resect:{em:'hex',belt:1,br:'glove',bt:'cuff',sh:'none'},
  cushion:{em:'heart',emY:-.02,emZ:.47,belt:2,br:'pad',bt:'armor',sh:'pad'},
  corrosa:{em:'drop',belt:1,br:'band',bt:'cuff',sh:'none',sig:X=>pendant(X,0xb8ff3a)}};
/* ---- emblem textures (drawn once per shape+color) ---- */
const EMB_C={};
function emblemTex(shape,col){const key=shape+col;if(EMB_C[key])return EMB_C[key];const [c,g]=cv(128,128);g.translate(64,64);const css='#'+new THREE.Color(col).getHexString();
  g.fillStyle='rgba(0,0,0,0)';g.strokeStyle=css;g.fillStyle=css;g.lineWidth=9;g.lineCap=g.lineJoin='round';g.shadowColor=css;g.shadowBlur=10;
  const P=(pts,fill)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();fill?g.fill():g.stroke();};
  const circ=(r,fill)=>{g.beginPath();g.arc(0,0,r,0,6.283);fill?g.fill():g.stroke();};
  switch(shape){
    case 'star':{const pts=[];for(let i=0;i<10;i++){const r=i%2?22:50,a=i/10*6.283-1.571;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}P(pts,1);break;}
    case 'bolt':P([[10,-52],[-28,6],[-2,6],[-12,52],[28,-8],[2,-8]],1);break;
    case 'flame':g.beginPath();g.moveTo(0,52);g.bezierCurveTo(-46,40,-40,-6,-8,-50);g.bezierCurveTo(-6,-20,14,-24,12,-40);g.bezierCurveTo(46,-6,44,40,0,52);g.fill();break;
    case 'wave':for(let k=0;k<3;k++){g.beginPath();for(let x=-48;x<=48;x+=4){const y=-24+k*24+Math.sin(x/12)*9;x===-48?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}break;
    case 'drop':g.beginPath();g.moveTo(0,-52);g.bezierCurveTo(30,-10,38,10,38,22);g.arc(0,22,38,0,Math.PI);g.bezierCurveTo(-38,10,-30,-10,0,-52);g.fill();break;
    case 'wing':[-1,1].forEach(s=>{for(let k=0;k<3;k++)P([[s*4,10-k*14],[s*(54-k*8),-26-k*8],[s*(46-k*8),-10-k*8]],1);});break;
    case 'bomb':circ(30,1);g.fillRect(-8,-50,16,20);g.lineWidth=5;g.beginPath();g.moveTo(0,-50);g.quadraticCurveTo(18,-62,26,-50);g.stroke();break;
    case 'eye':g.beginPath();g.moveTo(-52,0);g.quadraticCurveTo(0,-44,52,0);g.quadraticCurveTo(0,44,-52,0);g.stroke();circ(16,1);break;
    case 'orbit':circ(14,1);g.save();g.scale(1,.4);circ(48,0);g.restore();g.save();g.rotate(1.1);g.scale(1,.4);circ(48,0);g.restore();break;
    case 'shield':P([[-40,-44],[40,-44],[40,4],[0,52],[-40,4]],0);P([[-22,-26],[22,-26],[22,0],[0,30],[-22,0]],1);break;
    case 'feather':g.beginPath();g.moveTo(-30,48);g.quadraticCurveTo(-40,-30,30,-50);g.quadraticCurveTo(20,20,-30,48);g.fill();break;
    case 'spiral':g.beginPath();for(let a=0;a<14;a+=.2){const r=3+a*3.4;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.stroke();break;
    case 'blade':g.rotate(.78);P([[-6,-54],[6,-54],[6,24],[-6,24]],1);g.fillRect(-20,24,40,8);g.fillRect(-5,32,10,18);break;
    case 'crack':g.beginPath();g.moveTo(-10,-54);g.lineTo(8,-20);g.lineTo(-12,4);g.lineTo(12,26);g.lineTo(-2,54);g.stroke();g.beginPath();g.moveTo(8,-20);g.lineTo(34,-30);g.moveTo(-12,4);g.lineTo(-36,12);g.stroke();break;
    case 'bone':g.fillRect(-36,-8,72,16);[[-36,0],[36,0]].forEach(([x])=>{g.beginPath();g.arc(x,-10,12,0,6.283);g.arc(x,10,12,0,6.283);g.fill();});break;
    case 'gear':for(let k=0;k<8;k++){g.save();g.rotate(k/8*6.283);g.fillRect(-8,-50,16,16);g.restore();}circ(36,1);g.globalCompositeOperation='destination-out';circ(14,1);g.globalCompositeOperation='source-over';break;
    case 'crown':P([[-46,30],[-46,-30],[-22,0],[0,-44],[22,0],[46,-30],[46,30]],1);break;
    case 'clock':circ(46,0);g.beginPath();g.moveTo(0,0);g.lineTo(0,-32);g.moveTo(0,0);g.lineTo(22,10);g.stroke();break;
    case 'portal':g.save();g.scale(.7,1);circ(46,0);circ(28,0);g.restore();circ(8,1);break;
    case 'rune':P([[0,-52],[40,0],[0,52],[-40,0]],0);g.beginPath();g.moveTo(0,-52);g.lineTo(0,52);g.moveTo(-20,-10);g.lineTo(20,10);g.stroke();break;
    case 'fang':P([[-40,-40],[-18,-40],[-28,40]],1);P([[18,-40],[40,-40],[28,40]],1);break;
    case 'snow':for(let k=0;k<6;k++){g.save();g.rotate(k/6*6.283);g.beginPath();g.moveTo(0,0);g.lineTo(0,-50);g.moveTo(0,-30);g.lineTo(-12,-42);g.moveTo(0,-30);g.lineTo(12,-42);g.stroke();g.restore();}break;
    case 'cross':g.lineWidth=14;g.beginPath();g.moveTo(-40,-40);g.lineTo(40,40);g.moveTo(40,-40);g.lineTo(-40,40);g.stroke();break;
    case 'diamond':P([[0,-54],[38,0],[0,54],[-38,0]],1);break;
    case 'mirror':g.beginPath();g.arc(0,0,44,Math.PI*.5,Math.PI*1.5);g.fill();g.beginPath();g.arc(0,0,44,-Math.PI*.5,Math.PI*.5);g.stroke();break;
    case 'target':circ(44,0);circ(22,0);g.beginPath();g.moveTo(0,-56);g.lineTo(0,56);g.moveTo(-56,0);g.lineTo(56,0);g.stroke();break;
    case 'heart':g.beginPath();g.moveTo(0,46);g.bezierCurveTo(-60,4,-36,-48,0,-18);g.bezierCurveTo(36,-48,60,4,0,46);g.fill();break;
    case 'hex':{const pts=[];for(let i=0;i<6;i++){const a=i/6*6.283;pts.push([Math.cos(a)*46,Math.sin(a)*46]);}P(pts,0);circ(12,1);break;}
    default:circ(40,1);}
  const t=tex(c);EMB_C[key]=t;return t;}
/* ---- signature accessories ---- */
function vents(X,col){const m=new THREE.MeshStandardMaterial({color:0x2a2a30,metalness:.8,roughness:.3}),hot=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2.4});
  [-1,1].forEach(s=>{for(let k=0;k<3;k++){const v=X.M(new THREE.BoxGeometry(.05,.012,.04),hot);v.position.set(s*.1,.5-k*.035,-.22);X.spine.add(v);}const b=X.M(new THREE.BoxGeometry(.08,.14,.03),m);b.position.set(s*.1,.47,-.215);X.spine.add(b);});}
function pendant(X,col){const g=X.M(new THREE.OctahedronGeometry(.035),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:1.6,roughness:.1}));g.position.set(0,.3,.13);g.scale.y=1.5;X.neck.add(g);}
function backRing(X,col,blades){const r=X.M(new THREE.TorusGeometry(.2,.018,10,40),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:1.2,metalness:.5}));r.position.set(0,.45,-.28);X.spine.add(r);
  for(let k=0;k<blades;k++){const b=X.M(new THREE.BoxGeometry(.03,.17,.01),new THREE.MeshStandardMaterial({color:col}));b.position.set(Math.cos(k/blades*6.283)*.1,.45+Math.sin(k/blades*6.283)*.1,-.28);b.rotation.z=k/blades*6.283;X.spine.add(b);}}
function buckleStar(X){const s=X.M(new THREE.PlaneGeometry(.12,.12),new THREE.MeshBasicMaterial({map:emblemTex('star',0xffd23f),transparent:true}));s.position.set(0,.02,.205);X.hips.add(s);}
function antenna(X,col){[-1,1].forEach(s=>{const a=X.M(new THREE.CylinderGeometry(.008,.008,.18,6),X.trim);a.position.set(s*.12,.28,-.02);a.rotation.z=-s*.35;X.head.add(a);const t=X.M(new THREE.SphereGeometry(.022,10,8),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2}));t.position.set(s*.155,.36,-.02);X.head.add(t);});}
function halo(X,col){const h=X.M(new THREE.TorusGeometry(.16,.012,8,40),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2}));h.rotation.x=Math.PI/2;h.position.y=.42;X.head.add(h);}
function earFeathers(X){[-1,1].forEach(s=>{for(let k=0;k<2;k++){const f=X.M(new THREE.ConeGeometry(.025,.2,6),X.glow);f.scale.z=.3;f.position.set(s*.17,.12+k*.05,-.04);f.rotation.set(-.5,0,-s*(1+k*.3));X.head.add(f);}});}
function sheath(X){const sh=X.M(new THREE.CylinderGeometry(.025,.03,.75,10),new THREE.MeshStandardMaterial({color:0x1a0a0a,roughness:.5}));sh.position.set(-.2,-.05,-.08);sh.rotation.set(.3,0,.9);X.hips.add(sh);
  const hilt=X.M(new THREE.CylinderGeometry(.02,.02,.16,8),X.trim);hilt.position.set(.08,.12,-.02);hilt.rotation.set(.3,0,.9);X.hips.add(hilt);}
function chain(X){const gold=new THREE.MeshStandardMaterial({color:0xd8b060,metalness:1,roughness:.25});for(let k=0;k<9;k++){const l=X.M(new THREE.TorusGeometry(.02,.006,6,12),gold);const a=(k-4)*.17;l.position.set(Math.sin(a)*.2,.48-Math.cos(a)*.08+.08,.22);l.rotation.y=k%2?Math.PI/2:0;X.spine.add(l);}}
function watch(X){const w=X.M(new THREE.CylinderGeometry(.045,.045,.02,20),new THREE.MeshStandardMaterial({color:0xd8b060,metalness:1,roughness:.2}));w.rotation.x=Math.PI/2;w.position.set(.14,-.02,.2);X.hips.add(w);
  const f=X.M(new THREE.CircleGeometry(.035,20),new THREE.MeshBasicMaterial({map:emblemTex('clock',0x111111)}));f.position.set(.14,-.02,.212);X.hips.add(f);}
function exhaust(X){const p=new THREE.MeshStandardMaterial({color:0xc8ccd8,metalness:1,roughness:.2}),hot=new THREE.MeshStandardMaterial({color:0xffb03a,emissive:0xff5a1a,emissiveIntensity:2});
  [-1,1].forEach(s=>{const e=X.M(new THREE.CylinderGeometry(.03,.035,.26,12),p);e.position.set(s*.08,.52,-.24);e.rotation.x=-.3;X.spine.add(e);const t=X.M(new THREE.CylinderGeometry(.026,.026,.01,12),hot);t.position.set(s*.08,.64,-.28);t.rotation.x=-.3;X.spine.add(t);});}
function headset(X){const m=new THREE.MeshStandardMaterial({color:0x1a1a20,metalness:.6,roughness:.4});const band=X.M(new THREE.TorusGeometry(.18,.012,8,30,Math.PI),m);band.position.y=.12;band.rotation.z=0;band.rotation.y=Math.PI/2;X.head.add(band);
  const ear=X.M(new THREE.CylinderGeometry(.05,.05,.04,16),m);ear.rotation.z=Math.PI/2;ear.position.set(.18,.1,0);X.head.add(ear);
  const lens=X.M(new THREE.CylinderGeometry(.03,.03,.06,14),new THREE.MeshStandardMaterial({color:0xff3a96,emissive:0xff3a96,emissiveIntensity:2}));lens.rotation.x=Math.PI/2;lens.position.set(-.07,.15,.17);X.head.add(lens);}
/* ---- the generic pieces ---- */
function looksBuild(h,X){const L=LOOKS[h.id]||(h.as&&LOOKS[h.as.look]);if(!L)return;const {M,head,neck,spine,hips,lS,rS,lE,rE,lK,rK,trim,glow,dark}=X;
  const acc=h.accent,col=h.color;const accM=new THREE.MeshStandardMaterial({color:acc,emissive:acc,emissiveIntensity:1.4,roughness:.3}),metal=new THREE.MeshStandardMaterial({color:0x3a3e48,metalness:.85,roughness:.3});
  // chest emblem
  if(L.em){const ey=L.emY!=null?L.emY:.5,ez=L.emZ||.247;const bk=M(new THREE.CircleGeometry(.092,6),dark);bk.position.set(0,ey,ez);bk.rotation.z=Math.PI/6;spine.add(bk);
    const e=M(new THREE.PlaneGeometry(.15,.15),new THREE.MeshBasicMaterial({map:emblemTex(L.em,acc),transparent:true,depthWrite:false}));e.position.set(0,ey,ez+.003);spine.add(e);}
  // belt
  if(L.belt){const b=M(new THREE.CylinderGeometry(.215,.215,L.belt===2?.08:.05,28,1,true),L.belt==='sash'?new THREE.MeshStandardMaterial({color:col,roughness:.8}):dark);b.position.y=.02;b.scale.set(1,1,.82);hips.add(b);
    if(L.belt!=='sash'&&L.belt!=='tags'&&L.belt!=='ammo'){const bk=M(new THREE.BoxGeometry(.09,L.belt===2?.07:.05,.02),L.belt===2?trim:accM);bk.position.set(0,.02,.18);hips.add(bk);}
    if(L.belt==='sash'){const t=M(new THREE.BoxGeometry(.06,.24,.015),new THREE.MeshStandardMaterial({color:col}));t.position.set(.12,-.1,.15);t.rotation.z=.2;hips.add(t);}
    if(L.belt==='tags')for(let k=0;k<5;k++){const t=M(new THREE.PlaneGeometry(.04,.12),new THREE.MeshStandardMaterial({color:0xf2ead0,emissive:acc,emissiveIntensity:.2,side:THREE.DoubleSide}));const a=(k-2)*.45;t.position.set(Math.sin(a)*.2,-.06,Math.cos(a)*.17);t.rotation.y=a;hips.add(t);}
    if(L.belt==='ammo'){for(let k=0;k<8;k++){const r=M(new THREE.CylinderGeometry(.012,.012,.06,8),new THREE.MeshStandardMaterial({color:0xd8b060,metalness:1,roughness:.3}));const a=(k-3.5)*.22;r.position.set(Math.sin(a)*.21,.02,Math.cos(a)*.175);hips.add(r);}}}
  // bracers
  const brM=L.br==='bone'?new THREE.MeshStandardMaterial({color:0xeee8d8,roughness:.6}):L.br==='rock'?new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.95,flatShading:true}):L.br==='glove'?dark:L.br==='pad'?new THREE.MeshStandardMaterial({color:acc,roughness:.6}):trim;
  [lE,rE].forEach(el=>{if(!L.br)return;
    if(L.br==='coil'){for(let k=0;k<4;k++){const r=M(new THREE.TorusGeometry(.074,.01,6,20),accM);r.rotation.x=Math.PI/2;r.position.y=-.08-k*.045;el.add(r);}return;}
    const c=M(new THREE.CylinderGeometry(L.br==='pad'?.09:.076,L.br==='pad'?.085:.07,L.br==='glove'?.2:.13,16),brM);c.position.y=L.br==='glove'?-.2:-.15;el.add(c);
    if(L.br==='spike'||L.br==='claw'||L.br==='bone')for(let k=0;k<3;k++){const s=M(new THREE.ConeGeometry(.018,.08,6),L.br==='bone'?brM:metal);s.position.set(0,-.1-k*.045,-.07);s.rotation.x=L.br==='claw'?-2:-1.57;el.add(s);}
    if(L.br==='band'||L.br==='plate'){const g=M(new THREE.TorusGeometry(.077,.008,6,20),accM);g.rotation.x=Math.PI/2;g.position.y=-.09;el.add(g);}});
  // boots
  [lK,rK].forEach(k=>{if(!L.bt)return;const cuff=M(new THREE.CylinderGeometry(.088,.08,L.bt==='armor'?.16:.06,16),L.bt==='armor'?trim:dark);cuff.position.y=L.bt==='armor'?-.36:-.3;k.add(cuff);
    if(L.bt==='armor'){const kp=M(new THREE.SphereGeometry(.06,12,8,0,Math.PI*2,0,Math.PI*.5),trim);kp.rotation.x=Math.PI/2;kp.position.set(0,-.02,.06);k.add(kp);}
    if(L.bt==='wing'){[-1,1].forEach(s=>{const w=M(new THREE.ConeGeometry(.02,.12,6),accM);w.scale.z=.3;w.position.set(s*.09,-.3,-.02);w.rotation.z=-s*1.1;k.add(w);});}
    const st=M(new THREE.TorusGeometry(.083,.007,6,20),accM);st.rotation.x=Math.PI/2;st.position.y=L.bt==='armor'?-.29:-.27;k.add(st);});
  // shoulders
  [lS,rS].forEach((sh,i)=>{if(!L.sh||L.sh==='none')return;if(L.sh==='half'&&i===1)return;
    const sm=L.sh==='rock'?new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.95,flatShading:true}):L.sh==='bone'?new THREE.MeshStandardMaterial({color:0xeee8d8,roughness:.6}):L.sh==='pad'?new THREE.MeshStandardMaterial({color:acc,roughness:.6}):L.sh==='half'?new THREE.MeshStandardMaterial({color:0xcff4ff,roughness:.1,metalness:.3,emissive:0x2a8aff,emissiveIntensity:.4}):trim;
    const p=M(new THREE.SphereGeometry(.13,20,10,0,Math.PI*2,0,Math.PI*.45),sm);p.position.y=.05;p.scale.set(1.1,.7,1);sh.add(p);
    if(L.sh==='spike'||L.sh==='bone')for(let k=0;k<2;k++){const s=M(new THREE.ConeGeometry(.025,.12,6),L.sh==='bone'?sm:metal);s.position.set((k-.5)*.07,.12,0);s.rotation.z=(i?1:-1)*.3;sh.add(s);}
    if(L.sh==='plate'){const r=M(new THREE.TorusGeometry(.12,.008,6,24,Math.PI),accM);r.position.y=.05;r.rotation.y=Math.PI/2;sh.add(r);}});
  // collar
  if(L.col==='high'){const c=M(new THREE.CylinderGeometry(.13,.11,.12,20,1,true,Math.PI*.3,Math.PI*1.4),trim);c.position.y=.02;c.rotation.y=Math.PI;neck.add(c);}
  if(L.col==='hood'){const c=M(new THREE.SphereGeometry(.21,20,12,Math.PI*.35,Math.PI*1.3,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x14121a,roughness:.9,side:THREE.DoubleSide}));c.position.set(0,.1,-.03);c.scale.set(1,1.05,1.1);head.add(c);}
  if(L.sig)L.sig(X,h);}
const _mhaPartsL=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsL(h,X);try{looksBuild(h,X);}catch(e){console.warn('looks',h.id,e);}return out;};
