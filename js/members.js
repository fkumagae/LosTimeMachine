import { supabaseConfig } from './supabase-config.js';

const { url, publishableKey } = supabaseConfig;
const fields = 'id,nome,apelido,bio,updated_at';

function sessionPanel(title, description, content = '') {
  main.innerHTML = heading(title, description) + content;
}

function report(form, message) {
  form.querySelector('[role="status"]').textContent = message;
}

function handleSubmit(form, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await action(new FormData(form));
    } catch {
      report(form, 'Não foi possível concluir. Confira a conexão e tente novamente.');
    } finally {
      button.disabled = false;
    }
  });
}

function showLogin(client, notice = '') {
  sessionPanel('Entrar por convite', 'Use o e-mail que recebeu o convite para o Los Awards.',
    `<form id="send-code" class="card panel member-form">
      <label class="field">E-mail<input name="email" type="email" autocomplete="email" required></label>
      <button class="button primary" type="submit">Enviar acesso por e-mail</button>
      <p role="status"></p>
    </form>
    <details class="card panel member-form" hidden>
      <summary>Recebi um código</summary>
      <form id="verify-code" class="member-form">
        <label class="field">Código recebido<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]+" required></label>
        <button class="button primary" type="submit">Entrar</button>
        <p role="status"></p>
      </form>
    </details>`);

  const send = main.querySelector('#send-code');
  const verify = main.querySelector('#verify-code');
  const codeOption = verify.closest('details');
  let email = '';
  report(send, notice);

  handleSubmit(send, async data => {
    email = '';
    codeOption.hidden = true;
    codeOption.open = false;
    const requested = data.get('email').trim();
    const emailRedirectTo = new URL('participantes.html', location.href).href;
    const { error } = await client.auth.signInWithOtp({
      email: requested,
      options: { shouldCreateUser: false, emailRedirectTo }
    });
    if (error) {
      report(send, 'Falha ao solicitar o acesso. Confira o e-mail do convite ou tente novamente em instantes.');
      return;
    }
    email = requested;
    report(send, 'Confira sua caixa de entrada e abra o link. Se receber um código, use a opção abaixo.');
    verify.reset();
    report(verify, '');
    codeOption.hidden = false;
  });

  handleSubmit(verify, async data => {
    const { data: result, error } = await client.auth.verifyOtp({ email, token: data.get('code').trim(), type: 'email' });
    if (error || !result.session) {
      report(verify, 'Código inválido ou expirado. Confira o código ou solicite outro.');
      return;
    }
    location.reload();
  });
}

function attachLogout(client) {
  const panel = document.createElement('div');
  panel.className = 'member-session';
  panel.innerHTML = '<button class="button" type="button">Sair</button><p role="status"></p>';
  main.append(panel);
  const button = panel.querySelector('button');
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (!error) location.reload();
      else report(panel, 'Não foi possível sair. Tente novamente.');
    } catch {
      report(panel, 'Não foi possível sair. Tente novamente.');
    } finally {
      button.disabled = false;
    }
  });
}

async function openList(client) {
  const { data, error } = await client.from('participants').select(fields).order('apelido').order('id');
  if (error) throw error;
  participants(data, false);
}

async function openProfile(client) {
  const id = new URLSearchParams(location.search).get('id') ?? '';
  const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
  const { data: person, error } = validId
    ? await client.from('participants').select(fields).eq('id', id).maybeSingle()
    : { data: null };
  if (error) throw error;
  if (!person) {
    sessionPanel('Perfil indisponível', 'Escolha um participante na lista.',
      '<a class="back" href="participantes.html">← Participantes</a>');
    return;
  }

  sessionPanel('Perfil', '', `<a class="back" href="participantes.html">← Participantes</a>
    <p class="member-bio"></p>
    <form class="card panel member-form">
      <h2>Editar perfil</h2>
      <label class="field">Nome<input name="nome" maxlength="100" required></label>
      <label class="field">Apelido<input name="apelido" maxlength="60" required></label>
      <label class="field">Biografia<textarea name="bio" maxlength="500" rows="4"></textarea></label>
      <button class="button primary" type="submit">Salvar perfil</button>
      <p role="status"></p>
    </form>`);

  const form = main.querySelector('form');
  let revision = person.updated_at;
  function display(profile) {
    main.querySelector('h1').textContent = profile.apelido;
    main.querySelector('.heading p').textContent = profile.nome;
    main.querySelector('.member-bio').textContent = profile.bio || 'Sem biografia.';
    for (const key of ['nome', 'apelido', 'bio']) form.elements[key].value = profile[key];
  }
  display(person);

  handleSubmit(form, async data => {
    const updates = Object.fromEntries(['nome', 'apelido', 'bio'].map(key => [key, data.get(key).trim()]));
    if (!updates.nome || !updates.apelido) {
      report(form, 'Preencha nome e apelido.');
      return;
    }
    const { data: saved, error } = await client.from('participants').update(updates)
      .eq('id', id).eq('updated_at', revision).select(fields).maybeSingle();
    if (error) throw error;
    if (!saved) {
      report(form, 'O perfil mudou ou seu acesso foi removido. Atualize a página antes de tentar salvar.');
      return;
    }
    revision = saved.updated_at;
    display(saved);
    report(form, 'Perfil salvo.');
  });
}

async function start() {
  if (!url && !publishableKey) {
    if (page === 'perfil') profile();
    else participants();
    watchImages();
    return;
  }
  sessionPanel('Participantes', 'Verificando o acesso…');
  try {
    const endpoint = new URL(url);
    const local = ['localhost', '127.0.0.1'].includes(endpoint.hostname) && endpoint.protocol === 'http:';
    if ((!local && endpoint.protocol !== 'https:') || !publishableKey.startsWith('sb_publishable_')) {
      throw new Error('Configuração inválida');
    }
    const callback = new URLSearchParams(location.hash.slice(1));
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
    const client = createClient(url, publishableKey);
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) {
      showLogin(client, callback.has('error') || callback.has('access_token')
        ? 'O link não pôde ser usado. Confira o convite ou solicite um novo acesso.' : '');
      return;
    }

    try {
      const { data: account, error: accessError } = await client.from('participant_accounts')
        .select('participant_id').eq('user_id', session.user.id).maybeSingle();
      if (accessError) throw accessError;
      if (!account) {
        sessionPanel('Acesso pendente', 'Peça ao administrador para vincular sua conta a um participante.');
      } else if (page === 'perfil') {
        await openProfile(client);
      } else {
        await openList(client);
      }
    } catch {
      sessionPanel('Participantes indisponíveis', 'Não foi possível consultar os perfis. Atualize a página para tentar novamente.');
    }
    attachLogout(client);
  } catch {
    sessionPanel('Participantes indisponíveis', 'Não foi possível conectar ao Supabase. Confira a configuração e tente novamente.');
  }
}

start();
