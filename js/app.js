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
    <div class="hero-copy"><span class="tag">EDIÇÃO ${demo.edition.ano} · DEMO</span>
    <h1>Los Awards<span>2.0</span></h1>
    <p>Relembre os melhores momentos da turma e ensaie a grande revelação do pódio.</p>
    <a class="button primary" href="pages/podio.html">Abrir pódio DEMO <span aria-hidden="true">→</span></a></div>
    <div class="hero-art" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><div class="trophy"><div></div><i></i><b></b></div></div>
  </section>
  <section class="shortcuts" aria-labelledby="explore"><h2 id="explore">Explore a edição</h2><div class="grid shortcuts-grid">
    ${[
      ['participantes', '●', 'Participantes', 'Conheça os perfis da turma.'],
      ['galeria', '▣', 'Galeria', 'Veja as memórias do grupo.'],
      ['historico', '◷', 'Histórico', 'Consulte as edições de 2024 e 2025.'],
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
    <h2>Fotos associadas</h2><div class="grid">${demo.photos.filter(photo => person.fotos.includes(photo.id)).map(photoCard).join('') || '<p class="empty">Nenhuma foto associada.</p>'}</div>
    <div class="grid future"><div class="card panel"><h2>Conquistas</h2><p>Sem dados oficiais.</p></div><div class="card panel"><h2>Dívidas</h2><p>Regras a definir.</p></div></div>`;
}

function gallery() {
  main.innerHTML = heading('Galeria', 'Fotos vinculadas a participantes no Roster de 2024; upload ainda indisponível.', true) +
    `<div class="toolbar"><label class="field">Participante<select id="photo-filter"><option value="">Todos</option>
    ${demo.participants.map(person => `<option value="${person.id}">${esc(person.apelido)}</option>`).join('')}</select></label>
    <button class="button primary" id="add-photo">Adicionar foto</button></div>
    <div class="grid" id="photo-list" aria-live="polite"></div>
    <dialog><form method="dialog"><h2>Disponível em breve</h2><p>O envio de fotos chega em uma etapa futura.</p><button class="button primary" autofocus>Fechar</button></form></dialog>`;
  const filter = main.querySelector('select');
  function update() {
    main.querySelector('#photo-list').innerHTML = demo.photos.filter(photo =>
      !filter.value || photo.participantes.includes(filter.value)
    ).map(photoCard).join('') || '<p class="empty">Nenhuma foto para este participante.</p>';
    watchImages();
  }
  filter.addEventListener('change', update);
  main.querySelector('#add-photo').addEventListener('click', () => main.querySelector('dialog').showModal());
  update();
}

function historyPage() {
  main.innerHTML = heading('Histórico', 'Consulte o estado da importação das edições anteriores.') +
    `<div class="toolbar"><label class="field">Edição<select id="year">${demo.historicalYears.map(year => `<option>${year}</option>`).join('')}</select></label>
    <label class="field">Categoria<select disabled><option>Aguardando importação</option></select></label></div>
    <div class="card panel"><h2>Aguardando importação</h2><p id="year-status" aria-live="polite"></p></div>
    <div class="card panel future"><h2>Hall da Fama</h2><p>Disponível após a importação dos resultados verificados.</p></div>`;
  const year = main.querySelector('#year');
  function update() {
    main.querySelector('#year-status').textContent = `Os resultados de ${year.value} ainda não foram importados.`;
  }
  year.addEventListener('change', update);
  update();
}

function voting() {
  main.innerHTML = heading('Votação', 'Experimente a seleção de candidatos. Nenhum voto será registrado.', true) +
    `<label class="field">Categoria<select>${demo.categories.map(category => `<option value="${category.id}">${category.titulo}</option>`).join('')}</select></label>
    <form><fieldset><legend>Escolha um candidato</legend><div id="choices" class="grid"></div></fieldset>
    <button class="button primary" type="submit">Simular voto</button><p id="vote-status" role="status"></p></form>`;
  const categorySelect = main.querySelector('select');
  const status = main.querySelector('#vote-status');
  const choices = main.querySelector('#choices');
  function update() {
    const category = demo.categories.find(item => item.id === categorySelect.value);
    choices.innerHTML = nominees(category).map(candidate => `<label class="card choice">${picture(category.tipo === 'pessoa' ? profileImage(candidate.id) : candidate.imgs[0], '')}
      <span><input required type="radio" name="candidate" value="${candidate.id}"> ${esc(candidate.apelido)}</span></label>`).join('');
    status.textContent = '';
    watchImages();
  }
  categorySelect.addEventListener('change', update);
  choices.addEventListener('change', () => { status.textContent = ''; });
  main.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = 'Simulação concluída. Nenhum voto foi registrado.';
  });
  update();
}

function admin() {
  main.innerHTML = heading('Administração', 'Prévia das ações disponíveis em etapas futuras.', true) +
    '<div class="grid">' + [
      ['Edições', 'Criar edições e definir datas.'],
      ['Categorias', 'Configurar categorias e candidatos.'],
      ['Participantes', 'Organizar os perfis da turma.'],
      ['Fotos', 'Gerenciar as imagens da galeria.'],
      ['Convites', 'Gerenciar o acesso por convite.']
    ].map(([title, description]) => `<section class="card panel"><h2>${title}</h2><p>${description}</p><button class="button" disabled>Em breve</button></section>`).join('') + '</div>';
}

({ index: home, galeria: gallery, historico: historyPage, votacao: voting, admin })[page]?.();
watchImages();
