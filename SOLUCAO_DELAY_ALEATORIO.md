# Solução: Delay Aleatório da IA entre 5-7 segundos

## 🎯 Requisito

A IA deve responder com um delay **variável entre 5 e 7 segundos**, alternando aleatoriamente para cada mensagem.

## 🛠️ Implementação

### Opção 1: Delay Aleatório Simples (Recomendado)

Modificar o banco de dados para ter 2 campos:

```sql
ALTER TABLE "whatsappOfficial" ADD COLUMN "iaResponseDelayMin" INTEGER DEFAULT 5000 NOT NULL;
ALTER TABLE "whatsappOfficial" ADD COLUMN "iaResponseDelayMax" INTEGER DEFAULT 7000 NOT NULL;
```

### Schema Prisma Atualizado:

```prisma
model whatsappOfficial {
  id                      Int                    @id @default(autoincrement())
  // ... campos existentes ...
  
  // Delay mínimo da IA em milissegundos (padrão: 5000ms = 5s)
  iaResponseDelayMin      Int                    @default(5000)
  
  // Delay máximo da IA em milissegundos (padrão: 7000ms = 7s)
  iaResponseDelayMax      Int                    @default(7000)
  
  // Mostrar estado de digitação
  enableTypingState       Boolean                @default(true)
  
  // ... resto dos campos ...
}
```

### Código TypeScript:

#### Arquivo: `src/utils/random-delay.util.ts`

```typescript
/**
 * Gera um delay aleatório entre min e max milissegundos
 * @param min - Delay mínimo em ms
 * @param max - Delay máximo em ms
 * @returns Promise que resolve após o delay aleatório
 */
export async function randomDelay(min: number, max: number): Promise<number> {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delayTime));
  return delayTime; // retorna o tempo escolhido para logs
}

/**
 * Função helper para delay fixo
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### Arquivo: `send-message-whatsapp.service.ts` (atualizado)

```typescript
import { randomDelay } from '@utils/random-delay.util';

async sendMessage(token: string, sendMessageDto: SendMessageDto) {
  // ... código existente ...
  
  // Obter configurações da conexão WhatsApp
  const whatsappConnection = await this.prisma.whatsappOfficial.findUnique({
    where: { token: token },
    select: {
      id: true,
      iaResponseDelayMin: true,
      iaResponseDelayMax: true,
      enableTypingState: true,
    }
  });
  
  // Se for mensagem de IA, aplicar delay aleatório
  const isIAMessage = sendMessageDto.fromIA === true;
  if (isIAMessage && whatsappConnection) {
    const minDelay = whatsappConnection.iaResponseDelayMin || 5000;
    const maxDelay = whatsappConnection.iaResponseDelayMax || 7000;
    
    // Mostrar estado de digitação
    if (whatsappConnection.enableTypingState) {
      try {
        await this.sendTypingState(
          whatsappConnection.id,
          sendMessageDto.number
        );
        console.log(`[IA] Mostrando estado de digitação para ${sendMessageDto.number}`);
      } catch (error) {
        console.log('Erro ao enviar estado de digitação:', error);
      }
    }
    
    // Aplicar delay aleatório entre min e max
    const appliedDelay = await randomDelay(minDelay, maxDelay);
    console.log(
      `[IA] Delay aplicado: ${appliedDelay}ms (entre ${minDelay}-${maxDelay}ms) para ${sendMessageDto.number}`
    );
  }
  
  // Enviar mensagem
  const result = await this.prisma.sendMessageWhatsApp.create({
    data: {
      // ... dados da mensagem ...
    }
  });
  
  return result;
}

private async sendTypingState(connectionId: number, phoneNumber: string) {
  // Implementação com Evolution API
  // await this.evolutionClient.chat.markAsComposing(connectionId, phoneNumber);
}
```

### Opção 2: Delay Fixo Alternado (5s, depois 7s, depois 5s...)

Se você quiser alternar de forma previsível:

```typescript
// Variável para controlar alternância (em memória ou Redis)
private delayToggle: boolean = false;

async sendMessage(token: string, sendMessageDto: SendMessageDto) {
  // ... código existente ...
  
  if (isIAMessage && whatsappConnection) {
    // Alternar entre 5000ms e 7000ms
    const delayTime = this.delayToggle ? 7000 : 5000;
    this.delayToggle = !this.delayToggle; // Inverte para próxima vez
    
    if (whatsappConnection.enableTypingState) {
      await this.sendTypingState(whatsappConnection.id, sendMessageDto.number);
    }
    
    await delay(delayTime);
    console.log(`[IA] Delay aplicado: ${delayTime}ms`);
  }
  
  // ... resto do código ...
}
```

## 📋 Migração do Banco de Dados

### Passo 1: Criar arquivo de migração

```bash
cd /home/deploy/iazap/api_oficial
npx prisma migrate dev --name add_ia_random_delay_config
```

### Passo 2: SQL da Migração

```sql
-- Adicionar colunas para delay aleatório
ALTER TABLE "whatsappOfficial" 
  ADD COLUMN "iaResponseDelayMin" INTEGER NOT NULL DEFAULT 5000,
  ADD COLUMN "iaResponseDelayMax" INTEGER NOT NULL DEFAULT 7000,
  ADD COLUMN "enableTypingState" BOOLEAN NOT NULL DEFAULT true;
```

## ⚙️ Configurar via API

### Endpoint PATCH para configurar delays:

```typescript
// Controller
@Patch(':id/config')
async updateWhatsAppConfig(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateConfigDto: UpdateWhatsAppConfigDto,
) {
  return await this.whatsappOfficialService.updateConfig(id, updateConfigDto);
}

// DTO
export class UpdateWhatsAppConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30000) // Máximo 30 segundos
  iaResponseDelayMin?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30000)
  iaResponseDelayMax?: number;
  
  @IsOptional()
  @IsBoolean()
  enableTypingState?: boolean;
}
```

### Exemplo de configuração via cURL:

```bash
# Configurar delay aleatório entre 5-7 segundos (5000-7000ms)
curl -X PATCH http://localhost:3000/whatsapp-official/1/config \
  -H "Content-Type: application/json" \
  -d '{
    "iaResponseDelayMin": 5000,
    "iaResponseDelayMax": 7000,
    "enableTypingState": true
  }'
```

## 📊 Como Funciona

```
Cliente envia: "Olá, preciso de ajuda"
       ↓
   API recebe mensagem
       ↓
   Detecta que é resposta de IA
       ↓
   Mostra "... está digitando"
       ↓
   Gera delay aleatório: 6.2 segundos (entre 5-7s)
       ↓
   Aguarda 6.2 segundos
       ↓
   Envia resposta: "Olá! Como posso ajudar?"
       ↓
   [LOGS]: Delay aplicado: 6200ms (entre 5000-7000ms)
```

## 🔍 Testando

### Teste 1: Enviar múltiplas mensagens

```bash
# Enviar 5 mensagens e ver os delays aleatórios nos logs
for i in {1..5}; do
  curl -X POST http://localhost:3000/send-message \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{
      \"number\": \"5511999999999\",
      \"message\": \"Teste $i\",
      \"fromIA\": true
    }"
  sleep 10
done
```

### Verificar logs:

```bash
# Ver logs da API
tail -f /var/log/api_oficial.log | grep "Delay aplicado"

# Resultado esperado:
# [IA] Delay aplicado: 5342ms (entre 5000-7000ms)
# [IA] Delay aplicado: 6891ms (entre 5000-7000ms)
# [IA] Delay aplicado: 5127ms (entre 5000-7000ms)
# [IA] Delay aplicado: 6554ms (entre 5000-7000ms)
# [IA] Delay aplicado: 7000ms (entre 5000-7000ms)
```

## 💡 Vantagens do Delay Aleatório

✅ **Mais humano**: Variação natural de tempo de resposta
✅ **Menos detectável**: Não parece automação
✅ **Configurável**: Pode ajustar min/max por cliente
✅ **Flexível**: Diferentes faixas de delay para diferentes cenários

## 🔧 Valores Sugeridos

| Cenário | Min | Max | Descrição |
|----------|-----|-----|-------------|
| **Rápido** | 2s | 4s | Respostas urgentes |
| **Normal** | 5s | 7s | Uso geral (recomendado) |
| **Pensativo** | 8s | 12s | Perguntas complexas |
| **Muito pensativo** | 15s | 20s | Análises profundas |

## 🚀 Deploy

```bash
# 1. Atualizar schema Prisma
vim /home/deploy/iazap/api_oficial/prisma/schema.prisma

# 2. Criar e aplicar migração
cd /home/deploy/iazap/api_oficial
npx prisma migrate dev --name add_ia_random_delay_config

# 3. Atualizar código do serviço
vim src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts

# 4. Criar arquivo de utilitário
vim src/utils/random-delay.util.ts

# 5. Compilar e reiniciar
npm run build
pm2 restart api_oficial

# 6. Verificar logs
pm2 logs api_oficial --lines 100
```

