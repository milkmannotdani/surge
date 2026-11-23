/* The city map: roads, buildings, interiors, colliders (floorAt / pushOutBld), street props */
/* ================= WORLD (seeded, identical for all players) ================= */
const PRE_WORLD=new Set(scene.children);
const world=new THREE.Group();scene.add(world);
const ROADS=[-192,-144,-96,-48,0,48,96,144,192], RW=14, BLOCKS=[-168,-120,-72,-24,24,72,120,168], INNER=ROADS.slice(1,-1);
const MAPH=BOUND+10;   // half-size of the minimap
const BLD=[];       // colliders {x0,x1,z0,z1,y0,h}: boxes from height y0 (default 0) up to h
const BLDG=[];      // whole buildings, for street dressing: {x0,x1,z0,z1,h,doors:[{nx,nz,x,z}]}
// spatial grid so collision checks only look at nearby boxes
const BG_CELL=16;let BG=null,BG_N=-1,BG_F=null;
function bgBuild(){BG=new Map();BG_N=BLD.length;BG_F=BLD[0];for(const b of BLD){const c0=Math.floor(b.x0/BG_CELL),c1=Math.floor(b.x1/BG_CELL),r0=Math.floor(b.z0/BG_CELL),r1=Math.floor(b.z1/BG_CELL);
  for(let i=c0;i<=c1;i++)for(let j=r0;j<=r1;j++){const k=i*1000+j;let L=BG.get(k);if(!L)BG.set(k,L=[]);L.push(b);}}}
const BG_EMPTY=[];
// moving colliders (the train) live in DYNB; they're added to lookups that fall inside the DYNR box
const DYNB=[],DYNR={x0:0,x1:0,z0:0,z1:0};
function bgNear(x,z){if(BG_N!==BLD.length||BG_F!==BLD[0])bgBuild();const L=BG.get(Math.floor(x/BG_CELL)*1000+Math.floor(z/BG_CELL))||BG_EMPTY;
  if(!DYNB.length||x<DYNR.x0||x>DYNR.x1||z<DYNR.z0||z>DYNR.z1)return L;return L.concat(DYNB);}
function bgNearPad(x,z,pad,cb){if(pad<=1){for(const b of bgNear(x,z))if(cb(b))return true;return false;}
  const seen=new Set();for(const dx of [-pad,0,pad])for(const dz of [-pad,0,pad])for(const b of bgNear(x+dx,z+dz)){if(seen.has(b))continue;seen.add(b);if(cb(b))return true;}return false;}
const solids=[];    // round colliders {x,z,r}
// with no height given this asks "is this spot on the ground blocked?" (walls block, the open floor inside a building doesn't)
function insideBld(x,z,pad,y){pad=pad||0;if(y===undefined)y=.5;let hit=null;
  bgNearPad(x,z,pad+.6,b=>{if(x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad&&y<b.h&&y>=(b.y0||0)){hit=b;return true;}return false;});return hit;}
function bgList(x,z,r){const out=[],seen=new Set();for(const dx of [-r-.6,0,r+.6])for(const dz of [-r-.6,0,r+.6])for(const b of bgNear(x+dx,z+dz)){if(!seen.has(b)){seen.add(b);out.push(b);}}return out;}
// highest walkable top (roof) under x,z that is at or below y; 0 is the street
function floorAt(x,z,y){let g=0;for(const b of bgNear(x,z)){if(b.h>g&&b.h<=y&&x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&b.top)g=b.h;}return g;}
function pushOutBld(p,r,tall){tall=tall||1.7;let hit=null;for(const b of bgList(p.x,p.z,r)){if(p.y>=b.h||p.y+tall<=(b.y0||0))continue;
  if(b.top&&tall>1&&b.h-p.y<=.55&&p.x>b.x0-r&&p.x<b.x1+r&&p.z>b.z0-r&&p.z<b.z1+r&&!insideBld(p.x,p.z,r*.5,b.h+.9)){p.y=b.h;continue;}const x0=b.x0-r,x1=b.x1+r,z0=b.z0-r,z1=b.z1+r;
  if(p.y<(b.y0||0)&&p.x>b.x0&&p.x<b.x1&&p.z>b.z0&&p.z<b.z1){p.y=b.y0-tall;if(!hit)hit={b,ceil:true};continue;}
  if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1){const dl=p.x-x0,dr=x1-p.x,dn=p.z-z0,df=z1-p.z,m=Math.min(dl,dr,dn,df);
    if(m===dl)p.x=x0;else if(m===dr)p.x=x1;else if(m===dn)p.z=z0;else p.z=z1;hit={b,ax:(m===dl||m===dr)?'x':'z',s:(m===dl||m===dn)?-1:1};}}return hit;}
function rayBld(from,to,steps){const d=TMP3.subVectors(to,from);for(let i=1;i<=steps;i++){const k=i/steps;const x=from.x+d.x*k,y=from.y+d.y*k,z=from.z+d.z*k;if(insideBld(x,z,.3,y))return (i-1)/steps;
  for(const s of solids)if(s.tree){const dx=x-s.x,dy=y-3.9,dz=z-s.z;if(dx*dx+dy*dy*1.4+dz*dz<6.2)return (i-1)/steps;}}return 1;}

function concreteTex(){const [c,g]=cv(512,512);g.fillStyle='#5a5c61';g.fillRect(0,0,512,512);
  for(let i=0;i<6000;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.04)`;g.fillRect(Math.random()*512,Math.random()*512,4,4);}
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=3;for(let i=0;i<=512;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
  for(let i=0;i<8;i++){const x=Math.random()*512,y=Math.random()*512,r=rand(20,60);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,.16)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  const t=tex(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(420/8,420/8);
  const [hc,hg]=cv(256,256);hg.fillStyle='#808080';hg.fillRect(0,0,256,256);for(let i=0;i<5000;i++){const v=110+Math.random()*40|0;hg.fillStyle=`rgb(${v},${v},${v})`;hg.fillRect(Math.random()*256,Math.random()*256,2,2);}
  hg.fillStyle='#202020';for(let i=0;i<=256;i+=64){hg.fillRect(i-1,0,3,256);hg.fillRect(0,i-1,256,3);}
  const n=normalFromHeight(hc,2.2);n.repeat.copy(t.repeat);t.userData={normal:n};return t;}
function asphalt(g,S){g.fillStyle='#27292d';g.fillRect(0,0,S,S);for(let i=0;i<14000;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;g.fillRect(Math.random()*S,Math.random()*S,2,2);}
  g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=2;for(let i=0;i<6;i++){let x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=rand(-30,30);y+=rand(-30,30);g.lineTo(x,y);}g.stroke();}}
function roadTex(){const S=512,[c,g]=cv(S,S),PX=S/14;asphalt(g,S);
  g.fillStyle='#8b8d90';g.fillRect(0,0,S,8);g.fillRect(0,S-8,S,8);
  g.fillStyle='rgba(235,235,235,.85)';g.fillRect(0,.7*PX,S,5);g.fillRect(0,S-.7*PX-5,S,5);
  g.fillStyle='#e6b72e';g.fillRect(0,S/2-6,S*.45,4);g.fillRect(0,S/2+2,S*.45,4);
  const t=tex(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  // wet patches: low roughness puddles that mirror the sky
  const [rc,rg]=cv(256,256);rg.fillStyle='#d8d8d8';rg.fillRect(0,0,256,256);
  for(let i=0;i<9;i++){const x=Math.random()*256,y=40+Math.random()*176,r=rand(10,34);const gr=rg.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'#141414');gr.addColorStop(.7,'#3a3a3a');gr.addColorStop(1,'rgba(216,216,216,0)');rg.fillStyle=gr;rg.beginPath();rg.ellipse(x,y,r*1.6,r,0,0,7);rg.fill();}
  const rough=new THREE.CanvasTexture(rc);rough.wrapS=rough.wrapT=THREE.RepeatWrapping;
  const [hc,hg]=cv(256,256);hg.fillStyle='#808080';hg.fillRect(0,0,256,256);for(let i=0;i<14000;i++){const v=90+Math.random()*80|0;hg.fillStyle=`rgb(${v},${v},${v})`;hg.fillRect(Math.random()*256,Math.random()*256,1.5,1.5);}
  t.userData={rough,normal:normalFromHeight(hc,1.4)};return t;}
function crossTex(center){const S=512,[c,g]=cv(S,S),PX=S/14;asphalt(g,S);g.fillStyle='rgba(240,240,240,.85)';
  for(let k=1;k<13;k+=1.5){g.fillRect(k*PX,0,.75*PX,2.2*PX);g.fillRect(k*PX,S-2.2*PX,.75*PX,2.2*PX);g.fillRect(0,k*PX,2.2*PX,.75*PX);g.fillRect(S-2.2*PX,k*PX,2.2*PX,.75*PX);}
  if(center){g.save();g.translate(S/2,S/2);g.strokeStyle='rgba(120,220,255,.7)';g.lineWidth=10;g.beginPath();g.arc(0,0,4*PX,0,7);g.stroke();
    g.fillStyle='rgba(255,190,70,.75)';g.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/2;g.lineTo(Math.cos(a)*3*PX,Math.sin(a)*3*PX);}g.closePath();g.fill();
    g.fillStyle='#27292d';g.font=`bold ${2.6*PX}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('7',0,PX*.2);g.restore();}
  return tex(c);}
function windowTex(wall,litP,hue){
  const [c,g]=cv(128,192),[e,h]=cv(128,192),[r,rr]=cv(128,192);rr.fillStyle='#e0e0e0';rr.fillRect(0,0,128,192);
  g.fillStyle=wall;g.fillRect(0,0,128,192);h.fillStyle='#000';h.fillRect(0,0,128,192);
  for(let i=0;i<600;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*128,Math.random()*192,2,2);}
  for(let f=0;f<3;f++){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,f*64+56,128,4);
    for(let k=0;k<4;k++){const x=8+k*30,y=8+f*64;
      const gr=g.createLinearGradient(x,y,x+22,y+42);gr.addColorStop(0,'#2a3550');gr.addColorStop(1,'#0e1220');g.fillStyle=gr;g.fillRect(x,y,22,42);rr.fillStyle='#1a1a1a';rr.fillRect(x,y,22,42);
      if(Math.random()<litP){const col=Math.random()<.75?(hue||'#ffd59a'):'#bfe6ff';const a=rand(.55,1);g.fillStyle=col;g.globalAlpha=a;g.fillRect(x+1,y+1,20,40);h.fillStyle=col;h.globalAlpha=a*rand(.5,1);h.fillRect(x+1,y+1,20,40);g.globalAlpha=1;h.globalAlpha=1;
        g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+1,y+1+rand(0,20),20,rand(4,16));}
      g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x+10,y,2,42);}}
  const a=tex(c),b=tex(e),ro=new THREE.CanvasTexture(r);[a,b,ro].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});return [a,b,ro];
}
function textTex(lines,w,h,col,bg){const [c,g]=cv(w,h);g.fillStyle=bg||'rgba(0,0,0,0)';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
  lines.forEach(([t,size,y,cl])=>{g.font=`${size}px 'Bebas Neue', Impact, sans-serif`;g.fillStyle=cl||col;g.shadowColor=cl||col;g.shadowBlur=18;g.fillText(t,w/2,y);});return tex(c);}

// ground
const cT=concreteTex();const ground=new THREE.Mesh(new THREE.PlaneGeometry(BOUND*2+160,BOUND*2+160),new THREE.MeshStandardMaterial({map:cT,normalMap:cT.userData.normal,normalScale:new THREE.Vector2(.6,.6),roughness:.82,metalness:.04,envMapIntensity:.6}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);
const outer=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({color:0x25262a,roughness:.9}));
outer.rotation.x=-Math.PI/2;outer.position.y=-.03;world.add(outer);
const ROADL=BOUND*2+30;const rT=roadTex();rT.repeat.set(ROADL/14,1);
rT.userData.rough.repeat.set(ROADL/14,1);rT.userData.normal.repeat.set(ROADL/14*2,2);
const roadMat=new THREE.MeshStandardMaterial({map:rT,roughnessMap:rT.userData.rough,normalMap:rT.userData.normal,normalScale:new THREE.Vector2(.5,.5),roughness:1,metalness:.1,envMapIntensity:1.1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
const xMat=new THREE.MeshStandardMaterial({map:crossTex(false),roughness:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const xMatC=new THREE.MeshStandardMaterial({map:crossTex(true),roughness:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
ROADS.forEach(a=>{
  const g=new THREE.PlaneGeometry(ROADL,RW);g.rotateX(-Math.PI/2);
  const m1=new THREE.Mesh(g,roadMat);m1.position.set(0,.02,a);m1.receiveShadow=true;world.add(m1);
  const m2=new THREE.Mesh(g,roadMat);m2.position.set(a,.025,0);m2.rotation.y=Math.PI/2;m2.receiveShadow=true;world.add(m2);
  ROADS.forEach(b=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(RW,RW).rotateX(-Math.PI/2),a===0&&b===0?xMatC:xMat);p.position.set(a,.03,b);p.receiveShadow=true;world.add(p);});
});

// buildings
const WT=[windowTex('#4a4e5c',.35),windowTex('#6b5a4c',.3,'#ffc27a'),windowTex('#2f3a44',.45,'#a8e1ff'),windowTex('#5a5f66',.25)];
const bmats=WT.map(([m,e,r])=>new THREE.MeshStandardMaterial({map:m,emissiveMap:e,emissive:0xffffff,emissiveIntensity:1.35,roughnessMap:r,roughness:1,metalness:.35,envMapIntensity:1.2}));
const roofMat=new THREE.MeshStandardMaterial({color:0x2a2b30,roughness:.9});
const blinkers=[];
// rooms: each kind gets its own furniture
function furnish(x,z,w,d,f){const iw=w-2.2,id=d-2.2;
  const solid=(mat,fw,fh,fd,fx,fz)=>{mBox(mat,fw,fh,fd,fx,fh/2,fz);solids.push({x:fx,z:fz,r:Math.max(fw,fd)*.42});};
  if(f==='konbini'){for(let k=-1;k<=1;k++)solid(shelfMat,iw*.55,1.5,.7,x,z+k*id/4);mBox(panelMat,iw*.8,.06,1,x,FH-.14,z);solid(furnMats[2],2.4,1,.8,x+iw/2-1.4,z-id/2+1.2);return;}
  if(f==='counter'){mBox(furnMats[0],iw*.75,1.05,.7,x,.52,z-id/6);BLD.push({x0:x-iw*.375,x1:x+iw*.375,z0:z-id/6-.35,z1:z-id/6+.35,h:1.05,top:true});
    for(let k=0;k<5;k++){const sx=x-iw*.3+k*iw*.15;mBox(stoolMat,.4,.7,.4,sx,.35,z-id/6+.75);}return;}
  if(f==='machines'){for(let r=-1;r<=1;r+=2)for(let k=0;k<Math.max(2,Math.floor(iw/1.4));k++){const mx=x-iw/2+.8+k*1.4;if(mx>x+iw/2-.6)break;const mz=z+r*id/4;
      mBox(blackMat,1,1.8,.7,mx,.9,mz);mBox(k%2?machineMat:machineMat2,.8,.9,.05,mx,1.2,mz-r*.36);solids.push({x:mx,z:mz,r:.55});}return;}
  if(f==='mall'){const fr=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.6,.8,24),furnMats[2]);fr.position.set(x,.4,z);world.add(fr);
    const wt=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,.1,24),new THREE.MeshStandardMaterial({color:0x3a9ad8,roughness:.05,metalness:.3,transparent:true,opacity:.85}));wt.position.set(x,.78,z);world.add(wt);solids.push({x,z,r:2.6});
    // little shops along the inside walls
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([nx,nz])=>{for(let k=-1;k<=1;k+=2){const kx=x+nx*(iw/2-1)+(nz?k*iw/4:0),kz=z+nz*(id/2-1)+(nx?k*id/4:0);
      mBox(pick(furnMats),nz?3:1.2,1.1,nz?1.2:3,kx,.55,kz);mBox(pick([machineMat,machineMat2,lanternMat]),nz?3:.06,.5,nz?.06:3,kx-nx*.62,2.6,kz-nz*.62);solids.push({x:kx,z:kz,r:1.2});}});
    for(let i=0;i<6;i++)mBox(panelMat,2.6,.06,.9,x+sr(-iw/3,iw/3),FH-.14,z+sr(-id/3,id/3));return;}
  for(let k=0;k<(w>16?3:1);k++){const fx=x+sr(-w/4,w/4),fz=z+sr(-d/4,d/4),fw=sr(1.6,3.2),fd=sr(.8,1.4),fh=sr(.9,1.6);if(Math.abs(fx-x)<1.5&&Math.abs(fz-z)<1.5)continue;
    solid(furnMats[Math.floor(srnd()*furnMats.length)],fw,fh,fd,fx,fz);}}
// outside: balconies, noren curtains, lanterns, vertical signs, rooftop billboards
function dressBuilding(B,K,x,z,w,d,h){
  if(K.balcony){const nx=srnd()<.5?1:0,face=srnd()<.5?1:-1;for(let y=FH+3;y<h-1;y+=3.2){if(nx){mBox(trimMat,.9,.18,d-1,x+face*(w/2+.45),y,z);mBox(railMat,.06,.9,d-1,x+face*(w/2+.88),y+.5,z);}
      else{mBox(trimMat,w-1,.18,.9,x,y,z+face*(d/2+.45));mBox(railMat,w-1,.9,.06,x,y+.5,z+face*(d/2+.88));}}}
  B.doors.forEach(o=>{const along=o.nz!==0;
    if(K.noren){const nm=pick(norenMats);mBox(nm,along?DOOR_W:.04,1.1,along?.04:DOOR_W,o.x+o.nx*.08,DOOR_H-.55,o.z+o.nz*.08);}
    if(K.lantern)[-1,1].forEach(sd=>LANTERNS.push([o.x+o.nx*.5+(along?sd*(DOOR_W/2+.5):0),DOOR_H-.2,o.z+o.nz*.5+(along?0:sd*(DOOR_W/2+.5))]));});
  for(let i=0;i<(K.vs||0);i++){const o=B.doors[Math.floor(srnd()*4)],along=o.nz!==0,len=along?w:d,sd=srnd()<.5?-1:1,off=sd*(len/2-.6);
    const sh=Math.min(h-FH-1,sr(6,11));if(sh<3)continue;const sx=along?x+off:o.x+o.nx*.9,sz=along?o.z+o.nz*.9:z+off;
    VSIGN.push([sx,FH+1+sh/2+i*.2,sz,1.1,sh,1,o.nx?(o.nx>0?Math.PI/2:-Math.PI/2):(o.nz>0?0:Math.PI)]);}
  if((K.roof||(h>30&&srnd()<.35))&&w>10){const along=srnd()<.5;ROOFSIGN.push([x,h+3.2,z+(along?0:0),Math.min(w,16),4.4,1,along?0:Math.PI/2]);}}
// --- merged city geometry: every box of a material becomes one mesh, so a big city stays a few draw calls ---
const MGEO=new Map();
function boxUV(g,tw,th){const uv=g.attributes.uv,pa=g.parameters;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);let u=uv.getX(i),v=uv.getY(i);
  if(f===2||f===3){u=.02;v=.02;}else{const fw=f<2?pa.depth:pa.width;u*=Math.max(1,Math.round(fw/tw));v*=Math.max(1,Math.round(pa.height/th));}uv.setXY(i,u,v);}}
function mBox(mat,w,h,d,x,y,z,tw,th){const g=new THREE.BoxGeometry(w,h,d);if(tw)boxUV(g,tw,th);g.translate(x,y,z);let L=MGEO.get(mat);if(!L)MGEO.set(mat,L=[]);L.push(g);}
function mergeCity(){for(const [mat,L] of MGEO){let nv=0,ni=0;L.forEach(g=>{nv+=g.attributes.position.count;ni+=g.index.count;});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=new Uint32Array(ni);let ov=0,oi=0;
  L.forEach(g=>{P.set(g.attributes.position.array,ov*3);N.set(g.attributes.normal.array,ov*3);U.set(g.attributes.uv.array,ov*2);const ix=g.index.array;for(let k=0;k<ix.length;k++)I[oi+k]=ix[k]+ov;ov+=g.attributes.position.count;oi+=ix.length;g.dispose();});
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('uv',new THREE.BufferAttribute(U,2));G.setIndex(new THREE.BufferAttribute(I,1));G.computeBoundingSphere();
  const m=new THREE.Mesh(G,mat);m.castShadow=!mat.userData.noShadow;m.receiveShadow=true;world.add(m);}MGEO.clear();}
// storefront (ground floor walls), interior floor, ceiling light panels
const [sfc,sfg]=cv(256,256);{sfg.fillStyle='#2a2c33';sfg.fillRect(0,0,256,256);const gr=sfg.createLinearGradient(0,40,0,220);gr.addColorStop(0,'#3a4a5a');gr.addColorStop(1,'#151a22');
  sfg.fillStyle=gr;sfg.fillRect(14,40,228,170);sfg.fillStyle='rgba(255,210,150,.25)';sfg.fillRect(14,150,228,60);sfg.fillStyle='#1a1b20';sfg.fillRect(124,40,8,170);sfg.fillRect(0,0,256,28);sfg.fillRect(0,214,256,42);
  sfg.fillStyle='rgba(255,255,255,.1)';sfg.beginPath();sfg.moveTo(30,40);sfg.lineTo(70,40);sfg.lineTo(40,210);sfg.lineTo(20,210);sfg.fill();}
const sfT=tex(sfc);sfT.wrapS=sfT.wrapT=THREE.RepeatWrapping;
const shopMat=new THREE.MeshStandardMaterial({map:sfT,roughness:.35,metalness:.4,envMapIntensity:1.3});
const [flc,flg]=cv(256,256);{flg.fillStyle='#8a8478';flg.fillRect(0,0,256,256);for(let i=0;i<4;i++)for(let j=0;j<4;j++){flg.fillStyle=(i+j)%2?'#7a7468':'#948e82';flg.fillRect(i*64+1,j*64+1,62,62);}}
const flT=tex(flc);flT.wrapS=flT.wrapT=THREE.RepeatWrapping;flT.repeat.set(1,1);
const floorMat=new THREE.MeshStandardMaterial({map:flT,roughness:.45,metalness:.1});floorMat.userData.noShadow=true;
const ceilMat=new THREE.MeshStandardMaterial({color:0x3a3c42,roughness:.9});
const panelMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2dd,emissiveIntensity:2.2});panelMat.userData.noShadow=true;
const trimMat=new THREE.MeshStandardMaterial({color:0x4a4c54,roughness:.7,metalness:.3});
const furnMats=[0x5a3a24,0x2a3a5a,0x6a6a72,0x3a5a3a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.7}));
const FH=5.2,DOOR_H=3.4,DOOR_W=3.6,WALL_T=.5;   // ground floor height, door size, wall thickness
const INTERIOR=[];  // spots for breakable crates inside buildings
// ---------- Japanese city: building kinds ----------
const JPF="'Noto Sans JP','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic','Meiryo','MS Gothic',sans-serif";
function facMat(w,h,draw,emI,extra){const [c,g]=cv(w,h),[e,eg]=cv(w,h);eg.fillStyle='#000';eg.fillRect(0,0,w,h);draw(g,eg,w,h);const a=tex(c),b=tex(e);[a,b].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});
  return new THREE.MeshStandardMaterial(Object.assign({map:a,emissiveMap:b,emissive:0xffffff,emissiveIntensity:emI||1.2,roughness:.6,metalness:.2,envMapIntensity:1.2},extra||{}));}
// glass office tower
const glassFac=facMat(128,192,(g,e)=>{g.fillStyle='#24384e';g.fillRect(0,0,128,192);for(let f=0;f<3;f++)for(let k=0;k<4;k++){const x=k*32,y=f*64;const gr=g.createLinearGradient(x,y,x+32,y+64);
  gr.addColorStop(0,'#7fa8c8');gr.addColorStop(.5,'#2a4a6a');gr.addColorStop(1,'#14263a');g.fillStyle=gr;g.fillRect(x+2,y+3,28,58);if(Math.random()<.35){e.fillStyle='#cfe8ff';e.globalAlpha=rand(.35,.8);e.fillRect(x+2,y+3,28,58);e.globalAlpha=1;}}
  g.fillStyle='#b8c4d0';for(let f=0;f<3;f++)g.fillRect(0,f*64,128,3);},1,{roughness:.12,metalness:.85});
// apartment ("mansion"): pale walls, sliding doors to balconies
const aptFac=facMat(128,192,(g,e)=>{g.fillStyle='#d8d2c4';g.fillRect(0,0,128,192);for(let i=0;i<400;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.08})`;g.fillRect(Math.random()*128,Math.random()*192,2,2);}
  for(let f=0;f<3;f++)for(let k=0;k<2;k++){const x=10+k*62,y=f*64+10;g.fillStyle='#3a4250';g.fillRect(x,y,46,44);g.fillStyle='#8a929c';g.fillRect(x+22,y,2,44);
    if(Math.random()<.5){const col=pick(['#ffd59a','#ffe9c4','#bfe6ff']);g.fillStyle=col;g.fillRect(x+2,y+2,42,40);e.fillStyle=col;e.globalAlpha=.7;e.fillRect(x+2,y+2,42,40);e.globalAlpha=1;g.fillStyle='rgba(60,40,20,.35)';g.fillRect(x+2,y+2,20,40);}}},1);
// small shop building: tile or painted concrete with windows
const shopFacs=['#c8b8a0','#a8b4b0','#b89a8a','#9aa0b8'].map(col=>facMat(128,128,(g,e)=>{g.fillStyle=col;g.fillRect(0,0,128,128);for(let y=0;y<128;y+=8){g.fillStyle='rgba(0,0,0,.06)';g.fillRect(0,y,128,1);}
  for(let k=0;k<2;k++){const x=12+k*60,y=20;g.fillStyle='#2a3240';g.fillRect(x,y,44,56);if(Math.random()<.55){const c2=pick(['#ffd59a','#ffc0d8','#bfe6ff']);g.fillStyle=c2;g.fillRect(x+2,y+2,40,52);e.fillStyle=c2;e.globalAlpha=.75;e.fillRect(x+2,y+2,40,52);e.globalAlpha=1;}}},1));
// wooden ramen shop / izakaya: dark planks, glowing paper screens
const woodFac=facMat(128,128,(g,e)=>{g.fillStyle='#3a2416';g.fillRect(0,0,128,128);for(let x=0;x<128;x+=8){g.fillStyle=`rgba(0,0,0,${rand(.1,.3)})`;g.fillRect(x,0,1,128);}
  g.fillStyle='#f4e2bc';g.fillRect(16,30,96,50);e.fillStyle='#ffd8a0';e.fillRect(16,30,96,50);g.strokeStyle='#3a2416';g.lineWidth=3;for(let x=16;x<=112;x+=16){g.beginPath();g.moveTo(x,30);g.lineTo(x,80);g.stroke();}for(let y=30;y<=80;y+=12.5){g.beginPath();g.moveTo(16,y);g.lineTo(112,y);g.stroke();}},1.1,{roughness:.8,metalness:0});
const woodGF=facMat(128,128,(g,e)=>{g.fillStyle='#2e1c10';g.fillRect(0,0,128,128);for(let x=0;x<128;x+=6){g.fillStyle=`rgba(255,220,180,${rand(.02,.08)})`;g.fillRect(x,0,1,128);}
  g.fillStyle='#e8d2a8';g.fillRect(14,24,100,70);e.fillStyle='#ffc890';e.globalAlpha=.8;e.fillRect(14,24,100,70);e.globalAlpha=1;g.strokeStyle='#2e1c10';g.lineWidth=3;for(let x=14;x<=114;x+=20){g.beginPath();g.moveTo(x,24);g.lineTo(x,94);g.stroke();}},1.1,{roughness:.8,metalness:0});
// convenience store: white with colored stripes and a bright glass front
const konbiniFac=[['#2aa84a','#3a8ad8'],['#3a6ad8','#7ac8ff'],['#e8702a','#2a9a4a']].map(([a,b])=>facMat(128,64,(g,e)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,128,64);g.fillStyle=a;g.fillRect(0,14,128,10);g.fillStyle=b;g.fillRect(0,26,128,6);g.fillStyle='#f4f4f0';g.fillRect(0,34,128,2);
  e.fillStyle='#333';e.fillRect(0,14,128,22);},1));
const konbiniGF=facMat(128,128,(g,e)=>{g.fillStyle='#d8dde2';g.fillRect(0,0,128,128);g.fillStyle='#f6fbff';g.fillRect(6,10,116,100);e.fillStyle='#e8f4ff';e.fillRect(6,10,116,100);
  g.fillStyle='rgba(60,80,100,.35)';for(let k=0;k<4;k++)g.fillRect(10+k*30,60,24,40);g.fillStyle='#9aa4ae';g.fillRect(62,10,4,100);},.55,{roughness:.2,metalness:.3});
// pachinko parlor: loud red and gold, rows of bulbs
const pachiFac=facMat(128,128,(g,e)=>{const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#c4102a');gr.addColorStop(1,'#6a0a3a');g.fillStyle=gr;g.fillRect(0,0,128,128);
  for(let y=6;y<128;y+=12)for(let x=6;x<128;x+=12){const c=pick(['#ffd23f','#ffffff','#ff5aa8','#5af0ff']);g.fillStyle=c;g.beginPath();g.arc(x,y,3,0,7);g.fill();e.fillStyle=c;e.beginPath();e.arc(x,y,3.4,0,7);e.fill();}},2.2,{roughness:.4});
// shopping mall: pale stone with glass bands
const mallFac=facMat(128,128,(g,e)=>{g.fillStyle='#e6e0d4';g.fillRect(0,0,128,128);g.fillStyle='#2a4a6a';g.fillRect(0,40,128,48);e.fillStyle='#bfe6ff';e.globalAlpha=.3;e.fillRect(0,40,128,48);e.globalAlpha=1;
  g.fillStyle='#d0c8b8';for(let x=0;x<128;x+=32)g.fillRect(x,40,3,48);},1,{roughness:.35,metalness:.3});
const mallGF=facMat(128,128,(g,e)=>{g.fillStyle='#c8ccd0';g.fillRect(0,0,128,128);g.fillStyle='#e8f4ff';g.fillRect(4,6,120,116);e.fillStyle='#f0f8ff';e.globalAlpha=.85;e.fillRect(4,6,120,116);e.globalAlpha=1;g.fillStyle='#9aa4ae';for(let x=4;x<128;x+=40)g.fillRect(x,6,3,116);},.5,{roughness:.15,metalness:.4});
const nightGlow=c=>{const m=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:2.4});m.userData.noShadow=true;return m;};
const norenMats=[0x1e2a5a,0x8a1a1a,0x2a2a2a,0xe8e0d0].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.9,side:THREE.DoubleSide}));
const lanternMat=nightGlow(0xff3a1f),machineMat=nightGlow(0x7ad8ff),machineMat2=nightGlow(0xffd23f),shelfMat=new THREE.MeshStandardMaterial({color:0xe8e8ec,roughness:.5}),stoolMat=new THREE.MeshStandardMaterial({color:0x8a1a1a,roughness:.6});
const railMat=new THREE.MeshStandardMaterial({color:0x9aa0a8,metalness:.7,roughness:.35}),toriiMat=new THREE.MeshStandardMaterial({color:0xd8401a,roughness:.55}),blackMat=new THREE.MeshStandardMaterial({color:0x1a1a1e,roughness:.6});
const VSIGN=[],ROOFSIGN=[],LANTERNS=[],VEND=[];
// what each kind looks like, how tall it is, its door signs and its rooms
const BKIND={
  office:{fac:()=>glassFac,gf:()=>shopMat,h:[45,82],sign:[17,20]},
  apartment:{fac:()=>aptFac,gf:()=>shopMat,h:[20,40],balcony:true,sign:[4,9]},
  dept:{fac:()=>bmats[Math.floor(srnd()*bmats.length)],gf:()=>mallGF,h:[24,36],vs:2,roof:true,sign:[16,16]},
  konbini:{fac:()=>pick(konbiniFac),gf:()=>konbiniGF,h:[6.6,8],sign:[3,3],furn:'konbini'},
  ramen:{fac:()=>woodFac,gf:()=>woodGF,h:[8,11],sign:[0,0],furn:'counter',noren:true,lantern:true},
  izakaya:{fac:()=>woodFac,gf:()=>woodGF,h:[8,12],sign:[6,6],furn:'counter',noren:true,lantern:true},
  sushi:{fac:()=>woodFac,gf:()=>woodGF,h:[8,11],sign:[1,1],furn:'counter',noren:true,lantern:true},
  pachinko:{fac:()=>pachiFac,gf:()=>shopMat,h:[10,16],sign:[11,11],furn:'machines',vs:1},
  karaoke:{fac:()=>pick(shopFacs),gf:()=>shopMat,h:[16,28],sign:[2,2],vs:3},
  arcade:{fac:()=>pick(shopFacs),gf:()=>shopMat,h:[12,20],sign:[7,7],furn:'machines',vs:2},
  pencil:{fac:()=>pick(shopFacs),gf:()=>shopMat,h:[20,34],sign:[4,15],vs:4},
  shop:{fac:()=>pick(shopFacs),gf:()=>shopMat,h:[10,20],sign:[4,15]},
  mall:{fac:()=>mallFac,gf:()=>mallGF,h:[18,24],sign:[12,12],furn:'mall',roof:true}};
const SMALL_KINDS=['konbini','ramen','izakaya','sushi','pachinko','karaoke','arcade','pencil','pencil','shop','shop','apartment'];
function building(x,z,w,d,h,collide,kind){
  const K=BKIND[kind||'shop']||BKIND.shop;const bm=collide&&kind?K.fac():bmats[Math.floor(srnd()*bmats.length)],gfm=collide&&kind?K.gf():shopMat;
  if(!collide){mBox(bm,w,h,d,x,h/2,z,8,12);mBox(roofMat,w+.6,.6,d+.6,x,h+.3,z);return;}
  // upper floors: solid, with a roof you can stand on
  const uh=h-FH;mBox(bm,w,uh,d,x,FH+uh/2,z,8,12);mBox(roofMat,w+.6,.6,d+.6,x,h+.3,z);mBox(trimMat,w+.4,.5,d+.4,x,FH+.25,z);mBox(ceilMat,w-.2,.1,d-.2,x,FH-.05,z);
  BLD.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:FH,h:h+.6,top:true});
  // ground floor: four walls, each with a door you can walk through
  const doors=[];
  [[0,-1,w],[0,1,w],[-1,0,d],[1,0,d]].forEach(([nx,nz,len])=>{const off=sr(-1,1)*Math.max(0,len/2-DOOR_W/2-2.5);const cx=x+nx*(w/2-WALL_T/2),cz=z+nz*(d/2-WALL_T/2),along=nz!==0;
    const seg=(u0,u1,y0,y1)=>{if(u1-u0<.05)return;const uc=(u0+u1)/2,ul=u1-u0,bx=along?x+uc:cx,bz=along?cz:z+uc,sx=along?ul:WALL_T,sz=along?WALL_T:ul;
      mBox(y0>0?trimMat:gfm,sx,y1-y0,sz,bx,(y0+y1)/2,bz,4,FH);BLD.push({x0:bx-sx/2,x1:bx+sx/2,z0:bz-sz/2,z1:bz+sz/2,y0,h:y1});};
    seg(-len/2,off-DOOR_W/2,0,FH);seg(off+DOOR_W/2,len/2,0,FH);seg(off-DOOR_W/2,off+DOOR_W/2,DOOR_H,FH);
    doors.push({nx,nz,x:along?x+off:x+nx*w/2,z:along?z+nz*d/2:z+off,len});});
  // inside: tiled floor, ceiling lights, some furniture and crates
  mBox(floorMat,w-WALL_T*2,.04,d-WALL_T*2,x,.03,z);
  const nl=Math.max(1,Math.round(w/8))*Math.max(1,Math.round(d/8));for(let i=0;i<Math.min(nl,6);i++)mBox(panelMat,1.8,.06,.7,x+sr(-w/3,w/3),FH-.14,z+sr(-d/3,d/3));
  furnish(x,z,w,d,K.furn);
  if(K.furn!=='mall')INTERIOR.push([x+sr(-w/4,w/4),z+sr(-d/4,d/4)]);
  const B={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h:h+.6,doors,kind:kind||'shop'};BLDG.push(B);dressBuilding(B,K,x,z,w,d,h);
  if(srnd()<.35){const ah=sr(4,10);const a=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,ah,6),roofMat);a.position.set(x,h+ah/2,z);world.add(a);
    const l=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:0xff2a2a}));l.position.set(x,h+ah,z);world.add(l);blinkers.push([l,srnd()*6]);}
  if(srnd()<.6){const b=new THREE.Mesh(new THREE.BoxGeometry(sr(1.5,3),sr(1,2),sr(1.5,3)),roofMat);b.position.set(x+sr(-w/3,w/3),h+1.2,z+sr(-d/3,d/3));world.add(b);}
}
// a small shrine: torii gates on the paths, a wooden hall with a climbable roof, stone lanterns
function shrine(cx,cz){const wood=woodFac;
  const torii=(x,z,rot)=>{const c=Math.cos(rot),sn=Math.sin(rot);[-1.8,1.8].forEach(o=>{const px=x+o*c,pz=z-o*sn;mBox(toriiMat,.42,5.2,.42,px,2.6,pz);solids.push({x:px,z:pz,r:.35});mBox(blackMat,.52,.5,.52,px,.25,pz);});
    const lw=rot?.5:5.4,ld=rot?5.4:.5;mBox(toriiMat,rot?.45:5.4,.38,rot?5.4:.45,x,4.3,z);mBox(blackMat,rot?.6:6.4,.3,rot?6.4:.6,x,5.25,z);mBox(toriiMat,rot?.7:6.2,.25,rot?6.2:.7,x,5.0,z);};
  torii(cx,cz+15,0);torii(cx,cz-15,0);torii(cx+15,cz,Math.PI/2);
  const hw=8,hd=6,hh=3.6;mBox(wood,hw,hh,hd,cx,hh/2+.6,cz,8,4);mBox(plazaMat,hw+1.4,.6,hd+1.4,cx,.3,cz);
  BLD.push({x0:cx-hw/2-.7,x1:cx+hw/2+.7,z0:cz-hd/2-.7,z1:cz+hd/2+.7,h:.6,top:true});BLD.push({x0:cx-hw/2,x1:cx+hw/2,z0:cz-hd/2,z1:cz+hd/2,h:hh+1.6,top:true});
  mBox(blackMat,hw+2.2,.4,hd+2.4,cx,hh+.8,cz);mBox(blackMat,hw+1,.6,hd*.6,cx,hh+1.3,cz);mBox(toriiMat,hw*.5,.5,.1,cx,hh-.2,cz+hd/2+.06);
  [[-4,11],[4,11],[-4,-11],[4,-11]].forEach(([ox,oz])=>{const x=cx+ox,z=cz+oz;mBox(plazaMat,.7,1.6,.7,x,.8,z);mBox(plazaMat,1.1,.3,1.1,x,1.75,z);LANTERNS.push([x,1.45,z]);solids.push({x,z,r:.5});});}
const PLAZAS=[[-24,24],[24,-24],[-72,-72],[72,72],[-120,120],[120,-120]],MALLS=[[72,-24],[-72,72]],SHRINES=[[-120,120],[120,-120]];
const plazaMat=new THREE.MeshStandardMaterial({color:0x6a6c70,roughness:.8});
const leafMats=[0x2f5a34,0x3a6a3a,0x24482a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.75}));
const leafGeo=(()=>{const g=new THREE.IcosahedronGeometry(1,2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new V3(p.getX(i),p.getY(i),p.getZ(i));v.multiplyScalar(1+(Math.sin(v.x*7)*Math.cos(v.y*6)*Math.sin(v.z*8))*.12);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;})();
const trunkMat=new THREE.MeshStandardMaterial({color:0x4a3626,roughness:.9});
const holoMats=[];
BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{
  if(PLAZAS.some(p=>p[0]===cx&&p[1]===cz)){
    [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(([ox,oz])=>{const x=cx+ox,z=cz+oz;
      const pl=new THREE.Mesh(new THREE.BoxGeometry(3.4,.8,3.4),plazaMat);pl.position.set(x,.4,z);pl.castShadow=pl.receiveShadow=true;world.add(pl);
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2.4,6),trunkMat);tr.position.set(x,1.9,z);tr.castShadow=true;world.add(tr);
      [[0,3.9,0,1.5],[.7,3.5,.3,1.05],[-.6,3.6,-.4,1.1],[.1,4.6,-.2,1.0],[-.2,3.3,.7,.95]].forEach(([dx,dy,dz,r],k)=>{const lf=new THREE.Mesh(leafGeo,leafMats[k%3]);lf.position.set(x+dx,dy,z+dz);lf.scale.setScalar(r);lf.rotation.set(k,k*2,0);lf.castShadow=true;world.add(lf);});
      solids.push({x,z,r:2,tree:true});});
    if(SHRINES.some(p=>p[0]===cx&&p[1]===cz)){shrine(cx,cz);return;}
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.9,1.1,6),plazaMat);ped.position.set(cx,.55,cz);ped.castShadow=ped.receiveShadow=true;world.add(ped);
    const hm=addMat(0x7fe3ff,1.6,.8);holoMats.push(hm);
    const holo=new THREE.Mesh(new THREE.CylinderGeometry(.1,1.6,3.2,6,1,true),hm);holo.position.set(cx,2.8,cz);world.add(holo);holo.userData.spin=true;
    solids.push({x:cx,z:cz,r:3});
    return;}
  const kh=k=>{const r=BKIND[k].h;return sr(r[0],r[1]);};
  if(MALLS.some(m=>m[0]===cx&&m[1]===cz)){building(cx,cz,31,31,kh('mall'),true,'mall');return;}
  if(srnd()<.36){const BK4=['office','office','apartment','dept'],k=BK4[Math.floor(srnd()*4)];const w=sr(18,26),d=sr(18,26);building(cx+sr(-2,2),cz+sr(-2,2),w,d,kh(k),true,k);}
  else{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([qx,qz])=>{if(srnd()<.22)return;const k=SMALL_KINDS[Math.floor(srnd()*SMALL_KINDS.length)];const s=k==='pencil'?sr(8,9.5):sr(9,12),s2=sr(9,12);building(cx+qx*7.6,cz+qz*7.6,s,s2,kh(k),true,k);});}
}));
// distant skyline (no collision)
for(let gx=-12;gx<=12;gx++)for(let gz=-12;gz<=12;gz++){const x=gx*26,z=gz*26;if(Math.max(Math.abs(x),Math.abs(z))<BOUND+28)continue;if(Math.abs(x)<10||Math.abs(z)<10)continue;
  if(srnd()<.25)continue;building(x+sr(-3,3),z+sr(-3,3),sr(14,20),sr(14,20),sr(30,120),false);}

mergeCity();
// gantries + boundary
function gantry(x,z,rot){
  const g=new THREE.Group();const steel=new THREE.MeshStandardMaterial({color:0x3a3d45,metalness:.7,roughness:.4});
  [-8.5,8.5].forEach(px=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.8,14,.8),steel);p.position.set(px,7,0);p.castShadow=true;g.add(p);});
  const beam=new THREE.Mesh(new THREE.BoxGeometry(18,1.2,1),steel);beam.position.y=13.6;g.add(beam);
  const t=textTex([['HERO TRIALS',110,70,'#7fe3ff'],['SECTOR 7 · BATTLE ZONE',50,150,'#ffcf6b']],1024,200,'#7fe3ff','rgba(5,15,30,.55)');
  const sm=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});sm.color.setScalar(1.6);holoMats.push(sm);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(16,3.2),sm);s.position.y=10.8;g.add(s);
  g.position.set(x,0,z);g.rotation.y=rot;world.add(g);
  const c=Math.cos(rot),sn=Math.sin(rot);[-8.5,8.5].forEach(px=>solids.push({x:x+px*c,z:z-px*sn,r:.6}));
}
{const G=BOUND-6;gantry(0,G,Math.PI);gantry(0,-G,0);gantry(G,0,-Math.PI/2);gantry(-G,0,Math.PI/2);}
const [hc,hg]=cv(256,64);
for(let x=0;x<256;x+=16){hg.fillStyle='rgba(120,220,255,.35)';hg.fillRect(x,0,2,64);}for(let y=0;y<64;y+=16){hg.fillStyle='rgba(120,220,255,.35)';hg.fillRect(0,y,256,2);}
{const gr=hg.createLinearGradient(0,64,0,0);gr.addColorStop(0,'rgba(120,220,255,.5)');gr.addColorStop(1,'rgba(120,220,255,0)');hg.fillStyle=gr;hg.fillRect(0,0,256,64);}
const holoT=tex(hc);holoT.wrapS=THREE.RepeatWrapping;holoT.repeat.set(48,1);
const walls=[];
[[0,BOUND+1,0],[0,-BOUND-1,0],[BOUND+1,0,Math.PI/2],[-BOUND-1,0,Math.PI/2]].forEach(([x,z,r])=>{
  const m=new THREE.Mesh(new THREE.PlaneGeometry((BOUND+1)*2,6),new THREE.MeshBasicMaterial({map:holoT,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(x,3,z);m.rotation.y=r;world.add(m);walls.push(m);});

// lamps
const lampMat=new THREE.MeshStandardMaterial({color:0x2c2e34,metalness:.6,roughness:.45});
const bulbMat=new THREE.MeshStandardMaterial({color:0xfff2d0,emissive:0xffd9a0,emissiveIntensity:5});
const lampCone=new THREE.ConeGeometry(2.2,6.6,32,1,true),lampConeMat=new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.045,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true});
const lampPool=new THREE.CircleGeometry(2.6,32),lampPoolMat=new THREE.MeshBasicMaterial({color:0xffc890,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false});
const lampPole=new THREE.CylinderGeometry(.09,.14,7,16),lampArm=new THREE.BoxGeometry(.12,.12,1.8),lampHead=new THREE.BoxGeometry(.5,.18,.8),lampBulb=new THREE.BoxGeometry(.4,.05,.6);
function lamp(x,z,ry){const g=new THREE.Group();const p=new THREE.Mesh(lampPole,lampMat);p.position.y=3.5;p.castShadow=true;g.add(p);
  const a=new THREE.Mesh(lampArm,lampMat);a.position.set(0,6.9,.8);g.add(a);const h=new THREE.Mesh(lampHead,lampMat);h.position.set(0,6.85,1.6);g.add(h);
  const b=new THREE.Mesh(lampBulb,bulbMat);b.position.set(0,6.74,1.6);g.add(b);const cn=new THREE.Mesh(lampCone,lampConeMat);cn.position.set(0,3.4,1.6);g.add(cn);
  const pool=new THREE.Mesh(lampPool,lampPoolMat);pool.rotation.x=-Math.PI/2;pool.position.set(0,.06,1.6);g.add(pool);g.position.set(x,0,z);g.rotation.y=ry;world.add(g);solids.push({x,z,r:.35});}
INNER.forEach(a=>BLOCKS.forEach(t=>{lamp(a+8.3,t,-Math.PI/2);lamp(t,a+8.3,Math.PI);}));

/* ---- breakable props ---- */
const props=[];
const [wc,wg]=cv(64,64);wg.fillStyle='#8a6232';wg.fillRect(0,0,64,64);for(let i=0;i<4;i++){wg.fillStyle='rgba(0,0,0,.35)';wg.fillRect(0,i*16,64,2);}wg.strokeStyle='#4a3218';wg.lineWidth=6;wg.strokeRect(3,3,58,58);wg.beginPath();wg.moveTo(3,3);wg.lineTo(61,61);wg.stroke();
const crateMat=new THREE.MeshStandardMaterial({map:tex(wc),roughness:.85});
const [bc,bg]=cv(128,32);for(let i=0;i<8;i++){bg.fillStyle=i%2?'#f2f2f2':'#ff7a1a';bg.beginPath();bg.moveTo(i*16,32);bg.lineTo(i*16+16,0);bg.lineTo(i*16+32,0);bg.lineTo(i*16+16,32);bg.fill();}
const barMat=new THREE.MeshStandardMaterial({map:tex(bc),roughness:.7});
const coneMat=new THREE.MeshStandardMaterial({color:0xff5a10,roughness:.6});
const carCols=[0xc23b2e,0x2e6bc2,0xe8e8e8,0x1e1e22,0xd9a520,0x2e8a5a];
const carGeo={body:new THREE.BoxGeometry(4,.75,1.8),cab:new THREE.BoxGeometry(2.1,.65,1.6),wheel:new THREE.CylinderGeometry(.36,.36,.26,14),light:new THREE.BoxGeometry(.05,.15,.35)};
const glassMat=new THREE.MeshStandardMaterial({color:0x111a22,metalness:.9,roughness:.1}),wheelMat=new THREE.MeshStandardMaterial({color:0x111111,roughness:.8});
const hlMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff0c0,emissiveIntensity:4}),tlMat=new THREE.MeshStandardMaterial({color:0xff2020,emissive:0xff1010,emissiveIntensity:3});
const paintMats=carCols.map(c=>new THREE.MeshPhysicalMaterial({color:c,metalness:.55,roughness:.35,clearcoat:1,clearcoatRoughness:.08}));
function makeCar(){const g=new THREE.Group();
  const body=new THREE.Mesh(carGeo.body,paintMats[Math.floor(srnd()*paintMats.length)]);body.position.y=.65;g.add(body);
  const cab=new THREE.Mesh(carGeo.cab,glassMat);cab.position.set(-.2,1.33,0);g.add(cab);
  [[1.3,.9],[1.3,-.9],[-1.3,.9],[-1.3,-.9]].forEach(([x,z])=>{const w=new THREE.Mesh(carGeo.wheel,wheelMat);w.rotation.x=Math.PI/2;w.position.set(x,.36,z);g.add(w);});
  [.6,-.6].forEach(z=>{const a=new THREE.Mesh(carGeo.light,hlMat);a.position.set(2.01,.75,z);g.add(a);const b=new THREE.Mesh(carGeo.light,tlMat);b.position.set(-2.01,.75,z);g.add(b);});return g;}
const crateGeo=new THREE.BoxGeometry(1.3,1.3,1.3),barGeo=new THREE.BoxGeometry(2.6,.95,.6),coneGeo=new THREE.ConeGeometry(.28,.75,12);
function addProp(kind,x,z,rot){
  if(insideBld(x,z,kind==='car'?2:1.2))return;let g=new THREE.Group(),r;
  if(kind==='crate'){const m=new THREE.Mesh(crateGeo,crateMat);m.position.y=.65;g.add(m);r=.85;}
  else if(kind==='barrier'){const m=new THREE.Mesh(barGeo,barMat);m.position.y=.48;g.add(m);r=1.1;}
  else if(kind==='cone'){const m=new THREE.Mesh(coneGeo,coneMat);m.position.y=.38;g.add(m);r=.3;}
  else{g=makeCar();r=1.8;}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  g.position.set(x,0,z);g.rotation.y=rot||0;world.add(g);props.push({g,kind,x,z,r,broken:false,i:props.length});
}
INNER.forEach(a=>BLOCKS.forEach(t=>{
  if(srnd()<.55)addProp('car',t+sr(-8,8),a+(srnd()<.5?-3.6:3.6),srnd()<.5?0:Math.PI);
  if(srnd()<.55)addProp('car',a+(srnd()<.5?-3.6:3.6),t+sr(-8,8),srnd()<.5?Math.PI/2:-Math.PI/2);
}));
for(let i=0;i<70;i++){const cx=BLOCKS[Math.floor(srnd()*BLOCKS.length)],cz=BLOCKS[Math.floor(srnd()*BLOCKS.length)];const x=cx+sr(-16,16),z=cz+sr(-16,16);
  const k=srnd();if(k<.5){addProp('crate',x,z,sr(0,3));if(srnd()<.6)addProp('crate',x+1.5,z+sr(-.4,.4),sr(0,3));}else if(k<.8)addProp('barrier',x,z,sr(0,3));else{addProp('cone',x,z);addProp('cone',x+.9,z+.7);}}
INTERIOR.forEach(([x,z])=>{if(srnd()<.7){addProp('crate',x,z,sr(0,3));if(srnd()<.5)addProp('crate',x+1.5,z+sr(-.4,.4),sr(0,3));}});
INNER.forEach(a=>INNER.forEach(b=>{if(srnd()<.5){addProp('barrier',a+sr(-4,4),b+9.5,0);}if(srnd()<.5){addProp('cone',a+9.5,b+sr(-4,4));addProp('cone',a+9.5,b+sr(-4,4));}}));
function resetProps(){props.forEach(p=>{p.broken=false;p.g.visible=true;});}

/* ---- zone wall ---- */
const zoneMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{t:{value:0}},
  vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}',
  fragmentShader:`uniform float t;varying vec2 vUv;varying vec3 vW;
  void main(){float h=vUv.y;float band=smoothstep(.0,.08,h)*(1.-smoothstep(.2,1.,h));
  float stripes=.5+.5*sin(vUv.x*900.+t*3.+h*40.);float grid=step(.92,fract(vUv.x*240.))+step(.9,fract(h*30.-t*.6));
  float fade=clamp(1.-length(vW.xz-cameraPosition.xz)/260.,.25,1.);vec3 c=mix(vec3(.55,.2,1.),vec3(.3,.8,1.),stripes*.5)*(.22+grid*.45)*band*1.1*fade;
  c+=vec3(.8,.4,1.)*smoothstep(.03,0.,h)*2.;gl_FragColor=vec4(c,1.);}`});
const zoneMesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,70,128,1,true),zoneMat);zoneMesh.position.y=35;scene.add(zoneMesh);
const zoneNext=new THREE.Mesh(new THREE.RingGeometry(.995,1,128),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));
zoneNext.rotation.x=-Math.PI/2;zoneNext.position.y=.15;scene.add(zoneNext);

/* ---- orbs ---- */
const orbGeo=new THREE.IcosahedronGeometry(.45,1),orbRing=new THREE.TorusGeometry(.75,.05,6,32);
const orbMats={hp:new THREE.MeshStandardMaterial({color:0x3dff8a,emissive:0x3dff8a,emissiveIntensity:2.2,roughness:.3}),surge:new THREE.MeshStandardMaterial({color:0xffd23f,emissive:0xffb020,emissiveIntensity:2.4,roughness:.3})};
function makeOrbMesh(type){const g=new THREE.Group();const s=new THREE.Mesh(orbGeo,orbMats[type]);g.add(s);const r=new THREE.Mesh(orbRing,orbMats[type]);r.rotation.x=Math.PI/2;g.add(r);scene.add(g);return g;}

/* ---- minimap static layer ---- */
const MM=380,MS=MM/(MAPH*2);const mmBase=document.createElement('canvas');mmBase.width=mmBase.height=MM;
{const g=mmBase.getContext('2d');g.fillStyle='#2b2d33';g.fillRect(0,0,MM,MM);g.fillStyle='#1c1d22';
  ROADS.forEach(a=>{g.fillRect(0,(a+MAPH-RW/2)*MS,MM,RW*MS);g.fillRect((a+MAPH-RW/2)*MS,0,RW*MS,MM);});
  g.fillStyle='#55596a';BLDG.forEach(b=>g.fillRect((b.x0+MAPH)*MS,(b.z0+MAPH)*MS,(b.x1-b.x0)*MS,(b.z1-b.z0)*MS));g.fillStyle='#8a8ea0';BLDG.forEach(b=>b.doors.forEach(o=>g.fillRect((o.x+MAPH)*MS-2,(o.z+MAPH)*MS-2,4,4)));
  g.fillStyle='#2f5a34';PLAZAS.forEach(([x,z])=>{g.beginPath();g.arc((x+MAPH)*MS,(z+MAPH)*MS,4*MS,0,7);g.fill();});
  g.strokeStyle='rgba(127,227,255,.6)';g.lineWidth=2;g.strokeRect((MAPH-BOUND)*MS,(MAPH-BOUND)*MS,BOUND*2*MS,BOUND*2*MS);}

/* ---- city dressing (instanced so hundreds of pieces cost only a few draw calls) ---- */
const _m4=new THREE.Matrix4(),_qq=new THREE.Quaternion(),_ss=new V3(),_pp=new V3(),_eu=new THREE.Euler();const _cc=new THREE.Color();
function inst(geo,mat,list,shadow,colors){if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length);
  list.forEach((t,i)=>{_pp.set(t[0],t[1],t[2]);_eu.set(0,t[6]||0,0);_qq.setFromEuler(_eu);_ss.set(t[3],t[4],t[5]);_m4.compose(_pp,_qq,_ss);im.setMatrixAt(i,_m4);if(colors)im.setColorAt(i,_cc.setHex(colors[i]));});
  im.castShadow=!!shadow;im.receiveShadow=true;world.add(im);return im;}
function atlasMat(map,cols,rows,bright){const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:true,side:THREE.DoubleSide});m.color.setScalar(bright||1);
  m.onBeforeCompile=sh=>{sh.vertexShader='attribute vec2 aOff;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n\tvUv=vUv*vec2('+(1/cols).toFixed(5)+','+(1/rows).toFixed(5)+')+aOff;\n#endif');};
  m.customProgramCacheKey=()=>'atlas'+cols+'x'+rows;return m;}
function atlasInst(map,cols,rows,bright,list,pick){if(!list.length)return;const g=new THREE.PlaneGeometry(1,1);const off=new Float32Array(list.length*2);
  list.forEach((t,i)=>{const v=pick[i];off[i*2]=(v%cols)/cols;off[i*2+1]=1-(Math.floor(v/cols)+1)/rows;});g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));
  const im=new THREE.InstancedMesh(g,atlasMat(map,cols,rows,bright),list.length);
  list.forEach((t,i)=>{_pp.set(t[0],t[1],t[2]);_eu.set(0,t[6]||0,0);_qq.setFromEuler(_eu);_ss.set(t[3],t[4],1);_m4.compose(_pp,_qq,_ss);im.setMatrixAt(i,_m4);});world.add(im);}
// neon sign atlas (original shop names)
const SIGNS=['ラーメン RAMEN','寿司 SUSHI','カラオケ KARAOKE','24H MART','薬局 DRUG','本屋 BOOKS','居酒屋 IZAKAYA','GAME CENTER','珈琲 CAFE','うどん UDON','焼肉 BBQ','パチンコ PACHINKO','SKY MALL','電器 TECH','花屋 FLOWERS','銭湯 BATH','百貨店 DEPT. STORE','HERO CORP','NEO BANK','MUSUTAFU NEWS','PLUS ULTRA GYM','ホテル HOTEL','歯科 DENTAL','美容室 SALON'];
const SIGNC=['#ff5aa8','#5af0ff','#7dff8a','#ffd25a','#ff7a3a','#ff4a5a','#c58bff','#9ae0ff'];
const [sc4,sg4]=cv(1024,384);sg4.fillStyle='#0a0a12';sg4.fillRect(0,0,1024,384);
SIGNS.forEach((n,i)=>{const x=(i%4)*256,y=Math.floor(i/4)*64;const col=SIGNC[i%SIGNC.length];sg4.fillStyle='#120e18';sg4.fillRect(x+4,y+4,248,56);
  sg4.strokeStyle=col;sg4.lineWidth=3;sg4.shadowColor=col;sg4.shadowBlur=12;sg4.strokeRect(x+8,y+8,240,48);sg4.font="bold 28px 'Bebas Neue', "+JPF;sg4.textAlign='center';sg4.textBaseline='middle';sg4.fillStyle=col;sg4.fillText(n,x+128,y+33,226);sg4.shadowBlur=0;});
const signTex=tex(sc4);
// vertical signs (kanban) and rooftop billboards
const VS_TXT=['ラーメン','カラオケ','居酒屋','パチンコ','ゲーム','ホテル','焼肉','珈琲','薬局','本屋','寿司','うどん','歯科','美容室','占い','麻雀'];
const [vc4,vg4]=cv(1024,1024);vg4.fillStyle='#0a0a12';vg4.fillRect(0,0,1024,1024);
VS_TXT.forEach((t,i)=>{const x=(i%8)*128,y=Math.floor(i/8)*512,col=SIGNC[(i*3)%SIGNC.length],bg=['#c4102a','#1a2a6a','#f4f0e6','#101018'][i%4];
  vg4.fillStyle=bg;vg4.fillRect(x+6,y+6,116,500);vg4.strokeStyle=col;vg4.lineWidth=5;vg4.shadowColor=col;vg4.shadowBlur=14;vg4.strokeRect(x+12,y+12,104,488);
  vg4.font="bold 76px "+JPF;vg4.textAlign='center';vg4.textBaseline='middle';vg4.fillStyle=bg==='#f4f0e6'?'#c4102a':'#ffffff';const ch=[...t],step=Math.min(110,470/ch.length);
  ch.forEach((c,k)=>vg4.fillText(c,x+64,y+30+step*(k+.5)));vg4.shadowBlur=0;});
const vsignTex=tex(vc4);
const RB_TXT=[['SURGE CITY','#ffd23f'],['ヒーロー NEWS','#5af0ff'],['NEO TOKYO 7','#ff5aa8'],['HERO TRIALS','#7dff8a']];
const [rc4,rg4]=cv(1024,256);rg4.fillStyle='#0a0a12';rg4.fillRect(0,0,1024,256);
RB_TXT.forEach(([t,col],i)=>{const x=(i%2)*512,y=Math.floor(i/2)*128;rg4.fillStyle='#14101e';rg4.fillRect(x+4,y+4,504,120);rg4.strokeStyle=col;rg4.lineWidth=6;rg4.shadowColor=col;rg4.shadowBlur=18;rg4.strokeRect(x+12,y+12,488,104);
  rg4.font="bold 64px 'Bebas Neue', "+JPF;rg4.textAlign='center';rg4.textBaseline='middle';rg4.fillStyle=col;rg4.fillText(t,x+256,y+66,460);rg4.shadowBlur=0;});
const roofTex=tex(rc4);
// lit shop-window atlas
const [wc4,wg4]=cv(512,512);
for(let i=0;i<4;i++){const x=(i%2)*256,y=Math.floor(i/2)*256;const gr=wg4.createLinearGradient(x,y,x,y+256);gr.addColorStop(0,['#ffd9a0','#bfe6ff','#ffc0d8','#d8ffd0'][i]);gr.addColorStop(1,'#3a2a1a');wg4.fillStyle=gr;wg4.fillRect(x,y,256,256);
  wg4.fillStyle='rgba(30,20,10,.55)';for(let k=0;k<3;k++)wg4.fillRect(x+10,y+70+k*60,236,8);for(let k=0;k<14;k++){wg4.fillStyle=`rgba(${rand(40,120)|0},${rand(30,90)|0},${rand(20,80)|0},.8)`;wg4.fillRect(x+rand(14,230),y+40+Math.floor(rand(0,3))*60,rand(8,22),rand(16,28));}
  wg4.fillStyle='#1a1c22';wg4.fillRect(x,y,256,10);wg4.fillRect(x,y+246,256,10);wg4.fillRect(x,y,10,256);wg4.fillRect(x+246,y,10,256);wg4.fillRect(x+124,y,8,256);
  wg4.fillStyle='rgba(255,255,255,.12)';wg4.beginPath();wg4.moveTo(x+30,y+10);wg4.lineTo(x+90,y+10);wg4.lineTo(x+40,y+246);wg4.lineTo(x+10,y+246);wg4.fill();}
const shopTex=tex(wc4);
{
  const ledges=[],plinths=[],signs=[],signPick=[],wins=[],winPick=[],awn=[],awnCol=[];
  const AWN=[0xb83a3a,0x2a6ab8,0x2a8a5a,0xd8a030,0x6a3aa8,0x303038];
  BLDG.forEach(b=>{const w=b.x1-b.x0,d=b.z1-b.z0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;
    for(let y=12;y<b.h-5;y+=12)ledges.push([cx,y,cz,w+.42,.3,d+.42]);
    // a shop sign and an awning over each door
    b.doors.forEach(o=>{if(o.len<8||srnd()>(b.kind==='mall'||b.kind==='konbini'?1:.75))return;const rot=o.nx?(o.nx>0?Math.PI/2:-Math.PI/2):(o.nz>0?0:Math.PI);const px=o.x+o.nx*.3,pz=o.z+o.nz*.3,ww=Math.min(o.len-2,DOOR_W+2.4);
      signs.push([px+o.nx*.1,4.35,pz+o.nz*.1,ww*.8,.8,1,rot]);const SR=(BKIND[b.kind]||BKIND.shop).sign;signPick.push(SR[0]+Math.floor(srnd()*(SR[1]-SR[0]+1)));
      awn.push([px+o.nx*.6,3.55,pz+o.nz*.6,o.nz!==0?DOOR_W+1:1.15,.12,o.nz!==0?1.15:DOOR_W+1,0]);awnCol.push(AWN[Math.floor(srnd()*AWN.length)]);});});
  const conc=new THREE.MeshStandardMaterial({color:0x5c5e66,roughness:.8,metalness:.1});
  inst(new THREE.BoxGeometry(1,1,1),conc,ledges,true);inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x3a3c44,roughness:.7}),plinths,false);
  atlasInst(shopTex,2,2,1.15,wins,winPick);atlasInst(signTex,4,6,1.7,signs,signPick);
  // vertical signs stick out from the wall so you can read them down the street
  atlasInst(vsignTex,8,2,1.6,VSIGN.map(v=>[v[0],v[1],v[2],v[3],v[4],1,v[6]+Math.PI/2]),VSIGN.map(()=>Math.floor(srnd()*16)));
  atlasInst(roofTex,2,2,1.8,ROOFSIGN,ROOFSIGN.map(()=>Math.floor(srnd()*4)));
  {const legs=[];ROOFSIGN.forEach(r=>{const c=Math.cos(r[6]),sn=Math.sin(r[6]);[-1,1].forEach(k=>legs.push([r[0]+k*r[3]*.4*c,r[1]-2.6,r[2]-k*r[3]*.4*sn,.2,2.2,.2]));});
    inst(new THREE.BoxGeometry(1,1,1),railMat,legs,true);}
  // red paper lanterns
  inst(new THREE.SphereGeometry(.32,14,10),lanternMat,LANTERNS.map(l=>[l[0],l[1],l[2],1,1.35,1]),false);
  // vending machines on the sidewalks
  {const body=[],bodyCol=[],front=[];BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{for(let k=0;k<2;k++){if(srnd()<.35)continue;const nx=[1,-1,0,0][Math.floor(srnd()*4)],nz=nx?0:(srnd()<.5?1:-1);
      const along=sr(-13,13),x=cx+nx*15.4+(nz?along:0),z=cz+nz*15.4+(nx?along:0);if(insideBld(x,z,.9))continue;
      const rot=nx?(nx>0?Math.PI/2:-Math.PI/2):(nz>0?0:Math.PI);body.push([x,.95,z,nz?1.1:.8,1.9,nz?.8:1.1]);bodyCol.push([0xe8e8ee,0xc4202a,0x2a5ad8,0x1a8a4a][Math.floor(srnd()*4)]);
      front.push([x+nx*.41,1.2,z+nz*.41,nz?.9:.04,1.1,nz?.04:.9]);solids.push({x,z,r:.6});}}));
    inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4,metalness:.2}),body,true,bodyCol);inst(new THREE.BoxGeometry(1,1,1),machineMat,front,false);}
  // utility poles and the tangle of wires over the side streets
  {const poles=[],P=[];INNER.forEach(a=>{for(let t=-BOUND+6;t<BOUND-6;t+=16){if(ROADS.some(r=>Math.abs(t-r)<9))continue;const x=a-8.9,z=t;if(insideBld(x,z,.5))continue;poles.push([x,4.6,z,1,1,1]);P.push([x,z]);solids.push({x,z,r:.3});}});
    inst(new THREE.CylinderGeometry(.13,.17,9.2,10),new THREE.MeshStandardMaterial({color:0x8a8a84,roughness:.85}),poles,true);
    inst(new THREE.BoxGeometry(1.6,.12,.12),blackMat,poles.map(p=>[p[0],8.6,p[2],1,1,1]),false);
    const pts=[];for(let i=0;i+1<P.length;i++){const [x0,z0]=P[i],[x1,z1]=P[i+1];if(x0!==x1||Math.abs(z1-z0)>17)continue;
      for(const [o,h] of [[-.6,8.6],[.6,8.6],[0,8.1]])for(let k=0;k<6;k++){const u0=k/6,u1=(k+1)/6,s0=Math.sin(u0*Math.PI)*.6,s1=Math.sin(u1*Math.PI)*.6;pts.push(x0+o,h-s0,lerp(z0,z1,u0),x0+o,h-s1,lerp(z0,z1,u1));}}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));world.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x111114})));}
  inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}),awn,true,awnCol);
  // curbs along every block edge
  const curbs=[];BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{curbs.push([cx+17,.08,cz,.36,.16,34.4],[cx-17,.08,cz,.36,.16,34.4],[cx,.08,cz+17,34.4,.16,.36],[cx,.08,cz-17,34.4,.16,.36]);}));
  inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x9a9ca2,roughness:.85}),curbs,false);
  // bins, hydrants, benches on the sidewalks
  const bins=[],hyd=[],seats=[],backs=[];
  BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{[[1,0],[-1,0],[0,1],[0,-1]].forEach(([nx,nz])=>{
    const along=sr(-12,12),x=cx+nx*15.6+(nz?along:0),z=cz+nz*15.6+(nx?along:0);if(insideBld(x,z,.8))return;
    const r=srnd();if(r<.4)bins.push([x,.45,z,1,1,1]);else if(r<.65)hyd.push([x,.3,z,1,1,1]);
    else{const rot=nx?(nx>0?-Math.PI/2:Math.PI/2):(nz>0?Math.PI:0);seats.push([x,.45,z,1,1,1,rot]);backs.push([x-nx*.22,.75,z-nz*.22,1,1,1,rot]);}});}));
  inst(new THREE.CylinderGeometry(.28,.24,.9,20),new THREE.MeshStandardMaterial({color:0x1e3a2a,roughness:.5,metalness:.4}),bins,true);
  inst(new THREE.CylinderGeometry(.13,.16,.6,16),new THREE.MeshPhysicalMaterial({color:0xc8201a,roughness:.35,clearcoat:.8}),hyd,true);
  inst(new THREE.BoxGeometry(1.8,.08,.5),new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.7}),seats,true);
  inst(new THREE.BoxGeometry(1.8,.45,.07),new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.7}),backs,true);
  // traffic lights at the inner intersections
  const poles=[],arms=[],boxes=[],lamps=[],lampCol=[];
  INNER.forEach(a=>INNER.forEach(b=>{if(a===0&&b===0)return;[[1,1],[-1,-1]].forEach(([sx,sz],k)=>{const x=a+sx*8.4,z=b+sz*8.4;if(insideBld(x,z,.5))return;
    poles.push([x,2.6,z,1,1,1]);const rot=k?Math.PI:0;arms.push([x-sx*1.6,5.1,z,3.2,.14,.14]);
    const hx=x-sx*3,hz=z;boxes.push([hx,4.6,hz,.36,1,.32]);const lit=srnd()<.5?0:2;
    for(let q=0;q<3;q++){lamps.push([hx,4.95-q*.32,hz+sz*.17,1,1,1]);lampCol.push(q===lit?(q===0?0xff3020:0x30ff70):0x1a1a1a);}
    solids.push({x,z,r:.3});});}));
  const dk=new THREE.MeshStandardMaterial({color:0x22242a,metalness:.6,roughness:.4});
  inst(new THREE.CylinderGeometry(.09,.12,5.2,12),dk,poles,true);inst(new THREE.BoxGeometry(1,1,1),dk,arms,true);inst(new THREE.BoxGeometry(1,1,1),dk,boxes,true);
  const lm=new THREE.MeshBasicMaterial({color:0xffffff});lm.color.setScalar(2.2);inst(new THREE.SphereGeometry(.1,12,10),lm,lamps,false,lampCol);
  // manhole covers
  const mh=[];for(let i=0;i<26;i++){const a=INNER[Math.floor(srnd()*INNER.length)],t=sr(-BOUND+2,BOUND-2),lane=srnd()<.5?-3.5:3.5;if(srnd()<.5)mh.push([t,.04,a+lane,1,1,1]);else mh.push([a+lane,.04,t,1,1,1]);}
  inst(new THREE.CylinderGeometry(.55,.55,.04,28),new THREE.MeshStandardMaterial({color:0x2a2a2e,metalness:.7,roughness:.45}),mh,false);
}
// everything the city added to the scene, so practice mode can swap it for the training ground
const CITY=scene.children.filter(o=>!PRE_WORLD.has(o));
