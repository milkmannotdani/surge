/* A living city:
   - TIME OF DAY (dusk / day / night) and WEATHER (clear / rain / storm), picked per match (the same for everyone online;
     offline you can choose in Settings). Rain weakens fire (-20%) and boosts water/ice (+15%); storms boost electric (+25%).
   - A TRAINX that runs along the z=96 road: ride on its roof, or get launched by it (knock enemies onto the tracks!).
   - THROWABLE CARS: stand next to a parked car and press R to lift it, then attack to throw it.
   - CROWDS: civilians walk the sidewalks and flee from fights. Heroes lose points for hurting them; villains earn CHAOS. */
/* ---------------- time of day + weather ---------------- */
const SKYU=sky.material.uniforms,HEMI=scene.children.find(o=>o.isHemisphereLight);
const WX0={sun:sun.intensity,sunC:SUN0.clone(),fog:FOG0.clone(),dens:scene.fog.density,hemi:HEMI?HEMI.intensity:.3,rim:rim.intensity,sd:sunDir.clone()};
const TOD={dusk:{},day:{sun:1.5,sunC:0xfff0dc,fog:0x9fb6cf,dens:.0026,hemi:.5,rim:.35,sd:[-.35,.82,-.45],dayk:1,exp:.7},
  night:{sun:.55,sunC:0x8aa8ff,fog:0x0a0d1c,dens:.0055,hemi:.12,rim:.35,sd:[-.5,.55,-.65],nightk:1,exp:.92}};
const WX={tod:'dusk',w:'clear',rain:null,flashT:0,nextBolt:0};
function wxPick(){const sm=SET.tod&&SET.tod!=='random'&&NET.role==='off',sw=SET.weather&&SET.weather!=='random'&&NET.role==='off';
  const h=hashStr(FS.map(f=>f.id+':'+f.pos.x.toFixed(1)).join(','));const tods=['dusk','dusk','day','night'],ws=['clear','clear','clear','rain','storm'];
  return {tod:sm?SET.tod:tods[h%tods.length],w:sw?SET.weather:ws[Math.floor(h/7)%ws.length]};}
function wxApply(tod,w){WX.tod=tod;WX.w=w;const T=TOD[tod]||{};
  sun.intensity=T.sun!=null?T.sun:WX0.sun;SUN0.copy(T.sunC!=null?new THREE.Color(T.sunC):WX0.sunC);FOG0.copy(T.fog!=null?new THREE.Color(T.fog):WX0.fog);
  scene.fog.density=(T.dens||WX0.dens)*(w==='clear'?1:w==='rain'?1.45:1.8);if(HEMI)HEMI.intensity=T.hemi!=null?T.hemi:WX0.hemi;rim.intensity=T.rim!=null?T.rim:WX0.rim;
  if(T.sd)sunDir.set(T.sd[0],T.sd[1],T.sd[2]).normalize();else sunDir.copy(WX0.sd);
  SKYU.dayk.value=T.dayk||0;SKYU.nightk.value=T.nightk||0;SKYU.cloudk.value=w==='clear'?0:w==='rain'?.7:.9;
  if(w!=='clear'){sun.intensity*=.55;FOG0.lerp(new THREE.Color(0x3a3e48),.4);}
  if(window.FINAL)FINAL.uniforms.exposure.value=T.exp||1;
  rainOn(w!=='clear',w==='storm'?1:.6);
  const b=$('wxBadge');if(b){const ic={dusk:'🌆',day:'☀️',night:'🌙'}[tod]+(w==='rain'?' 🌧 RAIN · FIRE −20% · WATER/ICE +15%':w==='storm'?' ⛈ STORM · ELECTRIC +25% · FIRE −20%':'');b.textContent=ic;b.classList.toggle('on',w!=='clear'||tod!=='dusk');}}
function rainOn(on,k){if(!WX.rain){const N=1800,g=new THREE.BufferGeometry(),p=new Float32Array(N*6);g.setAttribute('position',new THREE.BufferAttribute(p,3));
    WX.rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xaabbd0,transparent:true,opacity:.45,depthWrite:false}));WX.rain.frustumCulled=false;WX.rain.userData.v=new Float32Array(N);
    for(let i=0;i<N;i++){WX.rain.userData.v[i]=24+Math.random()*10;p[i*6]=rand(-40,40);p[i*6+1]=rand(0,40);p[i*6+2]=rand(-40,40);}scene.add(WX.rain);}
  WX.rain.visible=on;WX.rain.material.opacity=.3+.25*k;}
onEv('frame',dt=>{if(!WX.rain||!WX.rain.visible)return;const p=WX.rain.geometry.attributes.position.array,v=WX.rain.userData.v,c=camera.position,n=v.length*(WX.w==='storm'?1:.6);
  for(let i=0;i<v.length;i++){const j=i*6;if(i>n){p[j+1]=p[j+4]=-99;continue;}let x=p[j],y=p[j+1]-v[i]*dt,z=p[j+2];
    if(y<c.y-20||Math.abs(x-c.x)>40||Math.abs(z-c.z)>40){x=c.x+rand(-40,40);z=c.z+rand(-40,40);y=c.y+rand(10,30);}
    p[j]=x;p[j+1]=y;p[j+2]=z;p[j+3]=x+.15;p[j+4]=y+.9;p[j+5]=z;}WX.rain.geometry.attributes.position.needsUpdate=true;
  // storm lightning
  if(WX.w==='storm'&&inMatch()){if(game.time>WX.nextBolt){WX.nextBolt=game.time+rand(6,14);WX.flashT=.25;screenFlash(.35);const d=rand(.4,1.6);setTimeout(()=>{AU.scale=.9;AU.boom(true);AU.crackle(.8,.2,40);AU.scale=1;},d*1000);
      const a=rand(0,6.28),bp=new V3(c.x+Math.cos(a)*rand(20,60),0,c.z+Math.sin(a)*rand(20,60));cutLine(bp.clone().setY(80),bp,0xe8f0ff,.25,.3);cutLine(bp.clone().setY(80).add(new V3(rand(-6,6),0,rand(-6,6))),bp,0xffffff,.1,.25);}
    if(WX.flashT>0){WX.flashT-=dt;HEMI&&(HEMI.intensity=(TOD[WX.tod].hemi||WX0.hemi)+WX.flashT*8);}}});
onEv('matchStart',()=>{if(game.story||(typeof PR!=='undefined'&&PR.on)){wxApply('dusk','clear');return;}const p=wxPick();wxApply(p.tod,p.w);});
onEv('matchEnd',()=>wxApply('dusk','clear'));
const hasTag=(f,t)=>(f.hero.tags||[]).some(x=>t.indexOf(x)>=0);
onEv('hit',(att,def,dmg)=>{if(WX.w==='clear'||def.dead)return;let m=0;if(hasTag(att,['Fire','Blue Fire']))m-=.2;if(hasTag(att,['Water','Ice']))m+=.15;if(WX.w==='storm'&&hasTag(att,['Electric']))m+=.25;if(m)def.hp-=dmg*m;});
/* ---------------- the train ---------------- */
const TRAINX={z:96,len:3,carL:10,w:3.2,h:3.6,speed:24,x:-200,dir:1,state:'wait',t:6,g:null,boxes:[]};
(function buildTrain(){const g=new THREE.Group(),c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#e8ecf2';x.fillRect(0,0,256,64);
  x.fillStyle='#1a7a3a';x.fillRect(0,44,256,8);x.fillStyle='#1a2030';for(let i=0;i<6;i++)x.fillRect(12+i*41,10,30,24);const tex=new THREE.CanvasTexture(c);
  const body=new THREE.MeshStandardMaterial({map:tex,roughness:.45,metalness:.3}),roof=new THREE.MeshStandardMaterial({color:0x9aa0aa,metalness:.6,roughness:.4});
  for(let i=0;i<TRAINX.len;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(TRAINX.carL,TRAINX.h-.4,TRAINX.w),body);m.position.set(i*(TRAINX.carL+.6),TRAINX.h/2+.2,0);m.castShadow=true;g.add(m);
    const r=new THREE.Mesh(new THREE.BoxGeometry(TRAINX.carL,.2,TRAINX.w+.1),roof);r.position.set(i*(TRAINX.carL+.6),TRAINX.h+.1,0);g.add(r);}
  const hl=new THREE.Mesh(new THREE.BoxGeometry(.1,.4,1.6),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff0c0,emissiveIntensity:4}));hl.position.set((TRAINX.len-1)*(TRAINX.carL+.6)+TRAINX.carL/2+.05,1.2,0);g.add(hl);
  g.position.set(-300,0,TRAINX.z);world.add(g);TRAINX.g=g;
  // rails along the road
  const rm=new THREE.MeshStandardMaterial({color:0x5a5e66,metalness:.8,roughness:.4});for(const s of [-.8,.8]){const r=new THREE.Mesh(new THREE.BoxGeometry(BOUND*2+20,.12,.12),rm);r.position.set(0,.06,TRAINX.z+s);r.receiveShadow=true;world.add(r);}
  for(let i=0;i<TRAINX.len;i++){const b={x0:0,x1:0,z0:TRAINX.z-TRAINX.w/2,z1:TRAINX.z+TRAINX.w/2,h:TRAINX.h+.2,top:true};TRAINX.boxes.push(b);}})();
function trainPlace(){const span=TRAINX.len*(TRAINX.carL+.6);TRAINX.g.position.x=TRAINX.x;TRAINX.g.rotation.y=TRAINX.dir>0?0:Math.PI;
  for(let i=0;i<TRAINX.len;i++){const cx=TRAINX.x+TRAINX.dir*i*(TRAINX.carL+.6),b=TRAINX.boxes[i];b.x0=cx-TRAINX.carL/2;b.x1=cx+TRAINX.carL/2;}
  const on=Math.abs(TRAINX.x)<BOUND+span;DYNB.length=0;if(on&&TRAINX.state==='run')TRAINX.boxes.forEach(b=>DYNB.push(b));
  DYNR.x0=Math.min(TRAINX.x,TRAINX.x+TRAINX.dir*span)-14;DYNR.x1=Math.max(TRAINX.x,TRAINX.x+TRAINX.dir*span)+14;DYNR.z0=TRAINX.z-14;DYNR.z1=TRAINX.z+14;}
onEv('frame',dt=>{if(!inMatch()||game.story||(typeof PR!=='undefined'&&PR.on)){TRAINX.g.visible=false;DYNB.length=0;return;}TRAINX.g.visible=true;
  const T=TRAINX;if(T.state==='wait'){T.t-=dt;if(T.t<=0){T.state='run';T.dir=-T.dir;T.x=T.dir>0?-BOUND-40:BOUND+40;if(ME&&Math.abs(ME.pos.z-T.z)<40){announceSmall('🚆 TRAINX INCOMING');AU.scale=.6;AU.tone('square',660,660,.25,.08);AU.tone('square',550,550,.3,.08,.3);AU.scale=1;}}}
  else{const dx=T.speed*T.dir*dt;T.x+=dx;const span=T.len*(T.carL+.6);
    // riders move with the roof; anyone in front gets launched (host decides)
    for(const f of FS){if(f.dead)continue;const inX=f.pos.x>Math.min(T.x,T.x+T.dir*span)-T.carL/2&&f.pos.x<Math.max(T.x,T.x+T.dir*span)+T.carL/2,inZ=Math.abs(f.pos.z-T.z)<T.w/2+.6;
      if(inX&&inZ&&f.pos.y>T.h-.4&&f.onGround)f.pos.x+=dx;
      else if(NET.role!=='client'&&inZ&&f.pos.y<T.h-.3&&!(f.trainT>game.time)){const front=T.x+T.dir*(T.carL/2+.8);if(Math.abs(f.pos.x-front)<1.6||(inX&&Math.abs(f.pos.z-T.z)<T.w/2+.1))trainHit(f);}}
    props.forEach(p=>{if(!p.broken&&Math.abs(p.z-T.z)<T.w&&Math.abs(p.x-(T.x+T.dir*T.carL/2))<2)breakProp(p);});
    if(Math.abs(T.x)>BOUND+span+50){T.state='wait';T.t=rand(14,22);}}
  trainPlace();});
function trainHit(f){f.trainT=game.time+1.2;const d=new V3(TRAINX.dir,0,(f.pos.z>=TRAINX.z?1:-1)*.6).normalize();
  if(f.invuln>0)return;f.hp-=24*DMG_SCALE*(f.take||1);f.flash=1;f.vel.set(d.x*24,13,d.z*24);f.onGround=false;f.set('fly');f.pos.y+=.1;
  const c=f.chest(new V3());impactFX(f,c,true,false);shake(.5,c);AU.scale=sndAt(c);AU.crash();AU.boom(false);AU.scale=1;
  if(f===ME)announceSmall('HIT BY THE TRAINX!');else if(f.lastHitBy===ME&&game.time-f.lastHitT<3)announceSmall('TRAINX KO SETUP!');
  if(f.hp<=0&&!f.dead)killFighter(f,f.lastHitBy&&game.time-f.lastHitT<6?f.lastHitBy:null,d);}
/* ---------------- throwable cars ---------------- */
const CARRY=[];
function nearCar(f){let b=null,bd=2.8;for(const p of props){if(p.broken||p.kind!=='car')continue;const d=Math.hypot(p.x-f.pos.x,p.z-f.pos.z)-1.2;if(d<bd&&f.pos.y<1.5){bd=d;b=p;}}return b;}
function liftCar(f,p){p.broken=true;p.g.visible=false;const m=p.g.clone();m.visible=true;m.scale.setScalar(.8);scene.add(m);f.car={m,p};CARRY.push(f);AU.scale=sndAt(f.pos);AU.rock();AU.scale=1;if(f===ME)announceSmall('ATTACK TO THROW THE CAR');}
function throwCar(f,net){const C=f.car;if(!C)return;if(f===ME)emitEv('carMe');f.car=null;const i=CARRY.indexOf(f);if(i>=0)CARRY.splice(i,1);const dir=new V3(Math.sin(f.face),0,Math.cos(f.face));
  const pr={m:C.m,pos:C.m.position.clone(),vel:dir.multiplyScalar(26).add(new V3(0,6,0)),f,t:0};CARS.push(pr);AU.scale=sndAt(f.pos);AU.dash();AU.scale=1;
  if(!net)netEvent({k:'car',s:'throw',f:f.id});}
const CARS=[];
onEv('frame',dt=>{for(const f of CARRY){if(!f.car)continue;const m=f.car.m;m.position.set(f.pos.x,f.pos.y+2.6*f.hero.scale+.6,f.pos.z);m.rotation.y=f.face+Math.PI/2;m.rotation.z=Math.sin(game.time*3)*.05;}
  for(let i=CARS.length-1;i>=0;i--){const c=CARS[i];c.t+=dt;c.vel.y-=22*dt;c.pos.addScaledVector(c.vel,dt);c.m.position.copy(c.pos);c.m.rotation.x+=dt*5;
    let hit=c.pos.y<=floorAt(c.pos.x,c.pos.z,c.pos.y+1)+.3||!!insideBld(c.pos.x,c.pos.z,0,c.pos.y);
    if(!hit)for(const f of FS)if(f!==c.f&&!f.dead&&!f.dormant&&f.pos.distanceTo(c.pos)<2.4)hit=true;
    if(hit||c.t>4){CARS.splice(i,1);scene.remove(c.m);explosion(c.pos,3.4,[0xff7a20,0xffc24a,0xff3b10]);debris(c.pos,14,3,11,.5);if(typeof crater==='function')crater(c.pos.x,c.pos.z,2);shake(.5,c.pos);AU.scale=sndAt(c.pos);AU.boom(false);AU.crash();AU.scale=1;
      if(NET.role!=='client')for(const f of FS)if(f!==c.f&&!f.dead&&!ally(f,c.f)&&f.pos.distanceTo(c.pos)<4)applyHit(c.f,f,{dmg:22,kb:14,up:11,launch:true,heavy:true,pt:f.chest(new V3())});}}});
onEv('tick',dt=>{if(NET.role==='client')return;for(const f of FS){if(f.dead){if(f.car){scene.remove(f.car.m);f.car=null;}continue;}
  if(f.car){if(f.state==='attack'||f.state==='special'||(f.isBot&&game.time>(f.carT||0))){if(f.isBot&&f.tgt)f.face=Math.atan2(f.tgt.pos.x-f.pos.x,f.tgt.pos.z-f.pos.z);if(f.state==='attack')f.set('idle');throwCar(f);}continue;}
  const want=f.isBot?(Math.random()<dt*.25&&f.tgt&&f.tgt.pos.distanceTo(f.pos)<20):(f.intent.revive&&!(game.story)&&!mates(f).some(m=>m.downed&&m.pos.distanceTo(f.pos)<3));
  if(want&&['idle','run'].indexOf(f.state)>=0){const p=nearCar(f);if(p){liftCar(f,p);f.carT=game.time+1.4;netEvent({k:'car',s:'lift',f:f.id,p:p.i});}}}});
onEv('net:car',e=>{const f=byFid(e.f);if(!f)return;if(e.s==='lift'&&props[e.p])liftCar(f,props[e.p]);else if(e.s==='throw')throwCar(f,true);});
onEv('matchEnd',()=>{CARRY.forEach(f=>{if(f.car)scene.remove(f.car.m);f.car=null;});CARRY.length=0;CARS.forEach(c=>scene.remove(c.m));CARS.length=0;});
/* ---------------- crowds ---------------- */
const CROWD=[];const crowdGeo={leg:new THREE.BoxGeometry(.16,.8,.18),body:new THREE.BoxGeometry(.46,.62,.26),head:new THREE.SphereGeometry(.16,10,8),arm:new THREE.BoxGeometry(.12,.58,.13)};
function makeWalker(x,z,ax){const g=new THREE.Group(),sh=civMat(CIV_SHIRTS[Math.floor(Math.random()*CIV_SHIRTS.length)]),sk=civMat(CIV_SKIN[Math.floor(Math.random()*CIV_SKIN.length)]),pa=civMat([0x2a2e3a,0x3a2a1a,0x1a2a4a][Math.floor(Math.random()*3)]);
  const M=(geo,m,px,py)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,0);g.add(o);return o;};
  const lL=M(crowdGeo.leg,pa,-.11,.4),lR=M(crowdGeo.leg,pa,.11,.4);M(crowdGeo.body,sh,0,1.1);M(crowdGeo.head,sk,0,1.58);
  const arm=s=>{const p=new THREE.Group();p.position.set(s*.3,1.38,0);const a=new THREE.Mesh(crowdGeo.arm,sh);a.position.y=-.27;p.add(a);g.add(p);return p;};
  const W={g,lL,lR,aL:arm(-1),aR:arm(1),ax,base:ax==='x'?z:x,pos:ax==='x'?x:z,dir:Math.random()<.5?1:-1,sp:rand(1.2,1.8),ph:Math.random()*6,down:0,flee:0};g.position.set(x,0,z);scene.add(g);CROWD.push(W);return W;}
function crowdSpawn(){crowdClear();let n=0;for(let k=0;k<200&&n<30;k++){const a=INNER[Math.floor(Math.random()*INNER.length)],sd=Math.random()<.5?-1:1,along=rand(-BOUND+10,BOUND-10);
  const ax=Math.random()<.5?'x':'z';const x=ax==='x'?along:a+sd*7.6,z=ax==='x'?a+sd*7.6:along;if(insideBld(x,z,.6))continue;makeWalker(x,z,ax);n++;}}
function crowdClear(){CROWD.forEach(w=>scene.remove(w.g));CROWD.length=0;}
onEv('matchStart',()=>{if(game.story||(typeof PR!=='undefined'&&PR.on)||SET.crowds===false){crowdClear();return;}crowdSpawn();});
onEv('matchEnd',crowdClear);
onEv('frame',dt=>{if(!CROWD.length)return;const t=game.time;
  for(const W of CROWD){const g=W.g;if(!nearCam(g.position,90)){g.visible=false;continue;}g.visible=true;
    if(W.down>0){W.down-=dt;g.rotation.x=Math.min(Math.PI/2,g.rotation.x+dt*6);g.position.y=.15;if(W.down<=0){g.rotation.x=0;g.position.y=0;W.flee=3;}continue;}
    // run away from nearby fighters
    let thr=null,td=7;for(const f of FS)if(!f.dead&&!f.dormant){const d=Math.hypot(f.pos.x-g.position.x,f.pos.z-g.position.z);if(d<td){td=d;thr=f;}}
    if(thr){W.flee=2.5;const along=W.ax==='x'?g.position.x-thr.pos.x:g.position.z-thr.pos.z;W.dir=along>=0?1:-1;}
    const sp=W.flee>0?W.sp*3.2:W.sp;W.flee-=dt;W.pos+=W.dir*sp*dt;if(Math.abs(W.pos)>BOUND-6){W.dir=-W.dir;}
    const nx=W.ax==='x'?W.pos:W.base,nz=W.ax==='x'?W.base:W.pos;if(insideBld(nx,nz,.4)){W.dir=-W.dir;W.pos+=W.dir*sp*dt*2;}else g.position.set(nx,0,nz);
    g.rotation.y=W.ax==='x'?(W.dir>0?Math.PI/2:-Math.PI/2):(W.dir>0?0:Math.PI);
    W.ph+=dt*sp*3.2;const s=Math.sin(W.ph);W.lL.rotation.x=s*.7;W.lR.rotation.x=-s*.7;
    if(W.flee>0){W.aL.rotation.x=-2.8+s*.3;W.aR.rotation.x=-2.8-s*.3;}else{W.aL.rotation.x=-s*.5;W.aR.rotation.x=s*.5;}}});
function crowdHurt(p,r,att){let n=0;for(const W of CROWD){if(W.down>0)continue;if(Math.hypot(W.g.position.x-p.x,W.g.position.z-p.z)<r){W.down=4;n++;}}
  if(n&&att===ME&&ME){if(ME.hero.faction==='hero'){const lose=Math.min(POINTS,3*n);if(lose){POINTS-=lose;store.set('surge.points',String(POINTS));renderPoints();}announceSmall(`CIVILIAN HURT! −${3*n} POINTS — HEROES PROTECT PEOPLE`);}
    else{addPoints(n,'CHAOS');}}}
onEv('hit',(att,def,dmg,o)=>{if(CROWD.length&&o&&o.pt)crowdHurt(o.pt,o.heavy?3:1.8,att);});
const _craterC=crater;crater=function(x,z,s,y){_craterC(x,z,s,y);if(CROWD.length)crowdHurt({x,z},s*1.6,null);};
onEv('frame',()=>{const m=inMatch();if(document.body.classList.contains('inmatch')!==m)document.body.classList.toggle('inmatch',m);});
