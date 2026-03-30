// Configuração do Plugin de Suporte
export const defaultConfig = {
  name: 'suporte',
  description: 'Sistema de tickets de suporte para atendimento ao cliente',
  version: '1.0.0',
  author: 'Sérgio Moreira Costa',
  route: '/suporte',
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
