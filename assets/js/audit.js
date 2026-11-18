/* =========================================================
   DOPEST AUDIT — core behaviour (nav, reveal, counters, links)
   ========================================================= */
(function () {
  'use strict';
  var D = window.AUDIT_DATA || {};
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Wire booking / pitch / pricing links from data.js */
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = D.links && D.links[a.getAttribute('data-link')];
    if (url && url !== '#') {
      a.setAttribute('href', url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  });

  /* Nav state + reading progress */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll (Disabled - text is immediately visible) */
  var reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach(function (el) { el.classList.add('in'); });

  /* Count-up numbers */
  function fmt(n, dec) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function count(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (REDUCED || target === 0) { el.textContent = fmt(target, dec); return; }
    var start = performance.now(), dur = 1700;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(count);
  }

  /* Preview Modal Logic */
  var modal = document.getElementById('auditModal');
  var backdrop = document.getElementById('modalBackdrop');
  var closeBtn = document.getElementById('modalClose');
  var tabs = document.querySelectorAll('.modal-tab');
  var panels = document.querySelectorAll('.modal-body');

  function openModal(tabName) {
    if (!modal) return;
    switchTab(tabName || 'technical');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function switchTab(tabName) {
    tabs.forEach(function (t) {
      var isActive = t.getAttribute('data-tab') === tabName;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-panel') === tabName);
    });
  }

  document.querySelectorAll('[data-preview]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var target = btn.getAttribute('data-preview');
      openModal(target);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      switchTab(t.getAttribute('data-tab'));
    });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // ==========================================
  // 10. INDUSTRY ACCORDION (USER'S ORIGINAL CODE)
  // ==========================================
  const industryItems = document.querySelectorAll(".industry-item");

  industryItems.forEach(item => {
    const content = item.querySelector(".industry-content");

    if (item.classList.contains("is-open") && content) {
      content.style.display = "block";
      content.style.height = content.scrollHeight + "px";
    }

    item.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // CLOSE ALL
      industryItems.forEach(i => {
        i.classList.remove("is-open");
        const c = i.querySelector(".industry-content");
        c.style.height = "0px";
      });

      // OPEN CLICKED
      if (!isOpen) {
        item.classList.add("is-open");

        // 🔥 FORCE REPAINT FIX
        content.style.display = "block";
        content.style.height = "auto";

        let height = content.scrollHeight;

        content.style.height = "0px";

        requestAnimationFrame(() => {
          content.style.height = height + "px";
        });
      }
    });
  });

  // ==========================================
  // 6. CAROUSEL
  // ==========================================
  const btn = document.querySelector('.slider_arrow');
  const wrapper = document.querySelector('[s-carousel="wrapper"]');
  const track = wrapper ? wrapper.querySelector('.slider-4') : null;
  const slides = wrapper ? Array.from(wrapper.querySelectorAll('.slide-7')) : [];
  const dots = wrapper ? Array.from(wrapper.querySelectorAll('.slider_dot')) : [];
  const autoplayTime = 4000;
  let isSliderInView = false;
  let currentIndex = 0;
  let rafId = null;
  let elapsedBeforePause = 0;
  let lastTick = 0;

  function goToSlide(index) {
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('cc-active', i === currentIndex));
    dots.forEach((d, i) => {
      d.classList.toggle('cc-active', i === currentIndex);
      d.style.setProperty('--progress', '0');
    });
    if (track && slides[currentIndex]) {
      track.style.transform = 'translate3d(' + (-slides[currentIndex].offsetLeft) + 'px, 0, 0)';
    }
    startBarAnimation(dots[currentIndex]);
  }

  function isPlayingAllowed() {
    return isSliderInView && (!btn || !btn.classList.contains('is-paused'));
  }

  function tickBar(now) {
    const activeDot = dots[currentIndex];
    if (!activeDot) return;
    if (isPlayingAllowed()) {
      if (!lastTick) lastTick = now;
      elapsedBeforePause += (now - lastTick);
      lastTick = now;
      const progress = Math.min(1, elapsedBeforePause / autoplayTime);
      activeDot.style.setProperty('--progress', String(progress));
      if (progress >= 1) {
        goToSlide(currentIndex + 1);
        return;
      }
    } else {
      lastTick = 0;
    }
    rafId = requestAnimationFrame(tickBar);
  }

  function startBarAnimation(activeDot) {
    if (rafId) cancelAnimationFrame(rafId);
    dots.forEach(d => d.style.setProperty('--progress', '0'));
    elapsedBeforePause = 0;
    lastTick = 0;
    if (activeDot) {
      rafId = requestAnimationFrame(tickBar);
    }
  }

  if (wrapper && slides.length) {
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToSlide(idx));
    });

    slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => {
        if (!didDrag && idx !== currentIndex) goToSlide(idx);
      });
    });

    // Mouse drag & touch swipe support
    let isDragging = false;
    let didDrag = false;
    let startX = 0;
    let deltaX = 0;
    let baseTranslate = 0;

    function onDragStart(clientX) {
      isDragging = true;
      didDrag = false;
      startX = clientX;
      deltaX = 0;
      baseTranslate = slides[currentIndex] ? -slides[currentIndex].offsetLeft : 0;
      if (track) track.classList.add('is-dragging');
      lastTick = 0;
    }

    function onDragMove(clientX) {
      if (!isDragging || !track) return;
      deltaX = clientX - startX;
      if (Math.abs(deltaX) > 6) didDrag = true;
      track.style.transform = 'translate3d(' + (baseTranslate + deltaX * 0.85) + 'px, 0, 0)';
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      if (track) track.classList.remove('is-dragging');
      if (deltaX < -50 && currentIndex < slides.length - 1) {
        goToSlide(currentIndex + 1);
      } else if (deltaX > 50 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      } else if (deltaX < -80 && currentIndex === slides.length - 1) {
        goToSlide(0);
      } else if (deltaX > 80 && currentIndex === 0) {
        goToSlide(slides.length - 1);
      } else {
        goToSlide(currentIndex);
      }
      setTimeout(() => { didDrag = false; }, 50);
    }

    if (track) {
      track.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onDragStart(e.clientX);
      });
      window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
      window.addEventListener('mouseup', onDragEnd);

      track.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) onDragStart(e.touches[0].clientX);
      }, { passive: true });
      track.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) onDragMove(e.touches[0].clientX);
      }, { passive: true });
      track.addEventListener('touchend', onDragEnd);
    }

    if ('IntersectionObserver' in window) {
      const sliderIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isSliderInView = entry.isIntersecting;
          if (!isSliderInView) lastTick = 0;
        });
      }, { threshold: 0.2 });
      sliderIO.observe(wrapper);
    } else {
      isSliderInView = true;
    }

    window.addEventListener('resize', () => {
      if (track && slides[currentIndex]) {
        track.style.transform = 'translate3d(' + (-slides[currentIndex].offsetLeft) + 'px, 0, 0)';
      }
    });

    setTimeout(() => {
      const firstActive = wrapper.querySelector('.slider_dot.cc-active') || dots[0];
      if (firstActive) startBarAnimation(firstActive);
    }, 250);
  }

  if (btn) {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-paused');
      lastTick = 0;
    });
  }
})();
