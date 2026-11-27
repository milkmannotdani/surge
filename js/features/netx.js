/* Shared messages for add-on features (emotes, chat, pings, voice chat, raid effects...).
   netSay({k:'kind',...}) runs onEv('x:kind') on every player in the match (or just locally offline).
   Clients send to the host, and the host passes it on to everyone else. */
function netSay(o){o.from=NET.role==='off'?0:NET.myId;
  if(NET.role==='client'){if(NET.host)NET.host.send({t:'x',d:o});}
  else if(NET.role==='host')NET.conns.forEach(c=>c.send({t:'x',d:o}));
  emitEv('x:'+o.k,o);}
onEv('hmsg',(m,c)=>{if(m.t!=='x'||!m.d||typeof m.d.k!=='string')return;const o=m.d;o.from=c.pid;NET.conns.forEach(x=>{if(x!==c)x.send({t:'x',d:o});});emitEv('x:'+o.k,o);});
onEv('cmsg',m=>{if(m.t==='x'&&m.d&&typeof m.d.k==='string')emitEv('x:'+m.d.k,m.d);});
function byFid(id){return FS.find(f=>f.id===id)||null;}
