# Processo: Cadastro de Pet

## Fluxo
1. Usuário acessa /achados-e-perdidos/novo
2. Preenche formulário (espécie, cor, porte, bairro, cidade, foto, contato)
3. POST /api/pets → insere no Supabase
4. Agentes rodam em background: triagem + moderação
5. Email de confirmação enviado via Resend
6. Se kind=lost → webhook n8n → alerta WhatsApp para rede local

## Dados capturados
- name, species, breed, color, size, sex, age_approx
- description, behavior (características distintivas)
- neighborhood, city, latitude, longitude
- contact_name, contact_phone, contact_whatsapp (só visível em /pets/[id])
- photo_url (Supabase Storage, bucket pet-images)

## Regras de negócio
- Contato do tutor NUNCA aparece na listagem, só em /pets/[id]
- Status inicial: active
- Matching é acionado apenas quando kind=found
- Rate limit: 5 posts/min por IP

## Pontos de melhoria identificados
- GPS automático via geolocation API (formulário já tem campo lat/lng)
- Preview da foto antes de enviar
- Sugestão automática de raça baseada na espécie selecionada
