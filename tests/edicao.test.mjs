import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  initialEdition,
  submitVote,
  closeEdition,
  trophies,
} from '../js/edicao.mjs';
const roster = runInNewContext(readFileSync('js/data.js', 'utf8') + '\ndemo');
test('seed SQL reproduz exatamente o estado inicial local e as 58 fotos', () => {
  const fixture = readFileSync('supabase/edition-seed.sql', 'utf8').split(
    '$roster$',
  )[1];
  assert.deepEqual(
    JSON.parse(fixture),
    JSON.parse(JSON.stringify(initialEdition(roster))),
  );
  assert.equal(JSON.parse(fixture).memories.length, 58);
});
test('voto substituível, voto próprio, voto em foto, frase com e sem autoria e empate', () => {
  const s = initialEdition(roster);
  const [a, b, c, d] = roster.participants.map((p) => p.id);
  const photo = s.memories[0];
  s.categories[1].candidates.push(photo.id);
  s.memories.push(
    { id: 'f1', author: b, title: 'Frase' },
    { id: 'f2', author: '', title: 'Anônima' },
  );
  s.categories[3].candidates.push('f1', 'f2');
  submitVote(s, a, 'momento', photo.id);
  submitVote(s, a, 'historia', a);
  submitVote(s, c, 'historia', b);
  submitVote(s, c, 'historia', a);
  submitVote(s, d, 'historia', b);
  submitVote(s, b, 'frase', 'f1');
  submitVote(s, c, 'frase', 'f1');
  submitVote(s, d, 'frase', 'f2');
  closeEdition(s, roster.participants);
  assert.deepEqual(
    s.results[0].ranked[0].map((p) => p.count),
    [1, 1],
  );
  assert.equal(s.results[1].ranked[0][0].count, 1);
  assert.equal(s.results[1].ranked[0][0].owner, '');
  assert.deepEqual(s.results[2].ranked, []);
  assert.deepEqual(
    s.results[3].ranked[0].map((p) => p.count),
    [1, 1],
  );
  assert.deepEqual(
    trophies(s.results).map((g) => g.map((p) => [p.id, p.count])),
    [[[b, 2]], [[a, 1]]],
  );
  assert.throws(() => submitVote(s, a, 'historia', b));
  assert.throws(() => closeEdition(s, roster.participants));
});
test('cada pessoa recebe um troféu por categoria, incluindo edições verificadas', () => {
  const r = {
    title: 'Frase do Ano',
    year: 2024,
    ranked: [[{ owner: 'a' }, { owner: 'a' }, { owner: 'b' }]],
  };
  const groups = trophies([
    r,
    { ...r, year: 2025, ranked: [[{ owner: 'c' }]] },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].length, 3);
  assert.equal(groups[0][0].count, 1);
});
