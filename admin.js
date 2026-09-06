let properties=[];
const $=id=>document.getElementById(id);
const modal=$("property-modal"), form=$("property-form");
let firebaseLoaded=false;
const DEFAULT_AMENITIES=["Parking","Wi-Fi","Lift","Power Backup","Water Supply","Garbage Management","Balcony","Heat Pump"];
const AMENITY_STORAGE_KEY="ananya_amenity_options_v1";
let existingGallery=[];
let existingVideoUrl="";
let removeExistingVideo=false;
function getAmenityOptions(){try{const saved=JSON.parse(localStorage.getItem(AMENITY_STORAGE_KEY)||"null");return Array.isArray(saved)&&saved.length?saved:DEFAULT_AMENITIES.slice()}catch{return DEFAULT_AMENITIES.slice()}}
function saveAmenityOptions(options){localStorage.setItem(AMENITY_STORAGE_KEY,JSON.stringify(options))}
function renderAmenityOptions(selected=[]){
  const box=$("amenity-checks"); if(!box)return;
  const selectedSet=new Set(selected||[]), options=getAmenityOptions();
  (selected||[]).forEach(a=>{if(a&&!options.includes(a))options.push(a)});
  box.innerHTML=options.map((name,i)=>{
    const safe=escapeHtml(name), id=`amenity-${i}`;
    return `<div class="amenity-option"><label for="${id}"><input id="${id}" type="checkbox" value="${safe}" ${selectedSet.has(name)?"checked":""}> <span>${safe}</span></label><button type="button" class="amenity-remove" data-amenity="${safe}" title="Remove this amenity">×</button></div>`;
  }).join("");
  box.querySelectorAll(".amenity-remove").forEach(btn=>btn.addEventListener("click",()=>{
    const name=btn.dataset.amenity;
    if(!confirm(`Remove "${name}" from the amenity options?`))return;
    saveAmenityOptions(getAmenityOptions().filter(x=>x!==name));
    renderAmenityOptions([]);
  }));
}
function addAmenity(){
  const input=$("new-amenity"); if(!input)return;
  const name=input.value.trim().replace(/\s+/g," "); if(!name)return;
  const options=getAmenityOptions();
  if(options.some(x=>x.toLowerCase()===name.toLowerCase())){alert("That amenity already exists.");return}
  options.push(name); saveAmenityOptions(options); input.value=""; renderAmenityOptions([name]);
}
function resetAmenities(){if(!confirm("Restore the default amenity options?"))return;saveAmenityOptions(DEFAULT_AMENITIES.slice());renderAmenityOptions([])}

function syncCustomFields(){
  const typeSelect=$("f-type"), typeCustom=$("f-type-custom");
  const locationSelect=$("f-location"), locationCustom=$("f-location-custom");
  const typeIsCustom=typeSelect?.value==="__custom__", locationIsCustom=locationSelect?.value==="__custom__";
  typeCustom?.classList.toggle("hidden",!typeIsCustom);
  typeCustom?.toggleAttribute("required",typeIsCustom);
  locationCustom?.classList.toggle("hidden",!locationIsCustom);
  locationCustom?.toggleAttribute("required",locationIsCustom);
}
function setPropertyType(value){
  const select=$("f-type"), custom=$("f-type-custom");
  const standard=["ROOM","1 BHK","2 BHK","3 BHK","4 BHK"];
  if(standard.includes(value)){
    select.value=value; custom.value="";
  }else{
    select.value="__custom__"; custom.value=value||"";
  }
  syncCustomFields();
}
function setPropertyLocation(value){
  const select=$("f-location"), custom=$("f-location-custom");
  if(value==="BTM Layout, 2nd Stage, Bangalore"){
    select.value=value; custom.value="";
  }else{
    select.value="__custom__"; custom.value=value||"";
  }
  syncCustomFields();
}

function renderExistingMedia(){
  const box=$("existing-media");
  if(!box)return;
  box.innerHTML=existingGallery.length?existingGallery.map((src,i)=>`<div class="existing-media"><img src="${src}" alt="Existing photo ${i+1}"><button type="button" class="remove-existing-media" data-index="${i}">Remove</button></div>`).join(""):"<p class='existing-media-empty'>No photos currently saved.</p>";
  box.querySelectorAll(".remove-existing-media").forEach(btn=>btn.addEventListener("click",()=>{
    const i=Number(btn.dataset.index);
    if(!Number.isInteger(i)||i<0||i>=existingGallery.length)return;
    if(!confirm("Remove this photo from the property listing?"))return;
    existingGallery.splice(i,1);
    renderExistingMedia();
  }));
}
function renderExistingVideo(){
  const box=$("existing-video");
  if(!box)return;
  box.innerHTML=existingVideoUrl&&!removeExistingVideo?`<div class="existing-video-card"><a href="${existingVideoUrl}" target="_blank" rel="noopener">View current video</a><button type="button" class="remove-existing-video">Remove video</button></div>`:"";
  box.querySelector(".remove-existing-video")?.addEventListener("click",()=>{
    if(!confirm("Remove this video from the property listing?"))return;
    removeExistingVideo=true;
    renderExistingVideo();
  });
}
function renderStats(){
  const total=properties.length, available=properties.filter(p=>p.status==="available"||!p.status).length, discussion=properties.filter(p=>p.status==="discussion").length, rented=properties.filter(p=>p.status==="rented").length;
  $("stat-total").textContent=total; $("stat-available").textContent=available; $("stat-rented").textContent=rented;
  $("dash-total").textContent=total; $("dash-available").textContent=available; $("dash-discussion").textContent=discussion; $("dash-rented").textContent=rented;
  $("dashboard-date").textContent=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function statusLabel(s){return s==="rented"?"RENTED":s==="discussion"?"UNDER DISCUSSION":"AVAILABLE"}
function renderList(){
  const filter=$("status-filter").value, list=properties.filter(p=>filter==="all"||p.status===filter);
  $("admin-list").innerHTML=list.length?list.map(p=>`<article class="admin-card"><img src="${p.gallery?.[0]||"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80"}" alt=""><div class="admin-card-info"><div class="admin-type">${p.type}</div><h3>${p.title}</h3><p>📍 ${p.location}</p><strong>${formatRent(p.rent)}</strong><span class="status ${p.status}">${statusLabel(p.status)}</span></div><div class="admin-actions"><button class="button outline" onclick="editProperty('${String(p.id).replace(/'/g,"\\'")}')">Edit</button><button class="button outline" onclick="setStatus('${String(p.id).replace(/'/g,"\\'")}','available')">Available</button><button class="button outline" onclick="setStatus('${String(p.id).replace(/'/g,"\\'")}','discussion')">Discussion</button><button class="button outline" onclick="setStatus('${String(p.id).replace(/'/g,"\\'")}','rented')">Rented</button><button class="button danger" onclick="deleteProperty('${String(p.id).replace(/'/g,"\\'")}')">Delete</button></div></article>`).join(""):"<div class='admin-empty'>No properties in this view.</div>";
}
function openModal(p=null){
  form.reset(); selectedPhotos=[]; selectedVideo=null; existingGallery=[...(p?.gallery||[])]; existingVideoUrl=p?.videoUrl||""; removeExistingVideo=false; renderPhotoPreview(); renderVideoPreview();
  $("edit-id").value=p?.id||""; $("form-title").textContent=p?"Edit Property":"Add Property";
  setPropertyType(p?.type||"ROOM"); $("f-title").value=p?.title||""; setPropertyLocation(p?.location||"BTM Layout, 2nd Stage, Bangalore"); $("f-address").value=p?.address||""; $("f-map-url").value=p?.mapUrl||""; $("f-rent").value=p?.rent||""; $("f-deposit").value=p?.deposit||""; $("f-furnishing").value=p?.furnishing||"furnished"; $("f-bedrooms").value=p?.bedrooms||""; $("f-bathrooms").value=p?.bathrooms||""; $("f-area").value=p?.area||""; $("f-status").value=p?.status||"available"; $("f-description").value=p?.description||"";
  renderAmenityOptions(p?.amenities||[]);
  renderExistingMedia();
  renderExistingVideo();
  modal.classList.remove("hidden");
}
function closeModal(){modal.classList.add("hidden")}
function editProperty(id){const p=properties.find(x=>String(x.id)===String(id));if(p)openModal(p)}
async function setStatus(id,status){const p=properties.find(x=>String(x.id)===String(id));if(!p)return;p.status=status;try{await cloudSaveProperty(p,true);renderStats();renderList()}catch(e){alert("Could not update status: "+e.message)}}
async function deleteProperty(id){const p=properties.find(x=>String(x.id)===String(id));if(!p||!confirm(`Delete "${p.title}"?`))return;try{await cloudDeleteProperty(id);properties=properties.filter(x=>String(x.id)!==String(id));renderStats();renderList()}catch(e){alert("Could not delete property: "+e.message)}}
async function loadProperties(){
  if(!window.ANANYA_FIREBASE?.ready)return;
  try{properties=await cloudGetAllProperties();renderStats();renderList()}catch(e){console.error(e);alert("Could not load Firestore properties. Check your Firestore rules and Firebase config.")}
}
$("add-property").onclick=()=>openModal(); $("close-modal").onclick=closeModal; $("cancel-form").onclick=closeModal; $("modal-backdrop").onclick=closeModal; $("status-filter").onchange=renderList;
$("add-amenity")?.addEventListener("click",addAmenity);
$("new-amenity")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addAmenity()}});
$("reset-amenities")?.addEventListener("click",resetAmenities);
$("f-type")?.addEventListener("change",syncCustomFields);
$("f-location")?.addEventListener("change",syncCustomFields);
syncCustomFields();
renderAmenityOptions([]);
form.onsubmit=async e=>{
  e.preventDefault();
  if(!window.ANANYA_FIREBASE?.ready){alert("Firebase is not configured yet.");return}
  const saveButton=form.querySelector('button[type="submit"]'); saveButton.disabled=true; saveButton.textContent="Saving...";
  try{
    const editId=$("edit-id").value.trim(), existing=properties.find(x=>String(x.id)===editId), id=editId||String(Date.now());
    const typeValue=$("f-type").value==="__custom__"?$("f-type-custom").value.trim():$("f-type").value;
    const locationValue=$("f-location").value==="__custom__"?$("f-location-custom").value.trim():$("f-location").value;
    if(!typeValue){alert("Please enter a property type."); return}
    if(!locationValue){alert("Please enter a location."); return}
    const key=typeValue.toLowerCase().replace(/\s+/g,"-");
    const item={id,type:typeValue,key,title:$("f-title").value.trim(),location:locationValue,address:$("f-address").value.trim(),mapUrl:$("f-map-url").value.trim(),rent:Number($("f-rent").value),deposit:$("f-deposit").value.trim(),furnishing:$("f-furnishing").value,furnishingLabel:$("f-furnishing").selectedOptions[0].textContent,bedrooms:$("f-bedrooms").value.trim(),bathrooms:$("f-bathrooms").value.trim(),area:$("f-area").value.trim(),amenities:[...document.querySelectorAll(".checks input:checked")].map(x=>x.value),newest:existing?.newest||Date.now(),status:$("f-status").value,description:$("f-description").value.trim(),gallery:[...existingGallery],videoUrl:removeExistingVideo?"":existingVideoUrl};
    if(selectedPhotos.length || selectedVideo){
      const media=await uploadPropertyMedia(id,selectedPhotos,selectedVideo);
      if(media.gallery.length) item.gallery=[...item.gallery,...media.gallery];
      if(media.videoUrl) item.videoUrl=media.videoUrl;
    }
    await cloudSaveProperty(item,!!existing);
    properties=existing?properties.map(x=>String(x.id)===editId?item:x):[item,...properties];
    renderStats();renderList();closeModal();
  }catch(err){console.error(err);alert("Could not save the property: "+err.message)}finally{saveButton.disabled=false;saveButton.textContent="Save Property"}
};
function startAdmin(){loadProperties()}
window.addEventListener("ananya-firebase-ready",startAdmin,{once:true}); if(window.ANANYA_FIREBASE)startAdmin();

let enquiries=[];
function enquiryStatusLabel(s){return s==="closed"?"CLOSED":s==="contacted"||s==="visit"?"CONTACTED":"NEW";}
function formatEnquiryDate(value){
  try{
    if(!value)return "";
    const d=value?.toDate?value.toDate():value?.seconds?new Date(value.seconds*1000):new Date(value);
    if(Number.isNaN(d.getTime()))return "";
    return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  }catch{return ""}
}
function enquiryPhoneHref(phone){return String(phone||"").replace(/[^0-9+]/g,"")}
function enquiryWhatsappHref(phone, enquiry){
  const digits=String(phone||"").replace(/\D/g,"");
  if(!digits) return "#";
  const name=String(enquiry?.name||"Customer").trim();
  const property=String(enquiry?.propertyTitle||"the property").trim();
  const location=String(enquiry?.propertyLocation||"BTM Layout, 2nd Stage, Bangalore").trim();
  const message=`Hi ${name}, this is ANANYA PROPERTIES. Thank you for your enquiry regarding ${property} in ${location}. We have received your request and would be happy to share the availability, rent/deposit details, photos, and arrange a visit. Please let us know a convenient time to connect. Thank you!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
function renderEnquiries(){
  const box=$("enquiries-list");
  if(!box) return;
  if(!enquiries.length){box.innerHTML="<div class='admin-empty'>No customer enquiries yet.</div>";return;}
  box.innerHTML=enquiries.map(e=>{
    const status=e.status==="visit"?"contacted":(e.status||"new"), date=formatEnquiryDate(e.createdAt), phone=enquiryPhoneHref(e.phone);
    return `<article class="admin-enquiry-card">
      <div class="admin-enquiry-header">
        <div class="admin-enquiry-customer">
          <span class="admin-type">${enquiryStatusLabel(e.status)}</span>
          <h3>${escapeHtml(e.name||"Customer")}</h3>
          ${date?`<span class="admin-enquiry-date">Received ${escapeHtml(date)}</span>`:""}
        </div>
        <div class="admin-enquiry-side">
          <span class="admin-enquiry-side-label">Update Status</span>
          <select data-enquiry-id="${escapeHtml(e.id)}">
            <option value="new" ${status==="new"?"selected":""}>New</option>
            <option value="contacted" ${status==="contacted"?"selected":""}>Contacted</option>
            <option value="closed" ${status==="closed"?"selected":""}>Closed</option>
          </select>
        </div>
      </div>
      <div class="admin-enquiry-meta">
        <div class="enquiry-detail"><span>Phone</span><strong>${phone?`<a href="tel:${escapeHtml(phone)}">${escapeHtml(e.phone)}</a>`:escapeHtml(e.phone||"—")}</strong></div>
        <div class="enquiry-detail"><span>Property</span><strong>${escapeHtml(e.propertyTitle||"Property")}</strong></div>
        <div class="enquiry-detail"><span>Location</span><strong>${escapeHtml(e.propertyLocation||"BTM Layout, 2nd Stage, Bangalore")}</strong></div>
      </div>
      <div class="admin-enquiry-message">
        <span class="admin-enquiry-message-label">Customer Message</span>
        <p>${escapeHtml(e.message||"No message provided.")}</p>
      </div>
      <div class="admin-enquiry-actions">
        ${phone?`<a class="button outline" href="tel:${escapeHtml(phone)}">📞 Call</a>`:""}
        ${phone?`<a class="button outline" href="${enquiryWhatsappHref(e.phone,e)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`:""}
        <button class="button danger" type="button" data-delete-enquiry-id="${escapeHtml(e.id)}">Delete</button>
      </div>
    </article>`;
  }).join("");
  box.querySelectorAll("select[data-enquiry-id]").forEach(sel=>sel.addEventListener("change",async()=>{
    try{
      await cloudUpdateEnquiryStatus(sel.dataset.enquiryId,sel.value);
      const e=enquiries.find(x=>String(x.id)===String(sel.dataset.enquiryId));
      if(e)e.status=sel.value;
      renderEnquiries();
    }catch(err){alert("Could not update enquiry: "+err.message);}
  }));
  box.querySelectorAll("button[data-delete-enquiry-id]").forEach(btn=>btn.addEventListener("click",async()=>{
    const id=btn.dataset.deleteEnquiryId;
    const e=enquiries.find(x=>String(x.id)===String(id));
    if(!e || !confirm(`Delete enquiry from ${e.name||"this customer"}?`)) return;
    btn.disabled=true;
    try{
      await cloudDeleteEnquiry(id);
      enquiries=enquiries.filter(x=>String(x.id)!==String(id));
      renderEnquiries();
    }catch(err){
      btn.disabled=false;
      alert("Could not delete enquiry: "+err.message);
    }
  }));
}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function loadEnquiries(){
  if(!window.ANANYA_FIREBASE?.ready) return;
  const box=$("enquiries-list"); if(box) box.innerHTML="<div class='admin-empty'>Loading enquiries...</div>";
  try{enquiries=await cloudGetEnquiries();renderEnquiries();}catch(e){console.error(e);if(box)box.innerHTML="<div class='admin-empty'>Could not load enquiries.</div>";}
}
$("refresh-enquiries")?.addEventListener("click",loadEnquiries);
window.addEventListener("ananya-firebase-ready",loadEnquiries,{once:true});
if(window.ANANYA_FIREBASE) loadEnquiries();
