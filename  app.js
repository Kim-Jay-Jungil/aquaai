<script>
function mountBA(el){
  const before = el.querySelector('.ba-before');
  const divider = el.querySelector('.ba-divider');
  const handle = el.querySelector('.handle');

  const move = (x)=>{
    const r = el.getBoundingClientRect();
    let pct = (x - r.left) / r.width;
    pct = Math.max(0, Math.min(1, pct));
    el.style.setProperty('--cut', (pct*100) + '%');
  };
  el.addEventListener('mousemove', e => move(e.clientX));
  el.addEventListener('touchmove', e => move(e.touches[0].clientX), {passive:true});
}
window.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.ba').forEach(mountBA);
});
</script>