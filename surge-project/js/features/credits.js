/* CREDITS + little nods to My Hero Academia (by Kōhei Horikoshi).
   SURGE is an unofficial, fan-made game. Its fighters, story and designs are original; some are inspired by
   characters from My Hero Academia (Kōhei Horikoshi, published by Shueisha) and Jujutsu Kaisen (Gege Akutami, Shueisha).
   The nods: the CREDITS screen, "Inspired by" notes on fighters, Musutafu street signs, a Plus Ultra comeback call-out,
   loading/title tips, and a couple of bot names. */
const INSPIRED={solstice:'Shoto Todoroki',piston:'Tenya Iida',snare:'Shota Aizawa (Eraser Head)',marble:'Mr. Compress',legion:'Twice',recoil:'Lady Nagant',
  crimson:'Himiko Toga',sawback:'Spinner',resect:'Overhaul',cushion:'Fat Gum',corrosa:'Mina Ashido',verdict:'Stain (the Hero Killer)'};
// "Inspired by" note under a fighter's description
const _previewHeroC=previewHero;
previewHero=function(i){_previewHeroC(i);const h=heroAt(i),d=$('pvDesc');if(!d||!h||!INSPIRED[h.id])return;
  const n=document.createElement('div');n.className='insp';n.textContent=`Inspired by ${INSPIRED[h.id]} from My Hero Academia by Kōhei Horikoshi`;d.appendChild(n);};
// the credits screen
function showCredits(){showScreen('credits');}
$('bCredits').onclick=()=>{AU.init();AU.ui();showCredits();};$('crBack').onclick=()=>{AU.ui();showScreen('title');};
// Plus Ultra: win a match on 15 HP or less
onEv('win',w=>{if(w&&ME&&ally(w,ME)&&!ME.dead&&ME.hp<=15&&!game.practice)setTimeout(()=>{announce('PLUS ULTRA!','#ffd23f');announceSmall('YOU WENT BEYOND YOUR LIMITS · A NOD TO MY HERO ACADEMIA');},900);});
// title tip line that rotates through a few nods
const NODS=['"Plus Ultra" — the motto of a certain hero academy. Go beyond!','The Hero License Exam mission is a tribute to My Hero Academia.','Win on 15 HP or less for a little surprise.',
  'Some fighters are inspired by My Hero Academia by Kōhei Horikoshi — see CREDITS.','The city in this game borrows its street signs from Musutafu.'];
let nodI=Math.floor(Math.random()*NODS.length);function nodTick(){const e=$('nodTip');if(e){e.textContent=NODS[nodI%NODS.length];nodI++;}}nodTick();setInterval(nodTick,7000);
// a couple of bot names
BOTN.push('PlusUltra','Musutafu Kid');
