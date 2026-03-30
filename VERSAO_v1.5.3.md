# Instalador AtendeChat v1.5.3

## Data: 29/12/2025

## Correções Críticas nesta Versão

### 1. API Oficial - Empresa não criada (CORRIGIDO)
**Problema:** A tabela `company` na API Oficial ficava vazia após instalação, causando erro:
```
CreateCompanyConnectionOficial: Cannot read properties of undefined (reading 'data')
```

**Solução:** Adicionada função `api_oficial_create_company()` que cria automaticamente a empresa padrão na API Oficial após o migrate.

### 2. Backend - URL_API_OFICIAL sem https:// (CORRIGIDO)
**Problema:** A variável `URL_API_OFICIAL` no .env do backend era salva sem o prefixo `https://`, causando falha na comunicação.

**Solução:** Adicionada função `backend_update_api_oficial_token()` que:
- Normaliza o URL com `https://`
- Adiciona as variáveis USE_WHATSAPP_OFICIAL, URL_API_OFICIAL e TOKEN_API_OFICIAL
- Reinicia o backend automaticamente

### 3. Plano e Empresa Padrão (CORRIGIDO)
**Problema:** Sistema ficava sem plano padrão, impossibilitando uso.

**Solução:** Função `backend_create_default_plan_company()` que cria:
- Plano Padrão (10 usuários, 10 conexões, 10 filas, todas features)
- Atualiza Empresa com o plano, email e data de vencimento (2094)

### 4. TOKEN_ADMIN no Webhook (CORRIGIDO)
**Problema:** Webhook não aceitava TOKEN_ADMIN para verificação.

**Solução:** `webhook.service.ts` agora verifica:
1. TOKEN_ADMIN primeiro (token master)
2. token_mult100 específico da conexão

### 5. WebSocket receivedMessageWhatsAppOficial (CORRIGIDO)
**Problema:** Mensagens recebidas não eram enviadas ao backend via WebSocket.

**Solução:** `socket.service.ts` envia evento `receivedMessageWhatsAppOficial` corretamente.

---

## Ordem de Instalação Atualizada

```
1. backend_db_seed
2. backend_create_default_plan_company  ← NOVO
3. backend_setup_master_user
4. backend_start_pm2
...
6. api_oficial_db_migrate
7. api_oficial_create_company           ← NOVO
8. api_oficial_start_pm2
9. backend_update_api_oficial_token     ← NOVO
```

## Credenciais Padrão
- **Email:** atendechat123@gmail.com
- **Senha:** chatbot123

## Arquivos Modificados
- `lib/_api_oficial.sh` - Novas funções
- `lib/_backend.sh` - Nova função backend_create_default_plan_company
- `install_primaria` - Chamadas às novas funções
- `install_instancia` - Chamadas às novas funções
- `api_oficial/src/resources/v1/webhook/webhook.service.ts` - TOKEN_ADMIN
- `api_oficial/src/@core/infra/socket/socket.service.ts` - receivedMessageWhatsAppOficial

## Histórico de Versões

### v1.5.3 (29/12/2025) - ATUAL ✅
- ✅ Criação automática de empresa na API Oficial
- ✅ URL_API_OFICIAL com https://
- ✅ Plano e Empresa padrão criados automaticamente
- ✅ TOKEN_ADMIN no webhook
- ✅ WebSocket receivedMessageWhatsAppOficial

### v1.5.2 (23/12/2025)
- ✅ Verificação em 16 fases
- ✅ Correções de branding

### v1.5.0 (16/12/2025)
- ✅ Correção sincronização de templates
- ✅ Auto-detecção de QuickMessage com botões

### v1.4.3 (09/12/2025)
- ✅ Verificação automática Node.js 20+

---

**Status:** PRONTO PARA PRODUÇÃO ✅
