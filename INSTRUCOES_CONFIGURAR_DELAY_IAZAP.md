# INSTRUÇÕES: CONFIGURAR DELAY 5-7 SEGUNDOS NA IA-ZAP

## 💡 SOLUÇÃO PRÁTICA (Forma mais rápida)

Como não há opção direta no painel Talk.AI, você precisa:

### Opção 1: Editar o Código da API

Arquivo: `/home/deploy/iazap/api_oficial/src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts`

Adicione isto antes de enviar a mensagem da IA:

```typescript
// Função para gerar delay aleatório
private generateRandomDelay(): number {
  const min = 5000; // 5 segundos
  const max = 7000; // 7 segundos
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// No método que envia a mensagem, antes de chamar sendMessage():
if (messageDto.fromIA || messageDto.isFromAI) {
  const delay = this.generateRandomDelay();
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log(`[DELAY-IA] Aguardado ${delay}ms antes de enviar resposta da IA`);
}
```

### Opção 2: Alterar via Docker (Más rápido)

Verífique qual container está rodando a API:

```bash
docker ps | grep iazap
```

Entrie no container:

```bash
docker exec -it [CONTAINER_ID] /bin/bash
```

Localize o arquivo principal da IA:

```bash
find /app -name '*send-message*' -type f | head -10
```

### Opção 3: Usar UM MIDDLEWARE

Crie um arquivo: `/home/deploy/iazap/api_oficial/src/middleware/ia-delay.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IADelayMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Verifica se é requisição de IA
    if (req.body?.fromIA || req.body?.isFromAI) {
      const min = 5000;
      const max = 7000;
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      
      setTimeout(() => {
        console.log(`[IA-DELAY] ${delay}ms aplicado`);
        next();
      }, delay);
    } else {
      next();
    }
  }
}
```

Depois registre no app.module.ts:

```typescript
configure(consumer: MiddlewareConsumer) {
  consumer.apply(IADelayMiddleware).forRoutes('*');
}
```

## 🚀 FORMA MÁS RÁPIDA

Se você só quer um delay fixo AGORA:

1. Acesse `/home/deploy/iazap/api_oficial/`
2. Abra `src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts`
3. Procure por `async sendMessage(` ou `async send(`
4. Adicione antes do `return`:

```typescript
// Se for mensagem de IA
if (/* verifica se é IA */) {
  await new Promise(r => setTimeout(r, 5000 + Math.random() * 2000));
}
```

5. Salve, compile e reinicie:
```bash
npm run build
pm2 restart api_oficial
```

## 📋 CHECKLIST RPIDO

- [ ] Localizar arquivo send-message-whatsapp.service.ts
- [ ] Adicionar função generateRandomDelay()
- [ ] Chamar a função antes de enviar IA
- [ ] Executar `npm run build`
- [ ] Reiniciar com `pm2 restart api_oficial`
- [ ] Testar enviando mensagem para a IA
- [ ] Verificar nos logs se o delay foi aplicado

## 🔍 VERIFICAR LOGS

```bash
pm2 logs api_oficial --lines 100 | grep -i 'delay\|ia'
```

Você deve ver:
```
[DELAY-IA] Aguardado 5234ms antes de enviar resposta da IA
[DELAY-IA] Aguardado 6891ms antes de enviar resposta da IA
```

## 📚 REFERÊNCIA

Caminho da API: `/home/deploy/iazap/api_oficial/`
Arquivo principal: `src/resources/v1/send-message-whatsapp/send-message-whatsapp.service.ts`
Com ando de restart: `pm2 restart api_oficial`
Logs: `pm2 logs api_oficial`

