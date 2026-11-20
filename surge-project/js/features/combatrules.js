/* COMBAT RULES
   1. HEAL LOCK — taking damage stops all healing for 10 s (every new hit restarts it at 10 s; it never stacks past 10).
      Damage-reduction effects that work by refunding part of a hit (Vitality skill, Awakening, Absorb) still apply.
   2. COMBO LOCK — while you're being comboed (a landed hit in the last 0.6 s, or in hit-stun) you can't attack back.
      The only way out is EVASIVE: the BREAK (dash with a full BREAK bar), which now gives 1 s of invulnerability.
   3. LEAPS — any move where the fighter launches themselves into the air plays 1.6× faster.
   4. SEPARATE COOLDOWNS — light and heavy attacks (in fighter.js) and the normal and back-special each keep their own cooldown;
      the two extra moves were already separate.
   Block rules (combat.js): blocking stops all damage except guard breakers, ultimate moves and heavy attacks. */
const HEAL_LOCK=10,COMBO_WIN=.6,LEAP_SPD=1.6;
const HEAL={def:null,free:0};
function healLocked(f){return !!f&&game.time-(f._hurtAt==null?-99:f._hurtAt)<HEAL_LOCK&&!f.dead;}
function healLeft(f){return Math.max(0,HEAL_LOCK-(game.time-(f._hurtAt==null?-99:f._hurtAt)));}
Object.defineProperty(Fighter.prototype,'hp',{configurable:true,
  get(){return this._hp;},
  set(v){const o=this._hp;
    if(o===undefined||!(o>0)||this.dead||this.downed||HEAL.free||NET.role==='client'||(game.practice&&typeof PR!=='undefined'&&PR.god)){this._hp=v;return;}
    if(v<o-1e-6){if(game.phase==='fight'||inMatch())this._hurtAt=game.time;}
    else if(v>o&&HEAL.def!==this&&healLocked(this)){v=o;}
    this._hp=v;}});
const _crReset=Fighter.prototype.reset;Fighter.prototype.reset=function(){HEAL.free++;try{this._hurtAt=null;this._comboAt=-99;this._spc={n:0,alt:0};return _crReset.apply(this,arguments);}finally{HEAL.free--;}};
if(typeof revived==='function'){const _crRev=revived;revived=function(f){HEAL.free++;try{return _crRev.apply(this,arguments);}finally{HEAL.free--;if(f)f._hurtAt=null;}};}
const _crHit=applyHit;applyHit=function(att,def,o){const p=HEAL.def;HEAL.def=def;try{return _crHit.apply(this,arguments);}finally{HEAL.def=p;}};
onEv('hit',(a,d,dmg)=>{if(d&&dmg>0&&a!==d)d._comboAt=game.time;});

// special cooldowns kept per variant: 'n' (special) and 'alt' (back + special)
function crSpVar(f){try{return ((inDir(f)==='b'||f.bufSB>0)&&(SPECVAR[f.curSpecial()]||{}).alt)?'alt':'n';}catch(e){return 'n';}}
Object.defineProperty(Fighter.prototype,'specCD',{configurable:true,
  get(){const s=this._spc;return s?s[crSpVar(this)]:0;},
  set(v){const s=this._spc||(this._spc={n:0,alt:0});v=+v||0;
    if(this._inSS){s[this.specVar==='alt'?'alt':'n']=v;return;}
    const cur=s[crSpVar(this)];
    if(v>=cur){s.n=Math.max(s.n,v);s.alt=Math.max(s.alt,v);}          // penalties (erase, snare…) hit both
    else{const d=cur-v;s.n=Math.max(0,s.n-d);s.alt=Math.max(0,s.alt-d);}}}); // speed-ups help both
const _crSS=Fighter.prototype.startSpecial;Fighter.prototype.startSpecial=function(){this._inSS=1;try{return _crSS.apply(this,arguments);}finally{this._inSS=0;}};

// combo lock + faster leaps, applied around each fighter update
const CR_ATK=['light','heavy','special','ult','x1','x2','spB','ultB'];
function comboLocked(f){if(f.dead||f.downed)return false;if(BRK_STATES.indexOf(f.state)>=0)return true;return game.time-(f._comboAt==null?-99:f._comboAt)<COMBO_WIN&&f.state!=='dash';}
const _crUpd=Fighter.prototype.update;Fighter.prototype.update=function(dt){
  if(game.phase==='fight'&&comboLocked(this)){const I=this.intent;if(I)CR_ATK.forEach(k=>{I[k]=false;});this.bufL=this.bufH=this.bufS=0;this.bufX=0;this.bufSB=0;}
  // LEAPS: a move that sends the fighter into the sky (and back down) plays 1.6x faster from wind-up to landing.
  // Known leaping moves (and every slam-type move) are fast from the first frame; any other move that launches its user is learned the first time it happens.
  const st=this.state,own=st==='special'||st==='ult'||st==='attack';
  if(!own){this._leap=false;this._mk=null;}
  else{const mk=crMoveKey(this);if(mk!==this._mk||this.stateT<(this._lst||0)){this._mk=mk;this._leap=LEAPK.has(mk)||crSlamMove(this);}this._lst=this.stateT;}
  const k=this._leap?LEAP_SPD:1,y0=this.pos.y;
  const r=_crUpd.call(this,dt*k);
  if(own&&this._mk&&!this._leap&&dt>0&&!this.dead&&this.state===st&&((this.pos.y-y0)/(dt*k)>4.5||this.vel.y>6)&&!this.onGround){this._leap=true;LEAPK.add(this._mk);}
  return r;};
function crMoveKey(f){const h=f.hero,st=f.state;
  if(st==='ult')return h.id+'|u:'+h.ult+':'+(f.ultAlt?'B':'');
  if(st==='special')return h.id+'|'+(f.xmOn?'x:'+(f.xmA&&f.xmA.name):'s:'+h.special+':'+(f.specVar||'n'));
  return h.id+'|a:'+f.moveName;}
function crSlamMove(f){if(f.state!=='special')return false;if(f.xmOn)return !!(f.xmA&&f.xmA.form==='slam');
  const C=f.hero.cab;if(f.hero.special==='cab'&&C){const A=f.specVar==='alt'?(C.spAlt||C.sp):C.sp;return !!(A&&A.form==='slam');}return false;}
// moves found to rise and slam down (scan of every fighter)
const LEAPK=new Set();
[['gale','spB'],['nitro','spB'],['titan','ultB'],['quill','ult'],['quill','ultB'],['quake','ult'],['recoil','ultB'],['crimson','ult'],['cushion','ultB'],['hopstar','sp'],['hopstar','spB'],['hopstar','ultB'],['headliner','ult'],['titan','ult']]
  .forEach(([id,sl])=>{const h=HEROES.find(x=>x.id===id);if(!h)return;
    LEAPK.add(h.id+'|'+(sl[0]==='s'?'s:'+h.special+':'+(sl==='spB'?'alt':'n'):'u:'+h.ult+':'+(sl==='ultB'?'B':'')));
    if(sl==='sp')LEAPK.add(h.id+'|s:'+h.special+':chg');});

// HUD: show when your healing is locked
setInterval(()=>{const b=$('meH');if(!b||!ME)return;const L=inMatch()&&healLocked(ME)&&ME.hp<100;b.classList.toggle('nohl',L);
  let t=$('healLk');if(!t){t=document.createElement('span');t.id='healLk';const P=b.parentNode;if(getComputedStyle(P).position==='static')P.style.position='relative';P.appendChild(t);}t.style.display=L?'block':'none';if(L)t.textContent='NO HEAL '+Math.ceil(healLeft(ME))+'s';},200);
