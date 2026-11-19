/* HYPER ARMOR — big moves can't be interrupted.
   While a fighter is doing one of these, hits still hurt (85% damage) but can't stagger, knock back, launch,
   freeze, frame, paralyze, compress or grab them — the move always finishes. A golden shimmer shows it's active.
     • every ULTIMATE and ALT ULTIMATE (the whole thing)
     • every CHARGED special (hold-to-charge versions)
     • heavy specials: ground slams, rushes and power strikes (HYPER_SP)
     • extra moves (3/4) that slam, erupt or blast (slam · pillar · burst · wave); dashes for Bruisers/Tanks/Brawlers
     • basic HEAVY attacks and combo finishers that slam (heavy · smash · …H)
   Edit HYPER_SP / HYPER_FORMS to change what counts. */
const HYPER_SP={airburst:1,rocket:1,fault:1,recipro:1,glacier:1,cleave:1,vital:1,skyhop:1,flyby:1,bladeform:1,harden:1,absorb:1,spikeline:1};
const HYPER_FORMS={slam:1,pillar:1,burst:1,wave:1};
const HYPER_DASH_CLS={Bruiser:1,Tank:1,Brawler:1};
function isHyper(f){if(!f||f.dead||f.downed)return false;
  if(f.state==='ult')return true;
  if(f.state==='special'){if(f.specVar==='chg')return true;const sp=f.curSpecial&&f.curSpecial();if(HYPER_SP[sp])return true;
    if(sp==='xm'&&f.xmA){if(HYPER_FORMS[f.xmA.form])return true;if(f.xmA.form==='dash'&&HYPER_DASH_CLS[f.hero.cls])return true;}return false;}
  if(f.state==='attack'){const n=f.moveName||'';return n==='heavy'||n==='smash'||/H$/.test(n);}
  return false;}

// hits: run through the existing "armored" path (no flinch / knockback) but without armor's big damage cut
const _hyHit=applyHit;
applyHit=function(att,def,o){if(!isHyper(def)||!o||def.armorT>0)return _hyHit(att,def,o);
  o=Object.assign({},o);delete o.float;delete o.frame;delete o.hold;delete o.launch;o.dmg=(o.dmg||0)*(.85/.45);
  def.armorT=1e-6;try{return _hyHit(att,def,o);}finally{if(def.armorT<=1e-6)def.armorT=0;}};

// effects that grab or freeze a fighter directly (not through a hit) can't take hold either
const HY_BLOCK={hit:1,fly:1,framed:1,float:1,grabbed:1,stun:1,bstun:1,held:1,carried:1,frozen:1};
const _hySet=Fighter.prototype.set;
Fighter.prototype.set=function(s){if(HY_BLOCK[s]&&s!==this.state&&isHyper(this)){if(!this._hyFx||game.time-this._hyFx>.25){this._hyFx=game.time;hyperSpark(this);}return;}return _hySet.apply(this,arguments);};
function hyperSpark(f){const c=f.chest(new V3());ring(c,0xffd86a,1.8,.22,false,2.6);burst(ADD,c,10,{colors:[0xffd86a,0xffffff],speed:6,life:.22,size:.18,size1:0,bright:2.6});}

// golden shimmer while hyper armor is up
onEv('tick',dt=>{for(const f of FS){if(!isHyper(f)||!nearCam(f.pos,60))continue;if(Math.random()<dt*14){const a=rand(0,6.28);
  burst(ADD,TMP2.set(f.pos.x+Math.cos(a)*.55,f.pos.y+rand(.2,1.9),f.pos.z+Math.sin(a)*.55),1,{colors:[0xffd86a,0xfff4c8],speed:.2,up:.8,life:.3,size:.16,size1:0,bright:2.2});}}});
