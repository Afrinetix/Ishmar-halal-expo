/* ==========================================================================
   Ishmar Halal Traders Expo — public site dynamic content
   Runs on every public page. If assets/js/supabase-client.js is configured
   (window.ishmarSupabase set) and a page has one of the container ids below,
   this fetches from Supabase and replaces that container's innerHTML with
   markup using the exact same CSS classes as the static example content, so
   admin panel edits (new events, gallery photos, blog posts, sponsors,
   partners, press, videos) appear on the live site without a redeploy.

   If Supabase isn't configured, or a table has no matching rows, the
   original static example content already in the HTML is left untouched —
   nothing ever renders empty.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.ishmarSupabase) return;
  const sb = window.ishmarSupabase;

  hydrate('dyn-featured-events', () => loadFeaturedEvents(sb));
  hydrate('dyn-events-upcoming', () => loadEventsByStatus(sb, 'upcoming', 'dyn-events-upcoming'));
  hydrate('dyn-events-past', () => loadEventsByStatus(sb, 'past', 'dyn-events-past'));
  hydrate('dyn-gallery-grid', () => loadGallery(sb));
  hydrate('dyn-blog-grid', () => loadBlogPosts(sb));
  hydrate('dyn-testimonials', () => loadTestimonials(sb));
  hydrate('dyn-partners-logos', () => loadHomeLogoStrip(sb));
  hydrate('dyn-partners-institutional', () => loadPartnersByGroup(sb, 'institutional'));
  hydrate('dyn-partners-finance', () => loadPartnersByGroup(sb, 'finance'));
  hydrate('dyn-press-list', () => loadPress(sb));
  hydrate('dyn-video-grid', () => loadVideos(sb));
  hydrate('dyn-latest-news', () => loadLatestNews(sb));

  loadEventDetail(sb);
  applySiteSettings(sb);
});

/* -------------------------------------------------------------------- site-wide settings
   Binds Website Settings (admin/settings.html) into the header/footer/contact
   elements that exist identically on every page, so editing them in one
   place updates the WhatsApp button, footer contact details and social
   links everywhere without a redeploy. */
async function applySiteSettings(sb) {
  const [{ data: contact }, { data: social }] = await Promise.all([
    sb.from('settings').select('value').eq('key', 'contact_info').single(),
    sb.from('settings').select('value').eq('key', 'social_links').single(),
  ]);

  if (contact && contact.value) {
    const c = contact.value;
    if (c.whatsapp) {
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
        a.href = `https://wa.me/${c.whatsapp}`;
      });
    }
    document.querySelectorAll('a[href="mailto:info@ishmarexpo.com"]').forEach((a) => {
      if (c.email) a.href = `mailto:${c.email}`;
    });
    const phoneEl = document.getElementById('footer-phone');
    if (phoneEl && c.phone) { phoneEl.href = `tel:${c.phone}`; phoneEl.textContent = c.phone; }

    const nairobiEl = document.getElementById('footer-nairobi-address');
    if (nairobiEl && c.address) nairobiEl.innerHTML = esc(c.address).replace(/, /, ',<br>');
    const mombasaEl = document.getElementById('footer-mombasa-address');
    if (mombasaEl && c.mombasa_address) mombasaEl.innerHTML = esc(c.mombasa_address).replace(/, /, ',<br>');
  }

  if (social && social.value) {
    document.querySelectorAll('[data-social]').forEach((a) => {
      const url = social.value[a.dataset.social];
      if (url) a.href = url;
    });
  }
}

/* Only run a loader if its container actually exists on this page. -------------- */
function hydrate(containerId, loader) {
  if (document.getElementById(containerId)) loader();
}

async function swapContent(containerId, rows, renderFn) {
  if (!rows || !rows.length) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = rows.map(renderFn).join('');
}

/* -------------------------------------------------------------------- helpers */

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CATEGORY_LABELS = { trade_fair: 'Trade Fair', conference: 'Conference', networking: 'Networking', corporate: 'Corporate' };

function formatDateRange(start, end) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const s = new Date(start);
  if (!end || end === start) return s.toLocaleDateString('en-KE', opts);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const startLabel = sameMonth ? s.getDate() : s.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  return `${startLabel}–${e.toLocaleDateString('en-KE', opts)}`;
}

const STATIC_BLOG_SLUGS = ['why-halal-certification-drives-growth', 'five-export-mistakes'];

function blogUrl(slug, fromInsightsFolder) {
  const known = STATIC_BLOG_SLUGS.includes(slug);
  if (known) return fromInsightsFolder ? `${slug}.html` : `insights/${slug}.html`;
  return fromInsightsFolder ? `post.html?slug=${encodeURIComponent(slug)}` : `insights/post.html?slug=${encodeURIComponent(slug)}`;
}

function eventUrl(slug) {
  return `event-detail.html?slug=${encodeURIComponent(slug)}`;
}

/* -------------------------------------------------------------------- events */

function renderEventCard(ev) {
  const tag = CATEGORY_LABELS[ev.category] || 'Event';
  const img = ev.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop';
  const venue = [ev.venue_name, ev.city].filter(Boolean).join(', ');
  return `<article class="card" data-category="${esc(ev.category === 'trade_fair' ? 'trade-fair' : ev.category)}">
    <a href="${eventUrl(ev.slug)}"><div class="card__media"><span class="card__tag">${esc(tag)}</span><img src="${esc(img)}" alt="${esc(ev.title)}"></div></a>
    <div class="card__body">
      <div class="card__meta"><span>${formatDateRange(ev.start_date, ev.end_date)}</span><span>${esc(venue)}</span></div>
      <h3 class="card__title"><a href="${eventUrl(ev.slug)}">${esc(ev.title)}</a></h3>
      <p>${esc(ev.summary || '')}</p>
    </div>
  </article>`;
}

async function loadFeaturedEvents(sb) {
  const { data } = await sb.from('events').select('*').eq('is_featured', true).order('start_date', { ascending: true }).limit(3);
  let rows = data;
  if (!rows || !rows.length) {
    const fallback = await sb.from('events').select('*').eq('status', 'upcoming').order('start_date', { ascending: true }).limit(3);
    rows = fallback.data;
  }
  swapContent('dyn-featured-events', rows, renderEventCard);
}

async function loadEventsByStatus(sb, status, containerId) {
  const { data } = await sb.from('events').select('*').eq('status', status)
    .order('start_date', { ascending: status === 'upcoming' });
  swapContent(containerId, data, renderEventCard);
}

async function loadEventDetail(sb) {
  if (!document.getElementById('event-title')) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const { data: ev } = await sb.from('events').select('*').eq('slug', slug).single();
  if (!ev) return;

  const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  const venue = [ev.venue_name, ev.city].filter(Boolean).join(', ');

  document.title = `${ev.title} | Ishmar Halal Traders Expo`;
  setText('event-breadcrumb', ev.title);
  setText('event-eyebrow', `${CATEGORY_LABELS[ev.category] || 'Event'} · ${formatDateRange(ev.start_date, ev.end_date)}`);
  setText('event-title', ev.title);
  setText('event-summary', ev.summary || '');
  setText('event-description', ev.description || ev.summary || '');
  setText('event-dates', formatDateRange(ev.start_date, ev.end_date));
  setText('event-venue', venue);
  setText('event-category', CATEGORY_LABELS[ev.category] || 'Event');
  if (ev.expected_visitors) setText('event-visitors', `${ev.expected_visitors.toLocaleString()}+`);
  if (ev.exhibitor_count) setText('event-exhibitors', `${ev.exhibitor_count}+`);
  if (ev.cover_image_url) {
    const img = document.getElementById('event-cover-image');
    if (img) { img.src = ev.cover_image_url; img.alt = ev.title; }
  }

  const venueLine = [ev.venue_name, ev.venue_address, venue].filter(Boolean).join(', ');
  setText('event-venue-description', venueLine);
  const mapFrame = document.getElementById('event-map-iframe');
  if (mapFrame && venueLine) {
    mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(venueLine)}&output=embed`;
    mapFrame.title = `Map to ${ev.venue_name || ev.title}`;
  }

  toggleRepeaterSection('event-agenda-section', 'event-agenda-list', ev.agenda, renderAgendaItem);
  toggleRepeaterSection('event-speakers-section', 'event-speakers-list', ev.speakers, renderSpeakerCard);
}

// Agenda/Speakers are optional per event. If the admin left them empty,
// the whole section (heading included) is hidden rather than showing
// stale example content that has nothing to do with this event.
function toggleRepeaterSection(sectionId, listId, items, renderFn) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  if (!Array.isArray(items) || !items.length) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const list = document.getElementById(listId);
  if (list) list.innerHTML = items.map(renderFn).join('');
}

function renderAgendaItem(item) {
  return `<div class="agenda-item"><time>${esc(item.time || '')}</time><div><strong>${esc(item.title || '')}</strong>${item.note ? `<p class="mt-1">${esc(item.note)}</p>` : ''}</div></div>`;
}

function renderSpeakerCard(speaker) {
  const photo = speaker.photo || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300&auto=format&fit=crop';
  return `<div class="speaker-card"><div class="speaker-card__media"><img src="${esc(photo)}" alt="${esc(speaker.name || '')}"></div><strong>${esc(speaker.name || '')}</strong><span style="font-size:.8rem;color:var(--gray-600);">${esc(speaker.title || '')}</span></div>`;
}

/* -------------------------------------------------------------------- gallery */

function renderGalleryItem(item) {
  const full = item.image_url;
  const thumb = item.thumbnail_url || item.image_url;
  const cats = [item.category, item.year].filter(Boolean).join(' ');
  return `<a href="${esc(full)}" class="masonry__item" data-category="${esc(cats)}" data-lightbox="${esc(full)}">
    <img src="${esc(thumb)}" alt="${esc(item.title)}" loading="lazy">
    <div class="masonry__overlay"><span>${esc(item.title)}</span></div>
  </a>`;
}

async function loadGallery(sb) {
  const { data } = await sb.from('gallery').select('*').order('sort_order', { ascending: true }).limit(24);
  swapContent('dyn-gallery-grid', data, renderGalleryItem);
}

/* -------------------------------------------------------------------- blog */

function renderBlogCard(post) {
  const img = post.cover_image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop';
  const url = blogUrl(post.slug, false);
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return `<article class="card" data-category="${esc((post.category || '').toLowerCase().replace(/\s+/g, '-'))}">
    <a href="${url}"><div class="card__media"><img src="${esc(img)}" alt="${esc(post.title)}"></div></a>
    <div class="card__body">
      <div class="card__meta"><span class="tag-pill">${esc(post.category || 'Insights')}</span><span>${date}</span></div>
      <h3 class="card__title"><a href="${url}">${esc(post.title)}</a></h3>
      <p>${esc(post.excerpt || '')}</p>
    </div>
  </article>`;
}

async function loadBlogPosts(sb) {
  const { data } = await sb.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(12);
  swapContent('dyn-blog-grid', data, renderBlogCard);
}

async function loadLatestNews(sb) {
  const { data } = await sb.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(3);
  swapContent('dyn-latest-news', data, renderBlogCard);
}

/* -------------------------------------------------------------------- testimonials */

function renderTestimonial(t) {
  const avatar = t.author_avatar_url || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop';
  const stars = '★'.repeat(t.rating || 5);
  const roleLine = [t.author_title, t.author_company].filter(Boolean).join(', ');
  return `<div class="testimonial-card">
    <div class="stars">${stars}</div>
    <blockquote>"${esc(t.quote)}"</blockquote>
    <div class="testimonial-card__person">
      <img src="${esc(avatar)}" alt="Portrait of ${esc(t.author_name)}">
      <div><strong>${esc(t.author_name)}</strong><span>${esc(roleLine)}</span></div>
    </div>
  </div>`;
}

async function loadTestimonials(sb) {
  const { data } = await sb.from('testimonials').select('*').eq('is_featured', true).order('sort_order', { ascending: true }).limit(3);
  swapContent('dyn-testimonials', data, renderTestimonial);
}

/* -------------------------------------------------------------------- partners & sponsors */

function renderLogo(entity) {
  if (!entity.logo_url) return '';
  return `<img src="${esc(entity.logo_url)}" alt="${esc(entity.name)}">`;
}

async function loadHomeLogoStrip(sb) {
  const [{ data: partners }, { data: sponsors }] = await Promise.all([
    sb.from('partners').select('name, logo_url').eq('is_active', true).order('sort_order', { ascending: true }).limit(6),
    sb.from('sponsors').select('name, logo_url').eq('is_active', true).order('sort_order', { ascending: true }).limit(6),
  ]);
  const combined = [...(partners || []), ...(sponsors || [])].filter((e) => e.logo_url);
  swapContent('dyn-partners-logos', combined, renderLogo);
}

function renderPartnerFeatureCard(p) {
  if (!p.logo_url) return '';
  return `<div class="feature-card center">
    <img src="${esc(p.logo_url)}" alt="${esc(p.name)}" style="margin-inline:auto;margin-bottom:var(--space-2);">
    <p class="mt-1" style="font-size:.85rem;">${esc(p.description || '')}</p>
  </div>`;
}

async function loadPartnersByGroup(sb, group) {
  const types = group === 'finance' ? ['finance'] : ['government', 'trade', 'venue', 'other'];
  const { data } = await sb.from('partners').select('*').eq('is_active', true).in('partner_type', types).order('sort_order', { ascending: true });
  const rows = (data || []).filter((p) => p.logo_url);
  swapContent(group === 'finance' ? 'dyn-partners-finance' : 'dyn-partners-institutional', rows, renderPartnerFeatureCard);
}

/* -------------------------------------------------------------------- media: press & videos */

function renderPressItem(item) {
  const link = item.external_url || item.file_url || '#';
  const date = item.published_date ? new Date(item.published_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return `<div class="press-item">
    <div><div class="press-item__meta">${esc(item.source_name || '')}${item.source_name && date ? ' · ' : ''}${date}</div><strong>${esc(item.title)}</strong></div>
    <a href="${esc(link)}" class="btn btn-sm btn-outline" target="_blank" rel="noopener">Read</a>
  </div>`;
}

async function loadPress(sb) {
  const { data } = await sb.from('media').select('*').eq('type', 'press').order('published_date', { ascending: false }).limit(10);
  swapContent('dyn-press-list', data, renderPressItem);
}

function renderVideoCard(v) {
  const thumb = v.thumbnail_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop';
  return `<a href="${esc(v.video_url)}" class="video-card" target="_blank" rel="noopener">
    <img src="${esc(thumb)}" alt="${esc(v.title)}">
    <span class="video-card__play"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
    <div class="video-card__caption"><strong>${esc(v.title)}</strong></div>
  </a>`;
}

async function loadVideos(sb) {
  const { data } = await sb.from('videos').select('*').order('sort_order', { ascending: true }).limit(6);
  swapContent('dyn-video-grid', data, renderVideoCard);
}
