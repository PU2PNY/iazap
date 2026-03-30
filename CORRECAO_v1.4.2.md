# CORREÇÃO v1.4.2 - Estrutura do Repositório

## 🐛 PROBLEMA IDENTIFICADO

O debug do v1.4.1 revelou a estrutura REAL do repositório:

```
AtendechatApioffcial/
├── backend/         ← NO ROOT!
├── frontend/        ← NO ROOT!
├── api_oficial/     ← Pasta diferente (contém apenas arquivos NestJS)
└── api_transcricao/
```

**Erro anterior:** O instalador copiava de `api_oficial/*` mas backend/frontend estão no ROOT do repositório!

## ✅ SOLUÇÃO IMPLEMENTADA

**Arquivo modificado:** `lib/_system.sh`

**Linha 53-58 (ANTES):**
```bash
# Copiar conteúdo de api_oficial
run_with_check "Cópia dos arquivos do repositório" \
  "sudo su - deploy -c 'cp -r /tmp/atendechat_temp_${instancia_add}/api_oficial/* /home/deploy/${instancia_add}/'"
```

**Linha 53-58 (DEPOIS):**
```bash
# Copiar backend e frontend do ROOT do repositório
run_with_check "Cópia do backend" \
  "sudo su - deploy -c 'cp -r /tmp/atendechat_temp_${instancia_add}/backend /home/deploy/${instancia_add}/'"

run_with_check "Cópia do frontend" \
  "sudo su - deploy -c 'cp -r /tmp/atendechat_temp_${instancia_add}/frontend /home/deploy/${instancia_add}/'"
```

## 🎯 RESULTADO

✅ Backend copiado do local correto: `/repo_root/backend`  
✅ Frontend copiado do local correto: `/repo_root/frontend`  
✅ Todas as verificações mantidas (check_dir_exists, check_file_exists)  
✅ Sistema de error checking intacto  
✅ Debug removido (não é mais necessário)

## 📦 O QUE FOI ALTERADO

- **1 arquivo modificado:** `lib/_system.sh` (linhas 53-78)
- **Mudança:** Caminho de cópia de `api_oficial/*` para `backend/` e `frontend/`
- **Debug removido:** Código temporário de diagnóstico removido
- **Verificações mantidas:** Todas as validações de v1.4.0 permanecem ativas

## 🚀 COMO USAR

```bash
# 1. Extrair o instalador
tar -xzf instalador_atendechat.tar.gz

# 2. Executar normalmente
cd instalador_atendechat
./install_primaria

# 3. A cópia agora funciona corretamente!
```

## 📊 HISTÓRICO DE VERSÕES

- **v1.0.0:** Instalador base
- **v1.1.0:** Git URL embutida
- **v1.2.0:** Ordem de comandos corrigida
- **v1.3.0:** Extração de api_oficial (INCORRETO)
- **v1.4.0:** Sistema completo de error checking
- **v1.4.1:** Debug para diagnóstico (temporário)
- **v1.4.2:** Cópia do ROOT do repositório (CORRETO) ✅

## ⚠️ OBSERVAÇÃO IMPORTANTE

A pasta `api_oficial/` no repositório **NÃO** contém backend/frontend completos.  
Ela contém apenas arquivos de configuração NestJS.

As pastas corretas são:
- `/repo_root/backend/` ← Aqui está o backend completo
- `/repo_root/frontend/` ← Aqui está o frontend completo

## ✅ VALIDAÇÃO

Após esta correção, o instalador irá:

1. ✅ Clonar repositório do Git
2. ✅ Copiar `/backend` para `/home/deploy/instancia/backend`
3. ✅ Copiar `/frontend` para `/home/deploy/instancia/frontend`
4. ✅ Verificar que ambas as pastas existem
5. ✅ Verificar que ambos os package.json existem
6. ✅ Prosseguir com npm install no backend
7. ✅ Prosseguir com npm install no frontend
8. ✅ Instalação completa com sucesso!

---
**Data:** 09/12/2025  
**Versão:** 1.4.2  
**Status:** PRONTO PARA PRODUÇÃO ✅
