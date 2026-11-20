import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Simula apenas leitura e gravação sequenciais do IndexedDB usado pela sessão.
function memoryDatabase() {
  let saved;
  return {
    open() {
      const request = { result: { transaction } };
      queueMicrotask(() => request.onsuccess());
      return request;
    },
  };
  function transaction() {
    const tx = {
      objectStore: () => ({
        get() {
          const request = { result: structuredClone(saved) };
          queueMicrotask(() => {
            request.onsuccess();
            tx.oncomplete();
          });
          return request;
        },
        put(value) { saved = structuredClone(value); },
      }),
    };
    return tx;
  }
}

test('sessão de ensaio preserva o sigilo no voto, encerramento e revelações', async () => {
  const roster = runInNewContext(readFileSync('js/data.js', 'utf8') + '\n({ demo, testUsers })');
  const session = new Map();
  Object.assign(globalThis, structuredClone(roster), {
    indexedDB: memoryDatabase(),
    sessionStorage: {
      getItem: (key) => session.get(key),
      setItem: (key, value) => session.set(key, value),
    },
  });
  const { localSession } = await import('../js/ensaio.js');
  const { selectTestUser } = await import('../js/test-users.js');

  const first = await localSession();
  const secondId = roster.testUsers[1].participantId;
  const active = first.categories.filter((category) => category.candidates.length);
  for (const category of active) {
    const response = await first.change('vote', { category: category.id, id: secondId });
    assert.equal(response, undefined, 'salvar voto só confirma a gravação');
  }

  selectTestUser(roster.testUsers[1].username);
  const organizer = await localSession();
  assert.equal(organizer.admin, true);
  assert.deepEqual(organizer.done, [first.me]);
  assert.deepEqual(organizer.ballot, {});
  assert.equal('votes' in organizer, false);
  assert.deepEqual(organizer.results, []);
  assert.equal(await organizer.change('close'), undefined);

  let podium = await localSession();
  assert.equal(podium.phase, 'fechada');
  assert.deepEqual(podium.results, []);
  for (const [index, category] of podium.categories.entries()) {
    assert.equal(await podium.change('reveal', { index }), undefined);
    podium = await localSession();
    assert.equal(podium.results.length, index + 1);
    assert.equal(podium.results[index].title, category.title);
  }
  assert.equal(podium.results[0].ranked[0][0].id, secondId);
  assert.equal(podium.results[0].ranked[0][0].count, 1);
});
