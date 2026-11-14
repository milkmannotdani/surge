/* Fighter creator: Claude-designed abilities */
/* ================= ABILITY DESIGNER =================
   Turns a written description into new ability recipes.
   1) Claude designs them when this page can ask Claude (the published version here).
   2) Otherwise the built-in designer composes them from the words used. */
const DF={bolt:['ball','orb!','orbs!','bolt','shot','shoot','bullet','projectile','fireball','throw','hurl','spear','lance','arrow'],volley:['barrage','volley','flurry of','spray of','many','multiple','daggers','knives','needles','shards','feathers','swarm','bats!','turns into bats'],
  beam:['beam','laser','ray','stream'],wave:['wave','tsunami','ripple','wall of','ground wave','shockwave along','shockwaves'],burst:['explode','explosion','nova','burst','time stop','stops time','freeze time','freezes everything','around me','around them','around her','around him','nearby','detonate','blast around','pulse'],
  zone:['field','zone','area','pool','cloud','fog','mist','puddle','domain','storm over','aura that','toxic gas','gas!','spreads'],rain:['rain','meteor','from the sky','falling','downpour','hail of','hailstorm','shower of','raining','storm of','thunderstorm','lightning storm','blizzard','airstrike','air strike'],
  pillar:['pillar','pillar of','giant pillar','geyser','erupt','eruption','from the ground','column','spikes from','under them','orbital','orbital laser','laser strike','from orbit','strike from above','beam from the sky','sky beam','earthquake','earthquakes'],dash:['dash','charge','charges into','charges at','rush','tackle','ram!','rams!','lunge','barrel','slams into','plows'],blink:['teleport','blink','behind them','warp','vanish','invisible','turns invisible','from behind','appears behind','shadow step','sneak'],
  grab:['grab','pull','hook','tether','lasso','drag!','drags','dragging','chain them','reel','stretch','stretches','stretchy'],orbit:['orbit','circle','circling','spinning around','swirl around','surround'],cone:['breath','breathe','flamethrower','spray','cone','roar','scream','howl'],
  shield:['shield','barrier','block','reflect','protect','wall!'],buff:['power up','powers up','transform','transforms into','turns into a','becomes a giant','rage','enhance','boost','empower','mode!','awaken','unleash','berserk'],slam:['slam','ground pound','leap','jump and','smash the ground','smashes the ground','slams the ground','pounds the ground','stomp'],
  summon:['summon','turret','minion','clone','totem','familiar','drone','pet!','pets!','army of','robots']};
const DS={fire:['fire','flame','burn','lava','magma','heat','inferno','ember','sun','solar'],ice:['ice','icicle','frost','freez','snow','frozen','cold','blizzard','glacier'],water:['water','ocean','wave','tide','sea','aqua','bubble','splash'],
  wind:['wind','air','tornado','storm','gust','breeze','hurricane'],lightning:['lightning','electric','thunder','shock!','shocks!','volt','spark','plasma'],shadow:['shadow','dark','night','abyss','nightmare'],
  light:['light','holy','angel','radiant','sun','divine','laser','star'],earth:['earth','rock','stone','ground','sand','mountain','boulder','quake'],metal:['metal','steel','iron','chain!','robot','gear!','magnet','car!','cars!'],
  crystal:['crystal','gem','diamond','glass','prism'],blood:['blood','flesh','bone','vampire','gore'],poison:['poison','toxic','venom','acid','plague','sick!','sickness'],void:['void','space','cosmic','black hole','gravity','galaxy','star'],
  spirit:['spirit','ghost','soul','phantom','spectral','ethereal'],sound:['sound','sonic','music','song','scream','bass','echo'],plant:['plant','vine','thorn','leaf','flower','nature','root','wood','forest'],
  explosion:['explo','bomb','blast','grenade','boom','missile','rocket'],time:['time','clock','rewind','frame'],blade:['sword','blade','slash','cut','katana','scythe','sickle']};
const DFX={burn:['burn','ignite','set on fire','scorch'],freeze:['freez','frozen','frost','ice','chill'],poison:['poison','toxic','venom','acid','plague','rot'],stun:['stun','paralyz','daze','shock!','stagger'],
  pull:['pull','suck','draw in','vacuum','magnet','drag','reel'],push:['push','blow away','knock back','knockback','repel','blast away','send flying'],launch:['launch','into the air','uppercut','toss','skyward','up into'],
  float:['float','levitat','lift them','weightless','zero-g'],lifesteal:['lifesteal','drain life','heal','vampir','absorb life','siphon life'],chain:['chain','bounce','jumps between','arc!','arcs!','spread to'],
  explode:['explod','explosive','detonat','blow up','boom'],pierce:['pierce','through','penetrat','skewer'],mark:['mark!','marks!','curse','hex!','brand!'],slow:['slow','sticky','heavy','web','root','entangle'],drain:['steal energy','drain power','sap','steal their']};
const DSH={weapon:['his weapon','her weapon','their weapon','my weapon'],shuriken:['shuriken','throwing star','ninja star'],skull:['skull','skeleton','skulls'],dragon:['dragon','serpent','snake','wyrm','hydra'],
  bat:['bats!','vampire bat','bat!'],car:['car!','cars!','truck','trucks','bus!','vehicle','vehicles'],bubble:['bubble'],boulder:['boulder','rock','rocks','stone','meteor','asteroid'],lightning:['lightning','thunderbolt'],petal:['petal','rose','sakura','cherry blossom','flower','blossom'],
  leaf:['leaf','leaves'],card:['card','cards','tarot'],note:['note','notes','music','song','melody'],bomb:['bomb','grenade','dynamite','tnt'],knife:['knife','knives','dagger','kunai'],bullet:['bullet','bullets'],
  heart:['heart','love'],snowflake:['snowflake','snowflakes'],flame:['flame','flames','fireball','fire ball'],tornado:['tornado','twister','whirlwind','cyclone'],chakram:['chakram','ring blade','buzzsaw','saw blade'],
  crescent:['crescent','slash wave','wave of','air slash','blade wave'],eye:['eye','eyes','eyeball'],bone:['bone','bones'],feather:['feather','feathers','quill'],coin:['coin','coins','money','cash'],
  axe:['axe','axes','hatchet'],hammer:['hammer','hammers','mallet'],sword:['sword','swords','blade'],fist:['fist','fists','punch'],hand:['hand','hands','palm'],
  spike:['spike','spear','icicle','needle','thorn','lance','stake','fang'],blade:['scythe','sickle','disc'],ring:['ring','halo','hoop'],shard:['shard','crystal','gem','glass'],star:['star','comet','spark'],
  bird:['bird','phoenix','raven','crow','eagle','hawk','butterfl','wasp','bee','moth'],arrow:['arrow','arrows','bolt','missile','dart']};
const NUMW={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,dozen:12};
const NAMEW={fire:['INFERNO','BLAZE','EMBER','SOLAR'],ice:['FROST','GLACIER','ICE','WINTER'],water:['TIDAL','TORRENT','HYDRO','RIPTIDE'],wind:['GALE','CYCLONE','TEMPEST','ZEPHYR'],lightning:['THUNDER','VOLT','STORM','ARC'],
  shadow:['SHADOW','UMBRAL','NIGHT','DUSK'],light:['RADIANT','HOLY','DAWN','PRISM'],earth:['TERRA','STONE','QUAKE','BOULDER'],metal:['IRON','STEEL','CHROME','RIVET'],crystal:['CRYSTAL','GEM','PRISM','SHARD'],
  blood:['CRIMSON','BLOOD','MARROW','SANGUINE'],poison:['VENOM','TOXIC','PLAGUE','ACID'],void:['VOID','COSMIC','STAR','NEBULA'],spirit:['SPIRIT','PHANTOM','SOUL','WRAITH'],sound:['SONIC','ECHO','RESONANCE','BASS'],
  plant:['THORN','VINE','BLOOM','ROOT'],explosion:['BLAST','NOVA','DETONATION','KABOOM'],time:['CHRONO','TICK','REWIND','STASIS'],blade:['RAZOR','EDGE','SEVERING','CRESCENT']};
const FORMW={bolt:['SHOT','ORB','BOLT','LANCE'],volley:['BARRAGE','VOLLEY','STORM','SPRAY'],beam:['BEAM','RAY','CANNON','LANCE'],wave:['WAVE','SURGE','RIPPLE','TIDE'],burst:['NOVA','BURST','PULSE','ERUPTION'],
  zone:['FIELD','DOMAIN','PRISON','GROUNDS'],rain:['RAIN','FALL','DOWNPOUR','HAIL'],pillar:['PILLAR','GEYSER','SPIRE','ERUPTION'],dash:['RUSH','CHARGE','STRIKE','DRIVE'],blink:['STEP','BLINK','AMBUSH','PHASE'],
  grab:['HOOK','GRASP','TETHER','SNARE'],orbit:['HALO','ORBIT','RING','GUARD'],cone:['BREATH','ROAR','SPRAY','HOWL'],shield:['WALL','AEGIS','WARD','BARRIER'],buff:['AWAKENING','MODE','ASCENT','OVERDRIVE'],
  slam:['IMPACT','CRASH','QUAKE','DROP'],summon:['SENTINEL','TOTEM','FAMILIAR','TURRET']};
function dScore(map,t){const sc={};for(const k in map)for(const w of map[k]){const m=t.match(kwRe(w));if(m)sc[k]=(sc[k]||0)+m.length*(1+w.split(' ').length*.5);}return sc;}
function dTop(sc,n){return Object.keys(sc).sort((a,b)=>sc[b]-sc[a]).slice(0,n);}
function dCount(t){const m=t.match(/\b(\d{1,2})\b/);if(m)return +m[1];for(const w in NUMW)if(kwRe(w).test(t))return NUMW[w];return 0;}
function dName(style,form,seed){seed=Math.abs(Math.floor(seed))||0;const a=NAMEW[style]||['NEW'],b=FORMW[form]||['STRIKE'];return a[seed%a.length]+' '+b[Math.floor(seed/4)%b.length];}
function designOne(t,quoted,fallbackStyle,fallbackForm,seed,tier){
  const fsc=dScore(DF,t),ssc=dScore(DS,t),xsc=dScore(DFX,t),hsc=dScore(DSH,t);
  if(fsc.summon&&/summon\w*\s+(?:a |an |the )?(?:\w+\s+)?(storm|thunderstorm|rain|meteors?|lightning|tornado|blizzard|flood|tsunami|earthquake|wave|pillar|black hole|fire|ice)/.test(t))delete fsc.summon;
  let form=dTop(fsc,1)[0]||fallbackForm;let style=dTop(ssc,1)[0]||fallbackStyle;if(ssc[fallbackStyle]&&ssc[fallbackStyle]>=ssc[style])style=fallbackStyle;
  const fx=dTop(xsc,3);if(style==='fire'&&fx.indexOf('burn')<0&&fx.length<3)fx.push('burn');if(style==='ice'&&fx.indexOf('freeze')<0&&fx.length<3)fx.push('freeze');if(style==='poison'&&fx.indexOf('poison')<0&&fx.length<3)fx.push('poison');
  if(style==='blood'&&fx.indexOf('lifesteal')<0&&fx.length<3)fx.push('lifesteal');if(style==='lightning'&&fx.indexOf('chain')<0&&fx.length<3)fx.push('chain');if(style==='explosion'&&fx.indexOf('explode')<0&&fx.length<3)fx.push('explode');
  const self=[];if(/\bheal(s|ing)? (me|myself|self|them?selves)|regenerat/.test(t))self.push('heal');if(/\bshield(s)? (me|myself)|armor up|harden/.test(t)&&form!=='shield')self.push('shield');
  if(/faster|speed boost|haste/.test(t))self.push('haste');if(/stronger|damage boost|power boost/.test(t)&&form!=='buff')self.push('power');
  const shape=dTop(hsc,1)[0]||({fire:'orb',ice:'spike',water:'blade',wind:'ring',lightning:'arrow',shadow:'orb',light:'star',earth:'shard',metal:'blade',crystal:'shard',blood:'spike',poison:'orb',void:'star',spirit:'bird',sound:'ring',plant:'spike',explosion:'orb',time:'ring',blade:'blade'})[style];
  let shp=shape;if(/\b(throw|throws|hurl|hurls|toss|tosses|fling|flings|launch|launches)\b/.test(t)&&designOne.gear&&designOne.gear!=='none'&&new RegExp(designOne.gear).test(t))shp='weapon';
  const n=dCount(t);const size=/\b(huge|giant|massive|enormous|colossal|gigantic)\b/.test(t)?1.8:/\b(big|large)\b/.test(t)?1.35:/\b(small|tiny|little|mini)\b/.test(t)?.7:1;
  const fast=/\b(fast|quick|rapid|lightning.fast|speeding)\b/.test(t),slow=/\b(slow|lumbering)\b/.test(t);
  return sanitizeAbil({name:quoted||dName(style,form,seed),form,style,shape:shp,count:n||undefined,size:tier==='ult'?Math.max(size,1.2):size,speed:fast?45:slow?16:undefined,
    range:/\b(long range|far|across the|sniper)\b/.test(t)?30:undefined,dur:/\b(long|lasting|linger)\b/.test(t)?3:undefined,power:tier==='ult'?1.1:1,fx,self,colors:undefined});}
const ALTFORM={bolt:'burst',volley:'dash',beam:'blink',wave:'slam',burst:'bolt',zone:'dash',rain:'burst',pillar:'slam',dash:'bolt',blink:'burst',grab:'burst',orbit:'dash',cone:'blink',shield:'burst',buff:'dash',slam:'bolt',summon:'blink'};
const ULTFORM={bolt:'rain',volley:'rain',beam:'beam',wave:'wave',burst:'burst',zone:'zone',rain:'rain',pillar:'pillar',dash:'pillar',blink:'burst',grab:'zone',orbit:'orbit',cone:'beam',shield:'burst',buff:'burst',slam:'slam',summon:'summon'};
const GEARK={greatsword:['greatsword','great sword','giant sword','huge sword','massive sword','claymore','zweihander','buster sword'],katana:['katana','samurai sword','odachi'],
  sword:['sword','longsword','broadsword','saber','sabre','rapier','cutlass'],dagger:['dagger','daggers','knife','knives','kunai','dirk'],axe:['axe','hatchet','battle axe','battleaxe'],
  hammer:['hammer','warhammer','war hammer','mallet','sledgehammer'],mace:['mace','morning star','flail'],club:['club','baseball bat','crowbar','pipe','bat'],spear:['spear','javelin','pike','naginata','halberd'],
  trident:['trident'],lance:['lance'],scythe:['scythe','reaper'],sickle:['sickle','kama'],staff:['staff','quarterstaff','bo staff','rod','cane'],wand:['wand'],gun:['gun','guns','pistol','blaster','rifle','revolver','shotgun'],
  bow:['bow and arrow','bow','archer','crossbow','slingshot','sling!'],guitar:['guitar'],fan:['war fan','fans','fan'],chakram:['chakram','ring blade','discus'],claws:['claws','claw','talons'],gauntlets:['gauntlet','gauntlets','power glove','knuckles','brass knuckle'],
  whip:['whip','whips','tentacle','tentacles'],chain:['chains','chain','kusarigama'],shield:['sword and shield','with a shield','carries a shield','shield and sword']};
const GEARMAT={gold:0xffd23f,golden:0xffd23f,silver:0xd8dce6,steel:0xc8ccd8,iron:0x9aa0aa,black:0x26262e,obsidian:0x1a1824,dark:0x2a2a34,wooden:0x8a5a3a,wood:0x8a5a3a,bone:0xf0e6d6,crystal:0xbfefff,ice:0xbfefff,
  blood:0xc4102a,red:0xd02030,rusty:0x8a4a2a,glass:0xd8f4ff,neon:0x4fffd2,purple:0x8a3cff,blue:0x2a7aff,green:0x2ad86a,pink:0xff4f8b,white:0xf4f6ff};
function readGear(text,accent){const t=' '+String(text||'').toLowerCase().replace(/chain lightning/g,'')+' ';const sc=dScore(GEARK,t);if(sc.bow&&/elbow|bow down|rainbow/.test(t))sc.bow-=1;if(sc.club&&!/baseball bat|\bclub\b|crowbar|pipe/.test(t))delete sc.club;
  const type=dTop(Object.fromEntries(Object.entries(sc).filter(e=>e[1]>0)),1)[0]||'none';if(type==='none')return {type:'none'};
  const words=(GEARK[type]||[type]).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,''));let mat=null;
  for(const w of words){const m=t.match(new RegExp('([a-z]+)\\s+([a-z]+)\\s+'+w+'|([a-z]+)\\s+'+w));if(m){const c=[m[2],m[1],m[3]].find(x=>x&&GEARMAT[x]!=null);if(c){mat=GEARMAT[c];break;}}}
  const dual=new RegExp('\\b(dual|two|twin|pair of|double)\\s+(?:[a-z]+\\s+)?('+words.join('|')+')').test(t);
  const size=new RegExp('\\b(giant|huge|massive|enormous|colossal|oversized)\\s+(?:[a-z]+\\s+)?('+words.join('|')+')').test(t)?1.45:new RegExp('\\b(small|tiny|little)\\s+(?:[a-z]+\\s+)?('+words.join('|')+')').test(t)?.8:1;
  return sanitizeGear({type,c1:mat!=null?mat:({wand:0x8a5a3a,staff:0x8a5a3a,bow:0x8a5a3a,guitar:0xc4102a,club:0x8a5a3a})[type]||0xc8ccd8,c2:accent,size,dual,glow:true});}
function composeAbilities(text,mainStyle){const raw=String(text||'');
  const cl=raw.split(/[.;!?\n]+/).map(c=>c.trim()).filter(Boolean).map(c=>{const l=c.toLowerCase();const alt=/\balt(ernate)?\b|second ult|other ult|back ult/.test(l),ult=alt||/\bult|ultimate|super move|final move|finisher/.test(l);
    const salt=!ult&&/(second|other|back|alt(ernate)?) (special|ability|move)/.test(l),sp=!ult&&!salt&&/special|ability|skill|power move/.test(l);const q=(c.match(/["“”]([^"“”]{2,24})["“”]/)||[])[1];return {l,k:alt?'ua':ult?'u':salt?'sa':sp?'s':'any',q:q?q.trim().toUpperCase():''};});
  const all=raw.toLowerCase();designOne.gear=(readGear(raw,0)||{}).type;const seed=[...all].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
  const sc0=dScore(DS,all);if(sc0.blade&&Object.keys(sc0).length>1)delete sc0.blade;const st=dTop(sc0,1)[0]||mainStyle||'light';
  const grab=k=>{const c=cl.filter(x=>x.k===k);return {t:c.map(x=>x.l).join('. '),q:(c.find(x=>x.q)||{}).q||''};};
  const anyT=cl.filter(x=>x.k==='any').map(x=>x.l).join('. ');
  const s=grab('s'),sa=grab('sa'),u=grab('u'),ua=grab('ua');
  // powers described without a label ("throws bombs and turns invisible") each become their own move
  const ch=abilityChunks(anyT),used=new Set(),take=pred=>{const c=ch.find(x=>!used.has(x)&&pred(x));if(c)used.add(c);return c;};
  const uC=!u.t?take(c=>c.big):null,sC=!s.t?take(c=>c.atk)||take(()=>true):null,saC=!sa.t?take(c=>!c.big)||take(()=>true):null,uaC=!ua.t?take(c=>c.big)||take(()=>true):null;
  const sp=designOne(s.t||(sC&&sC.t)||anyT||all,s.q,st,'bolt',seed,'sp');
  const spAlt=designOne(sa.t||(saC?saC.t:''),sa.q,sp.style,ALTFORM[sp.form],Math.floor(seed/8),'sp');
  const ult=designOne(u.t||(uC?uC.t:''),u.q,st,ULTFORM[sp.form],Math.floor(seed/32),'ult');
  if(!u.t&&!uC){ult.form=ULTFORM[sp.form];ult.fx=sp.fx.slice();ult.name=dName(ult.style,ult.form,Math.floor(seed/32));}
  if(!sa.t&&!saC){spAlt.form=ALTFORM[sp.form];spAlt.fx=sp.fx.slice(0,2);spAlt.name=dName(spAlt.style,spAlt.form,Math.floor(seed/8));}
  if(spAlt.form===sp.form&&spAlt.style===sp.style&&!sa.t){spAlt.form=ALTFORM[sp.form];spAlt.name=dName(spAlt.style,spAlt.form,Math.floor(seed/8));}
  const ultAlt=designOne(ua.t||(uaC?uaC.t:''),ua.q,st,ult.form==='rain'?'burst':'rain',Math.floor(seed/128),'ult');
  if(!ua.t&&!uaC){ultAlt.form=ult.form==='rain'?'zone':'rain';ultAlt.fx=ult.fx.slice(0,2);ultAlt.name=dName(ultAlt.style,ultAlt.form,Math.floor(seed/128));}
  if(ultAlt.form===ult.form&&!ua.t){ultAlt.form=ult.form==='rain'?'zone':'rain';ultAlt.name=dName(ultAlt.style,ultAlt.form,Math.floor(seed/128));}
  return {sp,spAlt,ult,ultAlt};}
const BIGW=/\b(giant|huge|massive|enormous|colossal|everything|everyone|all enemies|whole|entire|army|horde|storm|thunderstorm|sky|orbital|meteor|black hole|tsunami|earthquake|transforms?|apocalypse|armageddon|nuke|pillar)\b/;
function abilityChunks(t){if(!t)return [];const ATK=['bolt','volley','beam','cone','grab','dash','blink','slam','wave','burst'];
  return t.split(/,|;|\band then\b|\bthen\b|\band\b|\bwho\b|\bthat\b|\bwhile\b|\bbut\b/).map(x=>x.trim()).filter(x=>x.length>4&&!(/^(a|an)\s/.test(x)&&/\bwith\b/.test(x))).map(x=>{const sc=dScore(DF,x);
    if(sc.summon&&/summon\w*\s+(?:a |an |the )?(?:\w+\s+)?(storm|thunderstorm|rain|meteors?|lightning|tornado|blizzard|flood|tsunami)/.test(x))delete sc.summon;
    const f=dTop(sc,1)[0];return f?{t:x,f,big:f!=='shield'&&BIGW.test(x)||['rain','pillar','summon','buff'].indexOf(f)>=0&&!/\bsmall|little|tiny\b/.test(x),atk:ATK.indexOf(f)>=0}:null;}).filter(Boolean);}
/* ---- Claude-designed fighters (only where this page can ask Claude) ---- */
const SAMPLE_P=(window.claude&&typeof window.claude.use==='function')?window.claude.use('sample').catch(()=>null):Promise.resolve(null);
let AI_OK=false;SAMPLE_P.then(s=>{AI_OK=!!s;if(typeof aiBadge==='function')aiBadge();});
function aiPrompt(name,text){return `You design fighters for a 3D superhero battle royale game. Read the player's description and design a fighter with brand-new abilities that match it as closely as possible.
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"name":"<max 14 chars>","faction":"hero|villain","colors":["#rrggbb","#rrggbb"],"look":"<base look id>","power":"<punch power id>","weapon":{"type":"<weapon type>","colors":["#rrggbb metal/main","#rrggbb glow"],"size":0.7-1.6,"dual":true|false},"speed":"slow|normal|fast","size":"small|normal|big","strength":"light|normal|strong",
"special":ABILITY,"specialAlt":ABILITY,"ultimate":ABILITY,"ultimateAlt":ABILITY}
ABILITY = {"name":"<catchy, max 22 chars>","desc":"<what it does, max 100 chars>","form":"<form>","style":"<style>","shape":"<shape>","colors":["#rrggbb","#rrggbb"],"count":1-12,"size":0.5-2.2,"range":3-36,"speed":8-60,"duration":0-4,"power":0.6-1.5,"effects":[up to 4],"self":[up to 2]}
form (how it is delivered): bolt (one projectile), volley (many small projectiles), beam (channelled laser), wave (travels along the ground), burst (explodes around the user), zone (lingering damaging area at a target), rain (things fall from the sky on an area), pillar (erupts under enemies), dash (dashes through enemies), blink (teleports behind target and strikes), grab (pulls the target in), orbit (orbs circle the user), cone (breath/spray in front), shield (blocks and reflects), buff (powers the user up), slam (leaps and crashes down), summon (a turret/familiar that shoots).
style (visuals and sound): fire, ice, water, wind, lightning, shadow, light, earth, metal, crystal, blood, poison, void, spirit, sound, plant, explosion, time, blade.
shape (the model that flies or orbits — pick what the description says it looks like): car, orb, spike, blade, ring, shard, star, bird, arrow, axe, hammer, sword, shuriken, skull, fist, hand, dragon, bat, bubble, boulder, lightning, petal, leaf, card, note, bomb, knife, bullet, heart, snowflake, flame, tornado, chakram, crescent, eye, bone, feather, coin, weapon (throws the fighter's own weapon).
weapon type (what the fighter holds and fights with; choose what the description says, "none" for bare hands): none, sword, katana, greatsword, dagger, axe, hammer, mace, club, spear, trident, lance, scythe, sickle, staff, wand, gun, bow, guitar, fan, chakram, claws, gauntlets, whip, chain, shield (sword and shield). Guns, bows and wands shoot when attacking; spears and staffs have long reach; hammers, axes, greatswords, clubs and guitars hit slow and hard.
effects (on enemies): burn, freeze, poison, stun, pull, push, launch, float, lifesteal, chain, explode, pierce, mark, slow, drain.
self (on the user): heal, shield, haste, power, lift.
look ids (body style to start from) and power ids (punch effect): cinder fire, riptide water, gale wind, nitro explosions, titan strength, volta lightning, umbra shadow beast, drift gravity, bastion metal armor, quill feathers/wings, void cosmic, ronin samurai, quake earth, marrow blood/flesh, entropy decay, sovereign power theft, strobe time, pyre blue fire, warp portals, hex curses, scathe demon, solstice ice and fire, piston engine kicks, snare erasure scarf, marble compression magician, legion clones, recoil sniper rifle.
Rules: "special" is the main move (short cooldown). "specialAlt" is a different second special. "ultimate" is the big finisher; "ultimateAlt" is a second, different ultimate. Keep moves different from each other. Use the player's own move names when they give them (often in quotes). Higher count/size/duration should come with lower power. Pick colors that fit.
Player's fighter name: ${JSON.stringify(String(name||'').slice(0,20))}
Design rules: use every power the player wrote, each in the slot they gave it (special, ultimate, alternate ultimate); powers they listed without a slot become the special and specialAlt, with the biggest or most dramatic one as the ultimate. Give the four abilities four different forms unless the description clearly wants the same delivery twice. Pick the look and power ids for the fighter's main power, not for words that only describe a weapon or the body. Keep any name the player put in quotes exactly.
Player's description: ${JSON.stringify(String(text||'').slice(0,1200))}`;}
function pickJSON(t){const s=String(t||'');const i=s.indexOf('{'),j=s.lastIndexOf('}');if(i<0||j<=i)return null;try{return JSON.parse(s.slice(i,j+1));}catch(e){return null;}}
async function aiDesign(name,text,onProgress){const sample=await SAMPLE_P;if(!sample)return null;
  const r=await sample(aiPrompt(name,text),{modelTier:'default',onText:({text})=>{if(onProgress)onProgress(text.length);}});const j=pickJSON(r&&r.text);if(!j)throw {code:'bad_json',message:'Could not read the design'};return j;}
function specFromAI(j,base){const ids=HEROES.map(h=>h.id);const one=(v,l,d)=>l.indexOf(v)>=0?v:d;const s=Object.assign({},base);
  if(j.name)s.name=j.name;s.faction=j.faction==='villain'?'villain':j.faction==='hero'?'hero':s.faction;
  const cs=Array.isArray(j.colors)?j.colors:[];s.color=cabCol(cs[0],s.color);s.accent=cabCol(cs[1],s.accent);
  s.look=one(j.look,ids,s.look);s.elem=one(j.power,ids,s.elem);if(j.weapon&&typeof j.weapon==='object'){const gw=j.weapon;s.gear=sanitizeGear({type:gw.type,colors:gw.colors,size:gw.size,dual:gw.dual,glow:true});s.wpn='fist';}else s.wpn=one(j.weapon,['fist','titan','ronin','scathe','marrow','umbra'],s.wpn);
  s.spd=({slow:.9,normal:1,fast:1.18})[j.speed]||s.spd;s.size=({small:'small',normal:'normal',big:'big'})[j.size]||s.size;s.pow=({light:.92,normal:1,strong:1.12})[j.strength]||s.pow;
  const sp=sanitizeAbil(j.special),spAlt=sanitizeAbil(j.specialAlt),ult=sanitizeAbil(j.ultimate),ultAlt=sanitizeAbil(j.ultimateAlt);
  if(sp&&ult){s.cab={sp,spAlt:spAlt||null,ult,ultAlt:ultAlt||null};s.special='cab';s.ult='cab';s.alt=ultAlt?'cab':s.alt;s.spName=sp.name;s.ultName=ult.name;s.altName=ultAlt?ultAlt.name:'';s.ai=1;}
  return s;}
