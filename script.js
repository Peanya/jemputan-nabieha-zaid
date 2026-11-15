'use strict';
/* EDIT THESE DETAILS BEFORE PUBLISHING */
const CONFIG = {
  supabaseUrl: 'https://mbshxhcyngdkasjbzfje.supabase.co',
  supabaseKey: 'sb_publishable_WMmUg8CBFPrudhgEgV45gg_fSdIpMsX',
  eventTitle: 'Walimatul Urus Nabieha & Zaid',
  eventStart: '20261219T110000', // local Malaysia time
  eventEnd: '20261219T160000',
  venue: '116, Jalan Bunga Lili, Felda Pasak, 81900 Kota Tinggi, Johor',
  phone: '+60123456789',
  mapsUrl: 'https://maps.app.goo.gl/rvWoUh8BuqxcRCQd6?g_st=ac'
};
const $ = id => document.getElementById(id);
const client = window.supabase?.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
let userId = null, ownRsvp = null, ownWish = null, lastModalTrigger = null;
let wishScrollY = 0, lastFrame = null, pauseUntil = 0, pointerInside = false;
const list = $('wish-list');
const setStatus = message => { $('form-status').textContent = message; };
const calendarUrl = () => 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=' + encodeURIComponent(CONFIG.eventTitle) +
  '&dates=' + encodeURIComponent(CONFIG.eventStart + '/' + CONFIG.eventEnd) +
  '&ctz=Asia%2FKuala_Lumpur' +
  '&location=' + encodeURIComponent(CONFIG.venue);
$('calendar-link').href = calendarUrl();
$('map-link').href = CONFIG.mapsUrl;
$('venue-text').textContent = CONFIG.venue;

async function openInvitation() {
  const button = $('open-invite');
  button.disabled = true;
  $('envelope-screen').classList.add('opening');

  // This runs directly after the guest taps "Buka Jemputan".
  const audio = $('background-music');
  audio.volume = 0.4;
  audio.play().catch(error => {
    console.warn('Muzik tidak dapat dimainkan:', error);
  });

  await new Promise(resolve => setTimeout(resolve, 950));
  $('invitation').hidden = false;
  $('envelope-screen').hidden = true;
  document.body.classList.remove('locked');
  window.scrollTo(0, 0);
}
$('open-invite').addEventListener('click', openInvitation);

function showModal(trigger) {
  lastModalTrigger = trigger || document.activeElement;
  $('rsvp-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  setStatus('');
  renderOwnData();
  $('guest-name').focus();
}
function closeModal() {
  $('rsvp-modal').hidden = true;
  document.body.style.overflow = '';
  lastModalTrigger?.focus?.();
}
/* =====================================
   CONTACT POPUP
===================================== */

const contactModal = $('contact-modal');
const contactButton = $('contact-button');

let lastContactTrigger = null;

function openContactModal() {
  lastContactTrigger = document.activeElement;

  contactModal.hidden = false;
  document.body.style.overflow = 'hidden';

  contactModal.querySelector('.modal-close').focus();
}

function closeContactModal() {
  contactModal.hidden = true;
  document.body.style.overflow = '';

  lastContactTrigger?.focus();
}

contactButton.addEventListener('click', openContactModal);

document.querySelectorAll('[data-close-contact]').forEach(button => {
  button.addEventListener('click', closeContactModal);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !contactModal.hidden) {
    closeContactModal();
  }
});
document.querySelectorAll('[data-open-rsvp]').forEach(b => b.addEventListener('click', () => showModal(b)));
document.querySelectorAll('[data-close-rsvp]').forEach(b => b.addEventListener('click', closeModal));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('rsvp-modal').hidden) closeModal(); });
$('attendance').addEventListener('change', () => {
  const coming = $('attendance').value === '1';
  $('count-field').hidden = !coming;
  $('guest-count').disabled = !coming;
});
function renderOwnData() {
  $('guest-name').value = ownRsvp?.name || ownWish?.name || '';
  $('guest-phone').value = ownRsvp?.phone || '';
  $('attendance').value = ownRsvp && Number(ownRsvp.attendance) === 0 ? '0' : '1';
  $('guest-count').value = ownRsvp && Number(ownRsvp.attendance) > 0 ? String(ownRsvp.attendance) : '1';
  $('guest-message').value = ownWish?.message || '';
  $('attendance').dispatchEvent(new Event('change'));
  $('save-rsvp').textContent = ownRsvp ? 'Kemaskini RSVP & Ucapan' : 'Hantar RSVP & Ucapan';
  $('delete-rsvp').hidden = !ownRsvp && !ownWish;
}
async function ensureSession() {
  if (!client) throw new Error('Supabase library tidak dimuatkan');
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (session) { userId = session.user.id; return; }
  const response = await client.auth.signInAnonymously();
  if (response.error) throw response.error;
  userId = response.data.user.id;
}
async function loadOwnData() {
  const [r, w] = await Promise.all([
    client.from('rsvps').select('id,name,phone,attendance').eq('user_id', userId).maybeSingle(),
    client.from('wishes').select('id,name,message').eq('user_id', userId).maybeSingle()
  ]);
  if (r.error) throw r.error;
  if (w.error) throw w.error;
  ownRsvp = r.data;
  ownWish = w.data;
  renderOwnData();
}
async function loadWishes() {
  const { data, error } = await client.from('wishes').select('id,name,message,created_at').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  list.replaceChildren();
  if (!data?.length) { list.textContent = 'Belum ada ucapan. Jadilah orang pertama!'; return; }
  for (const wish of data) {
    const card = document.createElement('div'); card.className = 'wish-card';
    const name = document.createElement('h4'); name.className = 'wish-name'; name.textContent = wish.name;
    const message = document.createElement('p'); message.className = 'wish-message'; message.textContent = wish.message;
    card.append(name, message); list.append(card);
  }
  wishScrollY = 0; list.scrollTop = 0;
}
$('rsvp-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!userId) { setStatus('Sistem sedang disediakan. Sila cuba sebentar lagi.'); return; }
  const name = $('guest-name').value.trim();
  const phone = $('guest-phone').value.trim();
  const coming = $('attendance').value === '1';
  const count = coming ? Number($('guest-count').value) : 0;
  const message = $('guest-message').value.trim();
  if (!name || !/^\+?[\d\s()-]{9,20}$/.test(phone)) { setStatus('Sila masukkan nama dan nombor telefon yang sah.'); return; }
  if (![0, 1, 2, 3].includes(count) || (coming && count === 0)) { setStatus('Jumlah kehadiran tidak sah.'); return; }
  $('save-rsvp').disabled = true; setStatus('Sedang menyimpan…');
  try {
    // RSVP is private. Wishes are public and intentionally do not contain phone numbers.
    const r = await client.from('rsvps').upsert({ user_id: userId, name, phone, attendance: count }, { onConflict: 'user_id' });
    if (r.error) throw r.error;
    // A blank message removes an existing public wish, if any.
    const w = message
      ? await client.from('wishes').upsert({ user_id: userId, name, message }, { onConflict: 'user_id' })
      : await client.from('wishes').delete().eq('user_id', userId);
    if (w.error) throw w.error;
    await loadOwnData(); await loadWishes();
    setStatus('RSVP dan ucapan berjaya disimpan! ❤️');
  } catch (err) {
    console.error('RSVP save failed', err);
    setStatus('Ada masalah menyimpan data. Semak polisi Supabase dan cuba lagi. RSVP mungkin sudah tersimpan; sila semak semula sebelum menghantar.');
  } finally { $('save-rsvp').disabled = false; }
});
$('delete-rsvp').addEventListener('click', async () => {
  if (!userId || !confirm('Padam RSVP dan ucapan anda?')) return;
  $('delete-rsvp').disabled = true; setStatus('Sedang memadam…');
  try {
    const w = await client.from('wishes').delete().eq('user_id', userId);
    if (w.error) throw w.error;
    const r = await client.from('rsvps').delete().eq('user_id', userId);
    if (r.error) throw r.error;
    await loadOwnData(); await loadWishes();
    setStatus('RSVP dan ucapan telah dipadam.');
  } catch (err) { console.error(err); setStatus('Tidak berjaya padam semua data. Cuba lagi.'); }
  finally { $('delete-rsvp').disabled = false; }
});
// Continuous scrolling; pauses while hovered, or for 5s after user interaction.
const pauseScroll = () => { pauseUntil = performance.now() + 5000; wishScrollY = list.scrollTop; };
list.addEventListener('wheel', pauseScroll, { passive: true });
list.addEventListener('touchstart', pauseScroll, { passive: true });
list.addEventListener('touchmove', pauseScroll, { passive: true });
list.addEventListener('pointerdown', pauseScroll);
list.addEventListener('mouseenter', () => { pointerInside = true; });
list.addEventListener('mouseleave', () => { pointerInside = false; pauseScroll(); });
list.addEventListener('focusin', () => { pointerInside = true; });
list.addEventListener('focusout', () => { pointerInside = false; pauseScroll(); });
function scrollFrame(time) {
  if (lastFrame === null) lastFrame = time;
  const delta = Math.min(time - lastFrame, 50); lastFrame = time;
  const max = list.scrollHeight - list.clientHeight;
  if (max > 0 && !pointerInside && time > pauseUntil && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wishScrollY += 22 * delta / 1000;
    if (wishScrollY >= max) wishScrollY = 0;
    list.scrollTop = wishScrollY;
  }
  requestAnimationFrame(scrollFrame);
}
requestAnimationFrame(scrollFrame);
(async () => {
  try { await ensureSession(); await loadOwnData(); await loadWishes(); }
  catch (err) { console.error('Initialization failed', err); list.textContent = 'Ucapan tidak dapat dimuatkan. Sila refresh halaman.'; setStatus('Sambungan Supabase gagal. Pastikan Anonymous Sign-ins aktif dan semak Console.'); }
})();

/* =====================================
   SECTION FADE IN / FADE OUT
===================================== */

function setupSectionFade() {

  // Jangan animasikan untuk pengguna
  // yang memilih reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const sections = document.querySelectorAll('.panel');

  if (!('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }

      });

    },
    {
      threshold: 0.15
    }
  );

  sections.forEach(section => {
    observer.observe(section);
  });

  document.body.classList.add('fade-ready');
}

setupSectionFade();