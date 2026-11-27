/* STABILITY — keeps the game running when something goes wrong.
   1. A fighter whose update throws is reset to a safe state (instead of throwing every frame and freezing the match).
   2. Any other error inside a frame is caught, logged once, and the scene is still drawn.
   3. When a match ends, each fighter's meshes, materials and textures are freed on the GPU
      (before, every match leaked ~200 geometries — after many matches the tab could run out of memory and crash).
   4. If the browser drops the WebGL context (GPU reset / out of memory), a clear "click to reload" message appears.
   Recent errors are kept in window.__errs (and localStorage 'surge.errors') to help track bugs down. */
window.__errs=[];
function logErr(where,e){const msg=where+': '+(e&&e.message||e);if(__errs.some(x=>x.msg===msg)){return;}
  __errs.push({msg,stack:String(e&&e.stack||'').slice(0,500),t:new Date().toISOString()});console.error('[SURGE]',msg,e);
  try{localStorage.setItem('surge.errors',JSON.stringify(__errs.slice(-20)));}catch(_){}}

// 1. per-fighter guard
const _stUpd=Fighter.prototype.update;
Fighter.prototype.update=function(dt){try{return _stUpd.call(this,dt);}catch(e){logErr('fighter '+(this.hero&&this.hero.id)+' in '+this.state,e);
  try{this.vf={};this.stolen=null;this.framedT=0;this.xHold=null;if(this.rig&&this.rig.root)this.rig.root.scale.setScalar(this.hero.scale||1);
    this.set(this.onGround?'idle':'air');if(!isFinite(this.pos.x)||!isFinite(this.pos.y)||!isFinite(this.pos.z))this.pos.set(0,5,0);if(!isFinite(this.vel.x+this.vel.y+this.vel.z))this.vel.set(0,0,0);}catch(_){}}};

// 2. frame guard
const _stStep=step;
step=function(r){try{return _stStep(r);}catch(e){logErr('frame',e);try{if(r&&!window.__norender)renderer.render(scene,camera);}catch(_){}}};

// 3. free GPU memory for a fighter's model when it is removed
function freeObj(root){if(!root)return;root.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();
  const M=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];M.forEach(m=>{if(!m||!m.dispose)return;for(const k in m){const v=m[k];if(v&&v.isTexture&&!v.__keep)v.dispose();}m.dispose();});});}
const _stDisp=Fighter.prototype.dispose;
Fighter.prototype.dispose=function(){const root=this.rig&&this.rig.root;try{_stDisp.call(this);}catch(e){logErr('dispose',e);}try{freeObj(root);}catch(e){logErr('free',e);}};

// 4. lost graphics context
renderer.domElement.addEventListener('webglcontextlost',()=>{setTimeout(()=>{if(!window.__ctxLost)return;let e=$('ctxLost');if(!e){e=document.createElement('div');e.id='ctxLost';
  e.innerHTML='<b>GRAPHICS RESET</b><span>Your browser reset the 3D graphics (usually low GPU memory). Click to reload the game.</span>';e.onclick=()=>location.reload();document.body.appendChild(e);}},1500);},false);
renderer.domElement.addEventListener('webglcontextrestored',()=>{window.__ctxLost=false;const e=$('ctxLost');if(e)e.remove();},false);
