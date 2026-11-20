import { users, currentTestUser, selectTestUser, testProfiles, saveTestProfile } from './test-users.js';

// Prévia exclusivamente local, sem login e sem criar contas Supabase.
export function openTestPage() {
  const people = testProfiles();
  if (page === 'perfil') {
    profile(people, true);
    const id = new URLSearchParams(location.search).get('id');
    const person = people.find(item => item.id === id);
    if (person) {
      const bio = document.createElement('p');
      bio.className = 'member-bio';
      bio.textContent = person.bio || 'Biografia ainda não cadastrada.';
      const form = document.createElement('form');
      form.className = 'card panel member-form';
      form.innerHTML = '<h2>Editar perfil — teste local</h2>' +
        '<label class="field">Nome<input name="nome" maxlength="100" required></label>' +
        '<label class="field">Apelido<input name="apelido" maxlength="60" required></label>' +
        '<label class="field">Biografia<textarea name="bio" maxlength="500" rows="4"></textarea></label>' +
        '<button class="button primary" type="submit">Salvar neste navegador</button>' +
        '<p role="status"></p>';
      for (const key of ['nome','apelido','bio']) form.elements[key].value = person[key] || '';
      main.querySelector('.profile').after(bio, form);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const edits = Object.fromEntries(['nome','apelido','bio'].map(key => [key,String(new FormData(form).get(key) || '').trim()]));
        const status = form.querySelector('[role="status"]');
        if (!saveTestProfile(id, edits)) {
          status.textContent = 'Não foi possível salvar. Confira os campos e o armazenamento.';
          return;
        }
        main.querySelector('.profile h1').textContent = edits.apelido;
        main.querySelector('.profile .heading p').textContent = edits.nome;
        bio.textContent = edits.bio || 'Biografia ainda não cadastrada.';
        status.textContent = 'Salvo apenas neste navegador. Teste outro usertest para conferir.';
      });
    }
  } else {
    participants(people, true);
  }
  const area = document.createElement('section');
  area.className = 'card panel test-identity';
  const warning = document.createElement('p');
  warning.textContent = 'TESTE LOCAL — estas identidades NÃO são contas do Supabase.';
  const label = document.createElement('label');
  label.className = 'field';
  label.textContent = 'Simular usuário';
  const select = document.createElement('select');
  for (const user of users) {
    const person = demo.participants.find(p => p.id === user.participantId);
    const option = document.createElement('option');
    option.value = user.username;
    option.textContent = user.username + ' — ' + person.apelido;
    select.append(option);
  }
  select.value = currentTestUser().username;
  select.addEventListener('change', () => selectTestUser(select.value));
  label.append(select);
  const note = document.createElement('p');
  note.textContent = 'Todos os usertest podem editar todos os perfis. As edições são compartilhadas somente entre abas deste navegador.';
  area.append(warning,label,note);
  (main.querySelector('.profile') || main.querySelector('.heading'))?.before(area);
  watchImages();
}
