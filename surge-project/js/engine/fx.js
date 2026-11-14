/* Particles, rings, flashes, lights and other visual effects */
/* ================= FX ================= */
class Particles{
  constructor(max,additive){
    this.max=max;this.i=0;const g=new THREE.BufferGeometry();
    this.p=new Float32Array(max*3);this.c=new Float32Array(max*3);this.s=new Float32Array(max);this.a=new Float32Array(max);
    this.v=new Float32Array(max*3);this.l=new Float32Array(max);this.ml=new Float32Array(max);this.s0=new Float32Array(max);this.s1=new Float32Array(max);this.gr=new Float32Array(max);this.dr=new Float32Array(max);this.c0=new Float32Array(max*3);this.c1=new Float32Array(max*3);
    g.setAttribute('position',new THREE.BufferAttribute(this.p,3));g.setAttribute('pcolor',new THREE.BufferAttribute(this.c,3));
    g.setAttribute('size',new THREE.BufferAttribute(this.s,1));g.setAttribute('alpha',new THREE.BufferAttribute(this.a,1));
    this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
      uniforms:{scale:{value:innerHeight*renderer.getPixelRatio()*.95}},
      vertexShader:'attribute vec3 pcolor;attribute float size;attribute float alpha;uniform float scale;varying vec3 vC;varying float vA;void main(){vC=pcolor;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(size*scale/max(-mv.z,.1),300.);gl_Position=projectionMatrix*mv;}',
      fragmentShader:additive?'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(vC*a*vA,1.);}'
        :'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d);gl_FragColor=vec4(vC,a*vA*.85);}'});
    this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;scene.add(this.pts);PART.push(this);this.live=0;
  }
  spawn(x,y,z,vx,vy,vz,r,g,b,life,s0,s1,gr,dr,r1,g1,b1){
    const i=this.i;this.i=(i+1)%this.max;const j=i*3;
    this.p[j]=x;this.p[j+1]=y;this.p[j+2]=z;this.v[j]=vx;this.v[j+1]=vy;this.v[j+2]=vz;this.c[j]=this.c0[j]=r;this.c[j+1]=this.c0[j+1]=g;this.c[j+2]=this.c0[j+2]=b;
    if(r1===undefined){this.c1[j]=r;this.c1[j+1]=g;this.c1[j+2]=b;}else{this.c1[j]=r1;this.c1[j+1]=g1;this.c1[j+2]=b1;}
    this.l[i]=this.ml[i]=life;this.s0[i]=s0;this.s1[i]=s1;this.gr[i]=gr;this.dr[i]=dr;this.s[i]=s0;this.a[i]=1;
  }
  update(dt){
    for(let i=0;i<this.max;i++){if(this.l[i]<=0)continue;this.l[i]-=dt;const j=i*3;
      if(this.l[i]<=0){this.a[i]=0;this.s[i]=0;continue;}
      const k=Math.max(0,1-this.dr[i]*dt);this.v[j]*=k;this.v[j+1]=this.v[j+1]*k-this.gr[i]*dt;this.v[j+2]*=k;
      this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;
      if(this.p[j+1]<.03&&this.v[j+1]<0){this.p[j+1]=.03;this.v[j+1]*=-.3;}
      const t=1-this.l[i]/this.ml[i];this.s[i]=this.s0[i]+(this.s1[i]-this.s0[i])*t;this.a[i]=(t<.08?t/.08:1)*(1-t);
      this.c[j]=this.c0[j]+(this.c1[j]-this.c0[j])*t;this.c[j+1]=this.c0[j+1]+(this.c1[j+1]-this.c0[j+1])*t;this.c[j+2]=this.c0[j+2]+(this.c1[j+2]-this.c0[j+2])*t;}
    const at=this.pts.geometry.attributes;at.position.needsUpdate=at.size.needsUpdate=at.alpha.needsUpdate=at.pcolor.needsUpdate=true;
  }
}
const ADD=new Particles(7000,true), SMK=new Particles(2200,false);
/* streak sparks: short glowing lines stretched along their velocity */
class Streaks{
  constructor(max){this.max=max;this.i=0;this.p=new Float32Array(max*3);this.v=new Float32Array(max*3);this.c=new Float32Array(max*3);this.l=new Float32Array(max);this.ml=new Float32Array(max);this.gr=new Float32Array(max);this.len=new Float32Array(max);
    const g=new THREE.BufferGeometry();this.pos=new Float32Array(max*6);this.col=new Float32Array(max*6);g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('color',new THREE.BufferAttribute(this.col,3));
    this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));this.mesh.frustumCulled=false;scene.add(this.mesh);}
  spawn(x,y,z,vx,vy,vz,r,g,b,life,gr,len){const i=this.i;this.i=(i+1)%this.max;const j=i*3;this.p[j]=x;this.p[j+1]=y;this.p[j+2]=z;this.v[j]=vx;this.v[j+1]=vy;this.v[j+2]=vz;this.c[j]=r;this.c[j+1]=g;this.c[j+2]=b;this.l[i]=this.ml[i]=life;this.gr[i]=gr;this.len[i]=len;}
  update(dt){for(let i=0;i<this.max;i++){const j=i*3,k=i*6;if(this.l[i]<=0){this.col[k]=this.col[k+1]=this.col[k+2]=this.col[k+3]=this.col[k+4]=this.col[k+5]=0;continue;}
      this.l[i]-=dt;const f=Math.max(0,this.l[i]/this.ml[i]);this.v[j+1]-=this.gr[i]*dt;this.v[j]*=1-dt*1.5;this.v[j+2]*=1-dt*1.5;
      this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;if(this.p[j+1]<.02){this.p[j+1]=.02;this.v[j+1]*=-.35;}
      const L=this.len[i];this.pos[k]=this.p[j];this.pos[k+1]=this.p[j+1];this.pos[k+2]=this.p[j+2];this.pos[k+3]=this.p[j]-this.v[j]*L;this.pos[k+4]=this.p[j+1]-this.v[j+1]*L;this.pos[k+5]=this.p[j+2]-this.v[j+2]*L;
      this.col[k]=this.c[j]*f;this.col[k+1]=this.c[j+1]*f;this.col[k+2]=this.c[j+2]*f;this.col[k+3]=this.c[j]*f*.15;this.col[k+4]=this.c[j+1]*f*.15;this.col[k+5]=this.c[j+2]*f*.15;}
    const at=this.mesh.geometry.attributes;at.position.needsUpdate=at.color.needsUpdate=true;}
}
const STK=new Streaks(1600);
function sparks(pos,n,o){if(!nearCam(pos,80))return;_c.setHex(o.color||0xffffff);const br=o.bright||2.4,r=_c.r*br,g=_c.g*br,b=_c.b*br;
  for(let k=0;k<n;k++){let dx=rand(-1,1),dy=rand(-1,1)+(o.up||0),dz=rand(-1,1);const l=Math.hypot(dx,dy,dz)||1;const s=(o.speed||10)*rand(.4,1);
    STK.spawn(pos.x,pos.y,pos.z,dx/l*s,dy/l*s,dz/l*s,r,g,b,(o.life||.4)*rand(.6,1.2),o.grav===undefined?12:o.grav,o.len||.035);}}
const _c=new THREE.Color(),_c2=new THREE.Color();
function _rgb(hex,b){_c.setHex(hex);return [_c.r*b,_c.g*b,_c.b*b];}
function burst(pool,pos,n,o){
  if(!nearCam(pos,90))return;
  const cols=o.colors||[0xffffff];const br=o.bright||1;
  for(let k=0;k<n;k++){
    let dx=rand(-1,1),dy=rand(-1,1),dz=rand(-1,1);const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.hemi)dy=Math.abs(dy);if(o.flat)dy*=.15;
    const sp=(o.speed||5)*rand(.35,1);let vx=dx*sp,vy=dy*sp+(o.up||0),vz=dz*sp;
    if(o.dir){vx+=o.dir.x*o.dirSp;vy+=o.dir.y*o.dirSp;vz+=o.dir.z*o.dirSp;}
    _c.setHex(pick(cols));if(cols.length>1){_c2.setHex(pick(cols));_c.lerp(_c2,Math.random());}
    const off=o.rad||0;let r1,g1,b1;if(o.end!==undefined){_c2.setHex(o.end);const eb=br*(o.endBright||1);r1=_c2.r*eb;g1=_c2.g*eb;b1=_c2.b*eb;}
    pool.spawn(pos.x+dx*off*Math.random(),pos.y+dy*off*Math.random(),pos.z+dz*off*Math.random(),vx,vy,vz,_c.r*br,_c.g*br,_c.b*br,(o.life||.5)*rand(.6,1.2),(o.size||.3)*rand(.7,1.3),o.size1!==undefined?o.size1:0,o.grav||0,o.drag||0,r1,g1,b1);
  }
}
function nearCam(p,d){const dx=p.x-camera.position.x,dz=p.z-camera.position.z;return dx*dx+dz*dz<d*d;}
function pool(n,make){const a=[];for(let i=0;i<n;i++){const m=make();m.visible=false;m.userData.t=0;scene.add(m);a.push(m);}let i=0;return {a,get(){const m=a[i];i=(i+1)%n;return m;}};}
const ringGeo=new THREE.RingGeometry(.86,1,64);
const RINGS=pool(24,()=>new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
function ring(pos,color,size,dur,flat,bright){if(!nearCam(pos,110))return;const m=RINGS.get();m.visible=true;m.position.copy(pos);m.userData={t:0,dur,size,flat};m.material.color.setHex(color).multiplyScalar(bright||2);
  if(flat){m.rotation.set(-Math.PI/2,0,0);}else m.lookAt(camera.position);m.scale.setScalar(.1);}
const SPH=pool(12,()=>new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
function orb(pos,color,size,dur,bright){if(!nearCam(pos,110))return;const m=SPH.get();m.visible=true;m.position.copy(pos);m.userData={t:0,dur,size};m.material.color.setHex(color).multiplyScalar(bright||2.5);m.scale.setScalar(.1);}
const LIGHTS=[];for(let i=0;i<3;i++){const l=new THREE.PointLight(0xffffff,0,22,2);scene.add(l);LIGHTS.push(l);}let li=0;
function flashLight(pos,color,int){if(!nearCam(pos,60))return;const l=LIGHTS[li];li=(li+1)%LIGHTS.length;l.position.copy(pos);l.color.setHex(color);l.intensity=int;l.userData.i0=int;}
const debMats=[new THREE.MeshStandardMaterial({color:0x6a6c70,roughness:.9}),new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.9}),new THREE.MeshStandardMaterial({color:0x8a6232,roughness:.9}),new THREE.MeshStandardMaterial({color:0x55575c,metalness:.6,roughness:.4}),
  new THREE.MeshPhysicalMaterial({color:0xffd0e0,emissive:0xff4f8b,emissiveIntensity:.9,roughness:.1,clearcoat:1,transparent:true,opacity:.85}),new THREE.MeshPhysicalMaterial({color:0xe8fffb,emissive:0x3fe0c5,emissiveIntensity:.5,roughness:.05,clearcoat:1,transparent:true,opacity:.6})];
const debGeo=[new THREE.BoxGeometry(1,1,1),new THREE.DodecahedronGeometry(.6,0),new THREE.TetrahedronGeometry(.7,0)];
const DEB=pool(90,()=>{const m=new THREE.Mesh(debGeo[0],debMats[0]);m.castShadow=true;return m;});
function debris(pos,n,matI,spd,size){if(!nearCam(pos,80))return;for(let k=0;k<n;k++){const m=DEB.get();m.visible=true;m.geometry=pick(debGeo);m.material=debMats[matI===undefined?0:matI];
  m.position.copy(pos);m.scale.setScalar((size||.3)*rand(.5,1.4));m.userData={t:0,life:rand(1.5,2.5),v:new V3(rand(-1,1),rand(.4,1.4),rand(-1,1)).multiplyScalar(spd||8),w:new V3(rand(-9,9),rand(-9,9),rand(-9,9))};}}
const spikeGeo=new THREE.ConeGeometry(.55,1,5,1);spikeGeo.translate(0,.5,0);
const spikeMat=new THREE.MeshStandardMaterial({color:0x8a6a48,roughness:.95,flatShading:true});
const SPK=pool(80,()=>{const m=new THREE.Mesh(spikeGeo,spikeMat);m.castShadow=true;return m;});
function spike(x,z,h){if(!nearCam(TMP3.set(x,0,z),90))return;const m=SPK.get();m.visible=true;m.position.set(x,0,z);m.rotation.set(rand(-.25,.25),rand(0,6),rand(-.25,.25));m.userData={t:0,h:h*rand(.7,1.2)};m.scale.set(1,.01,1);
  burst(SMK,TMP3.set(x,.2,z),3,{colors:[0x7a6650],speed:2.5,up:1.5,life:.8,size:.7,size1:1.6,drag:2,grav:-.5});}
const [dc,dg]=cv(128,128);{const drg=dg.createRadialGradient(64,64,0,64,64,64);drg.addColorStop(0,'rgba(0,0,0,.9)');drg.addColorStop(.5,'rgba(10,6,4,.6)');drg.addColorStop(1,'rgba(0,0,0,0)');dg.fillStyle=drg;dg.fillRect(0,0,128,128);}
const decT=tex(dc);
const DEC=pool(20,()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:decT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));m.rotation.x=-Math.PI/2;return m;});
function scorch(x,z,s){if(!nearCam(TMP3.set(x,0,z),90))return;const m=DEC.get();m.visible=true;m.position.set(x,.05,z);m.scale.setScalar(s);m.rotation.z=rand(0,6);m.material.opacity=1;m.userData={t:0};}
// film-frame afterimage panels (Strobe)
const [fc,fg]=cv(128,224);fg.clearRect(0,0,128,224);fg.strokeStyle='rgba(255,255,255,.95)';fg.lineWidth=6;fg.strokeRect(14,6,100,212);
fg.fillStyle='rgba(255,255,255,.12)';fg.fillRect(14,6,100,212);fg.fillStyle='rgba(255,255,255,.9)';for(let y=12;y<214;y+=22){fg.fillRect(2,y,8,12);fg.fillRect(118,y,8,12);}
const frameT=tex(fc);
const PAN=pool(36,()=>new THREE.Mesh(new THREE.PlaneGeometry(1.25,2.2),new THREE.MeshBasicMaterial({map:frameT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
function panel(pos,face,color,dur){if(!nearCam(pos,90))return;const m=PAN.get();m.visible=true;m.position.set(pos.x,pos.y+1.1,pos.z);m.rotation.set(0,face,0);m.material.color.setHex(color).multiplyScalar(1.8);m.userData={t:0,dur:dur||.45};m.material.opacity=1;}

function updateFX(dt){
  ADD.update(dt);SMK.update(dt);STK.update(dt);
  RINGS.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){m.visible=false;return;}m.scale.setScalar(.1+u.size*(1-Math.pow(1-k,3)));m.material.opacity=1-k;if(!u.flat)m.lookAt(camera.position);});
  SPH.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){m.visible=false;return;}m.scale.setScalar(.1+u.size*(1-Math.pow(1-k,2)));m.material.opacity=Math.pow(1-k,1.5);});
  LIGHTS.forEach(l=>{if(l.intensity>0)l.intensity=Math.max(0,l.intensity-dt*l.userData.i0*4);});
  DEB.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;if(u.t>u.life){m.visible=false;return;}
    u.v.y-=25*dt;m.position.addScaledVector(u.v,dt);m.rotation.x+=u.w.x*dt;m.rotation.y+=u.w.y*dt;
    if(m.position.y<m.scale.x*.4){m.position.y=m.scale.x*.4;u.v.y*=-.35;u.v.x*=.7;u.v.z*=.7;u.w.multiplyScalar(.7);}
    if(u.life-u.t<.4)m.scale.multiplyScalar(1-dt*6);});
  SPK.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;let s;
    if(u.t<.1)s=u.t/.1*1.15;else if(u.t<.18)s=1.15-(u.t-.1)/.08*.15;else if(u.t<.8)s=1;else if(u.t<1.15)s=1-(u.t-.8)/.35;else{m.visible=false;return;}
    m.scale.set(1,Math.max(.01,s)*u.h,1);});
  DEC.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;if(u.t>7){m.visible=false;return;}if(u.t>5)m.material.opacity=1-(u.t-5)/2;});
  PAN.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){m.visible=false;return;}m.material.opacity=1-k;m.scale.setScalar(1+k*.15);});
  if(typeof updateFX2==='function')updateFX2(dt);if(typeof updateSlashes==='function')updateSlashes(dt);
}
let shakeAmt=0;
function shake(a,pos){if(pos&&ME){const d=Math.hypot(pos.x-ME.pos.x,pos.z-ME.pos.z);a*=clamp(1-d/40,0,1);}shakeAmt=Math.max(shakeAmt,a);}
function screenFlash(o,pos){if(pos&&ME&&Math.hypot(pos.x-ME.pos.x,pos.z-ME.pos.z)>30)return;const f=$('flash');f.style.transition='none';f.style.opacity=o;requestAnimationFrame(()=>{f.style.transition='opacity .35s';f.style.opacity=0;});}
function sndAt(p){if(!p){AU.pan=0;return 1;}const e=camera.matrixWorld.elements,dx=p.x-camera.position.x,dz=p.z-camera.position.z,dc=Math.hypot(dx,dz)||1;AU.pan=(dx*e[0]+dz*e[2])/dc*Math.min(1,dc/8);
  if(!ME)return 1;const d=Math.hypot(p.x-ME.pos.x,p.z-ME.pos.z);return clamp(1-d/55,0,1)*(d<6?1:.85);}

function hitSpark(pt,color,heavy){
  burst(ADD,pt,heavy?55:22,{colors:[0xffffff,color,color],speed:heavy?16:10,life:heavy?.4:.28,size:heavy?.35:.25,size1:0,drag:4,grav:4,bright:2.5});
  burst(ADD,pt,heavy?14:6,{colors:[0xffffff],speed:heavy?26:18,life:.12,size:.5,size1:.1,drag:6,bright:3});
  ring(pt,color,heavy?2.8:1.4,heavy?.32:.2,false,2.5);orb(pt,0xffffff,heavy?.7:.35,.1,2);flashLight(pt,color,heavy?14:6);
}
function blockSpark(pt){burst(ADD,pt,16,{colors:[0xbfe8ff,0x6fb6ff],speed:9,life:.22,size:.22,drag:5,bright:2.5});ring(pt,0x6fb6ff,1.2,.18,false,2.5);flashLight(pt,0x6fb6ff,4);}
function dust(pos,n,s){burst(SMK,TMP2.set(pos.x,.15,pos.z),n,{colors:[0x8a8076,0x6a625a],speed:3.5*(s||1),up:.6,life:.9,size:.5*(s||1),size1:1.6*(s||1),drag:2.5,grav:-.4,hemi:true,flat:true});}
function explosion(pos,radius,cols,smoke){
  orb(pos,cols[0],radius*.75,.45,3);orb(pos,0xffffff,radius*.35,.2,4);
  ring(TMP.set(pos.x,.15,pos.z),cols[0],radius*1.4,.5,true,3);ring(TMP.set(pos.x,.25,pos.z),0xffffff,radius*.9,.3,true,2);
  burst(ADD,pos,Math.floor(80+radius*25),{colors:[0xffffff].concat(cols),speed:radius*4,life:.7,size:.6,size1:0,drag:2.5,grav:2,bright:2.2,rad:.5});
  burst(ADD,pos,40,{colors:cols,speed:radius*7,life:.35,size:.4,size1:0,drag:4,bright:3});
  if(smoke!==false)burst(SMK,pos,40,{colors:[0x2a2526,0x403838,0x5a4e4a],speed:radius*1.6,up:2,life:1.8,size:1.2,size1:3.5,drag:1.6,grav:-.6});
  flashLight(TMP.set(pos.x,pos.y+1,pos.z),cols[0],26);scorch(pos.x,pos.z,radius*1.3);shake(.9,pos);
}
function miniBlast(pt,s){
  const sc=AU.scale;AU.scale=sndAt(pt);
  orb(pt,0xff7a10,.7*s,.18,3);orb(pt,0xffffff,.3*s,.08,3);ring(pt,0xffb347,1.8*s,.22,false,2.5);
  burst(ADD,pt,Math.floor(26*s),{colors:[0xffffff,0xffd04a,0xff7a10,0xff3010],speed:7*s,life:.35,size:.4*s,size1:0,drag:3,grav:-1,bright:2.4});
  burst(SMK,pt,Math.floor(7*s),{colors:[0x2a2526,0x403838],speed:2*s,up:1.5,life:1,size:.5*s,size1:1.6*s,drag:2,grav:-.6});
  flashLight(pt,0xff7a10,8*s);AU.noise(.28,.55*Math.min(s,1.2),'lowpass',2800,180,1);AU.tone('sine',130,40,.22,.5*Math.min(s,1.2));AU.scale=sc;
}
function spikeFire(x,z){burst(ADD,TMP.set(x,.3,z),14,{colors:[0xff5a1f,0xffb347,0xffffff],speed:2,up:9,life:.6,size:.6,size1:0,drag:2,bright:2.2});}
function breakProp(p,fromNet){
  if(p.broken)return;if(NET.role==='client'&&!fromNet)return;
  p.broken=true;p.g.visible=false;const c=new V3(p.x,.8,p.z);const sc=AU.scale;AU.scale=sndAt(c);
  if(p.kind==='car'){explosion(c,3.2,[0xff7a20,0xffc24a,0xff3b10]);debris(c,16,3,11,.5);AU.boom(false);AU.crash();}
  else{debris(c,p.kind==='cone'?4:10,p.kind==='crate'?2:0,8,p.kind==='cone'?.18:.3);dust(c,10);AU.crash();shake(.25,c);}
  AU.scale=sc;
}

/* ---- lightning bolts (multi-segment, layered glow) ---- */
const boltGeo=new THREE.CylinderGeometry(1,1,1,8,1,true);
const BOLTS=pool(220,()=>new THREE.Mesh(boltGeo,new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
function bolt(a,b,color,w,life){
  if(!nearCam(a,110)&&!nearCam(b,110))return;
  const n=Math.max(4,Math.min(14,Math.floor(a.distanceTo(b)/1.2)));const pts=[a.clone()];
  const d=new V3().subVectors(b,a),L=d.length();const side=new V3(-d.z,0,d.x).normalize();
  for(let i=1;i<n;i++){const p=a.clone().lerp(b,i/n);const j=L*.06*Math.sin(i/n*Math.PI);p.addScaledVector(side,rand(-1,1)*j*1.6);p.y+=rand(-1,1)*j;pts.push(p);}pts.push(b.clone());
  for(const [wm,cm,br] of [[1,color,.9],[.3,0xffffff,1.6]])for(let i=0;i<pts.length-1;i++){const m=BOLTS.get();const p0=pts[i],p1=pts[i+1];const dd=TMP3.subVectors(p1,p0),len=dd.length()||.01;
    m.visible=true;m.position.copy(p0).add(p1).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,dd.divideScalar(len));const ww=(w||.07)*wm;m.scale.set(ww,len,ww);
    m.material.color.setHex(cm).multiplyScalar(br);m.material.opacity=1;m.userData={t:0,life:life||.16};}
  flashLight(b,color,5);
}
/* ---- swing trails (ribbons that follow fists/feet during attacks) ---- */
class Trail{
  constructor(n){this.n=n;this.a=[];this.b=[];this.l=new Float32Array(n);for(let i=0;i<n;i++){this.a.push(new V3());this.b.push(new V3());}
    const g=new THREE.BufferGeometry();this.pos=new Float32Array(n*2*3);this.col=new Float32Array(n*2*3);
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('color',new THREE.BufferAttribute(this.col,3));
    const idx=[];for(let i=0;i<n-1;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}g.setIndex(idx);
    this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    this.mesh.frustumCulled=false;scene.add(this.mesh);this.c=new THREE.Color();}
  push(a,b){for(let i=this.n-1;i>0;i--){this.a[i].copy(this.a[i-1]);this.b[i].copy(this.b[i-1]);this.l[i]=this.l[i-1];}this.a[0].copy(a);this.b[0].copy(b);this.l[0]=1;}
  update(dt,active,a,b,color){
    if(active){if(this.l[0]<=0){for(let i=0;i<this.n;i++){this.a[i].copy(a);this.b[i].copy(b);this.l[i]=0;}}this.push(a,b);}
    else for(let i=0;i<this.n;i++)this.l[i]=Math.max(0,this.l[i]-dt*7);
    this.c.setHex(color);let any=false;
    for(let i=0;i<this.n;i++){const f=this.l[i]*(1-i/this.n);if(f>0)any=true;const k=i*6;
      this.pos[k]=this.a[i].x;this.pos[k+1]=this.a[i].y;this.pos[k+2]=this.a[i].z;this.pos[k+3]=this.b[i].x;this.pos[k+4]=this.b[i].y;this.pos[k+5]=this.b[i].z;
      this.col[k]=this.c.r*f*.4;this.col[k+1]=this.c.g*f*.4;this.col[k+2]=this.c.b*f*.4;this.col[k+3]=this.c.r*f*1.6;this.col[k+4]=this.c.g*f*1.6;this.col[k+5]=this.c.b*f*1.6;}
    this.mesh.visible=any;const at=this.mesh.geometry.attributes;at.position.needsUpdate=at.color.needsUpdate=true;}
  dispose(){scene.remove(this.mesh);this.mesh.geometry.dispose();}
}
/* ---- portals ---- */
const [pc,pg2]=cv(256,256);{const gr=pg2.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'rgba(10,0,30,1)');gr.addColorStop(.55,'rgba(60,20,160,.9)');gr.addColorStop(.8,'rgba(150,220,255,.9)');gr.addColorStop(1,'rgba(0,0,0,0)');pg2.fillStyle=gr;pg2.fillRect(0,0,256,256);
  pg2.strokeStyle='rgba(200,240,255,.6)';pg2.lineWidth=3;for(let k=0;k<6;k++){pg2.beginPath();for(let a=0;a<6.28*2;a+=.1){const r=20+a*8;pg2.lineTo(128+Math.cos(a+k)*r,128+Math.sin(a+k)*r);}pg2.stroke();}}
const portalT=tex(pc);
const PORTALS=pool(6,()=>{const g=new THREE.Group();const d=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({map:portalT,transparent:true,depthWrite:false,side:THREE.DoubleSide}));g.add(d);
  const r=new THREE.Mesh(new THREE.TorusGeometry(1,.06,12,64),addMat(0x9ff0ff,2.4));g.add(r);return g;});
function portal(pos,size,flat,dur,face){if(!nearCam(pos,110))return;const g=PORTALS.get();g.visible=true;g.position.copy(pos);g.rotation.set(flat?-Math.PI/2:0,flat?0:(face||0),0);g.userData={t:0,dur:dur||.8,size};g.scale.setScalar(.05);}
function updateFX2(dt){
  BOLTS.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;if(u.t>u.life){m.visible=false;return;}m.material.opacity=(1-u.t/u.life)*(Math.random()<.3?.4:1);});
  PORTALS.a.forEach(g=>{if(!g.visible)return;const u=g.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){g.visible=false;return;}
    const s=k<.2?k/.2:(k>.8?(1-k)/.2:1);g.scale.setScalar(Math.max(.05,s*u.size));g.children[0].rotation.z+=dt*4;});
}
