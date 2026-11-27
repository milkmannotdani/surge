/* UNIQUE BASIC ATTACKS — every fighter has their own light combo, finisher and heavy, plus swing trails in their colors
   and hits that land with their element (fire embers, ice shards, sparks, splashes, dust, fear smoke…).
   Built from move pieces (TPL) per fighter (UATK spec):  c = light combo, h = heavy, sp = speed, fx = hit effect.
   Total combo damage is kept close to the default so longer, faster combos hit softer per hit.
   Umbra, Ronin, Scathe, Marrow, Piston and Recoil keep their own weapon combos (shadow claws, sword, claws, whips/blades,
   kicks, shots) — they just get the swing trails and hit effects too. */
const TPL={
  jR:{st:.07,ac:.07,rc:.17,dmg:4,rng:1.75,kb:2.4,up:0,stun:.34,lunge:3.5,w:'jabRw',h:'jabRh',limb:'r'},
  jL:{st:.07,ac:.07,rc:.19,dmg:4,rng:1.75,kb:2.4,up:0,stun:.36,lunge:3.5,w:'jabLw',h:'jabLh',limb:'l'},
  pa:{st:.09,ac:.08,rc:.2,dmg:4.5,rng:1.9,kb:4,up:0,stun:.38,lunge:3,w:'jabRw',h:'point',limb:'r'},
  bk:{st:.08,ac:.08,rc:.19,dmg:4,rng:1.9,kb:3,up:0,stun:.36,lunge:3.5,w:'jabLw',h:'slashL',limb:'l'},
  el:{st:.08,ac:.08,rc:.19,dmg:4,rng:2,kb:3,up:0,stun:.36,lunge:3.8,w:'jabRw',h:'slash',limb:'r'},
  hk:{st:.1,ac:.09,rc:.22,dmg:5,rng:2.1,kb:4,up:2,stun:.4,lunge:4,w:'kickw',h:'kickh',limb:'f'},
  lk:{st:.09,ac:.08,rc:.2,dmg:4.5,rng:2,kb:3,up:0,stun:.4,lunge:3.5,w:'kickw',h:'kickLh',limb:'f'},
  sk:{st:.13,ac:.1,rc:.3,dmg:7,rng:2.3,kb:10,up:5,stun:.45,lunge:4.5,w:'heavyw',h:'kickSpin',limb:'f',launch:true,heavy:true},
  ax:{st:.16,ac:.1,rc:.32,dmg:8,rng:2.1,kb:3,up:0,stun:.6,lunge:3,w:'charge',h:'axeKick',limb:'f',heavy:true},
  up:{st:.12,ac:.1,rc:.3,dmg:7,rng:1.9,kb:4,up:13,stun:.5,lunge:4,w:'heavyw',h:'heavyh',limb:'r',launch:true,heavy:true},
  sm:{st:.3,ac:.1,rc:.45,dmg:13,rng:2.4,kb:14,up:6,stun:.5,lunge:5,w:'heavyw',h:'smashh',limb:'r',launch:true,heavy:true,shock:true},
  cm:{st:.2,ac:.1,rc:.35,dmg:9,rng:3.4,kb:12,up:4,stun:.5,lunge:1.5,w:'charge',h:'command',limb:'r',launch:true,heavy:true,lat:1.5},
  dk:{st:.14,ac:.12,rc:.3,dmg:9,rng:2.2,kb:11,up:6,stun:.5,lunge:10,w:'jump',h:'airh',limb:'f',launch:true,heavy:true},
  ds:{st:.25,ac:.1,rc:.4,dmg:11,rng:2.6,kb:8,up:9,stun:.5,lunge:4,w:'slamAir',h:'slamLand',limb:'f',launch:true,heavy:true,shock:true}};
const UATK={
  cinder:{c:'jR jL sk',h:'cm',fx:'fire'},           riptide:{c:'pa bk pa sk',h:'up',fx:'water'},        gale:{c:'jR hk lk sk',h:'dk',sp:1.15,fx:'wind'},
  nitro:{c:'jR jR up',h:'sm',fx:'blast'},            titan:{c:'el bk up',h:'sm',sp:.85,d:1.15,fx:'earth'},   volta:{c:'jR jL pa cm',h:'dk',sp:1.1,fx:'spark'},
  drift:{c:'pa pa ax',h:'up',fx:'void'},             bastion:{c:'el bk sm',h:'sm',sp:.85,d:1.1,fx:'metal'},  quill:{c:'hk lk ax',h:'dk',sp:1.1,fx:'feather'},
  void:{c:'pa bk cm',h:'cm',fx:'void'},              quake:{c:'jR jL sm',h:'ds',sp:.9,d:1.1,fx:'earth'},     entropy:{c:'bk pa el cm',h:'ds',fx:'decay'},
  sovereign:{c:'bk pa cm',h:'up',fx:'spirit'},       strobe:{c:'jR jL jR jL jR',h:'dk',sp:1.3,fx:'time'},     pyre:{c:'bk jR sk',h:'cm',fx:'bluefire'},
  warp:{c:'pa dk bk',h:'ax',fx:'void'},              hex:{c:'pa bk ax',h:'cm',fx:'curse'},                    solstice:{c:'jR el sk',h:'up',fx:'icefire'},
  snare:{c:'lk hk jR sk',h:'dk',fx:'light'},            marble:{c:'pa bk pa',h:'cm',fx:'crystal'},              legion:{c:'jR jL jR up',h:'dk',sp:1.1,fx:'mud'},
  crimson:{c:'el bk el sk',h:'dk',sp:1.15,fx:'blood'},sawback:{c:'el bk sk',h:'sm',fx:'blade'},              resect:{c:'pa pa up',h:'sm',fx:'redcrackle'},
  cushion:{c:'jR jL sm',h:'sm',sp:.85,d:1.15,fx:'cushion'},corrosa:{c:'hk lk sk ax',h:'dk',sp:1.15,fx:'acid'},  verdict:{c:'el bk el bk',h:'dk',sp:1.2,fx:'blood'},
  decree:{c:'pa jR cm',h:'cm',fx:'gold'},            skitter:{c:'lk lk sk',h:'dk',sp:1.15,fx:'teal'},        oldguard:{c:'el jR jL bk up',h:'sm',fx:'impact'},
  hopstar:{c:'hk lk ax',h:'ds',sp:1.1,fx:'sound'},   headliner:{c:'jR jL up',h:'dk',fx:'gold'},              zanshin:{c:'bk el bk sk',h:'ds',fx:'spirit'},
  dread:{c:'pa bk cm',h:'cm',fx:'dread'}};
const UATK_KEEP={umbra:'shadow',ronin:'blade',scathe:'blade',marrow:'blood',piston:'impact',recoil:'gold'};
// build the moves
(function(){const BASE=15;for(const id in UATK){const S=UATK[id],toks=S.c.split(' '),sp=S.sp||1,d=S.d||1;
  const raw=toks.reduce((a,t)=>a+TPL[t].dmg,0),k=BASE*d/raw*(toks.length>3?1.08:1);
  toks.forEach((t,i)=>{const M=Object.assign({},TPL[t]);M.st/=sp;M.ac/=sp;M.rc/=sp;M.dmg=+(M.dmg*k).toFixed(1);
    const last=i===toks.length-1;if(last){M.launch=true;M.heavy=true;M.kb=Math.max(M.kb,9);M.up=Math.max(M.up,5);}else{delete M.launch;if(t!=='ax')delete M.heavy;delete M.shock;M.kb=Math.min(M.kb,4);M.up=Math.min(M.up,2);}
    if(!last)M.next='u_'+id+'_'+(i+1);MOVES['u_'+id+'_'+i]=M;});
  const H=Object.assign({},TPL[S.h]);H.st=Math.max(.24,H.st/sp);H.ac/=sp;H.rc=Math.max(.36,H.rc/sp);H.dmg=+(Math.max(11,H.dmg)*d).toFixed(1);H.launch=true;H.heavy=true;H.kb=Math.max(H.kb,10);
  H.vfx=2;MOVES['u_'+id+'_H']=H;}})();
const _uaL=Fighter.prototype.lightMove,_uaH=Fighter.prototype.heavyMove;
Fighter.prototype.lightMove=function(){if(this.hero.gear&&this.hero.gear.type!=='none')return _uaL.call(this);const id=KIT(this.hero,'wpn');return UATK[id]?'u_'+id+'_0':_uaL.call(this);};
Fighter.prototype.heavyMove=function(){if(this.hero.gear&&this.hero.gear.type!=='none')return _uaH.call(this);const id=KIT(this.hero,'wpn');return UATK[id]?'u_'+id+'_H':_uaH.call(this);};
// Dread form gets its own set
if(typeof dreadHero==='function'){const _dh=dreadHero;dreadHero=function(b){const D=_dh(b);D.as.wpn='dread';return D;};}

/* ---------- swing trails + element hits ---------- */
const UFX={ofa:[0x2aff6a,0xd8ffe0],fire:[0xff6a1a,0xffd23f],water:[0x2a8aff,0x9ae0ff],wind:[0xd8f4ff,0x8ad8c8],blast:[0xff8a1a,0xffe03a],earth:[0xa8906a,0x6a5a4a],spark:[0xffe03a,0x9ad8ff],
  void:[0x9a6aff,0x2a0a4a],metal:[0xc8d0dc,0x7a8494],feather:[0xfff0e0,0x9ad8ff],decay:[0x8a8290,0x5a5560],spirit:[0x7affd8,0xffffff],time:[0x3fe0c5,0xffffff],
  bluefire:[0x3a8aff,0x9ad8ff],curse:[0x9a2aff,0x5aff8a],icefire:[0xbfefff,0xff6a1a],light:[0xff2a2a,0xe8e8f0],crystal:[0x9ad8ff,0xff9af0],mud:[0x6a4a2a,0x3a2a1a],
  blood:[0xc4102a,0xff3a4a],blade:[0xd8e0e8,0xffffff],redcrackle:[0xff2a3a,0xe8e0d0],cushion:[0xffd23f,0xffa21a],acid:[0xb8ff3a,0x6aff2a],gold:[0xffd86a,0xfff4d8],
  teal:[0x3affc8,0xffffff],impact:[0xffd23f,0xffffff],sound:[0xb06aff,0x6affe0],dread:[0x6a2a9a,0x8aff6a],shadow:[0x5a2a8a,0x1a0a2a]};
function uFxOf(f){const w=KIT(f.hero,'wpn');return (UATK[w]&&UATK[w].fx)||UATK_KEEP[w]||null;}
function limbPos(f,limb,out){const r=f.rig;const n=limb==='l'?r.lF||r.lE:limb==='f'?(r.rK||r.lK):r.rF||r.rE;if(n&&n.getWorldPosition)return n.getWorldPosition(out);return f.chest(out);}
onEv('tick',dt=>{for(const f of FS){if(f.state!=='attack'||!f.move||f.dead){f._sw=null;continue;}const fx=uFxOf(f);if(!fx||!nearCam(f.pos,45))continue;const M=f.move,t=f.stateT;
  if(t>M.st*.6&&t<M.st+M.ac+.04){const p=limbPos(f,M.limb,new V3());if(f._sw&&f._sw.distanceTo(p)<3)trailSeg(f._sw,p,UFX[fx][0],M.heavy?.22:.12,M.heavy?.28:.18);f._sw=p;}else f._sw=null;}});
onEv('hit',(a,d,dmg,o)=>{if(!a||!d||a.state!=='attack'||!nearCam(d.pos,50))return;const fx=uFxOf(a);if(!fx)return;const C=UFX[fx],p=(o&&o.pt)||d.chest(new V3()),big=a.move&&a.move.heavy;
  switch(fx){
    case 'fire':case 'bluefire':case 'blast':burst(ADD,p,big?14:7,{colors:C,speed:3,up:3,life:.4,size:.22,size1:0,bright:2.4});if(fx==='blast'&&big)burst(SMK,p,6,{colors:[0x4a4a4a],speed:2,up:1,life:.7,size:.5,size1:1});break;
    case 'water':burst(ADD,p,big?16:8,{colors:C,speed:4,up:2,life:.45,size:.16,size1:0,bright:1.8,grav:14});break;
    case 'wind':case 'sound':ring(p,C[0],big?2.4:1.4,.25,false,2.2);if(fx==='sound'&&big)glyph(pick(['♪','♫']),p.clone().add(new V3(0,.6,0)),C[0],.5,.7);break;
    case 'earth':case 'mud':dust(d.pos,big?10:4,big?1.2:.7);burst(SMK,p,big?8:4,{colors:C,speed:3,up:2,life:.5,size:.2,size1:.1,grav:14});break;
    case 'spark':for(let i=0;i<(big?4:2);i++){const q=p.clone().add(new V3(rand(-.8,.8),rand(-.6,.8),rand(-.8,.8)));trailSeg(p,q,C[i%2],.05,.18);}break;
    case 'void':case 'curse':case 'decay':case 'shadow':case 'dread':burst(SMK,p,big?12:6,{colors:C,speed:2,up:1.2,life:.6,size:.35,size1:.8});break;
    case 'metal':case 'blade':case 'impact':burst(ADD,p,big?12:6,{colors:C,speed:6,life:.18,size:.1,size1:0,bright:2.8,grav:10});if(big&&typeof impactLines==='function')impactLines(p,0xffffff,8);break;
    case 'feather':for(let i=0;i<(big?6:3);i++)burst(ADD,TMP2.copy(p).add(new V3(rand(-.4,.4),rand(-.2,.4),rand(-.4,.4))),1,{colors:C,speed:1.5,up:1.5,life:.8,size:.18,size1:.1,bright:1.4,grav:2});break;
    case 'spirit':case 'time':case 'light':case 'gold':case 'teal':case 'crystal':ring(p,C[0],big?2:1.2,.22,false,2.4);burst(ADD,p,big?10:5,{colors:C,speed:4,life:.25,size:.18,size1:0,bright:2.6});break;
    case 'icefire':burst(ADD,p,big?12:6,{colors:(a._side||0)%2?[0xbfefff,0xffffff]:[0xff6a1a,0xffd23f],speed:3.5,up:2,life:.35,size:.2,size1:0,bright:2.4});break;
    case 'blood':burst(SMK,p,big?10:5,{colors:C,speed:3,up:1,life:.5,size:.14,size1:.06,grav:16});break;
    case 'redcrackle':if(typeof crackle==='function'&&big)crackle(p,C[0]);burst(ADD,p,5,{colors:C,speed:3,life:.2,size:.15,size1:0,bright:2.4});break;
    case 'cushion':ring(p,C[0],big?2.2:1.3,.25,false,2.2);break;
    case 'acid':burst(ADD,p,big?12:6,{colors:C,speed:2.5,up:2,life:.45,size:.18,size1:0,bright:2,grav:8});break;}});
