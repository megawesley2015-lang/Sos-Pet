# Lançamento do Cartaz de Resgate — Guarujá (30 dias)

- **Produto:** SOS Pet Aumigo
- **Cidade-foco:** Guarujá (Baixada Santista)
- **Janela:** 30 dias corridos
- **Orçamento:** R$ 0 — sem tráfego pago, sem lote profissional de impressão. Impressão caseira/pontual só se fizer sentido.
- **Modelo de distribuição:**
  - **Principal:** Digital-first (WhatsApp, grupos de bairro, Instagram, compartilhamento do PNG do cartaz).
  - **Apoio:** Guerrilha física (você mesmo colando cartazes em pontos estratégicos quando fizer sentido).
  - **Secundário:** Parceiros locais (abordagem leve a clínicas vet, pet shops, mercados e ONGs).
- **Base técnica já pronta:** cartaz gerado em `/resgate` (`SOSAlertCard`) com **QR real → `/pets/[id]?src=cartaz`** e funil medido no **GA4** (`cartaz_open`, `cartaz_generated`, `cartaz_shared`, `cartaz_scan_visit`, `pet_contact_click`), tudo sob consentimento LGPD.

> Este é um **documento operacional de lançamento**. Não descreve feature nova nem código. Tudo aqui roda organicamente, com o que já existe.

---

## 1. Objetivo dos 30 dias

Provar, com esforço orgânico e custo zero, que o **fluxo rua/tela → perfil do pet → contato** funciona de verdade em Guarujá — e deixar o hábito de operação rodando (cadastrar, gerar cartaz, compartilhar, medir).

Não é campanha de vaidade. O sucesso é **pet reencontrando família** e **base local viva** (pessoas, grupos, parceiros que conhecem e usam o SOS Pet). O resto é meio para isso.

**Hipótese a validar:** um cartaz digital com QR, circulando em grupos locais de Guarujá, gera scans e cliques de contato suficientes para justificar continuar (e depois escalar para outras cidades).

---

## 2. Metas (30 dias)

| Meta | Número | Como sei que bati | Honestidade |
|---|---|---|---|
| Seguidores no Instagram | **100** | Contador do perfil (antes × depois) | Direto e verificável |
| Cartazes em circulação | **10** | Lista manual (ver §12) — cada cartaz físico colado OU PNG postado num grupo conta como 1 | Contagem própria; anote onde |
| Pets cadastrados | **10** | Registros reais em `/achados-e-perdidos` na região de Guarujá | Só conta cadastro real de tutor/encontrante |
| Reencontros | **5** | Confirmação do tutor (mensagem/print) — **não** é medido por GA | Qualitativo; guarde a prova com consentimento |
| Prestadores | **5** | Clínicas/pet shops/ONGs que toparam exibir cartaz ou virar parceiro | Conta quem confirmou, não quem "vai ver" |

**Aviso de honestidade (regra do projeto):** essas metas são **alvos de esforço**, não promessas de resultado. Reencontro depende da comunidade e da sorte — nunca prometa "vamos achar seu pet". Se um número não for atingido, isso é dado, não fracasso. Nada de inventar reencontro ou seguidor.

---

## 3. Rotina diária (15–30 min/dia)

Pensada para caber num dia normal. Não precisa fazer tudo todo dia — faça o que der, mas **todo dia mexa em pelo menos um item**.

1. **Checar** se entrou pet novo perdido/encontrado na região → se sim, gerar cartaz e compartilhar (§8, §9).
2. **1 ação de conteúdo:** postar 1 story OU responder comentários/DMs OU deixar 1 pet em destaque.
3. **1 ação de rede:** mandar o cartaz/PNG em **1 grupo** local novo ou reforçar num grupo onde já estou (§11).
4. **Responder** toda mensagem/comentário do dia (urgência de pet não espera).
5. **Anotar** no controle (§12): o que foi feito, onde, e qualquer contato de parceiro.

**Regra de ouro diária:** nenhum alerta de pet perdido/encontrado da região fica sem cartaz gerado e sem pelo menos 1 compartilhamento no mesmo dia.

---

## 4. Rotina semanal

**Segunda — Planejar**
- Definir os pets/temas da semana. Escolher 2–3 grupos novos para entrar/postar.
- Listar 2–3 parceiros para abordagem leve (§10).

**Terça a quinta — Executar**
- Publicar conteúdo (mix de categorias, ver §9).
- Rodar a rotina diária. Fazer as abordagens de parceiro planejadas.

**Sexta — Empurrão social**
- Post de maior alcance (reencontro, se houver — com autorização; ou dica forte).
- Reforçar cartazes ativos nos grupos ("ainda procurando", "obrigado por compartilhar").

**Domingo — Revisar (15 min)**
- Abrir GA4 e ler o funil da semana (§13): open → generated → shared → scan_visit → contact_click.
- Atualizar o controle (§12): quantos cartazes, pets, contatos de parceiro, seguidores.
- Anotar 1 aprendizado: o que gerou scan/contato e o que não gerou. Ajustar a próxima semana.

---

## 5. Mensagens prontas de abordagem

> Personalize sempre com o nome do lugar/pessoa. PT-BR, tom humano. Sem link encurtado suspeito — use o link real do site/perfil.

### 5.1 Entrando num grupo de bairro (apresentação)
```
Oi, pessoal! 🐾 Sou do SOS Pet Aumigo, uma plataforma gratuita da Baixada Santista
para pets perdidos e encontrados. Se alguém aqui perdeu ou encontrou um animal em
Guarujá, posso ajudar a montar um cartaz com QR code pra circular. É de graça e
sem cadastro obrigatório pra ver. Qualquer coisa, só chamar! 🧡
```

### 5.2 Abordagem a clínica / pet shop (WhatsApp ou balcão)
```
Oi, [nome do local]! Tudo bem? Sou do SOS Pet Aumigo, plataforma gratuita da Baixada
para achados e perdidos de pets. Muita gente que perde um animal passa por vocês
procurando. Posso deixar um cartaz (digital ou impresso) de "pets perdidos da região"
pra vocês exibirem? Não custa nada e ajuda a devolver bichinho pra família. Topam? 🐾
```

### 5.3 Abordagem a ONG / protetor
```
Oi! Sou do SOS Pet Aumigo. A gente tem uma ferramenta gratuita que gera cartaz com
QR code pro pet perdido/encontrado, apontando pro perfil dele no site. Pode ser útil
pra vocês nos resgates e nas buscas. Quer que eu mostre como funciona? Sem custo. 🧡
```

### 5.4 Reforço num grupo (pet ainda perdido)
```
Gente, o [nome do pet] ainda não voltou pra casa 😢 Se puderem compartilhar de novo,
ajuda MUITO. Quem vir, é só escanear o QR ou tocar no link que fala com a família:
[link do /pets/id]
```

### 5.5 Follow-up de parceiro que não respondeu (1 vez só, sem insistir)
```
Oi! Passando só pra saber se rolou de dar uma olhada no cartaz do SOS Pet. Sem pressa
e sem compromisso — se fizer sentido pra vocês, fico à disposição. 🐾
```

---

## 6. Checklist por caso

### 6.1 Pet perdido (tutor)
- [ ] Cadastro feito em `/achados-e-perdidos` com foto boa e descrição (cor, porte, local, quando sumiu).
- [ ] Cartaz gerado em `/resgate` (QR aponta pro perfil certo).
- [ ] **Testar o QR** com o celular antes de espalhar (abre o `/pets/[id]` certo?).
- [ ] Compartilhar PNG + link nos grupos da região do sumiço.
- [ ] Confirmar com o tutor que ele autoriza a divulgação (§14).
- [ ] Anotar no controle (§12).

### 6.2 Pet encontrado (encontrante)
- [ ] Cadastro como "encontrado" com foto, local e estado do animal.
- [ ] Cartaz gerado; compartilhar nos grupos do bairro onde foi achado.
- [ ] **Não** expor dados de quem encontrou além do necessário; contato fica na rota `/pets/[id]`.
- [ ] Anotar no controle.

### 6.3 Reencontro confirmado
- [ ] Tutor confirma que o pet voltou (mensagem/print).
- [ ] Pedir autorização para postar a história (§14). Se negar, **não** postar.
- [ ] Marcar o registro como resolvido no sistema.
- [ ] Contar como 1 reencontro no controle (§12) — com a prova guardada.

### 6.4 Parceiro fechado
- [ ] Confirmou por escrito que vai exibir o cartaz / virar parceiro.
- [ ] Definido o formato (PNG no balcão digital, A4 impresso, story marcando).
- [ ] Anotado nome, contato e o que combinou.

---

## 7. Checklist antes de postar (todo conteúdo passa por aqui)

- [ ] **Autorização:** tenho permissão do tutor/encontrante pra usar foto e história?
- [ ] **Sem PII indevida:** não estou expondo telefone, endereço completo, CPF de ninguém no post público.
- [ ] **Foto própria/autorizada:** nada de foto de pet de terceiro sem ok.
- [ ] **Link/QR certo:** o link do post/cartaz abre o `/pets/[id]` correto.
- [ ] **Tom empático:** em alerta de pet perdido, nada de tom frio/burocrático.
- [ ] **Sem promessa:** não prometi que "vamos encontrar".
- [ ] **Sem dado inventado:** nenhuma estatística/número apresentado como real sem fonte (ver §14).
- [ ] **Anti-golpe:** o post não induz ninguém a pagar recompensa antecipada (§15).
- [ ] **Cidade certa:** conteúdo/hashtags coerentes com Guarujá/Baixada.

---

## 8. Formatos do cartaz

O cartaz oficial sai do `/resgate` (PNG 540×810 com QR). Além dele, adaptações leves para cada canal:

| Formato | Uso | Como fazer (custo zero) |
|---|---|---|
| **Story (9:16)** | Instagram/WhatsApp Status | Postar o PNG do cartaz centralizado em fundo dark; adicionar figurinha de link/CTA "toca aqui". |
| **Feed (quadrado/retrato)** | Post no Instagram | O PNG do cartaz já funciona; se cortar, deixar respiro nas bordas. Legenda com link na bio. |
| **A4 (impressão)** | Guerrilha física em pontos-chave | Imprimir o PNG em A4 caseiro (P&B serve — o QR precisa ficar nítido). Colar em ponto autorizado. |

**Regras dos 3 formatos:**
- O **QR precisa ficar legível e escaneável** — não reduzir demais nem cobrir. Teste antes.
- Manter a paleta e o layout do card (não redesenhar o cartaz oficial).
- O link textual do cartaz é fallback; o QR é o caminho principal.

---

## 9. Roteiro de postagem no Instagram

**Cadência realista (custo zero):** 3–5 posts/semana + stories quase diários. Sem obrigação de perfeição — consistência > produção.

**Mix semanal sugerido (não repetir categoria em posts seguidos):**
1. **Alerta de pet perdido** (o cartaz vira o post) — 2–3x/semana.
2. **Dica de segurança** (coleira com plaquinha, microchip, foto atualizada) — 1x.
3. **Engajamento** (enquete/pergunta: "qual o nome do seu pet?") — 1x.
4. **Reencontro / prova social** (quando houver, com autorização) — quando rolar.
5. **Bastidores/produto** (como o QR do cartaz funciona) — 1x.

**Estrutura de cada post:**
- **Hook** nos primeiros segundos/linha (ver banco de hooks na skill de marketing).
- 1 ideia por post.
- **CTA clara:** compartilhar / salvar / "link na bio" / "escaneia o QR".
- Bloco de hashtags no fim: `#SOSPet #PetPerdido #PetEncontrado #Guaruja #BaixadaSantista #Santos #CachorroPerdido #GatoPerdido #AjudaAnimal #Guaruja🐾` (ajustar por post).

**Stories diários (baixo esforço):** repostar pet perdido do dia, enquete, "você viu esse pet?", contagem/urgência. Sempre com o caminho pro perfil.

---

## 10. Plano leve para parceiros

Objetivo: **5 parceiros** que exibam o cartaz ou virem apoio. Abordagem leve, sem pressão, sem prometer exclusividade nem pagar nada.

**Alvos (ordem de facilidade):**
1. Pet shops e clínicas vet de Guarujá (fluxo de tutores).
2. ONGs e protetores locais (já vivem de resgate).
3. Mercados/padarias de bairro e administradores de condomínio (mural).

**Passo a passo:**
1. Escolher 2–3 alvos/semana (§4).
2. Mandar a mensagem 5.2 / 5.3, ou ir pessoalmente com o cartaz no celular.
3. Se toparem: combinar o formato (PNG no balcão digital, A4 impresso, ou story marcando).
4. Registrar no controle (§12). 1 follow-up leve (5.5) se não responderem — **e para por aí**.

**O que oferecer (todos de graça):** cartaz pronto da região, menção do parceiro num story, e a ferramenta pra eles gerarem cartaz de qualquer pet que aparecer.

**O que NÃO fazer:** prometer clientes, prometer exclusividade, cobrar, ou insistir mais de 1 follow-up.

---

## 11. Plano de abordagem em grupos locais

Onde a estratégia digital-first realmente acontece.

**Onde:** grupos de WhatsApp/Facebook de bairros de Guarujá (Enseada, Pitangueiras, Vicente de Carvalho, Perequê, etc.), grupos de "achados e perdidos pet Baixada", grupos de condomínio.

**Como entrar sem ser barrado como spam:**
1. **Entrar e observar** 1–2 dias antes de postar (respeitar a regra do grupo).
2. **Primeira mensagem = ajuda, não propaganda** (mensagem 5.1).
3. Só postar cartaz quando houver **caso real da região** — é conteúdo útil, não anúncio.
4. **Nunca floodar:** no máximo 1 post por grupo por dia, e só quando relevante.
5. Agradecer quem compartilha; reforçar caso ainda aberto (5.4).

**Meta operacional:** estar ativo em pelo menos **5–8 grupos** de Guarujá até o fim dos 30 dias, com relação de confiança (não visto como spammer).

---

## 12. Controle manual (planilha simples)

Mantenha uma tabelinha (papel, Notes ou planilha) — é a fonte de verdade das metas que o GA não mede.

| Data | Tipo (pet perdido/achado/reencontro/parceiro/grupo) | Nome/Local | Ação (cartaz gerado/postado/colado/abordado) | Onde (grupo/ponto) | Status | Obs. |
|---|---|---|---|---|---|---|

Some no fim: **# cartazes**, **# pets cadastrados**, **# reencontros (com prova)**, **# parceiros confirmados**, **seguidores (início × hoje)**.

---

## 13. Métricas — lendo o funil GA4 já implementado

O funil do cartaz **já é medido** (respeitando consentimento). No GA4, acompanhe os 5 eventos:

```
cartaz_open      → alguém abriu /resgate com um pet (montou o cartaz)
cartaz_generated → PNG do cartaz gerado
cartaz_shared    → botão compartilhar/baixar acionado
cartaz_scan_visit→ visita a /pets/[id]?src=cartaz (chegou via QR)
pet_contact_click→ clicou em WhatsApp/Ligar no perfil (tem 'src' pra segmentar contato-via-cartaz)
```

**Funil a olhar toda semana:** `open → generated → shared → scan_visit → contact_click`. Onde cair muito é onde está vazando.

**Leitura honesta:**
- **Scan_visit baixo** apesar de muito shared → o QR não está circulando pra quem escaneia (ajustar canais/pontos).
- **Contact_click baixo** apesar de scan → o perfil não converte (foto/descrição fracas).
- **Reencontro NÃO aparece no GA** — é confirmação manual do tutor (§12). Não confunda contact_click com reencontro.
- Se o **consentimento** de analytics for negado, o evento **não dispara** — então o GA subestima; a planilha manual cobre o resto. Isso é esperado e honesto.

**Ritual:** domingo, 15 min no GA4 DebugView/relatório + atualizar a planilha. Um aprendizado por semana.

---

## 14. Autorização e privacidade (LGPD)

- **Antes de divulgar qualquer pet:** ter o ok do tutor/encontrante para usar foto e dados.
- **Contato do tutor** (telefone/WhatsApp) aparece **só** na rota `/pets/[id]` — **nunca** na listagem nem no post. Não copie o telefone pra legenda.
- **Nada de PII** em post público: sem endereço completo, sem CPF, sem telefone solto.
- **Reencontro:** só publicar a história com autorização explícita. Se negar, não posta.
- **Fotos:** só do banco próprio ou do cadastro com permissão. Nunca foto de pet de terceiro sem ok.
- **Analytics:** o funil só mede com consentimento concedido — respeitar isso, não burlar.
- **Dados de menores/pessoas nas fotos:** se houver rosto de pessoa identificável, pedir consentimento também.

---

## 15. Anti-golpe / recompensa

Pet perdido atrai golpista. Proteja tutores e a reputação do SOS Pet.

- **Nunca** intermedie ou incentive **pagamento de recompensa antecipada**. Golpe clássico: "achei seu pet, deposita X que eu levo".
- Oriente tutores no perfil/post: **não pague nada antes de ver o pet pessoalmente e confirmar que é o seu**.
- Desconfiar de contato que **pede dinheiro por Pix/transferência** antes de mostrar o animal, ou que "está longe e precisa de frete".
- **Não prometer recompensa em dinheiro** nos cartazes/posts oficiais do SOS Pet — incentiva golpe. Se o tutor quiser oferecer, é decisão dele, fora da plataforma, e com aviso de cautela.
- Reportar/remover cadastros suspeitos (spam, foto genérica, pedido de dinheiro).
- Em dúvida sobre um contato suspeito, orientar encontro em **local público e movimentado**.

---

## 16. O que NÃO fazer agora

- ❌ **Não** gastar com tráfego pago nem lote de impressão (orçamento é R$ 0).
- ❌ **Não** floodar grupos com propaganda (vira spam e queima a marca).
- ❌ **Não** inventar métrica, seguidor, reencontro ou estatística "pra parecer maior".
- ❌ **Não** prometer que "vamos encontrar seu pet".
- ❌ **Não** expor contato do tutor fora da rota `/pets/[id]`.
- ❌ **Não** expandir pra outras cidades ainda — foco é **Guarujá** por 30 dias; escala é decisão posterior.
- ❌ **Não** construir feature nova, dashboard, tabela ou automação para isso — o funil GA4 e a planilha manual bastam neste ciclo.
- ❌ **Não** insistir com parceiro além de 1 follow-up.
- ❌ **Não** publicar reencontro sem autorização.

---

## 17. Definição de sucesso (fim dos 30 dias)

**Mínimo viável:** funil GA4 mostrando `scan_visit` e `contact_click` reais (o QR funciona na prática) + pelo menos alguns cadastros e 1 reencontro confirmado + presença de confiança em grupos de Guarujá.

**Bom:** metas do §2 batidas ou perto (100 seguidores, 10 cartazes, 10 pets, 5 reencontros, 5 parceiros).

**Decisão ao final:** com os números na mão (GA + planilha), decidir honestamente se **repete/ajusta em Guarujá**, **escala pra outra cidade**, ou **muda de canal**. Sem achismo — com o funil real.

---

*Documento operacional — SOS Pet Aumigo. Sem código, sem feature nova. Atualizar a planilha (§12) e a leitura do funil (§13) semanalmente.*
