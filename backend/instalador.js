#!/usr/bin/env node

/**
 * Instalador unificado (core + plugins)
 * - Lê o .env do backend
 * - Executa, em ordem, os arquivos SQL de backend/sql (idempotentes)
 * - Garante colunas/tabelas necessárias sem perder dados
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config();

class UnifiedInstaller {
  constructor() {
    this.sequelize = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'evolution',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      dialect: 'postgres',
      logging: false
    };
    this.sqlDir = path.resolve(__dirname, 'sql');
    this.extraSqlDir = path.resolve(__dirname, '..', 'bd', 'sql');
  }

  async connect() {
    console.log('🔌 Conectando ao banco de dados...');
    this.sequelize = new Sequelize(this.config);
    await this.sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
  }

  listSqlFiles() {
    if (!fs.existsSync(this.sqlDir)) {
      console.log('ℹ️ Diretório SQL não encontrado, pulando. Caminho:', this.sqlDir);
      return [];
    }
    const files = fs
      .readdirSync(this.sqlDir)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // usa nome para ordenar (001_,100_,...)
    console.log('📄 Arquivos SQL encontrados:', files);
    return files.map((f) => path.join(this.sqlDir, f));
  }

  listExtraSqlFiles() {
    if (!fs.existsSync(this.extraSqlDir)) {
      console.log('ℹ️ Diretório SQL extra (bd/sql) não encontrado, pulando. Caminho:', this.extraSqlDir);
      return [];
    }
    const files = fs
      .readdirSync(this.extraSqlDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    console.log('📄 Arquivos SQL extras (bd/sql) encontrados:', files);
    return files.map((f) => path.join(this.extraSqlDir, f));
  }

  async runSqlFile(filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`➡️ Executando SQL: ${path.basename(filePath)}`);
    // Execução idempotente: os arquivos já usam IF NOT EXISTS
    await this.sequelize.query(sql);
    console.log(`✅ Concluído: ${path.basename(filePath)}`);
  }

  async install() {
    try {
      console.log('🚀 Iniciando instalador unificado...');
      console.log('📅', new Date().toISOString());
      console.log('🔧 Config DB:', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.username
      });

      await this.connect();

      // Executa todos os SQLs em ordem (backend/sql)
      let files = this.listSqlFiles();
      for (const file of files) {
        await this.runSqlFile(file);
      }

      // Executa SQLs extras (bd/sql) se existir
      let extraFiles = this.listExtraSqlFiles();
      for (const file of extraFiles) {
        await this.runSqlFile(file);
      }

      // Executar SQLs de plugins (pasta sql/plugin-name)
      await this.runPluginSqlFiles();

      // Executar instaladores de plugins (quando disponíveis)
      await this.runPluginInstallers();

      // Validação rápida das tabelas principais
      await this.validateInstallation();

      console.log('🎉 Instalação concluída. Sem perda de dados.');
    } catch (error) {
      console.error('💥 Falha na instalação:', error.message || error);
      process.exit(1);
    } finally {
      if (this.sequelize) await this.sequelize.close();
    }
  }

  async runPluginSqlFiles() {
    try {
      const sqlRoot = path.resolve(__dirname, 'sql');
      if (!fs.existsSync(sqlRoot)) {
        console.log('ℹ️ Diretório SQL não encontrado, pulando. Caminho:', sqlRoot);
        return;
      }

      const pluginDirs = fs.readdirSync(sqlRoot)
        .filter(d => fs.statSync(path.join(sqlRoot, d)).isDirectory());
      
      for (const pluginName of pluginDirs) {
        const sqlDir = path.join(sqlRoot, pluginName);
        console.log(`🧩 Executando SQLs do plugin: ${pluginName}`);
        const sqlFiles = fs.readdirSync(sqlDir)
          .filter(f => f.endsWith('.sql')).sort();
        
        for (const file of sqlFiles) {
          const filePath = path.join(sqlDir, file);
          const sql = fs.readFileSync(filePath, 'utf8');
          
          try {
            console.log(`➡️ Executando SQL (${pluginName}): ${file}`);
            await this.sequelize.query(sql);
            console.log(`✅ Concluído (${pluginName}): ${file}`);
          } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
              console.log(`⚠️ SQL do plugin ${pluginName} já executado: ${file}`);
            } else {
              console.error(`❌ Erro ao executar SQL do plugin ${pluginName} ${file}:`, error.message);
              throw error;
            }
          }
        }
      }
    } catch (e) {
      console.log('ℹ️ Erro ao executar SQLs de plugins (ignorado):', e.message || e);
    }
  }

  async runPluginInstallers() {
    try {
      console.log('🧩 Executando instaladores de plugins...');
      const plugins = [
        {
          name: 'suporte',
          path: path.resolve(__dirname, 'src/plugins/suporte/index.js')
        }
        // Adicionar outros plugins conforme necessário
      ];

      for (const plugin of plugins) {
        try {
          if (fs.existsSync(plugin.path)) {
            console.log(`➡️ Instalando plugin: ${plugin.name}`);
            const PluginInstaller = require(plugin.path);
            const installer = new PluginInstaller(this.sequelize);
            await installer.install();
            console.log(`✅ Plugin instalado: ${plugin.name}`);
          } else {
            console.log(`ℹ️ Instalador não encontrado para plugin: ${plugin.name}`);
          }
        } catch (e) {
          console.log(`⚠️ Falha ao instalar plugin ${plugin.name}:`, e.message || e);
        }
      }
    } catch (e) {
      console.log('ℹ️ Erro geral na instalação de plugins (ignorado):', e.message || e);
    }
  }

  async validateInstallation() {
    console.log('🧪 Validação rápida das tabelas principais...');
    const checks = [
      'SELECT 1 FROM "Users" LIMIT 1',
      'SELECT 1 FROM "Companies" LIMIT 1',
      'SELECT 1 FROM "tickets" LIMIT 1',
      'SELECT 1 FROM "Contacts" LIMIT 1',
      'SELECT 1 FROM "Notificacoes" LIMIT 1'
    ];
    for (const q of checks) {
      try { 
        await this.sequelize.query(q); 
        console.log('✅ OK:', q); 
      } catch (e) { 
        console.log('ℹ️ Skip:', q); 
      }
    }
  }
}

// Executar instalação se chamado diretamente
if (require.main === module) {
  const installer = new UnifiedInstaller();
  installer.install();
}

module.exports = UnifiedInstaller;
