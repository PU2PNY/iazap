import { Op, QueryTypes } from "sequelize";
import { Model, Sequelize } from "sequelize";
import axios from "axios";
import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";
import sequelize from "../../../database";

// Importar e inicializar os modelos do plugin
const SuporteTicketModel = require("../models/Ticket").default;
const SuporteTicketAttachmentModel = require("../models/TicketAttachment").default;
const SuporteTicketHistoryModel = require("../models/TicketHistory").default;
const SuporteTicketReplyModel = require("../models/TicketReply").default;
const SuporteTicketReplyAttachmentModel = require("../models/TicketReplyAttachment").default;

// Inicializar os modelos
const SuporteTicket = SuporteTicketModel(sequelize);
const SuporteTicketAttachment = SuporteTicketAttachmentModel(sequelize);
const SuporteTicketHistory = SuporteTicketHistoryModel(sequelize);
const SuporteTicketReply = SuporteTicketReplyModel(sequelize);
const SuporteTicketReplyAttachment = SuporteTicketReplyAttachmentModel(sequelize);

interface CreateTicketData {
  company_id: number;
  user_id: number;
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  attachments?: Express.Multer.File[];
}

interface UpdateTicketData {
  status?: 'open' | 'in_progress' | 'closed';
  message?: string;
  userId: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

class TicketService {
  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async saveAttachment(ticketId: number, file: Express.Multer.File, companyId: number): Promise<any> {
    const accessToken = this.generateAccessToken();
    
    // Criar estrutura de pastas: public/company{id}/ticket{ticketId}
    const uploadDir = path.join(__dirname, '../../../../public', companyId.toString(), 'tickets', ticketId.toString());
    
    // Garantir que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    // Salvar arquivo
    fs.writeFileSync(filePath, file.buffer);

    // Salvar informações no banco
    const attachment = await SuporteTicketAttachment.create({
      ticket_id: ticketId,
      file_path: filePath,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      access_token: accessToken
    });

    return attachment;
  }

  private async sendWhatsAppNotification(ticket: any, action: string) {
    try {
      const whatsappNumber = process.env.TICKET_WHATS_NUMERO;
      if (!whatsappNumber) {
        console.log('TICKET_WHATS_NUMERO não configurado');
        return;
      }

      let message = '';
      switch (action) {
        case 'created':
          message = `🎫 *Novo Ticket Criado*\n\n` +
                   `📋 *Título:* ${ticket.title}\n` +
                   `👤 *Usuário:* ${ticket.user?.name || 'N/A'}\n` +
                   `⚡ *Prioridade:* ${ticket.priority}\n` +
                   `📝 *Descrição:* ${ticket.description || 'Sem descrição'}\n` +
                   `🆔 *ID:* #${ticket.id}`;
          break;
        case 'updated':
          message = `🔄 *Ticket Atualizado*\n\n` +
                   `📋 *Título:* ${ticket.title}\n` +
                   `👤 *Usuário:* ${ticket.user?.name || 'N/A'}\n` +
                   `📊 *Status:* ${ticket.status}\n` +
                   `🆔 *ID:* #${ticket.id}`;
          break;
        case 'closed':
          message = `✅ *Ticket Fechado*\n\n` +
                   `📋 *Título:* ${ticket.title}\n` +
                   `👤 *Usuário:* ${ticket.user?.name || 'N/A'}\n` +
                   `🆔 *ID:* #${ticket.id}`;
          break;
      }

      console.log(`📱 WhatsApp Notification to ${whatsappNumber}:`, message);
      
    } catch (error) {
      console.error('Erro ao enviar notificação WhatsApp:', error);
    }
  }

  private async sendWebhookNotification(ticket: any, action: string) {
    try {
      const webhookUrl = process.env.TICKET_CHAMADO_URL;
      if (!webhookUrl) {
        console.log('TICKET_CHAMADO_URL não configurado');
        return;
      }

      // Gerar URLs dos anexos se existirem
      const attachments = ticket.attachments ? ticket.attachments.map((attachment: any) => ({
        id: attachment.id,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        download_url: `${process.env.BACKEND_URL || 'http://192.168.88.194:8080'}/plugins/suporte/attachments/${attachment.access_token}/download`,
        preview_url: `${process.env.BACKEND_URL || 'http://192.168.88.194:8080'}/plugins/suporte/attachments/${attachment.access_token}/preview`,
        uploaded_at: attachment.uploaded_at
      })) : [];

      const payload = {
        action: action,
        ticket: {
          id: ticket.id,
          company_id: ticket.company_id,
          user_id: ticket.user_id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          action: action,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          attachments: attachments,
          user: ticket.user ? {
            id: ticket.user.id,
            name: ticket.user.name,
            email: ticket.user.email
          } : null
        }
      };

      // Enviar webhook
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ERP-360-Suporte/1.0'
        },
        timeout: 10000 // 10 segundos
      });

      console.log(`🔗 Webhook enviado para ${webhookUrl}:`, payload);
      
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      // Não falhar o processo principal se o webhook falhar
    }
  }

  async create(data: CreateTicketData) {
    const { attachments, ...ticketData } = data;
    
    const ticket = await SuporteTicket.create(ticketData);
    
    // Processar anexos se existirem
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        await this.saveAttachment(ticket.id, file, data.company_id);
      }
    }
    
    // Buscar dados completos do ticket (sem includes por enquanto)
    const ticketWithUser = await SuporteTicket.findByPk(ticket.id);
    
    // Registrar no histórico
    await SuporteTicketHistory.create({
      ticket_id: ticket.id,
      user_id: data.user_id,
      action: 'created',
      message: `Ticket criado: ${data.title}`
    });

    // Enviar notificações
    await this.sendWhatsAppNotification(ticketWithUser, 'created');
    await this.sendWebhookNotification(ticketWithUser, 'created');

    return ticketWithUser;
  }

  async findWithPagination(filters: any, options: PaginationOptions) {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    console.log('🔍 TicketService.findWithPagination - Filtros:', filters);
    console.log('📄 Opções:', options);

    const { count, rows } = await SuporteTicket.findAndCountAll({
      where: filters,
      // Remover includes por enquanto para evitar erro de associação
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    console.log(`✅ Encontrados ${count} tickets, retornando ${rows.length} na página ${page}`);

    return {
      items: rows,
      page,
      pageSize: limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id: number, companyId: number) {
    return await SuporteTicket.findOne({
      where: { id, company_id: companyId }
      // Remover includes por enquanto para evitar erro de associação
    });
  }

  async update(id: number, data: UpdateTicketData, companyId: number) {
    const ticket = await SuporteTicket.findOne({
      where: { id, company_id: companyId }
      // Remover includes por enquanto para evitar erro de associação
    });

    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;

    await SuporteTicket.update(updateData, { where: { id, company_id: companyId } });

    // Registrar no histórico
    await SuporteTicketHistory.create({
      ticket_id: id,
      user_id: data.userId,
      action: data.status === 'closed' ? 'closed' : 'updated',
      message: data.message || `Status alterado para: ${data.status}`
    });

    // Buscar ticket atualizado
    const updatedTicket = await this.findById(id, companyId);

    // Enviar notificações
    await this.sendWhatsAppNotification(updatedTicket, data.status === 'closed' ? 'closed' : 'updated');
    await this.sendWebhookNotification(updatedTicket, data.status === 'closed' ? 'closed' : 'updated');

    return updatedTicket;
  }

  async addAttachment(ticketId: number, file: Express.Multer.File, companyId: number) {
    const ticket = await SuporteTicket.findOne({
      where: { id: ticketId, company_id: companyId }
    });

    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    return await this.saveAttachment(ticketId, file, companyId);
  }

  async getHistory(ticketId: number, companyId: number) {
    return await SuporteTicketHistory.findAll({
      where: { ticket_id: ticketId },
      order: [['created_at', 'ASC']]
      // Remover includes por enquanto para evitar erro de associação
    });
  }

  async getStats(companyId: number) {
    const stats = await SuporteTicket.findAll({
      where: { company_id: companyId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    return stats.reduce((acc: any, stat: any) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});
  }

  async getCompaniesForFilter() {
    try {
      console.log('🔍 Buscando empresas para filtro...');
      
      // Usar query SQL direta com o sequelize importado
      const companies = await sequelize.query(`
        SELECT id, name
        FROM "Companies"
        ORDER BY name ASC
      `, {
        type: QueryTypes.SELECT
      });

      console.log(`✅ Empresas encontradas: ${companies?.length || 0}`);
      console.log('📋 Dados das empresas:', companies);
      
      return companies || [];
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  }

  async getAttachmentByToken(token: string) {
    const attachment = await SuporteTicketAttachment.findOne({
      where: { access_token: token }
      // Remover includes por enquanto para evitar erro de associação
    });

    return attachment;
  }

  async generateAttachmentUrls(attachments: any[], baseUrl: string) {
    return attachments.map(attachment => ({
      ...attachment.dataValues,
      download_url: `${baseUrl}/plugins/suporte/attachments/${attachment.access_token}/download`,
      preview_url: `${baseUrl}/plugins/suporte/attachments/${attachment.access_token}/preview`
    }));
  }

  // ==============================================
  // MÉTODOS PARA RESPOSTAS DOS TICKETS
  // ==============================================

  async createReply(ticketId: number, userId: number, message: string, isInternal: boolean = false, attachments?: any[], companyId?: number) {
    console.log('💬 Criando resposta para ticket:', { ticketId, userId, message, isInternal, attachmentsCount: attachments?.length || 0, companyId });

    try {
      // Criar a resposta
      const reply = await SuporteTicketReply.create({
        ticket_id: ticketId,
        user_id: userId,
        message,
        is_internal: isInternal
      });

      console.log('✅ Resposta criada:', reply.id);

      // Salvar anexos se houver
      if (attachments && attachments.length > 0) {
        console.log('📎 Salvando anexos:', attachments.length);
        for (const file of attachments) {
          console.log('📎 Salvando anexo:', file.originalname);
          await this.saveReplyAttachment(reply.id, file, companyId, ticketId);
          console.log('✅ Anexo salvo:', file.originalname);
        }
      }

      // Registrar no histórico
      await SuporteTicketHistory.create({
        ticket_id: ticketId,
        user_id: userId,
        action: 'updated',
        message: `Resposta adicionada: ${message.substring(0, 50)}...`
      });

      // Atualizar status do ticket para "em andamento" se não for resposta interna
      if (!isInternal) {
        await SuporteTicket.update(
          { status: 'in_progress' },
          { where: { id: ticketId } }
        );
      }

      console.log('✅ Resposta completa criada:', reply.id);
      return reply;
    } catch (error) {
      console.error('❌ Erro ao criar resposta:', error);
      throw error;
    }
  }

  private async saveReplyAttachment(replyId: number, file: any, companyId: number, ticketId: number) {
    console.log('📎 saveReplyAttachment iniciado:', { replyId, fileName: file.originalname, companyId, ticketId });
    
    try {
      const accessToken = this.generateAccessToken();
      
      // Criar estrutura de pastas: backend/public/company{id}/suporte{ticketId}/replies/reply{replyId}
      const uploadDir = path.join(__dirname, '../../../../public', `company${companyId}`, `suporte${ticketId}`, 'replies', replyId.toString());
      
      console.log('📁 Diretório de upload:', uploadDir);
      
      // Garantir que o diretório existe
      if (!fs.existsSync(uploadDir)) {
        console.log('📁 Criando diretório:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Gerar nome único para o arquivo
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);

      console.log('📄 Salvando arquivo:', filePath);

      // Salvar arquivo
      fs.writeFileSync(filePath, file.buffer);

      console.log('💾 Arquivo salvo, criando registro no banco...');

      // Salvar informações no banco
      const attachment = await SuporteTicketReplyAttachment.create({
        reply_id: replyId,
        file_name: fileName,
        mime_type: file.mimetype,
        file_size: file.size,
        file_path: filePath,
        access_token: accessToken,
        download_url: `${process.env.BACKEND_URL}/plugins/suporte/replies/attachments/${accessToken}/download`,
        preview_url: `${process.env.BACKEND_URL}/plugins/suporte/replies/attachments/${accessToken}/preview`
      });

      console.log('✅ Anexo salvo no banco:', attachment.id);
      return attachment;
    } catch (error) {
      console.error('❌ Erro ao salvar anexo:', error);
      throw error;
    }
  }

  async getTicketReplies(ticketId: number, companyId: number) {
    console.log('💬 Buscando respostas do ticket:', { ticketId, companyId });

    try {
      // Verificar se o ticket pertence à empresa (ou se é Company 1 superadmin)
      const ticket = await SuporteTicket.findOne({
        where: { id: ticketId, company_id: companyId }
      });

      if (!ticket) {
        console.log('❌ Ticket não encontrado ou sem permissão');
        throw new Error('Ticket não encontrado ou sem permissão');
      }

      console.log('✅ Ticket encontrado:', ticket.id);

      const replies = await SuporteTicketReply.findAll({
        where: { ticket_id: ticketId },
        order: [['created_at', 'ASC']]
      });

      console.log(`📬 Encontradas ${replies.length} respostas`);

      // Buscar anexos para cada resposta
      for (const reply of replies) {
        console.log(`🔍 Buscando anexos para resposta ${reply.id}`);
        
        const attachments = await SuporteTicketReplyAttachment.findAll({
          where: { reply_id: reply.id }
        });
        
        console.log(`📎 Encontrados ${attachments.length} anexos para resposta ${reply.id}`);
        
        // Adicionar URLs de download e preview para cada anexo
        reply.dataValues.attachments = attachments.map(attachment => {
          // Se já tem URL completa no banco, usar ela. Senão, gerar nova
          const downloadUrl = attachment.download_url && attachment.download_url.startsWith('http')
            ? attachment.download_url
            : `${process.env.BACKEND_URL}/plugins/suporte/replies/attachments/${attachment.access_token}/download`;
          
          const previewUrl = attachment.preview_url && attachment.preview_url.startsWith('http')
            ? attachment.preview_url
            : `${process.env.BACKEND_URL}/plugins/suporte/replies/attachments/${attachment.access_token}/preview`;
          
          console.log('🔗 Gerando URLs para anexo:', {
            id: attachment.id,
            fileName: attachment.file_name,
            accessToken: attachment.access_token,
            downloadUrl,
            previewUrl
          });
          
          return {
            ...attachment.dataValues,
            download_url: downloadUrl,
            preview_url: previewUrl
          };
        });
      }

      console.log('✅ Respostas processadas com anexos');
      return replies;
    } catch (error) {
      console.error('❌ Erro em getTicketReplies:', error);
      throw error;
    }
  }

  async getReplyAttachmentByToken(token: string) {
    const attachment = await SuporteTicketReplyAttachment.findOne({
      where: { access_token: token }
    });

    return attachment;
  }

  async canUserReplyTicket(ticketId: number, userId: number, companyId: number) {
    console.log('🔐 Verificando permissão para responder ticket:', { ticketId, userId, companyId });

    // Buscar informações do usuário
    const User = require('../../../models/User').default;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return false;
    }

    // Company 1 superadmin pode responder qualquer ticket
    if (companyId === 1 && user.super) {
      console.log('✅ Company 1 superadmin - pode responder qualquer ticket');
      return true;
    }

    // Company 1 admin pode responder tickets da própria empresa
    if (companyId === 1 && user.profile === 'admin') {
      console.log('✅ Company 1 admin - pode responder tickets da própria empresa');
      return true;
    }

    // Outras empresas só podem responder tickets próprios
    const ticket = await SuporteTicket.findOne({
      where: { id: ticketId, company_id: companyId }
    });

    if (ticket) {
      console.log('✅ Usuário pode responder ticket da própria empresa');
      return true;
    }

    console.log('❌ Usuário não tem permissão para responder este ticket');
    return false;
  }
}

export default new TicketService();