import { Request, Response } from "express";
import TicketService from "../services/TicketService";
import * as Yup from "yup";
import User from "../../../models/User";
import Company from "../../../models/Company";
import sequelize from "../../../database";
import { QueryTypes } from "sequelize";

// Importar e inicializar os modelos do plugin
const SuporteTicket = require("../models/Ticket").default;
const SuporteTicketAttachment = require("../models/TicketAttachment").default;
const SuporteTicketHistory = require("../models/TicketHistory").default;

// Inicializar modelos
SuporteTicket(sequelize);
SuporteTicketAttachment(sequelize);
SuporteTicketHistory(sequelize);

class TicketController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      console.log('🎫 TicketController.index - Iniciando...');
      const { companyId, profile, id: userId } = req.user;
      const { page = 1, limit = 20, status, priority, userId: filterUserId, companyFilter } = req.query;

      console.log('🎫 Parâmetros recebidos:', { companyId, profile, userId, page, limit, status, priority, filterUserId, companyFilter });

      // Buscar informações do usuário para verificar se é super
      console.log('🔍 Buscando usuário...');
      const user = await User.findByPk(userId);
      const isSuper = user?.super || false;
      console.log('👤 Usuário encontrado:', { id: user?.id, name: user?.name, super: isSuper });

      // Regras de acesso por empresa (SaaS)
      // Company 1 (Superadmin): Pode ver todas as empresas e filtrar
      // Outras empresas: Só podem ver tickets da própria empresa
      const isCompany1Superadmin = companyId === 1 && isSuper;
      const canFilterByCompany = isCompany1Superadmin;
      
      let filters: any = {};
      
      if (canFilterByCompany && companyFilter) {
        // Company 1 superadmin pode filtrar por empresa específica
        const companyFilterNumber = Number(companyFilter);
        if (!isNaN(companyFilterNumber)) {
          filters.company_id = companyFilterNumber;
          console.log(`🔐 Company 1 superadmin filtrando por empresa: ${companyFilterNumber}`);
        }
      } else if (isCompany1Superadmin) {
        // Company 1 superadmin sem filtro específico: ver todas as empresas
        console.log('🔐 Company 1 superadmin: visualizando todas as empresas');
        // Não aplicar filtro de company_id para ver todas
      } else {
        // Outras empresas: só podem ver tickets da própria empresa
        filters.company_id = companyId;
        console.log(`🏢 Empresa ${companyId}: visualizando apenas tickets próprios`);
      }
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (filterUserId) filters.user_id = filterUserId;

      console.log('🔍 Filtros aplicados:', filters);

      console.log('📊 Chamando TicketService.findWithPagination...');
      const tickets = await TicketService.findWithPagination(filters, {
        page: Number(page),
        limit: Number(limit)
      });

      console.log('✅ Tickets encontrados:', tickets);
      return res.json(tickets);
    } catch (error) {
      console.error("❌ Erro detalhado ao listar tickets:", error);
      console.error("❌ Stack trace:", error.stack);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      const ticket = await TicketService.findById(Number(id), companyId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }

      return res.json(ticket);
    } catch (error) {
      console.error("Erro ao buscar ticket:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const schema = Yup.object().shape({
        title: Yup.string().required("Título é obrigatório").max(255),
        description: Yup.string().max(1000),
        priority: Yup.string().oneOf(['low', 'normal', 'high'])
      });

      await schema.validate(req.body);

      const { companyId, id: userId } = req.user;
      const { title, description, priority = 'normal' } = req.body;
      const files = req.files as Express.Multer.File[];

      const ticket = await TicketService.create({
        company_id: Number(companyId),
        user_id: Number(userId),
        title,
        description,
        priority,
        attachments: files
      });

      return res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Erro ao criar ticket:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { status, message } = req.body;

      const schema = Yup.object().shape({
        status: Yup.string().oneOf(['open', 'in_progress', 'closed']),
        message: Yup.string().max(1000)
      });

      await schema.validate(req.body);

      const ticket = await TicketService.update(Number(id), {
        status,
        message,
        userId: Number(userId)
      }, Number(companyId));

      if (!ticket) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }

      return res.json(ticket);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Erro ao atualizar ticket:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async uploadAttachment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { companyId } = req.user;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Arquivo é obrigatório" });
      }

      const attachment = await TicketService.addAttachment(
        Number(id),
        file,
        Number(companyId)
      );

      if (!attachment) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }

      return res.status(201).json(attachment);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      const history = await TicketService.getHistory(Number(id), companyId);

      if (!history) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }

      return res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async testCompanies(req: Request, res: Response): Promise<Response> {
    try {
      console.log('🧪 Teste de empresas iniciado');
      
      // Teste simples de query usando o sequelize importado
      const result = await sequelize.query(`
        SELECT id, name
        FROM "Companies"
        ORDER BY name ASC
        LIMIT 5
      `, {
        type: QueryTypes.SELECT
      });

      console.log('🧪 Resultado do teste:', result);
      
      return res.json({
        success: true,
        companies: result,
        count: result?.length || 0
      });
    } catch (error) {
      console.error("❌ Erro no teste de empresas:", error);
      return res.status(500).json({ 
        error: "Erro interno do servidor",
        details: error.message 
      });
    }
  }

  async getCompanies(req: Request, res: Response): Promise<Response> {
    try {
      console.log('🔍 getCompanies chamado');
      const { companyId, profile, id: userId } = req.user;
      console.log('👤 Dados do usuário:', { companyId, profile, userId });

      // Buscar informações do usuário para verificar se é super
      const user = await User.findByPk(userId);
      const isSuper = user?.super || false;
      console.log('🔐 Usuário é super:', isSuper);

      // Regras de acesso por empresa (SaaS)
      // Company 1 (Superadmin): Pode ver todas as empresas para filtrar
      // Outras empresas: Só podem ver a própria empresa
      const isCompany1Superadmin = companyId === 1 && isSuper;
      console.log('✅ É Company 1 superadmin:', isCompany1Superadmin);

      if (isCompany1Superadmin) {
        console.log('📞 Chamando TicketService.getCompaniesForFilter...');
        const companies = await TicketService.getCompaniesForFilter();
        console.log('📋 Empresas retornadas:', companies);
        return res.json(companies);
      } else {
        // Outras empresas só veem a própria empresa
        const company = await Company.findByPk(companyId);
        console.log('🏢 Empresa própria:', company);
        return res.json([{ id: company?.id, name: company?.name }]);
      }
    } catch (error) {
      console.error("❌ Erro ao listar empresas:", error);
      console.error("Stack trace:", error.stack);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async downloadAttachmentPublic(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      
      const attachment = await TicketService.getAttachmentByToken(token);
      
      if (!attachment) {
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      // Definir headers para download
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
      res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("Erro ao fazer download do anexo:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async previewAttachmentPublic(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      
      const attachment = await TicketService.getAttachmentByToken(token);
      
      if (!attachment) {
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      // Definir headers para preview
      res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("Erro ao fazer preview do anexo:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async downloadAttachment(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      
      const attachment = await TicketService.getAttachmentByToken(token);
      
      if (!attachment) {
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      // Definir headers para download
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
      res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("Erro ao fazer download do anexo:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async previewAttachment(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      
      const attachment = await TicketService.getAttachmentByToken(token);
      
      if (!attachment) {
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      // Verificar se é uma imagem para preview
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!imageTypes.includes(attachment.mime_type)) {
        return res.status(400).json({ error: "Tipo de arquivo não suportado para preview" });
      }

      // Definir headers para preview
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("Erro ao fazer preview do anexo:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // ==============================================
  // MÉTODOS PARA RESPOSTAS DOS TICKETS
  // ==============================================

  async createReply(req: Request, res: Response): Promise<Response> {
    try {
      console.log('💬 TicketController.createReply - Iniciando...');
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { message, isInternal = false } = req.body;
      const files = req.files;

      console.log('💬 Parâmetros:', { ticketId: id, userId, companyId, message, isInternal });

      // Validar dados
      const schema = Yup.object().shape({
        message: Yup.string().required("Mensagem é obrigatória").min(1),
        isInternal: Yup.boolean()
      });

      await schema.validate({ message, isInternal });

      // Verificar permissão para responder
      const canReply = await TicketService.canUserReplyTicket(Number(id), Number(userId), Number(companyId));
      if (!canReply) {
        return res.status(403).json({ error: "Sem permissão para responder este ticket" });
      }

      // Criar resposta
      const reply = await TicketService.createReply(
        Number(id),
        Number(userId),
        message,
        isInternal,
        files as any[],
        companyId
      );

      console.log('✅ Resposta criada:', reply.id);
      return res.status(201).json(reply);

    } catch (error) {
      console.error("❌ Erro ao criar resposta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getReplies(req: Request, res: Response): Promise<Response> {
    try {
      console.log('💬 TicketController.getReplies - Iniciando...');
      const { id } = req.params;
      const { companyId } = req.user;

      console.log('💬 Buscando respostas do ticket:', { ticketId: id, companyId });

      const replies = await TicketService.getTicketReplies(Number(id), companyId);
      
      console.log(`✅ Encontradas ${replies.length} respostas`);
      return res.json(replies);

    } catch (error) {
      console.error("❌ Erro ao buscar respostas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async downloadReplyAttachment(req: Request, res: Response): Promise<Response> {
    try {
      console.log('📥 downloadReplyAttachment - Iniciando...');
      const { token } = req.params;
      console.log('🔑 Token recebido:', token);
      
      const attachment = await TicketService.getReplyAttachmentByToken(token);
      console.log('📎 Anexo encontrado:', attachment ? 'Sim' : 'Não');
      
      if (!attachment) {
        console.log('❌ Anexo não encontrado para token:', token);
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      console.log('📁 Caminho do arquivo:', attachment.file_path);
      
      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        console.log('❌ Arquivo não encontrado no servidor:', attachment.file_path);
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      console.log('✅ Arquivo encontrado, enviando...');
      
      // Definir headers para download
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
      res.setHeader('Content-Type', attachment.mime_type);
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("❌ Erro ao fazer download do anexo da resposta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async previewReplyAttachment(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      
      const attachment = await TicketService.getReplyAttachmentByToken(token);
      
      if (!attachment) {
        return res.status(404).json({ error: "Anexo não encontrado" });
      }

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }

      // Verificar se é uma imagem para preview
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!imageTypes.includes(attachment.mime_type)) {
        return res.status(400).json({ error: "Tipo de arquivo não suportado para preview" });
      }

      // Definir headers para preview
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Enviar arquivo
      res.sendFile(attachment.file_path);
      return;
    } catch (error) {
      console.error("Erro ao fazer preview do anexo da resposta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

export default new TicketController();
