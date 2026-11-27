/* GORE TEXTURES — painted surfaces for everything fleshy and bony, so it reads as meat and bone instead of flat colour:
   • meat: muscle fibres running through it, marbled fat, darker clots, a wet sheen (gore chunks, torn-limb stumps,
     the Chimera's meat lumps and amalgamation mass, flesh weapons)
   • bone: porous ivory with growth streaks, stains and hairline cracks (bone spikes, ribs, plates, blades)
   • gut: glossy pink with a web of veins (gut ropes, flesh whips)
   • dead skin: blotchy, bruised, veined (the Rotten Chimera's corpse body)
   Each has a matching bump (normal) map. Torn limbs now show a raw stump with a bone end, on the limb and on the body. */
const GTX={};
function gtxCanvas(S){return cv(S,S);}
function gtxNoise(g,S,n,col,rmin,rmax,a){for(let i=0;i<n;i++){g.fillStyle=col(a);g.beginPath();g.arc(Math.random()*S,Math.random()*S,rmin+Math.random()*(rmax-rmin),0,7);g.fill();}}
function goreTex(kind){if(GTX[kind])return GTX[kind];const S=256,[c,g]=gtxCanvas(S),[hc,hg]=gtxCanvas(S);hg.fillStyle='#808080';hg.fillRect(0,0,S,S);
  const wave=(y0,amp,ph,fr)=>x=>y0+Math.sin(x/S*6.283*fr+ph)*amp;
  if(kind==='meat'){g.fillStyle='#7a141a';g.fillRect(0,0,S,S);
    // muscle fibres: long, slightly wavy strands of lighter and darker red
    for(let i=0;i<180;i++){const y0=Math.random()*S,f=wave(y0,rand(2,7),rand(0,6),rand(.5,1.5)),light=Math.random()<.5;g.strokeStyle=light?`rgba(${150+Math.random()*50|0},${20+Math.random()*25|0},${30+Math.random()*20|0},.55)`:`rgba(40,0,6,.5)`;
      g.lineWidth=rand(.6,2.2);g.beginPath();for(let x=-4;x<=S+4;x+=8)x<0?g.moveTo(x,f(x)):g.lineTo(x,f(x));g.stroke();
      hg.strokeStyle=light?'rgba(190,190,190,.5)':'rgba(70,70,70,.5)';hg.lineWidth=g.lineWidth;hg.beginPath();for(let x=-4;x<=S+4;x+=8)x<0?hg.moveTo(x,f(x)):hg.lineTo(x,f(x));hg.stroke();}
    // marbled fat
    for(let i=0;i<14;i++){const y0=Math.random()*S,f=wave(y0,rand(3,9),rand(0,6),rand(.6,1.4));g.strokeStyle=`rgba(232,${200+Math.random()*30|0},${180+Math.random()*30|0},${rand(.35,.7)})`;g.lineWidth=rand(1.5,5);
      g.beginPath();const x0=Math.random()*S,L=rand(40,160);for(let x=x0;x<=x0+L;x+=6)x===x0?g.moveTo(x,f(x)):g.lineTo(x,f(x));g.stroke();hg.strokeStyle='rgba(200,200,200,.6)';hg.lineWidth=g.lineWidth;hg.beginPath();for(let x=x0;x<=x0+L;x+=6)x===x0?hg.moveTo(x,f(x)):hg.lineTo(x,f(x));hg.stroke();}
    gtxNoise(g,S,40,a=>`rgba(${210+Math.random()*30|0},${170+Math.random()*30|0},${150+Math.random()*30|0},${a})`,1.5,5,.45);   // fat specks
    gtxNoise(g,S,60,a=>`rgba(30,0,4,${a})`,1,4,.5);                                                                                // clots
    gtxNoise(g,S,30,a=>`rgba(${200+Math.random()*40|0},40,50,${a})`,2,6,.25);                                                     // fresh blood sheen
  }else if(kind==='bone'){g.fillStyle='#e6dcc4';g.fillRect(0,0,S,S);
    for(let i=0;i<70;i++){const x0=Math.random()*S;g.strokeStyle=`rgba(${190+Math.random()*30|0},${170+Math.random()*30|0},${130+Math.random()*30|0},.35)`;g.lineWidth=rand(1,4);g.beginPath();g.moveTo(x0,0);g.bezierCurveTo(x0+rand(-10,10),S*.3,x0+rand(-10,10),S*.7,x0+rand(-8,8),S);g.stroke();}
    gtxNoise(g,S,500,a=>`rgba(${120+Math.random()*50|0},${100+Math.random()*40|0},${70+Math.random()*30|0},${a})`,.5,1.6,.55);   // pores
    gtxNoise(hg,S,500,a=>`rgba(60,60,60,${a})`,.5,1.6,.7);
    gtxNoise(g,S,10,a=>`rgba(170,140,80,${a})`,8,26,.18);                                                                            // stains
    g.strokeStyle='rgba(70,55,40,.7)';hg.strokeStyle='rgba(40,40,40,.9)';for(let i=0;i<7;i++){let x=Math.random()*S,y=Math.random()*S;g.lineWidth=hg.lineWidth=rand(.6,1.3);g.beginPath();hg.beginPath();g.moveTo(x,y);hg.moveTo(x,y);
      for(let k=0;k<6;k++){x+=rand(-14,14);y+=rand(4,16);g.lineTo(x,y);hg.lineTo(x,y);}g.stroke();hg.stroke();}
  }else if(kind==='gut'){g.fillStyle='#c07074';g.fillRect(0,0,S,S);gtxNoise(g,S,90,a=>`rgba(${200+Math.random()*40|0},${120+Math.random()*40|0},${120+Math.random()*30|0},${a})`,6,20,.25);
    const vein=(x,y,a,w,n)=>{if(n<=0||w<.3)return;const L=rand(10,26),x2=x+Math.cos(a)*L,y2=y+Math.sin(a)*L;g.strokeStyle=`rgba(${90+Math.random()*30|0},10,${40+Math.random()*30|0},.7)`;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+.7)*L*.5,y+Math.sin(a+.7)*L*.5,x2,y2);g.stroke();
      hg.strokeStyle='rgba(180,180,180,.6)';hg.lineWidth=w;hg.beginPath();hg.moveTo(x,y);hg.lineTo(x2,y2);hg.stroke();vein(x2,y2,a+rand(-.6,.6),w*.82,n-1);if(Math.random()<.45)vein(x2,y2,a+rand(.7,1.3)*(Math.random()<.5?1:-1),w*.6,n-2);};
    for(let i=0;i<12;i++)vein(Math.random()*S,Math.random()*S,rand(0,6.28),2.4,7);
    for(let y=0;y<S;y+=22){hg.strokeStyle='rgba(60,60,60,.5)';hg.lineWidth=5;hg.beginPath();hg.moveTo(0,y);hg.lineTo(S,y+rand(-6,6));hg.stroke();}   // segment folds
  }else{// dead skin
    g.fillStyle='#7a8064';g.fillRect(0,0,S,S);gtxNoise(g,S,70,a=>`rgba(${90+Math.random()*30|0},${70+Math.random()*30|0},${90+Math.random()*30|0},${a})`,10,34,.22);   // bruises
    gtxNoise(g,S,60,a=>`rgba(${120+Math.random()*30|0},${130+Math.random()*30|0},${80+Math.random()*20|0},${a})`,8,28,.2);                                           // rot patches
    gtxNoise(g,S,40,a=>`rgba(60,20,24,${a})`,1,3,.6);gtxNoise(hg,S,300,a=>`rgba(${100+Math.random()*60|0},${100+Math.random()*60|0},${100+Math.random()*60|0},${a})`,1,4,.4);
    const vein=(x,y,a,w,n)=>{if(n<=0||w<.3)return;const L=rand(12,30),x2=x+Math.cos(a)*L,y2=y+Math.sin(a)*L;g.strokeStyle='rgba(60,40,80,.5)';g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();vein(x2,y2,a+rand(-.6,.6),w*.8,n-1);};
    for(let i=0;i<8;i++)vein(Math.random()*S,Math.random()*S,rand(0,6.28),1.8,6);}
  const map=tex(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;const nrm=normalFromHeight(hc,kind==='bone'?1.4:2.2);nrm.wrapS=nrm.wrapT=THREE.RepeatWrapping;
  GTX[kind]={map,nrm};return GTX[kind];}
// apply a gore surface to a material (keeps its colour as a tint)
function goreSurface(m,kind,o){if(!m||m.userData.gtx===kind)return m;const T=goreTex(kind);o=o||{};m.map=T.map;m.normalMap=T.nrm;m.normalScale=new THREE.Vector2(o.n||.8,o.n||.8);
  if(o.tint!==false&&m.color)m.color.setHex(o.tint||0xffffff);if(o.rough!=null)m.roughness=o.rough;m.userData.gtx=kind;m.needsUpdate=true;return m;}
// everything fleshy and bony that already exists
(function(){const S=(m,k,o)=>{try{goreSurface(m,k,o);}catch(e){}};
  if(typeof GORE_CHUNK!=='undefined')S(GORE_CHUNK,'meat',{rough:.3});
  if(typeof CHI_MEAT!=='undefined'){S(CHI_MEAT,'meat',{rough:.3});S(CHI_MEAT2,'meat',{tint:0xffd8d0,rough:.4});S(CHI_BONE,'bone',{rough:.55,n:.6});S(GUT_MAT,'gut',{rough:.22});}
  if(typeof LUMP_A!=='undefined'){S(LUMP_A,'meat',{rough:.25});S(LUMP_B,'meat',{tint:0xffe0c8,rough:.4});}
  if(typeof BLOB_MATS!=='undefined'){S(BLOB_MATS.flesh,'meat',{tint:false,rough:.3,n:1});const bm=BLOB_MATS.flesh;bm.map=bm.map.clone();bm.map.needsUpdate=true;bm.map.repeat.set(3,3);bm.normalMap=bm.normalMap.clone();bm.normalMap.needsUpdate=true;bm.normalMap.repeat.set(3,3);S(BLOB_MATS.tooth,'bone',{rough:.4,n:.4});S(BLOB_MATS.tongue,'gut',{tint:0xffb0b0,rough:.2});S(BLOB_MATS.lip,'gut',{tint:0xd08080,rough:.25});}
  if(typeof STAIN_MAT!=='undefined')S(STAIN_MAT,'meat',{tint:0x8a2020,rough:.2});})();
// flesh weapons built per fighter (Marrow's whips and blades; costume bone plates) — patch materials as rigs are built
const _gtxBR=buildRig;buildRig=function(h){const R=_gtxBR.apply(this,arguments);try{
    if(R.whip&&R.whip.segs)R.whip.segs.forEach(s=>{if(s.material&&!s.material.userData.gtx)goreSurface(s.material,'gut',{tint:0xd06070,rough:.2});});
    if(R.blades)R.blades.forEach(b=>{if(b.material&&!b.material.userData.gtx)goreSurface(b.material,'bone',{tint:0xffe8e0,rough:.45,n:.6});});
    if(R.whip&&R.whip.tip&&R.whip.tip.material)goreSurface(R.whip.tip.material,'bone',{rough:.5});
    R.root.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m=o.material;if(m.userData.gtx)return;
      if(m.color&&m.color.getHex()===0xf0e6d6&&m.isMeshStandardMaterial)goreSurface(m,'bone',{rough:.5});});
    if(h&&h.id==='chimera')R.root.traverse(o=>{if(!o.isMesh||!o.material||!o.material.isMeshStandardMaterial||o.material.userData.gtx||o.material===CHI_BONE)return;const m=o.material,c=m.color;
      if(c&&Math.abs(c.r-c.g)<.12&&c.g>c.b&&!m.map&&!m.transparent&&o.geometry&&(o.geometry.type==='LatheGeometry'||o.geometry.type==='SphereGeometry')){const tint=c.clone();goreSurface(m,'skin',{tint:false,n:.6});m.color.copy(tint).multiplyScalar(1.6);}});
  }catch(e){console.warn('goretex',e);}return R;};
// costume bone pieces (Marrow's shoulder plates, rib straps)
if(typeof COS_KIND!=='undefined'){const _cm=cosCtx;cosCtx=function(R,h){const G=_cm.apply(this,arguments);const mat=G.mat;G.mat=(kind,col,o)=>{const m=mat(kind,col,o);if(kind==='bone'&&!m.userData.gtx)goreSurface(m,'bone',{tint:false,rough:.55,n:.6});return m;};return G;};}

/* ---------- raw stumps where limbs are torn off ---------- */
const STUMP_MEAT=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.25,clearcoat:.8,clearcoatRoughness:.2}),STUMP_BONE=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5});
setTimeout(()=>{try{goreSurface(STUMP_MEAT,'meat',{rough:.25});goreSurface(STUMP_BONE,'bone',{rough:.5});}catch(e){}},0);
const STUMP_G=new THREE.SphereGeometry(.075,14,10),STUMP_BG=new THREE.CylinderGeometry(.022,.026,.07,10);
function stumpOn(par,pos,big){const g=new THREE.Group();g.position.copy(pos);const m=new THREE.Mesh(STUMP_G,STUMP_MEAT);m.scale.set(1,big?.7:.55,1).multiplyScalar(big?1.25:1);g.add(m);
  const b=new THREE.Mesh(STUMP_BG,STUMP_BONE);b.position.y=.025;g.add(b);par.add(g);return g;}
if(typeof tearLimb==='function'){const _gtxTear=tearLimb;tearLimb=function(f,away,key){const R=f&&f.rig,part=R&&R[key];const was=part&&part.visible;const n0=typeof GORE!=='undefined'?GORE.limbs.length:0;
    const r=_gtxTear.apply(this,arguments);
    if(was&&part&&!part.visible&&typeof GORE!=='undefined'&&GORE.limbs.length>n0){const L=GORE.limbs[GORE.limbs.length-1];
      // the torn-off limb: raw meat and a bone end where it came away
      try{const s=stumpOn(L.m,new V3(0,0,0),key==='head');if(key==='head')s.rotation.x=Math.PI;}catch(e){}
      // and the stump left on the body
      try{if(part.parent){const s=stumpOn(part.parent,part.position.clone(),key==='head');if(key!=='head')s.rotation.x=Math.PI;(f._goreStumps=f._goreStumps||[]).push(s);}}catch(e){}}
    return r;};}
const _gtxReset=Fighter.prototype.reset;Fighter.prototype.reset=function(){if(this._goreStumps){this._goreStumps.forEach(s=>{if(s.parent)s.parent.remove(s);});this._goreStumps=null;}return _gtxReset.apply(this,arguments);};
