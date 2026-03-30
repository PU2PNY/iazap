# ✅ CHECKLIST DE DEPLOYMENT - INSTALADOR WHATICKET

## 📦 ANTES DE COMEÇAR

### Servidor
- [ ] Ubuntu 20.04 LTS instalado e atualizado
- [ ] Acesso root disponível
- [ ] Conexão SSH estável
- [ ] Mínimo 2GB RAM
- [ ] Mínimo 20GB disco disponível
- [ ] IP público atribuído

### DNS
- [ ] Domínio frontend configurado (ex: painel.empresa.com)
- [ ] Domínio backend configurado (ex: api.empresa.com)
- [ ] Registro A apontando para IP do servidor
- [ ] DNS propagado (teste com `ping dominio.com`)
- [ ] Aguardar 5-10 minutos após apontar DNS

### Repositório
- [ ] URL do repositório Atendechat disponível
- [ ] Acesso ao repositório configurado (público ou com token)
- [ ] Branch correto definido (main/master)
- [ ] Código Atendechat compatível com Node 14.x

### Planejamento
- [ ] Nome da instância definido (apenas minúsculas, sem espaços)
- [ ] Porta frontend definida (3000-3999)
- [ ] Porta backend definida (4000-4999)
- [ ] Porta Redis definida (5000-5999)
- [ ] Senha forte definida (sem caracteres especiais)
- [ ] Limites de usuários e conexões definidos

---

## 🚀 PROCESSO DE INSTALAÇÃO

### Passo 1: Upload do Instalador
```bash
# No servidor
cd /root
mkdir instalador
```
- [ ] Fazer upload da pasta `instalador_atendechat`
- [ ] Renomear para `instalador`
- [ ] Verificar que todos os arquivos foram enviados

### Passo 2: Permissões
```bash
cd /root/instalador
chmod +x install_primaria install_instancia
chmod +x lib/*.sh utils/*.sh variables/*.sh
```
- [ ] Executar comandos de permissão
- [ ] Verificar com `ls -l install_primaria`

### Passo 3: Primeira Instalação
```bash
./install_primaria
```
- [ ] Executar script
- [ ] Escolher opção [0] Instalar
- [ ] Informar senha quando solicitado
- [ ] Informar URL do Git
- [ ] Informar nome da instância
- [ ] Informar quantidade de conexões
- [ ] Informar quantidade de usuários
- [ ] Informar domínio frontend
- [ ] Informar domínio backend
- [ ] Informar porta frontend
- [ ] Informar porta backend
- [ ] Informar porta Redis
- [ ] Aguardar conclusão (10-15 minutos)

### Passo 4: Verificação
- [ ] Acessar frontend no navegador
- [ ] Verificar se SSL está ativo (https://)
- [ ] Fazer login no sistema
- [ ] Criar uma conexão WhatsApp teste
- [ ] Enviar mensagem teste
- [ ] Verificar recebimento

---

## 🔍 PÓS-INSTALAÇÃO

### Verificações Técnicas
```bash
# Verificar processos PM2
sudo su - deploy
pm2 list
# Deve mostrar 2 processos: frontend e backend

# Verificar logs
pm2 logs instancia-backend --lines 50
pm2 logs instancia-frontend --lines 50

# Verificar Nginx
nginx -t
systemctl status nginx

# Verificar PostgreSQL
sudo su - postgres
psql -l | grep instancia

# Verificar Redis
docker ps | grep redis-instancia
```

- [ ] PM2 com 2 processos online
- [ ] Logs sem erros críticos
- [ ] Nginx funcionando
- [ ] PostgreSQL com banco criado
- [ ] Redis container rodando

### Testes Funcionais
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] Menu navegável
- [ ] Criar usuário
- [ ] Criar conexão WhatsApp
- [ ] Gerar QR Code
- [ ] Conectar WhatsApp
- [ ] Enviar mensagem
- [ ] Receber mensagem
- [ ] WebSocket conectado

### Segurança
```bash
# Configurar firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable

# Verificar usuários
cat /etc/passwd | grep deploy

# Verificar permissões
ls -la /home/deploy/
```

- [ ] Firewall configurado
- [ ] Apenas portas necessárias abertas
- [ ] Usuário deploy criado
- [ ] Permissões corretas nos arquivos

---

## 📝 DOCUMENTAÇÃO

### Informações para Guardar
```
INSTÂNCIA: __________________
FRONTEND: ___________________
BACKEND: ____________________
PORTA FRONTEND: _____________
PORTA BACKEND: ______________
PORTA REDIS: ________________
SENHA DEPLOY: _______________
SENHA BANCO: ________________
DATA INSTALAÇÃO: ____________
```

### Backups
- [ ] Anotar todas as senhas em local seguro
- [ ] Documentar portas utilizadas
- [ ] Salvar informações de acesso
- [ ] Criar backup do banco de dados
- [ ] Criar backup dos arquivos .env

---

## 🔄 INSTALAÇÃO DE NOVA INSTÂNCIA

Quando for instalar uma segunda instância:

### Preparação
- [ ] Definir novo nome (diferente da primeira)
- [ ] Definir novas portas (não repetir)
- [ ] Configurar novos domínios
- [ ] Anotar informações da nova instância

### Execução
```bash
cd /root/instalador
./install_instancia
# Escolher opção [0]
```
- [ ] Informar novos dados
- [ ] Aguardar instalação
- [ ] Verificar funcionamento
- [ ] Atualizar documentação

---

## 🆘 TROUBLESHOOTING

### Se der erro durante instalação:

1. **Erro de porta**
   - [ ] Verificar se porta já está em uso: `netstat -tlnp | grep PORTA`
   - [ ] Usar outra porta

2. **Erro SSL**
   - [ ] Verificar propagação DNS: `nslookup dominio.com`
   - [ ] Aguardar mais tempo
   - [ ] Tentar novamente

3. **Erro Node/NPM**
   - [ ] Verificar versão: `node -v` (deve ser 14.x)
   - [ ] Reinstalar se necessário

4. **Erro PostgreSQL**
   - [ ] Verificar serviço: `systemctl status postgresql`
   - [ ] Verificar extensão: `psql -d instancia -c "\dx"`
   - [ ] Reinstalar extensão se necessário

5. **Erro PM2**
   - [ ] Ver logs: `pm2 logs --err`
   - [ ] Reiniciar: `pm2 restart all`
   - [ ] Verificar caminhos nos arquivos .env

---

## 📊 MONITORAMENTO CONTÍNUO

### Diário
- [ ] Verificar processos PM2: `pm2 list`
- [ ] Verificar uso de disco: `df -h`
- [ ] Verificar logs de erro

### Semanal
- [ ] Backup do banco de dados
- [ ] Verificar atualizações de segurança
- [ ] Limpar logs antigos

### Mensal
- [ ] Atualizar Atendechat (se disponível)
- [ ] Revisar uso de recursos
- [ ] Verificar certificados SSL

---

## 🔄 ATUALIZAÇÃO

Quando houver nova versão do Atendechat:

### Preparação
- [ ] Fazer backup completo
- [ ] Anotar versão atual
- [ ] Ler changelog da nova versão
- [ ] Testar em ambiente de staging (se possível)

### Execução
```bash
cd /root/instalador
./install_instancia
# Escolher opção [1] Atualizar
# Informar nome da instância
```
- [ ] Aguardar atualização (3-5 minutos)
- [ ] Verificar logs
- [ ] Testar funcionalidades
- [ ] Confirmar funcionamento

### Se der problema
- [ ] Verificar logs PM2
- [ ] Reiniciar processos se necessário
- [ ] Restaurar backup em último caso

---

## 🗑️ REMOÇÃO DE INSTÂNCIA

Se precisar remover uma instância:

### Antes de Remover
- [ ] Fazer backup final do banco
- [ ] Exportar dados importantes
- [ ] Anotar informações para histórico
- [ ] Confirmar com cliente

### Remoção
```bash
cd /root/instalador
./install_instancia
# Escolher opção [2] Deletar
# Confirmar nome da instância
```
- [ ] Aguardar remoção
- [ ] Verificar limpeza completa
- [ ] Atualizar documentação
- [ ] Liberar portas utilizadas

---

## 📞 CONTATOS IMPORTANTES

```
SERVIDOR:
- IP: _______________
- SSH: ______________
- Root: _____________

CLIENTE:
- Nome: _____________
- Email: ____________
- Telefone: _________

DOMÍNIOS:
- Frontend: _________
- Backend: __________
- Registrador: ______
```

---

## ✅ CHECKLIST FINAL

Antes de entregar ao cliente:

- [ ] Sistema instalado e funcionando
- [ ] SSL ativo e válido
- [ ] WhatsApp conectando corretamente
- [ ] Envio/recebimento de mensagens OK
- [ ] Usuários criados e testados
- [ ] Documentação entregue
- [ ] Senhas compartilhadas com segurança
- [ ] Treinamento realizado (se aplicável)
- [ ] Cliente satisfeito

---

## 📚 ARQUIVOS DE REFERÊNCIA

Durante o processo, consulte:

1. **INICIO_RAPIDO.md** - Comandos essenciais
2. **README_INSTALADOR.md** - Documentação completa
3. **DIFERENCAS.md** - Detalhes técnicos
4. **RESUMO_EXECUTIVO.md** - Visão geral

---

## 🎉 PRONTO!

Se você completou todos os itens deste checklist, sua instalação está:

- ✅ Funcional
- ✅ Segura
- ✅ Documentada
- ✅ Monitorada
- ✅ Pronta para produção

**Parabéns! 🚀**

---

**Versão do Checklist:** 1.0.0
**Última Atualização:** Dezembro 2025
**Compatibilidade:** Instalador Atendechat 1.0.0
