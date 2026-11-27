/* NEON SIREN — a strip club / nightclub on the block across from the station (an original venue, non-explicit:
   the performers dance in full stage costumes). This file builds the building itself (loaded before world.js, which
   calls clubBuilding() for its block, like mallBuilding()); the people, the lights show and the music are in
   js/features/club.js.
   Inside: a T-shaped stage (main stage with two poles and a mirror wall, a runway, a round podium with a third pole),
   club chairs along the runway, a long bar with a lit back bar, booths along the south wall, a DJ booth with speaker
   stacks, a cashier by the door. Outside: a big neon sign, a marquee with bulbs over the door, a red carpet and
   velvet ropes, and a blade sign on the corner. Everything has colliders: the stage is a real platform, the bar is a
   counter you can vault, the poles are solid. */
const CLUBS=[[24,24]];
const CLUB_INFO=[];
const CLUB_MAT=(()=>{const neon=(c,k)=>{const m=new THREE.MeshBasicMaterial({color:c});m.color.multiplyScalar(k);m.userData.noShadow=true;return m;};
  const cvT=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;};
  const rep=(t,x,y)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;if(x)t.repeat.set(x,y);return t;};
  const F="'Bebas Neue', Impact, 'Arial Black', sans-serif";
  // floor: glossy black and plum tiles
  const floorT=rep(cvT(256,256,(g)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#140a1c':'#24123a';g.fillRect(x*64,y*64,64,64);
      const gr=g.createLinearGradient(x*64,y*64,x*64+64,y*64+64);gr.addColorStop(0,'rgba(255,255,255,.05)');gr.addColorStop(1,'rgba(0,0,0,.1)');g.fillStyle=gr;g.fillRect(x*64,y*64,64,64);}
    g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,256);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(256,i*64);g.stroke();}}));
  // interior walls: deep violet panels with a soft vertical sheen
  const wallT=rep(cvT(256,256,(g)=>{g.fillStyle='#1c0f2a';g.fillRect(0,0,256,256);for(let x=0;x<256;x+=32){const gr=g.createLinearGradient(x,0,x+32,0);gr.addColorStop(0,'rgba(255,255,255,.02)');gr.addColorStop(.5,'rgba(255,120,220,.07)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(x,0,32,256);}}));
  // facade: charcoal ribbed panels
  const facT=rep(cvT(256,256,(g)=>{g.fillStyle='#17151c';g.fillRect(0,0,256,256);for(let x=0;x<256;x+=16){g.fillStyle=x%32?'#1d1a23':'#121016';g.fillRect(x,0,14,256);}for(let y=0;y<256;y+=64){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,y,256,3);}}));
  // ceiling: black with tiny star lights
  const ceilT=rep(cvT(256,256,(g)=>{g.fillStyle='#07050c';g.fillRect(0,0,256,256);for(let i=0;i<90;i++){const x=Math.random()*256,y=Math.random()*256,r=Math.random()*1.3+.4;g.fillStyle=Math.random()<.3?'#ff9ae8':'#ffffff';g.beginPath();g.arc(x,y,r,0,7);g.fill();}}));
  // sequin curtain behind the main stage
  const seqT=rep(cvT(128,128,(g)=>{g.fillStyle='#2a0a30';g.fillRect(0,0,128,128);for(let y=0;y<128;y+=4)for(let x=(y/4)%2*2;x<128;x+=4){const v=Math.random();g.fillStyle=v<.12?'#ffffff':v<.4?'#ff4ad8':v<.6?'#b04aff':'#5a1a6a';g.fillRect(x,y,3,3);}}));
  // the big sign
  const signT=cvT(1024,256,(g,w,h)=>{g.fillStyle='#050308';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
    g.shadowColor='#ff3ad0';g.shadowBlur=28;g.strokeStyle='#ff6ae0';g.lineWidth=10;g.font=`900 150px ${F}`;g.strokeText('NEON SIREN',w/2,h/2-10);g.shadowBlur=10;g.fillStyle='#ffe0f8';g.fillText('NEON SIREN',w/2,h/2-10);
    g.shadowColor='#3ae8ff';g.shadowBlur=16;g.fillStyle='#bff8ff';g.font=`700 38px ${F}`;g.fillText('★  GENTLEMEN’S & LADIES’ CLUB  ·  LIVE SHOWS NIGHTLY  ★',w/2,h-34);});
  // vertical blade sign
  const bladeT=cvT(128,512,(g,w,h)=>{g.fillStyle='#050308';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.shadowColor='#3ae8ff';g.shadowBlur=20;g.fillStyle='#c8faff';g.font=`900 92px ${F}`;
    'CLUB'.split('').forEach((c,i)=>g.fillText(c,w/2,70+i*112));});
  // marquee / poster panel
  const postT=cvT(256,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3a0a4a');gr.addColorStop(1,'#0a0418');g.fillStyle=gr;g.fillRect(0,0,w,h);g.textAlign='center';
    g.fillStyle='#ff6ae0';g.font=`900 40px ${F}`;g.fillText('TONIGHT',w/2,60);g.fillStyle='#ffffff';g.font=`900 54px ${F}`;g.fillText('SIRENS',w/2,130);g.fillText('ON STAGE',w/2,188);
    g.fillStyle='#3ae8ff';g.font=`700 26px ${F}`;g.fillText('DJ · BAR · VIP BOOTHS',w/2,250);g.fillStyle='#ffd23f';g.font=`700 24px ${F}`;g.fillText('18+ · ID REQUIRED',w/2,330);
    g.strokeStyle='#ff6ae0';g.lineWidth=4;g.strokeRect(10,10,w-20,h-20);});
  // back bar: rows of lit bottles
  const barT=rep(cvT(512,128,(g,w,h)=>{g.fillStyle='#0c0810';g.fillRect(0,0,w,h);const cols=['#ff9a3a','#5aff8a','#3ae8ff','#ff4ad8','#ffd23f','#c8c8ff','#ff5a5a'];
    for(let r=0;r<2;r++){g.fillStyle='#3a2a1a';g.fillRect(0,58+r*62,w,5);for(let x=6;x<w;x+=13){const c=cols[(x*7+r*3)%cols.length],bh=26+((x*13)%14);g.fillStyle=c;g.globalAlpha=.85;g.fillRect(x,58+r*62-bh,8,bh);g.fillRect(x+2,58+r*62-bh-8,4,8);g.globalAlpha=1;
      g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+1,58+r*62-bh+3,2,bh-6);}}}));
  const lit=(m,k)=>{m.emissive=m.color.clone().multiplyScalar(k);if(m.map){m.emissiveMap=m.map;m.emissive.setScalar(k);}return m;};
  const M={
    floor:lit(new THREE.MeshStandardMaterial({map:floorT,roughness:.18,metalness:.25,envMapIntensity:.9}),.35),
    wall:lit(new THREE.MeshStandardMaterial({map:wallT,roughness:.6}),.42),
    fac:new THREE.MeshStandardMaterial({map:facT,roughness:.5,metalness:.35}),
    ceil:lit(new THREE.MeshStandardMaterial({map:ceilT,roughness:1}),1),
    seq:lit(new THREE.MeshStandardMaterial({map:seqT,roughness:.3,metalness:.6}),.9),
    stage:lit(new THREE.MeshStandardMaterial({color:0x0c0a10,roughness:.08,metalness:.5,envMapIntensity:1.2}),.1),
    chrome:new THREE.MeshStandardMaterial({color:0xf0f0f4,roughness:.08,metalness:1,envMapIntensity:1.6}),
    leather:lit(new THREE.MeshStandardMaterial({color:0x5a0a22,roughness:.4,metalness:.05}),.18),
    wood:lit(new THREE.MeshStandardMaterial({color:0x2a160c,roughness:.3,metalness:.1}),.15),
    mirror:new THREE.MeshStandardMaterial({color:0x40384a,roughness:.04,metalness:1,envMapIntensity:2}),
    carpet:lit(new THREE.MeshStandardMaterial({color:0x7a0a1a,roughness:.95}),.1),
    dark:lit(new THREE.MeshStandardMaterial({color:0x101014,roughness:.5,metalness:.4}),.05),
    glass:new THREE.MeshStandardMaterial({color:0x40205a,roughness:.05,metalness:.2,transparent:true,opacity:.45}),
    roof:new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.9}),
    pink:neon(0xff3ad0,2.2),cyan:neon(0x3ae8ff,2),violet:neon(0x9a4aff,2.2),gold:neon(0xffd23f,2),red:neon(0xff2a3a,1.6),white:neon(0xfff4ff,2),
    sign:new THREE.MeshBasicMaterial({map:signT}),blade:new THREE.MeshBasicMaterial({map:bladeT}),post:new THREE.MeshBasicMaterial({map:postT}),bar:new THREE.MeshBasicMaterial({map:barT})};
  M.sign.color.setScalar(1.6);M.blade.color.setScalar(1.6);M.post.color.setScalar(1.25);M.bar.color.setScalar(1.3);
  [M.sign,M.blade,M.post,M.bar].forEach(m=>m.userData.noShadow=true);
  return M;})();

function clubBuilding(X,Z){const M=CLUB_MAT,W=15,D=12,H=8.5,T=.4;
  const coll=(x0,x1,z0,z1,y0,h,top)=>BLD.push({x0,x1,z0,z1,y0,h,top:!!top});
  const B=(m,ax,bx,az,bz,y0,y1,uv)=>{const x0=Math.min(ax,bx),x1=Math.max(ax,bx),z0=Math.min(az,bz),z1=Math.max(az,bz);mBox(m,x1-x0,y1-y0,z1-z0,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,uv);};
  const cyl=(m,r0,r1,h,x,y,z,seg)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg||16);g.translate(x,y,z);mGeo(m,g);};
  const x0=X-W,x1=X+W,z0=Z-D,z1=Z+D,DH=3.3,dz0=Z-2.2,dz1=Z+2.2;
  // ---- shell: outer skin (facade) + inner skin (violet panels); the west wall has the doorway
  B(M.fac,x0,x1,z0,z0+.2,0,H,-4);B(M.wall,x0+.2,x1-.2,z0+.2,z0+T,0,H-.4,-3);coll(x0,x1,z0,z0+T,0,H);
  B(M.fac,x0,x1,z1-.2,z1,0,H,-4);B(M.wall,x0+.2,x1-.2,z1-T,z1-.2,0,H-.4,-3);coll(x0,x1,z1-T,z1,0,H);
  B(M.fac,x1-.2,x1,z0,z1,0,H,-4);B(M.wall,x1-T,x1-.2,z0+.2,z1-.2,0,H-.4,-3);coll(x1-T,x1,z0,z1,0,H);
  [[z0,dz0],[dz1,z1]].forEach(([a,b])=>{B(M.fac,x0,x0+.2,a,b,0,H,-4);B(M.wall,x0+.2,x0+T,a+(a===z0?.2:0),b-(b===z1?.2:0),0,H-.4,-3);coll(x0,x0+T,a,b,0,H);});
  B(M.fac,x0,x0+.2,dz0,dz1,DH,H,-4);B(M.wall,x0+.2,x0+T,dz0,dz1,DH,H-.4,-3);coll(x0,x0+T,dz0,dz1,DH,H);
  // roof (walkable) and the ceiling seen from inside
  B(M.roof,x0,x1,z0,z1,H-.4,H,-6);coll(x0,x1,z0,z1,H-.4,H,true);
  B(M.ceil,x0+T,x1-T,z0+T,z1-T,H-.46,H-.4,-6);
  // floor
  B(M.floor,x0+T,x1-T,z0+T,z1-T,0,.02,-4);
  // ---- outside: neon trim, sign, marquee, carpet, ropes, blade sign, rooftop
  B(M.pink,x0-.06,x1+.06,z0-.06,z0,H-.55,H-.45);B(M.pink,x0-.06,x1+.06,z1,z1+.06,H-.55,H-.45);B(M.pink,x1,x1+.06,z0,z1,H-.55,H-.45);B(M.pink,x0-.06,x0,z0,z1,H-.55,H-.45);
  B(M.violet,x0-.05,x0,z0+.5,dz0-.6,.5,.56);B(M.violet,x0-.05,x0,dz1+.6,z1-.5,.5,.56);
  mBox(M.dark,.3,2.6,9.6,x0-.18,5.55,Z);mQuad(M.sign,9.2,2.3,x0-.34,5.55,Z,-Math.PI/2);
  B(M.cyan,x0-.36,x0-.3,Z-4.85,Z+4.85,6.86,6.92);B(M.cyan,x0-.36,x0-.3,Z-4.85,Z+4.85,4.18,4.24);
  // marquee over the door: a slab with rows of bulbs underneath, on chrome posts
  B(M.dark,x0-2.8,x0,dz0-.9,dz1+.9,DH+.15,DH+.45);B(M.gold,x0-2.82,x0,dz0-.92,dz0-.86,DH+.2,DH+.4);B(M.gold,x0-2.82,x0,dz1+.86,dz1+.92,DH+.2,DH+.4);B(M.gold,x0-2.86,x0-2.8,dz0-.9,dz1+.9,DH+.2,DH+.4);
  for(let a=x0-2.5;a<x0;a+=.5)for(let b=dz0-.6;b<=dz1+.61;b+=.6){const g=new THREE.SphereGeometry(.06,8,6);g.translate(a,DH+.12,b);mGeo(M.white,g);}
  [[x0-2.65,dz0-.75],[x0-2.65,dz1+.75]].forEach(([a,b])=>{cyl(M.chrome,.06,.06,DH+.15,a,(DH+.15)/2,b,10);solids.push({x:a,z:b,r:.25});});
  // doors: open glass doors folded back against the jambs, a pink frame
  B(M.pink,x0-.04,x0+.02,dz0-.08,dz0,0,DH);B(M.pink,x0-.04,x0+.02,dz1,dz1+.08,0,DH);B(M.pink,x0-.04,x0+.02,dz0,dz1,DH-.08,DH);
  B(M.glass,x0+.4,x0+.46,dz0,dz0+1.1,.02,DH-.1);B(M.glass,x0+.4,x0+.46,dz1-1.1,dz1,.02,DH-.1);
  // red carpet + velvet ropes on chrome stanchions
  B(M.carpet,x0-3.4,x0+3,Z-1.3,Z+1.3,.005,.03,-2);
  [-1.75,1.75].forEach(o=>{for(let k=0;k<3;k++){const a=x0-3+k*1.2;cyl(M.chrome,.035,.05,.95,a,.475,Z+o,10);cyl(M.chrome,.06,.06,.08,a,.97,Z+o,10);if(k<2){const r=new THREE.CylinderGeometry(.025,.025,1.2,6);r.rotateZ(Math.PI/2);r.translate(a+.6,.84,Z+o);mGeo(M.red,r);}}});
  // posters either side of the door
  [[dz0-2.4,0],[dz1+2.4,0]].forEach(([b])=>{mBox(M.dark,.12,2.5,1.75,x0-.07,1.75,b);mQuad(M.post,1.6,2.4,x0-.14,1.75,b,-Math.PI/2);B(M.pink,x0-.16,x0-.12,b-.86,b+.86,.48,.52);B(M.pink,x0-.16,x0-.12,b-.86,b+.86,2.98,3.02);});
  // blade sign on the north-west corner
  mBox(M.dark,.3,4.2,1.15,x0-.75,5.4,z1-.8);[-1,1].forEach(s=>mQuad(M.blade,1,3.9,x0-.75+s*.16,5.4,z1-.8,s<0?-Math.PI/2:Math.PI/2));B(M.cyan,x0-.95,x0-.55,z1-1.4,z1-.2,7.5,7.56);B(M.cyan,x0-.95,x0-.55,z1-1.4,z1-.2,3.24,3.3);
  // rooftop: AC units and a neon star
  [[X+6,Z-6],[X+9,Z+5],[X-6,Z+7]].forEach(([a,b])=>{mBox(M.dark,2.2,1.3,1.6,a,H+.65,b);coll(a-1.1,a+1.1,b-.8,b+.8,H,H+1.3,true);});
  {const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.55:1.3,a=i/10*Math.PI*2+Math.PI/2;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const g=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(x0+1.2,H+2.1,Z);mGeo(M.pink,g);mBox(M.dark,.12,1.6,.12,x0+1.2,H+.8,Z);}
  // ---- inside
  // main stage (east), mirror wall + sequin curtain behind it, LED edges, steps
  const SY=.9,sx0=X+8,sz0=Z-6,sz1=Z+6;
  B(M.stage,sx0,x1-T,sz0,sz1,0,SY);coll(sx0,x1-T,sz0,sz1,0,SY,true);
  B(M.pink,sx0-.04,sx0,sz0,sz1,SY-.08,SY-.02);B(M.pink,sx0,x1-T,sz0-.04,sz0,SY-.08,SY-.02);B(M.pink,sx0,x1-T,sz1,sz1+.04,SY-.08,SY-.02);
  mQuad(M.seq,10,5.6,x1-T-.02,SY+2.8,Z,-Math.PI/2,[0,0,4,2.2]);
  [[Z-6,Z-5.02],[Z+5.02,Z+6]].forEach(([a,b])=>B(M.mirror,x1-T-.1,x1-T-.02,a,b,SY,SY+5.6));
  B(M.violet,x1-T-.12,x1-T-.06,sz0-.1,sz1+.1,SY+5.62,SY+5.7);B(M.violet,x1-T-.12,x1-T-.06,sz0-.1,sz0-.04,SY,SY+5.7);B(M.violet,x1-T-.12,x1-T-.06,sz1+.04,sz1+.1,SY,SY+5.7);
  [[sz0-1.1,sz0],[sz1,sz1+1.1]].forEach(([a,b])=>{B(M.stage,sx0+.3,sx0+1.8,a,b,0,SY*.5);coll(sx0+.3,sx0+1.8,a,b,0,SY*.5,true);B(M.cyan,sx0+.3,sx0+1.8,a,b,SY*.5,SY*.5+.01);});
  // runway with cyan LED edges, and the round podium at its end
  const rz0=Z-1.3,rz1=Z+1.3,rx0=X-2;B(M.stage,rx0,sx0,rz0,rz1,0,SY);coll(rx0,sx0,rz0,rz1,0,SY,true);
  B(M.cyan,rx0,sx0,rz0-.04,rz0,SY-.08,SY-.02);B(M.cyan,rx0,sx0,rz1,rz1+.04,SY-.08,SY-.02);
  for(let a=rx0+.6;a<sx0;a+=1.2){B(M.white,a,a+.4,Z-.05,Z+.05,SY,SY+.008);}
  const px=X-2.6;cyl(M.stage,2.1,2.1,SY,px,SY/2,Z,36);{const r=new THREE.TorusGeometry(2.1,.035,6,48);r.rotateX(Math.PI/2);r.translate(px,SY-.05,Z);mGeo(M.pink,r);}
  coll(px-1.85,px+1.85,Z-1.05,Z+1.05,0,SY,true);coll(px-1.05,px+1.05,Z-1.85,Z+1.85,0,SY,true);coll(px-1.5,px+1.5,Z-1.5,Z+1.5,0,SY,true);
  // poles: chrome, floor-to-ceiling, with flanges
  const poles=[[px,Z],[X+11,Z-3.2],[X+11,Z+3.2]];
  poles.forEach(([a,b])=>{cyl(M.chrome,.045,.045,H-.4-SY,a,SY+(H-.4-SY)/2,b,14);cyl(M.chrome,.14,.16,.05,a,SY+.025,b,20);cyl(M.chrome,.12,.12,.05,a,H-.45,b,20);coll(a-.07,a+.07,b-.07,b+.07,SY,H-.4);});
  // club chairs along the runway (people sit here)
  const seats=[];for(let a=X-.6;a<sx0-.4;a+=2.1){[[rz0-1.5,0],[rz1+1.5,Math.PI]].forEach(([b,f])=>{const s=b<Z?-1:1;B(M.leather,a-.38,a+.38,b-.32,b+.32,.38,.5);B(M.leather,a-.38,a+.38,b+s*.24,b+s*.36,.5,1.05);B(M.dark,a-.3,a+.3,b-.25,b+.25,0,.38);seats.push([a,b,f,.47]);});}
  // around the podium
  [[-1,0],[0,1],[0,-1]].forEach(([ox,oz])=>{const a=px+ox*3.3,b=Z+oz*3.3,f=Math.atan2(px-a,Z-b);
    const g=new THREE.BoxGeometry(.76,.12,.64);g.rotateY(f);g.translate(a,.44,b);mGeo(M.leather,g);const bk=new THREE.BoxGeometry(.76,.55,.12);bk.translate(0,0,-.3);bk.rotateY(f);bk.translate(a,.78,b);mGeo(M.leather,bk);
    const lg=new THREE.BoxGeometry(.6,.38,.5);lg.rotateY(f);lg.translate(a,.19,b);mGeo(M.dark,lg);seats.push([a,b,f,.47]);});
  // bar: counter (wood top, glowing front), back bar with bottles, mirror, stools
  const bx0=X-10,bx1=X+4,bz=Z+8.4;B(M.dark,bx0,bx1,bz,bz+.9,0,1.05);B(M.wood,bx0-.06,bx1+.06,bz-.08,bz+.95,1.05,1.12);coll(bx0,bx1,bz,bz+.95,0,1.12);
  B(M.violet,bx0,bx1,bz-.04,bz,.12,.18);B(M.pink,bx0,bx1,bz-.04,bz,.98,1.02);
  B(M.wood,bx0,bx1,z1-T-.5,z1-T,0,.9);coll(bx0,bx1,z1-T-.5,z1-T,0,.9);mQuad(M.bar,bx1-bx0,1.8,(bx0+bx1)/2,1.95,z1-T-.02,Math.PI,[0,0,2.2,1]);
  B(M.mirror,bx0,bx1,z1-T-.04,z1-T-.01,2.85,3.6);B(M.gold,bx0,bx1,z1-T-.06,z1-T-.02,2.84,2.88);
  const stools=[];for(let a=bx0+.8;a<bx1-.4;a+=1.55){cyl(M.chrome,.04,.08,.74,a,.37,bz-.55,10);cyl(M.leather,.22,.2,.1,a,.78,bz-.55,16);stools.push([a,bz-.55,Math.PI*0,.8]);}
  // booths along the south wall: leather benches + backs, little round tables
  const booths=[];for(let a=X-11;a<X+6;a+=5){B(M.leather,a-1.9,a+1.9,z0+T,z0+T+.8,0,.46);coll(a-1.9,a+1.9,z0+T,z0+T+.8,0,.46,true);B(M.leather,a-1.9,a+1.9,z0+T,z0+T+.25,.46,1.25);
    B(M.pink,a-1.9,a+1.9,z0+T+.01,z0+T+.03,1.6,1.66);cyl(M.chrome,.05,.12,.68,a,.34,z0+T+1.7,10);cyl(M.wood,.5,.5,.05,a,.7,z0+T+1.7,24);
    booths.push([a-1,z0+T+.5,0,.46],[a+1,z0+T+.5,0,.46]);}
  // DJ booth (north-east): raised deck, desk with decks, speaker stacks
  const dx=X+11.4,dz=Z+9.6;B(M.stage,X+8.6,x1-T,Z+8.2,z1-T,0,.35);coll(X+8.6,x1-T,Z+8.2,z1-T,0,.35,true);
  B(M.dark,X+9.2,X+13.8,Z+8.25,Z+8.95,.35,1.4);coll(X+9.2,X+13.8,Z+8.25,Z+8.95,.35,1.4);B(M.cyan,X+9.2,X+13.8,Z+8.2,Z+8.25,.5,1.3);
  [-1.2,1.2].forEach(o=>cyl(M.dark,.2,.2,.04,dx+o,1.42,Z+8.6,20));B(M.violet,dx-.5,dx+.5,Z+8.4,Z+8.8,1.4,1.43);
  [[X+8.4,Z+7.6],[x1-T-.5,Z+7.6]].forEach(([a,b])=>{B(M.dark,a-.45,a+.45,b-.4,b+.4,0,2.3);coll(a-.45,a+.45,b-.4,b+.4,0,2.3);
    [[.6,.28],[1.45,.2],[1.95,.1]].forEach(([y,r])=>{const g=new THREE.CylinderGeometry(r,r,.03,20);g.rotateX(Math.PI/2);g.translate(a,y,b-.41);mGeo(M.violet,g);});});
  // cashier booth by the door
  B(M.dark,x0+T,x0+2.6,Z+3.2,Z+5.6,0,1.1);coll(x0+T,x0+2.6,Z+3.2,Z+5.6,0,1.1);B(M.glass,x0+2.55,x0+2.6,Z+3.2,Z+5.6,1.1,2.4);B(M.pink,x0+T,x0+2.6,Z+3.15,Z+3.2,2.4,2.46);
  // neon wall art: lines, a star and a wave over the booths
  B(M.violet,x0+T,x1-T,z0+T,z0+T+.04,3.4,3.46);B(M.cyan,x0+T,x0+T+.04,z0+T,z1-T,3.4,3.46);
  {const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.35:.85,a=i/10*Math.PI*2+Math.PI/2;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const g=new THREE.ExtrudeGeometry(s,{depth:.05,bevelEnabled:false});g.translate(X-3.5,4.9,z0+T+.02);mGeo(M.pink,g);
    const pts=[];for(let i=0;i<=40;i++)pts.push(new V3(X+.5+i*.2,4.6+Math.sin(i*.45)*.35,z0+T+.05));const tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,.035,6,false);mGeo(M.cyan,tg);}
  // truss over the stage for the moving lights
  B(M.dark,X-4,x1-T,Z-.08,Z+.08,H-1.3,H-1.1);B(M.dark,X+7.6,X+7.76,z0+T,z1-T,H-1.3,H-1.1);
  // minimap footprint
  const info={x:X,z:Z,W,D,H,x0,x1,z0,z1,SY,px,poles,seats,stools,booths,dj:[dx,Z+10.6,Math.PI],door:[x0,Z],bar:[bx0,bx1,bz+1.55],
    stage:[sx0+.4,x1-T-.4,sz0+.4,sz1-.4],runway:[rx0,sx0,rz0,rz1],
    walk:[[x0+1.2,X-4.8,z0+2.6,Z+7.6,0],[X-4.8,sx0-.4,z0+2.8,rz0-2.1,0],[X-4.8,sx0-.4,rz1+2.1,Z+7.6,0]]};
  CLUB_INFO.push(info);}
