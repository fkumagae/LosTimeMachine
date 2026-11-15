# Etapa 2 · Configuração e teste

A aplicação abre a lista e os perfis em modo DEMO enquanto os dois campos de
`js/supabase-config.js` estiverem vazios. Com o Supabase configurado, a aba
**Participantes** exige login e um vínculo ativo. Galeria, pódio e votação
continuam usando seus dados de demonstração.

## Preparar um projeto de teste

1. Crie ou selecione um projeto Supabase separado para o teste. No **SQL
   Editor**, execute `supabase/migrations/20261115000100_collaborative_profiles.sql`
   uma vez. Depois execute `supabase/seed.sql` para criar dois participantes
   fictícios. O seed não cria usuários.
2. Em **Authentication → Sign In / Providers**, mantenha **Email** ativo e
   desative **Allow new users to sign up** e o acesso anônimo.
3. Em **Authentication → URL Configuration**, defina **Site URL** para a URL
   exata da página de participantes que receberá o convite e os links de acesso.
   Mantenha a mesma URL na lista de redirecionamentos permitidos. Para teste
   local no computador, use `http://localhost:8000/pages/participantes.html`.
   Para teste no telefone, use a URL HTTPS de uma prévia separada e autorizada.
   Faça isso antes de enviar os convites.
4. Em **Authentication → Email Templates**, mantenha os modelos padrão de
   **Invite user** e **Magic link or OTP** para testar com links. Se você
   configurar SMTP próprio e personalizar o modelo de acesso com
   `{{ .Token }}`, o formulário também aceita o código.
5. Para endereços fora da equipe da organização Supabase, configure SMTP próprio em
   **Authentication → Custom SMTP**. As credenciais SMTP ficam no Supabase.
   Para testes locais com Supabase CLI, consulte o capturador de e-mails
   indicado por `supabase status`.
6. Na cópia de teste do frontend, preencha `js/supabase-config.js` com a URL
   do projeto e a chave **publishable** (`sb_publishable_…`). Chaves secretas,
   credenciais SMTP e `service_role` devem ficar fora do frontend e do Git.
   Com ambos os campos vazios o SDK não é carregado. No modo conectado, o SDK
   tem versão fixada e é carregado do jsDelivr.

Referências da configuração
[Convites](https://supabase.com/docs/guides/auth/users),
[modelos de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Convidar e vincular duas contas

1. Em **Authentication → Users → Add user → Send invitation**, convide os
   dois e-mails de teste. Copie o **UID** de cada conta.
2. No **SQL Editor**, substitua os marcadores pelos UIDs copiados e execute:

   ```sql
   insert into public.participant_accounts (user_id, participant_id) values
     ('<uid da primeira conta>', '11111111-1111-4111-8111-111111111111'),
     ('<uid da segunda conta>', '22222222-2222-4222-8222-222222222222');
   ```

3. Cada pessoa pode aceitar o convite pelo link. Para entrar novamente,
   abra **Participantes**, solicite o acesso com o e-mail convidado e abra
   o link recebido. Se o modelo enviar um código, selecione **Recebi um
   código**. Uma conta sem vínculo vê **Acesso pendente**. Para
   revogar o acesso aos perfis, remova o vínculo pelo painel administrativo
   do Supabase.

## Validar antes de publicar

Sirva a branch no computador com `python3 -m http.server 8000` ou `py -m http.server 8000`.
Use perfis separados do navegador ou aparelhos distintos para a matriz abaixo.
No telefone, abra a cópia de teste por HTTPS para validar os links do
convite e do login. Use a URL dessa cópia nas configurações de redirecionamento.

| Teste | Resultado esperado |
| --- | --- |
| Visitante abre Participantes ou um link direto de perfil | Tela de entrada por convite |
| Conta sem vínculo faz login | Acesso pendente e nenhuma lista de perfis |
| Primeira conta altera a biografia de Tico | Perfil salvo |
| Segunda conta atualiza a página de Tico | Biografia editada aparece |
| Duas contas abrem o mesmo perfil, uma salva e a outra tenta salvar uma versão anterior | A segunda recebe aviso para atualizar a página |
| Integrante tenta alterar ID de perfil ou vínculo pela API | Permissão negada |
| Usuário sai e volta à lista | Tela de entrada por convite |
| URL e chave publicável ficam vazias | A lista e os perfis mostram o selo DEMO e dados fictícios |
