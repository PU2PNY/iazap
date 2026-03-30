# Solução: Tempo de Resposta da IA e Estado de Digitação no WhatsApp

## Resumo da Busca
Realizamos uma busca completa no servidor para encontrar configurações de tempo de resposta da IA:

### Locais Analisados:
1. `/root/instalador/api_oficial/` - Código-fonte da API
2. `/home/deploy/iazap/api_oficial/` - API em produção
3. Arquivo `.env` - Variáveis de ambiente
4. Schema Prisma - Estrutura do banco de dados
5. Migrações do PostgreSQL

### Conclusão:
**A funcionalidade de tempo de resposta da IA e estado de digitação NÃO está atualmente implementada no código.**

## Soluções Propostas

### 1. Adicionar Campo de Configuração ao Banco de Dados

Crie uma migração Prisma para adicionar campos à tabela `whatsappOfficial`:

```sql
-- Adicionar coluna para delay de resposta da IA
ALTER TABLE "whatsappOfficial" ADD COLUMN "iaResponseDelay" INTEGER DEFAULT 0 NOT NULL;
-- Adicionar coluna para habilitar estado de digitação
ALTER TABLE "whatsappOfficial" ADD COLUMN "enableTypingState" BOOLEAN DEFAULT false NOT NULL;
```

### 2. Atualizar o Schema Prisma

Adicionar os campos ao modelo `whatsappOfficial` em `/home/deploy/iazap/api_oficial/prisma/schema.prisma`:

```prisma
model whatsappOfficial {
  // ... campos existentes ...
  
  // Novo campo: delay em ms antes de responder a mensagens da IA (padrão: 0ms)
  iaResponseDelay Int @default(0)
  
  // Novo campo: exibir estado "digitando" antes de enviar mensagem de IA
  enableTypingState Boolean @default(false)
  
  // ... resto do modelo ...
}
```

### 3. Implementar Lógica no Serviço de Envio

Modificar `/home/deploy/iazap/api_oficial/src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts`:

```typescript
// Buscar configurações da conexão
const conexao = await this.prisma.whatsappOfficial.findFirst({
  where: { id: whatsappOfficialId }
});

// Se a mensagem é da IA, aplicar delay
if (isIAResponse && conexao?.iaResponseDelay > 0) {
  // Mostrar estado de digitação se habilitado
  if (conexao.enableTypingState) {
    await this.showTypingState(phoneNumber);
  }
  
  // Aguardar o tempo configurado
  await this.delay(conexao.iaResponseDelay);
}

// Enviar a mensagem
await this.prisma.sendMessageWhatsApp.create({...});

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

private async showTypingState(phoneNumber: string): Promise<void> {
  // Usar método da Evolution API para mostrar estado de digitação
  // await this.client.chat.markAsComposing(phoneNumber);
}
```

### 4. Adicionar Endpoint para Configurar

Criar novo endpoint PATCH em `/send-message-whatsapp-config`:

```typescript
@Patch(':id/config')
async updateConfig(
  @Param('id') id: string,
  @Body() config: { iaResponseDelay: number; enableTypingState: boolean }
) {
  return await this.prisma.whatsappOfficial.update({
    where: { id },
    data: config
  });
}
```

## Valores Recomendados

- **iaResponseDelay**: 500-3000 ms (tempo para simular que a IA está "pensando")
- **enableTypingState**: true (para melhor experiência do usuário)

## Próximos Passos

1. Criar e executar migração Prisma
2. Atualizar schema Prisma
3. Implementar lógica no serviço
4. Testar com mensagens de IA
5. Documentar as novas configurações

