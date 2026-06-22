// ===== SESSION STATE =====
const SESSION_KEY = 'novara_session_v3';
let session = {
  familyId: null,
  childId: null,
  pinVerified: false,
  child: null,
  parents: [],
  languages: [],
  location: null,
  domains: [],
  stats: { words: 0, streak: 0, milestones: 0, done: 0 },
  plan: [],
  weekNumber: 1,
  ageMonths: 0,
  trialStartDate: null,
  isPaid: false,
  trialPlanUsed: false,
  weekAvailability: null,
  nickname: null,       // ocean-themed family nickname
  consentAgreed: false, // legal consent confirmed at registration
};

function saveSession() {
  try {
    const s = { ...session, pinVerified: false };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch(e) {}
}

function loadSession() {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (s) session = { ...session, ...JSON.parse(s), pinVerified: false };
  } catch(e) {}
  // Apply devMode overrides immediately — never let cached values block dev access
  if (NOVARA.devMode) {
    session.isPaid = true;
    session.trialPlanUsed = false;
  }
}

// ===== DEVICE MANAGEMENT =====
function getOrCreateDeviceId() {
  let id = localStorage.getItem('novara_device_id');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('novara_device_id', id);
  }
  return id;
}

async function registerDevice(familyId) {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();
  const existing = await db.select('registered_devices', `?family_id=eq.${familyId}`);
  const alreadyRegistered = existing?.find(d => d.device_id === deviceId);
  if (alreadyRegistered) {
    await db.update('registered_devices', { last_seen_at: new Date().toISOString() },
      `?family_id=eq.${familyId}&device_id=eq.${deviceId}`);
    return { allowed: true };
  }
  if (existing && existing.length >= NOVARA.maxDevices) {
    return { allowed: false, devices: existing };
  }
  await db.insert('registered_devices', { family_id: familyId, device_id: deviceId, device_name: deviceName });
  return { allowed: true };
}

function getDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android device';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'Browser';
}

async function resetDevice(familyId) {
  const deviceId = getOrCreateDeviceId();
  await db.delete('registered_devices', `?family_id=eq.${familyId}&device_id=eq.${deviceId}`);
  localStorage.removeItem('novara_device_id');
}

// ===== NICKNAME GENERATOR =====
const NICKNAME_ADJECTIVES = [
  'Bright','Swift','Bold','Gentle','Brave','Warm','Deep','Calm',
  'Joyful','Tender','Radiant','Steady','Vivid','Kind','Fierce','Loving'
];
const NICKNAME_NOUNS = [
  'Dolphins','Turtles','Whales','Seahorses','Rays','Otters',
  'Corals','Waves','Tides','Currents','Shores','Pearls'
];

function generateNickname() {
  const adj  = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
  return `${adj} ${noun}`;
}

// ===== LEADERBOARD =====
// Novara Score = (activities_done × 10) + (milestones × 15) + (streak × 5)
function calcNovaraScore(done, milestones, streak) {
  return (done * 10) + (milestones * 15) + (streak * 5);
}

async function updateLeaderboard() {
  if (!session.familyId || !session.nickname) return;
  try {
    const done      = session.stats.done;
    const miles     = session.stats.milestones;
    const streak    = session.stats.streak;
    const weekly    = calcNovaraScore(done, miles, streak);

    // Get existing all-time score
    const existing = await db.select('leaderboard_scores',
      `?family_id=eq.${session.familyId}&order=alltime_score.desc&limit=1`);
    const prevAllTime = existing?.[0]?.alltime_score || 0;
    const alltime = Math.max(prevAllTime, weekly);

    await db.upsert('leaderboard_scores', {
      family_id:      session.familyId,
      nickname:       session.nickname,
      week_number:    session.weekNumber,
      weekly_score:   weekly,
      alltime_score:  alltime,
      activities_done: done,
      milestones_done: miles,
      streak,
      updated_at:     new Date().toISOString(),
    });
  } catch(e) { console.warn('Leaderboard update failed (non-blocking):', e.message); }
}

function switchLbTab(tab, el) {
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.lb-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(`lb-panel-${tab}`)?.classList.add('active');
}

async function renderLeaderboard() {
  const weekEl    = document.getElementById('leaderboard-weekly-list');
  const alltimeEl = document.getElementById('leaderboard-alltime-list');
  const myWeekEl  = document.getElementById('leaderboard-my-position');
  if (!weekEl) return;

  weekEl.innerHTML    = `<div class="lb-loading"><div class="spinner"></div></div>`;
  alltimeEl.innerHTML = `<div class="lb-loading"><div class="spinner"></div></div>`;

  try {
    // Weekly top 10
    const weekly = await db.select('leaderboard_scores',
      `?week_number=eq.${session.weekNumber}&order=weekly_score.desc&limit=10`);

    // All-time top 10 — get best score per family
    const alltime = await db.select('leaderboard_scores',
      `?order=alltime_score.desc&limit=10`);

    // My position this week
    const allWeekly = await db.select('leaderboard_scores',
      `?week_number=eq.${session.weekNumber}&order=weekly_score.desc`);
    const myPos = allWeekly?.findIndex(r => r.family_id === session.familyId);

    weekEl.innerHTML    = renderLeaderboardList(weekly, 'weekly_score', 'weekly');
    alltimeEl.innerHTML = renderLeaderboardList(alltime, 'alltime_score', 'alltime');

    if (myWeekEl) {
      if (myPos === -1 || myPos === undefined) {
        myWeekEl.innerHTML = session.isPaid || NOVARA.devMode
          ? `<div class="lb-my-pos-card">Your family hasn't scored this week yet — generate and complete your plan!</div>`
          : `<div class="lb-my-pos-card lb-unranked"><i class="ti ti-lock"></i> Complete your free trial week to appear on the leaderboard</div>`;
      } else {
        const myRow = allWeekly[myPos];
        myWeekEl.innerHTML = `
          <div class="lb-my-pos-card">
            <span class="lb-pos">#${myPos + 1}</span>
            <span class="lb-nick">${myRow.nickname} <span style="font-size:11px;opacity:0.7">(You)</span></span>
            <span class="lb-score">${myRow.weekly_score} pts</span>
          </div>`;
      }
    }
  } catch(e) {
    weekEl.innerHTML = `<p style="padding:16px;color:#94A3B8;text-align:center">Could not load leaderboard</p>`;
  }
}

function renderLeaderboardList(rows, scoreKey, type) {
  if (!rows || rows.length === 0) {
    return `<div class="lb-empty"><i class="ti ti-trophy"></i><p>No scores yet this ${type === 'weekly' ? 'week' : 'time'}.<br>Be the first!</p></div>`;
  }
  const medals = ['🥇','🥈','🥉'];
  return rows.map((r, i) => {
    const isMe = r.family_id === session.familyId;
    return `
      <div class="lb-row ${isMe ? 'lb-row-me' : ''}">
        <div class="lb-rank">${medals[i] || `#${i + 1}`}</div>
        <div class="lb-info">
          <div class="lb-nick">${r.nickname}${isMe ? ' <span class="lb-you-badge">You</span>' : ''}</div>
          <div class="lb-meta">${r.activities_done} activities · ${r.milestones_done} milestones · ${r.streak} day streak</div>
        </div>
        <div class="lb-score-val">${r[scoreKey]}<span style="font-size:10px;opacity:0.6"> pts</span></div>
      </div>`;
  }).join('');
}

// ===== TRIAL HELPERS =====
// Trial = feature-based: 1 free week of plan generation (not time-based)
// session.trialPlanUsed = true once the first plan has been generated

function hasUsedTrialPlan() {
  if (NOVARA.devMode || session.isPaid) return false; // never block in devMode or paid
  return session.trialPlanUsed === true;
}

function isTrialActive() {
  if (NOVARA.devMode) return true;
  return session.isPaid || !hasUsedTrialPlan();
}

function canGeneratePlan() {
  if (NOVARA.devMode || session.isPaid) return true;
  return !hasUsedTrialPlan();
}

function canUseChat()        { return NOVARA.devMode || session.isPaid; }
function canUseShopping()    { return NOVARA.devMode || session.isPaid; }
function canSeeFullHistory() { return NOVARA.devMode || session.isPaid; }

function renderTrialBanner() {
  document.querySelectorAll('.trial-banner').forEach(b => b.remove());
  // No banner in dev mode or for paid users
  if (NOVARA.devMode || session.isPaid) return;

  if (hasUsedTrialPlan()) { showTrialExpiredOverlay(); return; }

  const screens = ['screen-home','screen-plan','screen-progress','screen-moments','screen-settings'];
  screens.forEach(sid => {
    const sc = document.getElementById(sid);
    if (!sc) return;
    const banner = document.createElement('div');
    banner.className = 'trial-banner';
    banner.innerHTML = `<i class="ti ti-sparkles"></i> You are on your <strong>free trial week</strong>. <a href="#" onclick="showWaitlistModal()" style="color:#92400E;font-weight:600">Join the upgrade waitlist</a> to continue after this week.`;
    sc.insertBefore(banner, sc.querySelector('.scroll-area') || sc.firstChild);
  });
}

function showTrialExpiredOverlay() {
  if (document.getElementById('trial-expired-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'trial-expired-overlay';
  overlay.className = 'trial-expired-overlay';
  overlay.innerHTML = `
    <div class="trial-expired-card">
      <div style="font-size:48px">🌊</div>
      <h2>Your free week is complete</h2>
      <p>You've experienced Novara's personalised plan for your child. Join our upgrade waitlist to continue every week — your milestones, moments, and progress are all safe.</p>
      <button class="btn-primary full-width" onclick="showWaitlistModal()"><i class="ti ti-crown"></i> Join the upgrade waitlist</button>
      <p style="font-size:12px;color:var(--color-text-secondary);margin-top:12px">Your data is safe and will be fully restored when you upgrade.</p>
    </div>`;
  document.getElementById('app').appendChild(overlay);
}

function showWaitlistModal() {
  const modal = document.getElementById('modal-waitlist');
  if (modal) modal.style.display = 'flex';
}

async function joinWaitlist() {
  const emailEl = document.getElementById('waitlist-email');
  const email = emailEl?.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address'); return;
  }
  try {
    await db.insert('upgrade_waitlist', { family_id: session.familyId, email });
    closeModal('modal-waitlist');
    // Remove expired overlay if present
    document.getElementById('trial-expired-overlay')?.remove();
    alert('You\'re on the list! We\'ll email you as soon as full access launches.');
  } catch(e) {
    alert('Error: ' + e.message);
  }
}

// ===== WEEK CALCULATION =====
function computeWeek(startDate, dob) {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now - start) / 86400000);
  const week = Math.min(Math.floor(daysDiff / 7) + 1, 104);
  const dobDate = new Date(dob);
  const ageMs = now - dobDate;
  const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
  return { week, ageMonths };
}

// ===== INIT =====
async function initApp() {
  loadSession();
  showScreen('splash');
  setTimeout(async () => {
    if (!session.familyId) {
      showScreen('onboard-welcome');
    } else if (!session.pinVerified) {
      renderPinScreen();
      showScreen('pin');
    } else {
      loadAndShowHome();
    }
  }, 1800);
}

// ===== NAVIGATION =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  const noNav = ['splash','pin','onboard-welcome','onboard-location','onboard-child',
                 'onboard-languages','onboard-parents','onboard-pin','onboard-consent',
                 'onboard-email','onboard-verify','onboard-availability'];
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = noNav.includes(id) ? 'none' : 'flex';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.querySelector(`[data-screen="${id}"]`);
  if (nb) nb.classList.add('active');
  if (id === 'home')        { renderHome(); renderTrialBanner(); }
  if (id === 'plan')        renderPlan();
  if (id === 'progress')    renderProgress();
  if (id === 'moments')     renderMoments();
  if (id === 'settings')    renderSettings();
  if (id === 'chat')        renderChatGate();
  if (id === 'shopping')    renderShoppingGate();
  if (id === 'leaderboard') renderLeaderboard();
}

// ===== ONBOARDING =====
let onboardData = {
  location: null,
  childName: '',
  dob: '',
  languages: [],
  parent1: 'Mama',
  parent2: 'Papa',
  pin: '',
  email: '',
};

async function startOnboarding() {
  showScreen('onboard-location');
  document.getElementById('location-status').textContent = 'Detecting your location…';
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
    );
    const { latitude, longitude } = pos.coords;
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const geo = await r.json();
    const city = geo.address.city || geo.address.town || geo.address.village || '';
    const country = geo.address.country || '';
    const country_code = geo.address.country_code?.toUpperCase() || '';
    onboardData.location = { city, country, country_code, latitude, longitude };
    document.getElementById('location-status').textContent = `📍 ${city}, ${country}`;
    document.getElementById('location-confirm').style.display = 'block';
    document.getElementById('location-manual').style.display = 'none';
  } catch(e) {
    document.getElementById('location-status').textContent = 'Could not detect location automatically.';
    document.getElementById('location-manual').style.display = 'block';
    document.getElementById('location-confirm').style.display = 'none';
  }
}

function confirmLocation() { showScreen('onboard-child'); }

function saveManualLocation() {
  const city = document.getElementById('manual-city').value.trim();
  const country = document.getElementById('manual-country').value.trim();
  if (!city || !country) { alert('Please enter your city and country'); return; }
  onboardData.location = { city, country, country_code: '', latitude: null, longitude: null };
  showScreen('onboard-child');
}

function saveChildDetails() {
  const name = document.getElementById('child-name-input').value.trim();
  const dob = document.getElementById('child-dob-input').value;
  if (!name) { alert('Please enter your child\'s name'); return; }
  if (!dob) { alert('Please enter your child\'s date of birth'); return; }
  const dobDate = new Date(dob);
  const now = new Date();
  if (dobDate > now) { alert('Date of birth cannot be in the future'); return; }
  const ageMonths = Math.floor((now - dobDate) / (1000 * 60 * 60 * 24 * 30.44));
  if (ageMonths > 48) { alert('Novara currently supports children up to 48 months (4 years)'); return; }
  onboardData.childName = name;
  onboardData.dob = dob;
  document.getElementById('onboard-child-display').textContent = name;
  showScreen('onboard-languages');
  renderLanguagePicker();
}

const WORLD_LANGUAGES = [
  'English','Spanish','French','German','Portuguese','Mandarin','Arabic','Hindi',
  'Yoruba','Igbo','Hausa','Swahili','Amharic','Zulu','Catalan','Italian',
  'Dutch','Russian','Japanese','Korean','Turkish','Urdu','Bengali','Punjabi',
  'Tagalog','Vietnamese','Thai','Polish','Romanian','Greek'
];

function renderLanguagePicker() {
  const home = document.getElementById('lang-home-list');
  const school = document.getElementById('lang-school-list');
  if (!home || !school) return;
  home.innerHTML = WORLD_LANGUAGES.map(lang => {
    const isHome = onboardData.languages.find(l => l.language === lang && l.context === 'home');
    return `<button class="lang-select-btn ${isHome ? 'selected-home' : ''}" onclick="toggleLang('${lang}','home')">${lang}</button>`;
  }).join('');
  school.innerHTML = WORLD_LANGUAGES.map(lang => {
    const isSchool = onboardData.languages.find(l => l.language === lang && l.context === 'school');
    return `<button class="lang-select-btn ${isSchool ? 'selected-school' : ''}" onclick="toggleLang('${lang}','school')">${lang}</button>`;
  }).join('');
}

function toggleLang(lang, context) {
  const existing = onboardData.languages.findIndex(l => l.language === lang && l.context === context);
  if (existing >= 0) onboardData.languages.splice(existing, 1);
  else onboardData.languages.push({ language: lang, context });
  renderLanguagePicker();
  updateLangSummary();
}

function updateLangSummary() {
  const home = onboardData.languages.filter(l => l.context === 'home').map(l => l.language);
  const school = onboardData.languages.filter(l => l.context === 'school').map(l => l.language);
  const el = document.getElementById('lang-summary');
  if (el) el.textContent = home.length > 0 || school.length > 0
    ? `Home: ${home.join(', ') || 'none'} · School: ${school.join(', ') || 'none'}` : '';
}

function saveLanguages() {
  if (onboardData.languages.length === 0) { alert('Please select at least one language'); return; }
  showScreen('onboard-parents');
}

function saveParents() {
  const p1 = document.getElementById('onboard-parent1').value.trim();
  const p2 = document.getElementById('onboard-parent2').value.trim();
  onboardData.parent1 = p1 || 'Mama';
  onboardData.parent2 = p2 || 'Papa';
  showScreen('onboard-pin');
}

function saveOnboardPin() {
  const p1 = document.getElementById('onboard-pin1').value;
  const p2 = document.getElementById('onboard-pin2').value;
  if (p1.length !== 4 || !/^\d{4}$/.test(p1)) { showOError('PIN must be exactly 4 digits'); return; }
  if (p1 !== p2) { showOError('PINs do not match'); return; }
  onboardData.pin = p1;
  // Move to consent screen
  showScreen('onboard-consent');
}

function validateConsent() {
  const c1 = document.getElementById('consent-check-1')?.checked;
  const c2 = document.getElementById('consent-check-2')?.checked;
  const c3 = document.getElementById('consent-check-3')?.checked;
  const btn = document.getElementById('consent-agree-btn');
  if (btn) btn.disabled = !(c1 && c2 && c3);
}

function proceedFromConsent() {
  const c1 = document.getElementById('consent-check-1')?.checked;
  const c2 = document.getElementById('consent-check-2')?.checked;
  const c3 = document.getElementById('consent-check-3')?.checked;
  if (!c1 || !c2 || !c3) {
    alert('Please agree to all terms before continuing.');
    return;
  }
  onboardData.consentAgreed = true;
  showScreen('onboard-email');
}

function showOError(msg) {
  const el = document.getElementById('onboard-pin-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ===== EMAIL VERIFICATION STEP =====
async function sendVerificationCode() {
  const emailInput = document.getElementById('onboard-email-input');
  const email = emailInput?.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showEmailError('Please enter a valid email address'); return;
  }
  onboardData.email = email;

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  // Store code temporarily in localStorage (will be saved to DB with family record)
  localStorage.setItem('novara_verify_code', code);
  localStorage.setItem('novara_verify_expires', expires);

  // Send email via Cloudflare Worker
  try {
    const btn = document.getElementById('send-code-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    await fetch(NOVARA.workerUrl + 'email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'verify',
        to: email,
        code,
        childName: onboardData.childName,
      })
    });

    if (btn) { btn.disabled = false; btn.textContent = 'Resend code'; }
    showScreen('onboard-verify');
    document.getElementById('verify-email-display').textContent = email;
  } catch(e) {
    // If email sending fails, still allow proceeding (email is best-effort at MVP)
    if (document.getElementById('send-code-btn')) {
      document.getElementById('send-code-btn').disabled = false;
      document.getElementById('send-code-btn').textContent = 'Send code';
    }
    showScreen('onboard-verify');
    document.getElementById('verify-email-display').textContent = email;
    console.warn('Email send failed (non-blocking):', e.message);
  }
}

function verifyCode() {
  const entered = document.getElementById('onboard-verify-input')?.value.trim();
  const stored = localStorage.getItem('novara_verify_code');
  const expires = localStorage.getItem('novara_verify_expires');

  if (!stored) { showVerifyError('Code expired. Please go back and resend.'); return; }
  if (new Date() > new Date(expires)) { showVerifyError('Code expired. Please go back and resend.'); return; }
  if (entered !== stored) { showVerifyError('Incorrect code. Please try again.'); return; }

  // Clear temp storage
  localStorage.removeItem('novara_verify_code');
  localStorage.removeItem('novara_verify_expires');

  completeOnboarding();
}

function skipVerification() {
  // Email must be entered — skip only bypasses the code check, not the email itself
  const email = document.getElementById('onboard-email-input')?.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // They're on the verify screen — go back and force email entry
    showScreen('onboard-email');
    showEmailError('Please enter a valid email address before continuing.');
    return;
  }
  onboardData.email = email;
  completeOnboarding();
}

function showEmailError(msg) {
  const el = document.getElementById('onboard-email-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showVerifyError(msg) {
  const el = document.getElementById('onboard-verify-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function completeOnboarding() {
  const btn = document.getElementById('onboard-finish-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Setting up…'; }
  try {
    const today = new Date().toISOString().split('T')[0];
    const nickname = generateNickname();

    // 1. Create family
    let families;
    try {
      families = await db.insert('families', {
        pin_hash: onboardData.pin,
        email: onboardData.email || null,
        email_verified: false,
        trial_start_date: today,
        is_paid: false,
        trial_plan_used: false,
        nickname,
        consent_agreed_at: new Date().toISOString(),
        consent_version: '1.0',
      });
    } catch(insertErr) {
      if (insertErr.message.includes('23505') || insertErr.message.includes('duplicate')) {
        // Email already registered — tell the parent clearly
        if (btn) { btn.disabled = false; btn.textContent = 'Start journey'; }
        showScreen('onboard-email');
        showEmailError('This email already has a Novara account. Please use a different email, or go back to log in with your existing PIN.');
        return;
      }
      throw insertErr;
    }
    const family = Array.isArray(families) ? families[0] : families;
    const familyId = family.id;

    // 2. Create child
    const children = await db.insert('children', {
      family_id: familyId,
      name: onboardData.childName,
      date_of_birth: onboardData.dob,
    });
    const child = Array.isArray(children) ? children[0] : children;
    const childId = child.id;

    // 3. Save languages
    for (const lang of onboardData.languages) {
      await db.insert('child_languages', { child_id: childId, ...lang });
    }

    // 4. Save location
    if (onboardData.location) {
      await db.insert('child_locations', { child_id: childId, ...onboardData.location });
    }

    // 5. Save parents
    await db.insert('parents', { family_id: familyId, display_name: onboardData.parent1 });
    await db.insert('parents', { family_id: familyId, display_name: onboardData.parent2 });

    // 6. Init stats
    await db.insert('child_stats', { child_id: childId, start_date: today });

    // 7. Init domain progress
    for (const d of NOVARA.domains) {
      await db.insert('domain_progress', { child_id: childId, domain: d.id, pct: 0, last_activity: 'Not started yet' });
    }

    // 8. Register device
    await registerDevice(familyId);

    // 9. Save session
    session.familyId = familyId;
    session.childId = childId;
    session.pinVerified = true;
    session.trialStartDate = today;
    session.isPaid = NOVARA.devMode ? true : false;
    session.trialPlanUsed = false;
    session.nickname = nickname;
    session.consentAgreed = true;
    saveSession();

    // 10. Load data then show availability check before home
    await loadChildData();
    showWeeklyAvailabilityCheck();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Start journey'; }
    alert('Setup error: ' + e.message);
  }
}

// ===== PIN SCREEN =====
function renderPinScreen() {
  const wrap = document.getElementById('pin-avatar-wrap');
  if (wrap && session.child) {
    wrap.innerHTML = session.child.avatar_url
      ? `<img src="${session.child.avatar_url}" style="width:80px;height:80px;border-radius:50%;object-fit:cover" />`
      : `<div style="font-size:32px">${(session.child.name || 'N').charAt(0)}</div>`;
  }
}

async function submitPIN() {
  const entered = document.getElementById('pin-input').value;
  try {
    const families = await db.select('families', `?id=eq.${session.familyId}`);
    const family = families?.[0];
    if (!family) { showPinError('Family not found'); return; }
    if (entered !== family.pin_hash) {
      showPinError('Incorrect PIN. Try again.');
      document.getElementById('pin-input').value = '';
      return;
    }
    // Check device authorisation
    const deviceCheck = await registerDevice(session.familyId);
    if (!deviceCheck.allowed) {
      showDeviceLimitModal(deviceCheck.devices);
      return;
    }
    session.pinVerified = true;
    session.trialStartDate = family.trial_start_date;
    session.isPaid = NOVARA.devMode ? true : (family.is_paid || false);
    session.trialPlanUsed = NOVARA.devMode ? false : (family.trial_plan_used || false);
    session.nickname = family.nickname || generateNickname();
    session.consentAgreed = !!family.consent_agreed_at;
    document.getElementById('pin-input').value = '';
    await loadChildData();

    // Check if availability confirmed for this week
    const hasAvail = await db.select('weekly_availability',
      `?family_id=eq.${session.familyId}&week_number=eq.${session.weekNumber}`);
    if (!hasAvail || hasAvail.length === 0) {
      showWeeklyAvailabilityCheck();
    } else {
      session.weekAvailability = hasAvail[0];
      saveSession();
      showScreen('home');
    }
  } catch(e) {
    showPinError('Error: ' + e.message);
  }
}

function showPinError(msg) {
  const el = document.getElementById('pin-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ===== DEVICE LIMIT MODAL =====
function showDeviceLimitModal(devices) {
  const modal = document.getElementById('modal-device-limit');
  const list = document.getElementById('device-list');
  if (list) {
    list.innerHTML = (devices || []).map(d => `
      <div class="device-item">
        <i class="ti ti-device-mobile"></i>
        <span>${d.device_name || 'Unknown device'}</span>
        <span class="device-date">${formatDate(d.last_seen_at)}</span>
      </div>`).join('');
  }
  if (modal) modal.style.display = 'flex';
}

async function removeThisDevice() {
  try {
    await resetDevice(session.familyId);
    closeModal('modal-device-limit');
    alert('Device removed. Please log in again to register this device.');
    location.reload();
  } catch(e) { alert('Error: ' + e.message); }
}

// ===== WEEKLY AVAILABILITY CHECK =====
// Shown before plan generation each week — once per week only
function showWeeklyAvailabilityCheck() {
  showScreen('onboard-availability');
  renderWeeklyAvailabilityUI();
}

// Current week's availability being built
let weekAvailDraft = {
  monday:    { available: false, time_slot: null },
  tuesday:   { available: false, time_slot: null },
  wednesday: { available: false, time_slot: null },
  thursday:  { available: false, time_slot: null },
  friday:    { available: false, time_slot: null },
  saturday:  { available: true,  time_slot: 'morning' },
  sunday:    { available: true,  time_slot: 'morning' },
};

function renderWeeklyAvailabilityUI() {
  const el = document.getElementById('weekly-avail-grid');
  if (!el) return;

  // Pre-fill from last week's confirmed availability if exists
  const prev = session.weekAvailability;
  if (prev) {
    ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].forEach(day => {
      if (prev[day]) weekAvailDraft[day] = { ...prev[day] };
    });
  }

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];
  const slots = ['morning','afternoon','evening'];

  el.innerHTML = days.map(day => {
    const d = weekAvailDraft[day.key];
    return `
      <div class="avail-day-card" id="avail-card-${day.key}">
        <div class="avail-day-header">
          <label class="avail-toggle-label">
            <input type="checkbox" class="avail-day-check" ${d.available ? 'checked' : ''}
              onchange="toggleWeekDay('${day.key}', this.checked)" />
            <span class="avail-day-name">${day.label}</span>
          </label>
        </div>
        <div class="avail-slot-row ${d.available ? '' : 'avail-hidden'}" id="avail-slots-${day.key}">
          ${slots.map(slot => `
            <label class="avail-slot-pill ${d.time_slot === slot ? 'selected' : ''}">
              <input type="radio" name="slot-${day.key}" value="${slot}" ${d.time_slot === slot ? 'checked' : ''}
                onchange="selectWeekSlot('${day.key}', '${slot}')" />
              ${slot.charAt(0).toUpperCase() + slot.slice(1)}
            </label>`).join('')}
        </div>
      </div>`;
  }).join('');

  // Update week label
  const wkLabel = document.getElementById('avail-week-label');
  if (wkLabel) wkLabel.textContent = `Week ${session.weekNumber}`;
}

function toggleWeekDay(day, checked) {
  weekAvailDraft[day].available = checked;
  // Auto-set default slot if none chosen
  if (checked && !weekAvailDraft[day].time_slot) {
    weekAvailDraft[day].time_slot = ['saturday','sunday'].includes(day) ? 'morning' : 'evening';
  }
  const slotsEl = document.getElementById(`avail-slots-${day}`);
  if (slotsEl) slotsEl.classList.toggle('avail-hidden', !checked);
  renderWeeklyAvailabilityUI();
}

function selectWeekSlot(day, slot) {
  weekAvailDraft[day].time_slot = slot;
  // Update pill styling immediately
  document.querySelectorAll(`[name="slot-${day}"]`).forEach(r => {
    r.closest('label').classList.toggle('selected', r.value === slot);
  });
}

async function confirmWeeklyAvailability() {
  const btn = document.getElementById('confirm-avail-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    const record = {
      family_id: session.familyId,
      week_number: session.weekNumber,
      ...weekAvailDraft,
    };
    await db.upsert('weekly_availability', record);
    session.weekAvailability = record;
    saveSession();
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm & continue'; }
    showScreen('home');
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm & continue'; }
    alert('Error saving availability: ' + e.message);
  }
}

// ===== LOAD CHILD DATA =====
async function loadChildData() {
  if (!session.childId) return;
  try {
    const [children, languages, locations, parents, stats, domains] = await Promise.all([
      db.select('children', `?id=eq.${session.childId}`),
      db.select('child_languages', `?child_id=eq.${session.childId}`),
      db.select('child_locations', `?child_id=eq.${session.childId}`),
      db.select('parents', `?family_id=eq.${session.familyId}`),
      db.select('child_stats', `?child_id=eq.${session.childId}`),
      db.select('domain_progress', `?child_id=eq.${session.childId}&order=domain.asc`),
    ]);

    session.child = children?.[0] || null;
    session.languages = languages || [];
    session.location = locations?.[0] || null;
    session.parents = parents || [];

    const s = stats?.[0];
    if (s) {
      const { week, ageMonths } = computeWeek(s.start_date, session.child.date_of_birth);
      session.weekNumber = week;
      session.ageMonths = ageMonths;
      session.stats = {
        words: s.words_signs || 0,
        streak: s.streak || 0,
        milestones: s.total_milestones || 0,
        done: 0,
      };
    }

    // ── BUG FIX: Always load domain progress fresh from DB ──
    if (domains && domains.length > 0) {
      session.domains = domains.map(d => {
        const meta = NOVARA.domains.find(x => x.id === d.domain) || NOVARA.domains[0];
        return { ...meta, pct: d.pct || 0, last: d.last_activity || 'Not started yet' };
      });
    } else {
      session.domains = NOVARA.domains.map(d => ({ ...d, pct: 0, last: 'Not started yet' }));
    }

    // Always load plan fresh from DB — order by id desc to get most recent row
    // (guards against duplicate rows before unique constraint was added)
    const plans = await db.select('weekly_plans',
      `?child_id=eq.${session.childId}&week_number=eq.${session.weekNumber}&order=id.desc&limit=1`);
    if (plans?.[0]) {
      session.plan = plans[0].activities || [];
    } else {
      session.plan = [];
    }

    // Recalculate done count from actual activity statuses in DB
    session.stats.done = session.plan.filter(a => a.status === 'done').length;
    saveSession();
  } catch(e) {
    console.error('loadChildData error:', e);
  }
}

async function loadAndShowHome() {
  await loadChildData();
  // Check if availability confirmed for this week
  if (session.familyId && session.weekNumber) {
    const hasAvail = await db.select('weekly_availability',
      `?family_id=eq.${session.familyId}&week_number=eq.${session.weekNumber}`);
    if (!hasAvail || hasAvail.length === 0) {
      showWeeklyAvailabilityCheck();
      return;
    }
    session.weekAvailability = hasAvail[0];
    saveSession();
  }
  showScreen('home');
}

// ===== HOME =====
function renderHome() {
  if (!session.child) return;
  const childName = session.child.name;
  const el = n => document.getElementById(n);

  el('home-child-name') && (el('home-child-name').textContent = `${childName} 💝`);
  el('home-meta') && (el('home-meta').textContent = `Age ${session.ageMonths} months · Week ${session.weekNumber} of 52`);
  el('stat-done') && (el('stat-done').textContent = session.stats.done);
  el('stat-milestones') && (el('stat-milestones').textContent = session.stats.milestones);
  el('stat-words') && (el('stat-words').textContent = session.stats.words);
  el('stat-streak') && (el('stat-streak').textContent = session.stats.streak);

  const avatarEl = el('home-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = session.child.avatar_url
      ? `<img src="${session.child.avatar_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:1.5px solid #7FDBF0" />`
      : `<div class="avatar">${childName.charAt(0)}</div>`;
  }

  const langEl = el('lang-pills-row');
  if (langEl) {
    const colors = ['#E0F7FA|#0E7490','#FEF3C7|#B45309','#F0FDF4|#065F46','#F5F3FF|#5B21B6','#FDF2F8|#9D174D','#FFF7ED|#C2410C'];
    langEl.innerHTML = session.languages.slice(0, 6).map((l, i) => {
      const [bg, color] = colors[i % colors.length].split('|');
      return `<span class="lang-pill" style="background:${bg};color:${color}">${l.language}</span>`;
    }).join('');
  }

  renderDomains('domain-list');
  renderRecentMilestones();
}

function renderDomains(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = session.domains.map(d => `
    <div class="domain-item">
      <div class="domain-icon" style="background:${d.bg}"><i class="ti ${d.icon}" style="color:${d.color}"></i></div>
      <div class="domain-info">
        <div class="domain-name">${d.name}</div>
        <div class="domain-last">${d.last}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
      </div>
      <div class="domain-pct" style="color:${d.color}">${d.pct}%</div>
    </div>
  `).join('');
}

async function renderRecentMilestones() {
  const el = document.getElementById('milestone-list');
  if (!el) return;
  try {
    const milestones = await db.select('milestones', `?child_id=eq.${session.childId}&order=logged_at.desc&limit=3`);
    if (!milestones || milestones.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="ti ti-stars"></i><p>No milestones yet.<br>Generate a plan and start tracking!</p></div>`;
      return;
    }
    el.innerHTML = milestones.map(m => {
      const d = session.domains.find(x => x.id === m.domain) || session.domains[0];
      return `
        <div class="milestone-card">
          <div class="ms-dot" style="background:${d?.color || '#0E7490'}"></div>
          <div>
            <div class="ms-title">${m.title}</div>
            <div class="ms-meta">${d?.name} · ${formatDate(m.logged_at)} · ${m.parent_name}</div>
            <span class="ms-badge" style="background:${d?.bg};color:${d?.color}">${d?.name}</span>
          </div>
        </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

// ===== PLAN =====
let currentActivity = null;

async function generatePlan() {
  // Trial gate: only allow generating 1 week
  if (!isTrialActive()) { showTrialExpiredOverlay(); return; }

  // Check if plan already exists and is locked
  const existing = await db.select('weekly_plans',
    `?child_id=eq.${session.childId}&week_number=eq.${session.weekNumber}`);
  if (existing?.[0]) {
    session.plan = existing[0].activities;
    saveSession();
    renderPlan();
    return;
  }

  // Ensure availability confirmed for this week — always read fresh from DB
  let freshAvail = null;
  try {
    const availRows = await db.select('weekly_availability',
      `?family_id=eq.${session.familyId}&week_number=eq.${session.weekNumber}`);
    freshAvail = availRows?.[0] || null;
  } catch(e) { console.warn('Could not load availability:', e); }

  if (!freshAvail) {
    showWeeklyAvailabilityCheck();
    return;
  }
  session.weekAvailability = freshAvail;
  saveSession();

  document.getElementById('plan-empty').style.display = 'none';
  document.getElementById('plan-list').innerHTML = '';
  document.getElementById('plan-loading').style.display = 'flex';

  const childName = session.child?.name || 'the child';
  const homeLangs = session.languages.filter(l => l.context === 'home').map(l => l.language).join(', ') || 'English';
  const schoolLangs = session.languages.filter(l => l.context === 'school').map(l => l.language).join(', ') || 'not specified';
  const city = session.location?.city || 'their city';
  const country = session.location?.country || 'their country';
  const parent1 = session.parents[0]?.display_name || 'Parent 1';
  const parent2 = session.parents[1]?.display_name || 'Parent 2';
  const week = session.weekNumber;
  const ageMonths = session.ageMonths;
  const devContext = getDevelopmentalContext(ageMonths);
  const availContext = buildAvailabilityContext();

  // ── E-commerce localisation by country ──
  const shopLink = getShopLink(country);

  const prompt = `You are a world-class child development expert creating a personalised weekly activity plan.

CHILD PROFILE:
- Name: ${childName}
- Age: ${ageMonths} months (Week ${week} of their development programme)
- Location: ${city}, ${country}
- Home languages: ${homeLangs}
- School/community languages: ${schoolLangs}
- Parents: ${parent1} and ${parent2} (both working professionals)

DEVELOPMENTAL STAGE (${ageMonths} months):
${devContext}

PARENT AVAILABILITY THIS WEEK (STRICT — only schedule on these days/slots):
${availContext}

Generate exactly 5 activities ONLY on the available days and time slots listed above.
Match duration to slot: evening = 10-15 mins, morning or afternoon = 20-30 mins.

Return ONLY a valid JSON array:
[
  {
    "day": "Monday Evening"|"Tuesday Evening"|"Wednesday Evening"|"Thursday Evening"|"Friday Evening"|"Saturday Morning"|"Saturday Afternoon"|"Sunday Morning"|"Sunday Afternoon",
    "title": "Activity name",
    "domain": "cognitive"|"language"|"emotional"|"physical"|"creativity"|"social"|"cultural",
    "duration": "10-15 mins"|"20-30 mins",
    "emoji": "single emoji",
    "description": "Exactly what ${parent1} or ${parent2} does with ${childName} — specific, practical, 2 sentences.",
    "language": "${homeLangs.split(',')[0].trim()}"|"${schoolLangs.split(',')[0].trim()}"|"All",
    "tip": "One tip for tired working parents",
    "platformLink": "https://... (real working URL)",
    "platformName": "Resource name",
    "materials": [{"name": "item", "link": "${shopLink}", "required": true}]
  }
]

RULES:
- ONLY schedule on days/slots listed in PARENT AVAILABILITY above
- Cover at least 5 different domains
- Include at least 1 activity in each home language
- Include 1 sign language or gesture activity
- Weekend activities use local ${city} venues or parks where relevant
- Materials links must use: ${shopLink}
- All activities age-appropriate for ${ageMonths} months`;

  try {
    const response = await fetch(NOVARA.workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    const text = data.content.map(b => b.text || '').join('');
    const start = text.indexOf('['), end = text.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array in response');
    const activities = JSON.parse(text.substring(start, end + 1));
    session.plan = activities.map((a, i) => ({ ...a, id: i, status: 'pending' }));

    await db.upsert('weekly_plans', {
      child_id: session.childId,
      week_number: week,
      age_months: ageMonths,
      activities: session.plan,
    });

    // Mark trial plan as used for non-paid users — never in devMode
    if (!NOVARA.devMode && !session.isPaid) {
      await db.update('families', { trial_plan_used: true }, `?id=eq.${session.familyId}`);
      session.trialPlanUsed = true;
    }

    saveSession();
    renderPlan();
  } catch(e) {
    document.getElementById('plan-loading').style.display = 'none';
    document.getElementById('plan-empty').style.display = 'flex';
    document.getElementById('plan-empty').innerHTML = `
      <i class="ti ti-alert-circle" style="color:#F97316"></i>
      <p>Couldn't generate plan.<br><small>${e.message}</small></p>
      <button class="btn-primary" style="margin-top:16px" onclick="generatePlan()"><i class="ti ti-refresh"></i> Try again</button>`;
  }
}

// ── E-commerce localisation ──
function getShopLink(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('nigeria') || c.includes('ghana') || c.includes('kenya') ||
      c.includes('senegal') || c.includes('tanzania') || c.includes('uganda') ||
      c.includes('ethiopia') || c.includes('ivory') || c.includes('cameroon')) {
    return 'https://www.jumia.com/';
  }
  if (c.includes('india')) return 'https://www.flipkart.com/search?q=';
  if (c.includes('germany') || c.includes('deutschland') || c.includes('austria')) return 'https://www.amazon.de/s?k=';
  if (c.includes('france')) return 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=';
  if (c.includes('spain') || c.includes('españa')) return 'https://www.amazon.es/s?k=';
  if (c.includes('netherlands') || c.includes('belgium')) return 'https://www.bol.com/nl/nl/s/?searchtext=';
  if (c.includes('brazil') || c.includes('brasil')) return 'https://www.amazon.com.br/s?k=';
  if (c.includes('canada')) return 'https://www.amazon.ca/s?k=';
  if (c.includes('australia')) return 'https://www.amazon.com.au/s?k=';
  if (c.includes('united states') || c.includes('usa')) return 'https://www.amazon.com/s?k=';
  if (c.includes('japan')) return 'https://www.amazon.co.jp/s?k=';
  if (c.includes('china')) return 'https://www.jd.com/search?keyword=';
  if (c.includes('south africa')) return 'https://www.takealot.com/all?_sb=1&_searchString=';
  // Default UK/Ireland/rest of world
  return 'https://www.amazon.co.uk/s?k=';
}

function buildAvailabilityContext() {
  const avail = session.weekAvailability;
  if (!avail) return 'Weekday evenings (10-15 mins) + Saturday and Sunday mornings (20-30 mins)';

  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const dayNames = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday',
                     thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

  const lines = [];
  days.forEach(day => {
    const d = avail[day];
    if (d?.available && d.time_slot) {
      const label = day === 'monday' || day === 'tuesday' || day === 'wednesday' ||
                    day === 'thursday' || day === 'friday'
        ? `${dayNames[day]} ${d.time_slot}` : `${dayNames[day]} ${d.time_slot}`;
      lines.push(`- ${label}`);
    }
  });
  return lines.length > 0 ? lines.join('\n') : 'Weekday evenings + weekends';
}

function getDevelopmentalContext(ageMonths) {
  if (ageMonths < 6)  return `Pre-verbal stage. Focus: sensory exploration, face recognition, cause-effect, tummy time, auditory stimulation.`;
  if (ageMonths < 9)  return `Early communication. Focus: babbling, object permanence, sitting support, reach and grasp.`;
  if (ageMonths < 12) return `Active explorer. Focus: crawling, pulling to stand, pincer grasp, first words emerging.`;
  if (ageMonths < 15) return `New walker. Focus: first independent steps, first words (5-10), stacking, imitation.`;
  if (ageMonths < 18) return `Language foundation. Focus: vocabulary building (10-20 words), shape sorting, climbing.`;
  if (ageMonths < 21) return `Communication explosion. Focus: 20-50 words, 2-word phrases, pretend play begins.`;
  if (ageMonths < 24) return `Builder stage. Focus: 50+ words, 2-3 word sentences, counting 1-3, cooperative play.`;
  if (ageMonths < 30) return `Thinker stage. Focus: 200+ words, simple sentences, pre-numeracy 1-5, imaginative play.`;
  if (ageMonths < 36) return `Pre-school prep. Focus: complex sentences, counting 1-10, letter recognition.`;
  if (ageMonths < 48) return `Early literacy. Focus: letter-sound connections, number operations, reading readiness.`;
  return `Advanced pre-school. Focus: reading foundations, maths concepts, complex reasoning.`;
}

function renderPlan() {
  document.getElementById('plan-loading').style.display = 'none';

  if (!session.plan || session.plan.length === 0) {
    document.getElementById('plan-empty').style.display = 'flex';
    document.getElementById('plan-list').innerHTML = '';
    return;
  }

  document.getElementById('plan-empty').style.display = 'none';
  document.getElementById('plan-week-label').textContent = `Week ${session.weekNumber} · Age ${session.ageMonths} months`;

  const grouped = {};
  session.plan.forEach(a => { if (!grouped[a.day]) grouped[a.day] = []; grouped[a.day].push(a); });
  const order = ['Monday Evening','Tuesday Evening','Wednesday Evening','Thursday Evening','Friday Evening',
                 'Saturday Morning','Saturday Afternoon','Sunday Morning','Sunday Afternoon','Saturday','Sunday'];
  const days = order.filter(d => grouped[d]);

  let html = '';
  days.forEach(day => {
    html += `<div class="plan-day"><div class="plan-day-label">${day}</div>`;
    grouped[day].forEach(act => {
      const dom = session.domains.find(d => d.id === act.domain) || session.domains[0];
      const statusIcon = act.status === 'done' ? '✅' : act.status === 'skipped' ? '⏭️' : '';
      html += `
        <div class="plan-card ${act.status}" onclick="openActivity(${act.id})">
          <div class="plan-card-top">
            <div class="plan-card-icon">${act.emoji || '⭐'}</div>
            <div class="plan-card-info">
              <div class="plan-card-title">${act.title}</div>
              <div class="plan-card-domain">${dom?.name} · ${act.duration} · ${act.language}</div>
            </div>
          </div>
          <div class="plan-card-desc">${act.description}</div>
          <div class="plan-card-tags">
            <span class="tag" style="background:${dom?.bg};color:${dom?.color}">${dom?.name}</span>
            <span class="tag" style="background:#E0F7FA;color:#0E7490">${act.language}</span>
          </div>
          ${act.status === 'pending' ? `
          <div class="plan-card-actions" onclick="event.stopPropagation()">
            <button class="act-btn done-btn" onclick="quickMark(${act.id},'done')"><i class="ti ti-check"></i> Done</button>
            <button class="act-btn skip-btn" onclick="quickMark(${act.id},'skipped')"><i class="ti ti-x"></i> Skip</button>
            <button class="act-btn ms-btn" onclick="openMilestoneFromActivity(${act.id})"><i class="ti ti-star"></i> Milestone</button>
          </div>` : `<div class="plan-card-status">${statusIcon}</div>`}
        </div>`;
    });
    html += `</div>`;
  });
  document.getElementById('plan-list').innerHTML = html;
}

function openActivity(id) {
  const act = session.plan.find(a => a.id === id);
  if (!act) return;
  currentActivity = act;
  const dom = session.domains.find(d => d.id === act.domain) || session.domains[0];
  document.getElementById('act-modal-title').textContent = act.title;

  // Start timer if activity is pending and not yet started
  if (act.status === 'pending' && !act.timer_started_at) {
    act.timer_started_at = Date.now();
    // Save timer start to DB immediately
    savePlanToDB().catch(() => {});
    saveSession();
  }

  let mats = '';
  if (act.materials?.length > 0) {
    mats = `<div class="act-detail-section"><h4>Materials</h4><ul class="act-materials-list">${act.materials.map(m =>
      `<li>🛒 ${m.name} ${m.required ? '<span style="color:#F97316;font-size:10px">Required</span>' : ''} <a href="${m.link}" target="_blank">Buy →</a></li>`
    ).join('')}</ul></div>`;
  }

  // Timer display
  const required = getRequiredSeconds(act.duration);
  const elapsed  = act.timer_started_at ? Math.floor((Date.now() - act.timer_started_at) / 1000) : 0;
  const remaining = Math.max(0, required - elapsed);
  const timerHtml = act.status === 'pending' ? `
    <div class="act-timer-section" id="act-timer-wrap">
      <div class="act-timer-label">Time with this activity</div>
      <div class="act-timer-display" id="act-timer-display">${formatTimer(remaining)}</div>
      <div class="act-timer-sub">${remaining > 0 ? `Spend ${formatTimer(remaining)} more to mark Done` : '✅ Minimum time reached — you can mark this Done!'}</div>
    </div>` : '';

  // Marked by display
  const markedByHtml = act.status === 'done'
    ? `<div class="act-marked-by"><i class="ti ti-check-circle" style="color:#10B981"></i> Completed by <strong>${act.marked_by || 'Parent'}</strong></div>`
    : act.status === 'skipped'
    ? `<div class="act-marked-by"><i class="ti ti-circle-off" style="color:#94A3B8"></i> Skipped by <strong>${act.marked_by || 'Parent'}</strong></div>`
    : '';

  document.getElementById('act-modal-body').innerHTML = `
    ${markedByHtml}
    ${timerHtml}
    <div class="act-detail-section"><h4>What to do</h4><p>${act.description}</p></div>
    <div class="act-detail-section"><h4>Parent tip</h4><p>${act.tip || 'Follow their lead and keep it joyful!'}</p></div>
    <div class="act-detail-section"><h4>Domain</h4><span class="tag" style="background:${dom?.bg};color:${dom?.color};font-size:13px;padding:4px 12px">${dom?.name}</span></div>
    ${act.platformLink ? `<div class="act-detail-section"><h4>Resource</h4><div class="act-link-row"><i class="ti ti-external-link"></i><a href="${act.platformLink}" target="_blank">${act.platformName || act.platformLink}</a></div></div>` : ''}
    ${mats}`;

  document.getElementById('modal-activity').style.display = 'flex';

  // Start live countdown if pending
  if (act.status === 'pending') startActivityCountdown(id);
}

let countdownInterval = null;

function startActivityCountdown(id) {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const act = session.plan.find(a => a.id === id);
    if (!act || act.status !== 'pending') { clearInterval(countdownInterval); return; }
    const required  = getRequiredSeconds(act.duration);
    const elapsed   = act.timer_started_at ? Math.floor((Date.now() - act.timer_started_at) / 1000) : 0;
    const remaining = Math.max(0, required - elapsed);
    const display   = document.getElementById('act-timer-display');
    const sub       = document.querySelector('#act-timer-wrap .act-timer-sub');
    const doneBtn   = document.getElementById('act-modal-done-btn');
    if (display) display.textContent = formatTimer(remaining);
    if (sub) sub.textContent = remaining > 0
      ? `Spend ${formatTimer(remaining)} more to mark Done`
      : '✅ Minimum time reached — you can mark this Done!';
    // Enable/disable Done button based on timer
    if (doneBtn) {
      doneBtn.disabled = remaining > 0;
      doneBtn.style.opacity = remaining > 0 ? '0.5' : '1';
    }
    if (remaining === 0) clearInterval(countdownInterval);
  }, 1000);
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function markActivity(status) {
  if (!currentActivity) return;
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  quickMark(currentActivity.id, status);
  closeModal('modal-activity');
}

async function quickMark(id, status) {
  const act = session.plan.find(a => a.id === id);
  if (!act || act.status !== 'pending') return;

  // ── Double-mark protection: verify from DB before proceeding ──
  // Prevents second parent marking an activity already done by first parent
  const freshPlans = await db.select('weekly_plans',
    `?child_id=eq.${session.childId}&week_number=eq.${session.weekNumber}&order=id.desc&limit=1`);
  if (freshPlans?.[0]) {
    const freshAct = (freshPlans[0].activities || []).find(a => a.id === id);
    if (freshAct && freshAct.status !== 'pending') {
      // Already marked by the other parent — sync session and re-render
      session.plan = freshPlans[0].activities;
      session.stats.done = session.plan.filter(a => a.status === 'done').length;
      saveSession();
      renderPlan();
      renderHome();
      alert(`This activity was already marked as "${freshAct.status}" by ${freshAct.marked_by || 'your co-parent'}.`);
      return;
    }
    // Sync latest plan from DB before marking
    session.plan = freshPlans[0].activities;
    const syncedAct = session.plan.find(a => a.id === id);
    if (!syncedAct || syncedAct.status !== 'pending') return;
  }

  // Work with the freshly synced activity
  const freshAct2 = session.plan.find(a => a.id === id);
  if (!freshAct2) return;

  // ── Timer check for 'done' — must have spent 50% of duration ──
  if (status === 'done') {
    const elapsed = freshAct2.timer_started_at
      ? Math.floor((Date.now() - freshAct2.timer_started_at) / 1000)
      : 0;
    const required = getRequiredSeconds(freshAct2.duration);
    if (elapsed < required) {
      const remaining = Math.ceil((required - elapsed) / 60);
      alert(`Keep going! Spend at least ${remaining} more minute${remaining !== 1 ? 's' : ''} on this activity before marking it done.`);
      return;
    }
  }

  const markedBy = session.parents[0]?.display_name || 'Parent';
  freshAct2.status   = status;
  freshAct2.marked_by  = markedBy;
  freshAct2.marked_at  = new Date().toISOString();

  if (status === 'done') {
    session.stats.done++;
    const dom = session.domains.find(d => d.id === freshAct2.domain);
    if (dom) { dom.pct = Math.min(100, dom.pct + 14); dom.last = freshAct2.title; }
    session.stats.streak++;
    await db.update('domain_progress',
      { pct: dom?.pct || 0, last_activity: freshAct2.title },
      `?child_id=eq.${session.childId}&domain=eq.${freshAct2.domain}`
    );
    await db.update('child_stats',
      { streak: session.stats.streak },
      `?child_id=eq.${session.childId}`
    );
    // Update leaderboard score
    await updateLeaderboard();
  }

  await savePlanToDB();
  saveSession();
  renderPlan();
  renderHome();
}

function getRequiredSeconds(duration) {
  // 50% of stated duration
  if (!duration) return 0;
  const match = duration.match(/(\d+)/);
  if (!match) return 0;
  const mins = parseInt(match[1]);
  return Math.floor(mins * 0.5 * 60); // 50% of lower bound in seconds
}

// ── PLAN PERSISTENCE HELPER ──────────────────────────────────────────────
// Always uses UPDATE with explicit filter — never upsert which can insert
// a duplicate row if the unique constraint is missing, causing stale loads.
async function savePlanToDB() {
  await db.update(
    'weekly_plans',
    { activities: session.plan },
    `?child_id=eq.${session.childId}&week_number=eq.${session.weekNumber}`
  );
}

function openMilestoneFromActivity(id) {
  const act = session.plan.find(a => a.id === id);
  if (act) {
    document.getElementById('ms-title').value = act.title;
    document.getElementById('ms-domain').value = act.domain;
  }
  populateParentSelects();
  document.getElementById('modal-milestone').style.display = 'flex';
}

// ===== MILESTONES =====
async function saveMilestone() {
  const title = document.getElementById('ms-title').value.trim();
  if (!title) { alert('Please add a milestone title'); return; }
  try {
    await db.insert('milestones', {
      child_id: session.childId,
      title,
      domain: document.getElementById('ms-domain').value,
      parent_name: document.getElementById('ms-parent').value,
      notes: document.getElementById('ms-notes').value.trim(),
    });
    session.stats.milestones++;
    await db.update('child_stats', { total_milestones: session.stats.milestones }, `?child_id=eq.${session.childId}`);
    saveSession();
    closeModal('modal-milestone');
    document.getElementById('ms-title').value = '';
    document.getElementById('ms-notes').value = '';
    renderHome();
  } catch(e) { alert('Error: ' + e.message); }
}

// ===== MOMENTS =====
function openAddMoment() {
  populateParentSelects();
  document.getElementById('modal-moment').style.display = 'flex';
}

async function saveMoment() {
  const caption = document.getElementById('moment-caption').value.trim();
  if (!caption) { alert('Please add a caption'); return; }
  const file = document.getElementById('moment-photo').files[0];
  const save = async (photoData) => {
    try {
      await db.insert('moments', {
        child_id: session.childId,
        caption,
        note: document.getElementById('moment-note').value.trim(),
        parent_name: document.getElementById('moment-parent').value,
        photo_url: photoData || null,
      });
      closeModal('modal-moment');
      document.getElementById('moment-caption').value = '';
      document.getElementById('moment-note').value = '';
      document.getElementById('moment-photo').value = '';
      renderMoments();
    } catch(e) { alert('Error: ' + e.message); }
  };
  if (file) {
    const reader = new FileReader();
    reader.onload = e => save(e.target.result);
    reader.readAsDataURL(file);
  } else { save(null); }
}

async function renderMoments() {
  const grid = document.getElementById('moments-grid');
  const empty = document.getElementById('moments-empty');
  try {
    const moments = await db.select('moments', `?child_id=eq.${session.childId}&order=logged_at.desc`);
    if (!moments || moments.length === 0) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
    empty.style.display = 'none';
    const emojis = ['🌟','💝','🎉','✨','🌈','🦋','🌸','🎈'];
    grid.innerHTML = moments.map((m, i) => `
      <div class="moment-card">
        ${m.photo_url ? `<img src="${m.photo_url}" class="moment-img" alt="${m.caption}" />` : `<div class="moment-img">${emojis[i % emojis.length]}</div>`}
        <div class="moment-body">
          <div class="moment-caption">${m.caption}</div>
          <div class="moment-meta">${m.parent_name} · ${formatDate(m.logged_at)}</div>
          ${m.note ? `<div class="moment-meta" style="margin-top:3px;font-style:italic">${m.note}</div>` : ''}
        </div>
      </div>`).join('');
  } catch(e) { console.error(e); }
}

// ===== PROGRESS =====
async function renderProgress() {
  const el = document.getElementById('progress-domains');
  if (el) {
    el.innerHTML = session.domains.map(d => `
      <div class="prog-domain">
        <div class="prog-domain-header">
          <div class="prog-domain-name"><i class="ti ${d.icon}" style="color:${d.color}"></i> ${d.name}</div>
          <div class="prog-domain-pct" style="color:${d.color}">${d.pct}%</div>
        </div>
        <div class="progress-bar" style="height:6px">
          <div class="progress-fill" style="width:${d.pct}%;background:${d.color}"></div>
        </div>
      </div>`).join('');
  }
  try {
    const history = await db.select('week_history',
      `?child_id=eq.${session.childId}&order=week_number.desc&limit=4`);

    // Trial: only show current week if not paid
    const weeks = canSeeFullHistory() && history?.length > 0
      ? history.reverse()
      : [{ week_number: session.weekNumber, done: session.stats.done, total: 5 }];

    const max = Math.max(...weeks.map(w => w.total), 1);
    const chartEl = document.getElementById('completion-chart');
    if (chartEl) {
      chartEl.innerHTML = `<div class="bar-chart">${weeks.map(w => {
        const h = Math.max(4, Math.round((w.done / max) * 70));
        return `<div class="bar-col"><div class="bar-val">${w.done}/${w.total}</div><div class="bar" style="height:${h}px;background:${w.done === w.total ? '#10B981' : '#0E7490'}"></div><div class="bar-label">Wk${w.week_number}</div></div>`;
      }).join('')}</div>
      ${!canSeeFullHistory() ? `<div class="trial-lock-note"><i class="ti ti-lock"></i> Full history available after upgrade</div>` : ''}`;
    }

    const allMs = await db.select('milestones', `?child_id=eq.${session.childId}&order=logged_at.desc`);
    const msEl = document.getElementById('all-milestones');
    if (!allMs || allMs.length === 0) {
      msEl.innerHTML = `<div class="empty-state" style="padding:24px"><i class="ti ti-stars"></i><p>No milestones yet</p></div>`;
      return;
    }
    msEl.innerHTML = `<div class="milestone-list">` + allMs.map(m => {
      const d = session.domains.find(x => x.id === m.domain) || session.domains[0];
      return `<div class="milestone-card"><div class="ms-dot" style="background:${d?.color}"></div><div><div class="ms-title">${m.title}</div><div class="ms-meta">${d?.name} · ${formatDate(m.logged_at)} · ${m.parent_name}</div>${m.notes ? `<div class="ms-meta" style="margin-top:4px">${m.notes}</div>` : ''}</div></div>`;
    }).join('') + `</div>`;
  } catch(e) { console.error(e); }
}

// ===== CHAT (trial-gated) =====
function renderChatGate() {
  const gateEl = document.getElementById('chat-gate');
  const listEl = document.getElementById('chat-messages-list');
  const barEl  = document.querySelector('#screen-chat .chat-input-bar');

  if (!canUseChat()) {
    if (gateEl) gateEl.style.display = 'flex';
    if (listEl) listEl.innerHTML = '';
    if (barEl)  barEl.style.display = 'none';
    return;
  }
  if (gateEl) gateEl.style.display = 'none';
  if (barEl)  barEl.style.display  = 'flex';
  populateParentSelects();
  renderChat();
}

async function renderChat() {
  if (!session.child) return;
  const list = document.getElementById('chat-messages-list');
  if (!list) return;
  list.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
  try {
    const messages = await db.select('chat_messages', `?child_id=eq.${session.childId}&order=sent_at.asc`);
    if (!messages || messages.length === 0) {
      list.innerHTML = `<div class="chat-empty"><i class="ti ti-message-dots"></i><p>No messages yet.<br>Start the conversation!</p></div>`;
    } else {
      list.innerHTML = messages.map(m => {
        const isMe = m.parent_name === session.parents[0]?.display_name;
        return `
          <div class="chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
            <div class="chat-sender">${m.parent_name}</div>
            <div class="chat-text">${m.message}</div>
            <div class="chat-time">${formatDate(m.sent_at)}</div>
          </div>`;
      }).join('');
      list.scrollTop = list.scrollHeight;
    }
  } catch(e) { list.innerHTML = `<p style="padding:16px;color:red">Error: ${e.message}</p>`; }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const parentSel = document.getElementById('chat-parent-select');
  const msg = input?.value.trim();
  if (!msg) return;
  const parentName = parentSel?.value || session.parents[0]?.display_name || 'Parent';
  try {
    await db.insert('chat_messages', {
      child_id: session.childId,
      family_id: session.familyId,
      parent_name: parentName,
      message: msg,
    });
    input.value = '';
    await renderChat();
  } catch(e) { alert('Error: ' + e.message); }
}

// ===== SHOPPING LIST (trial-gated) =====
function renderShoppingGate() {
  if (!canUseShopping()) {
    const gate = document.getElementById('shopping-gate');
    if (gate) gate.style.display = 'flex';
    const list = document.getElementById('shopping-list');
    if (list) list.innerHTML = '';
    return;
  }
  document.getElementById('shopping-gate') && (document.getElementById('shopping-gate').style.display = 'none');
  renderShoppingList();
}

async function renderShoppingList() {
  const listEl = document.getElementById('shopping-list');
  if (!listEl) return;
  listEl.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
  try {
    const weeksToCheck = [session.weekNumber, session.weekNumber + 1, session.weekNumber + 2];
    const allMaterials = [];
    for (const wk of weeksToCheck) {
      const plans = await db.select('weekly_plans', `?child_id=eq.${session.childId}&week_number=eq.${wk}`);
      if (plans?.[0]?.activities) {
        plans[0].activities.forEach(act => {
          if (act.materials?.length > 0) {
            act.materials.forEach(m => allMaterials.push({ ...m, week: wk, activity: act.title }));
          }
        });
      }
    }
    if (allMaterials.length === 0) {
      listEl.innerHTML = `<div class="empty-state" style="padding:32px"><i class="ti ti-shopping-cart"></i><p>No materials needed yet.<br>Generate plans for the next 3 weeks to see your shopping list.</p></div>`;
      return;
    }
    const grouped = {};
    allMaterials.forEach(m => { if (!grouped[m.week]) grouped[m.week] = []; grouped[m.week].push(m); });
    listEl.innerHTML = Object.entries(grouped).map(([wk, items]) => `
      <div class="shopping-week-group">
        <div class="shopping-week-label">
          <i class="ti ti-calendar"></i>
          Week ${wk} ${parseInt(wk) === session.weekNumber ? '(This week)' : parseInt(wk) === session.weekNumber + 1 ? '(Next week)' : '(In 2 weeks)'}
        </div>
        ${items.map(item => `
          <div class="shopping-item ${item.required ? 'required' : ''}">
            <div class="shopping-item-info">
              <div class="shopping-item-name">🛒 ${item.name}</div>
              <div class="shopping-item-activity">For: ${item.activity}</div>
              ${item.required ? '<span class="shopping-required-badge">Required</span>' : ''}
            </div>
            <a href="${item.link}" target="_blank" class="shopping-buy-btn"><i class="ti ti-external-link"></i> Buy</a>
          </div>`).join('')}
      </div>`).join('');
  } catch(e) { listEl.innerHTML = `<p style="padding:16px;color:red">Error: ${e.message}</p>`; }
}

// ===== SETTINGS =====
function renderSettings() {
  if (!session.child) return;
  const el = n => document.getElementById(n);
  const avatarWrap = el('settings-avatar-wrap');
  if (avatarWrap) {
    avatarWrap.innerHTML = session.child.avatar_url
      ? `<img src="${session.child.avatar_url}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #22D3EE" />`
      : `<div style="width:72px;height:72px;border-radius:50%;background:#E0F7FA;color:#0E7490;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600;border:2px solid #22D3EE">${session.child.name.charAt(0)}</div>`;
  }
  if (el('settings-child-name')) el('settings-child-name').value = session.child.name;
  if (el('settings-parent1-name')) el('settings-parent1-name').value = session.parents[0]?.display_name || 'Mama';
  if (el('settings-parent2-name')) el('settings-parent2-name').value = session.parents[1]?.display_name || 'Papa';
  if (el('settings-week')) el('settings-week').textContent = `Week ${session.weekNumber} of 52`;
  if (el('settings-age')) el('settings-age').textContent = `${session.ageMonths} months`;
  if (el('settings-location')) el('settings-location').textContent = session.location ? `${session.location.city}, ${session.location.country}` : 'Not set';
  if (el('settings-languages')) el('settings-languages').textContent = session.languages.map(l => `${l.language} (${l.context})`).join(', ');

  const trialEl = el('settings-trial-info');
  if (trialEl) {
    if (NOVARA.devMode) {
      trialEl.textContent = '🛠 Dev mode — full access';
      trialEl.style.color = '#8B5CF6';
    } else if (session.isPaid) {
      trialEl.textContent = 'Full access — thank you!';
      trialEl.style.color = '#10B981';
    } else {
      const used = hasUsedTrialPlan();
      trialEl.textContent = used ? 'Trial complete — upgrade to continue' : 'Free trial week active';
      trialEl.style.color = used ? '#F97316' : 'var(--color-text-secondary)';
    }
  }
}

async function saveChildName() {
  const val = document.getElementById('settings-child-name')?.value.trim();
  if (!val || !session.childId) return;
  await db.update('children', { name: val }, `?id=eq.${session.childId}`);
  session.child.name = val;
  saveSession();
  renderHome();
}

async function saveParentNames() {
  const p1 = document.getElementById('settings-parent1-name')?.value.trim();
  const p2 = document.getElementById('settings-parent2-name')?.value.trim();
  if (session.parents[0] && p1) {
    await db.update('parents', { display_name: p1 }, `?id=eq.${session.parents[0].id}`);
    session.parents[0].display_name = p1;
  }
  if (session.parents[1] && p2) {
    await db.update('parents', { display_name: p2 }, `?id=eq.${session.parents[1].id}`);
    session.parents[1].display_name = p2;
  }
  saveSession();
  populateParentSelects();
  alert('Parent names saved!');
}

function uploadAvatar() { document.getElementById('avatar-file-input').click(); }

async function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl = e.target.result;
    await db.update('children', { avatar_url: dataUrl }, `?id=eq.${session.childId}`);
    session.child.avatar_url = dataUrl;
    saveSession();
    renderSettings();
    renderHome();
  };
  reader.readAsDataURL(file);
}

async function removeAvatar() {
  await db.update('children', { avatar_url: null }, `?id=eq.${session.childId}`);
  session.child.avatar_url = null;
  saveSession();
  renderSettings();
  renderHome();
}

async function changePin() {
  const current = document.getElementById('change-pin-current')?.value;
  const newPin = document.getElementById('change-pin-new')?.value;
  const confirm = document.getElementById('change-pin-confirm')?.value;
  const families = await db.select('families', `?id=eq.${session.familyId}`);
  if (families?.[0]?.pin_hash !== current) { showChangePinError('Current PIN is incorrect'); return; }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { showChangePinError('New PIN must be 4 digits'); return; }
  if (newPin !== confirm) { showChangePinError('PINs do not match'); return; }
  await db.update('families', { pin_hash: newPin }, `?id=eq.${session.familyId}`);
  closeModal('modal-change-pin');
  alert('PIN changed successfully!');
}

function showChangePinError(msg) {
  const el = document.getElementById('change-pin-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function populateParentSelects() {
  ['ms-parent','moment-parent','chat-parent-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = session.parents.map(p =>
      `<option value="${p.display_name}">${p.display_name}</option>`).join('');
  });
}

function logOut() {
  if (confirm('Log out of Novara? Your data stays safe — just enter your PIN to log back in.')) {
    // Clear pin verification but keep family session so PIN screen shows
    session.pinVerified = false;
    if (NOVARA.devMode) {
      session.isPaid = true;
      session.trialPlanUsed = false;
    }
    saveSession();
    renderPinScreen();
    showScreen('pin');
  }
}

function resetAll() {
  if (confirm('Delete ALL data? This cannot be undone.')) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('novara_device_id');
    location.reload();
  }
}

// ===== MODALS =====
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ===== UTILS =====
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ===== BOOT =====
initApp();
