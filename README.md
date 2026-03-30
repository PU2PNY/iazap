# 🚀 INSTALADOR WHATICKET - MULTI-INSTÂNCIA

Sistema completo de instalação e gerenciamento do Atendechat com suporte a múltiplas instâncias no mesmo servidor.

---

## 📖 Documentação Disponível

Escolha o documento mais adequado para sua necessidade:

### 🎯 [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
**→ Começar a usar AGORA**
- Comandos essenciais
- Exemplos práticos
- Guia passo a passo
- **👉 COMECE POR AQUI!**

### 📚 [README_INSTALADOR.md](README_INSTALADOR.md)
**→ Documentação Completa**
- Todos os recursos detalhados
- Configurações avançadas
- Troubleshooting completo
- Guias de uso extensos

### 🔍 [DIFERENCAS.md](DIFERENCAS.md)
**→ Detalhes Técnicos**
- Mudanças do Atendechat
- Comparativo técnico
- Notas de compatibilidade
- Explicações de código

### 📊 [RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)
**→ Visão Geral**
- O que foi feito
- Estrutura do projeto
- Métricas e estatísticas
- Resumo executivo

### ✅ [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)
**→ Guia de Deploy**
- Checklist pré-instalação
- Passo a passo detalhado
- Verificações pós-instalação
- Lista de troubleshooting

---

## ⚡ Início Rápido

### 1. Primeira Vez (Instalação Primária)
```bash
cd /root/instalador
chmod +x install_primaria
./install_primaria
```

### 2. Novas Instâncias / Gerenciamento
```bash
cd /root/instalador
chmod +x install_instancia
./install_instancia
```

### 3. Opções Disponíveis
- `[0]` Instalar nova instância
- `[1]` Atualizar instância existente
- `[2]` Deletar instância
- `[3]` Bloquear instância (manutenção)
- `[4]` Desbloquear instância
- `[5]` Alterar domínios

---

## 🎯 Características Principais

✅ **Instalação Automatizada**
- Zero configuração manual
- Tudo configurado automaticamente
- SSL automático via Certbot

✅ **Multi-Instância**
- Múltiplos clientes no mesmo servidor
- Isolamento completo entre instâncias
- Gerenciamento individual

✅ **Tecnologias**
- Node.js 14.21.3
- NPM 9.6.2+
- PostgreSQL com uuid-ossp
- Redis via Docker
- Nginx com WebSocket
- PM2 para processos

✅ **Gerenciamento**
- Instalar, atualizar, remover
- Bloquear/desbloquear clientes
- Alterar domínios facilmente
- Monitoramento integrado

---

## 📋 Requisitos

- **Sistema Operacional**: Ubuntu 20.04 LTS
- **Acesso**: Root via SSH
- **Recursos**: Mínimo 2GB RAM, 20GB disco
- **DNS**: Domínios configurados
- **Git**: Repositório Atendechat acessível

---

## 📁 Estrutura do Projeto

```
instalador_atendechat/
│
├── 📄 Documentação
│   ├── INICIO_RAPIDO.md          → Guia rápido
│   ├── README_INSTALADOR.md      → Doc completa
│   ├── DIFERENCAS.md             → Detalhes técnicos
│   ├── RESUMO_EXECUTIVO.md       → Visão geral
│   └── CHECKLIST_DEPLOYMENT.md   → Checklist deploy
│
├── 🔧 Scripts Principais
│   ├── install_primaria          → Primeira instalação
│   ├── install_instancia         → Gerenciamento
│   └── config                    → Configurações
│
├── 📚 Bibliotecas
│   ├── lib/_backend.sh           → Funções backend
│   ├── lib/_frontend.sh          → Funções frontend
│   ├── lib/_system.sh            → Funções sistema
│   ├── lib/_inquiry.sh           → Interação usuário
│   └── lib/manifest.sh           → Carregador
│
├── 🎨 Utilitários
│   ├── utils/_banner.sh          → Banner ASCII
│   └── utils/manifest.sh         → Carregador
│
└── ⚙️ Variáveis
    ├── variables/_app.sh         → Vars aplicação
    ├── variables/_fonts.sh       → Cores/fontes
    ├── variables/_background.sh  → Backgrounds
    ├── variables/_general.sh     → Vars gerais
    └── variables/manifest.sh     → Carregador
```

---

## 🚀 Exemplo de Uso

### Instalando Primeira Instância

```bash
# 1. Fazer upload do instalador para /root/instalador

# 2. Dar permissões
cd /root/instalador
chmod +x install_primaria install_instancia
chmod +x lib/*.sh utils/*.sh variables/*.sh

# 3. Executar instalação
./install_primaria

# 4. Seguir o menu:
# - Escolher opção [0]
# - Informar senha: SuaSenha123
# - Informar Git: https://github.com/usuario/atendechat.git
# - Informar nome: empresa1
# - Informar conexões: 10
# - Informar usuários: 5
# - Informar frontend: https://painel.empresa1.com
# - Informar backend: https://api.empresa1.com
# - Informar porta frontend: 3001
# - Informar porta backend: 4001
# - Informar porta redis: 5001

# 5. Aguardar conclusão (10-15 minutos)

# 6. Acessar https://painel.empresa1.com
```

### Instalando Segunda Instância

```bash
cd /root/instalador
./install_instancia

# Escolher opção [0]
# Informar dados da nova instância com portas diferentes
# Aguardar conclusão
```

### Atualizando uma Instância

```bash
cd /root/instalador
./install_instancia

# Escolher opção [1]
# Informar nome da instância
# Aguardar atualização (3-5 minutos)
```

---

## 🔧 Comandos Úteis

### Verificar Processos
```bash
sudo su - deploy
pm2 list
```

### Ver Logs
```bash
sudo su - deploy
pm2 logs instancia-backend
pm2 logs instancia-frontend
```

### Restart Manual
```bash
sudo su - deploy
pm2 restart instancia-backend
pm2 restart instancia-frontend
```

### Verificar Nginx
```bash
nginx -t
systemctl status nginx
```

### Verificar PostgreSQL
```bash
sudo su - postgres
psql -l | grep instancia
```

### Verificar Redis
```bash
docker ps | grep redis
```

---

## 📊 O que é Instalado

### Por Servidor (Uma Vez)
- Node.js 14.21.3
- NPM 9.6.2
- PostgreSQL
- Docker
- Nginx
- Certbot
- PM2 Global
- Usuário `deploy`

### Por Instância
- Container Redis dedicado (porta única)
- Banco PostgreSQL dedicado
- 2 processos PM2 (frontend + backend)
- Configuração Nginx (2 sites)
- Certificado SSL
- Arquivos em `/home/deploy/[instancia]`

---

## 🎓 Aprender Mais

### Documentação Recomendada

1. **Primeiro uso?** 
   → Leia [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

2. **Quer entender tudo?**
   → Leia [README_INSTALADOR.md](README_INSTALADOR.md)

3. **Curiosidade técnica?**
   → Leia [DIFERENCAS.md](DIFERENCAS.md)

4. **Vai fazer deploy?**
   → Leia [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)

5. **Visão executiva?**
   → Leia [RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)

---

## ⚠️ Notas Importantes

### ✅ Faça Sempre
- Leia a documentação antes de instalar
- Configure DNS antes de começar
- Use senhas fortes
- Faça backups regularmente
- Teste em staging primeiro (se possível)

### ❌ Nunca Faça
- Instalar sem ler documentação
- Usar mesmas portas para instâncias diferentes
- Usar caracteres especiais em senhas do banco
- Deletar instâncias sem backup
- Ignorar mensagens de erro

---

## 🆘 Precisa de Ajuda?

1. **Erro durante instalação?**
   → Consulte seção Troubleshooting em [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

2. **Dúvida sobre configuração?**
   → Consulte [README_INSTALADOR.md](README_INSTALADOR.md)

3. **Problema técnico específico?**
   → Consulte [DIFERENCAS.md](DIFERENCAS.md)

4. **Precisa fazer deploy?**
   → Siga [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)

---

## 📈 Status do Projeto

- **Versão**: 1.0.0
- **Status**: ✅ Produção
- **Compatibilidade**: Ubuntu 20.04, Node 14.x
- **Última Atualização**: Dezembro 2025
- **Linhas de Código**: ~1500
- **Arquivos**: 17
- **Documentação**: 5 guias completos

---

## 🏆 Funcionalidades

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Instalação Automatizada | ✅ | Zero configuração manual |
| Multi-Instância | ✅ | Múltiplos clientes isolados |
| SSL Automático | ✅ | Certbot integrado |
| WebSocket | ✅ | Configurado corretamente |
| PostgreSQL | ✅ | Com extensão uuid-ossp |
| Redis | ✅ | Via Docker isolado |
| PM2 | ✅ | Gerenciamento de processos |
| Atualização | ✅ | Update sem downtime |
| Remoção Limpa | ✅ | Remove tudo completamente |
| Bloqueio | ✅ | Para backend facilmente |
| Troca Domínios | ✅ | Altere URLs rapidamente |
| Logs | ✅ | Integrado com PM2 |
| Monitoramento | ✅ | PM2 monit disponível |
| Backup | ⚠️ | Manual (automatize!) |
| Documentação | ✅ | 5 guias completos |

---

## 💡 Dicas de Sucesso

1. **Planeje antes de instalar**
   - Defina nomes das instâncias
   - Planeje as portas (use planilha)
   - Configure DNS com antecedência

2. **Use um padrão**
   - Nomes: empresa1, empresa2, etc
   - Frontend: 3001, 3002, 3003...
   - Backend: 4001, 4002, 4003...
   - Redis: 5001, 5002, 5003...

3. **Documente tudo**
   - Anote senhas em local seguro
   - Mantenha lista de portas usadas
   - Registre dados de cada cliente

4. **Faça backups**
   - Configure backup automático do PostgreSQL
   - Backup diário é recomendado
   - Teste restauração periodicamente

5. **Monitore**
   - Use `pm2 monit` regularmente
   - Verifique logs diariamente
   - Configure alertas se possível

---

## 🎉 Pronto para Começar?

1. 📖 Leia [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
2. ✅ Siga [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)
3. 🚀 Execute `./install_primaria`
4. 🎊 Sucesso!

---

## 📞 Informações

- **Projeto**: Instalador Atendechat Multi-Instância
- **Versão**: 1.0.0
- **Licença**: Uso interno
- **Suporte**: Via documentação incluída
- **Data**: Dezembro 2025

---

**💡 Lembre-se**: Comece lendo [INICIO_RAPIDO.md](INICIO_RAPIDO.md) para um início rápido e bem-sucedido!

**🔥 Importante**: Sempre faça backup antes de qualquer operação!

**✨ Sucesso**: Siga a documentação e você terá sucesso garantido!

---

Made with ❤️ for Atendechat users
