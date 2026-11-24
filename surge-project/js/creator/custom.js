/* Fighter creator: text-to-fighter keyword parsing */
/* ================= FIGHTER CREATOR =================
   Reads a written description and builds a fighter from the game's powers:
   element (look, sounds, punch effects, passive), weapon style, special, ultimate, alternate ultimate,
   colors, speed/size/strength, faction and move names written in "quotes". */
const CK={
  cinder:['fire','flame','burn','blaze','heat','lava','magma','ember','inferno','pyro','solar','sun!','dragon','breathes fire','fire breath','fire-breathing'],
  pyre:['blue fire','blue flame','azure','plasma','ghost fire','cold fire','soul fire'],
  riptide:['water','ocean','wave','tide','sea','aqua','hydro','ice','frost','snow','liquid','splash','blizzard','icicle'],
  gale:['wind','air','storm','tornado','gust','breeze','hurricane','cyclone','sonic','sound','music','guitar'],
  nitro:['explo','bomb','blast','boom','grenade','dynamite','detonat','nitro','sweat'],
  titan:['strength','strong','muscle','giant','brute','smash','punch','titan','mighty'],
  volta:['lightning','electric','thunder','shock!','shocks!','volt','spark','static','plasma bolt'],
  umbra:['shadow','dark','night','beast','monster','wolf','creature','assassin','stealth','invisible','smoke'],
  drift:['gravity','float','levitat','zero-g','moon','weightless','telekine'],
  bastion:['metal','steel','iron','armor','armour','knight','shield','tank!','robot','mech!','magnet','magnetic','cyborg','android'],
  quill:['feather','wing','bird','angel','flight','phoenix','fly','flying'],
  void:['space','star','cosmic','galaxy','void','black hole','planet','nebula','astral'],
  ronin:['sword','katana','samurai','blade','ninja','swordsman','fencer'],
  quake:['earth','rock','stone','ground','quake','sand','mountain','boulder','plant','vine','thorn','nature','flower','forest','tree'],
  marrow:['blood','flesh','bone','gore','meat','vampire','tentacle'],
  entropy:['decay','rot','dust','disintegrat','ash','erode','erosion','corro','acid','poison','toxic'],
  sovereign:['steal','copy','absorb','mimic','king','tyrant','overlord','emperor','drain','sovereign'],
  strobe:['time','freeze','frame','clock','rewind','pause','slow motion','camera','speedster'],
  warp:['portal','teleport','warp','dimension','rift','blink'],
  hex:['curse','magic','spell','witch','hex!','rune','sorcer','wizard','mage!','arcane','seal','ghost','spirit','soul','phantom','necromanc','reaper'],
  scathe:['demon','devil','claw','hell','fiend','talon','horn'],
  solstice:['half cold','half hot','fire and ice','ice and fire','frost and flame','glacier','permafrost','hot and cold'],
  piston:['engine','kick','kicks','kicking','motor','turbo','exhaust','racer','legs'],
  snare:['erase','erasure','nullify','scarf','capture','bind','binding','cancel powers'],
  marble:['compress','marble','shrink','magician','showman','top hat','trickster'],
  legion:['clone','clones','copies','duplicate','double','army of','multiply','twins'],
  recoil:['sniper','rifle','bullet','marksman','sharpshooter','deadeye','gunslinger'],
};
const SPKW={fireball:['fireball','fire ball','throw fire','shoot fire','shoots fire'],blade:['water blade','crescent','water slash','slice'],cyclone:['tornado','cyclone','whirlwind','twister'],
  rocket:['rocket','jet','propel','boost'],airburst:['shockwave','air punch','air cannon','air blast','pressure'],chainbolt:['chain lightning','lightning bolt','zap','bolt'],
  shadowgrab:['grab','pull','drag','snatch','tendril'],bubble:['bubble','trap','orb'],harden:['harden','iron skin','armor up','defen','toughen'],featherfan:['feather','dart','knife','knives','shuriken','needle'],
  nullfield:['force field','forcefield','repel','aura','barrier'],vow:['vow','sacrifice','berserk','rage','power up','buff'],fault:['fissure','crack','earthquake','ground wave','tremor'],
  bladeform:['arm blade','transform','grow blade','mutate','shapeshift'],erode:['erosion','disintegrat','decay wave','crumble'],siphon:['steal','siphon','drain','absorb','copy'],
  framelock:['freeze','stop time','time stop','frame','pause'],bluelash:['flamethrower','fire whip','lash','breath'],gate:['teleport','portal','blink','warp'],
  sigil:['curse','mark','rune','sigil','spell','hex'],rend:['slash','cut','rend','invisible'],
  glacier:['ice wall','glacier','ice spikes','freeze wave','frost wave'],recipro:['dash kick','flying kick','engine burst','kick dash'],bind:['scarf','lasso','capture','bind'],
  compress:['compress','marble','shrink'],double:['clone','duplicate','copy of himself','copy of herself','copies'],snipe:['snipe','sniper','rifle','headshot','long shot']};
const ULK={supernova:['nova','explode','self destruct','detonate','explosion'],tidal:['tsunami','tidal','flood','wave'],tempest:['barrage','flurry','rush','combo'],
  chain:['chain explosion','carpet','chain reaction','multiple explosion'],cataclysm:['giant punch','mega punch','smash','haymaker','one punch'],thunderdome:['thunderstorm','lightning storm','thunder dome','storm'],
  eclipse:['eclipse','darkness','blackout'],meteor:['meteor','asteroid','comet'],unbreakable:['unstoppable','charge','juggernaut','bulldoze'],skyfall:['dive','feather rain','skyfall','swoop'],
  singularity:['black hole','singularity','implosion','vortex'],thousandcuts:['thousand','slashes','flurry of cuts','blade storm'],tectonic:['quake','earthquake','slam','ground pound'],
  bloodarrow:['beam','laser','arrow','cannon','ray'],collapse:['collapse','crumble','disintegrat'],arsenal:['arsenal','copy all','every power','all powers'],
  stopmotion:['time stop','stop time','freeze time'],azureinferno:['inferno','firestorm','fire storm','pillar'],abyss:['abyss','rift','void portal','swallow'],
  sealedarena:['domain','arena','seal','cage'],dominion:['claws','demon king','dominion','shrine'],
  permafrost:['permafrost','ice age','glacier'],overdrive:['overdrive','kick barrage','kick rush'],erasure:['erase','erasure','nullify','cancel'],
  curtaincall:['curtain call','compress everyone','grand trick'],sanctuary:['clone army','army of clones','horde'],deadeye:['deadeye','sniper barrage','mark everyone']};
const ALK={cinder:['meteor','solar','rain of fire','fire rain'],riptide:['whirlpool','maelstrom','geyser'],gale:['eye of the storm','cyclones','many tornado'],nitro:['carpet','bombs','airstrike','air strike'],
  titan:['titan drop','leap','crater','jump slam'],volta:['ion','lightning beam','cannon'],umbra:['nightfall','shadow spikes','shadows rise'],drift:['zero','float everyone','anti gravity'],
  bastion:['aegis','reflect','fortress'],quill:['phoenix','dive bomb'],void:['big bang','star explosion'],ronin:['moonlit','severance','blink slash','teleport slash'],quake:['aftershock','rings','shockwaves'],
  marrow:['garden','bone spikes','spikes of bone'],entropy:['dust to dust','aura of decay','decay aura'],sovereign:['decree','steal all','take their powers'],strobe:['final cut','freeze everyone','freeze all'],
  pyre:['blue sun','sun of blue'],warp:['event horizon','drop from the sky','portals under'],hex:['hexfall','giant sigil','giant rune'],scathe:['hellmouth','maw','field of cuts'],
  solstice:['fire and ice','half and half','steam'],piston:['top gear','overclock','redline'],snare:['scarf storm','whirl'],marble:['grand finale','giant marble'],legion:['pile up','dogpile','from the sky'],recoil:['bullet hail','rain of bullets','hail']};
const GENSP=['throw','throws','shoot','shoots','hurl','launch','ball','projectile','fires a','blasts'];
const WK={marrow:['whip','tentacle','tendril','chain!','rope','lash'],ronin:['sword','katana','saber','sabre','blade','weapon'],scathe:['claw','talon','nails'],umbra:['shadow beast','beast companion','summons a beast','summons a monster','pet!','familiar','fights beside'],
  titan:['fist','punch','brawl','boxer','strong','strength','muscle']};
const CCOL={red:0xff2a3a,crimson:0xc4102a,orange:0xff7a1a,yellow:0xffd23f,gold:0xd8b060,golden:0xd8b060,green:0x3ad86a,lime:0x9aff3a,emerald:0x1fb86a,cyan:0x3fe0e0,teal:0x1fb8a8,
  blue:0x2a7aff,navy:0x1a2a8a,purple:0x8a3cff,violet:0x9a5aff,pink:0xff4f8b,magenta:0xff3ad8,white:0xf2f4ff,silver:0xc8ccd8,grey:0x8a8e9a,gray:0x8a8e9a,black:0x1a1820,brown:0x8a5a3a};
const IDEAS=['A lava giant who punches with fists of fire. Special: throws a "Magma Ball". Ultimate: a huge explosion called "Core Meltdown". Red and orange, big and strong.',
  'A fast ninja with a katana who teleports behind enemies. Ultimate: "Thousand Petal Cut" a flurry of slashes. Black and pink.',
  'A villain made of living shadows with tentacle whips. Special grabs and pulls enemies. Ultimate opens a black hole. Purple and black.',
  'An ice witch who casts curses and runes. Special: a curse mark. Ultimate: a sealed domain. Alt ultimate: a blizzard of water. White and cyan.',
  'A small speedy robot made of steel that freezes time. Ultimate: "Final Frame" time stop. Silver and teal.'];
// a keyword matches the start of a word (so 'explo' finds 'explosion'); a trailing ! makes it a whole word only ('drag!' skips 'dragon')
function kwRe(k){const w=k.endsWith('!');if(w)k=k.slice(0,-1);return new RegExp('(^|[^a-z])'+k.replace(/[-]/g,'\\-')+(w?'(?![a-z])':''),'g');}
function scoreMap(map,text,w){const sc={};if(w===0)return sc;for(const k in map){let s=0;for(const kw of map[k]){const m=text.match(kwRe(kw));if(m)s+=m.length*(1+kw.split(' ').length-1+(kw.length>6?.3:0));}if(s)sc[k]=(sc[k]||0)+s*(w||1);}return sc;}
function addSc(a,b){for(const k in b)a[k]=(a[k]||0)+b[k];return a;}
function bestK(sc,skip){let bk=null,bv=0;for(const k in sc){if(skip&&skip.indexOf(k)>=0)continue;if(sc[k]>bv){bv=sc[k];bk=k;}}return bk;}
function heroById(id){return HEROES.find(h=>h.id===id);}
function hexCss(n){return '#'+(n>>>0).toString(16).padStart(6,'0').slice(-6);}
function parseFighter(name,text){
  const raw=String(text||'').slice(0,1200),t=raw.toLowerCase();
  const clauses=raw.split(/[.;!?\n]+/).map(c=>c.trim()).filter(Boolean).map(c=>{const l=c.toLowerCase();
    const isAlt=/\balt(ernate)?\b|second ult|other ult|back ult/.test(l),isUlt=isAlt||/\bult|ultimate|super move|final move|finisher|signature/.test(l),isSpec=!isUlt&&/special|ability|skill|power move|signature move/.test(l);
    return {raw:c,l,kind:isAlt?'alt':isUlt?'ult':isSpec?'spec':'any'};});
  // words right after "controls / made of / power of / breathes / shoots ..." describe the power itself, so they count extra
  const tEl=t.replace(/smoke bombs?/g,'smoke cloud').replace(/["“”][^"“”]{2,24}["“”]/g,' ');const el=scoreMap(CK,tEl);
  [...tEl.matchAll(/\b(?:controls?|controlling|manipulates?|power of|powers of|made of|master of|bends?|wields?|breathes?|shoots?|throws?|summons?|uses?|harness(?:es)?|commands?|is a|is an)\s+((?:\w+\s+){0,2}\w+)/g)].forEach(m=>addSc(el,scoreMap(CK,' '+m[1],1.5)));
  // body words (giant, strong, punch) say less about the power than elements do
  if(el.titan&&Object.keys(el).length>1)el.titan*=.55;
  const elem=bestK(el)||'titan',elem2=bestK(el,[elem]);
  const spSc={},ulSc={};clauses.forEach(c=>{addSc(spSc,scoreMap(SPKW,c.l,c.kind==='spec'?3:c.kind==='any'?1:0));addSc(ulSc,scoreMap(ULK,c.l,c.kind==='ult'?3:c.kind==='any'?.5:0));});
  const base=heroById(elem);clauses.forEach(c=>{if(c.kind==='spec'||c.kind==='any'){let g=0;GENSP.forEach(w=>{if(kwRe(w).test(c.l))g++;});if(g)spSc[base.special]=(spSc[base.special]||0)+g*(c.kind==='spec'?2.5:1);}});
  spSc[base.special]=(spSc[base.special]||0)+.4;ulSc[base.ult]=(ulSc[base.ult]||0)+.4;
  let special=bestK(spSc)||base.special,ult=bestK(ulSc)||base.ult;
  let alt=elem;const altC=clauses.filter(c=>c.kind==='alt');if(altC.length){const at=altC.map(c=>c.l).join(' ');const a=bestK(addSc(scoreMap(ALK,at,3),scoreMap(CK,at)));if(a)alt=a;}else if(elem2&&el[elem2]>=1)alt=elem2;
  const ws=scoreMap(WK,t);let wpn=bestK(ws)||'fist';if(wpn==='titan'&&elem!=='titan'&&!(ws.titan>1))wpn='fist';
  const quote=c=>{const m=c.raw.match(/["“”]([^"“”]{2,24})["“”]/);return m?m[1].trim().toUpperCase():'';};
  let ultName='',spName='',altName='';clauses.forEach(c=>{const q=quote(c);if(!q)return;if(c.kind==='alt'&&!altName)altName=q;else if(c.kind==='ult'&&!ultName)ultName=q;else if(c.kind==='spec'&&!spName)spName=q;});
  if(!ultName&&!spName){const qs=[...raw.matchAll(/["“”]([^"“”]{2,24})["“”]/g)].map(m=>m[1].trim().toUpperCase());if(qs[0])spName=qs[0];if(qs[1])ultName=qs[1];}
  const cols=[];const cre=/\b(red|crimson|orange|yellow|gold|golden|green|lime|emerald|cyan|teal|blue|navy|purple|violet|pink|magenta|white|silver|grey|gray|black|brown)\b/g;let m;while((m=cre.exec(t))&&cols.length<2)if(cols.indexOf(m[1])<0)cols.push(m[1]);
  const has=re=>re.test(t);
  const spd=has(/\b(fast|quick|speedy|agile|swift|nimble|speedster)\b/)?1.18:has(/\b(slow|heavy|lumbering)\b/)?.9:1;
  // size words describing an object ("a giant hammer", "a big shield", "a tiny bomb") don't change the fighter's size
  const tSz=t.replace(/\b(giant|huge|big|massive|large|small|tiny|little)\s+(?:\w+\s+)?(hammer|sword|shield|axe|blade|gun|cannon|bomb|fist|fists|ball|wave|explosion|meteor|rock|boulder|beam|laser|pillar|storm|tornado|dragon|wings?|claws?|spear|scythe|weapon|robot|army|horde|black hole|crater|punch)s?\b/g,' ');
  const size=/\b(giant|huge|big|tall|massive|large|hulking)\b/.test(tSz)?'big':/\b(small|tiny|short|little|kid-sized|kid)\b/.test(tSz)?'small':'normal';
  const pow=has(/\b(strong|powerful|strength|mighty|brute|muscular)\b/)?1.12:has(/\b(weak|frail)\b/)?.92:1;
  const faction=has(/\b(villain|evil|bad guy|wicked|sinister|dark lord)\b/)?'villain':'hero';
  const ELEM_STYLE={cinder:'fire',pyre:'fire',riptide:'water',gale:'wind',nitro:'explosion',titan:'earth',volta:'lightning',umbra:'shadow',drift:'void',bastion:'metal',quill:'light',void:'void',ronin:'blade',quake:'earth',marrow:'blood',entropy:'poison',sovereign:'shadow',strobe:'time',warp:'spirit',hex:'spirit',scathe:'blood',solstice:'ice',piston:'explosion',snare:'spirit',marble:'crystal',legion:'earth',recoil:'metal'};
  const gear=readGear(raw,cols[1]?CCOL[cols[1]]:(cols[0]?CCOL[cols[0]]:base.accent));const noEl=!bestK(el);const cab=composeAbilities(raw,noEl?({gun:'explosion',bow:'wind',wand:'light',staff:'light',guitar:'sound',scythe:'shadow',sword:'blade',katana:'blade',dagger:'blade',axe:'metal',hammer:'metal'})[gear.type]||'light':ELEM_STYLE[elem]);if(elem==='pyre')[cab.sp,cab.spAlt,cab.ult,cab.ultAlt].forEach(a=>{if(a.style==='fire'){a.c1=0x2a8aff;a.c2=0xaee0ff;}});
  return sanitizeSpec({v:1,cab,gear,uid:Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name:(name||'').trim()||nameInText(clauses)||autoName(elem),text:raw,elem,look:elem,wpn,
    special:'cab',ult:'cab',alt:'cab',ultName:ultName||cab.ult.name,spName:spName||cab.sp.name,altName:altName||cab.ultAlt.name,_x:0,color:cols[0]?CCOL[cols[0]]:base.color,accent:cols[1]?CCOL[cols[1]]:(cols[0]?base.accent:base.accent),spd,pow,size,faction});}
const NAMEBITS={cinder:['BLAZE','EMBER','SCORCH'],pyre:['WISP','AZURE'],riptide:['TORRENT','SURF','FLOE'],gale:['ZEPHYR','SQUALL'],nitro:['FUSE','KABOOM'],titan:['COLOSSUS','BRICK'],volta:['ARC','JOLT'],
  umbra:['NOCTIS','DUSK'],drift:['ORBIT','HALO'],bastion:['AEGIS','RIVET'],quill:['PLUME','KESTREL'],void:['NOVA','ZENITH'],ronin:['KAGE','EDGE'],quake:['SLATE','TREMOR'],marrow:['SANGUINE','VEIN'],
  entropy:['RUST','DECAY'],sovereign:['REGENT','USURP'],strobe:['FLASH','TICK'],warp:['RIFT','PHASE'],hex:['RUNE','OMEN'],scathe:['FANG','MAW'],solstice:['EQUINOX','RIME'],piston:['TURBO','REDLINE'],snare:['NULL','TETHER'],marble:['GAMBIT','PRESTO'],legion:['ECHO','MIRROR'],recoil:['SIGHT','BALLIST']};
// "...named Vex" / "called Nightshade" / "Name: Bolt" in the description (not inside a move's clause)
function nameInText(cl){for(const c of cl){if(c.kind!=='any')continue;const m=c.raw.match(/\b(?:named|called|name is|name:|known as)\s+([A-Z][A-Za-z'-]{1,13})(?:\s+([A-Z][A-Za-z'-]{1,8}))?/);if(m)return (m[1]+(m[2]&&(m[1].length+m[2].length)<13?' '+m[2]:'')).toUpperCase();}return '';}
function autoName(e){return pick(NAMEBITS[e]||['NOVA']);}
const SIZES={small:[.92,.88],normal:[1,1],big:[1.12,1.25]};
function sanitizeSpec(s){if(!s||typeof s!=='object')return null;const ids=HEROES.map(h=>h.id),sps=HEROES.map(h=>h.special).concat(['cab']),uls=HEROES.map(h=>h.ult).concat(['cab']);
  const cab=s.cab&&typeof s.cab==='object'?{sp:sanitizeAbil(s.cab.sp),spAlt:sanitizeAbil(s.cab.spAlt),ult:sanitizeAbil(s.cab.ult),ultAlt:sanitizeAbil(s.cab.ultAlt)}:null;
  const pickOf=(v,list,d)=>list.indexOf(v)>=0?v:d;const str=(v,n)=>String(v||'').replace(/[<>&"]/g,'').slice(0,n);
  const elem=pickOf(s.elem,ids,'titan');
  return {v:1,uid:str(s.uid,20)||'x',name:str(s.name,14).toUpperCase()||'CUSTOM',text:str(s.text,1200),elem,look:pickOf(s.look,ids,elem),wpn:pickOf(s.wpn,['fist','titan','marrow','ronin','scathe','umbra'],'fist'),
    special:(s.special==='cab'&&!(cab&&cab.sp))?heroById(elem).special:pickOf(s.special,sps,heroById(elem).special),ult:(s.ult==='cab'&&!(cab&&cab.ult))?heroById(elem).ult:pickOf(s.ult,uls,heroById(elem).ult),
    alt:(s.alt==='cab'&&!(cab&&cab.ultAlt))?elem:pickOf(s.alt,ids.concat(['cab']),elem),cab,ai:s.ai?1:0,gear:sanitizeGear(s.gear),mold:sanitizeMold(s.mold),
    ultName:str(s.ultName,24).toUpperCase(),spName:str(s.spName,24).toUpperCase(),altName:str(s.altName,24).toUpperCase(),
    color:(+s.color>>>0)&0xffffff,accent:(+s.accent>>>0)&0xffffff,spd:clamp(+s.spd||1,.85,1.2),pow:clamp(+s.pow||1,.9,1.12),size:SIZES[s.size]?s.size:'normal',faction:s.faction==='villain'?'villain':'hero'};}
const SPN2={rocket:'ROCKET DASH',shadowgrab:'SHADOW GRAB',harden:'HARDEN',nullfield:'NULL FIELD',vow:'BLOOD VOW',bladeform:'BLADE FORM',siphon:'SIPHON',framelock:'FRAME LOCK',gate:'GATE'};
function spLabel(sp){return SPNAME[sp]||SPN2[sp]||sp.toUpperCase();}
const CUSTOM_CACHE={};
function customHero(spec,nocache){spec=sanitizeSpec(spec);if(!spec)return HEROES[0];const key=nocache?null:JSON.stringify(spec);if(key&&CUSTOM_CACHE[key])return CUSTOM_CACHE[key];
  const b=heroById(spec.look),e=heroById(spec.elem),sOwner=HEROES.find(h=>h.special===spec.special)||e,uOwner=HEROES.find(h=>h.ult===spec.ult)||e,[sc,bk]=SIZES[spec.size];
  const parts=[];if(spec.wpn==='marrow'||spec.special==='bladeform'||spec.ult==='bloodarrow')parts.push('marrow');if(spec.wpn==='umbra'||spec.special==='shadowgrab')parts.push('umbra');
  if(spec.wpn==='ronin')parts.push('ronin');if(spec.special==='nullfield')parts.push('void');if(spec.ult==='sealedarena')parts.push('hex');if(spec.special==='featherfan'||spec.ult==='skyfall')parts.push('quill');
  if(spec.special==='harden'||spec.ult==='unbreakable')parts.push('bastion');
  const spn=spec.spName||spLabel(spec.special);
  const h=Object.assign({},b,{id:'c_'+spec.uid,name:spec.name,custom:spec,faction:spec.faction,cls:'Custom',diff:'Custom',power:e.power,tags:['Created',({fist:'Fists',titan:'Heavy Fists',ronin:'Sword',scathe:'Claws',marrow:'Whips',umbra:'Shadow Beast'})[spec.wpn]||'Fists'],
    special:spec.special,specCD:sOwner.specCD,ult:spec.ult,ultName:spec.ultName||uOwner.ultName,spName:spn,altName:spec.altName||'',
    color:spec.color,accent:spec.accent,css:hexCss(spec.accent||spec.color),spd:spec.spd,pow:spec.pow,scale:+(sc).toFixed(2),bulk:+((b.bulk||1)*bk).toFixed(2),
    pat:e.pat,patK:e.patK,as:{look:spec.look,elem:spec.elem,wpn:spec.wpn==='fist'?'fist':spec.wpn,alt:spec.alt,parts}});
  if(spec.gear&&spec.gear.type!=='none'){h.gear=spec.gear;h.as.wpn='gear';h.as.parts=h.as.parts.filter(x=>x!=='ronin'&&!(x==='marrow'&&spec.special!=='bladeform'&&spec.ult!=='bloodarrow'));h.tags=['Created',GEAR_TYPES[spec.gear.type][0]];}
  if(spec.cab){if(spec.special==='cab'&&spec.cab.sp){h.special='cab';h.cab=spec.cab;h.spName=spec.spName||spec.cab.sp.name;h.specCD=cabSpecTime(spec.cab.sp);}
    if(spec.ult==='cab'&&spec.cab.ult){h.ult='cab';h.cab=spec.cab;h.ultName=spec.ultName||spec.cab.ult.name;}
    if(spec.alt==='cab'&&spec.cab.ultAlt){h.cab=spec.cab;h.as.alt='cab';h.altName=spec.altName||spec.cab.ultAlt.name;}}
  h.desc=`${spec.faction==='villain'?'A created villain':'A created hero'} with ${e.power.toLowerCase()}. Special ${spn}. Ultimate ${h.ultName}.`;
  if(spec.mold){h.mold=spec.mold;if(spec.mold.plain)h.as.look='plain';}
  if(key)CUSTOM_CACHE[key]=h;return h;}
/* saved creations */
let CSPECS=[];   // the fighter creator has been removed; no created fighters are loaded
function saveCustoms(){store.set('surge.customs',JSON.stringify(CSPECS));}
const CUST0=1000;
function heroAt(i){return i>=CUST0?(CSPECS[i-CUST0]?customHero(CSPECS[i-CUST0]):HEROES[0]):(HEROES[i]||HEROES[0]);}
function selEntry(){const cos=myCos();return mySel>=CUST0&&CSPECS[mySel-CUST0]?{hero:0,cos,cust:Object.assign({},CSPECS[mySel-CUST0],{text:''})}:{hero:Math.min(mySel,HEROES.length-1),cos};}
function rosterHero(r){if(r&&r.raid&&typeof raidBossHero==='function')return raidBossHero(r.raid);if(r&&r.heroObj)return r.heroObj;if(r&&r.dummy)return dummyHero();if(r&&r.cust)return customHero(r.cust);const h=HEROES[clamp(r.hero|0,0,HEROES.length-1)];const H=r&&r.cos&&r.cos.skin?skinHero(h,r.cos.skin):h;return r&&r.cos&&r.cos.human?Object.assign({},H,{human:true}):H;}
