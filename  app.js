/* ===========================
   Aqua.ai – App JS v2
   - Before/After slider (keyboard + drag)
   - Simple helpers for upload page (preview)
   =========================== */

(function(){
  // Before/After (supports multiple .ba on page)
  function initBA(el){
    const before = el.querySelector('.ba-before');
    const divider = el.querySelector('.ba-divider');
    const handle  = el.querySelector('.ba-handle');
    let pos = 50;

    function set(p){
      pos = Math.max(0, Math.min(100, p));
      before.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
      divider.style.left = `${pos}%`;
      handle.style.left  = `${pos}%`;
    }
    set(50);

    function at(e){
      const r = el.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return (x / r.width) * 100;
    }

    el.addEventListener('mousedown', (e)=>{
      set(at(e));
      const move = (ev)=> set(at(ev));
      const up   = ()=> { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }, {passive:true});

    el.addEventListener('touchstart', (e)=> set(at(e)), {passive:true});
    el.addEventListener('touchmove',  (e)=> set(at(e)), {passive:true});

    // accessibility: keyboard
    el.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowLeft'){ set(pos-2); }
      if(e.key==='ArrowRight'){ set(pos+2); }
    });
    el.tabIndex = 0;
  }

  document.querySelectorAll('.ba').forEach(initBA);

  // Upload page helpers (optional)
  const drop = document.querySelector('.dropzone');
  const fileInput = document.querySelector('#file');
  const preview = document.querySelector('#preview');

  if(drop && fileInput){
    const onFiles = (files)=>{
      const f = files?.[0]; if(!f) return;
      const url = URL.createObjectURL(f);
      if(preview){ preview.src = url; preview.style.display='block'; }
    };
    drop.addEventListener('dragover', (e)=>{ e.preventDefault(); drop.style.borderColor='rgba(236,236,187,.6)'; });
    drop.addEventListener('dragleave', ()=> drop.style.borderColor='var(--border)');
    drop.addEventListener('drop', (e)=>{ e.preventDefault(); onFiles(e.dataTransfer.files); });
    drop.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', (e)=> onFiles(e.target.files));
  }
})();