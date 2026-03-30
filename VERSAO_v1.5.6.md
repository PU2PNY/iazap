# Instalador AtendeChat v1.5.6

## Data: 05/01/2026

## Correção Crítica nesta Versão

### Problema: Hash da senha com caracteres escapados incorretamente
**Causa:** O heredoc `<< SQLEOF` estava mantendo os `\$` literalmente, gerando um hash inválido no PostgreSQL.

**Antes (ERRADO):**
```
\$2a\$10\$ppKfu...  (com barras invertidas)
```

**Depois (CORRETO):**
```
$2a$10$ppKfu...  (hash válido bcrypt)
```

**Solução:** Alterado para usar `psql -c "..."` com aspas duplas, onde `\$` é corretamente convertido para `$`.

## Todas as Correções Aplicadas

| Versão | Correção |
|--------|----------|
| v1.5.3 | `.sequelizerc` apontando para `dist/` |
| v1.5.4 | Permissões usando `'enabled'`, campo `amount` no plano |
| v1.5.5 | SQL direto (sem bcryptjs), `planId = 1` direto |
| v1.5.6 | **Hash bcrypt escapado corretamente** |

## Credenciais de Acesso

- **Email:** atendechat123@gmail.com
- **Senha:** chatbot123
- **Hash:** $2a$10$ppKfuD84NiEjRZDyXfk9xOMby.VMBA9nWKa9RUWMl.ttcQHqoS4sG

## Verificação Técnica

O comando SQL agora é executado assim:
```bash
sudo -u postgres psql -d {instancia} -c "
UPDATE \"Users\" SET 
  \"passwordHash\" = '\$2a\$10\$ppKfu...'
WHERE id = 1;"
```

Dentro de aspas duplas, `\$` é convertido para `$`, gerando o hash válido.
