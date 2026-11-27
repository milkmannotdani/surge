/* PROJECTILE FX — every projectile in the game (classic specials, ability-engine shots and volleys, bullets/marbles,
   Dread wisps) gets:
   • a glowing ribbon trail that tapers and fades behind it (in its own colours)
   • a soft pulsing glow halo around it
   • a muzzle flash where it leaves the fighter (ring, sparks, a flash of light)
   • an impact when it ends (spark spray, shock ring, a quick light, a small scorch on the ground when it lands low)
   Purely visual: no gameplay changes. */
const PJFX=[];const PFX_MAX=90;
let PFX_GLOWTEX=null;function pfxGlowTex(){if(PFX_GLOWTEX)return PFX_GLOWTEX;const [c,g]=cv(64,64);const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);PFX_GLOWTEX=new THREE.CanvasTexture(c);return PFX_GLOWTEX;}
const PFX_SPR={};function pfxSprMat(col){if(PFX_SPR[col])return PFX_SPR[col];const m=new THREE.SpriteMaterial({map:pfxGlowTex(),color:col,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.6});PFX_SPR[col]=m;return m;}
const PFX_TRAILMAT=new THREE.MeshBasicMaterial({vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide});
const PFX_N=16;
function pfxAdd(g,c1,c2,size,o){if(!g||g.userData.pfx||!nearCam(g.position,110))return;o=o||{};if(PJFX.length>=PFX_MAX){const old=PJFX.shift();pfxEnd(old,true);}
  g.userData.pfx=1;const col1=new THREE.Color(c1==null?0xffffff:c1),col2=new THREE.Color(c2==null?c1:c2);size=Math.max(.25,Math.min(2.2,size||.6));
  // glow halo
  const spr=new THREE.Sprite(pfxSprMat(c1==null?0xffffff:c1));spr.scale.setScalar(size*1.5);spr.userData.pfx=1;scene.add(spr);
  // ribbon trail (lives in the scene, follows the projectile's path)
  const geo=new THREE.BufferGeometry(),pos=new Float32Array(PFX_N*2*3),colA=new Float32Array(PFX_N*2*3),idx=[];
  for(let i=0;i<PFX_N-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}geo.setIndex(idx);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(colA,3));
  const tr=new THREE.Mesh(geo,PFX_TRAILMAT);tr.frustumCulled=false;scene.add(tr);
  const p0=g.getWorldPosition(new V3());spr.position.copy(p0);const hist=[];for(let i=0;i<PFX_N;i++)hist.push(p0.clone());
  const E={g,spr,tr,geo,hist,col1,col2,size,w:(o.w||.2)*size,t:0,last:p0.clone(),ph:Math.random()*6,ground:!!o.ground};PJFX.push(E);
  // muzzle flash
  if(!o.noFlash){ring(p0,c1,size*.9,.16,false,2.2);burst(ADD,p0,8,{colors:[c1,c2==null?0xffffff:c2,0xffffff],speed:5,life:.2,size:size*.35,size1:0,bright:2.4});if(typeof flashLight==='function'&&Math.random()<.5)flashLight(p0,c1,4);}
  return E;}
function pfxEnd(E,quiet){scene.remove(E.tr);E.geo.dispose();scene.remove(E.spr);
  if(quiet||!inMatch()||!nearCam(E.last,90))return;const p=E.last,c1=E.col1.getHex(),c2=E.col2.getHex();
  burst(ADD,p,14,{colors:[c1,c2,0xffffff],speed:7,life:.3,size:E.size*.35,size1:0,bright:2.4,grav:6});ring(p,c1,E.size*2.4,.22,false,2.2);
  if(p.y<1.2){ring(TMP2.set(p.x,floorAt(p.x,p.z,p.y+1)+.08,p.z).clone(),c1,E.size*3,.3,true,1.6);if(typeof scorch==='function'&&Math.random()<.5)scorch(p.x,p.z,E.size*1.4);}
  if(typeof flashLight==='function'&&Math.random()<.4)flashLight(p,c1,5);}
const _pfxCam=new V3(),_pfxD=new V3(),_pfxS=new V3();
onEv('tick',dt=>{if(!PJFX.length)return;camera.getWorldPosition(_pfxCam);
  for(let i=PJFX.length-1;i>=0;i--){const E=PJFX[i];E.t+=dt;
    if(!E.g.parent||!inMatch()){pfxEnd(E,!inMatch());PJFX.splice(i,1);continue;}
    const p=E.g.getWorldPosition(new V3());if(p.distanceToSquared(E.last)>2500){E.hist.forEach(h=>h.copy(p));}
    E.last.copy(p);E.hist.pop();E.hist.unshift(p.clone());
    E.spr.position.copy(p);E.spr.scale.setScalar(E.size*(1.4+Math.sin(E.t*30+E.ph)*.2));
    // rebuild the ribbon facing the camera
    const pos=E.geo.attributes.position.array,col=E.geo.attributes.color.array;
    for(let k=0;k<PFX_N;k++){const a=E.hist[k],b=E.hist[Math.min(PFX_N-1,k+1)],c=E.hist[Math.max(0,k-1)];_pfxD.subVectors(c,b);if(_pfxD.lengthSq()<1e-6)_pfxD.set(0,0,1);
      _pfxS.subVectors(_pfxCam,a);_pfxS.crossVectors(_pfxD,_pfxS).normalize();const u=k/(PFX_N-1),w=E.w*(1-u)*(1-u*.3);
      pos[k*6]=a.x+_pfxS.x*w;pos[k*6+1]=a.y+_pfxS.y*w;pos[k*6+2]=a.z+_pfxS.z*w;pos[k*6+3]=a.x-_pfxS.x*w;pos[k*6+4]=a.y-_pfxS.y*w;pos[k*6+5]=a.z-_pfxS.z*w;
      const f=(1-u)*(1-u)*.85,cr=E.col1.r*(1-u)+E.col2.r*u,cg2=E.col1.g*(1-u)+E.col2.g*u,cb=E.col1.b*(1-u)+E.col2.b*u;
      col[k*6]=col[k*6+3]=cr*f;col[k*6+1]=col[k*6+4]=cg2*f;col[k*6+2]=col[k*6+5]=cb*f;}
    E.geo.attributes.position.needsUpdate=true;E.geo.attributes.color.needsUpdate=true;}});
onEv('matchEnd',()=>{PJFX.forEach(E=>pfxEnd(E,true));PJFX.length=0;});
// colours for the classic projectile types
const PFX_COL={fireball:[0xff5a1f,0xffb347,1],feather:[0xff4f8b,0xffd0e0,.5],airburst:[0xcfe4ff,0xffffff,1.6],slashwave:[0xff6060,0xffffff,1],sigil:[0x5aff8a,0xd8ffe0,.8],
  bubble:[0xb58cff,0xf2e8ff,.8],meteor:[0xff8a3a,0xffd04a,1.2],blade:[0x1fb8ff,0x9af0ff,1],cyclone:[0xb57bff,0xf0ddff,1],siphon:[0x8a3cff,0xe0c8ff,.7]};
// hook every projectile system
const _pfxSpawn=spawnProj;spawnProj=function(f,type){const n0=projs.length;const r=_pfxSpawn.apply(this,arguments);if(projs.length>n0){const p=projs[projs.length-1];
    if(p&&p.mesh&&!p.ground&&!p.big){const C=PFX_COL[type]||[f&&f.hero?f.hero.accent:0xffffff,f&&f.hero?f.hero.color:0xffffff,.7];pfxAdd(p.mesh,C[0],C[1],C[2]);}}return r;};
if(typeof cabProj==='function'){const _pfxCab=cabProj;cabProj=function(f,A){const n0=CABP.length;const r=_pfxCab.apply(this,arguments);if(CABP.length>n0){const p=CABP[CABP.length-1];
    if(p&&p.g)pfxAdd(p.g,A.c1,A.c2,(A.size||1)*.6,{noFlash:p.pos.y>8});}return r;};}
if(typeof xShot==='function'){const _pfxX=xShot;xShot=function(f,o){const p=_pfxX.apply(this,arguments);if(p&&p.g)pfxAdd(p.g,o.col||(f&&f.hero?f.hero.accent:0xffffff),0xffffff,o.kind==='bullet'?(o.big?.7:.35):.6,{w:o.kind==='bullet'?.12:.2});return p;};}
