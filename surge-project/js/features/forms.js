/* MODES — every fighter has a second mode, like Marrow's DREAD form. This replaces the old Awakening system.
   Press 5 (rebindable as SWITCH MODE · gamepad D-pad down · touch MODE) to switch between BASE and the mode, any time
   you're free to act (1.5 s between switches). A mode swaps:
     special (1), back-special (2), both extra moves (3, 4), the ultimate (Q) · Q+back keeps the base alt ultimate
     the punch/kick combo and heavy (except weapon fighters, who keep their weapon combos)
     the look (recolored body + an aura) and stats (damage / speed / damage taken)
   Passives tied to the fighter stay. Switching goes through the host online, so everyone sees the same mode.
   Moves are built with the ability engine (abilities.js): [name, form, style, shape, effects, extras]. */
const FA=(n,form,style,shape,fx,x)=>[n,form,style,shape,fx||[],x||{}];
const FORMS={
 cinder:{n:'INFERNO',d:'white-hot flames',c:0xfff0c0,a:0xff3a10,s:[1.15,1,1.1],k:'jR jL jR sk|cm|fire',
   sp:FA('SOLAR LANCE','beam','fire','flame',['burn']),alt:FA('CINDERFALL','rain','fire','flame',['burn']),x:[FA('NOVA PULSE','burst','fire','flame',['burn','push']),FA('COMET RUSH','dash','fire','flame',['burn'])],u:FA('SUNCORE','zone','fire','flame',['burn','pull'],{power:1.3})},
 riptide:{n:'TIDAL',d:'the deep ocean answers',c:0x0a4aff,a:0x6af0ff,s:[1.1,1.05,1],k:'bk el bk ax|sk|water',
   sp:FA('TSUNAMI EDGE','wave','water','crescent',['push']),alt:FA('RIP CURRENT','orbit','water','bubble',['slow']),x:[FA('UNDERTOW','grab','water','bubble',['pull']),FA('TIDE SHARDS','volley','water','shard',[])],u:FA('MONSOON','rain','water','bubble',['slow','push'],{power:1.3})},
 gale:{n:'TEMPEST',d:'a living storm',c:0x8af0ff,a:0xffffff,s:[1.05,1.2,1.05],k:'hk hk lk sk|dk|wind',
   sp:FA('GALE FANS','volley','wind','crescent',['push']),alt:FA('SLIPSTREAM','blink','wind','tornado',[],{self:['haste']}),x:[FA('DOWNBURST','bolt','wind','tornado',['push','pierce'],{size:2.2,speed:15,range:22}),FA('SKY DROP','slam','wind','tornado',['launch'])],u:FA('EYE OF THE STORM','zone','wind','tornado',['pull','float'],{power:1.3})},
 nitro:{n:'OVERDRIVE',d:'sweat pushed to the limit',c:0xffb020,a:0xff2a00,s:[1.25,1.05,1.15],k:'pa jR jL sm|ds|blast',
   sp:FA('AP CANNON','bolt','explosion','bomb',['explode']),alt:FA('CRATER DIVE','slam','explosion','bomb',['explode','launch']),x:[FA('FLASH BANG','burst','explosion','star',['stun']),FA('ROCKET STEP','dash','explosion','bomb',['explode'])],u:FA('HOWITZER LINE','beam','explosion','bomb',['explode','launch'],{power:1.35})},
 titan:{n:'PEAK FORM',d:'one last blaze of power',c:0xfff2a0,a:0x3a8aff,s:[1.3,1,1.1],k:'jR jL jR jL sm|sm|impact',
   sp:FA('TYPHOON PUNCH','cone','wind','fist',['push'],{range:15,size:1.5,power:1.2}),alt:FA('METEOR DROP','slam','earth','fist',['launch']),x:[FA('BREAKTHROUGH','dash','wind','fist',['push']),FA('PRESSURE WAVE','wave','wind','fist',['push'])],u:FA('FINAL SURGE','burst','wind','fist',['launch','push'],{power:1.5})},
 volta:{n:'OVERLOAD',d:'more voltage than she can hold',c:0xfff23a,a:0x6ad8ff,s:[1.15,1.1,1.1],k:'jR jL jR jL up|dk|spark',
   sp:FA('ARC LANCE','bolt','lightning','lightning',['chain']),alt:FA('STORM CAGE','zone','lightning','lightning',['stun']),x:[FA('FLASHSTEP','blink','lightning','lightning',[],{self:['haste']}),FA('THUNDERCLAP','rain','lightning','lightning',['stun'])],u:FA('GIGAVOLT','beam','lightning','lightning',['chain','stun'],{power:1.3})},
 umbra:{n:'FERAL ECLIPSE',d:'the beast takes the wheel',c:0x2a0a4a,a:0xff3a6a,s:[1.2,1.1,1.1],
   sp:FA('NIGHT MAW','grab','shadow','hand',['pull']),alt:FA('BAT HALO','orbit','shadow','bat',['slow']),x:[FA('PREDATOR LUNGE','dash','shadow','bat',[]),FA('HOWL','burst','shadow','bat',['slow','push'],{size:1.3})],u:FA('THE PACK','summon','shadow','bat',['mark'],{power:1.3})},
 drift:{n:'FREEFALL',d:'gravity is optional',c:0xd88aff,a:0xfff0ff,s:[1.05,1.1,1],k:'pa pa bk up|ds|void',
   sp:FA('DEBRIS BARRAGE','volley','void','boulder',['float']),alt:FA('NULL FIELD','zone','void','orb',['float','slow']),x:[FA('TETHER','grab','void','ring',['float']),FA('METEOR','slam','earth','boulder',['launch'])],u:FA('COMET SHOWER','rain','void','boulder',['float'],{power:1.3})},
 bastion:{n:'BULWARK',d:'harder than steel, slower than ever',c:0xff2a2a,a:0xffd0a0,s:[1.05,.88,.65],k:'el el sm|sm|metal',
   sp:FA('IRON WALL','shield','metal','shard',[]),alt:FA('RAMPART CHARGE','dash','metal','fist',['push']),x:[FA('AVALANCHE DROP','slam','earth','boulder',['launch']),FA('SPLINTER BURST','burst','metal','shard',['push'])],u:FA('CRIMSON FORTRESS','burst','metal','shard',['launch','stun'],{power:1.4})},
 quill:{n:'SKYBLADE',d:'every feather a blade',c:0xff3a2a,a:0xffd08a,s:[1.05,1.2,1.05],k:'bk el bk el sk|dk|feather',
   sp:FA('FEATHER STORM','volley','crystal','feather',['pierce']),alt:FA('WINGSHIFT','blink','wind','feather',[],{self:['haste']}),x:[FA('BLADE HALO','orbit','crystal','feather',[]),FA('SWOOP','dash','wind','feather',['launch'])],u:FA('RED DOWNPOUR','rain','crystal','feather',['pierce'],{power:1.3})},
 void:{n:'EVENT HORIZON',d:'nothing escapes',c:0x1a0a3a,a:0x8ac4ff,s:[1.1,1,1.05],k:'pa bk pa cm|cm|void',
   sp:FA('SINGULARITY','zone','void','eye',['pull']),alt:FA('PHASE OUT','blink','void','ring',[],{self:['shield']}),x:[FA('GRAVITY HOOK','grab','void','ring',['pull']),FA('NULL RING','bolt','void','ring',['slow'])],u:FA('COLLAPSE POINT','burst','void','eye',['pull','launch'],{power:1.35})},
 ronin:{n:'KENSEI',d:'the blade and the spirit as one',c:0xffffff,a:0x6affd8,s:[1.15,1.05,1.05],
   sp:FA('MOON CUT','wave','blade','crescent',['pierce']),alt:FA('IAI DASH','dash','blade','sword',[]),x:[FA('THOUSAND CUTS','dash','blade','sword',['mark','pierce']),FA('SWORD FOREST','pillar','blade','sword',['launch'])],u:FA('BLADE TEMPEST','rain','blade','sword',['pierce'],{power:1.3})},
 quake:{n:'TECTONIC',d:'the ground itself fights',c:0xff7a2a,a:0x5a3a1a,s:[1.2,.92,.85],k:'el sm el ds|ds|earth',
   sp:FA('FAULT SPIRES','pillar','earth','spike',['launch']),alt:FA('LANDSLIDE','wave','earth','boulder',['push']),x:[FA('EPICENTER','slam','earth','boulder',['stun']),FA('ROCK BARRAGE','volley','earth','boulder',[])],u:FA('MAGNITUDE TEN','burst','earth','boulder',['launch','stun'],{power:1.4})},
 entropy:{n:'CATASTROPHE',d:'everything crumbles',c:0x5a5560,a:0xff2a3a,s:[1.2,1,1.1],k:'pa bk el cm|ds|decay',
   sp:FA('CRUMBLE','cone','poison','hand',['drain'],{range:14}),alt:FA('RUIN SPIRES','pillar','poison','spike',['launch']),x:[FA('TOUCH OF RUIN','grab','poison','hand',['pull','drain']),FA('DUST FIELD','zone','poison','skull',['slow','drain'])],u:FA('ENDTIMES','burst','poison','skull',['drain','launch'],{power:1.4})},
 sovereign:{n:'ARSENAL',d:'every stolen power at once',c:0x1a1a2a,a:0xff3a3a,s:[1.25,.95,1],k:'pa pa bk up|sm|spirit',
   sp:FA('STOLEN CANNON','volley','void','orb',['explode']),alt:FA('RAPTURE GRIP','grab','spirit','hand',['pull','stun']),x:[FA('COMPOUND SHOCK','rain','lightning','lightning',['chain','stun'],{count:8}),FA('IRON SPIRES','pillar','metal','spike',['launch'])],u:FA('APEX RAY','beam','void','eye',['explode','pierce'],{power:1.4})},
 strobe:{n:'ACCELERANT',d:'faster than the frame rate',c:0x3fe0c5,a:0xffffff,s:[.95,1.3,1],k:'jR jL jR jL jR jL|dk|time',
   sp:FA('AFTERIMAGE','dash','time','star',[]),alt:FA('REWIND','blink','time','star',[],{self:['heal']}),x:[FA('FRAME SHARDS','volley','time','shard',['slow']),FA('STOP FIELD','zone','time','star',['stun'])],u:FA('STOPPED SECOND','burst','time','star',['stun'],{power:1.3})},
 pyre:{n:'HELLBLOOM',d:'flames hot enough to burn himself',c:0x3a8aff,a:0xd8f0ff,s:[1.3,1,1.2],k:'jR el jR sk|cm|bluefire',
   sp:FA('AZURE LANCE','beam','fire','flame',['burn'],{colors:[0x3a8aff,0xd8f0ff]}),alt:FA('PYRE RING','zone','fire','flame',['burn'],{colors:[0x3a8aff,0xd8f0ff]}),
   x:[FA('BLUE BREATH','cone','fire','flame',['burn'],{colors:[0x3a8aff,0xd8f0ff],range:14,size:1.3,dur:1.2}),FA('FLAME PILLARS','pillar','fire','flame',['burn','launch'],{colors:[0x3a8aff,0xd8f0ff]})],u:FA('SUPERNOVA','burst','fire','flame',['burn','launch'],{power:1.4,colors:[0x3a8aff,0xffffff]})},
 warp:{n:'RIFTWALKER',d:'space folds around him',c:0x4a1a7a,a:0xffd23f,s:[1.05,1.1,1],k:'pa dk pa ax|ds|void',
   sp:FA('RIFT STEP','blink','void','ring',[]),alt:FA('PORTAL SNATCH','grab','void','ring',['pull']),x:[FA('GATE BARRAGE','volley','void','ring',[]),FA('MIST MAZE','zone','void','ring',['slow'])],u:FA('GATE TURRETS','summon','void','eye',['mark'],{power:1.3})},
 hex:{n:'BLACK SEAL',d:'every sigil at full strength',c:0x1a3a1a,a:0x5aff8a,s:[1.1,1,1.05],k:'pa bk pa bk ax|cm|curse',
   sp:FA('SIGIL CARDS','volley','shadow','card',['mark']),alt:FA('HEX CIRCLE','zone','shadow','eye',['slow','mark']),x:[FA('BINDING SEAL','grab','shadow','card',['stun']),FA('CURSE PILLARS','pillar','shadow','eye',['launch'])],u:FA('GRAND CURSE','rain','shadow','card',['mark','drain'],{power:1.3})},
 scathe:{n:'WRAITH',d:'you never see the blade',c:0x2a0a0a,a:0xff3a2a,s:[1.15,1.15,1.1],
   sp:FA('GHOST CUT','dash','blade','blade',['pierce']),alt:FA('VANISH','blink','shadow','blade',[],{self:['haste']}),x:[FA('RIBBON CUTS','zone','blade','blade',['mark']),FA('KNIFE HALO','orbit','blade','knife',[])],u:FA('RED HARVEST','rain','blade','knife',['pierce'],{power:1.3})},
 solstice:{n:'EQUINOX',d:'ice and fire at full blast',c:0xffffff,a:0xff5a1f,s:[1.15,1,1.05],k:'jR el bk sk|up|icefire',
   sp:FA('GLACIER LINE','wave','ice','snowflake',['freeze']),alt:FA('FURNACE BEAM','beam','fire','flame',['burn']),x:[FA('ICE SPIRES','pillar','ice','spike',['freeze','launch']),FA('FLASHFIRE','cone','fire','flame',['burn'],{range:15,size:1.5,dur:1.2})],u:FA('SOLSTICE BREAK','burst','ice','snowflake',['freeze','burn'],{power:1.4})},
 piston:{n:'REDLINE',d:'engines past their limit',c:0xff3a1a,a:0xffd23f,s:[1.1,1.3,1.1],
   sp:FA('REDLINE KICK','dash','metal','star',['push']),alt:FA('PISTON DROP','slam','metal','star',['launch']),x:[FA('EXHAUST BLAST','cone','fire','flame',['push','burn']),FA('GEAR SHIFT','blink','wind','star',[],{self:['haste']})],u:FA('TOP GEAR','dash','metal','star',['launch'],{power:1.5})},
 snare:{n:'CAPTURE',d:'nobody gets away',c:0x2a2a2a,a:0xffd23f,s:[1.05,1.1,.95],k:'lk hk lk ax|dk|light',
   sp:FA('BINDING CLOTH','grab','metal','ring',['pull','stun']),alt:FA('GLARE','zone','light','eye',['slow']),x:[FA('WEIGHTED SCARF','bolt','metal','ring',['stun']),FA('TAKEDOWN','slam','metal','ring',['stun'])],u:FA('NULL GAZE','beam','light','eye',['stun','slow'],{power:1.3,size:.8,dur:2.4})},
 marble:{n:'SHOWSTOPPER',d:'the whole stage is his',c:0xffd23f,a:0x3a1a6a,s:[1.05,1.05,1],k:'pa pa bk cm|cm|crystal',
   sp:FA('MARBLE VOLLEY','volley','crystal','orb',['stun']),alt:FA('PALM TRAP','grab','crystal','orb',['pull','stun']),x:[FA('VANISHING ACT','blink','crystal','star',[]),FA('GRAND FINALE','rain','crystal','orb',['stun'])],u:FA('BIG TOP','zone','crystal','star',['stun','pull'],{power:1.3})},
 legion:{n:'MULTIPLY',d:'there are more of him',c:0x3a3a3a,a:0xfff0d8,s:[1.05,1.05,1.05],k:'jR jL jR jL sm|ds|teal',
   sp:FA('DOUBLE TROUBLE','summon','spirit','fist',[]),alt:FA('CROWD RUSH','dash','spirit','fist',['push']),x:[FA('FIST BARRAGE','volley','spirit','fist',[]),FA('ESCORT RING','orbit','spirit','fist',[])],u:FA('ARMY OF ME','summon','spirit','fist',['push'],{power:1.4,count:3})},
 recoil:{n:'SNIPER NEST',d:'patience, then one shot',c:0x2a3a2a,a:0xffd23f,s:[1.15,.9,1.05],
   sp:FA('RAILSHOT','beam','metal','bullet',['pierce']),alt:FA('SPREAD SHOT','volley','metal','bullet',[]),x:[FA('MORTAR','rain','explosion','bomb',['explode']),FA('RECOIL HOP','blink','wind','bullet',[],{self:['haste']})],u:FA('ONE SHOT','bolt','explosion','bullet',['pierce','explode'],{power:1.5,size:2})},
 crimson:{n:'SANGUINE',d:'the thirst takes over',c:0xc4102a,a:0xffb0c0,s:[1.1,1.15,1.1],k:'el bk el bk sk|dk|blood',
   sp:FA('NEEDLE RUSH','dash','blood','knife',['lifesteal']),alt:FA('MIMIC STEP','blink','blood','heart',[],{self:['haste']}),x:[FA('NEEDLE FAN','volley','blood','knife',['lifesteal']),FA('EMBRACE','grab','blood','heart',['drain'])],u:FA('CRIMSON KISS','grab','blood','heart',['drain','stun'],{power:1.4})},
 sawback:{n:'RAZOR BLOOM',d:'blades from every pore',c:0xd8d8e0,a:0xff3a3a,s:[1.15,1,.95],k:'el el bk sm|sm|blade',
   sp:FA('BLADE GARDEN','pillar','blade','spike',['launch']),alt:FA('SHRAPNEL FAN','volley','blade','shard',['pierce'],{count:7}),x:[FA('SPINNING SAWS','orbit','blade','chakram',[]),FA('RAZOR CHARGE','dash','blade','blade',['pierce'])],u:FA('THOUSAND BLADES','burst','blade','blade',['pierce','launch'],{power:1.4})},
 resect:{n:'SURGEON',d:'the battlefield is the operating table',c:0x3a2a1a,a:0xffd8a0,s:[1.1,1,1],k:'pa el pa cm|cm|redcrackle',
   sp:FA('REBUILD SPIKES','pillar','earth','spike',['launch']),alt:FA('DISSECT','grab','earth','hand',['stun']),x:[FA('FLOOR REWRITE','wave','earth','spike',['launch']),FA('SPIKE CROWN','burst','earth','spike',['launch'],{size:1.3})],u:FA('OPERATING THEATER','zone','earth','spike',['launch','stun'],{power:1.35})},
 cushion:{n:'BURN MODE',d:'stored energy, all at once — lean and fast',c:0xffd23f,a:0xff7a1a,s:[1.3,1.15,1.15],k:'jR jR jL jR sm|sm|impact',
   sp:FA('STORED SHOT','bolt','earth','fist',['push'],{power:1.3}),alt:FA('BELLY DROP','slam','earth','fist',['launch']),x:[FA('SHOCKWAVE','burst','earth','ring',['push']),FA('LEAN RUSH','dash','earth','fist',['push'])],u:FA('FULL RELEASE','beam','earth','fist',['launch','push'],{power:1.45})},
 corrosa:{n:'ACID RUSH',d:'skating on her own acid',c:0x9aff3a,a:0xff6ad8,s:[1.05,1.2,1.05],k:'hk lk hk sk ax|dk|acid',
   sp:FA('ACID SURF','wave','poison','bubble',['poison']),alt:FA('ACID GLOBS','volley','poison','bubble',['poison'],{count:5}),x:[FA('ACID RAIN','rain','poison','bubble',['poison']),FA('CORROSION POOL','zone','poison','bubble',['slow','poison'])],u:FA('MELTDOWN','burst','poison','bubble',['poison','launch'],{power:1.35})},
 verdict:{n:'PURGE',d:'judgment without mercy',c:0x2a0a0a,a:0xff2a2a,s:[1.2,1.1,1.1],k:'el bk el bk el sk|dk|blood',
   sp:FA('EXECUTIONER DASH','dash','blade','knife',['pierce']),alt:FA('JUDGMENT KNIVES','volley','blade','knife',['mark']),x:[FA('TASTE OF GUILT','grab','blood','knife',['stun']),FA('SHADOW STEP','blink','shadow','knife',[],{self:['haste']})],u:FA('FINAL VERDICT','dash','blade','knife',['stun','pierce'],{power:1.45})},
 decree:{n:'FULL AUTHORITY',d:'the law, unrestrained',c:0xffffff,a:0x3a6aff,s:[1.15,1,1],k:'pa jR pa jR cm|cm|gold',
   sp:FA('STAR DECREE','bolt','light','star',['stun','explode'],{size:2.2,speed:30}),alt:FA('EDICT SHIELD','shield','light','star',[]),x:[FA('STARFALL','rain','light','star',[]),FA('SUMMONS','grab','light','star',['pull'])],u:FA('ORBITAL LAW','beam','light','star',['stun','launch'],{power:1.4})},
 skitter:{n:'STREET LEGEND',d:'the fastest thing on the street',c:0x2aff6a,a:0xffffff,s:[1.05,1.3,1],k:'lk lk lk hk sk|dk|wind',
   sp:FA('SKID BLITZ','dash','wind','star',['push']),alt:FA('FLICK SHOT','bolt','wind','star',['stun']),x:[FA('ROOF HOP','blink','wind','star',[],{self:['haste']}),FA('PEBBLE STORM','volley','earth','star',[])],u:FA('MIDNIGHT RUN','dash','wind','star',['launch'],{power:1.35})},
 oldguard:{n:'LAST STAND',d:'too stubborn to fall',c:0xd8b080,a:0xffffff,s:[1.25,.95,.85],k:'jR jL jR el up|sm|impact',
   sp:FA('IRON KNUCKLE','dash','metal','fist',['push']),alt:FA('GUARD UP','shield','metal','fist',[]),x:[FA('HAYMAKER DROP','slam','earth','fist',['launch']),FA('KNUCKLE STORM','cone','metal','fist',['push'],{range:10,dur:1})],u:FA('ONE MORE ROUND','burst','metal','fist',['launch','stun'],{power:1.45})},
 hopstar:{n:'ENCORE STAGE',d:'the crowd is on its feet',c:0xff6ad8,a:0x6af0ff,s:[1.05,1.15,1],k:'hk lk hk ax|ds|sound',
   sp:FA('STAGE DIVE','slam','sound','note',['stun']),alt:FA('HIGH NOTE','burst','sound','note',['stun'],{size:1.3}),x:[FA('MELODY SHOTS','volley','sound','note',[]),FA('BACKFLIP','blink','sound','note',[],{self:['haste']})],u:FA('FINALE','zone','sound','note',['stun'],{power:1.3})},
 headliner:{n:'SHOWTIME',d:'cameras rolling, maximum might',c:0xffd23f,a:0xff3a6a,s:[1.15,1.1,1],k:'jR jL jR up|dk|gold',
   sp:FA('STAR DIVE','dash','light','star',['launch']),alt:FA('AUTOGRAPH SHOT','bolt','light','star',['mark']),x:[FA('TOUCHDOWN','slam','light','star',['launch']),FA('SPOTLIGHT RING','orbit','light','star',[])],u:FA('PRIME TIME BEAM','beam','light','star',['launch'],{power:1.4})},
 torrent:{n:'FULL THROTTLE',d:'no holding back',c:0xffffff,a:0x2a8aff,s:[1.2,.95,1.1],k:'pa jR jR jL cm|cm|spirit',
   sp:FA('TORRENT BEAM','beam','spirit','orb',['push','launch'],{size:2.1,range:34,dur:1.5,power:1.25}),alt:FA('GATLING FINGERS','volley','spirit','bullet',['pierce'],{count:12,speed:56,power:1}),
   x:[FA('SHOCK OUTPUT','burst','lightning','ring',['stun']),FA('GROUND BLAST','pillar','spirit','orb',['launch'],{count:4})],u:FA('OVERLOAD CANNON','beam','spirit','orb',['launch','explode'],{size:2.6,range:40,dur:3.4,power:1.6})},
 zanshin:{n:'RESONANCE',d:'the spirit inside, unleashed',c:0x0a0a0a,a:0xff2a2a,s:[1.2,1.1,1.1],k:'el bk el bk ds|cm|spirit',
   sp:FA('BLACK CRESCENT','wave','spirit','crescent',['pierce'],{colors:[0x0a0a0a,0xff2a2a]}),alt:FA('INSTANT STEP','dash','spirit','sword',[]),
   x:[FA('SPIRIT ROAR','burst','spirit','ring',['stun','push'],{size:1.4}),FA('CRESCENT FLURRY','volley','spirit','crescent',[],{colors:[0x0a0a0a,0xff2a2a]})],u:FA('SOUL CANNON','beam','spirit','crescent',['launch','pierce'],{power:1.4,colors:[0x1a0a0a,0xff2a2a]})}};

/* ---------- combos for each mode (built like uniqatk.js) ---------- */
(function(){for(const id in FORMS){const F=FORMS[id];if(!F.k)continue;const [c,h,fx]=F.k.split('|');const key='f_'+id;UATK[key]={c,h,fx};
  const toks=c.split(' '),raw=toks.reduce((s,t)=>s+TPL[t].dmg,0),k=15/raw*(toks.length>3?1.08:1),sp=toks.length>=6?1.4:1;
  toks.forEach((t,i)=>{const M=Object.assign({},TPL[t]);M.st/=sp;M.ac/=sp;M.rc/=sp;M.dmg=+(M.dmg*k).toFixed(1);const last=i===toks.length-1;
    if(last){M.launch=true;M.heavy=true;M.kb=Math.max(M.kb,9);M.up=Math.max(M.up,5);}else{delete M.launch;if(t!=='ax')delete M.heavy;delete M.shock;M.kb=Math.min(M.kb,4);M.up=Math.min(M.up,2);}
    if(!last)M.next='u_'+key+'_'+(i+1);MOVES['u_'+key+'_'+i]=M;});
  const H=Object.assign({},TPL[h]);H.st=Math.max(.24,H.st);H.rc=Math.max(.36,H.rc);H.dmg=+Math.max(11,H.dmg).toFixed(1);H.launch=true;H.heavy=true;H.kb=Math.max(H.kb,10);H.vfx=2;MOVES['u_'+key+'_H']=H;}})();

/* ---------- the mode version of a fighter ---------- */
const fmAbil=(m,F)=>sanitizeAbil(Object.assign({name:m[0],form:m[1],style:m[2],shape:m[3],fx:m[4],colors:[F.c,F.a]},m[5]||{}));
function modeKey(base){return base&&HEROES.some(h=>h.id===base.id)?KIT(base,'elem'):null;}
function modeHero(base){if(base._mode)return base._mode;const id=modeKey(base),F=FORMS[id];if(!F)return null;
  const sp=fmAbil(F.sp,F),spAlt=fmAbil(F.alt,F),ult=fmAbil(F.u,F);
  const H=Object.assign({},base,{as:Object.assign({},base.as||{},{elem:KIT(base,'elem'),alt:KIT(base,'alt'),wpn:F.k?'f_'+id:KIT(base,'wpn')}),
    special:'cab',cab:{sp,spAlt,ult,ultAlt:base.cab&&base.cab.ultAlt},ult:'cab',spName:sp.name,ultName:ult.name,specCD:cabSpecTime(sp),
    color:F.a,accent:F.c,css:'#'+F.a.toString(16).padStart(6,'0'),pow:(base.pow||1)*F.s[0],spd:(base.spd||1)*F.s[1],
    _xm:F.x.map(m=>fmAbil(m,F)),_fbase:base,_form:F});
  base._mode=H;return H;}
function baseHero(f){return f.hero._fbase||f.hero._bone||f.hero;}
function hasMode(f){if(!f||!f.hero)return false;const b=baseHero(f),k=modeKey(b);return k==='marrow'||!!FORMS[k];}
function inMode(f){return !!(f&&f.hero&&(f.hero._fbase||f.hero._bone));}
function modeName(f){const b=baseHero(f),k=modeKey(b);return k==='marrow'?'DREAD':FORMS[k]?FORMS[k].n:'';}
const FM_NO=['ult','special','grabbed','held','frozen','stun','bstun','framed'];
function canMode(f){return hasMode(f)&&!f.dead&&!f.downed&&FM_NO.indexOf(f.state)<0&&BRK_STATES.indexOf(f.state)<0&&!(f._formCD>game.time);}
function setMode(f,on){if(!f||inMode(f)===!!on)return;const b=baseHero(f);
  if(modeKey(b)==='marrow'){setForm(f,on);}
  else{const H=on?modeHero(b):b;if(!H)return;const F=FORMS[modeKey(b)];f.hero=H;f._formCD=game.time+1.5;f.stolen=null;f.stolenT=0;
    f.take=(f.take||1)*(on?F.s[2]:1/F.s[2]);modeSkin(f,on?F:null);
    const c=f.chest(new V3());
    if(on){ring(new V3(f.pos.x,f.pos.y+.2,f.pos.z),F.a,5,.45,true,2.6);ring(c,F.c,3.4,.35,false,2.6);burst(ADD,c,50,{colors:[F.c,F.a,0xffffff],speed:8,up:3,life:.7,size:.35,size1:0,bright:2.6});flashLight(c,F.a,10);}
    else burst(ADD,c,24,{colors:[b.color,b.accent],speed:6,life:.4,size:.25,size1:0,bright:2.2});
    xSnd(f.pos,()=>{AU.whoosh(true);if(on)AU.boom&&AU.boom(false);});
    if(f===ME){announceSmall(on?F.n+' MODE — '+F.d.toUpperCase():'BASE MODE');if(typeof buildSlots==='function')buildSlots();}}
  if(f===ME&&on)emitEv('modeMe',f);}
// recolor: bright parts → accent glow, mid → mode color, dark → deep tint (originals restored on switching back)
function modeSkin(f,F){f.rig.root.traverse(o=>{if(!o.isMesh||!o.material||!o.material.color||o.userData.noTint)return;
  if(F){if(!o.userData.fmOrig){o.userData.fmOrig=o.material;o.material=o.material.clone();}const c=o.userData.fmOrig.color,l=(c.r+c.g+c.b)/3;
    const mid=new THREE.Color(F.c),acc=new THREE.Color(F.a);
    if(l>.6)o.material.color.copy(acc);else if(l>.3)o.material.color.copy(mid);else o.material.color.copy(mid).multiplyScalar(.25);
    if(o.material.emissive){o.material.emissive.copy(l>.6?acc:mid);o.material.emissiveIntensity=l>.6?.9:.15;}}
  else if(o.userData.fmOrig){o.material.dispose();o.material=o.userData.fmOrig;o.userData.fmOrig=null;}});}

/* ---------- switching: the SWITCH MODE action (5) — processed by the host from each fighter's intent ---------- */
function modeReq(f){if(NET.role==='client')return;if(!hasMode(f))return;if(!canMode(f)){f._fmQ=game.time+1.2;return;}f._fmQ=0;const on=!inMode(f);setMode(f,on);if(NET.role==='host')netEvent({k:'fmode',id:f.id,on:on?1:0});}
onEv('net:fmode',e=>{const f=FS.find(q=>q.id===e.id);if(f)setMode(f,!!e.on);});
let FM_PREV=false;onEv('intent',()=>{if(!ME)return;const d=pressed.has('Digit5');if(d&&!FM_PREV){ME.intent.awk=true;netPressAcc|=1024;}FM_PREV=d;});
onEv('tick',dt=>{for(const f of FS){
  if(f.intent&&f.intent.awk){f.intent.awk=false;modeReq(f);}else if(f._fmQ&&f._fmQ>game.time&&canMode(f))modeReq(f);
  if(f.isBot&&NET.role!=='client'&&hasMode(f)&&!f.dead&&Math.random()<dt*.05&&canMode(f))modeReq(f);
  // mode aura
  const F=f.hero._form;if(F&&!f.dead&&Math.random()<.5&&nearCam(f.pos,40)){const col=Math.random()<.5?F.a:F.c;
    burst(ADD,TMP2.set(f.pos.x+rand(-.45,.45),f.pos.y+rand(.1,2),f.pos.z+rand(-.45,.45)),1,{colors:[col,0xffffff],speed:.8,up:3,life:.4,size:.25,size1:0,bright:2,rad:.25});}}
  const ch=$('modeChip');if(ch){const on=ME&&inMatch()&&hasMode(ME)&&!ME.dead;ch.style.display=on?'block':'none';
    if(on){const m=inMode(ME),k=typeof KB_NAMES!=='undefined'&&typeof kbLabel==='function'?kbLabel('awk'):'5';ch.innerHTML=`<kbd>${k}</kbd> ${m?'MODE: <b>'+modeName(ME)+'</b>':'MODE: BASE'}${ME._formCD>game.time?' <i>…</i>':''}`;ch.style.setProperty('--c',ME.hero.css);}}});
onEv('matchEnd',()=>FS.forEach(f=>{if(f.hero&&f.hero._fbase){f.take=(f.take||1)/f.hero._form.s[2];f.hero=f.hero._fbase;try{modeSkin(f,null);}catch(e){}}}));
(function(){if(!$('modeChip')){const d=document.createElement('div');d.id='modeChip';document.body.appendChild(d);}})();
