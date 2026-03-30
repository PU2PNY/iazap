-- Script SQL para Plugin Suporte - Adicionar URLs de Anexos
-- Versão: 1.0.1
-- Data: 2024-09-20

-- ==============================================
-- 1. ADICIONAR COLUNAS DE URL AOS ANEXOS
-- ==============================================

-- Adicionar colunas download_url e preview_url à tabela ticket_reply_attachments
ALTER TABLE "ticket_reply_attachments" 
ADD COLUMN IF NOT EXISTS "download_url" TEXT;

ALTER TABLE "ticket_reply_attachments" 
ADD COLUMN IF NOT EXISTS "preview_url" TEXT;

-- ==============================================
-- 2. COMENTÁRIOS DAS NOVAS COLUNAS
-- ==============================================

COMMENT ON COLUMN "ticket_reply_attachments"."download_url" IS 'URL para download do arquivo';
COMMENT ON COLUMN "ticket_reply_attachments"."preview_url" IS 'URL para preview do arquivo';
