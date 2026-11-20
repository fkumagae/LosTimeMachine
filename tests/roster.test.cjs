'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {demo, testUsers} = vm.runInNewContext(fs.readFileSync('js/data.js','utf8') + '\n({demo,testUsers})');
const profiles = Array.from(demo.participants);
const photos = Array.from(demo.photos);
const users = Array.from(testUsers);
test('19 integrantes e apelidos do Roster', () => {
 assert.equal(profiles.length, 19);
 assert.equal(profiles[4].apelido, 'Bão');
 assert.equal(profiles[18].apelido, 'honesto');
 assert.equal(new Set(profiles.map(p => p.id)).size, 19);
});
test('usertest1 a usertest19 têm vínculos distintos', () => {
 assert.deepEqual(users.map(u => u.username), Array.from({length:19},(_,i)=>'usertest'+(i+1)));
 assert.equal(new Set(users.map(u => u.participantId)).size, 19);
 assert.ok(users.every(u => profiles.some(p => p.id===u.participantId)));
});
test('todas as fotos pertencem a um perfil', () => {
 assert.ok(photos.length >= 19);
 assert.ok(photos.every(p => p.participantes.length===1 && profiles.some(x=>x.id===p.participantes[0]) && p.url.startsWith('https://lh3.googleusercontent.com/d/')));
 assert.ok(profiles.every(p => photos.some(f => f.participantes[0]===p.id)));
});
test('as categorias de prévia não fabricam votos', () => {
 assert.ok(demo.categories.every(c => Array.from(c.votos).every(v=>v===0) && c.votos.length===(c.tipo==='foto'?photos.length:profiles.length)));
});
test('seed idempotente inclui os UUIDs oficiais', () => {
 const seed=fs.readFileSync('supabase/seed.sql','utf8');
 assert.ok(profiles.every(p=>seed.includes(p.id)));
 assert.equal((seed.match(/'00000000-0000-4000-8000-0000000000[0-9]{2}'/g)||[]).length,19);
 assert.ok(!seed.includes('Marina Demo'));
});
