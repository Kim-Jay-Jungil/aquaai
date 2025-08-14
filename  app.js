// 앱 전역 스크립트 (Before/After 슬라이더)
function mountBA(root){
  if(!root) return;
  const srcBefore = root.getAttribute('data-before');
  const srcAfter  = root.getAttribute('data-after');
  const imgBefore = root.querySelector('.ba-before');
  const imgAfter  = root.querySelector('.ba-after');
  const divider   = root.querySelector('.ba-divider');
  const handle    = root.querySelector('.ba-handle');

  if(srcBefore) imgBefore.src = srcBefore;
  if(srcAfter)  imgAfter.src  = srcAfter;

  const clamp01 = (n)=> Math.min(1, Math.max(0, n));

  const setPct = (pct)=>{ // 0~1
    const p = clamp01(pct);
    const left = (p*100)+'%';
    imgBefore.style.clipPath = `inset(0 calc(${100-p*100}% ) 0 0)`;
    divider.style.left = left;
    handle.style.left  = left;
  };

  const rect = ()=> root.getBoundingClientRect();

  const onMove = (x)=>{
    const r = rect();
    setPct((x - r.left) / r.width);
  };

  // 초기 50%
  setPct(.5);

  // 이벤트
  root.addEventListener('mousemove',  (e)=> onMove(e.clientX), {passive:true});
  root.addEventListener('touchmove',  (e)=> onMove(e.touches[0].clientX), {passive:true});

  // 키보드 접근성(좌/우)
  root.setAttribute('tabindex','0');
  root.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowLeft')  setPct((parseFloat(handle.style.left)||50)/100 - 0.02);
    if(e.key==='ArrowRight') setPct((parseFloat(handle.style.left)||50)/100 + 0.02);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.ba').forEach(mountBA);
});