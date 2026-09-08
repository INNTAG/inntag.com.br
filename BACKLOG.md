# Backlog — Site inntag.com.br

Ideias, melhorias e pendências que surgem durante o trabalho, para resolver depois.
Formato: `[ ]` a fazer · `[~]` em andamento · `[x]` feito (com data).

---

## 🖼️ Imagens

- [ ] **Fotos definitivas dos fundos.** As fotos reais `hero-paineis-mt.jpg`, `real-paineis-xgear.jpg`,
  `real-tc-vermelho.jpg` e `real-disjuntor-abw.jpg` foram apagadas do R2 (o painel apagava assets
  compartilhados ao trocar a foto de um produto/artigo). Não há cópia — R2 não tem versionamento.
  Solução atual é paliativa: `hero-paineis-fabrica.jpg` e `paineis-linha-fabrica.jpg`, geradas a partir
  das fotos das galerias dos produtos (2560px). Substituir pelas fotos oficiais quando houver.
- [ ] Produto **QGBT (id 11)** ainda usa `image_key = real-barramentos-fabrica.jpg`, um asset
  compartilhado da raiz do bucket. Dar a ele uma foto própria em `products/11/`.
- [ ] Limpar o R2: há ~140 arquivos `image.png_XXXX.png` e `error_report_*.md` sem uso aparente.

## 🧩 Painel / conteúdo

- [ ] **Benefícios por serviço**: a tabela `services` não tem esse campo, então as páginas de serviço
  usam os benefícios do conteúdo antigo (quando o slug coincide) ou três institucionais. Avaliar
  adicionar o campo no painel.
- [ ] Revisar `/api/admin/backgrounds`: autentica inline em vez de usar o `adminMiddleware` (funciona,
  mas foge do padrão e só aceita Bearer, não cookie).

## ✅ Concluídos

- [x] (08/09) **Serviços do site não salvavam**: `/api/admin/services` estava registrada duas vezes e o
  bloco das ordens de serviço de projeto capturava POST/PUT/DELETE. Rotas de projeto renomeadas para
  `/api/admin/project-services*`. A tabela `services` estava com 0 registros — o conteúdo cadastrado
  pela equipe se perdeu.
- [x] (08/09) **Foto do produto sumia ao salvar**: o PUT gravava `image_key = null` porque o formulário
  não envia o campo. Agora usa COALESCE.
- [x] (08/09) **Assets compartilhados sendo apagados**: `safeDeleteAsset()` impede remover chaves da
  raiz do bucket; só apaga dentro de `products/<id>/`, `machines/<id>/` etc.
- [x] (08/09) **Máquinas e Serviços passam a ser gerenciados pelo painel**: API pública de máquinas
  criada, páginas dinâmicas (com o conteúdo antigo como fallback) e banco semeado com as 4 máquinas
  e os 4 serviços que só existiam no código.
