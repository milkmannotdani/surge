/* REALISTIC BLOOD — replaces the flat red dots and circles everywhere blood shows up:
   • droplets: glossy, wet 3D drops that stretch along their motion, fall with gravity and leave a splat where they land
   • splatter: painted splat textures (a thick body, satellite drops with tails, smears and drips) with a wet sheen,
     on the ground and running down walls
   • every red "blood" particle burst in the game (gore, blood-style moves, bleeding) is turned into droplets
   • Marrow's BLOOD ARROW (and Rotten Chimera's BLOOD TORRENT) become a heavy, churning stream of liquid blood with
     an explosive splash at the source, drops shedding off it and a trail of splatter on the ground below. */
const BFX={drops:[],max:1400,dec:[],decMax:260};
const BFX_MAT=new THREE.MeshPhysicalMaterial({color:0x6a0008,roughness:.14,metalness:0,clearcoat:1,clearcoatRoughness:.08,emissive:0x1a0002});
const BFX_GEO=new THREE.SphereGeometry(1,8,6);
let BFX_IM=null;const _bm=new THREE.Matrix4(),_bq=new THREE.Quaternion(),_bs=new V3(),_bv=new V3(),_bc=new THREE.Color(),_UP=new V3(0,1,0);
function bfxInit(){if(BFX_IM)return;BFX_IM=new THREE.InstancedMesh(BFX_GEO,BFX_MAT,BFX.max);BFX_IM.count=0;BFX_IM.frustumCulled=false;BFX_IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<BFX.max;i++){BFX_IM.setColorAt(i,_bc.setHex(0xffffff));}scene.add(BFX_IM);}
// spray droplets from p. dir (optional) biases them, spread 0..1
function bloodDrops(p,n,speed,dir,spread,up){if(!nearCam(p,90)||n<=0)return;bfxInit();if(BFX_IM.parent!==scene)scene.add(BFX_IM);
  n=Math.min(n,160);for(let k=0;k<n;k++){if(BFX.drops.length>=BFX.max)BFX.drops.shift();
    let dx=rand(-1,1),dy=rand(-1,1),dz=rand(-1,1);const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;const sp=(speed||6)*Math.pow(Math.random(),.6);
    const v=new V3(dx*sp,dy*sp+(up==null?2.5:up)*Math.random(),dz*sp);if(dir){const s=spread==null?.35:spread;v.multiplyScalar(s).addScaledVector(dir,(speed||6)*rand(.5,1.2)*(1-s*.5));}
    const s=Math.random()<.12?rand(.05,.085):rand(.014,.04);
    BFX.drops.push({p:p.clone().add(TMP2.set(rand(-.08,.08),rand(-.08,.08),rand(-.08,.08))),v,s,g:floorAt(p.x,p.z,p.y+.5),t:0,c:Math.random()});}}
onEv('tick',dt=>{if(!BFX_IM)return;let n=0,splats=0;
  for(let i=BFX.drops.length-1;i>=0;i--){const D=BFX.drops[i];D.t+=dt;D.v.y-=19*dt;D.v.multiplyScalar(1-dt*.35);D.p.addScaledVector(D.v,dt);
    if(D.p.y<=D.g+.02||D.t>3||!inMatch()){if(D.t<=3&&inMatch()&&splats<14&&(D.s>.03||Math.random()<.18)){splats++;bloodDecal(D.p.x,D.p.z,D.g,D.s*rand(5,9),false,'drop',D.v);}BFX.drops.splice(i,1);}}
  for(let i=0;i<BFX.drops.length&&n<BFX.max;i++){const D=BFX.drops[i];const sp=D.v.length();_bv.copy(D.v).divideScalar(sp||1);_bq.setFromUnitVectors(_UP,_bv);
    _bs.set(D.s,D.s*(1+Math.min(sp*.13,3.2)),D.s);_bm.compose(D.p,_bq,_bs);BFX_IM.setMatrixAt(n,_bm);_bc.setRGB(.75+D.c*.35,.75+D.c*.25,.75+D.c*.25);BFX_IM.setColorAt(n,_bc);n++;}
  BFX_IM.count=n;BFX_IM.instanceMatrix.needsUpdate=true;if(BFX_IM.instanceColor)BFX_IM.instanceColor.needsUpdate=true;});
onEv('matchEnd',()=>{BFX.drops.length=0;if(BFX_IM)BFX_IM.count=0;});

/* ---------- painted splatter textures ---------- */
const SPLAT_TEX={};
function splatTex(kind,v){const key=kind+v;if(SPLAT_TEX[key])return SPLAT_TEX[key];const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d');
  let seed=v*977+kind.length*131;const R=()=>{seed=(seed*16807)%2147483647;return (seed%10000)/10000;};
  const col=(a)=>{const r=60+R()*40|0,g=R()*6|0,b=4+R()*8|0;return `rgba(${r},${g},${b},${a})`;};
  const blob=(cx,cy,r,pts,amp,fill)=>{x.beginPath();for(let i=0;i<=pts;i++){const a=i/pts*6.283,k=r*(1-amp/2+amp*R());const px=cx+Math.cos(a)*k,py=cy+Math.sin(a)*k;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.fillStyle=fill;x.fill();};
  const drop=(cx,cy,a,len,w)=>{x.save();x.translate(cx,cy);x.rotate(a);x.beginPath();x.ellipse(0,0,len,w,0,0,6.283);x.fillStyle=col(.95);x.fill();x.restore();};
  const tail=(x0,y0,x1,y1,w)=>{x.strokeStyle=col(.85);x.lineWidth=w;x.lineCap='round';x.beginPath();x.moveTo(x0,y0);x.quadraticCurveTo((x0+x1)/2+(R()-.5)*14,(y0+y1)/2+(R()-.5)*14,x1,y1);x.stroke();};
  const c=S/2;
  if(kind==='splat'||kind==='pool'||kind==='drip'){const r0=kind==='pool'?S*.3:S*.2;
    for(let i=0;i<(kind==='pool'?7:4);i++)blob(c+(R()-.5)*r0*.7,c+(R()-.5)*r0*.7,r0*(.6+R()*.5),36,.35,col(.96));
    const nd=kind==='pool'?10:26;for(let i=0;i<nd;i++){const a=R()*6.283,d=r0*(1.05+R()*1.25),px=c+Math.cos(a)*d,py=c+Math.sin(a)*d,w=Math.max(1.2,(1.9-d/r0)*5*R()+1);
      if(R()<.6)tail(c+Math.cos(a)*r0*.8,c+Math.sin(a)*r0*.8,px,py,w*.7);drop(px,py,a,w*1.8,w);}
    if(kind==='drip')for(let i=0;i<6;i++){const px=c+(R()-.5)*r0*1.6,len=S*.15+R()*S*.3;tail(px,c,px+(R()-.5)*6,c+len,2+R()*4);drop(px,c+len,Math.PI/2,5,4);}}
  else if(kind==='smear'){// a dragged smear with streaks, like a body was pulled through it
    for(let i=0;i<14;i++){const t=i/13,px=S*.12+t*S*.76,w=S*(.2-t*.12)*(.8+R()*.4);blob(px,c+(R()-.5)*10,w,24,.3,col(.75+.2*(1-t)));}
    for(let i=0;i<10;i++){const y=c+(R()-.5)*S*.3,x0=S*(.1+R()*.2),x1=S*(.6+R()*.35);tail(x0,y,x1,y+(R()-.5)*16,1.5+R()*4);if(R()<.5)drop(x1,y,0,4,3);}
    for(let i=0;i<14;i++){const a=R()*6.283,px=S*(.15+R()*.75),py=c+(R()-.5)*S*.6;drop(px,py,a,2+R()*4,1.5+R()*2.5);}}
  else{// a single landed drop, with a crown of tiny specks
    blob(c,c,S*.22,24,.25,col(.97));for(let i=0;i<9;i++){const a=R()*6.283,d=S*(.26+R()*.18);drop(c+Math.cos(a)*d,c+Math.sin(a)*d,a,4+R()*6,2+R()*3);}}
  // darker, thicker middle — fresh blood pools darker
  const gr=x.createRadialGradient(c,c,0,c,c,S*.45);gr.addColorStop(0,'rgba(20,0,2,.55)');gr.addColorStop(1,'rgba(20,0,2,0)');x.globalCompositeOperation='source-atop';x.fillStyle=gr;x.fillRect(0,0,S,S);x.globalCompositeOperation='source-over';
  const T=new THREE.CanvasTexture(cv);T.anisotropy=4;SPLAT_TEX[key]=T;return T;}
const SPLAT_MATS={};
function splatMat(kind,v,wall){const key=kind+v+(wall?'w':'');if(SPLAT_MATS[key])return SPLAT_MATS[key];
  const m=new THREE.MeshStandardMaterial({map:splatTex(kind,v),transparent:true,roughness:.16,metalness:.08,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:wall?THREE.DoubleSide:THREE.FrontSide});
  SPLAT_MATS[key]=m;return m;}
const SPLAT_GEO=new THREE.PlaneGeometry(2,2);
// realistic replacements for gore.js' ground decals and wall splats (same signatures, plus an optional kind and direction)
bloodDecal=function(x,z,y,r,grow,kind,dir){if(typeof GORE==='undefined')return;kind=kind||(r>1.2?'pool':Math.random()<.25?'smear':'splat');
  const m=new THREE.Mesh(SPLAT_GEO,splatMat(kind,(Math.random()*4)|0));m.rotation.x=-Math.PI/2;
  m.rotation.z=dir?Math.atan2(-dir.z,dir.x):Math.random()*6.28;m.position.set(x,(y==null?floorAt(x,z,4):y)+.03+Math.random()*.004,z);m.scale.setScalar(grow?.05:r);m.renderOrder=1;scene.add(m);
  GORE.decals.push({m,r,t:0,grow,shared:true});if(GORE.decals.length>BFX.decMax){const o=GORE.decals.shift();scene.remove(o.m);}};
wallSplat=function(p,n){if(typeof GORE==='undefined')return;const m=new THREE.Mesh(SPLAT_GEO,splatMat('drip',(Math.random()*4)|0,true));m.position.copy(p).addScaledVector(n,.04);m.lookAt(p.clone().add(n));
  m.rotateZ(Math.PI);m.scale.setScalar(.7+Math.random()*.6);scene.add(m);GORE.decals.push({m,r:1,t:1,grow:false,shared:true});};
bloodBurst=function(p,n,sp){bloodDrops(p,Math.round(n*.75),(sp||7)*1.05,null,null,3);burst(SMK,p,Math.max(1,Math.round(n/10)),{colors:[0x4a0006,0x6a000c],speed:(sp||7)*.35,up:.6,life:.7,size:.25,size1:.55,grav:1.5,drag:2});};
// the shared plane must never be disposed when gore clears its decals
const _bfxDisp=SPLAT_GEO.dispose.bind(SPLAT_GEO);SPLAT_GEO.dispose=function(){};
// every red "blood" particle burst becomes droplets
function isBloodCol(h){const r=h>>16&255,g=h>>8&255,b=h&255;return r>=0x48&&r<=0xd0&&g<0x30&&b<0x48;}
const _bfxBurst=burst;burst=function(pool,pos,n,o){if(pool===SMK&&o&&o.colors&&o.colors.length&&isBloodCol(o.colors[0])&&!o._bfx&&(o.grav||0)>4){
    bloodDrops(pos,Math.max(1,Math.round(n*.8)),(o.speed||4)+(o.up||0)*.3,o.dir||null,o.dir?.4:null,o.up||1);if(n>6)_bfxBurst(pool,pos,Math.round(n/8),Object.assign({},o,{_bfx:1,size:(o.size||.1)*2.4,size1:(o.size||.1)*3,grav:1.5,colors:[0x4a0006,0x5a0008]}));return;}
  return _bfxBurst.apply(this,arguments);};

/* ---------- liquid blood stream (Marrow's BLOOD ARROW, Chimera's BLOOD TORRENT) ---------- */
const LB_MAT=new THREE.MeshPhysicalMaterial({color:0x5c0006,roughness:.1,metalness:0,clearcoat:1,clearcoatRoughness:.05,emissive:0x1c0001,side:THREE.DoubleSide});
const LB_MAT2=new THREE.MeshPhysicalMaterial({color:0x78000c,roughness:.15,metalness:0,clearcoat:1,transparent:true,opacity:.5,emissive:0x1a0002,side:THREE.DoubleSide,depthWrite:false});
function liquidBeam(){const g=new THREE.Group();const RS=22,LS=70;
  const mk=(mat,rr)=>{const geo=new THREE.CylinderGeometry(1,1,1,RS,LS,true);geo.rotateX(Math.PI/2);geo.translate(0,0,.5);const m=new THREE.Mesh(geo,mat);m.frustumCulled=false;g.add(m);
    return {m,geo,base:Float32Array.from(geo.attributes.position.array),rr};};
  const core=mk(LB_MAT,1),sheet=mk(LB_MAT2,1.25),sheet2=mk(LB_MAT2,.8);
  const spikes=[];for(let i=0;i<16;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.09,1,5),LB_MAT);s.geometry.translate(0,.5,0);g.add(s);spikes.push({s,a:rand(0,6.28),ph:rand(0,9)});}
  scene.add(g);g.visible=false;
  const L={g,core,sheet,sheet2,spikes,
    update(org,dir,len,rad,t){g.visible=true;g.position.copy(org);g.quaternion.setFromUnitVectors(new V3(0,0,1),dir.clone().normalize());
      [[core,1,6,.3],[sheet,1.15,9,.45],[sheet2,.75,13,.6]].forEach(([P,rr,fl,amp],li)=>{const a=P.geo.attributes.position,B=P.base;
        for(let i=0;i<a.count;i++){const bx=B[i*3],by=B[i*3+1],bz=B[i*3+2],ang=Math.atan2(by,bx);
          // thickness bulges travel down the stream; the surface churns; the outer sheets tear into streaks
          const zz=bz*len,flow=zz-t*fl*6;let r=rad*rr*(.78+.28*Math.sin(flow*.45+li)+.16*Math.sin(flow*1.7+ang*3+li*2)+amp*.25*Math.sin(ang*(5+li*2)+flow*.9));
          if(li>0)r*=.75+.5*Math.max(0,Math.sin(ang*7+flow*.6+li));const taper=Math.min(1,zz/1.2)*(1-Math.max(0,(zz-len+2)/2)*.4);r*=.35+.65*taper;
          a.setXYZ(i,Math.cos(ang)*r+Math.sin(flow*.3+li)*.12*rad,Math.sin(ang)*r-Math.pow(zz/Math.max(len,1),2)*.6*rad,zz);}
        a.needsUpdate=true;P.geo.computeVertexNormals();});
      // the explosive splash where it leaves the body
      spikes.forEach((S,i)=>{const l=rad*(.8+1.1*Math.abs(Math.sin(t*13+S.ph)));S.s.scale.set(rad*.7,l,rad*.7);const a=S.a+t*2;S.s.position.set(0,0,.2);
        S.s.quaternion.setFromUnitVectors(new V3(0,1,0),new V3(Math.cos(a)*.9,Math.sin(a)*.9,.55+.4*Math.sin(t*7+S.ph)).normalize());});
      // drops shed off the stream, and splatter rains onto the ground beneath it
      const d=dir.clone().normalize();for(let q=0;q<3;q++){const u=Math.random()*len,p=org.clone().addScaledVector(d,u).add(TMP2.set(rand(-1,1)*rad,rand(-1,1)*rad,rand(-1,1)*rad));bloodDrops(p,2,7,d,.5,0);}
      bloodDrops(org.clone().addScaledVector(d,.3),4,9,d,.9,1);
      if(Math.random()<.5){const u=rand(1,len),p=org.clone().addScaledVector(d,u);bloodDecal(p.x+rand(-1,1)*rad,p.z+rand(-1,1)*rad,null,rand(.4,1)*Math.max(1,rad),false,Math.random()<.6?'smear':'splat',d);}},
    hide(){g.visible=false;},dispose(){scene.remove(g);}};
  return L;}
// Marrow's BLOOD ARROW: hide the glowing tubes and draw a liquid stream in their place
const _bfxUp=Fighter.prototype.update;Fighter.prototype.update=function(dt){const r=_bfxUp.apply(this,arguments);const B=this.rig&&this.rig.beam;
  if(B&&this.hero&&this.hero.ult==='bloodarrow'){const on=B.group.visible&&this.state==='ult'&&!this.ultAlt&&!this.dead;
    if(on){if(!this._lb)this._lb=liquidBeam();B.tubes.forEach(m=>m.visible=false);B.rings.forEach(m=>m.visible=false);B.muzzle.visible=false;
      const dir=this.beamDir||this.fwd(),org=B.group.position.clone(),rad=B.group.scale.x*.5,len=this.beamLen||48;this._lb.update(org,dir,len,rad,game.time);
      if(Math.random()<.5)bloodDrops(org.clone().addScaledVector(dir,len),8,9,dir.clone().negate(),.9,3);}
    else if(this._lb)this._lb.hide();}
  return r;};
onEv('matchEnd',()=>{for(const f of FS)if(f._lb){f._lb.dispose();f._lb=null;}});
