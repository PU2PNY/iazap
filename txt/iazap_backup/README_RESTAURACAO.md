# Instruções de Backup e Restauração do IA-Zap

## Dados Inclusos no Backup

Este backup contém os seguintes dados do IA-Zap:

1. **Agendamentos** (Schedules)
2. **Tags** (Classificações de Contatos)
3. **Listas** (Lists/ContactLists)
4. **Respostas Rápidas** (QuickMessages)
5. **Atendimentos/Tickets** (Tickets - abertos, fechados, resolvidos)
6. **Conversas** (Messages - histórico de conversa)

## Estrutura de Arquivos

```
iazap_backup/
├── schedules_YYYYMMDD_HHMMSS.sql          # Agendamentos
├── tags_YYYYMMDD_HHMMSS.sql              # Tags
├── lists_YYYYMMDD_HHMMSS.sql             # Listas de Contatos
├── quickreplies_YYYYMMDD_HHMMSS.sql    # Respostas Rápidas
├── tickets_YYYYMMDD_HHMMSS.sql          # Atendimentos
├── conversations_YYYYMMDD_HHMMSS.sql   # Conversas
└── README_RESTAURACAO.md               # Este arquivo
```

## Como Restaurar na Nova Instância

### Opção 1: Restaurar Todos os Backups de Uma Vez (Recomendado)

```bash
bash /root/restore_all_iazap_backups.sh /root/iazap_backup
```

Este script:
- Encontra todos os arquivos .sql na pasta
- Restaura cada tabela sequencialmente
- Mostra o status de cada restauração
- Relata o resultado final

### Opção 2: Restaurar Um Arquivo Específíico

```bash
bash /root/restore_iazap_backup.sh /root/iazap_backup/schedules_YYYYMMDD_HHMMSS.sql
```

Use este comando para restaurar tabelas individuais se necessário.

## Configuração do Banco de Dados

Os scripts de restauração pressupem:

- **Banco de Dados:** iazap
- **Usuário:** iazap
- **Senha:** p4rliament
- **Host:** localhost
- **Porta:** 5432

### Se as Credenciais Forem Diferentes

Edite os scripts de restauração e altere as variáveis:

```bash
DB_USER="seu_usuario"
DB_PASS="sua_senha"
DB_HOST="seu_host"
DB_PORT="sua_porta"
```

## Pré-Requisitos

1. **PostgreSQL instalado e rodando** na nova instância
2. **Banco de dados "iazap" criado**
3. **Usuário "iazap" criado** (ou ajuste o script)
4. **psql** (cliente PostgreSQL) instalado

### Criar Banco e Usuário (se necessário)

```bash
# Conectar como superuser
sudo -u postgres psql

# Dentro do psql:
CREATE USER iazap WITH PASSWORD 'p4rliament';
CREATE DATABASE iazap OWNER iazap;
ALTER ROLE iazap CREATEDB;

# Sair
\q
```

## Processo Passo a Passo

### 1. Preparar a Nova Instância

```bash
# Instalar PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Criar banco e usuário (conforme acima)
```

### 2. Transferir os Backups

Copie a pasta `iazap_backup/` para a nova instância:

```bash
# De origem (instância atual)
tar -czf iazap_backup.tar.gz /root/iazap_backup/
scp iazap_backup.tar.gz usuario@novo_servidor:/root/

# No novo servidor
cd /root
tar -xzf iazap_backup.tar.gz
```

### 3. Executar Restauração

```bash
bash /root/restore_all_iazap_backups.sh /root/iazap_backup
```

### 4. Verificar Resultado

Verifique se as tabelas foram restauradas:

```bash
PGPASSWORD='p4rliament' psql -U iazap -d iazap -c "SELECT COUNT(*) FROM schedules; SELECT COUNT(*) FROM tags; SELECT COUNT(*) FROM tickets;"
```

## Troubleshooting

### Erro: "role iazap does not exist"

Crie o usuário no PostgreSQL conforme instruções acima.

### Erro: "database iazap does not exist"

Crie o banco de dados conforme instruções acima.

### Erro: "permission denied"

Certifique-se de que o usuário iazap tem permissões no banco:

```bash
sudo -u postgres psql -d iazap -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO iazap;"
```

### Restauração Lenta

Se a restauração está lenta com muitos registros, isso é normal. Espere.

## Segurança

- **IMPORTANTE:** Esses scripts contém as credenciais do banco de dados.
- Ao copiar para outro servidor, considere alterar a senha do PostgreSQL.
- Remova os scripts após a restauração bem-sucedida se necessário.

## Backup Completo Comprimido

Um arquivo tar.gz comprimido também foi gerado:

```
iazap_backup_completo_YYYYMMDD_HHMMSS.tar.gz
```

Este arquivo contém todos os backups SQL em um arquivo único.

## Suporte

Para questões sobre restauração, verificar:

1. Logs do PostgreSQL: `/var/log/postgresql/`
2. Conectar diretamente ao BD para verificar dados
3. Executar as restaurações individualmente para identificar problemas

