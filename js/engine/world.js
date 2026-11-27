/* The city map: roads, buildings, interiors, colliders (floorAt / pushOutBld), street props */
/* ================= WORLD (seeded, identical for all players) ================= */
const PRE_WORLD=new Set(scene.children);
const world=new THREE.Group();scene.add(world);
// a road every 48 m; blocks between them (16 x 16 of them since the city grew)
const NBLK=Math.round((BOUND+6)/24);const ROADS=[],BLOCKS=[];for(let i=-NBLK/2;i<=NBLK/2;i++)ROADS.push(i*48);for(let i=0;i<NBLK;i++)BLOCKS.push(-NBLK*24+24+i*48);
const RW=14,INNER=ROADS.slice(1,-1);
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
// ugBase (station.js) gives the ground under the street: the station / tunnel floor, and no street where the stairwell is cut;
// RAMPS (mall.js) are sloped floors: stairs and escalators. Both are no-ops until something is registered.
let ugBase=null;
function floorAt(x,z,y){let g=ugBase?ugBase(x,z,y):0;for(const b of bgNear(x,z)){if(b.h>g&&b.h<=y&&x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&b.top)g=b.h;}
  if(world.visible)for(let i=0;i<RAMPS.length;i++){const r=RAMPS[i];if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1){const h=rampY(r,x,z);if(h<=y+.6&&h>g)g=h;}}return g;}
function pushOutBld(p,r,tall){tall=tall||1.7;let hit=null;for(const b of bgList(p.x,p.z,r)){if(p.y>=b.h||p.y+tall<=(b.y0||0))continue;
  if(b.top&&tall>1&&b.h-p.y<=.55&&p.x>b.x0-r&&p.x<b.x1+r&&p.z>b.z0-r&&p.z<b.z1+r&&!insideBld(p.x,p.z,r*.5,b.h+.9)){p.y=b.h;continue;}const x0=b.x0-r,x1=b.x1+r,z0=b.z0-r,z1=b.z1+r;
  if(p.y<(b.y0||0)&&p.x>b.x0&&p.x<b.x1&&p.z>b.z0&&p.z<b.z1){p.y=b.y0-tall;if(!hit)hit={b,ceil:true};continue;}
  if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1){const dl=p.x-x0,dr=x1-p.x,dn=p.z-z0,df=z1-p.z,m=Math.min(dl,dr,dn,df);
    if(m===dl)p.x=x0;else if(m===dr)p.x=x1;else if(m===dn)p.z=z0;else p.z=z1;hit={b,ax:(m===dl||m===dr)?'x':'z',s:(m===dl||m===dn)?-1:1};}}return hit;}
// fast things (projectiles) can cover more than a thin wall's thickness in one frame: check the stretch they just flew
// through, not only where they ended up. On a hit the thing is put back at the last clear spot (so it bursts on this side).
function segBld(p,v,dt,yo){yo=yo||0;const sx=v.x*dt,sy=v.y*dt,sz=v.z*dt,L=Math.hypot(sx,sz);
  if(L>.3){const n=Math.min(16,Math.ceil(L/.25)),ox=p.x-sx,oy=p.y-sy,oz=p.z-sz;for(let i=1;i<n;i++){const k=i/n;if(insideBld(ox+sx*k,oz+sz*k,0,oy+sy*k+yo)){const b=(i-1)/n;p.x=ox+sx*b;p.y=oy+sy*b;p.z=oz+sz*b;return true;}}}
  return !!insideBld(p.x,p.z,0,p.y+yo);}
function rayBld(from,to,steps){const d=TMP3.subVectors(to,from);for(let i=1;i<=steps;i++){const k=i/steps;const x=from.x+d.x*k,y=from.y+d.y*k,z=from.z+d.z*k;if(insideBld(x,z,.3,y))return (i-1)/steps;
  for(const s of solidsNear(x,z))if(s.tree){const dx=x-s.x,dy=y-3.9,dz=z-s.z;if(dx*dx+dy*dy*1.4+dz*dz<6.2)return (i-1)/steps;}}return 1;}

// ground, road, crossing and window textures: see citytex.js
function textTex(lines,w,h,col,bg){const [c,g]=cv(w,h);g.fillStyle=bg||'rgba(0,0,0,0)';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
  lines.forEach(([t,size,y,cl])=>{g.font=`${size}px 'Bebas Neue', Impact, sans-serif`;g.fillStyle=cl||col;g.shadowColor=cl||col;g.shadowBlur=18;g.fillText(t,w/2,y);});return tex(c);}

// ground
const cT=concreteTex();const ground=new THREE.Mesh(new THREE.PlaneGeometry(BOUND*2+160,BOUND*2+160),new THREE.MeshStandardMaterial({map:cT,normalMap:cT.userData.normal,normalScale:new THREE.Vector2(.75,.75),roughnessMap:cT.userData.rough,roughness:1,metalness:.04,envMapIntensity:.6}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);
const outer=new THREE.Mesh(new THREE.PlaneGeometry(BOUND*2+700,BOUND*2+700),new THREE.MeshStandardMaterial({color:0x25262a,roughness:.9}));
outer.rotation.x=-Math.PI/2;outer.position.y=-.03;world.add(outer);
const ROADL=BOUND*2+30;const rT=roadTex();rT.repeat.set(ROADL/14,1);
rT.userData.rough.repeat.set(ROADL/14,1);rT.userData.normal.repeat.set(ROADL/14,1);
const roadMat=new THREE.MeshStandardMaterial({map:rT,roughnessMap:rT.userData.rough,normalMap:rT.userData.normal,normalScale:new THREE.Vector2(.7,.7),roughness:1,metalness:.1,envMapIntensity:1.1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
const xMk=t=>new THREE.MeshStandardMaterial({map:t,normalMap:t.userData.normal,normalScale:new THREE.Vector2(.7,.7),roughnessMap:t.userData.rough,roughness:1,metalness:.1,envMapIntensity:1.1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const xMat=xMk(crossTex(false)),xMatC=xMk(crossTex(true));
// buildings
const WT=[windowTex('#4a4e5c',.35,null,'panel'),windowTex('#6b5a4c',.3,'#ffc27a','brick'),windowTex('#2f3a44',.45,'#a8e1ff','band'),windowTex('#5a5f66',.25,null,'tall')];
const bmats=WT.map(([m,e,r,n])=>new THREE.MeshStandardMaterial({map:m,emissiveMap:e,emissive:0xffffff,emissiveIntensity:1.35,roughnessMap:r,metalnessMap:r,normalMap:n,normalScale:new THREE.Vector2(.9,.9),roughness:1,metalness:1,envMapIntensity:1.2}));
const RFT=ctRoofTex(),roofMat=new THREE.MeshStandardMaterial({map:RFT.map,normalMap:RFT.normal,roughnessMap:RFT.orm,roughness:1,metalness:.02});
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
  if(K.balcony){const nx=srnd()<.5?1:0,face=srnd()<.5?1:-1;for(let y=FH+3;y<h-1;y+=3.2){if(nx){mBox(trimMat,.9,.18,d-1,x+face*(w/2+.45),y,z,-4);mBox(railMat,.06,.9,d-1,x+face*(w/2+.88),y+.5,z);}
      else{mBox(trimMat,w-1,.18,.9,x,y,z+face*(d/2+.45),-4);mBox(railMat,w-1,.9,.06,x,y+.5,z+face*(d/2+.88));}}}
  B.doors.forEach(o=>{const along=o.nz!==0;
    if(K.noren){const nm=pick(norenMats);mBox(nm,along?DOOR_W:.04,1.1,along?.04:DOOR_W,o.x+o.nx*.08,DOOR_H-.55,o.z+o.nz*.08);}
    if(K.lantern)[-1,1].forEach(sd=>LANTERNS.push([o.x+o.nx*.5+(along?sd*(DOOR_W/2+.5):0),DOOR_H-.2,o.z+o.nz*.5+(along?0:sd*(DOOR_W/2+.5))]));});
  for(let i=0;i<(K.vs||0);i++){const o=B.doors[Math.floor(srnd()*4)],along=o.nz!==0,len=along?w:d,sd=srnd()<.5?-1:1,off=sd*(len/2-.6);
    const sh=Math.min(h-FH-1,sr(6,11));if(sh<3)continue;const sx=along?x+off:o.x+o.nx*.9,sz=along?o.z+o.nz*.9:z+off;
    VSIGN.push([sx,FH+1+sh/2+i*.2,sz,1.1,sh,1,o.nx?(o.nx>0?Math.PI/2:-Math.PI/2):(o.nz>0?0:Math.PI)]);}
  if((K.roof||(h>30&&srnd()<.35))&&w>10){const along=srnd()<.5;ROOFSIGN.push([x,h+3.2,z+(along?0:0),Math.min(w,16),4.4,1,along?0:Math.PI/2]);}}
// --- merged city geometry: every box of a material becomes one mesh, so a big city stays a few draw calls ---
const MGEO=new Map(),MGEO_FAR=new Map();let MG_FAR=false;
// merged meshes are split into CHUNK x CHUNK m pieces so the camera / shadow frustums can skip whole parts of the (big) city,
// and pieces further than CULL_D are hidden (the skyline ring is merged separately and never culled)
const CHUNK=192,CULL_D=470,CITY_CHUNKS=[];
function boxUV(g,tw,th){const uv=g.attributes.uv,pa=g.parameters;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);let u=uv.getX(i),v=uv.getY(i);
  if(f===2||f===3){u=.02;v=.02;}else{const fw=f<2?pa.depth:pa.width;u*=Math.max(1,Math.round(fw/tw));v*=Math.max(1,Math.round(pa.height/th));}uv.setXY(i,u,v);}}
// tw<0: world-scale UVs, one texture tile per -tw metres on every face (roofs, concrete, stone)
function boxUVW(g,s){const uv=g.attributes.uv,pa=g.parameters;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);const fw=f<2?pa.depth:pa.width,fh=(f===2||f===3)?pa.depth:pa.height;uv.setXY(i,uv.getX(i)*fw/s,uv.getY(i)*fh/s);}}
function mGeo(mat,g){const M=MG_FAR?MGEO_FAR:MGEO;let L=M.get(mat);if(!L)M.set(mat,L=[]);L.push(g);}
function mBox(mat,w,h,d,x,y,z,tw,th){const g=new THREE.BoxGeometry(w,h,d);if(tw>0)boxUV(g,tw,th);else if(tw<0)boxUVW(g,-tw);g.translate(x,y,z);mGeo(mat,g);}
function mergeList(mat,L,far){let nv=0,ni=0;L.forEach(g=>{if(!g.index){const n=g.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;g.setIndex(new THREE.BufferAttribute(ix,1));}nv+=g.attributes.position.count;ni+=g.index.count;});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=new Uint32Array(ni),CL=L[0].attributes.color?new Float32Array(nv*3):null;let ov=0,oi=0;
  L.forEach(g=>{P.set(g.attributes.position.array,ov*3);N.set(g.attributes.normal.array,ov*3);U.set(g.attributes.uv.array,ov*2);if(CL&&g.attributes.color)CL.set(g.attributes.color.array,ov*3);const ix=g.index.array;for(let k=0;k<ix.length;k++)I[oi+k]=ix[k]+ov;ov+=g.attributes.position.count;oi+=ix.length;g.dispose();});
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('uv',new THREE.BufferAttribute(U,2));G.setIndex(new THREE.BufferAttribute(I,1));if(CL)G.setAttribute('color',new THREE.BufferAttribute(CL,3));G.computeBoundingSphere();
  const m=new THREE.Mesh(G,mat);m.castShadow=!mat.userData.noShadow;m.receiveShadow=true;world.add(m);if(!far)CITY_CHUNKS.push(m);return m;}
function mergeCity(){for(const [mat,L] of MGEO){const B=new Map();for(const g of L){const p=g.attributes.position.array,n=p.length/3;let sx=0,sz=0;for(let i=0;i<p.length;i+=3){sx+=p[i];sz+=p[i+2];}
      const k=Math.floor(sx/n/CHUNK)*1000+Math.floor(sz/n/CHUNK);let a=B.get(k);if(!a)B.set(k,a=[]);a.push(g);}
    for(const a of B.values())mergeList(mat,a,false);}
  for(const [mat,L] of MGEO_FAR)mergeList(mat,L,true);MGEO.clear();MGEO_FAR.clear();}
let _ccT=0;onEv('frame',dt=>{if((_ccT-=dt)>0)return;_ccT=.2;const c=camera.position;for(const m of CITY_CHUNKS){const s=m.geometry.boundingSphere;m.visible=Math.hypot(s.center.x-c.x,s.center.z-c.z)-s.radius<CULL_D;}});
// round colliders (trees, poles, lamps...) on a grid too, so physics / NPCs / camera rays only look at nearby ones
const SOLG_CELL=16;let SOLG=null,SOLG_N=-1,SOLG_F=null;
function solidsNear(x,z){if(!SOLG||SOLG_N!==solids.length||SOLG_F!==solids[0]){SOLG=new Map();SOLG_N=solids.length;SOLG_F=solids[0];for(const s of solids){const e=s.r+1.2,c0=Math.floor((s.x-e)/SOLG_CELL),c1=Math.floor((s.x+e)/SOLG_CELL),r0=Math.floor((s.z-e)/SOLG_CELL),r1=Math.floor((s.z+e)/SOLG_CELL);
    for(let i=c0;i<=c1;i++)for(let j=r0;j<=r1;j++){const k=i*1000+j;let L=SOLG.get(k);if(!L)SOLG.set(k,L=[]);L.push(s);}}}
  return SOLG.get(Math.floor(x/SOLG_CELL)*1000+Math.floor(z/SOLG_CELL))||BG_EMPTY;}
// storefront (ground floor walls), interior floor, ceiling light panels
const SFT=ctStoreTex(),shopMat=new THREE.MeshStandardMaterial({map:SFT.map,emissiveMap:SFT.emissiveMap,emissive:0xffffff,emissiveIntensity:.6,normalMap:SFT.normal,roughnessMap:SFT.orm,metalnessMap:SFT.orm,roughness:1,metalness:1,envMapIntensity:1.3});
const FLT=ctFloorTex(),floorMat=new THREE.MeshStandardMaterial({map:FLT.map,normalMap:FLT.normal,roughnessMap:FLT.orm,roughness:1,metalness:.1});floorMat.userData.noShadow=true;
const ceilMat=new THREE.MeshStandardMaterial({color:0x3a3c42,roughness:.9});
const panelMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2dd,emissiveIntensity:2.2});panelMat.userData.noShadow=true;
// precast concrete for trims, parapets and stair housings; lighter stone for copings and cornices
const TRT=ctConcTex('#5a5c63'),CPT=ctConcTex('#8e8c88');
const trimMat=new THREE.MeshStandardMaterial({map:TRT.map,normalMap:TRT.normal,roughnessMap:TRT.orm,roughness:1,metalness:.05});
const capMat=new THREE.MeshStandardMaterial({map:CPT.map,normalMap:CPT.normal,roughnessMap:CPT.orm,roughness:1,metalness:.05});
const finMat=new THREE.MeshStandardMaterial({color:0x2c3138,metalness:.85,roughness:.32,envMapIntensity:1.3});
const pipeMat=new THREE.MeshStandardMaterial({color:0x6a6c70,metalness:.55,roughness:.45});
const ACT=ctAcTex(),acMat=new THREE.MeshStandardMaterial({map:ACT.map,normalMap:ACT.normal,roughness:.55,metalness:.15});
const tankMats=[0xb8bec4,0x6a9ac0,0xd8d4c8].map(c=>new THREE.MeshStandardMaterial({color:c,metalness:.35,roughness:.4}));
const crownMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xdff2ff,emissiveIntensity:1.6});crownMat.userData.noShadow=true;
const furnMats=[0x5a3a24,0x2a3a5a,0x6a6a72,0x3a5a3a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.7}));
const FH=5.2,DOOR_H=3.4,DOOR_W=3.6,WALL_T=.5;   // ground floor height, door size, wall thickness
const INTERIOR=[];  // spots for breakable crates inside buildings
// ---------- Japanese city: building kinds ----------
const JPF="'Noto Sans JP','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic','Meiryo','MS Gothic',sans-serif";
// facMat and the facade materials (glassFac, aptFac, shopFacs, woodFac, woodGF, konbiniFac/GF, pachiFac, mallFac/GF) live in citytex.js
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
  if(!collide){mBox(bm,w,h,d,x,h/2,z,8,12);mBox(roofMat,w+.6,.6,d+.6,x,h+.3,z,-6);skyDetail(x,z,w,d,h,bm);return;}
  // upper floors: solid, with a roof you can stand on
  const uh=h-FH;mBox(bm,w,uh,d,x,FH+uh/2,z,8,12);mBox(roofMat,w+.6,.6,d+.6,x,h+.3,z,-6);mBox(trimMat,w+.4,.5,d+.4,x,FH+.25,z,-4);mBox(ceilMat,w-.2,.1,d-.2,x,FH-.05,z);
  BLD.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:FH,h:h+.6,top:true});
  // ground floor: four walls, each with a door you can walk through
  const doors=[];
  [[0,-1,w],[0,1,w],[-1,0,d],[1,0,d]].forEach(([nx,nz,len])=>{const off=sr(-1,1)*Math.max(0,len/2-DOOR_W/2-2.5);const cx=x+nx*(w/2-WALL_T/2),cz=z+nz*(d/2-WALL_T/2),along=nz!==0;
    const seg=(u0,u1,y0,y1)=>{if(u1-u0<.05)return;const uc=(u0+u1)/2,ul=u1-u0,bx=along?x+uc:cx,bz=along?cz:z+uc,sx=along?ul:WALL_T,sz=along?WALL_T:ul;
      if(y0>0)mBox(trimMat,sx,y1-y0,sz,bx,(y0+y1)/2,bz,-4);else mBox(gfm,sx,y1-y0,sz,bx,(y0+y1)/2,bz,4,FH);BLD.push({x0:bx-sx/2,x1:bx+sx/2,z0:bz-sz/2,z1:bz+sz/2,y0,h:y1});};
    seg(-len/2,off-DOOR_W/2,0,FH);seg(off+DOOR_W/2,len/2,0,FH);seg(off-DOOR_W/2,off+DOOR_W/2,DOOR_H,FH);
    doors.push({nx,nz,x:along?x+off:x+nx*w/2,z:along?z+nz*d/2:z+off,len});});
  // inside: tiled floor, ceiling lights, some furniture and crates
  mBox(floorMat,w-WALL_T*2,.04,d-WALL_T*2,x,.03,z,-2.4);
  const nl=Math.max(1,Math.round(w/8))*Math.max(1,Math.round(d/8));for(let i=0;i<Math.min(nl,6);i++)mBox(panelMat,1.8,.06,.7,x+sr(-w/3,w/3),FH-.14,z+sr(-d/3,d/3));
  furnish(x,z,w,d,K.furn);
  if(K.furn!=='mall')INTERIOR.push([x+sr(-w/4,w/4),z+sr(-d/4,d/4)]);
  const B={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h:h+.6,doors,kind:kind||'shop'};BLDG.push(B);const nSign=ROOFSIGN.length;dressBuilding(B,K,x,z,w,d,h);bldDetail(x,z,w,d,h,kind||'shop',ROOFSIGN.length>nSign);
  if(srnd()<.35){const ah=sr(4,10);const a=new THREE.CylinderGeometry(.08,.12,ah,6);a.translate(x,h+ah/2,z);mGeo(pipeMat,a);
    const l=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:0xff2a2a}));l.position.set(x,h+ah,z);world.add(l);blinkers.push([l,srnd()*6]);}
  if(srnd()<.6){const bw=sr(1.5,3),bh=sr(1,2),bd=sr(1.5,3);mBox(trimMat,bw,bh,bd,x+sr(-w/3,w/3),h+.6+bh/2,z+sr(-d/3,d/3),-4);}
}
// --- architectural detail on every building, merged into the per-material meshes so it adds no draw calls ---
// per-building numbers from a position hash, so the seeded city RNG (and the street layout) stays exactly as it was
function bHash(x,z,k){let h=Math.imul(Math.round(x*16)|0,0x27d4eb2d)^Math.imul(Math.round(z*16)|0,0x165667b1)^Math.imul((k|0)+1,0x9e3779b1);
  h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return ((h^(h>>>16))>>>0)/4294967296;}
const WOODK={ramen:1,izakaya:1,sushi:1};
function bldDetail(x,z,w,d,h,kind,roofSign){const R=k=>bHash(x,z,k),top=h+.6,uh=h-FH;
  // a drainpipe down one corner
  {const cx=R(5)<.5?-1:1,cz=R(6)<.5?-1:1;mBox(pipeMat,.16,h,.16,x+cx*(w/2+.12),h/2,z+cz*(d/2-.9));for(let y=1.5;y<h;y+=3)mBox(pipeMat,.26,.1,.26,x+cx*(w/2+.12),y,z+cz*(d/2-.9));}
  if(WOODK[kind]){// tiled eaves instead of a parapet
    mBox(blackMat,w+1.6,.26,d+1.6,x,top+.13,z);mBox(blackMat,w+1.1,.3,d+1.1,x,top+.41,z);mBox(blackMat,w+.5,.22,d+.5,x,top+.67,z);mBox(blackMat,w+2,.16,d+2,x,FH+.6,z);return;}
  // cornice: two stepped ledges under the roof edge
  [[.9,.34,-.15],[.5,.24,-.5]].forEach(([o,t,y])=>{const dp=o/2+.4;[[0,-1],[0,1],[-1,0],[1,0]].forEach(([nx,nz])=>{const al=nz!==0;
    mBox(capMat,al?w+o:dp,t,al?dp:d+o-dp*2,x+nx*(w/2+o/2-dp/2),h+y,z+nz*(d/2+o/2-dp/2),-4);});});
  // parapet with a coping stone (low enough to step over)
  const pt=.3,ph=.7;[[0,-1],[0,1],[-1,0],[1,0]].forEach(([nx,nz])=>{const al=nz!==0,len=al?w+.6:d+.6-pt*2,px=x+nx*(w/2+.3-pt/2),pz=z+nz*(d/2+.3-pt/2);
    mBox(trimMat,al?len:pt,ph,al?pt:len,px,top+ph/2,pz,-4);mBox(capMat,al?len+.08:pt+.14,.1,al?pt+.14:len+.08,px,top+ph+.05,pz,-4);});
  if(kind==='office'){// dark aluminium fins on every other mullion line, and a lit crown band
    const tw=w/Math.max(1,Math.round(w/8)),td=d/Math.max(1,Math.round(d/8));
    for(let u=-w/2;u<=w/2+.01;u+=tw/2)[-1,1].forEach(sg=>mBox(finMat,.22,uh,.5,x+u,FH+uh/2,z+sg*(d/2+.25)));
    for(let u=-d/2;u<=d/2+.01;u+=td/2)[-1,1].forEach(sg=>mBox(finMat,.5,uh,.22,x+sg*(w/2+.25),FH+uh/2,z+u));
    mBox(crownMat,w+.25,.16,d+.25,x,h-1.1,z);}
  else if(uh>5)[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>mBox(trimMat,.8,uh,.8,x+sx*(w/2-.25),FH+uh/2,z+sz*(d/2-.25),-4));
  if(kind==='apartment'){// condensers hung outside the flats
    [[0,1],[0,-1],[1,0],[-1,0]].forEach(([nx,nz],fi)=>{if(R(20+fi)<.25)return;const al=nz!==0,len=al?w:d;
      for(let y=FH+1.3,f=0;y<h-2;y+=3.2,f++)for(let k=0;k<2;k++){if(R(100+fi*40+f*3+k)<.4)continue;const u=(k?.27:-.27)*len+(R(300+fi*40+f*3+k)-.5)*len*.16;
        mBox(acMat,al?.9:.36,.62,al?.36:.9,x+(al?u:nx*(w/2+.18)),y,z+(al?nz*(d/2+.18):u));mBox(pipeMat,al?.5:.08,.08,al?.08:.5,x+(al?u-.5:nx*(w/2+.05)),y+.2,z+(al?nz*(d/2+.05):u-.5));}});}
  if(h<12||w<8||d<8)return;
  // rooftop plant: a stair housing you can stand on, a row of condensers, a water tank on a steel stand, pipe runs
  const sgx=R(1)<.5?-1:1,sgz=R(2)<.5?-1:1,sw=3.4,sd=4,shh=2.8,sx=x+sgx*(w/2-3),sz=z+sgz*(d/2-3.2);
  if(!roofSign){mBox(trimMat,sw,shh,sd,sx,top+shh/2,sz,-4);mBox(capMat,sw+.4,.22,sd+.4,sx,top+shh+.11,sz,-4);mBox(blackMat,.08,2.1,1.1,sx-sgx*(sw/2+.03),top+1.05,sz);
    mBox(crownMat,.08,.12,.4,sx-sgx*(sw/2+.06),top+2.35,sz);BLD.push({x0:sx-sw/2,x1:sx+sw/2,z0:sz-sd/2,z1:sz+sd/2,y0:top,h:top+shh+.22,top:true});}
  const n=2+Math.floor(R(3)*4),az=z-sgz*(d/2-1.7);for(let i=0;i<n;i++){const ax=x+(i-(n-1)/2)*1.5;if(Math.abs(ax-x)>w/2-1.2)continue;mBox(acMat,1.2,1,.85,ax,top+.64,az);mBox(railMat,1.4,.12,1.05,ax,top+.07,az);}
  if(R(4)<.6&&w>9&&d>9&&!roofSign){const tx=x-sgx*(w/2-2.4),tz=sz,tm=tankMats[Math.floor(R(9)*3)];
    [[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].forEach(([a,b])=>mBox(railMat,.12,1.3,.12,tx+a,top+.65,tz+b));mBox(railMat,2.2,.1,2.2,tx,top+1.35,tz);
    const cy=new THREE.CylinderGeometry(1.02,1.02,2,18);cy.translate(tx,top+2.4,tz);mGeo(tm,cy);const lid=new THREE.ConeGeometry(1.06,.4,18);lid.translate(tx,top+3.6,tz);mGeo(tm,lid);
    [-.5,.5].forEach(o=>mBox(finMat,2.08,.06,.06,tx,top+2.4+o,tz+1.02));}
  {const px=x+(R(8)-.5)*w*.4,len=d*.6;mBox(pipeMat,.2,.2,len,px,top+.32,z);[-.4,0,.4].forEach(o=>mBox(railMat,.4,.22,.12,px,top+.11,z+o*len));}}
// background towers: a cornice, setback tiers and spires on the tall ones, plant boxes on the roof
function skyDetail(x,z,w,d,h,bm){const R=k=>bHash(x,z,k);let top=h+.6;mBox(capMat,w+.8,.45,d+.8,x,h-.25,z,-4);
  if(h>55&&R(1)<.75){const k=.6+R(2)*.22,h2=Math.max(8,h*(.15+R(3)*.2)),w2=w*k,d2=d*k;mBox(bm,w2,h2,d2,x,top+h2/2,z,8,12);top+=h2;
    mBox(roofMat,w2+.5,.5,d2+.5,x,top+.25,z,-6);mBox(capMat,w2+.7,.4,d2+.7,x,top-.2,z,-4);top+=.5;
    if(R(4)<.45){const sh=h*(.1+R(5)*.12);mBox(finMat,.45,sh,.45,x,top+sh/2,z);mBox(crownMat,.55,.55,.55,x,top+sh,z);}}
  const n=1+Math.floor(R(6)*3);for(let i=0;i<n;i++){const bw=2+R(10+i)*3,bd=2+R(20+i)*3,bh=1.2+R(30+i)*2.2;mBox(trimMat,bw,bh,bd,x+(R(40+i)-.5)*w*.5,top+bh/2,z+(R(50+i)-.5)*d*.5,-4);}}
// a small shrine: torii gates on the paths, a wooden hall with a climbable roof, stone lanterns
function shrine(cx,cz){const wood=woodFac;
  const torii=(x,z,rot)=>{const c=Math.cos(rot),sn=Math.sin(rot);[-1.8,1.8].forEach(o=>{const px=x+o*c,pz=z-o*sn;mBox(toriiMat,.42,5.2,.42,px,2.6,pz);solids.push({x:px,z:pz,r:.35});mBox(blackMat,.52,.5,.52,px,.25,pz);});
    const lw=rot?.5:5.4,ld=rot?5.4:.5;mBox(toriiMat,rot?.45:5.4,.38,rot?5.4:.45,x,4.3,z);mBox(blackMat,rot?.6:6.4,.3,rot?6.4:.6,x,5.25,z);mBox(toriiMat,rot?.7:6.2,.25,rot?6.2:.7,x,5.0,z);};
  torii(cx,cz+15,0);torii(cx,cz-15,0);torii(cx+15,cz,Math.PI/2);
  const hw=8,hd=6,hh=3.6;mBox(wood,hw,hh,hd,cx,hh/2+.6,cz,8,4);mBox(plazaMat,hw+1.4,.6,hd+1.4,cx,.3,cz);
  BLD.push({x0:cx-hw/2-.7,x1:cx+hw/2+.7,z0:cz-hd/2-.7,z1:cz+hd/2+.7,h:.6,top:true});BLD.push({x0:cx-hw/2,x1:cx+hw/2,z0:cz-hd/2,z1:cz+hd/2,h:hh+1.6,top:true});
  mBox(blackMat,hw+2.2,.4,hd+2.4,cx,hh+.8,cz);mBox(blackMat,hw+1,.6,hd*.6,cx,hh+1.3,cz);mBox(toriiMat,hw*.5,.5,.1,cx,hh-.2,cz+hd/2+.06);
  [[-4,11],[4,11],[-4,-11],[4,-11]].forEach(([ox,oz])=>{const x=cx+ox,z=cz+oz;mBox(plazaMat,.7,1.6,.7,x,.8,z);mBox(plazaMat,1.1,.3,1.1,x,1.75,z);LANTERNS.push([x,1.45,z]);solids.push({x,z,r:.5});});}
const PLAZAS=[[-24,24],[24,-24],[-72,-72],[72,72],[-120,120],[120,-120],[-216,-120],[216,120],[-312,24],[312,-24],[-120,-312],[120,312],[-264,264],[264,-264],[24,216],[-24,-216],[168,-312],[-168,312]],
  MALLS=[[72,-24],[-72,72],[216,-216],[-216,216],[-312,-168],[312,168]],SHRINES=[[-120,120],[120,-120],[-264,264],[264,-264]];
const STN=ctStoneTex(),plazaMat=new THREE.MeshStandardMaterial({map:STN.map,normalMap:STN.normal,roughness:.8});
const leafMats=[0x2f5a34,0x3a6a3a,0x24482a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.75}));
const leafGeo=(()=>{const g=new THREE.IcosahedronGeometry(1,2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new V3(p.getX(i),p.getY(i),p.getZ(i));v.multiplyScalar(1+(Math.sin(v.x*7)*Math.cos(v.y*6)*Math.sin(v.z*8))*.12);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;})();
const trunkMat=new THREE.MeshStandardMaterial({color:0x4a3626,roughness:.9});
const holoMats=[],PZ_HOLOS=[],PZ_HOLO=[addMat(0x7fe3ff,.7,.55),addMat(0x7fe3ff,.55,.45)];PZ_HOLO[0].wireframe=true;
onEv('frame',dt=>{const t=game.time;PZ_HOLO[0].opacity=.5+Math.sin(t*3.1)*.06;for(const h of PZ_HOLOS){h.rotation.y+=dt*.45;h.children[1].rotation.z+=dt*.8;h.children[0].rotation.x=Math.sin(t*.5)*.3;}});
BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{
  if(PLAZAS.some(p=>p[0]===cx&&p[1]===cz)){
    [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(([ox,oz])=>{const x=cx+ox,z=cz+oz;
      mBox(plazaMat,3.4,.8,3.4,x,.4,z);const tr=new THREE.CylinderGeometry(.18,.25,2.4,6);tr.translate(x,1.9,z);mGeo(trunkMat,tr);
      [[0,3.9,0,1.5],[.7,3.5,.3,1.05],[-.6,3.6,-.4,1.1],[.1,4.6,-.2,1.0],[-.2,3.3,.7,.95]].forEach(([dx,dy,dz,r],k)=>{const lf=leafGeo.clone();lf.scale(r,r,r);lf.rotateX(k);lf.rotateY(k*2);lf.translate(x+dx,dy,z+dz);mGeo(leafMats[k%3],lf);});
      solids.push({x,z,r:2,tree:true});});
    if(SHRINES.some(p=>p[0]===cx&&p[1]===cz)){shrine(cx,cz);return;}
    if(cx===-24&&cz===24)return;   // the station plaza: open paving in front of the SURGE LINE stairs (station.js adds its sign pylon)
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.9,1.1,6),plazaMat);ped.position.set(cx,.55,cz);ped.castShadow=ped.receiveShadow=true;world.add(ped);
    // a slowly turning wireframe globe with a ring, instead of the old solid glowing cone (it read as a white pyramid at night)
    const holo=new THREE.Group();holo.position.set(cx,3.2,cz);world.add(holo);
    holo.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,1),PZ_HOLO[0]));const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,.035,6,48),PZ_HOLO[1]);ring.rotation.x=Math.PI/2.4;holo.add(ring);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.06,24),PZ_HOLO[1]);base.position.y=-2.03;holo.add(base);PZ_HOLOS.push(holo);
    solids.push({x:cx,z:cz,r:3});
    return;}
  const kh=k=>{const r=BKIND[k].h;return sr(r[0],r[1]);};
  if(CLUBS.some(m=>m[0]===cx&&m[1]===cz)){clubBuilding(cx,cz);return;}
  if(MALLS.some(m=>m[0]===cx&&m[1]===cz)){mallBuilding(cx,cz);return;}
  if(srnd()<.36){const BK4=['office','office','apartment','dept'],k=BK4[Math.floor(srnd()*4)];const w=sr(18,26),d=sr(18,26);building(cx+sr(-2,2),cz+sr(-2,2),w,d,kh(k),true,k);}
  else{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([qx,qz])=>{if(srnd()<.22)return;const k=SMALL_KINDS[Math.floor(srnd()*SMALL_KINDS.length)];const s=k==='pencil'?sr(8,9.5):sr(9,12),s2=sr(9,12);building(cx+qx*7.6,cz+qz*7.6,s,s2,kh(k),true,k);});}
}));
// distant skyline (no collision)
MG_FAR=true;{const G=Math.ceil((BOUND+150)/26);for(let gx=-G;gx<=G;gx++)for(let gz=-G;gz<=G;gz++){const x=gx*26,z=gz*26,m=Math.max(Math.abs(x),Math.abs(z));if(m<BOUND+28||m>BOUND+150)continue;if(Math.abs(x)<10||Math.abs(z)<10)continue;
  if(srnd()<.25)continue;building(x+sr(-3,3),z+sr(-3,3),sr(14,20),sr(14,20),sr(30,120)*(m>BOUND+90?1.25:1),false);}}MG_FAR=false;

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
const LAMPS=[];INNER.forEach(a=>BLOCKS.forEach(t=>{LAMPS.push([a+8.3,t,-Math.PI/2],[t,a+8.3,Math.PI]);}));LAMPS.forEach(([x,z])=>solids.push({x,z,r:.35}));

/* ---- breakable props ---- */
const props=[];
const CRT=ctCrateTex(),crateMat=new THREE.MeshStandardMaterial({map:CRT.map,normalMap:CRT.normal,roughnessMap:CRT.orm,metalnessMap:CRT.orm,roughness:1,metalness:1});
const BRT=ctBarrierTex(),barMat=new THREE.MeshStandardMaterial({map:BRT.map,normalMap:BRT.normal,roughness:.7});
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
for(let i=0;i<Math.round(70*BLOCKS.length*BLOCKS.length/64);i++){const cx=BLOCKS[Math.floor(srnd()*BLOCKS.length)],cz=BLOCKS[Math.floor(srnd()*BLOCKS.length)];const x=cx+sr(-16,16),z=cz+sr(-16,16);
  const k=srnd();if(k<.5){addProp('crate',x,z,sr(0,3));if(srnd()<.6)addProp('crate',x+1.5,z+sr(-.4,.4),sr(0,3));}else if(k<.8)addProp('barrier',x,z,sr(0,3));else{addProp('cone',x,z);addProp('cone',x+.9,z+.7);}}
INTERIOR.forEach(([x,z])=>{if(srnd()<.7){addProp('crate',x,z,sr(0,3));if(srnd()<.5)addProp('crate',x+1.5,z+sr(-.4,.4),sr(0,3));}});
INNER.forEach(a=>INNER.forEach(b=>{if(srnd()<.5){addProp('barrier',a+sr(-4,4),b+9.5,0);}if(srnd()<.5){addProp('cone',a+9.5,b+sr(-4,4));addProp('cone',a+9.5,b+sr(-4,4));}}));
function resetProps(){props.forEach(p=>{p.broken=false;p.g.visible=true;});}
// props far from the camera aren't drawn (the city has hundreds of them now)
let _pcT=0;onEv('frame',dt=>{if((_pcT-=dt)>0)return;_pcT=.25;const c=camera.position;for(const p of props){const v=!p.broken&&Math.abs(p.x-c.x)<170&&Math.abs(p.z-c.z)<170;if(p.g.visible!==v)p.g.visible=v;}});

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
const MM=380,MMB=1800,MS=MMB/(MAPH*2);const mmBase=document.createElement('canvas');mmBase.width=mmBase.height=MMB;
{const g=mmBase.getContext('2d');g.fillStyle='#2b2d33';g.fillRect(0,0,MMB,MMB);g.fillStyle='#1c1d22';
  ROADS.forEach(a=>{g.fillRect(0,(a+MAPH-RW/2)*MS,MMB,RW*MS);g.fillRect((a+MAPH-RW/2)*MS,0,RW*MS,MMB);});
  g.fillStyle='#55596a';BLDG.forEach(b=>g.fillRect((b.x0+MAPH)*MS,(b.z0+MAPH)*MS,(b.x1-b.x0)*MS,(b.z1-b.z0)*MS));g.fillStyle='#8a8ea0';BLDG.forEach(b=>b.doors.forEach(o=>g.fillRect((o.x+MAPH)*MS-2,(o.z+MAPH)*MS-2,4,4)));
  g.fillStyle='#2f5a34';PLAZAS.forEach(([x,z])=>{g.beginPath();g.arc((x+MAPH)*MS,(z+MAPH)*MS,4*MS,0,7);g.fill();});
  g.strokeStyle='rgba(127,227,255,.6)';g.lineWidth=2;g.strokeRect((MAPH-BOUND)*MS,(MAPH-BOUND)*MS,BOUND*2*MS,BOUND*2*MS);}

/* ---- city dressing (instanced so hundreds of pieces cost only a few draw calls) ---- */
const _m4=new THREE.Matrix4(),_qq=new THREE.Quaternion(),_ss=new V3(),_pp=new V3(),_eu=new THREE.Euler();const _cc=new THREE.Color();
function inst(geo,mat,list,shadow,colors){if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length);
  list.forEach((t,i)=>{_pp.set(t[0],t[1],t[2]);_eu.set(0,t[6]||0,0);_qq.setFromEuler(_eu);_ss.set(t[3],t[4],t[5]);_m4.compose(_pp,_qq,_ss);im.setMatrixAt(i,_m4);if(colors)im.setColorAt(i,_cc.setHex(colors[i]));});
  im.castShadow=!!shadow;im.receiveShadow=true;im.frustumCulled=false;world.add(im);return im;}
function atlasMat(map,cols,rows,bright){const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:true,side:THREE.DoubleSide});m.color.setScalar(bright||1);
  m.onBeforeCompile=sh=>{sh.vertexShader='attribute vec2 aOff;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n\tvUv=vUv*vec2('+(1/cols).toFixed(5)+','+(1/rows).toFixed(5)+')+aOff;\n#endif');};
  m.customProgramCacheKey=()=>'atlas'+cols+'x'+rows;return m;}
function atlasInst(map,cols,rows,bright,list,pick){if(!list.length)return;const g=new THREE.PlaneGeometry(1,1);const off=new Float32Array(list.length*2);
  list.forEach((t,i)=>{const v=pick[i];off[i*2]=(v%cols)/cols;off[i*2+1]=1-(Math.floor(v/cols)+1)/rows;});g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));
  const im=new THREE.InstancedMesh(g,atlasMat(map,cols,rows,bright),list.length);
  list.forEach((t,i)=>{_pp.set(t[0],t[1],t[2]);_eu.set(0,t[6]||0,0);_qq.setFromEuler(_eu);_ss.set(t[3],t[4],1);_m4.compose(_pp,_qq,_ss);im.setMatrixAt(i,_m4);});im.frustumCulled=false;world.add(im);}
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
  // street lamps: six instanced parts for every lamp in the city
  {const at=(d,y)=>LAMPS.map(([x,z,r])=>[x+d*Math.sin(r),y,z+d*Math.cos(r),1,1,1,r]);
    inst(lampPole,lampMat,at(0,3.5),true);inst(lampArm,lampMat,at(.8,6.9),false);inst(lampHead,lampMat,at(1.6,6.85),true);inst(lampBulb,bulbMat,at(1.6,6.74),false);
    inst(lampCone,lampConeMat,at(1.6,3.4),false);const pg=lampPool.clone();pg.rotateX(-Math.PI/2);inst(pg,lampPoolMat,at(1.6,.06),false);}
  inst(new THREE.SphereGeometry(.32,14,10),lanternMat,LANTERNS.map(l=>[l[0],l[1],l[2],1,1.35,1]),false);
  // vending machines on the sidewalks
  {const body=[],bodyCol=[],front=[];BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{for(let k=0;k<2;k++){if(srnd()<.35)continue;const nx=[1,-1,0,0][Math.floor(srnd()*4)],nz=nx?0:(srnd()<.5?1:-1);
      const along=sr(-13,13),x=cx+nx*15.4+(nz?along:0),z=cz+nz*15.4+(nx?along:0);if(insideBld(x,z,.9))continue;
      const rot=nx?(nx>0?Math.PI/2:-Math.PI/2):(nz>0?0:Math.PI);body.push([x,.95,z,nz?1.1:.8,1.9,nz?.8:1.1]);bodyCol.push([0xe8e8ee,0xc4202a,0x2a5ad8,0x1a8a4a][Math.floor(srnd()*4)]);
      front.push([x+nx*.41,1.2,z+nz*.41,nz?.9:.04,1.1,nz?.04:.9]);solids.push({x,z,r:.6});}}));
    inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4,metalness:.2}),body,true,bodyCol);inst(new THREE.BoxGeometry(1,1,1),machineMat,front,false);}
  // utility poles and the tangle of wires over the side streets
  {const poles=[],P=[];INNER.forEach(a=>{for(let t=-BOUND+6;t<BOUND-6;t+=16){if(ROADS.some(r=>Math.abs(t-r)<9))continue;const x=a-8.9,z=t;if(insideBld(x,z,.5))continue;poles.push([x,4.6,z,1,1,1]);P.push([x,z]);solids.push({x,z,r:.3});}});
    inst(new THREE.CylinderGeometry(.13,.17,9.2,10),new THREE.MeshStandardMaterial({map:CPT.map,normalMap:CPT.normal,roughness:.9,color:0x9a9a94}),poles,true);
    inst(new THREE.BoxGeometry(1.6,.12,.12),blackMat,poles.map(p=>[p[0],8.6,p[2],1,1,1]),false);
    const pts=[];for(let i=0;i+1<P.length;i++){const [x0,z0]=P[i],[x1,z1]=P[i+1];if(x0!==x1||Math.abs(z1-z0)>17)continue;
      for(const [o,h] of [[-.6,8.6],[.6,8.6],[0,8.1]])for(let k=0;k<6;k++){const u0=k/6,u1=(k+1)/6,s0=Math.sin(u0*Math.PI)*.6,s1=Math.sin(u1*Math.PI)*.6;pts.push(x0+o,h-s0,lerp(z0,z1,u0),x0+o,h-s1,lerp(z0,z1,u1));}}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));world.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x111114})));}
  inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}),awn,true,awnCol);
  // curbs along every block edge
  // (granite kerbs: two pre-sized geometries so the stone texture keeps its scale along the 34 m runs)
  {const cx2=[],cz2=[];BLOCKS.forEach(cx=>BLOCKS.forEach(cz=>{cz2.push([cx+17,.08,cz,1,1,1],[cx-17,.08,cz,1,1,1]);cx2.push([cx,.08,cz+17,1,1,1],[cx,.08,cz-17,1,1,1]);}));
    const km=new THREE.MeshStandardMaterial({map:CPT.map,normalMap:CPT.normal,roughnessMap:CPT.orm,roughness:1,color:0xd8d8d4});
    const gx=new THREE.BoxGeometry(34.4,.16,.36);boxUVW(gx,1.5);const gz=new THREE.BoxGeometry(.36,.16,34.4);boxUVW(gz,1.5);inst(gx,km,cx2,false);inst(gz,km,cz2,false);}
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
