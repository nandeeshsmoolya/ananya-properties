function cloudinaryUpload(file, folder) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected."));
    const resourceType = file.type && file.type.startsWith("video/") ? "video" : "image";
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    if (folder) body.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) window.dispatchEvent(new CustomEvent("ananya-upload-progress", {detail:{percent:Math.round(e.loaded/e.total*100)}}));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data);
        else reject(new Error(data.error?.message || "Cloudinary upload failed."));
      } catch { reject(new Error("Cloudinary returned an invalid response.")); }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading media."));
    xhr.send(body);
  });
}

async function uploadPropertyMedia(propertyId, photos, video) {
  const folder = `ananya-properties/properties/${propertyId}`;
  const gallery = [];
  for (const file of photos || []) {
    const result = await cloudinaryUpload(file, folder);
    gallery.push(result.secure_url);
  }
  let videoUrl = null;
  if (video) {
    const result = await cloudinaryUpload(video, folder);
    videoUrl = result.secure_url;
  }
  return {gallery, videoUrl};
}
