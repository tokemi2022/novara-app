// ===== SESSION STATE =====
const SESSION_KEY = 'novara_session_v1';
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
  setTimeout(() => {
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
  const noNav = ['splash','pin','onboard-welcome','onboard-location','onboard-child','onboard-languages','onboard-parents','onboard-pin'];
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = noNav.includes(id) ? 'none' : 'flex';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.querySelector(`[data-screen="${id}"]`);
  if (nb) nb.classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'progress') renderProgress();
  if (id === 'moments') renderMoments();
  if (id === 'settings') renderSettings();
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
};

// Step 1: Welcome → auto-detect location
async function startOnboarding() {
  showScreen('onboard-location');
  document.getElementById('location-status').textContent = 'Detecting your location…';
  try {
    // Try browser geolocation
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
    );
    const { latitude, longitude } = pos.coords;
    // Reverse geocode with open API
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const geo = await r.json();
    const city = geo.address.city || geo.address.town || geo.address.village || '';
    const country = geo.address.country || '';
    const countryCode = geo.address.country_code?.toUpperCase() || '';
    onboardData.location = { city, country, countryCode, latitude, longitude };
    document.getElementById('location-status').textContent = `📍 ${city}, ${country}`;
    document.getElementById('location-confirm').style.display = 'block';
    document.getElementById('location-manual').style.display = 'none';
  } catch(e) {
    document.getElementById('location-status').textContent = 'Could not detect location automatically.';
    document.getElementById('location-manual').style.display = 'block';
    document.getElementById('location-confirm').style.display = 'none';
  }
}

function confirmLocation() {
  showScreen('onboard-child');
}

function saveManualLocation() {
  const city = document.getElementById('manual-city').value.trim();
  const country = document.getElementById('manual-country').value.trim();
  if (!city || !country) { alert('Please enter your city and country'); return; }
  onboardData.location = { city, country, countryCode: '', latitude: null, longitude: null };
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
  // Update child name display
  document.getElementById('onboard-child-display').textContent = name;
  showScreen('onboard-languages');
}

// Language selection
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
  const pills = WORLD_LANGUAGES.map(lang => {
    const isHome = onboardData.languages.find(l => l.language === lang && l.context === 'home');
    const isSchool = onboardData.languages.find(l => l.language === lang && l.context === 'school');
    return `
      <button class="lang-select-btn ${isHome ? 'selected-home' : ''}" onclick="toggleLang('${lang}','home')">${lang}</button>
    `;
  }).join('');
  const schoolPills = WORLD_LANGUAGES.map(lang => {
    const isSchool = onboardData.languages.find(l => l.language === lang && l.context === 'school');
    return `
      <button class="lang-select-btn ${isSchool ? 'selected-school' : ''}" onclick="toggleLang('${lang}','school')">${lang}</button>
    `;
  }).join('');
  home.innerHTML = pills;
  school.innerHTML = schoolPills;
}

function toggleLang(lang, context) {
  const existing = onboardData.languages.findIndex(l => l.language === lang && l.context === context);
  if (existing >= 0) {
    onboardData.languages.splice(existing, 1);
  } else {
    onboardData.languages.push({ language: lang, context });
  }
  renderLanguagePicker();
  updateLangSummary();
}

function updateLangSummary() {
  const home = onboardData.languages.filter(l => l.context === 'home').map(l => l.language);
  const school = onboardData.languages.filter(l => l.context === 'school').map(l => l.language);
  const el = document.getElementById('lang-summary');
  if (el) el.textContent = home.length > 0 || school.length > 0
    ? `Home: ${home.join(', ') || 'none'} · School: ${school.join(', ') || 'none'}`
    : '';
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
  completeOnboarding();
}

function showOError(msg) {
  const el = document.getElementById('onboard-pin-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function completeOnboarding() {
  const btn = document.getElementById('onboard-finish-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Setting up…'; }
  try {
    // 1. Create family
    const families = await db.insert('families', { pin_hash: onboardData.pin, email: null });
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
    await db.insert('child_stats', { child_id: childId, start_date: new Date().toISOString().split('T')[0] });

    // 7. Init domain progress
    for (const d of NOVARA.domains) {
      await db.insert('domain_progress', { child_id: childId, domain: d.id, pct: 0, last_activity: 'Not started yet' });
    }

    // 8. Save session
    session.familyId = familyId;
    session.childId = childId;
    session.pinVerified = true;
    saveSession();

    // 9. Load and go home
    await loadChildData();
    showScreen('home');
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Start journey'; }
    alert('Setup error: ' + e.message);
  }
}

// ===== PIN =====
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
    if (entered === family.pin_hash) {
      session.pinVerified = true;
      document.getElementById('pin-input').value = '';
      await loadChildData();
      showScreen('home');
    } else {
      showPinError('Incorrect PIN. Try again.');
      document.getElementById('pin-input').value = '';
    }
  } catch(e) {
    showPinError('Error: ' + e.message);
  }
}

function showPinError(msg) {
  const el = document.getElementById('pin-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
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
      db.select('domain_progress', `?child_id=eq.${session.childId}`),
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
    session.domains = (domains || []).map(d => {
      const meta = NOVARA.domains.find(x => x.id === d.domain) || NOVARA.domains[0];
      return { ...meta, pct: d.pct || 0, last: d.last_activity || 'Not started yet' };
    });
    if (session.domains.length === 0) session.domains = NOVARA.domains.map(d => ({ ...d, pct: 0, last: 'Not started yet' }));

    // Load this week's plan if exists
    const plans = await db.select('weekly_plans', `?child_id=eq.${session.childId}&week_number=eq.${session.weekNumber}`);
    if (plans?.[0]) {
      session.plan = plans[0].activities;
    }

    // Count done activities this week
    session.stats.done = session.plan.filter(a => a.status === 'done').length;

    saveSession();
  } catch(e) {
    console.error('loadChildData error:', e);
  }
}

async function loadAndShowHome() {
  await loadChildData();
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

  // Avatar
  const avatarEl = el('home-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = session.child.avatar_url
      ? `<img src="${session.child.avatar_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:1.5px solid #7FDBF0" />`
      : `<div class="avatar">${childName.charAt(0)}</div>`;
  }

  // Language pills
  const langEl = el('lang-pills-row');
  if (langEl) {
    const colors = ['#E0F7FA|#0E7490','#FEF3C7|#B45309','#F0FDF4|#065F46','#F5F3FF|#5B21B6','#FDF2F8|#9D174D','#FFF7ED|#C2410C'];
    langEl.innerHTML = session.languages.slice(0, 6).map((l, i) => {
      const [bg, color] = colors[i % colors.length].split('|');
      return `<span class="lang-pill" style="background:${bg};color:${color}">${l.language}</span>`;
    }).join('');
  }

  // Domains
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

  // Dynamic developmental context based on age
  const devContext = getDevelopmentalContext(ageMonths);

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

SCHEDULE: 3 weekday evening activities (10-15 mins, low setup) + 2 weekend activities (20-30 mins, richer).

Generate exactly 5 activities. Return ONLY a valid JSON array:
[
  {
    "day": "Monday Evening"|"Tuesday Evening"|"Wednesday Evening"|"Thursday Evening"|"Friday Evening"|"Saturday"|"Sunday",
    "title": "Activity name",
    "domain": "cognitive"|"language"|"emotional"|"physical"|"creativity"|"social"|"cultural",
    "duration": "10-15 mins"|"20-30 mins",
    "emoji": "single emoji",
    "description": "Exactly what ${parent1} or ${parent2} does with ${childName} — specific, practical, 2 sentences.",
    "language": "${homeLangs.split(',')[0].trim()}"|"${schoolLangs.split(',')[0].trim()}"|"All",
    "tip": "One tip for tired working parents",
    "platformLink": "https://... (real working URL)",
    "platformName": "Resource name",
    "materials": [{"name": "item", "link": "https://www.amazon.${country.toLowerCase().includes('spain') || country.toLowerCase().includes('españa') ? 'es' : 'co.uk'}/s?k=...", "required": true|false}]
  }
]

RULES:
- Cover at least 5 different domains
- Include at least 1 activity in each home language
- Include 1 sign language or gesture activity
- Weekend activities use local ${city} venues or parks where relevant
- Materials must be purchasable locally in ${country}
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

    // Save to Supabase
    await db.upsert('weekly_plans', {
      child_id: session.childId,
      week_number: week,
      age_months: ageMonths,
      activities: session.plan,
    });

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

function getDevelopmentalContext(ageMonths) {
  if (ageMonths < 6) return `Pre-verbal stage. Focus: sensory exploration, face recognition, cause-effect, tummy time, auditory stimulation. Milestones: tracking objects, social smile, vocalisation.`;
  if (ageMonths < 9) return `Early communication. Focus: babbling, object permanence intro, sitting support, reach and grasp. Milestones: responds to name, consonant sounds, sits with support.`;
  if (ageMonths < 12) return `Active explorer. Focus: crawling, pulling to stand, pincer grasp, first words emerging, stranger awareness. Milestones: waves bye-bye, says mama/dada, cruises furniture.`;
  if (ageMonths < 15) return `New walker. Focus: first independent steps, first words (5-10), stacking, object exploration, imitation. Milestones: walks alone, points, follows simple instructions.`;
  if (ageMonths < 18) return `Language foundation. Focus: vocabulary building (10-20 words), cause-effect play, shape sorting, climbing. Milestones: 2-word attempts, uses spoon, identifies body parts.`;
  if (ageMonths < 21) return `Communication explosion. Focus: 20-50 words, 2-word phrases, sorting/matching, pretend play begins. Milestones: follows 2-step instructions, names pictures, parallel play.`;
  if (ageMonths < 24) return `Builder stage. Focus: 50+ words, 2-3 word sentences, counting 1-3, cooperative play, emotional regulation. Milestones: asks questions, runs, kicks ball.`;
  if (ageMonths < 30) return `Thinker stage. Focus: 200+ words, simple sentences, pre-numeracy 1-5, imaginative play, peer interaction. Milestones: describes events, jumps, draws circles.`;
  if (ageMonths < 36) return `Pre-school prep. Focus: complex sentences, counting 1-10, letters recognition, cooperative games, emotional vocabulary. Milestones: tells stories, rides tricycle, dresses self.`;
  if (ageMonths < 48) return `Early literacy. Focus: letter-sound connections, number operations 1-10, reading readiness, complex social play, self-regulation. Milestones: writes name, counts objects, follows rules in games.`;
  return `Advanced pre-school. Focus: reading foundations, maths concepts, complex reasoning, leadership in play, cultural identity. Milestones: rhyming, simple addition, sustained attention.`;
}

function renderPlan() {
  document.getElementById('plan-loading').style.display = 'none';
  document.getElementById('plan-empty').style.display = 'none';
  document.getElementById('plan-week-label').textContent = `Week ${session.weekNumber} · Age ${session.ageMonths} months`;

  const grouped = {};
  session.plan.forEach(a => { if (!grouped[a.day]) grouped[a.day] = []; grouped[a.day].push(a); });
  const order = ['Monday Evening','Tuesday Evening','Wednesday Evening','Thursday Evening','Friday Evening','Saturday','Sunday'];
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
  let mats = '';
  if (act.materials?.length > 0) {
    mats = `<div class="act-detail-section"><h4>Materials</h4><ul class="act-materials-list">${act.materials.map(m => `<li>🛒 ${m.name} ${m.required ? '<span style="color:#F97316;font-size:10px">Required</span>' : ''} <a href="${m.link}" target="_blank">Buy →</a></li>`).join('')}</ul></div>`;
  }
  document.getElementById('act-modal-body').innerHTML = `
    <div class="act-detail-section"><h4>What to do</h4><p>${act.description}</p></div>
    <div class="act-detail-section"><h4>Parent tip</h4><p>${act.tip || 'Follow their lead and keep it joyful!'}</p></div>
    <div class="act-detail-section"><h4>Domain</h4><span class="tag" style="background:${dom?.bg};color:${dom?.color};font-size:13px;padding:4px 12px">${dom?.name}</span></div>
    ${act.platformLink ? `<div class="act-detail-section"><h4>Resource</h4><div class="act-link-row"><i class="ti ti-external-link"></i><a href="${act.platformLink}" target="_blank">${act.platformName || act.platformLink}</a></div></div>` : ''}
    ${mats}`;
  document.getElementById('modal-activity').style.display = 'flex';
}

function markActivity(status) {
  if (!currentActivity) return;
  quickMark(currentActivity.id, status);
  closeModal('modal-activity');
}

async function quickMark(id, status) {
  const act = session.plan.find(a => a.id === id);
  if (!act || act.status !== 'pending') return;
  act.status = status;
  if (status === 'done') {
    session.stats.done++;
    const dom = session.domains.find(d => d.id === act.domain);
    if (dom) { dom.pct = Math.min(100, dom.pct + 14); dom.last = act.title; }
    session.stats.streak++;
    // Update domain progress in DB
    await db.upsert('domain_progress', { child_id: session.childId, domain: act.domain, pct: dom?.pct || 0, last_activity: act.title });
    // Update stats
    await db.update('child_stats', { streak: session.stats.streak }, `?child_id=eq.${session.childId}`);
  }
  // Save updated plan
  await db.upsert('weekly_plans', { child_id: session.childId, week_number: session.weekNumber, age_months: session.ageMonths, activities: session.plan });
  saveSession();
  renderPlan();
  renderHome();
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
    const history = await db.select('week_history', `?child_id=eq.${session.childId}&order=week_number.desc&limit=4`);
    const weeks = history?.length > 0 ? history.reverse() : [
      { week_number: 1, done: 0, total: 5 },
      { week_number: 2, done: 0, total: 5 },
      { week_number: 3, done: 0, total: 5 },
      { week_number: session.weekNumber, done: session.stats.done, total: 5 },
    ];
    const max = Math.max(...weeks.map(w => w.total), 1);
    document.getElementById('completion-chart').innerHTML = `
      <div class="bar-chart">${weeks.map(w => {
        const h = Math.max(4, Math.round((w.done / max) * 70));
        return `<div class="bar-col"><div class="bar-val">${w.done}/${w.total}</div><div class="bar" style="height:${h}px;background:${w.done === w.total ? '#10B981' : '#0E7490'}"></div><div class="bar-label">Wk${w.week_number}</div></div>`;
      }).join('')}</div>`;

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
  if (el('settings-languages')) {
    el('settings-languages').textContent = session.languages.map(l => `${l.language} (${l.context})`).join(', ');
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
  ['ms-parent', 'moment-parent'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = session.parents.map(p => `<option value="${p.display_name}">${p.display_name}</option>`).join('');
  });
}

function resetAll() {
  if (confirm('Delete ALL data? This cannot be undone.')) {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  }
}

// ===== MODALS =====
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ===== UTILS =====
function formatDate(iso) {
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ===== BOOT =====
initApp();
