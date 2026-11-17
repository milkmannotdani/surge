/* MAPS — three extra battle royale maps, each with its own hazard. Pick one under MAP (offline panel / online lobby).
   HARBOR    container stacks to climb, giant cranes, a docked cargo ship, open water that slows you.
             Hazard: CRANE DROP — a container falls onto a marked spot.
   DISASTER  half-collapsed towers, rubble, fires and a flooded lowland.
             Hazards: COLLAPSE — a damaged tower crumbles (look for the dust); FLOOD — the lowland water rises and slows.
   RESORT    snowy mountain resort: cliffs (stairs up the sides), a lodge, ski-lift towers, pines, a frozen lake.
             Hazard: AVALANCHE — a wall of snow sweeps across the map; get above 4 m to dodge it.
   Story and missions always use the city. Each map is built the first time it's played.
   To add a map: add an entry to MAPS with name, sky and build(K) using K.box / K.stairs / K.solid / K.mesh. */
const MAPS={},MAPD={};let MAP_CUR='city';
const MAP_KEYS=['city','harbor','disaster','resort'];
const MAP_NAMES={city:'CITY',harbor:'HARBOR',disaster:'DISASTER ZONE',resort:'MOUNTAIN RESORT',random:'RANDOM'};
function mapPref(){return store.get('surge.map')||'city';}
function mapResolve(k){if(k==='random')return pick(MAP_KEYS);return MAP_KEYS.indexOf(k)>=0?k:'city';}

/* ---------- builder kit ---------- */
function mapKit(D){const G=D.G;const geoBox=new THREE.BoxGeometry(1,1,1);
  const K={
    mat(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o||{}));},
    mesh(geo,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sx)m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;G.add(m);return m;},
    // a solid box you can stand on (and climb)
    box(x,z,w,d,h,mat,o){o=o||{};const y0=o.y0||0;const m=K.mesh(geoBox,mat,x,y0+h/2,z,w,h,d);if(o.ry)m.rotation.y=o.ry;
      if(o.collide!==false)D.BLD.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y0>0?y0:undefined,h:y0+h,top:true});return m;},
    // steps up to height H along +dir (ax 'x' or 'z', sign s)
    stairs(x,z,ax,s,H,width,mat){const n=Math.ceil(H/.5);for(let i=1;i<=n;i++){const h=Math.min(H,i*.5),off=s*(i-.5)*.8;
      K.box(ax==='x'?x+off:x,ax==='z'?z+off:z,ax==='x'?.8:width,ax==='z'?.8:width,h,mat);}},
    solid(x,z,r){D.solids.push({x,z,r});},
    ground(c,size,tex){const g=new THREE.Mesh(new THREE.PlaneGeometry(size||BOUND*2+160,size||BOUND*2+160),K.mat(c,{roughness:.95,map:tex||null}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;G.add(g);return g;},
    water(x,z,w,d,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:0x1a5a8a,roughness:.1,metalness:.4,transparent:true,opacity:.82}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.06,z);G.add(m);
      D.water.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,m});return m;},
    noiseTex(base,spots,n,rep){const [c,g]=cv(256,256);g.fillStyle=base;g.fillRect(0,0,256,256);for(let i=0;i<(n||2500);i++){g.fillStyle=pick(spots);g.globalAlpha=Math.random()*.35;g.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*4,2+Math.random()*4);}g.globalAlpha=1;
      const t=tex(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep||40,rep||40);return t;},
    free(x,z,pad){return !insideBldList(D.BLD,x,z,pad||1.2)&&!D.solids.some(s=>Math.hypot(s.x-x,s.z-z)<s.r+(pad||1.2));}};
  return K;}
function insideBldList(L,x,z,pad){for(const b of L)if(x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad&&!(b.y0>2))return true;return false;}

/* ================= HARBOR ================= */
MAPS.harbor={name:'HARBOR',build(K,D){const rng=Math.random;
  K.ground(0x6a6c70,null,K.noiseTex('#6a6c70',['#5a5c60','#7a7c80','#4a4a50'],3000,30));
  // the sea along the north side, plus a channel
  K.water(0,-120,BOUND*2+160,60);K.water(-40,-60,18,60);
  const dockEdge=K.mat(0xd8b02a);K.box(0,-89.5,BOUND*2,1,.25,dockEdge,{collide:false});
  const cols=[0xc4302a,0x2a6ac4,0x2a8a4a,0xd88a1a,0x8a8a92,0x1a4a6a,0x9a2a6a].map(c=>K.mat(c,{roughness:.6,metalness:.3}));
  // container yard: rows of stacks 1–3 high
  for(let gx=-100;gx<=100;gx+=26)for(let gz=-60;gz<=110;gz+=18){if(Math.abs(gx)<14&&Math.abs(gz)<14)continue;if(gx>-50&&gx<-30&&gz<-30)continue;if(rng()<.25)continue;
    const along=rng()<.5,n=1+Math.floor(rng()*3);for(let r=0;r<2;r++){const ox=along?0:r*2.6-1.3,oz=along?r*2.6-1.3:0;
      for(let k=0;k<n-(r&&rng()<.5?1:0);k++)K.box(gx+ox,gz+oz,along?12:2.5,along?2.5:12,2.6,pick(cols),{y0:k*2.6});}
    if(rng()<.5)K.stairs(gx+(along?7:0),gz+(along?0:7),along?'x':'z',1,2.6,2,K.mat(0x5a5c60));}
  // gantry cranes: two legs each side, a walkable top beam, a hanging container
  const steel=K.mat(0xe8b82a,{metalness:.5,roughness:.4}),dark=K.mat(0x2a2a30);
  [[-80,-70],[-20,-70],[50,-70],[105,-70]].forEach(([x,z])=>{[[-7,-5],[7,-5],[-7,5],[7,5]].forEach(([a,b])=>K.box(x+a,z+b,1.4,1.4,26,steel));
    K.box(x,z-5,16,1.6,1.6,steel,{y0:26});K.box(x,z+5,16,1.6,1.6,steel,{y0:26});K.box(x,z-16,2,30,1.4,steel,{y0:27.6});
    const cab=K.box(x,z-26,4,4,3,dark,{y0:23,collide:false});D.cranes.push({x,z:z-26,c:cab});});
  // cargo ship along the sea: hull, deck, bridge tower, containers; stairs up the side
  const hull=K.mat(0x1a2a4a,{roughness:.5}),deck=K.mat(0x8a3a2a);K.box(-10,-100,120,18,8,hull);K.box(-10,-100,118,16,.3,deck,{y0:8});
  K.box(-58,-100,14,14,12,K.mat(0xe8e8f0),{y0:8.3});for(let i=0;i<7;i++)for(let k=0;k<2;k++)K.box(-40+i*13,-100+(k?3:-3),12,2.5,2.6,pick(cols),{y0:8.3});
  K.stairs(10,-90,'z',-1,8,3,K.mat(0x5a5c60));K.stairs(-30,-90,'z',-1,8,3,K.mat(0x5a5c60));
  // warehouses with walkable roofs
  [[-100,90],[0,120],[100,90]].forEach(([x,z])=>{K.box(x,z,30,18,9,K.mat(0x8a96a4,{metalness:.3}));K.stairs(x+16,z,'x',1,9,3,K.mat(0x5a5c60));});
  // bollards and lamps
  for(let x=-120;x<=120;x+=12){K.mesh(new THREE.CylinderGeometry(.3,.35,.8,8),dark,x,.4,-88.5);K.solid(x,-88.5,.4);}
  D.sky={fog:.006};D.hazard=harborHazard;}};
function harborHazard(D,dt){D.ht=(D.ht||9)-dt;if(D.ht>0)return;D.ht=rand(7,12);const L=FS.filter(f=>!f.dead&&!f.dormant);if(!L.length)return;const f=pick(L);
  const x=f.pos.x+rand(-6,6),z=f.pos.z+rand(-6,6);mapHazard('crane',{x,z});}
function craneDrop(x,z){const y=floorAt(x,z,40);const warn=new THREE.Mesh(new THREE.PlaneGeometry(13,3.4),new THREE.MeshBasicMaterial({color:0xffb02a,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide}));warn.rotation.x=-Math.PI/2;warn.position.set(x,y+.07,z);scene.add(warn);
  const box=new THREE.Mesh(new THREE.BoxGeometry(12,2.6,2.5),new THREE.MeshStandardMaterial({color:pick([0xc4302a,0x2a6ac4,0x2a8a4a,0xd88a1a])}));box.position.set(x,y+40,z);scene.add(box);
  if(ME&&Math.hypot(ME.pos.x-x,ME.pos.z-z)<30)announceSmall('⚠ CRANE DROP!');let t=0;
  const iv=setInterval(()=>{t+=.03;warn.material.opacity=.3+.4*Math.abs(Math.sin(t*12));if(t<1.8){box.position.y=y+40-38*Math.pow(t/1.8,2);return;}
    clearInterval(iv);scene.remove(warn);warn.geometry.dispose();warn.material.dispose();box.position.y=y+1.3;if(!inMatch()){scene.remove(box);return;}
    const p=new V3(x,y+1,z);dust(p,30,2);shake(.6,p);xSnd(p,()=>AU.boom(false));if(typeof crater==='function')crater(x,z,2.5);
    if(NET.role!=='client')for(const o of FS){if(o.dead||o.dormant)continue;if(Math.abs(o.pos.x-x)<6.6&&Math.abs(o.pos.z-z)<2.2&&o.pos.y<y+4){o.hp-=26*DMG_SCALE*(o.take||1);o.vel.set(0,10,0);o.onGround=false;if(o.hp<=0&&!o.dead){o.hp=0;killFighter(o,null,new V3(0,1,0));}else if(o===ME)announceSmall('CRUSHED BY A CONTAINER!');}}
    setTimeout(()=>{scene.remove(box);box.geometry.dispose();box.material.dispose();},4000);},30);}

/* ================= DISASTER ZONE ================= */
MAPS.disaster={name:'DISASTER ZONE',build(K,D){const rng=Math.random;
  K.ground(0x3a3634,null,K.noiseTex('#3a3634',['#2a2624','#4a4442','#5a4a3a'],4000,30));
  const conc=[0x6a6460,0x5a5450,0x7a726a,0x4a4846].map(c=>K.mat(c,{roughness:.95,flatShading:true})),rubble=K.mat(0x5a5048,{flatShading:true});
  // the flooded lowland in the middle-south (water rises during FLOOD)
  D.flood=K.water(20,60,90,60,.02);D.floodY=.02;
  // towers: some intact, some half-collapsed (jagged tops); a few are marked as about to collapse
  for(let gx=-110;gx<=110;gx+=36)for(let gz=-110;gz<=110;gz+=36){if(gx>-30&&gx<70&&gz>25&&gz<95)continue;if(Math.abs(gx)<20&&Math.abs(gz)<20)continue;if(rng()<.2)continue;
    const w=rand(12,18),d=rand(12,18),h=rand(10,34),m=pick(conc),broken=rng()<.5;const parts=[];
    parts.push(K.box(gx,gz,w,d,broken?h*.6:h,m));if(broken){for(let i=0;i<3;i++){const pw=w*rand(.3,.5),pd=d*rand(.3,.5);parts.push(K.box(gx+rand(-w/4,w/4),gz+rand(-d/4,d/4),pw,pd,h*rand(.08,.3),m,{y0:h*.6}));}}
    else K.stairs(gx+w/2+.4,gz,'x',1,Math.min(h,6),2.4,rubble);
    if(rng()<.45)D.towers.push({x:gx,z:gz,w,d,h,parts,cols:D.BLD.slice(-parts.length)});
    // rubble piles around the base
    for(let i=0;i<4;i++){const a=rand(0,6.28),r=Math.max(w,d)*.7;K.box(gx+Math.cos(a)*r,gz+Math.sin(a)*r,rand(1.5,3.5),rand(1.5,3.5),rand(.5,1.6),rubble);}}
  // overturned cars and burning spots
  for(let i=0;i<16;i++){const x=rand(-120,120),z=rand(-120,120);if(!K.free(x,z,3))continue;const c=K.box(x,z,4.2,2,1.4,K.mat(pick([0x8a2a2a,0x2a4a8a,0x6a6a6a]),{metalness:.4}));c.rotation.z=.15;}
  for(let i=0;i<10;i++){const x=rand(-120,120),z=rand(-120,120);if(!K.free(x,z,2))continue;D.fires.push({x,z});}
  D.sky={fog:.009};D.hazard=disasterHazard;}};
function disasterHazard(D,dt){
  // fires burn anyone standing in them
  for(const F of D.fires){if(Math.random()<dt*14)burst(ADD,TMP2.set(F.x+rand(-.8,.8),.3,F.z+rand(-.8,.8)),1,{colors:[0xff6a1a,0xffd23f,0xff3a1a],speed:.4,up:3.5,life:.6,size:.6,size1:0,bright:2.4});
    if(Math.random()<dt*2)burst(SMK,TMP2.set(F.x,1.5,F.z),1,{colors:[0x2a2a2a],speed:.3,up:2,life:2,size:1,size1:2.4});
    if(NET.role!=='client')for(const f of FS)if(!f.dead&&Math.hypot(f.pos.x-F.x,f.pos.z-F.z)<1.6&&f.pos.y<2&&!(f._fireCD>game.time)){f._fireCD=game.time+.6;burnOn(f,2,4);}}
  // flood cycle: calm 25 s → rising (water climbs to 1.6 m) for 12 s → receding
  D.ft=(D.ft||20)-dt;if(D.ft<=0){if(!D.flooding){D.flooding=true;D.ft=14;mapHazard('flood',{on:1});}else{D.flooding=false;D.ft=rand(22,30);mapHazard('flood',{on:0});}}
  const tY=D.flooding?1.6:.02;D.floodY+=(tY-D.floodY)*Math.min(1,dt*.35);D.flood.position.y=D.floodY;
  // collapsing towers
  D.ct=(D.ct||25)-dt;if(D.ct<=0&&NET.role!=='client'){D.ct=rand(22,32);const T=D.towers.find(t=>!t.down&&FS.some(f=>!f.dead&&Math.hypot(f.pos.x-t.x,f.pos.z-t.z)<45));if(T)mapHazard('collapse',{i:D.towers.indexOf(T)});}}
function towerCollapse(D,i){const T=D.towers[i];if(!T||T.down)return;T.down=true;if(ME&&Math.hypot(ME.pos.x-T.x,ME.pos.z-T.z)<50)announceSmall('⚠ A TOWER IS COLLAPSING!');let t=0;
  const iv=setInterval(()=>{t+=.04;if(t<2){T.parts.forEach(p=>p.position.x+=Math.sin(t*60)*.03);if(Math.random()<.7)dust(new V3(T.x+rand(-T.w/2,T.w/2),rand(0,T.h*.6),T.z+rand(-T.d/2,T.d/2)),3,1.5);return;}
    if(t<3.4){T.parts.forEach(p=>{p.position.y-=.6;});if(Math.random()<.9)burst(SMK,TMP2.set(T.x+rand(-T.w/2,T.w/2),rand(0,6),T.z+rand(-T.d/2,T.d/2)),2,{colors:[0x6a6460,0x4a4846],speed:3,up:3,life:1.6,size:1.4,size1:3.4});return;}
    clearInterval(iv);T.parts.forEach(p=>p.visible=false);T.cols.forEach(c=>{const k=BLD.indexOf(c);if(k>=0)BLD.splice(k,1);});
    const p=new V3(T.x,1,T.z);shake(.8,p);xSnd(p,()=>AU.boom(true));
    if(NET.role!=='client')for(const o of FS){if(o.dead||o.dormant)continue;if(Math.abs(o.pos.x-T.x)<T.w/2+3&&Math.abs(o.pos.z-T.z)<T.d/2+3){o.hp-=30*DMG_SCALE*(o.take||1);o.vel.set(rand(-6,6),8,rand(-6,6));o.onGround=false;if(o.hp<=0&&!o.dead){o.hp=0;killFighter(o,null,new V3(0,1,0));}else if(o===ME)announceSmall('CAUGHT IN THE COLLAPSE!');}}},40);}

/* ================= MOUNTAIN RESORT ================= */
MAPS.resort={name:'MOUNTAIN RESORT',build(K,D){const rng=Math.random;
  K.ground(0xeef2f6,null,K.noiseTex('#eef2f6',['#dfe6ee','#ffffff','#cfd8e2'],2000,30));
  const rock=K.mat(0x6a6e78,{flatShading:true}),snow=K.mat(0xf4f8fc,{flatShading:true}),wood=K.mat(0x7a4a2a),roof=K.mat(0x8a2a2a),pine=K.mat(0x1a4a2a,{flatShading:true});
  // cliffs: stacked rock tiers with snowy tops and stairs cut into the side
  [[-90,-80,40,30,14],[90,-90,36,36,18],[-100,80,34,30,10],[95,85,30,40,22],[0,-115,60,20,26]].forEach(([x,z,w,d,h])=>{K.box(x,z,w,d,h*.55,rock);K.box(x,z,w*.75,d*.75,h*.45,rock,{y0:h*.55});
    K.box(x,z,w*.75+.2,d*.75+.2,.3,snow,{y0:h,collide:false});K.stairs(x+w/2+.4,z,'x',1,h*.55,3,rock);K.stairs(x+w*.375+.4,z+d*.25,'x',1,h*.45,2.6,snow);
    D.BLD.push({x0:x+w*.375,x1:x+w*.375+5,z0:z+d*.25-1.3,z1:z+d*.25+1.3,y0:h*.55-.01,h:h*.55,top:true});});
  // the lodge
  K.box(0,40,30,20,8,wood);const rf=K.mesh(new THREE.ConeGeometry(21,7,4),roof,0,11.5,40);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.7);
  D.BLD.push({x0:-15,x1:15,z0:30,z1:50,h:9,top:true});K.stairs(16,40,'x',1,8,3,wood);
  // frozen lake
  const lake=new THREE.Mesh(new THREE.CircleGeometry(26,40),new THREE.MeshStandardMaterial({color:0xbfe4ff,roughness:.05,metalness:.3,transparent:true,opacity:.85}));lake.rotation.x=-Math.PI/2;lake.position.set(-40,.05,10);D.G.add(lake);D.ice={x:-40,z:10,r:26};
  // ski lift: towers in a line up the mountain with a cable
  const steel=K.mat(0x8a8e9a,{metalness:.6});for(let i=0;i<6;i++){const x=60-i*4,z=60-i*30;K.box(x,z,1.2,1.2,14+i*2,steel);K.box(x,z,6,.6,.6,steel,{y0:14+i*2,collide:false});}
  // pines
  for(let i=0;i<70;i++){const x=rand(-125,125),z=rand(-125,125);if(!K.free(x,z,2.5))continue;if(Math.hypot(x+40,z-10)<28)continue;const s=rand(.8,1.5);
    K.mesh(new THREE.CylinderGeometry(.2,.3,2,6),wood,x,1,z);K.mesh(new THREE.ConeGeometry(2*s,5*s,7),pine,x,2+2.5*s,z);K.mesh(new THREE.ConeGeometry(1.2*s,1.4*s,7),snow,x,4.3+3*s,z);K.solid(x,z,.6);}
  // snow drifts to hop over
  for(let i=0;i<20;i++){const x=rand(-120,120),z=rand(-120,120);if(!K.free(x,z,2))continue;K.box(x,z,rand(3,7),rand(2,4),rand(.5,1.2),snow);}
  D.sky={fog:.012};D.hazard=resortHazard;D.snow=snowfall(D.G);}};
function snowfall(G){const N=900,g=new THREE.BufferGeometry(),p=new Float32Array(N*3);for(let i=0;i<N;i++){p[i*3]=rand(-60,60);p[i*3+1]=rand(0,40);p[i*3+2]=rand(-60,60);}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:.25,transparent:true,opacity:.85,depthWrite:false}));m.frustumCulled=false;G.add(m);return m;}
function resortHazard(D,dt){
  if(D.snow){const p=D.snow.geometry.attributes.position,a=p.array;const c=camera.position;D.snow.position.set(c.x,0,c.z);for(let i=0;i<a.length;i+=3){a[i+1]-=dt*3;a[i]+=Math.sin(game.time+i)*dt*.4;if(a[i+1]<0)a[i+1]=40;}p.needsUpdate=true;}
  // ice lake: very slippery — you keep your speed
  for(const f of FS){if(f.dead||!f.onGround||!D.ice)continue;if(Math.hypot(f.pos.x-D.ice.x,f.pos.z-D.ice.z)<D.ice.r){f._slide=f._slide||new V3();if(Math.hypot(f.vel.x,f.vel.z)>2)f._slide.set(f.vel.x,0,f.vel.z);else{f.vel.x=f._slide.x*.97;f.vel.z=f._slide.z*.97;f._slide.multiplyScalar(.97);}}}
  D.at=(D.at||35)-dt;if(D.at<=0&&NET.role!=='client'){D.at=rand(40,55);const ax=Math.random()<.5?'x':'z',dir=Math.random()<.5?1:-1;mapHazard('avalanche',{ax,dir});}
  const A=D.aval;if(A){A.pos+=A.dir*26*dt;const k=A.ax==='x'?'x':'z';A.m.position[k]=A.pos;if(Math.random()<.9)for(let i=0;i<3;i++){const o=rand(-130,130);burst(SMK,TMP2.set(k==='x'?A.pos:o,rand(.5,5),k==='x'?o:A.pos),1,{colors:[0xffffff,0xe8f0f8],speed:3,up:2,life:1.2,size:2,size1:4});}
    if(NET.role!=='client')for(const f of FS){if(f.dead||f.dormant||f.pos.y>4)continue;const d=(k==='x'?f.pos.x:f.pos.z)-A.pos;if(Math.abs(d)<3&&!A.hit.has(f)){A.hit.add(f);f.hp-=18*DMG_SCALE*(f.take||1);f.vel[k]=A.dir*22;f.vel.y=9;f.onGround=false;if(f.hp<=0&&!f.dead){f.hp=0;killFighter(f,null,new V3(0,1,0));}else if(f===ME)announceSmall('SWEPT AWAY BY THE AVALANCHE!');}}
    if(Math.abs(A.pos)>BOUND+20){scene.remove(A.m);A.m.geometry.dispose();A.m.material.dispose();D.aval=null;}}}
function avalanche(D,ax,dir){if(D.aval)return;const m=new THREE.Mesh(new THREE.BoxGeometry(ax==='x'?6:BOUND*2+40,5,ax==='x'?BOUND*2+40:6),new THREE.MeshStandardMaterial({color:0xf4f8fc,transparent:true,opacity:.85,roughness:1}));
  m.position.y=2.5;const start=-dir*(BOUND+15);if(ax==='x')m.position.x=start;else m.position.z=start;scene.add(m);D.aval={ax,dir,pos:start,m,hit:new Set()};
  announce('⚠ AVALANCHE — GET HIGH!','#cfe8ff');}

/* ---------- hazards are decided by the host and played on every screen ---------- */
function mapHazard(kind,o){const msg={k:'mapHz',kind,o};if(NET.role==='host')netEvent(msg);runHazard(msg);}
onEv('net:mapHz',e=>runHazard(e));
function runHazard(e){const D=MAPD[MAP_CUR];if(!D)return;const o=e.o||{};
  if(e.kind==='crane')craneDrop(o.x,o.z);
  if(e.kind==='collapse')towerCollapse(D,o.i);
  if(e.kind==='avalanche')avalanche(D,o.ax,o.dir);
  if(e.kind==='flood'){if(NET.role==='client'){D.flooding=!!o.on;}if(o.on&&ME)announceSmall('⚠ FLOOD — THE LOWLAND IS FILLING WITH WATER');}}

/* ---------- switching maps ---------- */
// every player must build the same layout, so building uses a fixed random seed per map
function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function buildMap(k){if(MAPD[k])return MAPD[k];const G=new THREE.Group();G.visible=false;scene.add(G);const D={G,BLD:[],solids:[],walls:[],water:[],cranes:[],towers:[],fires:[]};MAPD[k]=D;
  const R=Math.random;Math.random=seeded(hashStr('surge-map-'+k));try{MAPS[k].build(mapKit(D),D);}finally{Math.random=R;}return D;}
const _mapSW=setWorld;
setWorld=function(w){
  if(!MAPS[w]){for(const k in MAPD)MAPD[k].G.visible=false;MAP_CUR=w==='train'?'train':'city';return _mapSW(w);}
  _mapSW('__map_'+w);const D=buildMap(w);for(const k in MAPD)MAPD[k].G.visible=k===w;MAP_CUR=w;
  BLD.length=0;solids.length=0;walls.length=0;props.length=0;D.BLD.forEach(b=>BLD.push(b));D.solids.forEach(s=>solids.push(s));
  // fresh hazard state every match (collapsed towers come back)
  D.towers.forEach(T=>{T.down=false;T.parts.forEach(p=>{p.visible=true;});});D.ht=D.ct=D.at=D.ft=undefined;D.flooding=false;if(D.flood){D.floodY=.02;D.flood.position.y=.02;}
  if(D.aval){scene.remove(D.aval.m);D.aval=null;}if(D.sky&&scene.fog)scene.fog.density=D.sky.fog;};
// towers rebuild their parts when the map is reloaded
onEv('matchStart',()=>{const D=MAPD[MAP_CUR];if(!D)return;D.towers.forEach(T=>{T.parts.forEach((p,i)=>{if(p.userData.y0==null)p.userData.y0=p.position.y;p.position.y=p.userData.y0;});});});
onEv('tick',dt=>{const D=MAPD[MAP_CUR];if(!D||!inMatch()||game.phase!=='fight')return;if(D.hazard)D.hazard(D,dt);
  // water: wading slows you down
  for(const f of FS){if(f.dead)continue;for(const W of D.water){const y=W.m.position.y;if(f.pos.x>W.x0&&f.pos.x<W.x1&&f.pos.z>W.z0&&f.pos.z<W.z1&&f.pos.y<y+.2&&y>.01){f.slowT=Math.max(f.slowT||0,.3);if(Math.random()<dt*6&&nearCam(f.pos,60))burst(ADD,TMP2.set(f.pos.x,y+.05,f.pos.z),2,{colors:[0x9ad8ff,0xffffff],speed:1.5,up:1.5,life:.35,size:.2,size1:0,bright:1.6});}}}});
// spawn points are picked before the match starts, so the map is chosen (and built) here
function nextMapKey(){if(game._storyNext||(typeof PR!=='undefined'&&PR.on))return 'city';if(NET.role==='client')return game._mapNext||'city';return mapResolve(NET.role==='host'?(NET.map||mapPref()):mapPref());}
const _mapSpawn=spawnPoints;spawnPoints=function(n){const k=game._mapNext||nextMapKey();game._mapNext=k;if(k==='city')return _mapSpawn(n);const D=buildMap(k),out=[];
  for(let i=0;i<n;i++){let p=null;for(let t=0;t<80&&!p;t++){const a=rand(0,6.28),r=rand(10,95),x=Math.cos(a)*r,z=Math.sin(a)*r;if(!insideBldList(D.BLD,x,z,2)&&!D.water.some(W=>x>W.x0&&x<W.x1&&z>W.z0&&z<W.z1)&&out.every(q=>Math.hypot(q[0]-x,q[1]-z)>12))p=[x,z];}out.push(p||[rand(-20,20),rand(-20,20)]);}return out;};
/* ---------- picking the map (offline panel + online lobby) ---------- */
function mapChips(id,cur,on){const el=$(id);if(!el)return;el.innerHTML='';[...MAP_KEYS,'random'].forEach(k=>{const b=document.createElement('div');b.className='chip'+(cur===k?' sel':'');b.textContent=MAP_NAMES[k];
  b.onclick=()=>{AU.ui&&AU.ui();on(k);mapChips(id,k,on);};el.appendChild(b);});}
(function(){const r=$('rulesRow');if(r&&!$('mapRow')){const d=document.createElement('div');d.className='arow';d.id='mapRow';d.innerHTML='<span class="lbl">MAP</span><div class="rowb" style="margin:0" id="mapSel"></div>';r.after(d);}
  const r2=$('rules2');if(r2&&!$('mapSel2')){const l=document.createElement('span');l.className='lbl';l.textContent='MAP';const d=document.createElement('div');d.className='rowb';d.style.margin='0';d.id='mapSel2';r2.after(l,d);}})();
function drawMapChips(){mapChips('mapSel',mapPref(),k=>store.set('surge.map',k));mapChips('mapSel2',NET.map||mapPref(),k=>{if(NET.role!=='host')return;NET.map=k;store.set('surge.map',k);broadcastLobby();});}
onEv('frame',()=>{const s=$('mapSel');if(s&&!s.children.length)drawMapChips();const s2=$('mapSel2');if(s2&&!s2.children.length)drawMapChips();});
// the host's start message carries the map; everyone builds the same one
const _mapStart=startMatch;startMatch=function(roster,spawns,diff,mode,rules){const pick_=game._mapNext||nextMapKey();game._mapNext=null;
  game.mapK=(game._storyNext||game.story)?'city':pick_;const prOn=PR.on;
  const r=(function(){const sw=setWorld;setWorld=function(w){return sw(w==='city'&&!prOn?game.mapK:w);};try{return _mapStart(roster,spawns,diff,mode,rules);}finally{setWorld=sw;}})();
  if(game.mapK!=='city'&&ME)setTimeout(()=>announceSmall('MAP: '+MAP_NAMES[game.mapK]),1200);return r;};
