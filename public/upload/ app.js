// upload/app.js
(function () {
  const $file = document.getElementById('file');
  const $btn = document.getElementById('btn');
  const $msg = document.getElementById('msg');

  const say = (t) => ($msg.textContent = String(t || ''));

  async function presign(filename, contentType) {
    const r = await fetch('/api/presign-put', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename, contentType })
    });

    let data = null;
    try { data = await r.json(); } catch { data = null; }

    if (!r.ok) {
      const detail = data?.detail ? `, detail: ${data.detail}` : '';
      const errMsg = data?.error ? `${data.error}${detail}` : `presign failed (${r.status})`;
      throw new Error(errMsg);
    }
    if (!data?.url) throw new Error('presign ok but url missing');
    return data; // { url, key, publicUrl }
  }

  async function putToS3(putUrl, file) {
    const r = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type || 'application/octet-stream' },
      body: file
    });
    if (!r.ok) throw new Error(`S3 PUT failed (${r.status})`);
  }

  async function onUpload() {
    try {
      say('');
      const file = $file.files && $file.files[0];
      if (!file) return say('파일을 선택해주세요');

      say('Presign 요청…');
      const { url, publicUrl } = await presign(file.name, file.type);

      say('S3 업로드 중…');
      await putToS3(url, file);

      say(`완료! ${publicUrl}`);
    } catch (e) {
      say(`오류: ${e.message || e}`);
    }
  }

  $btn.addEventListener('click', onUpload);
})();