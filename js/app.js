const VERSION = "HYROX MICHEL — STABLE 1.1";
const EXERCISES = [["dev-convergent", "Développé convergent", "4 × 8-10", "Pectoraux • triceps", "force"], ["dev-incline", "Développé incliné machine", "4 × 8-10", "Haut pectoraux • épaules", "force"], ["pec-deck", "Pec Deck / Butterfly", "4 × 10-12", "Pectoraux • deltoïdes", "force"], ["crunch", "Crunch machine", "4 × 12-15", "Grand droit abdominal", "force"], ["obliques", "Rotation obliques", "4 × 12-15", "Obliques • gainage", "force"], ["skierg", "SkiErg", "8-10 min", "Dos • abdos • cardio", "cardio"], ["rameur", "Rameur", "10 min", "Jambes • dos • cardio", "cardio"], ["tapis", "Tapis / Course", "20 min", "Cardio • jambes", "cardio"], ["tirage-vertical", "Tirage vertical", "4 × 8-10", "Dos • biceps", "force"], ["rowing-assis", "Rowing assis", "4 × 10", "Dos • rhomboïdes", "force"], ["leg-extension", "Leg Extension", "4 × 10-12", "Quadriceps", "force"], ["leg-curl", "Leg Curl", "4 × 10-12", "Ischios", "force"]];
const DEFAULT = ["dev-convergent","dev-incline","pec-deck","crunch","obliques","skierg"];
const CHECKLIST = ["Gourde remplie","Électrolytes","AirPods","Serviette","Chaussures / tennis","Apple Watch chargée","Téléphone chargé","Clés"];
const KEY = "hyrox_michel_app_stable_v1";
let active = 0, timer = null, seconds = 0;

function load(){ try{return JSON.parse(localStorage.getItem(KEY));}catch(e){return null;} }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function def(id){ return EXERCISES.find(e=>e[0]===id) || EXERCISES[0]; }
function makeExercise(id){
  const d=def(id), count=d[4]==="cardio"?1:4;
  return { id:d[0], name:d[1], target:d[2], muscles:d[3], type:d[4], sets:Array.from({length:count},()=>({kg:"",reps:"",ok:false})) };
}
function initialState(){
  return { profile:"Michel", checklist:{}, daily:{weight:"",sleep:"",energy:""}, session:DEFAULT.map(makeExercise), history:[], goals:[{name:"Nice", value:"HYROX Solo Open — 30/10"},{name:"Poids", value:"92 kg"}] };
}
let state = load() || initialState();
function html(s){ document.getElementById("app").innerHTML=s; }

function shell(content, tab="jour") {
  return content + `<div class="footerNav">
    <button class="${tab==='jour'?'active':''}" onclick="home()">Jour</button>
    <button class="${tab==='objectifs'?'active':''}" onclick="objectifs()">Objectifs</button>
    <button class="${tab==='scores'?'active':''}" onclick="scores()">Scores</button>
    <button class="${tab==='historique'?'active':''}" onclick="historique()">Historique</button>
    <button class="${tab==='hebdo'?'active':''}" onclick="hebdo()">Hebdo</button>
  </div>`;
}

function home(){
  html(shell(`<section class="top"><p class="kicker">${VERSION}</p><h1>Dimanche 28 juin</h1><p>Endorphine + extérieur/tapis</p></section>
  <section class="card"><h2>Séance du jour</h2><p>Pecs / abdos + endurance fondamentale</p>
  <button class="bigbtn" onclick="startSession()">▶ Commencer la séance</button>
  <button class="secondary" onclick="checklist()">Check-list pré-séance</button>
  <button class="secondary" onclick="showAdd()">Ajouter un exercice</button></section>
  <section class="card"><h2>Exercices</h2>${state.session.map((e,i)=>`<p><b>${i+1}. ${e.name}</b><br><span class="small">${e.target} — ${e.muscles}</span></p>`).join("")}</section>`, "jour"));
}

function checklist(){
  const done=CHECKLIST.filter(i=>state.checklist[i]).length;
  html(`<section class="top"><p class="kicker">Préparation</p><h1>Check-list</h1><p>${done}/${CHECKLIST.length} prêts</p></section><section class="card">
  ${CHECKLIST.map(item=>`<label class="checkitem"><input type="checkbox" ${state.checklist[item]?"checked":""} onchange="state.checklist['${item}']=this.checked;save();checklist()"> ${item}</label>`).join("")}
  <button class="bigbtn" onclick="startSession()">Je pars → Mode salle</button><button class="secondary" onclick="home()">Retour</button></section>`);
}

function showAdd(){
  const options=EXERCISES.map(e=>`<option value="${e[0]}">${e[1]}</option>`).join("");
  html(`<section class="top"><p class="kicker">Séance</p><h1>Ajouter un exercice</h1></section><section class="card">
  <div class="addgrid"><select id="newEx">${options}</select><input id="newSets" type="number" value="3" placeholder="séries"><input id="newTarget" placeholder="objectif"></div>
  <button class="bigbtn" onclick="addExercise()">+ Ajouter</button><button class="secondary" onclick="home()">Retour</button></section>`);
}
function addExercise(){
  const id=document.getElementById("newEx").value, ex=makeExercise(id), n=parseInt(document.getElementById("newSets").value||"1",10), t=document.getElementById("newTarget").value.trim();
  if(t) ex.target=t; ex.sets=Array.from({length:Math.max(1,n)},()=>({kg:"",reps:"",ok:false})); state.session.push(ex); save(); active=state.session.length-1; exercise();
}
function startSession(){ active=0; exercise(); }

function exercise(){
  const ex=state.session[active]; if(!ex) return home(); const cardio=ex.type==="cardio";
  html(`<section class="exercise"><div class="exercise-title"><div><h1>${ex.name}</h1><p>${ex.muscles}</p></div><div class="badge">${ex.target}</div></div>
  <details class="imgbox"><summary>Machine / mouvement</summary><img src="assets/machines/${ex.id}.png" alt="Machine ${ex.name}"></details>
  <details class="imgbox"><summary>Anatomie</summary><img src="assets/anatomie/${ex.id}.png" alt="Anatomie ${ex.name}"></details>
  ${cardio?timerBlock():statsBlock(ex)}
  <div class="series"><div class="head"><span>Série</span><span>${cardio?"Temps":"Poids"}</span><span>${cardio?"RPE/m":"Reps"}</span><span>OK</span></div>
  ${ex.sets.map((s,i)=>row(ex,i,cardio)).join("")}<button class="bigbtn" onclick="addSet()">+ Série</button></div></section>
  <div class="nav nav5"><button onclick="home()">Menu</button><button onclick="prev()">← Préc.</button><button onclick="exercise()">Modifier</button><button onclick="next()">Suiv. →</button><button class="danger" onclick="deleteExercise()">Suppr.</button></div>`);
}
function row(ex,i,cardio){const s=ex.sets[i];return `<div class="row"><b>S${i+1}</b><input value="${cardio?s.reps:s.kg}" placeholder="${cardio?'durée':'kg'}" oninput="setVal(${i},'${cardio?'reps':'kg'}',this.value)"><input value="${cardio?s.kg:s.reps}" placeholder="${cardio?'RPE':'reps'}" oninput="setVal(${i},'${cardio?'kg':'reps'}',this.value)"><input type="checkbox" ${s.ok?'checked':''} onchange="setVal(${i},'ok',this.checked)"></div>`;}
function statsBlock(ex){let volume=0,total=0,best="-";ex.sets.forEach(s=>{const kg=Number(String(s.kg).replace(",",".")), reps=Number(String(s.reps).replace(",","."));if(reps>0)total+=reps;if(kg>0&&reps>0){volume+=kg*reps;best=kg+"×"+reps;}});return `<div class="stats"><div><span>Meilleure</span><b>${best}</b></div><div><span>Volume</span><b>${volume?Math.round(volume)+" kg":"-"}</b></div><div><span>Reps</span><b>${total||"-"}</b></div></div>`;}
function timerBlock(){return `<div class="card"><div class="timer" id="timer">${format(seconds)}</div><button class="bigbtn" onclick="toggleTimer()">Start / Pause</button><button class="secondary" onclick="resetTimer()">Reset</button></div>`;}
function format(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
function toggleTimer(){if(timer){clearInterval(timer);timer=null;return;}timer=setInterval(()=>{seconds++;const el=document.getElementById("timer");if(el)el.textContent=format(seconds);},1000);}
function resetTimer(){if(timer)clearInterval(timer);timer=null;seconds=0;exercise();}
function setVal(i,k,v){state.session[active].sets[i][k]=v;save();}
function addSet(){state.session[active].sets.push({kg:"",reps:"",ok:false});save();exercise();}
function deleteExercise(){if(confirm("Supprimer cet exercice ?")){state.session.splice(active,1);active=Math.min(active,state.session.length-1);save();exercise();}}
function prev(){active=Math.max(0,active-1);exercise();} function next(){active=Math.min(state.session.length-1,active+1);exercise();}

function objectifs(){html(shell(`<section class="top"><p class="kicker">Objectifs</p><h1>Objectifs</h1></section><section class="card">${state.goals.map(g=>`<p><b>${g.name}</b><br>${g.value}</p>`).join("")}</section>`, "objectifs"));}
function scores(){html(shell(`<section class="top"><p class="kicker">Scores</p><h1>Scores & records</h1></section><section class="card"><p>Volume, meilleures séries et records seront calculés ici.</p></section>`, "scores"));}
function historique(){html(shell(`<section class="top"><p class="kicker">Historique</p><h1>Historique</h1></section><section class="card"><p>Historique local des séances à intégrer.</p></section>`, "historique"));}
function hebdo(){html(shell(`<section class="top"><p class="kicker">Hebdo</p><h1>Bilan hebdo</h1></section><section class="card"><p>Poids, sommeil, séances, volume, cardio.</p></section>`, "hebdo"));}
home();
