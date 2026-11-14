/* Mold editor */
/* ================= MOLD: sculpt a created fighter's body and armor =================
   Body proportions, base (armored or bare body), layer colors, and any number of armor pieces:
   each piece is a shape attached to a body part with its own position, rotation, size, material and color. */
const MOLD_BONES={head:'Head',chest:'Chest / back',hips:'Hips',uarmL:'Upper arm L',uarmR:'Upper arm R',farmL:'Forearm L',farmR:'Forearm R',handL:'Hand L',handR:'Hand R',thighL:'Thigh L',thighR:'Thigh R',shinL:'Shin L',shinR:'Shin R'};
const MOLD_BONEMAP={head:'head',chest:'spine',hips:'hips',uarmL:'lS',uarmR:'rS',farmL:'lE',farmR:'rE',handL:'lF',handR:'rF',thighL:'lH',thighR:'rH',shinL:'lK',shinR:'rK'};
const MOLD_MIRROR={uarmL:'uarmR',uarmR:'uarmL',farmL:'farmR',farmR:'farmL',handL:'handR',handR:'handL',thighL:'thighR',thighR:'thighL',shinL:'shinR',shinR:'shinL'};
const MOLD_SHAPES={plate:'Plate',box:'Block',sphere:'Ball',dome:'Dome',cyl:'Tube',cone:'Cone',spike:'Spike',horn:'Horn',ring:'Ring',halo:'Halo',crystal:'Crystal',wedge:'Wedge',wing:'Wing',fin:'Fin',blade:'Blade',disc:'Disc',visor:'Visor band',star:'Star'};
const MOLD_MATS={metal:'Metal',gloss:'Glossy',matte:'Matte',suit:'Fabric',glow:'Glow',glass:'Glass',dark:'Dark metal'};
const MOLD_BODY={hgt:['Height',.8,1.25],head:['Head',.7,1.5],neck:['Neck',.6,1.8],shw:['Shoulder width',.75,1.45],chw:['Chest width',.7,1.5],chd:['Chest depth',.7,1.6],tor:['Torso length',.8,1.3],
  wai:['Waist / hips',.7,1.5],arl:['Arm length',.75,1.35],art:['Arm thickness',.6,1.9],hnd:['Hands',.6,1.8],lgl:['Leg length',.75,1.3],lgt:['Leg thickness',.6,1.9],ft:['Feet',.6,1.7]};
function moldDefault(){const b={};for(const k in MOLD_BODY)b[k]=1;return {v:1,plain:false,visor:true,body:b,cols:{},parts:[]};}
function sanitizeMold(m){if(!m||typeof m!=='object')return null;const o=moldDefault();o.plain=!!m.plain;o.visor=m.visor!==false;
  for(const k in MOLD_BODY){const n=+((m.body||{})[k]);if(isFinite(n))o.body[k]=clamp(n,MOLD_BODY[k][1],MOLD_BODY[k][2]);}
  ['suit','main','trim','glow'].forEach(k=>{const c=(m.cols||{})[k];if(c!=null&&isFinite(+c))o.cols[k]=(+c>>>0)&0xffffff;});
  const num=(v,lo,hi,d)=>{const n=+v;return isFinite(n)?clamp(n,lo,hi):d;};
  o.parts=(Array.isArray(m.parts)?m.parts:[]).slice(0,80).map(p=>p&&typeof p==='object'?{b:MOLD_BONES[p.b]?p.b:'chest',s:MOLD_SHAPES[p.s]?p.s:'plate',m:MOLD_MATS[p.m]?p.m:'metal',c:isFinite(+p.c)?(+p.c>>>0)&0xffffff:0xc8ccd8,
    p:[0,1,2].map(i=>num((p.p||[])[i],-.8,.8,0)),r:[0,1,2].map(i=>num((p.r||[])[i],-180,180,0)),k:[0,1,2].map(i=>num((p.k||[])[i],.01,1.6,.2)),mi:!!p.mi}:null).filter(Boolean);
  return o;}
/* unit-sized shapes, centered */
function moldGeo(s){return cg('mold_'+s,()=>{switch(s){
  case 'plate':return THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(1,1,1,4,.18):new THREE.BoxGeometry(1,1,1);
  case 'box':return new THREE.BoxGeometry(1,1,1);case 'sphere':return new THREE.SphereGeometry(.5,32,24);
  case 'dome':return new THREE.SphereGeometry(.5,32,16,0,Math.PI*2,0,Math.PI/2);case 'cyl':return new THREE.CylinderGeometry(.5,.5,1,32);
  case 'cone':return new THREE.ConeGeometry(.5,1,32);case 'spike':{const q=new THREE.ConeGeometry(.22,1,16);q.translate(0,.5,0);return q;}
  case 'horn':{const q=new THREE.ConeGeometry(.22,1,16,16);q.translate(0,.5,0);const a=q.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i);a.setZ(i,a.getZ(i)-y*y*.55);}q.computeVertexNormals();return q;}
  case 'ring':{const q=new THREE.TorusGeometry(.42,.08,14,48);q.rotateX(Math.PI/2);return q;}case 'halo':{const q=new THREE.TorusGeometry(.45,.03,10,64);q.rotateX(Math.PI/2);return q;}
  case 'crystal':{const q=new THREE.OctahedronGeometry(.5,0);q.scale(.7,1,.7);return q;}case 'wedge':{const q=new THREE.CylinderGeometry(.5,.5,1,3);q.rotateZ(Math.PI/2);return q;}
  case 'wing':{const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.3,.5,.75,.6,1,.55);sh.lineTo(.85,.35);sh.lineTo(.92,.22);sh.lineTo(.7,.12);sh.lineTo(.75,0);sh.lineTo(.5,-.06);sh.bezierCurveTo(.3,-.1,.1,-.08,0,0);
    const q=new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:16});q.translate(0,0,-.02);return q;}
  case 'fin':{const sh=new THREE.Shape();sh.moveTo(-.5,0);sh.lineTo(.5,0);sh.quadraticCurveTo(.1,.4,-.2,1);sh.lineTo(-.5,0);const q=new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1});q.translate(0,0,-.025);return q;}
  case 'blade':{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.12,.15);sh.lineTo(0,1);sh.lineTo(-.12,.15);sh.lineTo(0,0);const q=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:1});q.translate(0,0,-.015);return q;}
  case 'disc':return new THREE.CylinderGeometry(.5,.5,.08,40);
  case 'visor':return new THREE.SphereGeometry(.5,40,12,Math.PI*.1,Math.PI*.8,Math.PI*.4,Math.PI*.2);
  case 'star':{const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.22:.5;i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const q=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2});q.translate(0,0,-.06);return q;}}
  return new THREE.BoxGeometry(1,1,1);});}
function moldMat(kind,col,X,cache){const key=kind+'_'+col;if(cache[key])return cache[key];let m;
  if(kind==='metal')m=new THREE.MeshPhysicalMaterial({color:col,metalness:.92,roughness:.22,clearcoat:1,clearcoatRoughness:.15});
  else if(kind==='gloss')m=new THREE.MeshPhysicalMaterial({color:col,metalness:.2,roughness:.18,clearcoat:1});
  else if(kind==='matte')m=new THREE.MeshStandardMaterial({color:col,roughness:.85,metalness:.05});
  else if(kind==='suit'){m=new THREE.MeshPhysicalMaterial({color:col,roughness:.62,metalness:.2});if(X.suit.normalMap){m.normalMap=X.suit.normalMap;m.normalScale=X.suit.normalScale;}}
  else if(kind==='glow')m=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2.4,roughness:.3});
  else if(kind==='glass')m=new THREE.MeshPhysicalMaterial({color:col,metalness:.1,roughness:.05,clearcoat:1,transparent:true,opacity:.5,emissive:col,emissiveIntensity:.25});
  else m=new THREE.MeshPhysicalMaterial({color:col,metalness:.6,roughness:.4,clearcoat:.4});
  if(X.envT&&kind!=='glow'){m.envMap=X.envT;m.envMapIntensity=X.envI;}if(kind!=='glow'&&kind!=='glass')enhanceMat(m,X.accent,.45);cache[key]=m;return m;}
function scaleKids(node,sx,sy,sz){node.children.forEach(c=>{c.position.x*=sx;c.position.y*=sy;c.position.z*=sz;if(c.isMesh){c.scale.x*=sx;c.scale.y*=sy;c.scale.z*=sz;}});}
function moldPiece(p,bone,X,cache,mirror){const mesh=new THREE.Mesh(moldGeo(p.s),moldMat(p.m,p.c,X,cache));const sx=mirror?-1:1;
  mesh.position.set(p.p[0]*sx,p.p[1],p.p[2]);mesh.rotation.set(p.r[0]*Math.PI/180,p.r[1]*Math.PI/180*sx,p.r[2]*Math.PI/180*sx);mesh.scale.set(p.k[0]*sx,p.k[1],p.k[2]);
  mesh.castShadow=true;bone.add(mesh);return mesh;}
/* called at the end of buildRig for created fighters */
function applyMold(m,X){const B=m.body,R=X;
  // proportions: scale the meshes and joint offsets under each joint (never the joints themselves, so bending stays clean)
  scaleKids(R.spine,B.chw,B.tor,B.chd);R.lS.position.x*=B.shw;R.rS.position.x*=B.shw;
  scaleKids(R.neck,1,B.neck,1);R.head.scale.setScalar(B.head);
  scaleKids(R.hips,B.wai,1,B.wai);R.spine.position.x=0;
  [R.lS,R.rS].forEach(s=>scaleKids(s,B.art,B.arl,B.art));[R.lE,R.rE].forEach(e=>scaleKids(e,B.art,B.arl,B.art));[R.lF,R.rF].forEach(f=>f.scale.setScalar(B.hnd));
  [R.lH,R.rH].forEach(h=>scaleKids(h,B.lgt,B.lgl,B.lgt));
  const feet=[GC.boot,GC.toe,GC.sole];[R.lK,R.rK].forEach(k=>{scaleKids(k,B.lgt,B.lgl,B.lgt);k.children.forEach(c=>{if(c.isMesh&&feet.indexOf(c.geometry)>=0){c.scale.x*=B.ft/B.lgt;c.scale.z*=B.ft/B.lgt;c.scale.y*=1/B.lgl;}});});
  R.hipY=.95*B.lgl;R.hips.position.y=R.hipY;R.root.scale.multiplyScalar(B.hgt);
  // layer colors
  if(m.cols.suit!=null)X.suit.color.setHex(m.cols.suit);if(m.cols.main!=null)X.main.color.setHex(m.cols.main);if(m.cols.trim!=null)X.trim.color.setHex(m.cols.trim);
  if(m.cols.glow!=null){X.glow.color.setHex(m.cols.glow);X.glow.emissive.setHex(m.cols.glow);if(X.visor){X.visor.material.color.setHex(m.cols.glow);X.visor.material.emissive.setHex(m.cols.glow);}}
  // bare body: strip the built-in armor and trim
  if(m.plain){const hide=[GC.pad,GC.padR,GC.gaunt,GC.ring,GC.kp,GC.cuff,GC.belt,GC.buck,GC.emb,GC.embR,GC.strip,GC.earR,GC.ear,GC.plate];
    R.root.traverse(o=>{if(!o.isMesh||o.userData.moldPiece)return;if(hide.indexOf(o.geometry)>=0||o.material===X.trim||(o.material===X.glow&&o!==X.visor))o.visible=false;
      if(o.parent===R.spine&&o.material===X.main)o.visible=false;});
    if(m.cols.main==null){X.main.color.copy(X.suit.color);}X.main.emissiveMap=null;X.main.emissiveIntensity=0;X.main.normalMap=X.suit.normalMap;X.main.needsUpdate=true;}
  if(X.visor)X.visor.visible=m.visor!==false;
  // armor pieces
  const cache={},pieces=[];m.parts.forEach((p,i)=>{const bone=R[MOLD_BONEMAP[p.b]];if(!bone)return;const a=moldPiece(p,bone,X,cache,false);a.userData.moldPiece=i+1;pieces.push(a);
    if(p.mi){const ob=MOLD_MIRROR[p.b],b2=ob?R[MOLD_BONEMAP[ob]]:bone;const b=moldPiece(p,b2,X,cache,true);b.userData.moldPiece=i+1;b.userData.mirror=1;pieces.push(b);}});
  return pieces;}
/* ---- presets: starting points to build on ---- */
const MP=(b,s,m,c,p,r,k,mi)=>({b,s,m,c,p,r,k,mi:!!mi});
const MOLD_PRESETS={
  KNIGHT:a=>[MP('chest','plate','metal',a.m,[0,.36,.12],[-8,0,0],[.44,.4,.2]),MP('chest','plate','metal',a.m,[0,.38,-.1],[8,0,0],[.42,.42,.16]),MP('uarmL','dome','metal',a.m,[0,.03,0],[0,0,-14],[.3,.24,.3],1),
    MP('head','dome','metal',a.m,[0,.13,0],[0,0,0],[.39,.42,.4]),MP('head','box','glow',a.g,[0,.11,.17],[0,0,0],[.22,.025,.04]),MP('farmL','cyl','metal',a.m,[0,-.14,0],[0,0,0],[.15,.2,.15],1),
    MP('shinL','cyl','metal',a.m,[0,-.18,.01],[0,0,0],[.17,.28,.17],1),MP('hips','plate','metal',a.m,[.12,-.12,.05],[0,0,10],[.15,.2,.22],1),MP('head','fin','glow',a.g,[0,.3,-.02],[0,90,0],[.04,.18,.3])],
  SAMURAI:a=>[MP('head','dome','gloss',a.m,[0,.14,0],[0,0,0],[.4,.4,.42]),MP('head','horn','metal',a.g,[.08,.24,.08],[-20,0,-25],[.07,.22,.07],0),MP('head','horn','metal',a.g,[-.08,.24,.08],[-20,0,25],[.07,.22,.07],0),
    MP('uarmL','plate','gloss',a.m,[.08,-.04,0],[0,0,-25],[.08,.22,.24],1),MP('uarmL','plate','gloss',a.m,[.11,-.12,0],[0,0,-25],[.08,.2,.24],1),MP('chest','plate','gloss',a.m,[0,.3,.1],[0,0,0],[.42,.36,.24]),
    MP('hips','plate','gloss',a.m,[.1,-.16,.08],[-10,0,8],[.16,.26,.06],1),MP('hips','plate','gloss',a.m,[0,-.16,.12],[-10,0,0],[.16,.26,.06])],
  MECH:a=>[MP('chest','box','metal',a.m,[0,.38,.06],[0,0,0],[.5,.42,.38]),MP('chest','cyl','dark',0x2a2a34,[.12,.42,-.24],[90,0,0],[.12,.2,.12],1),MP('chest','disc','glow',a.g,[.12,.42,-.34],[90,0,0],[.1,1,.1],1),
    MP('uarmL','box','metal',a.m,[.04,0,0],[0,0,0],[.3,.24,.28],1),MP('head','box','metal',a.m,[0,.13,0],[0,0,0],[.34,.3,.36]),MP('head','box','glow',a.g,[0,.13,.18],[0,0,0],[.26,.06,.03]),
    MP('head','spike','metal',a.m,[.12,.28,-.05],[0,0,-10],[.05,.25,.05]),MP('shinL','box','metal',a.m,[0,-.2,.03],[0,0,0],[.18,.32,.2],1),MP('farmL','box','metal',a.m,[0,-.12,0],[0,0,0],[.17,.26,.17],1)],
  DEMON:a=>[MP('head','horn','dark',0x1a1218,[.1,.2,0],[-15,0,-35],[.09,.32,.09],1),MP('uarmL','spike','dark',0x1a1218,[.06,.08,0],[0,0,-40],[.06,.22,.06],1),MP('uarmL','spike','dark',0x1a1218,[.02,.1,-.05],[-25,0,-20],[.05,.18,.05],1),
    MP('chest','wing','dark',0x2a0a10,[.08,.45,-.16],[0,-30,0],[.75,.7,.7],1),MP('chest','crystal','glow',a.g,[0,.42,.2],[0,0,0],[.08,.12,.08]),MP('head','box','glow',a.g,[0,.12,.17],[0,0,0],[.2,.03,.03])],
  ANGEL:a=>[MP('head','halo','glow',0xffe08a,[0,.42,-.04],[10,0,0],[.36,.36,.36]),MP('chest','wing','gloss',0xf4f6ff,[.08,.45,-.16],[0,-30,10],[.85,.8,.8],1),MP('chest','crystal','glow',a.g,[0,.42,.2],[0,0,0],[.09,.14,.09]),
    MP('uarmL','dome','gloss',0xf4f6ff,[0,.03,0],[0,0,-14],[.28,.2,.28],1),MP('hips','plate','gloss',0xf4f6ff,[0,-.2,.08],[-8,0,0],[.36,.3,.08])],
  BRUTE:a=>[MP('uarmL','sphere','metal',a.m,[.03,.04,0],[0,0,0],[.36,.32,.36],1),MP('chest','box','matte',0x5a3a2a,[0,.3,.0],[0,0,32],[.08,.8,.42]),MP('farmL','cyl','metal',a.m,[0,-.16,0],[0,0,0],[.2,.24,.2],1),
    MP('chest','spike','metal',a.m,[.14,.5,-.18],[-40,0,-10],[.06,.2,.06],1),MP('hips','ring','metal',a.m,[0,.05,0],[0,0,0],[.5,.5,.5])]};
/* ================= the editor ================= */
const MD={open:false,m:null,undo:[],sel:-1,R:null,pieces:[],yaw:.3,pitch:.15,dist:5.2,tgt:new V3(0,1,0),pose:'idle',dirty:0,box:null,raf:0,cvsHome:null,tab:'body'};
function moldHero(){const s=Object.assign({},CR.spec,{mold:MD.m});return customHero(s,true);}
function moldRebuild(){if(!PV.r||!MD.open)return;if(MD.R){PV.scene.remove(MD.R.root);MD.R.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.dispose&&!o.material._keep)o.material.dispose();});if(MD.R.whip)PV.scene.remove(MD.R.whip.group);}
  const h=moldHero();const R=buildRig(h,PV.scene);PV.scene.add(R.root);MD.R=R;MD.pieces=R.moldPieces||[];Object.values(PV.rigs).forEach(r=>r.root.visible=false);PV.ped.visible=true;moldSelBox();}
function moldPush(){MD.undo.push(JSON.stringify(MD.m));if(MD.undo.length>60)MD.undo.shift();}
function moldChanged(full){MD.dirty=full?2:Math.max(MD.dirty,1);}
function moldSelBox(){if(MD.box){PV.scene.remove(MD.box);MD.box=null;}const ms=MD.pieces.filter(x=>x.userData.moldPiece===MD.sel+1);if(!ms.length)return;MD.box=new THREE.Group();
  ms.forEach(x=>{const b=new THREE.BoxHelper(x,0xffd23f);b.userData.of=x;MD.box.add(b);});PV.scene.add(MD.box);}
function moldTPose(){const P=Object.assign({},POSES.showcase);Object.assign(P,{lSx:0,lSz:1.45,rSx:0,rSz:-1.45,lE:0,rE:0,lHx:0,rHx:0,lHz:.12,rHz:-.12,lK:0,rK:0,sx:0,sy:0,sz:0,hd:0,hx:0,hy:0});return P;}
function moldLoop(){if(!MD.open)return;MD.raf=requestAnimationFrame(moldLoop);const cvs=$('pv'),w=cvs.clientWidth,h=cvs.clientHeight;if(!w||!h)return;
  if(cvs.width!==Math.floor(w*PV.r.getPixelRatio())||cvs.height!==Math.floor(h*PV.r.getPixelRatio()))PV.r.setSize(w,h,false);
  if(MD.dirty){MD.dirty=0;moldRebuild();}PV.ped.visible=true;
  const R=MD.R;if(R){const P=MD.pose==='t'?moldTPose():MD.pose==='act'?POSES.heavyh||POSES.showcase:POSES.showcase;poseRig(R,P,game.time);R.hips.position.y=(R.hipY||.95)+(P.hy||0);R.root.rotation.y=0;}
  if(MD.box)MD.box.children.forEach(b=>b.update());
  const c=PV.cam;c.aspect=w/h;c.fov=34;c.updateProjectionMatrix();c.position.set(MD.tgt.x+Math.sin(MD.yaw)*Math.cos(MD.pitch)*MD.dist,MD.tgt.y+Math.sin(MD.pitch)*MD.dist,MD.tgt.z+Math.cos(MD.yaw)*Math.cos(MD.pitch)*MD.dist);c.lookAt(MD.tgt);PV.r.render(PV.scene,c);}
function openMold(){if(!CR.spec){const txt=$('crText').value.trim()||'A hero.';CR.spec=parseFighter($('crName').value,txt);renderCreator();}
  MD.m=sanitizeMold(CR.spec.mold)||moldDefault();MD.undo=[];MD.sel=-1;MD.open=true;MD.tab='body';MD.pose='idle';MD.cvsHome=$('pv').parentNode;$('mdView').appendChild($('pv'));
  showScreen('mold');moldRebuild();renderMoldUI();moldLoop();}
function closeMold(save){MD.open=false;cancelAnimationFrame(MD.raf);if(MD.R){PV.scene.remove(MD.R.root);if(MD.R.whip)PV.scene.remove(MD.R.whip.group);MD.R=null;}if(MD.box){PV.scene.remove(MD.box);MD.box=null;}
  MD.cvsHome.insertBefore($('pv'),MD.cvsHome.firstChild);PV.ped.visible=true;if(save){CR.spec.mold=sanitizeMold(MD.m);CR.spec=sanitizeSpec(CR.spec);}showScreen('creator');renderCreator();}
/* panel */
function mdSlider(label,val,lo,hi,step,on,key){return `<label class="mdsl"><span>${label}</span><input type="range" min="${lo}" max="${hi}" step="${step}" value="${val}" data-k="${key}"><b>${(+val).toFixed(step<1?2:0)}</b></label>`;}
function mdSel(key,opts,val){return `<select data-k="${key}">${Object.keys(opts).map(k=>`<option value="${k}"${k===val?' selected':''}>${opts[k]}</option>`).join('')}</select>`;}
function renderMoldUI(){const m=MD.m,el=$('mdPanel');document.querySelectorAll('#mdTabs span').forEach(s=>s.classList.toggle('sel',s.dataset.t===MD.tab));let h='';
  if(MD.tab==='body'){h+=`<div class="mdrow"><span class="chip${!m.plain?' sel':''}" data-act="armored">ARMORED BASE</span><span class="chip${m.plain?' sel':''}" data-act="plain">BARE BODY</span><span class="chip${m.visor?' sel':''}" data-act="visor">VISOR</span></div>`;
    for(const k in MOLD_BODY)h+=mdSlider(MOLD_BODY[k][0],m.body[k],MOLD_BODY[k][1],MOLD_BODY[k][2],.01,0,'b_'+k);
    h+=`<div class="mdrow"><span class="chip" data-act="bodyreset">RESET BODY</span></div>`;}
  else if(MD.tab==='colors'){const h0=moldHero();const cur={suit:m.cols.suit!=null?m.cols.suit:h0.suit,main:m.cols.main!=null?m.cols.main:(h0.mainCol||h0.color),trim:m.cols.trim!=null?m.cols.trim:h0.color,glow:m.cols.glow!=null?m.cols.glow:h0.accent};
    [['suit','Bodysuit'],['main','Armor / skin'],['trim','Trim'],['glow','Glow / eyes']].forEach(([k,n])=>{h+=`<label class="mdsl"><span>${n}</span><input type="color" data-k="c_${k}" value="${hexCss(cur[k]||0)}"><b></b></label>`;});
    h+=`<div class="mdnote">Armor pieces have their own colors in the ARMOR tab.</div>`;}
  else{h+=`<div class="mdrow"><span class="lblx">ADD</span>${mdSel('newShape',MOLD_SHAPES,MD.newShape||'plate')}<span class="lblx">ON</span>${mdSel('newBone',MOLD_BONES,MD.newBone||'chest')}<span class="chip" data-act="add">+ ADD PIECE</span></div>`;
    h+=`<div class="mdrow"><span class="lblx">PRESETS</span>${Object.keys(MOLD_PRESETS).map(k=>`<span class="chip sm" data-act="preset" data-v="${k}">${k}</span>`).join('')}</div>`;
    h+=`<div class="mdlist">${m.parts.map((p,i)=>`<div class="mdit${i===MD.sel?' sel':''}" data-i="${i}"><i style="background:${hexCss(p.c)}"></i>${i+1}. ${MOLD_SHAPES[p.s]} · ${MOLD_BONES[p.b]}${p.mi?' ⇄':''}</div>`).join('')||'<div class="mdnote">No pieces yet. Add one, pick a preset, or click a piece in the view to select it.</div>'}</div>`;
    const p=m.parts[MD.sel];if(p){h+=`<div class="mdpiece"><div class="mdrow">${mdSel('p_s',MOLD_SHAPES,p.s)}${mdSel('p_b',MOLD_BONES,p.b)}</div><div class="mdrow">${mdSel('p_m',MOLD_MATS,p.m)}<input type="color" data-k="p_c" value="${hexCss(p.c)}">
      <span class="chip sm${p.mi?' sel':''}" data-act="mirror">MIRROR ⇄</span><span class="chip sm" data-act="dup">DUPLICATE</span><span class="chip sm" data-act="del">DELETE</span></div>`;
      ['X','Y','Z'].forEach((a,i)=>h+=mdSlider('Move '+a,p.p[i],-.8,.8,.005,0,'pp'+i));['X','Y','Z'].forEach((a,i)=>h+=mdSlider('Turn '+a,p.r[i],-180,180,1,0,'pr'+i));
      ['X','Y','Z'].forEach((a,i)=>h+=mdSlider('Size '+a,p.k[i],.01,1.6,.005,0,'pk'+i));h+=mdSlider('Size (all)',1,.5,1.5,.01,0,'pall')+'</div>';}}
  el.innerHTML=h;
  el.querySelectorAll('input[type=range]').forEach(r=>{r.addEventListener('pointerdown',moldPush);r.oninput=()=>{const k=r.dataset.k,v=+r.value;r.nextElementSibling.textContent=v.toFixed(+r.step<1?2:0);
    if(k.startsWith('b_')){m.body[k.slice(2)]=v;moldChanged(true);}
    else if(k==='pall'){const p=m.parts[MD.sel];if(!MD.kAll)MD.kAll=p.k.slice();p.k=MD.kAll.map(x=>clamp(x*v,.01,1.6));moldChanged();}
    else{const p=m.parts[MD.sel],i=+k[2];({pp:p.p,pr:p.r,pk:p.k})[k.slice(0,2)][i]=v;moldLive(MD.sel);}};
    r.onchange=()=>{MD.kAll=null;if(r.dataset.k==='pall')renderMoldUI();};});
  el.querySelectorAll('input[type=color]').forEach(c=>c.onchange=()=>{moldPush();const k=c.dataset.k,v=parseInt(c.value.slice(1),16);if(k.startsWith('c_'))m.cols[k.slice(2)]=v;else m.parts[MD.sel].c=v;moldChanged(true);renderMoldUI();});
  el.querySelectorAll('select').forEach(s=>s.onchange=()=>{const k=s.dataset.k;if(k==='newShape'){MD.newShape=s.value;return;}if(k==='newBone'){MD.newBone=s.value;return;}
    moldPush();const p=m.parts[MD.sel];p[k.slice(2)]=s.value;moldChanged(true);renderMoldUI();});
  el.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{AU.ui();const a=b.dataset.act;moldPush();
    if(a==='armored')m.plain=false;if(a==='plain')m.plain=true;if(a==='visor')m.visor=!m.visor;if(a==='bodyreset')m.body=moldDefault().body;
    if(a==='add'){const s=MD.newShape||'plate',bn=MD.newBone||'chest';const def={head:[0,.15,0],chest:[0,.4,.12],hips:[0,0,.12]}[bn]||(bn.startsWith('hand')?[0,-.02,0]:[0,-.12,0]);
      m.parts.push({b:bn,s,m:'metal',c:CR.spec.color,p:def,r:[0,0,0],k:s==='spike'||s==='horn'||s==='blade'?[.06,.25,.06]:s==='wing'?[.7,.7,.7]:[.25,.25,.25],mi:!!MOLD_MIRROR[bn]});MD.sel=m.parts.length-1;MD.tab='armor';}
    if(a==='preset'){const add=MOLD_PRESETS[b.dataset.v]({m:CR.spec.color,g:CR.spec.accent});m.parts.push(...add);m.parts=m.parts.slice(0,80);MD.sel=m.parts.length-1;}
    if(a==='mirror')m.parts[MD.sel].mi=!m.parts[MD.sel].mi;
    if(a==='dup'){const c=JSON.parse(JSON.stringify(m.parts[MD.sel]));c.p[0]+=.05;m.parts.push(c);MD.sel=m.parts.length-1;}
    if(a==='del'){m.parts.splice(MD.sel,1);MD.sel=-1;}
    moldChanged(true);renderMoldUI();});
  el.querySelectorAll('.mdit').forEach(it=>it.onclick=()=>{MD.sel=+it.dataset.i;AU.ui();moldSelBox();renderMoldUI();});
  $('mdCount').textContent=`${m.parts.length} / 80 pieces`;}
/* move a piece without rebuilding the whole body */
function moldLive(i){const p=MD.m.parts[i];MD.pieces.filter(x=>x.userData.moldPiece===i+1).forEach(x=>{const sx=x.userData.mirror?-1:1;x.position.set(p.p[0]*sx,p.p[1],p.p[2]);
  x.rotation.set(p.r[0]*Math.PI/180,p.r[1]*Math.PI/180*sx,p.r[2]*Math.PI/180*sx);x.scale.set(p.k[0]*sx,p.k[1],p.k[2]);});}
/* view: drag to orbit, wheel to zoom, click to select a piece */
(()=>{const v=$('mdView');let drag=null;
  v.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:0};v.setPointerCapture(e.pointerId);});
  v.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;MD.yaw-=dx*.008;MD.pitch=clamp(MD.pitch+dy*.006,-.6,1.2);});
  v.addEventListener('pointerup',e=>{if(drag&&drag.moved<5&&MD.pieces.length){const r=v.getBoundingClientRect();const m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
      const rc=new THREE.Raycaster();rc.setFromCamera(m,PV.cam);const hit=rc.intersectObjects(MD.pieces,false)[0];MD.sel=hit?hit.object.userData.moldPiece-1:-1;if(hit)MD.tab='armor';moldSelBox();renderMoldUI();}drag=null;});
  v.addEventListener('wheel',e=>{e.preventDefault();MD.dist=clamp(MD.dist*(1+Math.sign(e.deltaY)*.08),1.2,9);},{passive:false});})();
document.querySelectorAll('#mdTabs span').forEach(s=>s.onclick=()=>{MD.tab=s.dataset.t;AU.ui();renderMoldUI();});
document.querySelectorAll('#mdFocus span').forEach(s=>s.onclick=()=>{const f={full:[1,5.2],head:[1.75,1.6],chest:[1.35,2.4],arms:[1.2,3],legs:[.55,2.6]}[s.dataset.f];MD.tgt.set(0,f[0]*(MD.m.body.hgt||1),0);MD.dist=f[1];AU.ui();});
document.querySelectorAll('#mdPose span').forEach(s=>s.onclick=()=>{MD.pose=s.dataset.p;document.querySelectorAll('#mdPose span').forEach(x=>x.classList.toggle('sel',x===s));AU.ui();});
$('mdUndo').onclick=()=>{if(!MD.undo.length)return;MD.m=JSON.parse(MD.undo.pop());MD.sel=Math.min(MD.sel,MD.m.parts.length-1);moldChanged(true);renderMoldUI();AU.ui();};
$('mdReset').onclick=()=>{moldPush();MD.m=moldDefault();MD.sel=-1;moldChanged(true);renderMoldUI();AU.ui();};
$('mdCancel').onclick=()=>{AU.ui();closeMold(false);};$('mdDone').onclick=()=>{AU.ui();closeMold(true);};
addEventListener('keydown',e=>{if(!MD.open)return;if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();$('mdUndo').click();}if(e.code==='Delete'&&MD.sel>=0&&document.activeElement.tagName!=='INPUT'){moldPush();MD.m.parts.splice(MD.sel,1);MD.sel=-1;moldChanged(true);renderMoldUI();}});
window.__md=()=>MD;
