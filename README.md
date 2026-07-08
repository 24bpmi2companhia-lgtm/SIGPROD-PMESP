# SIGPROD-PMESP - V4

Sistema local para gestão da produtividade operacional da 2ª Companhia PM do 24º BPM/I.

## Melhorias da V4

- Mantém o mesmo banco local do navegador, sem apagar lançamentos já feitos.
- Corrige melhor os policiais sem graduação, usando RE e nome/QRA como referência.
- Exibe Graduação + Nome + RE em lançamentos, consultas e rankings.
- Inclui conferência automática de efetivo incompleto.
- Exporta relatório filtrado em Excel (.xls), evitando problemas de data ##### e acentuação.
- Mantém CSV para backup operacional.
- Mantém comparativo com o mesmo período do ano anterior.
- Atualiza cache do PWA para forçar o navegador a carregar a versão nova.

## Regra de segurança

Antes de atualizar arquivos, abra o sistema antigo e clique em:

Backup → Exportar backup JSON

Depois de atualizar, se algo não aparecer, use:

Backup → Importar backup JSON
