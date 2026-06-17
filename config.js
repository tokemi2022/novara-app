// ===== NOVARA CONFIG =====
const NOVARA = {
  version: '1.0.0',
  name: 'Novara',
  tagline: 'Every child is a universe',
  supabaseUrl: 'https://exobpnfsjnacjbbjqwhp.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2JwbmZzam5hY2piYmpxd2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTIyNzcsImV4cCI6MjA5NzIyODI3N30.6wynyR40mt9iCBgOPitYqwzA9e64HZyzzpdyomO7bS4',
  workerUrl: 'https://nessa-api-proxy.tokemi2022.workers.dev/',
  colors: {
    primary: '#0E7490',
    deep: '#0A2540',
    mid: '#0D4A6B',
    light: '#E0F7FA',
    ripple: '#22D3EE',
  },
  domains: [
    { id: 'cognitive',  name: 'Cognitive',             icon: 'ti-brain',          color: '#0E7490', bg: '#E0F7FA' },
    { id: 'language',   name: 'Language & Signs',       icon: 'ti-message-circle', color: '#0D4A6B', bg: '#E8F4FD' },
    { id: 'emotional',  name: 'Emotional Intelligence', icon: 'ti-heart',          color: '#F59E0B', bg: '#FEF3C7' },
    { id: 'physical',   name: 'Physical & Motor',       icon: 'ti-run',            color: '#10B981', bg: '#F0FDF4' },
    { id: 'creativity', name: 'Creativity & Arts',      icon: 'ti-palette',        color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'social',     name: 'Social & Character',     icon: 'ti-users',          color: '#F97316', bg: '#FFF7ED' },
    { id: 'cultural',   name: 'Cultural Identity',      icon: 'ti-world',          color: '#EC4899', bg: '#FDF2F8' },
  ],
};

// ===== SUPABASE CLIENT =====
const db = {
  async query(table, method = 'GET', body = null, filter = '') {
    const url = `${NOVARA.supabaseUrl}/rest/v1/${table}${filter}`;
    const res = await fetch(url, {
      method,
      headers: {
        'apikey': NOVARA.supabaseKey,
        'Authorization': `Bearer ${NOVARA.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : '',
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DB error: ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  async insert(table, data) { return this.query(table, 'POST', data); },
  async select(table, filter = '') { return this.query(table, 'GET', null, filter); },
  async update(table, data, filter) { return this.query(table, 'PATCH', data, filter); },
  async upsert(table, data, filter = '') {
    const url = `${NOVARA.supabaseUrl}/rest/v1/${table}${filter}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': NOVARA.supabaseKey,
        'Authorization': `Bearer ${NOVARA.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
};
