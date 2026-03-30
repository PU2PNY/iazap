# 🚀 GUIA RÁPIDO - INSTALADOR WHATICKET

## ⚡ Início Rápido

### 1. Fazer Upload do Instalador

```bash
# No seu servidor Ubuntu 20.04
cd /root
```

Faça upload da pasta `instalador_atendechat` para `/root/instalador`

### 2. Dar Permissões

```bash
cd /root/instalador
chmod +x install_primaria install_instancia
chmod +x lib/*.sh utils/*.sh variables/*.sh
```

### 3. Primeira Instalação

```bash
./install_primaria
```

**Você precisará informar:**
- Senha do banco/deploy
- Link do repositório Git
- Nome da instância (sem espaços, minúsculas)
- Limites de conexões e usuários
- Domínio frontend (ex: painel.empresa.com)
- Domínio backend (ex: api.empresa.com)
- Portas (3000-3999 frontend, 4000-4999 backend, 5000-5999 redis)

### 4. Instâncias Adicionais

```bash
./install_instancia
# Escolha opção [0] Instalar Atendechat
```

---

## 📋 Menu de Opções

```
[0] Instalar Atendechat      → Nova instalação
[1] Atualizar Atendechat     → Atualizar código existente
[2] Deletar Atendechat       → Remover completamente
[3] Bloquear Atendechat      → Parar backend (manutenção)
[4] Desbloquear Atendechat   → Reiniciar backend
[5] Alterar domínio         → Trocar URLs
```

---

## ✅ Checklist Pré-Instalação

- [ ] Servidor Ubuntu 20.04 com acesso root
- [ ] Domínios apontados para o IP do servidor
- [ ] Repositório Git do Atendechat acessível
- [ ] Senhas definidas (sem caracteres especiais)
- [ ] Portas planejadas para cada instância

---

## 🔧 Estrutura Criada

```
/home/deploy/
└── [nome-instancia]/
    ├── backend/
    │   ├── .env
    │   ├── dist/
    │   └── src/
    └── frontend/
        ├── .env
        ├── build/
        └── server.js

/etc/nginx/sites-available/
├── [instancia]-backend
└── [instancia]-frontend

Docker:
└── redis-[instancia]

PostgreSQL:
└── Database: [instancia]
└── User: [instancia]
```

---

## 🎯 Exemplo de Instalação

```bash
# Executar
./install_primaria

# Menu aparece, escolher [0]

# Informar dados:
Senha: SuaSenha123
Git: https://github.com/usuario/atendechat.git
Instância: empresa1
Conexões: 10
Usuários: 5
Frontend: https://painel.empresa1.com
Backend: https://api.empresa1.com
Porta Frontend: 3001
Porta Backend: 4001
Porta Redis: 5001

# Aguardar conclusão (10-15 minutos)
# Acessar https://painel.empresa1.com
# Login padrão: atendechat@123.com / chatbot123
```

---

## 🆘 Comandos Úteis

### Ver logs do PM2
```bash
sudo su - deploy
pm2 logs empresa1-backend
pm2 logs empresa1-frontend
```

### Restart manual
```bash
sudo su - deploy
pm2 restart empresa1-backend
pm2 restart empresa1-frontend
```

### Ver instâncias ativas
```bash
sudo su - deploy
pm2 list
```

### Testar Nginx
```bash
nginx -t
systemctl reload nginx
```

### Acessar banco
```bash
sudo su - postgres
psql -d empresa1
\dt  # Listar tabelas
```

---

## ⚠️ Problemas Comuns

### 1. Erro de porta em uso
**Solução:** Use outra porta, cada instância precisa de portas únicas

### 2. SSL não funciona
**Solução:** Verifique se domínios estão apontados antes de instalar

### 3. WebSocket não conecta
**Solução:** Nginx já está configurado corretamente, reinicie nginx

### 4. Banco não cria
**Solução:** Verifique se PostgreSQL está rodando:
```bash
systemctl status postgresql
```

### 5. PM2 não inicia
**Solução:** Verifique logs:
```bash
sudo su - deploy
pm2 logs --err
```

---

## 📊 Monitoramento

### CPU e Memória
```bash
sudo su - deploy
pm2 monit
```

### Espaço em disco
```bash
df -h
```

### Containers Docker
```bash
docker ps
docker stats
```

---

## 🔄 Fluxo de Atualização

1. Executar `./install_instancia`
2. Escolher opção `[1] Atualizar`
3. Informar nome da instância
4. Sistema faz:
   - Para processos
   - Git pull
   - npm install
   - Build
   - Migrations
   - Reinicia processos

---

## 🗑️ Fluxo de Remoção

1. Executar `./install_instancia`
2. Escolher opção `[2] Deletar`
3. Informar nome da instância
4. Sistema remove:
   - Container Redis
   - Configs Nginx
   - Banco PostgreSQL
   - Arquivos da aplicação
   - Processos PM2

---

## 🔐 Segurança

1. **Firewall**: Configure UFW
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

2. **Senhas**: Use senhas fortes
3. **Backups**: Configure backup automático
4. **Updates**: Mantenha sistema atualizado
```bash
apt update && apt upgrade
```

---

## 📞 Suporte

Para problemas técnicos:
1. Verifique logs PM2
2. Verifique logs Nginx
3. Verifique logs PostgreSQL
4. Consulte DIFERENCAS.md para detalhes técnicos

---

## 📚 Documentação Completa

- `README_INSTALADOR.md` - Documentação completa
- `DIFERENCAS.md` - Mudanças do Atendechat
- Código comentado em cada arquivo .sh

---

**Instalador versão:** 1.0.0
**Compatível com:** Ubuntu 20.04, Node 14.x, PostgreSQL 12+
**Última atualização:** Dezembro 2025

🎉 **Boa sorte com suas instalações!**
