/* CINEMATIC AUDIO — replaces the chiptune sound with an orchestral, film-trailer style.
   1. Every synthesized sound effect is warmed up: square/saw waves go through a low-pass filter (no more 8-bit buzz),
      and the shared reverb becomes a long concert-hall reverb.
   2. A small synth orchestra: strings, brass, horn, choir, harp, bells, timpani, taiko, snare, cymbals, contrabass.
   3. An original score: one 8-bar theme per situation (menu anthem, story march, battle, boss, villain, exam).
      The battle theme adds layers as the fight heats up (AU.intensity).
   4. Bigger one-shots: orchestral hit on ultimates, brass fanfare on wins, deeper impacts, metallic blocks, soft UI chimes.
   To write music: edit CTHEMES — chords per bar ([root midi, 'M'|'m'|'d'|'s']) and an 8th-note melody per bar
   (midi note, 0 = rest, -1 = hold the previous note). */

/* ---------- 1. warm up the basic synth ---------- */
AU.tone=function(type,f0,f1,dur,vol,delay,dest){
  const c=this.ctx;if(!c||!this.on)return;const sc=dest?1:this.scale;if(sc<.03||(!dest&&this.live>160))return;vol*=sc;const t=c.currentTime+(delay||0);if(!dest)this._track(1,dur+(delay||0));
  if(!dest){const pv=1+(Math.random()-.5)*.07;f0*=pv;f1*=pv;}
  const harsh=type==='square'||type==='sawtooth';
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol*(harsh?.8:1),.0002),t+(harsh?.012:.006));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  if(harsh){const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=.6;const fc=Math.min(5200,Math.max(700,Math.max(f0,f1)*(type==='square'?2.2:3)));
    lp.frequency.setValueAtTime(fc,t);lp.frequency.exponentialRampToValueAtTime(Math.max(300,fc*.45),t+dur);o.connect(lp);lp.connect(g);
    // a second, detuned voice makes it sound like an instrument instead of a chip
    if(dur>.08){const o2=c.createOscillator();o2.type=type;o2.frequency.setValueAtTime(f0*1.006,t);o2.frequency.exponentialRampToValueAtTime(Math.max(f1*1.006,1),t+dur);o2.connect(lp);o2.start(t);o2.stop(t+dur+.05);}}
  else o.connect(g);
  this.out(g,dest);o.start(t);o.stop(t+dur+.05);};

function hallIR(c,sec,decay,bright){const len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;for(let i=0;i<len;i++){const x=Math.random()*2-1;lp+=(x-lp)*(bright-(bright-.08)*i/len);const pre=i<c.sampleRate*.018?i/(c.sampleRate*.018):1;d[i]=lp*Math.pow(1-i/len,decay)*pre;}}return b;}
const _cinInit=AU.init;
AU.init=function(){const first=!this.ctx;_cinInit.call(this);if(!first||!this.ctx||this.mBus)return;const c=this.ctx;
  try{this.rev.buffer=hallIR(c,2.6,3.2,.55);}catch(e){}
  // music bus: dry + a big hall
  this.mBus=c.createGain();this.mBus.gain.value=1.6;const eq=c.createBiquadFilter();eq.type='highshelf';eq.frequency.value=5000;eq.gain.value=-4;
  this.mBus.connect(eq);eq.connect(this.mus);this.hall=c.createConvolver();this.hall.buffer=hallIR(c,3.6,2.6,.45);const hg=c.createGain();hg.gain.value=.55;
  this.mBus.connect(this.hall);this.hall.connect(hg);hg.connect(this.mus);
  // big hits on the sfx bus get extra hall
  this.sfxHall=c.createGain();this.sfxHall.gain.value=.35;this.sfxHall.connect(this.hall);
  this.mus.gain.value=.24;};

/* ---------- 2. the orchestra ---------- */
const OR={
  t(d){return AU.ctx.currentTime+Math.max(0,d||0);},
  env(g,t,a,hold,r,peak){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+r);return t+a+hold+r;},
  pan(node,p,dest){const c=AU.ctx;if(c.createStereoPanner&&p){const pn=c.createStereoPanner();pn.pan.value=p;node.connect(pn);pn.connect(dest);}else node.connect(dest);},
  bus(dest){return dest||AU.mBus||AU.mus;},
  osc(type,f,t,end,det,dest){const o=AU.ctx.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.connect(dest);o.start(t);o.stop(end+.05);return o;},
  noiseSrc(t,end,dest,rate){const s=AU.ctx.createBufferSource();s.buffer=AU.nb;s.loop=true;if(rate)s.playbackRate.value=rate;s.connect(dest);s.start(t,Math.random()*1.5);s.stop(end+.05);return s;},
  // bowed strings: three detuned saws, soft filter, slow attack, delayed vibrato
  strings(f,d,dur,vol,att,dest,pan){const c=AU.ctx,t=this.t(d),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(4200,f*3.2);lp.Q.value=.5;
    lp.connect(g);const end=this.env(g,t,att||.25,Math.max(.01,dur-(att||.25)),.5,vol);this.pan(g,pan||0,this.bus(dest));
    const vib=c.createOscillator(),vg=c.createGain();vib.frequency.value=5.2;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*.005,t+.5);vib.connect(vg);vib.start(t);vib.stop(end+.05);
    [-9,0,8].forEach(det=>{const o=this.osc('sawtooth',f,t,end,det,lp);vg.connect(o.frequency);});},
  // short bowed notes (ostinatos)
  spicc(f,d,vol,dest,len){const c=AU.ctx,t=this.t(d),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(3000,f*4);lp.connect(g);
    const end=this.env(g,t,.01,.02,len||.13,vol);g.connect(this.bus(dest));[-6,6].forEach(det=>this.osc('sawtooth',f,t,end,det,lp));},
  // brass: filter opens on the attack ("blat"), then settles
  brass(f,d,dur,vol,dest,soft,pan){const c=AU.ctx,t=this.t(d),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=1.2;
    const top=Math.min(5000,f*(soft?3:6)),base=Math.min(3200,f*(soft?1.8:2.8));lp.frequency.setValueAtTime(f*1.1,t);lp.frequency.exponentialRampToValueAtTime(top,t+.06);lp.frequency.exponentialRampToValueAtTime(base,t+.35);
    lp.connect(g);const end=this.env(g,t,soft?.07:.035,Math.max(.01,dur-.1),.3,vol);this.pan(g,pan||0,this.bus(dest));
    [-5,4].forEach(det=>this.osc('sawtooth',f,t,end,det,lp));this.osc('triangle',f/2,t,end,0,lp);},
  // choir "ah": saws through two vowel formants
  choir(f,d,dur,vol,dest,pan){const c=AU.ctx,t=this.t(d),g=c.createGain(),sum=c.createGain();sum.gain.value=1;
    [[750,6,1],[1150,7,.7],[2600,8,.25]].forEach(([fq,q,k])=>{const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=fq;bp.Q.value=q;const kg=c.createGain();kg.gain.value=k*3;sum.connect(bp);bp.connect(kg);kg.connect(g);});
    const end=this.env(g,t,.45,Math.max(.01,dur-.45),.7,vol);this.pan(g,pan||0,this.bus(dest));
    const vib=c.createOscillator(),vg=c.createGain();vib.frequency.value=4.6;vg.gain.value=f*.006;vib.connect(vg);vib.start(t);vib.stop(end+.05);
    [-12,-4,5,13].forEach(det=>{const o=this.osc('sawtooth',f,t,end,det,sum);vg.connect(o.frequency);});},
  harp(f,d,vol,dest){const c=AU.ctx,t=this.t(d),g=c.createGain();const end=this.env(g,t,.004,0,1.3,vol);this.pan(g,(Math.random()-.5)*.5,this.bus(dest));
    this.osc('triangle',f,t,end,0,g);const g2=c.createGain();g2.gain.value=.3;g2.connect(g);this.osc('sine',f*2,t,end,0,g2);},
  bell(f,d,vol,dest){const c=AU.ctx,t=this.t(d);[[1,1,2.2],[2.76,.45,1.2],[5.4,.25,.6],[8.9,.12,.3]].forEach(([m,k,dec])=>{const g=c.createGain();const end=this.env(g,t,.003,0,dec,vol*k);g.connect(this.bus(dest));this.osc('sine',f*m,t,end,0,g);});},
  timp(f,d,vol,dest){const c=AU.ctx,t=this.t(d),g=c.createGain();const end=this.env(g,t,.005,0,1.4,vol);g.connect(this.bus(dest));
    const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(f*1.4,t);o.frequency.exponentialRampToValueAtTime(f,t+.07);o.connect(g);o.start(t);o.stop(end+.05);
    const g2=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;lp.connect(g2);this.env(g2,t,.002,0,.25,vol*.6);g2.connect(this.bus(dest));this.noiseSrc(t,t+.3,lp);},
  taiko(d,vol,dest){const c=AU.ctx,t=this.t(d),g=c.createGain();const end=this.env(g,t,.004,0,.9,vol);g.connect(this.bus(dest));
    const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.25);o.connect(g);o.start(t);o.stop(end+.05);
    const g2=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;lp.connect(g2);this.env(g2,t,.002,0,.35,vol*.9);g2.connect(this.bus(dest));this.noiseSrc(t,t+.4,lp,.6);},
  snare(d,vol,dest){const c=AU.ctx,t=this.t(d),g=c.createGain(),bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1900;bp.Q.value=.7;bp.connect(g);
    this.env(g,t,.002,0,.2,vol);g.connect(this.bus(dest));this.noiseSrc(t,t+.25,bp);const g2=c.createGain();const e2=this.env(g2,t,.002,0,.07,vol*.5);g2.connect(this.bus(dest));this.osc('triangle',190,t,e2,0,g2);},
  cymbal(d,vol,dur,swell,dest){const c=AU.ctx,t=this.t(d),g=c.createGain(),hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=5200;hp.connect(g);dur=dur||1.8;
    if(swell){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.08);}else{g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
    g.connect(this.bus(dest));this.noiseSrc(t,t+dur+.1,hp,1.3);},
  bass(f,d,dur,vol,dest){const c=AU.ctx,t=this.t(d),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(600,f*4);lp.connect(g);
    const end=this.env(g,t,.06,Math.max(.01,dur-.06),.35,vol);g.connect(this.bus(dest));this.osc('sawtooth',f,t,end,-4,lp);this.osc('sawtooth',f,t,end,5,lp);this.osc('sine',f/2,t,end,0,g);}};
const CHORD={M:[0,4,7],m:[0,3,7],d:[0,3,6],s:[0,5,7]};

/* ---------- 3. the score (all original) ---------- */
const H=-1;
const CTHEMES={
  // MENU — a slow, rising hero anthem
  menu:{bpm:84,style:'anthem',lead:'horn',
    ch:[[50,'M'],[46,'M'],[53,'M'],[48,'M'],[50,'M'],[43,'M'],[46,'M'],[45,'M']],
    mel:[[62,H,69,H,74,H,H,H],[74,H,72,70,H,H,65,H],[69,H,H,H,72,H,77,H],[76,H,H,H,H,H,0,0],
         [62,H,69,H,74,H,76,H],[79,H,H,H,78,H,74,H],[77,H,H,74,H,H,70,H],[73,H,76,H,81,H,H,H]]},
  // STORY — a march for heroes on the move
  story:{bpm:104,style:'march',lead:'brass',
    ch:[[50,'M'],[43,'M'],[45,'M'],[50,'M'],[47,'m'],[43,'M'],[52,'M'],[45,'M']],
    mel:[[62,0,66,69,74,H,69,0],[71,H,74,H,79,H,78,76],[76,H,73,H,69,H,76,H],[74,H,H,H,H,H,0,0],
         [71,H,74,78,H,H,74,H],[79,H,78,H,74,H,71,H],[76,H,80,H,83,H,80,H],[81,H,H,H,79,H,76,H]]},
  // BATTLE — driving strings and drums; brass, choir and cymbals join as the fight heats up
  battle:{bpm:132,style:'action',lead:'brass',
    ch:[[50,'m'],[46,'M'],[48,'M'],[45,'M'],[50,'m'],[53,'M'],[43,'M'],[45,'M']],
    mel:[[74,H,H,77,H,76,74,H],[70,H,H,74,H,72,70,H],[72,H,H,76,H,79,H,H],[73,H,H,H,76,H,H,H],
         [74,H,77,H,81,H,79,77],[77,H,76,H,72,H,69,H],[71,H,74,H,79,H,77,74],[73,H,H,H,H,H,H,0]]},
  // BOSS — low brass ostinato, choir, war drums
  boss:{bpm:144,style:'boss',lead:'choir',
    ch:[[50,'m'],[46,'M'],[43,'m'],[45,'M'],[50,'m'],[51,'M'],[50,'m'],[45,'M']],
    mel:[[74,H,H,H,73,H,74,H],[77,H,H,H,74,H,70,H],[70,H,H,74,H,H,79,H],[76,H,H,H,73,H,H,H],
         [74,H,H,H,81,H,H,H],[79,H,H,H,75,H,H,H],[77,H,74,H,69,H,74,H],[73,H,H,H,H,H,H,H]]},
  // DARK — villain scenes: low strings, distant choir, a music-box bell
  dark:{bpm:72,style:'dark',lead:'bell',
    ch:[[50,'m'],[46,'M'],[43,'m'],[45,'M'],[50,'m'],[51,'M'],[48,'m'],[45,'M']],
    mel:[[74,H,H,H,H,H,0,0],[0,0,77,H,74,H,H,H],[70,H,H,H,H,H,0,0],[73,H,H,H,H,H,0,0],
         [74,H,H,H,0,0,77,H],[75,H,H,H,70,H,H,H],[72,H,H,H,75,H,H,H],[73,H,H,H,H,H,H,H]]},
  // EXAM — bright and determined
  exam:{bpm:120,style:'bright',lead:'brass',
    ch:[[48,'M'],[43,'M'],[45,'m'],[41,'M'],[48,'M'],[52,'M'],[41,'M'],[43,'M']],
    mel:[[72,H,76,H,79,H,76,H],[74,H,79,H,83,H,79,H],[76,H,72,H,69,H,72,H],[77,H,H,H,72,H,H,H],
         [79,H,76,H,72,H,76,79],[80,H,H,H,76,H,71,H],[77,H,81,H,84,H,81,H],[79,H,H,H,74,H,71,H]]}};
THEMES.battle=THEMES.battle||{bpm:132};   // keeps music.js's theme switching happy
for(const k in CTHEMES)if(!THEMES[k])THEMES[k]={bpm:CTHEMES[k].bpm};

AU.sched=function(){const c=this.ctx;if(!c)return;const T=CTHEMES[this.theme]||CTHEMES.battle,spb=60/T.bpm/4;
  while(this.nextT<c.currentTime+.15){this.play(this.step,this.nextT-c.currentTime);this.nextT+=spb;this.step=(this.step+1)%128;}};
AU.play=function(s,d){if(!this.music||!this.on||d<0||!this.ctx)return;if(!this.mBus)return;
  const T=CTHEMES[this.theme]||CTHEMES.battle,st=s%16,bar=Math.floor(s/16)%8,spb=60/T.bpm/4,barLen=spb*16;
  const [r,q]=T.ch[bar],iv=CHORD[q]||CHORD.M,I=this.theme==='battle'?(this.intensity||0):this.theme==='boss'?.8:.5,sty=T.style;
  // sustained strings + contrabass on every bar
  if(st===0){const pv=sty==='dark'?.022:sty==='anthem'?.03:.024;
    [r+12,r+12+iv[1],r+12+iv[2],r+24].forEach((n,k)=>OR.strings(mtof(n),d,barLen*.98,pv*(k===3?.6:1),sty==='anthem'||sty==='dark'?.5:.2,null,(k-1.5)*.25));
    OR.bass(mtof(r-12),d,barLen*.95,sty==='dark'?.09:.11);
    if(sty==='anthem'||sty==='dark'||sty==='boss'||(sty==='action'&&I>.6))OR.choir(mtof(r+12+iv[1]),d,barLen,sty==='boss'?.04:.028,null,.3);}
  // rhythm section
  if(sty==='action'||sty==='boss'){
    // string ostinato: 16ths on the root, accents on the beat
    const n=mtof(r+(st%4===2?12:0));OR.spicc(n,d,st%4===0?.07:.04);if(sty==='boss'&&st%2===0)OR.brass(mtof(r-12+(st===14?1:0)),d,spb*1.6,.05);
    if(st===0||st===8||(I>.5&&st===10)||(sty==='boss'&&st===6))OR.taiko(d,st===0?.95:.7);
    if(st===4||st===12)OR.snare(d,.35+I*.2);if(I>.6&&(st===14||st===15))OR.snare(d,.2);
    if(I>.4&&st%2===0)OR.cymbal(d,.025,.12);
    if(st===0&&bar%4===0&&I>.5)OR.cymbal(d,.12,2.2);if(st===8&&bar%4===3)OR.cymbal(d,.09,barLen*.5,true);
    if(st===0&&(bar===3||bar===7))OR.timp(mtof(r-12),d,.5);}
  else if(sty==='march'){if(st===0||st===8)OR.timp(mtof(r-12),d,.5);if(st===4||st===12||st===13||st===15)OR.snare(d,st===13||st===15?.18:.32);
    if(st%4===2)OR.spicc(mtof(r+12+iv[2]),d,.035);if(st===0&&bar%4===0)OR.cymbal(d,.08,2);}
  else if(sty==='bright'){if(st%4===0)OR.spicc(mtof(r),d,.06);if(st%2===1)OR.spicc(mtof(r+12+iv[(st>>1)%3]),d,.03);if(st===0||st===8)OR.timp(mtof(r-12),d,.4);if(st===4||st===12)OR.snare(d,.25);}
  else if(sty==='anthem'){if(st===0)OR.timp(mtof(r-12),d,.45);if(st%2===0){const a=[0,1,2,1,2,3,2,1][st/2],n=r+24+(a===3?12:iv[a]);OR.harp(mtof(n),d,.05);}
    if(st===8&&bar%4===3)OR.cymbal(d,.07,barLen*.5,true);}
  else if(sty==='dark'){if(st===0&&bar%2===0)OR.timp(mtof(r-12),d,.35);if(st===10&&bar%2===1)OR.taiko(d,.4);}
  // melody (eighth notes, -1 = hold)
  if(st%2===0){const row=T.mel[bar],i=st/2,n=row[i];
    if(n>0&&(this.theme!=='battle'||I>.3)){let len=1;for(let j=i+1;j<8&&row[j]===H;j++)len++;const dur=len*spb*2,f=mtof(n);
      if(T.lead==='horn')OR.brass(f/2*2,d,dur,.05,null,true,-.15);
      else if(T.lead==='brass'){OR.brass(f,d,dur,.055,null,false,-.1);if(I>.7||sty==='march')OR.brass(f/2,d,dur,.035,null,true,.15);}
      else if(T.lead==='choir'){OR.choir(f,d,dur,.05,null,-.1);OR.brass(f/2,d,dur,.04,null,true,.1);}
      else if(T.lead==='bell'){OR.bell(f*2,d,.05);OR.strings(f,d,dur,.02,.3,null,.2);}}}};

/* ---------- 4. heavier one-shots ---------- */
const SFXB=()=>AU.sfx;
// ultimate: a full orchestral hit (hero = bright major, villain = dark minor with choir)
AU.sting=function(villain){if(!this.ctx||!this.on||!this.mBus)return;const B=SFXB(),r=50,ch=villain?[0,3,7,12,15]:[0,4,7,12,16];
  ch.forEach((i,k)=>OR.brass(mtof(r+i),0,1.3,.06,B,false,(k-2)*.2));OR.strings(mtof(r+24+(villain?3:4)),0,1.6,.035,.02,B);OR.bass(mtof(r-12),0,1.2,.25,B);
  OR.taiko(0,1,B);OR.timp(mtof(r-12),.0,.7,B);OR.cymbal(0,.16,2.4,false,B);if(villain)OR.choir(mtof(r+12),0,1.6,.06,B);
  for(let k=0;k<6;k++)OR.timp(mtof(r-12),.9+k*.05,.18+k*.05,B);if(this.sfxHall)OR.cymbal(.02,.08,2.6,false,this.sfxHall);};
// win: brass fanfare over a timpani roll
AU.fanfare=function(){if(!this.ctx||!this.on||!this.mBus)return;const B=SFXB();
  [[62,0,.14],[62,.16,.14],[62,.32,.14],[69,.48,.7],[67,1.2,.2],[69,1.42,.2],[74,1.64,1.8]].forEach(([n,t,dur])=>{OR.brass(mtof(n),t,dur,.07,B);OR.brass(mtof(n-12),t,dur,.04,B,true);});
  [50,57,62,66].forEach(n=>OR.strings(mtof(n+12),1.64,2,.03,.1,B));OR.bass(mtof(38),1.64,1.8,.25,B);
  for(let k=0;k<10;k++)OR.timp(mtof(38),k*.06+.9,.15+k*.03,B);OR.timp(mtof(38),1.64,.8,B);OR.cymbal(1.64,.16,2.6,false,B);OR.taiko(1.64,.8,B);};
AU.levelUp=function(){if(!this.ctx||!this.on||!this.mBus)return;const B=SFXB();[62,66,69,74,78,81,86].forEach((n,i)=>OR.harp(mtof(n),i*.045,.09,B));OR.bell(mtof(86),.35,.06,B);OR.strings(mtof(74),.3,1,.03,.05,B);};
AU.bell=function(){if(!this.ctx||!this.mBus)return;[72,76,79].forEach((n,i)=>OR.bell(mtof(n),i*.03,.07,SFXB()));};
AU.pick=function(){if(!this.ctx||!this.mBus)return;OR.bell(mtof(84),0,.06,SFXB());OR.bell(mtof(91),.07,.05,SFXB());};
AU.ui=function(){if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime,g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.12);
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(1400,t);o.frequency.exponentialRampToValueAtTime(900,t+.1);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+.15);};
// impacts: sub-bass thump + body + crack, big hits get a hall tail
const _cinHit=AU.hit;
AU.hit=function(p){this.tone('sine',140,38,.28,1*p);this.noise(.16,.5*p,'lowpass',2600,220,.9);this.noise(.05,.28*p,'bandpass',3200,1800,1.2);
  this.tone('triangle',420,120,.06,.18*p);if(p>1.2){this.tone('sine',70,26,.8,.9);this.noise(.7,.35,'lowpass',700,60,.8);this.noise(.9,.06,'highpass',6000,4000,1,.02);}};
AU.boom=function(big){const d=big?2.2:1.2;this.tone('sine',90,22,d,1.1);this.tone('sine',55,20,d*1.2,.7);this.noise(d,.9,'lowpass',2000,40,.7);this.noise(.2,.5,'bandpass',900,300,1);
  this.noise(d*1.3,.1,'highpass',5000,3000,1,.05);if(big&&this.mBus&&this.on)OR.taiko(0,.7,this.sfxHall||this.sfx);};
AU.block=function(){[620,1711,3348,5518].forEach((f,i)=>this.tone('triangle',f,f*.985,.45-i*.08,.16/(i+1)));this.noise(.06,.3,'highpass',4000,3000,1);this.tone('sine',180,90,.1,.25);};
AU.ko=function(){this.boom(true);if(!this.ctx||!this.mBus||!this.on)return;const B=SFXB();[50,45,41,38].forEach((n,i)=>OR.brass(mtof(n),.25+i*.32,.5,.05,B,true));OR.choir(mtof(50),.3,1.8,.04,B);};
AU.charge=function(dur){this.noise(dur,.3,'bandpass',200,3200,2.5);this.tone('sine',110,440,dur,.2);if(this.ctx&&this.mBus&&this.on){OR.strings(mtof(50),0,dur,.025,dur*.9,this.sfx);OR.strings(mtof(57),0,dur,.02,dur*.9,this.sfx);OR.cymbal(0,.06,dur,true,this.sfx);}};
AU.shutter=function(n){for(let i=0;i<(n||1);i++){this.noise(.03,.3,'bandpass',3500,2500,3,i*.045);this.tone('sine',1800,900,.02,.08,i*.045);}};
AU.whoosh=function(h){this.noise(h?.3:.18,h?.42:.26,'bandpass',h?280:600,h?2000:2800,1.1);this.noise(h?.3:.18,.08,'highpass',3000,6000,1);};
AU.jump=function(){this.noise(.14,.16,'bandpass',500,1800,1);this.tone('sine',200,320,.1,.1);};
// the distant city horns were square-wave beeps; make them warm and far away
AU.startAmb=(orig=>function(){orig.call(this);if(this.hornT){clearInterval(this.hornT);this.hornT=setInterval(()=>{if(!this.on||Math.random()<.6)return;const s=this.scale,p=this.pan;this.scale=.1;this.pan=rand(-.8,.8);
  const f=pick([233,262,294]);this.tone('sawtooth',f,f*.99,.45,.1);this.tone('sawtooth',f*1.25,f*1.24,.45,.07);this.scale=s;this.pan=p;},8000);}})(AU.startAmb);
