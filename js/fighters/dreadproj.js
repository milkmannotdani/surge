/* DREAD PROJECTILES — Marrow's DREAD form throws fear itself:
   • every punch of his combo flings a FEAR WISP from the striking hand (a dark violet skull-light with green eyes that
     drifts toward the nearest foe; a little damage and a moment of terror)
   • his heavy hurls a NIGHTMARE ORB that bursts into a cloud of fear (damage + terror around it)
   • FEAR BLAST (1) also looses a fan of five shrieking wraiths that home in
   • PANIC BURST (hold 1) sprays a ring of ten wisps outward
   • NIGHTMARE GRASP (back + 1) is now a shadow hand that flies out, clamps onto the target and drags them back
   • ABSOLUTE DREAD (Q) sends a wraith screaming after every foe it terrifies
   • while FEAR INCARNATE (Q + back) is active, his wisps are bigger and hit harder */
const DP=[];
const DP_CORE=new THREE.MeshBasicMaterial({color:0x14081e}),DP_EYE=new THREE.MeshBasicMaterial({color:0x8aff6a});
function dpMesh(kind,sc){const g=new THREE.Group();
  if(kind==='hand'){const m=new THREE.MeshStandardMaterial({color:0x1a0a26,emissive:0x4a1a7a,emissiveIntensity:1.2,roughness:.4});
    g.add(new THREE.Mesh(cg('dpPalm',()=>new THREE.BoxGeometry(.32,.08,.34)),m));for(let k=0;k<4;k++){const c=new THREE.Mesh(cg('dpFing',()=>{const q=new THREE.ConeGeometry(.04,.36,6);q.rotateX(Math.PI/2);q.translate(0,0,.18);return q;}),m);c.position.set((k-1.5)*.08,0,.15);c.rotation.y=(k-1.5)*.12;c.rotation.x=.25;g.add(c);}
    const th=new THREE.Mesh(cg('dpFing',()=>{const q=new THREE.ConeGeometry(.04,.36,6);q.rotateX(Math.PI/2);q.translate(0,0,.18);return q;}),m);th.position.set(.18,0,.02);th.rotation.y=.9;g.add(th);}
  else{g.add(new THREE.Mesh(cg('dpCore',()=>new THREE.SphereGeometry(.17,14,10)),DP_CORE));
    const sh=new THREE.Mesh(cg('dpShell',()=>new THREE.IcosahedronGeometry(.26,1)),addMat(0x6a2a9a,1.6,.55));g.add(sh);g.userData.sh=sh;
    [-1,1].forEach(s=>{const e=new THREE.Mesh(cg('dpEye',()=>new THREE.SphereGeometry(.035,8,6)),DP_EYE);e.position.set(s*.06,.04,.15);g.add(e);});
    const mo=new THREE.Mesh(cg('dpMouth',()=>new THREE.TorusGeometry(.05,.012,6,12)),DP_EYE);mo.position.set(0,-.05,.16);mo.scale.y=1.6;g.add(mo);}
  g.scale.setScalar(sc||1);scene.add(g);return g;}
function dpFire(f,kind,pos,dir,o){o=o||{};const sc=(o.sc||1)*(f.incT>0?1.4:1);const g=dpMesh(kind,sc);g.position.copy(pos);const v=dir.clone().normalize().multiplyScalar(o.speed||22);
  const P={f,kind,g,pos:pos.clone(),vel:v,t:0,life:o.life||.9,home:o.home==null?2.5:o.home,r:(o.r||.5)*sc,dmg:(o.dmg||3)*(f.incT>0?1.5:1),terror:o.terror||1.2,boom:o.boom||0,hit:{}};DP.push(P);
  if(typeof pfxAdd==='function')pfxAdd(g,kind==='hand'?0x6a2a9a:0x8a4aca,0x8aff6a,kind==='orb'?1.1*sc:.55*sc,{noFlash:o.quiet});
  if(!o.quiet)xSnd(pos,()=>{SND.curse?SND.curse.spec():AU.whoosh(false);});return P;}
function dpTarget(f,p,R){let T=null,bd=R||16;for(const o of FS){if(o.dead||o.downed||ally(o,f)||o===f)continue;const d=o.chest(TMP2).distanceTo(p);if(d<bd){bd=d;T=o;}}return T;}
onEv('tick',dt=>{for(let i=DP.length-1;i>=0;i--){const P=DP[i];P.t+=dt;const f=P.f;let dead=P.t>P.life||!inMatch();
  if(!dead){if(P.home>0&&P.kind!=='hand'){const T=P.T&&!P.T.dead?P.T:dpTarget(f,P.pos,16);if(T){const want=T.chest(new V3()).sub(P.pos).normalize().multiplyScalar(P.vel.length());P.vel.lerp(want,Math.min(1,dt*P.home));}}
    P.pos.addScaledVector(P.vel,dt);P.g.position.copy(P.pos);P.g.quaternion.setFromUnitVectors(new V3(0,0,1),P.vel.clone().normalize());
    if(P.g.userData.sh){P.g.userData.sh.rotation.x+=dt*7;P.g.userData.sh.rotation.y+=dt*5;P.g.userData.sh.scale.setScalar(1+Math.sin(P.t*26)*.12);}
    if(Math.random()<.6&&nearCam(P.pos,70))burst(SMK,P.pos,1,{colors:[0x6a2a9a,0x120a1a],speed:.4,up:.3,life:.6,size:.25*(P.kind==='orb'?2:1),size1:.6});
    if(segBld(P.pos,P.vel,dt,0)||P.pos.y<gndY(P.pos)+.05)dead=true;
    if(!dead)for(const o of FS){if(o.dead||o.downed||ally(o,f)||o===f||P.hit[o.id])continue;if(o.chest(TMP2).distanceTo(P.pos)>P.r+.55)continue;P.hit[o.id]=1;
      if(P.kind==='hand'){dpGrab(P,o);dead=true;break;}
      if(P.boom){dead=true;break;}
      if(NET.role!=='client'){hitO(f,o,{dmg:P.dmg,kb:2,up:0,stun:.3,pt:P.pos.clone()});if(typeof terrify==='function')terrify(f,o,P.terror);}
      burst(ADD,P.pos,10,{colors:[0x8aff6a,0x6a2a9a],speed:4,life:.3,size:.25,size1:0,bright:2});dead=true;break;}}
  if(dead){if(P.boom&&inMatch()){const c=P.pos.clone();burst(SMK,c,30,{colors:[0x6a2a9a,0x120a1a,0x3a1a5a],speed:5,up:1.5,life:1.1,size:.6,size1:1.6});ring(c,0x8aff6a,P.boom*2,.4,false,2.4);ring(TMP2.set(c.x,floorAt(c.x,c.z,c.y+1)+.1,c.z).clone(),0x6a2a9a,P.boom*2.4,.5,true,2);
      if(NET.role!=='client')for(const o of FS){if(o.dead||ally(o,f)||o===f)continue;if(o.chest(TMP2).distanceTo(c)<P.boom){hitO(f,o,{dmg:P.dmg,kb:6,up:3,stun:.5,heavy:true,pt:o.chest(new V3())});if(typeof terrify==='function')terrify(f,o,P.terror);}}
      xSnd(c,()=>{AU.boom&&AU.boom(false);if(SND.curse)SND.curse.hit(1);});}
    scene.remove(P.g);DP.splice(i,1);}}});
onEv('matchEnd',()=>{DP.forEach(P=>scene.remove(P.g));DP.length=0;GRASPS.length=0;});
// the shadow hand clamps on and drags them back
const GRASPS=[];
function dpGrab(P,o){const f=P.f;GRASPS.push({f,o,t:0,from:o.pos.clone()});burst(SMK,o.chest(new V3()),20,{colors:[0x6a2a9a,0x120a1a],speed:3,life:.6,size:.5,size1:1.2});
  if(NET.role!=='client'){hitO(f,o,{dmg:6,kb:0,up:0,stun:.9,hold:true,pt:o.chest(new V3())});if(typeof terrify==='function')terrify(f,o,2.5);}xSnd(o.pos,()=>{SND.curse?SND.curse.hit(1):AU.hit&&AU.hit(true);});}
onEv('tick',dt=>{for(let i=GRASPS.length-1;i>=0;i--){const G=GRASPS[i];G.t+=dt;const {f,o}=G;if(G.t>.35||o.dead||f.dead){GRASPS.splice(i,1);continue;}
  const u=G.t/.35,e=u*u*(3-2*u),fw=f.fwd(),to=new V3(f.pos.x+fw.x*1.6,o.pos.y,f.pos.z+fw.z*1.6);if(NET.role!=='client'){const p=G.from.clone().lerp(to,e);if(!insideBld(p.x,p.z,.5,o.pos.y+.5)){o.pos.x=p.x;o.pos.z=p.z;}o.vel.set(0,o.vel.y,0);}
  trailSeg(f.chest(new V3()),o.chest(new V3()),0x6a2a9a,.1,.12);}});
function dpHand(f,side){const h=limbPos(f,side==='l'?'l':'r',new V3());if(!(h.y>f.pos.y+.3&&h.y<f.pos.y+2.6)||h.distanceTo(f.pos)>3)return f.chest(new V3()).addScaledVector(f.fwd(),.6);return h;}
function isDreadF(f){return !!f&&!!f.hero&&KIT(f.hero,'elem')==='dread';}
// combo punches and the heavy
onEv('tick',()=>{for(const f of FS){if(!isDreadF(f)||f.dead||f.state!=='attack'||!f.move){if(f._dp)f._dp.mv=null;continue;}
  const S=f._dp||(f._dp={});const M=f.move;if(S.mv!==f.moveName||f.stateT<(S.lt||0)){S.mv=f.moveName;S.fired=false;}S.lt=f.stateT;
  if(!S.fired&&f.stateT>=M.st){S.fired=true;const T=tgtOf(f,18),hand=dpHand(f,M.limb);const dir=T?T.chest(new V3()).sub(hand):f.fwd();
    if(M.heavy||/H$/.test(f.moveName||''))dpFire(f,'orb',hand,dir,{sc:2.1,speed:16,life:1.2,dmg:9,boom:3,terror:3,home:1.2});
    else dpFire(f,'wisp',hand,dir,{dmg:3,terror:1.2,quiet:Math.random()<.5});}}});
// FEAR BLAST, PANIC BURST, NIGHTMARE GRASP
(function(){if(typeof SPECIALS==='undefined'||!SPECIALS.dread)return;
  const _fb=SPECIALS.dread;SPECIALS.dread=function(f,dt){const r=_fb.apply(this,arguments);atT(f,'dpv',.22,()=>{const c=f.chest(new V3()),fw=f.fwd();for(let i=0;i<5;i++){const d=fw.clone().applyAxisAngle(UP,(i-2)*.22);dpFire(f,'wisp',c.clone().addScaledVector(d,.6),d,{sc:1.2,dmg:4,terror:2,home:3.2,life:1.2,speed:20,quiet:i>0});}});return r;};
  if(SPECVAR.dread&&SPECVAR.dread.chg){const _pb=SPECVAR.dread.chg[1];SPECVAR.dread.chg[1]=function(f,dt,k){const r=_pb.apply(this,arguments);atT(f,'dpr',.25,()=>{const c=f.chest(new V3());for(let i=0;i<10;i++){const a=i/10*6.283;dpFire(f,'wisp',c.clone(),new V3(Math.cos(a),.05,Math.sin(a)),{sc:1.1,dmg:4+3*(k||0),terror:2.5,home:0,life:.8,speed:18,quiet:i>0});}});return r;};}
  if(SPECVAR.dread&&SPECVAR.dread.alt){SPECVAR.dread.alt[1]=function(f){once(f,.18,()=>{const T=tgtOf(f,18);if(T)faceTo(f,T);const h=dpHand(f,'r'),dir=T?T.chest(new V3()).sub(h):f.fwd();
      const P=dpFire(f,'hand',h,dir,{sc:1.3,speed:34,life:.6,home:0,r:.6});P.T=T;});vpose(f,.18,'charge','point');endAt(f,.6);return 10;};}
  // ABSOLUTE DREAD: a wraith after every terrified foe
  if(ULTX.absdread){const _ad=ULTX.absdread.u;ULTX.absdread.u=function(f,t){const r=_ad.apply(this,arguments);const V=f.vf;if(V.t0!=null)atT(f,'dpu',V.t0+.5,()=>{(V.L||[]).slice(0,8).forEach((o,i)=>{const c=f.chest(new V3()).add(new V3(rand(-.6,.6),rand(0,.8),rand(-.6,.6)));
        const P=dpFire(f,'wisp',c,o.chest(new V3()).sub(c).add(new V3(0,3,0)),{sc:1.6,dmg:7,terror:3,home:4,life:1.8,speed:18,quiet:i>0});P.T=o;});});return r;};}})();
