(() => {
"use strict";
const $=id=>document.getElementById(id),canvas=$("world"),ctx=canvas.getContext("2d"),wrap=$("worldWrap");
const GRID=11,SAVE_KEY="zolla_island_v5",LEGACY_SAVE_KEY="zolla_island_v4",clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let W=900,H=600,DPR=1,baseTileW=78,baseTileH=39,tileW=78,tileH=39,originX=450,originY=100;
let selected=null,lastFrame=performance.now(),lastUi=0,toastTimer=0;
const camera={x:0,y:0,zoom:1.16,minZoom:.72,maxZoom:2.65};
const pointers=new Map();let gesture={drag:false,moved:false,startX:0,startY:0,camX:0,camY:0,lastDist:0,startZoom:1};
const cityEvents=[];let nextCityEventAt=performance.now()+2500;
const CITY_EVENT_TYPES=[
  {id:"harvest",icon:"◆",label:"Raccolto pronto",color:"#78a55f"},
  {id:"crate",icon:"▰",label:"Cassa trovata",color:"#9b754d"},
  {id:"merchant",icon:"●",label:"Mercante",color:"#d99c38"},
  {id:"gift",icon:"⬢",label:"Dono del borgo",color:"#986fa7"}
];


const TERRAIN={
 plains:{name:"Prato",top:"#9fbd72",side:"#6a824d",bonus:"Case +12%"},
 fertile:{name:"Terra fertile",top:"#b2bf70",side:"#7a8249",bonus:"Fattorie +50%"},
 forest:{name:"Bosco",top:"#739a66",side:"#4f6948",bonus:"Silvicoltura +55%"},
 rock:{name:"Roccia",top:"#8f9792",side:"#626a67",bonus:"Cave +60%"},
 coast:{name:"Costa",top:"#c7b57d",side:"#908157",bonus:"Porti e Pesca"}
};
const BUILDINGS={
 farm:{name:"Fattoria",icon:"◆",unlock:1,desc:"Produce soprattutto grano e un po' di cibo.",cost:{coins:80,wood:8},raw:{grain:1.02,food:.14},terrain:{fertile:1.5},adj:{windmill:.22,market:.04},specs:[{id:"orchard",name:"Frutteto",desc:"Raddoppia il cibo diretto.",effect:"food"},{id:"estate",name:"Tenuta cerealicola",desc:"+30% grano e piccole rendite.",effect:"grain"}]},
 lumber:{name:"Silvicoltura",icon:"♣",unlock:1,desc:"Produce legno per cantieri e Officine.",cost:{coins:95},raw:{wood:.82},terrain:{forest:1.55},adj:{workshop:.14},specs:[{id:"forester",name:"Foresta gestita",desc:"+40% legno.",effect:"raw"},{id:"resin",name:"Resine",desc:"Produce anche un po' di merci.",effect:"goods"}]},
 quarry:{name:"Cava",icon:"⬟",unlock:1,desc:"Produce pietra per edifici e Officine.",cost:{coins:110,wood:10},raw:{stone:.56},terrain:{rock:1.6},adj:{workshop:.14},specs:[{id:"deep",name:"Scavo profondo",desc:"+42% pietra.",effect:"raw"},{id:"masonry",name:"Scalpellini",desc:"Produce anche merci.",effect:"goods"}]},
 house:{name:"Casa",icon:"⌂",unlock:1,desc:"Aumenta popolazione e tasse.",cost:{coins:120,wood:18,stone:5},raw:{coins:.18},population:3,terrain:{plains:1.12},adj:{park:.16,market:.08,bakery:.06},specs:[{id:"apartments",name:"Appartamenti",desc:"+4 abitanti.",effect:"pop"},{id:"villa",name:"Ville",desc:"+30% tasse e +2 felicità.",effect:"tax"}]},
 windmill:{name:"Mulino",icon:"✣",unlock:2,desc:"Grano → farina. Vicino alle Fattorie lavora meglio.",cost:{coins:175,wood:22,stone:8},process:{inputs:{grain:.62},outputs:{flour:.50}},adj:{farm:.24,bakery:.12},aura:{types:["farm"],value:.10},specs:[{id:"millers",name:"Mastri mugnai",desc:"Aura sulle Fattorie raddoppiata.",effect:"aura"},{id:"finegrind",name:"Macinazione fine",desc:"+30% farina.",effect:"flour"}]},
 bakery:{name:"Panificio",icon:"♨",unlock:2,desc:"Farina → cibo. È il cuore della catena alimentare.",cost:{coins:210,wood:20,stone:10},process:{inputs:{flour:.38},outputs:{food:.82,coins:.10}},adj:{windmill:.24,market:.12,house:.06},specs:[{id:"breadline",name:"Forno comunitario",desc:"+38% cibo.",effect:"food"},{id:"patisserie",name:"Pasticceria",desc:"Meno cibo, molte più monete.",effect:"coins"}]},
 workshop:{name:"Officina",icon:"⚒",unlock:3,desc:"Legno + pietra → merci.",cost:{coins:280,wood:30,stone:18},process:{inputs:{wood:.22,stone:.12},outputs:{goods:.18}},adj:{lumber:.12,quarry:.12,market:.08},aura:{types:["lumber","quarry"],value:.08},specs:[{id:"factory",name:"Fabbrica",desc:"+35% merci, +15% consumi.",effect:"factory"},{id:"artisan",name:"Artigiani",desc:"+0,35 monete/s senza consumi.",effect:"artisan"}]},
 market:{name:"Mercato",icon:"▦",unlock:4,desc:"Cibo + merci → monete. Funziona meglio nei quartieri vivi.",cost:{coins:350,wood:25,stone:16},process:{inputs:{goods:.16,food:.10},outputs:{coins:1.55}},adj:{house:.13,park:.08,harbor:.12,bakery:.16,workshop:.16},specs:[{id:"bazaar",name:"Bazar",desc:"+35% ricavi.",effect:"bazaar"},{id:"wholesale",name:"Ingrosso",desc:"-25% consumo di input.",effect:"efficient"}]},
 park:{name:"Parco",icon:"✿",unlock:5,desc:"Aumenta felicità e valore dei quartieri.",cost:{coins:360,wood:20,stone:14},happiness:5,aura:{types:["house","market"],value:.10},specs:[{id:"botanical",name:"Orto botanico",desc:"+8 felicità extra.",effect:"happy"},{id:"plaza",name:"Piazza",desc:"Mercati adiacenti +20%.",effect:"plaza"}]},
 harbor:{name:"Porto",icon:"⚓",unlock:8,desc:"Cibo + merci → commercio marittimo.",cost:{coins:650,wood:55,stone:30},coastOnly:true,process:{inputs:{goods:.13,food:.09},outputs:{coins:2.15}},adj:{market:.16,workshop:.10,bakery:.08},specs:[{id:"fleet",name:"Flotta mercantile",desc:"+45% ricavi.",effect:"fleet"},{id:"fishery",name:"Pescherecci",desc:"Produce anche cibo.",effect:"fish"}]},
 monument:{name:"Monumento",icon:"✦",unlock:10,desc:"Prestigio, felicità e produttività globale.",cost:{coins:950,wood:35,stone:70},happiness:8,global:.025,specs:[{id:"garden",name:"Giardini",desc:"+10 felicità.",effect:"happy"},{id:"academy",name:"Accademia",desc:"+5% produzione globale.",effect:"global"}]}
};
const MISSIONS=[
 {title:"Costruisci una Fattoria",progress:s=>[countBuilding("farm"),1],reward:{coins:120}},
 {title:"Costruisci una Casa",progress:s=>[countBuilding("house"),1],reward:{wood:35,coins:80}},
 {title:"Costruisci un Mulino",progress:s=>[countBuilding("windmill"),1],reward:{coins:170,grain:12}},
 {title:"Costruisci un Panificio",progress:s=>[countBuilding("bakery"),1],reward:{coins:210,flour:8}},
 {title:"Raggiungi 12 abitanti",progress:s=>[population(),12],reward:{coins:240,stone:18}},
 {title:"Produci 5 merci",progress:s=>[s.resources.goods,5],reward:{coins:300}},
 {title:"Costruisci un Mercato",progress:s=>[countBuilding("market"),1],reward:{coins:440,food:20}},
 {title:"Espandi a 18 zolle",progress:s=>[s.tiles.filter(t=>t.unlocked).length,18],reward:{wood:60,stone:32}},
 {title:"Costruisci un Porto",progress:s=>[countBuilding("harbor"),1],reward:{coins:850,goods:20}}
];

function fmt(n){if(!Number.isFinite(n))n=0;if(n<1000)return n<10?n.toFixed(1).replace(".0",""):Math.floor(n).toLocaleString("it-IT");const u=["K","M","B","T"];let i=-1;while(n>=1000&&i<u.length-1){n/=1000;i++}return n.toFixed(n<10?1:0)+u[i]}
function hash(x,y){let n=(x*374761393+y*668265263)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295}
function terrainFor(x,y){const n=hash(x+17,y-31);if(n<.20)return"fertile";if(n<.42)return"forest";if(n<.60)return"rock";if(n<.80)return"plains";return"coast"}
function defaultState(){const tiles=[];for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){const dx=x-5,dy=y-5,unlocked=Math.abs(dx)<=1&&Math.abs(dy)<=1;tiles.push({x,y,