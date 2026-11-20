/* Hits, damage, specials and ultimates */
/* ================= COMBAT ================= */
function wallHit(f){shake(.5,f.pos);dust(f.pos,12,1);AU.hit(.8);
  burst(ADD,TMP.set(f.pos.x,f.pos.y+1,f.pos.z),30,{colors:[0x7fe3ff,0xffffff],speed:8,life:.4,size:.3,drag:3,bright:2.5});
  walls.forEach(w=>{if(Math.abs(w.position.x-f.pos.x)<3||Math.abs(w.position.z-f.pos.z)<3)w.material.opacity=1;});}
function shatterFrame(f,hard){const c=f.chest(new V3());
  burst(ADD,c,hard?50:25,{colors:[0xe8fffb,0x3fe0c5,0xffffff],speed:hard?9:5,life:.5,size:.22,size1:0,grav:8,bright:2.4,rad:.8});
  debris(c,hard?6:3,3,6,.12);const sc=AU.scale;AU.scale=sndAt(c);AU.glass();AU.scale=sc;f.rig.frame.visible=false;if(f.state==='framed')f.set(f.onGround?'idle':'air');}
let comboT=0;function showCombo(n){$('cn').textContent=n;$('combo').style.opacity=1;comboT=1.4;}
let hitStopT=0;function hitStop(s){if(NET.role==='client')s*=.6;hitStopT=Math.max(hitStopT,s);}

// every hit in the game deals this share of its listed damage
const DMG_SCALE=.7;
function applyHit(att,def,o){o=Object.assign({},o);o.dmg=(o.dmg||0)*DMG_SCALE*(def.take||1);
  if(def.dead||ally(att,def))return false;
  if(def.invuln>0&&!o.hold&&!o.keepFrame)return false;
  const dir=new V3(def.pos.x-att.pos.x,0,def.pos.z-att.pos.z);if(dir.lengthSq()<.0001)att.fwd(dir);dir.normalize();
  def.lastHitBy=att;def.lastHitT=game.time;
  if(def.downed){def.bleed-=o.dmg*att.hero.pow*2.2;def.flash=1;hitSpark(o.pt,att.hero.color,false);const s0=AU.scale;AU.scale=sndAt(o.pt);AU.hit(.7);AU.scale=s0;
    if(def.bleed<=0&&NET.role!=='client')killFighter(def,att,dir);return true;}
  const sc=AU.scale;AU.scale=sndAt(o.pt);
  const local=att===ME||def===ME;
  const facing=def.fwd(TMP2).dot(dir)<-.3;
  if(def.parryT>0&&facing&&att.pos.distanceTo(def.pos)<4.5&&!att.dead){def.parryT=0;const c=def.chest(new V3());slashFX(c,0xff6060,2.6);slashFX(c,0xffffff,1.8);ring(c,0xffffff,2.4,.3,false,2.6);def.invuln=.4;
    def.face=Math.atan2(att.pos.x-def.pos.x,att.pos.z-def.pos.z);if(def===ME)announceSmall('PARRY!');AU.block();AU.scale=sc;applyHit(def,att,{dmg:12,kb:12,up:9,launch:true,heavy:true,pt:att.chest(new V3())});return 'block';}
  if(o.gb&&(def.state==='block'||def.state==='bstun')&&facing){ring(o.pt,0xffd23f,2.6,.3,false,2.6);burst(ADD,o.pt,30,{colors:[0xffd23f,0xffffff],speed:10,life:.35,size:.25,bright:2.6});AU.glass();if(def===ME||att===ME)announceSmall('GUARD BREAK');}
  const guardF=def.fwd(TMP2).dot(dir)<.15;
  // blocking stops ALL damage, except guard breakers, ultimate moves and heavy attacks, which go straight through
  const pierce=!o.gb&&(def.state==='block'||def.state==='bstun')&&guardF&&!o.frame&&(att.state==='ult'||o.ult||(att.state==='attack'&&MOVES[att.moveName]&&MOVES[att.moveName].heavy));
  if(pierce){ring(o.pt,att.state==='ult'?0xffd23f:0xff7a3a,2.4,.28,false,2.4);if(def===ME||att===ME)announceSmall(att.state==='ult'?'UNBLOCKABLE':'GUARD PIERCED');def.set('hit');}
  if((def.state==='block'||def.state==='bstun')&&guardF&&!o.frame&&!o.gb&&!pierce){
    def.vel.addScaledVector(dir,(o.kb||3)*.5+1.5);def.set('bstun');def.meter=Math.min(100,def.meter+4);att.meter=Math.min(100,att.meter+2);
    blockSpark(o.pt);AU.block();if(local)hitStop(.05);shake(.12,o.pt);AU.scale=sc;return 'block';
  }
  let mult=1;if(def.state==='framed'&&!o.keepFrame){mult=1.35;shatterFrame(def,true);}
  const scale=Math.max(.35,1-def.combo*.07);let dmg=o.dmg*scale*att.hero.pow*mult;if(att.armorT>0)dmg*=1.4;if(att.state==='ult'&&att.ultPow>1)dmg*=att.ultPow;if(att.powT>0)dmg*=1.25;if(att.vowT>0)dmg*=1.6;if(def.fieldT>0)dmg*=.5;
  if(KIT(att.hero,'elem')==='hex'&&!o.noSpark){def.marks=(def.marks||0)+(o.mark||1);def.markT=6;if(def.marks>=3){def.marks=0;dmg+=9*att.hero.pow;o=Object.assign({},o,{launch:true,kb:9,up:11,heavy:true});
    for(let k=0;k<3;k++)slashFX(def.chest(new V3()),0x5aff8a,2.4);ring(def.chest(TMP2),0x5aff8a,2.6,.35,false,2.4);const s1=AU.scale;AU.scale=sndAt(def.pos);SND.curse.hit(1.4);AU.scale=s1;}}const armored=def.armorT>0;if(armored)dmg*=.45;
  def.hp-=dmg;emitEv('hit',att,def,dmg,o);def.combo++;if(!def.dead)def.brk=Math.min(100,(def.brk||0)+dmg*BRK_PER_DMG);if(game.practice)practiceHit(att,def,dmg,o.pt);def.flash=1;def.bounce=0;
  att.meter=Math.min(100,att.meter+dmg*1.3);def.meter=Math.min(100,def.meter+dmg*.7);
  impactFX(att,o.pt,!!(o.heavy||(o.noSpark&&!o.cut)),o.noSpark);
  if(KIT(att.hero,'elem')==='scathe'&&!o.cut&&!o.noSpark)CUTS.push({att,def,t:game.time+.32});
  if(o.shock){ring(TMP2.set(def.pos.x,.2,def.pos.z),0xcfe4ff,4,.35,true,2.4);ring(o.pt,0xffffff,3.2,.3,false,2.4);burst(ADD,o.pt,40,{colors:[0xcfe4ff,0xffffff],speed:14,life:.35,size:.25,bright:2,flat:true});dust(def.pos,10,1.4);}
  if(armored){burst(ADD,o.pt,14,{colors:[0xffc08a,0xffffff],speed:9,life:.25,size:.18,bright:2.5});AU.block();}
  if(KIT(att.hero,'elem')==='entropy'){def.decay=Math.min(5,def.decay+(o.heavy?2:1));def.decayT=4;burst(SMK,o.pt,10,{colors:[0x8a8290,0x5a5560],speed:3,life:.8,size:.25,size1:.06,grav:4});}
  sfx(att,'hit',o.heavy?1.4:.9);if(local)hitStop(o.heavy?.1:.05);shake(o.heavy?.55:.18,o.pt);
  if(att===ME&&def.combo>=2)showCombo(def.combo);
  AU.scale=sc;
  if(def.hp<=0){if(NET.role==='client'){def.hp=1;}else{def.hp=0;killFighter(def,att,dir);return true;}}
  if(o.keepFrame){def.flash=1;return true;}
  if(armored&&!o.float){def.vel.addScaledVector(dir,.6);return true;}
  if(o.float){def.set('float');def.floatT=o.float;def.floatDrop=o.drop||6;def.vel.set(0,3.2,0);def.onGround=false;def.pos.y+=.15;ring(def.chest(TMP2),0xb58cff,2.2,.35,false,2.2);return true;}
  if(o.frame){def.set('framed');def.framedT=o.frame;def.vel.set(0,0,0);def.rig.frame.visible=true;
    const s2=AU.scale;AU.scale=sndAt(o.pt);AU.shutter(2);AU.scale=s2;ring(def.chest(TMP2),0x3fe0c5,2,.3,false,2.4);return true;}
  if(o.hold){def.set('hit');def.stunT=o.stun;def.vel.set(0,Math.max(0,def.vel.y*.2),0);return true;}
  if(o.launch||def.state==='fly'||!def.onGround){const wasFly=def.state==='fly';def.set('fly');def.onGround=false;def.pos.y+=.05;def.vel.copy(dir).multiplyScalar(o.kb);def.vel.y=Math.max(o.up,wasFly?6:o.up);if(!o.launch)def.vel.y=Math.max(def.vel.y,6);}
  else{def.set('hit');def.stunT=o.stun;def.vel.addScaledVector(dir,o.kb);}
  return true;
}
function downFighter(def,att){
  def.downed=true;def.bleed=100;def.revT=0;def.hp=1;def.combo=0;def.armorT=0;def.rig.frame.visible=false;def.set('downed');def.vel.set(0,Math.min(def.vel.y,0),0);
  if(att)def.lastHitBy=att;if(def.rig.whip)def.rig.whip.group.visible=false;if(def.rig.beam)def.rig.beam.group.visible=false;
  game.onDowned(def,att);
}
function killFighter(def,att,dir){
  if(game.practice){def.hp=100;def.flash=1;ring(def.chest(new V3()),0xff8a1a,2.6,.4,false,2.4);return;}
  if(game.mode==='duos'&&game.rules!=='arena'&&game.rules!=='raid'&&!def.downed&&mates(def).some(m=>!m.dead&&!m.downed)){downFighter(def,att);return;}
  def.downed=false;def.dead=true;def.hp=0;emitEv('kill',def,att);def.rig.frame.visible=false;def.set('fly');def.onGround=false;def.pos.y+=.05;
  if(dir){def.vel.copy(dir).multiplyScalar(14);def.vel.y=11;}else{def.vel.set(0,8,0);}
  if(def.rig.whip)def.rig.whip.group.visible=false;if(def.rig.beam)def.rig.beam.group.visible=false;
  dultOpen(def,att);game.onElim(def,att);
}

/* ---- projectiles ---- */
const projs=[];
function spawnProj(f,type,ang,opt){
  opt=opt||{};const fw=opt.dir?opt.dir.clone():f.fwd();if(ang)fw.applyAxisAngle(UP,ang);const p={owner:f,type,t:0,hits:0,hitCD:0,dead:false,hitSet:{}};
  const st=opt.pos?opt.pos.clone():f.chest(new V3()).addScaledVector(fw,.9);p.pos=st;p.dir=new V3(fw.x,0,fw.z).normalize();
  const g=new THREE.Group();const sc=AU.scale;AU.scale=sndAt(st);
  if(type==='fireball'){p.vel=fw.clone().multiplyScalar(25);p.r=.55;p.life=1.8;p.dmg=9;p.kb=9;p.up=5;p.launch=true;
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.42,4),addMat(0xff5a1f,2.2,.9)),new THREE.Mesh(new THREE.SphereGeometry(.24,32,24),addMat(0xffffff,3)),new THREE.Mesh(new THREE.TorusGeometry(.5,.03,8,48),addMat(0xffb347,2.4,.8)));}
  if(type==='feather'){const sp=opt.speed||36;p.vel=fw.clone().multiplyScalar(sp);p.r=.45;p.life=1.1;p.dmg=4;p.kb=3;p.up=0;p.stun=.4;p.air=true;
    const fgeo=cg('pfeather',()=>{const q=new THREE.ConeGeometry(.08,.95,12);q.rotateX(Math.PI/2);q.scale(1,.25,1);return q;});
    g.add(new THREE.Mesh(fgeo,new THREE.MeshPhysicalMaterial({color:0xffe0ea,emissive:0xff4f8b,emissiveIntensity:1.6,clearcoat:1,roughness:.2})));
    const gl=new THREE.Mesh(cg('pfglow',()=>{const q=new THREE.CylinderGeometry(.015,.015,.9,8);q.rotateX(Math.PI/2);return q;}),addMat(0xff4f8b,2.6));g.add(gl);
    }
  if(type==='airburst'){p.vel=fw.clone().multiplyScalar(30);p.r=1.9;p.life=.6;p.dmg=9;p.kb=16;p.up=5;p.launch=true;p.pierce=true;p.pos.y=1.2;
    for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(.8+k*.35,.05,12,64),addMat(0xcfe4ff,1.6,.7));r.position.z=-k*.6;g.add(r);}
    }
  if(type==='slashwave'){p.vel=fw.clone().multiplyScalar(30);p.r=.9;p.life=.45;p.dmg=4;p.kb=3;p.up=0;p.stun=.35;p.pierce=true;
    const m=new THREE.Mesh(new THREE.TorusGeometry(.9,.04,8,48,Math.PI*.8),addMat(0xff6060,2.4));m.rotation.set(Math.PI/2,0,Math.PI*.1);g.add(m);
    const m2=new THREE.Mesh(new THREE.TorusGeometry(.85,.015,6,48,Math.PI*.8),addMat(0xffffff,2.6));m2.rotation.copy(m.rotation);g.add(m2);}
  if(type==='sigil'){p.vel=fw.clone().multiplyScalar(22);p.r=.7;p.life=1.4;p.dmg=5;p.kb=2;p.up=0;p.stun=.6;p.mark=2;
    g.add(new THREE.Mesh(new THREE.TorusGeometry(.55,.03,8,64),addMat(0x5aff8a,2.4)));g.add(new THREE.Mesh(new THREE.TorusGeometry(.38,.02,6,6),addMat(0xd8ffe0,2.6)));
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2;const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,.02),addMat(0x5aff8a,2.4));b.position.set(Math.cos(a)*.47,Math.sin(a)*.47,0);b.rotation.z=a+.5;g.add(b);}
    }
  if(type==='bubble'){p.vel=fw.clone().multiplyScalar(19);p.r=.65;p.life=1.7;p.dmg=5;p.kb=0;p.up=0;p.float=1.8;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.5,40,30),addMat(0xb58cff,1,.35)),new THREE.Mesh(new THREE.SphereGeometry(.22,24,18),addMat(0xf2e8ff,2.6)));
    const r1=new THREE.Mesh(new THREE.TorusGeometry(.62,.02,8,64),addMat(0xf2e8ff,2.2));const r2=r1.clone();r2.rotation.x=Math.PI/2;g.add(r1,r2);
    }
  if(type==='meteor'){p.vel=fw.clone().multiplyScalar(opt.speed||34);p.r=1;p.life=3;p.meteor=true;p.air=true;
    const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(.6,1),new THREE.MeshStandardMaterial({color:0x6a5a4a,roughness:.9,flatShading:true,emissive:0x5a1a00,emissiveIntensity:.8}));g.add(rk);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.85,24,18),addMat(0xff8a3a,1.2,.45)));}
  if(type==='blade'){p.vel=fw.clone().multiplyScalar(32);p.r=.9;p.life=1.1;p.dmg=8;p.kb=6;p.up=2;p.stun=.5;
    const m=new THREE.Mesh(new THREE.TorusGeometry(1,.07,8,40,Math.PI),addMat(0x1fb8ff,2.6));m.rotation.x=Math.PI/2;m.rotation.y=.25;g.add(m);
    const m2=new THREE.Mesh(new THREE.TorusGeometry(.85,.035,6,40,Math.PI),addMat(0xffffff,3));m2.rotation.x=Math.PI/2;m2.rotation.y=.25;g.add(m2);}
  if(type==='cyclone'){p.vel=fw.clone().multiplyScalar(12);p.r=1.1;p.life=2;p.dmg=3;p.multi=4;p.pos.y=.1;
    for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(.35+i*.28,.04,6,32),addMat(0xb57bff,2.2,.8));m.rotation.x=Math.PI/2;m.position.y=.3+i*.65;g.add(m);}}
  if(type==='fault'){p.vel=fw.clone().multiplyScalar(20);p.r=1;p.life=1.2;p.dmg=10;p.kb=3;p.up=13;p.launch=true;p.pos.y=0;p.lastSp=0;p.ground=true;}
  if(type==='erode'){p.vel=fw.clone().multiplyScalar(16);p.r=1.3;p.life=1.4;p.dmg=8;p.kb=4;p.up=10;p.launch=true;p.pos.y=0;p.lastSp=0;p.ground=true;
    }
  if(type==='siphon'){p.vel=fw.clone().multiplyScalar(28);p.r=.5;p.life=1.2;p.dmg=5;p.kb=3;p.up=0;p.stun=.5;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.26,16,12),new THREE.MeshBasicMaterial({color:0x05000a})),new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),addMat(0x8a3cff,2,.55)),new THREE.Mesh(new THREE.TorusGeometry(.55,.03,6,32),addMat(0xe0c8ff,2.5)));
    }
  if(type==='wave'){p.vel=fw.clone().multiplyScalar(20);p.r=2.2;p.life=2.4;p.dmg=24;p.kb=13;p.up=11;p.launch=true;p.pos.copy(f.pos).addScaledVector(fw,1.5);p.pos.y=0;p.big=true;
    const geo=new THREE.PlaneGeometry(11,4.5,24,10);const pa=geo.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i),v=(y+2.25)/4.5;pa.setZ(i,v*v*2.2-Math.abs(pa.getX(i))*.12);pa.setY(i,y+2.25);}geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo,addMat(0x1fb8ff,1.6,.55)));const m2=new THREE.Mesh(geo,addMat(0x9af0ff,1.2,.35));m2.scale.set(.96,.9,.9);m2.position.z=-.4;g.add(m2);}
  if(!p.vel){p.vel=fw.clone().multiplyScalar(24);p.r=p.r||.6;p.life=p.life||1;p.dmg=p.dmg||8;p.kb=p.kb||4;p.up=p.up||0;}  // unknown type: fly straight
  if(!opt.quiet&&f.state!=='special'){const q=specSnd(type);if(q&&q.spec)q.spec(f);}
  AU.scale=sc;
  g.position.copy(p.pos);if(opt.dir&&(type==='feather'||type==='meteor'))g.quaternion.setFromUnitVectors(new V3(0,0,1),p.vel.clone().normalize());else g.rotation.y=Math.atan2(fw.x,fw.z);scene.add(g);p.mesh=g;projs.push(p);
}
function steal(f,o){
  const S=STEALABLE;let s=o.hero.special;if(S.indexOf(s)<0)s=pick(S);
  f.stolen=s;f.stolenT=12;f.specCD=0;o.specCD=Math.max(o.specCD,5);o.bladeT=0;o.stolenT=0;o.armorT=0;
  const a=o.chest(new V3()),b=f.chest(new V3());
  for(let k=0;k<50;k++){const p=a.clone().add(new V3(rand(-.4,.4),rand(-.5,.5),rand(-.4,.4)));const v=b.clone().sub(p).multiplyScalar(rand(1.8,2.6));
    ADD.spawn(p.x,p.y,p.z,v.x,v.y,v.z,..._rgb(pick([o.hero.color,0x8a3cff,0xe0c8ff]),2.2),.45,.3,.05,0,0);}
  ring(b,0x8a3cff,2.2,.35,false,2.5);const sc=AU.scale;AU.scale=sndAt(b);AU.tone('sawtooth',900,110,.5,.16);AU.tone('sine',220,880,.4,.12,.1);AU.scale=sc;
  if(f===ME)announceSmall('POWER STOLEN: '+SPNAME[s]);else if(o===ME)announceSmall('YOUR POWER WAS SEALED');
}
function updateProjs(dt){
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.t+=dt;const own=p.owner;AU.scale=sndAt(p.pos);
    p.pos.addScaledVector(p.vel,dt);p.mesh.position.copy(p.pos);
    if(p.type==='fireball'){p.mesh.children[0].scale.setScalar(1+Math.sin(p.t*40)*.12);
      burst(ADD,p.pos,5,{colors:[0xff5a1f,0xffb347,0xff2a10],speed:1.5,up:1.5,life:.35,size:.55,size1:0,drag:2,bright:2.2,rad:.3});
      if(Math.random()<.4)burst(SMK,p.pos,1,{colors:[0x2a2020],speed:.5,up:1,life:.8,size:.4,size1:1.2,drag:1});}
    if(p.type==='sigil'){p.mesh.children.forEach((c,k)=>{c.rotation.z+=dt*(k%2?-6:6);});burst(ADD,p.pos,2,{colors:[0x5aff8a,0xd8ffe0],speed:.8,life:.35,size:.25,size1:0,bright:2,rad:.5});}
    if(p.type==='slashwave'){p.mesh.scale.setScalar(1+p.t*1.5);}
    if(p.type==='feather'){burst(ADD,p.pos,2,{colors:[0xff4f8b,0xffd0e0],speed:.6,life:.25,size:.22,size1:0,bright:2});}
    if(p.type==='airburst'){p.mesh.children.forEach((r,k)=>r.scale.setScalar(1+p.t*2.2));burst(ADD,p.pos,6,{colors:[0xcfe4ff,0xffffff],speed:2,life:.25,size:.3,size1:0,bright:1.4,rad:1.6,dir:p.dir,dirSp:12});if(Math.random()<.5)dust(TMP.set(p.pos.x,0,p.pos.z),2,1);}
    if(p.type==='bubble'){p.mesh.rotation.y+=dt*3;p.mesh.children[0].scale.setScalar(1+Math.sin(p.t*14)*.06);burst(ADD,p.pos,2,{colors:[0xb58cff,0xf2e8ff],speed:.6,life:.4,size:.2,size1:0,bright:1.8,rad:.5});}
    if(p.type==='meteor'){p.mesh.children[0].rotation.x+=dt*5;burst(ADD,p.pos,5,{colors:[0xff8a3a,0xffd04a,0xff3010],speed:1.5,life:.4,size:.7,size1:0,bright:2.2,rad:.4});burst(SMK,p.pos,1,{colors:[0x2a2526,0x403838],speed:.5,life:1.2,size:.8,size1:2,drag:1});}
    if(p.type==='blade')burst(ADD,p.pos,4,{colors:[0x1fb8ff,0x9af0ff,0xffffff],speed:1.2,life:.3,size:.22,size1:0,grav:9,bright:2,rad:.9,flat:true});
    if(p.type==='cyclone'){p.mesh.rotation.y+=dt*16;p.mesh.children.forEach((m,k)=>m.scale.setScalar(1+Math.sin(p.t*12+k)*.12));
      if(nearCam(p.pos,90))for(let k=0;k<4;k++){const a=p.t*14+k*1.57,r=rand(.3,1.2),h=rand(0,2.6);ADD.spawn(p.pos.x+Math.cos(a)*r,h,p.pos.z+Math.sin(a)*r,-Math.sin(a)*4,1.5,Math.cos(a)*4,..._rgb(pick([0xb57bff,0xf0ddff]),1.6),.35,.25,0,0,1);}
      if(Math.random()<.4)dust(p.pos,1,.7);}
    if(p.type==='erode'&&p.t-p.lastSp>.05){p.lastSp=p.t;const x=p.pos.x+rand(-.5,.5),z=p.pos.z+rand(-.5,.5);scorch(x,z,rand(1.2,2));
      burst(SMK,TMP.set(x,.2,z),3,{colors:[0x8a8290,0x5a5560],speed:1.5,up:2.5,life:1,size:.5,size1:1.4,drag:1.5,grav:-.3});
      burst(ADD,TMP.set(x,.2,z),6,{colors:[0xc9a0ff,0x9a6aff],speed:2,up:4,life:.4,size:.25,size1:0,bright:2,rad:.6});if(Math.random()<.6)debris(TMP.set(x,.2,z),1,0,4,.2);}
    if(p.type==='siphon'){const r=p.mesh.children[2];r.rotation.x+=dt*12;r.rotation.y+=dt*9;
      burst(SMK,p.pos,2,{colors:[0x1a0a2a,0x2a1040],speed:.6,life:.5,size:.4,size1:.1,drag:2});burst(ADD,p.pos,3,{colors:[0x8a3cff,0xe0c8ff],speed:1.2,life:.3,size:.25,size1:0,bright:2,rad:.3});}
    if(p.type==='fault'&&p.t-p.lastSp>.055){p.lastSp=p.t;spike(p.pos.x+rand(-.4,.4),p.pos.z+rand(-.4,.4),rand(1,1.7));if(Math.random()<.5)debris(TMP.set(p.pos.x,.3,p.pos.z),1,1,5,.18);}
    if(p.type==='wave'){burst(ADD,TMP.set(p.pos.x,3.6,p.pos.z),12,{colors:[0xffffff,0x9af0ff],speed:3,up:3,life:.6,size:.35,size1:0,grav:12,bright:1.6,rad:5,flat:true});
      burst(SMK,TMP.set(p.pos.x,.3,p.pos.z),3,{colors:[0xcfefff],speed:3,up:2,life:.7,size:.8,size1:2,drag:2,rad:5});}
    for(const v of FS){if(v.fieldT>0&&!ally(v,own)&&!v.dead&&!p.big&&!p.meteor&&v.chest(TMP).distanceTo(p.pos)<2.3){p.dead=true;p.absorbed=true;ring(p.pos,0x8ac4ff,1.6,.3,false,2.4);burst(ADD,p.pos,20,{colors:[0x8ac4ff,0xeaf6ff],speed:4,life:.3,size:.25,bright:2.2});break;}}
    if(p.meteor&&p.pos.y<=.4&&!p.dead){p.dead=true;const ep=new V3(p.pos.x,.6,p.pos.z);explosion(ep,2.6,[0xff8a3a,0xffd04a,0xff3010]);debris(ep,6,1,9,.3);AU.boom(false);
      for(const o of FS){if(ally(o,own)||o.dead)continue;if(Math.hypot(o.pos.x-ep.x,o.pos.z-ep.z)<3.2&&o.pos.y<6)applyHit(own,o,{dmg:7,kb:8,up:9,launch:true,heavy:true,pt:o.chest(new V3()),noSpark:true,chip:.25});}
      props.forEach(pp=>{if(Math.hypot(pp.x-ep.x,pp.z-ep.z)<3)breakProp(pp);});}
    if(p.air&&!p.meteor&&p.pos.y<.08&&!p.dead){p.dead=true;dust(p.pos,3,.5);}
    // hits
    for(const o of FS){if(ally(o,own)||o.dead||p.dead||p.meteor)continue;
      if(p.multi&&p.cap&&p.cap!==o)continue;
      if(o.invuln>0&&!(p.multi&&p.cap===o))continue;
      let hit=false;
      if(p.big){const rx=o.pos.x-p.pos.x,rz=o.pos.z-p.pos.z,al=rx*p.dir.x+rz*p.dir.z,lt=Math.abs(rx*p.dir.z-rz*p.dir.x);if(Math.abs(al)<1.4&&lt<5.5&&o.pos.y<4.5)hit=true;}
      else if(p.ground){if(Math.hypot(o.pos.x-p.pos.x,o.pos.z-p.pos.z)<p.r+.4&&o.pos.y<1.2)hit=true;}
      else if(p.type==='cyclone'){if(Math.hypot(o.pos.x-p.pos.x,o.pos.z-p.pos.z)<p.r+.4&&o.pos.y<3)hit=true;}
      else if(o.chest(TMP).distanceTo(p.pos)<p.r+.55)hit=true;
      if(!hit)continue;
      if(p.multi){p.cap=o;p.hitCD-=dt;o.pos.x=lerp(o.pos.x,p.pos.x,Math.min(1,dt*8));o.pos.z=lerp(o.pos.z,p.pos.z,Math.min(1,dt*8));p.vel.multiplyScalar(.9);
        if(p.hitCD<=0){p.hitCD=.15;p.hits++;const last=p.hits>=p.multi;
          applyHit(own,o,last?{dmg:5,kb:7,up:10,launch:true,heavy:true,pt:o.chest(new V3())}:{dmg:p.dmg,kb:0,stun:.4,hold:true,pt:o.chest(new V3()),chip:.15});if(last)p.dead=true;}}
      else if(!p.hitSet[o.id]){p.hitSet[o.id]=1;const res=applyHit(own,o,{dmg:p.dmg,kb:p.kb,up:p.up,stun:p.stun||.5,launch:p.launch,heavy:p.type!=='feather'&&p.type!=='slashwave',pt:o.chest(new V3()),chip:p.big?.25:undefined,float:p.float,drop:5,mark:p.mark});
        if(p.type==='siphon'&&res===true)steal(own,o);
        if(p.type==='fault')for(let k=0;k<6;k++)spike(o.pos.x+rand(-1,1),o.pos.z+rand(-1,1),rand(1.6,2.4));
        if(!p.big&&!p.pierce)p.dead=true;}
    }
    for(const pr of props){if(pr.broken)continue;const dx=pr.x-p.pos.x,dz=pr.z-p.pos.z;if(Math.abs(dx)>7||Math.abs(dz)>7)continue;
      if(Math.hypot(dx,dz)<pr.r+(p.big?5:p.r)){if(p.big&&Math.abs(dx*p.dir.x+dz*p.dir.z)>1.5)continue;breakProp(pr);if(p.type==='fireball'||p.type==='blade'||p.type==='siphon'||p.type==='bubble'||p.type==='feather')p.dead=true;}}
    for(const q of projs){if(q!==p&&!ally(q.owner,own)&&!q.dead&&!q.big&&!p.big&&!p.dead&&!p.meteor&&!q.meteor&&p.type!=='feather'&&q.type!=='feather'&&q.pos.distanceTo(p.pos)<p.r+q.r+.3){p.dead=q.dead=true;explosion(p.pos.clone().lerp(q.pos,.5),2.2,[own.hero.color,q.owner.hero.color],false);AU.boom(false);}}
    if(Math.abs(p.pos.x)>BOUND+1||Math.abs(p.pos.z)>BOUND+1||p.t>p.life)p.dead=true;
    if(insideBld(p.pos.x,p.pos.z,0,p.pos.y+.1)){p.dead=true;if(p.big)dust(p.pos,20,2);}
    if(p.dead){
      if(p.absorbed){}
      else if(p.type==='fireball'){explosion(p.pos,2,[0xff5a1f,0xffb347]);AU.boom(false);}
      else if(p.type==='blade'){burst(ADD,p.pos,40,{colors:[0x1fb8ff,0xffffff],speed:8,life:.4,size:.3,grav:10,bright:2.2});ring(p.pos,0x1fb8ff,2,.3,false);}
      else if(p.type==='siphon'){burst(ADD,p.pos,30,{colors:[0x8a3cff,0xe0c8ff],speed:6,life:.35,size:.3,bright:2.2});ring(p.pos,0x8a3cff,1.6,.25,false);}
      else if(p.type==='bubble'){burst(ADD,p.pos,30,{colors:[0xb58cff,0xf2e8ff],speed:5,life:.4,size:.25,bright:2});AU.tone('sine',900,300,.2,.12);}
      else if(p.type==='cyclone')burst(ADD,p.pos,30,{colors:[0xb57bff,0xffffff],speed:7,up:2,life:.4,size:.3,bright:2});
      scene.remove(p.mesh);p.mesh.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose();});projs.splice(i,1);}
  }
  AU.scale=1;
}
function clearProjs(){if(typeof clearCab==='function')clearCab();clearMHA();projs.splice(0).forEach(p=>scene.remove(p.mesh));}

/* ---- custom specials ---- */
function enemyInFront(f,maxD,cone){let best=null,bd=maxD;const fw=f.fwd(TMP3);for(const o of FS){if(ally(o,f)||o.dead)continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,d=Math.hypot(dx,dz);
  if(d>bd)continue;if((dx*fw.x+dz*fw.z)/(d||1)<(cone||.3))continue;bd=d;best=o;}return best;}
const SPECIALS={
  chainbolt(f){const t=f.stateT;
    if(!f.fired&&t>.18){f.fired=true;f.rig.root.updateMatrixWorld(true);const org=f.rig.rF.getWorldPosition(new V3());
      let T=(f.tgt&&!f.tgt.dead&&f.tgt.pos.distanceTo(f.pos)<18)?f.tgt:enemyInFront(f,18,.2);const sc=AU.scale;AU.scale=sndAt(f.pos);AU.scale=sc;
      if(T){const tc=T.chest(new V3());bolt(org,tc,0xffe03a,.09,.22);applyHit(f,T,{dmg:8,kb:1,stun:.85,pt:tc,noSpark:true});
        let N=null,nd=9;for(const o of FS){if(ally(o,f)||o===T||o.dead)continue;const d=o.pos.distanceTo(T.pos);if(d<nd){nd=d;N=o;}}
        if(N){const nc=N.chest(new V3());bolt(tc,nc,0xffe03a,.07,.22);applyHit(f,N,{dmg:5,kb:1,stun:.6,pt:nc,noSpark:true});}}
      else{const e=org.clone().addScaledVector(f.fwd(),12);e.y=.1;bolt(org,e,0xffe03a,.08,.2);burst(ADD,e,16,{colors:[0xffe03a,0xffffff],speed:6,up:3,life:.3,size:.25,bright:2.4});scorch(e.x,e.z,1.2);}}
    if(t>.45)f.set(f.onGround?'idle':'air');return 10;},
  bluelash(f,dt){const t=f.stateT;
    if(t>.12&&t<.8){f.rig.root.updateMatrixWorld(true);const org=f.rig.rF.getWorldPosition(new V3()),fw=f.fwd();
      if(nearCam(org,90))for(let q=0;q<9;q++){const sp=rand(10,18),a=rand(-.32,.32);const d=fw.clone().applyAxisAngle(UP,a);ADD.spawn(org.x,org.y+rand(-.1,.1),org.z,d.x*sp,rand(-.5,1.5),d.z*sp,..._rgb(pick([0x2a8aff,0x5aa8ff,0x1a4aff,0xaee0ff]),1.5),.4,.22,1.2,-1.5,1.5);}
      if(!f.lashSnd||t-f.lashSnd>.25){f.lashSnd=t;const sc=AU.scale;AU.scale=sndAt(f.pos);AU.noise(.3,.35,'lowpass',2600,600,1);AU.scale=sc;}
      if(!f.lastLash||t-f.lastLash>.1){f.lastLash=t;for(const o of FS){if(ally(o,f)||o.dead)continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,d=Math.hypot(dx,dz);
        if(d<6.8&&(dx*fw.x+dz*fw.z)/(d||1)>.8&&Math.abs(o.pos.y-f.pos.y)<2)applyHit(f,o,{dmg:2,kb:.6,stun:.35,hold:true,pt:o.chest(new V3()),noSpark:true});}}}
    else if(t<=.12){f.lastLash=0;f.lashSnd=0;}
    if(t>.9)f.set(f.onGround?'idle':'air');return 12;},
  gate(f){const t=f.stateT;
    if(!f.fired&&t>.12){f.fired=true;const T=(f.tgt&&!f.tgt.dead&&f.tgt.pos.distanceTo(f.pos)<22)?f.tgt:enemyInFront(f,22,0);
      portal(f.chest(new V3()),1.3,false,.7,f.face);const sc=AU.scale;AU.scale=sndAt(f.pos);AU.scale=sc;
      let dest;if(T){const b=T.fwd();dest=new V3(T.pos.x-b.x*1.5,T.pos.y,T.pos.z-b.z*1.5);if(insideBld(dest.x,dest.z,.6)||Math.abs(dest.x)>BOUND||Math.abs(dest.z)>BOUND)dest=new V3(T.pos.x+b.z*1.5,T.pos.y,T.pos.z-b.x*1.5);f.gateT=T;}
      else{dest=f.pos.clone().addScaledVector(f.fwd(),10);if(insideBld(dest.x,dest.z,.6))dest=f.pos.clone();f.gateT=null;}
      dest.x=clamp(dest.x,-BOUND,BOUND);dest.z=clamp(dest.z,-BOUND,BOUND);f.pos.copy(dest);f.vel.set(0,0,0);
      if(T)f.face=Math.atan2(T.pos.x-f.pos.x,T.pos.z-f.pos.z);portal(f.chest(new V3()),1.3,false,.7,f.face);burst(SMK,f.chest(new V3()),20,{colors:[0x2a1a5a,0x4a3a8a],speed:3,life:.8,size:.5,size1:1.2,drag:2});f.gateHit=false;}
    if(f.fired&&!f.gateHit&&t>.3){f.gateHit=true;const T=f.gateT;if(T&&!T.dead&&T.pos.distanceTo(f.pos)<3.2)applyHit(f,T,{dmg:9,kb:9,up:6,launch:true,heavy:true,pt:T.chest(new V3())});AU.whoosh(true);}
    if(t>.58)f.set(f.onGround?'idle':'air');return 10;},
  shadowgrab(f){const t=f.stateT;
    if(!f.fired&&t>.12){f.fired=true;const fw=f.fwd();let L=11;for(let d=.5;d<=11;d+=.5){const x=f.pos.x+fw.x*d,z=f.pos.z+fw.z*d;if(insideBld(x,z,.4,1)){L=d;break;}}
      let T=null,ta=99;for(const o of FS){if(ally(o,f)||o.dead||o.invuln>0)continue;const rx=o.pos.x-f.pos.x,rz=o.pos.z-f.pos.z,al=rx*fw.x+rz*fw.z,lt=Math.abs(rx*fw.z-rz*fw.x);if(al>0&&al<L&&lt<1.5&&al<ta){ta=al;T=o;}}
      f.beastReach=T?ta:L;f.grabT=T;
      if(T)applyHit(f,T,{dmg:6,kb:0,stun:.8,hold:true,pt:T.chest(new V3())});}
    if(f.grabT&&t<.45){const T=f.grabT,fw=f.fwd();if(!T.dead){T.pos.x=lerp(T.pos.x,f.pos.x+fw.x*1.7,.18);T.pos.z=lerp(T.pos.z,f.pos.z+fw.z*1.7,.18);f.beastReach=Math.hypot(T.pos.x-f.pos.x,T.pos.z-f.pos.z);}}
    if(f.grabT&&t>=.45){const T=f.grabT;f.grabT=null;if(!T.dead)applyHit(f,T,{dmg:7,kb:4,up:12,launch:true,heavy:true,pt:T.chest(new V3())});}
    if(t>.72)f.set(f.onGround?'idle':'air');return 10;},
  harden(f){const t=f.stateT;
    if(!f.fired&&t>.2){f.fired=true;f.armorT=5;const c=f.chest(new V3());ring(c,0xff6a2a,2.4,.35,false,2.4);burst(ADD,c,40,{colors:[0xffc08a,0xffffff,0xff6a2a],speed:7,life:.4,size:.25,bright:2.4});
      }
    if(t>.42)f.set(f.onGround?'idle':'air');return 12;},
  nullfield(f){const t=f.stateT;
    if(!f.fired&&t>.15){f.fired=true;f.fieldT=3.2;const c=f.chest(new V3());ring(c,0x8ac4ff,2.6,.35,false,2.4);}
    if(t>.35)f.set(f.onGround?'idle':'air');return 12;},
  vow(f){const t=f.stateT;
    if(!f.fired&&t>.2){f.fired=true;if(NET.role!=='client')f.hp=Math.max(1,f.hp-12);f.vowT=6;f.flash=1;const c=f.chest(new V3());ring(c,0xff3030,2.4,.4,false,2.4);
      burst(ADD,c,40,{colors:[0xff3030,0xffffff,0xff8080],speed:6,up:2,life:.5,size:.3,bright:2.4});}
    if(t>.42)f.set(f.onGround?'idle':'air');return 12;},
  featherfan(f){const t=f.stateT;
    if(!f.fired&&t>.18){f.fired=true;for(let k=-2;k<=2;k++)spawnProj(f,'feather',k*.12,{quiet:k!==0});}
    if(t>.42)f.set(f.onGround?'idle':'air');return 10;},
};

/* ---- slash marks, singularity, sealed arena ---- */
const slashGeo=new THREE.PlaneGeometry(1,.06);
const SLASH=pool(40,()=>new THREE.Mesh(slashGeo,new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
function slashFX(pos,color,len){if(!nearCam(pos,90))return;const m=SLASH.get();m.visible=true;m.position.copy(pos);m.lookAt(camera.position);m.rotateZ(rand(0,Math.PI));
  m.material.color.setHex(color).multiplyScalar(2.6);m.userData={t:0,dur:.28,len:len||2};m.scale.set(.1,1,1);}
function updateSlashes(dt){SLASH.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){m.visible=false;return;}m.scale.set(u.len*Math.min(1,k*4),1+(1-k)*.5,1);m.material.opacity=1-k;});}
function makeSingularity(){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.SphereGeometry(1.3,48,32),new THREE.MeshBasicMaterial({color:0x000000})));
  const disk=new THREE.Mesh(new THREE.RingGeometry(1.5,4.2,96),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vUv;varying float vR;void main(){vUv=uv;vR=length(position.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv;varying float vR;void main(){float a=atan(vUv.y-.5,vUv.x-.5);float s=.6+.4*sin(a*7.+vR*5.);float f=smoothstep(4.2,1.6,vR)*smoothstep(1.4,1.8,vR);gl_FragColor=vec4(vec3(.55,.75,1.)*f*s*2.2,1.);}'}));
  disk.rotation.x=-Math.PI/2+.35;g.add(disk);g.add(new THREE.Mesh(new THREE.SphereGeometry(1.45,48,32),addMat(0x8ac4ff,.7,.25)));g.scale.setScalar(.01);return g;}
function makeArena(){const g=new THREE.Group();
  const dome=new THREE.Mesh(new THREE.SphereGeometry(11,64,32,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{t:{value:0}},
    vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float t;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(vN.z),2.);float hx=step(.93,fract(atan(vP.z,vP.x)*5.73+t*.1))+step(.93,fract(vP.y*1.2-t*.4));gl_FragColor=vec4(vec3(.35,1.,.55)*(f*.9+hx*.35+.04),1.);}'}));
  g.add(dome);const [c,x]=cv(512,512);x.translate(256,256);x.strokeStyle='rgba(120,255,160,.9)';x.lineWidth=6;x.beginPath();x.arc(0,0,246,0,7);x.stroke();x.lineWidth=3;x.beginPath();x.arc(0,0,200,0,7);x.stroke();
  for(let k=0;k<12;k++){x.save();x.rotate(k/12*Math.PI*2);x.strokeRect(205,-10,30,20);x.beginPath();x.moveTo(0,0);x.lineTo(196,0);x.stroke();x.restore();}
  x.beginPath();for(let k=0;k<7;k++){const a=k/7*Math.PI*2*3;x.lineTo(Math.cos(a)*180,Math.sin(a)*180);}x.closePath();x.stroke();
  const sig=new THREE.Mesh(new THREE.PlaneGeometry(22,22),new THREE.MeshBasicMaterial({map:tex(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0x9affb8}));sig.rotation.x=-Math.PI/2;sig.position.y=.08;g.add(sig);
  g.scale.setScalar(.01);return g;}
