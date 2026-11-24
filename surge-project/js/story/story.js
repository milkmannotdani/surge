/* Story mode engine: 3D anime cutscenes, missions, progress */
const STG={on:false,ch:0,st:0,boss:null,camp:'hero',S:null};
// campaigns: each has its own chapter list, save slot, menu title and cutscene music
// Story mode has been removed; this file is now only the mission engine (missions.js runs on storyStart/storyTick/storyEnd).
const CAMPS={hero:{arr:[],key:'surge.story',name:'',sub:'',music:'story',ep:''}};
function CAMP(){return CAMPS[STG.camp]||CAMPS.hero;}function CAMPA(){return CAMP().arr;}
function storyProg(){try{const v=JSON.parse(store.get(CAMP().key)||'null');if(v&&Array.isArray(v.done))return v;}catch(e){}return {done:[]};}
function storyDone(i){const p=storyProg();if(p.done.indexOf(i)<0){p.done.push(i);store.set(CAMP().key,JSON.stringify(p));return true;}return false;}
function heroIdx(id){return HEROES.findIndex(h=>h.id===id);}
function spkInfo(id){const i=heroIdx(id);const h=HEROES[i];return h?{name:h.name,css:h.css,img:PV.portraits[i]}:{name:'',css:'#fff'};}

/* ---- chapter menu ---- */
function showStory(){showScreen('story');const p=storyProg();const el=$('storyList');const C=CAMP();$('storyH').textContent=C.name;$('storySub').textContent=C.sub;
  const tb=$('storyTabs');tb.innerHTML=Object.keys(CAMPS).map(k=>`<button class="chip ${k===STG.camp?'on':''}" data-c="${k}">${CAMPS[k].name}</button>`).join('');
  [...tb.children].forEach(b=>b.onclick=()=>{AU.ui();STG.camp=b.dataset.c;showStory();});
  el.innerHTML=CAMPA().map((c,i)=>{const done=p.done.indexOf(i)>=0,open=i===0||p.done.indexOf(i-1)>=0;
    return `<div class="stc ${done?'done':''} ${open?'':'lock'}" data-i="${i}"><b>${i+1}</b><div><div class="stt">${c.t}</div><div class="stl">${c.loc}${done?' · CLEARED':''}</div></div><span>${open?(done?'REPLAY':'PLAY'):'🔒'}</span></div>`;}).join('');
  [...el.children].forEach(d=>d.onclick=()=>{if(d.classList.contains('lock'))return;AU.ui();storyChapter(+d.dataset.i);});}

/* ---- 3D cutscenes: the cast stands in the city, the camera cuts between speakers, effects play on cue ---- */
const CINE={on:false,A:{},X:[],t:0,o:new V3(),cam:new V3(),look:new V3(),camT:new V3(),lookT:new V3(),shot:'wide',focus:null,sp:null,first:true};
function npcHero(id){const T=HEROES[heroIdx('titan')];
  if(id==='paragon')return Object.assign({},T,{name:'PARAGON',color:0xffd23f,accent:0xffffff,suit:0x1a2a6a,mainCol:0xf2f2f2,css:'#ffd23f',scale:1.22,bulk:1.18});
  if(id==='principal'){const D=HEROES[heroIdx('drift')];return Object.assign({},D,{name:'KODA',color:0x9ad8ff,accent:0xffffff,suit:0x2a2a3a,mainCol:0xeeeeee,scale:.72});}return null;}
/* ---- anime direction: speed lines, impact frames, manga SFX, name cards, smash zooms, dutch angles ---- */
const AN={spd:0,spdW:0,cx:.5,cy:.45,imp:0,shake:0,roll:0,rollT:0,zoom:0,push:0,seen:{},sw:1,cardT:0};
const AN_TITLE={paragon:'THE SYMBOL OF PEACE',principal:'PRINCIPAL · U.A.-STYLE HERO ACADEMY',crowd:''};
const AN_BIG={explosion:1,transfer:1,lightning:1,shot:1,engine:1,fireice:1,dark:1,decay:1,capture:1,erase:1,ice:1,fire:1,bluefire:1,glass:1,mud:1,aura:1,portal:0,feathers:0,confetti:0};
const AN_SFX={explosion:['ドーン!!','BOOM!'],transfer:['ゴゴゴゴ','!!'],lightning:['バチッ!!','ZZT!'],shot:['バン!','BANG!'],engine:['ブォン!!','VROOM'],fireice:['ゴォッ!!','!!'],fire:['ゴォッ','FWOOSH'],bluefire:['ゴォッ','FWOOSH'],
  ice:['パキィン!','KRAK!'],dark:['ゴゴゴ','...'],decay:['ザァァ','...'],capture:['シュン!','!'],erase:['キッ!','!'],glass:['パリン!','PING'],mud:['ドロッ','SPLAT'],aura:['ドンッ!','!!'],portal:['ズズ','...'],enter:['ザッ!','!'],land:['ドォン!!','SLAM!']};
function anCard(id){const S=spkInfo(id);if(!S||!S.name||AN.seen[id])return;AN.seen[id]=1;const h=HEROES[heroIdx(id)];
  const sub=AN_TITLE[id]!==undefined?AN_TITLE[id]:(h?'POWER · '+String(h.power||h.cls||'').toUpperCase():'');const el=$('cutCard');
  el.style.setProperty('--c',S.css);el.querySelector('b').textContent=S.name;el.querySelector('span').textContent=sub;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');AN.cardT=2.1;clearTimeout(anCard.tm);anCard.tm=setTimeout(()=>el.classList.remove('on'),2300);}
function anSfx(key,css){const L=AN_SFX[key];if(!L)return;const box=$('cutSfx'),d=document.createElement('div');d.textContent=L[0];
  d.style.left=(14+Math.random()*52)+'vw';d.style.top=(16+Math.random()*30)+'vh';d.style.setProperty('--r',(Math.random()*24-12)+'deg');d.style.setProperty('--c',css||'#ff3a3a');
  box.appendChild(d);setTimeout(()=>d.remove(),1200);}
function anHit(big,css){AN.imp=big?.14:0;AN.shake=big?.35:.15;AN.zoom=1;AN.spd=1;AN.spdW=big?1:0;AN.rollT=(Math.random()<.5?-1:1)*(big?.17:.11);}
function anDraw(dt){const cv=$('cutFx');if(!cv)return;const w=innerWidth,h=innerHeight;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}const g=cv.getContext('2d');
  if(AN.spd<=.02){if(cv.__k){g.clearRect(0,0,w,h);cv.__k=0;}return;}AN.sw-=dt;if(AN.sw>0&&cv.__k)return;AN.sw=1/24;cv.__k=1;g.clearRect(0,0,w,h);// lines redraw at 24fps, like hand-drawn frames
  const cx=AN.cx*w,cy=AN.cy*h,Rr=Math.hypot(w,h),r0=Math.min(w,h)*(.26+.14*(1-AN.spd));
  const pass=(col,n,wid)=>{g.fillStyle=col;g.beginPath();for(let i=0;i<n;i++){const a=Math.random()*6.2832,wd=wid*(.3+Math.random()),r1=r0+Math.random()*r0*.7;
    g.moveTo(cx+Math.cos(a-wd)*Rr,cy+Math.sin(a-wd)*Rr);g.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);g.lineTo(cx+Math.cos(a+wd)*Rr,cy+Math.sin(a+wd)*Rr);}g.fill();};
  g.globalAlpha=Math.min(.9,AN.spd);pass('#05050a',110,.011);if(AN.spdW>0){g.globalAlpha=Math.min(.75,AN.spd*AN.spdW);pass('#ffffff',50,.006);}g.globalAlpha=1;}
function cineStart(sc){cineEnd(true);CINE.on=true;window.__cineOn=true;CINE.t=0;CINE.A={};CINE.X=[];CINE.first=true;Object.assign(AN,{spd:0,imp:0,shake:0,roll:0,rollT:0,zoom:0,push:0,seen:{}});
  if(sc.where==='train'){setWorld('train');CINE.o.set(0,0,0);}else{setWorld('city');CINE.o.set(sc.where[0],0,sc.where[1]);}
  sc.actors.forEach(([id,dx,dz,hid])=>{const h=npcHero(id)||HEROES[heroIdx(id)];if(!h)return;const R=buildRig(h);if(R.whip)R.whip.group.visible=false;if(R.beam)R.beam.group.visible=false;if(R.frame)R.frame.visible=false;
    const x=CINE.o.x+dx,z=CINE.o.z+dz;R.root.position.set(x,floorAt(x,z,2),z);scene.add(R.root);R.root.visible=!hid;
    CINE.A[id]={id,R,h,P:Object.assign({},POSES.relaxed),pose:'relaxed',face:dz>2?Math.PI:0,hidden:!!hid};});
  const c=cineCenter();for(const k in CINE.A){const A=CINE.A[k],p=A.R.root.position;A.face=Math.atan2(c.x-p.x,c.z-p.z);}}
function cineEnd(keepWorld){if(window.FINAL){FINAL.uniforms.anime.value=0;FINAL.uniforms.impact.value=0;}AN.spd=0;try{anDraw(0);$('cutCard').classList.remove('on');$('cutSfx').innerHTML='';}catch(e){}camera.up.set(0,1,0);for(const k in CINE.A){const R=CINE.A[k].R;scene.remove(R.root);}CINE.X.forEach(m=>scene.remove(m));CINE.A={};CINE.X=[];if(CINE.on&&!keepWorld)setWorld('city');CINE.on=false;window.__cineOn=false;}
function cineCenter(){const v=Object.values(CINE.A).filter(a=>!a.hidden);const c=new V3();if(!v.length)return c.copy(CINE.o);v.forEach(a=>c.add(a.R.root.position));return c.multiplyScalar(1/v.length);}
function headOf(A,v){A.R.root.updateMatrixWorld(true);return A.R.head.getWorldPosition(v||new V3());}
function chestOf(A){const p=A.R.root.position;return new V3(p.x,p.y+1.25*A.h.scale,p.z);}
function cineLine(L){const [sp,,o]=L;const A=CINE.A[sp]||null;CINE.sp=A;
  (o.enter||[]).forEach(id=>{const B=CINE.A[id];if(B&&B.hidden){B.hidden=false;B.R.root.visible=true;const to=B.R.root.position.clone(),c=cineCenter();let d=to.clone().sub(c);d.y=0;if(d.lengthSq()<.01)d.set(0,0,1);d.normalize();
    B.run={from:to.clone().addScaledVector(d,7.5),to,t:0,leap:id==='paragon'||id==='warp'||id==='entropy'?1:0,ph:0};B.R.root.position.copy(B.run.from);if(B.run.leap)B.R.root.position.y+=6;}});
  for(const k in CINE.A)CINE.A[k].pose='relaxed';if(A)A.pose=o.pose==='idle'?'relaxed':(o.pose||'talk');
  // anime beats: first-time name card, shouted lines get speed lines + smash zoom, big powers get an impact frame and SFX
  const txt=L[1]||'',css=A?A.h.css:'#ffd23f',loud=/!/.test(txt)||/^[^a-z]*[A-Z]{4}/.test(txt);
  if(A&&!(o.enter||[]).includes(sp))anCard(sp);AN.push=0;AN.rollT=CINE.shot==='wide'?0:(Math.random()<.5?-1:1)*.05;
  if(o.fx&&AN_BIG[o.fx]!==undefined){const big=!!AN_BIG[o.fx];anHit(big,css);if(big||Math.random()<.5)anSfx(o.fx,css);}else if(loud){anHit(false,css);AN.imp=0;}
  if(o.fx){const T=CINE.A[o.at]||A;if(T)cineFx(o.fx,T,A);}
  (o.exit||[]).forEach(id=>{const B=CINE.A[id];if(!B)return;setTimeout(()=>{if(!CINE.on||B.hidden)return;portal(chestOf(B),1.3,true,1);B.hidden=true;B.R.root.visible=false;},900);});
  CINE.shot=o.cam||(A?'close':'wide');if(CINE.shot==='wide')AN.rollT*=.3;CINE.focus=o.cam==='close'&&o.at?CINE.A[o.at]:A;if(CINE.shot==='close'&&!CINE.focus)CINE.shot='wide';CINE.cut=true;}
function cineFx(fx,T,S){const c=chestOf(T),p=T.R.root.position,col=T.h.color,acc=T.h.accent;const snd=f=>{AU.scale=.8;try{f();}catch(e){}AU.scale=1;};
  switch(fx){
    case 'aura':ring(new V3(p.x,p.y+.15,p.z),acc,2.2,.6,true,1.6);burst(ADD,c,26,{colors:[col,acc,0xffffff],speed:1.6,up:3.5,life:.8,size:.2,size1:0,bright:1.6,rad:.5});flashLight(c,col,5);snd(()=>AU.swell(.5,.3,'bandpass',300,2400,2));break;
    case 'transfer':{const P=CINE.A.paragon;if(P){const a=chestOf(P);cutLine(a,c,0xffd23f,.18,1.2);cutLine(a,c,0xffffff,.07,1.2);}implode(c,36,1.4,[0xffd23f,0xffffff],.6,1.8);setTimeout(()=>{if(CINE.on){burst(ADD,c,40,{colors:[0xffd23f,0xffffff,0x3a8aff],speed:4,life:.6,size:.22,size1:0,bright:1.8});flashLight(c,0xffd23f,8);}},700);
      snd(()=>{AU.tone('sine',220,880,1,.08);AU.swell(1,.3,'bandpass',200,3000,2);});break;}
    case 'explosion':{const q=c.clone().add(new V3(Math.sin(T.face)*.8,0,Math.cos(T.face)*.8));burst(ADD,q,30,{colors:[0xff7a1a,0xffd23f,0xffffff],speed:4,life:.4,size:.3,size1:0,bright:2});burst(SMK,q,10,{colors:[0x3a3a3a,0x5a5a5a],speed:2,up:2,life:.8,size:.4,size1:.8});flashLight(q,0xff7a1a,8);snd(()=>AU.boom(false));break;}
    case 'portal':portal(c,1.3,true,1.2);snd(()=>AU.swell(.6,.3,'lowpass',800,200,1));break;
    case 'decay':burst(ADD,c,50,{colors:[0x8a8a96,0x5a3a6a,0xcfd6e6],speed:2.5,up:1.5,life:1.2,size:.3,size1:0,bright:1.4,rad:.8});ring(new V3(p.x,p.y+.15,p.z),0x5a3a6a,2.6,.8,true,1.4);snd(()=>AU.crackle(.8,.12,30));break;
    case 'erase':{const h=headOf(T);ring(h,0xff2a4a,.7,.5,false,1.8);flashLight(h,0xff2a4a,4);snd(()=>AU.tone('sine',3200,3200,.6,.04));break;}
    case 'confetti':for(let k=0;k<6;k++)burst(ADD,new V3(p.x+rand(-4,4),p.y+.3,p.z+rand(-4,4)),18,{colors:[0xff5aa8,0x5af0ff,0xffd23f,0x7dff8a,0xffffff],speed:4,up:10,life:1.6,size:.22,size1:.18,grav:6,bright:1.8});snd(()=>AU.bell());break;
    case 'ice':for(let k=0;k<7;k++){const a=k/7*6.28+T.face;iceSpike(p.x+Math.sin(a)*1.6,p.z+Math.cos(a)*1.6,.7,2.4);}burst(ADD,c,25,{colors:[0xcff4ff,0xffffff],speed:3,life:.6,size:.25,size1:0,bright:1.8});snd(()=>SND.frostfire.freeze());break;
    case 'fire':case 'bluefire':{const cs=fx==='fire'?[0xff5a1f,0xffb347,0xffffff]:[0x2a6aff,0x7ad8ff,0xffffff];for(let k=0;k<3;k++)burst(ADD,c,22,{colors:cs,speed:1.8,up:4,life:.6,size:.3,size1:0,bright:1.8,rad:.6});flashLight(c,cs[0],6);snd(()=>AU.swell(.6,.35,'lowpass',2000,300,1));break;}
    case 'fireice':cineFx('ice',T,S);cineFx('fire',T,S);break;
    case 'lightning':for(let k=0;k<4;k++){const a=new V3(c.x+rand(-1,1),c.y+rand(0,1.5),c.z+rand(-1,1));cutLine(c,a.clone().add(new V3(rand(-1.5,1.5),rand(-.5,1.5),rand(-1.5,1.5))),0xffe03a,.05,.3);}flashLight(c,0xffe03a,12);burst(ADD,c,20,{colors:[0xffe03a,0xffffff],speed:6,life:.25,size:.2,size1:0,bright:2.6});snd(()=>AU.crackle(.4,.25,60));break;
    case 'dark':implode(c,40,2,[0x3a1a5a,0x8a3aff,0x000000],.6,1.4);ring(new V3(p.x,p.y+.2,p.z),0x6a3acf,2.6,.6,true,1.5);snd(()=>AU.sub(70,40,.8,.5));break;
    case 'glass':burst(ADD,c,30,{colors:[0xeaf8ff,0xffffff,acc],speed:4,life:.5,size:.2,size1:0,bright:2.4});snd(()=>SND.glass.spec());break;
    case 'mud':burst(SMK,new V3(p.x,p.y+.8,p.z),40,{colors:[0x4a3a2a,0x6a5a48,0x2a2018],speed:4,up:2,life:.9,size:.5,size1:.1,grav:8});snd(()=>SND.mud.spec());break;
    case 'shot':{const f=new V3(Math.sin(T.face),0,Math.cos(T.face)),a=c.clone().add(new V3(0,.2,0)).addScaledVector(f,.8);cutLine(a,a.clone().addScaledVector(f,30),acc,.06,.35);flashLight(a,0xffd08a,10);snd(()=>SND.rifle.shot());break;}
    case 'engine':burst(ADD,new V3(p.x,p.y+.5,p.z),40,{colors:[0xffb03a,0xff5a1f,0xffffff],speed:4,life:.5,size:.4,size1:0,bright:2.4,rad:.4});snd(()=>SND.engine.dash());break;
    case 'feathers':burst(ADD,c,30,{colors:[0xff4a5a,0xffd0d8,0xffffff],speed:5,up:3,life:1,size:.3,size1:.1,grav:3,bright:1.8});break;
    case 'capture':{const M=CINE.A.marble;const m=marbleMesh(0x7ad8ff);m.scale.setScalar(.6);m.position.copy(c);scene.add(m);CINE.X.push(m);implode(c,24,1.2,[0x7ad8ff,0xffffff],.4,1.8);T.hidden=true;T.R.root.visible=false;snd(()=>SND.glass.spec());
      if(M){m.userData.to=M;m.userData.t=0;}break;}}}
function cineUpdate(dt){CINE.t+=dt;const t=CINE.t,sp=CINE.sp;updIce(dt);
  for(const k in CINE.A){const A=CINE.A[k];if(A.hidden)continue;const p=A.R.root.position;
    // speakers turn to the group, everyone else turns to the speaker
    if(A.run){const r=A.run;r.t=Math.min(1,r.t+dt/(r.leap?.75:.8));const e=r.leap?r.t:1-Math.pow(1-r.t,1.6);p.lerpVectors(r.from,r.to,e);if(r.leap)p.y=r.to.y+Math.sin(r.t*Math.PI)*2.5+(1-r.t)*6*(1-r.t);
      A.face=Math.atan2(r.to.x-r.from.x,r.to.z-r.from.z);A.R.root.rotation.y=A.face;r.ph+=dt*16;const S=Math.sin(r.ph),C=Math.cos(r.ph);
      const T=r.leap?POSES.jump||POSES.relaxed:Object.assign({},BASE,{hy:-.06+Math.abs(C)*.08,sx:.5,hd:-.15,lSx:-S*1.2-.35,rSx:S*1.2-.35,lE:-1.5,rE:-1.5,lSz:.18,rSz:-.18,lHx:S*1.2-.15,rHx:-S*1.2-.15,lK:.25+Math.max(0,Math.sin(r.ph+1.3))*1.4,rK:.25+Math.max(0,Math.sin(r.ph+Math.PI+1.3))*1.4});
      for(const q in T)A.P[q]+=(T[q]-A.P[q])*Math.min(1,14*dt);poseRig(A.R,A.P,t);if(!r.leap&&Math.random()<dt*12)dust(p,2,.4);
      if(r.t>=1){A.run=null;const c=chestOf(A);if(r.leap){ring(new V3(p.x,p.y+.15,p.z),A.h.color,3,.5,true,1.8);dust(p,16,1.3);anHit(true,A.h.css);anSfx('land',A.h.css);try{AU.boom(false);}catch(e){}}
        else{dust(p,10,.9);ring(new V3(p.x,p.y+.15,p.z),A.h.color,1.6,.35,true,1.4);AN.shake=.12;anSfx('enter',A.h.css);}
        burst(ADD,c,20,{colors:[A.h.color,A.h.accent,0xffffff],speed:3,life:.45,size:.2,size1:0,bright:1.6});anCard(A.id);}
      continue;}
    let want=A.face;if(sp&&!sp.hidden&&A!==sp){want=Math.atan2(sp.R.root.position.x-p.x,sp.R.root.position.z-p.z);}else if(A===sp){const o=Object.values(CINE.A).filter(b=>b!==A&&!b.hidden);if(o.length){const c=new V3();o.forEach(b=>c.add(b.R.root.position));c.multiplyScalar(1/o.length);want=Math.atan2(c.x-p.x,c.z-p.z);}}
    A.face=angLerp(A.face,want,Math.min(1,4*dt));A.R.root.rotation.y=A.face;
    let T=POSES[A.pose];if(A.pose==='talk'){const g=Math.sin(t*5+A.face)*.5+.5;T=Object.assign({},POSES.relaxed,{rSx:-.5-g*.5,rE:-1.1,rSz:-.25,sy:.12*Math.sin(t*2.6),hd:.05*Math.sin(t*7)});}
    if(!T)T=POSES.relaxed;const k2=Math.min(1,8*dt);for(const q in T)A.P[q]+=(T[q]-A.P[q])*k2;poseRig(A.R,A.P,t);}
  CINE.X.forEach(m=>{if(m.userData.to){m.userData.t=Math.min(1,m.userData.t+dt*.8);const M=m.userData.to;M.R.root.updateMatrixWorld(true);const h=M.R.rF.getWorldPosition(new V3());h.y+=.25;m.position.lerp(h,m.userData.t*.2);}m.rotation.y+=dt*2;});
  // camera
  if(CINE.shot==='close'&&CINE.focus&&!CINE.focus.hidden){const F=CINE.focus,H=headOf(F),f=new V3(Math.sin(F.face),0,Math.cos(F.face)),sd=new V3(Math.cos(F.face),0,-Math.sin(F.face)),S=F.h.scale;
    CINE.camT.copy(H).addScaledVector(f,2.9*S).addScaledVector(sd,1.0*S);CINE.camT.y+=.12;CINE.lookT.copy(H).addScaledVector(sd,-.35*S);CINE.lookT.y-=.18*S;}
  else{const c=cineCenter(),a=.55+Math.sin(t*.08)*.35,r=8.5;CINE.camT.set(c.x+Math.sin(a)*r,c.y+3.4,c.z-Math.cos(a)*r*.35+1.2);CINE.lookT.set(c.x,c.y+1.3,c.z+.5);}
  if(CINE.first){CINE.cam.copy(CINE.camT);CINE.look.copy(CINE.lookT);CINE.first=false;}
  const k=CINE.cut?1-Math.exp(-6*dt):1-Math.exp(-2.5*dt);if(CINE.cut&&CINE.cam.distanceTo(CINE.camT)<.3)CINE.cut=false;CINE.cam.lerp(CINE.camT,k);CINE.look.lerp(CINE.lookT,k);
  // push-in, smash zoom, shake and dutch angle on top of the base shot
  AN.push=Math.min(1,AN.push+dt*.12);AN.zoom=Math.max(0,AN.zoom-dt*1.6);AN.shake=Math.max(0,AN.shake-dt*1.3);AN.imp=Math.max(0,AN.imp-dt);AN.spd=Math.max(0,AN.spd-dt*.75);AN.cardT=Math.max(0,AN.cardT-dt);
  AN.roll+=(AN.rollT-AN.roll)*Math.min(1,(AN.zoom>.8?20:3)*dt);
  const sz=AN.zoom>0?Math.pow(AN.zoom,.5):0,fov=46-AN.push*5-sz*12;if(Math.abs(camera.fov-fov)>.05){camera.fov=fov;camera.updateProjectionMatrix();}
  const sh=AN.shake*AN.shake;camera.position.copy(CINE.cam).add(new V3(rand(-1,1)*sh,rand(-1,1)*sh,rand(-1,1)*sh));camera.up.set(Math.sin(AN.roll),Math.cos(AN.roll),0).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new V3(0,1,0),Math.atan2(CINE.look.x-CINE.cam.x,CINE.look.z-CINE.cam.z)));
  camera.lookAt(CINE.look);camLook.copy(CINE.look);
  const F=CINE.focus||CINE.sp;if(F&&!F.hidden){const v=headOf(F).project(camera);AN.cx+=((v.x+1)/2-AN.cx)*.2;AN.cy+=((1-v.y)/2-AN.cy)*.2;}else{AN.cx+=(.5-AN.cx)*.2;AN.cy+=(.45-AN.cy)*.2;}
  if(window.FINAL){FINAL.uniforms.anime.value=1;FINAL.uniforms.impact.value=AN.imp>.07?1:(AN.imp>0?.0:0);}
  anDraw(dt);}
/* ---- dialogue box over the scene ---- */
let CUT=null;
function cutscene(lines,done,scene,ep){if(!lines||!lines.length){done();return;}if(AU.setTheme&&AU.ctx)AU.setTheme(CAMP().music);if(ep){const E=$('cutEp');E.querySelector('small').textContent=ep[0];E.querySelector('b').textContent=ep[1];E.classList.remove('on');E.onanimationend=()=>E.classList.remove('on');requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>E.classList.add('on'))));try{AU.swell(.8,.3,'bandpass',200,2400,2);}catch(e){}}if(scene)cineStart(scene);$('cut').classList.toggle('cine',!!scene);CUT={lines,i:-1,done,tt:0};$('cut').classList.add('on');cutNext();}
function cutNext(){if(!CUT)return;const C=CUT;
  if(C.i>=0&&C.typing){C.typing=false;$('cutTxt').textContent=C.lines[C.i][1];return;}
  C.i++;if(C.i>=C.lines.length){cutEnd();return;}
  const [sp,txt]=C.lines[C.i],S=spkInfo(sp);if(CINE.on)cineLine(C.lines[C.i]);
  $('cutName').textContent=S.name;$('cutName').style.color=S.css;$('cutBox').style.setProperty('--c',S.css);$('cutBox').classList.toggle('narr',sp==='narr');
  $('cutImg').innerHTML=S.img?`<img src="${S.img}" alt="">`:(S.em?`<div class="cem" style="color:${S.css}">${S.em}</div>`:'');$('cutImg').style.display=sp==='narr'?'none':'';
  C.typing=true;let k=0;$('cutTxt').textContent='';clearInterval(C.iv);C.iv=setInterval(()=>{if(!C.typing){clearInterval(C.iv);return;}k+=2;$('cutTxt').textContent=txt.slice(0,k);if(k>=txt.length){C.typing=false;clearInterval(C.iv);}},16);AU.ui();}
function cutEnd(){if(!CUT)return;const d=CUT.done;clearInterval(CUT.iv);CUT=null;$('cut').classList.remove('on');cineEnd();d();}
$('cut').onclick=e=>{if(e.target.id==='cutSkip'){cutEnd();return;}cutNext();};
addEventListener('keydown',e=>{if(!CUT)return;if(e.code==='Space'||e.code==='Enter'){e.preventDefault();cutNext();}else if(e.code==='Escape'){cutEnd();}},true);

/* ---- missions ---- */
function storyChapter(i){STG.ch=i;STG.st=0;const c=CAMPA()[i];showScreen(null);cutscene(c.pre,()=>storyStage(),c.sPre,[CAMP().ep+' '+(i+1),c.t]);}
function storyStage(){const c=CAMPA()[STG.ch],S=c.stages[STG.st];cutscene(S.pre||[],()=>storyStart(S),S.sPre);}
function storyStart(S){AU.init();store.set('surge.name',myName());netShutdown();NET.role='off';NET.myId=0;
  STG.S=S;const cos=myCos(),R=[{id:0,name:myName(),bot:false,team:0,hero:S.playerIdx!=null?S.playerIdx:heroIdx(S.player),cos}];
  (S.allies||[]).forEach((a,k)=>R.push({id:100+k,name:(npcHero(a)||HEROES[heroIdx(a)]).name,hero:Math.max(0,heroIdx(a)),bot:true,team:0}));
  if(S.playerIdx!=null&&S.playerIdx>=CUST0&&CSPECS[S.playerIdx-CUST0])R[0].cust=CSPECS[S.playerIdx-CUST0];
  (S.allies||[]).forEach((a,k)=>{const r=R[1+k];if(r&&npcHero(a))r.heroObj=npcHero(a);});
  S.enemies.forEach((e,k)=>R.push({id:200+k,name:e.name||(npcHero(e.h)||HEROES[heroIdx(e.h)]).name,hero:Math.max(0,heroIdx(e.h)),heroObj:npcHero(e.h)||undefined,bot:true,team:1}));
  // heroes start together on a street; the enemies wait down the road
  const a=INNER[1+Math.floor(Math.random()*(INNER.length-2))],b=INNER[1+Math.floor(Math.random()*(INNER.length-2))],sw=[];
  R.forEach((r,k)=>{if(r.team===0)sw.push([a+(k%3-1)*2.5,b-14+Math.floor(k/3)*2]);else{const j=k-(1+(S.allies||[]).length);sw.push([a+(j%3-1)*3,b+14+Math.floor(j/3)*3]);}});
  game._storyNext={S};startMatch(R,sw,S.diff==null?1:S.diff,'solo','br');
  STG.on=true;STG.over=false;STG.boss=null;STG.flee=0;
  FS.forEach(f=>{if(f.team!==1)return;const e=S.enemies[f.id-200];f.take=e.take||1;f.flee=e.flee||0;f.boss=!!e.boss;f.face=Math.atan2(-(f.pos.x-a),-(f.pos.z-(b-14)));if(f.boss)STG.boss=f;});
  FS.forEach(f=>{if(f.team===0)f.face=0;});if(ME)camYaw=0;
  if(S.setup)S.setup(a,b);
  setTimeout(()=>{if(STG.on&&S.goal)announceSmall(S.goal.toUpperCase());},3800);}
function storyEnemies(){return FS.filter(f=>f.team===1);}
function storyTick(dt){if(!game.story||!STG.on||game.phase!=='fight'||STG.over)return;
  for(const f of storyEnemies()){if(f.dead||!f.flee||f.hp>f.flee*100)continue;
    // this villain escapes through a portal once beaten down enough
    f.fled=true;f.dead=true;f.vel.set(0,0,0);portal(f.chest(new V3()),2.4,true,1.2);if(f.pet)f.pet.visible=false;f.rig.root.visible=false;feed(`<b style="--c:${f.hero.css}">${esc(f.name)}</b> escaped through a portal!`);
    announceSmall(f.name+' ESCAPED!');AU.tone('sine',300,1400,.45,.08);}
  const B=STG.boss,bb=$('bossBar');if(B){bb.classList.add('on');$('bossName').textContent=B.name;$('bossFill').style.width=Math.max(0,B.hp)+'%';$('bossFill').style.background=B.hero.css;}else bb.classList.remove('on');
  const S=STG.S;if(S&&S.tick){const r=S.tick(dt);if(r===true||r===false){storyEnd(r);return;}}
  if(ME&&ME.dead){storyEnd(false);return;}
  if(!(S&&S.custom)&&storyEnemies().every(f=>f.dead))storyEnd(true);}
function storyEnd(win){if(STG.over)return;STG.over=true;emitEv('missionEnd',win,STG.S);game.phase='over';game.slowT=1.2;$('bossBar').classList.remove('on');if(STG.S&&STG.S.end)STG.S.end(win);
  announce(win?(STG.S&&STG.S.winText||'MISSION CLEAR'):(STG.S&&STG.S.loseText||'MISSION FAILED'),win?'#ffd23f':'#ff4a3f');AU.scale=1;win?AU.bell():AU.ko();
  setTimeout(()=>{const c=STG.S&&STG.S.done?null:CAMPA()[STG.ch],S0=STG.S;STG.on=false;endMatchCleanup();$('hud').classList.remove('on');$('hint').style.display='none';
    if(S0&&S0.done){S0.done(win);return;}
    if(!win){storyFailPanel();return;}
    STG.st++;if(STG.st<c.stages.length){storyStage();return;}
    cutscene(c.post,()=>{const first=storyDone(STG.ch);if(first)addPoints(50,'STORY');showStory();if(first&&STG.ch<CAMPA().length-1)announceSmall('CHAPTER '+(STG.ch+2)+' UNLOCKED');},c.sPost);},2600);}
function storyFailPanel(){showScreen('story');$('storyList').innerHTML=`<div class="stfail"><div class="stt">MISSION FAILED</div><div class="stl">${CAMPA()[STG.ch].t} · ${CAMPA()[STG.ch].stages[STG.st].goal}</div>
  <div class="rowb" style="margin-top:16px"><button class="btn cy" id="stRetry">RETRY</button><button class="btn" id="stBack">CHAPTERS</button></div></div>`;
  $('stRetry').onclick=()=>{AU.ui();showScreen(null);storyStart(CAMPA()[STG.ch].stages[STG.st]);};$('stBack').onclick=()=>{AU.ui();showStory();};}
window.__story={STG,CAMPS,storyStart,cutNext,cutEnd,CINE};
