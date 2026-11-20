'use strict';

const main = document.querySelector('main');
const page = document.body.dataset.page;
const profileImage = id => demo.photos.find(photo => photo.participantes.includes(id))?.url || '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();

function heading(title, description, demoLabel = false) {
  return `<div class="heading">${demoLabel ? '<span class="tag">DEMO</span>' : ''}<h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
}

function picture(url, alt, classes = '') {
  return `<div class="picture ${classes}"><span aria-hidden="true">Sem imagem</span>${url ? `<img src="${esc(url)}" alt="${esc(alt)}">` : ''}</div>`;
}

function photoCard(photo) {
  return `<figure class="card photo-card">${picture(photo.url, photo.legenda)}<figcaption>${esc(photo.legenda)}</figcaption></figure>`;
}

function watchImages() {
  for (const image of main.querySelectorAll('.picture img')) {
    const fallback = () => image.remove();
    image.addEventListener('error', fallback, { once: true });
    if (image.complete && image.naturalWidth === 0) fallback();
  }
}

function home() {
  main.innerHTML = `<section class="hero">
    <div class="hero-copy"><span class="tag">EDIÇÃO ${demo.edition.ano}</span>
    <h1>Los Awards<span>2.0</span></h1>
    <p>Guarde as histórias da turma, relembre o ano e descubra os premiados.</p>
    <a class="button primary" href="pages/podio.html">Abrir cerimônia <span aria-hidden="true">→</span></a></div>
    <div class="hero-art" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><div class="trophy"><div></div><i></i><b></b></div></div>
  </section>
  <section class="shortcuts" aria-labelledby="explore"><h2 id="explore">Explore a edição</h2><div class="grid shortcuts-grid">
    ${[
      ['participantes', '●', 'Participantes', 'Conheça os perfis da turma.'],
      ['galeria', '▣', 'Galeria', 'Veja as memórias do grupo.'],
      ['historico', '◷', 'Histórico', 'Reveja fotos e histórias por edição.'],
      ['podio', '✦', 'Pódio', 'Revele os colocados por categoria.']
    ].map(([slug, icon, title, copy]) => `<a class="card shortcut" href="pages/${slug}.html"><span class="shortcut-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${copy}</p><span class="arrow" aria-hidden="true">→</span></a>`).join('')}
  </div></section>`;
}

function participants(people = demo.participants, isDemo = true) {
  main.innerHTML = heading('Participantes', 'Encontre um integrante pelo nome ou apelido.', isDemo) +
    '<label class="field">Buscar participante<input type="search" placeholder="Ex.: honesto ou Thiago"></label><div id="people" class="grid" aria-live="polite"></div>';
  const search = main.querySelector('input');
  const list = main.querySelector('#people');
  const tabs = document.createElement('nav');
  tabs.className = 'member-tabs';
  tabs.setAttribute('aria-label', 'Abas individuais dos integrantes');
  for (const person of people) {
    const link = document.createElement('a');
    link.href = 'perfil.html?id=' + encodeURIComponent(person.id);
    link.textContent = person.apelido;
    tabs.append(link);
  }
  main.querySelector('.field').after(tabs);
  function filter() {
    const query = normalize(search.value);
    const matches = people.filter(person =>
      [person.nome, person.apelido].some(value => normalize(value).includes(query))
    );
    if (!matches.length) {
      list.innerHTML = '<p class="empty">Nenhum participante encontrado.</p>';
      return;
    }
    list.replaceChildren(...matches.map(person => {
      const link = document.createElement('a');
      link.className = 'card person';
      link.href = 'perfil.html?id=' + encodeURIComponent(person.id);
      link.innerHTML = picture(profileImage(person.id), 'Foto de ' + person.apelido)
        + '<div><h2></h2><p></p></div>';
      link.querySelector('h2').textContent = person.apelido;
      link.querySelector('p').textContent = person.nome;
      return link;
    }));
    watchImages();
  }
  search.addEventListener('input', filter);
  filter();
}

function profile(people = demo.participants, isDemo = true) {
  const person = people.find(item => item.id === new URLSearchParams(location.search).get('id'));
  main.innerHTML = '<a class="back" href="participantes.html">← Participantes</a>';
  if (!person) {
    main.innerHTML += heading('Perfil indisponível', 'Selecione um participante na lista para abrir um perfil.');
    return;
  }
  main.innerHTML += `<div class="profile">${picture(profileImage(person.id), 'Foto de ' + person.apelido)}
    ${heading(person.apelido, person.nome, isDemo)}</div>
    `;
}

if (page === 'index') home();
watchImages();
