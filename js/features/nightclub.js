/* NEON SIREN, part 2 (the building is js/engine/club.js): the people, the light show and the music.
   - Performers (in full sequinned stage costumes) work the three poles: walk around the pole, spin down it, climb
     and hold, then dance on the stage; one struts the runway out to the podium and back. Patrons sit along the
     runway, at the bar and in the booths: they nod to the beat, cheer, clap, drink and throw cash at the stage.
     A bartender works the bar, a DJ works the decks, a bouncer stands at the door.
   - They're civilians like everyone else (npcs.js): when a villain shows up they scatter or cower, villains can
     hurt and kill them, heroes can save them; when it's calm again they go back to what they were doing.
   - Moving spotlights from the truss, light pools on the stage, a turning mirror ball, and a 124 BPM club track
     you hear muffled from the street and loud inside (the match music dips while you're in there).
   - On the minimap: a pink ♪. In PATROL the club is one of the places villains attack. */
const CB={on:false,people:[],fx:null,bus:null,lp:null,out:null,next:0,step:0,inside:0,near:0};
const CB_BPM=124;
function cbBeat(){return game.time*CB_BPM/60;}
/* ---------- minimap ---------- */
(function(){const g=mmBase.getContext('2d');CLUB_INFO.forEach(c=>{g.fillStyle='rgba(255,58,208,.85)';g.fillRect((c.x0+MAPH)*MS,(c.z0+MAPH)*MS,(c.x1-c.x0)*MS,(c.z1-c.z0)*MS);
  MAP_MARKS.push({x:c.x0-1,z:c.z,col:'#ff3ad0',r:8,label:'♪',tcol:'#ffffff',edge:false});});})();

/* ---------- people: a jointed figure (hips, spine, head, elbows, knees) so they can actually dance ---------- */
const CB_SEQ=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,64,64);
  for(let y=0;y<64;y+=3)for(let x=(y/3)%2*1.5;x<64;x+=3){const v=Math.random();g.fillStyle=v<.15?'#ffffff':v<.5?'#b0b0b0':'#5a5a5a';g.beginPath();g.arc(x,y,1.2,0,7);g.fill();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);
  return new THREE.MeshStandardMaterial({vertexColors:true,roughness:.22,metalness:.7,envMapIntensity:1.4,emissive:0x303030,emissiveMap:t,roughnessMap:t});})();
const CB_SKIN=[0xf6d7bd,0xeac3a0,0xd9a87e,0xb98260,0x8a5a3c,0x5e3c28],CB_HAIR=[0x1a1410,0x2e2018,0x5a3a20,0xc8b080,0xd8d0c8,0x8a2a6a,0x2a4ad8,0xe8e0d8];
function cbBuild(style,fem){
  const skin=pick(CB_SKIN),hair=pick(CB_HAIR),w=style==='bouncer'?1.28:fem?.92:1.05;
  const P={};['pel','tor','head','aLu','aLl','aRu','aRl','lLu','lLl','lRu','lRl'].forEach(k=>P[k]={m:[],s:[]});
  const add=(k,seq,g,c,x,y,z,sx,sy,sz)=>{if(sx)g.scale(sx,sy,sz);g.translate(x||0,y||0,z||0);P[k][seq?'s':'m'].push(mColor(g,c));};
  const cyl=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||12),sph=(r,a,b)=>new THREE.SphereGeometry(r,a||14,b||10);
  // outfit colours per style
  let top,bot,sleeve,shoe,seqTop=false,seqBot=false,skirt=false,extra=null;
  if(style==='dancer'){const C=pick([[0xff4ad8,0xd8d8ff],[0x3ae8ff,0xffffff],[0xffd23f,0xff7a3a],[0xb04aff,0xff9ae8],[0xe8e8f0,0xff3a6a]]);top=bot=sleeve=C[0];shoe=fem?C[1]:0x141418;seqTop=seqBot=true;extra=C[1];}
  else if(style==='bartender'){top=0xf2f0ea;sleeve=0xf2f0ea;bot=0x141418;shoe=0x0c0c0e;extra=0x141418;}
  else if(style==='dj'){top=pick([0x2a2a30,0x3a1a4a,0x1a3a4a]);sleeve=top;bot=0x1a1a22;shoe=0xf0f0f0;}
  else if(style==='bouncer'){top=0x101014;sleeve=0x101014;bot=0x101014;shoe=0x08080a;extra=0xf2f0ea;}
  else{top=pick([0xe8e8e8,0x2a3a5a,0xc84a4a,0x4a7ac8,0x8a5ac8,0x3a3a3e,0xd8a0b0,0x1a1a1e,0x6a1a3a]);sleeve=Math.random()<.5?top:skin;bot=pick([0x22283a,0x3a3a40,0x1a1a1e,0x5a2a3a,0xc8b890]);shoe=pick([0x1a1a1e,0xf0f0f0,0x5a3a24,0xc84a4a]);skirt=fem&&Math.random()<.55;if(skirt)bot=top;}
  // pelvis (hips pivot at y .92)
  add('pel',seqBot,cyl(.165*w*(fem?1.06:1),.17*w*(fem?1.1:1),.2,14),bot,0,-.02,0,1,1,.68);
  if(skirt)add('pel',false,cyl(.17*w,.27*w,.46,16),bot,0,-.24,0,1,1,.8);
  // torso (spine pivot at the waist, y +.08 above the hips)
  add('tor',seqTop,cyl(.19*w*(fem?.94:1),.16*w*(fem?.86:1),.52,14),top,0,.26,0,1,1,.62);
  add('tor',seqTop,new THREE.SphereGeometry(.19*w*(fem?.94:1),14,8,0,Math.PI*2,0,Math.PI/2),top,0,.52,0,1,.36,.62);
  add('tor',false,cyl(.05,.056,.12,8),skin,0,.58,0);
  if(style==='bartender'){add('tor',false,new THREE.BoxGeometry(.3*w,.42,.02),0x141418,0,.24,.11*w);add('tor',false,new THREE.BoxGeometry(.08,.03,.02),0x141418,0,.55,.125);}
  if(style==='bouncer'){add('tor',false,new THREE.BoxGeometry(.06,.36,.02),extra,0,.36,.12*w);add('tor',false,new THREE.BoxGeometry(.025,.3,.02),0x5a0a1a,0,.34,.13*w);}
  if(style==='dancer'){add('tor',true,new THREE.TorusGeometry(.19*w,.012,6,24),extra,0,.08,0,1,.62,1);}
  // head (neck pivot)
  add('head',false,sph(.118,16,12),skin,0,.1,0,1,1.12,1.04);
  [-.041,.041].forEach(x=>{add('head',false,new THREE.BoxGeometry(.026,.017,.01),0x16120e,x,.115,.119);add('head',false,new THREE.BoxGeometry(.036,.008,.01),hair,x,.143,.116);});
  add('head',false,new THREE.BoxGeometry(.02,.03,.025),skin,0,.085,.123);add('head',false,new THREE.BoxGeometry(.045,.01,.01),style==='dancer'?0xb02a4a:0x8a4a3a,0,.05,.115);
  const hs=style==='bouncer'?'bald':style==='dancer'?(fem?pick(['long','pony','long']):'short'):pick(fem?['long','pony','bun','short']:['short','short','cap','bald']);
  if(hs!=='bald')add('head',false,new THREE.SphereGeometry(.129,16,9,0,Math.PI*2,0,Math.PI*.56),style==='dj'?0x1a1a1e:hair,0,.115,-.01,1,1.12,1.07);
  if(hs==='long')add('head',false,new THREE.BoxGeometry(.25,.36,.07),hair,0,-.05,-.09);
  if(hs==='pony'){const p=cyl(.045,.02,.3,8);p.rotateX(.4);add('head',false,p,hair,0,.02,-.16);}
  if(hs==='bun')add('head',false,sph(.058,10,8),hair,0,.235,-.07);
  if(style==='dancer')add('head',true,new THREE.TorusGeometry(.125,.012,6,24),extra,0,.17,0,1,1,1.05);
  if(style==='dj'){add('head',false,new THREE.TorusGeometry(.135,.016,6,20,Math.PI),0x1a1a1e,0,.1,0);[-1,1].forEach(s=>add('head',false,cyl(.05,.05,.04,12).rotateZ(Math.PI/2),0x2a2a30,s*.13,.1,0));}
  if(style==='bouncer')add('head',false,sph(.012,6,4),0x1a1a1e,-.12,.1,.02);
  // arms: shoulder pivot -> upper arm; elbow pivot -> forearm + hand
  const sl=sleeve,fa=sleeve;
  ['L','R'].forEach(S=>{const seq=seqTop;add('a'+S+'u',seq,cyl(.052,.046,.29,8),sl,0,-.145,0);add('a'+S+'l',seq,cyl(.045,.039,.26,8),fa,0,-.13,.0);
    add('a'+S+'l',false,sph(.047,8,6),style==='bartender'||style==='bouncer'?skin:skin,0,-.3,.01,.9,1.2,1);
    if(style==='dancer')add('a'+S+'l',true,cyl(.05,.05,.04,10),extra,0,-.24,0);});
  // legs: hip pivot -> thigh; knee pivot -> shin + foot
  ['L','R'].forEach(S=>{const th=skirt?skin:bot,boot=style==='dancer'&&fem;add('l'+S+'u',seqBot&&!skirt,cyl(.082,.066,.44,10),th,0,-.22,0);
    add('l'+S+'l',boot?false:seqBot,cyl(boot?.07:.062,.05,.42,10),boot?shoe:(skirt?skin:bot),0,-.21,0);
    add('l'+S+'l',false,new THREE.BoxGeometry(.1,.08,.25),shoe,0,-.44,.045);
    if(boot)add('l'+S+'l',false,new THREE.BoxGeometry(.04,.12,.05),shoe,0,-.5,-.06);});
  const mk=(k,par,x,y,z)=>{const G=new THREE.Group();G.position.set(x,y,z);par.add(G);const L=P[k];
    if(L.m.length){const m=new THREE.Mesh(geoMerge(L.m),NPC_MAT);G.add(m);}if(L.s.length){const m=new THREE.Mesh(geoMerge(L.s),CB_SEQ);G.add(m);}return G;};   // no shadows: they're indoors
  const g=new THREE.Group(),hip=mk('pel',g,0,.92,0),tor=mk('tor',hip,0,.06,0),head=mk('head',tor,0,.6,0);
  const aL=mk('aLu',tor,-.235*w,.5,0),aR=mk('aRu',tor,.235*w,.5,0),eL=mk('aLl',aL,0,-.29,0),eR=mk('aRl',aR,0,-.29,0);
  const lL=mk('lLu',hip,-.09*w,0,0),lR=mk('lRu',hip,.09*w,0,0),kL=mk('lLl',lL,0,-.44,0),kR=mk('lRl',lR,0,-.44,0);
  g.scale.setScalar(style==='bouncer'?1.08:rand(.95,1.05));
  return {g,hip,tor,head,aL,aR,eL,eR,lL,lR,kL,kR,acc:'none'};}
function cbReset(n){n.hip.position.set(0,.92,0);n.hip.rotation.set(0,0,0);n.tor.rotation.set(0,0,0);n.head.rotation.set(0,0,0);n.eL.rotation.set(-.15,0,0);n.eR.rotation.set(-.15,0,0);n.kL.rotation.set(0,0,0);n.kR.rotation.set(0,0,0);}
function cbMake(style,fem,o){const P=cbBuild(style,fem);const C=CLUB_INFO[0];
  const n=Object.assign(P,{kind:'club',style,role:o.role,x:o.x,z:o.z,y:o.y||0,face:o.face||0,sp:1.3,ph:Math.random()*6,mode:'walk',modeT:0,hp:40,panic:Math.random()<.6,
    area:o.area||C.walk,tx:o.x,tz:o.z,wait:0,flinch:0,kx:0,kz:0,danger:null,bub:null,lift:0,prog:0,home:{x:o.x,z:o.z,y:o.y||0,face:o.face||0},R:o,t0:rand(0,20),awayT:0});
  n.g.position.set(n.x,n.y,n.z);scene.add(n.g);NPC.push(n);CB.people.push(n);return n;}
function cbSpawn(){CB.people.length=0;if(!CLUB_INFO.length||game.story||(typeof PR!=='undefined'&&PR.on)||SET.crowds===false)return;const C=CLUB_INFO[0],SY=C.SY;
  // performers: one per pole (the podium one also works the runway)
  C.poles.forEach(([x,z],i)=>{const fem=i!==2;cbMake('dancer',fem,{role:'dance',x:x-.5,z,y:SY,face:Math.PI/2,pole:[x,z],runway:i===0,area:[i===0?[x-1.6,x+1.6,z-1.6,z+1.6,SY]:[C.stage[0],C.stage[1],C.stage[2],C.stage[3],SY]]});});
  // patrons: runway chairs, podium chairs, bar stools, booths
  const pickN=(L,n)=>L.slice().sort(()=>Math.random()-.5).slice(0,n);
  pickN(C.seats,7).forEach(s=>cbMake('patron',Math.random()<.45,{role:'sit',x:s[0],z:s[1],face:s[2],seatY:s[3],cash:true}));
  pickN(C.stools,3).forEach(s=>cbMake('patron',Math.random()<.5,{role:'sit',x:s[0],z:s[1],face:s[2],seatY:s[3],bar:true}));
  pickN(C.booths,3).forEach(s=>cbMake('patron',Math.random()<.5,{role:'sit',x:s[0],z:s[1],face:s[2],seatY:s[3]}));
  for(let k=0;k<3;k++){const x=rand(C.x-13,C.x-6),z=rand(C.z-6,C.z+6);cbMake('patron',Math.random()<.5,{role:'stand',x,z,face:Math.atan2(C.px-x,C.z-z)});}
  cbMake('bartender',Math.random()<.5,{role:'bar',x:(C.bar[0]+C.bar[1])/2,z:C.bar[2],face:Math.PI,area:[[C.bar[0]+.5,C.bar[1]-.5,C.bar[2]-.4,C.bar[2]+.4,0]]});
  cbMake('dj',Math.random()<.4,{role:'dj',x:C.dj[0],z:C.dj[1],y:.35,face:C.dj[2],area:[[C.dj[0]-2,C.dj[0]+2,C.dj[1]-.6,C.dj[1]+.6,.35]]});
  cbMake('bouncer',false,{role:'bounce',x:C.door[0]-1.4,z:C.door[1]+2.4,face:-Math.PI/2,area:[[C.door[0]-6,C.door[0]-1,C.door[1]-8,C.door[1]+8,0]]});}
onEv('matchStart',()=>{setTimeout(()=>{if(inMatch())cbSpawn();},0);});
onEv('matchEnd',()=>{CB.people.length=0;});

/* ---------- what they do when it's calm ---------- */
function cbCalm(n){return n.mode==='walk'&&!n.danger&&n.lift<=0&&!npcThreat(n);}
const _cbMove=npcMove;npcMove=function(n,dt){if(n.kind!=='club'||!cbCalm(n))return _cbMove.apply(this,arguments);
  // back to their spot after a scare (walk if close, otherwise reappear there when nobody's looking)
  const H=n.home,d=Math.hypot(H.x-n.x,H.z-n.z);
  if(d>.25&&n.role!=='dance'){n.awayT+=dt;if(d<6&&n.awayT<8){const s=Math.min(d,1.4*dt);n.face=Math.atan2(H.x-n.x,H.z-n.z);if(!npcStep(n,(H.x-n.x)/d*s,(H.z-n.z)/d*s)||n.awayT>7.5){n.x=H.x;n.z=H.z;}n.walkHome=true;return 1.4;}
    if(!nearCam(n.g.position,40)||n.awayT>8){n.x=H.x;n.z=H.z;n.y=H.y;}}
  else if(n.role==='dance'&&(Math.abs(n.y-H.y)>.3||d>4)&&!nearCam(n.g.position,30)){n.x=H.x;n.z=H.z;n.y=H.y;}
  n.awayT=0;n.walkHome=false;return 0;};
// inside a closed building: only draw them when the camera is in there or close to the door
function cbSeen(){const C=CLUB_INFO[0],p=camera.position;if(!C)return false;if(p.x>C.x0-1&&p.x<C.x1+1&&p.z>C.z0-1&&p.z<C.z1+1&&p.y<C.H+1)return true;return Math.hypot(p.x-C.x0,p.z-C.z)<24;}
let cbSeenF=0,cbSeenV=true;
const _cbPose=npcPose;npcPose=function(n,dt,sp){if(n.kind!=='club')return _cbPose.apply(this,arguments);
  if(cbSeenF!==renderer.info.render.frame){cbSeenF=renderer.info.render.frame;cbSeenV=cbSeen();}if(!cbSeenV&&n.mode!=='flee'&&n.role!=='bounce'){n.g.visible=false;return;}
  if(cbCalm(n)&&!n.walkHome){cbRole(n,dt);return;}cbReset(n);return _cbPose.apply(this,arguments);};
function cbRole(n,dt){const g=n.g,t=game.time,b=cbBeat(),bp=b%1,beatK=Math.pow(1-bp,3),R=n.R;
  cbReset(n);g.rotation.set(0,0,0);
  const nod=Math.sin(b*Math.PI*2)*.08;
  if(n.role==='sit'){g.position.set(n.home.x,0,n.home.z);g.rotation.y=n.home.face;n.hip.position.y=R.seatY+.06;n.lL.rotation.x=n.lR.rotation.x=-1.45;n.kL.rotation.x=n.kR.rotation.x=1.45;
    n.lL.rotation.z=-.08;n.lR.rotation.z=.08;n.tor.rotation.x=.06;n.head.rotation.x=nod*.8;
    // every few seconds: cheer, clap, drink or toss cash
    const cyc=(t+n.t0)%9;
    if(cyc<1.6&&R.cash&&!R.bar){const k=cyc/1.6;n.aR.rotation.set(-2.2-Math.sin(k*Math.PI)*.6,0,-.2);n.eR.rotation.x=-.3;n.aL.rotation.set(-.4,0,.2);n.eL.rotation.x=-1.4;
      if(k>.45&&!n.tossed&&nearCam(g.position,40)){n.tossed=true;const c=n.aR.getWorldPosition(new V3());const to=new V3(n.x+Math.sin(n.home.face)*2.5,1.2,n.z+Math.cos(n.home.face)*2.5);cbCash(c,to);}}
    else if(cyc<3.2){n.tossed=false;const c=Math.sin(t*12);n.aL.rotation.set(-1.25,0,.45+c*.25);n.aR.rotation.set(-1.25,0,-.45-c*.25);n.eL.rotation.set(-1.1,0,0);n.eR.rotation.set(-1.1,0,0);}
    else if(cyc<4.4){n.aR.rotation.set(-1.9,0,-.25);n.eR.rotation.x=-2.3;n.aL.rotation.set(-.3,0,.12);n.eL.rotation.x=-1.2;n.head.rotation.x=-.25;}
    else if(cyc<5.4&&!R.bar){n.aL.rotation.set(-2.9+Math.sin(t*14)*.2,0,.3);n.aR.rotation.set(-2.9-Math.sin(t*14)*.2,0,-.3);n.eL.rotation.x=n.eR.rotation.x=-.3;}
    else{n.aL.rotation.set(-.35,0,.12);n.aR.rotation.set(-.35,0,-.12);n.eL.rotation.x=n.eR.rotation.x=-1.25;n.tor.rotation.z=Math.sin(b*Math.PI)*.05;}
    return;}
  if(n.role==='stand'){g.position.set(n.home.x,0,n.home.z);g.rotation.y=n.home.face;const sw=Math.sin(b*Math.PI);n.hip.rotation.z=sw*.06;n.tor.rotation.z=-sw*.05;n.head.rotation.x=nod;n.hip.position.y=.92-beatK*.03;
    n.kL.rotation.x=n.kR.rotation.x=beatK*.12;n.lL.rotation.x=n.lR.rotation.x=-beatK*.06;const cyc=(t+n.t0)%7;
    if(cyc<1.4){n.aR.rotation.set(-1.9,0,-.25);n.eR.rotation.x=-2.3;n.aL.rotation.set(-.2,0,.15);n.eL.rotation.x=-.5;n.head.rotation.x=-.25;}
    else if(cyc<2.6){n.aL.rotation.set(-2.8+sw*.3,0,.35);n.aR.rotation.set(-2.8-sw*.3,0,-.35);n.eL.rotation.x=n.eR.rotation.x=-.4;}
    else{n.aL.rotation.set(-.3+sw*.15,0,.15);n.aR.rotation.set(-.3-sw*.15,0,-.15);n.eL.rotation.x=n.eR.rotation.x=-1.1;}
    return;}
  if(n.role==='bar'){const A=n.area[0],span=(A[1]-A[0])/2,cx=(A[0]+A[1])/2,cyc=(t+n.t0)%12;let x=n.home.x,walking=false;
    // walk to a spot, shake a drink, wipe the counter, walk on
    if(cyc<2.5){x=cx+Math.sin((t+n.t0)*.13)*span;walking=true;}else x=n.lastX!=null?n.lastX:x;n.lastX=x;
    if(walking){const k=(t*2.2)%1;g.position.set(x,Math.abs(Math.sin(t*6.6))*.02,n.home.z);g.rotation.y=Math.PI+(Math.cos((t+n.t0)*.13)>0?-1.3:1.3);n.lL.rotation.x=Math.sin(t*6.6)*.5;n.lR.rotation.x=-Math.sin(t*6.6)*.5;
      n.aL.rotation.x=-Math.sin(t*6.6)*.35;n.aR.rotation.x=Math.sin(t*6.6)*.35;n.kL.rotation.x=Math.max(0,Math.sin(t*6.6+1))*.5;n.kR.rotation.x=Math.max(0,-Math.sin(t*6.6+1))*.5;n.x=x;return;}
    g.position.set(x,0,n.home.z);g.rotation.y=Math.PI;n.x=x;
    if(cyc<6.5){const s=Math.sin(t*22)*.18;n.aR.rotation.set(-2.6+s,0,-.1);n.aL.rotation.set(-2.6+s,0,.1);n.eR.rotation.x=n.eL.rotation.x=-1.2;n.head.rotation.x=-.1;}
    else{const c=t*5;n.aR.rotation.set(-1.1+Math.sin(c)*.15,0,-.3+Math.cos(c)*.25);n.eR.rotation.x=-.5;n.aL.rotation.set(-.4,0,.15);n.eL.rotation.x=-1.4;n.tor.rotation.x=.3;n.head.rotation.x=.25;}
    return;}
  if(n.role==='dj'){g.position.set(n.home.x,n.home.y,n.home.z);g.rotation.y=n.home.face;n.head.rotation.x=nod*2;n.hip.position.y=.92-beatK*.04;n.kL.rotation.x=n.kR.rotation.x=beatK*.15;n.lL.rotation.x=n.lR.rotation.x=-beatK*.08;
    const cyc=(t+n.t0)%10;n.aL.rotation.set(-2.6,0,.6);n.eL.rotation.x=-2.2;n.head.rotation.z=.12;
    if(cyc<1.2){n.aR.rotation.set(-3,0,-.2);n.eR.rotation.x=-.2+Math.sin(t*16)*.2;}
    else{n.aR.rotation.set(-.95,Math.sin(t*9)*.25,-.15);n.eR.rotation.x=-1.25+Math.sin(t*9)*.25;n.tor.rotation.x=.18;}
    return;}
  if(n.role==='bounce'){g.position.set(n.home.x,0,n.home.z);g.rotation.y=n.home.face;n.aL.rotation.set(-1.1,0,.55);n.aR.rotation.set(-1.1,0,-.55);n.eL.rotation.set(-2.2,.6,0);n.eR.rotation.set(-2.2,-.6,0);
    n.head.rotation.y=Math.sin((t+n.t0)*.4)*.55;n.hip.rotation.z=Math.sin((t+n.t0)*.25)*.04;n.lL.rotation.z=-.06;n.lR.rotation.z=.06;return;}
  if(n.role==='dance')cbDance(n,dt,b,beatK);}
/* ---------- the pole routines ---------- */
const CB_PH=[['circle',7],['spin',4.5],['floor',6],['climb',6],['circle',5],['floor',5]];
function cbDance(n,dt,b,beatK){const R=n.R,[px,pz]=R.pole,SY=CLUB_INFO[0].SY,t=game.time+n.t0;const tot=CB_PH.reduce((a,p)=>a+p[1],0)+(R.runway?14:0);
  let u=t%tot,ph=null,k=0;if(R.runway&&u>=tot-14){ph='runway';k=(u-(tot-14))/14;}else{for(const p of CB_PH){if(u<p[1]){ph=p[0];k=u/p[1];break;}u-=p[1];}}
  const g=n.g,sw=Math.sin(b*Math.PI);
  if(ph==='circle'){// walk round the pole, inner hand on it, outer arm out
    const a=t*.9,r=.52,x=px+Math.cos(a)*r,z=pz+Math.sin(a)*r;g.position.set(x,SY,z);g.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a))+Math.PI/2;
    const st=Math.sin(t*5.4);n.lL.rotation.x=st*.55-.1;n.lR.rotation.x=-st*.55-.1;n.kL.rotation.x=Math.max(0,st)*.9;n.kR.rotation.x=Math.max(0,-st)*.9;
    n.aL.rotation.set(-2.5,0,-.35);n.eL.rotation.x=-.25;n.aR.rotation.set(-.8+Math.sin(t*1.7)*.4,0,-1.1);n.eR.rotation.x=-.3;n.hip.rotation.z=st*.1;n.tor.rotation.z=-st*.06;n.head.rotation.y=.3;n.x=x;n.z=z;return;}
  if(ph==='spin'){// both hands high on the pole, knees tucked, spiralling down
    const a=t*3.1,r=.38,x=px+Math.cos(a)*r,z=pz+Math.sin(a)*r,h=Math.max(0,.75*(1-k*1.3));g.position.set(x,SY+h,z);g.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a))+Math.PI/2;
    n.aL.rotation.set(-2.85,0,-.55);n.aR.rotation.set(-2.55,0,-.75);n.eL.rotation.x=-.15;n.eR.rotation.x=-.35;n.tor.rotation.set(.1,0,.35);n.hip.rotation.z=.15;
    n.lL.rotation.set(-1.35,0,-.15);n.lR.rotation.set(-.55,0,.1);n.kL.rotation.x=1.9;n.kR.rotation.x=1.2;n.head.rotation.set(-.2,0,.25);n.x=x;n.z=z;return;}
  if(ph==='climb'){// climb, hold an extended pose, slide down
    const up=k<.35?k/.35:k<.7?1:1-(k-.7)/.3,h=1.45*Math.min(1,up),x=px-.28,z=pz;g.position.set(x,SY+h,z);g.rotation.y=Math.PI/2;
    if(k<.35){const c=Math.sin(t*7);n.aL.rotation.set(-2.9+c*.25,0,-.1);n.aR.rotation.set(-2.9-c*.25,0,.1);n.eL.rotation.x=-.4-c*.3;n.eR.rotation.x=-.4+c*.3;n.lL.rotation.set(-1+c*.3,0,0);n.lR.rotation.set(-.6-c*.3,0,0);n.kL.rotation.x=1.3;n.kR.rotation.x=1.1;}
    else if(k<.7){n.aL.rotation.set(-2.95,0,-.15);n.eL.rotation.x=-.1;n.aR.rotation.set(-1.6,0,-1.5);n.eR.rotation.x=0;n.tor.rotation.x=-.45;n.head.rotation.x=-.35;
      n.lL.rotation.set(-.9,0,0);n.kL.rotation.x=1.6;n.lR.rotation.set(-1.4,0,.25);n.kR.rotation.x=.05;}
    else{n.aL.rotation.set(-2.9,0,-.1);n.aR.rotation.set(-2.7,0,.05);n.eL.rotation.x=n.eR.rotation.x=-.2;n.lL.rotation.set(-.3,0,0);n.lR.rotation.set(-.2,0,0);n.kL.rotation.x=.4;n.kR.rotation.x=.2;n.tor.rotation.x=-.15;}
    n.x=x;n.z=z;return;}
  if(ph==='runway'){// strut out to the podium, pose, strut back
    const C=CLUB_INFO[0],x0=C.runway[1]-1,x1=C.px+1.2,go=k<.42?k/.42:k<.58?1:1-(k-.58)/.42,x=lerp(x0,x1,go),z=(C.runway[2]+C.runway[3])/2,moving=k<.42||k>.58;
    const back=k>.58;g.position.set(x,SY,z);g.rotation.y=back?Math.PI/2:-Math.PI/2;
    if(moving){const s=Math.sin(t*6);n.lL.rotation.set(s*.45,0,.06);n.lR.rotation.set(-s*.45,0,-.06);n.kL.rotation.x=Math.max(0,-s)*.6;n.kR.rotation.x=Math.max(0,s)*.6;n.hip.rotation.z=s*.12;n.hip.rotation.y=s*.08;n.tor.rotation.z=-s*.06;
      n.aR.rotation.set(-.2,0,-.35);n.eR.rotation.x=-1.6;n.aL.rotation.set(s*.35,0,.12);n.eL.rotation.x=-.3;}
    else{n.aL.rotation.set(-2.9,0,.2);n.eL.rotation.x=-1.4;n.aR.rotation.set(-.25,0,-.4);n.eR.rotation.x=-1.6;n.hip.rotation.z=.18;n.lL.rotation.z=.25;n.head.rotation.set(-.1,.4,0);}
    n.x=x;n.z=z;return;}
  // floor: dance next to the pole, arms flowing, hips on the beat
  const x=px-.75,z=pz+Math.sin(t*.5)*.3;g.position.set(x,SY,z);g.rotation.y=Math.PI/2+Math.sin(t*.7)*.5;
  n.hip.rotation.z=sw*.16;n.hip.position.y=.92-beatK*.05;n.tor.rotation.z=-sw*.1;n.tor.rotation.y=Math.sin(b*Math.PI*.5)*.25;
  n.kL.rotation.x=beatK*.25+(sw>0?.2:0);n.kR.rotation.x=beatK*.25+(sw<0?.2:0);n.lL.rotation.x=-n.kL.rotation.x*.5;n.lR.rotation.x=-n.kR.rotation.x*.5;
  const f=Math.sin(t*1.9);n.aL.rotation.set(-2.6+f*.35,0,.25+f*.2);n.aR.rotation.set(-2.4-f*.35,0,-.25+f*.2);n.eL.rotation.x=-.7-f*.4;n.eR.rotation.x=-.7+f*.4;n.head.rotation.set(-.1+Math.max(0,Math.sin(t*1.1))*.2,0,sw*.2);n.x=x;n.z=z;}
/* cash thrown at the stage: little green bills that flutter down */
const CB_CASH=[],CB_BILL=new THREE.MeshBasicMaterial({color:0x5ac86a,side:THREE.DoubleSide}),CB_BILLG=new THREE.PlaneGeometry(.15,.07);
function cbCash(from,to){for(let i=0;i<6;i++){const m=new THREE.Mesh(CB_BILLG,CB_BILL);m.position.copy(from);scene.add(m);const v=to.clone().sub(from).multiplyScalar(rand(.9,1.4));v.y+=rand(2,3.5);CB_CASH.push({m,v,w:new V3(rand(-9,9),rand(-9,9),rand(-9,9)),t:0});}
  if(CB_CASH.length>80){const o=CB_CASH.shift();scene.remove(o.m);}}

/* ---------- the light show ---------- */
function cbFX(){if(CB.fx||!CLUB_INFO.length)return CB.fx;const C=CLUB_INFO[0],G=new THREE.Group();scene.add(G);
  const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,2),new THREE.MeshStandardMaterial({color:0xe8e8f0,metalness:1,roughness:.12,flatShading:true,envMapIntensity:2,emissive:0x302838}));
  ball.position.set(C.x+2.5,C.H-1.5,C.z);G.add(ball);const chain=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.05,4),new THREE.MeshBasicMaterial({color:0x888888}));chain.position.set(C.x+2.5,C.H-.98,C.z);G.add(chain);
  const beams=[],cols=[0xff3ad0,0x3ae8ff,0x9a4aff,0xffd23f];
  [[C.x+7.7,C.z-4],[C.x+7.7,C.z+4],[C.x+2,C.z],[C.x-3,C.z]].forEach(([x,z],i)=>{const L=7.2,geo=new THREE.CylinderGeometry(.06,.9,L,18,1,true);geo.translate(0,-L/2,0);
    const m=new THREE.Mesh(geo,addMat(cols[i],.55,.16));m.position.set(x,C.H-1.2,z);G.add(m);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(.85,24),addMat(cols[i],.9,.35));pool.rotation.x=-Math.PI/2;G.add(pool);
    const can=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.3,10),new THREE.MeshStandardMaterial({color:0x14141a,metalness:.6,roughness:.4}));can.position.set(x,C.H-1.1,z);G.add(can);
    beams.push({m,pool,i,col:cols[i],x,z});});
  CB.fx={G,ball,beams};return CB.fx;}
const _cbDir=new V3(),_cbQ=new THREE.Quaternion(),_cbDown=new V3(0,-1,0);
function cbFXTick(dt){const C=CLUB_INFO[0];if(!C)return;const F=cbFX(),t=game.time,b=cbBeat();
  const vis=inMatch()&&world.visible&&nearCam(new V3(C.x,4,C.z),60);F.G.visible=vis;if(!vis)return;
  F.ball.rotation.y+=dt*.6;
  const targets=[[C.stage[0],C.stage[1],C.stage[2],C.stage[3]],[C.stage[0],C.stage[1],C.stage[2],C.stage[3]],[C.runway[0],C.runway[1],C.runway[2],C.runway[3]],[C.px-1.6,C.px+1.6,C.z-1.6,C.z+1.6]];
  const flash=!SET.calm&&(Math.floor(b)%16===0)&&(b%1)<.12;
  F.beams.forEach(B=>{const T=targets[B.i],ph=t*(.35+B.i*.07)+B.i*1.7;const tx=lerp(T[0],T[1],.5+.5*Math.sin(ph)),tz=lerp(T[2],T[3],.5+.5*Math.sin(ph*1.31+1)),ty=C.SY+.02;
    _cbDir.set(tx-B.x,ty-(C.H-1.2),tz-B.z);const L=_cbDir.length();_cbDir.normalize();_cbQ.setFromUnitVectors(_cbDown,_cbDir);B.m.quaternion.copy(_cbQ);B.m.scale.set(1,L/7.2,1);
    B.pool.position.set(tx,ty,tz);const ci=(Math.floor(b/4)+B.i)%4,col=[0xff3ad0,0x3ae8ff,0x9a4aff,0xffd23f][ci];B.m.material.color.setHex(flash?0xffffff:col).multiplyScalar(flash?1.2:.55);B.pool.material.color.setHex(flash?0xffffff:col).multiplyScalar(.9);
    B.pool.material.opacity=.25+.2*Math.pow(1-(b%1),2);});
  for(let i=CB_CASH.length-1;i>=0;i--){const c=CB_CASH[i];c.t+=dt;if(c.t>6){scene.remove(c.m);CB_CASH.splice(i,1);continue;}c.v.y-=6*dt;c.v.multiplyScalar(1-1.6*dt);c.m.position.addScaledVector(c.v,dt);
    c.m.rotation.x+=c.w.x*dt;c.m.rotation.y+=c.w.y*dt;const fl=floorAt(c.m.position.x,c.m.position.z,c.m.position.y+.3)+.03;if(c.m.position.y<fl){c.m.position.y=fl;c.v.set(0,0,0);c.w.set(0,0,0);c.m.rotation.x=-Math.PI/2;}}}

/* ---------- the music: a 124 BPM club track, muffled from outside ---------- */
function cbAudio(){if(CB.bus||!AU.ctx)return CB.bus;const c=AU.ctx;CB.bus=c.createGain();CB.lp=c.createBiquadFilter();CB.lp.type='lowpass';CB.lp.frequency.value=400;CB.out=c.createGain();CB.out.gain.value=0;
  CB.bus.connect(CB.lp);CB.lp.connect(CB.out);CB.out.connect(AU.master);return CB.bus;}
const CB_PROG=[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]];   // Am F C G
const mtofC=n=>440*Math.pow(2,(n-69)/12);
function cbMusicTick(){const C=CLUB_INFO[0];if(!C||!AU.ctx||!AU.on||!ME||!inMatch()||paused){if(CB.out&&AU.ctx)CB.out.gain.setTargetAtTime(0,AU.ctx.currentTime,.2);CB.inside=0;return;}
  const p=camera.position,inside=p.x>C.x0&&p.x<C.x1&&p.z>C.z0&&p.z<C.z1&&p.y<C.H&&p.y>-.5?1:0,d=inside?0:Math.max(0,Math.hypot(Math.max(C.x0-p.x,0,p.x-C.x1),Math.max(C.z0-p.z,0,p.z-C.z1)));
  const vol=(SET.music/70)*(inside?.55:Math.max(0,.3*(1-d/45)));const bus=cbAudio();if(!bus)return;const c=AU.ctx,now=c.currentTime;
  CB.out.gain.setTargetAtTime(vol,now,.25);CB.lp.frequency.setTargetAtTime(inside?16000:Math.max(180,520-d*8),now,.25);
  if(inside!==CB.inside){CB.inside=inside;if(AU.mus)AU.mus.gain.setTargetAtTime(.2*SET.music/70*(inside?.25:1),now,.4);}
  if(vol<.004){CB.next=0;return;}
  const s16=60/CB_BPM/4;if(!CB.next||CB.next<now)CB.next=now+.05;
  while(CB.next<now+.22){const st=CB.step++%64,dl=CB.next-now,bar=Math.floor(st/16)%4,ch=CB_PROG[bar],i16=st%16;
    if(i16%4===0)AU.tone('sine',140,42,.24,.9,dl,bus);
    if(i16===4||i16===12){AU.noise(.16,.45,'bandpass',1800,1300,1.1,dl,bus);AU.noise(.08,.25,'highpass',3000,3500,1,dl+.01,bus);}
    if(i16%4===2)AU.noise(.05,.2,'highpass',7500,9000,1,dl,bus);else if(i16%2===1)AU.noise(.03,.07,'highpass',9000,9500,1,dl,bus);
    if(i16%4===2||i16===15){const f=mtofC(ch[0]-12);AU.tone('sawtooth',f,f*.98,.16,.22,dl,bus);AU.tone('square',f*.5,f*.5,.14,.1,dl,bus);}
    if(i16===6||i16===14)ch.slice(1).forEach(m=>AU.tone('triangle',mtofC(m+12),mtofC(m+12),.12,.05,dl,bus));
    if(st%32===0)ch.forEach(m=>AU.tone('sawtooth',mtofC(m),mtofC(m),1.8,.025,dl,bus));
    CB.next+=s16;}}
onEv('frame',dt=>{if(!CLUB_INFO.length)return;try{cbFXTick(dt);cbMusicTick();}catch(e){console.warn('club',e);}});
onEv('matchEnd',()=>{if(CB.out&&AU.ctx)CB.out.gain.setTargetAtTime(0,AU.ctx.currentTime,.1);if(CB.inside&&AU.mus&&AU.ctx){CB.inside=0;AU.mus.gain.setTargetAtTime(.2*SET.music/70,AU.ctx.currentTime,.3);}
  CB_CASH.forEach(c=>scene.remove(c.m));CB_CASH.length=0;});
