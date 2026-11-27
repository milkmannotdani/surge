/* HEMLOCK — an original villain made for this game: a backwoods trapper who started hunting people for sport.
   Hooded duster, a fur collar, a cloth wrap over his face, a quiver on his back, a gut knife at his hip and a
   spare bear trap hanging off his belt. He fights with a recurve bow.
     J        quick arrows (a 3-shot string; the third looses two at once)
     K / RMB  HOLD to draw a charged arrow, release to fire (full draw = the arrow's full effect)
     X        switch arrows:  GAS (a choking cloud: damage over time + slow)  →  EXPLOSIVE (a blast)
                              →  BARBED (they bleed, and the arrow stays stuck in them)
              quick arrows carry a small dose of the effect, charged arrows the full one
     (GRAPPLE and BEAR TRAP have no cooldown, and there's no limit on traps)
     1  GRAPPLE      fire a hook at whatever you're aiming at and zip there: walls, roofs, anywhere it bites.
                     Hook an enemy and it reels you in for a flying kick. HOLD 1: REEL — drag them to you instead.
     2  BEAR TRAP    toss a trap where you aim (as many as you like; they stay until sprung). Whoever steps in is caught: rooted, cut and
                     bleeding, and has to beat SKILL CHECKS to pry it open — a needle sweeps round a dial, press
                     SPACE when it's in the white zone (three good presses and you're out; a miss bites again).
     3  TRACKER'S SENSE  he goes into the hunt for 25 s: the world drains to grey, every enemy within 120 m glows red
                     through walls, their fresh footprints burn red on the ground, and he runs faster. Every kill
                     during it adds 5 s.
     4  GUT KNIFE    a lunging stab that causes HEMORRHAGE (heavy bleeding, slowed). Sometimes he rips out a chunk
                     of them and eats it on the spot — it heals him.
     Q  THE LAST HUNT  every enemy within 90 m is revealed, he runs faster and every shot looses three arrows (12 s).
     Q + back / in the air: ARROW STORM — one arrow straight up, then a rain of arrows (your current type) on the aim point.
   Mode (5): BLOOD MOON — see FORMS.hemlock in forms.js. */
const HEM={c:0x4a5a2a,a:0xc8e05a,bone:0xe8dcc0,steel:0x9aa0a8,dark:0x1a1612,rust:0x6a3418,wood:0x4a3018};
const HEM_ARR=['gas','boom','barb'],HEM_ARR_N={gas:'GAS',boom:'EXPLOSIVE',barb:'BARBED'},HEM_ARR_C={gas:0x8aff3a,boom:0xff7a1a,barb:0xe02a3a};
Object.assign(SPNAME,{hemgrap:'GRAPPLE'});Object.assign(HERO_SND,{hemlock:'blade'});Object.assign(ULT_RANGE,{lasthunt:45});
Object.assign(SPECIAL_AI,{hemgrap:[8,30,.45]});Object.assign(XSPK,{hemgrap:1});Object.assign(DULT_OF,{hemlock:'vengeance'});
if(typeof PROJ_SIG!=='undefined')PROJ_SIG.hemlock='arrow';
if(typeof TRAIT_DESC!=='undefined')TRAIT_DESC.hemlock='press X to switch arrows: gas · explosive · barbed';
HUMAN.hemlock=[1,0x2a2014,'messy',0xd8f03a,'stubble'];
// a weathered brown duster, charcoal hood, rust-red face wrap, grey fur collar: a trapper, not a hero archer
COS.hemlock={hideDecor:1,base:{top:0x4a4436,legs:0x3a342a,legK:'cloth',shoe:0x2a1c12,hands:0x4a3828,fingerless:1},
  parts:[['jacket',{col:0x3e3a30,k:'leather',open:1,collar:'high'}],['coat',{col:0x5a4430,k:'leather',len:.86,flare:.4}],['hood',{col:0x3a3632,up:1}],['mask',{col:0x7a2e22,k:'cloth'}],
    ['furtrim',{col:0xb8b0a0}],['belt',{col:0x3a2414,pouches:[1,-1,2.2]}],['strap',{dir:1,col:0x3a2414}],['bracers',{col:0x3a2414}],['wraps',{col:0x8a7a5a,n:3}],['boots',{h:.3,col:0x2a1c12}]]};
function isHem(f){return !!f&&!!f.hero&&KIT(f.hero,'elem')==='hemlock';}
function hemType(f){return HEM_ARR[(f.hemA|0)%3];}
const hemAimOn=f=>f===ME&&typeof AIM!=='undefined'&&AIM&&AIM.on&&typeof shoulderCam==='function'&&shoulderCam();

/* ---------- the look: forced human (no armour), plus quiver, knife, a spare trap; drawn string + nocked arrow ---------- */
const HEM_M={leather:new THREE.MeshStandardMaterial({color:0x3a2414,roughness:.7}),wood:new THREE.MeshStandardMaterial({color:HEM.wood,roughness:.6}),
  steel:new THREE.MeshStandardMaterial({color:HEM.steel,metalness:.9,roughness:.3}),rust:new THREE.MeshStandardMaterial({color:HEM.rust,metalness:.6,roughness:.7}),
  feather:new THREE.MeshStandardMaterial({color:0xe8e0d0,roughness:.8,side:THREE.DoubleSide}),featherD:new THREE.MeshStandardMaterial({color:0x2a2a22,roughness:.8,side:THREE.DoubleSide}),
  string:new THREE.MeshBasicMaterial({color:0xd8d0b8}),meat:new THREE.MeshStandardMaterial({color:0x8a1a22,roughness:.35}),eye:new THREE.MeshBasicMaterial({color:HEM.a})};
HEM_M.eye.color.multiplyScalar(2);
const HEM_G={shaft:(()=>{const g=new THREE.CylinderGeometry(.011,.011,.8,6);g.rotateX(Math.PI/2);return g;})(),head:(()=>{const g=new THREE.ConeGeometry(.032,.12,4);g.rotateX(Math.PI/2);return g;})(),
  fl:(()=>{const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.13,0);s.lineTo(.03,.045);s.lineTo(0,.045);s.lineTo(0,0);const g=new THREE.ShapeGeometry(s);g.rotateY(-Math.PI/2);return g;})(),
  bulb:new THREE.SphereGeometry(.045,10,8),can:(()=>{const g=new THREE.CylinderGeometry(.04,.04,.12,10);g.rotateX(Math.PI/2);return g;})(),barb:(()=>{const g=new THREE.ConeGeometry(.02,.07,4);return g;})()};
// an arrow along +z (tip at +z), coloured by type
const HEM_TM={};
function hemArrowMesh(type,scale){const g=new THREE.Group(),tc=HEM_ARR_C[type]||0xffffff;
  g.add(new THREE.Mesh(HEM_G.shaft,HEM_M.wood));const hd=new THREE.Mesh(HEM_G.head,HEM_M.steel);hd.position.z=.44;g.add(hd);
  for(let i=0;i<3;i++){const f=new THREE.Mesh(HEM_G.fl,i?HEM_M.feather:HEM_M.featherD);f.position.z=-.4;f.rotation.z=i*Math.PI*2/3;g.add(f);}
  const mat=HEM_TM[type]||(HEM_TM[type]=new THREE.MeshStandardMaterial({color:tc,emissive:tc,emissiveIntensity:.9,roughness:.4}));
  if(type==='gas'){const b=new THREE.Mesh(HEM_G.bulb,mat);b.position.z=.33;b.scale.set(1,1,1.4);g.add(b);}
  else if(type==='boom'){const b=new THREE.Mesh(HEM_G.can,mat);b.position.z=.3;g.add(b);}
  else if(type==='barb'){for(let i=0;i<4;i++){const b=new THREE.Mesh(HEM_G.barb,HEM_M.steel);b.position.set(Math.cos(i*Math.PI/2)*.03,Math.sin(i*Math.PI/2)*.03,.36);b.rotation.set(Math.PI/2+.5*Math.sin(i*Math.PI/2),0,-.5*Math.cos(i*Math.PI/2));g.add(b);}
    const r=new THREE.Mesh(HEM_G.bulb,mat);r.scale.set(.5,.5,.5);r.position.z=.3;g.add(r);}
  if(scale)g.scale.setScalar(scale);return g;}
function hemTrapMesh(){const g=new THREE.Group(),m=HEM_M.rust,s=HEM_M.steel;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.04,14),HEM_M.rust);base.position.y=.02;g.add(base);
  const jaws=[];[-1,1].forEach(side=>{const j=new THREE.Group();j.position.y=.04;g.add(j);
    const arc=new THREE.Mesh(new THREE.TorusGeometry(.32,.022,6,20,Math.PI),m);arc.rotation.x=-Math.PI/2;j.add(arc);
    for(let i=1;i<10;i++){const a=i/10*Math.PI,t=new THREE.Mesh(new THREE.ConeGeometry(.024,.08,4),s);t.position.set(Math.cos(a)*.32,.035,-Math.sin(a)*.32);j.add(t);}
    j.userData.side=side;j.rotation.y=side>0?0:Math.PI;jaws.push(j);});
  const pl=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.02,12),s);pl.position.y=.06;g.add(pl);
  const ch=new THREE.Mesh(new THREE.TorusGeometry(.05,.01,4,10),s);ch.position.set(.45,.02,0);ch.rotation.x=Math.PI/2;g.add(ch);
  const stake=new THREE.Mesh(new THREE.CylinderGeometry(.015,.005,.2,6),s);stake.position.set(.55,.06,0);g.add(stake);
  g.userData.jaws=jaws;hemJaws(g,0);return g;}
// k: 0 = open (jaws flat out), 1 = snapped shut
function hemJaws(g,k){g.userData.jaws.forEach(j=>{j.rotation.order='YXZ';j.rotation.set(k*Math.PI/2*.97,j.userData.side>0?0:Math.PI,0);});}
const _hemBR=buildRig;
buildRig=function(h){if(!h||!isHem({hero:h}))return _hemBR.apply(this,arguments);
  // always the outfit (never an armoured suit): the ARMOR toggle passes armor:true, which would skip the costume
  const a=[].slice.call(arguments);a[0]=Object.assign({},h,{human:true,armor:false});const R=_hemBR.apply(this,a);
  try{hemDress(R);}catch(e){console.warn('hemlock look',e);}return R;};
function hemDress(R){const sp=R.spine;
  // quiver on the back, arrows sticking out
  const q=new THREE.Group();q.position.set(.1,.42,-.21);q.rotation.set(.25,0,-.42);sp.add(q);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.56,12,1,true),HEM_M.leather);body.material.side=THREE.DoubleSide;q.add(body);
  const bot=new THREE.Mesh(new THREE.CircleGeometry(.06,12),HEM_M.leather);bot.rotation.x=Math.PI/2;bot.position.y=-.28;q.add(bot);
  [.18,-.12].forEach(y=>{const b=new THREE.Mesh(new THREE.TorusGeometry(.072,.008,4,16),HEM_M.steel);b.rotation.x=Math.PI/2;b.position.y=y;q.add(b);});
  for(let i=0;i<7;i++){const ar=new THREE.Group();ar.add(new THREE.Mesh(HEM_G.shaft,HEM_M.wood));for(let k=0;k<3;k++){const f=new THREE.Mesh(HEM_G.fl,k?HEM_M.feather:HEM_M.featherD);f.position.z=-.4;f.rotation.z=k*2.1;ar.add(f);}
    ar.rotation.x=Math.PI/2;ar.position.set(Math.cos(i*2.4)*.035,.1+i%3*.02,Math.sin(i*2.4)*.035);ar.rotation.z=(i-3)*.04;q.add(ar);}
  // gut knife in a sheath on the right hip; the knife itself lives in his hand during the stab
  const sh=new THREE.Mesh(new THREE.BoxGeometry(.05,.22,.08),HEM_M.leather);sh.position.set(.2,-.12,.06);sh.rotation.z=.25;R.hips.add(sh);
  const kh=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.11,8),HEM_M.wood);kh.position.set(.22,.02,.06);kh.rotation.z=.25;R.hips.add(kh);
  const knife=new THREE.Group();const bl=new THREE.Mesh(new THREE.BoxGeometry(.006,.26,.045),HEM_M.steel);bl.position.y=.16;knife.add(bl);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.024,.06,3),HEM_M.steel);tip.position.y=.31;tip.scale.z=.2;knife.add(tip);knife.add(new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.11,8),HEM_M.wood));
  knife.rotation.x=Math.PI/2;knife.position.set(0,-.03,.02);knife.visible=false;R.rF.add(knife);R.hemKnife=knife;
  const chunk=new THREE.Mesh(new THREE.DodecahedronGeometry(.07,0),HEM_M.meat);chunk.scale.set(1.2,.8,1);chunk.position.set(0,-.06,.05);chunk.visible=false;R.rF.add(chunk);R.hemChunk=chunk;
  // a spare trap hanging off the belt
  const tr=hemTrapMesh();hemJaws(tr,1);tr.scale.setScalar(.45);tr.rotation.set(Math.PI/2,0,.3);tr.position.set(-.24,-.12,.02);R.hips.add(tr);
  // eyes glow through the shadow of the hood
  [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),HEM_M.eye);e.position.set(s*.042,.125,.135);R.head.add(e);});
  // find the bow (gear.js put it in the left hand) for the drawn string and the nocked arrow
  R.lF.traverse(o=>{if(!R.hemBow&&o.isMesh&&o.geometry&&o.geometry.type==='TorusGeometry')R.hemBow=o.parent;});
  if(R.hemBow){R.hemBow.rotation.set(0,0,0);R.hemBow.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3(0,-1,0),new V3(0,0,1),new V3(-1,0,0)));R.hemBow.position.set(0,-.1,0);}
  if(R.hemBow){R.hemBow.children.forEach(c=>{if(c.geometry&&c.geometry.type==='CylinderGeometry')R.hemStr0=c;});
    const sg=new THREE.CylinderGeometry(.004,.004,1,4);sg.translate(0,.5,0);R.hemStr=[new THREE.Mesh(sg,HEM_M.string),new THREE.Mesh(sg,HEM_M.string)];R.hemStr.forEach(m=>{m.visible=false;R.hemBow.add(m);});
    R.hemNock=hemArrowMesh('barb');R.hemNock.visible=false;R.hemBow.add(R.hemNock);}}

/* ---------- animations: new poses ---------- */
Object.assign(POSES,{
  hemIdle:b_({hy:-.06,sx:.14,sy:-.12,hd:-.06,lSx:-.45,lSz:.16,lE:-.35,rSx:-.2,rSz:-.2,rE:-.55,lHx:-.22,lK:.28,rHx:.12,rK:.2,lHz:.06,rHz:-.06}),
  hemDraw:b_({hy:-.08,sx:.06,sy:-.78,hd:-.04,lSx:-1.52,lSz:.06,lE:-.06,rSx:-1.38,rSz:-.42,rE:-2.2,lHx:-.3,lK:.36,rHx:.22,rK:.24,lHz:.1,rHz:-.12}),
  hemFull:b_({hy:-.13,sx:.08,sy:-.9,hd:-.05,lSx:-1.56,lSz:.04,lE:0,rSx:-1.5,rSz:-.62,rE:-2.6,lHx:-.48,lK:.58,rHx:.34,rK:.34,lHz:.12,rHz:-.16}),
  hemAim:b_({hy:-.08,sx:.06,sy:-.82,hd:-.05,lSx:-1.54,lSz:.05,lE:-.03,rSx:-1.45,rSz:-.5,rE:-2.42,lHx:-.3,lK:.36,rHx:.22,rK:.24}),
  hemLoose:b_({hy:-.08,sx:.02,sy:-.7,hd:-.02,lSx:-1.5,lSz:.08,lE:-.08,rSx:-1.15,rSz:-1.05,rE:-.75,lHx:-.3,lK:.36,rHx:.22,rK:.24,lHz:.1,rHz:-.12}),
  hemReach:b_({hy:-.06,sx:.1,sy:-.35,hd:.05,lSx:-1.05,lSz:.12,lE:-.45,rSx:-2.75,rSz:-.15,rE:-2.5,lHx:-.25,lK:.3,rHx:.18,rK:.22}),
  hemThrowW:b_({hy:-.1,sx:-.08,sy:.55,hd:-.1,rSx:.75,rSz:-.35,rE:-1.1,lSx:-1.25,lSz:.3,lE:-.3,lHx:-.4,lK:.45,rHx:.3,rK:.3}),
  hemThrowH:b_({hy:-.12,sx:.28,sy:-.45,hd:-.05,rSx:-1.85,rSz:-.15,rE:-.08,lSx:.35,lSz:.45,lE:-.6,lHx:-.55,lK:.6,rHx:.42,rK:.25}),
  hemToss:b_({hy:-.3,sx:.45,sy:.15,hd:.05,rSx:-.9,rSz:-.15,rE:-.15,lSx:-.4,lSz:.3,lE:-.7,lHx:-.95,lK:1.4,rHx:-.2,rK:.9}),
  hemZip:b_({hy:0,sx:.42,sy:.25,hd:-.35,rSx:-2.7,rSz:-.08,rE:-.08,lSx:.45,lSz:.5,lE:-.6,lHx:-1.05,lK:1.5,rHx:-.35,rK:.9}),
  hemKick:b_({sx:-.38,sy:-.3,hd:-.1,rHx:-1.75,rHz:-.12,rK:.05,lHx:.2,lK:.35,lSx:-.5,lSz:.95,lE:-.6,rSx:.35,rSz:-.85,rE:-.4}),
  hemScan:b_({hy:-.2,sx:.3,sy:.15,hd:-.12,rSx:-2.3,rSz:-.3,rE:-2.4,lSx:-.45,lSz:.25,lE:-.4,lHx:-.55,lK:.75,rHx:.25,rK:.5}),
  hemStabW:b_({hy:-.12,sx:.12,sy:-.6,hd:-.08,rSx:.3,rSz:-.3,rE:-1.95,lSx:-1.25,lSz:.2,lE:-1.2,lHx:-.45,lK:.55,rHx:.3,rK:.35}),
  hemStabH:b_({hy:-.2,sx:.32,sy:.62,hd:-.05,rSx:-1.62,rSz:-.05,rE:-.04,lSx:-.6,lSz:.55,lE:-1.2,lHx:-.8,lK:.85,rHx:.5,rK:.2}),
  hemRip:b_({hy:-.14,sx:-.12,sy:-.55,hd:.1,rSx:-.55,rSz:-.25,rE:-1.9,lSx:-1.35,lSz:.15,lE:-.2,lHx:-.4,lK:.5,rHx:.3,rK:.3}),
  hemEat:b_({hy:-.16,sx:.38,sy:.1,hd:.32,rSx:-1.95,rSz:-.02,rE:-2.62,lSx:-.75,lSz:.22,lE:-1.5,lHx:-.4,lK:.5,rHx:.25,rK:.4}),
  hemHowl:b_({hy:-.1,sx:-.28,sy:0,hd:-.5,lSx:-2.95,lSz:.12,lE:-.15,rSx:-2.7,rSz:-.1,rE:-.5,lHx:-.4,lK:.45,rHx:.3,rK:.3}),
  hemSky:b_({hy:-.14,sx:-.4,sy:-.6,hd:-.65,lSx:-2.75,lSz:.06,lE:-.05,rSx:-2.55,rSz:-.4,rE:-2.3,lHx:-.4,lK:.5,rHx:.3,rK:.3})});
const HEM_DRAWN={hemDraw:.75,hemFull:1,hemAim:.9,hemSky:.95};
const _hemTP=Fighter.prototype.targetPose;
Fighter.prototype.targetPose=function(dt){const P=_hemTP.apply(this,arguments);if(!isHem(this))return P;const s=this.state,t=this.stateT;let key=null;
  if(s==='attack'&&this.move&&this.move.hem){const M=this.move;if(M.hold&&!this.relH)key='hemFull';else if(t>M.st+M.ac+M.rc*.3&&t<M.st+M.ac+M.rc*.9)key='hemReach';}
  this._hemKey=key||(s==='attack'||s==='special'||s==='ult'?this.poseKey:null);
  if(key)return POSES[key];
  if((hemAimOn(this)||this.hemAimT>game.time)&&['idle','run','air'].indexOf(s)>=0){const Q=Object.assign({},P),A=POSES.hemAim;['sx','sy','sz','hd','lSx','lSz','lE','rSx','rSz','rE'].forEach(k=>Q[k]=A[k]);this._hemKey='hemAim';return Q;}
  if(s==='idle'&&!this.locked){const Q=Object.assign({},POSES.hemIdle);Q.hy+=Math.sin(game.time*2.1)*.018;Q.hd+=Math.sin(game.time*.7)*.05;return Q;}
  return P;};
// after posing: the bowstring is pulled back to the drawing hand, with an arrow nocked on it
const _hemAP=Fighter.prototype.applyPose;
Fighter.prototype.applyPose=function(dt){const r=_hemAP.apply(this,arguments);if(!isHem(this))return r;const R=this.rig;if(!R||!R.hemBow||!R.hemStr)return r;
  const k=HEM_DRAWN[this._hemKey]||0,B=R.hemBow;
  if(k>0&&!this.dead){B.updateMatrixWorld(true);const hand=limbPos(this,'r',new V3());const n=B.worldToLocal(hand);n.x=clamp(n.x,-.75,-.1);n.y=clamp(n.y,-.25,.25);n.z=clamp(n.z,-.25,.25);
    [[-.08,.5,0],[-.08,-.5,0]].forEach(([x,y,z],i)=>{const m=R.hemStr[i],d=new V3(n.x-x,n.y-y,n.z-z),L=d.length();m.position.set(x,y,z);m.scale.set(1,L,1);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());m.visible=true;});
    if(R.hemStr0)R.hemStr0.visible=false;const A=R.hemNock;A.visible=true;A.position.copy(n);const dir=new V3(.42,0,0).sub(n).normalize();A.quaternion.setFromUnitVectors(new V3(0,0,1),dir);A.position.addScaledVector(dir,.4);
    const ty=hemType(this);if(A.userData.ty!==ty){A.userData.ty=ty;B.remove(A);R.hemNock=hemArrowMesh(ty);R.hemNock.userData.ty=ty;B.add(R.hemNock);}}
  else{R.hemStr.forEach(m=>m.visible=false);if(R.hemStr0)R.hemStr0.visible=true;if(R.hemNock)R.hemNock.visible=false;}
  if(R.hemKnife)R.hemKnife.visible=!!(this.state==='special'&&this.vf&&this.vf.knife);
  if(R.hemChunk)R.hemChunk.visible=!!(this.state==='special'&&this.vf&&this.vf.chunkV);
  return r;};

/* ---------- switching arrows (X) ---------- */
function hemCycle(f,say){const i=((f.hemA|0)+1)%3;if(say)netSay({k:'harr',id:f.id,a:i});else f.hemA=i;}
onEv('x:harr',e=>{const f=byFid(e.id);if(!f)return;f.hemA=e.a|0;if(f===ME){announceSmall('ARROWS: '+HEM_ARR_N[hemType(f)]);AU.scale=.6;AU.tone('square',520+e.a*140,700+e.a*140,.06,.05);AU.scale=1;}
  else if(nearCam(f.pos,30)){xSnd(f.pos,()=>AU.tone('triangle',800,900,.04,.04));}});
addEventListener('keydown',e=>{if(e.repeat||!inMatch()||paused||!ME||ME.dead||!isHem(ME))return;if(e.target&&e.target.tagName==='INPUT')return;
  const c=typeof mapKey==='function'?mapKey(e.code):e.code;if(c==='KeyX')hemCycle(ME,true);});
onEv('matchStart',()=>{FS.forEach(f=>{f.hemA=2;f.hemBleed=null;f.hemHem=null;f.hemTrap=null;f.hemRevealT=0;f.hemUlt=0;});});
// HUD: which arrow is loaded
onEv('tick',()=>{const el=document.getElementById('hemHud');if(!ME||!isHem(ME)||!inMatch()){if(el)el.style.display='none';return;}
  let e=el;if(!e){e=document.createElement('div');e.id='hemHud';e.style.cssText='position:fixed;left:50%;top:64px;transform:translateX(-50%);font:700 12px/1 system-ui,sans-serif;color:#e8e4d0;background:rgba(20,24,12,.7);padding:6px 10px;border-radius:8px;letter-spacing:.06em;pointer-events:none;z-index:20;display:flex;gap:8px;align-items:center';document.body.appendChild(e);}
  const ty=hemType(ME),tr=HEM_TRAPS.filter(T=>T.f===ME).length,s='ARROWS ['+(typeof keyName==='function'?keyName('arrow')||'X':'X')+']'+HEM_ARR.map(a=>`<span style="padding:2px 6px;border-radius:5px;${a===ty?`background:#${HEM_ARR_C[a].toString(16).padStart(6,'0')};color:#111`:'opacity:.5'}">${HEM_ARR_N[a]}</span>`).join('')+` · TRAPS OUT ${tr}`+(ME.hemUlt>game.time?' · <b style="color:#ff5a3a">THE LAST HUNT</b>':'');
  if(e._s!==s){e._s=s;e.innerHTML=s;}e.style.display='flex';});

/* ---------- arrows in flight ---------- */
const HEM_P=[],HEM_STUCK=[];
function hemShoot(f,from,dir,o){const ty=o.type||hemType(f),m=hemArrowMesh(ty,o.full?1.15:1);m.position.copy(from);scene.add(m);
  const P={f,m,pos:from.clone(),vel:dir.clone().normalize().multiplyScalar(o.speed||(o.full?78:62)),type:ty,full:!!o.full,dmg:o.dmg||5,t:0,grav:o.grav!=null?o.grav:(o.full?4:7),hit:new Set(),kb:o.kb||1.5,rain:!!o.rain};
  HEM_P.push(P);if(HEM_P.length>90){const q=HEM_P.shift();scene.remove(q.m);}return P;}
function hemStick(P,p,dir,parent){const m=P.m;HEM_P.splice(HEM_P.indexOf(P),1);m.position.copy(p).addScaledVector(dir,-.25);m.quaternion.setFromUnitVectors(new V3(0,0,1),dir);
  if(parent){parent.updateMatrixWorld(true);parent.attach(m);}HEM_STUCK.push({m,t:0,life:parent?5:9,parent});if(HEM_STUCK.length>60){const o=HEM_STUCK.shift();if(o.m.parent)o.m.parent.remove(o.m);}}
function hemImpact(P,p,o){const f=P.f,full=P.full,host=NET.role!=='client',ty=P.type;
  if(ty==='gas')hemGas(f,p,full?3.6:1.9,full?5:2.2,full);
  else if(ty==='boom'){const R=full?3.6:1.7;if(nearCam(p,80)){if(full)explosion(p,R,[0xff7a1a,0xffd04a],true);else{burst(ADD,p,30,{colors:[0xff7a1a,0xffd04a,0xffffff],speed:6,life:.35,size:.35,size1:0,bright:2.4});ring(p.clone(),0xff7a1a,R*1.3,.3,false,2.4);shake(.2,p);}
      xSnd(p,()=>{AU.boom&&AU.boom(!!full);});}
    if(host)for(const q of FS){if(q.dead||q.dormant||ally(q,f))continue;const d=q.chest(TMP).distanceTo(p);if(d<R+.4){const k=1-d/(R+.5);hitO(f,q,{dmg:(full?10:3)*Math.max(.35,k),kb:full?11:4,up:full?7:2,stun:.4,launch:full,heavy:full,pt:q.chest(new V3())});}}
    if(full&&typeof crater==='function'&&p.y<gndY(p)+.6)crater(p.x,p.z,1.1,gndY(p));
    if(typeof NPC!=='undefined'&&NPC.length&&typeof npcArea==='function')npcArea(p,R,f,full?30:10,full);}
  else if(ty==='barb'&&o&&host)hemBleed(o,f,full?2:1);}
function hemTick(dt){for(let i=HEM_P.length-1;i>=0;i--){const P=HEM_P[i];if(!P)continue;P.t+=dt;const prev=P.pos.clone();P.vel.y-=P.grav*dt;P.pos.addScaledVector(P.vel,dt);
    const dir=P.vel.clone().normalize();P.m.position.copy(P.pos);P.m.quaternion.setFromUnitVectors(new V3(0,0,1),dir);
    if(Math.random()<.5&&nearCam(P.pos,60))burst(ADD,P.pos,1,{colors:[HEM_ARR_C[P.type],0xffffff],speed:.2,life:.18,size:P.full?.22:.14,size1:0,bright:1.6});
    // fighters along the stretch flown this frame
    let hitF=null,bt=2;for(const o of FS){if(o===P.f||o.dead||o.dormant||ally(o,P.f)||P.hit.has(o))continue;const c=o.chest(TMP2),seg=P.pos.clone().sub(prev),L2=seg.lengthSq()||1e-6;
      let k=((c.x-prev.x)*seg.x+(c.y-prev.y)*seg.y+(c.z-prev.z)*seg.z)/L2;k=clamp(k,0,1);const qx=prev.x+seg.x*k-c.x,qy=prev.y+seg.y*k-c.y,qz=prev.z+seg.z*k-c.z;
      if(qx*qx+qy*qy*.35+qz*qz<.36&&k<bt){bt=k;hitF=o;}}
    if(hitF){const o=hitF,p=prev.clone().lerp(P.pos,bt);P.hit.add(o);
      if(NET.role!=='client'&&!(o.invuln>0&&o.state!=='framed')){hitO(P.f,o,{dmg:P.dmg,kb:P.kb,up:P.full?3:0,stun:P.full?.5:.3,launch:P.full&&P.dmg>14,heavy:P.full,pt:p.clone()});}
      if(typeof bloodBurst==='function'&&typeof goreOn==='function'&&goreOn()&&nearCam(p,60))bloodBurst(p,P.full?18:8,4);
      hemImpact(P,p,o);if(P.type==='barb'&&o.rig&&o.rig.spine)hemStick(P,p,dir,o.rig.spine);else{scene.remove(P.m);HEM_P.splice(i,1);}continue;}
    const g=gndY(P.pos);
    if(segBld(P.pos,P.vel,dt,0)||P.pos.y<g){if(P.pos.y<g)P.pos.y=g+.02;hemImpact(P,P.pos.clone(),null);xSnd(P.pos,()=>AU.noise(.05,.2,'bandpass',1800,900,3));hemStick(P,P.pos.clone(),dir,null);continue;}
    if(P.t>3.2||Math.abs(P.pos.x)>BOUND+30||Math.abs(P.pos.z)>BOUND+30){scene.remove(P.m);HEM_P.splice(i,1);}}
  for(let i=HEM_STUCK.length-1;i>=0;i--){const S=HEM_STUCK[i];S.t+=dt;if(S.t>S.life||(S.parent&&!S.parent.parent)){if(S.m.parent)S.m.parent.remove(S.m);HEM_STUCK.splice(i,1);}}}
// the bow: every shot move (J / K) fires arrows instead of the generic weapon bolt
const _hemGS=gearShot;
gearShot=function(f,M){if(!isHem(f)||!M.hem)return _hemGS.apply(this,arguments);
  const c=limbPos(f,'l',new V3());c.y=Math.max(c.y,f.pos.y+1.25);let d=f.fwd().clone();
  if(f===ME&&typeof shoulderCam==='function'&&shoulderCam()&&typeof aimDir==='function'&&!f.hardLock)d=aimDir(c);
  // bots (and players without the shoulder camera) lead their target a little
  if(!(f===ME&&typeof shoulderCam==='function'&&shoulderCam())){const T=tgtOf(f,60);if(T){const tc=T.chest(new V3()),dist=tc.distanceTo(c);tc.addScaledVector(T.vel,dist/62*.8);tc.y+=dist*dist*.0009;d=tc.sub(c).normalize();}}
  const full=!!M.hold,ck=full?(f.chgK||1):1,ult=f.hemUlt>game.time,n=(M.hem===2?2:1)*(ult?3:1),side=new V3(d.z,0,-d.x).normalize();
  for(let i=0;i<n;i++){const off=n>1?(i-(n-1)/2)*(ult?.07:.05):0,dd=d.clone().addScaledVector(side,off).normalize();
    hemShoot(f,c.clone().addScaledVector(dd,.3),dd,{full:full&&ck>1.25,dmg:M.dmg*ck*(ult?1.2:1)/(M.hem===2?1.3:1),kb:M.kb*(full?Math.sqrt(ck):1),speed:full?60+ck*14:62});}
  burst(ADD,c,full?12:5,{colors:[HEM_ARR_C[hemType(f)],0xffffff],speed:full?4:2,life:.18,size:.22,size1:0,bright:2.2});
  sndHere(f,()=>{AU.noise(.08,full?.5:.3,'bandpass',1200,500,3);AU.tone('triangle',full?180:240,full?90:140,.08,full?.12:.07);});
  if(f.isBot&&Math.random()<.18&&NET.role!=='client')hemCycle(f,true);};
Object.assign(MOVES,{
  hem_A:{st:.12,ac:.08,rc:.22,dmg:5,rng:1.6,kb:1.5,up:0,stun:.3,lunge:0,next:'hem_B',w:'hemDraw',h:'hemLoose',limb:'l',shot:1,hem:1},
  hem_B:{st:.12,ac:.08,rc:.22,dmg:5,rng:1.6,kb:1.5,up:0,stun:.3,lunge:0,next:'hem_C',w:'hemDraw',h:'hemLoose',limb:'l',shot:1,hem:1},
  hem_C:{st:.18,ac:.1,rc:.34,dmg:8,rng:1.6,kb:6,up:2,stun:.45,lunge:-2,w:'hemDraw',h:'hemLoose',limb:'l',shot:1,hem:2},
  hem_H:{st:.3,ac:.12,rc:.42,dmg:12,rng:1.6,kb:9,up:3,stun:.5,lunge:-1,heavy:true,hold:true,w:'hemFull',h:'hemLoose',limb:'l',shot:2,hem:3},
  // heavy tapped instead of held: a quick power shot
  hem_HT:{st:.2,ac:.1,rc:.34,dmg:9,rng:1.6,kb:6,up:2,stun:.45,lunge:-1,heavy:true,w:'hemDraw',h:'hemLoose',limb:'l',shot:2,hem:4}});
['hem_A','hem_B','hem_C','hem_H','hem_HT'].forEach(k=>MOVEK.push(k));
const _hemDH=dirHeavy;dirHeavy=function(f){return isHem(f)?'hem_HT':_hemDH.apply(this,arguments);};
const _hemLM=Fighter.prototype.lightMove,_hemHM=Fighter.prototype.heavyMove;
Fighter.prototype.lightMove=function(){return isHem(this)?'hem_A':_hemLM.call(this);};
Fighter.prototype.heavyMove=function(){return isHem(this)?'hem_H':_hemHM.call(this);};

/* ---------- gas clouds, bleeding, hemorrhage ---------- */
const HEM_GAS=[],HEM_DISC=new THREE.CircleGeometry(1,28);HEM_DISC.rotateX(-Math.PI/2);
function hemGas(f,p,R,dur,full){const q=p.clone();q.y=gndY(q)+.05;const m=new THREE.Mesh(HEM_DISC,new THREE.MeshBasicMaterial({color:0x6ac83a,transparent:true,opacity:.28,depthWrite:false}));m.scale.setScalar(R);m.position.copy(q);scene.add(m);
  HEM_GAS.push({f,p:q,R,t:0,dur,tick:0,full,m});xSnd(q,()=>AU.noise(.6,.25,'lowpass',900,300,1));if(HEM_GAS.length>16){const o=HEM_GAS.shift();scene.remove(o.m);}}
function hemBleed(o,f,n){const B=o.hemBleed&&o.hemBleed.t>0?o.hemBleed:(o.hemBleed={n:0,t:0,src:f,tick:0});B.n=Math.min(3,B.n+n);B.t=5;B.src=f;if(o===ME)announceSmall('🩸 BLEEDING ×'+B.n);}
function hemHemorrhage(o,f){o.hemHem={t:6,src:f,tick:0};o.slowT=Math.max(o.slowT||0,2.5);if(o===ME)announceSmall('🩸 HEMORRHAGE');}
function hemDot(o,src,dmg){if(NET.role==='client'||o.dead)return;if(typeof healLocked==='function'){}o.hp-=dmg*(o.take||1);o.lastHitBy=src;o.lastHitT=game.time;if(o.hp<=0&&!o.dead)killFighter(o,src,new V3(0,0,0));}
function hemStatusTick(dt){
  for(let i=HEM_GAS.length-1;i>=0;i--){const G=HEM_GAS[i];G.t+=dt;if(G.t>G.dur||!inMatch()){scene.remove(G.m);HEM_GAS.splice(i,1);continue;}const fade=Math.min(1,(G.dur-G.t)/.8);G.m.material.opacity=.28*fade;
    if(nearCam(G.p,70)){const n=G.full?3:1;for(let k=0;k<n;k++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*G.R;burst(SMK,TMP2.set(G.p.x+Math.cos(a)*r,G.p.y+rand(.1,1.4),G.p.z+Math.sin(a)*r),1,{colors:[0x7ac83a,0x5a9a2a,0xa8e05a],speed:.4,up:.5,life:1.6,size:.8,size1:1.8*fade,drag:1,grav:-.2});}}
    G.tick-=dt;if(G.tick<=0){G.tick=.5;for(const o of FS){if(o.dead||o.dormant||ally(o,G.f)||o===G.f)continue;if(Math.hypot(o.pos.x-G.p.x,o.pos.z-G.p.z)<G.R&&Math.abs(o.pos.y-G.p.y)<2.4){hemDot(o,G.f,G.full?2.2:1);o.slowT=Math.max(o.slowT||0,1.2);
          if(o===ME&&!G.warn){G.warn=1;announceSmall('☁ TOXIC GAS');}}}}}
  for(const o of FS){if(o.dead)continue;
    const B=o.hemBleed;if(B&&B.t>0){B.t-=dt;B.tick-=dt;if(B.tick<=0){B.tick=.5;hemDot(o,B.src,.6*B.n);}if(Math.random()<.25*B.n&&nearCam(o.pos,50))burst(SMK,o.chest(TMP2).add(TMP.set(rand(-.15,.15),rand(-.3,.1),rand(-.15,.15))),1,{colors:[0x8a0010,0xb0141e],speed:.4,life:.6,size:.06,size1:.04,grav:12});}
    const H=o.hemHem;if(H&&H.t>0){H.t-=dt;H.tick-=dt;if(H.tick<=0){H.tick=.5;hemDot(o,H.src,1.2);o.slowT=Math.max(o.slowT||0,.6);}
      if(Math.random()<.7&&nearCam(o.pos,50)){burst(SMK,o.chest(TMP2).add(TMP.set(rand(-.15,.15),rand(-.4,0),rand(-.15,.15))),2,{colors:[0x9a0a18,0x6a0008],speed:.9,life:.7,size:.07,size1:.05,grav:13});
        if(Math.random()<.08&&typeof bloodDecal==='function')bloodDecal(o.pos.x+rand(-.3,.3),o.pos.z+rand(-.3,.3),o.pos.y,rand(.15,.3),false);}}}}

/* ---------- 1 GRAPPLE (tap) / REEL (hold) ---------- */
const HEM_ROPE=new THREE.MeshBasicMaterial({color:0x3a3024}),HEM_ROPEG=(()=>{const g=new THREE.CylinderGeometry(.012,.012,1,5);g.translate(0,.5,0);return g;})();
function hemRope(V,from,to){if(!V.rope){V.rope=new THREE.Mesh(HEM_ROPEG,HEM_ROPE);scene.add(V.rope);V.hook=new THREE.Group();const h=new THREE.Mesh(new THREE.ConeGeometry(.05,.16,4),HEM_M.steel);h.rotation.x=Math.PI/2;V.hook.add(h);
    for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.TorusGeometry(.06,.01,4,8,Math.PI),HEM_M.steel);c.rotation.set(0,i*2.1,Math.PI/2);c.position.z=-.04;V.hook.add(c);}scene.add(V.hook);}
  const d=to.clone().sub(from),L=Math.max(.01,d.length());V.rope.position.copy(from);V.rope.scale.set(1,L,1);V.rope.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());V.hook.position.copy(to);V.hook.quaternion.setFromUnitVectors(new V3(0,0,1),d);}
function hemRopeEnd(V){if(V&&V.rope){scene.remove(V.rope);scene.remove(V.hook);V.rope=null;}}
// where he's aiming: the crosshair for the player, the target (or straight ahead) for bots
function hemAimPoint(f,maxD){const c=f.chest(new V3());
  if(f===ME&&typeof shoulderCam==='function'&&shoulderCam()&&typeof AIM!=='undefined'&&AIM){const T=AIM.tgt&&!AIM.tgt.dead&&!ally(AIM.tgt,f)?AIM.tgt:null;const p=AIM.pt.clone();return {p,T,far:c.distanceTo(p)>maxD};}
  const T=tgtOf(f,maxD);if(T){faceTo(f,T);return {p:T.chest(new V3()),T,far:false};}
  const fw=f.fwd(),L=clearLen(f.pos,fw,maxD,c.y);return {p:c.clone().addScaledVector(fw,L),T:null,far:L>=maxD-.6};}
SPECIALS.hemgrap=function(f,dt){const V=f.vf,t=f.stateT;
  if(!V.go){if(t<.16){f.poseKey='hemThrowW';return 10;}
    V.go=1;const A=hemAimPoint(f,36);V.T=A.T;V.to=A.p;V.far=A.far;const c=limbPos(f,'r',new V3());if(V.far)V.to=c.clone().add(V.to.clone().sub(c).setLength(36));
    f.face=Math.atan2(V.to.x-f.pos.x,V.to.z-f.pos.z);V.hp=c.clone();V.hs=0;xSnd(f.pos,()=>{AU.noise(.12,.35,'bandpass',2400,600,2);AU.tone('square',300,600,.06,.04);});}
  const hand=limbPos(f,'r',new V3());
  if(!V.hit){f.poseKey='hemThrowH';const to=V.T&&!V.T.dead?V.T.chest(new V3()):V.to,d=to.clone().sub(V.hp),L=d.length(),st=80*dt;
    if(L<=st){V.hp.copy(to);V.hit=1;V.t1=t;
      if(V.far&&!V.T){V.miss=1;}else{xSnd(to,()=>{AU.noise(.06,.4,'highpass',1500,3000,1);AU.tone('square',900,500,.05,.05);});burst(ADD,to,8,{colors:[0xffffff,HEM.a],speed:3,life:.2,size:.15,size1:0,bright:2});
        if(V.T&&NET.role!=='client')hitO(f,V.T,{dmg:4,kb:0,up:0,stun:.7});}}
    else V.hp.addScaledVector(d.normalize(),st);
    hemRope(V,hand,V.hp);if(t>1.1){hemRopeEnd(V);endAt(f,0);}return 10;}
  if(V.miss){const k=(t-V.t1)/.3;V.hp.lerp(hand,Math.min(1,k));hemRope(V,hand,V.hp);if(k>=1){hemRopeEnd(V);f.set(f.onGround?'idle':'air');}return 10;}
  const tgt=V.T&&!V.T.dead?V.T.chest(new V3()):V.to;hemRope(V,hand,tgt);
  // REEL (held): pull them in instead of going to them
  if(f.specVar==='chg'&&V.T){f.poseKey='hemRip';f.vel.set(0,f.vel.y,0);if(NET.role!=='client'&&!V.T.dead){const d=f.pos.clone().sub(V.T.pos);d.y=0;const L=d.length();
      if(L>1.6){d.normalize();V.T.vel.set(d.x*22,Math.max(V.T.vel.y,2),d.z*22);if(V.T.state!=='hit'&&V.T.state!=='fly')V.T.set('hit');V.T.stunT=Math.max(V.T.stunT||0,.4);}
      else if(!V.done){V.done=1;hitO(f,V.T,{dmg:6,kb:2,up:0,stun:.9});}}
    if(t-V.t1>.7||V.done){hemRopeEnd(V);f.set(f.onGround?'idle':'air');}return 10;}
  // zip to the hook
  f.poseKey=V.T?'hemZip':'hemZip';const d=tgt.clone().sub(f.chest(new V3())),L=d.length(),stopAt=V.T?1.5:1.1;
  if(L<stopAt||t-V.t1>1.4||(V.lastL!=null&&V.lastL-L<.02&&t-V.t1>.15)){hemRopeEnd(V);
    if(V.T&&!V.T.dead&&L<3.2){f.poseKey='hemKick';if(NET.role!=='client')hitO(f,V.T,{dmg:10,kb:11,up:5,stun:.6,launch:true,heavy:true});shake(.35,f.pos);xSnd(f.pos,()=>{AU.hit&&AU.hit(1);});}
    const n=d.lengthSq()>.01?d.normalize():f.fwd();f.vel.set(n.x*7,Math.max(6.5,n.y*9),n.z*7);f.onGround=false;f.set('air');return 0;}
  V.lastL=L;d.normalize();const sp=Math.min(30,6+(t-V.t1)*70);f.vel.set(d.x*sp,d.y*sp+.4,d.z*sp);f.onGround=false;f.face=Math.atan2(d.x,d.z);
  if(Math.random()<.6)burst(ADD,f.chest(TMP2),1,{colors:[HEM.a,0xffffff],speed:.5,life:.25,size:.2,size1:0,bright:1.6});return 0;};
// the hook keeps flying even if he's interrupted: clean up the rope whenever he leaves the move
const _hemSet=Fighter.prototype.set;Fighter.prototype.set=function(s){if(this.vf&&this.vf.rope&&s!=='special')hemRopeEnd(this.vf);return _hemSet.apply(this,arguments);};

/* ---------- 2 BEAR TRAP (and the skill check to get out) ---------- */
const HEM_TRAPS=[];
SPECVAR.hemgrap={
  chg:['REEL',(f,dt,k)=>SPECIALS.hemgrap(f,dt)],
  alt:['BEAR TRAP',(f,dt)=>{const V=f.vf,t=f.stateT;f.vel.x*=.8;f.vel.z*=.8;
    if(t<.28){f.poseKey='hemThrowW';return 10;}
    if(!V.thr){V.thr=1;let A=hemAimPoint(f,14),to=A.p.clone();if(A.T){to=A.T.pos.clone().addScaledVector(A.T.vel,.5);}
      const d=to.clone().sub(f.pos);d.y=0;if(d.length()>14)d.setLength(14);if(d.length()<1.5)d.setLength(1.5);to=f.pos.clone().add(d);to.y=floorAt(to.x,to.z,f.pos.y+3);
      f.face=Math.atan2(d.x,d.z);hemThrowTrap(f,limbPos(f,'r',new V3()),to);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false));}
    f.poseKey=t<.5?'hemToss':'hemIdle';endAt(f,.62);return 10;}]};
function hemThrowTrap(f,from,to){const m=hemTrapMesh();m.position.copy(from);scene.add(m);const T={f,m,from:from.clone(),to:to.clone(),t:0,fly:.75,armed:false,shut:0,caught:null,life:Infinity,id:(f.id*997+Math.floor(game.time*10))%100000};
  HEM_TRAPS.push(T);return T;}   // no limit: they stay until someone steps in one (or the match ends)
function hemTrapGone(T){const i=HEM_TRAPS.indexOf(T);if(i>=0)HEM_TRAPS.splice(i,1);scene.remove(T.m);if(T.caught&&T.caught.hemTrap&&T.caught.hemTrap.T===T)T.caught.hemTrap=null;burst(SMK,T.m.position,6,{colors:[0x5a4a3a,0x3a3028],speed:1.2,up:1,life:.5,size:.2,size1:.4});}
function hemSnap(T,o){T.caught=o;T.shut=.001;T.m.position.set(o.pos.x,T.to.y,o.pos.z);
  o.hemTrap={T,ok:0,need:3,t:0,max:7,ck:null};if(NET.role!=='client'){hitO(T.f,o,{dmg:8,kb:0,up:0,stun:.25});hemBleed(o,T.f,1);}
  if(typeof bloodBurst==='function'&&typeof goreOn==='function'&&goreOn())bloodBurst(new V3(o.pos.x,o.pos.y+.35,o.pos.z),24,5);
  xSnd(o.pos,()=>{AU.noise(.08,.8,'highpass',2000,5000,1);AU.tone('square',180,60,.15,.15);AU.hit&&AU.hit(1);});shake(.4,o.pos);
  if(o===ME)announceSmall('🪤 CAUGHT IN A BEAR TRAP — PRESS SPACE IN THE ZONE');else if(T.f===ME)announceSmall('🪤 TRAP SPRUNG — '+(o.name||'').toUpperCase());}
function hemRelease(o,quiet){const H=o.hemTrap;if(!H)return;o.hemTrap=null;if(H.T){H.T.caught=null;H.T.life=Math.min(H.T.life,.8);H.T.open=1;}
  if(!quiet&&o===ME)announceSmall('FREE!');xSnd(o.pos,()=>AU.tone('square',300,500,.08,.06));if(o===ME)hemSkillUI(null);}
onEv('net:htrp',e=>{const o=byFid(e.v),f=byFid(e.o);if(!o||!f)return;let T=null,bd=3;for(const q of HEM_TRAPS){if(q.f!==f||q.caught)continue;const d=Math.hypot(q.to.x-e.x,q.to.z-e.z);if(d<bd){bd=d;T=q;}}
  if(!T){T=hemThrowTrap(f,new V3(e.x,o.pos.y,e.z),new V3(e.x,o.pos.y,e.z));T.t=T.fly;}hemSnap(T,o);});
onEv('net:htrr',e=>{const o=byFid(e.v);if(o)hemRelease(o);});
// a skill-check result from whoever is caught (everyone hears it; the host counts it)
onEv('x:htsc',e=>{const o=byFid(e.id);if(!o||!o.hemTrap)return;hemCheckResult(o,!!e.ok,true);});
function hemCheckResult(o,ok,fromNet){const H=o.hemTrap;if(!H)return;if(ok){H.ok++;burst(ADD,new V3(o.pos.x,o.pos.y+.3,o.pos.z),8,{colors:[0xffffff,0xd8d0b8],speed:2,life:.25,size:.15,size1:0,bright:2});xSnd(o.pos,()=>AU.tone('square',600+H.ok*120,800+H.ok*120,.05,.05));}
  else{xSnd(o.pos,()=>{AU.noise(.06,.5,'highpass',2200,5000,1);AU.tone('square',160,70,.12,.1);});if(NET.role!=='client'&&H.T)hitO(H.T.f,o,{dmg:3,kb:0,up:0,stun:.2});if(o===ME)shake(.25,o.pos);}
  if(NET.role!=='client'&&H.ok>=H.need){hemRelease(o);netEvent({k:'htrr',v:o.id});}}
function hemTrapTick(dt){
  for(let i=HEM_TRAPS.length-1;i>=0;i--){const T=HEM_TRAPS[i];T.t+=dt;T.life-=dt;
    if(T.t<T.fly){const k=T.t/T.fly,p=T.from.clone().lerp(T.to,k);p.y+=Math.sin(k*Math.PI)*2.4;T.m.position.copy(p);T.m.rotation.set(k*9,k*4,0);hemJaws(T.m,1);continue;}
    if(!T.armed){T.armed=true;T.m.position.copy(T.to);T.m.rotation.set(0,Math.random()*6,0);hemJaws(T.m,0);dust(T.to,4,.4);xSnd(T.to,()=>AU.tone('square',900,1300,.04,.05));}
    if(T.open){T.shut=Math.max(0,T.shut-dt*4);hemJaws(T.m,T.shut);}else if(T.shut>0&&T.shut<1){T.shut=Math.min(1,T.shut+dt*14);hemJaws(T.m,T.shut);}
    if(T.life<=0||!inMatch()){hemTrapGone(T);continue;}
    // the host springs traps
    if(!T.caught&&!T.open&&NET.role!=='client'){for(const o of FS){if(o.dead||o.dormant||ally(o,T.f)||o.hemTrap||!o.onGround)continue;if(Math.hypot(o.pos.x-T.to.x,o.pos.z-T.to.z)<.72&&Math.abs(o.pos.y-T.to.y)<.8){
        netEvent({k:'htrp',v:o.id,o:T.f.id,x:+T.to.x.toFixed(2),z:+T.to.z.toFixed(2)});hemSnap(T,o);break;}}}}
  // caught: rooted to the trap; bots and remote players work it open, you get the skill check
  for(const o of FS){const H=o.hemTrap;if(!H)continue;if(o.dead||!inMatch()){hemRelease(o,true);continue;}H.t+=dt;
    const p=H.T?H.T.to:o.pos;o.pos.x=p.x;o.pos.z=p.z;o.vel.x=o.vel.z=0;if(o.vel.y>0&&o.state!=='fly')o.vel.y=0;
    if(Math.random()<.08&&nearCam(o.pos,50))burst(SMK,new V3(o.pos.x,o.pos.y+.25,o.pos.z),1,{colors:[0x8a0010,0xb0141e],speed:.6,up:.5,life:.5,size:.06,size1:.04,grav:12});
    if(NET.role!=='client'){if(H.t>H.max){hemRelease(o);netEvent({k:'htrr',v:o.id});continue;}
      if(o.isBot||o.ai){H.bt=(H.bt||0)+dt;if(H.bt>.95){H.bt=0;hemCheckResult(o,Math.random()<.55,false);}}}
    if(o===ME)hemSkillTick(dt);}}
// the skill check: a needle sweeps round a dial; SPACE while it's in the white zone (the bright sliver is a great check: counts twice)
const HSK={el:null,cv:null,a:0,zone:0,on:false,wait:0,res:null,resT:0};
function hemSkillUI(on){if(!HSK.el){const d=document.createElement('div');d.id='hemSkill';d.style.cssText='position:fixed;left:50%;top:58%;transform:translate(-50%,-50%);pointer-events:none;z-index:30;display:none;text-align:center;font:800 13px/1.2 system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px #000';
    d.innerHTML='<canvas width="150" height="150"></canvas><div>PRESS SPACE IN THE ZONE</div>';document.body.appendChild(d);HSK.el=d;HSK.cv=d.querySelector('canvas');}
  HSK.el.style.display=on?'block':'none';HSK.on=!!on;}
function hemNewCheck(){HSK.a=0;HSK.zone=rand(1.9,4.6);HSK.wait=0;}
function hemSkillTick(dt){const H=ME.hemTrap;if(!H)return;if(!HSK.on){hemSkillUI(true);hemNewCheck();HSK.wait=.45;}
  if(HSK.wait>0){HSK.wait-=dt;if(HSK.wait<=0)hemNewCheck();}else{HSK.a+=dt*5.4;
    const press=pressed.has('Space');if(press||HSK.a>Math.PI*2){const d=HSK.a-HSK.zone,ok=press&&d>=0&&d<=.62,great=press&&d>=.2&&d<=.36;HSK.res=ok?(great?'GREAT':'GOOD'):'MISS';HSK.resT=.5;
      const n=great?2:ok?1:0;if(NET.role==='client'){netSay({k:'htsc',id:ME.id,ok:n?1:0});if(great)netSay({k:'htsc',id:ME.id,ok:1});}else{hemCheckResult(ME,!!n,false);if(great&&ME.hemTrap)hemCheckResult(ME,true,false);}HSK.wait=.4;}}
  if(HSK.resT>0)HSK.resT-=dt;
  const c=HSK.cv,g=c.getContext('2d'),R=58,cx=75,cy=75;g.clearRect(0,0,150,150);g.lineWidth=7;g.strokeStyle='rgba(255,255,255,.25)';g.beginPath();g.arc(cx,cy,R,0,7);g.stroke();
  const a0=-Math.PI/2;if(HSK.wait<=0){g.strokeStyle='#ffffff';g.beginPath();g.arc(cx,cy,R,a0+HSK.zone,a0+HSK.zone+.62);g.stroke();g.strokeStyle='#ffd23f';g.beginPath();g.arc(cx,cy,R,a0+HSK.zone+.2,a0+HSK.zone+.36);g.stroke();
    g.strokeStyle='#ff2a3a';g.lineWidth=4;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a0+HSK.a)*(R+8),cy+Math.sin(a0+HSK.a)*(R+8));g.stroke();}
  g.fillStyle='#fff';g.font='800 20px system-ui';g.textAlign='center';g.fillText(`${Math.min(H.ok,H.need)}/${H.need}`,cx,cy+7);
  if(HSK.resT>0){g.fillStyle=HSK.res==='MISS'?'#ff4a4a':HSK.res==='GREAT'?'#ffd23f':'#8aff8a';g.font='900 15px system-ui';g.fillText(HSK.res,cx,cy+28);}}
onEv('frame',()=>{if(HSK.on&&(!ME||!ME.hemTrap||!inMatch()))hemSkillUI(false);});
// trapped: no jumping or dashing out of it
const _hemTrapUpd=Fighter.prototype.update;Fighter.prototype.update=function(dt){if(this.hemTrap&&this.intent){this.intent.jump=false;this.intent.dash=false;this.intent.wx=0;this.intent.wz=0;}return _hemTrapUpd.apply(this,arguments);};

/* ---------- 3 TRACKER'S SENSE ---------- */
const HEM_TRK=new Map(),HEM_MK=[],HEM_PRINTS=[];
onEv('tick',dt=>{if(!inMatch())return;const now=game.time;for(const o of FS){if(o.dead||o.dormant)continue;let L=HEM_TRK.get(o);if(!L){L=[];HEM_TRK.set(o,L);}
  const last=L[L.length-1];if(!last||now-last.t>.28){if(!last||Math.hypot(o.pos.x-last.x,o.pos.z-last.z)>.35)L.push({x:o.pos.x,y:o.pos.y,z:o.pos.z,t:now,f:Math.atan2(o.vel.x,o.vel.z)});else last.t=now;if(L.length>40)L.shift();}}});
const HEM_PRINT_G=(()=>{const g=new THREE.CircleGeometry(.09,10);g.scale(1,1.7,1);g.rotateX(-Math.PI/2);return g;})(),HEM_PRINT_M=new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
const HEM_MARK_T=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#ff3a2a';g.lineWidth=5;g.beginPath();g.moveTo(32,4);g.lineTo(60,32);g.lineTo(32,60);g.lineTo(4,32);g.closePath();g.stroke();
  g.fillStyle='#ff3a2a';g.beginPath();g.arc(32,32,7,0,7);g.fill();return new THREE.CanvasTexture(c);})();
function hemReveal(by,o,dur){o.hemRevealT=game.time+dur;o.hemRevealBy=by;
  const mine=by===ME||(ME&&ally(by,ME)&&by!==ME);if(mine){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:HEM_MARK_T,depthTest:false,transparent:true}));sp.scale.set(.7,.7,1);sp.renderOrder=999;scene.add(sp);HEM_MK.push({o,sp,until:game.time+dur});
    // a ghost outline of them, visible through walls
    const L=HEM_TRK.get(o)||[];const now=game.time;for(let i=0;i<L.length;i++){const P=L[i];if(now-P.t>9)continue;[-1,1].forEach(s=>{const m=new THREE.Mesh(HEM_PRINT_G,HEM_PRINT_M.clone());const sx=Math.cos(P.f)*.12*s,sz=-Math.sin(P.f)*.12*s;
        m.position.set(P.x+sx+(s>0?Math.sin(P.f)*.25:0),floorAt(P.x,P.z,P.y+.5)+.04,P.z+sz+(s>0?Math.cos(P.f)*.25:0));m.rotation.y=P.f;scene.add(m);HEM_PRINTS.push({m,t:0,life:8+i*.05,d:i*.03});});}}
  if(o===ME){announceSmall('👁 YOU\'VE BEEN TRACKED');if(typeof impactFlash==='function')impactFlash(.25,0xff2a1a);xSnd(ME.pos,()=>AU.tone('sine',220,180,.6,.08));}}
function hemMarkTick(dt){for(let i=HEM_MK.length-1;i>=0;i--){const M=HEM_MK[i];if(game.time>M.until||M.o.dead||!inMatch()){scene.remove(M.sp);HEM_MK.splice(i,1);continue;}
    M.sp.position.set(M.o.pos.x,M.o.pos.y+2.5+Math.sin(game.time*4)*.08,M.o.pos.z);const d=camera.position.distanceTo(M.sp.position);M.sp.scale.setScalar(Math.max(.5,d*.035));M.sp.material.opacity=.65+.35*Math.sin(game.time*8);}
  for(let i=HEM_PRINTS.length-1;i>=0;i--){const P=HEM_PRINTS[i];P.t+=dt;if(P.t>P.life||!inMatch()){scene.remove(P.m);P.m.material.dispose();HEM_PRINTS.splice(i,1);continue;}P.m.visible=P.t>P.d;P.m.material.opacity=.9*Math.min(1,(P.life-P.t)/1.5)*(.75+.25*Math.sin(game.time*5+i));}}
const HEM_BEAST=25;
XCUSTOM.hemscan=function(f,dt){const V=f.vf,t=f.stateT;f.vel.x*=.8;f.vel.z*=.8;f.poseKey=t<.35?'hemScan':'hemHowl';
  if(!V.s&&t>.3){V.s=1;f.beastT=game.time+HEM_BEAST;f.hasteT=Math.max(f.hasteT||0,HEM_BEAST);f.xcd[0]=HEM_BEAST+10;f.xcdMax=[HEM_BEAST+10,0];const c=f.chest(new V3());
    if(nearCam(c,90)){ring(new V3(f.pos.x,f.pos.y+.15,f.pos.z),0xff2a1a,9,.6,true,2);burst(ADD,c,30,{colors:[0xff2a1a,0xffffff],speed:6,life:.4,size:.3,size1:0,bright:2.2});flashLight(c,0xff2a1a,8);}
    xSnd(f.pos,()=>{AU.tone('sawtooth',90,70,1.2,.12);AU.tone('sine',220,160,.9,.08);AU.noise(.6,.2,'lowpass',500,200,1);});
    if(f===ME)announceSmall("👁 TRACKER'S SENSE — THE HUNT IS ON");else if(ME&&!ally(f,ME)&&ME.pos.distanceTo(f.pos)<120)announceSmall('👁 SOMETHING IS HUNTING YOU');}
  endAt(f,.9);return 10;};
onEv('kill',(def,att)=>{if(att&&att.beastT>game.time){att.beastT+=5;att.hasteT=Math.max(att.hasteT||0,att.beastT-game.time);if(att===ME)announceSmall('+5 s THE HUNT');}});
onEv('matchStart',()=>{FS.forEach(f=>f.beastT=0);});
// the view while it's on: the world drains to grey and darkens; enemies glow red through walls, their trails burn red
const HEM_BV={cv:null,g:null,on:false};
function hemBeastView(on){const C=renderer.domElement;if(!HEM_BV.cv){const c=document.createElement('canvas');c.id='hemBeast';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';document.body.appendChild(c);HEM_BV.cv=c;HEM_BV.g=c.getContext('2d');}
  if(on!==HEM_BV.on){HEM_BV.on=on;C.style.filter=on?'grayscale(.92) brightness(.6) contrast(1.3)':'';if(!on&&typeof applyAccess==='function')applyAccess();HEM_BV.cv.style.display=on?'block':'none';}}
const _hbv=new V3();
function hemProject(x,y,z,W,H){_hbv.set(x,y,z).project(camera);if(_hbv.z>1||_hbv.z<-1)return null;return [(_hbv.x*.5+.5)*W,(-_hbv.y*.5+.5)*H];}
onEv('frame',()=>{const on=!!ME&&!ME.dead&&inMatch()&&ME.beastT>game.time;hemBeastView(on);if(!on)return;
  const c=HEM_BV.cv,W=innerWidth,H=innerHeight;if(c.width!==W||c.height!==H){c.width=W;c.height=H;}const g=HEM_BV.g,now=game.time,left=ME.beastT-now;g.clearRect(0,0,W,H);
  // red edge
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(120,0,0,0)');vg.addColorStop(1,'rgba(140,0,0,.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  for(const o of FS){if(o===ME||o.dead||o.dormant||ally(o,ME))continue;const d=o.pos.distanceTo(ME.pos);if(d>120)continue;
    // footprints of the last 10 s
    const L=HEM_TRK.get(o)||[];g.fillStyle='rgba(255,40,20,.85)';for(let i=0;i<L.length;i++){const P=L[i],age=now-P.t;if(age>10)continue;
      const y=floorAt(P.x,P.z,P.y+.5)+.03,s=(i%2?1:-1)*.13,q=hemProject(P.x+Math.cos(P.f)*s,y,P.z-Math.sin(P.f)*s,W,H);if(!q)continue;
      const dd=Math.max(2,camera.position.distanceTo(_hbv.set(P.x,y,P.z))),r=Math.max(1.5,40/dd);g.globalAlpha=Math.max(.15,1-age/10);g.beginPath();g.ellipse(q[0],q[1],r,r*.55,0,0,7);g.fill();}
    g.globalAlpha=1;
    // the body, glowing red (drawn over walls)
    const sc=(o.hero&&o.hero.scale)||1,top=hemProject(o.pos.x,o.pos.y+1.9*sc,o.pos.z,W,H),bot=hemProject(o.pos.x,o.pos.y,o.pos.z,W,H);if(!top||!bot)continue;
    const h=Math.max(6,bot[1]-top[1]),w=h*.36,cx=(top[0]+bot[0])/2,cy=(top[1]+bot[1])/2,pulse=.75+.25*Math.sin(now*7);
    g.shadowColor='#ff1a0a';g.shadowBlur=18;g.fillStyle=`rgba(255,30,15,${.38*pulse})`;g.strokeStyle=`rgba(255,70,40,${.95*pulse})`;g.lineWidth=2.5;
    g.beginPath();g.ellipse(cx,top[1]+h*.11,w*.32,h*.11,0,0,7);g.fill();g.stroke();g.beginPath();g.ellipse(cx,cy+h*.08,w*.5,h*.38,0,0,7);g.fill();g.stroke();g.shadowBlur=0;
    g.fillStyle='#ffb0a0';g.font='700 11px system-ui';g.textAlign='center';g.fillText(Math.round(d)+' m',cx,top[1]-6);}
  g.fillStyle='rgba(255,90,60,.95)';g.font='800 13px system-ui';g.textAlign='center';g.fillText(`TRACKER'S SENSE  ${left.toFixed(1)}s`,W/2,112);});
onEv('matchEnd',()=>hemBeastView(false));
// enemies in the hunt can see they're being hunted: the hunter's eyes burn brighter
onEv('tick',()=>{for(const f of FS){if(!isHem(f)||f.dead||!f.rig)continue;const b=f.beastT>game.time;if(b&&nearCam(f.pos,60)&&Math.random()<.4)burst(SMK,f.rig.head.getWorldPosition(TMP2),1,{colors:[0xff2a1a,0x8a0a0a],speed:.4,up:.5,life:.5,size:.12,size1:.3});}});
// no cooldown on GRAPPLE / BEAR TRAP (bots keep a short one so they don't spam)
const _hemSS=Fighter.prototype.startSpecial;Fighter.prototype.startSpecial=function(){const r=_hemSS.apply(this,arguments);if(isHem(this)&&this.curSpecial()==='hemgrap')this.specCD=this.isBot?2.4:0;return r;};

/* ---------- 4 GUT KNIFE ---------- */
XCUSTOM.hemstab=function(f,dt){const V=f.vf,t=f.stateT;V.knife=1;
  if(!V.a){V.a=1;const T=tgtOf(f,6);if(T)faceTo(f,T);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(false));}
  if(t<.15){f.poseKey='hemStabW';f.vel.x*=.7;f.vel.z*=.7;return 10;}
  if(!V.hitT){f.poseKey='hemStabH';if(t<.3){const fw=f.fwd();f.vel.x=fw.x*10;f.vel.z=fw.z*10;}
    if(!V.chk&&t>.22){V.chk=1;const L=foes(f,2.8,null,.55);const o=L[0];
      if(o){V.hitT=t;V.vic=o;if(NET.role!=='client'){hitO(f,o,{dmg:9,kb:1.5,up:0,stun:.55});hemHemorrhage(o,f);if(Math.random()<.18)netSay({k:'hchk',f:f.id,v:o.id});}
        const p=o.chest(new V3());if(typeof bloodBurst==='function'&&typeof goreOn==='function'&&goreOn())bloodBurst(p,26,6);xSnd(p,()=>{AU.noise(.07,.5,'bandpass',900,400,2);AU.hit&&AU.hit(.9);});}}
    if(t>.62){V.knife=0;f.set(f.onGround?'idle':'air');}return 10;}
  f.vel.x*=.6;f.vel.z*=.6;
  if(!V.chunk){if(t-V.hitT>.4){V.knife=0;f.set(f.onGround?'idle':'air');}else f.poseKey='hemStabH';return 10;}
  // he tears out a chunk and eats it
  const r=t-V.hitT;
  if(r<.35){f.poseKey='hemRip';if(!V.torn&&r>.15){V.torn=1;V.chunkV=1;V.knife=0;const o=V.vic;if(o&&!o.dead){if(NET.role!=='client')hitO(f,o,{dmg:8,kb:2,up:0,stun:.6});const p=o.chest(new V3());
        if(typeof bloodBurst==='function'&&typeof goreOn==='function'&&goreOn()){bloodBurst(p,50,7);if(typeof gibs==='function')gibs(p,f.fwd().negate(),3);}}
      xSnd(f.pos,()=>{AU.noise(.18,.6,'lowpass',700,200,1);AU.tone('sawtooth',120,60,.2,.08);});if(f===ME)announceSmall('🩸 FLESH TORN — EATING');}return 10;}
  if(r<1.55){f.poseKey='hemEat';V.chunkV=1;const chew=Math.sin(r*22);f.P&&(f.P.hd+=chew*.04);
    if(Math.random()<.35&&nearCam(f.pos,40))burst(SMK,limbPos(f,'r',new V3()),1,{colors:[0x9a0a18,0x6a0008],speed:.4,life:.6,size:.05,size1:.04,grav:12});
    if(!V.ch2&&r>.6){V.ch2=1;xSnd(f.pos,()=>{AU.noise(.1,.35,'lowpass',500,250,1);AU.noise(.1,.3,'lowpass',450,250,1,.25);AU.noise(.1,.3,'lowpass',520,250,1,.5);});}
    return 10;}
  if(!V.healed){V.healed=1;V.chunkV=0;if(NET.role!=='client'&&!(typeof healLocked==='function'&&healLocked(f)))f.hp=Math.min(100,f.hp+16);ring(f.chest(new V3()),0x8a1a22,1.6,.4,false,1.8);
    if(f===ME)announceSmall('+16 HP');}
  f.set(f.onGround?'idle':'air');return 10;};
onEv('x:hchk',e=>{const f=byFid(e.f);if(!f||!f.vf||f.state!=='special')return;f.vf.chunk=1;});

/* ---------- Q THE LAST HUNT / ARROW STORM ---------- */
ULTX.lasthunt={r:45,s(f){f.uEnd=2.4;f.poseKey='hemHowl';f.vf.t0=null;},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;}f.poseKey=t-V.t0<1.2?'hemHowl':'hemIdle';f.vel.x*=.8;f.vel.z*=.8;
    atT(f,'h1',V.t0+.35,()=>{f.hemUlt=game.time+12;f.hasteT=Math.max(f.hasteT||0,12);let n=0;for(const o of FS){if(o===f||o.dead||o.dormant||ally(o,f))continue;if(o.pos.distanceTo(f.pos)<90){hemReveal(f,o,12);n++;}}
      const c=f.chest(new V3());ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0xff2a1a,14,.8,true,2);ring(c,0xff2a1a,6,.5,false,2.4);flashLight(c,0xff2a1a,12);shake(.5,c);
      xSnd(f.pos,()=>{AU.tone('sawtooth',110,92,1.8,.16);AU.tone('sawtooth',165,138,1.8,.08);AU.noise(1.4,.15,'lowpass',400,200,1);});
      if(f===ME)announceSmall(`🏹 THE LAST HUNT — ${n} PREY MARKED`);else if(ME&&!ally(f,ME)&&ME.pos.distanceTo(f.pos)<90)announceSmall('🏹 YOU ARE BEING HUNTED');});
    return 10;}};
ALTULT.hemlock={name:'ARROW STORM',r:30,s(f){f.uEnd=3.6;f.poseKey='hemSky';f.vf.t0=null;},
  u(f,t){const V=f.vf;if(V.t0==null){V.t0=t;const A=hemAimPoint(f,40);V.c=A.T?A.T.pos.clone():A.p.clone();V.c.y=floorAt(V.c.x,V.c.z,V.c.y+3);V.ty=hemType(f);}
    const r=t-V.t0;f.poseKey=r<.5?'hemSky':'hemLoose';f.vel.x*=.8;f.vel.z*=.8;
    atT(f,'up',V.t0+.3,()=>{const c=limbPos(f,'l',new V3());hemShoot(f,c,new V3(0,1,0),{type:V.ty,speed:70,grav:0,dmg:0});xSnd(f.pos,()=>AU.noise(.1,.5,'bandpass',1400,500,3));});
    for(let k=0;k<32;k++)atT(f,'r'+k,V.t0+1+k*.045,()=>{const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*7,p=new V3(V.c.x+Math.cos(a)*rr,V.c.y+26,V.c.z+Math.sin(a)*rr);
      hemShoot(f,p,new V3(rand(-.05,.05),-1,rand(-.05,.05)),{type:V.ty,speed:46,grav:10,dmg:5,rain:true});});
    if(r>.9&&r<2.6&&Math.random()<.3)ring(new V3(V.c.x,V.c.y+.15,V.c.z),HEM_ARR_C[V.ty],7,.4,true,1.4);
    return 10;}};

/* ---------- per frame ---------- */
onEv('tick',dt=>{if(!inMatch()){return;}try{hemTick(dt);hemStatusTick(dt);hemTrapTick(dt);hemMarkTick(dt);}catch(e){console.warn('hemlock',e);}});
onEv('matchEnd',()=>{HEM_P.forEach(P=>scene.remove(P.m));HEM_P.length=0;HEM_STUCK.forEach(S=>{if(S.m.parent)S.m.parent.remove(S.m);});HEM_STUCK.length=0;HEM_GAS.forEach(G=>scene.remove(G.m));HEM_GAS.length=0;
  HEM_TRAPS.slice().forEach(hemTrapGone);HEM_MK.forEach(M=>scene.remove(M.sp));HEM_MK.length=0;HEM_PRINTS.forEach(P=>scene.remove(P.m));HEM_PRINTS.length=0;HEM_TRK.clear();hemSkillUI(false);
  FS.forEach(f=>{f.hemTrap=null;f.hemBleed=null;f.hemHem=null;});});

/* ---------- moves list, bot habits ---------- */
(function(){const h=HEROES.find(x=>x.id==='hemlock');if(!h)return;
  const ab=o=>sanitizeAbil(Object.assign({colors:[HEM.a,0xff3a2a]},o));
  h._xm=[Object.assign(ab({name:"TRACKER'S SENSE",form:'beam',style:'blood',shape:'eye',range:40,fx:[]}),{custom:'hemscan'}),Object.assign(ab({name:'GUT KNIFE',form:'burst',style:'blood',shape:'knife',size:.75,fx:[]}),{custom:'hemstab'})];
  if(typeof UO!=='undefined')UO.hemlock=(f,t,c)=>{if(uo1(f,'a'))aura(f,HEM.c,HEM.a,1);uoSwirl(f,c,HEM.a,0xff3a2a,4,SMK);};})();
// bots keep their distance with the bow, set traps on the path and scan before a fight
const _hemThink=AI.prototype.think;AI.prototype.think=function(dt){_hemThink.call(this,dt);const f=this.f;if(!isHem(f)||f.dead||f.hold||!inMatch())return;const I=f.intent,T=f.tgt;
  if(!T||T.dead)return;const d=T.pos.distanceTo(f.pos);
  if(d<5&&f.state!=='attack'&&Math.random()<dt*1.2){const a=Math.atan2(f.pos.x-T.pos.x,f.pos.z-T.pos.z);I.wx=Math.sin(a);I.wz=Math.cos(a);}
  if(T.hemTrap&&d<30&&Math.random()<dt*3){I.heavy=true;}
  if(d>4&&d<26&&Math.random()<dt*.9)I.light=true;};
