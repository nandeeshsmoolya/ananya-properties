const photoInput = document.getElementById("f-photos");
const videoInput = document.getElementById("f-video");
const photoPreview = document.getElementById("photo-preview");
const videoPreview = document.getElementById("video-preview");
let selectedPhotos=[]; let selectedVideo=null;
function renderPhotoPreview(){
  if(!photoPreview) return; photoPreview.innerHTML="";
  selectedPhotos.forEach((file,index)=>{
    const box=document.createElement("div"); box.className="upload-thumb";
    const img=document.createElement("img"); img.alt=file.name;
    const remove=document.createElement("button"); remove.type="button"; remove.className="remove-media"; remove.textContent="×";
    remove.onclick=()=>{selectedPhotos.splice(index,1);renderPhotoPreview()};
    box.append(img,remove); photoPreview.appendChild(box);
    const reader=new FileReader(); reader.onload=()=>img.src=reader.result; reader.readAsDataURL(file);
  });
}
function renderVideoPreview(){
  if(!videoPreview) return; videoPreview.innerHTML=""; if(!selectedVideo) return;
  const wrap=document.createElement("div"); wrap.className="video-file-card";
  const video=document.createElement("video"); video.controls=true; video.playsInline=true; video.src=URL.createObjectURL(selectedVideo);
  const remove=document.createElement("button"); remove.type="button"; remove.className="remove-video"; remove.textContent="Remove video";
  remove.onclick=()=>{selectedVideo=null;renderVideoPreview()}; wrap.append(video,remove); videoPreview.appendChild(wrap);
}
photoInput?.addEventListener("change",e=>{selectedPhotos=[...selectedPhotos,...Array.from(e.target.files||[])];renderPhotoPreview();e.target.value=""});
videoInput?.addEventListener("change",e=>{selectedVideo=e.target.files?.[0]||null;renderVideoPreview();e.target.value=""});
