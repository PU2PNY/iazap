# Instalador Atendechat Multi-Instância

Sistema de instalação automatizada do Atendechat com suporte a múltiplas instâncias no mesmo servidor.

## 🚀 Características

- ✅ Instalação automatizada completa
- ✅ Suporte a múltiplas instâncias
- ✅ Node.js 14.x com NPM 9.6.2+
- ✅ PostgreSQL com extensão uuid-ossp
- ✅ Redis via Docker
- ✅ Nginx com SSL automático (Certbot)
- ✅ PM2 para gerenciamento de processos
- ✅ WebSocket configurado corretamente

## 📋 Pré-requisitos

- Ubuntu 20.04 LTS
- Acesso root ao servidor
- Domínios apontados para o servidor (frontend e backend)
- Repositório Git do Atendechat

## 🔧 Instalação

### 1. Primeira Instalação (Instalação Primária)

Para a primeira instalação no servidor:

```bash
# Clone o instalador
git clone <seu-repositorio> /root/instalador
cd /root/instalador

# Dê permissão de execução
chmod +x install_primaria

# Execute a instalação
./install_primaria
```

### 2. Instalações Subsequentes (Novas Instâncias)

Para instalar novas instâncias no mesmo servidor:

```bash
cd /root/instalador
chmod +x install_instancia
./install_instancia
```

## 📖 Opções do Menu

O instalador oferece as seguintes opções:

- **[0] Instalar Atendechat** - Instala uma nova instância
- **[1] Atualizar Atendechat** - Atualiza uma instância existente
- **[2] Deletar Atendechat** - Remove completamente uma instância
- **[3] Bloquear Atendechat** - Para o backend de uma instância
- **[4] Desbloquear Atendechat** - Reinicia o backend de uma instância
- **[5] Alter. dominio Atendechat** - Altera os domínios de uma instância

## 🔐 Informações Necessárias

Durante a instalação, você precisará informar:

1. **Senha do Deploy** - Senha para o usuário deploy e banco de dados
2. **Link do Git** - URL do repositório Atendechat
3. **Nome da Instância** - Nome único (sem espaços ou caracteres especiais)
4. **Limite de Conexões** - Quantidade máxima de WhatsApp
5. **Limite de Usuários** - Quantidade máxima de atendentes
6. **Domínio Frontend** - URL do painel (ex: painel.seudominio.com)
7. **Domínio Backend** - URL da API (ex: api.seudominio.com)
8. **Porta Frontend** - Entre 3000-3999
9. **Porta Backend** - Entre 4000-4999
10. **Porta Redis** - Entre 5000-5999

## 📁 Estrutura de Pastas

```
/home/deploy/
├── instancia1/
│   ├── backend/
│   │   ├── .env
│   │   ├── dist/
│   │   └── ...
│   └── frontend/
│       ├── .env
│       ├── build/
│       ├── server.js
│       └── ...
├── instancia2/
└── instancia3/
```

## ⚙️ Configurações Técnicas

### Node.js & NPM
- Node.js: v14.21.3
- NPM: 9.6.2+

### Banco de Dados
- PostgreSQL com extensão uuid-ossp
- Um banco por instância
- Usuário com permissões SUPERUSER

### Redis
- Um container Docker por instância
- Porta única para cada instância

### Nginx
- Configuração com WebSocket
- SSL automático via Certbot
- Proxy reverso para frontend e backend

### PM2
- Um processo para frontend
- Um processo para backend
- Restart automático

## 🔄 Atualizando uma Instância

```bash
cd /root/instalador
./install_instancia
# Escolha opção [1] e informe o nome da instância
```

O processo de atualização:
1. Para os processos PM2
2. Faz git pull
3. Instala dependências
4. Reconstrói o código
5. Executa migrations e seeds
6. Reinicia os processos

## 🗑️ Removendo uma Instância

```bash
cd /root/instalador
./install_instancia
# Escolha opção [2] e informe o nome da instância
```

Isso irá remover:
- Container Redis
- Configurações Nginx
- Banco de dados PostgreSQL
- Arquivos da aplicação
- Processos PM2

## 🔒 Bloqueio/Desbloqueio

Para bloquear temporariamente uma instância (para manutenção ou inadimplência):

```bash
./install_instancia
# Escolha opção [3] e informe o nome da instância
```

Para desbloquear:

```bash
./install_instancia
# Escolha opção [4] e informe o nome da instância
```

## 🌐 Alterando Domínios

Para alterar os domínios de uma instância:

```bash
./install_instancia
# Escolha opção [5]
# Informe o nome da instância e os novos domínios
```

## ⚠️ Observações Importantes

1. **Portas**: Cada instância deve ter portas únicas
2. **Domínios**: Devem estar apontados antes da instalação
3. **Nomes**: Use apenas letras minúsculas sem espaços
4. **Senhas**: Evite caracteres especiais na senha do banco
5. **Git**: O repositório deve estar acessível sem autenticação ou com token

## 🐛 Troubleshooting

### Erro de WebSocket
Verifique se a configuração do Nginx inclui:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
```

### Erro no PostgreSQL
Certifique-se de que a extensão uuid-ossp foi instalada:
```bash
sudo su - postgres
psql -d nome_instancia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### PM2 não inicia
Verifique os logs:
```bash
sudo su - deploy
pm2 logs nome-instancia-backend
pm2 logs nome-instancia-frontend
```

## 📞 Suporte

Para suporte, entre em contato através dos canais oficiais do seu provedor.

## 📝 Licença

Este instalador é fornecido "como está" sem garantias.

---

**Versão**: 1.0.0
**Compatibilidade**: Ubuntu 20.04 LTS
**Última Atualização**: 2025
