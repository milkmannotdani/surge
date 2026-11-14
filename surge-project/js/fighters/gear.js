/* Weapons and gear */
/* ================= CUSTOM WEAPONS & ABILITY MODELS =================
   Created fighters carry the weapon they were described with (built from shapes, in their colors),
   fight in that weapon's style, and their abilities fly as the things described (axes, skulls, dragons...). */
const GEAR_TYPES={none:['No weapon (fists)','fist'],sword:['Sword','gblade'],katana:['Katana','gblade'],greatsword:['Greatsword','gheavy'],dagger:['Dagger','gblade'],axe:['Axe','gheavy'],
  hammer:['Hammer','gheavy'],mace:['Mace','gheavy'],club:['Club / bat','gheavy'],spear:['Spear','gpole'],trident:['Trident','gpole'],lance:['Lance','gpole'],scythe:['Scythe','gpole'],
  sickle:['Sickle','gblade'],staff:['Staff','gpole'],wand:['Wand','gshot'],gun:['Gun / blaster','gshot'],bow:['Bow','gshot'],guitar:['Guitar','gheavy'],fan:['War fan','gblade'],
  chakram:['Chakram','gblade'],claws:['Claws','claw'],gauntlets:['Gauntlets','fist'],whip:['Whip','whip'],chain:['Chain','whip'],shield:['Sword & shield','gblade']};
const GEAR_DUAL_OK=['sword','katana','dagger','axe','sickle','gun','fan','chakram','mace','hammer','club'];
function sanitizeGear(g){if(!g||typeof g!=='object')return null;const type=GEAR_TYPES[g.type]?g.type:'none';const n=+g.size;
  return {type,c1:cabCol(g.c1!=null?g.c1:(g.colors||[])[0],0xc8ccd8),c2:cabCol(g.c2!=null?g.c2:(g.colors||[])[1],0x4fd2ff),size:isFinite(n)?clamp(n,.7,1.6):1,dual:!!g.dual&&GEAR_DUAL_OK.indexOf(type)>=0,glow:g.glow!==false};}
function gearCls(g){return g&&GEAR_TYPES[g.type]?GEAR_TYPES[g.type][1]:'fist';}
/* new move sets for weapon styles */
Object.assign(MOVES,{
  hvyA:{st:.14,ac:.12,rc:.24,dmg:7,rng:2.9,kb:4,up:0,stun:.5,lunge:4,next:'hvyB',w:'heavyw',h:'slash',limb:'s',lat:1.9},
  hvyB:{st:.16,ac:.12,rc:.3,dmg:8,rng:2.9,kb:5,up:0,stun:.5,lunge:4,next:'hvyC',w:'slash',h:'heavyh',limb:'s',lat:1.9},
  hvyC:{st:.24,ac:.14,rc:.4,dmg:12,rng:3.1,kb:13,up:8,stun:.5,lunge:5,launch:true,heavy:true,shock:true,w:'slamAir',h:'slamLand',limb:'s',lat:2},
  hvyH:{st:.36,ac:.14,rc:.48,dmg:16,rng:3.1,kb:6,up:14,stun:.5,lunge:6,launch:true,heavy:true,shock:true,w:'heavyw',h:'smashh',limb:'s',lat:2},
  poleA:{st:.09,ac:.1,rc:.18,dmg:5,rng:3.8,kb:3,up:0,stun:.4,lunge:3,next:'poleB',w:'jabRw',h:'point',limb:'s',lat:1.1},
  poleB:{st:.1,ac:.12,rc:.2,dmg:5,rng:3.6,kb:3,up:0,stun:.42,lunge:2,next:'poleC',w:'slash',h:'slashL',limb:'s',lat:2.2},
  poleC:{st:.14,ac:.12,rc:.32,dmg:8,rng:4,kb:10,up:7,stun:.5,lunge:5,launch:true,heavy:true,w:'charge',h:'point',limb:'s',lat:1.2},
  poleH:{st:.28,ac:.12,rc:.42,dmg:13,rng:4,kb:5,up:13,stun:.5,lunge:4,launch:true,heavy:true,w:'charge',h:'point',limb:'s',lat:1.4},
  shotA:{st:.06,ac:.08,rc:.16,dmg:4,rng:1.6,kb:1,up:0,stun:.3,lunge:0,next:'shotB',w:'point',h:'point',limb:'r',shot:1},
  shotB:{st:.06,ac:.08,rc:.18,dmg:4,rng:1.6,kb:1,up:0,stun:.3,lunge:0,next:'shotC',w:'point',h:'point',limb:'r',shot:1},
  shotC:{st:.12,ac:.1,rc:.3,dmg:7,rng:1.6,kb:8,up:4,stun:.45,lunge:-3,launch:true,w:'point',h:'point',limb:'r',shot:3},
  shotH:{st:.3,ac:.1,rc:.4,dmg:13,rng:1.6,kb:12,up:6,stun:.5,lunge:-4,launch:true,heavy:true,w:'charge',h:'point',limb:'r',shot:2}});
['hvyA','hvyB','hvyC','hvyH','poleA','poleB','poleC','poleH','shotA','shotB','shotC','shotH'].forEach(k=>MOVEK.push(k));
Object.assign(WCLS,{gblade:{rng:.8,limb:'s',lat:.5},gheavy:{rng:.9,limb:'s',lat:.7},gpole:{rng:1.6,limb:'s'},gshot:{}});
['gblade','gheavy','gpole','gshot'].forEach(c=>{for(const v in VMOVES){const b=VMOVES[v],w=WCLS[c],m=Object.assign({},b);m.rng=b.rng+(w.rng||0);if(w.limb&&!b.air)m.limb=w.limb;if(w.lat)m.lat=(b.lat||1.15)+w.lat;
  if(c==='gheavy'&&!b.air){m.st=b.st*1.25;m.dmg=b.dmg*1.2;m.shock=b.heavy||m.shock;}MOVES[v+'_'+c]=m;MOVEK.push(v+'_'+c);}});
Object.assign(NEUTRAL_H,{gblade:'swordH',gheavy:'hvyH',gpole:'poleH',gshot:'shotH'});
const GEAR_MV={gblade:['swordA','swordH'],gheavy:['hvyA','hvyH'],gpole:['poleA','poleH'],gshot:['shotA','shotH'],fist:['jabR','heavy'],claw:['clawA','clawH'],whip:['whipA','whipH']};
/* ranged weapons fire real shots */
function gearShotLook(f){const g=f.hero.gear||{},col=g.c2||f.hero.color;const sh={gun:'bullet',bow:'arrow',wand:'star'}[g.type]||'orb';
  return {form:'bolt',style:({gun:'explosion',bow:'wind',wand:'light'})[g.type]||'light',shape:sh,c1:col,c2:0xffffff,size:sh==='bullet'?.7:.85,range:26,speed:sh==='arrow'?50:sh==='bullet'?60:38,power:1,fx:[],self:[],count:1};}
function gearShot(f,M){const A=gearShotLook(f),fw=f.fwd(),c=f.chest(new V3()).addScaledVector(fw,.8);const n=M.shot===3?3:1,big=M.shot===2;
  for(let k=0;k<n;k++)cabProj(f,A,1,M.dmg/CAB_BASE.bolt/n*(n>1?1.4:1),c,fw.clone().applyAxisAngle(UP,(k-(n-1)/2)*.12),A.speed,{sc:big?1.8:1,boom:big?1:0});
  burst(ADD,c,big?16:6,{colors:[A.c1,0xffffff],speed:big?6:3,life:.2,size:.3,bright:2.6});sndHere(f,()=>{if(f.hero.gear.type==='gun')AU.noise(.08,.4,'highpass',1500,4000,1);else if(f.hero.gear.type==='bow')AU.noise(.12,.25,'bandpass',900,2600,4);else AU.fm(900,2,2,.2,.06,0,1800);});}
/* ---- weapon models: built along +Y from the grip, returns {g, tip} ---- */
function gearMats(g){return {metal:new THREE.MeshPhysicalMaterial({color:g.c1,metalness:.9,roughness:.2,clearcoat:1}),
  grip:new THREE.MeshStandardMaterial({color:0x2a2028,roughness:.7}),wood:new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.8}),
  glow:new THREE.MeshStandardMaterial({color:g.c2,emissive:g.c2,emissiveIntensity:g.glow?2.6:.6,roughness:.3})};}
function gearModel(type,g,mt){const G=new THREE.Group(),M=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=true;G.add(o);return o;};let tip=1;
  const cyl=(r1,r2,h,n)=>new THREE.CylinderGeometry(r1,r2,h,n||14);
  const bladeShape=(w,L,curve)=>{const s=new THREE.Shape();s.moveTo(-w,0);s.lineTo(w,0);s.lineTo(w*.9,L*.86);s.quadraticCurveTo(w*.6+curve,L*.97,-w,L);s.lineTo(-w,0);
    const q=new THREE.ExtrudeGeometry(s,{depth:.008,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2,curveSegments:10});q.translate(0,0,-.006);return q;};
  switch(type){
    case 'sword':case 'shield':M(bladeShape(.032,1,.0),mt.metal,0,.07);M(new THREE.BoxGeometry(.006,.9,.006),mt.glow,.036,.52);M(new THREE.BoxGeometry(.2,.03,.05),mt.glow,0,.06);M(cyl(.018,.02,.2),mt.grip,0,-.04);tip=1.07;break;
    case 'katana':M(bladeShape(.018,1.05,.03),mt.metal,0,.06);M(new THREE.BoxGeometry(.004,.95,.004),mt.glow,.02,.52);M(cyl(.045,.045,.012,24),mt.glow,0,.055);M(cyl(.016,.016,.24),mt.grip,0,-.06);tip=1.1;break;
    case 'greatsword':M(bladeShape(.07,1.45,.0),mt.metal,0,.1);M(new THREE.BoxGeometry(.012,1.3,.012),mt.glow,0,.75,.012);M(new THREE.BoxGeometry(.34,.05,.08),mt.glow,0,.09);M(cyl(.024,.026,.32),mt.grip,0,-.08);tip=1.55;break;
    case 'dagger':M(bladeShape(.022,.42,0),mt.metal,0,.05);M(new THREE.BoxGeometry(.1,.02,.03),mt.glow,0,.05);M(cyl(.016,.016,.13),mt.grip,0,-.02);tip=.5;break;
    case 'axe':{M(cyl(.022,.026,1),mt.wood,0,.3);const s=new THREE.Shape();s.moveTo(0,-.12);s.quadraticCurveTo(.3,-.2,.34,0);s.quadraticCurveTo(.3,.2,0,.14);s.lineTo(0,-.12);
      const q=new THREE.ExtrudeGeometry(s,{depth:.03,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2});q.translate(0,0,-.015);M(q,mt.metal,.02,.72);M(new THREE.BoxGeometry(.012,.3,.04),mt.glow,.35,.72);tip=.95;break;}
    case 'hammer':M(cyl(.024,.028,1),mt.wood,0,.3);M(new THREE.BoxGeometry(.42,.24,.24),mt.metal,0,.82);M(new THREE.BoxGeometry(.44,.05,.26),mt.glow,0,.82);tip=.95;break;
    case 'mace':{M(cyl(.022,.026,.75),mt.grip,0,.2);M(new THREE.SphereGeometry(.14,20,14),mt.metal,0,.66);for(let k=0;k<8;k++){const a=k/8*6.28,sp=M(new THREE.ConeGeometry(.035,.12,8),mt.glow,Math.cos(a)*.15,.66+(k%2?.06:-.06),Math.sin(a)*.15);sp.rotation.z=-Math.cos(a)*1.57;sp.rotation.x=Math.sin(a)*1.57;}tip=.8;break;}
    case 'club':M(cyl(.08,.028,.95),mt.wood,0,.4);M(new THREE.TorusGeometry(.07,.012,8,24),mt.glow,0,.62).rotation.x=Math.PI/2;tip=.9;break;
    case 'spear':M(cyl(.018,.02,1.7),mt.wood,0,.5);M(new THREE.ConeGeometry(.05,.3,10),mt.metal,0,1.48);M(new THREE.TorusGeometry(.03,.01,6,16),mt.glow,0,1.32).rotation.x=Math.PI/2;tip=1.62;break;
    case 'trident':M(cyl(.018,.02,1.6),mt.metal,0,.45);M(new THREE.BoxGeometry(.24,.03,.03),mt.metal,0,1.25);[-.11,0,.11].forEach(x=>M(new THREE.ConeGeometry(.025,.3,8),x?mt.metal:mt.glow,x,1.4));tip=1.55;break;
    case 'lance':M(new THREE.ConeGeometry(.1,1.7,16),mt.metal,0,.95);M(new THREE.ConeGeometry(.14,.2,16),mt.glow,0,.1).rotation.x=Math.PI;M(cyl(.02,.02,.25),mt.grip,0,-.1);tip=1.8;break;
    case 'scythe':{M(cyl(.02,.022,1.7),mt.wood,0,.45);const s=new THREE.Shape();s.moveTo(0,0);s.quadraticCurveTo(.4,.18,.75,-.12);s.quadraticCurveTo(.4,.06,0,-.08);s.lineTo(0,0);
      const q=new THREE.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2});q.translate(0,0,-.02);M(q,mt.metal,0,1.28);const q2=q.clone();q2.rotateY(Math.PI/2);M(q2,mt.glow,0,1.28).scale.set(.6,.6,.6);M(new THREE.SphereGeometry(.04,10,8),mt.glow,0,1.3);tip=1.35;break;}
    case 'sickle':{M(cyl(.018,.02,.32),mt.wood,0,.06);const c=M(new THREE.TorusGeometry(.18,.016,6,24,Math.PI*1.2),mt.metal,-.18,.28);c.rotation.z=-.3;tip=.45;break;}
    case 'staff':M(cyl(.022,.026,1.7),mt.wood,0,.45);M(new THREE.SphereGeometry(.09,20,14),mt.glow,0,1.36);M(new THREE.TorusGeometry(.12,.012,8,28),mt.metal,0,1.36);tip=1.45;break;
    case 'wand':M(cyl(.012,.018,.42),mt.wood,0,.15);M(new THREE.OctahedronGeometry(.05,0),mt.glow,0,.4);tip=.45;break;
    case 'gun':M(new THREE.BoxGeometry(.07,.1,.16),mt.grip,0,0,-.03);M(new THREE.BoxGeometry(.08,.34,.1),mt.metal,0,.14,.04);M(cyl(.025,.025,.3),mt.metal,0,.42,.05);M(cyl(.03,.03,.04),mt.glow,0,.58,.05);tip=.6;break;
    case 'bow':{const a=M(new THREE.TorusGeometry(.5,.018,8,40,Math.PI),mt.wood,0,0);a.rotation.z=-Math.PI/2;a.position.x=-.08;M(cyl(.003,.003,1),mt.glow,-.08,0);tip=.5;break;}
    case 'guitar':{const b=M(new THREE.SphereGeometry(.22,20,14),mt.metal,0,.18);b.scale.set(1,1.15,.45);M(new THREE.SphereGeometry(.15,18,12),mt.metal,0,.44).scale.set(1,1,.45);M(new THREE.TorusGeometry(.05,.012,6,16),mt.glow,0,.3,.1);M(new THREE.BoxGeometry(.05,.6,.03),mt.wood,0,.82);M(new THREE.BoxGeometry(.09,.12,.03),mt.glow,0,1.15);tip=1.2;break;}
    case 'fan':{const q=new THREE.CircleGeometry(.36,24,Math.PI*.15,Math.PI*.7);M(q,mt.glow,0,.02).material.side=THREE.DoubleSide;for(let k=0;k<6;k++){const r=M(new THREE.BoxGeometry(.008,.36,.006),mt.metal,0,.02);r.rotation.z=-(.27*Math.PI)+k*(.7*Math.PI/5)-Math.PI/2+Math.PI/2;r.position.set(Math.cos(Math.PI*.15+k*Math.PI*.14)*.18,.02+Math.sin(Math.PI*.15+k*Math.PI*.14)*.18,0);r.rotation.z=Math.PI*.15+k*Math.PI*.14-Math.PI/2;}tip=.38;break;}
    case 'chakram':{const r=M(new THREE.TorusGeometry(.2,.025,8,32),mt.metal,0,.2);for(let k=0;k<8;k++){const a=k/8*6.28;const s=M(new THREE.ConeGeometry(.02,.08,6),mt.glow,Math.cos(a)*.24,.2+Math.sin(a)*.24);s.rotation.z=a-Math.PI/2;}tip=.42;break;}
    case 'claws':for(let k=0;k<3;k++){const c=M(new THREE.ConeGeometry(.016,.36,8),mt.metal,(k-1)*.04,.22);c.rotation.z=(k-1)*.08;}M(new THREE.BoxGeometry(.14,.06,.06),mt.glow,0,.02);tip=.42;break;
    case 'gauntlets':M(new THREE.BoxGeometry(.17,.2,.17),mt.metal,0,-.02);M(new THREE.BoxGeometry(.18,.04,.18),mt.glow,0,.09);M(cyl(.08,.1,.22),mt.metal,0,-.18);tip=.15;break;
    default:tip=.2;}
  return {g:G,tip};}
function makeGearWhip(g,sc){const mt=gearMats(g),G=new THREE.Group(),segs=[];const sgeo=new THREE.CylinderGeometry(1,1,1,10);const m=g.type==='chain'?mt.metal:new THREE.MeshPhysicalMaterial({color:g.c1,roughness:.5,clearcoat:.6});
  for(let i=0;i<24;i++){const o=new THREE.Mesh(sgeo,i%3===0&&g.type==='chain'?mt.glow:m);o.castShadow=true;G.add(o);segs.push(o);}
  const tip=g.type==='chain'?new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),mt.glow):new THREE.Mesh(new THREE.ConeGeometry(.06,.3,10),mt.glow);G.add(tip);G.visible=false;sc.add(G);return {group:G,segs,tip};}
/* attach to a rig; called by buildRig for created fighters */
function attachGear(h,p){const g=h.gear;if(!g||g.type==='none')return {};const mt=gearMats(g),out={};const s=g.size;
  const put=(type,arm,mirror)=>{const W=gearModel(type,g,mt);W.g.scale.setScalar(s);W.g.rotation.x=Math.PI/2;W.g.position.set(0,-.02,0);if(mirror)W.g.scale.x*=-1;arm.add(W.g);return W;};
  if(g.type==='whip'||g.type==='chain'){out.whip=makeGearWhip(g,p.sc);const hd=gearModel('dagger',g,mt);hd.g.scale.setScalar(.6);hd.g.rotation.x=Math.PI/2;p.rF.add(hd.g);return out;}
  if(g.type==='claws'||g.type==='gauntlets'){const a=gearModel(g.type,g,mt),b=gearModel(g.type,g,mt);[a,b].forEach((W,i)=>{W.g.scale.setScalar(s);W.g.position.set(0,-.24,0);if(g.type==='claws'){W.g.rotation.x=Math.PI;W.g.position.y=-.2;}(i?p.lF:p.rF).add(W.g);});return out;}
  if(g.type==='bow'){const W=gearModel('bow',g,mt);W.g.scale.setScalar(s);W.g.position.set(0,-.12,.02);W.g.rotation.set(0,Math.PI/2,0);p.lF.add(W.g);out.sword=null;return out;}
  const W=put(g.type,p.rF,false);out.sword=W.g;out.tip=W.tip;
  if(g.dual)put(g.type,p.lF,true);
  if(g.type==='shield'){const sh=new THREE.Mesh(new THREE.CylinderGeometry(.3*s,.3*s,.04,28),mt.metal);sh.rotation.z=Math.PI/2;sh.position.set(-.08,-.18,0);p.lF.add(sh);
    const em=new THREE.Mesh(new THREE.CylinderGeometry(.1*s,.1*s,.045,20),mt.glow);em.rotation.z=Math.PI/2;em.position.set(-.09,-.18,0);p.lF.add(em);}
  return out;}
/* ---- ability models: every model faces +Z (its flight direction) ---- */
const CAB_SHAPES2=['axe','hammer','sword','shuriken','skull','fist','hand','dragon','bat','bubble','boulder','lightning','petal','leaf','card','note','bomb','knife','bullet','heart','snowflake','flame','tornado','chakram','crescent','eye','bone','feather','coin','car','weapon'];
CAB_SHAPES.push(...CAB_SHAPES2);
function cabModel(shape,A,f){const g=new THREE.Group(),m1=addMat(A.c1,2.2,.9),m2=addMat(A.c2,2.8),M=(geo,m)=>{const o=new THREE.Mesh(geo,m);g.add(o);return o;},G=(k,fn)=>cg('cm_'+k,fn);
  const flat=(geo,m)=>{const o=M(geo,m);o.material.side=THREE.DoubleSide;return o;};
  switch(shape){
    case 'weapon':{const gr=f&&f.hero.gear&&f.hero.gear.type!=='none'?f.hero.gear:null;if(!gr)return null;const W=gearModel(gr.type==='whip'||gr.type==='chain'?'mace':gr.type==='bow'?'spear':gr.type,gr,gearMats(gr));
      W.g.rotation.x=Math.PI/2;W.g.position.z=-W.tip*.45;W.g.scale.setScalar(gr.size*1.4);g.add(W.g);g.userData.spin=1;g.add(new THREE.Mesh(G('wglow',()=>new THREE.SphereGeometry(.5,16,12)),addMat(gr.c2,1,.25)));return g;}
    case 'axe':case 'hammer':case 'sword':{const W=gearModel(shape,{c1:A.c1,c2:A.c2,glow:true},{metal:addMat(A.c1,1.8,.95),grip:addMat(A.c2,1.2,.9),wood:addMat(A.c2,1.2,.9),glow:m2});W.g.rotation.x=Math.PI/2;W.g.position.z=-.4;W.g.scale.setScalar(1.3);g.add(W.g);g.userData.spin=1;return g;}
    case 'shuriken':for(let k=0;k<4;k++){const b=M(G('shu',()=>{const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.08,.12);s.lineTo(0,.5);s.lineTo(-.08,.12);s.lineTo(0,0);return new THREE.ShapeGeometry(s);}),m1);b.rotation.z=k*Math.PI/2;b.material.side=THREE.DoubleSide;}
      M(G('shu2',()=>new THREE.CircleGeometry(.08,16)),m2);g.children.forEach(c=>{c.rotation.x=0;});g.rotation.x=Math.PI/2;g.userData.spinY=1;{const w=new THREE.Group();w.add(g);return w;}
    case 'skull':{const h=M(G('sk',()=>new THREE.SphereGeometry(.34,20,16)),m1);h.scale.set(1,1,1.1);const j=M(G('skj',()=>new THREE.BoxGeometry(.32,.16,.26)),m1);j.position.set(0,-.24,.06);
      [-1,1].forEach(s=>{const e=M(G('ske',()=>new THREE.SphereGeometry(.08,12,10)),addMat(0x000000,1,1));e.material.blending=THREE.NormalBlending;e.position.set(s*.12,.02,.28);const p=M(G('skp',()=>new THREE.SphereGeometry(.04,10,8)),m2);p.position.set(s*.12,.02,.33);});return g;}
    case 'fist':case 'hand':{const p=M(G('fp',()=>new THREE.BoxGeometry(.4,.36,.32)),m1);p.position.z=.05;for(let k=0;k<4;k++){const fi=M(G('ff',()=>new THREE.BoxGeometry(.08,.08,shape==='hand'?.34:.12)),m1);fi.position.set(-.14+k*.095,.12,shape==='hand'?.34:.24);}
      const t=M(G('ft',()=>new THREE.BoxGeometry(.09,.09,.2)),m1);t.position.set(.24,-.04,.14);M(G('fg',()=>new THREE.SphereGeometry(.3,16,12)),addMat(A.c2,.6,.12));return g;}
    case 'dragon':{const head=M(G('dh',()=>{const q=new THREE.ConeGeometry(.18,.6,10);q.rotateX(Math.PI/2);return q;}),m1);head.position.z=.3;
      [-1,1].forEach(s=>{const hn=M(G('dhn',()=>new THREE.ConeGeometry(.04,.25,8)),m2);hn.position.set(s*.1,.14,.08);hn.rotation.x=-.8;});
      for(let k=1;k<6;k++){const b=M(G('db'+k,()=>new THREE.SphereGeometry(.17-k*.022,12,10)),m1);b.position.z=-k*.22;b.userData.seg=k;}
      [-1,1].forEach(s=>{const w=flat(G('dw',()=>{const q=new THREE.PlaneGeometry(.8,.4);q.translate(.4,0,0);return q;}),m2);w.rotation.set(Math.PI/2,0,s>0?0:Math.PI);w.position.z=-.15;w.userData.wing=s;});return g;}
    case 'bat':{M(G('bb',()=>new THREE.SphereGeometry(.12,12,10)),m1);[-1,1].forEach(s=>{const w=flat(G('bw2',()=>{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.5,.15);sh.lineTo(.42,0);sh.lineTo(.3,.06);sh.lineTo(.2,-.04);sh.lineTo(0,0);const q=new THREE.ShapeGeometry(sh);q.rotateX(-Math.PI/2);return q;}),m2);
      if(s<0)w.scale.x=-1;w.userData.wing=s;});return g;}
    case 'bubble':M(G('bu',()=>new THREE.SphereGeometry(.42,24,18)),addMat(A.c1,1,.35));M(G('bu2',()=>new THREE.SphereGeometry(.1,10,8)),m2).position.set(.15,.15,.2);return g;
    case 'boulder':{const b=new THREE.Mesh(G('bo',()=>new THREE.DodecahedronGeometry(.42,1)),new THREE.MeshStandardMaterial({color:A.c1,roughness:.9,flatShading:true,emissive:A.c2,emissiveIntensity:.4}));g.add(b);g.userData.spin=1;return g;}
    case 'lightning':{const pts=[];for(let k=0;k<7;k++)pts.push(new V3(k%2?.12:-.12,(k%3-1)*.06,-.6+k*.2));const q=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.035,6,false);M(q,m2);M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.08,6,false),m1);return g;}
    case 'petal':case 'leaf':{const p=flat(G(shape,()=>{const s=new THREE.Shape();s.moveTo(0,-.3);s.quadraticCurveTo(.22,0,0,.3);s.quadraticCurveTo(-.22,0,0,-.3);const q=new THREE.ShapeGeometry(s);q.rotateX(-Math.PI/2);return q;}),m1);
      if(shape==='leaf')M(G('lv',()=>new THREE.BoxGeometry(.01,.01,.55)),m2);g.userData.flutter=1;return g;}
    case 'card':flat(G('cd',()=>new THREE.PlaneGeometry(.3,.44)),m1).rotation.x=-Math.PI/2.4;{const s=flat(G('cd2',()=>new THREE.PlaneGeometry(.12,.12)),m2);s.rotation.x=-Math.PI/2.4;s.position.y=.01;}g.userData.spinY=1;return g;
    case 'note':M(G('nh',()=>new THREE.SphereGeometry(.13,14,10)),m1).scale.set(1.3,1,1);{const st=M(G('ns',()=>new THREE.BoxGeometry(.03,.45,.03)),m1);st.position.set(.15,.22,0);const fl=M(G('nf',()=>new THREE.BoxGeometry(.18,.05,.03)),m2);fl.position.set(.23,.42,0);}return g;
    case 'bomb':M(G('bm',()=>new THREE.SphereGeometry(.3,18,14)),new THREE.MeshStandardMaterial({color:0x1a1a22,roughness:.4,metalness:.3}));M(G('bmf',()=>new THREE.CylinderGeometry(.03,.03,.14,8)),m1).position.y=.33;M(G('bms',()=>new THREE.SphereGeometry(.06,8,6)),m2).position.y=.42;g.userData.spin=1;return g;
    case 'knife':{const W=gearModel('dagger',{},{metal:addMat(A.c1,1.8,.95),grip:addMat(A.c2,1,.9),glow:m2});W.g.rotation.x=Math.PI/2;W.g.scale.setScalar(1.4);g.add(W.g);return g;}
    case 'bullet':M(G('bl',()=>{const q=new THREE.CylinderGeometry(.06,.06,.3,10);q.rotateX(Math.PI/2);return q;}),m1);M(G('blt',()=>{const q=new THREE.ConeGeometry(.06,.14,10);q.rotateX(Math.PI/2);return q;}),m2).position.z=.21;return g;
    case 'heart':{const s=new THREE.Shape();s.moveTo(0,-.3);s.bezierCurveTo(.35,-.05,.3,.3,0,.15);s.bezierCurveTo(-.3,.3,-.35,-.05,0,-.3);const q=new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3});q.translate(0,0,-.05);M(q,m1);g.userData.spinY=1;return g;}
    case 'snowflake':for(let k=0;k<3;k++){const b=M(G('sf',()=>new THREE.BoxGeometry(.04,.8,.04)),m1);b.rotation.z=k*Math.PI/3;}for(let k=0;k<6;k++){const b=M(G('sf2',()=>new THREE.BoxGeometry(.03,.2,.03)),m2);const a=k*Math.PI/3;b.position.set(Math.sin(a)*.28,Math.cos(a)*.28,0);b.rotation.z=-a+.6;}g.userData.spinZ=1;return g;
    case 'flame':{const c=M(G('fl',()=>{const q=new THREE.ConeGeometry(.28,.8,14);q.rotateX(-Math.PI/2);return q;}),m1);c.position.z=-.2;M(G('fl2',()=>{const q=new THREE.ConeGeometry(.15,.5,12);q.rotateX(-Math.PI/2);return q;}),m2).position.z=-.05;M(G('fl3',()=>new THREE.SphereGeometry(.28,14,10)),m1).position.z=.1;g.userData.flick=1;return g;}
    case 'tornado':{for(let k=0;k<5;k++){const r=M(G('tn'+k,()=>new THREE.TorusGeometry(.12+k*.09,.025,6,24)),k%2?m2:m1);r.rotation.x=Math.PI/2;r.position.y=-.3+k*.16;}g.userData.spinY=1;return g;}
    case 'chakram':{M(G('ck',()=>new THREE.TorusGeometry(.38,.05,8,32)),m1);for(let k=0;k<8;k++){const a=k/8*6.28,s=M(G('cks',()=>new THREE.ConeGeometry(.04,.16,6)),m2);s.position.set(Math.cos(a)*.45,Math.sin(a)*.45,0);s.rotation.z=a-Math.PI/2;}g.userData.spinZ=1;{const w=new THREE.Group();g.rotation.x=Math.PI/2;w.add(g);return w;}}
    case 'crescent':{const a=M(G('cr',()=>new THREE.TorusGeometry(.75,.1,8,40,Math.PI)),m1);a.rotation.x=Math.PI/2;a.scale.z=.4;const b=M(G('cr2',()=>new THREE.TorusGeometry(.7,.04,6,40,Math.PI)),m2);b.rotation.x=Math.PI/2;return g;}
    case 'eye':M(G('ey',()=>new THREE.SphereGeometry(.34,20,16)),addMat(0xffffff,1.4,.9));{const ir=M(G('eyi',()=>new THREE.CircleGeometry(.18,24)),m1);ir.position.z=.335;const pu=M(G('eyp',()=>new THREE.CircleGeometry(.08,20)),addMat(0x000000,1,1));pu.material.blending=THREE.NormalBlending;pu.position.z=.34;}return g;
    case 'bone':{const s=M(G('bn',()=>{const q=new THREE.CylinderGeometry(.05,.05,.7,10);q.rotateX(Math.PI/2);return q;}),m1);[-1,1].forEach(z=>[-1,1].forEach(x=>M(G('bnk',()=>new THREE.SphereGeometry(.08,10,8)),m1).position.set(x*.06,0,z*.36)));g.userData.spin=1;return g;}
    case 'feather':{const f2=flat(G('fe',()=>{const s=new THREE.Shape();s.moveTo(0,-.4);s.quadraticCurveTo(.14,0,0,.4);s.quadraticCurveTo(-.1,0,0,-.4);const q=new THREE.ShapeGeometry(s);q.rotateX(-Math.PI/2);return q;}),m1);M(G('fes',()=>new THREE.BoxGeometry(.01,.01,.8)),m2);g.userData.flutter=1;return g;}
    case 'car':{const b=M(G('carB',()=>new THREE.BoxGeometry(.5,.2,.95)),m1);b.position.y=0;const cb=M(G('carC',()=>new THREE.BoxGeometry(.42,.18,.45)),m1);cb.position.set(0,.17,-.05);
      const win=M(G('carW',()=>new THREE.BoxGeometry(.43,.1,.46)),m2);win.position.set(0,.18,-.05);
      [[-.27,.3],[.27,.3],[-.27,-.3],[.27,-.3]].forEach(([x,z])=>{const w=M(G('carT',()=>new THREE.CylinderGeometry(.12,.12,.08,14)),m2);w.rotation.z=Math.PI/2;w.position.set(x,-.1,z);});
      [-.15,.15].forEach(x=>{const l=M(G('carL',()=>new THREE.SphereGeometry(.04,8,6)),m2);l.position.set(x,0,.48);});g.userData.spin=1;g.scale.setScalar(1.6);return g;}
    case 'coin':{const c=M(G('co',()=>new THREE.CylinderGeometry(.22,.22,.04,24)),m1);c.rotation.x=Math.PI/2;M(G('co2',()=>new THREE.TorusGeometry(.18,.015,6,24)),m2);g.userData.spinY=1;return g;}
  }
  return null;}
