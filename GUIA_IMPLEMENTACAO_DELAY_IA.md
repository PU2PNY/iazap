# Guia de Implementação: Tempo de Resposta da IA com Estado de Digitação

## 📋 Checklist de Implementação

### Fase 1: Banco de Dados

#### 1.1 Criar arquivo de migração Prisma
```bash
cd /home/deploy/iazap/api_oficial
npx prisma migrate dev --name add_ia_response_config
```

#### 1.2 SQL da migração (gerado automaticamente):
```sql
ALTER TABLE "whatsappOfficial" ADD COLUMN "iaResponseDelay" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "whatsappOfficial" ADD COLUMN "enableTypingState" BOOLEAN NOT NULL DEFAULT false;
```

### Fase 2: Atualizar Schema Prisma

#### 2.1 Editar arquivo: `/home/deploy/iazap/api_oficial/prisma/schema.prisma`

Localizar o modelo `whatsappOfficial` e adicionar:
```prisma
model whatsappOfficial {
  id                      Int                    @id @default(autoincrement())
  // ... campos existentes ...
  
  // Novos campos para configuração de IA
  iaResponseDelay         Int                    @default(0) // em milissegundos
  enableTypingState       Boolean                @default(false) // mostrar "digitando"
  
  // ... resto dos campos ...
}
```

### Fase 3: Implementar Lógica na API

#### 3.1 Criar arquivo utilitário: `src/utils/delay.util.ts`
```typescript
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### 3.2 Atualizar Serviço: `src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts`

Adicionar no método `sendMessage()`:

```typescript
import { delay } from '@utils/delay.util';

async sendMessage(token: string, sendMessageDto: SendMessageDto) {
  // ... código existente ...
  
  // Obter configurações da conexão WhatsApp
  const whatsappConnection = await this.prisma.whatsappOfficial.findUnique({
    where: { token: token }
  });
  
  // Se for mensagem de IA, aplicar configurações
  const isIAMessage = sendMessageDto.fromIA === true;
  if (isIAMessage && whatsappConnection?.iaResponseDelay > 0) {
    // Mostrar estado de digitação
    if (whatsappConnection.enableTypingState) {
      try {
        await this.sendTypingState(
          whatsappConnection.id,
          sendMessageDto.number
        );
      } catch (error) {
        console.log('Erro ao enviar estado de digitação:', error);
      }
    }
    
    // Aguardar o delay configurado
    await delay(whatsappConnection.iaResponseDelay);
  }
  
  // Enviar mensagem
  const result = await this.sendMessageWhatsApp.create({
    data: {
      // ... dados da mensagem ...
    }
  });
  
  return result;
}

// Novo método para enviar estado de digitação
private async sendTypingState(connectionId: number, phoneNumber: string) {
  // Usar Evolution API ou biblioteca de WhatsApp
  // Exemplo com Evolution API:
  // await this.evolutionClient.chat.markAsComposing(
  //   connectionId,
  //   phoneNumber
  // );
}
```

#### 3.3 Criar Novo Endpoint: `send-message-whatsapp.controller.ts`

Adicionar novo método PATCH:

```typescript
@Patch(':id/config')
async updateWhatsAppConfig(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateConfigDto: UpdateWhatsAppConfigDto,
) {
  return await this.whatsappOfficialService.updateConfig(id, updateConfigDto);
}
```

#### 3.4 Criar DTO: `src/dtos/update-whatsapp-config.dto.ts`

```typescript
import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class UpdateWhatsAppConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000) // Máximo de 10 segundos
  iaResponseDelay?: number;
  
  @IsOptional()
  @IsBoolean()
  enableTypingState?: boolean;
}
```

### Fase 4: Testes

#### 4.1 Testar Configuração
```bash
# PATCH - Atualizar configuração
curl -X PATCH http://localhost:3000/whatsapp-official/1/config \
  -H "Content-Type: application/json" \
  -d '{
    "iaResponseDelay": 1500,
    "enableTypingState": true
  }'
```

#### 4.2 Testar Envio de Mensagem com Delay
```bash
# POST - Enviar mensagem da IA
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "number": "5511999999999",
    "message": "Resposta da IA",
    "fromIA": true
  }'
```

### Fase 5: Compilar e Deploy

```bash
# Compilar TypeScript
npm run build

# Testar em desenvolvimento
npm run dev

# Deploy em produção
npm run start
```

## ⚙️ Valores Recomendados

| Configuração | Valor Min | Valor Padrão | Valor Max | Descrição |
|---|---|---|---|---|
| `iaResponseDelay` | 0 ms | 1000 ms | 10000 ms | Tempo de espera antes de responder |
| `enableTypingState` | false | true | - | Mostrar estado "digitando" no WhatsApp |

## 🔧 Troubleshooting

### Problema: Migração falha
**Solução:**
```bash
# Resetar banco de dados (cuidado em produção)
npx prisma migrate reset

# Ou fazer migração de forma segura
npx prisma migrate deploy
```

### Problema: Estado de digitação não aparece
**Verificar:**
1. Se `enableTypingState` está `true`
2. Se a Evolution API está rodando corretamente
3. Logs da API para erros

## 📝 Exemplos de Uso

### Exemplo 1: Delay de 1.5 segundos
```bash
curl -X PATCH http://localhost:3000/whatsapp/1/config \
  -d '{"iaResponseDelay": 1500, "enableTypingState": true}'
```

### Exemplo 2: Sem delay, apenas mostrar digitação
```bash
curl -X PATCH http://localhost:3000/whatsapp/1/config \
  -d '{"iaResponseDelay": 0, "enableTypingState": true}'
```

### Exemplo 3: Delay de 3 segundos, sem indicação visual
```bash
curl -X PATCH http://localhost:3000/whatsapp/1/config \
  -d '{"iaResponseDelay": 3000, "enableTypingState": false}'
```

