/* GORE — knock-outs are bloody (Settings → GORE ON KILLS, on by default; turn it off for a clean game).
   On a KO: a burst of blood, a pool spreading under the body, splatter on the ground around it and on any wall
   right next to it. Big finishing blows (ultimates or heavy hits) also tear off a limb — an arm, a leg, or the head
   on an ultimate — which flies off spraying blood, bounces and lies there. Limbs come back when a fighter respawns.
   Visual only (each player's own screen); everything is cleaned up when the match ends. */
if(SET.gore===undefined)SET.gore=true;
try{SET_ROWS.push(['gore','GORE ON KILLS','toggle']);}catch(e){}
const GORE={decals:[],limbs:[],lastHit:{}};
const BLOOD=[0x7a0010,0x9a0a18,0x5a0008,0xb0141e];
const GORE_MAT=new THREE.MeshBasicMaterial({color:0x5a0008,transparent:true,opacity:.92,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const GORE_WALL=new THREE.MeshBasicMaterial({color:0x6a000c,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
function goreOn(){return SET.gore!==false;}
function bloodBurst(p,n,sp){burst(SMK,p,n,{colors:BLOOD,speed:sp||7,up:3,life:.9,size:.13,size1:.08,grav:14,drag:.5});burst(ADD,p,Math.round(n/3),{colors:[0xc4102a,0x8a0010],speed:(sp||7)*.8,up:2,life:.4,size:.12,size1:0,bright:1.1,grav:12});}
function bloodDecal(x,z,y,r,grow){const g=new THREE.CircleGeometry(1,14);const pa=g.attributes.position;for(let i=1;i<pa.count;i++){const k=.7+Math.random()*.55;pa.setXY(i,pa.getX(i)*k,pa.getY(i)*k);}
  const m=new THREE.Mesh(g,GORE_MAT);m.rotation.x=-Math.PI/2;m.rotation.z=Math.random()*6.28;m.position.set(x,(y==null?floorAt(x,z,4):y)+.03,z);m.scale.setScalar(grow?.05:r);scene.add(m);
  GORE.decals.push({m,r,t:0,grow});if(GORE.decals.length>70){const o=GORE.decals.shift();scene.remove(o.m);o.m.geometry.dispose();}}
function wallSplat(p,n){const g=new THREE.CircleGeometry(.5+Math.random()*.5,12);const m=new THREE.Mesh(g,GORE_WALL);m.position.copy(p).addScaledVector(n,.04);m.lookAt(p.clone().add(n));scene.add(m);
  GORE.decals.push({m,r:1,t:1,grow:false});}
// remember who hit whom last, and how hard, so the finisher can decide how gory it gets
onEv('hit',(a,d,dmg,o)=>{if(d)GORE.lastHit[d.id]={a,dmg,ult:a&&a.state==='ult',heavy:!!(o&&o.heavy),t:game.time};});
onEv('kill',(d,a)=>{if(!goreOn()||!d||!d.rig||!nearCam(d.pos,70))return;const c=d.chest(new V3()),L=GORE.lastHit[d.id]||{};
  const away=a&&a!==d?new V3(d.pos.x-a.pos.x,0,d.pos.z-a.pos.z).normalize():new V3(rand(-1,1),0,rand(-1,1)).normalize();
  bloodBurst(c,60,9);setTimeout(()=>{if(inMatch())bloodBurst(c,25,4);},120);
  bloodDecal(d.pos.x,d.pos.z,d.pos.y,1.6,true);
  for(let k=0;k<6;k++){const r=rand(.8,3.2),a2=Math.atan2(away.z,away.x)+rand(-.9,.9);bloodDecal(d.pos.x+Math.cos(a2)*r,d.pos.z+Math.sin(a2)*r,null,rand(.2,.6),false);}
  // splatter on a wall right behind them
  for(let k=0;k<5;k++){const dir=away.clone().applyAxisAngle(UP,rand(-.6,.6)),q=c.clone().addScaledVector(dir,1.2+k*.6);if(insideBld(q.x,q.z,0,q.y)){wallSplat(c.clone().addScaledVector(dir,.8+k*.6),dir.clone().negate());break;}}
  const big=L.ult||L.heavy||(L.dmg||0)>=18;if(big&&game.time-(L.t||0)<1.5)tearLimb(d,away,L.ult);});
function tearLimb(f,away,ult){const R=f.rig;const opts=ult&&R.head?['head']:['lS','rS','lH','rH'].filter(k=>R[k]&&R[k].visible);if(!opts.length)return;const part=R[pick(opts)];
  part.updateWorldMatrix(true,true);const p=new V3(),q=new THREE.Quaternion(),s=new V3();part.matrixWorld.decompose(p,q,s);
  const cl=part.clone(true);cl.position.copy(p);cl.quaternion.copy(q);cl.scale.copy(s);scene.add(cl);part.visible=false;(f._goreHid=f._goreHid||[]).push(part);
  const v=away.clone().multiplyScalar(rand(6,10)).add(new V3(rand(-2,2),rand(6,9),rand(-2,2)));
  GORE.limbs.push({m:cl,v,w:new V3(rand(-12,12),rand(-12,12),rand(-12,12)),t:0,rest:false,from:p.clone(),f});
  bloodBurst(p,40,6);}
onEv('tick',dt=>{
  for(const D of GORE.decals){if(!D.grow||D.t>=1)continue;D.t=Math.min(1,D.t+dt/1.6);D.m.scale.setScalar(D.r*(1-Math.pow(1-D.t,2)));}
  for(let i=GORE.limbs.length-1;i>=0;i--){const L=GORE.limbs[i];L.t+=dt;
    if(!L.rest){L.v.y-=22*dt;L.m.position.addScaledVector(L.v,dt);L.m.rotation.x+=L.w.x*dt;L.m.rotation.y+=L.w.y*dt;L.m.rotation.z+=L.w.z*dt;
      if(Math.random()<.6)burst(SMK,L.m.position,1,{colors:BLOOD,speed:.5,up:0,life:.6,size:.1,size1:.06,grav:10});
      const gy=floorAt(L.m.position.x,L.m.position.z,L.m.position.y+1)+.12;if(L.m.position.y<gy){L.m.position.y=gy;if(L.v.y<-3){L.v.y*=-.3;L.v.x*=.5;L.v.z*=.5;L.w.multiplyScalar(.4);bloodDecal(L.m.position.x,L.m.position.z,gy-.12,rand(.3,.5),false);}else L.rest=true;}}
    // the stump keeps bleeding for a moment
    if(L.t<1.2&&L.f&&L.f.rig&&Math.random()<.5)burst(SMK,L.f.chest(new V3()),1,{colors:BLOOD,speed:2,up:1,life:.5,size:.1,size1:.06,grav:12});
    if(L.t>20){scene.remove(L.m);GORE.limbs.splice(i,1);}}});
// limbs come back on respawn; everything is cleared at the end of the match
const _goReset=Fighter.prototype.reset;Fighter.prototype.reset=function(){if(this._goreHid){this._goreHid.forEach(p=>p.visible=true);this._goreHid=null;}return _goReset.apply(this,arguments);};
onEv('matchEnd',()=>{GORE.decals.forEach(D=>{scene.remove(D.m);D.m.geometry.dispose();});GORE.decals.length=0;GORE.limbs.forEach(L=>scene.remove(L.m));GORE.limbs.length=0;GORE.lastHit={};});
