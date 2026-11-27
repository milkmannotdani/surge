/* buildRig: how a fighter's 3D body is built */

function makeCloth(w,len,sw,sl,mat,amp){const g=new THREE.PlaneGeometry(w,len,sw,sl);g.translate(0,-len/2,0);const m=new THREE.Mesh(g,mat);m.castShadow=true;
  return {mesh:m,base:Float32Array.from(g.attributes.position.array),len,amp};}
function updateCloth(c,t,sp){const pos=c.mesh.geometry.attributes.position,b=c.base;
  for(let i=0;i<pos.count;i++){const bx=b[i*3],by=b[i*3+1],u=-by/c.len;
    const wave=Math.sin(t*9+u*5+bx*3)*.07*u*c.amp*(1+sp*.12);const back=u*(.12+Math.min(sp,14)*.05)*c.amp;
    pos.setXYZ(i,bx+Math.sin(t*6+u*4)*.04*u*c.amp,by+u*u*Math.min(sp,14)*.035*c.amp,-back+wave);}
  pos.needsUpdate=true;c.mesh.geometry.computeVertexNormals();}

/* ---- high-detail geometry helpers ---- */
const GC={};function cg(k,f){return GC[k]||(GC[k]=f());}
function capsule(r1,r2,len,seg){return cg('cap'+r1+'_'+r2+'_'+len,()=>{const p=[],n=8;
  for(let i=0;i<=n;i++){const a=-Math.PI/2+Math.PI/2*i/n;p.push(new THREE.Vector2(Math.max(.0001,Math.cos(a)*r2),-len+Math.sin(a)*r2));}
  for(let i=1;i<=n;i++){const a=Math.PI/2*i/n;p.push(new THREE.Vector2(Math.max(.0001,Math.cos(a)*r1),Math.sin(a)*r1));}
  return new THREE.LatheGeometry(p,seg||28);});}
function lathe(key,pts,seg,ps,pl){return cg(key,()=>new THREE.LatheGeometry(pts.map(([y,r])=>new THREE.Vector2(Math.max(.0001,r),y)),seg||36,ps||0,pl||Math.PI*2));}
const SG=(r,w,h)=>cg('s'+r+'_'+(w||32),()=>new THREE.SphereGeometry(r,w||32,h||24));
const TORSO=[[0,0],[.0,.17],[.06,.2],[.16,.185],[.26,.22],[.36,.275],[.46,.3],[.54,.29],[.6,.24],[.64,.15],[.66,0]];
const PLATE=[[.24,.225],[.34,.285],[.44,.312],[.53,.303],[.59,.258],[.63,.17]];

let FABRIC=null;function fabricNormal(){if(FABRIC)return FABRIC;const [hc,hg]=cv(128,128);hg.fillStyle='#808080';hg.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4){const v=((x+y)/4)%2?150:100;hg.fillStyle=`rgb(${v},${v},${v})`;hg.fillRect(x,y,4,2);}
  FABRIC=normalFromHeight(hc,1.6);FABRIC.repeat.set(6,6);return FABRIC;}
let SCRATCH=null;function scratchNormal(){if(SCRATCH)return SCRATCH;const [hc,hg]=cv(256,256);hg.fillStyle='#808080';hg.fillRect(0,0,256,256);hg.strokeStyle='rgba(60,60,60,.7)';
  for(let i=0;i<70;i++){hg.lineWidth=rand(.5,1.5);hg.beginPath();const x=Math.random()*256,y=Math.random()*256;hg.moveTo(x,y);hg.lineTo(x+rand(-30,30),y+rand(-30,30));hg.stroke();}
  for(let i=0;i<3000;i++){const v=118+Math.random()*20|0;hg.fillStyle=`rgb(${v},${v},${v})`;hg.fillRect(Math.random()*256,Math.random()*256,1,1);}
  SCRATCH=normalFromHeight(hc,1.2);SCRATCH.repeat.set(2,2);return SCRATCH;}
const PATS={};
function patternTex(style){if(PATS[style])return PATS[style];const S=256,[c,g]=cv(S,S);g.fillStyle='#000';g.fillRect(0,0,S,S);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineCap='round';
  if(style==='cracks'){const P=[];for(let i=0;i<24;i++)P.push([Math.random()*S,Math.random()*S]);const img=g.getImageData(0,0,S,S),d=img.data;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){let a=1e9,b=1e9;for(const p of P)for(let ox=-S;ox<=S;ox+=S)for(let oy=-S;oy<=S;oy+=S){const dx=x-p[0]-ox,dy=y-p[1]-oy,q=dx*dx+dy*dy;if(q<a){b=a;a=q;}else if(q<b)b=q;}
      const e=Math.sqrt(b)-Math.sqrt(a);const v=e<1.4?255:(e<3.4?140*(1-(e-1.4)/2):0);const i=(y*S+x)*4;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}g.putImageData(img,0,0);}
  else if(style==='circuit'){g.lineWidth=2;for(let i=0;i<46;i++){let x=Math.random()*S|0,y=Math.random()*S|0;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){if(Math.random()<.5)x+=(Math.random()<.5?-1:1)*rand(10,50);else y+=(Math.random()<.5?-1:1)*rand(10,50);g.lineTo(x,y);}g.stroke();g.beginPath();g.arc(x,y,3,0,7);g.fill();}}
  else if(style==='veins'){const br=(x,y,a,w,n)=>{if(n<=0||w<.4)return;g.lineWidth=w;g.beginPath();g.moveTo(x,y);const L=rand(15,35);const x2=x+Math.cos(a)*L,y2=y+Math.sin(a)*L;g.quadraticCurveTo(x+Math.cos(a+.6)*L*.5,y+Math.sin(a+.6)*L*.5,x2,y2);g.stroke();br(x2,y2,a+rand(-.6,.6),w*.8,n-1);if(Math.random()<.4)br(x2,y2,a+rand(.6,1.2)*(Math.random()<.5?1:-1),w*.6,n-2);};
    for(let i=0;i<10;i++)br(Math.random()*S,Math.random()*S,rand(0,6.28),3,7);}
  else if(style==='runes'){g.lineWidth=2;for(let gy=8;gy<S;gy+=32)for(let gx=8;gx<S;gx+=32){if(Math.random()<.45)continue;g.beginPath();for(let k=0;k<3;k++){g.moveTo(gx+rand(0,16),gy+rand(0,16));g.lineTo(gx+rand(0,16),gy+rand(0,16));}g.stroke();if(Math.random()<.4){g.beginPath();g.arc(gx+8,gy+8,7,0,7);g.stroke();}}}
  else if(style==='stars'){for(let i=0;i<300;i++){const r=Math.random();g.globalAlpha=.3+r*.7;g.fillRect(Math.random()*S,Math.random()*S,r<.92?1:2,r<.92?1:2);}g.globalAlpha=1;
    for(let i=0;i<8;i++){const x=Math.random()*S,y=Math.random()*S;g.fillRect(x-4,y,9,1);g.fillRect(x,y-4,1,9);}}
  else if(style==='waves'){g.lineWidth=2;for(let y=0;y<S;y+=16){g.beginPath();for(let x=0;x<=S;x+=4)g.lineTo(x,y+Math.sin(x/S*Math.PI*4+y*.3)*5);g.stroke();}}
  else if(style==='hexgrid'){g.lineWidth=1.5;const r=14,h=r*Math.sqrt(3);for(let row=-1;row<S/h+1;row++)for(let col=-1;col<S/(r*1.5)+1;col++){const cx=col*r*1.5,cy=row*h+(col%2?h/2:0);g.beginPath();for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.stroke();}}
  else if(style==='scales'){g.lineWidth=2;for(let y=0;y<S+16;y+=16)for(let x=(y/16%2)*12;x<S+24;x+=24){g.beginPath();g.arc(x,y,12,0,Math.PI);g.stroke();}}
  else if(style==='stripes'){g.lineWidth=6;for(let x=-S;x<S*2;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x+S*.5,S);g.stroke();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;PATS[style]=t;return t;}
function enhanceMat(m,rim,k){m.userData.add=new THREE.Vector3();m.userData.rim=new THREE.Color(rim).multiplyScalar(k);
  m.onBeforeCompile=sh=>{sh.uniforms.uAdd={value:m.userData.add};sh.uniforms.uRim={value:m.userData.rim};
    sh.fragmentShader='uniform vec3 uAdd;\nuniform vec3 uRim;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n\ttotalEmissiveRadiance+=uAdd+uRim*pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);');};
  m.customProgramCacheKey=()=>'rimflash1';}
function buildRig(h,sc){
  sc=sc||scene;const root=new THREE.Group();
  const suit=new THREE.MeshPhysicalMaterial({color:h.suit,roughness:.5,metalness:.3,clearcoat:.3,clearcoatRoughness:.5});
  const main=new THREE.MeshPhysicalMaterial({color:h.mainCol||h.color,roughness:.28,metalness:.3,clearcoat:.8,clearcoatRoughness:.18});
  const trim=new THREE.MeshPhysicalMaterial({color:h.color,roughness:.3,metalness:.45,clearcoat:.7,clearcoatRoughness:.2});
  const glow=new THREE.MeshStandardMaterial({color:h.accent,emissive:h.accent,emissiveIntensity:2.4,roughness:.3});
  const dark=new THREE.MeshPhysicalMaterial({color:0x121218,roughness:.45,metalness:.55,clearcoat:.4});
  suit.normalMap=fabricNormal();suit.normalScale=new THREE.Vector2(.45,.45);suit.roughness=.62;main.normalMap=scratchNormal();main.normalScale=new THREE.Vector2(.25,.25);trim.normalMap=main.normalMap;trim.normalScale=main.normalScale;
  const envT=sc&&sc!==scene?(window.__PVENV||null):(SKYENV||ENV);if(envT)[suit,main,trim,dark].forEach(m=>{m.envMap=envT;m.envMapIntensity=sc&&sc!==scene?.55:1;});
  if(h.skinMat)applySkinMat(h,{suit,main,trim});
  enhanceMat(suit,h.accent,.35);enhanceMat(main,h.accent,.55);enhanceMat(trim,h.accent,.5);
  if(h.pat){main.emissiveMap=patternTex(h.pat);main.emissive=new THREE.Color(h.color);main.emissiveIntensity=h.patK||1;}
  const B=h.bulk||1,BX=1+(B-1)*.6;
  const O=()=>new THREE.Object3D();const M=(g,m)=>new THREE.Mesh(g,m);
  const hips=O();hips.position.y=.95;root.add(hips);
  // pelvis + belt
  const pel=M(SG(.2),suit);pel.scale.set(1.22*B,.78,.88*BX);hips.add(pel);
  const belt=M(cg('belt',()=>new THREE.TorusGeometry(.212,.034,16,64)),trim);belt.rotation.x=Math.PI/2;belt.position.y=.06;belt.scale.set(1,.82,1);hips.add(belt);
  const buck=M(cg('buck',()=>new THREE.CylinderGeometry(.058,.058,.03,6)),glow);buck.rotation.x=Math.PI/2;buck.position.set(0,.06,.18);hips.add(buck);
  const spine=O();spine.position.y=.06;hips.add(spine);
  // sculpted torso
  const torso=M(lathe('torso',TORSO,40),suit);torso.scale.set(B,1,.7*BX);spine.add(torso);
  const plate=M(lathe('plate',PLATE,40,-Math.PI*.55,Math.PI*1.1),main);plate.scale.set(1.03*B,1,.74*BX);spine.add(plate);
  [-1,1].forEach(s=>{const p=M(SG(.1),main);p.scale.set(1.05*B,.72,.42);p.position.set(s*.105*B,.47,.185*BX);spine.add(p);});
  for(let r=0;r<3;r++)for(const s of [-1,1]){const a=M(SG(.045,16,12),suit);a.scale.set(1.1,.8,.45);a.position.set(s*.05,.12+r*.075,.165-r*.004);spine.add(a);}
  const emb=M(cg('emb',()=>new THREE.CylinderGeometry(.07,.07,.025,6)),glow);emb.rotation.x=Math.PI/2;emb.position.set(0,.5,.232);spine.add(emb);
  const embR=M(cg('embR',()=>new THREE.TorusGeometry(.085,.012,8,6)),trim);embR.position.set(0,.5,.232);embR.rotation.z=Math.PI/6;spine.add(embR);
  [-1,1].forEach(s=>{const st=M(cg('strip',()=>new THREE.BoxGeometry(.02,.26,.015)),glow);st.position.set(s*.16,.36,.2);st.rotation.set(-.15,0,s*.3);spine.add(st);});
  // neck & head
  const neck=O();neck.position.y=.66;spine.add(neck);
  const nk=M(cg('nk',()=>new THREE.CylinderGeometry(.068,.08,.12,24)),suit);nk.position.y=.02;neck.add(nk);
  const head=O();head.position.y=.07;neck.add(head);
  const helm=M(SG(.165,40,32),main);helm.position.y=.12;helm.scale.set(.98,1.1,1.06);head.add(helm);
  const vmat=glow.clone();vmat.emissiveIntensity=1.5;const visor=M(cg('visor',()=>new THREE.SphereGeometry(.172,40,12,Math.PI*.08,Math.PI*.84,Math.PI*.42,Math.PI*.17)),vmat);visor.position.y=.12;visor.scale.set(.98,1.1,1.06);head.add(visor);
  const face=M(cg('face',()=>new THREE.SphereGeometry(.15,32,16,Math.PI*.1,Math.PI*.8,Math.PI*.55,Math.PI*.3)),suit);face.position.set(0,.115,.012);face.scale.set(.98,1.1,1.06);head.add(face);
  [-1,1].forEach(s=>{const e=M(cg('ear',()=>new THREE.CylinderGeometry(.045,.05,.04,24)),trim);e.rotation.z=Math.PI/2;e.position.set(s*.162,.12,0);head.add(e);
    const er=M(cg('earR',()=>new THREE.TorusGeometry(.03,.007,8,24)),glow);er.rotation.y=Math.PI/2;er.position.set(s*.184,.12,0);head.add(er);});
  // arms with gauntlets and fingers
  const finger=capsule(.016,.014,.045,10),thumb=capsule(.018,.015,.04,10);
  const arm=(s)=>{const sh=O();sh.position.set(s*.33*BX,.58,0);spine.add(sh);
    const pad=M(cg('pad',()=>new THREE.SphereGeometry(.12,32,16,0,Math.PI*2,0,Math.PI*.55)),main);pad.scale.set(1.1*B,B,B);pad.position.y=.02;pad.rotation.z=s*.25;sh.add(pad);
    const padR=M(cg('padR',()=>new THREE.TorusGeometry(.112,.012,8,40)),trim);padR.rotation.x=Math.PI/2;padR.rotation.y=s*.25;padR.position.y=.0;sh.add(padR);
    const up=M(capsule(.07,.062,.28),suit);up.scale.set(B,1,B);sh.add(up);
    const bi=M(SG(.058,24,16),suit);bi.scale.set(B,1.5,B);bi.position.set(0,-.13,.025);sh.add(bi);
    const el=O();el.position.y=-.3;sh.add(el);
    const fa=M(capsule(.062,.052,.25),main);fa.scale.set(B,1,B);el.add(fa);
    const gaunt=M(cg('gaunt',()=>new THREE.CylinderGeometry(.07,.058,.12,28,1,true)),trim);gaunt.position.y=-.2;gaunt.scale.set(B,1,B);el.add(gaunt);
    const rg=M(cg('ring',()=>new THREE.TorusGeometry(.066,.012,8,32)),glow);rg.rotation.x=Math.PI/2;rg.position.y=-.15;el.add(rg);
    const fist=O();fist.position.y=-.32;el.add(fist);
    const palm=M(SG(.06,24,18),dark);palm.scale.set(1.05,1.15,.78);fist.add(palm);
    for(let k=0;k<4;k++){const f1=O();f1.position.set((k-1.5)*.026,-.055,.02);f1.rotation.x=-1.25;fist.add(f1);const a=M(finger,dark);f1.add(a);
      const f2=O();f2.position.y=-.05;f2.rotation.x=-1.3;f1.add(f2);f2.add(M(finger,dark));}
    const th=O();th.position.set(-s*.045,-.02,.03);th.rotation.set(-.6,0,-s*.9);fist.add(th);th.add(M(thumb,dark));
    return [sh,el,fist];};
  const [lS,lE,lF]=arm(1),[rS,rE,rF]=arm(-1);
  const leg=(s)=>{const hp=O();hp.position.set(s*.13*BX,-.02,0);hips.add(hp);
    const th=M(capsule(.105,.08,.42),suit);th.scale.set(B,1,B);hp.add(th);
    const quad=M(SG(.075,24,16),suit);quad.scale.set(B,1.8,B);quad.position.set(0,-.18,.035);hp.add(quad);
    const kn=O();kn.position.y=-.45;hp.add(kn);
    const kp=M(cg('kp',()=>new THREE.SphereGeometry(.075,28,14,0,Math.PI*2,0,Math.PI*.6)),main);kp.rotation.x=Math.PI/2;kp.position.z=.04;kn.add(kp);
    const shin=M(capsule(.078,.062,.38),main);shin.scale.set(B,1,B);kn.add(shin);
    const cuff=M(cg('cuff',()=>new THREE.CylinderGeometry(.075,.085,.1,28)),trim);cuff.position.y=-.37;kn.add(cuff);
    const boot=M(cg('boot',()=>THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(.14,.1,.29,4,.04):new THREE.BoxGeometry(.14,.1,.29)),dark);boot.position.set(0,-.45,.05);kn.add(boot);
    const toe=M(cg('toe',()=>new THREE.SphereGeometry(.07,24,12,0,Math.PI*2,0,Math.PI/2)),trim);toe.scale.set(1,.6,1.1);toe.position.set(0,-.43,.15);kn.add(toe);
    const so=M(cg('sole',()=>new THREE.BoxGeometry(.142,.018,.295)),glow);so.position.set(0,-.505,.05);kn.add(so);
    return [hp,kn];};
  const [lH,lK]=leg(1),[rH,rK]=leg(-1);
  let cloth=null,whip=null,blades=null,beam=null,beast=null,spikes=null,wings=null,orbiters=null;
  const cmat=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.7});
  const cape=(col,w,l,amp,y,z,par)=>{cmat.color.setHex(col);cloth=makeCloth(w,l,6,16,cmat,amp);cloth.mesh.position.set(0,y,z);(par||spine).add(cloth.mesh);};
  if(HAS(h,'riptide')){cape(0x0b2a55,.62,1.15,.75,.6,-.2);const fin=M(new THREE.ConeGeometry(.05,.32,16),glow);fin.scale.z=4;fin.rotation.x=-1.2;fin.position.set(0,.29,-.02);head.add(fin);}
  if(HAS(h,'gale')){cmat.emissive=new THREE.Color(0x6a40c0);cmat.emissiveIntensity=.4;cmat.color.setHex(0xe6dcff);cloth=makeCloth(.2,1.7,3,20,cmat,1.6);cloth.mesh.position.set(.08,.03,-.12);neck.add(cloth.mesh);
    const scf=M(new THREE.TorusGeometry(.1,.045,16,32),cmat);scf.rotation.x=Math.PI/2;scf.position.y=.02;neck.add(scf);}
  if(HAS(h,'cinder')){cape(0x3a1208,.5,.7,.6,.18,-.18);[-1,1].forEach(s=>{const sp=M(new THREE.ConeGeometry(.04,.16,16),glow);sp.position.set(s*.33,.7,0);sp.rotation.z=-s*.6;spine.add(sp);});}
  if(HAS(h,'quake')){const rk=new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.95,flatShading:true});
    [lS,rS].forEach(sh=>{const p=M(new THREE.DodecahedronGeometry(.17,1),rk);p.scale.set(1.2,.8,1.1);p.position.y=.07;sh.add(p);});
    const crest=M(new THREE.BoxGeometry(.05,.08,.28),glow);crest.position.set(0,.29,0);head.add(crest);}
  if(HAS(h,'marrow')){
    cape(0x3a0610,.66,1.35,.8,.62,-.2);
    const hood=M(new THREE.SphereGeometry(.2,32,20,0,Math.PI*2,0,Math.PI*.6),cmat);hood.position.set(0,.13,-.03);hood.scale.set(1.05,1.15,1.15);head.add(hood);
    const flesh=new THREE.MeshPhysicalMaterial({color:0x8a1020,emissive:0x5a0010,emissiveIntensity:.8,roughness:.3,clearcoat:1,clearcoatRoughness:.15});
    const bone=new THREE.MeshStandardMaterial({color:0xf0e6d6,roughness:.5});
    const sg=new THREE.CylinderGeometry(1,1,1,16);const g=new THREE.Group();const segs=[];
    for(let i=0;i<24;i++){const m=M(sg,flesh);m.castShadow=true;g.add(m);segs.push(m);}
    const tip=M(new THREE.ConeGeometry(.09,.4,16),bone);g.add(tip);g.visible=false;sc.add(g);whip={group:g,segs,tip};
    const bgeo=new THREE.ConeGeometry(.13,1.15,12);bgeo.translate(0,-.57,0);
    blades=[lE,rE].map(el=>{const b=M(bgeo,flesh);b.scale.set(1,1,.3);b.position.y=-.3;b.castShadow=true;b.visible=false;el.add(b);
      const e=M(new THREE.ConeGeometry(.03,1.1,8),glow);e.position.y=-.55;e.rotation.x=Math.PI;b.add(e);return b;});
    const bg2=new THREE.CylinderGeometry(1,1,1,40,1,true);bg2.rotateX(Math.PI/2);bg2.translate(0,0,.5);
    const bG=new THREE.Group();const outerM=M(bg2,addMat(0xa00818,1.1,.55)),mid=M(bg2,addMat(0xff2038,1.3,.6)),core=M(bg2,addMat(0xff8088,2.2,.9));
    mid.scale.set(.6,.6,1);core.scale.set(.25,.25,1);bG.add(outerM,mid,core);
    const rings=[];for(let k=0;k<6;k++){const r=M(new THREE.TorusGeometry(1.35,.08,12,48),addMat(0xc4102a,1.8,.7));bG.add(r);rings.push(r);}
    const muzzle=M(new THREE.SphereGeometry(1,32,24),addMat(0xff3048,2.2,.8));bG.add(muzzle);bG.visible=false;sc.add(bG);beam={group:bG,tubes:[outerM,mid,core],rings,muzzle};
  }
  if(HAS(h,'nitro')){const pg=new THREE.MeshStandardMaterial({color:0xffb347,emissive:0xff7a10,emissiveIntensity:3});
    [lF,rF].forEach(f=>{const p=M(SG(.04,16,12),pg);p.position.set(0,-.02,.05);f.add(p);});
    const fin=M(new THREE.BoxGeometry(.05,.13,.34),main);fin.position.set(0,.3,-.02);head.add(fin);
    const can=new THREE.MeshPhysicalMaterial({color:0x2c2d33,metalness:.8,roughness:.3,clearcoat:.6});
    [-1,1].forEach(s=>{const c=M(new THREE.CylinderGeometry(.08,.08,.42,28),can);c.position.set(s*.11,.42,-.24);spine.add(c);
      const v=M(new THREE.CylinderGeometry(.06,.04,.06,20),pg);v.position.set(s*.11,.18,-.24);spine.add(v);});}
  if(HAS(h,'entropy')){cape(0x3a363e,.7,1.3,.7,.62,-.2);
    [[.06,.16,.6],[-.07,.1,-.5],[.02,.2,1.2],[-.04,.06,2.2]].forEach(([x,y,r])=>{const c=M(new THREE.BoxGeometry(.012,.09,.012),glow);c.position.set(x,y,.17);c.rotation.z=r;head.add(c);});
    const pm=new THREE.MeshStandardMaterial({color:0xc9a0ff,emissive:0x9a6aff,emissiveIntensity:2.5});[lF,rF].forEach(f=>{const p=M(SG(.045,16,12),pm);p.position.set(0,-.03,.05);f.add(p);});}
  if(HAS(h,'sovereign')){cape(0x0a090e,.78,1.5,.65,.64,-.21);cmat.metalness=.3;
    const mantle=M(new THREE.SphereGeometry(.36,32,16,0,Math.PI*2,0,Math.PI*.35),cmat);mantle.position.y=.5;mantle.scale.set(1,.9,.8);spine.add(mantle);
    const halo=new THREE.Group();halo.add(M(new THREE.TorusGeometry(.26,.014,8,64),glow));
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2;const sp=M(new THREE.ConeGeometry(.025,.13,12),glow);sp.position.set(Math.cos(a)*.3,Math.sin(a)*.3,0);sp.rotation.z=a-Math.PI/2;halo.add(sp);}
    halo.position.set(0,.16,-.2);head.add(halo);visor.scale.set(.5,1.4,1.06);}
  if(HAS(h,'strobe')){const fb=new THREE.BoxGeometry(.03,.05,.03);
    [lE,rE].forEach(el=>{for(let k=0;k<4;k++){const b=M(fb,glow);b.position.set(0,-.04-k*.05,.058);el.add(b);}});
    [lK,rK].forEach(kn=>{for(let k=0;k<5;k++){const b=M(fb,glow);b.position.set(0,-.06-k*.065,.068);kn.add(b);}});
    const fin=M(new THREE.BoxGeometry(.02,.06,.3),glow);fin.position.set(0,.3,-.04);fin.rotation.x=-.25;head.add(fin);}
  if(HAS(h,'titan')){[lS,rS].forEach((sh,i)=>{const p=M(new THREE.SphereGeometry(.17,32,16,0,Math.PI*2,0,Math.PI*.5),trim);p.position.y=.04;p.scale.set(1.15,.9,1.1);sh.add(p);});
    const core=M(SG(.06),glow);core.position.set(0,.5,.24);core.scale.z=.4;spine.add(core);cape(0x1a2a5a,.7,1.0,.6,.6,-.21);}
  if(HAS(h,'volta')){[[.06,.42,.6],[-.03,.34,-.6],[.04,.26,.6]].forEach(([x,y,r])=>{const z=M(new THREE.BoxGeometry(.025,.11,.02),glow);z.position.set(x,y,.24);z.rotation.z=r;spine.add(z);});
    [lS,rS].forEach(sh=>{for(let k=0;k<3;k++){const c=M(new THREE.TorusGeometry(.085,.01,8,32),glow);c.rotation.x=Math.PI/2;c.position.y=-.06-k*.05;sh.add(c);}});
    const ant=M(new THREE.ConeGeometry(.02,.22,12),glow);ant.position.set(.1,.3,-.02);ant.rotation.z=-.4;head.add(ant);}
  if(HAS(h,'umbra')){cape(0x0a0812,.7,1.2,.7,.62,-.2);
    const sm=new THREE.MeshPhysicalMaterial({color:0x050409,emissive:0x1a0e3a,emissiveIntensity:.55,roughness:.35,metalness:.2,clearcoat:.6,clearcoatRoughness:.4});
    const eye=new THREE.MeshStandardMaterial({color:0xe8dcff,emissive:0xd8c4ff,emissiveIntensity:4});
    const B=new THREE.Group();const body=[];{const bl=M(lathe('beastBody',[[-.62,0],[-.55,.06],[-.38,.1],[-.18,.14],[0,.16],[.12,.13],[.2,0]],32),sm);bl.rotation.x=-.85;bl.position.set(0,-.05,-.12);B.add(bl);body.push(bl);}
    const hd=new THREE.Group();hd.position.set(0,.12,.12);B.add(hd);
    const sk=M(SG(.17,32,24),sm);sk.scale.set(1,.8,1.5);hd.add(sk);
    const jaw=M(new THREE.SphereGeometry(.15,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2),sm);jaw.scale.set(.95,.6,1.4);jaw.position.set(0,-.05,.03);hd.add(jaw);
    [-1,1].forEach(s=>{const e=M(SG(.028,16,12),eye);e.position.set(s*.08,.04,.2);hd.add(e);
      const hn=M(new THREE.ConeGeometry(.035,.3,16),sm);hn.position.set(s*.1,.17,-.08);hn.rotation.set(-.7,0,s*.35);hd.add(hn);});
    for(let k=0;k<3;k++){const t=M(new THREE.ConeGeometry(.012,.07,8),eye);t.position.set((k-1)*.04,-.03,.24);t.rotation.x=Math.PI;hd.add(t);}
    B.position.set(0,.85,-.42);spine.add(B);beast={group:B,head:hd,jaw,body};}
  if(HAS(h,'drift')){const rm=new THREE.MeshStandardMaterial({color:0x8a7a9a,roughness:.8,flatShading:true});orbiters=[];
    for(let k=0;k<4;k++){const r=M(new THREE.DodecahedronGeometry(.07,1),rm);root.add(r);orbiters.push(r);}
    const ring=M(new THREE.TorusGeometry(.2,.012,8,48),glow);ring.position.set(0,.2,-.02);ring.rotation.x=Math.PI/2.3;head.add(ring);}
  if(HAS(h,'bastion')){spikes=new THREE.Group();const spm=new THREE.MeshPhysicalMaterial({color:0x6a6e76,metalness:.9,roughness:.25,clearcoat:1});
    const addS=(par,x,y,z,rx,rz,s)=>{const c=M(cg('spk',()=>new THREE.ConeGeometry(.035,.16,16)),spm);c.position.set(x,y,z);c.rotation.set(rx,0,rz);c.scale.setScalar(s||1);par.add(c);return c;};
    const list=[];[lS,rS].forEach((sh,i)=>{const s=i?-1:1;for(let k=0;k<4;k++)list.push(addS(sh,s*(.06+k*.02),.1-k*.02,.04-k*.03,-.3,-s*(.6+k*.2)));});
    [lE,rE].forEach(el=>{for(let k=0;k<3;k++)list.push(addS(el,0,-.08-k*.07,-.06,-1.9,0,.8));});
    for(let k=0;k<5;k++)list.push(addS(spine,(k-2)*.06,.62,-.1,-.6,0,.9));
    list.forEach(c=>c.visible=false);spikes=list;}
  if(HAS(h,'quill')){wings=[];const fm=new THREE.MeshPhysicalMaterial({color:0xffe0ea,emissive:h.color,emissiveIntensity:1.2,roughness:.2,metalness:.2,clearcoat:1,transparent:true,opacity:.92});
    const fg=cg('feather',()=>{const g=new THREE.ConeGeometry(.055,.75,4);g.translate(0,-.375,0);return g;});
    [-1,1].forEach(s=>{const w=new THREE.Group();w.position.set(s*.12,.52,-.2);spine.add(w);
      for(let k=0;k<8;k++){const f=M(fg,fm);f.scale.set(1,.7+k*.06,.22);f.rotation.z=s*(1.9+k*.16);f.position.set(s*k*.035,k*.01,-k*.02);w.add(f);}wings.push(w);});}
  if(HAS(h,'pyre')){cape(0x0c0e14,.72,1.4,.7,.62,-.2);
    const col=M(new THREE.CylinderGeometry(.12,.16,.16,32,1,true),cmat);col.position.y=.08;neck.add(col);
    [lS,rS,lE,rE].forEach(p=>{for(let k=0;k<3;k++){const c=M(new THREE.BoxGeometry(.01,.08,.01),glow);c.position.set(rand(-.04,.04),-.06-k*.07,.064);c.rotation.z=rand(-.8,.8);p.add(c);}});
    for(let k=0;k<4;k++){const c=M(new THREE.BoxGeometry(.01,.12,.01),glow);c.position.set(rand(-.15,.15),.2+k*.08,.21);c.rotation.z=rand(-.8,.8);spine.add(c);}}
  if(HAS(h,'warp')){cape(0x1a1230,.74,1.4,.8,.62,-.2);cmat.transparent=true;cmat.opacity=.85;cmat.emissive=new THREE.Color(0x2a1a5a);cmat.emissiveIntensity=.6;
    visor.scale.set(.75,.7,1.06);const hood=M(new THREE.SphereGeometry(.21,32,20,0,Math.PI*2,0,Math.PI*.62),cmat);hood.position.set(0,.13,-.03);hood.scale.set(1.08,1.15,1.15);head.add(hood);
    [lF,rF].forEach(f=>{const p=M(SG(.045,16,12),glow);p.position.set(0,-.03,.05);f.add(p);});}
  let field=null,sword=null,flames=null;
  if(HAS(h,'cinder')){flames=new THREE.Group();for(let k=0;k<5;k++){const f=M(cg('flame'+k,()=>{const g=new THREE.ConeGeometry(.034,.22+k*.015,16,4);g.translate(0,.11,0);return g;}),glow);
      f.position.set((k-2)*.032,.24,-.02-Math.abs(k-2)*.02);f.rotation.set(-.95-Math.abs(k-2)*.15,0,(k-2)*-.12);flames.add(f);}head.add(flames);}
  if(HAS(h,'titan')){const ridge=M(new THREE.TorusGeometry(.172,.024,14,48,Math.PI),trim);ridge.rotation.set(0,Math.PI/2,0);ridge.position.y=.12;ridge.scale.set(1,1.1,1.06);head.add(ridge);
    const jaw2=M(new THREE.SphereGeometry(.15,32,16,Math.PI*.05,Math.PI*.9,Math.PI*.6,Math.PI*.28),trim);jaw2.position.set(0,.1,.02);jaw2.scale.set(1.04,1.1,1.1);head.add(jaw2);}
  if(HAS(h,'bastion')){for(let k=0;k<4;k++){const b=M(cg('grill',()=>new THREE.BoxGeometry(.2,.012,.02)),dark);b.position.set(0,.05+k*.024,.158);head.add(b);}visor.scale.set(.85,.55,1.06);
    const plume=M(new THREE.BoxGeometry(.03,.07,.26),trim);plume.position.set(0,.29,-.01);head.add(plume);}
  if(HAS(h,'quill')){for(let k=0;k<3;k++){const f=M(cg('qcrest',()=>{const g=new THREE.ConeGeometry(.04,.3,12);g.translate(0,.15,0);g.scale(1,1,.3);return g;}),glow);f.position.set((k-1)*.05,.24,-.04);f.rotation.set(-1.25,0,(k-1)*-.25);head.add(f);}}
  if(HAS(h,'void')){visor.scale.set(1.04,2.4,1.07);vmat.emissiveMap=patternTex('stars');vmat.emissiveIntensity=1.6;vmat.color.setHex(0x05060c);}
  if(HAS(h,'ronin')){const gold=new THREE.MeshPhysicalMaterial({color:0xd8b060,metalness:1,roughness:.25,clearcoat:1});
    const shk=M(new THREE.CylinderGeometry(.175,.26,.15,40,1,true,Math.PI*.2,Math.PI*1.6),trim);shk.position.y=.07;shk.rotation.y=Math.PI;head.add(shk);
    const brim=M(new THREE.TorusGeometry(.17,.016,10,48),trim);brim.rotation.x=Math.PI/2;brim.position.y=.16;brim.scale.set(1,1.06,1);head.add(brim);
    const moon=M(new THREE.TorusGeometry(.13,.012,8,40,Math.PI*.85),gold);moon.position.set(0,.3,.09);moon.rotation.z=Math.PI*.075;head.add(moon);
    const mempo=M(new THREE.SphereGeometry(.152,32,16,Math.PI*.12,Math.PI*.76,Math.PI*.58,Math.PI*.3),new THREE.MeshPhysicalMaterial({color:0x5a0c10,roughness:.35,clearcoat:.8}));mempo.position.set(0,.11,.02);mempo.scale.set(1.02,1.12,1.1);head.add(mempo);}
  if(HAS(h,'scathe')){
    cape(0x2a0608,.82,1.55,.85,.64,-.21);for(let i=0;i<cloth.base.length/3;i++){if(cloth.base[i*3+1]<-1.3)cloth.base[i*3+1]+=rand(0,.3);}
    const obs=new THREE.MeshPhysicalMaterial({color:0x140808,roughness:.28,metalness:.4,clearcoat:1,emissive:0xff2a10,emissiveMap:patternTex('cracks'),emissiveIntensity:.8});
    const hornGeo=cg('horn',()=>{const g=new THREE.ConeGeometry(.05,.44,24,18);g.translate(0,.22,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,p.getZ(i)-y*y*1.25);}g.computeVertexNormals();return g;});
    [-1,1].forEach(s=>{const hn=M(hornGeo,obs);hn.position.set(s*.11,.22,-.01);hn.rotation.set(-.15,0,s*-.6);head.add(hn);});
    visor.visible=false;
    const mask=M(cg('smask',()=>new THREE.SphereGeometry(.174,40,20,Math.PI*.1,Math.PI*.8,Math.PI*.28,Math.PI*.44)),obs);mask.position.y=.12;mask.scale.set(.98,1.1,1.06);head.add(mask);
    const eyeM=new THREE.MeshStandardMaterial({color:0xffc0a0,emissive:0xff3a1a,emissiveIntensity:4.5});
    [-1,1].forEach(s=>{const e=M(SG(.017,16,12),eyeM);e.scale.set(1.8,.65,1);e.position.set(s*.056,.15,.172);e.rotation.z=s*-.25;head.add(e);});
    const clawGeo=cg('claw',()=>{const g=new THREE.ConeGeometry(.012,.24,12,8);g.translate(0,-.12,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,p.getZ(i)+y*y*1.5);}g.computeVertexNormals();return g;});
    const clawM=new THREE.MeshStandardMaterial({color:0xff6a4a,emissive:0xff2a10,emissiveIntensity:2.2,roughness:.3});
    [lF,rF].forEach(f=>{for(let k=0;k<4;k++){const c=M(clawGeo,clawM);c.position.set((k-1.5)*.026,-.085,.03);c.rotation.x=-.45;f.add(c);}});
    [lS,rS].forEach((sh,i)=>{const s=i?-1:1;for(let k=0;k<3;k++){const c=M(cg('sspk',()=>new THREE.ConeGeometry(.032,.22,16)),obs);c.position.set(s*(.05+k*.035),.13-k*.025,-.02-k*.04);c.rotation.set(-.5,0,-s*(.4+k*.25));sh.add(c);}});
    const col=M(new THREE.CylinderGeometry(.12,.17,.14,32,1,true),obs);col.position.y=.08;neck.add(col);}
  if(HAS(h,'void')){
    const [sc2,sg2]=cv(256,512);sg2.fillStyle='#05060c';sg2.fillRect(0,0,256,512);for(let i=0;i<260;i++){const r=Math.random();sg2.fillStyle=`rgba(${200+r*55|0},${220+r*35|0},255,${.3+r*.7})`;sg2.fillRect(Math.random()*256,Math.random()*512,r<.9?1:2,r<.9?1:2);}
    const st=tex(sc2);const cm2=new THREE.MeshStandardMaterial({map:st,emissiveMap:st,emissive:0xffffff,emissiveIntensity:1.2,side:THREE.DoubleSide,roughness:.6});
    cloth=makeCloth(.72,1.45,6,16,cm2,.75);cloth.mesh.position.set(0,.64,-.21);spine.add(cloth.mesh);
    const ring=M(new THREE.TorusGeometry(.11,.014,10,48),glow);ring.position.set(0,.5,.235);spine.add(ring);
    const ring2=M(new THREE.TorusGeometry(.06,.01,10,40),glow);ring2.position.set(0,.5,.236);spine.add(ring2);
    const fm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{t:{value:0}},
      vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float t;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(vN.z),2.5);float g=step(.94,fract(vP.y*6.+t*.6))+step(.94,fract(atan(vP.z,vP.x)*3.82+t*.3));gl_FragColor=vec4(vec3(.55,.78,1.)*(f*1.4+g*.35),1.);}'});
    field=M(new THREE.SphereGeometry(1.15,48,32),fm);field.position.y=1.05;field.visible=false;root.add(field);}
  if(HAS(h,'hex')){cape(0x0a140c,.74,1.45,.75,.62,-.2);
    const hood=M(new THREE.SphereGeometry(.21,32,20,0,Math.PI*2,0,Math.PI*.62),cmat);hood.position.set(0,.13,-.03);hood.scale.set(1.08,1.15,1.15);head.add(hood);
    const sig=new THREE.Group();sig.add(M(new THREE.TorusGeometry(.32,.012,8,64),glow));sig.add(M(new THREE.TorusGeometry(.24,.008,8,6),glow));
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;const b=M(new THREE.BoxGeometry(.05,.012,.012),glow);b.position.set(Math.cos(a)*.28,Math.sin(a)*.28,0);b.rotation.z=a+.6;sig.add(b);}
    sig.position.set(0,.45,-.32);spine.add(sig);field=sig;
    [lE,rE].forEach(el=>{for(let k=0;k<2;k++){const r=M(new THREE.TorusGeometry(.068,.006,6,32),glow);r.rotation.x=Math.PI/2;r.position.y=-.06-k*.06;el.add(r);}});}
  if(HAS(h,'ronin')){cape(0x2a0a0c,.3,.9,.9,.12,-.16);
    sword=new THREE.Group();const steel=new THREE.MeshPhysicalMaterial({color:0xe8ecf2,metalness:1,roughness:.12,clearcoat:1});
    const bl=new THREE.Shape();bl.moveTo(-.018,0);bl.lineTo(.018,0);bl.lineTo(.016,.86);bl.quadraticCurveTo(.012,.96,-.018,1.0);bl.lineTo(-.018,0);
    const bg=new THREE.ExtrudeGeometry(bl,{depth:.006,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:2,curveSegments:12});bg.translate(0,0,-.005);
    const blade=M(bg,steel);blade.position.y=.06;sword.add(blade);
    const edge=M(new THREE.BoxGeometry(.004,.9,.004),glow);edge.position.set(.019,.5,0);sword.add(edge);
    const guard=M(new THREE.CylinderGeometry(.045,.045,.012,24),trim);guard.position.y=.055;sword.add(guard);
    const grip=M(new THREE.CylinderGeometry(.016,.016,.2,16),dark);grip.position.y=-.04;sword.add(grip);
    sword.rotation.x=Math.PI/2;sword.position.set(0,-.02,0);rF.add(sword);
    const sheath=M(new THREE.CylinderGeometry(.022,.018,.8,16),dark);sheath.rotation.set(.3,0,1.2);sheath.position.set(.26,-.05,-.05);hips.add(sheath);
    }
  const XR=mhaParts(h,{O,M,head,neck,spine,hips,lS,lE,lF,rS,rE,rF,lH,lK,rH,rK,suit,main,trim,glow,dark,cmat,cape,B,BX,sc});if(XR.orbiters)orbiters=XR.orbiters;
  // frozen-frame cage (STROBE)
  const frame=new THREE.Group();
  const fbox=M(cg('fbox',()=>new THREE.BoxGeometry(1.25,2.2,1.25)),addMat(0x9ffff0,.5,.35));fbox.position.y=1.1;frame.add(fbox);
  const edges=new THREE.LineSegments(cg('fedge',()=>new THREE.EdgesGeometry(new THREE.BoxGeometry(1.25,2.2,1.25))),new THREE.LineBasicMaterial({color:0xc8fff6,transparent:true}));edges.position.y=1.1;frame.add(edges);
  frame.visible=false;root.add(frame);
  root.scale.setScalar(h.scale);
  root.traverse(o=>{if(o.isMesh&&o!==fbox){o.castShadow=true;o.receiveShadow=true;}});
  let swordTip=null,hipY=null,moldPieces=null;if(h.gear&&h.gear.type!=='none'){const GR=attachGear(h,{rF,lF,sc});if(GR.sword!==undefined)sword=GR.sword;if(GR.whip)whip=GR.whip;if(GR.tip)swordTip=GR.tip;}
  if(h.mold&&typeof applyMold==='function'){const X={root,hips,spine,neck,head,lS,lE,lF,rS,rE,rF,lH,lK,rH,rK,suit,main,trim,glow,dark,visor,envT,envI:sc&&sc!==scene?.55:1,accent:h.accent};moldPieces=applyMold(h.mold,X);hipY=X.hipY;}
  return {root,hips,spine,head,neck,lS,lE,rS,rE,lH,lK,rH,rK,lF,rF,cloth,mats:[suit,main,trim],glow,whip,blades,beam,beast,spikes,wings,orbiters,frame,main,field,sword,flames,swordTip,hipY,moldPieces,ext:XR.ext||null};
}

/* ---- poses ---- */
const BASE={hy:0,hx:0,sx:0,sy:0,sz:0,hd:0,lSx:0,lSz:.12,lE:0,rSx:0,rSz:-.12,rE:0,lHx:0,lHz:.03,lK:.05,rHx:0,rHz:-.03,rK:.05};
const GUARD=Object.assign({},BASE,{hy:-.07,sx:.08,sy:-.25,hd:-.05,lSx:-1.1,lSz:.25,lE:-1.9,rSx:-.75,rSz:-.35,rE:-2.1,lHx:-.38,lHz:.08,lK:.5,rHx:.28,rHz:-.1,rK:.35});
const g_=o=>Object.assign({},GUARD,o), b_=o=>Object.assign({},BASE,o);
