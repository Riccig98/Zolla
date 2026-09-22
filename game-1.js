const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const SAVE_KEY="arsenal_merge_v1";

const RARITIES=[
 {code:"C",name:"COMUNE",color:"#aab2bf",line:"#46505e",glow:"rgba(170,178,191,.10)",mult:1,odds:50},
 {code:"U",name:"NON COMUNE",color:"#75d886",line:"#3d7950",glow:"rgba(93,220,120,.14)",mult:1.28,odds:25},
 {code:"R",name:"RARA",color:"#62a9ff",line:"#336da8",glow:"rgba(83,154,255,.16)",mult:1.65,odds:12},
 {code:"E",name:"EPICA",color:"#b676ff",line:"#7141a6",glow:"rgba(172,91,255,.18)",mult:2.1,odds:6},
 {code:"L",name:"LEGGENDARIA",color:"#ffbd55",line:"#a56d22",glow:"rgba(255,180,65,.20)",mult:2.72,odds:3.5},
 {code:"S",name:"S",color:"#ff727f",line:"#ad394c",glow:"rgba(255,84,109,.22)",mult:3.55,odds:2},
 {code:"SS",name:"SS",color:"#63f0e1",line:"#2da99c",glow:"rgba(64,243,222,.23)",mult:4.6,odds:1},
 {code:"SSS",name:"SSS",color:"#fff0a3",line:"#d99b42",glow:"rgba(255,115,230,.26)",mult:6.2,odds:.5}
];

const FAMILIES=[
 {
  id:"pistol",label:"Pistole",class:"Pistola cinetica",mode:"semi",accent:"#69d7ff",
  names:["Pocket Spark","Copper Fang","Viper-9","Ember Hawk","Nova Marshal","Solaris Prime","Seraph Twin","Crown Zero"],
  traits:["Compatta","Doppio impulso","Colpo critico","Camera termica","Ricochet","Sovraccarico","Doppio nucleo","Corona quantica"],
  desc:"Linea leggera e precisa, rapida da maneggiare e ideale per colpi controllati.",
  base:{damage:18,rpm:260,mag:10,accuracy:84,range:55,handling:92,reload:1.15,pellets:1}
 },
 {
  id:"smg",label:"Mitragliette",class:"SMG compatta",mode:"auto",accent:"#7dff9e",
  names:["Needle","Rattle-4","Neon Wasp","Circuit Jackal","Pulse Reaper","Ion Tempest","Halo Swarm","Infinity Choir"],
  traits:["Cadenza","Caricatore rapido","Stabilità","Tracciante","Sciame","Surriscaldamento","Micro-reattori","Fuoco infinito"],
  desc:"Volume di fuoco elevato e grande mobilità; eccelle a breve e media distanza.",
  base:{damage:10,rpm:720,mag:24,accuracy:67,range:45,handling:88,reload:1.35,pellets:1}
 },
 {
  id:"rifle",label:"Fucili",class:"Fucile d'assalto",mode:"auto",accent:"#78b7ff",
  names:["Fieldline","Rook-12","Vector Pike","Storm Carbine","Atlas Rifle","Aether Lance","Paragon Array","Worldsplitter"],
  traits:["Equilibrata","Burst assistito","Stabilizzatore","Penetrazione","Munizione smart","Rail-assist","Matrice predittiva","Frattura vettoriale"],
  desc:"Piattaforma versatile con ottimo equilibrio fra potenza, precisione e cadenza.",
  base:{damage:15,rpm:510,mag:28,accuracy:78,range:68,handling:74,reload:1.55,pellets:1}
 },
 {
  id:"shotgun",label:"Fucili a dispersione",class:"Scattergun",mode:"semi",accent:"#ff9b69",
  names:["Rust Bell","Twin Ember","Breach Hound","Meteor Pump","Dragon Maw","Solar Furnace","Leviathan Gate","Event Horizon"],
  traits:["Pallettoni","Doppia canna","Breach","Ventaglio stretto","Incandescente","Camera solare","Onda d'urto","Collasso locale"],
  desc:"Danno enorme a corta distanza grazie a proiettili multipli e impatto pesante.",
  base:{damage:7,rpm:92,mag:5,accuracy:54,range:32,handling:58,reload:2.1,pellets:7}
 },
 {
  id:"sniper",label:"Precisione",class:"Fucile di precisione",mode:"semi",accent:"#c7a6ff",
  names:["Longglass","Quiet Needle","Ghostline","White Comet","Oracle Rail","Starseer","Judgement Arc","Last Horizon"],
  traits:["Ottica","Silenziata","Danno critico","Rail bolt","Calcolo balistico","Predizione","Piercing totale","Orizzonte zero"],
  desc:"Colpi lenti ma devastanti, pensati per bersagli piccoli e grande distanza.",
  base:{damage:48,rpm:54,mag:5,accuracy:96,range:98,handling:42,reload:2.35,pellets:1}
 },
 {
  id:"heavy",label:"Pesanti",class:"Cannone pesante",mode:"auto",accent:"#ffd36b",
  names:["Dock Gun","Iron Drum","Mammoth","Siege Coil","Titan Driver","Sunhammer","Colossus Core","Godframe"],
  traits:["Tamburo","Recoil massivo","Anti-corazza","Coil assistita","Munizioni dense","Plasma pesante","Nucleo titanico","Telaio divino"],
  desc:"Armi massicce, lente da maneggiare ma con potenza e capacità del caricatore superiori.",
  base:{damage:24,rpm:260,mag:42,accuracy:61,range:64,handling:32,reload:2.75,pellets:1}
 },
 {
  id:"energy",label:"Energia",class:"Proiettore energetico",mode:"auto",accent:"#6effef",
  names:["Glow Rod","Arc Fork","Plasma Loop","Prism Emitter","Aurora Core","Void Prism","Celestial Engine","Singularity Bloom"],
  traits:["Arco","Catena","Plasma","Rifrazione","Nucleo aurora","Vuoto","Motore celeste","Singolarità"],
  desc:"Tecnologia sperimentale: precisione elevata, effetti energetici e crescita estrema ai ranghi alti.",
  base:{damage:13,rpm:430,mag:20,accuracy:82,range:72,handling:70,reload:1.7,pellets:1}
 },
 {
  id:"blade",label:"Lame",class:"Lama da duello",mode:"melee",accent:"#ff7edb",
  names:["Scrap Edge","Wire Fang","Volt Saber","Crimson Arc","Moon Cleaver","Astral Edge","Seraph Blade","Zero-Sun"],
  traits:["Taglio","Conduttiva","Arco voltaico","Emorragia","Fendente ampio","Passo astrale","Ala serafica","Taglio assoluto"],
  desc:"Arma da mischia: nessun caricatore, ritmo rapido e danno altissimo a distanza ravvicinata.",
  base:{damage:34,rpm:110,mag:0,accuracy:100,range:18,handling:96,reload:0,pellets:1}
 }
];

function family(id){return FAMILIES.find(f=>f.id===id)}
function rarity(t){return RARITIES[t]}
function weaponKey(f,t){return `${f}:${t}`}
function calcStats(item){
  const f=family(item.family),r=rarity(item.tier),u=item.upgrade||0,um=1+u*.045;
  const growth=1+item.tier*.09;
  return {
    damage:Math.round(f.base.damage*r.mult*um),
    rpm:Math.round(f.base.rpm*(1+item.tier*.035+u*.006)),
    mag:f.base.mag?Math.round(f.base.mag*(1+item.tier*.055)+(u>=3?2:0)+(u>=7?3:0)):0,
    accuracy:clamp(Math.round(f.base.accuracy+item.tier*1.5+u*.65),1,100),
    range:clamp(Math.round(f.base.range+item.tier*2+u*.35),1,100),
    handling:clamp(Math.round(f.base.handling-item.tier*.4+u*.45),1,100),
    reload:f.base.reload?Math.max(.55,+(f.base.reload*(1-item.tier*.025-u*.012)).toFixed(2)):0,
    pellets:f.base.pellets,
    power:Math.round((f.base.damage*r.mult*um)*(1+f.base.rpm/900)*(1+(f.base.accuracy/100)*.55)*(1+item.tier*.13))
  }
}
function newItem(fam,tier=0,upgrade=0){return{uid:uid(),family:fam,tier,upgrade,locked:false,obtained:Date.now()}}
function defaultState(){
  const items=[
    newItem("pistol",0),newItem("pistol",0),
    newItem("smg",0),newItem("smg",0),
    newItem("rifle",0),newItem("shotgun",0)
  ];
  return{
    version:1,credits:850,scrap:90,items,discovered:{},packProgress:35,packTokens:1,
    nextFreePack:Date.now()+180000,merges:0,totalTests:0,totalDamage:0,sort:"power",filter:"all",
    selectedUid:null,rangeUid:items[0].uid,collectorXp:0
  }
}
