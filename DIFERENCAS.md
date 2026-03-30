# PRINCIPAIS ALTERAÇÕES - ATENDECHAT → WHATICKET

## 📋 Resumo das Mudanças

### 1. Node.js e NPM
**ANTES (Atendechat):**
- Node.js: v20.x
- NPM: latest

**DEPOIS (Atendechat):**
- Node.js: v14.21.3
- NPM: 9.6.2+

**Arquivo alterado:** `lib/_system.sh` (função `system_node_install`)

---

### 2. PostgreSQL - Extensão UUID
**NOVO (Atendechat):**
- Adicionada criação automática da extensão uuid-ossp
- Necessário para o funcionamento do Atendechat

**Arquivo alterado:** `lib/_backend.sh` (função `backend_redis_create`)

**Comando adicionado:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### 3. Nginx - Configuração WebSocket
**ANTES (Atendechat):**
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

**DEPOIS (Atendechat):**
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";  # Aspas duplas
```

**Arquivos alterados:**
- `lib/_backend.sh` (função `backend_nginx_setup`)
- `lib/_frontend.sh` (função `frontend_nginx_setup`)
- `lib/_system.sh` (função `configurar_dominio`)

---

### 4. Backend - Comandos de Atualização
**ANTES (Atendechat):**
```bash
npm install
npm update -f
npm install @types/fs-extra
npx sequelize db:migrate
npx sequelize db:migrate
npx sequelize db:seed
```

**DEPOIS (Atendechat):**
```bash
npm install --force
npm run build
npm run db:migrate
npm run db:seed
```

**Arquivo alterado:** `lib/_backend.sh` (função `backend_update`)

---

### 5. Frontend - Variáveis de Ambiente
**ANTES (Atendechat):**
```env
REACT_APP_BACKEND_URL=${backend_url}
REACT_APP_HOURS_CLOSE_TICKETS_AUTO = 24
```

**DEPOIS (Atendechat):**
```env
REACT_APP_BACKEND_URL=${backend_url}
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24  # Sem espaços
```

**Arquivo alterado:** `lib/_frontend.sh` (função `frontend_set_env`)

---

### 6. Git Clone
**ANTES (Atendechat):**
- URL hardcoded no código

**DEPOIS (Atendechat):**
- Solicita URL do repositório durante instalação
- Mais flexível para diferentes fontes

**Arquivos alterados:**
- `lib/_system.sh` (função `system_git_clone`)
- `lib/_inquiry.sh` (adicionada função `get_link_git`)

---

### 7. Banner e Mensagens
**ANTES:**
- Logo e mensagens do Atendechat

**DEPOIS:**
- Logo e mensagens do Atendechat
- Informações de suporte genéricas

**Arquivo alterado:** `utils/_banner.sh`

---

### 8. Backend - Variáveis de Ambiente Removidas
**REMOVIDAS do .env:**
- `npm_package_version="6.0.1"` (não necessária no Atendechat)

**Arquivo alterado:** `lib/_backend.sh` (função `backend_set_env`)

---

## 🔍 Checklist de Verificação

Antes de usar o instalador, verifique:

- [ ] Node.js será instalado na versão 14.x
- [ ] NPM será atualizado para 9.6.2+
- [ ] PostgreSQL tem suporte a uuid-ossp
- [ ] Nginx configurado com WebSocket correto
- [ ] URL do repositório Git está disponível
- [ ] Domínios estão apontados para o servidor

---

## 📝 Notas de Compatibilidade

### Compatível com:
- ✅ Ubuntu 20.04 LTS
- ✅ PostgreSQL 12+
- ✅ Redis 7.x
- ✅ Nginx 1.18+

### Testado com:
- Atendechat versões compatíveis com Node 14.x
- Múltiplas instâncias simultâneas
- SSL via Certbot

---

## ⚙️ Configurações Específicas do Atendechat

### 1. Estrutura de Pastas
```
/home/deploy/[instancia]/
├── backend/
│   ├── dist/        # Código compilado
│   ├── src/         # Código fonte
│   └── .env
└── frontend/
    ├── build/       # Build de produção
    ├── src/
    ├── .env
    └── server.js    # Servidor Express
```

### 2. PM2 - Backend
O backend é iniciado apontando para `dist/server.js`:
```bash
pm2 start dist/server.js --name instancia-backend
```

### 3. PM2 - Frontend
O frontend usa um servidor Express customizado:
```javascript
const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname, "build")));
app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.listen(PORT);
```

---

## 🚨 Avisos Importantes

1. **Node 14 está em EOL**: Considere atualizar o Atendechat para versões mais recentes do Node.js quando possível

2. **NPM 9.6.2+**: Esta versão específica é requerida para compatibilidade

3. **UUID-OSSP**: Sem essa extensão, o Atendechat não funcionará corretamente

4. **WebSocket**: A configuração correta é crucial para funcionamento do WhatsApp Web

5. **Backup**: Sempre faça backup antes de atualizar ou alterar uma instância

---

## 📚 Comandos Úteis

### Verificar versões instaladas:
```bash
node -v          # Deve mostrar v14.x.x
npm -v           # Deve mostrar 9.6.2 ou superior
psql --version   # Verificar PostgreSQL
```

### Verificar extensão PostgreSQL:
```bash
sudo su - postgres
psql -d nome_instancia
\dx              # Lista extensões instaladas
```

### Logs PM2:
```bash
sudo su - deploy
pm2 logs instancia-backend --lines 100
pm2 logs instancia-frontend --lines 100
```

### Restart manual:
```bash
sudo su - deploy
pm2 restart instancia-backend
pm2 restart instancia-frontend
pm2 save
```

### Verificar Nginx:
```bash
nginx -t                    # Testa configuração
systemctl status nginx      # Status do serviço
tail -f /var/log/nginx/error.log  # Logs de erro
```

---

## 🔄 Fluxo de Instalação

```
1. install_primaria OU install_instancia
   ↓
2. Escolhe opção no menu
   ↓
3. Informa dados (senha, URLs, portas, etc)
   ↓
4. Sistema instala/atualiza/remove
   ↓
5. Configuração automática Nginx + SSL
   ↓
6. Aplicação pronta para uso
```

---

## 💡 Dicas de Uso

1. **Primeira vez**: Use `install_primaria` apenas no primeiro uso
2. **Novas instâncias**: Use `install_instancia` para adicionar mais clientes
3. **Atualização**: Sempre teste em ambiente de staging primeiro
4. **Portas**: Mantenha um documento com portas usadas por cada instância
5. **Backup**: Configure backup automático do PostgreSQL

---

**Documento criado em:** 2025
**Versão do instalador:** 1.0.0
