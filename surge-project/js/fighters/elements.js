/* Element-based powers */
/* ================= PER-CHARACTER VFX: hits, swing-trail tips, dashes and ambient auras ================= */
const P3=new V3(),P4=new V3();
function elemOf(f){return ELEM[HERO_SND[KIT(f.hero,'elem')]]||ELEM.base;}
function swirl(pt,n,r,cols,spd,life,br){if(!nearCam(pt,80))return;for(let k=0;k<n;k++){const a=rand(0,6.28),h=rand(-.6,.6);const x=pt.x+Math.cos(a)*r,z=pt.z+Math.sin(a)*r;
  _c.setHex(pick(cols));ADD.spawn(x,pt.y+h,z,-Math.sin(a)*spd,rand(-.5,1),Math.cos(a)*spd,_c.r*br,_c.g*br,_c.b*br,life*rand(.7,1.2),.25,0,0,1.5);}}
function implode(pt,n,r,cols,life,br){if(!nearCam(pt,80))return;for(let k=0;k<n;k++){let dx=rand(-1,1),dy=rand(-1,1),dz=rand(-1,1);const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
  _c.setHex(pick(cols));ADD.spawn(pt.x+dx*r,pt.y+dy*r,pt.z+dz*r,-dx*r/life,-dy*r/life,-dz*r/life,_c.r*br,_c.g*br,_c.b*br,life,.28,.05,0,0);}}
const ELEM={
 base:{impact(){},tip(){},dash(){},aura(){}},
 fire:{impact(pt,h){burst(ADD,pt,h?36:16,{colors:[0xfff4c0,0xffc060],end:0xff2a08,speed:h?6:4,up:2.5,life:.55,size:h?.75:.5,size1:.08,drag:2.5,grav:-2.5,bright:2.4,rad:.3});
      sparks(pt,h?22:9,{color:0xffb060,speed:h?15:10,life:.55,grav:9});burst(SMK,pt,h?8:3,{colors:[0x2a2020,0x3a2a24],speed:1.2,up:2,life:1.5,size:.6,size1:2.2,drag:1.5,grav:-.8});},
   tip(p){if(Math.random()<.8)burst(ADD,p,1,{colors:[0xffe0a0],end:0xff3010,speed:.6,up:1.4,life:.35,size:.32,size1:0,bright:2.2});},
   dash(f,s){const c=f.chest(P3);burst(ADD,c,s?22:3,{colors:[0xffe0a0,0xff8a3a],end:0xff2010,speed:s?5:1.2,up:1,life:.45,size:.6,size1:0,bright:2,rad:.4});if(s)ring(c,0xff5a1f,1.8,.25,false,2);},
   aura(){}},
 water:{impact(pt,h){sparks(pt,h?26:12,{color:0x9af0ff,speed:h?10:7,life:.6,grav:14,up:.6,len:.05,bright:2});
      burst(ADD,pt,h?20:8,{colors:[0xdff8ff,0x1fb8ff],end:0x0a4a8a,speed:4,life:.45,size:.35,size1:.05,grav:10,bright:2});
      burst(SMK,pt,h?10:5,{colors:[0xcfefff,0xa8dcf0],speed:3,life:.7,size:.5,size1:1.4,drag:2.5});if(h)ring(P4.set(pt.x,.12,pt.z),0x9af0ff,2.4,.4,true,1.8);},
   tip(p){if(Math.random()<.6)burst(ADD,p,1,{colors:[0xdff8ff],end:0x1fb8ff,speed:.8,life:.4,size:.2,size1:0,grav:12,bright:2});},
   dash(f,s){const c=f.chest(P3);burst(SMK,c,s?14:2,{colors:[0xdff6ff,0xa8dcf0],speed:s?4:1,life:.6,size:.5,size1:1.5,drag:2});if(s)sparks(c,14,{color:0x9af0ff,speed:7,life:.5,grav:14});},
   aura(f){if(Math.random()<.06)burst(ADD,P3.set(f.pos.x+rand(-.3,.3),f.pos.y+rand(.6,1.6),f.pos.z+rand(-.3,.3)),1,{colors:[0x9af0ff],speed:.1,life:.6,size:.12,size1:0,grav:9,bright:2});}},
 wind:{impact(pt,h){swirl(pt,h?26:12,.7,[0xffffff,0xf0ddff,0xb57bff],7,.35,1.8);ring(pt,0xf0ddff,h?2.4:1.4,.25,false,1.8);sparks(pt,h?10:4,{color:0xf0ddff,speed:12,life:.25,grav:0,len:.05,bright:1.6});},
   tip(p){burst(ADD,p,1,{colors:[0xf0ddff],speed:2,life:.25,size:.25,size1:0,bright:1.6});},
   dash(f,s){sparks(f.chest(P3),s?18:3,{color:0xf0ddff,speed:s?12:5,life:.3,grav:0,len:.07,bright:1.6});},
   aura(f){if(f.onGround&&Math.random()<.08)swirl(P3.set(f.pos.x,.3,f.pos.z),1,.6,[0xf0ddff],3,.6,1.2);}},
 blast:{impact(pt,h,a,ns){if(!ns)miniBlast(pt,h?1.3:.8);sparks(pt,h?16:8,{color:0xffc04a,speed:14,life:.5,grav:10});},
   tip(p){if(Math.random()<.5)burst(ADD,p,1,{colors:[0xffe08a],end:0xff4a10,speed:1.5,life:.25,size:.3,size1:0,bright:2.4});},
   dash(f,s){const c=f.chest(P3);burst(ADD,c,s?10:2,{colors:[0xffd04a],end:0xff3010,speed:1,life:.3,size:.5,size1:0,bright:2,rad:.3});burst(SMK,c,1,{colors:[0x2a2526],speed:.5,life:1,size:.5,size1:1.4,drag:1});},
   aura(f){if(Math.random()<.05){const fp=(Math.random()<.5?f.rig.lF:f.rig.rF).getWorldPosition(P3);sparks(fp,2,{color:0xffc04a,speed:2,life:.3,grav:6});}}},
 power:{impact(pt,h){ring(P4.set(pt.x,.1,pt.z),0xcfe4ff,h?4:2.2,.35,true,2);burst(ADD,pt,h?30:14,{colors:[0xffffff,0xcfe4ff],speed:h?14:9,life:.3,size:.3,size1:0,drag:4,bright:2,flat:true});
      burst(SMK,P4.set(pt.x,.2,pt.z),h?14:6,{colors:[0x8a8076,0x6a625a],speed:5,up:.4,life:1,size:.6,size1:1.8,drag:2.5,flat:true});if(h)debris(pt,4,0,6,.18);},
   tip(p){burst(ADD,p,1,{colors:[0xcfe4ff],speed:.5,life:.2,size:.25,size1:0,bright:1.4});},
   dash(f,s){if(s){dust(f.pos,14,1.2);ring(P3.set(f.pos.x,.15,f.pos.z),0xcfe4ff,2.4,.3,true,1.8);}else dust(f.pos,1,.8);},
   aura(){}},
 electric:{impact(pt,h){for(let k=0;k<(h?4:2);k++){const d=new V3(rand(-1,1),rand(-.6,1),rand(-1,1)).normalize().multiplyScalar(rand(1,2));bolt(pt,pt.clone().add(d),0xffe03a,.03,.12);}
      sparks(pt,h?24:12,{color:0xfff6b0,speed:14,life:.35,grav:6,len:.03,bright:3});},
   tip(p){if(Math.random()<.35)bolt(p,p.clone().add(new V3(rand(-.3,.3),rand(-.3,.3),rand(-.3,.3))),0xffe03a,.015,.06);},
   dash(f,s){const c=f.chest(P3);if(s||Math.random()<.5)bolt(c,c.clone().add(new V3(rand(-1.2,1.2),rand(-.6,.6),rand(-1.2,1.2))),0xffe03a,.02,.08);if(s)sparks(c,14,{color:0xfff6b0,speed:10,life:.3,grav:4});},
   aura(){}},
 shadow:{impact(pt,h){burst(SMK,pt,h?20:10,{colors:[0x0a0814,0x1a1030,0x2a1a5a],speed:h?5:3.5,life:.7,size:.5,size1:1.4,drag:2.5});
      burst(ADD,pt,h?14:6,{colors:[0xd8c4ff,0x7a4cff],end:0x1a0a40,speed:6,life:.35,size:.25,size1:0,bright:2});},
   tip(p){burst(SMK,p,1,{colors:[0x0a0814,0x2a1a5a],speed:.4,life:.6,size:.35,size1:.8,drag:1});},
   dash(f,s){burst(SMK,f.chest(P3),s?18:3,{colors:[0x0a0814,0x2a1a5a],speed:s?4:1,life:.8,size:.6,size1:1.6,drag:2});},
   aura(){}},
 gravity:{impact(pt,h){orb(pt,0xb58cff,h?1.6:1,.35,.9);ring(pt,0xf2e8ff,h?2.2:1.4,.35,false,1.6);
      burst(ADD,pt,h?14:7,{colors:[0xf2e8ff,0xb58cff],speed:1.2,up:1.6,life:.9,size:.2,size1:0,drag:1,grav:-.5,bright:1.8});},
   tip(p){burst(ADD,p,1,{colors:[0xf2e8ff],speed:.3,up:.6,life:.5,size:.2,size1:0,bright:1.6});},
   dash(f,s){const c=f.chest(P3);if(s)orb(c,0xb58cff,1.2,.3,.8);burst(ADD,c,s?10:2,{colors:[0xf2e8ff,0xb58cff],speed:1,up:.8,life:.6,size:.25,size1:0,bright:1.6,rad:.5});},
   aura(){}},
 metal:{impact(pt,h){sparks(pt,h?40:18,{color:0xffc08a,speed:h?18:13,life:.45,grav:14,len:.04,bright:3});orb(pt,0xffffff,h?.5:.25,.06,3);},
   tip(p){if(Math.random()<.4)sparks(p,1,{color:0xffc08a,speed:4,life:.2,grav:12});},
   dash(f,s){if(s)sparks(P3.set(f.pos.x,.1,f.pos.z),16,{color:0xffc08a,speed:8,life:.4,grav:14,up:.5});else if(f.onGround&&Math.random()<.6)sparks(P3.set(f.pos.x,.05,f.pos.z),2,{color:0xffc08a,speed:4,life:.3,grav:10,up:.6});},
   aura(){}},
 crystal:{impact(pt,h){debris(pt,h?6:3,4,6,.1);burst(ADD,pt,h?24:10,{colors:[0xffd0e0,0xff4f8b,0xffffff],speed:7,life:.4,size:.22,size1:0,drag:3,bright:2.4});
      sparks(pt,h?12:6,{color:0xffe0ea,speed:10,life:.3,grav:4,len:.03});},
   tip(p){burst(ADD,p,1,{colors:[0xffd0e0,0xffffff],speed:.4,life:.3,size:.18,size1:0,bright:2.4});},
   dash(f,s){burst(ADD,f.chest(P3),s?16:3,{colors:[0xffd0e0,0xff4f8b],speed:s?4:1,life:.5,size:.3,size1:0,bright:2,rad:.5});},
   aura(f){if(Math.random()<.08){f.rig.spine.getWorldPosition(P3);burst(ADD,P3.set(P3.x+rand(-.6,.6),P3.y+rand(.2,.8),P3.z+rand(-.6,.6)),1,{colors:[0xffffff,0xffd0e0],speed:.1,life:.4,size:.15,size1:0,bright:3});}}},
 rock:{impact(pt,h){debris(pt,h?6:3,1,7,.16);burst(SMK,pt,h?12:6,{colors:[0x7a6650,0x5a4a3a],speed:4,life:.9,size:.5,size1:1.4,drag:2.5,grav:-.3});sparks(pt,h?10:4,{color:0xffe08a,speed:8,life:.3,grav:10});},
   tip(p){if(Math.random()<.3)burst(SMK,p,1,{colors:[0x7a6650],speed:.5,life:.6,size:.3,size1:.6,grav:2});},
   dash(f,s){if(s){dust(f.pos,12,1.2);debris(P3.set(f.pos.x,.3,f.pos.z),3,1,5,.15);}else dust(f.pos,1,.9);},
   aura(f){if(f.onGround&&Math.random()<.04)burst(SMK,P3.set(f.pos.x+rand(-.4,.4),.1,f.pos.z+rand(-.4,.4)),1,{colors:[0x7a6650],speed:.3,up:.4,life:.8,size:.3,size1:.7});}},
 flesh:{impact(pt,h){burst(SMK,pt,h?16:8,{colors:[0x6a0a14,0x8a1020,0x4a0610],speed:5,life:.6,size:.18,size1:.05,grav:14,drag:1});
      burst(ADD,pt,h?10:5,{colors:[0xff3048,0xff8090],end:0x5a0010,speed:4,life:.3,size:.3,size1:0,bright:2});},
   tip(p){if(Math.random()<.4)burst(SMK,p,1,{colors:[0x8a1020],speed:1,life:.5,size:.12,size1:.03,grav:12});},
   dash(f,s){burst(ADD,f.chest(P3),s?14:2,{colors:[0xff3048],end:0x3a0008,speed:s?3:1,life:.4,size:.4,size1:0,bright:1.6,rad:.4});},
   aura(){}},
 decay:{impact(pt,h){burst(SMK,pt,h?18:9,{colors:[0x8a8290,0x5a5560,0x3a363e],speed:3,up:.5,life:1,size:.35,size1:.9,drag:2,grav:2});
      burst(ADD,pt,h?10:5,{colors:[0xc9a0ff],end:0x3a2a5a,speed:3,life:.5,size:.2,size1:0,bright:1.8});},
   tip(p){burst(SMK,p,1,{colors:[0x8a8290,0x5a5560],speed:.4,life:.8,size:.2,size1:.5,grav:1.5});},
   dash(f,s){burst(SMK,f.chest(P3),s?16:3,{colors:[0x8a8290,0x5a5560],speed:s?3:1,life:.9,size:.4,size1:1.1,grav:1});},
   aura(){}},
 theft:{impact(pt,h,a){const to=a.chest(P4);if(nearCam(pt,80))for(let k=0;k<(h?18:9);k++){const p=pt.clone().add(new V3(rand(-.5,.5),rand(-.5,.5),rand(-.5,.5)));const v=to.clone().sub(p).multiplyScalar(rand(1.6,2.4));
        _c.setHex(pick([0x8a3cff,0xe0c8ff]));ADD.spawn(p.x,p.y,p.z,v.x,v.y,v.z,_c.r*2.2,_c.g*2.2,_c.b*2.2,.4,.25,.05,0,0);}orb(pt,0x8a3cff,h?1:.6,.2,1.4);},
   tip(p){burst(ADD,p,1,{colors:[0x8a3cff,0xe0c8ff],speed:.4,life:.35,size:.25,size1:0,bright:2});},
   dash(f,s){burst(ADD,f.chest(P3),s?12:2,{colors:[0x8a3cff,0xe0c8ff],end:0x1a0a3a,speed:s?3:.8,life:.5,size:.45,size1:0,bright:1.8,rad:.4});},
   aura(){}},
 frame:{impact(pt,h){debris(pt,h?5:2,5,6,.1);sparks(pt,h?16:8,{color:0xe8fffb,speed:9,life:.3,grav:6,len:.03});burst(ADD,pt,h?14:6,{colors:[0x3fe0c5,0xe8fffb],speed:5,life:.3,size:.22,size1:0,bright:2.2});},
   tip(p){if(Math.random()<.3)burst(ADD,p,1,{colors:[0xe8fffb],speed:.2,life:.2,size:.2,size1:0,bright:2.4});},
   dash(){},aura(){}},
 bluefire:{impact(pt,h){burst(ADD,pt,h?34:16,{colors:[0xdff2ff,0x5aa8ff],end:0x0a2a8a,speed:h?6:4,up:2.6,life:.55,size:h?.7:.45,size1:.08,drag:2.5,grav:-2.5,bright:2.2,rad:.3});
      sparks(pt,h?18:8,{color:0xaee0ff,speed:11,life:.45,grav:8});},
   tip(p){burst(ADD,p,1,{colors:[0xaee0ff],end:0x1a4aff,speed:.6,up:1.4,life:.35,size:.3,size1:0,bright:2.2});},
   dash(f,s){burst(ADD,f.chest(P3),s?18:3,{colors:[0xaee0ff,0x2a8aff],end:0x0a1a6a,speed:s?5:1.2,up:1,life:.45,size:.6,size1:0,bright:2,rad:.4});},
   aura(){}},
 portal:{impact(pt,h){swirl(pt,h?24:12,.6,[0x6a4aff,0x9ff0ff],5,.4,2);ring(pt,0x9ff0ff,h?2:1.2,.3,false,2);},
   tip(p){burst(SMK,p,1,{colors:[0x2a1a5a,0x4a3a8a],speed:.4,life:.7,size:.35,size1:.9,drag:1});},
   dash(f,s){if(s)portal(f.chest(new V3()),1,false,.4,f.face);burst(SMK,f.chest(P3),s?12:2,{colors:[0x2a1a5a,0x4a3a8a],speed:s?3:.6,life:.8,size:.5,size1:1.2,drag:1.5});},
   aura(){}},
 void:{impact(pt,h){implode(pt,h?26:12,1.3,[0xeaf6ff,0x8ac4ff,0x3a4aff],.28,2.2);ring(pt,0xeaf6ff,h?2.4:1.4,.3,false,1.8);sparks(pt,6,{color:0xeaf6ff,speed:3,life:.6,grav:0,len:.01,bright:3});},
   tip(p){burst(ADD,p,1,{colors:[0xeaf6ff],speed:.2,life:.5,size:.15,size1:0,bright:2.4});},
   dash(f,s){const c=f.chest(P3);if(s)implode(c,18,1.6,[0xeaf6ff,0x8ac4ff],.3,2);burst(ADD,c,2,{colors:[0xeaf6ff,0x8ac4ff],speed:.3,life:.8,size:.15,size1:0,bright:2.4,rad:.5});},
   aura(f){if(Math.random()<.12)burst(ADD,P3.set(f.pos.x+rand(-.7,.7),f.pos.y+rand(.2,2),f.pos.z+rand(-.7,.7)),1,{colors:[0xeaf6ff,0x8ac4ff],speed:.05,life:1,size:.1,size1:0,bright:3});}},
 curse:{impact(pt,h){slashFX(pt,0x5aff8a,h?2.4:1.6);if(h)slashFX(pt,0xd8ffe0,2);burst(ADD,pt,h?12:6,{colors:[0x5aff8a,0xd8ffe0],end:0x0a3a1a,speed:4,life:.4,size:.25,size1:0,bright:2});},
   tip(p){if(Math.random()<.5)burst(ADD,p,1,{colors:[0x5aff8a],speed:.3,life:.4,size:.2,size1:0,bright:2});},
   dash(f,s){burst(ADD,f.chest(P3),s?12:2,{colors:[0x5aff8a,0xd8ffe0],end:0x0a3a1a,speed:s?3:.8,life:.5,size:.35,size1:0,bright:1.8,rad:.4});},
   aura(f){if(Math.random()<.08){const fp=(Math.random()<.5?f.rig.lF:f.rig.rF).getWorldPosition(P3);burst(ADD,fp,1,{colors:[0x5aff8a,0xd8ffe0],speed:.2,up:.5,life:.6,size:.16,size1:0,bright:2});}}},
 blade:{impact(pt,h){slashFX(pt,0xffffff,h?2.8:1.8);slashFX(pt,0xff6060,h?2.2:1.4);sparks(pt,h?18:9,{color:0xffe0e0,speed:12,life:.3,grav:8,len:.03,bright:2.6});},
   tip(){},
   dash(f,s){burst(ADD,f.chest(P3),s?10:2,{colors:[0xff6060,0xffe0e0],speed:s?4:1,life:.35,size:.3,size1:0,bright:2,rad:.4});if(s)slashFX(f.chest(P4),0xffe0e0,2.2);},
   aura(f){if(Math.random()<.025)burst(SMK,P3.set(f.pos.x+rand(-1.5,1.5),f.pos.y+rand(2,3),f.pos.z+rand(-1.5,1.5)),1,{colors:[0xc0303a,0xe05050],speed:.4,life:2.2,size:.14,size1:.12,grav:.5,drag:.5});}},
 demon:{impact(pt,h){slashFX(pt,0xff3a1a,h?2.6:1.8);burst(ADD,pt,h?24:10,{colors:[0xffb08a,0xff4a2a],end:0x3a0000,speed:h?7:5,life:.45,size:.3,size1:0,drag:2.5,bright:2.4});
      sparks(pt,h?14:7,{color:0xff6a4a,speed:12,life:.4,grav:6});burst(SMK,pt,h?6:3,{colors:[0x1a0505,0x2a0a0a],speed:1.5,up:1.5,life:1.2,size:.5,size1:1.5,drag:1.5,grav:-.6});},
   tip(p){if(Math.random()<.7)burst(ADD,p,1,{colors:[0xff6a4a],end:0x5a0000,speed:.5,up:1,life:.4,size:.25,size1:0,bright:2.2});},
   dash(f,s){const c=f.chest(P3);burst(ADD,c,s?18:3,{colors:[0xff6a4a,0xffb08a],end:0x3a0000,speed:s?4:1,up:.6,life:.45,size:.5,size1:0,bright:2,rad:.4});burst(SMK,c,s?8:1,{colors:[0x1a0505],speed:1,life:1,size:.6,size1:1.4,drag:1.5});},
   aura(f){if(Math.random()<.4)burst(ADD,P3.set(f.pos.x+rand(-.5,.5),f.pos.y+rand(0,1.6),f.pos.z+rand(-.5,.5)),1,{colors:[0xff6a4a,0xffb08a],end:0x5a0000,speed:.3,up:1.5,life:1,size:.15,size1:0,bright:2.2});}},
};
function impactFX(att,pt,heavy,noSpark){
  orb(pt,0xffffff,heavy?.55:.28,.09,2);ring(pt,att.hero.color,heavy?2.6:1.3,heavy?.3:.2,false,2.2);if(heavy)ring(pt,att.hero.accent,1.6,.22,false,2);
  flashLight(pt,att.hero.color,heavy?12:5);
  elemOf(att).impact(pt,heavy,att,noSpark);
}
function stepSound(f){const w=f.hero.scale*(f.hero.bulk||1);AU.foot(w,f.sprinting);if(w>1.18){dust(f.pos,1,.6);if(f.sprinting)shake(.04,f.pos);}}

/* ---- SCATHE: delayed cuts, unseen slash lines, ground scars, giant claws ---- */
const CUTS=[];
function updateCuts(){for(let i=CUTS.length-1;i>=0;i--){const c=CUTS[i];if(game.time<c.t)continue;CUTS.splice(i,1);if(c.def.dead||c.att.dead)continue;
  const pt=c.def.chest(new V3());slashFX(pt,0xff3a1a,2.2);slashFX(pt,0xffb08a,1.4);const s=AU.scale;AU.scale=sndAt(pt);SND.demon.cut();AU.scale=s;
  applyHit(c.att,c.def,{dmg:2.4,kb:.6,stun:.22,pt,noSpark:true,cut:true});}}
const [clc,clg]=cv(256,32);{const gr=clg.createLinearGradient(0,0,0,32);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');clg.fillStyle=gr;clg.fillRect(0,0,256,32);
  clg.globalCompositeOperation='destination-out';const g2=clg.createLinearGradient(0,0,256,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.12,'rgba(0,0,0,0)');g2.addColorStop(.88,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');clg.fillStyle=g2;clg.fillRect(0,0,256,32);}
const cutTex=tex(clc);
const CUTL=pool(30,()=>new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:cutTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
const _mb=new THREE.Matrix4();
function cutLine(a,b,color,w,dur){if(!nearCam(a,110)&&!nearCam(b,110))return;const m=CUTL.get();m.visible=true;const mid=a.clone().add(b).multiplyScalar(.5);const x=b.clone().sub(a);const L=x.length()||.01;x.divideScalar(L);
  const toC=camera.position.clone().sub(mid);const z=toC.sub(x.clone().multiplyScalar(toC.dot(x))).normalize();const y=new V3().crossVectors(z,x);
  _mb.makeBasis(x,y,z);m.quaternion.setFromRotationMatrix(_mb);m.position.copy(mid);m.userData={t:0,dur:dur||.3,L,w:w||.25};m.scale.set(.01,.01,1);m.material.color.setHex(color).multiplyScalar(2.6);m.material.opacity=1;}
const [sgc,sgg]=cv(256,32);sgg.strokeStyle='#fff';sgg.lineWidth=3;sgg.shadowColor='#fff';sgg.shadowBlur=6;sgg.beginPath();for(let x=4;x<=252;x+=8)sgg.lineTo(x,16+rand(-5,5)*Math.sin(x/256*Math.PI));sgg.stroke();
const scarTex=tex(sgc);
const SCARS=pool(30,()=>{const g=new THREE.Group();const glow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:scarTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-5}));
  const dark=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:scarTex,transparent:true,depthWrite:false,color:0x120404,polygonOffset:true,polygonOffsetFactor:-4}));
  glow.rotation.x=dark.rotation.x=-Math.PI/2;g.add(dark,glow);return g;});
function groundScar(a,b,color,big){if(!nearCam(a,110))return;const g=SCARS.get();g.visible=true;const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||.01;
  g.position.set((a.x+b.x)/2,.07,(a.z+b.z)/2);g.rotation.set(0,Math.atan2(-dz,dx),0);g.scale.set(L,1,big?1.4:.45);g.children[1].material.color.setHex(color).multiplyScalar(2.4);g.userData={t:0,life:big?5:3};}
let CLAWG=null;
function makeDomClaw(){if(!CLAWG){const g=new THREE.ConeGeometry(.7,7,32,24);g.translate(0,3.5,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/7;p.setZ(i,p.getZ(i)+y*y*3.4);p.setX(i,p.getX(i)*(1-y*.2));}g.computeVertexNormals();CLAWG=g;}
  const grp=new THREE.Group();const m=new THREE.Mesh(CLAWG,new THREE.MeshPhysicalMaterial({color:0x120606,roughness:.25,metalness:.35,clearcoat:1,emissive:0xff2a10,emissiveMap:patternTex('cracks'),emissiveIntensity:1.8}));m.castShadow=true;grp.add(m);
  const sh=new THREE.Mesh(CLAWG,addMat(0xff3a1a,.8,.3));sh.scale.set(1.12,1.02,1.12);grp.add(sh);grp.scale.set(1,.01,1);return grp;}
function updateScathe(dt){
  CUTL.a.forEach(m=>{if(!m.visible)return;const u=m.userData;u.t+=dt;const k=u.t/u.dur;if(k>=1){m.visible=false;return;}m.scale.set(u.L*Math.min(1,k*7),Math.max(.01,u.w*(1-k)),1);m.material.opacity=1-k*k;});
  SCARS.a.forEach(g=>{if(!g.visible)return;const u=g.userData;u.t+=dt;if(u.t>u.life){g.visible=false;return;}const k=u.t/u.life;g.children[1].material.opacity=Math.max(0,1-k*2.2);g.children[0].material.opacity=k>.7?(1-k)/.3:1;});
  updateCuts();
}
SPECIALS.rend=function(f){const t=f.stateT;
  if(!f.fired&&t>.16){f.fired=true;const fw=f.fwd(),c=f.chest(new V3());
    for(let k=0;k<7;k++){const a=(k-3)*.11;const d=fw.clone().applyAxisAngle(UP,a);let L=14;for(let s=1;s<=14;s+=.5){if(insideBld(f.pos.x+d.x*s,f.pos.z+d.z*s,.2,1.2)){L=s;break;}}
      const e=c.clone().addScaledVector(d,L);e.y=c.y+rand(-.4,.6);cutLine(c.clone().addScaledVector(d,.8),e,k%2?0xff3a1a:0xffb08a,.32,.32);
      groundScar(f.pos.clone().addScaledVector(d,1.5),f.pos.clone().addScaledVector(d,L),0xff3a1a);
      props.forEach(pp=>{if(pp.broken)return;const rx=pp.x-f.pos.x,rz=pp.z-f.pos.z,al=rx*d.x+rz*d.z;if(al>0&&al<L&&Math.abs(rx*d.z-rz*d.x)<pp.r+.5)breakProp(pp);});}
    for(const o of FS){if(ally(o,f)||o.dead)continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,d=Math.hypot(dx,dz);if(d>14.5||Math.abs(o.pos.y-f.pos.y)>2.5)continue;
      if(Math.acos(clamp((dx*fw.x+dz*fw.z)/(d||1),-1,1))>.4)continue;if(rayBld(f.chest(new V3()),o.chest(new V3()),12)<1)continue;
      const pt=o.chest(new V3());slashFX(pt,0xff3a1a,2.6);applyHit(f,o,{dmg:9,kb:4,up:2,stun:.65,pt,heavy:true});}
    shake(.3,f.pos);flashLight(c,0xff3a1a,10);}
  if(t>.48)f.set(f.onGround?'idle':'air');return 10;};
