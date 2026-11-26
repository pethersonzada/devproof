# Decisões arquiteturais

## Fluxo de dados

1. O visitante informa um login público. A API valida o formato e consulta perfil e páginas de repositórios.
2. O visitante escolhe os repositórios. A análise consulta cada repositório, verifica visibilidade pública, resolve o commit padrão e sua árvore.
3. Até seis manifestos de até 64 KiB são lidos por blob. O motor gera evidências com links permanentes. Não baixa nem executa código.
4. O agrupamento proposto depende de confirmação pelo usuário. As tecnologias e descrições são sinais, não prova de autoria.
5. O comparador verifica ocorrências em um vocabulário controlado. O editor exige complementação humana.
6. O currículo permanece local à aba e pode ser exportado pelo navegador.

## Segurança

Token opcional no servidor, sem prefixo público. URLs fixas para GitHub, parâmetros validados, redirects rejeitados, timeouts, leitura limitada, filtro de visibilidade pública. Não renderizamos HTML de README ou código remoto. Nenhuma credencial é solicitada pelo formulário. O token opcional não substitui limites de tráfego; antes de oferecer a ferramenta em escala, adicionar rate limiting distribuído, cache, orçamento de requisições e observabilidade.

## Evidências

A presença de dependência não comprova uso efetivo. A presença de arquivo de teste não comprova aprovação. O link ao commit permite conferência independente. Sem métricas de desempenho, inferência de senioridade ou autoria automática. Descrições do GitHub não são verificadas e devem ser revisadas pelo titular.

## Próximas etapas

Testes reais da API e do fluxo browser, proteção contra abuso, agrupamento por referências de documentação, autoria parcial e explícita, sincronização opt-in e exportação de PDF dedicada.
