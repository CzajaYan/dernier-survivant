// Connexion entre joueurs (PeerJS) et état partagé
let S,V,peer,conns={},me='',host=false,pend=null,err='';
const al=()=>S.players.filter(p=>p.alive),gp=id=>S.players.find(p=>p.id==id);

// ---------- Réseau ----------
function hostGame(){host=true;tryHost($('nm').value.trim()||'Hôte')}
function tryHost(name){const code=Math.random().toString(36).slice(2,6).toUpperCase();peer=new Peer('jdsv-'+code);
 peer.on('error',e=>{if(e.type=='unavailable-id')tryHost(name);else{err='Erreur réseau : '+e.type;V=null;render()}});
 peer.on('open',id=>{me=id;S={code,cfg:{...C0},phase:'lobby',players:[mk(id,name)],deaths:0,round:0,active:-1,log:[],used:[]};sync()});
 peer.on('connection',c=>c.on('data',m=>{if(m.t=='join')join(c,m.name);else act(c.peer,m)}))}
const mk=(id,name)=>({id,name:name.slice(0,14),pts:0,alive:true,hand:[],grace:0});
function join(c,name){if(S.phase!='lobby'||S.players.length>=8){c.send({t:'full'});return}conns[c.peer]=c;S.players.push(mk(c.peer,name));sync()}
function joinGame(){const name=$('nm').value.trim()||'Joueur',code=$('cd').value.trim().toUpperCase();
 peer=new Peer();peer.on('error',e=>{err='Salle introuvable ou réseau bloqué ('+e.type+')';V=null;render()});
 peer.on('open',id=>{me=id;const c=peer.connect('jdsv-'+code,{reliable:true});conns.h=c;
  c.on('open',()=>c.send({t:'join',name}));
  c.on('data',m=>{if(m.t=='state'){V=m.v;render()}else if(m.t=='full'){err='Salle pleine ou partie déjà lancée';render()}});
  c.on('close',()=>{err='Connexion perdue';V=null;render()})})}
function send(m){pend=null;host?act(me,m):conns.h.send(m)}
function sync(){for(const id in conns)conns[id].send({t:'state',v:view(id)});V=view(me);render()}

