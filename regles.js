// Réglages par défaut, cartes Action et logique du jeu (exécutée par l'hôte)
const $=id=>document.getElementById(id);
const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const C0={start:20,hand:4,cost:1,deathLoss:5,g1:3,g2:2,g3:1,loss:1,steal:2,menaceMax:2};
const CL={start:'Points de départ',hand:'Cartes en main',cost:'Coût de manche (joueur actif)',deathLoss:'Perte à chaque mort',g1:'Gain à 1 indice',g2:'Gain à 2 indices',g3:'Gain à 3 indices',loss:'Perte de base (échec)',steal:'Vol du Duel',menaceMax:'Menaces cumulables (max)'};
const CD={duel:['⚔️ Duel',1,'Volez des points à la cible si vous répondez mieux qu\'elle'],menace:['💀 Menace',1,'La cible perd plus si elle se trompe'],handicap:['⛓️ Handicap',1,'La cible répond un indice plus tôt'],qod:['🎯 Quitte ou Double',0,'Gain doublé, perte plus lourde, et vous êtes protégé'],protection:['🛡️ Protection',0,'Annule les cartes hostiles contre vous'],avantage:['🍀 Avantage',0,'Un indice de plus que votre annonce']};
const K=Object.keys(CD),TH={hist:'Histoire & civilisations',science:'Sciences & nature',geo:'Géographie & monuments',arts:'Arts, littérature & pop culture'};
// ---------- Pioche Action ----------
// Répartition du paquet de 40 cartes. Défi et Joker ne sont pas encore codés : ils restent hors de la pioche.
const DECK={menace:8,duel:6,protection:6,qod:5,avantage:5,handicap:4,defi:4,joker:2};
const LIVE=['menace','duel','protection','qod','avantage','handicap'];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function newDeck(){const d=[];LIVE.forEach(c=>{for(let i=0;i<DECK[c];i++)d.push(c)});return shuffle(d)}
function drawCard(){if(!S.deck.length){S.deck=shuffle(S.disc);S.disc=[]}return S.deck.pop()}
// ---------- Logique (hôte) ----------
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return d[a.length][b.length]}
function match(ans,list){const n=N(ans);return !!n&&list.some(v=>n==v||(v.length>=5&&lev(n,v)<=(v.length>=10?2:1)))}
function start(){S.deck=newDeck();S.disc=[];S.mid=[];S.uid=0;S.players.forEach(p=>{p.pts=S.cfg.start;p.hand=[];p.grace=0});nextRound()}
function nextRound(){const c=S.cfg;do{S.active=(S.active+1)%S.players.length}while(!S.players[S.active].alive);
 S.round++;S.log=[];S.fx={menace:{},handicap:{},duels:[]};
 if(S.mid.length>al().length*3){S.deck.unshift(...S.mid.map(x=>x.c));S.mid=[];S.log.push('Le milieu est nettoyé : ses cartes retournent sous la pioche')}
 let pool=Q.map((_,i)=>i).filter(i=>!S.used.includes(i));if(!pool.length){S.used=[];pool=Q.map((_,i)=>i)}
 const qi=pool[Math.random()*pool.length|0];S.used.push(qi);S.q=Q[qi];
 S.players.forEach(p=>{p.played=null;p.posedN=0;p.pass=false;p.ann=0;p.ans=null;p.adv=false;p.ok=null;p.d=0;p.eff=0;p.lvl=0});
 al().forEach(p=>{p.pts=Math.max(0,p.pts-(S.players[S.active]==p?c.cost:0)-S.deaths);while(p.hand.length<c.hand){const k=drawCard();if(!k)break;p.hand.push(k)}});
 const A=al(),k=A.indexOf(S.players[S.active]);S.order=A.slice(k).concat(A.slice(0,k)).map(p=>p.id);S.turn=0;S.step='pose';S.phase='cards'}
function adv(){S.turn++;S.step='pose';if(S.turn>=S.order.length)cardsDone();else if(!gp(S.order[S.turn]).hand.length)adv()}
function act(id,m){const p=gp(id),ph=S.phase;if(!p)return;
 if(m.t=='start'&&ph=='lobby'&&id==me&&S.players.length>1)start();
 else if(m.t=='next'&&ph=='result'&&id==me)nextRound();
 else if(!p.alive)return;
 else if(ph=='cards'){if(id!=S.order[S.turn])return;
  if(S.step=='pose'){if(m.t!='pose'||!p.hand.includes(m.card))return;
   p.hand.splice(p.hand.indexOf(m.card),1);p.posedN=++S.uid;S.mid.push({n:p.posedN,c:m.card,by:p.name});S.log.push(`${p.name} pose ${CD[m.card][0]} au milieu`);
   S.step=(S.deck.length||S.mid.some(x=>x.n!=p.posedN))?'draw':'play';if(S.step=='play'&&!p.hand.length)adv()}
  else if(S.step=='draw'){
   if(m.t=='drawpile'){const k=drawCard();if(!k)return;p.hand.push(k)}
   else if(m.t=='take'){const i=S.mid.findIndex(x=>x.n==m.n&&x.n!=p.posedN);if(i<0)return;p.hand.push(S.mid.splice(i,1)[0].c)}
   else return;S.step='play'}
  else{if(m.t!='play'||!p.hand.includes(m.card))return;const t=gp(m.target);if(CD[m.card][1]&&(!t||!t.alive||t==p))return;
   p.hand.splice(p.hand.indexOf(m.card),1);S.disc.push(m.card);p.played={card:m.card,target:m.target};
   S.log.push(`${p.name} joue ${CD[m.card][0]}${CD[m.card][1]?' sur '+t.name:''}`);adv()}}
 else if(ph=='announce'&&!p.ann&&m.t=='ann'&&[1,2,3].includes(m.n)){p.ann=m.n;if(al().every(x=>x.ann))annDone()}
 else if(ph=='answer'&&p.ans==null&&m.t=='ans'){p.ans=String(m.text).slice(0,60);p.t=Date.now();if(al().every(x=>x.ans!=null)){al().forEach(x=>x.auto=match(x.ans,S.q[3]));S.votes={};S.phase='vote'}}
 else if(ph=='vote'&&m.t=='vote'){const t=gp(m.target);if(!t||!t.alive||t==p)return;(S.votes[t.id]=S.votes[t.id]||{})[id]=!!m.ok;
  if(al().every(x=>al().every(v=>v==x||(S.votes[x.id]||{})[v.id]!==undefined)))score()}
 sync()}
function cardsDone(){const A=al(),prot=A.filter(p=>p.played&&['protection','qod'].includes(p.played.card)).map(p=>p.id),F=S.fx;
 A.forEach(p=>{const pl=p.played;if(!pl)return;const c=pl.card,t=gp(pl.target);p.adv=c=='avantage';
  if(!CD[c][1])return;
  if(prot.includes(t.id)){S.log.push(`${p.name} joue ${CD[c][0]} sur ${t.name} : annulé !`);return}
    if(c=='menace')F.menace[t.id]=Math.min(S.cfg.menaceMax,(F.menace[t.id]||0)+1);
  if(c=='handicap')F.handicap[t.id]=1;
  if(c=='duel')F.duels.push([p.id,t.id])});
 S.phase='announce'}
function annDone(){al().forEach(p=>{let e=p.ann;if(S.fx.handicap[p.id]){if(e>1)e--;else p.pts=Math.max(0,p.pts-1)}p.eff=e;p.lvl=Math.min(3,e+(p.adv?1:0))});S.phase='answer'}
function score(){const c=S.cfg,A=al();
 A.forEach(p=>{const vv=Object.values(S.votes[p.id]||{});p.ok=vv.filter(Boolean).length>=vv.length/2;const g=c['g'+p.eff],mc=S.fx.menace[p.id]||0,qd=p.played&&p.played.card=='qod';
  p.d=p.ok?(qd?2*g:g):-(c.loss+(mc||qd?g+Math.max(0,mc-1):0));p.pts+=p.d});
 S.fx.duels.forEach(([a,b])=>{const x=gp(a),y=gp(b);let w=null;
  if(x.ok&&y.ok)w=x.eff!=y.eff?(x.eff<y.eff?x:y):(x.t<=y.t?x:y);else if(x.ok)w=x;else if(y.ok)w=y;
  if(w){const l=w==x?y:x,s=Math.min(c.steal,l.pts);l.pts-=s;w.pts+=s;l.d-=s;w.d+=s;S.log.push(`⚔️ ${w.name} vole ${s} pt(s) à ${l.name}`)}
  else S.log.push('⚔️ Duel sans vainqueur')});
 const dead=A.filter(p=>p.pts<=0&&!p.grace&&p.d<0);A.forEach(p=>{if(p.grace)p.grace--});
 dead.forEach(p=>{p.alive=false;S.disc.push(...p.hand);p.hand=[];S.log.push(`💀 ${p.name} est éliminé`)});
 if(dead.length){S.deaths+=dead.length;al().forEach(p=>{p.pts=Math.max(0,p.pts-c.deathLoss*dead.length);p.grace=1});S.log.push(`Les survivants perdent ${c.deathLoss*dead.length} pts (sans mourir) et le coût de manche augmente`)}
 const r=al();S.phase=r.length<2?'over':'result';if(r.length<2)S.winner=r[0]?r[0].name:'Personne'}
function view(id){const s=S,ph=s.phase,m=gp(id),R=ph=='result'||ph=='over',F=s.fx||{menace:{},handicap:{}};
 return{code:s.code,cfg:s.cfg,phase:ph,round:s.round,deaths:s.deaths,active:s.active,log:s.log,winner:s.winner,
  theme:s.q?TH[s.q[0]]:'',title:s.q?s.q[1]:'',clues:ph=='answer'&&m?s.q[2].slice(0,m.lvl):R?s.q[2]:[],answer:R||ph=='vote'?(s.q[4]||s.q[3][0]):'',
  mid:s.mid||[],order:(s.order||[]).map(i=>({id:i,name:gp(i).name})),turn:ph=='cards'?s.order[s.turn]:null,step:s.step,deckN:s.deck?s.deck.length:0,myPosed:m?m.posedN:0,myv:Object.fromEntries(Object.entries(s.votes||{}).filter(([t,v])=>v[id]!==undefined).map(([t,v])=>[t,v[id]])),mine:{menace:F.menace[id]||0,handicap:!!F.handicap[id],adv:!!(m&&m.adv)},
  players:s.players.map(p=>({id:p.id,name:p.name,pts:p.pts,alive:p.alive,
   done:ph=='cards'?!!(p.played||p.pass):ph=='announce'?!!p.ann:ph=='answer'?p.ans!=null:false,
   hand:p.id==id?p.hand:null,eff:ph=='answer'||R?p.eff:0,ans:R||ph=='vote'?p.ans:null,ok:p.ok,d:p.d,auto:p.auto}))}}

