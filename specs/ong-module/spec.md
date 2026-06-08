# Spec — Módulo ONG
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# ─────────────────────────────────────────────────────
# Status: ✅ Código implementado | ⚠️ Migration pendente no Supabase
# Slug: ong-module
# Responsável: Wes
# Data: 2026-06-08

---

## Contexto de Negócio

ONGs e protetores independentes resgatam animais, gerenciam lares temporários e
encaminham para adoção. Hoje fazem isso via planilha, papel ou memória.
O módulo ONG fornece um sistema web integrado ao SOS Pet para gestão completa
do ciclo de vida de um pet resgatado: entrada → prontuário → adoção → follow-up.

**Meta de produto:** Cada ONG cadastrada gera histórias reais de reencontros
que alimentam o marketing (Pilar 3 — Storytelling) e validam o mercado B2B.

---

## Requisitos — Notação EARS

### 2.1 Autenticação e Acesso

WHEN um usuário não autenticado tenta acessar qualquer rota `/ong/*`
THE SYSTEM SHALL redirecionar para `/login?next=/ong/dashboard`.

WHEN um usuário autenticado sem shelter tenta acessar `/ong/dashboard`
THE SYSTEM SHALL redirecionar para `/ong/cadastro` com mensagem orientativa.

THE SYSTEM SHALL garantir que um usuário só veja e edite dados do seu próprio shelter (RLS).

### 2.2 Cadastro do Shelter

WHEN uma ONG ou protetor acessa `/ong/cadastro`
THE SYSTEM SHALL exibir formulário com: nome, tipo (ong | protetor), CNPJ (opcional),
telefone, e-mail, cidade, bairro, descrição e logo.

WHEN o formulário é submetido com dados válidos
THE SYSTEM SHALL criar ou atualizar o registro em `shelters` e redirecionar
para `/ong/dashboard`.

IF o e-mail ou telefone estiver em formato inválido
THEN THE SYSTEM SHALL exibir erro inline no campo correspondente sem submeter.

### 2.3 Dashboard Operacional

WHEN uma ONG autenticada acessa `/ong/dashboard`
THE SYSTEM SHALL exibir em tempo real:
  - Total de pets ativos (status = available | fostered)
  - Total de adoções realizadas
  - Pets em estado crítico (health_status = critical)
  - Medicações contínuas ativas
  - Total de registros de prontuário
  - Pets com vacina vencendo em ≤ 30 dias
  - Adoções com follow-up 30 ou 90 dias atrasados ou vencendo em ≤ 7 dias

WHILE os dados estiverem carregando
THE SYSTEM SHALL exibir skeleton animado no lugar de cada métrica.

### 2.4 Gestão de Pets do Abrigo

WHEN a ONG acessa `/ong/pets`
THE SYSTEM SHALL listar todos os pets do shelter com: status, espécie, nome e data de resgate.

WHEN a ONG cadastra um novo pet via `/ong/pets/novo`
THE SYSTEM SHALL criar entry em `shelter_pets` com todos os campos obrigatórios
e redirecionar para o perfil do pet criado.

IF o campo `color` ou `size` ou `sex` ou `species` estiver ausente
THEN THE SYSTEM SHALL bloquear o submit e exibir erro de validação.

WHEN a ONG altera o status de um pet para `adopted`
THE SYSTEM SHALL exigir que uma entrada na tabela `adoptions` seja criada antes
de persistir a mudança de status.

### 2.5 Prontuário Veterinário

WHEN a ONG acessa `/ong/pets/[id]/prontuario`
THE SYSTEM SHALL listar todos os registros médicos do pet ordenados por data DESC.

WHEN a ONG registra um novo evento médico
THE SYSTEM SHALL criar entry em `medical_records` com: tipo, descrição, data e profissional.

THE SYSTEM SHALL preservar o histórico de prontuário mesmo após adoção
(status adopted não deleta registros filhos).

### 2.6 Vacinas

WHEN a ONG acessa `/ong/pets/[id]/vacinas`
THE SYSTEM SHALL listar todas as vacinas com: nome, data de aplicação e próxima dose.

WHEN uma vacina tiver `next_dose_date` ≤ 30 dias a partir de hoje
THE SYSTEM SHALL exibir badge visual de alerta "⚠️ Vence em X dias".

IF `next_dose_date` já passou
THEN THE SYSTEM SHALL exibir badge "🔴 Atrasada".

### 2.7 Medicações

WHEN a ONG acessa `/ong/pets/[id]/medicacoes`
THE SYSTEM SHALL listar medicações ativas e histórico com: nome, dose, frequência e período.

WHEN uma medicação tiver `end_date` NULL ou data futura
THE SYSTEM SHALL classificá-la como "contínua" nas métricas do dashboard.

### 2.8 Processo de Adoção

WHEN a ONG registra uma adoção em `/ong/adocoes`
THE SYSTEM SHALL criar entry em `adoptions` com: pet_id, nome do adotante,
contato, data e notas de entrega.

WHEN uma adoção é criada com sucesso
THE SYSTEM SHALL disparar webhook para o n8n com o payload da adoção para
agendamento automático dos follow-ups de 30 e 90 dias.

WHEN a adoção completa 30 dias sem `follow_up_30_date` preenchido
THE SYSTEM SHALL exibir badge "🔴 Follow-up atrasado" na listagem de adoções.

IF o webhook para o n8n falhar após a adoção ser criada
THEN THE SYSTEM SHALL logar a falha em `webhook_logs` e manter a adoção criada
sem interromper o fluxo do usuário.

### 2.9 Comportamentos de Falha Globais

IF qualquer query ao Supabase falhar por timeout ou rede
THEN THE SYSTEM SHALL exibir estado de erro com botão "Tentar novamente"
sem quebrar o layout da página.

IF um usuário tentar acessar dados de outro shelter via URL direta
THEN THE SYSTEM SHALL retornar 404 (RLS bloqueia; não revelar existência do recurso).

---

## Critérios de Aceitação

- [ ] Um usuário sem shelter é redirecionado para cadastro
- [ ] Um usuário com shelter vê apenas seus próprios pets e adoções
- [ ] Dashboard carrega com skeleton antes dos dados
- [ ] Vacinas vencendo ≤ 30 dias mostram badge laranja
- [ ] Adoção criada dispara webhook (ou loga falha)
- [ ] Follow-up atrasado aparece em destaque na listagem
- [ ] Nenhum dado de outro shelter é visível para usuário diferente
