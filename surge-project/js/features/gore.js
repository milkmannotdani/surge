/* GORE (heavy) — Settings → GORE ON KILLS, on by default; turn it off for a clean game.
   Every KO: a big burst of blood, a wide pool, a ring of splatter on the ground and up nearby walls, and at least one
   limb torn off. Big finishers (heavy hits, 18+ damage) tear off two or three; ultimates also take the head.
   Explosive ultimate kills (launching hits) blow the body apart: every limb flies off with a shower of chunks.
   Stumps pump blood in pulses for a couple of seconds; limbs and chunks spray as they fly and leave splats where they land.
   Heavy hits that don't kill still draw blood. Limbs come back when a fighter respawns.
   Visual only (each player's own screen); everything is cleaned up when the match ends. */
if(SET.gore===undefined)SET.gore=true;
try{SET_ROWS.push(['gore','GORE ON KILLS','toggle']);}catch(e){}
const GORE={decals:[],limbs:[],chunks:[],spurts:[],lastHit:{}};
const GORE_CHUNK=new THREE.MeshStandardMaterial({color:0x6a0a12,roughness:.45,metalness:0});
const CHUNK_G=[new THREE.DodecahedronGeometry(.11,0),new THREE.BoxGeometry(.16,.1,.13),new THREE.TetrahedronGeometry(.13,0)];
const BLOOD=[0x7a0010,0x9a0a18,0x5a0008,0xb0141e];
const GORE_MAT=new THREE.MeshBasicMaterial({color:0x5a0008,transparent:true,opacity:.92,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const GORE_WALL=new THREE.MeshBasicMaterial({color:0x6a000c,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
function goreOn(){return SET.gore!==false;}
function bloodBurst(p,n,sp){burst(SMK,p,n,{colors:BLOOD,speed:sp||7,up:3,life:.9,size:.13,size1:.08,grav:14,drag:.5});burst(ADD,p,Math.round(n/3),{colors:[0xc4102a,0x8a0010],speed:(sp||7)*.8,up:2,life:.4,size:.12,size1:0,bright:1.1,grav:12});}
function bloodDecal(x,z,y,r,grow){const g=new THREE.CircleGeometry(1,14);const pa=g.attributes.position;for(let i=1;i<pa.count;i++){const k=.7+Math.random()*.55;pa.setXY(i,pa.getX(i)*k,pa.getY(i)*k);}
  const m=new THREE.Mesh(g,GORE_MAT);m.rotation.x=-Math.PI/2;m.rotation.z=Math.random()*6.28;m.position.set(x,(y==null?floorAt(x,z,4):y)+.03,z);m.scale.setScalar(grow?.05:r);scene.add(m);
  GORE.decals.push({m,r,t:0,grow});if(GORE.decals.length>160){const o=GORE.decals.shift();scene.remove(o.m);o.m.geometry.dispose();}}
function wallSplat(p,n){const g=new THREE.CircleGeometry(.5+Math.random()*.5,12);const m=new THREE.Mesh(g,GORE_WALL);m.position.copy(p).addScaledVector(n,.04);m.lookAt(p.clone().add(n));scene.add(m);
  GORE.decals.push({m,r:1,t:1,grow:false});}
// remember who hit whom last, and how hard, so the finisher can decide how gory it gets
onEv('hit',(a,d,dmg,o)=>{if(!d)return;GORE.lastHit[d.id]={a,dmg,ult:a&&a.state==='ult',heavy:!!(o&&o.heavy),launch:!!(o&&o.launch),t:game.time};
  // heavy hits that don't kill still draw blood
  if(goreOn()&&dmg>=8&&!d.dead&&nearCam(d.pos,50)){const p=(o&&o.pt)||d.chest(new V3());bloodBurst(p,Math.min(40,8+dmg*1.2),5+dmg*.15);if(Math.random()<.6)bloodDecal(d.pos.x+rand(-.6,.6),d.pos.z+rand(-.6,.6),null,rand(.15,.35),false);}});
onEv('kill',(d,a)=>{if(!goreOn()||!d||!d.rig||!nearCam(d.pos,90))return;const c=d.chest(new V3()),L=GORE.lastHit[d.id]||{};
  const away=a&&a!==d?new V3(d.pos.x-a.pos.x,0,d.pos.z-a.pos.z).normalize():new V3(rand(-1,1),0,rand(-1,1)).normalize();
  const fresh=game.time-(L.t||0)<1.5,big=fresh&&(L.ult||L.heavy||(L.dmg||0)>=18),blowApart=fresh&&L.ult&&L.launch;
  bloodBurst(c,140,12);setTimeout(()=>{if(inMatch())bloodBurst(c,70,7);},110);setTimeout(()=>{if(inMatch())bloodBurst(c,40,4);},300);
  burst(SMK,c,22,{colors:[0x5a0008,0x7a0010],speed:3,up:1,life:1.1,size:.5,size1:1.3,drag:2,grav:1});   // blood mist
  bloodDecal(d.pos.x,d.pos.z,d.pos.y,2.6,true);
  for(let k=0;k<14;k++){const r=rand(.8,5.5),a2=Math.atan2(away.z,away.x)+rand(-1.1,1.1);bloodDecal(d.pos.x+Math.cos(a2)*r,d.pos.z+Math.sin(a2)*r,null,rand(.2,.8),false);}
  // splatter up any walls close by
  let walls=0;for(let k=0;k<10&&walls<3;k++){const dir=away.clone().applyAxisAngle(UP,rand(-.9,.9)),q=c.clone().addScaledVector(dir,1.2+k*.5);if(insideBld(q.x,q.z,0,q.y)){wallSplat(c.clone().addScaledVector(dir,.8+k*.5).add(TMP2.set(0,rand(-.6,.9),0)),dir.clone().negate());walls++;}}
  // dismemberment
  const R=d.rig,limbs=['lS','rS','lH','rH'].filter(k=>R[k]&&R[k].visible).sort(()=>Math.random()-.5);
  let n=blowApart?limbs.length:big?(Math.random()<.5?2:3):1;for(let k=0;k<n&&k<limbs.length;k++)tearLimb(d,away,limbs[k]);
  if((L.ult||blowApart||(L.dmg||0)>=30)&&R.head&&R.head.visible)tearLimb(d,away,'head');
  gibs(c,away,blowApart?26:big?14:7);
  if(blowApart){bloodBurst(c,120,15);const hide=[R.spine,R.hips].filter(o=>o&&o.isObject3D);hide.forEach(o=>o.visible=false);(d._goreHid=d._goreHid||[]).push(...hide);}});
// flying chunks of gore
function gibs(c,away,n){for(let k=0;k<n;k++){const m=new THREE.Mesh(pick(CHUNK_G),GORE_CHUNK);m.position.copy(c).add(TMP2.set(rand(-.3,.3),rand(-.3,.4),rand(-.3,.3)));m.scale.setScalar(rand(.6,1.5));scene.add(m);
  const v=away.clone().multiplyScalar(rand(3,11)).add(new V3(rand(-4,4),rand(4,10),rand(-4,4)));GORE.chunks.push({m,v,w:new V3(rand(-15,15),rand(-15,15),rand(-15,15)),t:0,rest:false});}
  if(GORE.chunks.length>120)GORE.chunks.splice(0,GORE.chunks.length-120).forEach(o=>scene.remove(o.m));}
function tearLimb(f,away,key){const R=f.rig,part=R[key];if(!part||!part.visible)return;
  part.updateWorldMatrix(true,true);const p=new V3(),q=new THREE.Quaternion(),s=new V3();part.matrixWorld.decompose(p,q,s);
  const cl=part.clone(true);cl.position.copy(p);cl.quaternion.copy(q);cl.scale.copy(s);scene.add(cl);part.visible=false;(f._goreHid=f._goreHid||[]).push(part);
  const v=away.clone().multiplyScalar(rand(6,10)).add(new V3(rand(-2,2),rand(6,9),rand(-2,2)));
  GORE.limbs.push({m:cl,v,w:new V3(rand(-12,12),rand(-12,12),rand(-12,12)),t:0,rest:false,from:p.clone(),f,key});
  bloodBurst(p,60,8);GORE.spurts.push({f,p:p.clone(),t:0});}
onEv('tick',dt=>{
  for(const D of GORE.decals){if(!D.grow||D.t>=1)continue;D.t=Math.min(1,D.t+dt/1.6);D.m.scale.setScalar(D.r*(1-Math.pow(1-D.t,2)));}
  for(let i=GORE.limbs.length-1;i>=0;i--){const L=GORE.limbs[i];L.t+=dt;
    if(!L.rest){L.v.y-=22*dt;L.m.position.addScaledVector(L.v,dt);L.m.rotation.x+=L.w.x*dt;L.m.rotation.y+=L.w.y*dt;L.m.rotation.z+=L.w.z*dt;
      if(Math.random()<.6)burst(SMK,L.m.position,1,{colors:BLOOD,speed:.5,up:0,life:.6,size:.1,size1:.06,grav:10});
      const gy=floorAt(L.m.position.x,L.m.position.z,L.m.position.y+1)+.12;if(L.m.position.y<gy){L.m.position.y=gy;if(L.v.y<-3){L.v.y*=-.3;L.v.x*=.5;L.v.z*=.5;L.w.multiplyScalar(.4);bloodDecal(L.m.position.x,L.m.position.z,gy-.12,rand(.3,.5),false);}else L.rest=true;}}
    if(L.t>30){scene.remove(L.m);GORE.limbs.splice(i,1);}}
  // chunks
  for(let i=GORE.chunks.length-1;i>=0;i--){const C=GORE.chunks[i];C.t+=dt;if(C.rest){if(C.t>30){scene.remove(C.m);GORE.chunks.splice(i,1);}continue;}
    C.v.y-=22*dt;C.m.position.addScaledVector(C.v,dt);C.m.rotation.x+=C.w.x*dt;C.m.rotation.y+=C.w.y*dt;if(Math.random()<.3)burst(SMK,C.m.position,1,{colors:BLOOD,speed:.3,up:0,life:.5,size:.08,size1:.05,grav:10});
    const gy=floorAt(C.m.position.x,C.m.position.z,C.m.position.y+1)+.06;if(C.m.position.y<gy){C.m.position.y=gy;if(C.v.y<-4){C.v.y*=-.25;C.v.x*=.5;C.v.z*=.5;bloodDecal(C.m.position.x,C.m.position.z,gy-.06,rand(.15,.3),false);}else C.rest=true;}}
  // stumps pump blood in pulses for a couple of seconds
  for(let i=GORE.spurts.length-1;i>=0;i--){const S=GORE.spurts[i];S.t+=dt;if(S.t>2.4||!S.f||!S.f.rig){GORE.spurts.splice(i,1);continue;}
    const pulse=Math.sin(S.t*14)>.3;if(pulse&&nearCam(S.f.pos,50)){const c=S.f.chest(new V3());burst(SMK,c,3,{colors:BLOOD,speed:4*(1-S.t/2.4)+1,up:3,life:.7,size:.11,size1:.07,grav:14});
      if(Math.random()<.08)bloodDecal(S.f.pos.x+rand(-.8,.8),S.f.pos.z+rand(-.8,.8),null,rand(.15,.3),false);}}});
// limbs come back on respawn; everything is cleared at the end of the match
const _goReset=Fighter.prototype.reset;Fighter.prototype.reset=function(){if(this._goreHid){this._goreHid.forEach(p=>p.visible=true);this._goreHid=null;}return _goReset.apply(this,arguments);};
onEv('matchEnd',()=>{GORE.decals.forEach(D=>{scene.remove(D.m);D.m.geometry.dispose();});GORE.decals.length=0;GORE.limbs.forEach(L=>scene.remove(L.m));GORE.limbs.length=0;GORE.chunks.forEach(C=>scene.remove(C.m));GORE.chunks.length=0;GORE.spurts.length=0;GORE.lastHit={};});
