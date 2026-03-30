import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar plugins do frontend
 */
const usePlugins = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Por enquanto, carregar apenas plugins do frontend
      const frontendPlugins = await loadFrontendPlugins();
      setPlugins(frontendPlugins);
      
    } catch (err) {
      console.error('Erro ao carregar plugins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFrontendPlugins = async () => {
    try {
      const pluginsRoot = '/src/plugins';
      const pluginDirs = await getPluginDirectories();
      const frontendPlugins = [];

      for (const pluginName of pluginDirs) {
        try {
          const pluginModule = await import(`../../plugins/${pluginName}`);
          if (pluginModule.PLUGIN_CONFIG) {
            frontendPlugins.push({
              ...pluginModule.PLUGIN_CONFIG,
              name: pluginName,
              frontend: true,
              component: pluginModule.NotificacoesComponent || null
            });
          }
        } catch (err) {
          console.warn(`Erro ao carregar plugin frontend ${pluginName}:`, err);
        }
      }

      return frontendPlugins;
    } catch (err) {
      console.error('Erro ao carregar plugins frontend:', err);
      return [];
    }
  };

  const getPluginDirectories = async () => {
    // Retornar plugins conhecidos que existem no sistema
    return ['suporte'];
  };

  const getPluginByRoute = (route) => {
    return plugins.find(plugin => plugin.route === route);
  };

  const getMenuItems = () => {
    return plugins
      .filter(plugin => plugin.menu && plugin.menu.visible)
      .map(plugin => ({
        ...plugin.menu,
        plugin: plugin
      }));
  };

  return {
    plugins,
    loading,
    error,
    loadPlugins,
    getPluginByRoute,
    getMenuItems
  };
};

export default usePlugins;
