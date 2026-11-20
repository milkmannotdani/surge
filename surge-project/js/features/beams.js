/* BEAMS — every beam can be steered, and beams that meet head-on CLASH.
   STEERING: while firing a beam you turn it with the mouse/camera (bots track their target) and can walk slowly.
     Special beams turn at 2.6 rad/s, ultimate beams at 1.8 rad/s.
   CLASH: when two enemies' beams meet, both stop where they collide and a struggle begins. A blazing ball of energy
     sits at the meeting point and slides toward whoever is losing. MASH light / heavy / special / jump to push.
     Beam power matters too (ultimate beams and Torrent push harder). Push it all the way (or be ahead after 5 s) and your
     beam blasts through: the loser takes a big hit and is thrown back; the winner's beam carries on.
   The host decides the struggle online; clients send their mashes and show the host's clash. */
const BEAM_TURN=2.6,BEAM_TURN_U=1.8,BEAM_WALK=2.4,CLASH_T=5;
const CLASH=new Map();   // key 'idA|idB' -> clash
function activeBeams(){const L=[];
  for(const w of CABW){if(w.type!=='beam'||!w.mesh||!w.mesh.parent)continue;const f=w.f;if(!f||f.dead||f.state!==w.st||f.stateT<w.from)continue;
    const d=new V3(0,0,1).applyQuaternion(w.mesh.quaternion);
    L.push({f,o:w.mesh.position,d,L:w.mesh.scale.z,r:Math.max(.4,w.mesh.scale.x),ult:f.state==='ult',pw:(w.A.power||1)*(f.state==='ult'?2:1)*(heroIs(f,'torrent')?1.35:1),kind:'cab',w});}
  for(const f of FS){if(f.dead||f.state!=='ult'||!f.beamDir||!f.rig.beam||!f.rig.beam.group.visible)continue;
    L.push({f,o:f.chest(new V3()).addScaledVector(f.beamDir,.7),d:f.beamDir,L:f.beamLen||48,r:1.1,ult:true,pw:2.4,kind:'ba'});}
  return L;}
function beamOf(B,f){return B.find(b=>b.f===f);}
function inClash(f){for(const c of CLASH.values())if(c.a===f||c.b===f)return c;return null;}
function angTo(a,b){let d=b-a;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d;}

/* ---------- steering ---------- */
onEv('tick',dt=>{if(!inMatch())return;const B=activeBeams();
  for(const b of B){const f=b.f;if(inClash(f))continue;
    let want=f.face;if(f.isBot){const T=tgtOf(f,45);if(T)want=Math.atan2(T.pos.x-f.pos.x,T.pos.z-f.pos.z);}else if(f.intent)want=f.intent.aim;
    const mx=(b.ult?BEAM_TURN_U:BEAM_TURN)*dt,da=angTo(f.face,want);f.face+=Math.max(-mx,Math.min(mx,da));
    if(b.kind==='ba'){f.beamDir=f.fwd();f.beamLen=clearLen(f.pos,f.beamDir,48,f.chest(TMP2).y);}
    // slow walk while beaming
    const I=f.intent;if(I&&!f.isBot&&(I.wx||I.wz)&&f.onGround){const nx=f.pos.x+I.wx*BEAM_WALK*dt,nz=f.pos.z+I.wz*BEAM_WALK*dt;
      if(Math.abs(nx)<BOUND&&Math.abs(nz)<BOUND&&!insideBld(nx,nz,.4,f.pos.y+1)){f.pos.x=nx;f.pos.z=nz;}}}});

/* ---------- clash detection (host / offline) ---------- */
// closest points between two segments (in 3D)
function segClose(p1,d1,L1,p2,d2,L2){const r=new V3().subVectors(p1,p2),a=L1*L1,e=L2*L2,b=L1*L2*d1.dot(d2),c=L1*d1.dot(r),f=L2*d2.dot(r);
  const den=a*e-b*b;let s=den>1e-6?clamp((b*f-c*e)/den,0,1):0,t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a,0,1);}else if(t>1){t=1;s=clamp((b-c)/a,0,1);}
  const q1=p1.clone().addScaledVector(d1,L1*s),q2=p2.clone().addScaledVector(d2,L2*t);return {dist:q1.distanceTo(q2),s,t,q1,q2};}
onEv('tick',dt=>{if(!inMatch()||NET.role==='client')return;const B=activeBeams();
  for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const A=B[i],C=B[j];if(A.f===C.f||ally(A.f,C.f)||inClash(A.f)||inClash(C.f))continue;
    if(A.d.dot(C.d)>-.25)continue;const k=segClose(A.o,A.d,A.L,C.o,C.d,C.L);if(k.dist>A.r+C.r+1.1)continue;
    const span=A.o.distanceTo(C.o)||1,u=clamp(A.o.distanceTo(k.q1.clone().lerp(k.q2,.5))/span,.15,.85);
    clashStart(A.f,C.f,u);}});
function clashStart(a,b,u){const c={a,b,u,t:0,ma:0,mb:0,fx:null,sync:0};CLASH.set(a.id+'|'+b.id,c);
  if(NET.role==='host')netEvent({k:'bclash',s:'start',a:a.id,b:b.id,u});
  [a,b].forEach(f=>{if(f===ME){announce('BEAM CLASH!',f.hero.css);}});
  feed(`<b style="--c:${a.hero.css}">${esc(a.name)}</b> and <b style="--c:${b.hero.css}">${esc(b.name)}</b> BEAM CLASH!`);}
onEv('net:bclash',e=>{const a=FS.find(f=>f.id===e.a),b=FS.find(f=>f.id===e.b);if(!a||!b)return;const key=a.id+'|'+b.id;
  if(e.s==='start'){if(!CLASH.has(key))CLASH.set(key,{a,b,u:e.u,t:0,ma:0,mb:0,fx:null});}
  else if(e.s==='upd'){const c=CLASH.get(key);if(c)c.u=e.u;}
  else if(e.s==='end'){const c=CLASH.get(key);if(c)clashEnd(c,e.w===a.id?a:e.w===b.id?b:null,true);}});

/* ---------- the struggle ---------- */
const CLASH_KEYS=['KeyJ','KeyK','Digit1','Space','KeyL'];
addEventListener('keydown',e=>{if(e.repeat||!ME||!inMatch())return;const k=typeof mapKey==='function'?mapKey(e.code):e.code;if(CLASH_KEYS.indexOf(k)<0)return;const c=inClash(ME);if(!c)return;
  if(NET.role==='client')netSay({k:'bmash',id:ME.id});else{if(c.a===ME)c.ma++;else c.mb++;}c.pop=1;});
onEv('x:bmash',e=>{if(NET.role!=='host')return;const f=FS.find(q=>q.id===e.id);const c=f&&inClash(f);if(!c)return;if(c.a===f)c.ma++;else c.mb++;});
onEv('tick',dt=>{if(!CLASH.size)return;const B=activeBeams();
  for(const c of [...CLASH.values()]){c.t+=dt;const ba=beamOf(B,c.a),bb=beamOf(B,c.b);
    if(!ba||!bb||c.a.dead||c.b.dead){clashEnd(c,null);continue;}
    // hold both beams in place (their timers pause), face each other
    if(!c.hold)c.hold=new Map([[c.a,c.a.stateT],[c.b,c.b.stateT]]);
    if(!c.wt)c.wt=new Map([[ba,ba.w&&ba.w.t],[bb,bb.w&&bb.w.t]]);[ba,bb].forEach(b=>{if(b.w){const k=[...c.wt.keys()].find(x=>x.w===b.w);if(k&&c.wt.get(k)!=null)b.w.t=c.wt.get(k);}});
    [c.a,c.b].forEach(f=>{const h=c.hold.get(f);if(h!=null)f.stateT=h;if(f.state==='ult'&&f.uEnd<99)f.uEnd=Math.max(f.uEnd,f.stateT+.4);});
    c.a.face=Math.atan2(c.b.pos.x-c.a.pos.x,c.b.pos.z-c.a.pos.z);c.b.face=Math.atan2(c.a.pos.x-c.b.pos.x,c.a.pos.z-c.b.pos.z);
    if(NET.role!=='client'){
      if(c.a.isBot&&Math.random()<dt*rand(4,8))c.ma++;if(c.b.isBot&&Math.random()<dt*rand(4,8))c.mb++;
      c.ra=(c.ra||0)*Math.exp(-dt*1.6)+c.ma;c.rb=(c.rb||0)*Math.exp(-dt*1.6)+c.mb;c.ma=c.mb=0;
      const pa=ba.pw*(1+c.ra*.13),pb=bb.pw*(1+c.rb*.13);c.u=clamp(c.u+(pa-pb)/(pa+pb)*dt*.9,0,1);
      if(NET.role==='host'&&(c.sync-=dt)<=0){c.sync=.12;netEvent({k:'bclash',s:'upd',a:c.a.id,b:c.b.id,u:+c.u.toFixed(3)});}
      if(c.u>=.97)clashEnd(c,c.a);else if(c.u<=.03)clashEnd(c,c.b);else if(c.t>CLASH_T)clashEnd(c,c.u>=.5?c.a:c.b);}
    if(CLASH.has(c.a.id+'|'+c.b.id))clashDraw(c,ba,bb,dt);}});
function clashPoint(c,ba,bb){const oa=ba.o,ob=bb.o;return oa.clone().lerp(ob,c.u);}
function clashDraw(c,ba,bb,dt){const P=clashPoint(c,ba,bb);
  // cut both beams at the meeting point
  [[ba,P],[bb,P]].forEach(([b,p])=>{const L=Math.max(.3,b.o.distanceTo(p));if(b.kind==='cab'){b.w.mesh.scale.z=L;}else{b.f.beamLen=L;}});
  if(!c.fx){const g=new THREE.Group();const core=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}));
    const ga=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:c.a.hero.color,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    const gb=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:c.b.hero.color,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(core,ga,gb);scene.add(g);c.fx={g,core,ga,gb,sn:0};}
  const F=c.fx,s=1.4+Math.sin(c.t*30)*.18+Math.min(1,c.t)*.6;F.g.position.copy(P);F.core.scale.setScalar(s*.6);F.ga.scale.setScalar(s*(1.1+.25*(1-c.u)));F.gb.scale.setScalar(s*(1.1+.25*c.u));
  F.ga.position.set(-.25,0,0);F.gb.position.set(.25,0,0);F.g.rotation.y=c.a.face+Math.PI/2;
  if(nearCam(P,70)){burst(ADD,P,4,{colors:[c.a.hero.color,c.b.hero.color,0xffffff],speed:12,life:.35,size:.3,size1:0,bright:2.8});
    if(Math.random()<dt*6)ring(P,Math.random()<.5?c.a.hero.color:c.b.hero.color,2.5+Math.random()*2,.25,false,2.6);if(Math.random()<dt*3)flashLight(P,0xffffff,8);}
  if(ME&&(c.a===ME||c.b===ME||P.distanceTo(ME.pos)<30)){shake(.06,P);if((F.sn-=dt)<=0){F.sn=.18;const s0=AU.scale;AU.scale=sndAt(P);AU.zap&&AU.zap(.6);AU.hit&&AU.hit(.5);AU.scale=s0;}}
  // HUD tug-of-war for the player
  const box=$('clashP');if(box&&(c.a===ME||c.b===ME)){box.classList.add('on');const mine=c.a===ME?c.u:1-c.u;box.querySelector('i').style.width=Math.round(mine*100)+'%';
    if(c.pop){c.pop=0;box.classList.remove('pp');void box.offsetWidth;box.classList.add('pp');}}}
function clashEnd(c,winner,fromNet){CLASH.delete(c.a.id+'|'+c.b.id);if(c.fx){scene.remove(c.fx.g);c.fx.g.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});c.fx=null;}
  if(c.a===ME||c.b===ME){const box=$('clashP');if(box)box.classList.remove('on');}
  if(NET.role==='host'&&!fromNet)netEvent({k:'bclash',s:'end',a:c.a.id,b:c.b.id,w:winner?winner.id:0});
  if(!winner)return;const loser=winner===c.a?c.b:c.a,p=loser.chest(new V3());
  burst(ADD,p,90,{colors:[winner.hero.color,winner.hero.accent,0xffffff],speed:16,up:4,life:.7,size:.45,size1:0,bright:2.8});ring(new V3(loser.pos.x,loser.pos.y+.2,loser.pos.z),winner.hero.color,7,.5,true,2.6);
  flashLight(p,winner.hero.color,18);shake(.5,p);xSnd(p,()=>{AU.boom(true);});
  if(NET.role!=='client'&&!loser.dead){loser.invuln=0;const pw=heroIs(winner,'torrent')?1.2:1;applyHit(winner,loser,{dmg:24*pw,kb:18,up:11,launch:true,heavy:true,pt:p,ult:true});}
  if(winner===ME)announce('CLASH WON!',winner.hero.css);else if(loser===ME)announceSmall('OVERPOWERED!');
  feed(`<b style="--c:${winner.hero.css}">${esc(winner.name)}</b> won the beam clash!`);
  if(winner===ME&&typeof achGive==='function')achGive('clash');}
// no beam damage while clashing (the beams are stopped at the meeting point)
// is this fighter firing (or winding up) a beam?
function beamMove(f){const h=f.hero,C=h.cab;
  if(f.state==='special'){if(f.xmOn)return !!(f.xmA&&f.xmA.form==='beam');if(h.special==='cab'&&C){const A=f.specVar==='alt'?(C.spAlt||C.sp):C.sp;return !!(A&&A.form==='beam');}return false;}
  if(f.state==='ult'){if(h.ult==='bloodarrow'&&!f.ultAlt)return true;if(C){const A=f.ultAlt&&KIT(h,'alt')==='cab'?C.ultAlt:(h.ult==='cab'?C.ult:null);return !!(A&&A.form==='beam');}}return false;}
// beams do no damage while clashing; and someone winding up a beam aimed back at the shooter isn't knocked out of it,
// so their beam comes out and the two clash
const _bmLine=lineFoes;lineFoes=function(f){if(CLASH.size&&inClash(f))return [];const L=_bmLine.apply(this,arguments);
  if(!L.length)return L;return L.filter(o=>{if(!beamMove(o)||o.stateT>.9)return true;const dx=f.pos.x-o.pos.x,dz=f.pos.z-o.pos.z,l=Math.hypot(dx,dz)||1,fw=o.fwd(TMP2);
    return (fw.x*dx+fw.z*dz)/l<.55;});};
onEv('matchEnd',()=>{[...CLASH.values()].forEach(c=>clashEnd(c,null,true));});
(function(){if(!$('clashP')){const d=document.createElement('div');d.id='clashP';d.innerHTML='<b>BEAM CLASH!</b><span>MASH J · K · 1 · SPACE</span><div class="cbar"><i></i></div>';document.body.appendChild(d);}
  if(typeof ACH!=='undefined'&&!ACH.some(a=>a.id==='clash'))ACH.push({id:'clash',n:'OVERPOWERED',d:'Win a beam clash'});})();
