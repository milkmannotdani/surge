/* ANIMATION — smoother motion everywhere, and ultimates that act out what they do.
   SMOOTHING: every joint now follows its target pose with a critically-damped spring (in fighter.js applyPose),
     so limbs accelerate and settle instead of snapping, and it looks the same at any frame rate. Attacks stay quick.
   ULTIMATE ANIMATIONS: every ultimate is classed by what it does, and the fighter performs it:
     punch    — twist back into a deep wind-up, then one huge straight punch held through the impact
     beam     — hands drawn to the hip to charge, then both palms thrust forward, trembling with the output
     slam     — crouch, leap with both fists overhead, then the downward slam
     barrage  — wind-up, then a blur of alternating punches ending in a finisher
     aoe      — curl in tight, then explode outward, arms and legs flung wide
     sky      — both arms raised to the sky, then one arm brought down to call it in
     ground   — drop to one knee and slam a palm into the ground
     slash    — blade drawn back overhead, then alternating wide cuts
     rush     — low sprinting lunge
     shot     — braced aim with recoil kicks
     roar     — curl in, then a flexing power-up roar
     command  — a commanding point and outstretched hand
     gaze     — the stare
   The wind-up plays during the ult's charge-up, the action once it fires. Ults that already have their own
   specific choreography (Legacy Strike, Street Surge, the leaping slams…) keep it. */
Object.assign(POSES,{
  ultWind:b_({sy:-1.05,sx:.12,hy:-.3,rSx:.95,rSz:-.35,rE:-1.7,lSx:-1.3,lSz:.1,lE:-.45,lHx:-.85,lK:1.15,rHx:.45,rK:.6,hd:.15}),
  ultPunch:b_({sy:.95,sx:.32,hy:-.24,rSx:-1.62,rSz:.02,rE:0,lSx:.45,lSz:.55,lE:-1.45,lHx:-.95,lK:.85,rHx:.65,rK:.1,hd:.1}),
  beamCup:b_({sy:-.65,sx:.05,hy:-.26,lSx:.45,lSz:.65,lE:-1.95,rSx:.55,rSz:-.5,rE:-1.95,lHx:-.55,lK:.85,rHx:.35,rK:.6}),
  beamPush:b_({sx:.2,hy:-.16,lSx:-1.52,lSz:-.28,lE:-.12,rSx:-1.52,rSz:.28,rE:-.12,lHx:-.65,lK:.75,rHx:.55,rK:.3}),
  armsUp:b_({sx:-.28,hd:-.45,hy:.02,lSx:-2.95,lSz:.38,lE:-.1,rSx:-2.95,rSz:-.38,rE:-.1,lHz:.12,rHz:-.12}),
  skyCall:b_({sx:.1,hd:-.1,sy:.25,rSx:-1.7,rSz:-.05,rE:-.05,lSx:-2.8,lSz:.3,lE:-.15,lHx:-.4,lK:.4,rHx:.3}),
  burstIn:b_({hy:-.38,sx:.6,hd:.45,lSx:-.6,lSz:-.5,lE:-2.25,rSx:-.6,rSz:.5,rE:-2.25,lHx:-.95,lK:1.35,rHx:-.95,rK:1.35}),
  burstOut:b_({sx:-.38,hd:-.4,hy:.06,lSx:-.7,lSz:1.55,lE:0,rSx:-.7,rSz:-1.55,rE:0,lHz:.38,rHz:-.38,lK:.08,rK:.08}),
  kneelPalm:b_({hy:-.58,sx:.85,hd:.3,rSx:-1.25,rSz:-.05,rE:-.08,lSx:.25,lSz:.5,lE:-1.05,lHx:-1.45,lK:2.1,rHx:.65,rK:2.3}),
  roar:b_({sx:-.38,hd:-.6,hy:-.1,lSx:-.2,lSz:1.25,lE:-1.7,rSx:-.2,rSz:-1.25,rE:-1.7,lHz:.32,rHz:-.32,lK:.38,rK:.38}),
  slashWind:b_({sy:-.95,sx:-.1,hy:-.22,rSx:-2.65,rSz:-.6,rE:-.6,lSx:-2.45,lSz:.2,lE:-.8,lHx:-.75,lK:.95,rHx:.3}),
  braceAim:b_({sy:.15,sx:.12,hy:-.2,rSx:-1.55,rSz:.05,rE:-.05,lSx:-1.45,lSz:-.35,lE:-.65,lHx:-.6,lK:.8,rHx:.5,rK:.45}),
  recoilK:b_({sy:.1,sx:-.12,hy:-.14,rSx:-1.85,rSz:.05,rE:-.35,lSx:-1.6,lSz:-.35,lE:-.9,lHx:-.5,lK:.7,rHx:.55,rK:.4,hd:-.1})});
const UA_KIND={supernova:'aoe',tidal:'beam',tempest:'rush',chain:'barrage',cataclysm:'punch',thunderdome:'sky',eclipse:'roar',meteor:'sky',unbreakable:'rush',skyfall:'sky',
  singularity:'command',thousandcuts:'slash',tectonic:'slam',bloodarrow:'beam',collapse:'ground',arsenal:'command',stopmotion:'barrage',azureinferno:'aoe',abyss:'command',
  sealedarena:'ground',dominion:'slash',permafrost:'ground',overdrive:'rush',erasure:'gaze',curtaincall:'command',sanctuary:'aoe',deadeye:'shot',bloodfrenzy:'slash',
  colossus:'slash',reassemble:'ground',release:'punch',acidveil:'aoe',execution:'slash',absolute:'command',streetsurge:'rush',beatdown:'barrage',showstopper:'sky',
  premiere:'punch',finalrelease:'roar',absdread:'aoe',legacy:null};
const UA_ALT={cinder:'sky',riptide:'aoe',gale:'aoe',nitro:'sky',titan:'slam',volta:'beam',umbra:'sky',drift:'aoe',bastion:'roar',quill:'slam',void:'aoe',ronin:'slash',quake:'ground',
  marrow:'ground',entropy:'ground',sovereign:'command',strobe:'slash',pyre:'sky',warp:'command',hex:'sky',scathe:'ground',solstice:'aoe',piston:'rush',snare:'command',
  marble:'sky',legion:'slam',recoil:'shot',crimson:'roar',sawback:'slash',resect:'roar',cushion:'aoe',corrosa:'sky',verdict:'command',decree:'command',skitter:'rush',
  oldguard:'roar',hopstar:'slam',headliner:'command',zanshin:'roar',dread:'roar',heir:'command'};
const UA_FORM={beam:'beam',burst:'aoe',zone:'ground',rain:'sky',dash:'rush',slam:'slam',summon:'sky',cone:'beam',bolt:'punch',volley:'barrage',grab:'command',pillar:'ground',orbit:'roar',shield:'roar',buff:'roar',blink:'rush',wave:'beam'};
function ultKind(f){const h=f.hero;if(f.ultAlt){const k=KIT(h,'alt');if(k==='cab'){const A=h.cab&&h.cab.ultAlt;return A?UA_FORM[A.form]:null;}return UA_ALT[k]||null;}
  if(h.ult==='cab'){const A=h.cab&&h.cab.ult;return A?UA_FORM[A.form]:null;}return UA_KIND[h.ult]!==undefined?UA_KIND[h.ult]:'roar';}
// wind-up pose (during the charge-up) and action pose (r = seconds since it fired, D = its length)
const UA_PRE={punch:'ultWind',beam:'beamCup',slam:'burstIn',barrage:'ultWind',aoe:'burstIn',sky:'armsUp',ground:'burstIn',slash:'slashWind',rush:'ultWind',shot:'braceAim',roar:'burstIn',command:'point',gaze:'stare'};
function ultActPose(kind,f,r,D){const end=D-r;   // the wind-up already played during the charge-up, so the release is immediate
  switch(kind){
    case 'punch':return 'ultPunch';
    case 'beam':return 'beamPush';
    case 'slam':return (f.onGround&&r>.3)?'slamLand':'slamAir';
    case 'barrage':if(end<.35)return 'ultPunch';return (Math.floor(r/.085)%2)?'jabLh':'jabRh';
    case 'aoe':return 'burstOut';
    case 'sky':return r<.15?'armsUp':'skyCall';
    case 'ground':return 'kneelPalm';
    case 'slash':return (Math.floor(r/.2)%2)?'slashL':'slash';
    case 'rush':return 'dash';
    case 'shot':return (r%.55)<.1?'recoilK':'braceAim';
    case 'roar':return 'roar';
    case 'command':return r<.3?'point':'command';
    case 'gaze':return 'stare';}return null;}
// these are what ult code uses as a placeholder; anything more specific is the ult's own choreography and is kept
const UA_GENERIC={charge:1,specw:1,spech:1,point:1,command:1,float:1,showcase:1,idle:1,guard:1,relaxed:1,undefined:1};
const _uaTP=Fighter.prototype.targetPose;Fighter.prototype.targetPose=function(dt){
  if(this.state==='ult'&&this.hero){if(!this._uaK||this._uaS!==this._ultId){this._uaS=this._ultId;this._uaK=ultKind(this);this._uaA=null;}
    const kind=this._uaK;if(kind&&UA_GENERIC[this.poseKey]){
      if(!this.u1)this.poseKey=UA_PRE[kind]||'charge';
      else{if(this._uaA==null)this._uaA=this.stateT;const r=this.stateT-this._uaA,D=Math.max(.6,(this.uEnd<50?this.uEnd:this._uaA+2.5)-this._uaA);const k=ultActPose(kind,this,r,D);if(k)this.poseKey=k;}}}
  else if(this._uaK){this._uaK=null;}
  const P=_uaTP.apply(this,arguments);
  // a trembling push while a beam is pouring out
  if(this.state==='ult'&&this._uaK==='beam'&&this.u1&&P){const j=Math.sin(game.time*55)*.035;P.lSx+=j;P.rSx-=j;}
  return P;};
const _uaStart=Fighter.prototype.startUlt;Fighter.prototype.startUlt=function(){this._ultId=(this._ultId||0)+1;this._uaK=null;return _uaStart.apply(this,arguments);};
