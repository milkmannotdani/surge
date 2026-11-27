/* PROJECTILE LOOKS — every fighter's projectiles match them instead of the shared glowing orb.
   1. Extra moves (3/4) get a model that fits their name (Bone Rain → bones, Knife Toss → knives, Night Bats → bats…).
   2. Any ability projectile still using the plain orb uses the fighter's signature projectile (PROJ_SIG):
      Cinder flames, Volta lightning, Quill feathers, Marrow bones, Recoil bullets, Hopstar music notes…
   Models come from the shape library in gear.js (CAB_SHAPES2) plus spike/blade/ring/shard/star/arrow/bird. */
const PROJ_MOVE={'BUBBLE PRISON':'bubble','WIND BLADES':'crescent','STICKY BOMBS':'bomb','NIGHT BATS':'bat','METEOR TOSS':'boulder','STAR SHOWER':'star',
  'SPIRIT SLASHES':'crescent','BOULDER TOSS':'boulder','BONE RAIN':'bone','DECAY ORB':'skull','TYRANT ORBS':'eye','AZURE FLARES':'flame','PORTAL BARRAGE':'chakram',
  'CURSED NEEDLES':'spike','CARD TRICK':'card','MUD BOMB':'boulder','FLASH GRENADE':'bomb','SUPPRESSING FIRE':'bullet','KNIFE TOSS':'knife','PHANTOM SWARM':'skull',
  'FEATHER GUARD':'feather','SHADOW SPIKES':'spike','BLADE RUSH':'sword','HAYMAKER':'fist','TAKEDOWN':'hand','SKY HOOK':'hand','IRON GRASP':'hand','SCARF WHIP':'ring'};
const PROJ_SIG={cinder:'flame',riptide:'bubble',gale:'tornado',nitro:'bomb',titan:'fist',volta:'lightning',umbra:'bat',drift:'boulder',bastion:'fist',quill:'feather',
  void:'star',ronin:'crescent',quake:'boulder',marrow:'bone',entropy:'skull',sovereign:'eye',strobe:'chakram',pyre:'flame',warp:'chakram',hex:'eye',scathe:'crescent',
  solstice:'snowflake',piston:'fist',snare:'ring',marble:'card',legion:'boulder',recoil:'bullet',crimson:'knife',sawback:'sword',resect:'spike',cushion:'fist',
  corrosa:'bubble',verdict:'knife',decree:'coin',skitter:'coin',oldguard:'fist',hopstar:'note',headliner:'star',zanshin:'crescent',dread:'skull'};
const PROJ_OK=new Set([...CAB_SHAPES,...(typeof CAB_SHAPES2!=='undefined'?CAB_SHAPES2:[])]);
// 1) extra moves: pick the model from the move's name
for(const k in XMOVES)XMOVES[k].forEach(m=>{const s=PROJ_MOVE[m[0]];if(s&&PROJ_OK.has(s))m[3]=s;else if(m[3]==='orb'){const sig=PROJ_SIG[k];if(sig&&PROJ_OK.has(sig))m[3]=sig;}});
HEROES.forEach(h=>{h._xm=null;});
// 2) anything still drawn as a plain orb uses the fighter's signature projectile
const _pjMesh=cabMesh;
cabMesh=function(A,s,f){if(A&&A.shape==='orb'&&f&&f.hero){const sig=PROJ_SIG[KIT(f.hero,'elem')];if(sig&&PROJ_OK.has(sig))A=Object.assign({},A,{shape:sig});}
  const g=_pjMesh.call(this,A,s,f);if(f&&g&&A.shape!=='orb')projReadable(g,A);return g;};
// fighters' projectile models: solid main body (so the shape reads), softer glow on the accent parts
function projReadable(g,A){const c1=new THREE.Color(A.c1).multiplyScalar(2.2);g.traverse(o=>{const m=o.material;if(!m||!m.color||m.blending!==THREE.AdditiveBlending)return;
  const d=Math.abs(m.color.r-c1.r)+Math.abs(m.color.g-c1.g)+Math.abs(m.color.b-c1.b);
  if(d<.06){m.blending=THREE.NormalBlending;m.color.setHex(A.c1);m.opacity=Math.min(1,(m.opacity||1)+.15);m.depthWrite=true;m.needsUpdate=true;}
  else{m.color.multiplyScalar(.55);m.needsUpdate=true;}});}
