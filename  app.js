// Before/After slider (멀티 인스턴스 지원)
(function(){
  function clamp01(n){ return Math.max(0, Math.min(1, n)); }

  function mountBA(root){
    if(!root) return;
    // 소스 바인딩
    const srcBf = root.getAttribute('data-before');
    const srcAf = root.getAttribute('data-after');
    const aspect = root.getAttribute('data-aspect'); // "16/9" 등
    const imgAf = root.querySelector('.ba-after');
    const imgBf = root.querySelector('.ba-before');
    const divider = root.querySelector('.ba-divider');
    const handle  = root.querySelector('.ba-handle');

    if(srcAf) imgAf.src = srcAf;
    if(srcBf) imgBf.src = srcBf;
    if(aspect && aspect.includes('/')){
      const [w,h] = aspect.split('/').map(Number);
      if(w>0 && h>0) root.style.aspectRatio = `${w}/${h}`;
    }

    // 초기 50%
    setCut(0.5);

    // 이벤트: 마우스/터치/포인터
    function rect(){ return root.getBoundingClientRect(); }
    function moveFrom(x){
      const r = rect();
      const p = clamp01((x - r.left) / r.width);
      setCut(p);
    }
    function onPointer(e){ moveFrom(e.clientX); }
    function onTouch(e){ if(e.touches && e.touches[0]) moveFrom(e.touches[0].clientX); }

    root.addEventListener('pointerdown', onPointer);
    root.addEventListener('pointermove', onPointer);
    root.addEventListener('mousemove',   onPointer);
    root.addEventListener('touchstart',  onTouch, {passive:true});
    root.addEventListener('touchmove',   onTouch, {passive:true});

    // 키보드 접근성
    root.tabIndex = 0;
    root.addEventListener('keydown', (e)=>{
      const step = (e.shiftKey ? 0.1 : 0.03);
      if(e.key === 'ArrowLeft')  setCut(current - step);
      if(e.key === 'ArrowRight') setCut(current + step);
    });

    // 내부 상태
    let current = 0.5;
    function setCut(p){
      current = clamp01(p);
      const rightPct = (100 - current*100); // before가 보이는 영역의 오른쪽 여백(%)
      // clip-path 는 'inset(top right bottom left)' 순서
      imgBf.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
      const left = (current*100) + '%';
      divider.style.left = left;
      handle.style.left  = left;
    }
  }

  // mount
  window.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.ba').forEach(mountBA);
  });
})();