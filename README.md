# DevProof

**Transforme seu código em evidências profissionais.**

DevProof é uma plataforma de inteligência de carreira para desenvolvedores. Importa repositórios públicos do GitHub, identifica sinais técnicos rastreáveis, agrupa projetos relacionados com confirmação do usuário e transforma o material em um currículo editável e preparação para entrevistas.

## MVP 0.1

- Importação pública pela API REST do GitHub, com paginação (até 1.000 repositórios por consulta).
- Seleção de projetos, filtros e análise individual ou sequencial.
- Evidências de linguagem principal, dependências de manifestos, testes, workflows, documentação e infraestrutura. Links de arquivos vinculados ao commit analisado.
- Sugestões de agrupamento por nome, editáveis e confirmadas pelo usuário.
- Comparador de requisitos técnicos com exemplos por área (claramente ilustrativos), orientação para cargos genéricos, fontes por tecnologia, projetos ordenados por correspondências e perguntas de entrevista. Não atribui pontuação de empregabilidade.
- Studio de currículo com cinco seções, três modelos de uma coluna, edição estruturada de trajetória, competências selecionáveis, ordenação de projetos, sugestões rastreáveis, texto para download e impressão PDF pelo navegador. Perfil público preenche nome, localização e site quando disponíveis.
- Interface responsiva, sem conta, banco de dados ou serviço de IA.

## Experiência do usuário

A entrada do produto é independente do painel de trabalho. Após importar, o usuário navega por quatro etapas, com resumo de seleção, busca e filtro, sugestões de agrupamento, progresso de análise e prévia do currículo. Temas claro e escuro são selecionáveis, com preferência persistida no navegador. Nenhum dado do currículo é salvo automaticamente. Nova sessão exige confirmação para descartar alterações. O layout usa barra lateral no desktop e navegação compacta no celular.

## Executar

Node.js 24 recomendado.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Opcionalmente, copie .env.example para .env.local e configure GITHUB_TOKEN com acesso de leitura a dados públicos. Não use NEXT_PUBLIC_ e não envie credenciais ao navegador.

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

## Arquitetura

Next.js App Router, React, TypeScript e CSS local. As rotas de API consultam exclusivamente api.github.com no servidor. O motor de evidências usa regras determinísticas e não executa código do repositório.

- src/lib/github.ts: API, paginação, validação, limites e leitura de manifestos.
- src/lib/engine.ts: evidências, agrupamento, comparação e perguntas.
- src/lib/model.ts: contratos de dados.
- src/app/workspace.tsx: fluxo de importação, seleção e editor.
- tests/: testes do motor e da API com respostas simuladas.
- e2e/: fluxo completo em Chromium, com API simulada e verificação responsiva.
- .github/workflows/ci.yml: checagem de tipos, testes e build.

## Limites e privacidade

A API pública possui limites de requisições. Uma análise acessa metadados, commit, árvore e até seis manifestos de até 64 KiB. Árvores truncadas e falhas são sinalizadas. O limite não é uma avaliação de qualidade. O MVP não atribui autoria individual, proficiência, senioridade ou experiência profissional a partir de código; o candidato deve revisar as descrições. Forks e repositórios arquivados aparecem identificados. O comparador de vagas usa um vocabulário limitado de tecnologias. Dados do editor permanecem na memória da aba e não são publicados automaticamente. Não há acesso a repositórios privados, OAuth, armazenamento persistente, IA ou PDF gerado no servidor.

Para exposição pública com token compartilhado, configure limites de tráfego, cache e monitoramento antes de escalar; não use um token com acesso amplo a dados privados.

## Validação e diagnóstico

O CI roda verificação de tipos, testes do motor e API, build e testes de ponta a ponta no Chromium, incluindo fluxo de edição, download de texto, impressão PDF e layout responsivo. Em caso de falha, consulte os logs e os artefatos do Playwright na execução do GitHub Actions. Os testes E2E usam respostas simuladas, não dependem de limites ou instabilidade da API externa.

## Roadmap

- [ ] Autoria baseada em commits e contribuições verificáveis.
- [ ] Melhor agrupamento com referências entre repositórios e confirmação.
- [ ] Extração de descrições com evidências e revisão.
- [ ] Persistência, sincronização e autenticação opcional.
- [ ] Portfólios e exportação PDF dedicada (a impressão já oferece três modelos).
- [ ] Testes com API real, cache e proteção contra abuso.

## Licença

MIT. Projeto independente, sem afiliação com GitHub.

### Personalização do currículo

O editor permite foto pública do GitHub, substituição por imagem JPG/PNG/WebP local (até 5 MB, redimensionada no navegador) ou remoção da foto. Cores, família e tamanho de fontes, margens, papel A4/Letter, entrelinhas, alinhamento, uma ou duas colunas, marcadores, divisórias, forma e recorte da foto são configuráveis. Seções podem ser ocultadas, renomeadas e reordenadas; seções personalizadas são adicionadas manualmente. A exportação em texto respeita a visibilidade e ordem do conteúdo. O modo simples recomenda uma coluna sem foto; não garante compatibilidade com todos os ATS. As fotos enviadas e o currículo permanecem na memória da sessão; não são enviados a um servidor. A foto pública do GitHub é carregada diretamente do serviço de avatares.
