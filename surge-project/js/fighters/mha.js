/* Solstice, Piston, Snare, Marble, Legion, Recoil + extra moves (XMOVES) and death ults */
/* ================= SIX NEW FIGHTERS (original characters inspired by hero-school anime) =================
   SOLSTICE  frost & flame        PISTON  engine legs        SNARE   erasure + capture scarf
   MARBLE    compression          LEGION  mud clones         RECOIL  rifle arm
   Every kit: special (+ charged + back variants), ultimate (+ alt ultimate), power-hit effect, sounds, look. */

/* ---------- sounds ---------- */
Object.assign(SND,{
  // SOLSTICE: cracking ice and roaring flame
  frostfire:{thud:.5,
    swing(h){AU.noise(h?.25:.18,.3,'highpass',2600,6000,1);AU.crackle(h?.25:.15,.1,50);AU.fm(2400,3.1,.6,.18,.025);},
    hit(p){AU.crunch(.35*p);AU.noise(.25,.3*p,'lowpass',2400,300,1,.02);AU.fm(1800,2.76,1.2,.3,.05*p);AU.sub(120,50,.18,.35*p);},
    dash(){AU.swell(.25,.3,'highpass',1500,6000,1);AU.crackle(.25,.1,40);},
    charge(){AU.swell(.9,.35,'highpass',800,5000,1);for(let i=0;i<6;i++)AU.fm(2000+i*400,2.76,.8,.25,.03,i*.13);AU.crackle(.9,.08,30);},
    spec(){for(let i=0;i<6;i++)AU.crunch(.3,i*.05);AU.noise(.5,.3,'bandpass',1800,600,1.2);AU.fm(1600,2.76,1.5,.6,.05,.1);},
    freeze(){AU.crunch(.4);AU.crunch(.3,.05);AU.fm(2200,2.76,1.5,.6,.06);AU.noise(.3,.2,'highpass',3000,6000,1);},
    ult(){for(let i=0;i<12;i++)AU.crunch(.35,i*.05);AU.sub(60,30,1.6,.6);AU.fm(880,2.76,3,1.6,.08);AU.noise(1.2,.5,'lowpass',2600,200,1,1);AU.crackle(1.2,.18,60,1);}},
  // PISTON: revving engines and exhaust pops
  engine:{thud:.6,
    swing(h){AU.growl(h?90:120,h?200:220,h?.22:.14,.08,0,60,1400);AU.noise(.12,.2,'bandpass',900,300,1.5);},
    hit(p){AU.sub(130,45,.18,.45*p);AU.noise(.08,.4*p,'lowpass',1600,200,1);for(let i=0;i<3;i++)AU.noise(.03,.25*p,'lowpass',900,120,1,.03+i*.05);},
    dash(){AU.growl(70,260,.35,.12,0,70,1600);AU.noise(.3,.25,'bandpass',600,1800,1);},
    charge(){AU.growl(45,160,1,.14,0,40,1200);AU.growl(46,165,1,.08,0,48,900);},
    spec(){AU.growl(80,320,.4,.16,0,80,1800);for(let i=0;i<5;i++)AU.noise(.04,.35,'lowpass',1200,140,1,.25+i*.05);AU.sub(90,40,.2,.4,.25);},
    ult(){AU.growl(50,380,1.4,.18,0,70,2000);AU.growl(51,385,1.4,.1,0,80,1400);for(let i=0;i<10;i++)AU.noise(.04,.3,'lowpass',1100,140,1,1+i*.12);AU.sub(60,30,1,.5,1);}},
  // SNARE: cloth whips and the ring of switched-off powers
  scarf:{thud:.5,
    swing(h){AU.flutter(h?6:4,.18);AU.noise(.04,.25,'highpass',2500,5000,1,.06);},
    hit(p){AU.noise(.06,.45*p,'highpass',1800,4000,1);AU.sub(140,60,.14,.35*p);AU.flutter(3,.12*p,.02);},
    dash(){AU.flutter(8,.18);AU.swell(.2,.2,'bandpass',600,2400,2);},
    charge(){AU.tone('sine',3200,3150,1,.03);AU.swell(.9,.25,'bandpass',300,1200,3);},
    spec(){AU.flutter(6,.2);AU.noise(.03,.5,'highpass',3000,6000,1,.18);AU.tone('sine',200,90,.2,.15,.18);},
    erase(){AU.tone('sine',3400,3400,.7,.05);AU.tone('sine',1700,200,.6,.08);AU.noise(.5,.15,'bandpass',800,200,4);},
    ult(){AU.tone('sine',3600,3500,1.6,.06);AU.tone('sawtooth',55,40,1.6,.08);AU.swell(.9,.35,'bandpass',200,3000,6);AU.flutter(14,.15,.8);}},
  // MARBLE: glass clinks, snaps and pops
  glass:{thud:.45,
    swing(h){AU.noise(h?.22:.15,.25,'bandpass',2200,900,2);AU.fm(2600+Math.random()*600,3.5,.6,.25,.03);},
    hit(p){AU.fm(1900,3.5,1.2,.35,.08*p);AU.fm(2850,3.5,1,.3,.05*p,.03);AU.sub(150,60,.14,.3*p);},
    dash(){AU.swell(.2,.25,'bandpass',600,3000,3);AU.clicks(4,.04,.05,2600);},
    charge(){for(let i=0;i<8;i++)AU.fm(1500+i*220,3.5,.8,.3,.03,i*.1);AU.swell(.9,.2,'highpass',1000,5000,1);},
    spec(){AU.noise(.02,.5,'highpass',2500,5000,1);AU.fm(2400,3.5,1.4,.5,.07,.05);AU.swell(.2,.25,'bandpass',3000,400,4,.02);},
    pop(){AU.crunch(.35);AU.noise(.05,.45,'highpass',2000,5000,1);AU.fm(3000,3.5,1,.4,.06);AU.sub(110,45,.2,.4,.02);},
    ult(){[1047,1319,1568,2093].forEach((f,i)=>AU.fm(f,3.5,.8,1.2,.05,i*.12));AU.swell(1,.35,'bandpass',200,2400,4);AU.noise(.02,.6,'highpass',2500,6000,1,1.3);}},
  // LEGION: wet mud and doubled grunts
  mud:{thud:.55,
    swing(h){AU.noise(h?.24:.16,.3,'lowpass',1500,300,1.4);AU.squelch(.08,.08,.02);},
    hit(p){AU.splat(.35*p);AU.sub(120,45,.16,.4*p);},
    dash(){AU.noise(.3,.3,'lowpass',1200,200,1);AU.gurgle(4,.1,300,900,.25);},
    charge(){AU.gurgle(12,.12,200,900,.9);AU.growl(60,90,.9,.12,0,9,500);},
    spec(){AU.splat(.4);AU.splat(.35,.1);AU.squelch(.25,.2,.05);AU.growl(90,130,.3,.1,.1,12,600);AU.growl(92,134,.3,.08,.13,12,600);},
    melt(){AU.squelch(.2,.15);AU.gurgle(5,.1,250,800,.3);},
    ult(){for(let i=0;i<6;i++)AU.splat(.3,i*.12);AU.growl(70,110,1.4,.14,0,8,600);AU.growl(72,113,1.4,.1,.05,9,600);AU.sub(55,30,1.2,.5);}},
  // RECOIL: rifle cracks, bolts and casings
  rifle:{thud:.5,
    swing(h){AU.noise(h?.2:.14,.3,'bandpass',1800,500,1.5);AU.clicks(2,.03,.05,1800);},
    hit(p){AU.sub(140,50,.14,.4*p);AU.fm(900,1.41,2,.2,.05*p);AU.noise(.05,.35*p,'highpass',2000,4000,1);},
    dash(){AU.noise(.25,.3,'bandpass',1200,400,1);AU.clicks(3,.05,.06,1500);},
    charge(){AU.clicks(2,.18,.12,900);AU.noise(.08,.2,'highpass',2500,5000,1,.4);AU.clicks(2,.12,.1,1300,.6);},
    shot(){AU.noise(.09,.6,'highpass',1200,4000,1);AU.noise(.35,.35,'lowpass',900,120,1);AU.sub(95,35,.22,.5);AU.noise(.6,.08,'bandpass',2400,800,2,.08);AU.clicks(2,.06,.04,2200,.3);},
    spec(){this.shot();},
    ult(){AU.clicks(6,.08,.08,1300);AU.tone('sine',1200,1200,.9,.04);AU.sub(60,40,1,.3);}},
});
Object.assign(HERO_SND,{solstice:'frostfire',piston:'engine',snare:'scarf',marble:'glass',legion:'mud',recoil:'rifle'});
Object.assign(SPNAME,{glacier:'GLACIER',recipro:'RECIPRO BURST',bind:'CAPTURE SCARF',compress:'COMPRESS',double:'DOUBLE',snipe:'CURVE SHOT'});
Object.assign(ULT_RANGE,{permafrost:18,overdrive:18,erasure:20,curtaincall:9,sanctuary:12,deadeye:30});
Object.assign(SPECIAL_AI,{glacier:[0,14,.55],recipro:[3,14,.45],bind:[3,14,.5],compress:[2,18,.5],double:[0,16,.5],snipe:[6,34,.55]});
const XSPK={glacier:1,recipro:1,bind:1,compress:1,double:1,snipe:1};

/* ---------- small shared helpers ---------- */
function xSnd(p,fn){const s=AU.scale;AU.scale=sndAt(p);try{fn();}finally{AU.scale=s;}}
function xBasis(f,d){const fw=d||f.fwd();return [fw,new V3(fw.z,0,-fw.x)];}
function xDirTo(f,T){if(!T)return f.fwd();const d=new V3(T.pos.x-f.pos.x,0,T.pos.z-f.pos.z);return d.lengthSq()<.01?f.fwd():d.normalize();}
function hitAt(f,from,o,x){const sv=f.pos.clone();f.pos.copy(from);let r;try{r=hitO(f,o,x);}finally{f.pos.copy(sv);}return r;}
function muzOf(f,v){v=v||new V3();const R=f.rig;R.root.updateMatrixWorld(true);if(R.ext&&R.ext.muzzle)return R.ext.muzzle.getWorldPosition(v);return R.rF.getWorldPosition(v);}
const XDEL=[];function later(t,fn){XDEL.push({t:game.time+t,fn});}

/* ---------- ice: spikes, frozen foes ---------- */
let ICEM=null,ICEG=null;const ICEP=[];let ICEI=0;
function iceMat(){if(!ICEM)ICEM=new THREE.MeshPhysicalMaterial({color:0xcff4ff,emissive:0x2a8aff,emissiveIntensity:.35,roughness:.06,metalness:.05,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.84,envMap:SKYENV||ENV||null,envMapIntensity:1.4});return ICEM;}
function iceGeo(){if(!ICEG){ICEG=new THREE.ConeGeometry(.3,1.7,5,1);ICEG.translate(0,.85,0);}return ICEG;}
function iceSpike(x,z,h,hold){if(!nearCam(TMP3.set(x,0,z),100))return;
  if(!ICEP.length)for(let i=0;i<140;i++){const g=new THREE.Group(),m=iceMat(),G=iceGeo();const a=new THREE.Mesh(G,m);g.add(a);
    const b=new THREE.Mesh(G,m);b.scale.setScalar(.6);b.position.x=.25;b.rotation.z=-.5;g.add(b);const c=new THREE.Mesh(G,m);c.scale.setScalar(.5);c.position.set(-.2,0,.12);c.rotation.set(.35,0,.6);g.add(c);
    g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.visible=false;scene.add(g);ICEP.push(g);}
  const g=ICEP[ICEI];ICEI=(ICEI+1)%ICEP.length;g.visible=true;g.position.set(x,0,z);g.rotation.set(rand(-.25,.25),rand(0,6.28),rand(-.25,.25));g.userData={t:0,h:h||1,hold:hold||1.4};g.scale.set(.01,.01,.01);}
function updIce(dt){for(const g of ICEP){if(!g.visible)continue;const u=g.userData;u.t+=dt;const h=u.h;
  if(u.t<.1)g.scale.set(h,h*Math.max(.01,u.t/.1),h);else if(u.t<u.hold)g.scale.set(h,h,h);else{const k=1-(u.t-u.hold)/.35;if(k<=0){g.visible=false;continue;}g.scale.set(h*k,h*k,h*k);}}}
function shatterIce(p,R){for(const g of ICEP){if(!g.visible||Math.hypot(g.position.x-p.x,g.position.z-p.z)>R)continue;g.userData.hold=Math.min(g.userData.hold,g.userData.t);
  burst(ADD,TMP.set(g.position.x,.9*g.userData.h,g.position.z),5,{colors:[0xcff4ff,0xffffff,0x7ad4ff],speed:6,up:3,life:.5,size:.2,size1:0,grav:12,bright:1.8});}}
function iceBlock(o){const R=o.rig;if(R.xIce)return R.xIce;const g=new THREE.Group();
  const shell=new THREE.Mesh(cg('iceShell',()=>new THREE.CylinderGeometry(.6,.7,2.15,7)),new THREE.MeshPhysicalMaterial({color:0xcff4ff,emissive:0x2a7aff,emissiveIntensity:.3,roughness:.05,clearcoat:1,transparent:true,opacity:.4,depthWrite:false,envMap:SKYENV||ENV||null}));
  shell.position.y=1.05;g.add(shell);
  for(let k=0;k<8;k++){const s=new THREE.Mesh(iceGeo(),iceMat()),a=k/8*6.28;s.position.set(Math.cos(a)*.55,rand(0,.9),Math.sin(a)*.55);s.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6);s.scale.setScalar(rand(.45,.75));g.add(s);}
  g.visible=false;R.root.add(g);R.xIce=g;return g;}
function freezeO(o,t){if(o.dead||o.downed||o.state==='framed')return false;o.set('framed');o.framedT=t;o.vel.set(0,0,0);o.xHold='ice';iceBlock(o).visible=true;
  burst(ADD,o.chest(new V3()),20,{colors:[0xcff4ff,0xffffff,0x7ad4ff],speed:4,life:.5,size:.25,size1:0,bright:2,rad:.6});xSnd(o.pos,()=>SND.frostfire.freeze());return true;}
function iceHit(f,o,x,ft){const r=hitO(f,o,x);if(r===true&&ft)freezeO(o,ft);return r;}
// a wall of ice that races along the ground
const XW=[];
function iceWave(f,dir,o){const L=clearLen(f.pos,dir,o.len||16);XW.push({f,p:f.pos.clone().addScaledVector(dir,1),dir:dir.clone(),L,d:1,sp:o.sp||30,w:o.w||1.3,ft:o.ft||1.4,dmg:o.dmg||8,h:o.h||1,next:1,hit:{}});}
function updWaves(dt){for(let i=XW.length-1;i>=0;i--){const w=XW[i];const step=w.sp*dt;w.d+=step;w.p.addScaledVector(w.dir,step);
  while(w.next<=w.d&&w.next<=w.L){const q=w.f.pos;const x=w.p.x-w.dir.x*(w.d-w.next),z=w.p.z-w.dir.z*(w.d-w.next);
    const s=new V3(w.dir.z,0,-w.dir.x);iceSpike(x,z,w.h*(.8+w.next/w.L*.5),1.2);if(w.w>1.1){iceSpike(x+s.x*w.w*.6,z+s.z*w.w*.6,w.h*.65,1.1);iceSpike(x-s.x*w.w*.6,z-s.z*w.w*.6,w.h*.65,1.1);}
    if(Math.random()<.5)burst(ADD,TMP.set(x,.4,z),4,{colors:[0xcff4ff,0xffffff],speed:3,up:3,life:.4,size:.2,size1:0,grav:8,bright:1.6});w.next+=1.1;}
  for(const o of FS){if(ally(o,w.f)||o.dead||w.hit[o.id])continue;if(Math.hypot(o.pos.x-w.p.x,o.pos.z-w.p.z)<w.w+.5&&o.pos.y<1.8){w.hit[o.id]=1;iceHit(w.f,o,{dmg:w.dmg,kb:2,up:3,stun:.6},w.ft);}}
  CLONES.forEach(c=>{if(!ally(c.f,w.f)&&Math.hypot(c.pos.x-w.p.x,c.pos.z-w.p.z)<w.w+.5){if(!w.cid)w.cid=Math.random();cloneHurt(c,w.f,'w'+w.cid);}});
  props.forEach(pp=>{if(!pp.broken&&Math.hypot(pp.x-w.p.x,pp.z-w.p.z)<pp.r+w.w)breakProp(pp);});
  if(w.d>=w.L){XW.splice(i,1);xSnd(w.p,()=>AU.crunch(.3));}}}

/* ---------- compression: marbles ---------- */
function marbleMesh(col){const g=new THREE.Group();
  g.add(new THREE.Mesh(cg('mbl',()=>new THREE.SphereGeometry(.5,40,30)),new THREE.MeshPhysicalMaterial({color:0xeaf8ff,roughness:.02,metalness:0,clearcoat:1,clearcoatRoughness:0,transparent:true,opacity:.45,envMap:SKYENV||ENV||null,envMapIntensity:2,depthWrite:false})));
  const sw=new THREE.Mesh(cg('mbsw',()=>new THREE.TorusKnotGeometry(.22,.05,64,8,2,3)),addMat(col,1.8,.9));g.add(sw);
  const core=new THREE.Mesh(cg('mbc',()=>new THREE.SphereGeometry(.12,16,12)),addMat(0xffffff,2.2,.9));g.add(core);g.userData.sw=sw;return g;}
function compressO(f,o,t,pop){if(o.dead||o.downed||o.state==='framed')return false;o.set('framed');o.framedT=t;o.vel.set(0,0,0);o.xHold='marble';o.xBy=f;o.xPop=pop||9;
  if(!o.xMar){o.xMar=marbleMesh(f.hero.accent);scene.add(o.xMar);}o.xMar.userData.sw.material.color.setHex(f.hero.accent).multiplyScalar(1.8);o.xMar.visible=true;
  o.rig.root.scale.setScalar(.02);const c=o.chest(new V3());implode(c,30,1.6,[f.hero.accent,0xffffff],.3,2.2);ring(c,f.hero.accent,2,.3,false,2.4);xSnd(o.pos,()=>SND.glass.spec());return true;}
function marbleRelease(o){o.rig.root.scale.setScalar(o.hero.scale);if(o.xMar)o.xMar.visible=false;const c=o.chest(new V3());
  burst(ADD,c,40,{colors:[0xeaf8ff,0xffffff,(o.xBy?o.xBy.hero.accent:0x7ad8ff)],speed:8,life:.45,size:.22,size1:0,grav:10,bright:2.4,rad:.5});ring(c,0xffffff,2.6,.3,false,2.4);
  xSnd(o.pos,()=>SND.glass.pop());const by=o.xBy;o.xBy=null;if(by&&!o.dead&&!o.downed)hitO(by,o,{dmg:o.xPop||9,kb:6,up:12,launch:true,heavy:true,noSpark:true});}

/* ---------- erasure + binding ---------- */
function eraseMark(o){const R=o.rig;if(R.xEr)return R.xEr;const g=new THREE.Group();const m=addMat(0xff2a4a,2.4);
  g.add(new THREE.Mesh(cg('erR',()=>new THREE.TorusGeometry(.2,.025,8,40)),m));const b=new THREE.Mesh(cg('erB',()=>new THREE.BoxGeometry(.4,.04,.02)),m);b.rotation.z=.78;g.add(b);
  g.position.y=2.35;g.visible=false;R.root.add(g);R.xEr=g;return g;}
function eraseO(o,t){if(o.dead)return;o.eraseT=Math.max(o.eraseT||0,t);eraseMark(o);if(o===ME)announceSmall('YOUR POWERS WERE ERASED');}
function bindWrap(o){const R=o.rig;if(R.xBind)return R.xBind;const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xd8d8e0,roughness:.85});
  [[.95,.36],[1.18,.4],[1.38,.37]].forEach(([y,r],k)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,.045,8,32),m);t.rotation.set(Math.PI/2+(k-1)*.25,0,k*.4);t.position.y=y;g.add(t);});
  g.visible=false;R.root.add(g);R.xBind=g;return g;}
function bindO(o,t){if(o.dead)return;o.bindT=Math.max(o.bindT||0,t);bindWrap(o);}

/* ---------- lines: scarves, sights, eye beams ---------- */
const XL=[];
function xLine(col,w,life,a,b,o){o=o||{};let L=XL.find(q=>!q.m.visible);
  if(!L){if(XL.length>=20)L=XL[0];else{const m=new THREE.Mesh(cg('xlG',()=>{const g=new THREE.CylinderGeometry(1,1,1,8,1,true);g.translate(0,.5,0);g.rotateX(Math.PI/2);return g;}),
    new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m);L={m};XL.push(L);}}
  const glow=o.glow!==false;L.m.material.blending=glow?THREE.AdditiveBlending:THREE.NormalBlending;L.m.material.needsUpdate=true;L.m.material.color.setHex(col);if(glow)L.m.material.color.multiplyScalar(2);
  Object.assign(L,{t:0,life,w,a:a.clone(),b:b.clone(),from:o.from||null,to:o.to||null,op:o.op||1});L.m.visible=true;setLine(L);return L;}
function setLine(L){const m=L.m;if(L.from){if(L.from.dead){L.t=L.life;}else muzOf(L.from,L.a);}if(L.to&&!L.to.dead)L.to.chest(L.b);
  const len=L.a.distanceTo(L.b)||.01;m.position.copy(L.a);m.lookAt(L.b);const k=L.t/L.life,fade=k<.75?1:Math.max(0,1-(k-.75)/.25);m.scale.set(L.w*fade+.001,L.w*fade+.001,len);m.material.opacity=L.op*fade;}
function updLines(dt){for(const L of XL){if(!L.m.visible)continue;L.t+=dt;if(L.t>=L.life){L.m.visible=false;continue;}setLine(L);}}

/* ---------- projectiles: bullets and marbles ---------- */
const XP=[];const XPM={};
function mhaMat(col,b){const k=col+'_'+b;return XPM[k]||(XPM[k]=addMat(col,b));}
function xShot(f,o){const g=new THREE.Group();const col=o.col||f.hero.accent;
  if(o.kind==='bullet'){const tr=new THREE.Mesh(cg('xbT',()=>{const q=new THREE.CylinderGeometry(.035,.012,2.2,8);q.rotateX(Math.PI/2);q.translate(0,0,-1);return q;}),mhaMat(col,2.6));g.add(tr);
    g.add(new THREE.Mesh(cg('xbC',()=>new THREE.SphereGeometry(.07,12,10)),mhaMat(0xffffff,3)));if(o.big)g.scale.setScalar(2.2);}
  else{const m=marbleMesh(col);m.scale.setScalar(o.kind==='big'?1.6:.5);g.add(m);g.userData.sw=m.userData.sw;}
  scene.add(g);const p=Object.assign({f,g,t:0,life:1.4,hitSet:{},dmg:8,kb:6,up:3,stun:.5,r:.7,grav:0,bounce:0,home:0},o);p.pos=o.pos.clone();p.vel=o.vel.clone();g.position.copy(p.pos);XP.push(p);return p;}
function xKill(i){const p=XP[i];scene.remove(p.g);XP.splice(i,1);}
function nextFoe(p,from,R){let best=null,bd=R;for(const o of FS){if(ally(o,p.f)||o.dead||o.downed||p.hitSet[o.id])continue;const d=o.pos.distanceTo(from);if(d<bd){bd=d;best=o;}}return best;}
function updShots(dt){for(let i=XP.length-1;i>=0;i--){const p=XP[i];p.t+=dt;
  if(p.home&&p.tgt&&!p.tgt.dead&&!p.hitSet[p.tgt.id]){const sp=p.vel.length(),want=p.tgt.chest(TMP).sub(p.pos).normalize().multiplyScalar(sp);p.vel.lerp(want,Math.min(1,p.home*dt)).setLength(sp);}
  if(p.grav)p.vel.y-=p.grav*dt;p.pos.addScaledVector(p.vel,dt);p.g.position.copy(p.pos);
  if(p.vel.lengthSq()>.01)p.g.quaternion.setFromUnitVectors(TMP2.set(0,0,1),TMP.copy(p.vel).normalize());
  if(p.g.userData.sw)p.g.userData.sw.rotation.y+=dt*8;
  if(p.kind==='bullet'){if(nearCam(p.pos,70)&&Math.random()<.7)ADD.spawn(p.pos.x,p.pos.y,p.pos.z,rand(-.3,.3),rand(-.3,.3),rand(-.3,.3),..._rgb(p.col||p.f.hero.accent,1.6),.18,.12,0,0,0);}
  else if(Math.random()<.5)burst(ADD,p.pos,1,{colors:[p.col||p.f.hero.accent,0xffffff],speed:.6,life:.3,size:.2,size1:0,bright:1.8});
  let dead=false;
  if(p.kind==='big'&&(p.pos.y<=.5||p.t>p.life)){p.onLand&&p.onLand(p);dead=true;}
  if(!dead)for(const o of FS){if(ally(o,p.f)||o.dead||p.hitSet[o.id])continue;if(o.chest(TMP).distanceTo(p.pos)>p.r+.5)continue;if(o.invuln>0&&o.state!=='framed')continue;
    p.hitSet[o.id]=1;const res=applyHit(p.f,o,{dmg:p.dmg,kb:p.kb,up:p.up,stun:p.stun,launch:p.up>5,heavy:p.heavy!==false,pt:o.chest(new V3()),noSpark:p.kind!=='bullet'});
    if(p.onHit)p.onHit(p,o,res);if(p.kind==='bullet')burst(ADD,o.chest(TMP),14,{colors:[0xffffff,p.col||p.f.hero.accent],speed:7,life:.25,size:.2,size1:0,bright:2.4});
    if(p.bounce>0){const N=nextFoe(p,o.pos,15);if(N){p.bounce--;p.tgt=N;p.pos.copy(o.chest(new V3()));p.vel.copy(N.chest(new V3()).sub(p.pos).normalize().multiplyScalar(p.vel.length()));p.t=0;
      xLine(p.col||p.f.hero.accent,.03,.25,p.pos,N.chest(new V3()));continue;}}
    if(!p.pierce){dead=true;break;}}
  if(!dead&&(p.t>p.life||p.pos.y<0||Math.abs(p.pos.x)>BOUND+2||Math.abs(p.pos.z)>BOUND+2||insideBld(p.pos.x,p.pos.z,0,p.pos.y))){dead=true;
    if(p.kind==='bullet'){burst(ADD,p.pos,8,{colors:[0xffffff,0xffd08a],speed:5,life:.25,size:.15,size1:0,grav:10,bright:2.2});}
    else if(p.kind==='big')p.onLand&&p.onLand(p);else{burst(ADD,p.pos,16,{colors:[0xeaf8ff,0xffffff],speed:5,life:.3,size:.18,size1:0,grav:10,bright:2});}}
  if(!dead)for(const pp of props){if(pp.broken)continue;if(Math.abs(pp.x-p.pos.x)<pp.r+.4&&Math.abs(pp.z-p.pos.z)<pp.r+.4){breakProp(pp);if(!p.pierce&&p.kind!=='big'){dead=true;}break;}}
  if(dead)xKill(i);}}
function fireBullet(f,T,o){o=o||{};const st=o.from||muzOf(f);let dir;if(o.dir)dir=o.dir.clone();else if(T)dir=T.chest(new V3()).sub(st).normalize();else{dir=f.fwd();}
  const p=xShot(f,Object.assign({kind:'bullet',pos:st,vel:dir.multiplyScalar(o.speed||75),tgt:T,life:o.life||.9,r:o.r||.5},o));
  if(!o.quiet){burst(ADD,st,10,{colors:[0xffffff,0xffd08a,f.hero.accent],speed:5,life:.15,size:.3,size1:0,bright:3,dir:p.vel.clone().normalize(),dirSp:6});flashLight(st,0xffd08a,8);xSnd(f.pos,()=>SND.rifle.shot());}
  return p;}

/* ---------- RECOIL's attacks are rifle shots ---------- */
function recoilShot(f,M){const ck=M.hold?(f.chgK||1):1,tier=M.vfx||(M.heavy?2:1);
  let T=(f.tgt&&!f.tgt.dead&&!f.tgt.downed&&f.tgt.pos.distanceTo(f.pos)<30)?f.tgt:enemyInFront(f,30,.5);
  const st=muzOf(f),fw=f.fwd();let dir=T?T.chest(new V3()).sub(st).normalize():fw.clone();
  if(T){const flat=Math.hypot(dir.x,dir.z)||1;if((dir.x*fw.x+dir.z*fw.z)/flat<.5){dir=fw.clone();T=null;}else faceTo(f,T);}
  if(M.dive){dir=new V3(fw.x*.6,-1,fw.z*.6).normalize();T=null;}
  const base={dmg:M.dmg*ck,kb:M.kb*Math.sqrt(ck),up:M.up,stun:M.stun,heavy:!!M.heavy,speed:80,life:.45,home:T?2.5:0,quiet:true,
    onHit:(p,o,r)=>{if(r===true&&(M.vfx||M.heavy||M.launch))punchFX(f,o,tier,o.chest(new V3()));}};
  const n=M.shot===3||(M.lat>2.5)?3:1;
  for(let k=0;k<n;k++){const d=dir.clone().applyAxisAngle(UP,(k-(n-1)/2)*.12);fireBullet(f,n>1?null:T,Object.assign({},base,{dir:d,from:st,dmg:base.dmg/(n>1?1.6:1),
    big:M.gb||M.shot===2||ck>1.5,pierce:!!(M.gb||ck>1.5)}));}
  burst(ADD,st,M.heavy?14:7,{colors:[0xffffff,0xffd08a,f.hero.accent],speed:M.heavy?6:4,life:.15,size:.28,size1:0,bright:3,dir,dirSp:6});flashLight(st,0xffd08a,M.heavy?8:4);
  sndHere(f,()=>{if(M.heavy)SND.rifle.shot();else{AU.noise(.06,.4,'highpass',1600,4500,1);AU.noise(.18,.2,'lowpass',900,150,1);AU.sub(120,50,.1,.25);}});
  if(M.heavy||ck>1.2){f.vel.x-=fw.x*4*ck;f.vel.z-=fw.z*4*ck;}}

/* ---------- LEGION's mud clones ---------- */
const CLONES=[];const CLONE_CAP=6;const SELF_SP={harden:1,vow:1,nullfield:1,bladeform:1,double:1,snipe:1,compress:1,bind:1,glacier:1,recipro:1};
function wantsClones(h){return HAS(h,'legion')||h.special==='double'||h.ult==='sanctuary'||KIT(h,'elem')==='legion'||KIT(h,'alt')==='legion';}
function cloneRig(f){const R=buildRig(f.hero);R.root.visible=false;scene.add(R.root);if(R.whip)R.whip.group.visible=false;if(R.beam)R.beam.group.visible=false;R.frame.visible=false;return R;}
function mhaInit(f){f.xPool=[];if(wantsClones(f.hero))for(let i=0;i<4;i++)f.xPool.push(cloneRig(f));}
function mhaDispose(f){CLONES.filter(c=>c.f===f).forEach(c=>meltClone(c,true));(f.xPool||[]).forEach(R=>{scene.remove(R.root);if(R.whip)scene.remove(R.whip.group);if(R.beam)scene.remove(R.beam.group);});f.xPool=[];
  if(f.xMar){scene.remove(f.xMar);f.xMar=null;}}
function spawnClone(f,x,z,life,o){o=o||{};if(!f.xPool)f.xPool=[];let R=f.xPool.find(r=>!r.xUsed);
  if(!R){if(f.xPool.length<8){R=cloneRig(f);f.xPool.push(R);}else{const old=CLONES.find(c=>c.f===f);if(!old)return null;meltClone(old);R=f.xPool.find(r=>!r.xUsed);if(!R)return null;}}
  x=clamp(x,-BOUND+1,BOUND-1);z=clamp(z,-BOUND+1,BOUND-1);if(insideBld(x,z,.5,1)&&!o.drop){x=f.pos.x;z=f.pos.z;}
  R.xUsed=true;R.root.visible=true;const c={f,R,pos:new V3(x,o.y||0,z),vy:0,face:f.face,t:0,life,ph:rand(0,6),atkT:rand(.15,.4),P:Object.assign({},GUARD),tgt:null,retT:0,n:0,
    drop:!!o.drop,boom:o.boom||0,decoy:!!o.decoy,dm:o.dm||1,hp:2,hitBy:{},flash:0};
  if(!c.decoy){const mine=CLONES.filter(q=>q.f===f&&!q.decoy);if(mine.length>=CLONE_CAP)meltClone(mine[0]);}CLONES.push(c);
  if(!c.drop){const p=new V3(x,.4,z);burst(SMK,p,22,{colors:[0x4a3a2a,0x6a5a48,0x2a2018],speed:4,up:3,life:.7,size:.45,size1:.1,grav:9});xSnd(p,()=>SND.mud.melt());}
  return c;}
function meltClone(c,silent){const i=CLONES.indexOf(c);if(i<0)return;CLONES.splice(i,1);c.R.root.visible=false;c.R.xUsed=false;if(silent)return;
  const p=new V3(c.pos.x,.8,c.pos.z);burst(SMK,p,26,{colors:[0x4a3a2a,0x6a5a48,0x2a2018,0x8a7a68],speed:4.5,up:2,life:.8,size:.5,size1:.08,grav:9,rad:.5});
  if(c.boom&&!c.f.dead){explosion(p,2.6,[0x8a7a68,0xffd23f,0x4a3a2a],false);foes(c.f,c.boom>1?3.2:2.6,c.pos).forEach(o=>hitAt(c.f,c.pos,o,{dmg:c.boom>1?10:7,kb:9,up:10,launch:true,heavy:true,noSpark:true}));xSnd(p,()=>AU.boom(false));}
  else xSnd(p,()=>SND.mud.melt());}
// a clone takes a hit from enemy swings, projectiles, and specials/ultimates going off next to it; two hits and it melts
function cloneHurt(c,src,key){if(c.hitBy[key])return;c.hitBy[key]=1;c.hp--;c.flash=1;const p=new V3(c.pos.x,c.pos.y+1.2,c.pos.z);
  burst(SMK,p,14,{colors:[0x4a3a2a,0x6a5a48,0x8a7a68],speed:4,life:.5,size:.3,size1:.06,grav:9});hitSpark(p,src&&src.hero?src.hero.color:0xffffff,false);xSnd(p,()=>SND.mud.hit(.8));
  if(src&&src.pos){const dx=c.pos.x-src.pos.x,dz=c.pos.z-src.pos.z,l=Math.hypot(dx,dz)||1;const nx=c.pos.x+dx/l*.8,nz=c.pos.z+dz/l*.8;if(!insideBld(nx,nz,.45,1)){c.pos.x=nx;c.pos.z=nz;}}
  c.atkT=Math.max(c.atkT,.45);}
function cloneDamage(c,dt){const f=c.f,cp=TMP3.set(c.pos.x,c.pos.y+1.2,c.pos.z);c.flash=Math.max(0,c.flash-dt*4);
  for(const o of FS){if(o.dead||ally(o,f))continue;const dx=c.pos.x-o.pos.x,dz=c.pos.z-o.pos.z,d=Math.hypot(dx,dz);if(d>14)continue;
    const st0=Math.round((game.time-o.stateT)*20);
    if(o.state==='attack'&&o.move&&!o.move.shot&&KIT(o.hero,'wpn')!=='recoil'){const M=o.move,t=o.stateT;
      if(t>=M.st&&t<M.st+M.ac&&d<M.rng+.7&&Math.abs(c.pos.y-o.pos.y)<2){const fw=o.fwd(TMP2),al=(dx*fw.x+dz*fw.z),lt=Math.abs(dx*fw.z-dz*fw.x);if(al>-.3&&lt<(M.lat||1.15)+.4)cloneHurt(c,o,'m'+o.id+'_'+st0);}}
    else if(o.state==='special'&&o.fired&&d<5.5&&!SELF_SP[o.curSpecial()])cloneHurt(c,o,'s'+o.id+'_'+st0);
    else if(o.state==='ult'&&o.stateT>.95&&d<9)cloneHurt(c,o,'u'+o.id+'_'+st0);}
  for(const p of projs){if(p.dead||ally(p.owner,f))continue;if(p.pos.distanceTo(cp)<(p.r||.5)+.6||(p.big&&Math.hypot(p.pos.x-c.pos.x,p.pos.z-c.pos.z)<4)){if(!p.cid)p.cid=Math.random();cloneHurt(c,p.owner,'p'+p.cid);if(!p.pierce&&!p.big&&!p.multi)p.dead=true;}}
  for(const p of XP){if(ally(p.f,f))continue;if(p.pos.distanceTo(cp)<p.r+.6){if(!p.cid)p.cid=Math.random();cloneHurt(c,p.f,'x'+p.cid);if(!p.pierce)p.t=p.life+1;}}}
function clonePose(c,dt,moving){const t=game.time;let T;
  if(c.drop)T=c.vy<0?POSES.slamAir:POSES.jump;
  else if(c.decoy)T=Object.assign({},POSES.win);
  else if(c.atkPose>0){c.atkPose-=dt;T=POSES[c.atkKey]||POSES.jabRh;}
  else if(moving){c.ph+=dt*11;const S=Math.sin(c.ph),C=Math.cos(c.ph);T=Object.assign({},BASE,{hy:-.06+Math.abs(C)*.07,sx:.4,hd:-.1,lSx:-S*1.1-.35,rSx:S*1.1-.35,lE:-1.5,rE:-1.5,lSz:.18,rSz:-.18,
    lHx:S*1.1-.15,rHx:-S*1.1-.15,lK:.25+Math.max(0,Math.sin(c.ph+1.3))*1.3,rK:.25+Math.max(0,Math.sin(c.ph+Math.PI+1.3))*1.3});}
  else T=GUARD;
  const k=Math.min(1,18*dt);for(const key in T)c.P[key]+=(T[key]-c.P[key])*k;const P=c.P,R=c.R;
  if(c.flash>0)R.root.scale.setScalar(c.f.hero.scale*(1+c.flash*.08));else if(R.root.scale.x!==c.f.hero.scale)R.root.scale.setScalar(c.f.hero.scale);
  R.root.position.copy(c.pos);R.root.visible=Math.hypot(camera.position.x-c.pos.x,camera.position.z-c.pos.z)>2.4;R.root.rotation.y=c.face;R.hips.position.y=(R.hipY||.95)+P.hy;R.hips.rotation.x=P.hx;R.spine.rotation.set(P.sx,P.sy,P.sz);R.head.rotation.x=P.hd;
  R.lS.rotation.set(P.lSx,0,P.lSz);R.lE.rotation.x=P.lE;R.rS.rotation.set(P.rSx,0,P.rSz);R.rE.rotation.x=P.rE;R.lH.rotation.set(P.lHx,0,P.lHz);R.lK.rotation.x=P.lK;R.rH.rotation.set(P.rHx,0,P.rHz);R.rK.rotation.x=P.rK;
  if(R.cloth&&nearCam(c.pos,40))updateCloth(R.cloth,t,moving?9:1);}
function updClones(dt){for(let i=CLONES.length-1;i>=0;i--){const c=CLONES[i],f=c.f;c.t+=dt;
  if(f.dead||c.t>c.life||!FS.includes(f)||c.hp<=0){meltClone(c);continue;}
  if(!c.drop&&!c.decoy)cloneDamage(c,dt);if(c.hp<=0){meltClone(c);continue;}
  let moving=false;
  if(c.drop){c.vy-=34*dt;c.pos.y+=c.vy*dt;if(c.pos.y<=0){c.pos.y=0;c.drop=false;const p=c.pos.clone();ring(TMP.set(p.x,.2,p.z),0xffd23f,6,.4,true,2.2);dust(p,14,1.3);debris(TMP.set(p.x,.4,p.z),6,0,8,.25);shake(.6,p);
      xSnd(p,()=>{AU.landW(1.4,true);SND.mud.hit(1.2);});foes(f,3,p).forEach(o=>hitAt(f,p,o,{dmg:11,kb:8,up:11,launch:true,heavy:true,noSpark:true}));}}
  else if(c.decoy){if(Math.random()<.3)burst(SMK,TMP.set(c.pos.x,rand(.3,1.8),c.pos.z),1,{colors:[0x4a3a2a,0x6a5a48],speed:.6,life:.6,size:.3,size1:.1,grav:2});}
  else{c.retT-=dt;if(c.retT<=0||!c.tgt||c.tgt.dead||c.tgt.downed){c.retT=.5;let best=null,bd=26;for(const o of FS){if(ally(o,f)||o.dead||o.downed)continue;const d=o.pos.distanceTo(c.pos);if(d<bd){bd=d;best=o;}}c.tgt=best;}
    const T=c.tgt;let gx,gz,stop;if(T){gx=T.pos.x;gz=T.pos.z;stop=1.5;}else{gx=f.pos.x+Math.sin(f.face+2.2+i)*2.5;gz=f.pos.z+Math.cos(f.face+2.2+i)*2.5;stop=.8;}
    const dx=gx-c.pos.x,dz=gz-c.pos.z,d=Math.hypot(dx,dz);
    if(d>stop&&!(c.atkPose>0)){const sp=Math.min(d-stop+.2,8.2*dt*(f.slowT>0?.7:1));const nx=c.pos.x+dx/d*sp,nz=c.pos.z+dz/d*sp;
      if(!insideBld(nx,nz,.45,1)){c.pos.x=clamp(nx,-BOUND,BOUND);c.pos.z=clamp(nz,-BOUND,BOUND);}else if(!insideBld(nx,c.pos.z,.45,1))c.pos.x=nx;else if(!insideBld(c.pos.x,nz,.45,1))c.pos.z=nz;
      moving=true;c.face=Math.atan2(dx,dz);}
    if(T){c.face=Math.atan2(T.pos.x-c.pos.x,T.pos.z-c.pos.z);c.atkT-=dt;
      if(d<2.1&&c.atkT<=0&&Math.abs(T.pos.y-c.pos.y)<2&&!(game.time<(T.xCloneT||0))){c.atkT=.65;T.xCloneT=game.time+.4;c.n++;const fin=c.n%3===0;c.atkKey=fin?'heavyh':(c.n%2?'jabRh':'jabLh');c.atkPose=.16;
        hitAt(f,c.pos,T,fin?{dmg:5*c.dm,kb:8,up:9,launch:true,heavy:true}:{dmg:2.8*c.dm,kb:2.5,stun:.4});
        if(Math.random()<.5)burst(SMK,T.chest(TMP),6,{colors:[0x4a3a2a,0x6a5a48],speed:3,life:.4,size:.25,size1:.05,grav:8});}}}
  clonePose(c,dt,moving);}}

/* ---------- per-fighter status from the new kits ---------- */
const XHOLD_REL={};
function updStatus(dt){for(const o of FS){const R=o.rig;
  if(o.dead){o.eraseT=Math.min(o.eraseT||0,.001);o.bindT=0;o.xTop=0;}
  const holding=o.state==='framed'&&!!o.xHold;
  if(o.xHold&&!holding){if(o.xHold==='marble')marbleRelease(o);else if(XHOLD_REL[o.xHold])XHOLD_REL[o.xHold](o);else if(o.xHold==='ice'){burst(ADD,o.chest(new V3()),30,{colors:[0xcff4ff,0xffffff,0x7ad4ff],speed:6,life:.5,size:.22,size1:0,grav:12,bright:2,rad:.6});}o.xHold=null;}
  if(R.xIce)R.xIce.visible=o.xHold==='ice'&&!o.dead;
  if(o.xHold){R.frame.visible=false;if(o.xHold==='marble'){if(R.root.scale.x>.05)R.root.scale.setScalar(.02);if(o.xMar){o.xMar.position.set(o.pos.x,o.pos.y+.55,o.pos.z);o.xMar.rotation.y+=dt*2;o.xMar.userData.sw.rotation.x+=dt*5;}}}
  if(o.xSelf&&(o.state!=='special'||o.dead)){o.xSelf=false;R.root.scale.setScalar(o.hero.scale);if(o.xMar)o.xMar.visible=false;}
  if(o.xSelf&&o.xMar){o.xMar.position.set(o.pos.x,o.pos.y+.55,o.pos.z);o.xMar.rotation.x-=dt*12;}
  if(o.eraseT>0){o.eraseT-=dt;o.specCD=Math.max(o.specCD,.3);if(o.meter>=100){o.meter=99.9;o.xErM=1;}o.armorT=0;o.vowT=0;o.fieldT=0;o.bladeT=0;o.stolenT=0;o.hasteT=0;o.powT=0;o.xTop=0;
    const m=R.xEr;if(m){m.visible=!o.dead;m.rotation.y=Math.atan2(camera.position.x-o.pos.x,camera.position.z-o.pos.z)-o.face;m.children[0].material.opacity=.7+Math.sin(game.time*12)*.3;}
    if(o.eraseT<=0){if(R.xEr)R.xEr.visible=false;if(o.xErM&&NET.role!=='client')o.meter=100;o.xErM=0;}}
  if(R.xBind){R.xBind.visible=o.bindT>0&&!o.dead;if(o.bindT>0){o.bindT-=dt;R.xBind.rotation.y+=dt*.5;}}
  if(o.xTop>0&&!o.dead){o.xTop-=dt;const sp=Math.hypot(o.vel.x,o.vel.z);
    if(nearCam(o.pos,60))[R.lK,R.rK].forEach(k=>{k.getWorldPosition(TMP2);burst(ADD,TMP2,sp>4?2:1,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:1,up:.5,life:.3,size:.3,size1:0,bright:2.2,rad:.1});});
    if(sp>6&&(!o.xTopH||game.time-o.xTopH>.3)){o.xTopH=game.time;foes(o,1.7).forEach(e=>{if(hitO(o,e,{dmg:4,kb:7,up:5,launch:true,noSpark:true})===true)burnOn(e,1.5,3);});}}
}}

function updateMHA(dt){updDeathUlts(dt);updWaves(dt);updIce(dt);updShots(dt);updLines(dt);updClones(dt);updStatus(dt);
  for(let i=XDEL.length-1;i>=0;i--){if(game.time>=XDEL[i].t){const d=XDEL.splice(i,1)[0];try{d.fn();}catch(e){}}}}
function clearMHA(){if(typeof DU!=='undefined')clearDeathUlts();XW.length=0;XDEL.length=0;for(let i=XP.length-1;i>=0;i--)xKill(i);CLONES.slice().forEach(c=>meltClone(c,true));XL.forEach(L=>L.m.visible=false);ICEP.forEach(g=>g.visible=false);
  (typeof FS!=='undefined'?FS:[]).forEach(o=>{o.xHold=null;o.eraseT=0;o.bindT=0;o.xTop=0;if(o.xSelf||o.rig.root.scale.x<.05)o.rig.root.scale.setScalar(o.hero.scale);o.xSelf=false;if(o.xMar)o.xMar.visible=false;
    ['xIce','xEr','xBind'].forEach(k=>{if(o.rig[k])o.rig[k].visible=false;});});}

/* ================= SPECIALS ================= */
Object.assign(SPECIALS,{
  glacier(f){const t=f.stateT;f.poseKey=t<.15?'specw':'point';
    once(f,.15,()=>{iceWave(f,f.fwd(),{len:16,sp:30,w:1.3,ft:1.4,dmg:8});xSnd(f.pos,()=>SND.frostfire.spec());});
    if(t>.45)f.set(f.onGround?'idle':'air');return 12;},
  recipro(f,dt){const t=f.stateT,V=f.vf;
    if(t<.12){f.poseKey='charge';if(!V.rev){V.rev=1;xSnd(f.pos,()=>SND.engine.dash());}return 14;}
    if(!V.dir){V.dir=xDirTo(f,tgtOf(f,15));f.face=Math.atan2(V.dir.x,V.dir.z);xSnd(f.pos,()=>SND.engine.spec());burst(ADD,f.chest(new V3()).addScaledVector(V.dir,-.6),18,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:4,life:.3,size:.4,size1:0,bright:2.4,dir:V.dir,dirSp:-10});}
    if(t<.5&&!V.hit){const sp=42*Math.max(.25,1-(t-.12)/.45);f.vel.x=V.dir.x*sp;f.vel.z=V.dir.z*sp;f.poseKey='airh';
      [f.rig.lK,f.rig.rK].forEach(k=>{k.getWorldPosition(TMP2);burst(ADD,TMP2,3,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:2,life:.25,size:.4,size1:0,bright:2.4,dir:V.dir,dirSp:-12});});
      for(const o of foes(f,1.9)){if(hitO(f,o,{dmg:10,kb:15,up:8,launch:true,heavy:true})!==false){V.hit=1;miniBlast(o.chest(new V3()),.9);f.vel.multiplyScalar(.2);sndHere(f,()=>SND.engine.hit(1.3));break;}}
      return 0;}
    f.poseKey='kickh';if(t>.62)f.set(f.onGround?'idle':'air');return 10;},
  bind(f){const t=f.stateT,V=f.vf;f.poseKey=t<.14?'specw':'throwS';
    once(f,.14,()=>{const T=tgtOf(f,15);xSnd(f.pos,()=>SND.scarf.spec());
      if(T){V.T=T;xLine(0xd8d8e0,.05,.5,muzOf(f),T.chest(new V3()),{from:f,to:T,glow:false});if(hitO(f,T,{dmg:5,kb:0,stun:1.1,hold:true})===true)bindO(T,1.2);else V.T=null;}
      else{const e=f.chest(new V3()).addScaledVector(f.fwd(),12);xLine(0xd8d8e0,.05,.3,muzOf(f),e,{from:f,glow:false});}});
    if(V.T&&t<.45&&!V.T.dead){const fw=f.fwd();pullTo(V.T,lerp(V.T.pos.x,f.pos.x+fw.x*1.8,.2),lerp(V.T.pos.z,f.pos.z+fw.z*1.8,.2));}
    if(t>.55)f.set(f.onGround?'idle':'air');return 10;},
  compress(f){const t=f.stateT;f.poseKey=t<.15?'specw':'throwS';
    once(f,.15,()=>{const T=tgtOf(f,20),st=muzOf(f),d=T?T.chest(new V3()).sub(st).normalize():f.fwd();
      xShot(f,{kind:'marble',pos:st,vel:d.multiplyScalar(30),tgt:T,home:1.5,dmg:5,kb:0,up:0,stun:.4,life:1,onHit:(p,o,r)=>{if(r===true)compressO(f,o,1.5,9);}});xSnd(f.pos,()=>SND.glass.spec());});
    if(t>.4)f.set(f.onGround?'idle':'air');return 10;},
  double(f){const t=f.stateT;f.poseKey=t<.2?'charge':'command';
    once(f,.2,()=>{const [fw,sd]=xBasis(f);[-1,1].forEach(s=>spawnClone(f,f.pos.x+sd.x*s*1.4+fw.x*.6,f.pos.z+sd.z*s*1.4+fw.z*.6,Infinity));xSnd(f.pos,()=>SND.mud.spec());});
    if(t>.45)f.set(f.onGround?'idle':'air');return 12;},
  snipe(f){const t=f.stateT,V=f.vf;f.poseKey='aim';
    if(!V.T){V.T=tgtOf(f,36)||null;V.k=1;if(V.T)faceTo(f,V.T);}
    if(t<.3){if(V.T&&!V.T.dead)faceTo(f,V.T);if(!V.sight){V.sight=1;const e=V.T?V.T.chest(new V3()):muzOf(f).addScaledVector(f.fwd(),30);xLine(0xff2a4a,.012,.32,muzOf(f),e,{from:f,to:V.T,op:.8});xSnd(f.pos,()=>AU.clicks(2,.08,.08,1500));}return 14;}
    once(f,.3,()=>{fireBullet(f,V.T&&!V.T.dead?V.T:null,{dmg:13,kb:9,up:4,stun:.55,home:4,speed:75});const fw=f.fwd();f.vel.x-=fw.x*5;f.vel.z-=fw.z*5;});
    if(t>.6)f.set(f.onGround?'idle':'air');return 8;},
});

/* ---- charged (hold) and back variants ---- */
Object.assign(SPECVAR,{
  glacier:{
    chg:['GLACIAL WALL',(f,dt,k)=>{once(f,.2,()=>{[-.28,0,.28].forEach(a=>iceWave(f,f.fwd().applyAxisAngle(UP,a),{len:18+6*k,sp:34,w:1.6,ft:1.8+.8*k,dmg:9+5*k,h:1.25+.4*k}));sndHere(f,()=>SND.frostfire.spec());});vpose(f,.2,'charge','point');endAt(f,.55);return 12;}],
    alt:['HEAT FLASH',f=>{once(f,.12,()=>{const fw=f.fwd(),c=f.chest(new V3());for(let q=0;q<70;q++){const a=rand(-.55,.55),d=fw.clone().applyAxisAngle(UP,a),sp=rand(10,20);ADD.spawn(c.x,c.y,c.z,d.x*sp,rand(-1,2),d.z*sp,..._rgb(pick([0xff6a3a,0xffb347,0xffffff]),1.8),.4,.5,1.2,0,1.5);}
      flashLight(c,0xff6a3a,14);foes(f,7.5,f.pos,.55).forEach(o=>{hitO(f,o,{dmg:9,kb:10,up:6,launch:true});burnOn(o,3,4);});shatterIce(f.pos,8);
      f.vel.set(-fw.x*11,6,-fw.z*11);f.onGround=false;f.pos.y+=.1;sndHere(f,()=>SND.fire.spec());});vpose(f,.12,'specw','spech');endAt(f,.45);return 0;}]},
  recipro:{
    chg:['RECIPRO EXTEND',(f,dt,k)=>{const t=f.stateT,V=f.vf;if(!V.dir){V.dir=xDirTo(f,tgtOf(f,22));f.face=Math.atan2(V.dir.x,V.dir.z);V.h={};f.fired=true;sndHere(f,()=>SND.engine.spec());}
      if(t<.7){const sp=(50+20*k)*Math.max(.3,1-t/.8);f.vel.x=V.dir.x*sp;f.vel.z=V.dir.z*sp;f.poseKey='airh';f.invuln=Math.max(f.invuln,.1);
        [f.rig.lK,f.rig.rK].forEach(q=>{q.getWorldPosition(TMP2);burst(ADD,TMP2,4,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:2,life:.3,size:.45,size1:0,bright:2.6,dir:V.dir,dirSp:-14});});
        foes(f,2.1).forEach(o=>{if(V.h[o.id])return;V.h[o.id]=1;hitO(f,o,{dmg:11+6*k,kb:16,up:9,launch:true,heavy:true});miniBlast(o.chest(new V3()),1);});return 0;}
      f.poseKey='kickh';endAt(f,.8);return 10;}],
    alt:['REVERSE THRUST',f=>{once(f,.1,()=>{const fw=f.fwd();ring(TMP.set(f.pos.x,.3,f.pos.z),0xffb03a,7,.35,true,2.4);swirl(f.chest(new V3()),30,2,[0xffb03a,0xff5a1f,0xffffff],8,.35,2.2);
      foes(f,3.4).forEach(o=>hitO(f,o,{dmg:8,kb:13,up:6,launch:true,heavy:true}));f.vel.set(-fw.x*16,5,-fw.z*16);f.onGround=false;f.pos.y+=.1;sndHere(f,()=>SND.engine.spec());});
      f.poseKey='kickSpin';f.face+=.4;endAt(f,.4);return 0;}]},
  bind:{
    chg:['CAPTURE WEAVE',(f,dt,k)=>{const V=f.vf;once(f,.2,()=>{V.L=foes(f,14+4*k,f.pos,.4).slice(0,3);sndHere(f,()=>SND.scarf.spec());
        V.L.forEach(o=>{xLine(0xd8d8e0,.05,.6,muzOf(f),o.chest(new V3()),{from:f,to:o,glow:false});if(hitO(f,o,{dmg:4,kb:0,stun:1.4+.6*k,hold:true})===true)bindO(o,1.2+.5*k);});});
      if(V.L&&f.stateT<.55){const fw=f.fwd();V.L.forEach((o,i)=>{if(!o.dead)pullTo(o,lerp(o.pos.x,f.pos.x+fw.x*2+(i-1)*fw.z*1.2,.15),lerp(o.pos.z,f.pos.z+fw.z*2-(i-1)*fw.x*1.2,.15));});}
      atT(f,'slam',.55,()=>{(V.L||[]).forEach(o=>{if(!o.dead)hitO(f,o,{dmg:6+6*k,kb:6,up:11,launch:true,heavy:true});});});vpose(f,.2,'charge',f.stateT<.55?'throwS':'smashh');endAt(f,.75);return 10;}],
    alt:['SCARF SWING',f=>{const V=f.vf,t=f.stateT;once(f,.12,()=>{const T=tgtOf(f,17);V.T=T;sndHere(f,()=>SND.scarf.spec());const e=T?T.chest(new V3()):f.chest(new V3()).addScaledVector(f.fwd(),10);
        xLine(0xd8d8e0,.05,.4,muzOf(f),e,{from:f,to:T,glow:false});V.e=e;});
      if(f.fired&&!V.kick&&t<.5){const T=V.T,goal=T&&!T.dead?T.pos:V.e,d=TMP.set(goal.x-f.pos.x,0,goal.z-f.pos.z),L=d.length();
        if(L>1.6){d.normalize();f.vel.x=d.x*30;f.vel.z=d.z*30;f.face=Math.atan2(d.x,d.z);f.poseKey='airh';}else V.kick=1;
        if((V.kick||t>.45)&&T&&!T.dead&&T.pos.distanceTo(f.pos)<2.6){V.kick=1;hitO(f,T,{dmg:10,kb:13,up:7,launch:true,heavy:true});f.vel.multiplyScalar(.2);}return 0;}
      if(!f.fired)f.poseKey='specw';else f.poseKey='kickh';endAt(f,.6);return 8;}]},
  compress:{
    chg:['MARBLE VOLLEY',(f,dt,k)=>{once(f,.15,()=>{const st=muzOf(f);[-.36,-.18,0,.18,.36].forEach(a=>{const d=f.fwd().applyAxisAngle(UP,a);
        xShot(f,{kind:'marble',pos:st,vel:d.multiplyScalar(28),dmg:4,kb:0,up:0,stun:.4,life:1,onHit:(p,o,r)=>{if(r===true)compressO(f,o,1.2+.6*k,7+5*k);}});});sndHere(f,()=>SND.glass.spec());});
      vpose(f,.15,'specw','throwS');endAt(f,.45);return 10;}],
    alt:['VANISHING ACT',f=>{const t=f.stateT,fw=f.fwd();
      once(f,.08,()=>{f.xSelf=true;f.invuln=Math.max(f.invuln,.65);if(!f.xMar){f.xMar=marbleMesh(f.hero.accent);scene.add(f.xMar);}f.xMar.visible=true;f.rig.root.scale.setScalar(.02);
        implode(f.chest(new V3()),24,1.4,[f.hero.accent,0xffffff],.3,2.2);sndHere(f,()=>SND.glass.spec());});
      if(f.xSelf&&t<.55){f.vel.x=-fw.x*17;f.vel.z=-fw.z*17;}
      atT(f,'out',.55,()=>{f.xSelf=false;f.rig.root.scale.setScalar(f.hero.scale);if(f.xMar)f.xMar.visible=false;const c=f.chest(new V3());
        burst(ADD,c,30,{colors:[0xeaf8ff,0xffffff,f.hero.accent],speed:7,life:.4,size:.2,size1:0,grav:10,bright:2.4});sndHere(f,()=>SND.glass.pop());
        foes(f,3.2).forEach(o=>hitO(f,o,{dmg:6,kb:8,up:8,launch:true}));});
      f.poseKey='snap';endAt(f,.65);return 2;}]},
  double:{
    chg:['TRIPLE TROUBLE',(f,dt,k)=>{once(f,.25,()=>{const [fw,sd]=xBasis(f);[-1,0,1].forEach(s=>spawnClone(f,f.pos.x+sd.x*s*1.6+fw.x*(s?0:1.4),f.pos.z+sd.z*s*1.6+fw.z*(s?0:1.4),Infinity,{dm:1+.25*k}));sndHere(f,()=>SND.mud.spec());});
      vpose(f,.25,'charge','command');endAt(f,.5);return 12;}],
    alt:['DECOY',f=>{once(f,.1,()=>{const fw=f.fwd(),p=f.pos.clone();spawnClone(f,p.x,p.z,1.3,{decoy:true,boom:2});f.invuln=Math.max(f.invuln,.35);
      if(!blink(f,p.x-fw.x*7,p.z-fw.z*7)){f.vel.set(-fw.x*16,4,-fw.z*16);f.onGround=false;}sndHere(f,()=>SND.mud.dash());});f.poseKey='dash';endAt(f,.35);return 4;}]},
  snipe:{
    chg:['PIERCING ROUND',(f,dt,k)=>{once(f,.1,()=>{const T=tgtOf(f,44);if(T)faceTo(f,T);const st=muzOf(f),d=T?T.chest(new V3()).sub(st).normalize():f.fwd();
        fireBullet(f,null,{dir:d,speed:120,dmg:12+10*k,kb:13,up:5,stun:.6,pierce:true,life:.5,big:true,r:.7});xLine(f.hero.accent,.05+.04*k,.35,st,st.clone().addScaledVector(d,55));
        f.vel.x-=d.x*(8+6*k);f.vel.z-=d.z*(8+6*k);shake(.4,f.pos);});f.poseKey='aim';endAt(f,.5);return 6;}],
    alt:['RICOCHET',f=>{once(f,.2,()=>{const T=tgtOf(f,20);if(T)faceTo(f,T);fireBullet(f,T,{dmg:8,kb:5,up:3,stun:.5,bounce:4,home:6,speed:62,life:1});});f.poseKey='aim';endAt(f,.5);return 8;}]},
});

/* ================= ULTIMATES ================= */
const ULTX={
  permafrost:{r:18,s(f,c,E,T){f.vf.d=xDirTo(f,T);f.face=Math.atan2(f.vf.d.x,f.vf.d.z);f.vf.o=f.pos.clone();f.vf.L=[];f.uEnd=2.65;f.poseKey='point';},
    u(f,t){const V=f.vf,[fw,sd]=xBasis(f,V.d),o0=V.o;
      for(let k=0;k<10;k++)atT(f,'r'+k,.95+k*.045,()=>{const D=2+k*2.1,n=3+k;for(let q=0;q<n;q++){const a=(q/(n-1||1)-.5)*1.1,x=o0.x+(fw.x*Math.cos(a)+sd.x*Math.sin(a))*D,z=o0.z+(fw.z*Math.cos(a)+sd.z*Math.sin(a))*D;
          if(Math.abs(x)<BOUND+2&&Math.abs(z)<BOUND+2)iceSpike(x+rand(-.4,.4),z+rand(-.4,.4),1.2+k*.08,1.25);}
        if(k%3===0)shake(.3,o0);
        FS.forEach(o=>{if(ally(o,f)||o.dead||f.hitMap['p'+o.id])return;const rx=o.pos.x-o0.x,rz=o.pos.z-o0.z,al=rx*fw.x+rz*fw.z,lt=Math.abs(rx*sd.x+rz*sd.z);
          if(al>D-1.3&&al<D+1.3&&lt<Math.tan(.6)*al+1.2&&o.pos.y<5){f.hitMap['p'+o.id]=1;V.L.push(o);iceHit(f,o,{dmg:8,kb:0,stun:1,hold:true},2.2);}});});
      atT(f,'fire',2.1,()=>{f.poseKey='spech';for(let k=1;k<=5;k++){const p=o0.clone().addScaledVector(fw,k*4);p.y=1;explosion(p,2.6+k*.3,[0xff6a3a,0xffb347,0xcff4ff],k===5);}
        V.L.forEach(o=>{if(!o.dead){hitO(f,o,{dmg:16,kb:14,up:12,launch:true,heavy:true,noSpark:true});burnOn(o,3,4);}});shatterIce(o0.clone().addScaledVector(fw,11),13);
        FS.forEach(o=>{if(ally(o,f)||o.dead||V.L.indexOf(o)>=0)return;const rx=o.pos.x-o0.x,rz=o.pos.z-o0.z,al=rx*fw.x+rz*fw.z,lt=Math.abs(rx*sd.x+rz*sd.z);if(al>0&&al<22&&lt<Math.tan(.6)*al+1.2)hitO(f,o,{dmg:10,kb:12,up:10,launch:true,heavy:true});});
        props.forEach(pp=>{const rx=pp.x-o0.x,rz=pp.z-o0.z,al=rx*fw.x+rz*fw.z;if(al>0&&al<22&&Math.abs(rx*sd.x+rz*sd.z)<Math.tan(.6)*al+1.2)breakProp(pp);});
        screenFlash(.5,f.pos);xSnd(f.pos,()=>{AU.boom(true);SND.fire.ult();});});
      return 12;}},
  overdrive:{r:18,s(f,c,E,T){const L=foes(f,20).sort((a,b)=>a.pos.distanceTo(f.pos)-b.pos.distanceTo(f.pos)).slice(0,6);f.vf.L=L;
      if(!L.length){f.vf.solo=f.fwd();f.uEnd=1.35;}else f.uEnd=.95+L.length*.17+.55;f.xTop=Math.max(f.xTop||0,1.5);},
    u(f,t){const V=f.vf;f.invuln=Math.max(f.invuln,.3);
      if(V.solo){if(t<1.3){f.vel.x=V.solo.x*36;f.vel.z=V.solo.z*36;f.poseKey='airh';foes(f,2.2).forEach(o=>{if(!f.hitMap[o.id]){f.hitMap[o.id]=1;hitO(f,o,{dmg:16,kb:16,up:10,launch:true,heavy:true});}});}return 0;}
      f.vel.x=f.vel.z=0;const L=V.L;
      L.forEach((o,i)=>atT(f,'k'+i,.95+i*.17,()=>{if(o.dead)return;const from=f.chest(new V3()),a=f.face+Math.PI+rand(-1,1);
        blink(f,o.pos.x+Math.sin(a)*1.4,o.pos.z+Math.cos(a)*1.4);faceTo(f,o);const to=f.chest(new V3());
        for(let k=0;k<20;k++){const p=from.clone().lerp(to,k/20);ADD.spawn(p.x,p.y-.6,p.z,rand(-.5,.5),rand(0,1),rand(-.5,.5),..._rgb(pick([0xffb03a,0xff5a1f,0x9ad8ff]),2.2),.35,.45,0,0,0);}
        f.poseKey=['kickh','kickLh','kickSpin'][i%3];hitO(f,o,{dmg:6,kb:.5,stun:1.2,hold:true,noSpark:false});miniBlast(o.chest(new V3()),.7);sndHere(f,()=>SND.engine.hit(1));}));
      atT(f,'fin',.95+L.length*.17+.12,()=>{const A=L.filter(o=>!o.dead);if(!A.length)return;const T=A[0];const b=T.fwd();blink(f,T.pos.x-b.x*1.4,T.pos.z-b.z*1.4);faceTo(f,T);f.poseKey='axeKick';
        A.forEach(o=>hitO(f,o,{dmg:14,kb:13,up:12,launch:true,heavy:true,noSpark:true}));explosion(T.chest(new V3()),3,[0xffb03a,0x3a6aff,0xffffff],false);screenFlash(.35,f.pos);sndHere(f,()=>{AU.boom(true);SND.engine.ult();});});
      return 0;}},
  erasure:{r:20,s(f,c,E,T){f.vf.d=xDirTo(f,T);f.face=Math.atan2(f.vf.d.x,f.vf.d.z);f.uEnd=2.35;f.poseKey='stare';},
    u(f,t){const V=f.vf;
      atT(f,'gaze',.95,()=>{const fw=V.d,h=f.chest(new V3());h.y+=.45;sndHere(f,()=>SND.scarf.erase());screenFlash(.2,f.pos);
        V.L=FS.filter(o=>{if(ally(o,f)||o.dead)return false;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,d=Math.hypot(dx,dz);return d<24&&(d<1.5||(dx*fw.x+dz*fw.z)/d>.72);});
        for(let q=-2;q<=2;q++){const d=fw.clone().applyAxisAngle(UP,q*.17);xLine(0xff2a4a,.05,.9,h,h.clone().addScaledVector(d,22),{op:.55});}
        V.L.forEach(o=>{const oc=o.chest(new V3());xLine(0xff2a4a,.035,.9,h,oc);ring(oc,0xff2a4a,2.2,.4,false,2.4);eraseO(o,6);hitO(f,o,{dmg:6,kb:0,stun:1.1,hold:true,noSpark:true});});
        V.T=V.L.slice().sort((a,b)=>a.pos.distanceTo(f.pos)-b.pos.distanceTo(f.pos))[0]||null;});
      atT(f,'scarf',1.25,()=>{f.poseKey='throwS';if(V.T&&!V.T.dead){xLine(0xd8d8e0,.06,.5,muzOf(f),V.T.chest(new V3()),{from:f,to:V.T,glow:false});bindO(V.T,1);sndHere(f,()=>SND.scarf.spec());}});
      if(V.T&&!V.T.dead&&t>1.25&&t<1.7){const fw=f.fwd();pullTo(V.T,lerp(V.T.pos.x,f.pos.x+fw.x*1.8,.2),lerp(V.T.pos.z,f.pos.z+fw.z*1.8,.2));}
      atT(f,'slam',1.75,()=>{f.poseKey='smashh';if(V.T&&!V.T.dead){hitO(f,V.T,{dmg:16,kb:3,up:-18,launch:true,heavy:true});dust(V.T.pos,16,1.3);shake(.7,V.T.pos);sndHere(f,()=>AU.boom(false));}});
      return 12;}},
  curtaincall:{r:9,s(f,c){f.vf.L=[];f.uEnd=2.75;f.poseKey='command';orb(c,f.hero.accent,10,.5,1.2);ring(TMP.set(f.pos.x,.2,f.pos.z),f.hero.color,20,.6,true,2.4);
      foes(f,10).forEach(o=>{if(o.invuln>0)return;hitO(f,o,{dmg:4,kb:0,stun:.4,noSpark:true});if(compressO(f,o,1.4,16))f.vf.L.push(o);});},
    u(f,t){const L=f.vf.L;
      if(t<2.25)L.forEach((o,k)=>{if(o.dead||o.xHold!=='marble')return;o.framedT=Math.max(o.framedT,o.stateT+.2);const a=t*3.2+k/Math.max(1,L.length)*6.28,x=f.pos.x+Math.cos(a)*1.3,z=f.pos.z+Math.sin(a)*1.3;
        o.pos.x=lerp(o.pos.x,x,.12);o.pos.z=lerp(o.pos.z,z,.12);o.pos.y=lerp(o.pos.y,f.pos.y+1.6,.1);});
      if(t>1.2&&t<2.2)f.poseKey='spech';
      atT(f,'snap',2.25,()=>{f.poseKey='snap';sndHere(f,()=>{AU.noise(.02,.7,'highpass',2500,6000,1);SND.glass.ult();});screenFlash(.3,f.pos);
        L.forEach(o=>{if(o.xHold==='marble'){o.framedT=0;o.xPop=18;}});ring(f.chest(new V3()),0xffffff,6,.4,false,2.6);});
      return 12;}},
  sanctuary:{r:12,s(f){f.uEnd=1.7;f.poseKey='command';const n=6;for(let k=0;k<n;k++){const a=f.face+(k/(n-1)-.5)*3.4;spawnClone(f,f.pos.x+Math.sin(a)*2.1,f.pos.z+Math.cos(a)*2.1,Infinity,{boom:1,dm:1.2});}
      ring(TMP.set(f.pos.x,.2,f.pos.z),f.hero.accent,9,.5,true,2.2);burst(SMK,f.chest(new V3()),50,{colors:[0x4a3a2a,0x6a5a48,0x2a2018],speed:7,up:2,life:.9,size:.5,size1:.1,grav:8});},
    u(f,t){return 12;}},
  deadeye:{r:30,s(f,c,E,T){const L=foes(f,32).filter(o=>!o.downed).sort((a,b)=>a.pos.distanceTo(f.pos)-b.pos.distanceTo(f.pos)).slice(0,6);f.vf.L=L;f.poseKey='aim';
      L.forEach(o=>{const oc=o.chest(new V3());ring(oc,0xff2a4a,2.6,.6,false,2.6);xLine(0xff2a4a,.012,.4+L.length*.22,muzOf(f),oc,{from:f,to:o,op:.6});});
      f.uEnd=1.25+Math.max(5,L.length*2)*.18+.4;},
    u(f,t){const V=f.vf,L=V.L,n=Math.max(5,L.length*2);f.poseKey='aim';
      for(let i=0;i<n;i++)atT(f,'s'+i,1.25+i*.18,()=>{const A=L.filter(o=>!o.dead);const T=A.length?A[i%A.length]:null;if(T)faceTo(f,T);const last=i>=n-A.length||!A.length&&i===n-1;
        fireBullet(f,T,T?{dmg:last?13:9,kb:last?13:2,up:last?11:1,stun:.7,home:7,speed:85,heavy:last,life:.9}:{dir:f.fwd().applyAxisAngle(UP,(i-2)*.08),dmg:9,speed:85});
        const fw=f.fwd();f.vel.x-=fw.x*2;f.vel.z-=fw.z*2;});
      return 10;}},
};

/* ---- alternate ultimates (hold back or use in the air) ---- */
Object.assign(ALTULT,{
  solstice:{name:'FIRE AND ICE',r:10,s(f){f.vf.c=f.pos.clone();f.vf.b=xBasis(f);f.uEnd=2.35;f.poseKey='command';},
    u(f,t){const V=f.vf,c=V.c,[fw,sd]=V.b;
      [3,6,9].forEach((R,i)=>atT(f,'w'+i,.95+i*.12,()=>{const n=8+i*4;for(let k=0;k<n;k++){const b=(k+.5)/n*Math.PI;
          const ix=c.x+(fw.x*Math.cos(b)+sd.x*Math.sin(b))*R,iz=c.z+(fw.z*Math.cos(b)+sd.z*Math.sin(b))*R;iceSpike(ix,iz,1.1+i*.15,.9);
          const fx=c.x+(fw.x*Math.cos(b)-sd.x*Math.sin(b))*R,fz=c.z+(fw.z*Math.cos(b)-sd.z*Math.sin(b))*R;if(k%2===0)spikeFire(fx,fz);}
        foes(f,R+.8,c).forEach(o=>{if(f.vf['h'+o.id])return;const s=(o.pos.x-c.x)*sd.x+(o.pos.z-c.z)*sd.z;if(o.pos.distanceTo(c)<R-3.2)return;f.vf['h'+o.id]=1;
          if(s>=0)iceHit(f,o,{dmg:8,kb:0,stun:.9,hold:true},1.6);else{hitO(f,o,{dmg:9,kb:9,up:8,launch:true});burnOn(o,3,4);}});
        sndHere(f,()=>{SND.frostfire.spec();SND.fire.spec();});}));
      atT(f,'steam',1.9,()=>{explosion(TMP.set(c.x,1,c.z).clone(),6,[0xffffff,0xcff4ff,0xff6a3a]);burst(SMK,TMP.set(c.x,1,c.z),60,{colors:[0xe8eef6,0xc8d0dc,0xffffff],speed:12,up:3,life:1.6,size:1.4,size1:4,drag:2});
        shatterIce(c,11);foes(f,10,c).forEach(o=>hitO(f,o,{dmg:12,kb:12,up:12,launch:true,heavy:true,noSpark:true}));sndHere(f,()=>AU.boom(true));});return 12;}},
  piston:{name:'TOP GEAR',r:8,s(f){f.hasteT=Math.max(f.hasteT,7);f.powT=Math.max(f.powT,7);f.xTop=7;f.uEnd=1.3;f.poseKey='command';
      ring(TMP.set(f.pos.x,.2,f.pos.z),0xffb03a,8,.5,true,2.4);explosion(f.chest(new V3()),2.4,[0xffb03a,0x3a6aff,0xffffff],false);if(f===ME)announceSmall('TOP GEAR: FASTER, STRONGER, BURNING TRAIL');}},
  snare:{name:'SCARF STORM',r:10,s(f){f.vf.c=f.pos.clone();f.uEnd=2.4;f.poseKey='command';},
    u(f,t){const c=f.vf.c;if(t<2){f.face+=.25;swirl(TMP.set(c.x,1,c.z).clone(),6,3.5,[0xd8d8e0,0xffffff,0xff2a4a],8,.4,1.4);
        if(!f.vf.n||t-f.vf.n>.2){f.vf.n=t;foes(f,10,c).forEach(o=>{const dx=c.x-o.pos.x,dz=c.z-o.pos.z,d=Math.hypot(dx,dz)||1;pullTo(o,o.pos.x+dx/d*Math.min(1.4,d-1.2),o.pos.z+dz/d*Math.min(1.4,d-1.2));
          if(hitO(f,o,{dmg:2.5,kb:0,stun:.45,hold:true,noSpark:true})===true){bindO(o,.5);if(!f.vf['l'+o.id]){f.vf['l'+o.id]=1;xLine(0xd8d8e0,.05,1.1,muzOf(f),o.chest(new V3()),{from:f,to:o,glow:false});}}});
          sndHere(f,()=>AU.flutter(4,.15));}}
      atT(f,'slam',2.05,()=>{f.poseKey='smashh';ring(TMP.set(c.x,.2,c.z),0xff2a4a,10,.5,true,2.4);dust(c,20,1.5);shake(.9,c);foes(f,5,c).forEach(o=>{eraseO(o,2.5);hitO(f,o,{dmg:14,kb:4,up:-18,launch:true,heavy:true});});sndHere(f,()=>AU.boom(false));});return 12;}},
  marble:{name:'GRAND FINALE',r:20,s(f,c,T){const goal=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),12);goal.y=0;f.vf.g=goal;f.uEnd=2.5;f.poseKey='throwS';
      const st=muzOf(f),ft=.85,g=20;const v=new V3((goal.x-st.x)/ft,(0.4-st.y+.5*g*ft*ft)/ft,(goal.z-st.z)/ft);
      xShot(f,{kind:'big',pos:st,vel:v,grav:g,life:ft+.2,dmg:0,r:.01,onLand:p=>{const q=p.pos.clone();q.y=.8;explosion(q,4.5,[f.hero.accent,0xffffff,f.hero.color]);sndHere(f,()=>SND.glass.pop());
        foes(f,4.6,TMP.set(q.x,f.pos.y,q.z).clone()).forEach(o=>hitO(f,o,{dmg:12,kb:8,up:12,launch:true,heavy:true,noSpark:true}));
        for(let k=0;k<10;k++)later(.1+k*.07,()=>{const a=rand(0,6.28),r=rand(0,5);meteorAt(f,q.x+Math.cos(a)*r,q.z+Math.sin(a)*r);});}});
      sndHere(f,()=>SND.glass.spec());}},
  legion:{name:'PILE UP',r:16,s(f,c,T){const g=T?T.pos.clone():f.pos.clone().addScaledVector(f.fwd(),8);f.vf.g=g;f.uEnd=1.9;f.poseKey='command';ring(TMP.set(g.x,.2,g.z),f.hero.accent,9,1,true,2.2);},
    u(f,t){const g=f.vf.g;for(let k=0;k<4;k++)atT(f,'d'+k,.95+k*.14,()=>{const a=k/4*6.28+.5,r=k?1.6:0;spawnClone(f,g.x+Math.cos(a)*r,g.z+Math.sin(a)*r,Infinity,{drop:true,y:16,boom:1});});return 12;}},
  recoil:{name:'BULLET HAIL',r:14,s(f){f.vel.set(0,15,0);f.onGround=false;f.pos.y+=.1;f.uEnd=2.4;f.poseKey='aim';},
    u(f,t){if(t>1&&t<2.05){f.vel.y=Math.max(f.vel.y,-.4);f.poseKey='aim';
        if(!f.vf.n||t-f.vf.n>.05){f.vf.n=t;const L=FS.filter(q=>!ally(q,f)&&!q.dead&&!q.downed&&Math.hypot(q.pos.x-f.pos.x,q.pos.z-f.pos.z)<15);const o=L.length?pick(L):null;const tp=o?o.pos.clone().add(new V3(rand(-1.2,1.2),1,rand(-1.2,1.2))):f.pos.clone().add(new V3(rand(-8,8),0,rand(-8,8)));
          const st=muzOf(f);if(o)faceTo(f,o);fireBullet(f,null,{from:st,dir:tp.sub(st).normalize(),speed:80,dmg:3.2,kb:1,up:0,stun:.35,quiet:Math.random()<.6,life:.7,heavy:false});}}
      return 6;}},
});

/* ---- power hits on variant punches (tier 1 light, 2 heavy, 3 charged) ---- */
Object.assign(PFX,{
  solstice(a,d,t,p){a.xSide=!a.xSide;if(a.xSide){d.slowT=Math.max(d.slowT||0,1.5+t);burst(ADD,p,10*t,{colors:[0xcff4ff,0xffffff,0x7ad4ff],speed:5,life:.4,size:.22,size1:0,grav:10,bright:1.8});if(t>=2)iceSpike(d.pos.x,d.pos.z,.8,.6);}
    else{burnOn(d,1.5+t,2.5+t);burst(ADD,p,10*t,{colors:[0xff6a3a,0xffb347,0xffffff],speed:5,up:2,life:.4,size:.3,bright:2.2});}
    if(t===3&&!d.dead&&d.state!=='framed')freezeO(d,.9);},
  piston(a,d,t,p){const fw=a.fwd(TMP3);d.vel.x+=fw.x*3*t;d.vel.z+=fw.z*3*t;[a.rig.lK,a.rig.rK].forEach(k=>{k.getWorldPosition(TMP2);burst(ADD,TMP2,4*t,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:3,life:.3,size:.35,size1:0,bright:2.4,dir:fw,dirSp:-6});});
    if(t===3){a.hasteT=Math.max(a.hasteT,2);miniBlast(p,1);}},
  snare(a,d,t,p){d.specCD=Math.max(d.specCD,1.2*t);ring(p,0xff2a4a,1.2+t*.3,.3,false,2.2);if(t===3)eraseO(d,2.5);},
  marble(a,d,t,p){const n=t;for(let k=0;k<n;k++)later(.35+k*.12,()=>{if(d.dead||d.state==='framed')return;const c=d.chest(new V3());burst(ADD,c,12,{colors:[0xeaf8ff,0xffffff,a.hero.accent],speed:5,life:.3,size:.18,size1:0,grav:10,bright:2.2});
      xSnd(c,()=>SND.glass.hit(.6));applyHit(a,d,{dmg:2+t,kb:1,stun:.25,pt:c,noSpark:true,hold:true});});
    if(t===3&&!d.dead&&d.state!=='framed')compressO(a,d,.8,6);},
  legion(a,d,t,p){later(.14,()=>{if(d.dead||d.state==='framed')return;const c=d.chest(new V3());burst(SMK,c,8,{colors:[0x4a3a2a,0x6a5a48],speed:3,life:.4,size:.25,size1:.05,grav:8});applyHit(a,d,{dmg:1.5*t,kb:1,stun:.25,pt:c,noSpark:true,hold:true});});
    if(t===3){const fw=a.fwd();spawnClone(a,a.pos.x-fw.z*1.3,a.pos.z+fw.x*1.3,Infinity);}},
  recoil(a,d,t,p){burst(ADD,p,6*t,{colors:[0xffd08a,0xffffff,a.hero.accent],speed:5,life:.25,size:.22,size1:0,bright:2.4});
    if(t>=2){let N=null,nd=12;for(const o of FS){if(ally(o,a)||o===d||o.dead||o.downed)continue;const q=o.pos.distanceTo(d.pos);if(q<nd){nd=q;N=o;}}
      if(N){const st=d.chest(new V3());fireBullet(a,N,{from:st,dir:N.chest(new V3()).sub(st).normalize(),speed:80,dmg:2.5*t,kb:3,up:2,stun:.3,life:.4,home:6,quiet:true});xLine(a.hero.accent,.025,.2,st,N.chest(new V3()));}}},
});
Object.assign(PFX_DESC,{solstice:'alternates chill and burn, charged = freeze',piston:'engine kicks shove foes far',snare:'locks out specials, charged = erase',
  marble:'glass shards pop a beat later',legion:'a mud echo hits again, charged = a clone',recoil:'shots ricochet to a nearby foe'});

/* ================= LOOKS (built into each rig) ================= */
function mhaParts(h,X){const out={};const {O,M,head,neck,spine,hips,lS,lE,lF,rS,rE,rF,lH,lK,rH,rK,suit,main,trim,glow,dark,cmat,cape}=X;
  const env=m=>{m.envMap=main.envMap;m.envMapIntensity=main.envMapIntensity;return m;};
  if(HAS(h,'solstice')){
    const white=env(new THREE.MeshPhysicalMaterial({color:0xf2f6ff,roughness:.35,clearcoat:.6})),red=env(new THREE.MeshPhysicalMaterial({color:0xc4202a,roughness:.4,clearcoat:.5}));
    const silver=env(new THREE.MeshPhysicalMaterial({color:0xc8d8ee,roughness:.35,clearcoat:.6})),ember=new THREE.MeshStandardMaterial({color:0xff8a3a,emissive:0xff4a1a,emissiveIntensity:1.6});
    const hs=M(new THREE.SphereGeometry(.178,32,20,0,Math.PI*2,0,Math.PI*.5),silver);hs.position.y=.12;hs.scale.set(1.05,1.08,1.1);head.add(hs);
    for(let k=0;k<6;k++){const a=(k-2.5)*.42;const sp=M(new THREE.ConeGeometry(.035,.2,8),k%2?silver:ember);sp.position.set(Math.sin(a)*.12,.24,-.06+Math.cos(a)*.04);sp.rotation.set(-1.4,0,-a*.5);head.add(sp);}
    const ice=env(new THREE.MeshPhysicalMaterial({color:0xcff4ff,emissive:0x2a8aff,emissiveIntensity:.5,roughness:.05,clearcoat:1,transparent:true,opacity:.9}));
    for(let k=0;k<6;k++){const c=M(iceGeo(),ice);c.scale.setScalar(rand(.1,.18));c.position.set(rand(-.06,.08),rand(-.02,.08),rand(-.08,.08));c.rotation.set(rand(-.6,.6),0,-rand(.2,1));rS.add(c);}
    for(let k=0;k<4;k++){const c=M(iceGeo(),ice);c.scale.setScalar(rand(.06,.1));c.position.set(rand(-.05,.05),-rand(.05,.25),rand(-.05,.05));c.rotation.set(rand(-.5,.5),0,-rand(.4,1.2));rE.add(c);}
    const fm=new THREE.MeshStandardMaterial({color:0xffb347,emissive:0xff5a1f,emissiveIntensity:3});
    for(let k=0;k<4;k++){const c=M(new THREE.ConeGeometry(.035,.16,10),fm);c.position.set((k-1.5)*.05,.1,-.02);c.rotation.z=(k-1.5)*.25;lS.add(c);}
    const rg=M(new THREE.TorusGeometry(.07,.015,8,32),fm);rg.rotation.x=Math.PI/2;rg.position.y=-.24;lE.add(rg);
    cape(0x1a2a44,.5,.75,.6,.2,-.18);}
  if(HAS(h,'piston')){const pipe=env(new THREE.MeshPhysicalMaterial({color:0xc8ccd8,metalness:1,roughness:.22,clearcoat:.8}));
    const hot=new THREE.MeshStandardMaterial({color:0xffd08a,emissive:0xff7a1a,emissiveIntensity:2.6});
    [lK,rK].forEach(k=>{const cf=M(new THREE.CylinderGeometry(.1,.085,.3,24),main);cf.position.set(0,-.17,0);k.add(cf);
      for(let q=-1;q<=1;q++){const p=M(new THREE.CylinderGeometry(.026,.03,.2,16),pipe);p.position.set(q*.045,-.14,-.1);p.rotation.x=-.35;k.add(p);
        const tip=M(new THREE.CylinderGeometry(.02,.02,.012,12),hot);tip.position.set(q*.045,-.04,-.135);tip.rotation.x=-.35;k.add(tip);}});
    [-1,1].forEach(s=>{const fin=M(new THREE.BoxGeometry(.02,.05,.16),trim);fin.position.set(s*.17,.17,-.02);fin.rotation.x=-.3;head.add(fin);});
    const crest=M(new THREE.BoxGeometry(.03,.05,.22),main);crest.position.set(0,.29,-.01);head.add(crest);}
  if(HAS(h,'snare')){const cloth=env(new THREE.MeshStandardMaterial({color:0x8a9ab0,roughness:.35,metalness:.8}));
    for(let k=0;k<4;k++){const r=M(new THREE.TorusGeometry(.11+k*.018,.035,10,32),cloth);r.rotation.x=Math.PI/2+rand(-.15,.15);r.position.y=-.02+k*.035;neck.add(r);}
    for(let k=0;k<3;k++){const r=M(new THREE.TorusGeometry(.34-k*.03,.03,8,40,Math.PI*1.2),cloth);r.rotation.set(Math.PI/2+.3,0,Math.PI*.9+k*.3);r.position.set(0,.55-k*.06,.02);spine.add(r);}
    cape(0x3a4a5e,.13,1.15,1.1,.02,-.11,neck);
    const vis=M(new THREE.BoxGeometry(.3,.045,.06),new THREE.MeshStandardMaterial({color:0x2a0a10,emissive:0xff2a4a,emissiveIntensity:1.8,roughness:.2}));vis.position.set(0,.15,.13);head.add(vis);
    const hair=new THREE.MeshStandardMaterial({color:0x14141a,roughness:.8});for(let k=0;k<9;k++){const c=M(new THREE.ConeGeometry(.045,.2,8),hair);const a=k/9*6.28;c.position.set(Math.cos(a)*.11,.26,Math.sin(a)*.1-.03);c.rotation.set(Math.sin(a)*.9,0,-Math.cos(a)*.9);head.add(c);}
  }
  if(HAS(h,'marble')){const blk=env(new THREE.MeshPhysicalMaterial({color:0x101014,roughness:.4,clearcoat:.6}));
    const cry=env(new THREE.MeshPhysicalMaterial({color:0x9ae8ff,roughness:.05,metalness:.1,clearcoat:1,transparent:true,opacity:.85,emissive:0x2a6aff,emissiveIntensity:.4}));
    for(let k=0;k<7;k++){const a=(k-3)*.32;const c=M(new THREE.OctahedronGeometry(.05+(k===3?.03:0)),cry);c.position.set(Math.sin(a)*.15,.27+Math.cos(a)*.04-(Math.abs(k-3)*.012),Math.cos(a)*.05-.02);c.scale.y=1.8;c.rotation.z=-a*.4;head.add(c);}
    const dom=M(new THREE.BoxGeometry(.24,.06,.05),blk);dom.position.set(0,.15,.145);head.add(dom);
    [-1,1].forEach(s=>{const e=M(new THREE.SphereGeometry(.022,12,10),glow);e.position.set(s*.06,.15,.165);head.add(e);});
    cape(0x241c30,.62,1.25,.75,.5,-.2);
    out.orbiters=[];for(let k=0;k<4;k++){const m=marbleMesh(h.accent);m.scale.setScalar(.16);out.orbiters.push(m);hips.parent.add(m);}}
  if(HAS(h,'legion')){const st=new THREE.MeshStandardMaterial({color:0x0a0a0c,roughness:.8});
    const half=M(new THREE.SphereGeometry(.169,32,24,0,Math.PI,0,Math.PI),new THREE.MeshPhysicalMaterial({color:0x8a8e9a,roughness:.5,clearcoat:.3}));half.position.y=.12;half.rotation.y=Math.PI/2;half.scale.set(.98,1.1,1.06);head.add(half);
    const seam=M(new THREE.TorusGeometry(.174,.008,8,48,Math.PI),glow);seam.position.y=.12;seam.rotation.set(0,0,Math.PI/2);seam.scale.set(1.1,.99,1.07);head.add(seam);
    [lE,rE].forEach(el=>{for(let k=0;k<3;k++){const s=M(new THREE.TorusGeometry(.068,.005,6,24),st);s.rotation.x=Math.PI/2;s.position.y=-.05-k*.07;el.add(s);}});
    const pouch=M(new THREE.BoxGeometry(.12,.1,.06),dark);pouch.position.set(.18,.0,.12);hips.add(pouch);}
  if(HAS(h,'recoil')){const gun=env(new THREE.MeshPhysicalMaterial({color:0x2a2c34,metalness:.9,roughness:.28,clearcoat:.6}));
    const bar=M(new THREE.CylinderGeometry(.032,.036,.75,18),gun);bar.position.set(0,-.38,.02);rE.add(bar);
    const body=M(new THREE.BoxGeometry(.11,.26,.12),gun);body.position.set(0,-.12,.03);rE.add(body);
    const sc=M(new THREE.CylinderGeometry(.025,.025,.2,16),gun);sc.position.set(0,-.14,.11);rE.add(sc);const lens=M(new THREE.CylinderGeometry(.022,.022,.01,16),glow);lens.position.set(0,-.25,.11);rE.add(lens);
    const ring1=M(new THREE.TorusGeometry(.04,.01,8,24),trim);ring1.rotation.x=Math.PI/2;ring1.position.set(0,-.6,.02);rE.add(ring1);
    const mz=O();mz.position.set(0,-.77,.02);rE.add(mz);out.ext={muzzle:mz};
    if(!h.gear||h.gear.type==='none')rF.visible=false;
    const hair=new THREE.MeshStandardMaterial({color:0x2a1a2a,roughness:.6});const hb=M(new THREE.CylinderGeometry(.13,.05,.55,16),hair);hb.position.set(0,-.1,-.12);hb.rotation.x=.15;head.add(hb);
    const fr=M(new THREE.SphereGeometry(.18,24,16,0,Math.PI*2,0,Math.PI*.45),hair);fr.position.y=.14;fr.scale.set(1,1,1.1);head.add(fr);
    cape(0x2a0a1a,.66,1.3,.7,.6,-.2);}
  return out;}
window.__city={BLDG,BLD,floorAt,insideBld};window.__xm=xMoves;window.__mha={clones:()=>CLONES.length,shots:()=>XP.length,ice:()=>ICEP.filter(g=>g.visible).length,lines:()=>XL.filter(l=>l.m.visible).length};

/* ================= EXTRA MOVES (number keys 3 and 4) =================
   Every fighter gets two more moves, built on the ability engine and themed to their power.
   [name, form, style, shape, effects, extra recipe fields] */
const XMOVES={
  cinder:[['FLARE DASH','dash','fire','flame',['burn']],['MAGMA PILLARS','pillar','fire','flame',['burn','launch'],{count:3}]],
  riptide:[['BUBBLE PRISON','bolt','water','bubble',['float']],['WHIRLPOOL','zone','water','ring',['pull','slow']]],
  gale:[['WIND BLADES','volley','wind','crescent',['push']],['SKY HOOK','grab','wind','tornado',['launch']]],
  nitro:[['STICKY BOMBS','volley','explosion','bomb',['explode'],{count:3}],['BLAST JUMP','slam','explosion','orb',['explode','launch']]],
  titan:[['TITAN CHARGE','dash','earth','fist',['push']],['GROUND SPLITTER','wave','earth','shard',['launch']]],
  volta:[['STATIC FIELD','zone','lightning','lightning',['stun']],['LIGHTNING DASH','dash','lightning','lightning',['chain']]],
  umbra:[['SHADOW SPIKES','pillar','shadow','spike',['launch'],{count:3}],['NIGHT BATS','volley','shadow','bat',['slow']]],
  drift:[['GRAVITY WELL','zone','void','orb',['pull','float']],['METEOR TOSS','bolt','earth','boulder',['launch'],{size:1.7}]],
  bastion:[['STEEL RAM','dash','metal','fist',['push','stun']],['SPIKE SHELL','burst','metal','spike',['launch'],{self:['shield']}]],
  quill:[['FEATHER GUARD','orbit','light','feather',[]],['TALON DIVE','blink','light','feather',['launch']]],
  void:[['STAR SHOWER','rain','void','star',[]],['NULL BEAM','beam','void','star',['push']]],
  ronin:[['IAI DASH','dash','blade','sword',['pierce']],['SPIRIT SLASHES','volley','blade','crescent',[]]],
  quake:[['BOULDER TOSS','bolt','earth','boulder',['launch'],{size:1.8}],['FAULT RING','burst','earth','shard',['launch','slow']]],
  marrow:[['BONE RAIN','rain','blood','bone',['lifesteal']],['BONE TENDRIL','grab','blood','bone',['lifesteal','pull']]],
  entropy:[['DECAY ORB','bolt','poison','orb',['poison','slow']],['ASH CLOUD','zone','poison','orb',['poison']]],
  sovereign:[['IRON GRASP','grab','shadow','hand',['drain']],['TYRANT ORBS','orbit','void','orb',['drain']]],
  strobe:[['AFTERIMAGE','blink','time','ring',['stun']],['STOPWATCH FIELD','zone','time','ring',['slow','stun']]],
  pyre:[['AZURE FLARES','volley','fire','flame',['burn']],['BLUE BREATH','cone','fire','flame',['burn']]],
  warp:[['RIFT SPEARS','pillar','spirit','spike',['launch'],{count:3}],['PORTAL BARRAGE','volley','spirit','orb',[]]],
  hex:[['SIGIL SNARE','zone','spirit','ring',['mark','slow']],['CURSED NEEDLES','volley','spirit','spike',['mark']]],
  scathe:[['CLAW WAVE','wave','blood','crescent',[]],['DEMON LEAP','slam','blood','orb',['launch']]],
  solstice:[['ICE SLIDE','dash','ice','snowflake',['freeze']],['FIRE PILLAR','pillar','fire','flame',['burn']]],
  piston:[['JET STOMP','slam','explosion','orb',['launch']],['EXHAUST BLAST','cone','fire','flame',['burn','push']]],
  snare:[['SCARF WHIP','grab','wind','ring',['stun']],['GLARE','beam','light','eye',['stun']]],
  marble:[['CARD TRICK','volley','crystal','card',[]],['MARBLE GUARD','orbit','crystal','bubble',[]]],
  legion:[['MUD BOMB','bolt','earth','orb',['slow']],['TWIN TACKLE','dash','earth','fist',['push']]],
  recoil:[['FLASH GRENADE','bolt','explosion','bomb',['stun']],['SUPPRESSING FIRE','volley','metal','bullet',['slow'],{count:7}]],
};
const XM_CD=[6,9];
// created fighters: two more moves in their own style, using deliveries their kit doesn't have yet
function customXMoves(h){const C=h.cab||{},A=C.sp||{style:'light',shape:'orb'},used=[C.sp,C.spAlt,C.ult,C.ultAlt].filter(Boolean).map(a=>a.form);
  const pool=['dash','cone','orbit','pillar','grab','volley','slam','zone','bolt'].filter(x=>used.indexOf(x)<0);const N=NAMEW[A.style]||['NEW'],F=FORMW;
  return [0,1].map(i=>{const form=pool[i]||['dash','cone'][i];return [N[(i+1)%N.length]+' '+(F[form]||['MOVE'])[i%2],form,A.style,A.shape,(A.fx||[]).slice(0,1)];});}
function xMoves(h){if(h._xm)return h._xm;const key=h.cab?null:KIT(h,'elem');const L=(key&&XMOVES[key])||customXMoves(h);
  h._xm=L.map(([name,form,style,shape,fx,x])=>sanitizeAbil(Object.assign({name,form,style,shape,fx,colors:[h.color,h.accent]},x||{})));return h._xm;}
SPECIALS.xm=function(f,dt){const A=f.xmA;if(!A){f.set('idle');return 10;}return cabSpecial(f,dt,A,0);};
XSPK.xm=1;
Fighter.prototype.tryExtra=function(lock){const i=this.bufXi;this.bufX=0;if(i==null)return false;this.xcd=this.xcd||[0,0];if(this.xcd[i]>0||this.eraseT>0)return false;
  const A=xMoves(this.hero)[i];if(!A)return false;this.aimAt(lock);this.set('special');this.fired=false;this._sndF=false;this.vf={};this.chgK=0;this.specVar='n';this.spPend=false;
  this.xmOn=true;this.xmA=A;this.xcd[i]=XM_CD[i];vName(this,A.name);return true;};
// basic attacks (not variant moves) play 35% slower: wind-up, active and recovery all stretch
const BASIC_SLOW=1.35;
Object.keys(MOVES).forEach(k=>{if(isVarMove(k))return;const M=MOVES[k];if(M._slow)return;M._slow=1;['st','ac','rc'].forEach(p=>{if(typeof M[p]==='number')M[p]*=BASIC_SLOW;});});

/* ================= DEATH ULTS =================
   Get knocked out with at least half a Surge bar and you have 4 seconds to press Q (your ultimate key)
   for one last attack from beyond. Four kinds, matched to each fighter's power. */
const DULT_MIN=50,DULT_WIN=4;
const DULT_TYPES={
  nova:{name:'FINAL FLARE',desc:'your body rises and detonates'},
  vengeance:{name:'VENGEFUL SPIRIT',desc:'your spirit hunts down whoever took you out'},
  curse:{name:'DEATH CURSE',desc:'leaves cursed ground that drains and slows foes'},
  barrage:{name:'LAST VOLLEY',desc:'fires homing spirit bolts at everyone nearby'}};
const DULT_OF={cinder:'nova',nitro:'nova',titan:'nova',volta:'nova',solstice:'nova',piston:'nova',bastion:'nova',quake:'nova',
  ronin:'vengeance',scathe:'vengeance',umbra:'vengeance',snare:'vengeance',strobe:'vengeance',marrow:'vengeance',recoil:'vengeance',
  hex:'curse',entropy:'curse',sovereign:'curse',void:'curse',warp:'curse',marble:'curse',
  gale:'barrage',quill:'barrage',riptide:'barrage',drift:'barrage',pyre:'barrage',legion:'barrage'};
function dultOf(h){return DULT_OF[KIT(h,'elem')]||'nova';}
const DU=[];   // running death ults
function dultOpen(f,killer){if(game.practice)return;f.dsT=f.meter>=DULT_MIN?DULT_WIN:0;f.dsK=killer&&killer!==f?killer:null;f.dsP=f.pos.clone();f.dsP.y=f.floorY||0;
  if(f===ME&&f.dsT>0){const T=DULT_TYPES[dultOf(f.hero)];dultPrompt(`PRESS <b>Q</b> · ${T.name}`,T.desc);}}
function dultPrompt(a,b){let el=$('dultP');if(!el){el=document.createElement('div');el.id='dultP';document.body.appendChild(el);}
  el.innerHTML=a?`<div class="dpa">${a}</div><div class="dpb">${b||''}</div><i></i>`:'';el.classList.toggle('on',!!a);}
function dultStart(f){f.dsT=0;f.meter=0;f.dsUsed=true;const type=dultOf(f.hero),T=DULT_TYPES[type];const p=(f.dsP||f.pos).clone();if(type==='nova'){f.pos.x=p.x;f.pos.z=p.z;}
  DU.push({f,type,t:0,p,k:f.dsK,hit:{},n:0});if(f===ME){dultPrompt('');announce(T.name,f.hero.css);}
  feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> unleashed <b style="--c:${f.hero.css}">${T.name}</b>`);
  const c=new V3(p.x,1,p.z);ring(c,f.hero.color,5,.5,false,2.6);implode(c,40,3,[f.hero.color,f.hero.accent,0xffffff],.5,2.4);xSnd(p,()=>{AU.tone('sine',220,880,.6,.08);AU.swell(.6,.3,'bandpass',200,2000,3);});}
function dFoes(D,R,p){return FS.filter(o=>!o.dead&&!o.downed&&!ally(o,D.f)&&Math.hypot(o.pos.x-p.x,o.pos.z-p.z)<R&&Math.abs(o.pos.y-p.y)<5);}
function updDeathUlts(dt){
  if(ME&&!ME.dead&&ME.dsT>0){ME.dsT=0;dultPrompt('');}
  for(const f of FS){if(f.dsUsed){if(f.dead)f.meter=0;else f.dsUsed=false;}if(!f.dead||!(f.dsT>0))continue;f.dsT-=dt;
    const want=f.isBot?(f.dsT<DULT_WIN-.8&&f.id%3!==0):!!f.intent.ult;
    if(want)dultStart(f);
    else if(f.dsT<=0&&f===ME)dultPrompt('');
    if(f===ME&&f.dsT>0){const el=$('dultP');if(el&&el.lastChild)el.lastChild.style.width=(f.dsT/DULT_WIN*100)+'%';}}
  for(let i=DU.length-1;i>=0;i--){const D=DU[i],f=D.f;D.t+=dt;const t=D.t,col=f.hero.color,acc=f.hero.accent;
    if(D.type==='nova'){const c=new V3(D.p.x,D.p.y+Math.min(3,1+t*1.6),D.p.z);
      if(t<1.2){if(Math.random()<.8)for(let k=0;k<3;k++){const a=rand(0,6.28),r=rand(2,4);ADD.spawn(c.x+Math.cos(a)*r,c.y+rand(-1,1),c.z+Math.sin(a)*r,-Math.cos(a)*r*2.5,0,-Math.sin(a)*r*2.5,..._rgb(pick([col,acc,0xffffff]),2.4),.35,.4,.05,0,0);}
        f.pos.x=c.x;f.pos.z=c.z;f.pos.y=lerp(f.pos.y,c.y-1,.1);f.vel.set(0,0,0);if(!D.r1){D.r1=1;orb(c,col,1.2,.5,1.2);}}
      else{explosion(c,8,[col,acc,0xffffff],true);ring(new V3(c.x,.3,c.z),col,16,.6,true,2.6);screenFlash(.5,c);shake(1.2,c);
        dFoes(D,8.5,D.p).forEach(o=>hitO(f,o,{dmg:30,kb:15,up:14,launch:true,heavy:true,noSpark:true}));props.forEach(pp=>{if(Math.hypot(pp.x-c.x,pp.z-c.z)<8)breakProp(pp);});
        xSnd(c,()=>{AU.boom(true);AU.sub(50,25,1.2,.6);});DU.splice(i,1);}continue;}
    if(D.type==='vengeance'){if(!D.g){const g=new THREE.Group();g.add(new THREE.Mesh(cg('dvO',()=>new THREE.SphereGeometry(.55,24,16)),addMat(col,2.2,.75)));
        g.add(new THREE.Mesh(cg('dvC',()=>new THREE.SphereGeometry(.28,16,12)),addMat(0xffffff,2.8)));g.position.set(D.p.x,1.2,D.p.z);scene.add(g);D.g=g;}
      const g=D.g;let T=D.k&&!D.k.dead?D.k:null;if(!T){const L=dFoes(D,30,g.position);T=L.sort((a,b)=>a.pos.distanceTo(g.position)-b.pos.distanceTo(g.position))[0]||null;D.k=T;}
      if(t<.5){g.position.y=1.2+t*2;g.scale.setScalar(.6+t);}
      else if(T&&t<3){const tp=T.chest(new V3()),d=tp.clone().sub(g.position),L=d.length();g.position.addScaledVector(d.normalize(),Math.min(L,34*dt));
        for(let k=0;k<4;k++)ADD.spawn(g.position.x,g.position.y,g.position.z,rand(-1,1),rand(-1,1),rand(-1,1),..._rgb(pick([col,acc,0xffffff]),2.4),.45,.5,0,0,0);
        if(L<1.2){explosion(tp,3.5,[col,acc,0xffffff],false);cutLine(tp.clone().add(new V3(-1.5,1.5,0)),tp.clone().add(new V3(1.5,-1.5,0)),col,.12,.4);
          hitO(f,T,{dmg:30,kb:14,up:12,launch:true,heavy:true,noSpark:true});dFoes(D,3.5,T.pos).forEach(o=>{if(o!==T)hitO(f,o,{dmg:12,kb:9,up:8,launch:true});});
          screenFlash(.3,tp);xSnd(tp,()=>{AU.boom(false);AU.tone('sine',900,120,.5,.08);});scene.remove(g);DU.splice(i,1);}}
      else{burst(ADD,g.position,30,{colors:[col,0xffffff],speed:6,life:.5,size:.3,size1:0,bright:2.4});scene.remove(g);DU.splice(i,1);}continue;}
    if(D.type==='curse'){const p=D.p;if(t<6){if(!D.m){const m=new THREE.Mesh(cg('dcR',()=>{const q=new THREE.RingGeometry(.2,7,48,1);q.rotateX(-Math.PI/2);return q;}),addMat(col,1.6,.35));m.position.set(p.x,p.y+.06,p.z);scene.add(m);D.m=m;}
        D.m.rotation.y+=dt*.6;D.m.material.opacity=.25+Math.sin(t*6)*.08;
        for(let k=0;k<3;k++){const a=rand(0,6.28),r=rand(0,7);ADD.spawn(p.x+Math.cos(a)*r,p.y+.2,p.z+Math.sin(a)*r,0,rand(1.5,4),0,..._rgb(pick([col,acc,0x2a0a3a]),2),.7,.4,.1,0,0);}
        D.n-=dt;if(D.n<=0){D.n=.5;dFoes(D,7.2,p).forEach(o=>{hitO(f,o,{dmg:4,kb:0,stun:.15,hold:true,noSpark:true});o.slowT=Math.max(o.slowT||0,.8);});}}
      else{if(D.m)scene.remove(D.m);explosion(new V3(p.x,.8,p.z),4,[col,acc,0x2a0a3a],false);DU.splice(i,1);}continue;}
    if(D.type==='barrage'){const c=new V3(D.p.x,D.p.y+1.6,D.p.z);
      if(t>.4&&D.n<12&&t>.4+D.n*.12){D.n++;const L=dFoes(D,26,c);const T=L.length?L[D.n%L.length]:null;const a=D.n*.52;const st=c.clone().add(new V3(Math.cos(a)*1.2,rand(0,1),Math.sin(a)*1.2));
        xShot(f,{kind:'bullet',pos:st,vel:(T?T.chest(new V3()).sub(st).normalize():new V3(Math.cos(a),.3,Math.sin(a))).multiplyScalar(30),tgt:T,home:5,dmg:5,kb:4,up:4,stun:.4,life:1.6,col:acc,r:.6});
        xSnd(st,()=>AU.tone('sine',600+D.n*60,300,.15,.05));}
      if(Math.random()<.6)burst(ADD,c,2,{colors:[col,acc,0xffffff],speed:2,life:.4,size:.35,size1:0,bright:2.2});
      if(t>2.2)DU.splice(i,1);continue;}}
}
function clearDeathUlts(){DU.forEach(D=>{if(D.g)scene.remove(D.g);if(D.m)scene.remove(D.m);});DU.length=0;FS.forEach(f=>f.dsT=0);dultPrompt('');}
