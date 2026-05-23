export function photoUploadWidget(groupId) {
  return `<div class="fg">
    <label>Fotografías</label>
    <div class="photo-upload-box" onclick="document.getElementById('file-${groupId}').click()">
      <input type="file" id="file-${groupId}" accept="image/*" multiple capture="environment"
        onchange="handlePhotoUpload(event,'${groupId}')">
      <div class="pub-icon">📷</div>
      <div class="pub-label">Toca para <strong>tomar o adjuntar fotos</strong></div>
      <div style="font-size:.65rem;font-family:sans-serif;color:var(--tm);margin-top:.2rem;">Se guardarán en Google Drive al enviar</div>
    </div>
    <div class="photo-preview" id="prev-${groupId}"></div>
  </div>`;
}

export function handlePhotoUpload(event, groupId) {
  const files   = Array.from(event.target.files);
  const preview = document.getElementById('prev-' + groupId);
  files.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = e => {
      const id    = `${groupId}-${Date.now()}-${idx}`;
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb';
      thumb.id        = 'thumb-' + id;
      thumb.innerHTML = `<img src="${e.target.result}"><button onclick="removePhoto('${id}','${groupId}')">×</button>`;
      preview.appendChild(thumb);
      if (!window._photos) window._photos = {};
      if (!window._photos[groupId]) window._photos[groupId] = [];
      window._photos[groupId].push({ id, name: file.name, data: e.target.result });
    };
    reader.readAsDataURL(file);
  });
}

export function removePhoto(id, groupId) {
  document.getElementById('thumb-' + id)?.remove();
  if (window._photos?.[groupId]) {
    window._photos[groupId] = window._photos[groupId].filter(p => p.id !== id);
  }
}
