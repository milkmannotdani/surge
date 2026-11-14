/* ARMOR OFF: the person under the suit. Toggle it with the ARMOR button on the fighter select screen.
   The helmet, visor, armor pads, gauntlets and boot plates come off; the suit turns into everyday cloth; and every
   fighter gets their own face and hair from HUMAN below (all original looks themed to each fighter's power).
   Entry: [skin tone, hair colour, hair style, eye colour, extra]. Styles: short spiky long pony bun buzz mohawk curly
   slick afro twin bald messy. Extras: beard stubble glasses shades freckles earring. Other players see it online too. */
const SKIN=[0xf6d7c0,0xe8bea0,0xd2a07a,0xb07850,0x8a5a3a,0x5e3a26];
const HUMAN={
  cinder:[2,0xa8401a,'spiky',0xffa040],riptide:[4,0x1a8a9a,'long',0x3ad8ff,'earring'],gale:[0,0xe8e0ff,'pony',0x9a7aff],nitro:[1,0x14141a,'slick',0xff8a1a],
  titan:[2,0x3a2414,'short',0x3a8aff,'stubble'],volta:[1,0xffe03a,'mohawk',0xffe03a],umbra:[0,0x0a0a14,'long',0x8a5aff],drift:[3,0x8a5aff,'bun',0xb07bff],
  bastion:[5,0x6a6a72,'buzz',0x9aa0aa,'beard'],quill:[1,0xff8ab8,'curly',0xff6ab8,'freckles'],void:[3,0x1a2a6a,'curly',0x8ac4ff],ronin:[2,0x14100e,'bun',0xd8b060,'stubble'],
  quake:[4,0x3a2414,'bald',0x8a6a3a,'beard'],marrow:[0,0x9a9aa2,'messy',0xd8d8e0],entropy:[1,0x6a1a2a,'spiky',0xff4a5a],sovereign:[2,0xc8ccd4,'slick',0xc84aff,'beard'],
  strobe:[0,0xff8a3a,'pony',0x3fe0c5,'freckles'],pyre:[1,0xb8682a,'slick',0x3a8aff],warp:[3,0x6a6a7a,'buzz',0x8a5aff,'shades'],hex:[2,0x2a8a4a,'twin',0x5aff8a],
  scathe:[3,0xc4202a,'mohawk',0xff4a1a,'earring'],solstice:[0,0x1a2a5a,'short',0x9ae8ff],piston:[2,0xd86a2a,'mohawk',0xffb03a,'glasses'],snare:[1,0xb89a5a,'bun',0x5a5a62,'stubble'],
  marble:[1,0x14141a,'slick',0x9ae8ff,'beard'],legion:[2,0xd8822a,'curly',0x8a8e9a],recoil:[0,0xe8e8f2,'short',0xff3a96,'earring'],crimson:[1,0x14060a,'pony',0xff1a3a],
  sawback:[3,0x5a3a1a,'buzz',0x7acc5a,'stubble'],resect:[0,0xf0ece4,'pony',0xd84a5a],cushion:[3,0x2a1a10,'afro',0xffd23f,'beard'],corrosa:[2,0x8a3ad8,'curly',0xb8ff3a,'freckles'],verdict:[1,0x1a1a1e,'messy',0xff3a3a,'stubble']};
function humanLook(h){const id=h.as&&h.as.look&&HUMAN[h.as.look]?h.as.look:h.id;if(HUMAN[id])return HUMAN[id];let k=0;for(const c of (h.name||'x'))k=(k*31+c.charCodeAt(0))|0;k=Math.abs(k);
  return [k%6,[0x14141a,0x3a2414,0xa8401a,0xe8c84a,h.accent][k%5],['short','spiky','pony','curly','slick'][k%5],h.accent];}
function geoKind(m){const g=m.geometry;if(!g)return '';const p=g.parameters||{};const t=g.type;
  if(t==='SphereGeometry'&&((p.phiLength!=null&&p.phiLength<6.2)||(p.thetaLength!=null&&p.thetaLength<3.1)))return 'part';return t;}
function humanize(h,X){const L=humanLook(h),skinC=SKIN[L[0]],skin=new THREE.MeshStandardMaterial({color:skinC,roughness:.65}),hairM=new THREE.MeshStandardMaterial({color:L[1],roughness:.55});
  const {M,head,neck,lS,rS,lE,rE,lK,rK,lF,rF,main,suit,trim}=X;
  // helmet and everything on it comes off; a face goes on
  head.children.slice().forEach(c=>{c.visible=false;});
  neck.children.forEach(c=>{if(c.isMesh&&c.geometry&&c.geometry.type==='CylinderGeometry'&&c.position.y<.05)c.material=skin;else if(c!==head)c.visible=false;});
  const F=new THREE.Group();F.position.y=.12;head.add(F);
  const sk=M(new THREE.SphereGeometry(.15,32,24),skin);sk.scale.set(.95,1.12,1.02);F.add(sk);
  const jaw=M(new THREE.SphereGeometry(.11,24,16),skin);jaw.position.set(0,-.07,.03);jaw.scale.set(1,.9,1);F.add(jaw);
  [-1,1].forEach(s=>{const ear=M(new THREE.SphereGeometry(.035,12,10),skin);ear.position.set(s*.142,0,0);ear.scale.set(.5,1,.8);F.add(ear);
    const ew=M(new THREE.SphereGeometry(.026,14,10),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3}));ew.position.set(s*.052,.02,.128);ew.scale.set(1.2,.8,.5);F.add(ew);
    const ir=M(new THREE.SphereGeometry(.014,12,10),new THREE.MeshStandardMaterial({color:L[3],emissive:L[3],emissiveIntensity:.35,roughness:.2}));ir.position.set(s*.052,.02,.141);F.add(ir);
    const pu=M(new THREE.SphereGeometry(.006,8,6),new THREE.MeshBasicMaterial({color:0x050505}));pu.position.set(s*.052,.02,.153);F.add(pu);
    const br=M(new THREE.BoxGeometry(.05,.009,.012),hairM);br.position.set(s*.054,.06,.135);br.rotation.z=s*-.12;F.add(br);});
  const nose=M(new THREE.ConeGeometry(.018,.05,8),skin);nose.rotation.x=Math.PI/2+.25;nose.position.set(0,-.02,.155);F.add(nose);
  const mouth=M(new THREE.BoxGeometry(.05,.008,.01),new THREE.MeshStandardMaterial({color:0x8a3a3a,roughness:.6}));mouth.position.set(0,-.075,.135);F.add(mouth);
  // hair
  const cap=(sc,y,theta)=>{const c=M(new THREE.SphereGeometry(.158,28,18,0,Math.PI*2,0,Math.PI*(theta||.5)),hairM);c.position.y=y||.01;c.scale.set(sc[0],sc[1],sc[2]);F.add(c);return c;};
  const st=L[2];
  if(st==='short')cap([1,1.12,1.06],.02,.48);
  if(st==='buzz')cap([.97,1.1,1.03],.01,.45);
  if(st==='spiky'||st==='messy'){cap([1,1.12,1.06],.02,.48);for(let k=0;k<(st==='spiky'?10:14);k++){const a=k/(st==='spiky'?10:14)*6.283,c=M(new THREE.ConeGeometry(st==='spiky'?.04:.035,st==='spiky'?.15:.1,6),hairM);
      c.position.set(Math.sin(a)*.1,.15,Math.cos(a)*.09-.01);c.rotation.set(Math.cos(a)*.9-.2,0,-Math.sin(a)*.9);F.add(c);}}
  if(st==='long'){cap([1.04,1.14,1.08],.02,.52);const b=M(new THREE.BoxGeometry(.28,.36,.08),hairM);b.position.set(0,-.12,-.12);F.add(b);[-1,1].forEach(s=>{const sd=M(new THREE.BoxGeometry(.05,.26,.12),hairM);sd.position.set(s*.14,-.07,-.03);F.add(sd);});}
  if(st==='pony'){cap([1.02,1.12,1.07],.02,.5);const t=M(new THREE.CylinderGeometry(.045,.015,.36,10),hairM);t.position.set(0,.02,-.2);t.rotation.x=.55;F.add(t);const tie=M(new THREE.TorusGeometry(.035,.01,6,14),new THREE.MeshStandardMaterial({color:h.accent}));tie.position.set(0,.1,-.16);tie.rotation.x=.55+Math.PI/2;F.add(tie);}
  if(st==='bun'){cap([1.02,1.12,1.07],.02,.5);const b=M(new THREE.SphereGeometry(.065,16,12),hairM);b.position.set(0,.16,-.08);F.add(b);}
  if(st==='twin'){cap([1.02,1.12,1.07],.02,.5);[-1,1].forEach(s=>{const t=M(new THREE.CylinderGeometry(.04,.012,.34,10),hairM);t.position.set(s*.16,-.08,-.06);t.rotation.z=s*.25;F.add(t);});}
  if(st==='mohawk'){cap([.96,1.06,1.02],.0,.42);for(let k=0;k<6;k++){const c=M(new THREE.BoxGeometry(.035,.1,.05),hairM);c.position.set(0,.17-Math.abs(k-2.5)*.012,.09-k*.04);F.add(c);}}
  if(st==='curly'){cap([1.04,1.12,1.07],.02,.5);for(let k=0;k<16;k++){const a=k/16*6.283,b=M(new THREE.SphereGeometry(.04,10,8),hairM);b.position.set(Math.sin(a)*.12,.11+Math.cos(a*2)*.03,Math.cos(a)*.11-.01);F.add(b);}}
  if(st==='slick'){const c=cap([1.03,1.1,1.12],.02,.5);c.rotation.x=-.12;const b=M(new THREE.BoxGeometry(.24,.06,.1),hairM);b.position.set(0,.15,-.1);b.rotation.x=-.4;F.add(b);}
  if(st==='afro'){const a=M(new THREE.SphereGeometry(.22,20,16),hairM);a.position.set(0,.09,-.03);a.scale.set(1,.9,.95);F.add(a);}
  const ex=L[4];
  if(ex==='beard'||ex==='stubble'){const bd=M(new THREE.SphereGeometry(.112,20,14,0,Math.PI*2,Math.PI*.5,Math.PI*.5),ex==='beard'?hairM:new THREE.MeshStandardMaterial({color:L[1],roughness:.9,transparent:true,opacity:.45}));bd.position.set(0,-.06,.035);bd.scale.set(1.02,ex==='beard'?1.1:.95,1.04);F.add(bd);
    if(ex==='beard')mouth.position.z=.15;}
  if(ex==='glasses'||ex==='shades'){const fr=new THREE.MeshStandardMaterial({color:0x14141a,metalness:.6,roughness:.3});[-1,1].forEach(s=>{const l=M(new THREE.TorusGeometry(.025,.004,6,16),fr);l.position.set(s*.052,.02,.148);F.add(l);
      if(ex==='shades'){const g=M(new THREE.CircleGeometry(.025,16),new THREE.MeshStandardMaterial({color:0x0a0a10,metalness:.8,roughness:.1}));g.position.set(s*.052,.02,.149);F.add(g);}});const br=M(new THREE.BoxGeometry(.035,.004,.004),fr);br.position.set(0,.022,.15);F.add(br);}
  if(ex==='freckles')for(let k=0;k<8;k++){const d=M(new THREE.SphereGeometry(.004,6,4),new THREE.MeshBasicMaterial({color:0x8a4a2a}));const s=k<4?-1:1;d.position.set(s*(.05+(k%4)*.012),-.02+(k%2)*.008,.142);F.add(d);}
  if(ex==='earring'){const e=M(new THREE.TorusGeometry(.012,.003,6,12),new THREE.MeshStandardMaterial({color:0xd8b060,metalness:1,roughness:.2}));e.position.set(.145,-.035,0);F.add(e);}
  // armor bits come off: shoulder pads, gauntlets, glowing rings, boot plates, spikes
  const strip=(o,keepFn)=>o.children.forEach(c=>{if(c.isMesh){const k=geoKind(c);if(k==='part'||k==='TorusGeometry'||k==='ConeGeometry'||k==='OctahedronGeometry'||(k==='CylinderGeometry'&&!(keepFn&&keepFn(c)))||k==='PlaneGeometry')c.visible=false;}});
  [lS,rS].forEach(o=>strip(o));[lE,rE].forEach(o=>strip(o));[lK,rK].forEach(o=>strip(o));
  // hands are skin now
  [lF,rF].forEach(f=>f&&f.traverse(c=>{if(c.isMesh&&c.visible)c.material=skin;}));
  // the suit becomes cloth: a jacket/top in their main colour, dark trousers
  [main,suit,trim].forEach(m=>{if(!m)return;m.metalness=0;m.roughness=.9;if('clearcoat' in m)m.clearcoat=0;if(m.envMapIntensity!=null)m.envMapIntensity=.2;});
  if(main){main.color.setHex(h.mainCol!=null?h.mainCol:h.color);main.color.lerp(new THREE.Color(h.color),.35);}}
const _mhaPartsH=mhaParts;
mhaParts=function(h,X){const out=_mhaPartsH(h,X);if(h.human){try{humanize(h,X);}catch(e){console.warn('humanize',h.id,e);}if(out&&out.orbiters){out.orbiters.forEach(o=>o.visible=false);}}return out;};
$('armorBtn').onclick=()=>{AU.init();AU.ui();ARMOR_OFF=!ARMOR_OFF;store.set('surge.armor',ARMOR_OFF?'off':'on');previewHero(PV.idx);};
