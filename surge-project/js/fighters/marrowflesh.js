/* MARROW'S FLESH — his flesh weapons look and act like meat:
   • BLADEFORM (1) is now a toggle: the flesh blades grow out and STAY until you press it again to pull them back in
     (or switch to DREAD form / get KO'd). Bots keep theirs out.
   • FLESH TETHER (back + 1) is a real tendril of raw muscle: it lashes out from his arm, its bone hooks bite into the
     target, it drags them in hand over hand, and it slurps back into his arm.
   • his whip is thick, lumpy, fibrous meat with bone spurs along it and a clawed bone tip; the blades are slabs of
     muscle with a serrated bone edge and a bone core. */
const MF={};
function mfMeat(kind){if(MF[kind])return MF[kind];const m=new THREE.MeshPhysicalMaterial({color:kind==='sinew'?0xffd0d0:0xffffff,roughness:.28,clearcoat:.9,clearcoatRoughness:.18,emissive:0x2a0004,emissiveIntensity:.5});
  try{goreSurface(m,kind==='sinew'?'gut':'meat',{tint:false,rough:.28,n:1});}catch(e){}MF[kind]=m;return m;}
function mfBone(){if(MF.bone)return MF.bone;const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5});try{goreSurface(m,'bone',{rough:.5,n:.7});}catch(e){}MF.bone=m;return m;}
// a lumpy, fibrous unit cylinder (radius 1, height 1) for whip segments
function mfLumpCyl(){if(MF.lump)return MF.lump;const g=new THREE.CylinderGeometry(1,1,1,12,3,true),P=g.attributes.position,v=new V3();
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const a=Math.atan2(v.z,v.x);const k=1+.16*Math.sin(a*5+v.y*7)+.1*Math.sin(a*11-v.y*13)+.08*Math.sin(v.y*20);P.setXYZ(i,v.x*k,v.y,v.z*k);}
  g.computeVertexNormals();MF.lump=g;return g;}
function mfLumpSph(){if(MF.lsph)return MF.lsph;const g=new THREE.SphereGeometry(1,14,10),P=g.attributes.position,v=new V3();
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const k=1+.18*Math.sin(v.x*6+v.y*4)+.12*Math.sin(v.z*9-v.y*5);P.setXYZ(i,v.x*k,v.y*k,v.z*k);}g.computeVertexNormals();MF.lsph=g;return g;}

/* ---------- the rig: meatier whip and blades ---------- */
const _mfBR=buildRig;buildRig=function(h){const R=_mfBR.apply(this,arguments);try{
  if(R.whip&&R.whip.segs){const meat=mfMeat('meat'),bone=mfBone(),lc=mfLumpCyl();R.whip.segs.forEach((s,i)=>{s.geometry=lc;s.material=i%5===4?mfMeat('sinew'):meat;});
    // bone spurs along the whip and a clawed bone tip
    const spurs=[];for(let i=0;i<7;i++){const sp=new THREE.Mesh(cg('mfSpur',()=>{const g=new THREE.ConeGeometry(.028,.16,7);g.translate(0,.08,0);return g;}),bone);sp.castShadow=true;R.whip.group.add(sp);spurs.push({m:sp,i:3+i*3,a:i*2.2});}
    R.whip.spurs=spurs;const tip=R.whip.tip;tip.material=bone;tip.scale.set(1.1,1.2,1.1);
    for(let k=0;k<3;k++){const cl=new THREE.Mesh(cg('mfClaw',()=>{const g=new THREE.ConeGeometry(.03,.22,7);g.translate(0,.11,0);return g;}),bone);const a=k/3*6.283;cl.position.set(Math.cos(a)*.06,-.05,Math.sin(a)*.06);cl.rotation.set(Math.sin(a)*.7,0,-Math.cos(a)*.7);tip.add(cl);}}
  if(R.blades){const meat=mfMeat('meat'),bone=mfBone();R.blades.forEach(b=>{b.material=meat;b.children.forEach(c=>{c.visible=false;});
      // bone core and a serrated bone edge
      const core=new THREE.Mesh(cg('mfCore',()=>{const g=new THREE.ConeGeometry(.035,1.2,8);g.translate(0,-.6,0);return g;}),bone);core.scale.z=2.6;b.add(core);
      for(let k=0;k<9;k++){const t=new THREE.Mesh(cg('mfTooth',()=>new THREE.ConeGeometry(.022,.08,5)),bone);const y=-.1-k*.11,w=.13*(1-(k*.11+.1)/1.15);t.position.set(w*.95,y,0);t.rotation.z=-1.2;t.scale.z=3;b.add(t);
        const t2=t.clone();t2.position.x=-w*.95;t2.rotation.z=1.2;b.add(t2);}
      // a lumpy muscle sheath where it bursts out of the forearm
      const sh=new THREE.Mesh(mfLumpSph(),meat);sh.scale.set(.1,.09,.28);sh.position.y=-.02;b.add(sh);});}
}catch(e){console.warn('marrowflesh',e);}return R;};
// spurs follow the whip
const _mfUW=Fighter.prototype.updateWhip;Fighter.prototype.updateWhip=function(){const r=_mfUW.apply(this,arguments);const W=this.rig&&this.rig.whip;if(!W||!W.spurs||!W.group.visible)return r;
  const N=W.segs.length;W.segs.forEach((m,i)=>{const b=1+.22*Math.sin(i*1.9+game.time*9);m.scale.x*=1.3*b;m.scale.z*=1.3*b;});
  for(const S of W.spurs){const m=W.segs[Math.min(N-1,S.i)];S.m.position.copy(m.position);S.m.quaternion.copy(m.quaternion);S.m.rotateY(S.a);S.m.rotateZ(1.1);S.m.translateY(m.scale.x*.8);S.m.scale.setScalar(1-S.i/N*.5);}return r;};

/* ---------- BLADEFORM toggle ---------- */
const _mfAB=Fighter.prototype.activateBlades;Fighter.prototype.activateBlades=function(){
  if(this.bladeT>0){if(this.isBot)return;// pull them back in
    this.bladeT=0;this._bladeOn=null;const c=this.chest(new V3());bloodBurst(c,40,6);burst(SMK,c,16,{colors:[0x8a1020,0x5a0010],speed:3,life:.5,size:.22,size1:.05,grav:10});
    xSnd(this.pos,()=>{AU.whoosh&&AU.whoosh(false);});if(this===ME&&typeof announceSmall==='function')announceSmall('BLADES IN');return;}
  const r=_mfAB.apply(this,arguments);this.bladeT=1e6;this._bladeOn=game.time;const c=this.chest(new V3());bloodBurst(c,60,8);if(this===ME&&typeof announceSmall==='function')announceSmall('BLADES OUT — PRESS AGAIN TO RETRACT');return r;};
// growth animation (the base code expects a 9 s timer)
const _mfAP=Fighter.prototype.applyPose;Fighter.prototype.applyPose=function(dt){const r=_mfAP.apply(this,arguments);const R=this.rig;
  if(R&&R.blades&&this.bladeT>0){const g=Math.min(1,Math.max(.01,(game.time-(this._bladeOn==null?game.time-1:this._bladeOn))*5));const pulse=1+Math.sin(game.time*6)*.02;R.blades.forEach(b=>{b.visible=true;b.scale.set(g*pulse,g,.3*g*pulse);});}
  return r;};
setTimeout(()=>{const h=HEROES.find(x=>x.id==='marrow');if(h)h.specCD=1.2;},0);

/* ---------- FLESH TETHER: a real tendril ---------- */
const TENDRILS=[];
function mfTendril(f,T){const g=new THREE.Group();scene.add(g);const segs=[];const meat=mfMeat('meat'),sinew=mfMeat('sinew'),bone=mfBone(),sph=mfLumpSph();
  for(let i=0;i<26;i++){const m=new THREE.Mesh(sph,i%4===3?sinew:meat);m.castShadow=true;g.add(m);segs.push(m);}
  const hooks=[];for(let k=0;k<4;k++){const hk=new THREE.Mesh(cg('mfHook',()=>{const g=new THREE.ConeGeometry(.03,.2,7);g.translate(0,.1,0);return g;}),bone);g.add(hk);hooks.push(hk);}
  const fw=f.fwd(),miss=f.chest(new V3()).addScaledVector(fw,10);const D={f,T,g,segs,hooks,t:0,ext:.2,hold:.42,ret:.22,hit:false,miss,from:T?T.pos.clone():null,ph:Math.random()*6};TENDRILS.push(D);return D;}
onEv('tick',dt=>{for(let i=TENDRILS.length-1;i>=0;i--){const D=TENDRILS[i],f=D.f,T=D.T&&!D.T.dead?D.T:null;D.t+=dt;const end=D.ext+D.hold+D.ret;
  if(D.t>=end||f.dead||!inMatch()){D.segs.forEach(m=>m.visible=false);scene.remove(D.g);TENDRILS.splice(i,1);continue;}
  const hand=limbPos(f,'r',new V3()),target=T?T.chest(new V3()):D.miss.clone();
  let k=D.t<D.ext?D.t/D.ext:D.t<D.ext+D.hold?1:1-(D.t-D.ext-D.hold)/D.ret;k=clamp(k,0,1);
  // reaching, biting in, dragging the target in hand over hand
  if(T&&!D.hit&&D.t>=D.ext){D.hit=true;D.from=T.pos.clone();bloodBurst(target,40,6);bloodDrops(target,25,5,null,null,2);xSnd(T.pos,()=>{AU.hit&&AU.hit(true);});
    if(NET.role!=='client'){hitO(f,T,{dmg:6,kb:0,stun:1.1,hold:true});heal(f,4);}}
  if(T&&D.hit&&D.t<D.ext+D.hold&&NET.role!=='client'){const u=clamp((D.t-D.ext)/D.hold,0,1),e=u*u*(3-2*u),fw=f.fwd(),to=new V3(f.pos.x+fw.x*1.8,T.pos.y,f.pos.z+fw.z*1.8);
    const p=D.from.clone().lerp(to,e);if(!insideBld(p.x,p.z,.5,T.pos.y+.5)){T.pos.x=p.x;T.pos.z=p.z;}T.vel.set(0,T.vel.y,0);}
  const tip=hand.clone().lerp(target,k);const dir=tip.clone().sub(hand),L=dir.length()||.01;dir.divideScalar(L);const side=new V3(dir.z,0,-dir.x).normalize(),N=D.segs.length;
  let prev=hand.clone();for(let s=0;s<N;s++){const u=(s+1)/N,p=hand.clone().lerp(tip,u);const sag=Math.sin(u*Math.PI)*(D.hit?.15:.5)*(1-k*.4);
    const w=Math.sin(u*8+D.t*22+D.ph)*.18*Math.sin(u*Math.PI)*(D.hit?.4:1);p.y-=sag;p.addScaledVector(side,w);
    const m=D.segs[s],seg=p.clone().sub(prev),sl=seg.length()||.01;m.position.copy(prev).addScaledVector(seg,.5);m.quaternion.setFromUnitVectors(new V3(0,0,1),seg.divideScalar(sl));
    const r=(.085-.04*u)*(1+.25*Math.sin(u*14-D.t*30));m.scale.set(r,r,Math.max(r,sl*.75));m.visible=k>0;prev=p;}
  D.hooks.forEach((hk,j)=>{const a=j/4*6.283+D.t*2;hk.position.copy(tip);hk.quaternion.setFromUnitVectors(new V3(0,1,0),dir.clone().add(new V3(Math.cos(a),Math.sin(a),0).multiplyScalar(D.hit?.9:.5)).normalize());hk.visible=k>0;});
  if(Math.random()<.4&&nearCam(tip,50))bloodDrops(tip,2,3,null,null,1);}});
onEv('matchEnd',()=>{TENDRILS.forEach(D=>scene.remove(D.g));TENDRILS.length=0;});
if(typeof SPECVAR!=='undefined'&&SPECVAR.bladeform){SPECVAR.bladeform.alt[1]=function(f){once(f,.12,()=>{const T=tgtOf(f,11);if(T)faceTo(f,T);mfTendril(f,T);xSnd(f.pos,()=>AU.whoosh&&AU.whoosh(true));});
    vpose(f,.12,'specw','spech');endAt(f,.75);return 10;};}
