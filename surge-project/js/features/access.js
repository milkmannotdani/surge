/* ACCESSIBILITY (Settings → ACCESSIBILITY)
   COLORBLIND MODE  re-maps the game picture's colors so reds/greens (or blues/yellows) stay distinguishable
   BIGGER TEXT      scales up the HUD, menus and pop-ups
   REDUCE FLASHING  no full-screen flashes, softer light bursts, less shake, no lightning; strong flashes are dimmed */
(function(){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';
  // daltonization-style matrices: shift the lost channel's information into channels the viewer can still tell apart
  const M={deut:'0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',prot:'0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',trit:'0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0'};
  const C={deut:'1.25 -.25 0 0 0  -.2 1.2 0 0 0  .3 -.3 1 0 0  0 0 0 1 0',prot:'1.3 -.3 0 0 0  -.25 1.25 0 0 0  .35 -.35 1 0 0  0 0 0 1 0',trit:'1 0 0 0 0  0 1.2 -.2 0 0  .25 -.25 1 0 0  0 0 0 1 0'};
  svg.innerHTML='<defs>'+Object.keys(M).map(k=>`<filter id="cb-${k}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${C[k]}"/></filter>`).join('')+'</defs>';document.body.appendChild(svg);})();
function applyAccess(){const cv=renderer.domElement;cv.style.filter=SET.cbMode&&SET.cbMode!=='off'?`url(#cb-${SET.cbMode})`:'';
  document.body.classList.toggle('bigtext',!!SET.bigText);document.body.classList.toggle('calm',!!SET.calm);}
const _acApply=applySettings;applySettings=function(){const r=_acApply.apply(this,arguments);try{applyAccess();}catch(e){}return r;};applyAccess();
// reduce flashing: screen flashes off, light bursts dimmed, shake capped, lightning skipped
const _acFlash=screenFlash;screenFlash=function(o,p){if(SET.calm)return;return _acFlash.apply(this,arguments);};
if(typeof flashLight==='function'){const _acFL=flashLight;flashLight=function(p,c,i){return _acFL.call(this,p,c,SET.calm?(i||1)*.3:i);};}
const _acShake=shake;shake=function(a,p){return _acShake.call(this,SET.calm?Math.min(a,.15):a,p);};
