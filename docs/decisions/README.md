# Decisões — SOS Pet Aumigo

Registro de **decisões importantes** do projeto: escolhas de arquitetura, produto, design ou processo
que valem a pena persistir para não serem re-litigadas depois.

> Ponteiro de contexto: como e quando registrar decisões faz parte do
> [`AI-FIRST-OPERATING-SYSTEM.md`](../AI-FIRST-OPERATING-SYSTEM.md) (seção 8 — "Como lidar com ideias novas").

---

## Quando registrar

Registre uma decisão quando ela:
- muda a direção de arquitetura, produto ou design;
- resolve uma ambiguidade que voltaria a aparecer;
- decide **não fazer** algo (e o porquê importa);
- afeta schema, auth, RLS, pagamentos ou escopo do MVP.

Não registre trivialidades (renomear variável, fix de 1 linha) nem o que o próprio código/git já explica.

---

## Como registrar

**Um arquivo por decisão.** Nome curto e datado:

```
docs/decisions/YYYY-MM-DD-titulo-curto.md
```

Exemplo: `docs/decisions/2026-07-04-webhook-mercadopago-unico.md`

### Formato

```md
# <Título da decisão>

- **Data:** YYYY-MM-DD
- **Status:** proposta | aprovada | revertida

## Contexto
O que motivou a decisão. Qual problema ou dúvida.

## Decisão
O que foi decidido, de forma objetiva.

## Motivo
Por que essa escolha (e não as alternativas).

## Impacto
O que muda no projeto: código, rotas, dados, processo, riscos.
```

---

## Regras

- Decisão só entra aqui **depois de aprovada** pelo Wesley — este README não cria decisões.
- Manter curto e factual. Sem inventar números ou justificativas.
- Se uma decisão for revertida, não apagar o arquivo: marcar `Status: revertida` e explicar no impacto.
