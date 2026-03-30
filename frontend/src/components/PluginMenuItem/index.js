import React from 'react';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import NotificationsIcon from '@material-ui/icons/Notifications';
import ExtensionIcon from '@material-ui/icons/Extension';

/**
 * Componente para renderizar itens de menu de plugins
 */
const PluginMenuItem = ({ plugin, collapsed }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(plugin.route);
  };

  const getIcon = (iconName) => {
    // Mapear nomes de ícones para componentes Material-UI
    const iconMap = {
      'Notifications': NotificationsIcon,
      'Extension': ExtensionIcon,
      // Adicionar mais ícones conforme necessário
    };

    const IconComponent = iconMap[iconName] || ExtensionIcon;
    return <IconComponent />;
  };

  return (
    <ListItem button onClick={handleClick}>
      <ListItemIcon>
        {getIcon(plugin.icon)}
      </ListItemIcon>
      {!collapsed && <ListItemText primary={plugin.label} />}
    </ListItem>
  );
};

export default PluginMenuItem;
