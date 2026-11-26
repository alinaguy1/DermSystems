
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const cfg = window.DERMSYSTEMS_SUPABASE || {};
let db = null;
let bookingNotificationEmail = '';

if (window.supabase && cfg.url && cfg.anonKey && !cfg.url.includes('YOUR_')) {
  db = window.supabase.createClient(cfg.url, cfg.anonKey);
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();

  const toggle = $('.menu-toggle');
  const nav = $('.nav-links');

  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  $$('.nav-links a').forEach(a =>
    a.addEventListener('click', () => nav.classList.remove('open'))
  );

  const items = $$('.question-container');
  const count = $('#counter-num');
  const message = $('#message-box');

  const update = () => {
    const n = items.filter(x => x.classList.contains('active')).length;

    count.textContent = `${n}/${items.length}`;

    message.textContent =
      n === 0
        ? 'Tap any that apply. If most of them do, DermSystems was built exactly for you.'
        : n <= 2
          ? 'A few of these sound familiar. Let’s bring some clarity to your routine.'
          : n <= 5
            ? 'That’s a lot to carry alongside everything else. This is exactly what the session is for.'
            : 'You’re exactly who DermSystems was created for. Let’s work towards more clarity together.';
  };

  items.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
      item.setAttribute(
        'aria-pressed',
        String(item.classList.contains('active'))
      );
      update();
    });
  });

  const concern = $('#concernSelect');
  const other = $('#otherField');

  concern?.addEventListener('change', () => {
    other.classList.toggle('hidden', concern.value !== 'Other');
  });

  const date = $('#prefDate');

  if (date) {
    date.min = new Date().toISOString().slice(0, 10);
  }

  loadManagedContent();
  loadSiteSettings();

  $('#consultationForm')?.addEventListener('submit', submitConsultation);
});

async function loadSiteSettings() {
  if (!db) return;

  try {
    const { data, error } = await db
      .from('site_settings')
      .select('key,value')
      .in('key', ['booking_notification_email', 'social_links']);

    if (error) throw error;

    const settings = Object.fromEntries(
      (data || []).map(x => [x.key, x.value])
    );

    bookingNotificationEmail =
      settings.booking_notification_email ||
      window.DERMSYSTEMS_EMAIL?.toEmail ||
      '';

    let links = [];

    try {
      links = JSON.parse(settings.social_links || '[]');
    } catch {}

    if (!links.length) {
      links = [{
        platform: 'Instagram',
        url: 'https://www.instagram.com/dermsystems/'
      }];
    }

    renderSocialLinks(links);

  } catch (e) {
    console.warn('Website settings could not be loaded.', e.message);
  }
}

function socialSvg(platform) {
  const p = String(platform || 'website').toLowerCase();

  const paths = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h1.7V1.4C17 1.2 15.8 1 14.3 1 11 1 9 3 9 6.6V9H6v4h3v8z" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14 3v11.2a3.2 3.2 0 1 1-2.8-3.2V8a6.5 6.5 0 1 0 6 6.4V8.8a9 9 0 0 0 4 1V6.7c-3.1-.2-5.4-1.6-7.2-3.7z" fill="currentColor" stroke="none"/>',
    linkedin: '<path d="M5 8.5H2V22h3zM3.5 2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM22 14.2c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-3.9 2.1V8.5h-3V22h3v-7.2c0-1.9.4-3.8 2.8-3.8s2.4 2.2 2.4 3.9V22h3.1z" fill="currentColor" stroke="none"/>',
    youtube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.8V8.2l6.5 3.8z" fill="currentColor" stroke="none"/>',
    x: '<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.9 5.8 22H2.7l7.3-8.4L2.3 2h6.5l4.5 6.6zM17.8 20h1.7L7.8 3.9H6z" fill="currentColor" stroke="none"/>',
    pinterest: '<path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.7l1.3-5.4s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.3 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.7 0-2.5-1.8-4.2-4.3-4.2-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.9.8 2.4.1.2.2.3.1.6l-.3 1c-.1.3-.3.4-.6.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.4 7-6.4 3.7 0 6.6 2.6 6.6 6.1 0 3.6-2.3 6.6-5.5 6.6-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.2 1-.9 2-1.3 2.7A10 10 0 1 0 12 2z" fill="currentColor" stroke="none"/>',
    whatsapp: '<path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.4A9 9 0 1 1 12 21z" fill="currentColor" stroke="none"/>',
    threads: '<path d="M12 2C6 2 3 6 3 12s3 10 9 10 9-4 9-9c0-5-3-8-8-8-3 0-5 1-6 3l2 1c1-1 2-2 4-2 3 0 5 2 5 5v.5c-1-1-3-2-5-2-3 0-5 2-5 5 0 2 2 4 5 4 3 0 5-2 5-5v-.3c0-5-3-9-8-9z" fill="currentColor" stroke="none"/>',
    snapchat: '<path d="M12 2c-2.5 0-4 1.8-4 4.6 0 .8.1 1.6.2 2.3-.7.4-1.5.2-2.1-.2-.4-.2-.8-.1-1 .3-.2.4 0 .8.4 1 1 .6 2.1.8 3.1.4-.2 1.2-.8 2.4-1.7 3.4-.8.9-1.8 1.4-2.8 1.7-.4.1-.6.5-.5.9.1.3.4.5.8.5 1.3 0 2.1.4 2.8 1 .8.7 1.8 1.1 3.8 1.1s3-.4 3.8-1.1c.7-.6 1.5-1 2.8-1 .4 0 .7-.2.8-.5.1-.4-.1-.8-.5-.9-1-.3-2-.8-2.8-1.7-.9-1-1.5-2.2-1.7-3.4 1 .4 2.1.2 3.1-.4.4-.2.6-.6.4-1-.2-.4-.6-.5-1-.3-.6.4-1.4.6-2.1.2.1-.7.2-1.5.2-2.3C16 3.8 14.5 2 12 2z" fill="currentColor" stroke="none"/>',
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[p] || paths.website}</svg>`;
}

function renderSocialLinks(links) {
  const footer = $('.footer');
  if (!footer) return;

  let box = $('#footer-socials');

  if (!box) {
    box = document.createElement('div');
    box.id = 'footer-socials';
    box.className = 'footer-socials';
    footer.insertBefore(box, footer.querySelector('small'));
  }

  box.innerHTML = (links || [])
    .filter(x => x.url)
    .map(x => `
      <a href="${attr(x.url)}"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="DermSystems on ${esc(x.platform)}"
         title="${esc(x.platform)}">
        ${socialSvg(x.platform)}
      </a>
    `)
    .join('');
}

async function loadManagedContent() {
  if (!db) return;

  try {
    const { data, error } = await db
      .from('site_content')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const rows = data || [];

    renderRows('testimonial', $('#testimonials-grid'), rows);
    renderRows('service', $('#services-grid'), rows);
    renderRows('resource', $('#resources-grid'), rows);
    renderExtras(rows);

  } catch (e) {
    console.warn(
      'Managed content could not be loaded; showing built-in content.',
      e.message
    );
  }
}

function renderRows(type, container, rows) {
  const selected = rows.filter(r => r.content_type === type);

  if (!container || !selected.length) return;

  container.innerHTML = selected.map((r, i) => {
    if (type === 'testimonial') {
      return `
        <blockquote>
          <span>“</span>
          <p>${esc(r.body || r.title || '')}</p>
          ${r.metadata?.author ? `<cite>${esc(r.metadata.author)}</cite>` : ''}
        </blockquote>
      `;
    }

    if (type === 'service') {
      return `
        <article class="service-card">
          <span>${String(i + 1).padStart(2, '0')} / DERM SYSTEMS</span>
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.body || '')}</p>
        </article>
      `;
    }

    return `
      <article class="resource-card">
        ${r.image_url
          ? `<img class="resource-image" src="${attr(r.image_url)}" alt="">`
          : '<div class="resource-icon">✳</div>'}
        <p class="eyebrow">${esc(r.metadata?.label || 'RESOURCE')}</p>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.body || '')}</p>
        <a class="text-link"
           href="${attr(r.link_url || '#')}"
           target="_blank"
           rel="noopener">
          Open resource <span>↗</span>
        </a>
      </article>
    `;
  }).join('');
}

function renderExtras(rows) {
  const items = rows.filter(r =>
    ['faq', 'article', 'video', 'link', 'announcement'].includes(r.content_type)
  );

  const section = $('#more-content');
  const grid = $('#extras-grid');

  if (!items.length || !section || !grid) return;

  section.hidden = false;

  grid.innerHTML = items.map(r => {
    if (r.content_type === 'faq') {
      return `
        <details class="extra-card">
          <summary>${esc(r.title)}</summary>
          <p>${esc(r.body || '')}</p>
        </details>
      `;
    }

    const url = r.link_url || '#';

    return `
      <article class="extra-card">
        <p class="eyebrow">${esc(r.content_type.toUpperCase())}</p>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.body || '')}</p>
        ${r.link_url
          ? `<a class="text-link" href="${attr(url)}" target="_blank" rel="noopener">Explore <span>↗</span></a>`
          : ''}
      </article>
    `;
  }).join('');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function attr(s) {
  return esc(s);
}

async function submitConsultation(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const button = form.querySelector('button[type=submit]');
  const status = $('#formStatus');

  if (!form.reportValidity()) return;

  button.disabled = true;
  button.innerHTML = 'Sending request…';
  status.className = 'form-status';
  status.textContent = '';

  const values = Object.fromEntries(new FormData(form).entries());
  values.submittedAt = new Date().toISOString();

  try {
    if (!db) {
      throw new Error('The booking form is not connected to Supabase.');
    }

    // Save the consultation request in Supabase.
    const { error: saveError } = await db
      .from('consultation_requests')
      .insert([{
        full_name: values.fullName,
        contact_info: values.contactInfo,
        concern: values.concern,
        other_details: values.otherDetails || '',
        preferred_date: values.prefDate,
        preferred_time: values.prefTime,
        contact_method: values.contactMethod || 'Video Call'
      }]);

    if (saveError) throw saveError;

    // Send the email notification through the Supabase Edge Function.
    const { data, error: emailError } = await db.functions.invoke(
      'send-booking-email',
      {
        body: values
      }
    );

    if (emailError) throw emailError;
    if (data?.error) throw new Error(data.error);

    status.textContent =
      'Thank you. Your request has been received. We’ll contact you to confirm your preferred slot.';

    form.reset();
    $('#otherField').classList.add('hidden');

  } catch (err) {
    console.error('Consultation submission error:', err);

    status.classList.add('error');
    status.textContent =
      'We could not send your request just now. Please try again or contact us directly.';

  } finally {
    button.disabled = false;
    button.innerHTML = 'Send consultation request <span>↗</span>';
  }
}

document.querySelectorAll(
  'input[type="date"], input[type="time"]'
).forEach(input => {
  input.addEventListener('click', () => {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  });
});
