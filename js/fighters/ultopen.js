/* ULTIMATE OPENINGS — the 0.9 s wind-up before every ultimate, themed per fighter.
   ultOpening(f,t,c,dt) is called each frame of the wind-up (from Fighter.doUlt). Return true to replace the default.
   Fighters without their own opening get a default: an aura pillar in their colors and converging sparks. */
const UO={
  solstice(f,t,c){if(uo1(f,'a')){aura(f,0xbfefff,0xff6a1a,1);}if(uo1(f,'b',.15))for(let i=0;i<8;i++){const a=i/8*6.283;crag(f.pos.x+Math.cos(a)*2.6,f.pos.z+Math.sin(a)*2.6,rand(1.5,2.6),1.6);}
    uoSwirl(f,c,0xff6a1a,0xbfefff,6);},
  piston(f,t,c){[f.rig.lK,f.rig.rK].forEach(q=>{if(!q)return;q.getWorldPosition(TMP2);burst(ADD,TMP2,3,{colors:[0x9ad8ff,0xffffff,0x3a8aff],speed:3,life:.25,size:.4,size1:0,bright:3});});
    if(uo1(f,'r',.3))ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0x7ac8ff,4,.3,true,2.6);if(uo1(f,'r2',.6))ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0x7ac8ff,6,.3,true,2.6);if(Math.random()<.4)dust(f.pos,2,.6);},
  snare(f,t,c){f._eyeT=Math.max(f._eyeT||0,1.2);for(let i=0;i<2;i++){const a=t*9+i*Math.PI,p=c.clone().add(new V3(Math.cos(a)*1.6,Math.sin(t*6+i)*.6,Math.sin(a)*1.6)),q=c.clone().add(new V3(Math.cos(a-.5)*1.6,Math.sin(t*6+i-.3)*.6,Math.sin(a-.5)*1.6));trailSeg(q,p,0xe8e8f0,.08,.3);}
    if(uo1(f,'f',.7))ring(c,0xff2a2a,3,.25,false,2.6);},
  marble(f,t,c){if(uo1(f,'a'))for(let i=0;i<5;i++)setTimeout(()=>{if(inMatch())cubeFold(c.clone().add(new V3(rand(-2,2),rand(-.5,1.5),rand(-2,2))),0x9ad8ff);},i*120);uoSwirl(f,c,0x9ad8ff,0xffffff,3);},
  legion(f,t,c){if(Math.random()<.5)goo(new V3(f.pos.x+rand(-2,2),f.pos.y,f.pos.z+rand(-2,2)),0x3a2a1a,3,false);if(uo1(f,'p',.1))goo(f.pos.clone(),0x3a2a1a,6);},
  recoil(f,t,c){for(let i=0;i<3;i++){const a=f.face+(i-1)*.6+Math.sin(t*5)*.5,d=new V3(Math.sin(a),0,Math.cos(a));if(Math.random()<.4)trailSeg(c,c.clone().addScaledVector(d,18),0xff4ad8,.03,.12);}
    if(uo1(f,'m',.75)){burst(ADD,c,20,{colors:[0xffffff,0xff9af0],speed:7,life:.2,size:.3,size1:0,bright:3});}},
  crimson(f,t,c){uoSwirl(f,c,0xc4102a,0x6a0a14,5,SMK);if(uo1(f,'g',.2))goo(f.pos.clone(),0xc4102a,10);},
  sawback(f,t,c){for(let i=0;i<4;i++){const a=t*7+i*1.57;const p=c.clone().add(new V3(Math.cos(a)*1.8,.3,Math.sin(a)*1.8)),q=c.clone().add(new V3(Math.cos(a)*1.8,1.4,Math.sin(a)*1.8));if(Math.random()<.5)trailSeg(p,q,0xd8e0e8,.07,.15);}
    if(Math.random()<.5)burst(ADD,c,3,{colors:[0xffe8a0,0xffffff],speed:5,life:.25,size:.1,size1:0,bright:2.6,grav:12});},
  resect(f,t,c){if(Math.random()<.5)crackle(new V3(f.pos.x+rand(-2.5,2.5),f.pos.y+.4,f.pos.z+rand(-2.5,2.5)),0xff2a3a);
    if(uo1(f,'s',.5)){const hs=new Set(FS);for(let i=0;i<8;i++){const a=i/8*6.283;spikeAt(f,f.pos.x+Math.cos(a)*3,f.pos.z+Math.sin(a)*3,1,0,hs);}}},
  cushion(f,t,c){if(uo1(f,'a')){ring(c,0xffd23f,2.4,.3,false,2.4);setTimeout(()=>{if(!f.xHold&&f.rig)f.rig.root.scale.setScalar(f.hero.scale);},950);}if(uo1(f,'b',.3))ring(c,0xffa21a,3.2,.3,false,2.4);if(uo1(f,'c',.6))ring(c,0xffd23f,4,.3,false,2.4);
    const s=f.hero.scale*(1+Math.sin(t*28)*.04);if(!f.xHold)f.rig.root.scale.set(s*1.05,f.hero.scale*(1-Math.sin(t*28)*.03),s*1.05);},
  corrosa(f,t,c){for(let i=0;i<3;i++)burst(ADD,TMP2.set(f.pos.x+rand(-1.5,1.5),f.pos.y+.1,f.pos.z+rand(-1.5,1.5)),1,{colors:[0xb8ff3a,0xe8ff9a],speed:1,up:5,life:.5,size:.3,size1:0,bright:2});
    if(uo1(f,'s',.4))burst(SMK,TMP2.set(f.pos.x,f.pos.y+.5,f.pos.z),6,{colors:[0xd8ffb0],speed:1,up:2,life:1.2,size:.8,size1:2});},
  verdict(f,t,c){if(Math.random()<.35){const p=c.clone().add(new V3(rand(-2,2),rand(-.8,1),rand(-2,2)));trailSeg(p.clone().add(new V3(-.7,.7,0)),p.clone().add(new V3(.7,-.7,0)),0xff1a3a,.06,.3);}
    if(uo1(f,'e',.2)){fxEyes(f,0xff1a3a,true);setTimeout(()=>fxEyes(f,0xff1a3a,false),1500);}},
  decree(f,t,c){['ORDER','LAW','DECREE'].forEach((w,i)=>{if(uo1(f,'w'+i,i*.25))glyph(w,c.clone().add(new V3(Math.cos(i*2.1)*2.2,1.2,Math.sin(i*2.1)*2.2)),0xffd86a,.8,1.1);});uoSwirl(f,c,0xffd86a,0xfff2b0,4);},
  skitter(f,t,c){for(let i=0;i<2;i++){const a=rand(0,6.28),p=new V3(f.pos.x+Math.cos(a)*3,f.pos.y+rand(.2,1.6),f.pos.z+Math.sin(a)*3);trailSeg(p,p.clone().add(new V3(Math.cos(a+1.57)*1.6,0,Math.sin(a+1.57)*1.6)),0x3affc8,.05,.2);}},
  oldguard(f,t,c){if(uo1(f,'s',.45)){ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0xffd23f,5,.35,true,2.4);dust(f.pos,16,1.4);shake(.25,f.pos);impactLines(c,0xffffff,10);}
    [f.rig.lF,f.rig.rF].forEach(q=>{if(!q||Math.random()<.6)return;q.getWorldPosition(TMP2);burst(ADD,TMP2,1,{colors:[0xffd23f,0xffffff],speed:2,life:.2,size:.15,size1:0,bright:2.6});});},
  hopstar(f,t,c){if(Math.random()<.2)glyph(pick(['♪','♫']),c.clone().add(new V3(rand(-2,2),rand(.5,2),rand(-2,2))),pick([0xb06aff,0x6affe0]),.6,.8);
    if(uo1(f,'a',.1))ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0xb06aff,3,.3,true,2.4);if(uo1(f,'b',.5))ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),0x6affe0,4.5,.3,true,2.4);},
  headliner(f,t,c){if(Math.random()<.25){const p=c.clone().add(new V3(rand(-4,4),rand(0,2),rand(-4,4)));burst(ADD,p,8,{colors:[0xffffff,0xfff4d8],speed:4,life:.12,size:.4,size1:0,bright:3});}
    if(uo1(f,'s'))aura(f,0xffd86a,0xffffff,1);},
  zanshin(f,t,c){if(uo1(f,'a'))aura(f,0xff2a3a,0x1a0a10,1);uoSwirl(f,c,0xff2a3a,0x1a0a10,4,SMK);if(uo1(f,'r',.6))ring(c,0xff2a3a,4,.3,false,2.6);}};
function uo1(f,k,at){if(f.stateT<(at||0))return false;f.vf.uo=f.vf.uo||{};if(f.vf.uo[k])return false;f.vf.uo[k]=1;return true;}
function uoSwirl(f,c,c1,c2,n,sys){for(let i=0;i<(n||4);i++){const a=rand(0,6.28),r=rand(2,3.2),p=new V3(c.x+Math.cos(a)*r,c.y+rand(-1.2,1.2),c.z+Math.sin(a)*r);
  burst(sys||ADD,p,1,{colors:[c1,c2],speed:.3,life:.35,size:sys===SMK?.4:.3,size1:0,bright:2.2,dir:new V3(c.x-p.x,c.y-p.y,c.z-p.z).normalize()});}}
function ultOpening(f,t,c,dt){const k=KIT(f.hero,'elem'),fn=UO[k];
  if(fn){try{fn(f,t,c,dt);}catch(e){}return true;}
  // default: an aura pillar in the fighter's own colors + converging sparks
  if(uo1(f,'def'))aura(f,f.hero.color,f.hero.accent,1);uoSwirl(f,c,f.hero.color,f.hero.accent,4);return true;}
