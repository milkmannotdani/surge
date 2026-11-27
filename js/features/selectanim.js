/* Fighter select: picking a fighter plays a short showcase on the pedestal built from that fighter's own moves —
   their light string (each wind-up and strike), their heavy, a signature beat, then a victory pose — with bursts in
   their colour on each hit, a ring on the pedestal and a flash for the finish. Some fighters have a hand-made
   signature (HEMLOCK draws and looses his bow and scans; HOLLOW crouches, pounces, lands and executes).
   Hovering another fighter interrupts it. Also: the stage keeps clear of the settings bar, and the info card takes the
   fighter's colour. */
const SA={on:false,t:0,seq:null,i:0,from:null,R:null,idx:-1,yaw:-.3,lastSel:null,parts:[],ptMat:null,light:null};
const SA_SIG={
  hemlock:[['hemReach',.25,0],['hemFull',.65,0],['hemLoose',.35,2],['hemScan',.55,0],['hemHowl',.75,3]],
  hollow:[['holCrouch',.45,0],['holLeap',.3,0],['holLand',.35,2],['holExecW',.25,0],['holExecH',.3,1],['holUlt',.75,3]]};
const SA_KEYS=['hy','hx','sx','sy','sz','hd','lSx','lSz','lE','rSx','rSz','rE','lHx','lHz','lK','rHx','rHz','rK'];
function saSeq(i){const h0=heroAt(i);if(typeof SA_ROUT!=='undefined'&&h0&&SA_ROUT[h0.id]){try{return SA_ROUT[h0.id]();}catch(e){console.warn(e);}}
  const h=h0,fake={hero:h,state:'idle',stateT:0,intent:{},vel:new V3(),pos:new V3()},seq=[['showcase',.2,0]];
  let k=null;try{k=Fighter.prototype.lightMove.call(fake);}catch(e){}
  for(let n=0;n<3&&k&&MOVES[k];n++){const M=MOVES[k];if(POSES[M.w])seq.push([M.w,.15,0]);if(POSES[M.h])seq.push([M.h,.23,1]);k=M.next;}
  let hk=null;try{hk=Fighter.prototype.heavyMove.call(fake);}catch(e){}
  if(hk&&MOVES[hk]){const M=MOVES[hk];if(POSES[M.w])seq.push([M.w,.34,0]);if(POSES[M.h])seq.push([M.h,.36,2]);}
  (SA_SIG[h.id]||[['specw',.32,0],['spech',.42,2]]).forEach(s=>{if(POSES[s[0]])seq.push(s);});
  seq.push([POSES.win?'win':'showcase',1.15,3],['showcase',.45,0]);return seq;}
function saInit(){if(!SA.ptMat){SA.ptMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});SA.geo=new THREE.SphereGeometry(.05,8,6);
    SA.light=new THREE.PointLight(0xffffff,0,6,2);SA.light.position.set(0,1.4,1);PV.scene.add(SA.light);}}
function saFX(lvl,cc){const R=SA.R,h=heroAt(SA.idx);if(!R||!PV.scene)return;saInit();
  const pk=c=>Array.isArray(c)?c[Math.floor(Math.random()*c.length)]:c;
  const col=new THREE.Color(cc?pk(cc):(h.accent||h.color||0x7fe8ff)),c2=new THREE.Color(cc?pk(cc):(h.color||0xffffff));const o=R.spine.getWorldPosition(new V3());const fw=new V3(Math.sin(SA.yaw),0,Math.cos(SA.yaw));
  o.addScaledVector(fw,.45);o.y+=.15;const n=lvl===1?10:lvl===2?22:40;
  for(let i=0;i<n;i++){const m=new THREE.Mesh(SA.geo,SA.ptMat.clone());m.material.color.copy(cc?new THREE.Color(pk(cc)):(Math.random()<.6?col:c2));m.position.copy(o);PV.scene.add(m);
    const v=new V3(rand(-1,1),rand(-.4,1.2),rand(-1,1)).normalize().multiplyScalar(rand(1.2,lvl>2?4.5:3)).addScaledVector(fw,lvl===3?0:1.6);SA.parts.push({m,v,t:0,life:rand(.35,.7)});}
  if(lvl>=2&&PV.ped){const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.03,8,64),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    ring.rotation.x=Math.PI/2;ring.position.y=.05;PV.scene.add(ring);SA.parts.push({m:ring,ring:1,t:0,life:.6});}
  SA.light.color.copy(col);SA.light.intensity=lvl===3?5:lvl===2?3:1.6;
  if(typeof AU!=='undefined'&&AU.ctx){AU.scale=.35;if(lvl===1)AU.noise(.08,.4,'bandpass',1600,600,2);else if(lvl===2){AU.noise(.16,.5,'lowpass',900,200,1);AU.tone('sine',160,60,.18,.25);}
    else{AU.tone('sawtooth',220,440,.3,.12);AU.tone('sine',330,660,.4,.12,.06);AU.noise(.3,.3,'highpass',2000,6000,1);}AU.scale=1;}}
function saStart(i){if(!PV.r)return;const R=PV.rigs[pvKey(i)];if(!R)return;if(SA.on)saStop();SA.on=true;SA.t=0;SA.i=0;SA.idx=i;SA.R=R;
  SA.pos={x:0,y:0,z:0};SA.spin=0;SA.clock=0;SA.face=-.3;SA.clean=[];SA.crackA=0;SA.crackTip=null;SA.crackSeed=null;SA.shake=0;
  SA.yaw=((R.root.rotation.y%(Math.PI*2))+Math.PI*3)%(Math.PI*2)-Math.PI;SA.yaw0=SA.yaw;
  SA.seq=saSeq(i);SA.from=Object.assign({},R.P);}
function saStop(){const R=SA.R;(SA.clean||[]).forEach(f=>{try{f();}catch(e){}});SA.clean=[];
  if(R){R.P=Object.assign({},POSES.showcase);R.root.position.x=0;R.root.position.z=0;R.root.visible=true;R.root.rotation.y=SA.yaw+(SA.spin||0);}
  SA.spin=0;SA.pos={x:0,y:0,z:0};SA.crackA=0;SA.shake=0;const pv=$('pv');if(pv)pv.style.transform='';if(typeof sgCrackDraw==='function'&&document.getElementById('saCrack'))sgCrackDraw(0,0,0);
  SA.on=false;SA.R=null;}
function saTick(dt,R){let S=SA.seq[SA.i];if(!S){saStop();return;}
  if(Array.isArray(S))S=SA.seq[SA.i]={p:S[0],d:S[1],fx:S[2]};
  if(!S.fired){S.fired=1;SA.pos0=Object.assign({},SA.pos);SA.spin0=SA.spin;if(S.face!==undefined)SA.face=S.face;
    if(S.on)try{S.on(R,S);}catch(e){console.warn(e);}
    if(S.fx)saFX(S.fx,S.fxc);else if(S.d>=.3&&!S.q&&typeof AU!=='undefined'&&AU.ctx){AU.scale=.3;AU.whoosh(true);AU.scale=1;}}
  SA.t+=dt;SA.clock+=dt;const k=Math.min(1,SA.t/S.d),e=1-Math.pow(1-Math.min(1,k/.5),3),T=(typeof S.p==='string'?POSES[S.p]:S.p)||POSES.showcase,P={};
  for(const key of SA_KEYS)P[key]=lerp(SA.from[key]||0,T[key]||0,e);R.P=P;
  if(S.mv){const ee=S.lin?k:k*k*(3-2*k);SA.pos.x=lerp(SA.pos0.x,S.mv[0],ee);SA.pos.z=lerp(SA.pos0.z,S.mv[2],ee);}
  if(S.spin)SA.spin=SA.spin0+S.spin*(S.lin?k:k*k*(3-2*k));
  if(S.tk)try{S.tk(R,k,dt,S);}catch(e){console.warn(e);}
  SA.yaw+=(SA.face-SA.yaw)*Math.min(1,dt*8);
  if(k>=1){SA.from=Object.assign({},R.P);SA.i++;SA.t=0;if(S.spin)SA.spin=(SA.spin0+S.spin)%(Math.PI*2);}}
function saParts(dt){for(let i=SA.parts.length-1;i>=0;i--){const p=SA.parts[i];p.t+=dt;const k=p.t/p.life;
    if(k>=1){PV.scene.remove(p.m);if(!p.keepMat&&p.m.material)p.m.material.dispose();if((p.ring||p.geoOwn)&&p.m.geometry)p.m.geometry.dispose();SA.parts.splice(i,1);continue;}
    if(p.up){p.up(p,k,dt);continue;}
    if(p.ring){p.m.scale.setScalar(.6+k*1.4);p.m.material.opacity=1-k;continue;}
    p.v.y-=(p.g===undefined?4:p.g)*dt;p.v.multiplyScalar(Math.max(0,1-(p.dr===undefined?2:p.dr)*dt));p.m.position.addScaledVector(p.v,dt);
    if(p.floor!==undefined&&p.m.position.y<p.floor){p.m.position.y=p.floor;p.v.y=Math.abs(p.v.y)*(p.bn||0);p.v.x*=.6;p.v.z*=.6;}
    if(p.rs){p.m.rotation.x+=p.rs.x*dt;p.m.rotation.y+=p.rs.y*dt;p.m.rotation.z+=p.rs.z*dt;}
    if(p.cA)p.m.material.color.lerpColors(p.cA,p.cB,Math.min(1,k*1.4));p.m.material.opacity=p.solid?(k>.7?(1-k)/.3:1):(p.cA?Math.min(1,(1-k)*1.6):1-k);p.m.scale.setScalar(Math.max(.001,(p.s0||1)*(1-k*(p.sk===undefined?.6:p.sk))));}
  if(SA.light&&SA.light.intensity>0)SA.light.intensity=Math.max(0,SA.light.intensity-dt*9);}
const _saRP=renderPreview;
renderPreview=function(dt){const on=PV.r&&$('setup').classList.contains('on');
  if(on&&innerWidth>900){const sw=document.querySelector('#setup .selwrap'),st=$('setup');if(sw&&sw.scrollTop)sw.scrollTop=0;if(st&&st.scrollTop)st.scrollTop=0;}
  if(on){if(SA.lastSel!==mySel){if(SA.lastSel!==null)saStart(mySel);SA.lastSel=mySel;}
    const R=PV.rigs[pvKey(PV.idx)];if(SA.on&&(PV.idx!==SA.idx||R!==SA.R))saStop();
    if(SA.on&&R){saTick(dt,R);if(SA.on){R.root.rotation.y=SA.yaw+SA.spin-dt*.35;R.root.position.x=SA.pos.x;R.root.position.z=SA.pos.z;}}
    const pvc=$('pv');if(SA.shake>0){SA.shake-=dt;const a=SA.shakeA||6;pvc.style.transform=SA.shake>0?`translate(${rand(-a,a).toFixed(1)}px,${rand(-a,a).toFixed(1)}px)`:'';}
    if(SA.crackTip&&typeof sgCrackDraw==='function'){const q=SA.crackTip.clone().project(PV.cam);sgCrackDraw((q.x+1)/2*pvc.offsetWidth,(1-q.y)/2*pvc.offsetHeight,SA.crackA);if(SA.crackA<=0)SA.crackTip=null;}
    saParts(dt);
    // keep the fighter clear of the settings bar
    const act=document.querySelector('#setup .pvact'),pv=$('pv');if(act&&pv){const hh=act.offsetHeight;if(pv._b!==hh){pv._b=hh;pv.style.bottom='auto';pv.style.height=`calc(100% - ${hh}px)`;}
      const pi=document.querySelector('#setup .pvinfo'),sr=document.querySelector('#setup .selR');if(pi&&sr){const mh=Math.max(120,sr.clientHeight-hh-pi.offsetTop-10);if(pi._mh!==mh){pi._mh=mh;pi.style.maxHeight=mh+'px';pi.style.overflowY='auto';}}}}
  else if(SA.on)saStop();
  return _saRP.apply(this,arguments);};
const _saPH=previewHero;previewHero=function(i){const r=_saPH.apply(this,arguments);const pi=document.querySelector('#setup .pvinfo');if(pi)pi.style.setProperty('--c',heroAt(i).css);return r;};
