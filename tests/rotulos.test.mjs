import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryLabel, resultLabel } from '../js/rotulos.mjs';

const nick = (id) => ({ a: 'Ana', b: 'Bia' })[id];
const phrase = { kind: 'frase', id: 'f1', title: 'Já foi!', author: 'a', by: 'b', tags: ['b'] };

test('indicação e cédula distinguem frases iguais pela autoria explícita', () => {
  assert.equal(memoryLabel(phrase, nick), 'Já foi! · Autoria: Ana');
  assert.equal(memoryLabel({ ...phrase, author: 'b' }, nick), 'Já foi! · Autoria: Bia');
  assert.equal(memoryLabel({ ...phrase, author: '' }, nick), 'Já foi! · Sem autor explícito');
});

test('cerimônia e retrospectiva exibem o texto e o crédito congelados na apuração', () => {
  const entry = { id: 'f1', label: 'Texto apurado', owner: 'b' };
  assert.equal(resultLabel(entry, [phrase], nick), 'Texto apurado · Autoria: Bia');
  assert.equal(resultLabel({ ...entry, owner: null }, [phrase], nick), 'Texto apurado · Sem autor explícito');
});

test('fotos, pessoas e arquivo sem tipo conservam a legenda confirmada', () => {
  const photo = { ...phrase, kind: 'foto' };
  assert.equal(memoryLabel(photo, nick), photo.title);
  for (const entry of [
    { id: photo.id, label: 'Foto do grupo', owner: '' },
    { id: 'a', label: 'Ana', owner: 'a' },
    { label: 'Registro confirmado', owner: 'b' },
  ]) assert.equal(resultLabel(entry, [photo], nick), entry.label);
});
