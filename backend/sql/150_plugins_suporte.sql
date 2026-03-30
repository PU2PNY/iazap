--- Tabelas do plugin Suporte (idempotentes)
-- tickets, ticket_attachments, ticket_history

CREATE TABLE IF NOT EXISTS "tickets" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_progress, closed
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Constraints de domínio (CHECK) - usando ALTER TABLE com IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tickets_status') THEN
        ALTER TABLE "tickets" ADD CONSTRAINT chk_tickets_status CHECK (status IN ('open','in_progress','closed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tickets_priority') THEN
        ALTER TABLE "tickets" ADD CONSTRAINT chk_tickets_priority CHECK (priority IN ('low','normal','high'));
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_company ON "tickets"("company_id");
CREATE INDEX IF NOT EXISTS idx_tickets_user ON "tickets"("user_id");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON "tickets"("status");
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON "tickets"("priority");
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON "tickets"("created_at");

-- Tabela de anexos
CREATE TABLE IF NOT EXISTS "ticket_attachments" (
  "id" SERIAL PRIMARY KEY,
  "ticket_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "file_path" TEXT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_size" INTEGER NULL,
  "mime_type" VARCHAR(100) NULL,
  "access_token" VARCHAR(255) NOT NULL UNIQUE,
  "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON "ticket_attachments"("ticket_id");

-- Tabela de histórico
CREATE TABLE IF NOT EXISTS "ticket_history" (
  "id" SERIAL PRIMARY KEY,
  "ticket_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" VARCHAR(50) NOT NULL, -- created, updated, responded, closed
  "message" TEXT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON "ticket_history"("ticket_id");
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON "ticket_history"("created_at");

-- Constraints de domínio para ticket_history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ticket_history_action') THEN
        ALTER TABLE "ticket_history" ADD CONSTRAINT chk_ticket_history_action CHECK (action IN ('created','updated','responded','closed'));
    END IF;
END $$;

-- Atualização automática de updated_at
-- Cria uma trigger/function para manter updated_at em tickets
CREATE OR REPLACE FUNCTION public.set_timestamp_tickets()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_timestamp_tickets') THEN
        CREATE TRIGGER trg_set_timestamp_tickets
        BEFORE UPDATE ON "tickets"
        FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_tickets();
    END IF;
END $$;


