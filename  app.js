const $ = (sel) => document.querySelector(sel);

function modelsSelected() {
  return Array.from(document.querySelectorAll('input[name="model"]:checked')).map(i => i.value);
}

$("#uform").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#msg").textContent = "";
  $("#bar").value = 0;

  const file = $("#file").files?.[0];
  if (!file) {
    $("#msg").textContent = "파일을 선택하세요.";
    return;
  }

  const email = $("#email").value.trim();
  const consent_gallery = $("#consent_gallery").checked;
  const consent_training = $("#consent_training").checked;
  const watermark = $("#watermark").checked;
  const models = modelsSelected();

  try {
    // 1) presign
    const pre = await fetch("/api/presign-put", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type })
    }).then(r => r.json());

    if (!pre?.url) throw new Error(pre?.error || "presign failed");

    // 2) PUT directly to S3
    await putWithProgress(pre.url, file, (pct) => $("#bar").value = pct);

    // 3) Notion 로그
    const log = await fetch("/api/notion-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        email,
        models,
        watermark,
        consent_gallery,
        consent_training,
        original_url: pre.publicUrl
      })
    }).then(r => r.json());

    if (!log?.ok) throw new Error(log?.error || "notion log failed");

    $("#msg").textContent = `완료! 원본: ${pre.publicUrl}\nNotion page: ${log.id}`;
  } catch (err) {
    $("#msg").textContent = `에러: ${err.message || err}`;
  }
});

async function putWithProgress(url, file, onProg) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("네트워크 오류"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 PUT ${xhr.status}`));
    };
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}