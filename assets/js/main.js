/* ==========================================================================
   Ishmar Halal Expo — Core interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initHeader();
  initMegaMenus();
  initMobileNav();
  initRevealAnimations();
  initCounters();
  initBackToTop();
  initSmoothAnchors();
  initFilterBars();
  initLightbox();
  initFormHandlers();
  initFaqAccordion();
  initLoadMore();
});

/* Page loader ------------------------------------------------------------ */
function initLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('is-hidden'), 250);
  });
}

/* Sticky header ------------------------------------------------------------
   The header's actual height changes when .is-scrolled shrinks it (88px/72px
   -> 76px/64px), but the mobile nav panel positions itself below the header
   using the static --header-h token. Without syncing that token to the
   header's real, current height, opening the mobile menu after scrolling
   leaves it offset from where the header actually ends. --header-h is
   re-measured on scroll and resize (and once on load) to keep them in sync. */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-h-live', `${header.offsetHeight}px`);
  };

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    syncHeaderHeight();
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncHeaderHeight);
  // The header's height animates (var(--transition), 0.35s) when .is-scrolled
  // toggles, so a read taken the instant the class changes can catch it
  // mid-transition. Re-sync once the animation actually settles.
  header.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'height') syncHeaderHeight();
  });
}

/* Mega menus (click-to-open, keyboard + touch friendly) ------------------- */
function initMegaMenus() {
  const items = document.querySelectorAll('.nav-item.has-mega');

  items.forEach((item) => {
    const trigger = item.querySelector('.nav-link');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 1080) {
        e.preventDefault();
        const willOpen = !item.classList.contains('is-open');
        items.forEach((i) => i.classList.remove('is-open'));
        if (willOpen) item.classList.add('is-open');
      }
    });

    item.addEventListener('mouseenter', () => {
      if (window.innerWidth > 1080) {
        items.forEach((i) => i.classList.remove('is-open'));
        item.classList.add('is-open');
      }
    });
    item.addEventListener('mouseleave', () => {
      if (window.innerWidth > 1080) item.classList.remove('is-open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.has-mega') && window.innerWidth > 1080) {
      items.forEach((i) => i.classList.remove('is-open'));
    }
  });
}

/* Mobile nav toggle --------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-main');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1080 && !link.closest('.has-mega')) {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });
  });
}

/* Scroll reveal -------------------------------------------------------------- */
function initRevealAnimations() {
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach((t) => observer.observe(t));
}

/* Animated counters ---------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.count.includes('.') ? el.dataset.count.split('.')[1].length : 0;
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => observer.observe(c));
}

/* Back to top ------------------------------------------------------------------ */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener(
    'scroll',
    () => btn.classList.toggle('is-visible', window.scrollY > 700),
    { passive: true }
  );
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* Smooth-scroll for in-page anchors, offset for fixed header ------------------- */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const headerH = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* Generic filter bars (events, gallery, blog, media) ----------------------------
   Items are re-queried on every click (not cached at init) so filtering still
   works correctly after assets/js/public-data.js swaps in Supabase-driven
   cards/gallery items that didn't exist in the DOM yet at page load. */
function initFilterBars() {
  document.querySelectorAll('[data-filter-bar]').forEach((bar) => {
    const targetSelector = bar.dataset.filterBar;
    const chips = bar.querySelectorAll('.filter-chip');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.dataset.filter;

        document.querySelectorAll(targetSelector).forEach((item) => {
          const cats = (item.dataset.category || '').split(' ');
          const show = filter === 'all' || cats.includes(filter);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  });
}

/* Lightweight lightbox for gallery -----------------------------------------------
   Uses event delegation on document (not per-element listeners) so gallery
   items injected later by assets/js/public-data.js work without re-init. */
function initLightbox() {
  if (!document.querySelector('[data-lightbox]')) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-prev" aria-label="Previous">&#8249;</button>
    <img class="lightbox-img" src="" alt="">
    <button class="lightbox-next" aria-label="Next">&#8250;</button>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox-img');
  let current = 0;

  const open = (index) => {
    const items = document.querySelectorAll('[data-lightbox]');
    current = (index + items.length) % items.length;
    const el = items[current];
    img.src = el.dataset.lightbox;
    img.alt = el.querySelector('img')?.alt || '';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };
  const nav = (dir) => open(current + dir);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    e.preventDefault();
    const items = Array.from(document.querySelectorAll('[data-lightbox]'));
    open(items.indexOf(trigger));
  });
  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.querySelector('.lightbox-prev').addEventListener('click', () => nav(-1));
  overlay.querySelector('.lightbox-next').addEventListener('click', () => nav(1));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
}

/* Form handlers ------------------------------------------------------------------
   Posts to Supabase when assets/js/supabase-client.js is configured
   (window.ishmarSupabase set); otherwise falls back to a client-only
   confirmation so the UI still feels complete before the database is linked. */
function initFormHandlers() {
  document.querySelectorAll('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-form-status]');
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : '';
      const setStatus = (msg) => { if (status) { status.textContent = msg; status.classList.add('is-visible'); } };

      if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

      try {
        if (form.dataset.form === 'newsletter') {
          await submitNewsletter(form);
          setStatus("You're subscribed. Watch your inbox for Ishmar updates.");
        } else if (form.dataset.form === 'contact') {
          await submitContact(form);
          setStatus('Thank you. Our team will get back to you within one business day.');
        }
        form.reset();
      } catch (err) {
        console.error('[Ishmar] Form submission failed:', err);
        setStatus(
          err && err.code === '23505'
            ? "That email is already subscribed. You're all set."
            : "Something went wrong. Please try again or email us directly."
        );
      } finally {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
      }
    });
  });
}

async function submitNewsletter(form) {
  const email = form.querySelector('input[type="email"]')?.value.trim();
  if (!window.ishmarSupabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  const { error } = await window.ishmarSupabase
    .from('subscribers')
    .insert({ email, source_page: window.location.pathname });
  if (error) throw error;
}

async function submitContact(form) {
  const data = {
    name: form.querySelector('#cf-name')?.value.trim(),
    email: form.querySelector('#cf-email')?.value.trim(),
    phone: form.querySelector('#cf-phone')?.value.trim() || null,
    topic: form.querySelector('#cf-topic')?.value || null,
    message: form.querySelector('#cf-message')?.value.trim(),
  };
  if (!window.ishmarSupabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  const { error } = await window.ishmarSupabase.from('contact_messages').insert(data);
  if (error) throw error;
}

/* Load-more placeholder (until content is paginated from Supabase) -------------- */
function initLoadMore() {
  const btn = document.getElementById('gallery-load-more');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.textContent = "You're viewing our latest gallery";
    btn.disabled = true;
  });
}

/* FAQ accordion ---------------------------------------------------------------- */
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-item__q');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.closest('.faq-list')?.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });
}
