# Operação do Los Awards

## Ensaio publicado

Abra Galeria para guardar uma foto, frase ou história. Escolha a edição, informe a data opcional (mês ou dia), a autoria quando conhecida e as pessoas marcadas. O registro preserva quem enviou. As fotos importadas pertencem ao acervo do Roster 2024. A data da foto original é desconhecida. Qualquer integrante pode acrescentar marcações. O Histórico apresenta a retrospectiva da edição escolhida.

Participantes usa as 19 identidades de ensaio. Galeria, Votação, Histórico, Pódio, Administração e Hall da Lama usam a mesma edição em IndexedDB. Nome, apelido e bio de ensaio continuam no armazenamento local anterior. Abas na mesma origem compartilham os dados depois de recarregar. Dispositivos diferentes têm ensaios independentes. Neste modo o seletor de identidade e os controles administrativos simulam a experiência. Quem tiver acesso ao navegador tem acesso ao seu armazenamento.

Em Votação, fotos e frases podem ser indicadas da galeria. Acrescentar uma foto à galeria por si só não a indica. As categorias de pessoa começam com os 19 integrantes. Cada eleitor pode substituir o voto até a organização encerrar a edição. A administração vê os participantes que completaram as categorias com candidatos. Adicionar um candidato à primeira categoria antes vazia pode tornar um participante pendente novamente.

Na apuração, voto na própria pessoa ou em frase de sua autoria vale zero. Voto em foto vale inclusive para quem aparece nela. A foto recebe o prêmio sem crédito individual. Frase com autoria explícita pode dar troféu ao autor. Todos os primeiros colocados empatados ganham. O Hall usa posições consecutivas por total distinto. A estante do perfil e o ranking anual contam um troféu por integrante e categoria. Só entram resultados depois da última revelação, além dos históricos confirmados.

## Ativação compartilhada em um projeto Supabase

1. Inventarie os perfis e vínculos existentes antes de aplicar scripts. Veja SUPABASE.md para a migração de perfis, o seed, o convite e o vínculo de cada conta.
2. Aplique a migração 20261120000100_edicao.sql uma única vez e depois edition-seed.sql. O seed usa ON CONFLICT DO NOTHING. Uma edição já aberta conserva memórias e votos.
3. Cadastre o UUID do participante organizador em awards_private.organizers usando o editor SQL administrativo.
4. Configure url e publishableKey em js/supabase-config.js e teste com duas contas vinculadas. O modo conectado bloqueia a edição quando a função do banco estiver indisponível. Nunca coloque uma chave administrativa no frontend.
5. O frontend usa somente a função los_edition para a edição. O banco verifica o vínculo e, em encerramento e revelação, o papel de organizador. Serializa mudanças concorrentes e retorna somente a cédula do próprio eleitor. O resultado congelado sai categoria a categoria. O sigilo se aplica ao aplicativo, não ao proprietário do banco.
6. Em Administração, use Registrar prêmio antigo confirmado depois de conferir a fonte. Registre os empatados com a mesma edição e categoria. O histórico administrativo aceita resultados verificados em awards_private.archive, com year, title e ranked. ranked contém grupos ordenados de colocação, cada um com objetos id, label, owner e count. owner é o UUID creditado, vazio para uma foto ou conteúdo sem autor. Informe toda a categoria de uma vez, incluindo empates. Não há resultados oficiais pré-carregados.

## Fotos no Drive

O modo local guarda a foto no navegador. No modo conectado, é possível referenciar uma imagem existente pelo link do Drive. Para enviar arquivos, publique apps-script/Upload.gs como Web App do organizador e configure driveUploadUrl. Defina as propriedades SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e DRIVE_FOLDER_ID. Use uma pasta dedicada com as permissões de visualização desejadas. O serviço verifica o vínculo usando o token do integrante e as políticas da tabela participant_accounts. Aceita JPEG, PNG e WebP até 5 MB. Faça um teste de upload e visualização com duas contas. Se a conexão cair entre o upload e a gravação da memória, a foto pode ficar somente no Drive e seu link pode ser utilizado ao tentar novamente.

A propriedade opcional dadinhoPhoto recebe a imagem fornecida futuramente. No voto próprio, quando a imagem estiver configurada, o diálogo exibe apenas a foto.

## Verificação

Execute `node --test tests/*.cjs tests/*.mjs` na raiz. Os testes cobrem o Roster, a correspondência entre o seed de edição e o modo local, troca de voto, empates, contagem por autoria e rankings.
