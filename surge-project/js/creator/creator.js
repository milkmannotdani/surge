/* Fighter creator screen */
/* ================= FIGHTER CREATOR SCREEN ================= */
const CR={spec:null,edit:-1};
function clearCustomRigs(){Object.keys(PV.rigs).forEach(k=>{if(+k>=CUST0){PV.scene.remove(PV.rigs[k].root);delete PV.rigs[k];delete PV.portraits[k];}});}
function deleteCustom(i){const k=i-CUST0;if(!CSPECS[k])return;CSPECS.splice(k,1);saveCustoms();clearCustomRigs();
  if(mySel===i)mySel=0;else if(mySel>i)mySel--;store.set('surge.hero',mySel);makePortraits();buildCards();previewHero(mySel);AU.ui();}
function openCreator(edit){CR.edit=edit==null?-1:edit;const s=CR.edit>=0?CSPECS[CR.edit]:null;CR.spec=s?Object.assign({},s):null;
  $('crName').value=s?s.name:'';$('crText').value=s?s.text:'';$('crSave').style.display=s?'':'none';$('crSave').textContent=s?'SAVE CHANGES':'SAVE FIGHTER';
  crStat('');if(s)renderCreator();else{$('crRes').innerHTML='<div class="crhead">WRITE A DESCRIPTION, THEN BUILD IT</div>';$('crImg').removeAttribute('src');}
  showScreen('creator');setTimeout(()=>$('crText').focus(),50);}
function shotOf(h){if(!PV.r)return '';const R=buildRig(h,PV.scene);PV.scene.add(R.root);Object.values(PV.rigs).forEach(r=>r.root.visible=false);PV.ped.visible=true;
  poseRig(R,POSES.showcase,0);R.root.rotation.y=.4;const sc=h.scale;PV.cam.aspect=.62;PV.cam.fov=30;PV.cam.updateProjectionMatrix();PV.cam.position.set(0,1.2*sc,5.4);PV.cam.lookAt(0,1.0*sc,0);
  PV.r.setSize(250,400,false);PV.r.render(PV.scene,PV.cam);let url='';try{url=$('pv').toDataURL('image/png');}catch(e){}
  PV.scene.remove(R.root);const cur=PV.rigs[PV.idx];if(cur)cur.root.visible=true;const cvs=$('pv');PV.r.setSize(cvs.clientWidth||400,cvs.clientHeight||400,false);return url;}
const ELEM_LABEL=()=>HEROES.map(h=>[h.id,h.power+' ('+h.name+')']);
function crSelect(key,opts,val){return `<select data-k="${key}">${opts.map(([v,n])=>`<option value="${v}"${v===val?' selected':''}>${n}</option>`).join('')}</select>`;}
function crChips(key,opts,val){return `<span class="two">${opts.map(([v,n])=>`<span class="chip${v===val?' sel':''}" data-k="${key}" data-v="${v}">${n}</span>`).join('')}</span>`;}
function renderCreator(){const s=CR.spec;if(!s)return;const h=customHero(s);const G=s.gear||{type:'none',c1:0xc8ccd8,c2:s.accent,size:1,dual:false};
  const C=s.cab||{};const sp=(C.sp?[['cab','★ NEW · '+C.sp.name]]:[]).concat(HEROES.map(x=>[x.special,spLabel(x.special)+' · '+x.name]));
  const ul=(C.ult?[['cab','★ NEW · '+C.ult.name]]:[]).concat(HEROES.map(x=>[x.ult,x.ultName+' · '+x.name])),al=(C.ultAlt?[['cab','★ NEW · '+C.ultAlt.name]]:[]).concat(HEROES.map(x=>[x.id,(ALTULT[x.id]?ALTULT[x.id].name:'—')+' · '+x.name]));
  const card=(lbl,A,on)=>A?`<div style="--c:${hexCss(A.c1)};opacity:${on?1:.45}"><i>${lbl}${on?'':' · not equipped'}</i><b>${esc(A.name)}</b>${esc(cabDescribe(A))}<br><i>${A.form.toUpperCase()} · ${A.style.toUpperCase()}${A.fx.length?' · '+A.fx.join(' · ').toUpperCase():''}${A.self.length?' · SELF: '+A.self.join(', ').toUpperCase():''}</i></div>`:'';
  const cards=s.cab?`<div class="crnote" style="font-size:14px;color:#e8d8ff;letter-spacing:.1em">${s.ai?'✦ NEW ABILITIES DESIGNED BY CLAUDE':'★ NEW ABILITIES BUILT FROM YOUR WORDS'}</div><div class="crab">${card('SPECIAL',C.sp,s.special==='cab')}${card('BACK SPECIAL',C.spAlt,s.special==='cab')}${card('ULTIMATE',C.ult,s.ult==='cab')}${card('ALT ULTIMATE',C.ultAlt,s.alt==='cab')}</div>`:'';
  const wp=[['fist','Fists'],['titan','Heavy fists'],['ronin','Sword'],['scathe','Claws'],['marrow','Whips'],['umbra','Shadow beast']];
  $('crRes').innerHTML=`<div class="crhead" style="color:${h.css}">${esc(h.name)}</div>${cards}
    <span class="k">POWER</span>${crSelect('elem',ELEM_LABEL(),s.elem)}
    <span class="k">LOOK</span>${crSelect('look',HEROES.map(x=>[x.id,'Like '+x.name]),s.look)}
    <span class="k">WEAPON</span><span class="two">${crSelect('gtype',Object.keys(GEAR_TYPES).map(k=>[k,GEAR_TYPES[k][0]]),G.type)}${GEAR_DUAL_OK.indexOf(G.type)>=0?`<span class="chip${G.dual?' sel':''}" data-k="gdual" data-v="1">DUAL</span>`:''}</span>
    ${G.type!=='none'?`<span class="k">WEAPON LOOK</span><span class="two"><input type="color" data-k="gc1" value="${hexCss(G.c1)}"><input type="color" data-k="gc2" value="${hexCss(G.c2)}">${crChips('gsize',[[.8,'SMALL'],[1,'NORMAL'],[1.45,'HUGE']],G.size)}</span>`:''}
    <span class="k">SPECIAL</span><span class="two">${crSelect('special',sp,s.special)}<input class="nm" data-k="spName" maxlength="24" placeholder="custom name" value="${esc(s.spName)}"></span>
    <span class="k">ULTIMATE</span><span class="two">${crSelect('ult',ul,s.ult)}<input class="nm" data-k="ultName" maxlength="24" placeholder="custom name" value="${esc(s.ultName)}"></span>
    <span class="k">ALT ULT</span><span class="two">${crSelect('alt',al,s.alt)}<input class="nm" data-k="altName" maxlength="24" placeholder="custom name" value="${esc(s.altName)}"></span>
    <span class="k">COLORS</span><span class="two"><input type="color" data-k="color" value="${hexCss(s.color)}"><input type="color" data-k="accent" value="${hexCss(s.accent)}"></span>
    <span class="k">SPEED</span>${crChips('spd',[[.9,'SLOW'],[1,'NORMAL'],[1.18,'FAST']],s.spd)}
    <span class="k">SIZE</span>${crChips('size',[['small','SMALL'],['normal','NORMAL'],['big','BIG']],s.size)}
    <span class="k">STRENGTH</span>${crChips('pow',[[.92,'LIGHT'],[1,'NORMAL'],[1.12,'STRONG']],s.pow)}
    <span class="k">SIDE</span>${crChips('faction',[['hero','HERO'],['villain','VILLAIN']],s.faction)}
    <div class="crnote">Punch effect: ${PFX_DESC[s.elem]||''}. Every created fighter also gets the full set of punch variants, a charged special, and an overcharge.</div>`;
  const upd=(k,v)=>{if(k[0]==='g'&&k.length>2&&['gtype','gdual','gc1','gc2','gsize'].indexOf(k)>=0){const g=Object.assign({type:'none',c1:0xc8ccd8,c2:CR.spec.accent,size:1,dual:false},CR.spec.gear||{});
      if(k==='gtype')g.type=v;if(k==='gdual')g.dual=!g.dual;if(k==='gc1')g.c1=parseInt(String(v).slice(1),16);if(k==='gc2')g.c2=parseInt(String(v).slice(1),16);if(k==='gsize')g.size=+v;
      CR.spec.gear=sanitizeGear(g);CR.spec=sanitizeSpec(CR.spec);renderCreator();return;}
    const n=['spd','pow'].indexOf(k)>=0?+v:(k==='color'||k==='accent')?parseInt(String(v).slice(1),16):v;CR.spec[k]=n;
    if(k==='elem'){const b=heroById(v);CR.spec.look=v;CR.spec.special=b.special;CR.spec.ult=b.ult;CR.spec.alt=v;}CR.spec=sanitizeSpec(CR.spec);renderCreator();};
  $('crRes').querySelectorAll('select').forEach(el=>el.onchange=()=>{AU.ui();upd(el.dataset.k,el.value);});
  $('crRes').querySelectorAll('input.nm').forEach(el=>el.onchange=()=>{CR.spec[el.dataset.k]=el.value.toUpperCase();CR.spec=sanitizeSpec(CR.spec);});
  $('crRes').querySelectorAll('input[type=color]').forEach(el=>el.onchange=()=>upd(el.dataset.k,el.value));
  $('crRes').querySelectorAll('.chip[data-k]').forEach(el=>el.onclick=()=>{AU.ui();upd(el.dataset.k,el.dataset.v);});
  $('crImg').src=shotOf(h);$('crSave').style.display='';}
function crStat(t,busy){$('crStat').textContent=t;$('crStat').classList.toggle('busy',!!busy);}
function aiBadge(){const b=$('crAI');if(!b)return;b.textContent=AI_OK?'✦ CLAUDE DESIGNS YOUR ABILITIES':'BUILT-IN DESIGNER';b.classList.toggle('ai',AI_OK);}
aiBadge();
$('crBuild').onclick=async()=>{AU.init();AU.ui();const txt=$('crText').value.trim();if(!txt){$('crText').focus();return;}if(CR.busy)return;
  const old=CR.spec,nm=$('crName').value;CR.spec=parseFighter(nm,txt);if(old&&CR.edit>=0)CR.spec.uid=old.uid;renderCreator();
  if(!AI_OK){crStat('Built from your words by the built-in designer.');return;}
  CR.busy=true;$('crBuild').disabled=true;crStat('Claude is designing your abilities…',true);const tok=CR.tok=(CR.tok||0)+1;
  try{const j=await aiDesign(nm,txt,n=>{if(tok===CR.tok)crStat('Claude is designing your abilities… '+'▮'.repeat(Math.min(12,Math.floor(n/120))),true);});
    if(tok!==CR.tok)return;const uid=CR.spec.uid;CR.spec=sanitizeSpec(specFromAI(j,CR.spec));CR.spec.uid=uid;if(nm.trim())CR.spec.name=nm.trim().toUpperCase().slice(0,14);$('crName').value=CR.spec.name;renderCreator();crStat('✦ Designed by Claude. Change anything below, or build again for a new take.');}
  catch(e){const c=e&&e.code;crStat(c==='not_granted'?'Claude access was not allowed, so the built-in designer made these.':c==='rate_limited'?'Claude is busy right now, so the built-in designer made these. Try again in a minute.':'Claude could not finish, so the built-in designer made these.');}
  finally{CR.busy=false;$('crBuild').disabled=false;}};
$('crMold').onclick=()=>{AU.init();AU.ui();openMold();};
$('crIdea').onclick=()=>{AU.ui();$('crText').value=pick(IDEAS);$('crName').value='';$('crBuild').click();};
$('crBack').onclick=()=>{AU.ui();openSetup(setupMode||'off');};
$('crName').addEventListener('change',()=>{if(CR.spec){CR.spec.name=$('crName').value.trim().toUpperCase()||CR.spec.name;CR.spec=sanitizeSpec(CR.spec);renderCreator();}});
$('crSave').onclick=()=>{if(!CR.spec)return;AU.ui();const s=sanitizeSpec(Object.assign({},CR.spec,{text:$('crText').value,name:$('crName').value.trim()||CR.spec.name}));
  if(CR.edit>=0)CSPECS[CR.edit]=s;else{if(CSPECS.length>=12)CSPECS.shift();CSPECS.push(s);}saveCustoms();clearCustomRigs();
  mySel=CR.edit>=0?CUST0+CR.edit:CUST0+CSPECS.length-1;store.set('surge.hero',mySel);PV.filter='custom';makePortraits();openSetup(setupMode||'off');};
['crText','crName'].forEach(id=>$(id).addEventListener('keydown',e=>e.stopPropagation()));
window.__cr={heroes:()=>HEROES,parseFighter,customHero,specs:()=>CSPECS,add(s){CSPECS.push(s);saveCustoms();clearCustomRigs();mySel=CUST0+CSPECS.length-1;}};
window.__shot=(s)=>shotOf(customHero(s));
window.__model=(shape,c1,c2)=>{const A=sanitizeAbil({form:'bolt',style:'light',shape,colors:[c1,c2]});const g=cabMesh(A,1.6,null);PV.scene.add(g);Object.values(PV.rigs).forEach(r=>r.root.visible=false);PV.ped.visible=false;g.position.set(0,1.2,0);g.rotation.y=-.7;PV.cam.aspect=1;PV.cam.fov=30;PV.cam.updateProjectionMatrix();PV.cam.position.set(0,1.6,4);PV.cam.lookAt(0,1.2,0);PV.r.setSize(160,160,false);PV.r.render(PV.scene,PV.cam);const u=$('pv').toDataURL('image/png');PV.scene.remove(g);return u;};
