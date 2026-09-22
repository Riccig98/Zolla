let volatileSave=null;
let state;
let currentView="armory",toastTimer=null,packSession=null;
let drag={candidate:null,dragging:false,startX:0,startY:0,ghost:null,sourceEl:null};
let range=null,rangeRAF=null,fireHeld=false,lastRangeFrame=performance.now();

function load(){
  try{
    let raw=null;
    try{raw=localStorage.getItem(SAVE_KEY)}catch{raw=volatileSave}
    if(!raw)return defaultState();
    const s=JSON.parse(raw),d=defaultState();
    s.items=Array.isArray(s.items)?s.items:d.items;s.discovered=s.discovered||{};
    s.packProgress=Number.isFinite(s.packProgress)?s.packProgress:0;s.packTokens=s.packTokens||0;
    s.nextFreePack=s.nextFreePack||Date.now()+180000;s.collectorXp=s.collectorXp||0;
    return{...d,...s}
  }catch{return defaultState()}
}
function save(){
  const raw=JSON.stringify(state);volatileSave=raw;
  try{localStorage.setItem(SAVE_KEY,raw)}catch{}
}
function markDiscovered(item){state.discovered[weaponKey(item.family,item.tier)]=true}
state=load();state.items.forEach(markDiscovered);

function fmt(n){return n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":Math.floor(n).toLocaleString("it-IT")}
function buzz(ms=25){try{navigator.vibrate?.(ms)}catch{}}
function showToast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1400)
}
function setAppHeight(){document.documentElement.style.setProperty("--app-h",window.innerHeight+"px")}
addEventListener("resize",setAppHeight,{passive:true});setAppHeight();

function rarityStyle(tier){
  const r=rarity(tier);return`--rarity:${r.color};--rarity-line:${r.line};--rarity-glow:${r.glow}`
}
function weaponSVG(item){
  const f=family(item.family),r=rarity(item.tier),a=f.accent,hot=r.color,t=item.tier,u=item.upgrade||0;
  const glow=t>=5?`filter="url(#g)"`:"";
  const defs=`<defs><linearGradient id="m" x1="0" x2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${hot}"/><stop offset="1" stop-color="#dce6ee"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  const core=`<circle cx="106" cy="53" r="${5+t*.65}" fill="${hot}" opacity=".95"/><circle cx="106" cy="53" r="${10+t}" fill="none" stroke="${hot}" opacity=".22"/>`;
  const upgradeNodes=Array.from({length:Math.min(3,Math.floor(u/3))},(_,i)=>`<circle cx="${48+i*14}" cy="35" r="2.8" fill="${hot}"/>`).join("");
  let shape="";
  if(f.id==="pistol"){
    shape=`<path d="M35 45 L126 45 Q135 45 137 53 L129 61 L92 61 L84 88 L63 88 L67 60 L35 58 Z" fill="url(#m)" stroke="#0a0d12" stroke-width="3"/><rect x="130" y="${49-t*.5}" width="${22+t*4}" height="7" rx="3" fill="#cbd6df"/><path d="M68 61 L84 61 L79 90 L61 90 Z" fill="#303946"/><rect x="48" y="39" width="${18+t*2}" height="6" rx="2" fill="#26313c"/>${core}${upgradeNodes}`;
  }else if(f.id==="smg"){
    shape=`<path d="M28 44 L124 44 L139 54 L124 64 L76 64 L70 82 L55 82 L57 63 L28 60 Z" fill="url(#m)" stroke="#090c11" stroke-width="3"/><path d="M30 48 L12 54 L31 60" fill="none" stroke="#7e8b97" stroke-width="${5+t*.5}"/><rect x="137" y="51" width="${24+t*3}" height="7" rx="3" fill="#b7c4cf"/><path d="M87 63 L102 63 L97 90 L83 88 Z" fill="#343e49"/>${core}${upgradeNodes}`;
  }else if(f.id==="rifle"){
    shape=`<path d="M30 45 L130 45 L147 54 L126 63 L72 63 L65 83 L49 83 L54 62 L30 60 Z" fill="url(#m)" stroke="#090c11" stroke-width="3"/><path d="M31 48 L10 39 L10 65 L35 60" fill="#3a4652"/><rect x="144" y="51" width="${34+t*4}" height="6" rx="3" fill="#bdc9d2"/><path d="M92 63 L108 63 L102 90 L88 88 Z" fill="#303a46"/><rect x="86" y="37" width="${25+t*2}" height="7" rx="3" fill="#26313b"/>${core}${upgradeNodes}`;
  }else if(f.id==="shotgun"){
    shape=`<path d="M31 49 L117 49 L128 58 L111 66 L55 66 L47 82 L34 80 L42 64 L24 61 Z" fill="url(#m)" stroke="#090c11" stroke-width="3"/><rect x="112" y="47" width="${52+t*4}" height="5" rx="2" fill="#c5cdd2"/><rect x="112" y="55" width="${48+t*4}" height="5" rx="2" fill="#8f9ba5"/><path d="M33 52 L10 45 L10 70 L38 63" fill="#3b4650"/>${core}${upgradeNodes}`;
  }else if(f.id==="sniper"){
    shape=`<path d="M36 48 L119 48 L130 56 L115 63 L68 63 L59 82 L43 82 L49 62 L30 60 Z" fill="url(#m)" stroke="#090c11" stroke-width="3"/><path d="M35 50 L11 43 L8 66 L39 61" fill="#34414d"/><rect x="127" y="53" width="${58+t*5}" height="5" rx="2" fill="#c8d2d9"/><rect x="77" y="34" width="${38+t*2}" height="8" rx="4" fill="#303b47"/><circle cx="86" cy="38" r="7" fill="#26303a" stroke="${hot}" stroke-width="2"/>${core}${upgradeNodes}`;
  }else if(f.id==="heavy"){
    shape=`<path d="M26 39 L126 39 L147 52 L137 69 L89 69 L78 87 L58 87 L63 68 L27 64 Z" fill="url(#m)" stroke="#090c11" stroke-width="4"/><circle cx="105" cy="64" r="${15+t*.8}" fill="#343e49" stroke="${hot}" stroke-width="3"/><rect x="141" y="48" width="${35+t*4}" height="10" rx="4" fill="#bac6ce"/><path d="M28 43 L10 51 L27 61" fill="none" stroke="#697784" stroke-width="9"/>${core}${upgradeNodes}`;
  }else if(f.id==="energy"){
    shape=`<path d="M34 49 L126 49 L142 57 L124 65 L70 65 L60 81 L45 80 L52 63 L29 59 Z" fill="#26313c" stroke="${hot}" stroke-width="3"/><rect x="133" y="53" width="${35+t*4}" height="7" rx="3" fill="url(#m)"/><ellipse cx="103" cy="56" rx="${18+t}" ry="${13+t*.4}" fill="none" stroke="${hot}" stroke-width="${2+t*.2}" opacity=".8"/><ellipse cx="103" cy="56" rx="${10+t*.5}" ry="${20+t*.8}" fill="none" stroke="${a}" opacity=".45" transform="rotate(65 103 56)"/>${core}${upgradeNodes}`;
  }else{
    shape=`<path d="M25 64 L52 52 L${135+t*5} ${20-t} L151 29 L73 67 L50 73 Z" fill="url(#m)" stroke="#090c11" stroke-width="3"/><path d="M49 55 L65 72" stroke="#cbd5dd" stroke-width="${6+t*.3}"/><rect x="30" y="60" width="29" height="10" rx="5" fill="#34404c"/><circle cx="57" cy="61" r="${6+t*.45}" fill="${hot}"/>${upgradeNodes}`;
  }
  const wings=t>=4?`<path d="M92 43 L105 ${28-t} L112 45" fill="none" stroke="${hot}" stroke-width="3" opacity=".55"/>`:"";
  const crown=t>=6?`<circle cx="122" cy="51" r="${16+t}" fill="none" stroke="${hot}" opacity=".18" stroke-width="2"/><circle cx="122" cy="51" r="${22+t}" fill="none" stroke="${a}" opacity=".08"/>`:"";
  return `<svg viewBox="0 0 200 105" aria-hidden="true">${defs}<g ${glow}>${shape}${wings}${crown}</g></svg>`
}

