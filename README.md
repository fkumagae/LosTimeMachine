# Los Awards 2.0

Álbum colaborativo e premiação anual da turma. [Abrir o site](https://fkumagae.github.io/LosTimeMachine/).

## Experimentar

1. Abra Galeria e guarde uma memória. Fotos podem marcar várias pessoas. Frases e histórias aceitam autoria e data opcional.
2. Em Votação, indique fotos ou frases e escolha seus candidatos. Troque o integrante simulado para ensaiar com outra cédula.
3. Em Administração, consulte as pendências e encerre a votação quando estiver pronto. No Histórico, passe as memórias da edição na TV. No Pódio, revele as categorias e o ranking final.
4. No Hall da Lama, toque no total de troféus para ver anos e categorias. Cada perfil também tem uma estante.

A configuração padrão usa **ensaio local**. Os 19 integrantes e as 58 referências de fotos vieram do Roster. Os votos e as novas memórias deste modo ficam no navegador usado. A edição compartilhada depende de Supabase configurado e contas vinculadas. O histórico de premiações antigas aguarda resultados confirmados.

## Desenvolvimento

Sirva a raiz com `python -m http.server 8000` e abra `http://localhost:8000`. Rode `node --test tests/*.cjs tests/*.mjs`. O frontend usa HTML, CSS e JS nativos com módulos. A publicação no Pages usa a raiz da main.

| Componente | Responsabilidade |
|---|---|
| index.html, pages/, css/ | Navegação e apresentação |
| js/data.js, js/app.js | Roster, home e renderização de perfis |
| js/members.js, js/test-ui.js, js/test-users.js | Login, vínculos e edição de perfis |
| js/temporada.js | Interface da galeria, votação, cerimônia, histórico e Hall |
| js/edicao.mjs, js/ensaio.js | Regras e persistência transacional de ensaio |
| supabase/, apps-script/ | Banco, permissões, API de edição e upload para o Drive |

[Regras, operação e ativação da edição](docs/EDICAO.md) · [Configuração de perfis e convites](docs/SUPABASE.md) · [Roster oficial](docs/ROSTER.md) · [Importação histórica](docs/MIGRATION.md)
