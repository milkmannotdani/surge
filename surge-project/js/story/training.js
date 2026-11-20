/* TRAINING ARC: the story-mode tutorial. Paragon drills Titan through every control, step by step.
   Each step has text, a check(st) that returns true when it's done, and an optional start(st) to set it up. */
const TUT_STEPS=[
  {t:'MOVE',k:'W A S D',d:'Walk around. Mouse (or arrow keys) turns the camera.',start(s){s.p0=ME.pos.clone();},check(s){return ME.pos.distanceTo(s.p0)>10;}},
  {t:'JUMP',k:'SPACE',d:'Jump. Press it again in the air to double jump.',check(){return ME.state==='air'&&ME.vel.y>0;}},
  {t:'DASH',k:'SHIFT',d:'Tap Shift to dash. Hold it to sprint.',check(){return ME.state==='dash';}},
  {t:'BASIC ATTACKS',k:'J / LEFT CLICK · K / RIGHT CLICK',d:'Hit the training bot 5 times. Light attacks chain; heavy attacks launch.',start(s){s.hits=0;},check(s){return s.hits>=5;}},
  {t:'SPECIAL MOVE',k:'1',d:'Your special move. Press 2 for its alternate version.',check(){return ME.state==='special'&&!ME.xmOn;}},
  {t:'EXTRA MOVES',k:'3 · 4',d:'Every fighter has two extra moves on 3 and 4.',check(){return !!ME.xmOn;}},
  {t:'BLOCK',k:'HOLD F',d:'The bot is attacking now. Face it and hold F to block a hit.',start(s){s.bot.hold=false;s.bot.diff=0;},check(){return ME.state==='bstun';}},
  {t:'BREAK OUT',k:'SHIFT WHILE BEING HIT',d:'Your BREAK bar is full. When you are caught in a combo, tap Shift to burst out.',start(s){ME.brk=100;},check(){return ME.brk===0;}},
  {t:'CLIMB',k:'JUMP INTO A WALL + HOLD W',d:'Jump into a building wall and keep holding forward to climb it. Press Space on a wall to wall-jump.',start(s){s.bot.hold=true;},check(){return ME.state==='climb';}},
  {t:'ULTIMATE',k:'Q',d:'Your ult meter is full. Unleash your ultimate!',start(){ME.meter=100;},check(){return ME.state==='ult';}},
  {t:'SWITCH MODE',k:'5',d:'Every fighter has a second mode with new moves. Press 5 to switch!',start(){ME._formCD=0;},check(){return typeof inMode==='function'&&inMode(ME);}},
  {t:'SPARRING MATCH',k:'EVERYTHING',d:'Final lesson: beat Nitro in a real spar!',start(s){s.final=true;s.bot.hold=false;}}];
function tutStage(){const st={i:-1,hits:0,bk:false,bot:null,final:false};
  function go(i){st.i=i;const T=TUT_STEPS[i];if(T.start)T.start(st);announceSmall(T.t);AU.scale=1;if(i>0)AU.pick();}
  return {player:'titan',enemies:[{h:'bastion',name:'TRAINING BOT',take:.4},{h:'nitro',name:'NITRO',take:1.3}],diff:0,custom:true,music:'story',goal:'Training: follow Paragon\'s lessons',
    setup(){Object.assign(st,{i:-1,hits:0,bk:false,final:false,lastBrk:0});st.bot=FS.find(f=>f.team===1&&f.name==='TRAINING BOT');st.nitro=FS.find(f=>f.name==='NITRO');st.bot.hold=true;st.nitro.hold=true;st.nitro.rig.root.visible=false;
      const p=ME.pos;st.bot.reset(p.x,p.z+6,Math.PI);st.nitro.reset(p.x+40,p.z+40,0);st.hk=e=>{};go(0);},
    tick(dt){const T=TUT_STEPS[st.i];
      if(!st.final){ME.hp=Math.max(ME.hp,st.i===10?1:40);st.bot.hp=100;
        if(T.check(st)){if(st.i+1<TUT_STEPS.length)go(st.i+1);
          if(TUT_STEPS[st.i].t==='SPARRING MATCH'){st.bot.dead=true;st.bot.rig.root.visible=false;const N=st.nitro;N.reset(ME.pos.x+rand(-3,3),ME.pos.z+8,Math.PI);N.rig.root.visible=true;N.hold=false;N.invuln=1;portal(N.chest(new V3()),2,true,1);STG.boss=N;}}}
      const C=TUT_STEPS[st.i];setObj(`<b>LESSON ${st.i+1}/${TUT_STEPS.length} · ${C.t}</b> <kbd>${C.k}</kbd><br><span>${C.d}${C.t==='BASIC ATTACKS'?` (${st.hits}/5)`:''}</span>`);
      setArrow(C.t==='BASIC ATTACKS'||C.t==='BLOCK'?st.bot.pos:(st.final&&st.nitro?st.nitro.pos:null));
      if(st.final&&st.nitro.dead)return true;},
    hud(){return 'TRAINING';},end(){setObj('');setArrow(null);},
    _st:st};}
onEv('hit',(att,def)=>{const S=STG.S;if(S&&S._st&&att===ME&&def.name==='TRAINING BOT')S._st.hits++;});
const TRAIN_ARC=[
 {t:'PLUS ULTRA BOOT CAMP',loc:'Dagobah Beach Park',
  sPre:{where:[48,-12],actors:[['titan',-1.6,0],['paragon',1.8,0]]},
  pre:[SL('narr','Ten months before the entrance exam. A beach buried in trash, and a boy with no power.',{cam:'wide'}),
   SL('paragon','Kai! Before you can carry OVERPOWER, your body has to be ready to hold it.',{pose:'point',fx:'aura',at:'paragon'}),
   SL('titan','I\'ll do whatever it takes. Teach me everything!',{pose:'charge'}),
   SL('paragon','Ha! That\'s the spirit. Moving, fighting, defending, climbing — we drill it all. Then you spar with a real rival.',{pose:'command'}),
   SL('paragon','Go beyond, kid. PLUS ULTRA!',{pose:'win',fx:'aura',at:'paragon',cam:'close'})],
  stages:[tutStage()],
  sPost:{where:[48,-12],actors:[['titan',-1.6,0],['paragon',1.8,0],['nitro',0,4]]},
  post:[SL('nitro','Tch. You got lucky, nobody.',{pose:'point',fx:'explosion',at:'nitro'}),
   SL('paragon','Not luck. Work. Kai, you\'re ready for the entrance exam. Story mode awaits!',{pose:'win',fx:'confetti',at:'paragon'})]}];
