const cfg=window.DERMSYSTEMS_SUPABASE||{};const sb=window.supabase&&cfg.url&&cfg.anonKey&&!cfg.url.includes('YOUR_')?window.supabase.createClient(cfg.url,cfg.anonKey):null;
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];let currentUser=null;
document.addEventListener('DOMContentLoaded',async()=>{
 if(!sb){$('#loginMessage').textContent='Connect Supabase first. Follow the setup guide in README.md.';$('#loginForm').addEventListener('submit',e=>e.preventDefault());return;}
 $('#loginForm').addEventListener('submit',login);$('#logoutBtn').addEventListener('click',logout);
 $$('.side-link').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
 $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.jump)));
 $('#newContent').addEventListener('click',()=>openEditor());$('#closeDialog').addEventListener('click',()=>$('#contentDialog').close());
 $('#contentForm').addEventListener('submit',saveContent);$('#typeFilter').addEventListener('change',loadContent);
 $('#refreshBookings').addEventListener('click',loadBookings);$('#uploadForm').addEventListener('submit',uploadAsset);$('#settingsForm').addEventListener('submit',saveBookingEmail);$('#addSocialLink').addEventListener('click',()=>addSocialRow());$('#saveSocialLinks').addEventListener('click',saveSocialLinks);
  $('#homepageForm').addEventListener('submit',saveHomepageContent);
  $('#adForm').addEventListener('submit',saveAd);
  $('#resetAdForm').addEventListener('click',resetAdForm);
  $('#galleryForm').addEventListener('submit',uploadGalleryImages);
  $('#gallerySearch').addEventListener('input',renderGallery);
  $('#galleryCategoryFilter').addEventListener('change',renderGallery);
 const {data}=await sb.auth.getSession();if(data.session){currentUser=data.session.user;showDashboard();}
 sb.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(currentUser)showDashboard();else showLogin();});
});
function showLogin(){$('#loginView').hidden=false;$('#dashboardView').hidden=true;}
function showDashboard(){$('#loginView').hidden=true;$('#dashboardView').hidden=false;loadOverview();}
async function login(e){e.preventDefault();$('#loginMessage').textContent='Signing in…';const {error}=await sb.auth.signInWithPassword({email:$('#loginEmail').value,password:$('#loginPassword').value});$('#loginMessage').textContent=error?error.message:'';}
async function logout(){await sb.auth.signOut();showLogin();}
function showTab(tab){$$('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.tab-panel').forEach(p=>p.hidden=true);$('#'+tab+'Tab').hidden=false;$('#pageTitle').textContent=({overview:'Overview',content:'Website content',homepage:'Homepage editor',ads:'Advertisement manager',gallery:'Gallery manager',bookings:'Consultation requests',uploads:'File library',settings:'Settings'})[tab];if(tab==='content')loadContent();if(tab==='bookings')loadBookings();if(tab==='uploads')loadAssets();if(tab==='settings')loadSettings();if(tab==='homepage')loadHomepageContent();if(tab==='ads')loadAds();if(tab==='gallery')loadGallery();}
async function loadOverview(){const [c,b,f]=await Promise.all([sb.from('site_content').select('id',{count:'exact',head:true}),sb.from('consultation_requests').select('id',{count:'exact',head:true}),sb.storage.from('dermsystems-assets').list()]);$('#contentCount').textContent=c.count??'—';$('#bookingCount').textContent=b.count??'—';$('#fileCount').textContent=f.data?.length??'—';}
async function loadContent(){const type=$('#typeFilter').value;let q=sb.from('site_content').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(type)q=q.eq('content_type',type);const {data,error}=await q;$('#contentList').innerHTML=error?`<p class="status">${error.message}</p>`:(data||[]).map(r=>`<article class="content-item"><div><h3>${escapeHtml(r.title)}<span class="badge ${r.published?'':'off'}">${r.published?'Published':'Draft'}</span></h3><p>${escapeHtml(r.content_type)} · ${escapeHtml((r.body||'').slice(0,150))}</p></div><div class="item-actions"><button data-edit="${r.id}">Edit</button><button data-move-up="${r.id}">↑</button><button data-move-down="${r.id}">↓</button><button data-toggle="${r.id}" data-published="${r.published}">${r.published?'Unpublish':'Publish'}</button><button class="danger" data-delete="${r.id}">Delete</button></div></article>`).join('')||'<p>No content yet. Add your first item.</p>';
 $$('[data-edit]').forEach(b=>b.onclick=()=>editContent((data||[]).find(x=>x.id===b.dataset.edit)));$$('[data-move-up]').forEach(b=>b.onclick=()=>moveContent((data||[]).find(x=>x.id===b.dataset.moveUp),-10));$$('[data-move-down]').forEach(b=>b.onclick=()=>moveContent((data||[]).find(x=>x.id===b.dataset.moveDown),10));$$('[data-toggle]').forEach(b=>b.onclick=()=>toggleContent(b.dataset.toggle,b.dataset.published==='true'));$$('[data-delete]').forEach(b=>b.onclick=()=>deleteContent(b.dataset.delete));}
function openEditor(){ $('#contentForm').reset();$('#recordId').value='';$('#dialogTitle').textContent='Add content';$('#contentPublished').checked=true;$('#contentSort').value='0';$('#contentDialog').showModal();}
function editContent(r){$('#recordId').value=r.id;$('#dialogTitle').textContent='Edit content';$('#contentType').value=r.content_type;$('#contentTitle').value=r.title||'';$('#contentBody').value=r.body||'';$('#contentImage').value=r.image_url||'';$('#contentLink').value=r.link_url||'';$('#contentMeta').value=r.metadata?.author||r.metadata?.label||'';$('#contentPublished').checked=!!r.published;$('#contentSort').value=Number(r.sort_order||0);$('#contentDialog').showModal();}
async function saveContent(e){e.preventDefault();const id=$('#recordId').value;const type=$('#contentType').value;const metadata=type==='testimonial'?{author:$('#contentMeta').value}:{label:$('#contentMeta').value};const row={content_type:type,title:$('#contentTitle').value.trim(),body:$('#contentBody').value.trim(),image_url:$('#contentImage').value.trim()||null,link_url:$('#contentLink').value.trim()||null,metadata,published:$('#contentPublished').checked,sort_order:Number($('#contentSort').value||0),updated_at:new Date().toISOString()};const result=id?await sb.from('site_content').update(row).eq('id',id):await sb.from('site_content').insert(row);if(result.error){$('#contentStatus').textContent=result.error.message;return;}$('#contentDialog').close();loadContent();loadOverview();}
async function toggleContent(id,published){const {error}=await sb.from('site_content').update({published:!published}).eq('id',id);if(error)alert(error.message);loadContent();}
async function deleteContent(id){if(!confirm('Delete this content item? This cannot be undone.'))return;const {error}=await sb.from('site_content').delete().eq('id',id);if(error)alert(error.message);loadContent();loadOverview();}
async function loadBookings(){const {data,error}=await sb.from('consultation_requests').select('*').order('created_at',{ascending:false});$('#bookingList').innerHTML=error?`<p class="status">${error.message}</p>`:(data||[]).map(r=>`<article class="booking-item"><div><h3>${escapeHtml(r.full_name||'New enquiry')}</h3><p>${escapeHtml(r.contact_info)} · ${escapeHtml(r.concern)} · ${escapeHtml(r.preferred_date||'')} ${escapeHtml(r.preferred_time||'')}</p><p>Contact: ${escapeHtml(r.contact_method||'')} ${r.other_details?'· '+escapeHtml(r.other_details):''}</p></div><div class="item-actions"><button data-booking-delete="${r.id}" class="danger">Delete</button></div></article>`).join('')||'<p>No consultation requests yet.</p>';$$('[data-booking-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this request?')){await sb.from('consultation_requests').delete().eq('id',b.dataset.bookingDelete);loadBookings();loadOverview();}});}
async function uploadAsset(e){e.preventDefault();const file=$('#assetFile').files[0];if(!file)return;const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${Date.now()}-${safe}`;$('#uploadStatus').textContent='Uploading…';const {error}=await sb.storage.from('dermsystems-assets').upload(path,file,{upsert:false});if(error){$('#uploadStatus').textContent=error.message;return;}const {data}=sb.storage.from('dermsystems-assets').getPublicUrl(path);$('#uploadStatus').textContent='Uploaded. Public URL copied below.';$('#assetName').value=data.publicUrl;await loadAssets();loadOverview();}
async function loadAssets(){const {data,error}=await sb.storage.from('dermsystems-assets').list();$('#assetList').innerHTML=error?`<p class="status">${error.message}</p>`:(data||[]).map(f=>{const {data:u}=sb.storage.from('dermsystems-assets').getPublicUrl(f.name);return `<article class="asset-item"><div><b>${escapeHtml(f.name)}</b><p>${f.metadata?.size?Math.round(f.metadata.size/1024)+' KB':''}</p></div><a href="${u.publicUrl}" target="_blank" rel="noopener">Open file ↗</a><button data-copy="${u.publicUrl}">Copy URL</button></article>`}).join('')||'<p>No uploaded files yet.</p>';$$('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.copy));}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}


const SOCIAL_PLATFORMS=['Instagram','Facebook','TikTok','LinkedIn','YouTube','X','Pinterest','WhatsApp','Threads','Snapchat','Website'];
function socialIconSvg(platform){const p=String(platform||'website').toLowerCase();const paths={
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
 facebook:'<path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h1.7V1.4C17 1.2 15.8 1 14.3 1 11 1 9 3 9 6.6V9H6v4h3v8z" fill="currentColor" stroke="none"/>',
 tiktok:'<path d="M14 3v11.2a3.2 3.2 0 1 1-2.8-3.2V8a6.5 6.5 0 1 0 6 6.4V8.8a9 9 0 0 0 4 1V6.7c-3.1-.2-5.4-1.6-7.2-3.7z" fill="currentColor" stroke="none"/>',
 linkedin:'<path d="M5 8.5H2V22h3zM3.5 2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM22 14.2c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-3.9 2.1V8.5h-3V22h3v-7.2c0-1.9.4-3.8 2.8-3.8s2.4 2.2 2.4 3.9V22h3.1z" fill="currentColor" stroke="none"/>',
 youtube:'<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.8V8.2l6.5 3.8z" fill="currentColor" stroke="none"/>',
 x:'<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.9 5.8 22H2.7l7.3-8.4L2.3 2h6.5l4.5 6.6zM17.8 20h1.7L7.8 3.9H6z" fill="currentColor" stroke="none"/>',
 pinterest:'<path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.7l1.3-5.4s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.3 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.7 0-2.5-1.8-4.2-4.3-4.2-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.9.8 2.4.1.2.2.3.1.6l-.3 1c-.1.3-.3.4-.6.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.4 7-6.4 3.7 0 6.6 2.6 6.6 6.1 0 3.6-2.3 6.6-5.5 6.6-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.2 1-.9 2-1.3 2.7A10 10 0 1 0 12 2z" fill="currentColor" stroke="none"/>',
 whatsapp:'<path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.4A9 9 0 1 1 12 21zm5-6.7c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.1-.6l.5-.6.2-.5-.1-.5-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 2 3.1 5 4.3c.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.2-1.4-.2-.3-.5-.4z" fill="currentColor" stroke="none"/>',
 threads:'<path d="M12 2C6 2 3 6 3 12s3 10 9 10 9-4 9-9c0-5-3-8-8-8-3 0-5 1-6 3l2 1c1-1 2-2 4-2 3 0 5 2 5 5v.5c-1-1-3-2-5-2-3 0-5 2-5 5 0 2 2 4 5 4 3 0 5-2 5-5v-.3c0-5-3-9-8-9-1 0-2 0-3 .5C7 4 9 3 12 3c5 0 8 3 8 8 0 4-2 7-8 7-4 0-6-2-6-6s2-8 6-8z" fill="currentColor" stroke="none"/>',
 snapchat:'<path d="M12 2c-2.5 0-4 1.8-4 4.6 0 .8.1 1.6.2 2.3-.7.4-1.5.2-2.1-.2-.4-.2-.8-.1-1 .3-.2.4 0 .8.4 1 1 .6 2.1.8 3.1.4-.2 1.2-.8 2.4-1.7 3.4-.8.9-1.8 1.4-2.8 1.7-.4.1-.6.5-.5.9.1.3.4.5.8.5 1.3 0 2.1.4 2.8 1 .8.7 1.8 1.1 3.8 1.1s3-.4 3.8-1.1c.7-.6 1.5-1 2.8-1 .4 0 .7-.2.8-.5.1-.4-.1-.8-.5-.9-1-.3-2-.8-2.8-1.7-.9-1-1.5-2.2-1.7-3.4 1 .4 2.1.2 3.1-.4.4-.2.6-.6.4-1-.2-.4-.6-.5-1-.3-.6.4-1.4.6-2.1.2.1-.7.2-1.5.2-2.3C16 3.8 14.5 2 12 2z" fill="currentColor" stroke="none"/>',
 website:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'
 };return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[p]||paths.website}</svg>`;}
async function loadSettings(){
 $('#emailSettingsStatus').textContent='Loading…';$('#socialSettingsStatus').textContent='';
 const {data,error}=await sb.from('site_settings').select('key,value').in('key',['booking_notification_email','social_links']);
 if(error){$('#emailSettingsStatus').textContent='Settings table unavailable. Run the latest supabase-schema.sql in Supabase. '+error.message;return;}
 const settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
 $('#bookingEmail').value=settings.booking_notification_email||'alinaguy1@gmail.com';
 let links=[];try{links=JSON.parse(settings.social_links||'[]')}catch{}
 if(!links.length)links=[{platform:'Instagram',url:'https://www.instagram.com/dermsystems/'}];
 $('#socialLinksEditor').innerHTML='';links.forEach(addSocialRow);
}
async function saveBookingEmail(e){e.preventDefault();const value=$('#bookingEmail').value.trim();$('#emailSettingsStatus').textContent='Saving…';const {error}=await sb.from('site_settings').upsert({key:'booking_notification_email',value,updated_at:new Date().toISOString()},{onConflict:'key'});$('#emailSettingsStatus').textContent=error?'Could not save: '+error.message:'Saved. New booking notifications will be sent to '+value+'.';}
function addSocialRow(link={platform:'Instagram',url:''}){
 const row=document.createElement('div');row.className='social-edit-row';
 const options=SOCIAL_PLATFORMS.map(p=>`<option value="${p}" ${p===link.platform?'selected':''}>${p}</option>`).join('');
 row.innerHTML=`<span class="social-preview">${socialIconSvg(link.platform)}</span><label class="social-platform-label">Platform<select class="social-platform">${options}</select></label><label class="social-url-label">Profile URL<input class="social-url" type="url" placeholder="https://…" value="${escapeHtml(link.url||'')}"></label><label class="social-visible-label"><input class="social-visible" type="checkbox" ${link.visible!==false?'checked':''}> Visible</label><button type="button" class="remove-social" aria-label="Remove social link">Remove</button>`;
 row.querySelector('.social-platform').addEventListener('change',e=>{row.querySelector('.social-preview').innerHTML=socialIconSvg(e.target.value)});
 row.querySelector('.remove-social').addEventListener('click',()=>row.remove());$('#socialLinksEditor').appendChild(row);
}
async function saveSocialLinks(){
 const rows=$$('.social-edit-row');const links=rows.map(r=>({platform:r.querySelector('.social-platform').value,url:r.querySelector('.social-url').value.trim(),visible:r.querySelector('.social-visible')?.checked!==false})).filter(x=>x.url);
 if(links.some(x=>!/^https?:\/\//i.test(x.url))){$('#socialSettingsStatus').textContent='Please enter a complete link beginning with https://.';return;}
 $('#socialSettingsStatus').textContent='Saving…';const {error}=await sb.from('site_settings').upsert({key:'social_links',value:JSON.stringify(links),updated_at:new Date().toISOString()},{onConflict:'key'});
 $('#socialSettingsStatus').textContent=error?'Could not save: '+error.message:'Saved. Your social icons and links have been updated on the website.';
}


// Homepage copy fields are saved as JSON in the existing site_settings table.
const HOME_FIELDS=[
 ['hero_eyebrow','Hero eyebrow','Evidence-based skin wellness','text'],
 ['hero_heading','Hero heading','Skincare that fits your life.','text'],
 ['hero_description','Hero description','Your introductory hero paragraph.','textarea'],
 ['hero_support','Hero supporting text','A short supporting statement.','textarea'],
 ['hero_button','Hero button label','Book my session','text'],
 ['hero_button_url','Hero button destination','#booking','url'],
 ['hero_image_url','Hero image URL','https://…','url'],
 ['about_heading','About section heading','Healthy skin should not feel overwhelming.','text'],
 ['about_intro','About lead paragraph','A short introduction.','textarea'],
 ['about_paragraph_1','About paragraph 1','Your first about paragraph.','textarea'],
 ['about_paragraph_2','About paragraph 2','Your second about paragraph.','textarea'],
 ['founder_heading','Founder heading',"Hi, I'm Dr. Ozioma.",'text'],
 ['founder_bio_1','Founder biography 1','First biography paragraph.','textarea'],
 ['founder_bio_2','Founder biography 2','Second biography paragraph.','textarea'],
 ['founder_image_url','Founder image URL','https://…','url'],
 ['session_heading','Session section heading','Your personalised Skin Wellness Session','text'],
 ['session_description','Session description','Describe what visitors receive.','textarea'],
 ['booking_heading','Booking section heading',"Let's look at your skin together.",'text'],
 ['booking_description','Booking description','Explain the consultation request.','textarea'],
 ['footer_tagline','Footer tagline','Skincare that fits your life.','text'],
 ['intro_kicker','Introduction section label','A different kind of skincare','text'],
 ['check_heading','Skincare checklist heading','Does this sound familiar?','text'],
 ['check_description','Skincare checklist introduction','Tap the ones that are true for you.','textarea'],
 ['session_button','Session button label','Book my session','text'],
 ['audience_heading','Audience section heading','Who this is for.','text'],
 ['audience_description','Audience section description','Wherever life has you right now.','textarea'],
 ['services_heading','Services section heading','Our services.','text'],
 ['services_description','Services section description','Services built around your skin.','textarea'],
 ['investment_heading','Investment section heading','Clarity is a good place to start.','text'],
 ['investment_description','Investment section description','Make space for a conversation about your skin.','textarea'],
 ['price_title','Consultation price-card title','Skin Wellness Session','text'],
 ['price_amount','Consultation price amount','45','text'],
 ['price_note','Consultation price note','30-minute one-to-one consultation','text'],
 ['resources_heading','Resources section heading','Start here, for free.','text'],
 ['resources_description','Resources section description','Simple tools to help you build a thoughtful routine.','textarea'],
 ['testimonials_heading','Testimonials section heading','From women who found their clarity.','text'],
 ['booking_eyebrow','Booking section label',"Let's begin with a conversation",'text'],
 ['booking_privacy_note','Booking privacy note','Your details are only used to respond to your consultation request.','textarea'],
 ['closing_heading','Closing section heading','Less confusion. More confidence.','text'],
 ['closing_button','Closing button label','Take the first step','text'],
 ['nav_approach','Navigation: approach','Our approach','text'],
 ['nav_services','Navigation: services','Services','text'],
 ['nav_resources','Navigation: resources','Free resources','text'],
 ['nav_testimonials','Navigation: testimonials','Kind words','text'],
 ['nav_booking','Navigation: booking','Book a session','text']
];
let homepageDraft={};
async function loadHomepageContent(){
 const status=$('#homepageStatus');status.textContent='Loading…';
 const {data,error}=await sb.from('site_settings').select('value').eq('key','homepage_content').maybeSingle();
 if(error){status.textContent='Could not load homepage content: '+error.message;return;}
 try{homepageDraft=JSON.parse(data?.value||'{}')}catch{homepageDraft={};}
 $('#homepageFields').innerHTML=HOME_FIELDS.map(([key,label,placeholder,type])=>`<label>${escapeHtml(label)}${type==='textarea'?`<textarea data-home-key="${key}" rows="2" placeholder="${escapeHtml(placeholder)}">${escapeHtml(homepageDraft[key]||'')}</textarea>`:`<input data-home-key="${key}" type="${type}" value="${escapeHtml(homepageDraft[key]||'')}" placeholder="${escapeHtml(placeholder)}">`}</label>`).join('');
 status.textContent='';
}
async function saveHomepageContent(e){
 e.preventDefault();const next={...homepageDraft};
 $$('[data-home-key]').forEach(el=>{next[el.dataset.homeKey]=el.value.trim();});
 $('#homepageStatus').textContent='Saving…';
 const {error}=await sb.from('site_settings').upsert({key:'homepage_content',value:JSON.stringify(next),updated_at:new Date().toISOString()},{onConflict:'key'});
 $('#homepageStatus').textContent=error?'Could not save: '+error.message:'Homepage content saved. Refresh the public website to see changes.';
 if(!error)homepageDraft=next;
}

// Advertisement manager
async function loadAds(){
 $('#adStatus').textContent='Loading advertisements…';
 const {data,error}=await sb.from('site_ads').select('*').order('created_at',{ascending:false});
 $('#adStatus').textContent=error?'Could not load advertisements. Apply supabase-enhancements.sql first. '+error.message:'';
 $('#adList').innerHTML=error?'':(data||[]).map(a=>`<article class="content-item"><div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description||'')} · ${escapeHtml(a.display_type)} · ${a.active?'Active':'Inactive'}</p><small>${a.starts_at?'Starts '+new Date(a.starts_at).toLocaleString():'No start date'} · ${a.ends_at?'Ends '+new Date(a.ends_at).toLocaleString():'No end date'}</small></div><div class="item-actions"><button data-ad-edit="${a.id}" class="secondary">Edit</button><button data-ad-toggle="${a.id}" data-active="${a.active}" class="secondary">${a.active?'Deactivate':'Activate'}</button><button data-ad-delete="${a.id}" class="danger">Delete</button></div></article>`).join('');
 (data||[]).forEach(a=>{const edit=$(`[data-ad-edit="${a.id}"]`);if(edit)edit.onclick=()=>editAd(a);const toggle=$(`[data-ad-toggle="${a.id}"]`);if(toggle)toggle.onclick=()=>toggleAd(a.id,!a.active);const del=$(`[data-ad-delete="${a.id}"]`);if(del)del.onclick=()=>deleteAd(a.id);});
}
function editAd(a){$('#adId').value=a.id;$('#adTitle').value=a.title||'';$('#adDescription').value=a.description||'';$('#adImage').value=a.image_url||'';$('#adUrl').value=a.destination_url||'';$('#adType').value=a.display_type||'bottom';$('#adStart').value=a.starts_at?new Date(a.starts_at).toISOString().slice(0,16):'';$('#adEnd').value=a.ends_at?new Date(a.ends_at).toISOString().slice(0,16):'';$('#adActive').checked=!!a.active;$('#adFormTitle').textContent='Edit advertisement';$('#adForm').scrollIntoView({behavior:'smooth',block:'start'});}
function resetAdForm(){$('#adForm').reset();$('#adId').value='';$('#adFormTitle').textContent='Add advertisement';$('#adStatus').textContent='';}
async function saveAd(e){e.preventDefault();const row={title:$('#adTitle').value.trim(),description:$('#adDescription').value.trim(),image_url:$('#adImage').value.trim(),destination_url:$('#adUrl').value.trim(),display_type:$('#adType').value,active:$('#adActive').checked,starts_at:$('#adStart').value?new Date($('#adStart').value).toISOString():null,ends_at:$('#adEnd').value?new Date($('#adEnd').value).toISOString():null,updated_at:new Date().toISOString()};if(row.starts_at&&row.ends_at&&row.ends_at<row.starts_at){$('#adStatus').textContent='End date must be after the start date.';return;}$('#adStatus').textContent='Saving…';const id=$('#adId').value;const {error}=id?await sb.from('site_ads').update(row).eq('id',id):await sb.from('site_ads').insert(row);$('#adStatus').textContent=error?'Could not save: '+error.message:'Advertisement saved.';if(!error){resetAdForm();loadAds();}}
async function toggleAd(id,active){const {error}=await sb.from('site_ads').update({active,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);loadAds();}
async function deleteAd(id){if(!confirm('Delete this advertisement?'))return;const {error}=await sb.from('site_ads').delete().eq('id',id);if(error)alert(error.message);loadAds();}

// Private gallery. Public use requires an explicit copy into dermsystems-assets.
let galleryRows=[];
async function loadGallery(){
 $('#galleryStatus').textContent='Loading private gallery…';
 const {data,error}=await sb.from('gallery_assets').select('*').order('created_at',{ascending:false});
 if(error){$('#galleryStatus').textContent='Could not load gallery. Apply supabase-enhancements.sql first. '+error.message;return;}
 galleryRows=data||[];const categories=[...new Set(galleryRows.map(x=>x.category).filter(Boolean))].sort();
 $('#galleryCategoryFilter').innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option>${escapeHtml(c)}</option>`).join('');
 $('#galleryStatus').textContent='';renderGallery();
}
async function renderGallery(){
 const term=($('#gallerySearch').value||'').toLowerCase();const category=$('#galleryCategoryFilter').value;
 const filtered=galleryRows.filter(x=>(!category||x.category===category)&&(`${x.title} ${x.description} ${x.category} ${(x.tags||[]).join(' ')}`).toLowerCase().includes(term));
 const cards=await Promise.all(filtered.map(async x=>{const {data}=await sb.storage.from('dermsystems-private-gallery').createSignedUrl(x.storage_path,3600);return {x,url:data?.signedUrl||''};}));
 $('#galleryList').innerHTML=cards.map(({x,url})=>`<article class="gallery-card"><img src="${url}" alt="${escapeHtml(x.title)}"><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.category)} · ${escapeHtml(x.description||'')}</p><div class="item-actions"><button class="secondary" data-gallery-edit="${x.id}">Edit details</button><button class="secondary" data-gallery-publish="${x.id}">Publish copy</button><button class="secondary" data-gallery-replace="${x.id}">Replace</button><button class="danger" data-gallery-delete="${x.id}">Delete</button></div></div></article>`).join('')||'<p>No images match this filter.</p>';
 filtered.forEach(x=>{$(`[data-gallery-edit="${x.id}"]`).onclick=()=>editGalleryMetadata(x);$(`[data-gallery-publish="${x.id}"]`).onclick=()=>publishGalleryAsset(x);$(`[data-gallery-replace="${x.id}"]`).onclick=()=>replaceGalleryAsset(x);$(`[data-gallery-delete="${x.id}"]`).onclick=()=>deleteGalleryAsset(x);});
}
async function uploadGalleryImages(e){
 e.preventDefault();const files=[...$('#galleryFiles').files];if(!files.length)return;const category=$('#galleryCategory').value.trim()||'Uncategorised';const prefix=$('#galleryTitle').value.trim();const description=$('#galleryDescription').value.trim();const tags=$('#galleryTags').value.split(',').map(t=>t.trim()).filter(Boolean);$('#galleryStatus').textContent='Uploading…';
 for(const [i,file] of files.entries()){if(!file.type.startsWith('image/'))continue;const path=`${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const up=await sb.storage.from('dermsystems-private-gallery').upload(path,file,{upsert:false});if(up.error){$('#galleryStatus').textContent='Upload failed: '+up.error.message;return;}const {error}=await sb.from('gallery_assets').insert({title:prefix?(files.length>1?`${prefix} ${i+1}`:prefix):file.name,category,description,tags,storage_path:path,mime_type:file.type,file_size:file.size});if(error){$('#galleryStatus').textContent='Image uploaded but metadata failed: '+error.message;return;}}
 $('#galleryForm').reset();$('#galleryStatus').textContent='Images uploaded to the private gallery.';loadGallery();
}
async function editGalleryMetadata(x){
 const title=prompt('Image title:',x.title||'');if(title===null)return;
 const description=prompt('Image description:',x.description||'');if(description===null)return;
 const category=prompt('Category:',x.category||'Uncategorised');if(category===null)return;
 const tags=prompt('Comma-separated tags:',(x.tags||[]).join(', '));if(tags===null)return;
 const {error}=await sb.from('gallery_assets').update({title:title.trim(),description:description.trim(),category:category.trim()||'Uncategorised',tags:tags.split(',').map(t=>t.trim()).filter(Boolean),updated_at:new Date().toISOString()}).eq('id',x.id);
 if(error)alert(error.message);loadGallery();
}
async function publishGalleryAsset(x){
 const {data,error}=await sb.storage.from('dermsystems-private-gallery').download(x.storage_path);if(error){alert(error.message);return;}
 const ext=(x.storage_path.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'');const path=`gallery-${Date.now()}-${crypto.randomUUID()}.${ext}`;
 const up=await sb.storage.from('dermsystems-assets').upload(path,data,{upsert:false,contentType:x.mime_type||undefined});if(up.error){alert(up.error.message);return;}
 const {data:pub}=sb.storage.from('dermsystems-assets').getPublicUrl(path);try{await navigator.clipboard.writeText(pub.publicUrl);alert('Public copy created. Its URL has been copied so you can paste it into a service, resource or homepage image field.');}catch{prompt('Copy this public image URL:',pub.publicUrl);}
}
async function replaceGalleryAsset(x){
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.onchange=async()=>{const file=picker.files[0];if(!file)return;const {error}=await sb.storage.from('dermsystems-private-gallery').upload(x.storage_path,file,{upsert:true,contentType:file.type});if(error){alert(error.message);return;}await sb.from('gallery_assets').update({mime_type:file.type,file_size:file.size,updated_at:new Date().toISOString()}).eq('id',x.id);loadGallery();};picker.click();
}
async function deleteGalleryAsset(x){if(!confirm('Delete this private gallery image?'))return;const storage=await sb.storage.from('dermsystems-private-gallery').remove([x.storage_path]);if(storage.error){alert(storage.error.message);return;}const {error}=await sb.from('gallery_assets').delete().eq('id',x.id);if(error)alert(error.message);loadGallery();}

async function moveContent(record,delta){if(!record)return;const {error}=await sb.from('site_content').update({sort_order:Number(record.sort_order||0)+delta,updated_at:new Date().toISOString()}).eq('id',record.id);if(error)alert(error.message);loadContent();}
