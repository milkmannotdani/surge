/* Music: a procedural soundtrack with a theme per situation.
   menu   – title / menus            story – story cutscenes (hero side)
   dark   – villain cutscenes        battle – matches (the original intensity-driven track)
   boss   – boss fights              exam  – license exam / rescue missions
   Plus one-shot stings: AU.sting() on ultimates, AU.fanfare() on wins, AU.levelUp().
   To add a theme: add an entry to THEMES with bpm, chord roots (midi), chord type and an 8th-note melody. */
const mtof=n=>440*Math.pow(2,(n-69)/12);
const THEMES={
  menu:{bpm:100,roots:[50,45,47,43],minor:[0,0,1,0],lead:'triangle',
    mel:[[69,0,66,69,74,0,73,0],[71,0,69,0,64,0,0,0],[66,0,71,74,76,0,74,0],[74,0,71,0,69,0,0,0]],kit:'soft'},
  story:{bpm:116,roots:[50,43,45,50],minor:[0,0,0,0],lead:'sawtooth',
    mel:[[62,0,66,69,74,0,74,76],[79,0,78,76,74,0,71,0],[73,0,76,73,69,0,73,76],[74,0,0,0,69,0,74,0]],kit:'march'},
  dark:{bpm:84,roots:[50,46,48,45],minor:[1,0,0,0],lead:'sine',
    mel:[[74,0,0,73,74,0,0,0],[70,0,0,69,70,0,72,0],[72,0,0,71,72,0,0,0],[73,0,0,0,69,0,0,0]],kit:'drone'},
  boss:{bpm:152,roots:[50,46,48,45],minor:[1,0,0,0],lead:'square',
    mel:[[74,0,74,77,0,76,74,0],[70,0,72,74,0,72,70,0],[72,0,76,79,0,77,76,0],[73,0,76,73,69,0,0,0]],kit:'drive'},
  exam:{bpm:128,roots:[48,52,53,55],minor:[0,1,0,0],lead:'square',
    mel:[[72,0,76,79,0,76,72,0],[71,0,74,79,0,74,71,0],[72,0,77,81,0,77,72,0],[74,0,79,83,0,79,74,0]],kit:'drive'}};
AU.theme='menu';
AU.setTheme=function(t){if(!THEMES[t]&&t!=='battle')t='battle';if(this.theme!==t){this.theme=t;this.step=0;}if(this.ctx&&!this.timer&&this.music)this.startMusic();};
const _auStart=AU.startMusic;
AU.startMusic=function(){if(inMatch()&&this.theme!=='boss'&&this.theme!=='exam')this.theme=this.matchTheme||'battle';_auStart.call(this);};
AU.sched=function(){const c=this.ctx,T=THEMES[this.theme],spb=60/(T?T.bpm:138)/4;
  while(this.nextT<c.currentTime+.12){this.play(this.step,this.nextT-c.currentTime);this.nextT+=spb;this.step=(this.step+1)%64;}};
const _auBattle=AU.play;
AU.play=function(s,d){const T=THEMES[this.theme];if(!T)return _auBattle.call(this,s,d);
  if(!this.music||!this.on||d<0)return;const M=this.mus,st=s%16,bar=Math.floor(s/16)%4,r=T.roots[bar],mi=T.minor[bar],spb=60/T.bpm/4;
  const third=mi?3:4,ch=[0,third,7];
  // pad: a soft chord held for the bar
  if(st===0)ch.forEach(i=>{const f=mtof(r+12+i);this.tone('triangle',f,f*1.002,spb*16,.035,d,M);this.tone('sine',f*2,f*2,spb*16,.012,d,M);});
  // bass
  if(T.kit==='drive'){if(st%2===0){const f=mtof(r-12+(st===14?7:0));this.tone('sawtooth',f,f*.99,spb*1.6,.13,d,M);}}
  else if(T.kit==='drone'){if(st===0)this.tone('sawtooth',mtof(r-12),mtof(r-12),spb*16,.06,d,M);}
  else if(st===0||st===8||(T.kit==='march'&&st===14)){const f=mtof(r-12);this.tone('triangle',f,f,spb*(st===14?2:7),.18,d,M);}
  // drums
  const k=T.kit;
  if(k==='soft'){if(st===0||st===8)this.tone('sine',120,40,.2,.45,d,M);if(st%4===2)this.noise(.04,.06,'highpass',8000,7000,1,d,M);if(st===4||st===12)this.noise(.1,.1,'bandpass',2000,1200,.8,d,M);}
  else if(k==='march'){if(st===0||st===8)this.tone('sine',90,45,.35,.55,d,M);if(st===4||st===12||st===13||st===15)this.noise(.09,st===4||st===12?.32:.16,'bandpass',2200,1400,.9,d,M);if(st%2===0)this.noise(.03,.05,'highpass',9000,8000,1,d,M);}
  else if(k==='drive'){if(st%4===0)this.tone('sine',150,40,.2,.8,d,M);if(st===4||st===12)this.noise(.14,.4,'bandpass',1900,900,.8,d,M);this.noise(.025,st%2?.08:.04,'highpass',9000,8000,1,d,M);}
  else if(k==='drone'){if(st===0&&bar%2===0)this.tone('sine',70,30,1.2,.5,d,M);if(st===10)this.noise(.6,.05,'bandpass',600,200,4,d,M);}
  // arpeggio (menu/story)
  if((k==='soft'||k==='march')&&st%2===1){const n=r+24+ch[((st-1)/2)%3]+(st>8?12:0);this.tone('square',mtof(n),mtof(n),spb*.9,.012,d,M);}
  // melody on 8th notes
  if(st%2===0){const n=T.mel[bar][st/2];if(n){const f=mtof(n),dur=spb*(T.kit==='drone'?6:3.4),v=T.lead==='sawtooth'?.035:T.lead==='square'?.03:.06;
    this.tone(T.lead,f,f,dur,v,d,M);this.tone(T.lead,f*1.004,f*1.004,dur,v*.6,d,M);if(T.kit==='march')this.tone('square',f/2,f/2,dur,.02,d,M);}}};
/* one-shots (they play on the sfx bus at full volume regardless of distance) */
AU.sting=function(villain){if(!this.ctx||!this.on)return;const s=this.scale;this.scale=1;const r=villain?50:50,ch=villain?[0,3,7,10]:[0,4,7,12];
  ch.forEach((i,k)=>{const f=mtof(r+i);this.tone('sawtooth',f,f,1.4,.07,k*.015);this.tone('square',f*2,f*2,1.1,.03,.02+k*.015);});
  this.tone('sine',110,38,1,.6);this.noise(.9,.25,'bandpass',300,4000,2);this.scale=s;};
AU.fanfare=function(){if(!this.ctx||!this.on)return;const s=this.scale;this.scale=1;[62,66,69,74].forEach((n,i)=>this.tone('sawtooth',mtof(n),mtof(n),.22,.07,i*.12));
  [62,66,69,74,78].forEach(n=>this.tone('sawtooth',mtof(n),mtof(n),1.6,.05,.5));this.tone('sine',90,45,.5,.5,.5);this.scale=s;};
AU.levelUp=function(){if(!this.ctx||!this.on)return;const s=this.scale;this.scale=1;[72,76,79,84].forEach((n,i)=>this.tone('triangle',mtof(n),mtof(n),.3,.12,i*.07));this.scale=s;};
/* when each theme plays */
const _auInit=AU.init;AU.init=function(){const first=!this.ctx;_auInit.call(this);if(first&&this.ctx&&!inMatch()&&!CUT)this.setTheme('menu');};
onEv('matchStart',()=>{AU.matchTheme=game.story&&game.story.S&&game.story.S.music||'battle';AU.setTheme(AU.matchTheme);});
onEv('tick',()=>{if(game.story&&STG.boss&&!STG.boss.dead&&AU.theme!=='boss'&&!(game.story.S&&game.story.S.music))AU.setTheme('boss');});
onEv('matchEnd',()=>setTimeout(()=>{if(!inMatch()&&!CUT)AU.setTheme('menu');},0));
onEv('win',w=>{const mine=w&&ME&&ally(w,ME);if(mine)setTimeout(()=>AU.fanfare(),300);setTimeout(()=>{if(!inMatch())AU.setTheme('menu');},4400);});
onEv('ult',f=>{if(f===ME||(ME&&f.pos.distanceTo(ME.pos)<18))AU.sting(f.hero.faction==='villain');});
// back on a menu screen → menu music
const _showScreen0=showScreen;
showScreen=function(id){_showScreen0(id);if(id&&id!=='pause'&&AU.ctx&&!CUT&&!(inMatch()&&id==='result'))AU.setTheme('menu');};
