# Perfis do Roster oficial

**Origem:** [LosAwards 2024 — Roster](https://docs.google.com/spreadsheets/d/12AMzwAlmahlo3Onko7UNf8FrAjq2IUmVVYubCLHf670/edit#gid=1900532170), consultado em 19/11/2026.

São 19 perfis, e o apelido mantém a grafia da planilha. `usertest1`...`usertest19` são personas de teste local, **sem login, e-mail ou senha reais**.

| # | Nome | Apelido | Usuário de teste | Fotos (URLs) |
| ---: | --- | --- | --- | ---: |
| 1 | André Cirri | coach | `usertest1` | 4 |
| 2 | Antonio Rodrigues | lako | `usertest2` | 3 |
| 3 | Artur Safi | Sazo | `usertest3` | 3 |
| 4 | Eduardo Rossi | doc | `usertest4` | 3 |
| 5 | Fabio Puliti | Bão | `usertest5` | 4 |
| 6 | Felipe Kumagae | fer | `usertest6` | 4 |
| 7 | Gabriel Amadei | amadola | `usertest7` | 1 |
| 8 | Gabriel Erlichman | erli | `usertest8` | 3 |
| 9 | Gabriel Junqueira | gush | `usertest9` | 4 |
| 10 | Guilherme Alves | Gui | `usertest10` | 2 |
| 11 | João Caetano | klint | `usertest11` | 3 |
| 12 | João Pedro Barros | evans | `usertest12` | 3 |
| 13 | João Prata | teco | `usertest13` | 3 |
| 14 | Joaquim Coelho | gojo | `usertest14` | 3 |
| 15 | Matheus Liberado | Libe | `usertest15` | 2 |
| 16 | Murilo Safi | Bruno | `usertest16` | 2 |
| 17 | Pedro Jorge Neto | trick | `usertest17` | 4 |
| 18 | Renato Costa | reba | `usertest18` | 5 |
| 19 | Thiago Davantel | honesto | `usertest19` | 2 |

## Como funciona

- A aba Participantes tem atalhos para os 19 perfis. O perfil mostra fotos do Roster, biografia editável no navegador e campos futuros sem conteúdo inventado.
- No modo local, a escolha do usuário de teste usa `sessionStorage`, enquanto nome, apelido e bio editados usam `localStorage`. Qualquer `usertest` pode editar qualquer perfil, para simular colaboração; outra máquina não verá a alteração.
- Com Supabase configurado, o sistema usa convites reais e `participant_accounts`. As identidades `usertestN` **não** dão acesso nem são persistidas no Supabase.
- `supabase/seed.sql` insere 19 linhas com UUIDs estáveis no banco de teste. Não cria contas Auth, não atualiza biografias já existentes e não remove os antigos perfis fictícios de um banco previamente populado.
- Fotos são URLs da planilha e dependem das permissões de compartilhamento no Drive; se inacessíveis, a interface apresenta fallback.
- **Divergência na fonte:** Renato Costa tem 5 URLs listadas, mas a coluna `n_fotos` marca 4. A prévia mantém todas as URLs.

## Validação

1. Abra Participantes sem configurar o Supabase e escolha `usertest1`.
2. Abra o perfil `honesto`, edite a biografia e salve.
3. Volte, escolha `usertest2`, abra o mesmo perfil e confira a alteração no mesmo navegador.
4. Teste `usertest19`, o filtro de participantes e a navegação por abas.
5. Para contas de verdade, execute a migração e o seed em um projeto de teste, convide e-mails e vincule os UIDs conforme `docs/SUPABASE.md`.

Não publicar histórico, resultados, dívidas ou outros dados pessoais sem validação e decisão do grupo.
