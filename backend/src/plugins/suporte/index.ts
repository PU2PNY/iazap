import { Router } from "express";
import { Sequelize } from "sequelize";
import suporteRoutes from "./routes/suporteRoutes";

// Importar os modelos corretamente
const SuporteTicket = require("./models/Ticket").default;
const SuporteTicketAttachment = require("./models/TicketAttachment").default;
const SuporteTicketHistory = require("./models/TicketHistory").default;

class SuportePlugin {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async initialize() {
    try {
      console.log('🧩 Inicializando plugin de Suporte...');

      // Inicializar modelos
      SuporteTicket(this.sequelize);
      SuporteTicketAttachment(this.sequelize);
      SuporteTicketHistory(this.sequelize);

      // Configurar associações
      const models = this.sequelize.models;
      
      if (models.SuporteTicket && models.SuporteTicketAttachment && models.SuporteTicketHistory) {
        // As associações são configuradas automaticamente pelos modelos
        console.log('✅ Associações dos modelos configuradas');
      }

      console.log('✅ Plugin de Suporte inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar plugin de Suporte:', error);
      throw error;
    }
  }

  async install() {
    try {
      console.log('🔧 Instalando plugin de Suporte...');
      
      // Verificar se as tabelas existem
      const tables = ['tickets', 'ticket_attachments', 'ticket_history'];
      
      for (const table of tables) {
        const [results] = await this.sequelize.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`
        ) as any;
        
        if (!results[0].exists) {
          console.log(`⚠️ Tabela ${table} não encontrada. Execute o instalador principal primeiro.`);
        } else {
          console.log(`✅ Tabela ${table} encontrada`);
        }
      }

      console.log('✅ Plugin de Suporte instalado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao instalar plugin de Suporte:', error);
      throw error;
    }
  }
}

// Exportar as rotas do plugin diretamente
export default suporteRoutes;
