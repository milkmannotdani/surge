/* Key rebinding. Every action has a default key (KB_ACTIONS); the player can bind any other key in Settings.
   mapKey(physicalCode) turns the key that was pressed into the default code the game listens for.
   A default key that has been moved to another action stops working for its old action. */
const KB_ACTIONS=[['fwd','MOVE FORWARD','KeyW'],['back','MOVE BACK','KeyS'],['left','MOVE LEFT','KeyA'],['right','MOVE RIGHT','KeyD'],['jump','JUMP','Space'],['dash','DASH / SPRINT','ShiftLeft'],
  ['light','LIGHT ATTACK','KeyJ'],['heavy','HEAVY ATTACK','KeyK'],['block','BLOCK','KeyF'],['m1','MOVE 1 (SPECIAL)','Digit1'],['m2','MOVE 2','Digit2'],['m3','MOVE 3','Digit3'],['m4','MOVE 4','Digit4'],
  ['ult','ULTIMATE','KeyQ'],['awk','AWAKEN','KeyX'],['res','RESCUE / REVIVE / LIFT CAR','KeyR'],['lock','LOCK-ON','Tab'],['emote','EMOTE WHEEL','KeyB'],['chat','QUICK CHAT','KeyT'],['ping','PING','KeyG'],['ptt','PUSH TO TALK','KeyV']];
SET.binds=SET.binds||{};let REMAP={};
function rebuildRemap(){REMAP={};const phys={};KB_ACTIONS.forEach(([a,,d])=>{phys[a]=SET.binds[a]||d;});
  KB_ACTIONS.forEach(([a,,d])=>{if(phys[a]!==d)REMAP[phys[a]]=d;});
  KB_ACTIONS.forEach(([a,,d])=>{if(phys[a]!==d&&!KB_ACTIONS.some(([b])=>phys[b]===d))REMAP[d]=REMAP[d]||'__unbound';});
  KB_ACTIONS.forEach(([a,,d])=>{KB_NAMES[a]=keyLabel(phys[a]);});}
function mapKey(c){return REMAP[c]||c;}
function keyLabel(c){if(!c)return '—';if(c.startsWith('Key'))return c.slice(3);if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad'))return 'NUM '+c.slice(6);
  return ({Space:'SPACE',ShiftLeft:'L SHIFT',ShiftRight:'R SHIFT',ControlLeft:'L CTRL',ControlRight:'R CTRL',AltLeft:'L ALT',AltRight:'R ALT',Tab:'TAB',CapsLock:'CAPS',Backquote:'`',Minus:'-',Equal:'=',
    BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',Enter:'ENTER',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'})[c]||c.toUpperCase();}
let KB_WAIT=null;
addEventListener('keydown',e=>{if(!KB_WAIT)return;e.preventDefault();e.stopImmediatePropagation();const a=KB_WAIT;KB_WAIT=null;
  if(e.code!=='Escape'){const def=KB_ACTIONS.find(x=>x[0]===a)[2];
    // swap with whatever action already used that key
    const cur=k=>SET.binds[k]||KB_ACTIONS.find(x=>x[0]===k)[2];const other=KB_ACTIONS.find(([b])=>b!==a&&cur(b)===e.code);if(other)SET.binds[other[0]]=cur(a);
    SET.binds[a]=e.code;KB_ACTIONS.forEach(([b,,d])=>{if(SET.binds[b]===d)delete SET.binds[b];});setSave();rebuildRemap();}
  AU.ui();showSettings();},true);
function bindRows(){const L=$('setList');const h=document.createElement('div');h.className='seth';h.textContent='KEY BINDINGS · CLICK A KEY, THEN PRESS THE NEW ONE';L.appendChild(h);
  const g=document.createElement('div');g.className='kbgrid';KB_ACTIONS.forEach(([a,n,d])=>{const r=document.createElement('div');r.className='kbrow';const cur=SET.binds[a]||d;
    r.innerHTML=`<span>${n}</span><button class="chip ${cur!==d?'on':''}">${KB_WAIT===a?'PRESS A KEY…':keyLabel(cur)}</button>`;r.querySelector('button').onclick=()=>{AU.ui();KB_WAIT=a;showSettings();};g.appendChild(r);});
  L.appendChild(g);const rb=document.createElement('div');rb.className='rowb';rb.style.margin='8px 0 0';rb.innerHTML='<button class="btn ghost sm" id="kbReset">RESET KEYS</button>';L.appendChild(rb);
  $('kbReset').onclick=()=>{SET.binds={};setSave();rebuildRemap();AU.ui();showSettings();};}
const _showSettings0=showSettings;showSettings=function(){_showSettings0();bindRows();};
const _setReset0=$('setReset').onclick;$('setReset').onclick=()=>{_setReset0();SET.binds={};setSave();rebuildRemap();showSettings();};
rebuildRemap();
