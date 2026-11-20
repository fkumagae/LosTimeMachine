import { supabaseConfig } from './supabase-config.js';
import { currentTestUser, selectTestUser, users } from './test-users.js';
import { localSession } from './ensaio.js';
import { trophies, credit } from './edicao.mjs';

let state,
  client,
  slide = 0,
  filter = '',
  categoryId = '',
  year = 2026;
const local = !supabaseConfig.url && !supabaseConfig.publishableKey;
const profileId = new URLSearchParams(location.search).get('id');
const section = document.createElement('section');
const nick = (id) => state.people.find((p) => p.id === id)?.apelido || '';
const option = (id, label, selected = false) =>
  '<option value="' +
  esc(id) +
  '"' +
  (selected ? ' selected' : '') +
  '>' +
  esc(label) +
  '</option>';
const names = (selected = '') =>
  state.people.map((p) => option(p.id, p.apelido, p.id === selected)).join('');
const kinds = { foto: 'Foto', frase: 'Frase', historia: 'História' };
const button = (action, label) =>
  '<button class="button" data-action="' +
  action +
  '">' +
  esc(label) +
  '</button>';
const query = (s) => section.querySelector(s);

async function load() {
  if (local) return localSession();
  if (!client) {
    const { createClient } =
      await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
    client = createClient(supabaseConfig.url, supabaseConfig.publishableKey);
  }
  const { data, error } = await client.rpc('los_edition');
  if (error)
    throw Error(
      'Entre em Participantes com uma conta vinculada. A edição precisa estar configurada no Supabase.',
    );
  const people = await client
    .from('participants')
    .select('id,apelido')
    .order('apelido');
  if (people.error) throw people.error;
  return {
    ...data,
    people: people.data,
    change: async (action, args = {}) => {
      const response = await client.rpc('los_edition', { action, args });
      if (response.error) throw response.error;
    },
  };
}

function card(m, editable = false) {
  const tags = m.tags.map(nick).filter(Boolean);
  return (
    '<article class="card panel memory">' +
    (m.image ? picture(m.image, m.title) : '') +
    '<small>' +
    esc(kinds[m.kind]) +
    '</small><h3>' +
    esc(m.title) +
    '</h3>' +
    '<p>' +
    esc(
      [
        m.date,
        m.author && 'Autoria: ' + nick(m.author),
        m.by && 'Registro: ' + nick(m.by),
        tags.join(', '),
      ]
        .filter(Boolean)
        .join(' · '),
    ) +
    '</p>' +
    (editable
      ? '<details><summary>Marcar integrante</summary><form data-form="tag"><input type="hidden" name="id" value="' +
        esc(m.id) +
        '"><label>Integrante <select name="person">' +
        names() +
        '</select></label><button class="button">Marcar</button></form></details>'
      : '') +
    '</article>'
  );
}

function galleryView() {
  const selected = state.memories.filter(
    (m) => !filter || m.tags.includes(filter) || m.author === filter,
  );
  return (
    heading(
      'Galeria da turma',
      'Fotos, frases e histórias guardadas ao longo do ano.',
    ) +
    '<details class="card panel"><summary>Adicionar memória</summary><form data-form="memory" class="member-form">' +
    '<label>Tipo <select name="kind">' +
    Object.entries(kinds)
      .map(([k, v]) => option(k, v))
      .join('') +
    '</select></label>' +
    '<label>Legenda, frase ou história <textarea name="title" maxlength="1500" required></textarea></label>' +
    '<div id="photo-input"><label>Foto <input name="file" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
    (!local
      ? '<label>Ou link da foto no Drive <input name="drive"></label>'
      : '') +
    '</div>' +
    '<label>Edição <input name="year" type="number" min="1900" max="2099" value="2026" required></label>' +
    '<label>Data opcional <input name="date" placeholder="2026-03 ou 2026-03-14" pattern="[0-9]{4}-[0-9]{2}(-[0-9]{2})?"></label>' +
    '<label>Quem disse ou criou <select name="author">' +
    option('', 'Sem autor explícito') +
    names() +
    '</select></label>' +
    '<fieldset><legend>Pessoas marcadas</legend>' +
    state.people
      .map(
        (p) =>
          '<label class="tag-choice"><input type="checkbox" name="tag" value="' +
          esc(p.id) +
          '"> ' +
          esc(p.apelido) +
          '</label>',
      )
      .join('') +
    '</fieldset>' +
    '<button class="button primary">Guardar memória</button></form></details>' +
    '<label class="field">Filtrar por integrante<select id="filter">' +
    option('', 'Todos') +
    names(filter) +
    '</select></label><div class="grid">' +
    selected.map((m) => card(m, true)).join('') +
    '</div>'
  );
}

function candidateLabel(cat, id) {
  return cat.kind === 'pessoa'
    ? nick(id)
    : state.memories.find((m) => m.id === id)?.title || '';
}

function voteView() {
  const cat =
    state.categories.find((c) => c.id === categoryId) || state.categories[0];
  const entries = cat.candidates.map((id) => {
    const m = state.memories.find((item) => item.id === id);
    return (
      '<label class="card panel">' +
      (m?.image ? picture(m.image, m.title) : '') +
      '<input type="radio" name="id" required value="' +
      esc(id) +
      '" ' +
      (state.ballot[cat.id] === id ? 'checked' : '') +
      '> ' +
      esc(candidateLabel(cat, id)) +
      '</label>'
    );
  });
  return (
    heading(
      'Votação',
      state.phase === 'aberta'
        ? 'Você pode trocar sua escolha até o encerramento.'
        : 'A votação terminou.',
    ) +
    '<label>Categoria <select id="category">' +
    state.categories.map((c) => option(c.id, c.title, c === cat)).join('') +
    '</select></label>' +
    (state.phase === 'aberta' && entries.length
      ? '<form data-form="vote"><input type="hidden" name="category" value="' +
        esc(cat.id) +
        '"><div class="grid">' +
        entries.join('') +
        '</div><button class="button primary">Salvar voto</button></form>'
      : '<p>' +
        (!entries.length ? 'Aguardando indicações.' : 'Escolhas encerradas.') +
        '</p>') +
    (state.phase === 'aberta' && cat.kind !== 'pessoa' ? nomination(cat) : '')
  );
}

function nomination(cat) {
  const candidates = state.memories.filter(
    (m) => m.kind === cat.kind && !cat.candidates.includes(m.id),
  );
  return candidates.length
    ? '<details class="card panel"><summary>Indicar da galeria</summary><form data-form="nominate"><input type="hidden" name="category" value="' +
        esc(cat.id) +
        '"><label>Memória <select name="id">' +
        candidates
          .map((m) =>
            option(
              m.id,
              m.title +
                (m.tags.length ? ' · ' + m.tags.map(nick).join(', ') : ''),
            ),
          )
          .join('') +
        '</select></label><button class="button">Indicar</button></form></details>'
    : '';
}

function awardList(list) {
  return (
    '<ul>' +
    list
      .map((a) => '<li>' + esc(a.year) + ' · ' + esc(a.title) + '</li>')
      .join('') +
    '</ul>'
  );
}
function ranking(results) {
  const ranks = trophies(results);
  return (
    ranks
      .map((group, i) =>
        group
          .map(
            (p) =>
              '<details class="card panel"><summary>' +
              (i + 1) +
              'º · ' +
              esc(nick(p.id)) +
              ' · ' +
              p.count +
              ' troféu(s)</summary>' +
              awardList(p.awards) +
              '</details>',
          )
          .join(''),
      )
      .join('') || '<p>Aguardando troféus confirmados.</p>'
  );
}
function complete() {
  return (
    state.phase === 'fechada' && state.revealed === state.categories.length
  );
}
function confirmed() {
  return [...state.archive, ...(complete() ? state.results : [])];
}
function editionWinners(results) {
  const categories = results.filter((result) => result.ranked[0]?.length);
  return (
    categories
      .map(
        (result) =>
          '<article class="card panel"><h3>' +
          esc(result.title) +
          '</h3><ul>' +
          result.ranked[0]
            .map(
              (winner) =>
                '<li>' +
                (winner.image ? picture(winner.image, winner.label) : '') +
                esc(winner.label) +
                '</li>',
            )
            .join('') +
          '</ul></article>',
      )
      .join('') || '<p>Aguardando resultados confirmados.</p>'
  );
}

// O mesmo índice serve para a página e para a TV, inclusive ao sair com Escape.
function presentRetrospective() {
  const memories = state.memories.filter((memory) => memory.year === year);
  if (!memories.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'retrospective-tv';
  dialog.setAttribute('aria-label', 'Retrospectiva de ' + year);
  dialog.innerHTML =
    '<div class="tv-frame"><div class="tv" data-memory></div>' +
    '<div class="tv-controls"><span role="status"></span>' +
    button('previous-slide', 'Anterior') +
    button('next-slide', 'Próxima') +
    (document.fullscreenEnabled ? button('fullscreen', 'Tela cheia') : '') +
    button('end-show', 'Sair da apresentação') +
    '<a class="button primary" href="podio.html">Abrir cerimônia</a></div></div>';
  // Fora da seção para que os controles da apresentação não acionem o formulário da edição.
  main.append(dialog);
  const previous = dialog.querySelector('[data-action="previous-slide"]');
  const next = dialog.querySelector('[data-action="next-slide"]');
  const screen = dialog.querySelector('[data-action="fullscreen"]');
  const status = dialog.querySelector('[role="status"]');
  function display() {
    dialog.querySelector('[data-memory]').innerHTML = card(memories[slide]);
    status.textContent = year + ' · ' + (slide + 1) + ' de ' + memories.length;
    previous.disabled = slide === 0;
    next.disabled = slide === memories.length - 1;
    watchImages();
  }
  previous.onclick = () => {
    if (slide > 0) {
      slide--;
      display();
    }
  };
  next.onclick = () => {
    if (slide < memories.length - 1) {
      slide++;
      display();
    }
  };
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    (event.key === 'ArrowLeft' ? previous : next).click();
  });
  if (screen) {
    const frame = dialog.querySelector('.tv-frame');
    screen.onclick = async () => {
      try {
        if (document.fullscreenElement === frame)
          await document.exitFullscreen();
        else await frame.requestFullscreen();
      } catch {
        status.textContent = 'Tela cheia indisponível neste navegador.';
      }
    };
    dialog.addEventListener('fullscreenchange', () => {
      screen.textContent =
        document.fullscreenElement === frame
          ? 'Sair da tela cheia'
          : 'Tela cheia';
    });
  }
  dialog.querySelector('[data-action="end-show"]').onclick = () =>
    dialog.close();
  dialog.addEventListener(
    'close',
    () => {
      dialog.remove();
      draw();
      query('[data-action="present"]')?.focus();
    },
    { once: true },
  );
  display();
  dialog.showModal();
}
function historyView() {
  const memories = state.memories.filter((m) => m.year === year);
  slide = Math.max(0, Math.min(slide, memories.length - 1));
  const results = confirmed().filter((result) => result.year === year);
  return (
    heading('Retrospectiva', 'Fotos e histórias da edição para passar na TV.') +
    '<label>Edição <select id="year">' +
    [...new Set([2024, 2025, state.year, ...state.memories.map((m) => m.year)])]
      .sort()
      .map((y) => option(y, y, y === year))
      .join('') +
    '</select></label>' +
    (memories.length
      ? '<div class="tv">' +
        card(memories[slide]) +
        '</div><p>' +
        (slide + 1) +
        ' de ' +
        memories.length +
        '</p>' +
        button('back', 'Anterior') +
        button('next', 'Próxima') +
        button('present', 'Apresentar na TV')
      : '<p>Nenhuma memória nesta edição.</p>') +
    ' <a class="button primary" href="podio.html">Abrir cerimônia</a><h2>Premiados da edição</h2>' +
    '<div class="grid">' +
    editionWinners(results) +
    '</div><h2>Ranking individual</h2>' +
    ranking(results)
  );
}
function podiumView() {
  return (
    heading(
      'Cerimônia',
      state.phase === 'aberta'
        ? 'Aguardando o encerramento da votação.'
        : 'Revelação por categoria.',
    ) +
    state.results
      .map(
        (r) =>
          '<section class="card stage"><h2>' +
          esc(r.title) +
          '</h2>' +
          (r.ranked
            .map(
              (group, i) =>
                '<h3>' +
                (i + 1) +
                'º lugar</h3>' +
                group
                  .map(
                    (e) =>
                      (e.image ? picture(e.image, e.label) : '') +
                      esc(e.label) +
                      ' · ' +
                      e.count +
                      ' voto(s)',
                  )
                  .join(' / '),
            )
            .join('') || '<p>Sem votos válidos.</p>') +
          '</section>',
      )
      .join('') +
    (state.phase === 'fechada' && !complete() && state.admin
      ? button('reveal', 'Revelar ' + state.categories[state.revealed].title)
      : '') +
    (complete() ? '<h2>Ranking da noite</h2>' + ranking(state.results) : '')
  );
}
function archiveForm() {
  return (
    '<details class="card panel"><summary>Registrar prêmio antigo confirmado</summary><form class="member-form" data-form="archive">' +
    '<label>Edição <select name="year"><option>2024</option><option>2025</option></select></label>' +
    '<label>Categoria <input name="title" required maxlength="120"></label>' +
    '<label>Vencedor, frase ou foto <input name="label" required maxlength="300"></label>' +
    '<label>Crédito individual <select name="owner">' +
    option('', 'Sem ponto individual') +
    names() +
    '</select></label>' +
    '<p>Para empate, registre cada vencedor com a mesma edição e categoria.</p>' +
    '<label><input type="checkbox" required> Conferi este resultado na fonte da edição.</label><button class="button">Registrar prêmio</button></form></details>'
  );
}
function adminView() {
  if (!state.admin) return heading('Administração', 'Área da organização.');
  return (
    heading(
      'Organização',
      'Acompanhe quem completou as categorias com candidatos.',
    ) +
    archiveForm() +
    '<p>' +
    state.done.length +
    ' de ' +
    state.people.length +
    ' concluíram.</p><ul>' +
    state.people
      .map(
        (p) =>
          '<li>' +
          esc(p.apelido) +
          ' · ' +
          (state.done.includes(p.id) ? 'Concluído' : 'Pendente') +
          '</li>',
      )
      .join('') +
    '</ul>' +
    (state.phase === 'aberta'
      ? button('close', 'Encerrar votação')
      : '<a href="podio.html">Abrir cerimônia</a>')
  );
}
function profileView() {
  const awards =
    trophies(confirmed())
      .flat()
      .find((p) => p.id === profileId)?.awards || [];
  const memories = state.memories.filter(
    (m) => m.tags.includes(profileId) || m.author === profileId,
  );
  return (
    '<h2>Estante de troféus</h2>' +
    (awards.length ? awardList(awards) : '<p>Sem troféus confirmados.</p>') +
    '<h2>Memórias</h2><div class="grid">' +
    memories.map((m) => card(m)).join('') +
    '</div>'
  );
}
function draw(message = '') {
  const views = {
    galeria: galleryView,
    votacao: voteView,
    historico: historyView,
    podio: podiumView,
    admin: adminView,
    perfil: profileView,
    hall: () =>
      heading(
        'Hall da Lama',
        'Troféus acumulados em todas as edições confirmadas.',
      ) + ranking(confirmed()),
  };
  section.innerHTML =
    (local && page !== 'perfil'
      ? '<label class="field">Ensaio neste navegador · simular integrante<select id="identity">' +
        users
          .map((u) =>
            option(
              u.username,
              nick(u.participantId),
              u.username === currentTestUser().username,
            ),
          )
          .join('') +
        '</select></label>'
      : '') +
    '<p role="status" id="season-status"></p>' +
    views[page]();
  query('#season-status').textContent = message;
  watchImages();
}

async function photo(data) {
  const file = data.get('file');
  if (!file?.size && !local) {
    const link = (data.get('drive') || '').trim();
    const match =
      /^https:\/\/(?:drive\.google\.com\/file\/d\/|lh3\.googleusercontent\.com\/d\/)([\w-]+)(?:\/view(?:\?.*)?)?$/.exec(
        link,
      );
    if (match) return 'https://lh3.googleusercontent.com/d/' + match[1];
  }
  if (
    !file?.size ||
    file.size > 5 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  )
    throw Error('Escolha um JPG, PNG ou WebP de até 5 MB.');
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (local) return url;
  if (!supabaseConfig.driveUploadUrl)
    throw Error('Use um link do Drive ou configure o serviço de upload.');
  const {
    data: { session },
  } = await client.auth.getSession();
  const response = await fetch(supabaseConfig.driveUploadUrl, {
    method: 'POST',
    body: JSON.stringify({
      token: session.access_token,
      type: file.type,
      base64: url.split(',')[1],
    }),
  });
  const result = await response.json();
  if (!result.url) throw Error('O Drive não confirmou o upload.');
  return result.url;
}

async function act(event) {
  const form = event.type === 'submit' ? event.target : null;
  const control =
    form?.querySelector('button') ||
    event.target.closest('button[data-action]');
  if (!control) return;
  event.preventDefault();
  control.disabled = true;
  try {
    const action = form?.dataset.form || control.dataset.action;
    if (action === 'present') {
      presentRetrospective();
      return;
    }
    if (action === 'back' || action === 'next') {
      slide += action === 'next' ? 1 : -1;
      draw();
      return;
    }
    if (
      action === 'close' &&
      !confirm(
        'Encerrar a votação desta edição? Depois disso os votos ficam fechados.',
      )
    )
      return;
    const data = form ? new FormData(form) : null;
    const args = data ? Object.fromEntries(data) : {};
    if (action === 'memory') {
      args.title = args.title.trim();
      if (!args.title) throw Error('Escreva a legenda ou o texto.');
      args.year = Number(args.year);
      args.tags = data.getAll('tag');
      args.image = args.kind === 'foto' ? await photo(data) : '';
      if (args.date && !args.date.startsWith(args.year + '-'))
        throw Error('A data deve pertencer à edição escolhida.');
      delete args.tag;
      delete args.file;
      delete args.drive;
    }
    if (action === 'archive') {
      args.year = Number(args.year);
      args.title = args.title.trim();
      args.label = args.label.trim();
    }
    if (action === 'reveal') args.index = state.revealed;
    await state.change(action, args);
    state = await load();
    draw(action === 'vote' ? 'Voto salvo.' : 'Alteração salva.');
    if (
      action === 'vote' &&
      supabaseConfig.dadinhoPhoto &&
      credit(
        state.categories.find((c) => c.id === args.category),
        args.id,
        state,
      ) === state.me
    ) {
      const dialog = document.createElement('dialog');
      const img = new Image();
      img.src = supabaseConfig.dadinhoPhoto;
      img.alt = 'Dadinho';
      dialog.append(img);
      section.append(dialog);
      dialog.onclick = () => dialog.close();
      dialog.showModal();
    }
  } catch (error) {
    query('#season-status').textContent = error.message || 'Falha ao salvar.';
  } finally {
    control.disabled = false;
  }
}
async function start() {
  if (page === 'perfil' && !profileId) return;
  main.append(section);
  try {
    state = await load();
    if (page === 'perfil' && !state.people.some((p) => p.id === profileId))
      return;
    draw();
    section.addEventListener('submit', act);
    section.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) act(e);
    });
    section.addEventListener('change', async (e) => {
      if (e.target.name === 'kind') {
        query('#photo-input').hidden = e.target.value !== 'foto';
        return;
      }
      if (e.target.id === 'filter') filter = e.target.value;
      else if (e.target.id === 'year') {
        year = Number(e.target.value);
        slide = 0;
      } else if (e.target.id === 'category') categoryId = e.target.value;
      else if (e.target.id === 'identity') {
        selectTestUser(e.target.value);
        state = await load();
      } else return;
      draw();
    });
  } catch (error) {
    section.textContent =
      error.message || 'Não foi possível carregar a edição.';
  }
}
start();
