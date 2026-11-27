/* Fighter-select SIGNATURE ROUTINES (loaded after selectanim.js).
   Every fighter that has an inspiration gets a hand-made routine built from that inspiration's mannerisms and
   powers (all poses are original — no copied shots), and a few original fighters get set-pieces:
     ROTTEN CHIMERA  starts as a bare torso; arms and legs fly in and graft on, then he stands and roars
     HEMLOCK         looses an arrow straight into the camera (the "lens" cracks), walks up, yanks it out, stows it
     MARROW          a heap of meat chunks crawls together, climbs into a body shape and becomes him
     CINDER / RIPTIDE / GALE / QUAKE  martial-arts "bending" forms: fire, water, air, earth
   A step is [pose, seconds, fxLevel] or {p:pose, d:seconds, fx, fxc:colours, on(R), tk(R,k,dt), mv:[x,y,z] root
   target, spin:radians, face:yaw, lin:linear}. SA_ROUT[id]() builds a fresh list each time. */
const SGC={FIRE:[0xffd23f,0xff8a1a,0xff4a0a,0xffb030],ICE:[0xbfefff,0x7fd8ff,0xffffff],WATER:[0x3ab8ff,0x7fe0ff,0xe8fbff,0x1a7aff],
  AIR:[0xffffff,0xe0f6ff,0xc8ecff],EARTH:[0x7a5a3a,0x5a4028,0x8a6a44,0x6a5a4a],BLOOD:[0x8a0a12,0xb01020,0x5a0008],GOLD:[0xffd23f,0xfff0a0,0xffb020],
  ACID:[0xb8ff3a,0x7aff2a,0xff6ad8],GREEN:[0x2aff6a,0x9affb0,0xe8ffe8],RED:[0xff2a3a,0xff6a6a],GOO:[0xd8b890,0xc89a70,0xf0d8b8],
  STONE:[0x4a4a52,0x5a5a62,0x3a3a42],DIRT:[0x5a4430,0x6a5038,0x4a3626],PINK:[0xff6ad8,0xffb0ea,0x6affe0],FLESH:[0x8a1020,0xb02a3a,0x6a0a14,0x9a3a30],BONE:[0xe8dcc0,0xd8c8a8]};
const sgP=o=>b_(o);
const SG_GEO={};function sgGeo(k,f){return SG_GEO[k]||(SG_GEO[k]=f());}
function sgFw(){const a=SA.R?SA.R.root.rotation.y:0;return new V3(Math.sin(a),0,Math.cos(a));}
function sgLeft(){const f=sgFw();return new V3(f.z,0,-f.x);}
function sgW(o,x,y,z){return o.localToWorld(new V3(x||0,y||0,z||0));}
function sgHand(s){return SA.R[s<0?'rF':'lF'].getWorldPosition(new V3());}
function sgFoot(s){return sgW(SA.R[s<0?'rK':'lK'],0,-.42,0);}
function sgHead(){return SA.R.head.getWorldPosition(new V3());}
function sgChest(){return sgW(SA.R.spine,0,.3,.12);}
function sgBase(){return new V3(SA.pos.x,.03,SA.pos.z);}
function sgPick(c){return Array.isArray(c)?c[Math.floor(Math.random()*c.length)]:c;}
function sgAddM(col,add){return new THREE.MeshBasicMaterial({color:col,transparent:true,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,toneMapped:false});}
function sgSolidM(col,o){return new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:.55,metalness:.05,transparent:true},o||{}));}
function sgPush(m,o){PV.scene.add(m);o.m=m;o.t=0;SA.parts.push(o);return o;}
// particles: o = {dir, spread, sp, up, g, dr, life, size, sk, solid, geo, floor, bn, rs, jit}
function sgBurst(pos,col,n,o){o=o||{};saInit();for(let i=0;i<n;i++){const mat=o.solid?sgSolidM(sgPick(col),{roughness:.35,emissive:o.em?sgPick(col):0,emissiveIntensity:o.em||0}):sgAddM(sgPick(col),o.add);
  const m=new THREE.Mesh(o.geo||SA.geo,mat);m.position.copy(pos);if(o.jit)m.position.add(new V3(rand(-o.jit,o.jit),rand(-o.jit,o.jit),rand(-o.jit,o.jit)));
  const v=new V3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(rand(.3,1)*(o.sp===undefined?2:o.sp));
  if(o.dir)v.multiplyScalar(o.spread===undefined?.3:o.spread).add(o.dir.clone().multiplyScalar(rand(.75,1.2)));if(o.up)v.y+=o.up*rand(.6,1.2);
  const s=(o.size||1)*rand(.7,1.3);m.scale.setScalar(s);if(o.rs)m.rotation.set(rand(0,6),rand(0,6),rand(0,6));
  sgPush(m,{v,life:(o.life||.6)*rand(.7,1.2),g:o.g===undefined?4:o.g,dr:o.dr===undefined?2:o.dr,s0:s,sk:o.sk===undefined?.6:o.sk,floor:o.floor,bn:o.bn,solid:o.solid,geoOwn:o.geoOwn,
    rs:o.rs?new V3(rand(-9,9),rand(-9,9),rand(-9,9)):null,cA:o.to?mat.color.clone():null,cB:o.to?new THREE.Color(o.to):null});}}
function sgRing(pos,col,r0,r1,life,o){o=o||{};saInit();const m=new THREE.Mesh(new THREE.TorusGeometry(1,o.th||.035,8,64),sgAddM(sgPick(col)));m.position.copy(pos);
  if(o.face)m.lookAt(pos.clone().add(o.face));else m.rotation.x=Math.PI/2;
  sgPush(m,{life,geoOwn:1,up:(p,k,dt)=>{const e=1-Math.pow(1-k,2);p.m.scale.setScalar(r0+(r1-r0)*e);p.m.material.opacity=(1-k)*(o.op||1);if(o.mv)p.m.position.addScaledVector(o.mv,dt);}});}
// a sweep/slash arc facing `face`, tilted by `tilt`
function sgArc(pos,col,r,life,o){o=o||{};const m=new THREE.Mesh(new THREE.TorusGeometry(r,o.th||.03,6,48,o.ang||Math.PI*1.1),sgAddM(sgPick(col)));m.position.copy(pos);
  if(o.flat){m.rotation.x=Math.PI/2;m.rotation.z=o.tilt||0;}else{m.lookAt(pos.clone().add(o.face||sgFw()));m.rotateZ(o.tilt||0);}
  sgPush(m,{life,geoOwn:1,up:(p,k,dt)=>{p.m.material.opacity=(1-k)*(o.op||1);p.m.scale.setScalar(1+k*(o.grow||.25));if(o.mv)p.m.position.addScaledVector(o.mv,dt);}});return m;}
function sgBeam(a,b,col,w,life,o){o=o||{};const d=b.clone().sub(a),L=d.length();const geo=new THREE.CylinderGeometry(w,w,L,14,1,true);geo.translate(0,L/2,0);
  const m=new THREE.Mesh(geo,sgAddM(sgPick(col),o.add!==false));m.position.copy(a);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());
  sgPush(m,{life,geoOwn:1,up:(p,k)=>{p.m.material.opacity=(1-k)*(o.op||1);const s=o.grow?Math.min(1,k*o.grow):1;p.m.scale.set(1-k*.5,s,1-k*.5);}});}
function sgBolt(a,b,col,life){const n=9,geo=new THREE.BufferGeometry().setFromPoints(Array.from({length:n+1},()=>new V3()));
  const m=new THREE.Line(geo,new THREE.LineBasicMaterial({color:sgPick(col),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.frustumCulled=false;
  const upd=()=>{const A=geo.attributes.position.array;for(let i=0;i<=n;i++){const t=i/n,j=(i===0||i===n)?0:.1;A[i*3]=lerp(a.x,b.x,t)+rand(-j,j);A[i*3+1]=lerp(a.y,b.y,t)+rand(-j,j);A[i*3+2]=lerp(a.z,b.z,t)+rand(-j,j);}geo.attributes.position.needsUpdate=true;};
  upd();sgPush(m,{life,geoOwn:1,up:(p,k)=>{upd();p.m.material.opacity=Math.random()<.25?0:1-k;}});}
// spikes / rocks that grow out of the floor and sink back
function sgSpikes(pts,col,h,o){o=o||{};pts.forEach((pt,i)=>{const hh=h*rand(.7,1.25);const geo=o.rock?new THREE.DodecahedronGeometry(hh*.32,0):new THREE.ConeGeometry((o.w||.08)*rand(.8,1.3),hh,o.sides||5);
  if(!o.rock)geo.translate(0,hh/2,0);const m=new THREE.Mesh(geo,sgSolidM(sgPick(col),o.mat));m.position.copy(pt);m.rotation.set(rand(-.35,.35)*(o.lean===undefined?1:o.lean),rand(0,6),rand(-.35,.35)*(o.lean===undefined?1:o.lean));
  if(o.rock)m.scale.set(1,.7,1.1);const dl=(o.delay||0)*i,L=o.life||1.3;m.visible=false;
  sgPush(m,{life:L+dl,geoOwn:1,up:(p,k)=>{const t=p.t-dl;if(t<0)return;p.m.visible=true;const kk=t/L,s=kk<.12?kk/.12:kk>.78?(1-kk)/.22:1;
    if(o.rock)p.m.position.y=pt.y-hh*.35+hh*.42*Math.min(1,s);else p.m.scale.set(1,Math.max(.001,s),1);if(!p.dust){p.dust=1;sgBurst(pt,o.dust||SGC.EARTH,3,{sp:1.2,up:1,size:.8,life:.4,solid:1});}}});});}
function sgCircle(c,r,n,ph){const a=[];for(let i=0;i<n;i++){const t=(ph||0)+i/n*Math.PI*2;a.push(new V3(c.x+Math.cos(t)*r,c.y,c.z+Math.sin(t)*r));}return a;}
function sgLine(c,dir,n,d0,d1,side){const s=new V3(dir.z,0,-dir.x),a=[];for(let i=0;i<n;i++){const d=lerp(d0,d1,i/(n-1||1));a.push(c.clone().addScaledVector(dir,d).addScaledVector(s,(side||0)+rand(-.12,.12)));}return a;}
function sgShake(t,amp){SA.shake=Math.max(SA.shake||0,t);SA.shakeA=amp||6;}
function sgS(k){if(typeof AU==='undefined'||!AU.ctx)return;AU.scale=.35;try{switch(k){
  case'fire':AU.noise(.35,.5,'bandpass',900,250,1);break;case'water':AU.noise(.45,.35,'lowpass',700,220,1);AU.tone('sine',300,180,.3,.05);break;
  case'wind':AU.noise(.55,.4,'bandpass',1400,400,1.5);break;case'rock':AU.noise(.3,.7,'lowpass',320,70,1);AU.tone('sine',90,38,.3,.4);break;
  case'snap':AU.noise(.04,.6,'highpass',3000,5000,1);break;case'slash':AU.noise(.14,.45,'highpass',2600,1100,1);break;
  case'shot':AU.noise(.18,.8,'lowpass',2400,180,1);AU.tone('square',190,55,.14,.15);break;case'thunk':AU.tone('sine',150,48,.16,.45);AU.noise(.09,.55,'bandpass',900,380,2);break;
  case'glass':AU.noise(.35,.45,'highpass',4200,7500,1);AU.tone('sine',2600,1800,.2,.06);break;case'squelch':AU.squelch?AU.squelch(.3,.5):AU.noise(.3,.5,'lowpass',500,120,2);break;
  case'zap':AU.noise(.12,.45,'bandpass',3200,1400,3);break;case'boom':AU.noise(.55,.8,'lowpass',650,55,1);AU.tone('sine',80,28,.55,.45);break;
  case'sparkle':AU.tone('sine',1250,1850,.15,.1);AU.tone('sine',1650,2450,.15,.08,.07);break;case'note':AU.tone('triangle',660,660,.11,.12);AU.tone('triangle',880,880,.11,.12,.12);AU.tone('triangle',990,990,.14,.12,.24);break;
  case'creak':AU.noise(.6,.25,'bandpass',260,520,6);break;case'crack':AU.noise(.05,.6,'highpass',2500,4000,1);AU.noise(.05,.5,'highpass',2500,4000,1,.09);break;
  case'whoosh':AU.whoosh&&AU.whoosh(true);break;case'clap':AU.noise(.06,.7,'bandpass',1800,1200,1);break;}}catch(e){}AU.scale=1;}
// walk cycle on top of the step's pose
function sgWalk(R,amp,arms){const P=R.P,ph=SA.clock*8.5,s=Math.sin(ph);amp=amp||1;P.lHx=(P.lHx||0)-.45*s*amp;P.rHx=(P.rHx||0)+.45*s*amp;
  P.lK=(P.lK||0)+.5*Math.max(0,Math.sin(ph+1.3))*amp;P.rK=(P.rK||0)+.5*Math.max(0,-Math.sin(ph+1.3))*amp;P.hy=(P.hy||0)-.03*Math.abs(s)*amp;
  if(arms!==false){P.lSx=(P.lSx||0)+.35*s*amp;P.rSx=(P.rSx||0)-.35*s*amp;}}
function sgOnce(S,key,cond,fn){if(cond&&!S[key]){S[key]=1;fn();}}
// a frozen double of the fighter (LEGION) — shares meshes/materials, so it is never disposed
function sgClone(R,off,life,col){const c=R.root.clone(true);c.position.copy(R.root.position).add(off);c.rotation.copy(R.root.rotation);c.scale.setScalar(.01);
  sgPush(c,{life,keepMat:1,up:(p,k)=>{const s=R.root.scale.x*(k<.12?k/.12:k>.84?Math.max(.01,(1-k)/.16):1);p.m.scale.setScalar(Math.max(.01,s));
    if(k>.84&&!p.pop){p.pop=1;sgBurst(c.position.clone().add(new V3(0,1,0)),col,26,{sp:2.5,up:1.5,size:1.5,solid:1,life:.8,floor:.03,bn:.2});sgS('squelch');}}});
  sgBurst(c.position.clone().add(new V3(0,1,0)),col,20,{sp:2.2,up:1,size:1.4,solid:1,life:.7,floor:.03});}

/* ---- HEMLOCK: arrow into the lens ---- */
function sgCrack(){let c=document.getElementById('saCrack');const pv=$('pv');if(!pv)return null;
  if(!c){c=document.createElement('canvas');c.id='saCrack';c.style.cssText='position:absolute;pointer-events:none;z-index:1';pv.parentElement.insertBefore(c,pv.nextSibling);}
  c.style.left=pv.offsetLeft+'px';c.style.top=pv.offsetTop+'px';c.style.width=pv.offsetWidth+'px';c.style.height=pv.offsetHeight+'px';
  if(c.width!==pv.offsetWidth||c.height!==pv.offsetHeight){c.width=pv.offsetWidth;c.height=pv.offsetHeight;}return c;}
function sgCrackDraw(x,y,a){const c=sgCrack();if(!c)return;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);if(a<=0)return;
  if(!SA.crackSeed){SA.crackSeed=[];for(let i=0;i<13;i++){const pts=[];let ang=i/13*Math.PI*2+rand(-.2,.2),r=0;while(r<Math.min(c.width,c.height)*.55){r+=rand(14,38);ang+=rand(-.32,.32);pts.push([Math.cos(ang)*r,Math.sin(ang)*r]);}SA.crackSeed.push(pts);}}
  g.save();g.translate(x,y);g.globalAlpha=a;g.lineCap='round';
  for(const pass of [[4,'rgba(0,0,0,.35)'],[1.6,'rgba(235,248,255,.95)']]){g.lineWidth=pass[0];g.strokeStyle=pass[1];
    for(const pts of SA.crackSeed){g.beginPath();g.moveTo(0,0);pts.forEach(p=>g.lineTo(p[0],p[1]));g.stroke();}
    for(let ring=1;ring<=3;ring++){g.beginPath();SA.crackSeed.forEach((pts,i)=>{const p=pts[Math.min(pts.length-1,ring*2)];if(i===0)g.moveTo(p[0],p[1]);else g.lineTo(p[0],p[1]);});g.closePath();g.stroke();}}
  const rg=g.createRadialGradient(0,0,2,0,0,46);rg.addColorStop(0,'rgba(255,255,255,.75)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.beginPath();g.arc(0,0,46,0,Math.PI*2);g.fill();g.restore();}
function sgArrowMesh(){const g=new THREE.Group();const wood=new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.7}),steel=new THREE.MeshStandardMaterial({color:0xb8bcc4,metalness:.9,roughness:.25}),
  fl=new THREE.MeshStandardMaterial({color:0x8a1a14,roughness:.8,side:THREE.DoubleSide});
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.78,8),wood);sh.position.y=-.39;g.add(sh);
  const hd=new THREE.Mesh(new THREE.ConeGeometry(.026,.09,4),steel);hd.position.y=.04;g.add(hd);
  for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.PlaneGeometry(.05,.13),fl);f.position.y=-.7;f.rotation.y=i*Math.PI*2/3;f.translateX(.026);g.add(f);}
  return g;}
function sgArrowPoint(g,tip,dir){g.position.copy(tip);g.quaternion.setFromUnitVectors(new V3(0,1,0),dir.clone().normalize());}

const SA_ROUT={
 /* ---------------- set-pieces ---------------- */
 chimera:()=>{const L={};const lim=['lS','rS','lH','rH'],off={lS:new V3(2.2,.9,1.4),rS:new V3(-2.4,1.6,-.4),lH:new V3(-.6,-1.1,2.0),rH:new V3(.9,-1.1,-2.0)};
  const fly=(key,dur)=>({p:null,d:dur,on:R=>{const o=R[key];if(!o)return;o.visible=true;},tk:(R,k,dt,S)=>{const o=R[key];if(!o)return;const e=k*k*(3-2*k);
      o.position.copy(L[key]).addScaledVector(off[key],1-e);o.position.y+=Math.sin(k*Math.PI)*.5*(1-e);
      sgOnce(S,'hit',k>=.92,()=>{const w=o.getWorldPosition(new V3());sgBurst(w,SGC.BLOOD,26,{sp:2.6,up:1.2,size:1.1,solid:1,life:.8,floor:.03,bn:.15});sgBurst(w,SGC.BONE,5,{sp:1.6,up:1,size:.7,solid:1,life:.6,floor:.03});sgS('squelch');sgShake(.15,4);});}});
  const torso=sgP({hy:-.72,sx:.3,hd:.1,lSx:-.9,lSz:.6,lE:-.6,rSx:-.9,rSz:-.6,rE:-.6,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3});
  const steps=[
   {p:torso,d:.5,q:1,on:R=>{lim.forEach(k=>{if(R[k]){L[k]=R[k].position.clone();R[k].visible=false;}});SA.clean.push(()=>lim.forEach(k=>{if(R[k]&&L[k]){R[k].position.copy(L[k]);R[k].visible=true;}}));
     sgBurst(sgBase().add(new V3(0,.2,0)),SGC.BLOOD,14,{sp:1.4,up:.6,size:1,solid:1,life:.7,floor:.03});}},
   {p:sgP({hy:-.72,sx:.5,sz:.15,hd:.3,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3}),d:.3,tk:R=>{R.P.sz+=Math.sin(SA.clock*40)*.08;R.P.hd+=Math.sin(SA.clock*33)*.1;}},
   {p:sgP({hy:-.72,sx:.2,sz:-.12,hd:-.2,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3}),d:.25},
   Object.assign(fly('lS',.45),{p:sgP({hy:-.72,sx:.25,sz:-.1,hd:-.1,lSx:-.6,lSz:1.2,lE:-.4,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3})}),
   {p:sgP({hy:-.72,sx:.3,hd:.05,lSx:-.4,lSz:.3,lE:-.2,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3}),d:.18,tk:R=>{R.P.lSz+=Math.sin(SA.clock*30)*.25;}},
   Object.assign(fly('rS',.45),{p:sgP({hy:-.72,sx:.25,sz:.1,hd:-.1,lSx:-.3,lSz:.3,lE:-.2,rSx:-.6,rSz:-1.2,rE:-.4,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3})}),
   {p:sgP({hy:-.72,sx:.6,hd:.1,lSx:-.3,lSz:.25,lE:-.1,rSx:-.3,rSz:-.25,rE:-.1,lHx:-1.5,lK:2.3,rHx:-1.5,rK:2.3}),d:.25},
   Object.assign(fly('lH',.45),{p:sgP({hy:-.6,sx:.55,hd:.1,lSx:-.3,lSz:.25,lE:-.1,rSx:-.3,rSz:-.25,rE:-.1,lHx:-1.4,lK:2.2,rHx:-1.5,rK:2.3})}),
   Object.assign(fly('rH',.45),{p:sgP({hy:-.5,sx:.55,hd:.1,lSx:-.3,lSz:.25,lE:-.1,rSx:-.3,rSz:-.25,rE:-.1,lHx:-1.3,lK:2.1,rHx:-1.3,rK:2.1})}),
   {p:sgP({hy:-.2,sx:.45,hd:.25,lSx:-.2,lSz:.4,lE:-.5,rSx:-.2,rSz:-.4,rE:-.5,lHx:-.6,lK:.9,rHx:-.3,rK:.7}),d:.5,tk:R=>{R.P.sz=Math.sin(SA.clock*9)*.08;}},
   {p:sgP({sx:-.35,hd:-.55,hy:-.1,lSx:-.7,lSz:1.25,lE:-.7,rSx:-.7,rSz:-1.25,rE:-.7,lHx:-.35,lK:.45,rHx:.25,rK:.35,lHz:.2,rHz:-.2}),d:1.0,fx:3,fxc:SGC.BLOOD,
    on:()=>{sgBurst(sgChest(),SGC.BLOOD,30,{sp:3.2,up:2,size:1.2,solid:1,life:1,floor:.03,bn:.1});sgShake(.4,7);sgS('boom');}},
   ['showcase',.45,0]];return steps;},

 hemlock:()=>{SA.face=.78;let arrow=null,tip=null,dir=null;const cam=()=>PV.cam.position.clone();
  return [
   {p:'hemReach',d:.35,face:.78},
   {p:'hemDraw',d:.3,on:()=>{arrow=sgArrowMesh();PV.scene.add(arrow);SA.clean.push(()=>{if(arrow){PV.scene.remove(arrow);arrow=null;}});},
    tk:()=>{if(arrow&&!tip){const a=sgHand(1),b=sgHand(-1);sgArrowPoint(arrow,a,a.clone().sub(b));}}},
   {p:'hemFull',d:.75,on:()=>sgS('creak'),tk:()=>{if(arrow&&!tip){const a=sgHand(1),b=sgHand(-1);sgArrowPoint(arrow,a,a.clone().sub(b));}}},
   {p:'hemLoose',d:.5,on:()=>{const from=sgHand(1),c=cam(),aim=c.clone().add(new V3(.12,-.06,0));dir=aim.clone().sub(from).normalize();
      tip=c.clone().addScaledVector(dir,-1.0);SA.arrowDir=dir.clone().add(sgLeft().multiplyScalar(-.55)).add(new V3(0,-.3,0)).normalize();SA.arrowFrom=from;sgS('shot');sgBurst(from,[0xd8c8a8,0xffffff],8,{sp:1.5,size:.6,life:.3});},
    tk:(R,k,dt,S)=>{if(!arrow||!tip)return;const t=Math.min(1,k/.22);sgArrowPoint(arrow,SA.arrowFrom.clone().lerp(tip,t),dir.clone().lerp(SA.arrowDir,t));
      sgOnce(S,'hit',t>=1,()=>{sgS('thunk');sgS('glass');sgShake(.35,10);SA.crackA=1;SA.crackTip=tip.clone();});}},
   {p:sgP({hy:-.04,sx:.02,sy:-.4,hd:-.08,sz:.06,lSx:-.6,lSz:.2,lE:-.3,rSx:-.2,rSz:-.3,rE:-.4,lHx:-.15,lK:.2,rHx:.1,rK:.15}),d:.6,face:-.08},
   {p:sgP({sx:.05,lSx:-.25,lSz:.25,lE:-.4,rSx:-.2,rSz:-.2,rE:-.4}),d:1.0,mv:[.05,0,2.7],face:-.08,tk:R=>sgWalk(R,1)},
   {p:sgP({sx:.25,hd:-.05,sy:.2,rSx:-1.75,rSz:-.15,rE:-.05,lSx:-.3,lSz:.3,lE:-.5,lHx:-.3,lK:.35,rHx:.25,rK:.2}),d:.4},
   {p:sgP({sx:-.05,sy:-.4,hd:.05,rSx:-.6,rSz:-.35,rE:-1.9,lSx:-.3,lSz:.3,lE:-.5,lHx:-.15,lK:.2,rHx:.3,rK:.3}),d:.4,
    on:()=>{sgS('glass');sgS('thunk');},tk:(R,k)=>{if(!arrow)return;const h=sgHand(-1),t=Math.min(1,k/.35);const p=tip.clone().lerp(h,t);sgArrowPoint(arrow,p,SA.arrowDir.clone().lerp(new V3(0,1,0),t));SA.crackA=Math.max(0,1-k*1.6);}},
   {p:sgP({sx:.0,rSx:-1.9,rSz:-.2,rE:-1.4,lSx:-.25,lSz:.25,lE:-.4,hd:-.15}),d:.95,mv:[0,0,0],lin:0,tk:R=>{sgWalk(R,.9,false);if(arrow){const h=sgHand(-1);sgArrowPoint(arrow,h,new V3(0,1,0).add(sgFw().multiplyScalar(-.3)));}}},
   {p:sgP({sx:-.05,hd:-.25,sy:.25,rSx:-2.3,rSz:-.25,rE:-1.2,lSx:-.25,lSz:.3,lE:-.5}),d:.5,tk:()=>{if(arrow)sgArrowPoint(arrow,sgHand(-1),new V3(0,1,0).add(sgLeft().multiplyScalar(.4)));}},
   {p:sgP({sx:.05,hd:.05,rSx:-2.85,rSz:-.25,rE:-2.4,lSx:-.25,lSz:.3,lE:-.5}),d:.4,tk:(R,k)=>{if(arrow){const h=sgHand(-1);sgArrowPoint(arrow,h,new V3(0,-1,0).add(sgFw().multiplyScalar(-.2)));if(k>.85){PV.scene.remove(arrow);arrow=null;}}}},
   ['hemHowl',.8,2],['showcase',.45,0]];},

 marrow:()=>{const chunks=[];
  return [
   {p:sgP({hy:-.35,sx:.6,hd:.4,lSx:-.3,lSz:.4,lE:-.8,rSx:-.3,rSz:-.4,rE:-.8,lHx:-.9,lK:1.5,rHx:-.7,rK:1.4}),d:2.3,q:1,on:R=>{R.root.visible=false;SA.clean.push(()=>{R.root.visible=true;});
     R.root.updateMatrixWorld(true);const nodes=['spine','spine','spine','head','neck','lS','lE','lF','rS','rE','rF','hips','hips','lH','lK','rH','rK'];
     const geoA=sgGeo('dod1',()=>new THREE.DodecahedronGeometry(1,0)),geoB=sgGeo('ico1',()=>new THREE.IcosahedronGeometry(1,0));
     const tg=[];for(const n of nodes)if(R[n])tg.push(R[n].getWorldPosition(new V3()));tg.push(sgW(R.lK,0,-.4,0),sgW(R.rK,0,-.4,0),sgW(R.spine,0,.3,0),sgW(R.spine,0,.15,.08),sgW(R.lS,0,-.15,0),sgW(R.rS,0,-.15,0),sgW(R.lH,0,-.2,0),sgW(R.rH,0,-.2,0));
     const base=sgBase();
     for(let i=0;i<54;i++){const bone=i%9===0,col=bone?sgPick(SGC.BONE):sgPick(SGC.FLESH);const m=new THREE.Mesh(i%2?geoA:geoB,sgSolidM(col,{roughness:bone?.6:.32,metalness:.05,emissive:bone?0:0x2a0004,emissiveIntensity:.5}));
       const r=(bone?.05:rand(.06,.13))*R.root.scale.x,a=rand(0,Math.PI*2),d=rand(1.2,2.6);const st=new V3(base.x+Math.cos(a)*d,.03+r,base.z+Math.sin(a)*d*.8);
       const mid=new V3(base.x+Math.cos(a)*rand(.25,.5),.03+r,base.z+Math.sin(a)*rand(.25,.5));const tgt=tg[i%tg.length].clone().add(new V3(rand(-.07,.07),rand(-.07,.07),rand(-.07,.07)));
       m.scale.set(r*rand(.8,1.3),r*rand(.7,1.1),r*rand(.8,1.3));m.position.copy(st);m.rotation.set(rand(0,6),rand(0,6),rand(0,6));const s0=m.scale.clone(),dl=rand(0,.35),ph=rand(0,6);
       chunks.push(sgPush(m,{life:2.75,geoKeep:1,up:(p,k,dt)=>{const t=p.t;
         if(t<dl){return;}const a1=Math.min(1,(t-dl)/1.1),e1=a1*a1*(3-2*a1);
         if(t<dl+1.1){p.m.position.lerpVectors(st,mid,e1);p.m.position.y=st.y+Math.abs(Math.sin(t*9+ph))*.12*(1-e1);p.m.rotation.x+=dt*4;p.m.scale.copy(s0).multiplyScalar(1+Math.sin(t*14+ph)*.12);}
         else if(t<2.2){const a2=Math.min(1,(t-dl-1.1)/(1.05-dl*.5)),e2=a2*a2*(3-2*a2);p.m.position.lerpVectors(mid,tgt,e2);p.m.position.y+=Math.sin(a2*Math.PI)*.25;p.m.rotation.y+=dt*3;
           p.m.scale.copy(s0).multiplyScalar(1+Math.sin(t*18+ph)*.15+e2*.35);if(Math.random()<.03)sgBurst(p.m.position,SGC.BLOOD,1,{sp:.6,size:.5,solid:1,life:.5,floor:.03});}
         else{const a3=Math.min(1,(t-2.2)/.5);p.m.scale.copy(s0).multiplyScalar(Math.max(.001,(1.35)*(1-a3)));}}}));}
     sgS('squelch');},
    tk:(R,k,dt,S)=>{if(Math.random()<.04)sgS('squelch');sgOnce(S,'mid',k>.5,()=>sgS('squelch'));}},
   {p:sgP({hy:-.3,sx:.55,hd:.35,lSx:-.3,lSz:.5,lE:-.9,rSx:-.3,rSz:-.5,rE:-.9,lHx:-.8,lK:1.3,rHx:-.6,rK:1.2}),d:.25,fx:3,fxc:SGC.BLOOD,
    on:R=>{R.root.visible=true;sgBurst(sgChest(),SGC.BLOOD,34,{sp:3,up:1.5,size:1.1,solid:1,life:.9,floor:.03,bn:.1});sgBurst(sgChest(),SGC.BONE,6,{sp:2,up:1,size:.6,solid:1,life:.7,floor:.03});sgS('squelch');sgShake(.3,6);}},
   {p:sgP({sx:-.3,hd:-.5,hy:-.05,lSx:-.5,lSz:1.3,lE:-.5,rSx:-.5,rSz:-1.3,rE:-.5,lHx:-.25,lK:.3,rHx:.2,rK:.25,lHz:.15,rHz:-.15}),d:.6,tk:R=>{R.P.sz=Math.sin(SA.clock*20)*.05;}},
   ['specw',.32,0],['spech',.42,2],[POSES.win?'win':'showcase',.9,0],['showcase',.45,0]];},

 /* ---------------- the original four: bending forms ---------------- */
 cinder:()=>{const fire=(s,n,sp)=>sgBurst(sgHand(s),SGC.FIRE,n,{dir:sgFw().multiplyScalar(sp||6),spread:.22,g:-2.5,dr:2.5,life:.4,size:1.5,sk:-.5,to:0x6a1206});
  const flick=(s)=>sgBurst(sgHand(s),SGC.FIRE,1,{sp:.4,up:1,g:-1.5,life:.3,size:.9,sk:-.2,to:0x8a2a0a});
  const stance=sgP({hy:-.2,sx:.08,sy:-.45,lSx:-1.35,lSz:.15,lE:-1.0,rSx:-.55,rSz:-.25,rE:-2.1,lHx:-.6,lK:.7,rHx:.4,rK:.5,lHz:.14,rHz:-.14});
  return [
   {p:sgP({sx:.1,hd:.15,lSx:-1.1,lSz:-.35,lE:-1.5,rSx:-1.1,rSz:.35,rE:-1.5}),d:.55,on:()=>sgS('fire'),tk:()=>{flick(1);flick(-1);}},   // fist-in-palm bow, flames lit
   {p:stance,d:.4,tk:()=>{flick(1);flick(-1);}},
   {p:'jabRh',d:.24,fx:1,fxc:SGC.FIRE,on:()=>sgS('fire'),tk:(R,k)=>{if(k>.2&&k<.85)fire(-1,4);}},
   {p:'jabLh',d:.24,fx:1,fxc:SGC.FIRE,on:()=>sgS('fire'),tk:(R,k)=>{if(k>.2&&k<.85)fire(1,4);}},
   {p:'jabRh',d:.22,fx:1,fxc:SGC.FIRE,on:()=>sgS('fire'),tk:(R,k)=>{if(k>.2&&k<.85)fire(-1,4);}},
   {p:sgP({hy:-.35,sx:.25,lSx:-.6,lSz:1.0,lE:-.5,rSx:-.6,rSz:-1.0,rE:-.5,lHx:-1.0,lK:1.6,rHx:.1,rHz:-.9,rK:.1}),d:.7,spin:Math.PI*2,fx:2,fxc:SGC.FIRE,on:()=>sgS('fire'),
    tk:()=>{sgBurst(sgFoot(-1),SGC.FIRE,3,{sp:.5,up:.5,g:-1.5,dr:3,life:.55,size:1.4,sk:-.3,to:0x6a1206});}},
   {p:sgP({hy:-.25,sx:.2,lSx:-1.5,lSz:-.1,lE:-.1,rSx:-1.5,rSz:.1,rE:-.1,lHx:-.7,lK:.8,rHx:.4,rK:.4}),d:.28,on:()=>sgS('fire'),tk:()=>{fire(1,3,7);fire(-1,3,7);}},
   {p:sgP({sx:-.2,hd:-.35,lSx:-2.9,lSz:.25,lE:-.2,rSx:-2.9,rSz:-.25,rE:-.2,hy:-.05,lHz:.15,rHz:-.15}),d:.6,fx:3,fxc:SGC.FIRE,
    on:()=>{sgS('boom');sgRing(sgBase(),SGC.FIRE,.3,2.2,.7,{th:.06});sgShake(.25,5);},tk:(R,k)=>{if(k<.7){for(const s of [1,-1])sgBurst(sgHand(s),SGC.FIRE,4,{dir:new V3(0,7,0),spread:.25,g:-3,life:.5,size:1.7,sk:-.6,to:0x6a1206});}}},
   {p:stance,d:.7,tk:()=>{flick(1);flick(-1);}},['showcase',.45,0]];},

 riptide:()=>{const W=SGC.WATER;let ang=0;
  const ribbon=(n,r,yy,spd,dt)=>{ang+=dt*(spd||5);const b=sgBase();for(let i=0;i<n;i++){const a=ang-i*.12;sgBurst(new V3(b.x+Math.cos(a)*r,(yy||1.1)*SA.R.root.scale.x+Math.sin(a*2)*.2,b.z+Math.sin(a)*r),W,1,{sp:.15,g:0,dr:1,life:.45,size:1.2,sk:.4});}};
  const flowA=sgP({hy:-.14,sy:.5,sz:.05,sx:.05,lSx:-1.0,lSz:.95,lE:-.35,rSx:-1.35,rSz:.35,rE:-.6,lHx:-.4,lK:.45,rHx:.25,rK:.3,lHz:.12,rHz:-.12});
  const flowB=sgP({hy:-.14,sy:-.5,sz:-.05,sx:.05,rSx:-1.0,rSz:-.95,rE:-.35,lSx:-1.35,lSz:-.35,lE:-.6,rHx:-.4,rK:.45,lHx:.25,lK:.3,lHz:.12,rHz:-.12});
  return [
   {p:sgP({hy:-.35,sx:.45,hd:.25,lSx:-.55,lSz:.35,lE:-.3,rSx:-.55,rSz:-.35,rE:-.3,lHx:-.8,lK:1.2,rHx:-.3,rK:1.0,lHz:.15,rHz:-.15}),d:.5,on:()=>sgS('water'),
    tk:()=>{const b=sgBase();for(const p of sgCircle(b,1.25,3,rand(0,6)))sgBurst(p,W,1,{dir:sgChest().sub(p).multiplyScalar(1.6),spread:.1,g:0,dr:.5,life:.5,size:1.1});}},
   {p:sgP({hy:-.1,sx:.05,hd:-.1,lSx:-1.8,lSz:.3,lE:-.4,rSx:-1.8,rSz:-.3,rE:-.4}),d:.45,tk:()=>{for(const s of [1,-1])sgBurst(sgHand(s),W,2,{sp:.4,g:0,life:.5,size:1.2});}},
   {p:flowA,d:.5,on:()=>sgS('water'),tk:(R,k,dt)=>ribbon(3,.85,1.15,6,dt)},
   {p:flowB,d:.5,tk:(R,k,dt)=>ribbon(3,.85,1.0,-6,dt)},
   {p:flowA,d:.45,tk:(R,k,dt)=>ribbon(3,.85,1.25,6,dt)},
   {p:sgP({sy:.55,sx:.2,hy:-.15,rSx:-1.6,rSz:-.05,rE:-.05,lSx:-.9,lSz:.5,lE:-1.1,rHx:.4,lHx:-.6,lK:.7,rK:.25}),d:.35,fx:2,fxc:W,on:()=>sgS('water'),
    tk:(R,k)=>{if(k<.8){const h=sgHand(-1),f=sgFw();for(let i=0;i<4;i++){const d=f.clone().multiplyScalar(7).add(sgLeft().multiplyScalar(Math.sin(SA.clock*25+i)*1.5));sgBurst(h,W,1,{dir:d,spread:.08,g:1,life:.4,size:1.3});}}}},
   {p:sgP({sx:-.15,hd:-.3,lSx:-2.5,lSz:.85,lE:-.25,rSx:-2.5,rSz:-.85,rE:-.25,hy:-.05}),d:.75,fx:3,fxc:W,on:()=>{sgS('water');sgRing(sgBase().add(new V3(0,.05,0)),W,.4,2,.8,{th:.05});},
    tk:(R,k,dt,S)=>{if(k<.55)ribbon(4,1.0-k*.6,.4+k*2.2,9,dt);else sgOnce(S,'spl',1,()=>sgBurst(sgBase().add(new V3(0,2.3,0)),W,40,{sp:2.5,g:6,life:1.1,size:1.2,floor:.03,bn:.25}));}},
   {p:flowB,d:.6},['showcase',.45,0]];},

 gale:()=>{const A=SGC.AIR;
  const swirl=(n,r,y0,y1,spd)=>{const b=sgBase();for(let i=0;i<n;i++){const a=SA.clock*(spd||10)+i*2.1,y=rand(y0,y1);const p=new V3(b.x+Math.cos(a)*r,y,b.z+Math.sin(a)*r);
      sgBurst(p,A,1,{dir:new V3(-Math.sin(a),.6,Math.cos(a)).multiplyScalar(r*spd*.5),spread:.05,g:0,dr:2,life:.4,size:.9,sk:.3});}};
  return [
   {p:sgP({hy:-.1,sx:.05,lSx:-.85,lSz:-.4,lE:-.6,rSx:-.85,rSz:.4,rE:-.6,lHx:-.25,lK:.3,rHx:.15,rK:.25}),d:.35,on:()=>sgS('wind')},
   {p:sgP({sx:-.1,hd:-.15,lSx:-2.3,lSz:1.0,lE:-.3,rSx:-2.3,rSz:-1.0,rE:-.3,rHx:-.2,rK:.4}),d:.4,tk:()=>{for(const s of [1,-1])sgBurst(sgHand(s),A,2,{sp:.5,g:0,life:.45,size:.8});}},
   {p:sgP({hy:.28,lHx:-1.1,lK:1.6,rHx:-.4,rK:1.2,lSx:-.6,lSz:.9,rSx:-.6,rSz:-.9,lE:-.4,rE:-.4}),d:.25,on:()=>sgS('whoosh')},
   {p:sgP({hy:-.12,lSx:-.4,lSz:.9,rSx:-.4,rSz:-.9,lHx:-.3,lK:.4,rHx:.2,rK:.3}),d:.18,on:()=>sgRing(sgBase().add(new V3(0,.05,0)),A,.2,1.3,.45,{th:.025})},
   {p:sgP({sx:-.05,lSx:-1.2,lSz:1.3,lE:-.15,rSx:-1.2,rSz:-1.3,rE:-.15,rHx:-.15,rK:.25}),d:.8,spin:Math.PI*4,lin:1,fx:2,fxc:A,on:()=>sgS('wind'),tk:()=>swirl(5,.75,.1,2.2,12)},
   {p:sgP({hy:.5,sx:.15,lHx:-.9,lK:1.5,rHx:-.7,rK:1.4,lSx:-1.2,lSz:.4,lE:-.6,rSx:-1.2,rSz:-.4,rE:-.6}),d:.9,mv:[.8,0,.5],on:()=>sgS('wind'),
    tk:()=>{const c=sgBase().add(new V3(0,.35,0));for(let i=0;i<5;i++){const a=SA.clock*14+i*1.26,b=i*.7;const p=c.clone().add(new V3(Math.cos(a)*.32*Math.cos(b),Math.sin(b*2)*.25,Math.sin(a)*.32));sgBurst(p,A,1,{sp:.2,g:0,life:.25,size:.8});}}},
   {p:sgP({hy:.45,sx:.15,lHx:-.9,lK:1.5,rHx:-.7,rK:1.4,lSx:-1.2,lSz:.4,lE:-.6,rSx:-1.2,rSz:-.4,rE:-.6}),d:.6,mv:[0,0,0],
    tk:()=>{const c=sgBase().add(new V3(0,.35,0));for(let i=0;i<5;i++){const a=SA.clock*14+i*1.26,b=i*.7;sgBurst(c.clone().add(new V3(Math.cos(a)*.32*Math.cos(b),Math.sin(b*2)*.25,Math.sin(a)*.32)),A,1,{sp:.2,g:0,life:.25,size:.8});}}},
   {p:sgP({hy:-.22,sx:.18,lSx:-1.55,lSz:-.15,lE:-.08,rSx:-1.55,rSz:.15,rE:-.08,lHx:-.75,lK:.8,rHx:.45,rK:.35}),d:.4,fx:2,fxc:A,
    on:()=>{sgS('wind');const f=sgFw(),c=sgChest().addScaledVector(f,.4);sgRing(c,A,.2,1.1,.55,{face:f,mv:f.clone().multiplyScalar(4),th:.03});sgRing(c,A,.1,.7,.45,{face:f,mv:f.clone().multiplyScalar(5.5),th:.02});
      sgBurst(c,A,18,{dir:f.clone().multiplyScalar(7),spread:.2,g:0,life:.35,size:.7});}},
   {p:sgP({sx:-.02,hd:.1,lSx:-1.15,lSz:-.5,lE:-1.45,rSx:-1.15,rSz:.5,rE:-1.45,rHx:-.1,rHz:-.05}),d:.8,tk:()=>swirl(1,.6,.2,1.6,4)},['showcase',.45,0]];},

 quake:()=>{const E=SGC.EARTH;let rock=null;
  const horse=sgP({hy:-.32,sx:.1,lHz:.45,rHz:-.45,lHx:-.2,rHx:-.2,lK:.75,rK:.75,lSx:-1.4,lSz:.12,lE:-1.8,rSx:-1.4,rSz:-.12,rE:-1.8});
  return [
   {p:horse,d:.45},
   {p:sgP({hy:0,sx:-.08,rHx:-1.6,rK:1.8,lK:.1,lSx:-.4,lSz:.6,lE:-1.5,rSx:-.4,rSz:-.6,rE:-1.5}),d:.4},
   {p:sgP({hy:-.38,sx:.2,lHz:.45,rHz:-.45,lHx:-.25,rHx:-.25,lK:.85,rK:.85,lSx:-.35,lSz:.55,lE:-.25,rSx:-.35,rSz:-.55,rE:-.25}),d:.3,fx:2,fxc:E,
    on:()=>{sgS('rock');sgShake(.3,7);const b=sgBase();sgRing(b.clone().add(new V3(0,.04,0)),[0xa88a6a],.3,1.8,.5,{th:.05});sgSpikes(sgCircle(b,1.05,9,.3),SGC.DIRT,.55,{rock:1,delay:.02,life:1.4,mat:{roughness:.95}});}},
   {p:sgP({hy:-.2,sx:-.05,hd:-.1,lSx:-1.75,lSz:.15,lE:-.55,rSx:-1.75,rSz:-.15,rE:-.55,lHz:.35,rHz:-.35,lK:.5,rK:.5}),d:.5,on:()=>{sgS('rock');
     const g=new THREE.DodecahedronGeometry(.34,0),m=new THREE.Mesh(g,sgSolidM(0x5a4632,{roughness:.95}));const p0=sgBase().addScaledVector(sgFw(),1.0);p0.y=-.35;m.position.copy(p0);m.scale.set(1.1,.85,1);
     rock=sgPush(m,{life:9,geoOwn:1,up:(p,k,dt)=>{if(p.fly){p.v.y-=6*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*6;return;}const t=Math.min(1,p.t/.45);p.m.position.y=lerp(-.35,1.15*SA.R.root.scale.x,1-Math.pow(1-t,3));p.m.rotation.y+=dt*.6;}});
     sgBurst(p0.clone().setY(.05),E,12,{sp:1.5,up:2,size:1.1,solid:1,life:.6,floor:.03});}},
   {p:'jabRh',d:.28,fx:2,fxc:E,on:()=>{sgS('boom');if(rock){rock.fly=1;rock.v=sgFw().multiplyScalar(9).add(new V3(0,1,0));
     setTimeout(()=>{if(!rock)return;const at=rock.m.position.clone();rock.life=rock.t;sgBurst(at,E,22,{sp:3.5,up:1.5,size:2.2,solid:1,geo:sgGeo('chip',()=>new THREE.DodecahedronGeometry(.05,0)),rs:1,life:1,floor:.03,bn:.3,sk:.1});sgS('rock');rock=null;},230);}}},
   {p:sgP({hy:.3,lHx:-1.2,lK:1.7,rHx:-1.0,rK:1.6,lSx:-.5,lSz:.6,lE:-1.4,rSx:-.5,rSz:-.6,rE:-1.4}),d:.25},
   {p:horse,d:.28,fx:3,fxc:E,on:()=>{sgS('boom');sgShake(.45,10);const b=sgBase();sgRing(b.clone().add(new V3(0,.04,0)),[0xa88a6a],.4,2.6,.6,{th:.07});
     sgSpikes(sgCircle(b,1.5,12,0),SGC.DIRT,1.1,{w:.13,delay:.015,life:1.5,mat:{roughness:.9},lean:.6});}},
   {p:sgP({hy:-.1,sx:-.05,hd:.05,lSx:-1.25,lSz:-.65,lE:-1.85,rSx:-1.15,rSz:.6,rE:-1.95,lHz:.25,rHz:-.25,lK:.2,rK:.2}),d:.8},['showcase',.45,0]];},

 /* ---------------- inspired fighters ---------------- */
 solstice:()=>[   // half ice, half fire: frost-hand slam into a wall of ice spikes, then the other side flares
   {p:sgP({hd:.1,sx:.03,rSx:-.35,rSz:-.35,rE:-.45,lSx:-.2,lSz:.25,lE:-.3}),d:.55,tk:()=>sgBurst(sgHand(-1),SGC.ICE,1,{sp:.3,g:.6,life:.6,size:.8})},
   {p:sgP({hy:-.45,sx:.6,hd:.1,rSx:-1.15,rSz:-.1,rE:-.1,lSx:.3,lSz:.5,lE:-.5,lHx:-1.0,lK:1.6,rHx:.2,rK:1.3}),d:.35,fx:2,fxc:SGC.ICE,
    on:()=>{sgS('glass');sgShake(.25,5);const f=sgFw();sgSpikes(sgLine(sgBase(),f,9,.6,2.6,-.35),SGC.ICE,.8,{w:.11,delay:.04,life:1.6,mat:{roughness:.1,metalness:.2,emissive:0x2a6a8a,emissiveIntensity:.6,opacity:.88},dust:SGC.ICE});}},
   {p:sgP({hy:-.1,sy:-.5,lSx:-1.4,lSz:.9,lE:-.1,rSx:-.2,rSz:-.3,rE:-.3,lHx:-.3,lK:.35,rHx:.2,rK:.2}),d:.5,on:()=>sgS('fire'),
    tk:()=>sgBurst(sgHand(1),SGC.FIRE,4,{dir:sgLeft().multiplyScalar(4).add(sgFw().multiplyScalar(2)),spread:.3,g:-2.5,life:.4,size:1.4,sk:-.4,to:0x6a1206})},
   {p:sgP({sx:-.05,hd:-.05,lSx:-.6,lSz:.55,lE:-.6,rSx:-.6,rSz:-.55,rE:-.6}),d:1.0,fx:3,fxc:[0xff6a1a,0x7fd8ff],
    tk:()=>{sgBurst(sgHand(1),SGC.FIRE,2,{sp:.4,up:1,g:-1.5,life:.35,size:1.1,sk:-.3,to:0x8a2a0a});sgBurst(sgHand(-1),SGC.ICE,1,{sp:.3,g:.8,life:.6,size:.8});}},['showcase',.45,0]],

 piston:()=>{const ex=(n)=>{const b=sgFw().multiplyScalar(-3.5).add(new V3(0,-.3,0));for(const k of ['lK','rK'])sgBurst(sgW(SA.R[k],0,-.2,-.08),[0x7fd8ff,0xffffff,0x3a8aff],n,{dir:b,spread:.2,g:0,life:.3,size:1.1});};
  const chop=(hi,s)=>sgP(s>0?{sx:.05,lSx:hi?-1.95:-.95,lSz:.1,lE:hi?-.55:-.1,rSx:-.3,rSz:-.2,rE:-.4}:{sx:.05,rSx:hi?-1.95:-.95,rSz:-.1,rE:hi?-.55:-.1,lSx:-.3,lSz:.2,lE:-.4});
  return [   // strict chopping hand gestures, a sprinter's crouch, engines roar, a dash kick
   {p:chop(1,-1),d:.18},{p:chop(0,-1),d:.14,on:()=>sgS('slash')},{p:chop(1,1),d:.16},{p:chop(0,1),d:.14,on:()=>sgS('slash')},{p:chop(1,-1),d:.15},{p:chop(0,-1),d:.14,on:()=>sgS('slash')},
   {p:sgP({hy:-.35,sx:.85,hd:-.45,lSx:.6,lE:-.3,rSx:-.8,rE:-.8,lHx:-1.2,lK:1.8,rHx:.4,rK:1.1}),d:.5,on:()=>sgS('zap'),tk:()=>ex(2)},
   {p:'dash',d:.25,mv:[0,0,1.2],fx:2,fxc:[0x7fd8ff,0xffffff],on:()=>{sgS('boom');sgRing(sgBase().add(new V3(0,.05,0)),[0x7fd8ff],.3,1.4,.4,{th:.03});},tk:()=>ex(5)},
   {p:'kickh',d:.32,fx:2,fxc:[0x7fd8ff,0xffffff],on:()=>sgS('whoosh'),tk:()=>ex(3)},
   {p:sgP({sx:.1,lSx:-.4,rSx:-.4,lE:-1.2,rE:-1.2}),d:.6,mv:[0,0,0],tk:R=>{sgWalk(R,1.2);ex(1);}},
   {p:sgP({sx:-.05,hd:-.05,rSx:-1.5,rSz:.2,rE:-.15,lSx:.1,lSz:.15,lE:-.05}),d:.9},['showcase',.45,0]];},

 snare:()=>[   // tired slouch, eyes flare red, binding cloth whips out, yank — then a yawn
   {p:sgP({sx:.25,hd:.35,sz:.06,lSx:.18,lSz:.1,lE:-.25,rSx:.18,rSz:-.1,rE:-.25,hy:-.03,lHx:-.05,rHx:.1}),d:.75},
   {p:sgP({sx:.05,hd:-.15,lSx:-.4,lSz:.5,lE:-1.2,rSx:-.4,rSz:-.5,rE:-1.2,hy:-.12,lHx:-.35,lK:.4,rHx:.25,rK:.3}),d:.35,fx:1,fxc:SGC.RED,
    on:()=>{sgS('zap');const h=sgHead().addScaledVector(sgFw(),.13),l=sgLeft();for(const s of [1,-1])sgBurst(h.clone().addScaledVector(l,s*.045).add(new V3(0,.03,0)),SGC.RED,6,{sp:.25,g:0,life:.9,size:.7,sk:.2});}},
   {p:sgP({sy:.55,sx:.15,rSx:-1.6,rSz:-.1,rE:-.05,lSx:-.6,lSz:.4,lE:-1.2,hy:-.15,lHx:-.5,lK:.6,rHx:.35,rK:.35}),d:.4,fx:2,fxc:[0xd8d8e0,0xaaaab8],on:()=>sgS('whoosh'),
    tk:(R,k)=>{if(k<.7){const h=sgHand(-1),f=sgFw();for(let i=0;i<4;i++)sgBurst(h.clone().addScaledVector(f,k*3.2-i*.08).add(new V3(0,Math.sin(k*12+i)*.12,0)),[0xd8d8e0,0x9a9aa8],1,{sp:.1,g:0,life:.5,size:1.2,solid:1,sk:.2});}}},
   {p:sgP({sy:-.4,sx:-.1,rSx:.3,rE:-1.6,lSx:.2,lE:-1.4,hy:-.15,lHx:-.4,lK:.5,rHx:.4,rK:.4}),d:.3,fx:1,fxc:[0xd8d8e0],on:()=>sgS('slash')},
   {p:sgP({sx:-.15,hd:-.45,lSx:-1.25,lSz:-.25,lE:-2.35,rSx:.12,rSz:-.1,rE:-.2}),d:.85},
   {p:sgP({sx:.25,hd:.35,sz:.06,lSx:.18,lSz:.1,lE:-.25,rSx:.18,rSz:-.1,rE:-.25,hy:-.03}),d:.5},['showcase',.4,0]],

 marble:()=>[   // a stage magician's bow, a snap that rains marbles, a flourish and a hat tip
   {p:sgP({sx:.75,hd:.3,hy:-.04,rSx:-1.2,rSz:.6,rE:-1.6,lSx:.4,lSz:.9,lE:-.2,rHx:.25,lHx:-.1}),d:.6},
   {p:sgP({sx:-.05,hd:-.1,rSx:-2.6,rSz:-.25,rE:-.6,lSx:-.3,lSz:.4,lE:-1.2}),d:.32},
   {p:sgP({sx:-.05,hd:-.1,rSx:-2.6,rSz:-.25,rE:-1.1,lSx:-.3,lSz:.4,lE:-1.2}),d:.14,fx:1,fxc:[0xffffff,0x7fe8ff],
    on:()=>{sgS('snap');const g=sgGeo('marble',()=>new THREE.SphereGeometry(.045,14,10));const h=sgHand(-1);
      sgBurst(h,[0x3ad8ff,0xff6a3a,0x6aff8a,0xffd23f,0xb06aff],12,{geo:g,solid:1,em:.25,sp:1.8,up:1.5,g:7,dr:.3,life:1.8,size:1,sk:0,floor:.07,bn:.55});
      setTimeout(()=>sgS('clap'),500);}},
   {p:sgP({sy:.3,rSx:-1.4,rSz:-.9,rE:-.1,lSx:-.2,lSz:.3,lE:-.3,hd:-.05}),d:.5,fx:2,fxc:[0xffffff,0xffd23f],on:()=>sgS('sparkle')},
   {p:sgP({rSx:-2.7,rSz:-.5,rE:-2.0,sx:.15,hd:.15,lSx:-.3,lSz:.4,lE:-1.4}),d:.7},['showcase',.45,0]],

 legion:()=>[   // clutching his head, twitching between moods, a double pops out — then melts
   {p:sgP({sx:.3,hd:.25,lSx:-2.2,lSz:.5,lE:-2.4,rSx:-2.2,rSz:-.5,rE:-2.4,hy:-.12,lHx:-.3,lK:.4,rHx:.2,rK:.3}),d:.6,tk:R=>{R.P.sz+=Math.sin(SA.clock*38)*.07;}},
   {p:sgP({sz:.28,hd:.1,lSx:-.3,lSz:.5,lE:-.6,rSx:-.3,rSz:-.5,rE:-.6}),d:.17},{p:sgP({sz:-.28,hd:.1,lSx:-.3,lSz:.5,lE:-.6,rSx:-.3,rSz:-.5,rE:-.6}),d:.17},{p:sgP({sz:.2,hd:-.1,lSx:-.3,lSz:.5,lE:-.6,rSx:-.3,rSz:-.5,rE:-.6}),d:.15},
   {p:sgP({sx:-.1,hd:-.1,lSx:-.6,lSz:1.3,lE:-.2,rSx:-.6,rSz:-1.3,rE:-.2}),d:.4,fx:2,fxc:SGC.GOO,
    tk:(R,k,dt,S)=>sgOnce(S,'cl',k>.55,()=>{sgS('squelch');sgClone(R,sgLeft().multiplyScalar(1.05).add(sgFw().multiplyScalar(-.25)),2.3,SGC.GOO);})},
   {p:sgP({sy:.45,lSx:-2.5,lSz:1.0,lE:-.2,rSx:-.4,rSz:-.4,rE:-.6}),d:.7},
   {p:sgP({sx:-.25,hd:-.4,lSx:-.4,lSz:.9,lE:-.9,rSx:-.4,rSz:-.9,rE:-.9}),d:.9,tk:R=>{R.P.sx+=Math.sin(SA.clock*22)*.06;R.P.hd+=Math.sin(SA.clock*22)*.05;}},['showcase',.45,0]],

 recoil:()=>[   // drops to one knee, arm becomes a rifle, two cracking shots, rests it on her shoulder
   {p:sgP({hy:-.42,sx:.05,sy:.35,hd:.08,rSx:-1.55,rSz:-.05,rE:0,lSx:-1.3,lSz:-.45,lE:-.9,lHx:-1.3,lK:1.45,rHx:.3,rK:1.9,lHz:.1}),d:.6,face:.95},
   {p:sgP({hy:-.42,sx:.08,sy:.35,hd:.12,rSx:-1.55,rSz:-.05,rE:0,lSx:-1.3,lSz:-.45,lE:-.9,lHx:-1.3,lK:1.45,rHx:.3,rK:1.9,lHz:.1}),d:.35,on:()=>{const h=sgHand(-1);sgBeam(h,h.clone().addScaledVector(sgFw(),9),[0xff2a3a],.005,.4);}},
   {p:sgP({hy:-.42,sx:-.08,sy:.35,hd:.05,rSx:-1.85,rSz:-.05,rE:-.1,lSx:-1.4,lSz:-.45,lE:-.9,lHx:-1.3,lK:1.45,rHx:.3,rK:1.9,lHz:.1}),d:.16,fx:2,fxc:[0xff6ad8,0xffffff],
    on:()=>{sgS('shot');sgShake(.15,5);const h=sgHand(-1),f=sgFw();sgBurst(h,[0xffffff,0xff9ae8],10,{dir:f.clone().multiplyScalar(3),spread:.6,g:0,life:.15,size:1.4});sgBeam(h,h.clone().addScaledVector(f,14),[0xff9ae8],.02,.3);}},
   {p:sgP({hy:-.42,sx:.05,sy:.35,hd:.08,rSx:-1.55,rSz:-.05,rE:0,lSx:-1.3,lSz:-.45,lE:-.9,lHx:-1.3,lK:1.45,rHx:.3,rK:1.9,lHz:.1}),d:.3},
   {p:sgP({hy:-.42,sx:-.08,sy:.35,hd:.05,rSx:-1.85,rSz:-.05,rE:-.1,lSx:-1.4,lSz:-.45,lE:-.9,lHx:-1.3,lK:1.45,rHx:.3,rK:1.9,lHz:.1}),d:.16,fx:2,fxc:[0xff6ad8,0xffffff],
    on:()=>{sgS('shot');sgShake(.15,5);const h=sgHand(-1),f=sgFw();sgBurst(h,[0xffffff,0xff9ae8],10,{dir:f.clone().multiplyScalar(3),spread:.6,g:0,life:.15,size:1.4});sgBeam(h,h.clone().addScaledVector(f,14).add(sgLeft().multiplyScalar(-1.5)),[0xff9ae8],.02,.3);}},
   {p:sgP({sy:-.15,rSx:-2.2,rSz:-.4,rE:-2.3,lSx:-.1,lSz:.35,lE:-.4,hd:-.05,lHz:.1,rHz:-.1}),d:.85,face:-.3},['showcase',.45,0]],

 crimson:()=>[   // giddy, hunched, hands to her cheeks, swaying — a quick knife flick — then her signature hunched pose
   {p:sgP({sx:.35,hd:-.05,sz:.08,hy:-.1,lSx:-.75,lSz:-.3,lE:-2.5,rSx:-.75,rSz:.3,rE:-2.5,lHx:-.2,lK:.35,rHx:.15,rK:.35,lHz:-.06,rHz:.06}),d:.5,tk:R=>{R.P.sz=Math.sin(SA.clock*7)*.13;R.P.hy+=Math.abs(Math.sin(SA.clock*7))*.04;}},
   {p:sgP({sx:.35,hd:-.1,sz:-.08,hy:-.1,lSx:-.75,lSz:-.3,lE:-2.5,rSx:-.75,rSz:.3,rE:-2.5,lHx:-.2,lK:.35,rHx:.15,rK:.35,lHz:-.06,rHz:.06}),d:.55,tk:R=>{R.P.sz=Math.sin(SA.clock*7)*.13;R.P.hy+=Math.abs(Math.sin(SA.clock*7))*.04;},
    on:()=>sgBurst(sgHead().addScaledVector(sgFw(),.15),[0xff6a9a,0xff3a6a],6,{sp:.4,up:.6,g:-.3,life:.8,size:.6})},
   {p:sgP({sx:.45,sy:.5,hy:-.25,rSx:-1.6,rSz:-.2,rE:-.1,lSx:-.5,lSz:.5,lE:-1.0,lHx:-.9,lK:1.0,rHx:.6,rK:.4}),d:.24,mv:[0,0,.7],fx:2,fxc:SGC.RED,
    on:()=>{sgS('slash');const c=sgChest().addScaledVector(sgFw(),.6);sgArc(c,[0xff2a3a],.55,.35,{tilt:-.6,th:.025});sgBurst(c,SGC.BLOOD,10,{sp:1.8,up:.5,size:.7,solid:1,life:.7,floor:.03});}},
   {p:sgP({sx:.3,hy:-.15,lSx:-.5,lSz:.4,lE:-1.2,rSx:-.8,rSz:-.3,rE:-1.4,lHx:-.4,lK:.5,rHx:.2,rK:.4}),d:.45,mv:[0,0,0],tk:R=>sgWalk(R,.6,false)},
   {p:sgP({sx:.58,sz:.2,hd:-.25,hy:-.09,lSx:-.95,lSz:-.25,lE:-2.45,rSx:-1.8,rSz:-.45,rE:-1.95,lHx:.05,lK:.2,rHx:.55,rK:1.85,rHz:-.08}),d:1.0,face:.55,fx:3,fxc:[0xff3a6a,0xffd23f],
    tk:R=>{R.P.hy+=Math.sin(SA.clock*5)*.015;R.P.sz+=Math.sin(SA.clock*2.5)*.03;}},['showcase',.45,0]],

 sawback:()=>[   // low reptile crouch with head twitches, blade bundle overhead, slam, a defiant roar
   {p:sgP({hy:-.35,sx:.6,hd:-.45,lSx:-.4,lSz:.6,lE:-.9,rSx:-.2,rSz:-.4,rE:-1.4,lHx:-.9,lK:1.4,rHx:.1,rK:1.2,lHz:.25,rHz:-.25}),d:.6,tk:R=>{R.P.hd+=Math.sin(SA.clock*17)>0.8?.15:0;R.P.sy=Math.sin(SA.clock*3)*.2;}},
   {p:sgP({sx:-.25,hd:-.2,rSx:-3.0,rSz:-.1,rE:-.8,lSx:-2.8,lSz:.1,lE:-.9,hy:-.1,lHx:-.4,lK:.4,rHx:.3,rK:.3}),d:.4,on:()=>sgS('whoosh')},
   {p:'smashh',d:.28,fx:3,fxc:[0xffb030,0xffffff],on:()=>{sgS('boom');sgShake(.35,8);const p=sgBase().addScaledVector(sgFw(),1.0);
     sgBurst(p.clone().setY(.1),[0xffd23f,0xff8a1a,0xffffff],18,{sp:3,up:2,g:6,life:.5,size:.6});sgSpikes(sgLine(sgBase(),sgFw(),5,.8,1.8),SGC.STONE,.4,{rock:1,life:1.1,delay:.03});}},
   {p:sgP({sx:-.3,hd:-.45,lSx:-.5,lSz:1.0,lE:-.9,rSx:-.5,rSz:-1.0,rE:-.9,hy:-.15,lHx:-.4,lK:.5,rHx:.3,rK:.4,lHz:.2,rHz:-.2}),d:.85,fx:2,on:()=>sgS('boom')},['showcase',.45,0]],

 resect:()=>[   // tugs his glove tight, crouches, palm to the floor — the ground erupts in spikes — hands behind his back
   {p:sgP({sx:.1,hd:.25,lSx:-1.2,lSz:-.2,lE:-1.5,rSx:-1.0,rSz:.35,rE:-1.7}),d:.55,tk:R=>{R.P.rSx+=Math.sin(SA.clock*12)*.08;}},
   {p:sgP({sx:.1,hd:.2,rSx:-1.2,rSz:.2,rE:-1.5,lSx:-1.0,lSz:-.35,lE:-1.7}),d:.45,tk:R=>{R.P.lSx+=Math.sin(SA.clock*12)*.08;}},
   {p:sgP({hy:-.5,sx:.7,hd:.2,rSx:-1.2,rSz:-.05,rE:-.1,lSx:.2,lSz:.3,lE:-.4,lHx:-1.1,lK:1.7,rHx:.2,rK:1.5}),d:.45,fx:2,fxc:[0xff3a3a,0xffffff],
    on:()=>{sgS('rock');sgShake(.3,6);const b=sgBase(),f=sgFw(),pts=[];for(let i=0;i<16;i++){const a=rand(-.9,.9),d=rand(.7,2.6);const dir=f.clone().applyAxisAngle(new V3(0,1,0),a);pts.push(b.clone().addScaledVector(dir,d));}
      pts.sort((p,q)=>p.distanceTo(b)-q.distanceTo(b));sgSpikes(pts,SGC.STONE,1.0,{w:.09,sides:4,delay:.03,life:1.8,mat:{roughness:.7}});}},
   {p:sgP({sx:-.05,hd:-.05,lSx:.5,lSz:-.15,lE:-1.3,rSx:.5,rSz:.15,rE:-1.3}),d:1.0},['showcase',.45,0]],

 cushion:()=>[   // belly pats, a sumo stomp, soaks it all in and blasts it out, a big jolly wave
   {p:sgP({sx:-.1,hd:-.05,lSx:-.7,lSz:-.1,lE:-1.3,rSx:-.7,rSz:.1,rE:-1.3,lHz:.15,rHz:-.15}),d:.3},
   {p:sgP({sx:-.1,hd:-.05,lSx:-.7,lSz:-.1,lE:-1.1,rSx:-.7,rSz:.1,rE:-1.5,lHz:.15,rHz:-.15}),d:.16,on:()=>sgS('clap')},
   {p:sgP({sx:-.1,hd:-.05,lSx:-.7,lSz:-.1,lE:-1.5,rSx:-.7,rSz:.1,rE:-1.1,lHz:.15,rHz:-.15}),d:.16,on:()=>sgS('clap')},
   {p:sgP({sz:-.25,lHx:-.6,lHz:.9,lK:.6,rHz:-.1,lSx:-.3,lSz:.9,lE:-.4,rSx:-.3,rSz:-.9,rE:-.4}),d:.42},
   {p:sgP({hy:-.35,lHz:.5,rHz:-.5,lHx:-.3,rHx:-.3,lK:.8,rK:.8,lSx:-.3,lSz:.6,lE:-1.2,rSx:-.3,rSz:-.6,rE:-1.2}),d:.25,fx:2,fxc:[0xffd23f],on:()=>{sgS('rock');sgShake(.3,7);sgRing(sgBase().add(new V3(0,.04,0)),[0xffe08a],.3,1.8,.5,{th:.05});}},
   {p:sgP({sx:-.2,lSx:-1.0,lSz:1.2,lE:-.3,rSx:-1.0,rSz:-1.2,rE:-.3}),d:.5,tk:()=>{const c=sgChest();for(let i=0;i<2;i++){const p=c.clone().add(new V3(rand(-1.5,1.5),rand(-.8,.8),rand(-1.5,1.5)));sgBurst(p,SGC.GOLD,1,{dir:c.clone().sub(p).multiplyScalar(2.2),spread:.05,g:0,dr:0,life:.45,size:.9});}}},
   {p:sgP({sx:.25,hy:-.2,lSx:-1.55,lSz:-.1,lE:0,rSx:-1.55,rSz:.1,rE:0,lHx:-.6,lK:.6,rHx:.4,rK:.3}),d:.3,fx:3,fxc:SGC.GOLD,
    on:()=>{sgS('boom');sgShake(.3,7);const f=sgFw(),c=sgChest().addScaledVector(f,.5);sgRing(c,SGC.GOLD,.3,1.6,.6,{face:f,mv:f.clone().multiplyScalar(3.5),th:.06});}},
   {p:sgP({sx:-.05,hd:-.1,rSx:-2.6,rSz:-.6,rE:-.6,lSx:-.7,lSz:-.1,lE:-1.3}),d:.85,tk:R=>{R.P.rSz+=Math.sin(SA.clock*9)*.3;}},['showcase',.45,0]],

 corrosa:()=>[   // dance moves, a breakdance spin flinging acid, a splash, a peace sign with a kicked-up heel
   {p:sgP({sz:.15,hy:-.08,lSx:-1.0,lSz:.8,lE:-1.4,rSx:-2.4,rSz:-.4,rE:-.5,lHz:.15,rHz:-.05,lK:.3,rK:.1}),d:.28},
   {p:sgP({sz:-.15,hy:-.08,rSx:-1.0,rSz:-.8,rE:-1.4,lSx:-2.4,lSz:.4,lE:-.5,rHz:-.15,lHz:.05,rK:.3,lK:.1}),d:.28},
   {p:sgP({sz:.15,hy:-.08,lSx:-1.0,lSz:.8,lE:-1.4,rSx:-2.4,rSz:-.4,rE:-.5,lHz:.15,rHz:-.05,lK:.3,rK:.1}),d:.26},
   {p:sgP({hy:-.5,sx:.5,lSx:-1.4,lSz:1.2,rSx:-.8,rSz:-1.0,lHx:-1.2,lK:1.8,rHx:-.2,rHz:-.9,rK:.1}),d:.75,spin:Math.PI*2,fx:2,fxc:SGC.ACID,on:()=>sgS('whoosh'),
    tk:()=>sgBurst(sgFoot(-1),SGC.ACID,2,{sp:2,up:1,g:6,life:.6,size:.7,floor:.03})},
   {p:sgP({sx:-.1,lSx:-2.8,lSz:.4,lE:-.3,rSx:-2.8,rSz:-.4,rE:-.3,hy:.1,rHx:-.3,rK:1.2}),d:.3,fx:3,fxc:SGC.ACID,
    on:()=>{sgS('water');sgBurst(sgChest().add(new V3(0,.5,0)),SGC.ACID,30,{sp:2.5,up:3,g:7,life:1.1,size:.9,floor:.03,bn:.1});
      const d=new THREE.Mesh(new THREE.CircleGeometry(1,40),sgAddM(0x8aff2a));d.rotation.x=-Math.PI/2;d.position.copy(sgBase()).setY(.035);sgPush(d,{life:1.6,geoOwn:1,up:(p,k)=>{p.m.scale.setScalar(.3+Math.min(1,k*3)*1.1);p.m.material.opacity=.45*(1-k);}});}},
   {p:sgP({sx:.15,sz:-.1,hd:.05,rSx:-1.3,rSz:.35,rE:-2.2,lSx:-.2,lSz:.4,lE:-.6,lHx:.4,lK:1.4,rHx:-.05}),d:.9,fx:1,fxc:SGC.PINK},['showcase',.45,0]],

 verdict:()=>[   // a hunched, menacing crouch with the blade by his face, two dashing cuts, the blade levelled at you
   {p:sgP({hy:-.25,sx:.55,hd:-.35,rSx:-1.6,rSz:.35,rE:-2.0,lSx:-.6,lSz:.5,lE:-.8,lHx:-.6,lK:1.0,rHx:.3,rK:.7}),d:.75,tk:R=>{R.P.sz=Math.sin(SA.clock*1.6)*.12;}},
   {p:sgP({sx:.5,sy:-.7,hy:-.25,rSx:-1.2,rSz:-1.1,rE:-.1,lSx:.6,lSz:.4,lE:-.4,lHx:-.8,lK:.9,rHx:.5,rK:.4}),d:.2,mv:[.35,0,1.0],fx:2,fxc:SGC.RED,
    on:()=>{sgS('slash');sgArc(sgChest().addScaledVector(sgFw(),.55),[0xff2a3a],.6,.35,{tilt:.7,th:.022});}},
   {p:sgP({sx:.5,sy:.7,hy:-.25,rSx:-1.3,rSz:.3,rE:-.1,lSx:.6,lSz:.4,lE:-.4,lHx:-.8,lK:.9,rHx:.5,rK:.4}),d:.2,mv:[-.25,0,1.15],fx:2,fxc:SGC.RED,
    on:()=>{sgS('slash');sgArc(sgChest().addScaledVector(sgFw(),.55),[0xff2a3a],.6,.35,{tilt:-.7+Math.PI,th:.022});}},
   {p:sgP({hy:-.25,sx:.55,hd:-.35,rSx:-1.6,rSz:.35,rE:-2.0,lSx:-.6,lSz:.5,lE:-.8,lHx:-.6,lK:1.0,rHx:.3,rK:.7}),d:.5,mv:[0,0,0]},
   {p:sgP({sx:.35,hd:-.2,rSx:-1.6,rSz:-.05,rE:-.05,lSx:-.4,lSz:.6,lE:-1.3,hy:-.18,lHx:-.45,lK:.6,rHx:.25,rK:.4}),d:.95,fx:1,fxc:SGC.RED},['showcase',.45,0]],

 decree:()=>[   // fists on hips, flings her arms up in a starburst, rises, then points the way
   {p:sgP({sx:-.08,hd:-.1,lSx:.15,lSz:.65,lE:-1.6,rSx:.15,rSz:-.65,rE:-1.6,lHz:.14,rHz:-.14}),d:.7,fx:1,fxc:SGC.GOLD},
   {p:sgP({sx:.1,lSx:-1.3,lSz:-.6,lE:-1.9,rSx:-1.2,rSz:.6,rE:-1.95,hy:-.1,lK:.2,rK:.2}),d:.25},
   {p:sgP({sx:-.25,hd:-.35,lSx:-2.5,lSz:1.0,lE:-.1,rSx:-2.5,rSz:-1.0,rE:-.1}),d:.4,fx:3,fxc:SGC.GOLD,on:()=>{sgS('sparkle');sgS('boom');for(let i=0;i<5;i++){const a=i/5*Math.PI*2-Math.PI/2;sgBeam(sgChest(),sgChest().add(new V3(Math.cos(a)*1.6,-Math.sin(a)*1.6,0).applyAxisAngle(new V3(0,1,0),SA.R.root.rotation.y)),SGC.GOLD,.025,.6,{grow:6});}}},
   {p:sgP({hy:.35,sx:-.2,hd:-.3,lSx:-2.5,lSz:1.0,lE:-.1,rSx:-2.5,rSz:-1.0,rE:-.1,lHx:-.15,lK:.4,rHx:.1,rK:.6}),d:.6,tk:()=>sgBurst(sgBase().add(new V3(rand(-.4,.4),.1,rand(-.4,.4))),SGC.GOLD,2,{dir:new V3(0,4,0),spread:.2,g:0,life:.6,size:.8})},
   {p:sgP({rSx:-1.65,rSz:-.05,rE:0,lSx:.15,lSz:.65,lE:-1.6,sy:.2,sx:.05}),d:.85,fx:2,fxc:SGC.GOLD,on:()=>sgS('whoosh')},['showcase',.45,0]],

 skitter:()=>{const crawl=sgP({hx:1.2,hy:-.66,hd:-1.0,lSx:-1.15,lSz:.45,lE:-.35,rSx:-1.15,rSz:-.45,rE:-.35,lHx:.3,lK:1.2,rHx:.3,rK:1.2,lHz:.3,rHz:-.3});
  const scuttle=R=>{const s=Math.sin(SA.clock*16);R.P.lSx+=s*.3;R.P.rSx-=s*.3;R.P.lHx-=s*.25;R.P.rHx+=s*.25;for(const k of [1,-1])if(Math.random()<.5)sgBurst(sgHand(k),[0x7affd8,0xffffff],1,{sp:.3,g:0,life:.35,size:.7});};
  return [   // drops flat and skates along on his palms, spins, skates back, springs up
   {p:crawl,d:.5},
   {p:crawl,d:.6,mv:[0,0,1.2],tk:scuttle},
   {p:crawl,d:.55,spin:Math.PI*2,fx:1,fxc:[0x7affd8],tk:scuttle},
   {p:crawl,d:.55,mv:[0,0,0],tk:scuttle},
   {p:'jump',d:.25,fx:2,fxc:[0x7affd8,0xffffff],on:()=>sgS('whoosh')},
   {p:sgP({sx:-.05,rSx:-1.4,rSz:-.3,rE:-1.8,lSx:.1,lSz:.6,lE:-1.5}),d:.85},['showcase',.45,0]];},

 oldguard:()=>[   // cracks his knuckles, fixes his hat, one huge haymaker, arms folded
   {p:sgP({sx:.1,hd:.15,lSx:-1.2,lSz:-.4,lE:-1.5,rSx:-1.2,rSz:.4,rE:-1.5}),d:.4},
   {p:sgP({sx:.16,hd:.18,lSx:-1.25,lSz:-.45,lE:-1.65,rSx:-1.25,rSz:.45,rE:-1.65}),d:.16,on:()=>sgS('crack')},
   {p:sgP({rSx:-2.7,rSz:-.4,rE:-2.1,hd:.2,lSx:-.1,lSz:.3,lE:-.4}),d:.55},
   {p:'heavyw',d:.45,on:()=>sgS('whoosh')},
   {p:'jabRh',d:.28,fx:3,fxc:[0xffd23f,0xffffff],on:()=>{sgS('boom');sgShake(.35,8);const f=sgFw(),c=sgHand(-1).addScaledVector(f,.2);sgRing(c,[0xffe8a0],.2,1.4,.5,{face:f,mv:f.clone().multiplyScalar(3),th:.05});sgBurst(c,[0xffd23f,0xffffff],16,{sp:3,life:.35,size:.7});}},
   {p:sgP({sx:-.05,hd:.05,lSx:-1.25,lSz:-.65,lE:-1.85,rSx:-1.15,rSz:.6,rE:-1.95,lHz:.12,rHz:-.12}),d:.95},['showcase',.45,0]],

 hopstar:()=>{const hop={p:sgP({hy:.4,lHx:-.9,lK:1.5,rHx:-.3,rK:1.0,lSx:-2.6,lSz:.6,lE:-.3,rSx:-2.6,rSz:-.6,rE:-.3}),d:.24,on:()=>{sgS('note');sgBurst(sgBase().add(new V3(0,.1,0)),SGC.PINK,8,{sp:1.5,up:1,g:0,life:.5,size:.8});}};
  const land={p:sgP({hy:-.12,lSx:-.6,lSz:.8,lE:-.6,rSx:-.6,rSz:-.8,rE:-.6,lHx:-.3,lK:.5,rHx:-.2,rK:.4}),d:.17};
  return [   // idol hops, a mic-to-lips pose with notes, a twirl, a wink-and-V finish
   hop,Object.assign({},land),Object.assign({},hop,{on:()=>{sgS('note');}}),Object.assign({},land),
   {p:sgP({sx:-.05,hd:-.1,rSx:-1.2,rSz:.25,rE:-2.3,lSx:-.8,lSz:1.1,lE:-.2,rHx:-.3,rK:.8,lHz:.05}),d:.6,fx:1,fxc:SGC.PINK,
    tk:()=>{if(Math.random()<.35)sgBurst(sgHead().addScaledVector(sgFw(),.2),SGC.PINK,1,{dir:new V3(rand(-.5,.5),1.2,0),spread:.2,g:0,dr:.5,life:.9,size:1.1});}},
   {p:sgP({sx:-.05,lSx:-2.2,lSz:.9,lE:-.3,rSx:-2.2,rSz:-.9,rE:-.3,rHx:-.25,rK:.9}),d:.55,spin:Math.PI*2,on:()=>sgS('sparkle'),tk:()=>sgBurst(sgHand(1),SGC.PINK,1,{sp:.3,g:0,life:.5,size:.8})},
   {p:sgP({sx:.1,sz:-.12,rSx:-1.4,rSz:.45,rE:-2.4,lSx:-.2,lSz:.35,lE:-1.4,lHx:.35,lK:1.2}),d:.9,fx:3,fxc:SGC.PINK,on:()=>sgS('sparkle')},['showcase',.45,0]];},

 headliner:()=>[   // double-biceps flex, finger guns, waves to flashing cameras, rises into a hero pose
   {p:sgP({sx:-.1,hd:-.15,lSx:-1.57,lSz:1.45,lE:-2.0,rSx:-1.57,rSz:-1.45,rE:-2.0,lHz:.15,rHz:-.15}),d:.65,fx:1,fxc:SGC.GOLD,on:()=>sgS('sparkle')},
   {p:sgP({sy:.2,rSx:-1.5,rSz:-.15,rE:-.25,lSx:-1.4,lSz:.25,lE:-.3,hd:-.05}),d:.3},
   {p:sgP({sy:.2,rSx:-1.85,rSz:-.15,rE:-.35,lSx:-1.4,lSz:.25,lE:-.3,hd:-.05,sz:.08}),d:.15,on:()=>{sgS('snap');sgBurst(sgHand(-1),SGC.GOLD,6,{sp:1,life:.3,size:.6});}},
   {p:sgP({sx:-.05,rSx:-2.7,rSz:-.5,rE:-.4,lSx:.15,lSz:.65,lE:-1.6}),d:.9,tk:R=>{R.P.rSz+=Math.sin(SA.clock*10)*.3;
      if(Math.random()<.12){const p=sgBase().add(new V3(rand(-3,3),rand(.5,2.5),rand(1.5,3.5)));sgBurst(p,[0xffffff],1,{sp:0,g:0,life:.12,size:3,sk:-1});SA.light&&(SA.light.intensity=Math.max(SA.light.intensity,1.5),SA.light.color.set(0xffffff));sgS('snap');}}},
   {p:sgP({hy:.3,sx:-.1,rSx:-3.0,rSz:-.1,rE:0,lSx:.2,lSz:.3,lE:-.3,lHx:-.2,lK:.9,rHx:.1,rK:.2}),d:.9,fx:3,fxc:SGC.GOLD,on:()=>sgS('whoosh'),
    tk:()=>sgBurst(sgBase().add(new V3(0,.2,0)),SGC.GOLD,1,{dir:new V3(0,3,0),spread:.4,g:0,life:.5,size:.8})},['showcase',.45,0]],

 zanshin:()=>[   // blade on his shoulder, raised overhead gathering dark energy, a crescent cut that flies — then the levelled-blade stance
   {p:sgP({sy:-.15,rSx:-2.3,rSz:-.5,rE:-2.0,lSx:-.1,lSz:.3,lE:-.3,hd:-.05,lHz:.12,rHz:-.12}),d:.65},
   {p:sgP({sx:-.15,rSx:-2.9,rSz:-.1,rE:-.6,lSx:-2.8,lSz:-.1,lE:-.8,hy:-.1,lHx:-.4,lK:.5,rHx:.3,rK:.4}),d:.5,face:.55,on:()=>sgS('zap'),
    tk:()=>{const c=sgHand(-1).add(new V3(0,.5,0));for(let i=0;i<2;i++){const p=c.clone().add(new V3(rand(-.5,.5),rand(-.4,.6),rand(-.5,.5)));sgBurst(p,[0x1a0a14,0xff2a3a,0x3a0a1a],1,{dir:c.clone().sub(p).multiplyScalar(2),spread:.05,g:0,dr:0,life:.4,size:1.1,solid:Math.random()<.5});}}},
   {p:sgP({sx:.45,sy:.2,hy:-.25,rSx:-1.2,rE:0,lSx:-1.2,lE:-.2,lSz:-.3,lHx:-.9,lK:1.0,rHx:.5,rK:.4}),d:.3,fx:3,fxc:[0xff2a3a,0x1a0a14],
    on:()=>{sgS('slash');sgS('boom');sgShake(.3,7);const f=sgFw(),c=sgChest().addScaledVector(f,.8);
      sgArc(c,[0xff2a3a],1.1,.9,{tilt:Math.PI/2-.55,ang:Math.PI,th:.06,mv:f.clone().multiplyScalar(7),grow:1});const m=sgArc(c,[0x2a0a1a],1.05,.9,{tilt:Math.PI/2-.55,ang:Math.PI,th:.1,mv:f.clone().multiplyScalar(7),grow:1});m.material.blending=THREE.NormalBlending;m.material.needsUpdate=true;}},
   {p:sgP({sy:.25,rSx:-1.55,rSz:-.05,rE:-.05,lSx:-1.4,lSz:-.45,lE:-.5,hy:-.15,lHx:-.45,lK:.55,rHx:.35,rK:.4}),d:.95,fx:1,fxc:[0xff2a3a],face:.2},['showcase',.45,0]],

 torrent:()=>[   // cocky hands-on-hips lean, gathers a huge charge, unloads a massive blast, smooths his hair
   {p:sgP({sx:-.2,hd:-.15,lSx:.2,lSz:.5,lE:-1.6,rSx:.2,rSz:-.5,rE:-1.6,lHz:.15,rHz:-.15}),d:.6},
   {p:sgP({hy:-.25,sx:.2,lSx:.6,lSz:.3,lE:-1.4,rSx:.6,rSz:-.3,rE:-1.4,lHx:-.5,lK:.7,rHx:.35,rK:.5,lHz:.15,rHz:-.15}),d:.6,face:.75,on:()=>sgS('zap'),
    tk:()=>{const c=sgChest();for(let i=0;i<3;i++){const p=c.clone().add(new V3(rand(-1.3,1.3),rand(-.8,1),rand(-1.3,1.3)));sgBurst(p,[0x5ab0ff,0xffffff,0x9ad8ff],1,{dir:c.clone().sub(p).multiplyScalar(2.5),spread:.05,g:0,dr:0,life:.4,size:.9});}}},
   {p:sgP({sx:.15,hy:-.2,lSx:-1.55,lSz:-.12,lE:-.05,rSx:-1.55,rSz:.12,rE:-.05,lHx:-.6,lK:.6,rHx:.45,rK:.3}),d:.65,fx:3,fxc:[0x5ab0ff,0xffffff],
    on:()=>{sgS('boom');sgShake(.55,9);const f=sgFw(),a=sgHand(1).add(sgHand(-1)).multiplyScalar(.5).addScaledVector(f,.1),b=a.clone().addScaledVector(f,12);
      sgBeam(a,b,[0x5ab0ff],.38,.65,{grow:10,op:.8});sgBeam(a,b,[0xffffff],.16,.6,{grow:12});sgRing(a,[0x9ad8ff],.3,1.2,.4,{face:f,th:.06});},
    tk:(R,k)=>{if(k<.5)sgBurst(sgHand(1).add(sgHand(-1)).multiplyScalar(.5),[0x9ad8ff,0xffffff],3,{sp:2.5,life:.3,size:.8});}},
   {p:sgP({sx:-.1,hd:-.2,rSx:-2.4,rSz:-.3,rE:-2.2,lSx:.2,lSz:.5,lE:-1.6}),d:.85,face:-.3},['showcase',.45,0]],

 heir:()=>{const zap=(n)=>{for(let i=0;i<n;i++){const c=sgChest().add(new V3(rand(-.45,.45),rand(-.9,.5),rand(-.45,.45)));sgBolt(c,c.clone().add(new V3(rand(-.35,.35),rand(-.35,.35),rand(-.35,.35))),SGC.GREEN,.12);}};
  return [   // green sparks crackling, a finger-flick air blast, a full-power wind-up and smash, fist clenched
   {p:sgP({hy:-.2,sx:.15,sy:-.3,lSx:-1.0,lSz:.3,lE:-1.6,rSx:-.4,rSz:-.4,rE:-1.8,lHx:-.55,lK:.7,rHx:.35,rK:.5}),d:.6,on:()=>sgS('zap'),tk:()=>{if(Math.random()<.4)zap(1);}},
   {p:sgP({sy:.3,rSx:-1.6,rSz:-.05,rE:-.4,lSx:-.6,lSz:.4,lE:-1.4,hy:-.1}),d:.2},
   {p:sgP({sy:.3,rSx:-1.6,rSz:-.05,rE:-.05,lSx:-.6,lSz:.4,lE:-1.4,hy:-.1}),d:.15,fx:2,fxc:SGC.GREEN,
    on:()=>{sgS('snap');sgS('wind');const f=sgFw(),c=sgHand(-1).addScaledVector(f,.15);sgRing(c,SGC.AIR,.1,.9,.45,{face:f,mv:f.clone().multiplyScalar(6),th:.025});sgBurst(c,SGC.AIR,12,{dir:f.clone().multiplyScalar(6),spread:.15,g:0,life:.3,size:.6});}},
   {p:'heavyw',d:.5,on:()=>sgS('zap'),tk:()=>{const h=sgHand(-1);if(Math.random()<.7)sgBolt(h,h.clone().add(new V3(rand(-.4,.4),rand(-.4,.4),rand(-.4,.4))),SGC.GREEN,.1);zap(1);}},
   {p:sgP({sy:.65,sx:.25,hy:-.2,rSx:-1.6,rSz:-.05,rE:0,lSx:-.4,lSz:.5,lE:-1.4,rHx:.5,lHx:-.7,lK:.8,rK:.2}),d:.32,fx:3,fxc:SGC.GREEN,
    on:()=>{sgS('boom');sgShake(.5,10);const f=sgFw(),c=sgHand(-1).addScaledVector(f,.25);sgRing(c,SGC.AIR,.2,1.8,.55,{face:f,mv:f.clone().multiplyScalar(5),th:.07});
      sgRing(c,SGC.GREEN,.1,1.1,.45,{face:f,mv:f.clone().multiplyScalar(7),th:.03});sgBurst(c,SGC.AIR,26,{dir:f.clone().multiplyScalar(9),spread:.25,g:0,life:.4,size:.8});for(let i=0;i<4;i++)sgBolt(c,c.clone().addScaledVector(f,rand(.8,2)).add(new V3(rand(-.6,.6),rand(-.6,.6),0)),SGC.GREEN,.2);}},
   {p:sgP({sx:-.05,hd:-.05,rSx:-1.3,rSz:.2,rE:-2.0,lSx:-.1,lSz:.3,lE:-.3}),d:.95,tk:()=>{if(Math.random()<.2)zap(1);}},['showcase',.45,0]];}
};
