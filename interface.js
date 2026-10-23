// Affichage
// ---------- Interface ----------
function play(t){send({t:'play',card:pend,target:t})}
function pick(c){if(CD[c][1]){pend=c;render()}else send({t:'play',card:c})}
function answer(){const v=$('an').value.trim();if(v)send({t:'ans',text:v})}
function render(){const a=$('app');
 if(!V){a.innerHTML=`<h1>Dernier Survivant</h1>${err?`<p style="color:var(--bad)">${E(err)}</p>`:''}<div class=c><input id=nm placeholder="Votre prénom" maxlength=14><button class=p onclick=hostGame()>Créer une salle</button></div><div class=c><input id=cd placeholder="Code de la salle (4 lettres)" maxlength=4><button onclick=joinGame()>Rejoindre</button></div>`;return}
 const P=V.players,mp=P.find(p=>p.id==me),ph=V.phase,cur=P[V.active];let h='<h1>Dernier Survivant</h1>';
 if(ph=='lobby'){
  h+=`<div class=c><div class=m>Code de la salle à donner à vos amis</div><div class=code>${V.code}</div></div><div class=c><b>Joueurs (${P.length}/8)</b>${P.map(p=>`<div class=row>${E(p.name)}${p.id==me?' (vous)':''}</div>`).join('')}</div>`;
  if(host)h+=`<div class=c><b>Réglages</b>${Object.keys(CL).map(k=>`<div class=g><span>${CL[k]}</span><input type=number min=0 value=${V.cfg[k]} oninput="S.cfg.${k}=Math.max(0,+this.value)"></div>`).join('')}</div><button class=p ${P.length<2?'disabled':''} onclick="send({t:'start'})">Lancer la partie</button>`;
  else h+='<p class=m>En attente du lancement par l\'hôte…</p>';
  a.innerHTML=h;return}
 h+=`<div class=c><div class=m>Manche ${V.round} · morts : ${V.deaths} · coût : ${V.cfg.cost+V.deaths} pour ${cur?E(cur.name):''} (joueur actif), ${V.deaths} pour les autres</div>${P.map(p=>`<div class="row ${p.alive?'':'dead'}"><span>${E(p.name)}${p==cur&&p.alive?' 🎤':''}${p.id==me?' (vous)':''}</span><span>${p.done?'✓ ':''}<b>${p.pts}</b></span></div>`).join('')}</div>`;
 if(ph=='over'){h+=`<div class=c><h2>🏆 ${E(V.winner)} gagne !</h2></div>`}
 else{h+=`<div class=c><span class=m>${V.theme}</span><h2>${E(V.title)}</h2>`;
  if(V.mine.menace)h+=`<p style="color:var(--bad)">💀 Vous êtes menacé (×${V.mine.menace})</p>`;
  if(V.mine.handicap)h+='<p style="color:var(--bad)">⛓️ Handicap : votre palier est réduit d\'un cran</p>';
  if(V.mine.adv)h+='<p style="color:var(--ok)">🍀 Avantage : un indice de plus</p>';
  h+='</div>'}
 if(ph=='cards'&&mp.alive&&!mp.done){
  h+=`<div class=c><b>Jouez une carte ou passez</b> <span class=m>(avant les annonces)</span><br>`;
  if(pend)h+=`<p>${CD[pend][0]} : choisissez la cible</p>`+P.filter(p=>p.alive&&p.id!=me).map(p=>`<button onclick="play('${p.id}')">${E(p.name)}</button>`).join('')+`<button onclick="pend=null;render()">Annuler</button>`;
  else h+=mp.hand.map(c=>`<button onclick="pick('${c}')" title="${E(CD[c][2])}">${CD[c][0]}<br><span class=m>${E(CD[c][2])}</span></button>`).join('')+`<br><button class=p onclick="send({t:'pass'})">Passer</button>`;
  h+='</div>'}
 else if(ph=='announce'&&mp.alive&&!mp.done)h+=`<div class=c><b>Avec combien d'indices pensez-vous trouver ?</b><br>${[1,2,3].map(n=>`<button onclick="send({t:'ann',n:${n}})">${n} indice${n>1?'s':''}<br><span class=m>+${V.cfg['g'+n]} / −${V.cfg.loss}</span></button>`).join('')}</div>`;
 else if(ph=='answer'){
  h+=`<div class=c>${V.clues.map((c,i)=>`<div class=cl><span class=m>Indice ${i+1}</span><br>${E(c)}</div>`).join('')}`;
  if(mp.alive&&!mp.done)h+=`<input id=an placeholder="Votre réponse" autocomplete=off onkeydown="if(event.key=='Enter')answer()"><button class=p onclick=answer()>Valider</button>`;
  h+='</div>'}
 else if(ph=='vote'){
  h+=`<div class=c><b>Réponse : ${E(V.answer)}</b><p class=m>Jugez la réponse de chaque joueur. La majorité décide (égalité : la réponse est acceptée).</p>${P.filter(p=>p.alive&&p.id!=me).map(p=>`<div class=row><span>${E(p.name)} : « ${E(p.ans||'')} »<br><span class=m>Suggestion du jeu : ${p.auto?'✓':'✗'}</span></span><span><button class="${V.myv[p.id]===true?'p':''}" onclick="send({t:'vote',target:'${p.id}',ok:true})">✓ Correct</button><button class="${V.myv[p.id]===false?'p':''}" onclick="send({t:'vote',target:'${p.id}',ok:false})">✗ Faux</button></span></div>`).join('')}</div>`}
 else if(ph=='result'||ph=='over'){
  h+=`<div class=c><b>Réponse : ${E(V.answer)}</b>${P.filter(p=>p.ans!=null).map(p=>`<div class=row><span>${E(p.name)} <span class=m>${p.eff} ind. · « ${E(p.ans)} »</span></span><b style="color:var(--${p.ok?'ok':'bad'})">${p.d>0?'+':''}${p.d}</b></div>`).join('')}</div>`}
 if(!mp.alive&&ph!='over')h+='<p class=m>Vous êtes éliminé : vous regardez la fin de la partie.</p>';
 else if(mp.done&&ph!='result')h+='<p class=m>En attente des autres joueurs…</p>';
 if(V.log.length)h+=`<div class=c>${V.log.map(l=>`<div class=m>${E(l)}</div>`).join('')}</div>`;
 if(ph=='result')h+=host?'<button class=p onclick="send({t:\'next\'})">Manche suivante</button>':'<p class=m>L\'hôte lance la manche suivante…</p>';
 a.innerHTML=h;const i=$('an');if(i)i.focus()}
render();
