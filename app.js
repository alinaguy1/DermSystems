
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const cfg = window.DERMSYSTEMS_SUPABASE || {};
let db = null;

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
  loadHomepageContent();
  loadAdvertisements();
  $('#successClose')?.addEventListener('click', closeSuccessPopup);
  $('#successContinue')?.addEventListener('click', closeSuccessPopup);
  $('#submissionSuccess')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSuccessPopup();
  });

  $('#consultationForm')?.addEventListener('submit', submitConsultation);
});


async function loadHomepageContent(){
 if(!db)return;
 try{
  const {data,error}=await db.from('site_settings').select('value').eq('key','homepage_content').maybeSingle();
  if(error)throw error;
  const c=JSON.parse(data?.value||'{}');
  const bindings={
   hero_eyebrow:'.hero .eyebrow',hero_heading:'.hero h1',hero_description:'.hero-lead',hero_support:'.hero-support',
   hero_button:'.hero .button',about_heading:'.intro h2',about_intro:'.intro-text',
   about_paragraph_1:'.intro-grid>div p:nth-of-type(2)',about_paragraph_2:'.intro-grid>div p:nth-of-type(3)',
   founder_heading:'.founder-copy h2',founder_bio_1:'.founder-copy>p:nth-of-type(2)',founder_bio_2:'.founder-copy>p:nth-of-type(3)',
   session_heading:'.session-band h2',session_description:'.session-band>div>p:not(.eyebrow)',
   booking_heading:'.booking-copy h2',booking_description:'.booking-copy>p:not(.eyebrow)',footer_tagline:'.footer>p',
   intro_kicker:'.section-kicker',check_heading:'.check-heading h2',check_description:'.check-heading>p:last-child',
   audience_heading:'.audience .section-heading h2',audience_description:'.audience .section-heading>p:last-child',
   services_heading:'.services .section-heading h2',services_description:'.services .section-heading>p:last-child',
   investment_heading:'.investment-copy h2',investment_description:'.investment-copy>p:not(.eyebrow)',
   price_title:'.price-card h3',price_amount:'.price',price_note:'.price-note',
   resources_heading:'.resources .section-heading h2',resources_description:'.resources .section-heading>p:last-child',
   testimonials_heading:'.stories .section-heading h2',booking_eyebrow:'.booking-copy .eyebrow',
   booking_privacy_note:'.booking-aside p',closing_heading:'.closing h2',closing_button:'.closing .button',
   nav_approach:'.nav-links a[href="#approach"]',nav_services:'.nav-links a[href="#services"]',
   nav_resources:'.nav-links a[href="#resources"]',nav_testimonials:'.nav-links a[href="#stories"]',
   nav_booking:'.nav-links .nav-cta'
  };
  Object.entries(bindings).forEach(([key,selector])=>{const el=$(selector);if(el&&c[key])el.textContent=c[key];});
  if(c.hero_button){const el=$('.hero .button');if(el)el.firstChild.textContent=c.hero_button+' ';}
  if(c.hero_button_url){const el=$('.hero .button');if(el)el.href=c.hero_button_url;}
  if(c.hero_image_url){const el=$('.hero-visual>img');if(el)el.src=c.hero_image_url;}
  if(c.founder_image_url){const el=$('.founder-image img');if(el)el.src=c.founder_image_url;}
  if(c.session_button){const el=$('.session-band .button');if(el)el.firstChild.textContent=c.session_button+' ';}
  if(c.price_amount){const el=$('.price');if(el)el.textContent='$'+c.price_amount;}
  if(c.closing_button){const el=$('.closing .button');if(el)el.firstChild.textContent=c.closing_button+' ';}
 }catch(e){console.warn('Homepage content could not be loaded.',e.message);}
}
async function loadAdvertisements(){
 if(!db)return;
 try{
  const {data,error}=await db.from('site_ads').select('*').eq('active',true);
  if(error)throw error;
  const now=Date.now();
  const ad=(data||[]).find(a=>(!a.starts_at||new Date(a.starts_at).getTime()<=now)&&(!a.ends_at||new Date(a.ends_at).getTime()>=now)&&!adDismissed(a.id));
  if(ad)renderAdvertisement(ad);
 }catch(e){console.warn('Advertisements are unavailable until the enhancement migration is applied.',e.message);}
}
function adDismissed(id){try{return Number(localStorage.getItem(`dermsystems-ad-dismiss-${id}`)||0)>Date.now();}catch{return false;}}
function renderAdvertisement(ad){
 const root=document.createElement('aside');root.className=`ds-ad ds-ad-${ad.display_type}`;root.setAttribute('aria-label','Advertisement');
 const close=document.createElement('button');close.type='button';close.className='ds-ad-close';close.setAttribute('aria-label','Dismiss advertisement');close.textContent='×';
 close.addEventListener('click',()=>{try{localStorage.setItem(`dermsystems-ad-dismiss-${ad.id}`,String(Date.now()+7*24*60*60*1000));}catch{}root.remove();});
 const content=document.createElement('div');content.className='ds-ad-content';
 if(ad.image_url){const img=document.createElement('img');img.src=ad.image_url;img.alt='';content.appendChild(img);}
 const copy=document.createElement('div');const heading=document.createElement('strong');heading.textContent=ad.title||'A note from DermSystems';copy.appendChild(heading);
 if(ad.description){const p=document.createElement('p');p.textContent=ad.description;copy.appendChild(p);}
 content.appendChild(copy);
 if(ad.destination_url){const link=document.createElement('a');link.href=ad.destination_url;link.textContent='Learn more ↗';link.target='_blank';link.rel='noopener noreferrer';content.appendChild(link);}
 root.append(close,content);document.body.appendChild(root);
}
function showSuccessPopup(){
 const dialog=$('#submissionSuccess');if(!dialog)return;
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}
function closeSuccessPopup(){const dialog=$('#submissionSuccess');if(dialog?.open)dialog.close();else dialog?.removeAttribute('open');}

async function loadSiteSettings() {
  if (!db) return;

  try {
    const { data, error } = await db
      .from('site_settings')
      .select('key,value')
      .eq('key', 'social_links');

    if (error) throw error;

    const settings = Object.fromEntries(
      (data || []).map(x => [x.key, x.value])
    );

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
    .filter(x => x.url && x.visible !== false)
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
    showSuccessPopup();

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
