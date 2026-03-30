import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Paper
} from "@material-ui/core";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Message as MessageIcon
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../../services/api";

const TicketHistoryModal = ({ open, onClose, ticket }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ticket) {
      loadHistory();
    }
  }, [open, ticket]);

  const loadHistory = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/plugins/suporte/tickets/${ticket.id}/history`);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico do ticket');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <CheckCircleIcon />;
      case 'updated': return <EditIcon />;
      case 'responded': return <MessageIcon />;
      case 'closed': return <CheckCircleIcon />;
      default: return <PersonIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'primary';
      case 'updated': return 'secondary';
      case 'responded': return 'default';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'created': return 'Criado';
      case 'updated': return 'Atualizado';
      case 'responded': return 'Respondido';
      case 'closed': return 'Fechado';
      default: return action;
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Histórico do Ticket: {ticket.title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography>Carregando histórico...</Typography>
          </Box>
        ) : (
          <Box>
            {/* Informações do Ticket */}
            <Paper style={{ padding: 16, marginBottom: 16 }}>
              <Typography variant="h6" gutterBottom>
                Informações do Ticket
              </Typography>
              <Box display="flex" style={{ gap: 8 }} mb={2}>
                <Chip
                  label={ticket.status === 'open' ? 'Aberto' : 
                         ticket.status === 'in_progress' ? 'Em Andamento' : 'Fechado'}
                  color={ticket.status === 'open' ? 'primary' : 
                         ticket.status === 'in_progress' ? 'secondary' : 'default'}
                  size="small"
                />
                <Chip
                  label={ticket.priority === 'high' ? 'Alta' : 
                         ticket.priority === 'normal' ? 'Normal' : 'Baixa'}
                  color={ticket.priority === 'high' ? 'error' : 'primary'}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Criado por: {ticket.user?.name} em {formatDate(ticket.created_at)}
              </Typography>
            </Paper>

            {/* Histórico em formato de balões */}
            <Typography variant="h6" gutterBottom>
              Histórico de Atividades
            </Typography>
            
            {history.length === 0 ? (
              <Box textAlign="center" p={3}>
                <Typography variant="body2" color="textSecondary">
                  Nenhuma atividade registrada
                </Typography>
              </Box>
            ) : (
              <List>
                {history.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar style={{ backgroundColor: getActionColor(entry.action) + '.main' }}>
                          {getActionIcon(entry.action)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body1" component="span">
                              {entry.message || `Ticket ${getActionLabel(entry.action).toLowerCase()}`}
                            </Typography>
                            <Box display="flex" alignItems="center" style={{ gap: 8 }} mt={1}>
                              <Chip
                                label={getActionLabel(entry.action)}
                                size="small"
                                color={getActionColor(entry.action)}
                                variant="outlined"
                              />
                              <Typography variant="caption" color="textSecondary">
                                {entry.user?.name}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" style={{ gap: 4 }} mt={1}>
                            <ScheduleIcon style={{ fontSize: 16 }} />
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(entry.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < history.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketHistoryModal;
