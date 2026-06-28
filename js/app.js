const VERSION = "V12.1 NAV ACTIONS";
const EXERCISES = [
  ["dev-convergent","Développé convergent","4 x 8-10","Pectoraux • triceps","force"],
  ["dev-incline","Développé incliné machine","4 x 8-10","Haut des pectoraux","force"],
  ["pec-deck","Pec Deck / Butterfly","4 x 10-12","Pectoraux • deltoïdes","force"],
  ["crunch","Crunch machine","4 x 12-15","Abdominaux","force"],
  ["obliques","Rotation obliques","4 x 12-15","Obliques","force"],
  ["skierg","SkiErg","8-10 min","Cardio • dos","cardio"],
  ["rameur","Rameur","10 min","Cardio • jambes • dos","cardio"],
  ["tapis","Tapis / Course","20 min","Cardio • jambes","cardio"]
];

const DEFAULT = ["dev-convergent","dev-incline","pec-deck","crunch","obliques","skierg"];
const CHECKLIST = ["Gourde remplie","Électrolytes","AirPods","Serviette","Chaussures / tennis","Apple Watch chargée","Téléphone chargé","Clés"];
const KEY = "hyrox_michel_v12_stable";

let screen = "home";
let active = 0;
let timer = null;
let seconds = 0;

function def(id){ return EXERCISES.find(e=>e[0]===id) || EXERCISES[0]; }
function makeExercise(id){
  const d = def(id);
  const count = d[4] === "cardio" ? 1 : 4;
  return { id:d[0], name:d[1], target:d[2], muscles:d[3], type:d[4], sets:Array.from({length:count},()=>({kg:"", reps:"", ok:false})) };
}
function initialState(){
  return { date:new Date().toISOString().slice(0,10), profile:"Michel", checklist:{}, session:DEFAULT.map(makeExercise), daily:{weight:"",sleep:"",energy:""} };
}
let state = load() || initialState();
function load(){ try{return JSON.parse(localStorage.getItem(KEY));}catch(e){return null;} }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function html(s){ document.getElementById("app").innerHTML = s; }

function home(){
  screen = "home";
  html(`<section class="top">
    <p class="kicker">${VERSION}</p>
    <h1>Dimanche 28 juin</h1>
    <p>Endorphine + extérieur/tapis</p>
  </section>
  <section class="card">
    <h2>Séance du jour</h2>
    <p>Pecs / abdos + endurance fondamentale</p>
    <button class="bigbtn" onclick="startSession()">▶ Commencer la séance</button>
    <button class="secondary" onclick="checklist()">Check-list pré-séance</button>
    <button class="secondary" onclick="showAdd()">Ajouter un exercice</button>
  </section>
  <section class="card">
    <h2>Exercices</h2>
    ${state.session.map((e,i)=>`<p><b>${i+1}. ${e.name}</b><br><span class="small">${e.target} — ${e.muscles}</span></p>`).join("")}
  </section>`);
}

function checklist(){
  screen = "checklist";
  const done = CHECKLIST.filter(i=>state.checklist[i]).length;
  html(`<section class="top"><p class="kicker">Préparation</p><h1>Check-list</h1><p>${done}/${CHECKLIST.length} prêts</p></section>
  <section class="card">
    ${CHECKLIST.map(item=>`<label class="checkitem"><input type="checkbox" ${state.checklist[item]?"checked":""} onchange="state.checklist['${item}']=this.checked;save();checklist()"> ${item}</label>`).join("")}
    <button class="bigbtn" onclick="startSession()">Je pars → Mode salle</button>
    <button class="secondary" onclick="home()">Retour</button>
  </section>`);
}

function showAdd(){
  const options = EXERCISES.map(e=>`<option value="${e[0]}">${e[1]}</option>`).join("");
  html(`<section class="top"><p class="kicker">Séance</p><h1>Ajouter un exercice</h1></section>
  <section class="card">
    <div class="addgrid">
      <select id="newEx">${options}</select>
      <input id="newSets" type="number" value="3" placeholder="séries">
      <input id="newTarget" placeholder="objectif">
    </div>
    <button class="bigbtn" onclick="addExercise()">+ Ajouter</button>
    <button class="secondary" onclick="home()">Retour</button>
  </section>`);
}

function addExercise(){
  const id = document.getElementById("newEx").value;
  const ex = makeExercise(id);
  const n = parseInt(document.getElementById("newSets").value || "1",10);
  const t = document.getElementById("newTarget").value.trim();
  if(t) ex.target = t;
  ex.sets = Array.from({length:Math.max(1,n)},()=>({kg:"",reps:"",ok:false}));
  state.session.push(ex);
  save();
  active = state.session.length - 1;
  exercise();
}

function startSession(){ active = 0; exercise(); }
function exercise(){
  screen = "exercise";
  const ex = state.session[active];
  if(!ex){ home(); return; }
  const cardio = ex.type === "cardio";
  html(`<section class="exercise">
    <div class="exercise-title"><div><h1>${ex.name}</h1><p>${ex.muscles}</p></div><div class="badge">${ex.target}</div></div>
    <div class="imgbox"><div><strong>Machine / mouvement</strong>${ex.name}<br><span class="small">Remplacer par image : assets/machines/${ex.id}.png</span></div></div>
    <div class="imgbox"><div><strong>Anatomie</strong>${ex.muscles}<br><span class="small">Remplacer par image : assets/anatomie/${ex.id}.png</span></div></div>
    ${cardio ? timerBlock() : statsBlock(ex)}
    <div class="series">
      <div class="head"><span>Série</span><span>${cardio?"Temps":"Poids"}</span><span>${cardio?"RPE/m":"Reps"}</span><span>OK</span></div>
      ${ex.sets.map((s,i)=>row(ex,i,cardio)).join("")}
      <button class="add" onclick="addSet()">+ Ajouter une série</button>
    </div>
  </section>
  <div class="nav">
    <button onclick="prev()">← Préc.</button>
    <button onclick="exercise()">Modifier</button>
    <button onclick="next()">Suivant →</button>
    <button class="danger" onclick="deleteExercise()">Supprimer</button>
  </div>
  <button class="floatingQuit" onclick="home()">Quitter</button>`);
}

function row(ex,i,cardio){
  const s = ex.sets[i];
  return `<div class="row">
    <b>S${i+1}</b>
    <input value="${cardio?s.reps:s.kg}" placeholder="${cardio?"durée":"kg"}" oninput="setVal(${i},'${cardio?"reps":"kg"}',this.value)">
    <input value="${cardio?s.kg:s.reps}" placeholder="${cardio?"RPE":"reps"}" oninput="setVal(${i},'${cardio?"kg":"reps"}',this.value)">
    <input type="checkbox" ${s.ok?"checked":""} onchange="setVal(${i},'ok',this.checked)">
  </div>`;
}
function statsBlock(ex){
  let volume=0,total=0,best="-";
  ex.sets.forEach(s=>{ const kg=Number(String(s.kg).replace(",",".")); const reps=Number(String(s.reps).replace(",",".")); if(reps>0)total+=reps; if(kg>0&&reps>0){volume+=kg*reps; best=kg+"×"+reps;}});
  return `<div class="stats"><div><span>Meilleure</span><b>${best}</b></div><div><span>Volume</span><b>${volume?Math.round(volume)+" kg":"-"}</b></div><div><span>Reps</span><b>${total||"-"}</b></div></div>`;
}
function timerBlock(){
  return `<div class="card"><div class="timer" id="timer">${format(seconds)}</div><button class="bigbtn" onclick="toggleTimer()">Start / Pause</button><button class="secondary" onclick="resetTimer()">Reset</button></div>`;
}
function format(s){ return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
function toggleTimer(){ if(timer){clearInterval(timer);timer=null;return;} timer=setInterval(()=>{seconds++; const el=document.getElementById("timer"); if(el)el.textContent=format(seconds);},1000); }
function resetTimer(){ if(timer)clearInterval(timer); timer=null; seconds=0; exercise(); }
function setVal(i,k,v){ state.session[active].sets[i][k]=v; save(); }
function addSet(){ state.session[active].sets.push({kg:"",reps:"",ok:false}); save(); exercise(); }
function deleteExercise(){ if(confirm("Supprimer cet exercice ?")){ state.session.splice(active,1); active=Math.min(active,state.session.length-1); save(); exercise(); } }
function prev(){ active=Math.max(0,active-1); exercise(); }
function next(){ active=Math.min(state.session.length-1,active+1); exercise(); }

home();
