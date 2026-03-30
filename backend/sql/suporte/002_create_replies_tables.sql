-- Script SQL para Plugin Suporte - Tabelas de Respostas
-- Versão: 1.0.0
-- Data: 2024-09-20

-- ==============================================
-- 1. CRIAÇÃO DE TABELAS DE RESPOSTAS
-- ==============================================

-- Tabela de respostas dos tickets
CREATE TABLE IF NOT EXISTS "ticket_replies" (
    "id" SERIAL PRIMARY KEY,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "ticket_replies_ticket_id_fkey" 
        FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_replies_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "Users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela de anexos das respostas
CREATE TABLE IF NOT EXISTS "ticket_reply_attachments" (
    "id" SERIAL PRIMARY KEY,
    "reply_id" INTEGER NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "access_token" VARCHAR(64) NOT NULL UNIQUE,
    "download_url" TEXT,
    "preview_url" TEXT,
    "uploaded_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "ticket_reply_attachments_reply_id_fkey" 
        FOREIGN KEY ("reply_id") REFERENCES "ticket_replies"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices para ticket_replies
CREATE INDEX IF NOT EXISTS "idx_ticket_replies_ticket_id" ON "ticket_replies"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_replies_user_id" ON "ticket_replies"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_replies_created_at" ON "ticket_replies"("created_at");
CREATE INDEX IF NOT EXISTS "idx_ticket_replies_is_internal" ON "ticket_replies"("is_internal");

-- Índices para ticket_reply_attachments
CREATE INDEX IF NOT EXISTS "idx_ticket_reply_attachments_reply_id" ON "ticket_reply_attachments"("reply_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_reply_attachments_access_token" ON "ticket_reply_attachments"("access_token");

-- ==============================================
-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE "ticket_replies" IS 'Respostas dos tickets de suporte';
COMMENT ON COLUMN "ticket_replies"."ticket_id" IS 'ID do ticket';
COMMENT ON COLUMN "ticket_replies"."user_id" IS 'ID do usuário que respondeu';
COMMENT ON COLUMN "ticket_replies"."message" IS 'Mensagem da resposta';
COMMENT ON COLUMN "ticket_replies"."is_internal" IS 'Se é uma resposta interna (não visível para o cliente)';

COMMENT ON TABLE "ticket_reply_attachments" IS 'Anexos das respostas dos tickets';
COMMENT ON COLUMN "ticket_reply_attachments"."reply_id" IS 'ID da resposta';
COMMENT ON COLUMN "ticket_reply_attachments"."file_path" IS 'Caminho do arquivo no servidor';
COMMENT ON COLUMN "ticket_reply_attachments"."file_name" IS 'Nome original do arquivo';
COMMENT ON COLUMN "ticket_reply_attachments"."file_size" IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN "ticket_reply_attachments"."mime_type" IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN "ticket_reply_attachments"."access_token" IS 'Token único para acesso ao arquivo';

-- ==============================================
-- 4. FUNÇÕES E TRIGGERS
-- ==============================================

-- Função para atualizar timestamp das respostas
CREATE OR REPLACE FUNCTION update_ticket_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS trigger_ticket_replies_updated_at ON "ticket_replies";
CREATE TRIGGER trigger_ticket_replies_updated_at
    BEFORE UPDATE ON "ticket_replies"
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_replies_updated_at();

-- ==============================================
-- 5. VALIDAÇÕES E CONSTRAINTS
-- ==============================================

-- Adicionar constraints de validação
ALTER TABLE "ticket_replies" 
ADD CONSTRAINT "chk_ticket_replies_message_not_empty" 
CHECK (LENGTH(TRIM("message")) > 0);

ALTER TABLE "ticket_reply_attachments" 
ADD CONSTRAINT "chk_ticket_reply_attachments_file_size_positive" 
CHECK ("file_size" > 0);

ALTER TABLE "ticket_reply_attachments" 
ADD CONSTRAINT "chk_ticket_reply_attachments_access_token_not_empty" 
CHECK (LENGTH(TRIM("access_token")) > 0);
