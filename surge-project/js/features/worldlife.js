/* A living city:
   - TIME OF DAY (dusk / day / night) and WEATHER (clear / rain / storm), picked per match (the same for everyone online;
     offline you can choose in Settings). Rain weakens fire (-20%) and boosts water/ice (+15%); storms boost electric (+25%).
   - THROWABLE CARS: stand next to a parked car and press R to lift it, then attack to throw it.
   (the train is now underground: station.js; the civilians: npcs.js) */
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
/* (the TRAINX moved underground: see station.js — the bullet train on the SURGE LINE) */
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
  const want=f.isBot?(Math.random()<dt*.25&&f.tgt&&f.tgt.pos.distanceTo(f.pos)<20):(f.intent.revive&&!(game.story)&&!(f===ME&&typeof npcBusy==='function'&&npcBusy())&&!mates(f).some(m=>m.downed&&m.pos.distanceTo(f.pos)<3));
  if(want&&['idle','run'].indexOf(f.state)>=0){const p=nearCar(f);if(p){liftCar(f,p);f.carT=game.time+1.4;netEvent({k:'car',s:'lift',f:f.id,p:p.i});}}}});
onEv('net:car',e=>{const f=byFid(e.f);if(!f)return;if(e.s==='lift'&&props[e.p])liftCar(f,props[e.p]);else if(e.s==='throw')throwCar(f,true);});
onEv('matchEnd',()=>{CARRY.forEach(f=>{if(f.car)scene.remove(f.car.m);f.car=null;});CARRY.length=0;CARS.forEach(c=>scene.remove(c.m));CARS.length=0;});
/* (crowds: see npcs.js) */
onEv('frame',()=>{const m=inMatch();if(document.body.classList.contains('inmatch')!==m)document.body.classList.toggle('inmatch',m);});
