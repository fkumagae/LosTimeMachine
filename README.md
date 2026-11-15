# LosTimeMachine · Los Awards 2.0

Protótipo local em HTML, CSS e JavaScript nativos. A edição, os participantes, as ilustrações e os votos da cerimônia são fictícios. O histórico de 2024 e 2025 aguarda dados verificados.

## Abrir a versão mais recente

[**Abrir o protótipo no navegador**](https://fkumagae.github.io/LosTimeMachine/)

O endereço é fixo e acompanha a branch `main` após a ativação do GitHub Pages em **Settings → Pages → Deploy from a branch → main → / (root)**. A versão publicada contém dados demonstrativos.

## Executar localmente

1. Extraia o ZIP e abra a pasta `losawards` no VS Code.
2. No terminal dessa pasta, execute `python -m http.server 8000`. No Windows, se necessário, use `py -m http.server 8000`. Em macOS ou Linux, use `python3 -m http.server 8000`.
3. Abra [http://localhost:8000](http://localhost:8000).

## Roteiro de revisão

- Busque `antonio` em Participantes e abra o perfil de Tico.
- Na Galeria, filtre por Duda e clique em **Adicionar foto** para ver o aviso.
- No Histórico, alterne entre 2024 e 2025.
- Na Votação, escolha uma categoria e simule uma escolha. A seleção é descartada ao recarregar.
- No Pódio, revele três posições em **Melhor história**. Tico e Lume empatam em segundo. Avance para testar a categoria de fotos e a categoria sem votos.
- Confira as ações futuras na Administração.

As oito páginas ficam na raiz e em `pages/`, com estilos em `css/` e scripts em `js/`. Os dados DEMO ficam centralizados em `js/data.js` para dispensar duplicação em JSON e carregamento via fetch. As ilustrações locais ficam em `assets/`. A simulação roda no navegador e pode ser reiniciada recarregando a página.
