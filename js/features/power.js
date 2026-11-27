/* POWER — moves hit with the destructive force of the show.
   · Specials, ultimates and heavy attacks hit harder and throw people much further:
       specials ×1.2 damage, ultimates ×1.25, heavy attacks ×1.15; knockback ×1.4, launch height ×1.2
   · Big hits wreck their surroundings: the ground craters, cars, benches, signs and vending machines in the blast
     radius are destroyed, rubble flies, a dust shockwave rolls out, and walls next to the impact crack open.
   · Ultimates release a shockwave the moment they fire, smashing everything around the user.
   · Explosions are 20% bigger. */
const PW={dmgSp:1.2,dmgUlt:1.25,dmgHeavy:1.15,kb:1.4,up:1.2,lastT:0};
const _pwHit=applyHit;applyHit=function(att,def,o){
  if(o&&att&&att!==def&&!o._pw){const ult=att.state==='ult'||o.ult,sp=att.state==='special',hv=o.heavy||(att.state==='attack'&&MOVES[att.moveName]&&MOVES[att.moveName].heavy);
    if(ult||sp||hv){o=Object.assign({},o,{_pw:1});o.dmg=(o.dmg||0)*(ult?PW.dmgUlt:sp?PW.dmgSp:PW.dmgHeavy);if(o.kb)o.kb*=PW.kb;if(o.up)o.up*=PW.up;}}
  return _pwHit.call(this,att,def,o);};
// destruction around an impact point
function smashArea(p,R,big){if(NET.role!=='client')props.forEach(pp=>{if(!pp.broken&&Math.hypot(pp.x-p.x,pp.z-p.z)<R+pp.r)breakProp(pp);});
  if(!nearCam(p,90))return;const g=TMP2.set(p.x,Math.max(.2,(p.y||0)+.2),p.z).clone();
  crater(p.x,p.z,R*.6,null);dust(g,Math.min(28,Math.round(8+R*3)),1+Math.min(R,8)*.2);debris(TMP3.set(p.x,(p.y||0)+.6,p.z).clone(),Math.min(16,Math.round(4+R*1.6)),0,8+R*1.5,Math.min(.5,.25+R*.04));
  ring(TMP3.set(p.x,(p.y||0)+.15,p.z).clone(),0xd8ccb8,R*2.4,.5,true,1.2);
  // walls right next to the impact crack open
  for(let k=0;k<6;k++){const a=k/6*6.283,x=p.x+Math.cos(a)*(R*.6+.8),z=p.z+Math.sin(a)*(R*.6+.8);
    if(insideBld(x,z,0,(p.y||0)+1.2)){if(typeof wallCrack==='function')wallCrack(new V3(x-Math.cos(a)*.9,(p.y||0)+1.4,z-Math.sin(a)*.9),new V3(-Math.cos(a),0,-Math.sin(a)),Math.min(4,1.4+R*.4));
      debris(new V3(x-Math.cos(a),(p.y||0)+1.6,z-Math.sin(a)),5,0,7,.35);break;}}
  if(big)xSnd(p,()=>{AU.boom(true);AU.crash&&AU.crash();});}
onEv('hit',(att,def,dmg,o)=>{if(!def||!inMatch()||!(dmg>=13||(att&&att.state==='ult'&&dmg>=6)))return;const now=game.time;if(now-PW.lastT<.12)return;PW.lastT=now;
  const ult=att&&att.state==='ult';smashArea(def.pos.clone(),clamp(1.4+dmg*.09,2,5)*(ult?1.4:1),ult||dmg>=22);});
onEv('ult',f=>{if(f.hero&&f.hero.ult==='legacy')return;setTimeout(()=>{if(!inMatch()||f.dead)return;const p=f.pos.clone();smashArea(p,5.5,true);ring(TMP2.set(p.x,p.y+1,p.z).clone(),f.hero.color,9,.55,false,2.4);shake(.7,p);},420);});
const _pwExp=explosion;explosion=function(pos,radius){const a=[...arguments];a[1]=(radius||1)*1.2;return _pwExp.apply(this,a);};
