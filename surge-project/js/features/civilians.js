/* Civilians to rescue (used by Rescue missions and the Hero License Exam).
   Walk up to a civilian and hold R (gamepad: X/Square, touch: RESCUE) to carry them to safety.
   Also: the objective panel (setObj) and the compass arrow that points at the next target (setArrow). */
const CIVS=[];
const CIV_SHIRTS=[0xd84a4a,0x4a8ad8,0xe8c84a,0x5ac88a,0xc86ad8,0xf2f2f2,0xff9a4a],CIV_SKIN=[0xf2d0b0,0xd8a880,0xa8785a,0x6a4a3a];
const civMats={};function civMat(c){return civMats[c]||(civMats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.7}));}
const helpTex=(()=>{const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=5;
  g.beginPath();g.roundRect?g.roundRect(4,4,120,44,12):g.rect(4,4,120,44);g.fill();g.stroke();g.beginPath();g.moveTo(54,48);g.lineTo(64,62);g.lineTo(74,48);g.fill();
  g.fillStyle='#e8262c';g.font='900 30px Impact,sans-serif';g.textAlign='center';g.fillText('HELP!',64,38);return new THREE.CanvasTexture(c);})();
function makeCiv(x,z,y,peril){const g=new THREE.Group(),sh=civMat(CIV_SHIRTS[Math.floor(Math.random()*CIV_SHIRTS.length)]),sk=civMat(CIV_SKIN[Math.floor(Math.random()*CIV_SKIN.length)]),pa=civMat(0x2a2e3a);
  const B=(w,h,d,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o;};
  B(.18,.8,.2,pa,-.12,.4,0);B(.18,.8,.2,pa,.12,.4,0);B(.5,.65,.28,sh,0,1.12,0);const hd=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),sk);hd.position.y=1.62;g.add(hd);
  const arm=(s)=>{const p=new THREE.Group();p.position.set(s*.32,1.4,0);const a=new THREE.Mesh(new THREE.BoxGeometry(.13,.6,.14),sh);a.position.y=-.28;p.add(a);g.add(p);return p;};
  const aL=arm(-1),aR=arm(1);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,40,8,1,true),new THREE.MeshBasicMaterial({color:0x5aff8a,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));beam.position.y=20;g.add(beam);
  const help=new THREE.Sprite(new THREE.SpriteMaterial({map:helpTex,depthTest:false}));help.scale.set(1.4,.7,1);help.position.y=2.4;g.add(help);
  g.position.set(x,y!=null?y:floorAt(x,z,2),z);g.rotation.y=Math.random()*6.28;scene.add(g);
  const C={g,aL,aR,beam,help,x,z,y:g.position.y,peril:peril||0,max:peril||0,saved:false,lost:false,prog:0,t:Math.random()*6};CIVS.push(C);return C;}
function clearCivs(){CIVS.forEach(c=>{scene.remove(c.g);});CIVS.length=0;$('civProg').classList.remove('on');setObj('');setArrow(null);}
function civLeft(){return CIVS.filter(c=>!c.saved&&!c.lost);}
// returns {saved:[...], lost:[...]} for this frame
function civTick(dt){const ev={saved:[],lost:[]};let near=null;
  for(const c of CIVS){if(c.saved||c.lost){if(c.liftT!=null){c.liftT+=dt;c.g.position.y=c.y+c.liftT*c.liftT*14;c.g.rotation.y+=dt*6;if(c.liftT>1.2){scene.remove(c.g);c.liftT=null;}}continue;}
    c.t+=dt;c.aL.rotation.z=-2.4+Math.sin(c.t*9)*.5;c.aR.rotation.z=2.4-Math.sin(c.t*9+1)*.5;c.help.position.y=2.4+Math.sin(c.t*3)*.08;
    if(c.max){c.peril-=dt;const k=clamp(c.peril/c.max,0,1);c.beam.material.color.setRGB(1-k*.65,.35+k*.65,.35+k*.2);c.beam.material.opacity=.25+(k<.3?.25*Math.abs(Math.sin(c.t*8)):0);
      if(Math.random()<dt*6&&nearCam(c.g.position,60))burst(SMK,TMP2.set(c.x+rand(-1.5,1.5),c.y+rand(.5,3),c.z+rand(-1.5,1.5)),1,{colors:[0x3a3a3a,0x5a5a5a],speed:1,up:2,life:1.5,size:.6,size1:1.6});
      if(k<.5&&Math.random()<dt*8&&nearCam(c.g.position,60))burst(ADD,TMP2.set(c.x+rand(-1.8,1.8),c.y+rand(0,.6),c.z+rand(-1.8,1.8)),1,{colors:[0xff5a1f,0xffb347],speed:.8,up:4,life:.5,size:.5,size1:0,bright:2});
      if(c.peril<=0){c.lost=true;c.g.visible=false;ev.lost.push(c);burst(SMK,new V3(c.x,c.y+1,c.z),20,{colors:[0x2a2a2a,0x4a4a4a],speed:2,up:3,life:1.6,size:.8,size1:2});continue;}}
    if(ME&&!ME.dead){const d=Math.hypot(ME.pos.x-c.x,ME.pos.z-c.z),dy=Math.abs(ME.pos.y-c.y);if(d<2.4&&dy<2.2&&(!near||d<near.d))near={c,d};}}
  // hold R next to someone to rescue them
  const pe=$('civProg');
  if(near&&ME.intent.revive&&['idle','run','block'].indexOf(ME.state)>=0){const c=near.c;c.prog+=dt;pe.classList.add('on');pe.style.setProperty('--p',Math.min(1,c.prog/1.1)*360+'deg');
    if(c.prog>=1.1){c.saved=true;c.liftT=0;ev.saved.push(c);emitEv('civSaved',c);pe.classList.remove('on');c.help.visible=false;c.beam.material.color.set(0xffffff);c.beam.material.opacity=.8;
      ring(new V3(c.x,c.y+.2,c.z),0x5aff8a,3,.5,true,2.4);burst(ADD,new V3(c.x,c.y+1,c.z),30,{colors:[0x5aff8a,0xffffff],speed:4,up:5,life:.7,size:.3,size1:0,bright:2.2});AU.scale=1;AU.bell();}}
  else{pe.classList.remove('on');if(near)near.c.prog=Math.max(0,near.c.prog-dt*2);}
  $('civHint').classList.toggle('on',!!near&&!(ME.intent.revive));
  return ev;}
function nearestCiv(){if(!ME)return null;let b=null,bd=1e9;for(const c of civLeft()){const d=Math.hypot(c.x-ME.pos.x,c.z-ME.pos.z)-(c.max?(c.max-c.peril)*.05:0);if(d<bd){bd=d;b=c;}}return b;}
function setObj(html){const e=$('objP');e.innerHTML=html||'';e.classList.toggle('on',!!html);}
function setArrow(p){const e=$('objArrow');if(!p||!ME){e.classList.remove('on');return;}e.classList.add('on');const a=Math.atan2(p.x-ME.pos.x,p.z-ME.pos.z)-camYaw;
  e.style.transform=`translateX(-50%) rotate(${-a}rad)`;e.querySelector('b').textContent=Math.round(Math.hypot(p.x-ME.pos.x,p.z-ME.pos.z))+'m';e.querySelector('b').style.transform=`rotate(${a}rad)`;}
onEv('matchEnd',clearCivs);
// spots to put people: inside ground floors, on low rooftops, out on the street
function civSpots(cx,cz,rad){const out=[];
  INTERIOR.forEach(([x,z])=>{if(Math.hypot(x-cx,z-cz)<rad)out.push({x,z,y:floorAt(x,z,1),where:'inside'});});
  BLDG.forEach(b=>{const x=(b.x0+b.x1)/2,z=(b.z0+b.z1)/2;if(b.h<22&&Math.hypot(x-cx,z-cz)<rad){const y=floorAt(x,z,999);if(y>4)out.push({x,z,y,where:'roof'});}});
  return out;}
