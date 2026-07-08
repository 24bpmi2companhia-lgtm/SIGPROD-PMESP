# SIGPROD PMESP - V10

Sistema local de gestão da produtividade operacional.

## Importante

Esta versão mantém a mesma chave de banco local usada nas versões anteriores (`sigprod_pmesp_local_v1`). Assim, ao substituir os arquivos no GitHub Pages ou abrir no mesmo navegador, os dados já lançados continuam preservados.

Mesmo assim, antes de atualizar, faça:

1. Abra a versão atual.
2. Vá em **Backup**.
3. Clique em **Exportar backup JSON**.
4. Guarde o arquivo em pasta segura.

## Melhorias da V10

- Exibição de policial como Graduação + Nome/QRA + RE.
- Correção automática de graduações comuns.
- Conferência de efetivo para policiais sem graduação aparente.
- Consulta por período, policial, equipe e tipo de policiamento.
- Painel do Comandante.
- Comparativo com o mesmo período do ano anterior.
- Rankings sem pontuação, por totais reais.
- Exportação CSV e Excel.
- Botão de impressão/PDF.
- PWA com instalação pelo navegador quando publicado no GitHub Pages.

## Como testar localmente

Abra o arquivo `index.html` no Chrome ou Edge.

## Como publicar no GitHub Pages

Envie todos os arquivos desta pasta para a raiz do repositório. Depois vá em:

Settings > Pages > Source: Deploy from a branch > Branch: main > /(root) > Save.
