# LosTimeMachine · Los Awards 2.0

Protótipo em HTML, CSS e JavaScript nativos. **Nesta branch de teste, os 19 perfis e suas fotos vêm da aba Roster da planilha LosAwards 2024.** Os votos, o pódio e o histórico oficial não foram importados. A versão publicada na `main` permanece com dados fictícios.

## Abrir a versão mais recente

[**Abrir o protótipo no navegador**](https://fkumagae.github.io/LosTimeMachine/)

O endereço é fixo e acompanha a branch `main` após a ativação do GitHub Pages em **Settings → Pages → Deploy from a branch → main → / (root)**. A versão publicada contém dados demonstrativos.

## Executar localmente

1. Abra a pasta do repositório no VS Code.
2. No terminal dessa pasta, execute `python -m http.server 8000`. No Windows, se necessário, use `py -m http.server 8000`. Em macOS ou Linux, use `python3 -m http.server 8000`.
3. Abra [http://localhost:8000](http://localhost:8000).

## Etapa 2 — contas e perfis colaborativos

Veja [Configuração e teste do Supabase](docs/SUPABASE.md) para preparar as migrações, a autenticação por convite e o teste com dois integrantes. A configuração padrão permite **teste local de edição com `usertest1` a `usertest19`**, sem criar usuários reais. Veja o [mapeamento de perfis e identidades](docs/ROSTER.md).

## Roteiro de revisão

- Busque `honesto` em Participantes, abra Thiago Davantel, selecione `usertest1` e edite a biografia; repita com `usertest2` no mesmo navegador.
- Na Galeria, filtre por Bão e confira as fotos referenciadas na planilha. **Adicionar foto** continua indisponível.
- No Histórico, alterne entre 2024 e 2025.
- Na Votação, escolha uma categoria e simule uma escolha. A seleção é descartada ao recarregar.
- No Pódio, confira que as categorias ainda não possuem votos e nenhum vencedor foi inventado.
- Confira as ações futuras na Administração.

As oito páginas ficam na raiz e em `pages/`, com estilos em `css/` e scripts em `js/`. Os perfis do Roster ficam em `js/data.js` e as identidades locais simuladas em `js/test-users.js` para dispensar duplicação em JSON e carregamento via fetch. As ilustrações locais ficam em `assets/`. A simulação roda no navegador e pode ser reiniciada recarregando a página.

## Perfis e usuários de teste

Esta branch `feat/roster-perfis-usertest` contém 19 perfis reais de referência, 58 URLs de imagem e navegação individual por integrante. `usertest1` até `usertest19` são **identidades locais simuladas** (sem e-mail, senha nem conta no Supabase). Nome, apelido e biografia podem ser alterados localmente e são guardados no `localStorage` do navegador; não há sincronização entre dispositivos. Para usar contas reais, siga o [guia Supabase](docs/SUPABASE.md): convide um e-mail e vincule o UID da conta a um perfil.

O seed `supabase/seed.sql` cria os 19 perfis no banco de teste, **não cria contas** e não remove dados antigos de um projeto já populado. A versão publicada na `main` não foi alterada. Execute `node --test tests/roster.test.cjs` para verificar a estrutura dos dados.
