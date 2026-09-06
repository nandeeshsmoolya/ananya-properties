let properties=[];
const $=id=>document.getElementById(id);
const search=$("search"),type=$("type"),furnishing=$("furnishing"),budget=$("budget"),sort=$("sort");
const grid=$("property-grid"),count=$("result-count"),empty=$("empty-state"),shortlistNav=$("shortlist-nav"),shortlistCount=$("shortlist-count"),shortlistSection=$("shortlist"),shortlistGrid=$("shortlist-grid"),shortlistEmpty=$("shortlist-empty");
let shortlisted=JSON.parse(localStorage.getItem("ananyaShortlist")||"[]").map(String),showingShortlist=false;
function money(n){return formatRent(n)}
function isStandardType(key){return ["room","1bhk","2bhk","3bhk","4bhk"].includes(String(key||"").toLowerCase())}
function matchesBudget(rent,range){const n=Number(rent)||0;switch(range){case "under10":return n<10000;case "10to15":return n>=10000&&n<15000;case "15to20":return n>=15000&&n<20000;case "20to30":return n>=20000&&n<30000;case "30to40":return n>=30000&&n<40000;case "40to50":return n>=40000&&n<50000;case "above50":return n>=50000;default:return true}}
function filtered(){let list=properties.filter(p=>{const q=search.value.trim().toLowerCase(),text=`${p.title} ${p.location} ${p.type} ${(p.amenities||[]).join(" ")}`.toLowerCase(),typeMatch=type.value==="all"||(type.value==="other"?!isStandardType(p.key):p.key===type.value);return(!q||text.includes(q))&&typeMatch&&(furnishing.value==="all"||p.furnishing===furnishing.value)&&matchesBudget(p.rent,budget.value)&&(p.status==="available"||!p.status)});if(sort.value==="low")list.sort((a,b)=>Number(a.rent)-Number(b.rent));if(sort.value==="high")list.sort((a,b)=>Number(b.rent)-Number(a.rent));if(sort.value==="newest")list.sort((a,b)=>Number(b.newest||0)-Number(a.newest||0));return list}
function cardTemplate(p){const saved=shortlisted.includes(String(p.id)),image=p.gallery?.[0]||"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80";return `<article class="property-card"><div class="property-image-wrap"><img class="property-image" src="${image}" alt="${p.title}"><span class="badge">AVAILABLE</span><button class="heart-button ${saved?"saved":""}" type="button" aria-label="${saved?"Remove from":"Add to"} shortlist" onclick="toggleShortlist('${String(p.id).replace(/'/g,"\\'")}')">${saved?"♥":"♡"}</button></div><div class="property-info"><div class="property-type">${p.type}</div><h3>${p.title}</h3><div class="location">📍 ${p.location}</div><div class="price">${money(p.rent)}</div><div class="meta">${(p.amenities||[]).slice(0,4).map(x=>`<span>${x}</span>`).join("")}</div><div class="card-actions"><a class="button details-btn" href="property.html?id=${encodeURIComponent(p.id)}">View Details</a><a class="button quick-btn" href="property.html?id=${encodeURIComponent(p.id)}#enquire">Enquire</a></div></div></article>`}
function render(){const list=showingShortlist?properties.filter(p=>shortlisted.includes(String(p.id))&&p.status!=="rented"):filtered();count.textContent=`${list.length} ${list.length===1?"property":"properties"} ${showingShortlist?"shortlisted":"available"}`;empty.classList.toggle("hidden",showingShortlist||list.length!==0);if(showingShortlist){shortlistGrid.innerHTML=list.map(cardTemplate).join("");shortlistEmpty.classList.toggle("hidden",list.length!==0);grid.innerHTML=""}else grid.innerHTML=list.map(cardTemplate).join("");updateShortlistCount()}
function toggleShortlist(id){id=String(id);if(shortlisted.includes(id))shortlisted=shortlisted.filter(x=>x!==id);else shortlisted.push(id);localStorage.setItem("ananyaShortlist",JSON.stringify(shortlisted));render()}
function syncShortlistWithProperties(){
  const validIds=new Set(properties.filter(p=>p.status!=="rented").map(p=>String(p.id)));
  const cleaned=shortlisted.filter(id=>validIds.has(String(id)));
  if(cleaned.length!==shortlisted.length){shortlisted=cleaned;localStorage.setItem("ananyaShortlist",JSON.stringify(shortlisted));}
}
function updateShortlistCount(){shortlistCount.textContent=shortlisted.length}
async function loadPublic(){
  if(!window.ANANYA_FIREBASE?.ready){
    properties=[];
    syncShortlistWithProperties();
    render();
    return;
  }
  try{
    properties=await cloudGetAvailableProperties();
    syncShortlistWithProperties();
    render();
  }catch(e){
    console.error(e);
    properties=[];
    syncShortlistWithProperties();
    render();
  }
}
if(search){[search,type,furnishing,budget,sort].forEach(el=>el?.addEventListener("input",render));$("clear-filters").addEventListener("click",()=>{search.value="";type.value="all";furnishing.value="all";budget.value="all";sort.value="newest";render()});shortlistNav.addEventListener("click",()=>{showingShortlist=true;shortlistSection.classList.remove("hidden");$("properties").classList.add("hidden");shortlistSection.scrollIntoView({behavior:"smooth",block:"start"});render()});$("close-shortlist").addEventListener("click",()=>{showingShortlist=false;shortlistSection.classList.add("hidden");$("properties").classList.remove("hidden");$("properties").scrollIntoView({behavior:"smooth",block:"start"});render()});window.addEventListener("ananya-firebase-ready",loadPublic,{once:true});if(window.ANANYA_FIREBASE)loadPublic()}
