# Instalador AtendeChat v1.5.5

## Data: 05/01/2026

## Correções Críticas nesta Versão

### 1. Erro "Cannot find module 'bcryptjs'" RESOLVIDO
**Problema:** A função `backend_setup_master_user()` usava Node.js com bcryptjs, mas o módulo não estava disponível em `/tmp/`.

**Solução:** Reescrita completa usando **SQL direto com hash pré-gerado**. Não depende mais de Node.js ou módulos npm.

### 2. Empresa não associada ao Plano RESOLVIDO
**Problema:** A query usava `SELECT id FROM "Plans" WHERE name = 'Plano Padrão'` mas o seed cria o plano com nome "Plano 1".

**Solução:** Alterado para usar `"planId" = 1` diretamente.

### 3. Correções anteriores mantidas:
- `.sequelizerc` aponta para `dist/`
- Permissões do usuário usam `'enabled'`
- Campo `amount = 0` no plano
- Pastas `public/company1,2,3` criadas automaticamente
- Node.js com `hash -r` para limpar cache

## Credenciais de Acesso

- **Email:** atendechat123@gmail.com
- **Senha:** chatbot123
- **Perfil:** Admin (acesso total)
- **Hash bcrypt:** $2a$10$ppKfuD84NiEjRZDyXfk9xOMby.VMBA9nWKa9RUWMl.ttcQHqoS4sG

## Permissões do Usuário Master

Todas habilitadas:
- profile = 'admin', super = true
- allTicket, allHistoric, allUserChat = 'enabled'
- showDashboard, showCampaign, showContacts, showFlow = 'enabled'
- allowRealTime, allowConnections, allowSeeMessagesInPendingTickets = 'enabled'
- allowGroup = true

## Plano (ID 1)

- 999 usuários, 999 conexões, 999 filas
- amount = 0
- Todas as features habilitadas

## Empresa (ID 1)

- planId = 1 (associação direta)
- Status: true
- Vencimento: 2099-12-31
