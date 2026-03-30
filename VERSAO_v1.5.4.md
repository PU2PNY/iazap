# Instalador AtendeChat v1.5.4 (FINAL)

## Data: 30/12/2025

## Correções Aplicadas

### 1. Migrations (.sequelizerc)
- **Problema:** Apontava para `src/` (TypeScript)
- **Solução:** Corrigido para apontar para `dist/` (JavaScript compilado)

### 2. Usuário Master (ID)
- **Problema:** O seed criava usuário ID 1, mas a função deletava e criava novo com ID 2
- **Solução:** Agora faz UPDATE direto no ID 1, mantendo o ID correto

### 3. Permissões do Usuário
- **Problema:** Usava `'enable'` e faltavam campos
- **Solução:** Corrigido para `'enabled'` e adicionados TODOS os campos:
  - showDashboard, showCampaign, showContacts, showFlow
  - allowRealTime, allowConnections, allowSeeMessagesInPendingTickets
  - allTicket, allHistoric, allUserChat

### 4. Plano Padrão (amount)
- **Problema:** Faltava o campo `amount`, causando tela branca em "Empresas"
- **Solução:** Adicionado `amount = 0` no INSERT e UPDATE do plano

### 5. Pastas Public
- **Problema:** Erro "Directory does not exist" para company1/company2
- **Solução:** Criação automática das pastas public/company1, company2, company3

### 6. Node.js (Cache)
- **Problema:** Após instalar Node.js 20, bash mantinha cache do Node.js 14
- **Solução:** Adicionado `hash -r` e uso de caminho completo `/usr/bin/node`

## Credenciais de Acesso

- **Email:** atendechat123@gmail.com
- **Senha:** chatbot123
- **Perfil:** Admin (acesso total)
- **ID:** 1 (garantido)

## Permissões do Usuário Master

Todas habilitadas com valor `'enabled'`:
- profile = 'admin'
- super = true
- allTicket, allHistoric, allUserChat
- showDashboard, showCampaign, showContacts, showFlow
- allowRealTime, allowConnections
- allowSeeMessagesInPendingTickets
- allowGroup = true

## Plano Padrão

- 999 usuários, 999 conexões, 999 filas
- amount = 0 (CAMPO OBRIGATÓRIO)
- Todas as features habilitadas

## Empresa Principal

- Status: true (ativa)
- Vencimento: 2099-12-31
- planId: associado ao Plano Padrão

## Pastas Criadas Automaticamente

- /home/deploy/{instancia}/backend/public/company1
- /home/deploy/{instancia}/backend/public/company2
- /home/deploy/{instancia}/backend/public/company3
