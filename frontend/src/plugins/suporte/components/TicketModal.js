import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress
} from "@material-ui/core";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from "@material-ui/icons";

const TicketModal = ({ open, onClose, ticket, onUpdate }) => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(ticket?.status || 'open');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(ticket.id, status, message);
    }
    setMessage('');
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{ticket.title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações do Ticket */}
          <Grid item xs={12}>
            <Box display="flex" gap={1} mb={2}>
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
            <Typography variant="body1" paragraph>
              {ticket.description}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Criado por {ticket.user?.name} em {formatDate(ticket.created_at)}
            </Typography>
          </Grid>

          <Divider />

          {/* Anexos */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Anexos
              </Typography>
              <List>
                {ticket.attachments.map((attachment) => (
                  <ListItem key={attachment.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <AttachFileIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={attachment.file_path.split('/').pop()}
                      secondary={formatDate(attachment.uploaded_at)}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}

          {/* Histórico */}
          {ticket.history && ticket.history.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Histórico
              </Typography>
              <List>
                {ticket.history.map((entry) => (
                  <ListItem key={entry.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={entry.message}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {entry.user?.name} - {formatDate(entry.created_at)}
                          </Typography>
                          <Chip 
                            label={entry.action === 'created' ? 'Criado' :
                                   entry.action === 'updated' ? 'Atualizado' :
                                   entry.action === 'responded' ? 'Respondido' : 'Fechado'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}

          {/* Ações */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Responder / Atualizar
            </Typography>
            <TextField
              fullWidth
              label="Mensagem"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={3}
              placeholder="Digite sua resposta ou comentário..."
            />
            
            <Box mt={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="open">Aberto</MenuItem>
                  <MenuItem value="in_progress">Em Andamento</MenuItem>
                  <MenuItem value="closed">Fechado</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={!message && status === ticket.status}
        >
          Atualizar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketModal;
