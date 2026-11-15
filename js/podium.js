'use strict';

function podiumGroups(ranking) {
  const groups = [];
  const sorted = ranking.filter(item => item.votos > 0).sort((a, b) => b.votos - a.votos);
  for (const item of sorted) {
    const last = groups.at(-1);
    if (last?.votos === item.votos) last.people.push(item);
    else groups.push({ votos: item.votos, people: [item] });
  }
  return groups.slice(0, 3);
}

function pickImage(person, category) {
  const images = person.imgs.filter(Boolean);
  if (!images.length) return '';
  let hash = 0;
  for (const character of `${person.apelido}|${category}`) {
    hash = (Math.imul(hash, 31) + character.codePointAt(0)) | 0;
  }
  return images[Math.abs(hash) % images.length];
}

const categories = demo.categories;
let index = 0;
let step = 0;

main.innerHTML = heading('Modo pódio', 'Revelação demonstrativa da cerimônia.', true) +
  `<section class="card stage" aria-labelledby="category-title">
    <p id="progress" class="progress"></p><h2 id="category-title"></h2>
    <div id="podium" class="podium"></div><p id="reveal-status" role="status"></p>
    <div class="podium-controls">
      <button class="button" id="previous">← Anterior</button>
      <button class="button primary" id="reveal">Revelar</button>
      <button class="button" id="next">Próxima →</button>
    </div>
    <p class="keyboard">Teclado: espaço revela · setas navegam</p>
  </section>`;

const previous = main.querySelector('#previous');
const next = main.querySelector('#next');
const reveal = main.querySelector('#reveal');
const board = main.querySelector('#podium');
const status = main.querySelector('#reveal-status');

function renderPodium() {
  const category = categories[index];
  const ranking = nominees(category).map((candidate, i) => ({ ...candidate, votos: category.votos[i] }));
  const groups = podiumGroups(ranking);
  main.querySelector('#progress').textContent = `Categoria ${index + 1} de ${categories.length} — faltam ${categories.length - index - 1}`;
  main.querySelector('#category-title').textContent = category.titulo;
  board.innerHTML = step > 0 && !groups.length ? '' : [2, 1, 3].map(position => {
    const group = groups[position - 1];
    const shown = step >= 4 - position;
    const info = !shown ? '<div class="locked">A revelar</div>' : !group ? '<div class="locked">Sem colocação</div>' :
      `<div class="collage">${group.people.map(person => picture(pickImage(person, category.titulo), 'Imagem de ' + person.apelido)).join('')}</div>
      <strong>${group.people.map(person => person.apelido).join(' · ')}</strong>
      <small>${group.votos} ${group.votos === 1 ? 'voto' : 'votos'}${group.people.length > 1 ? ' · Empate' : ''}</small>`;
    return `<div class="spot pos-${position}${shown ? ' revealed' : ''}"><div class="spot-content">${info}</div><span class="rank">${position}º</span></div>`;
  }).join('');
  status.textContent = step === 0 ? 'Clique em Revelar para começar.' :
    !groups.length ? 'Nenhum voto registrado nesta categoria.' :
    step === 3 ? 'Pódio completo.' : `${4 - step}º lugar revelado.`;
  previous.disabled = index === 0;
  next.disabled = index === categories.length - 1;
  reveal.disabled = step === 3 || (step > 0 && !groups.length);
  watchImages();
}

function move(offset) {
  const target = index + offset;
  if (target < 0 || target >= categories.length) return;
  index = target;
  step = 0;
  renderPodium();
}

function revealNext() {
  if (!reveal.disabled) {
    step++;
    renderPodium();
  }
}

previous.onclick = () => move(-1);
next.onclick = () => move(1);
reveal.onclick = revealNext;
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === ' ' && !event.target.closest('button, a, input, textarea, select, [contenteditable]')) {
    event.preventDefault();
    revealNext();
  }
  if (event.key === 'ArrowLeft') move(-1);
  if (event.key === 'ArrowRight') {
    if (reveal.disabled) move(1);
    else revealNext();
  }
});
main.querySelector('.keyboard').textContent = 'Espaço revela · ← volta · → revela ou avança';
renderPodium();
