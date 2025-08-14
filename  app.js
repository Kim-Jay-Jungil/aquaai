// app.js
(() => {
  function mountBA(el) {
    const before  = el.querySelector('.ba-before img');
    const after   = el.querySelector('.ba-after img');
    const divider = el.querySelector('.ba-divider');
    const handle  = el.querySelector('.ba-handle');

    let rect;

    function measure() {
      rect = el.getBoundingClientRect();
    }

    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    function setCut(pct) {
      pct = clamp01(pct);
      const pctStr = (pct * 100).toFixed(2) + '%';
      el.style.setProperty('--cut', pctStr);
      if (divider) divider.style.left = pctStr;
      if (handle)  handle.style.left  = pctStr;
    }

    function moveFromX(x) {
      if (!rect) measure();
      const local = (x - rect.left) / rect.width;
      setCut(local);
    }

    // 초기 상태
    measure();
    setCut(0.5);

    // 이벤트
    el.addEventListener('pointermove', (e) => moveFromX(e.clientX));
    el.addEventListener('pointerdown', (e) => moveFromX(e.clientX));
    el.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) moveFromX(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('resize', measure);
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ba').forEach(mountBA);
  });
})();