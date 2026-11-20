// Simulação local: troca de usertest sem senha, sem vínculo com Supabase Auth.
const STORAGE_KEY = 'losawards-test-profiles-roster-v1';
const ACTIVE_KEY = 'losawards-active-test-user-v1';
export const users = testUsers;

export function currentTestUser() {
  let value = '';
  try { value = sessionStorage.getItem(ACTIVE_KEY) || ''; } catch {}
  return users.find(user => user.username === value) || users[0];
}

export function selectTestUser(username) {
  if (!users.some(user => user.username === username)) return false;
  try { sessionStorage.setItem(ACTIVE_KEY, username); } catch {}
  return true;
}

function savedEdits() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function testProfiles() {
  const saved = savedEdits();
  return demo.participants.map(profile => {
    const edits = saved[profile.id] || {};
    return {
      ...profile,
      nome: typeof edits.nome === 'string' ? edits.nome : profile.nome,
      apelido: typeof edits.apelido === 'string' ? edits.apelido : profile.apelido,
      bio: typeof edits.bio === 'string' ? edits.bio : profile.bio
    };
  });
}

export function saveTestProfile(id, edits) {
  if (!demo.participants.some(person => person.id === id)) return false;
  const nome = String(edits.nome || '').trim().slice(0, 100);
  const apelido = String(edits.apelido || '').trim().slice(0, 60);
  const bio = String(edits.bio || '').trim().slice(0, 500);
  if (!nome || !apelido) return false;
  try {
    const saved = savedEdits();
    saved[id] = { nome, apelido, bio };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch { return false; }
}
