/* Destructible city: big hits crater the ground, fighters smashed into buildings crack the walls,
   and the streets get more breakable things — benches, bins, sign boards, vending machines and
   fire hydrants that burst into a geyser. (Cars, crates, cones and barriers already broke.) */
const CRATER_MAX=36,CRACK_MAX=30;
// decal textures, drawn once
function crackTex(kind){const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');const C=S/2;
  if(kind==='crater'){const gr=g.createRadialGradient(C,C,0,C,C,C);gr.addColorStop(0,'rgba(10,8,6,.92)');gr.addColorStop(.45,'rgba(30,26,22,.75)');gr.addColorStop(.7,'rgba(50,44,38,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  g.strokeStyle=kind==='crater'?'rgba(8,6,4,.95)':'rgba(20,18,16,.9)';g.lineCap='round';
  let seed=kind==='crater'?7:13;const R=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<14;i++){let a=i/14*6.283+R()*.4,r=kind==='crater'?S*.16:S*.04,x=C+Math.cos(a)*r,y=C+Math.sin(a)*r;g.lineWidth=kind==='crater'?4:5;g.beginPath();g.moveTo(x,y);
    const L=S*(.3+R()*.2);for(let s=0;s<6;s++){a+=(R()-.5)*.7;const st=L/6;x+=Math.cos(a)*st;y+=Math.sin(a)*st;g.lineTo(x,y);g.lineWidth=Math.max(1,g.lineWidth-.6);}g.stroke();
    if(R()<.5){g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a+1)*S*.06,y+Math.sin(a+1)*S*.06);g.stroke();}}
  if(kind==='wall'){g.fillStyle='rgba(15,12,10,.85)';g.beginPath();g.arc(C,C,S*.07,0,6.283);g.fill();}
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;}
const DSTR={craters:[],cracks:[],geysers:[]};
const craterMat=new THREE.MeshStandardMaterial({map:crackTex('crater'),transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
const crackMat=new THREE.MeshStandardMaterial({map:crackTex('wall'),transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
const decalGeo=new THREE.PlaneGeometry(1,1);
function crater(x,z,size,y){if(DSTR.craters.length>=CRATER_MAX){const o=DSTR.craters.shift();scene.remove(o.m);}
  const m=new THREE.Mesh(decalGeo,craterMat.clone());m.rotation.x=-Math.PI/2;m.rotation.z=Math.random()*6.28;const gy=y!=null?y:floorAt(x,z,2);
  m.position.set(x,gy+.03,z);m.scale.setScalar(size*2);m.renderOrder=1;scene.add(m);DSTR.craters.push({m,t:0});
  const p=new V3(x,gy+.2,z);debris(p,Math.round(4+size*3),0,5+size*2,.18+size*.05);dust(p,Math.round(6+size*3),.6+size*.25);}
function wallCrack(p,n,size){if(DSTR.cracks.length>=CRACK_MAX){const o=DSTR.cracks.shift();scene.remove(o.m);}
  const m=new THREE.Mesh(decalGeo,crackMat.clone());m.position.copy(p).addScaledVector(n,.04);m.lookAt(p.clone().add(n));m.rotateZ(Math.random()*6.28);m.scale.setScalar(size*2);m.renderOrder=1;scene.add(m);DSTR.cracks.push({m,t:0});
  debris(p.clone().addScaledVector(n,.4),8,0,6,.22);burst(SMK,p.clone().addScaledVector(n,.3),10,{colors:[0x8a8076,0x6a625a],speed:2.5,life:.9,size:.6,size1:1.4,drag:2});
  const sc=AU.scale;AU.scale=sndAt(p);AU.rock();AU.crash();AU.scale=sc;shake(.3,p);}
onEv('frame',dt=>{for(const L of [DSTR.craters,DSTR.cracks])for(let i=L.length-1;i>=0;i--){const o=L[i];o.t+=dt;if(o.t>45){o.m.material.opacity=Math.max(0,1-(o.t-45)/5);if(o.t>50){scene.remove(o.m);o.m.material.dispose();L.splice(i,1);}}}
  for(let i=DSTR.geysers.length-1;i>=0;i--){const G=DSTR.geysers[i];G.t-=dt;if(G.t<=0||!inMatch()){DSTR.geysers.splice(i,1);continue;}
    if(nearCam(G.p,70))burst(ADD,G.p,3,{colors:[0xbfe8ff,0xffffff,0x7ac8ff],speed:1.2,up:14,life:.9,size:.35,size1:.1,grav:16,bright:1.2,rad:.15});
    // the spray knocks fighters upward
    for(const f of FS)if(!f.dead&&Math.hypot(f.pos.x-G.p.x,f.pos.z-G.p.z)<1.1&&f.pos.y<4){f.vel.y=Math.max(f.vel.y,9);f.onGround=false;}}});
// big hits make craters; ultimates leave a scar where they land
onEv('hit',(att,def,dmg,o)=>{if(!o||def.dead===undefined)return;if((o.heavy&&o.launch&&dmg>=7)||dmg>=16){const s=Math.min(2.6,.9+dmg*.06);
  setTimeout(()=>{if(inMatch())crater(def.pos.x+rand(-.3,.3),def.pos.z+rand(-.3,.3),s);},120);}});
onEv('ult',f=>{setTimeout(()=>{if(inMatch()&&!f.dead)crater(f.pos.x,f.pos.z,2.4,f.onGround?f.pos.y:null);},500);});
// fighters launched into buildings crack the wall
onEv('tick',()=>{for(const f of FS){const sp=Math.hypot(f.vel.x,f.vel.z);
  if(f.wallT&&f.wallT!==f._wt){f._wt=f.wallT;if((f.state==='fly'||f.state==='hit')&&(f._sp||0)>9&&f.wallN){const n=f.wallN,p=new V3(f.pos.x,f.pos.y+1.1*f.hero.scale,f.pos.z).addScaledVector(n,-.55);wallCrack(p,n,1+Math.min(1.2,(f._sp-9)*.08));}}
  f._sp=sp;}});
onEv('matchStart',()=>{for(const L of [DSTR.craters,DSTR.cracks]){L.forEach(o=>{scene.remove(o.m);o.m.material.dispose();});L.length=0;}DSTR.geysers.length=0;});
/* ---- more breakable street furniture (seeded, so every online player gets the same set) ---- */
const benchMat=new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.8}),metalMat=new THREE.MeshStandardMaterial({color:0x3a3e46,metalness:.7,roughness:.4});
const binMat=new THREE.MeshStandardMaterial({color:0x2a6a4a,roughness:.6}),signMat=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.7});
const hydMat=new THREE.MeshStandardMaterial({color:0xd8282a,roughness:.45,metalness:.3});
const vendCols=[0xd8282a,0x2a6ad8,0xf2f2f2];const vendMats=vendCols.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.4,metalness:.2}));
const vendFace=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2d8,emissiveIntensity:1.2,roughness:.3});
const signFaceT=(()=>{const c=document.createElement('canvas');c.width=128;c.height=160;const g=c.getContext('2d');g.fillStyle='#f6f2e8';g.fillRect(0,0,128,160);g.fillStyle='#c4202a';g.fillRect(0,0,128,36);
  g.fillStyle='#fff';g.font='bold 26px sans-serif';g.textAlign='center';g.fillText('本日',64,28);g.fillStyle='#222';g.font='bold 30px sans-serif';g.fillText('ラーメン',64,84);g.font='bold 22px sans-serif';g.fillText('¥780',64,128);return new THREE.CanvasTexture(c);})();
const signFaceM=new THREE.MeshStandardMaterial({map:signFaceT,roughness:.7});
function addProp2(kind,x,z,rot){if(insideBld(x,z,1.2)||Math.abs(x)>BOUND-4||Math.abs(z)>BOUND-4)return;const g=new THREE.Group();let r=.6;const B=(w,h,d,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px||0,py,pz||0);g.add(o);return o;};
  if(kind==='bench'){B(2,.12,.6,benchMat,0,.5);B(2,.5,.1,benchMat,0,.85,-.27);B(.1,.5,.5,metalMat,-.85,.25);B(.1,.5,.5,metalMat,.85,.25);r=1;}
  else if(kind==='bin'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.32,.28,.9,12),binMat);c.position.y=.45;g.add(c);r=.4;}
  else if(kind==='sign'){const a=B(.8,1.1,.06,signFaceM,0,.6,.18);a.rotation.x=-.25;const b=B(.8,1.1,.06,signFaceM,0,.6,-.18);b.rotation.x=.25;r=.5;}
  else if(kind==='vend'){B(1.1,1.9,.8,vendMats[Math.floor(srnd()*3)],0,.95);B(.9,1,.05,vendFace,0,1.25,.41);r=.8;}
  else if(kind==='hydrant'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.7,10),hydMat);c.position.y=.35;g.add(c);B(.5,.12,.12,hydMat,0,.45);const t=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),hydMat);t.position.y=.72;g.add(t);r=.3;}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});g.position.set(x,floorAt(x,z,1),z);g.rotation.y=rot||0;world.add(g);props.push({g,kind,x,z,r,broken:false,i:props.length});}
INNER.forEach(a=>BLOCKS.forEach(t=>{for(const sd of [-1,1]){const k=srnd();const off=a+sd*7.6;const kind=k<.25?'bench':k<.45?'bin':k<.6?'vend':k<.75?'sign':k<.88?'hydrant':null;
  if(!kind)continue;const along=t+sr(-15,15);if(srnd()<.5)addProp2(kind,along,off,sd>0?Math.PI:0);else addProp2(kind,off,along,sd>0?-Math.PI/2:Math.PI/2);}}));
const _breakProp0=breakProp;
breakProp=function(p,fromNet){const was=p.broken;_breakProp0(p,fromNet);if(was||!p.broken)return;const c=new V3(p.x,.9,p.z);
  if(p.kind==='vend'){burst(ADD,c,24,{colors:[0xffffff,0xbfe8ff,0xffd23f],speed:6,life:.4,size:.15,size1:0,bright:2.4});const sc=AU.scale;AU.scale=sndAt(c);AU.glass();AU.zap(1);AU.scale=sc;}
  else if(p.kind==='hydrant'){DSTR.geysers.push({p:new V3(p.x,.4,p.z),t:9});const sc=AU.scale;AU.scale=sndAt(c);AU.water();AU.scale=sc;}
  else if(p.kind==='sign'||p.kind==='bench'){debris(c,6,2,7,.25);}};
