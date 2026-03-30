import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Divider,
  Alert,
  Container,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  Badge
} from "@material-ui/core";
import Pagination from "@material-ui/lab/Pagination";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  HelpOutline as SupportAgentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../../services/api";
import useAuth from "../../../hooks/useAuth.js";
import TicketHistoryModal from "../components/TicketHistoryModal";
import TicketRepliesModal from "../components/TicketRepliesModal";

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    userId: '',
    companyFilter: ''
  });
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal'
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);
  const [selectedTicketForHistory, setSelectedTicketForHistory] = useState(null);
  const [selectedTicketForReplies, setSelectedTicketForReplies] = useState(null);

  // Verificar se pode filtrar por empresa
  // APENAS superadmin OU admin da Company 1 (ID = 1)
  const canFilterByCompany = user?.super || (user?.profile === 'admin' && Number(user?.companyId) === 1);

  useEffect(() => {
    loadTickets();
  }, [currentPage, filters]);

  useEffect(() => {
    if (canFilterByCompany) {
      loadCompanies();
    }
  }, [canFilterByCompany]);

  const loadCompanies = async () => {
    try {
      const response = await api.get('/plugins/suporte/companies');
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Não mostrar erro para usuários sem permissão
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar empresas');
      }
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      // Adicionar filtro de empresa se aplicável
      if (canFilterByCompany && filters.companyFilter) {
        params.append('companyFilter', filters.companyFilter);
      }

      const response = await api.get(`/plugins/suporte/tickets?${params}`);
      
      // Tratar resposta mesmo quando não há tickets
      if (response.data) {
        setTickets(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setTickets([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      // Não mostrar erro se for apenas falta de tickets
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar tickets');
      }
      setTickets([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateTicket = async () => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priority', form.priority);
      
      // Adicionar anexos
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      await api.post('/plugins/suporte/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Ticket criado com sucesso!');
      setOpenModal(false);
      resetForm();
      setAttachments([]);
      loadTickets();
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateTicket = async (ticketId, status, message) => {
    try {
      await api.put(`/plugins/suporte/tickets/${ticketId}`, {
        status,
        message
      });
      toast.success('Ticket atualizado com sucesso!');
      loadTickets();
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast.error('Erro ao atualizar ticket');
    }
  };

  const handleFileUploadToTicket = async (ticketId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post(`/plugins/suporte/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Anexo enviado com sucesso!');
      loadTickets();
    } catch (error) {
      console.error('Erro ao enviar anexo:', error);
      toast.error('Erro ao enviar anexo');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      priority: 'normal'
    });
    setAttachments([]);
    setEditingTicket(null);
    setOpenModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'primary';
      case 'in_progress': return 'secondary';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" style={{ marginTop: 16 }}>
          Carregando tickets...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <SupportAgentIcon style={{ marginRight: 16, verticalAlign: 'middle' }} />
          Tickets de Suporte
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            resetForm();
            setOpenModal(true);
          }}
        >
          <AddIcon style={{ marginRight: 8 }} />
          Novo Ticket
        </Button>
      </Box>

      {/* Filtros */}
      <Paper style={{ padding: 16, marginBottom: 16 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          {canFilterByCompany && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={filters.companyFilter}
                  onChange={(e) => setFilters({ ...filters, companyFilter: e.target.value })}
                >
                  <MenuItem value="">Todas as Empresas</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.fantasia || company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="open">Aberto</MenuItem>
                <MenuItem value="in_progress">Em Andamento</MenuItem>
                <MenuItem value="closed">Fechado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Baixa</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Tickets */}
      {tickets.length === 0 ? (
        <Paper style={{ padding: 32, textAlign: 'center' }}>
          <SupportAgentIcon style={{ fontSize: 64, color: 'grey.400', marginBottom: 16 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Nenhum ticket encontrado
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Crie seu primeiro ticket de suporte
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              resetForm();
              setOpenModal(true);
            }}
          >
            <AddIcon style={{ marginRight: 8 }} />
            Criar Primeiro Ticket
          </Button>
        </Paper>
      ) : (
        <Box>
          {tickets.map((ticket) => (
            <Card key={ticket.id} style={{ marginBottom: 16 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {ticket.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {ticket.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Criado por: {ticket.user?.name} em {formatDate(ticket.created_at)}
                      {canFilterByCompany && ticket.company && (
                        <span> • Empresa: {ticket.company.fantasia || ticket.company.name}</span>
                      )}
                    </Typography>
                    <Box display="flex" style={{ gap: 8 }} flexWrap="wrap">
                      <Chip
                        label={getStatusLabel(ticket.status)}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                      <Chip
                        label={getPriorityLabel(ticket.priority)}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                        variant="outlined"
                      />
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <Chip
                          icon={<AttachFileIcon />}
                          label={`${ticket.attachments.length} anexo(s)`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" style={{ gap: 8 }}>
                    <Tooltip title="Visualizar Ticket">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingTicket({ ...ticket, isEditing: false });
                          setForm({
                            title: ticket.title,
                            description: ticket.description,
                            priority: ticket.priority
                          });
                          setOpenModal(true);
                        }}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar Ticket">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingTicket({ ...ticket, isEditing: true });
                          setForm({
                            title: ticket.title,
                            description: ticket.description,
                            priority: ticket.priority
                          });
                          setOpenModal(true);
                        }}
                        color="secondary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Histórico">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTicketForHistory(ticket);
                          setHistoryModalOpen(true);
                        }}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Conversa">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTicketForReplies(ticket);
                          setRepliesModalOpen(true);
                        }}
                      >
                        <MessageIcon />
                      </IconButton>
                    </Tooltip>
                    {ticket.status !== 'closed' && (
                      <Tooltip title="Fechar Ticket">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateTicket(ticket.id, 'closed', 'Ticket fechado')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {ticket.status === 'open' && (
                      <Tooltip title="Marcar como Em Andamento">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateTicket(ticket.id, 'in_progress', 'Ticket em andamento')}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Avatar style={{ marginRight: 16 }}>
              <SupportAgentIcon />
            </Avatar>
{editingTicket ? (editingTicket.isEditing ? "Editar Ticket" : "Visualizar Ticket") : "Novo Ticket"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Informações do Ticket (modo visualização) */}
            {editingTicket && (
              <Grid item xs={12}>
                <Box mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Informações do Ticket
                  </Typography>
                  <Box display="flex" style={{ gap: 8 }} mb={2}>
                    <Chip
                      label={getStatusLabel(editingTicket.status)}
                      color={getStatusColor(editingTicket.status)}
                      size="small"
                    />
                    <Chip
                      label={getPriorityLabel(editingTicket.priority)}
                      color={getPriorityColor(editingTicket.priority)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Criado por: {editingTicket.user?.name} em {formatDate(editingTicket.created_at)}
                  </Typography>
                  {editingTicket.updated_at !== editingTicket.created_at && (
                    <Typography variant="body2" color="textSecondary">
                      Última atualização: {formatDate(editingTicket.updated_at)}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                InputProps={{
                  readOnly: editingTicket && !editingTicket.isEditing
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                multiline
                rows={4}
                InputProps={{
                  readOnly: editingTicket && !editingTicket.isEditing
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  disabled={editingTicket && !editingTicket.isEditing}
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Seção de Anexos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Anexos
              </Typography>
              <Box mb={2}>
                <input
                  accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3,.webp,.zip,.rar"
                  style={{ display: 'none' }}
                  id="file-upload"
                  multiple
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                    disabled={uploading}
                  >
                    Selecionar Arquivos
                  </Button>
                </label>
              </Box>
              
              {/* Lista de arquivos selecionados */}
              {attachments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Arquivos selecionados:
                  </Typography>
                  {attachments.map((file, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <AttachFileIcon style={{ marginRight: 8 }} />
                      <Typography variant="body2" style={{ flexGrow: 1 }}>
                        {file.name} ({formatFileSize(file.size)})
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeAttachment(index)}
                        color="secondary"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              
              {uploading && (
                <Box mt={2}>
                  <LinearProgress />
                  <Typography variant="body2" color="textSecondary">
                    Enviando arquivos...
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} startIcon={<CloseIcon />}>
            {editingTicket ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {/* Botão Editar (modo visualização) */}
          {editingTicket && !editingTicket.isEditing && (
            <Button
              onClick={() => {
                setEditingTicket({ ...editingTicket, isEditing: true });
                setForm({
                  title: editingTicket.title,
                  description: editingTicket.description,
                  priority: editingTicket.priority
                });
              }}
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
          )}
          
          {/* Botão Salvar (modo criação/edição) */}
          {(!editingTicket || editingTicket.isEditing) && (
            <Button
              onClick={editingTicket ? () => handleUpdateTicket(editingTicket.id, editingTicket.status, 'Ticket atualizado') : handleCreateTicket}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={!form.title || uploading}
            >
              {uploading ? 'Salvando...' : (editingTicket ? 'Salvar Alterações' : 'Salvar Ticket')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Histórico */}
      <TicketHistoryModal
        open={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedTicketForHistory(null);
        }}
        ticket={selectedTicketForHistory}
      />

      {/* Modal de Respostas */}
      <TicketRepliesModal
        open={repliesModalOpen}
        onClose={() => {
          setRepliesModalOpen(false);
          setSelectedTicketForReplies(null);
        }}
        ticket={selectedTicketForReplies}
        user={user}
      />
    </Box>
  );
};

export default Tickets;
