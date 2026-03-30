import { Router } from "express";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

/**
 * 🧩 Sistema de Integração de Plugins
 * 
 * Este sistema é responsável por:
 * - Carregar plugins automaticamente
 * - Montar rotas de plugins
 * - Gerenciar configurações de plugins
 * - Validar integridade dos plugins
 */
class PluginManager {
  private plugins: Map<string, any> = new Map();
  private routes: Router = Router();

  constructor() {
    this.loadPlugins();
  }

  /**
   * Carrega todos os plugins disponíveis
   */
  private loadPlugins() {
    try {
      const pluginsRoot = path.resolve(__dirname, './plugins');
      console.log('🔍 PluginManager: Procurando plugins em:', pluginsRoot);
      
      if (!fs.existsSync(pluginsRoot)) {
        console.log('❌ PluginManager: Diretório de plugins não encontrado');
        logger.info('[PluginManager] Diretório de plugins não encontrado');
        return;
      }

      const pluginDirs = fs.readdirSync(pluginsRoot)
        .filter(d => fs.statSync(path.join(pluginsRoot, d)).isDirectory());

      console.log(`🧩 PluginManager: Encontrados ${pluginDirs.length} plugins: ${pluginDirs.join(', ')}`);
      logger.info(`[PluginManager] Encontrados ${pluginDirs.length} plugins: ${pluginDirs.join(', ')}`);

      for (const pluginName of pluginDirs) {
        console.log(`🔄 PluginManager: Carregando plugin: ${pluginName}`);
        this.loadPlugin(pluginName, pluginsRoot);
      }

    } catch (error) {
      console.error('❌ PluginManager: Erro ao carregar plugins:', error);
      logger.error('[PluginManager] Erro ao carregar plugins:', error);
    }
  }

  /**
   * Carrega um plugin específico
   */
  private loadPlugin(pluginName: string, pluginsRoot: string) {
    try {
      const pluginPath = path.join(pluginsRoot, pluginName);
      const indexPath = path.join(pluginPath, 'index.ts');
      
      console.log(`🔍 PluginManager: Verificando plugin ${pluginName} em: ${indexPath}`);
      
      if (!fs.existsSync(indexPath)) {
        console.log(`❌ PluginManager: Plugin ${pluginName} não possui index.ts`);
        logger.warn(`[PluginManager] Plugin ${pluginName} não possui index.ts`);
        return;
      }

      // Carregar configuração do plugin
      const configPath = path.join(pluginPath, 'config', 'plugin.config.ts');
      let config = null;
      
      if (fs.existsSync(configPath)) {
        try {
          config = require(configPath).defaultConfig;
          console.log(`✅ PluginManager: Config carregada para ${pluginName}`);
        } catch (error) {
          console.log(`⚠️ PluginManager: Erro ao carregar config do plugin ${pluginName}:`, error);
          logger.warn(`[PluginManager] Erro ao carregar config do plugin ${pluginName}:`, error);
        }
      } else {
        console.log(`ℹ️ PluginManager: Plugin ${pluginName} não possui config`);
      }

      // Carregar o plugin
      console.log(`🔄 PluginManager: Carregando módulo do plugin ${pluginName}...`);
      const plugin = require(indexPath).default;
      
      if (!plugin) {
        console.log(`❌ PluginManager: Plugin ${pluginName} não exporta um módulo válido`);
        logger.warn(`[PluginManager] Plugin ${pluginName} não exporta um módulo válido`);
        return;
      }

      console.log(`✅ PluginManager: Módulo do plugin ${pluginName} carregado com sucesso`);

      // Registrar plugin
      this.plugins.set(pluginName, {
        name: pluginName,
        module: plugin,
        config: config,
        path: pluginPath
      });

      // Montar rotas do plugin
      console.log(`🛣️ PluginManager: Montando rotas do plugin ${pluginName}...`);
      this.mountPluginRoutes(pluginName, plugin, config);

      console.log(`🎉 PluginManager: Plugin ${pluginName} carregado com sucesso`);
      logger.info(`[PluginManager] Plugin ${pluginName} carregado com sucesso`);

    } catch (error) {
      console.error(`❌ PluginManager: Erro ao carregar plugin ${pluginName}:`, error);
      logger.error(`[PluginManager] Erro ao carregar plugin ${pluginName}:`, error);
    }
  }

  /**
   * Monta as rotas de um plugin
   */
  private mountPluginRoutes(pluginName: string, plugin: any, config: any) {
    try {
      const routePath = config?.route || `/${pluginName}`;
      
      console.log(`🛣️ PluginManager: Montando rotas do plugin ${pluginName} em ${routePath}`);
      
      // Adicionar middleware de health check para cada plugin
      this.routes.use(`${routePath}/health`, (req, res) => {
        res.json({
          status: "ok",
          plugin: pluginName,
          version: config?.version || "1.0.0",
          timestamp: new Date().toISOString()
        });
      });

      // Montar rotas principais do plugin
      this.routes.use(routePath, plugin);

      console.log(`✅ PluginManager: Rotas do plugin ${pluginName} montadas em ${routePath}`);
      logger.info(`[PluginManager] Rotas do plugin ${pluginName} montadas em ${routePath}`);

    } catch (error) {
      console.error(`❌ PluginManager: Erro ao montar rotas do plugin ${pluginName}:`, error);
      logger.error(`[PluginManager] Erro ao montar rotas do plugin ${pluginName}:`, error);
    }
  }

  /**
   * Retorna as rotas dos plugins
   */
  getRoutes(): Router {
    return this.routes;
  }

  /**
   * Retorna informações sobre os plugins carregados
   */
  getPluginsInfo(): any[] {
    const pluginsInfo = [];
    
    for (const [name, plugin] of this.plugins) {
      pluginsInfo.push({
        name: name,
        version: plugin.config?.version || "1.0.0",
        description: plugin.config?.description || "Sem descrição",
        author: plugin.config?.author || "Desconhecido",
        route: plugin.config?.route || `/${name}`,
        features: plugin.config?.features || [],
        enabled: true
      });
    }

    return pluginsInfo;
  }

  /**
   * Retorna um plugin específico
   */
  getPlugin(name: string): any {
    return this.plugins.get(name);
  }

  /**
   * Verifica se um plugin está carregado
   */
  isPluginLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Recarrega todos os plugins
   */
  reloadPlugins() {
    this.plugins.clear();
    this.routes = Router();
    this.loadPlugins();
  }
}

// Instância singleton do gerenciador de plugins
const pluginManager = new PluginManager();

export default pluginManager;
