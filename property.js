const id=String(new URLSearchParams(location.search).get("id")||"");
let p=null;
const $=id=>document.getElementById(id);
const money=n=>formatRent(n);

function localAvailable(){
  return getProperties().filter(x=>x.status === "available" || !x.status);
}

function contactNumber(){
  return String(window.ANANYA_CONTACT?.whatsapp || window.ANANYA_CONTACT?.phone || "").replace(/\D/g,"");
}

function openWhatsApp(){
  const phone=contactNumber();
  if(!phone || phone === "YOUR_NUMBER"){
    alert("WhatsApp contact number has not been configured yet.");
    return;
  }
  const message = `Hi ANANYA PROPERTIES, I'm interested in this property:\n\n🏠 ${p.title}\n📍 ${p.location||"BTM Layout, Bangalore"}\n💰 Rent: ${money(p.rent||0)}\n💵 Deposit: ${p.deposit||"—"}\n🛏️ Bedrooms: ${p.bedrooms||"—"}\n🛁 Bathrooms: ${p.bathrooms||"—"}\n🪑 Furnishing: ${p.furnishingLabel||p.furnishing||"—"}\n📐 Area: ${p.area||"—"}\n\nPlease share more details about the property, availability, and photos. Thank you.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,"_blank","noopener");
}

function openCall(){
  const phone=String(window.ANANYA_CONTACT?.phone||"").replace(/\D/g,"");
  if(!phone || phone === "YOUR_NUMBER"){
    alert("Call contact number has not been configured yet.");
    return;
  }
  window.location.href=`tel:+${phone}`;
}

function bindEnquiry(){
  const form=$("enquiry-form");
  const title=$("enquiry-property-title");
  const modal=$("enquiry-modal");
  const status=$("enquiry-status");
  if(title && p) title.textContent=`${p.title} • ${p.location||"BTM Layout, Bangalore"}`;
  const open=()=>{ if(!modal)return; modal.classList.remove("hidden"); modal.setAttribute("aria-hidden","false"); setTimeout(()=>$("enquiry-name")?.focus(),50); };
  const close=()=>{ if(!modal)return; modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); if(status)status.textContent=""; };
  $("enquire-form-button")?.addEventListener("click",open);
  $("enquiry-close")?.addEventListener("click",close);
  $("enquiry-cancel")?.addEventListener("click",close);
  $("enquiry-backdrop")?.addEventListener("click",close);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal?.classList.contains("hidden"))close();});
  form?.addEventListener("submit",async e=>{
    e.preventDefault();
    const name=$("enquiry-name").value.trim(), phone=$("enquiry-phone").value.trim(), message=$("enquiry-message").value.trim();
    if(!/^.{2,80}$/.test(name)){status.textContent="Please enter your name."; $("enquiry-name")?.focus(); return;}
    if(phone.replace(/\D/g,"").length<7){status.textContent="Please enter a valid phone number."; $("enquiry-phone")?.focus(); return;}
    const btn=form.querySelector('button[type="submit"]');
    const original=btn.textContent;
    btn.disabled=true; btn.textContent="Sending..."; status.textContent="Sending your enquiry securely...";
    try{
      await cloudCreateEnquiry({name,phone,message,propertyId:String(p.id),propertyTitle:p.title,propertyLocation:p.location||"BTM Layout, Bangalore"});
      form.reset(); close();
      alert("Thank you! Your enquiry has been sent. ANANYA PROPERTIES will contact you soon.");
    }catch(err){
      console.error(err);
      status.textContent="We couldn't send this right now. Please try WhatsApp or call us.";
    }finally{btn.disabled=false;btn.textContent=original;}
  });
}

async function loadProperty(){
  try{
    let list = localAvailable();
    if(window.ANANYA_FIREBASE?.ready){
      try{
        const cloudList=await cloudGetAvailableProperties();
        if(cloudList.length) list=cloudList;
      }catch(e){ console.warn("Firestore unavailable; using local property data.",e); }
    }

    p=list.find(x=>String(x.id)===id);
    if(!p){
      document.querySelector("main").innerHTML='<div class="empty"><h3>Property not found</h3><p>This listing is no longer available.</p></div>';
      return;
    }

    document.title=`${p.title} | ANANYA PROPERTIES`;
    const image=p.gallery?.[0]||"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85";
    $("main-image").src=image; $("main-image").alt=p.title;
    $("type").textContent=p.type||"PROPERTY"; $("title").textContent=p.title;
    $("location").textContent=`📍 ${p.location||"BTM Layout, Bangalore"}`;
    $("address").textContent=p.address||"";
    const mapSection=$("property-map-section"), mapLink=$("map-link"), mapAddress=$("map-address");
    const mapTarget=p.mapUrl||((p.address||p.location)?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address||p.location)}`:"");
    if(mapTarget){
      mapLink.href=mapTarget;
      mapAddress.textContent=p.address||p.location||"BTM Layout, Bangalore";
      mapSection.classList.remove("hidden");
    }else{
      mapSection.classList.add("hidden");
    }
    $("price").textContent=money(p.rent||0);
    $("property-size").textContent=p.bedrooms||p.type||"—"; $("furnishing").textContent=p.furnishingLabel||p.furnishing||"—";
    $("bathrooms").textContent=p.bathrooms||"—"; $("area").textContent=p.area||"—"; $("deposit").textContent=p.deposit||"—";
    $("description").textContent=p.description||"Property details will be updated soon.";
    $("amenities").innerHTML=(p.amenities||[]).map(x=>`<span>${x}</span>`).join("");

    const thumbs=$("thumbs"); thumbs.innerHTML="";
    (p.gallery||[image]).forEach((src,i)=>{
      const img=document.createElement("img"); img.className="thumb"+(i===0?" active":""); img.src=src; img.alt=`${p.title} photo ${i+1}`;
      img.onclick=()=>{ $("main-image").src=src; document.querySelectorAll(".thumb").forEach(t=>t.classList.remove("active")); img.classList.add("active"); };
      thumbs.appendChild(img);
    });

    const videoSection=$("property-video-section");
    if(p.videoUrl){
      const box=document.querySelector(".video-placeholder");
      if(box) box.innerHTML=`<video controls playsinline style="width:100%;height:100%;object-fit:cover" src="${p.videoUrl}"></video>`;
      videoSection?.classList.remove("hidden");
    }else{
      videoSection?.classList.add("hidden");
    }

    const detailHeart=$("detail-heart");
    let savedList=JSON.parse(localStorage.getItem("ananyaShortlist")||"[]").map(String);
    const update=()=>{ const saved=savedList.includes(String(p.id)); detailHeart.textContent=saved?"♥ Saved to shortlist":"♡ Save to shortlist"; detailHeart.classList.toggle("saved",saved); };
    detailHeart.addEventListener("click",()=>{ if(savedList.includes(String(p.id))) savedList=savedList.filter(x=>x!==String(p.id)); else savedList.push(String(p.id)); localStorage.setItem("ananyaShortlist",JSON.stringify(savedList)); update(); });
    update();

    $("whatsapp")?.addEventListener("click",openWhatsApp);
    $("call-now")?.addEventListener("click",openCall);
    bindEnquiry();
  }catch(e){
    console.error(e);
    document.querySelector("main").innerHTML='<div class="empty"><h3>Unable to load this property</h3><p>Please refresh and try again.</p></div>';
  }
}
window.addEventListener("ananya-firebase-ready",loadProperty,{once:true});
if(window.ANANYA_FIREBASE) loadProperty();
