/* MOVE FX — makes ability-engine moves look like proper attacks.
   GROUND MOVES (earth / metal / plant / ice / crystal styles): waves, pillars, slams and bursts are made of real rock
     (or ice) — spikes tear up out of the ground in a line, boulders erupt, craters, rubble and dust — instead of glowing energy.
   CONE MOVES (the old "small arc"): now a full-size attack shaped by its style, reaching up to 15 m:
     fire → a roaring flamethrower torrent · wind → a pressure blast (with a giant fist for punch moves) · sound → shock rings
     blade → a storm of slashes · lightning → a fan of forked bolts · liquids (water, acid, blood) → a heavy spray
     explosion → a chain of blasts · decay → the ground crumbles away · rock/metal/ice → spikes erupt across the area
     anything else → a blinding energy fan */
const PHYS_STYLES=['earth','metal','plant','ice','crystal'];
function isPhys(A){return PHYS_STYLES.indexOf(A.style)>=0;}
const MVFX=[];   // short-lived meshes animated here (big fists, etc.)
function rockUp(A,x,z,h){if(A.style==='ice'||A.style==='crystal')crag(x,z,h,1.6,A.style==='ice'?0xcff4ff:A.c1);else spike(x,z,h);}
// a wave travelling along the ground: a row of spikes tears up every ~0.9 m
function physWaveStep(w,p){w.acc=(w.acc||0);if(w.d-w.acc<.9)return;w.acc=w.d;const A=w.A,sx=w.dir.z,sz=-w.dir.x,h=1.1*A.size+rand(0,.5);
  for(let k=-1;k<=1;k++){const o=k*w.W*.55+rand(-.2,.2);rockUp(A,p.x+sx*o,p.z+sz*o,h*(k?0.75:1));}
  dust(p,3,.8);if(Math.random()<.5)debris(TMP2.set(p.x,.4,p.z),2,0,6,.35);}
// pillar eruption: a big spike cluster, rubble, dust and a crater
function physPillar(A,p,big){const s=A.size*(big?1.3:1);rockUp(A,p.x,p.z,2.8*s);for(let k=0;k<4;k++){const a=k/4*6.28+rand(-.4,.4),r=rand(.7,1.2)*s;rockUp(A,p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,rand(1,1.7)*s);}
  dust(p,14,1.3*s);debris(TMP2.set(p.x,.6,p.z),8,0,10,.5*s);if(typeof crater==='function')crater(p.x,p.z,1.1*s,p.y);shake(.25,p);xSnd(p,()=>{AU.boom(false);});}
// a crater ring of spikes around a landing / burst point
function physRing(A,p,R,n){for(let k=0;k<n;k++){const a=k/n*6.28+rand(-.15,.15),r=R*rand(.75,1.05);rockUp(A,p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,rand(.9,1.6)*A.size);}
  dust(p,20,1.6);debris(TMP2.set(p.x,.6,p.z),10,0,11,.45*A.size);if(typeof crater==='function')crater(p.x,p.z,R*.55,p.y);}

// ---------- cone moves ----------
function coneKind(A){const s=A.style,sh=A.shape;
  if(s==='poison'&&(sh==='hand'||sh==='skull'))return 'decay';
  if(sh==='fist'&&s!=='wind')return 'fists';if(sh==='eye')return 'gaze';
  if(s==='fire')return 'fire';if(s==='wind')return 'wind';if(s==='sound'||sh==='ring'||sh==='note')return 'sound';
  if(s==='blade')return 'blade';if(s==='lightning')return 'bolt';if(s==='water'||s==='poison'||s==='blood')return 'spray';
  if(s==='explosion')return 'boom';if(isPhys(A))return 'rock';return 'energy';}
// flame palette: keep the move's own hue (blue fire stays blue) but never wash out to white
function firePal(c1,c2){const sat=x=>{const C=new THREE.Color(x),h={};C.getHSL(h);return h;};const a=sat(c1),b=sat(c2),m=a.s*(1-Math.abs(a.l-.5))>=b.s*(1-Math.abs(b.l-.5))?a:b;
  if(m.s<.35)return [0xff4a12,0xff9a2a,0xffd27a];const col=(h,s,l)=>new THREE.Color().setHSL(h,s,l).getHex();return [col(m.h,.95,.45),col(m.h+(m.h>.5?-.03:.05),.95,.55),col(m.h+(m.h>.5?-.05:.1),.9,.72)];}
function conePt(c,fw,R,spread){const d=fw.clone().applyAxisAngle(UP,rand(-spread,spread));return c.clone().addScaledVector(d,rand(1.5,R));}
function coneFX(f,A,c,fw,R,t,D,vf,first,dt){const k=coneKind(A),c1=A.c1,c2=A.c2;vf.ft=vf.ft||0;const every=s=>{if(t-vf.ft>=s){vf.ft=t;return true;}return false;};
  if(!nearCam(c,90))return;
  if(first){shake(.2,f.pos);if(A.shape==='fist'&&A.style==='wind'){bigFist(f,A,c,fw);}}
  switch(k){
  case 'fire':{const P=vf.fp||(vf.fp=firePal(c1,c2));for(let q=0;q<12;q++){const a=rand(-.3,.3),d=fw.clone().applyAxisAngle(UP,a),sp=rand(R*1.5,R*2.1),hot=Math.random()<.12;
      ADD.spawn(c.x+d.x*.4,c.y,c.z+d.z*.4,d.x*sp,rand(-.4,1.6),d.z*sp,..._rgb(hot?P[2]:pick([P[0],P[1]]),hot?1.6:1.35),rand(.38,.5),.32*A.size,2.2*A.size,-1.5,1.2);}
    if(Math.random()<.5)burst(SMK,c.clone().addScaledVector(fw,R*.85),1,{colors:[0x2a2422,0x3a302a],speed:2,up:2.5,life:.9,size:.9,size1:2.8,drag:2,grav:-1});
    if(every(.14))flashLight(c.clone().addScaledVector(fw,3),c1,7);break;}
  case 'wind':{for(let q=0;q<6;q++){const p=conePt(c,fw,R,.4);ADD.spawn(p.x,p.y+rand(-.6,.6),p.z,fw.x*R*2,0,fw.z*R*2,..._rgb(0xffffff,1.2),.22,.25,.05,0,0);}
    if(every(.05)){const p=conePt(c,fw,R*.8,.35),q2=p.clone().addScaledVector(fw,rand(2,3.5));trailSeg(p,q2,c1,.06,.16);}
    if(Math.random()<.6){const g=conePt(f.pos,fw,R,.4);dust(g,1,.8);}break;}
  case 'sound':{if(every(.07)){const d=1+((t*22)%R);ring(c.clone().addScaledVector(fw,d),pick([c1,c2]),1+d*.45,.3,false,2.4);}
    for(let q=0;q<3;q++){const p=conePt(c,fw,R,.45);ADD.spawn(p.x,p.y,p.z,fw.x*8,rand(-.5,.5),fw.z*8,..._rgb(c2,1.6),.25,.3,.0,0,0);}break;}
  case 'blade':{if(every(.045)){for(let q=0;q<2;q++){const p=conePt(c,fw,R,.45),side=new V3(fw.z,0,-fw.x),h=rand(-.9,.9),L=rand(1,1.8);
      const a=p.clone().addScaledVector(side,-L).add(TMP2.set(0,h,0)),b=p.clone().addScaledVector(side,L).add(TMP2.set(0,-h,0));trailSeg(a,b,Math.random()<.4?0xffffff:c1,.07,.18);
      burst(ADD,p,3,{colors:[c2,0xffffff],speed:5,life:.2,size:.18,size1:0,bright:2.6});}}break;}
  case 'bolt':{if(every(.07)){for(let q=0;q<3;q++){const p=conePt(c,fw,R,.42);bolt(c,p,pick([c1,c2,0xffffff]),.09,.12);burst(ADD,p,4,{colors:[c1,0xffffff],speed:5,life:.2,size:.25,size1:0,bright:2.8});}if(Math.random()<.4)flashLight(c,c1,6);}break;}
  case 'spray':{for(let q=0;q<9;q++){const a=rand(-.35,.35),d=fw.clone().applyAxisAngle(UP,a),sp=rand(R*1.1,R*1.6);
      ADD.spawn(c.x,c.y,c.z,d.x*sp,rand(1,3.5),d.z*sp,..._rgb(pick([c1,c2]),1.4),rand(.45,.65),.3*A.size,.55*A.size,-9,.4);}
    if(Math.random()<.35){const g=conePt(f.pos,fw,R,.35);g.y=.08;ring(g,c1,1.6,.35,true,1.5);burst(SMK,g,2,{colors:[c1,c2],speed:1,up:1,life:.6,size:.4,size1:1.2});}break;}
  case 'boom':{if(every(.11)){const d=2+((t/.11)%5)*(R/5);const p=c.clone().addScaledVector(fw,d).add(TMP2.set(rand(-.8,.8),0,rand(-.8,.8)));explosion(p,1.4*A.size+d*.06,[c1,c2,0xffffff]);xSnd(p,()=>{AU.boom(false);});}break;}
  case 'decay':{// the ground crumbles away in a spreading fan
    if(every(.06)){for(let q=0;q<2;q++){const g=conePt(f.pos,fw,Math.min(R,2+t*R*1.4),.5);g.y=.06;const a=Math.random()*6.28,L=rand(.6,1.4);
      trailSeg(TMP.set(g.x-Math.cos(a)*L,.05,g.z-Math.sin(a)*L).clone(),TMP2.set(g.x+Math.cos(a)*L,.05,g.z+Math.sin(a)*L).clone(),0x2a0a0a,.09,.9);
      dust(g,2,.7);if(Math.random()<.5)debris(TMP2.set(g.x,.3,g.z),2,0,4,.3);burst(ADD,g,3,{colors:[c2,0x8a7a7a],speed:1.2,up:2,life:.6,size:.22,size1:0,bright:1.4});}}break;}
  case 'rock':{if(every(.06)){const g=conePt(f.pos,fw,Math.min(R,2+t*R*1.5),.42);rockUp(A,g.x,g.z,rand(.9,1.5)*A.size);if(Math.random()<.5)debris(TMP2.set(g.x,.5,g.z),2,0,7,.35);}break;}
  case 'fists':{// a flurry of punches thrown out across the area
    if(every(.06)){const p=c.clone().addScaledVector(fw,.9).add(TMP2.set(rand(-.7,.7),rand(-.4,.5),rand(-.7,.7)));flyFist(f,A,p,fw.clone().applyAxisAngle(UP,rand(-.3,.3)),R);
      const h=conePt(c,fw,R*.8,.35);burst(ADD,h,5,{colors:[0xffffff,c2],speed:6,life:.2,size:.25,size1:0,bright:2.6});if(Math.random()<.5)ring(h,0xffffff,1.2,.18,false,2);}break;}
  case 'gaze':{// a glaring stare: burning eyes and rays sweeping the area
    const e=f.chest(new V3()).add(TMP2.set(0,.55,0));if(every(.05)){for(let q=0;q<2;q++){const p=conePt(e,fw,R,.38);bolt(e,p,c1,.04,.09);}burst(ADD,e,3,{colors:[c1,0xffffff],speed:.5,life:.15,size:.35,size1:0,bright:3});}
    if(Math.random()<.3)flashLight(e,c1,5);break;}
  default:{for(let q=0;q<7;q++){const a=rand(-.4,.4),d=fw.clone().applyAxisAngle(UP,a),sp=rand(R*1.4,R*2);ADD.spawn(c.x,c.y,c.z,d.x*sp,rand(-.3,.6),d.z*sp,..._rgb(pick([c1,c2,c2]),1.4),.4,.35*A.size,1.4*A.size,0,1);}
    if(every(.09)){const p=conePt(c,fw,R,.4);bolt(c,p,c1,.05,.1);}}}}
function flyFist(f,A,p,d,R){try{const m=cabMesh(A,.9*A.size,f);m.position.copy(p);m.rotation.y=Math.atan2(d.x,d.z);scene.add(m);m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;}});
  MVFX.push({m,v:d.clone().multiplyScalar(R*3.2),t:0,life:.3,grow:.4});}catch(e){}}
// wind-pressure punches throw a giant translucent fist forward
function bigFist(f,A,c,fw){try{const m=cabMesh(A,2.4*A.size,f);m.position.copy(c).addScaledVector(fw,1.2);m.rotation.y=Math.atan2(fw.x,fw.z);scene.add(m);
  m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;}});MVFX.push({m,v:fw.clone().multiplyScalar(34),t:0,life:.45});
  ring(c.clone().addScaledVector(fw,1.5),0xffffff,3.4,.3,false,2.2);}catch(e){}}
onEv('tick',dt=>{for(let i=MVFX.length-1;i>=0;i--){const e=MVFX[i];e.t+=dt;e.m.position.addScaledVector(e.v,dt);const k=1-e.t/e.life;e.m.scale.multiplyScalar(1+dt*(e.grow||1.5));
  e.m.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,k*.85);});if(e.t>=e.life){scene.remove(e.m);e.m.traverse(o=>{if(o.material)o.material.dispose();});MVFX.splice(i,1);}}});
