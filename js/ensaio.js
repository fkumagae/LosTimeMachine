import { initialEdition, submitVote, closeEdition } from './edicao.mjs';
import { currentTestUser, testProfiles } from './test-users.js';

let database;
function openDB() {
  return (database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('los-awards-edicoes', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('edicoes');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

// A transação de leitura e escrita serializa alterações feitas em abas diferentes.
async function transact(change) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('edicoes', change ? 'readwrite' : 'readonly');
    const store = tx.objectStore('edicoes');
    const request = store.get('2026');
    let state;
    request.onsuccess = () => {
      state = request.result || initialEdition(demo);
      if (change) {
        try {
          change(state);
          store.put(state, '2026');
        } catch (error) {
          tx.abort();
          reject(error);
        }
      }
    };
    tx.oncomplete = () => resolve(state);
    tx.onabort = () => reject(tx.error || Error('Alteração cancelada.'));
    tx.onerror = () => reject(tx.error);
  });
}

export async function localSession() {
  const people = testProfiles();
  const me = currentTestUser().participantId;
  const state = await transact();
  const active = state.categories.filter((c) => c.candidates.length);
  const done = people
    .filter(
      (p) => active.length && active.every((c) => state.votes[p.id]?.[c.id]),
    )
    .map((p) => p.id);
  return {
    people,
    me,
    admin: true,
    local: true,
    ...state,
    votes: undefined,
    results: state.results.slice(0, state.revealed),
    ballot: state.votes[me] || {},
    done,
    change: (action, args = {}) =>
      transact((s) => {
        const cat = s.categories.find((c) => c.id === args.category);
        switch (action) {
          case 'memory':
            s.memories.push({ ...args, id: crypto.randomUUID(), by: me });
            break;
          case 'tag': {
            const memory = s.memories.find((m) => m.id === args.id);
            if (!memory) throw Error('Memória indisponível.');
            memory.tags = [...new Set([...memory.tags, args.person])];
            break;
          }
          case 'nominate':
            if (
              s.phase !== 'aberta' ||
              !cat ||
              !s.memories.some((m) => m.id === args.id && m.kind === cat.kind)
            )
              throw Error('Indicação indisponível.');
            if (!cat.candidates.includes(args.id)) cat.candidates.push(args.id);
            break;
          case 'vote':
            submitVote(s, me, args.category, args.id);
            break;
          case 'archive': {
            if (![2024, 2025].includes(args.year) || !args.title || !args.label)
              throw Error('Prêmio inválido.');
            let record = s.archive.find(
              (r) => r.year === args.year && r.title === args.title,
            );
            if (!record) {
              record = { year: args.year, title: args.title, ranked: [[]] };
              s.archive.push(record);
            }
            if (
              !record.ranked[0].some(
                (w) => w.owner === args.owner && w.label === args.label,
              )
            ) {
              record.ranked[0].push({ owner: args.owner, label: args.label });
            }
            break;
          }
          case 'close':
            closeEdition(s, people);
            break;
          case 'reveal':
            if (
              s.phase !== 'fechada' ||
              s.revealed !== args.index ||
              s.revealed >= s.results.length
            )
              throw Error('Atualize a cerimônia.');
            s.revealed++;
            break;
          default:
            throw Error('Ação desconhecida.');
        }
      }),
  };
}
