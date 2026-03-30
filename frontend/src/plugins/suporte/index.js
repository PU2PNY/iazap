// Plugin de Suporte
// Módulo: Sistema de Tickets de Suporte - Frontend

export { default as Tickets } from './pages/Tickets';
export { default as TicketModal } from './components/TicketModal';

// Configurações do plugin
export const PLUGIN_CONFIG = {
  name: 'Suporte',
  description: 'Sistema de tickets de suporte para atendimento ao cliente',
  version: '1.0.0',
  author: 'Sérgio Moreira Costa 48 920004273',
  route: '/suporte',
  menu: {
    label: 'Suporte',
    icon: 'SupportAgent',
    route: '/suporte',
    roles: ['admin', 'supervisor', 'user'],
    visible: true,
    section: 'plugins'
  },
  permissions: {
    read: ['admin', 'supervisor', 'user'],
    write: ['admin', 'supervisor', 'user'],
    delete: ['admin', 'supervisor']
  },
  dependencies: [],
  features: [
    'Criação e gestão de tickets',
    'Sistema de prioridades (baixa, normal, alta)',
    'Status de tickets (aberto, em andamento, fechado)',
    'Upload de anexos',
    'Histórico completo de interações',
    'Notificações em tempo real',
    'Integração com WhatsApp',
    'Isolamento por empresa'
  ]
};

export default {
  PLUGIN_CONFIG
};
