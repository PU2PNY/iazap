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
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip
} from "@material-ui/core";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  GetApp as DownloadIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  Lock as LockIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocumentIcon
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../../services/api";

const TicketRepliesModal = ({ open, onClose, ticket, user }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  useEffect(() => {
    if (open && ticket) {
      loadReplies();
    }
  }, [open, ticket]);

  const loadReplies = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/plugins/suporte/tickets/${ticket.id}/replies`);
      console.log('📬 Respostas carregadas:', response.data);
      setReplies(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      toast.error('Erro ao carregar respostas do ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('message', newReply);
      formData.append('isInternal', isInternal);

      // Adicionar anexos
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post(`/plugins/suporte/tickets/${ticket.id}/replies`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Resposta enviada com sucesso!');
      setNewReply("");
      setIsInternal(false);
      setAttachments([]);
      loadReplies();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
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

  const handleDownloadAttachment = (attachment) => {
    console.log('📥 Tentando fazer download do anexo:', attachment);
    console.log('🔗 URL de download:', attachment.download_url);
    
    // Usar a URL diretamente do backend (já deve ser completa)
    window.open(attachment.download_url, '_blank');
  };

  const handlePreviewAttachment = (attachment) => {
    console.log('👁️ Tentando visualizar anexo:', attachment);
    console.log('🔗 URL de preview:', attachment.preview_url);
    
    // Usar a URL diretamente do backend (já deve ser completa)
    setPreviewAttachment(attachment);
    setPreviewModalOpen(true);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    return <DocumentIcon />;
  };

  const isImageFile = (mimeType) => {
    return mimeType.startsWith('image/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const canReply = () => {
    // Company 1 superadmin pode responder qualquer ticket
    if (user?.companyId === 1 && user?.super) return true;
    
    // Company 1 admin pode responder tickets da própria empresa
    if (user?.companyId === 1 && user?.profile === 'admin') return true;
    
    // Outras empresas só podem responder tickets próprios
    return ticket?.company_id === user?.companyId;
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Conversa do Ticket: {ticket.title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <LinearProgress style={{ width: '100%' }} />
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
                Criado em: {formatDate(ticket.created_at)}
              </Typography>
              {ticket.description && (
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  {ticket.description}
                </Typography>
              )}
            </Paper>

            {/* Lista de Respostas */}
            <Typography variant="h6" gutterBottom>
              Conversa ({replies.length} mensagens)
            </Typography>
            
            {replies.length === 0 ? (
              <Box textAlign="center" p={3}>
                <Typography variant="body2" color="textSecondary">
                  Nenhuma resposta ainda
                </Typography>
              </Box>
            ) : (
              <List>
                {replies.map((reply, index) => (
                  <React.Fragment key={reply.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar style={{ 
                          backgroundColor: reply.is_internal ? '#f44336' : '#2196f3' 
                        }}>
                          {reply.is_internal ? <LockIcon /> : <MessageIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                              <Typography variant="body1" component="span">
                                {reply.message}
                              </Typography>
                              {reply.is_internal && (
                                <Chip
                                  label="Interno"
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Box display="flex" alignItems="center" style={{ gap: 8 }} mt={1}>
                              <Typography variant="caption" color="textSecondary">
                                {reply.user?.name || 'Usuário'}
                              </Typography>
                              <ScheduleIcon style={{ fontSize: 16 }} />
                              <Typography variant="caption" color="textSecondary">
                                {formatDate(reply.created_at)}
                              </Typography>
                            </Box>
                            
                            {/* Anexos da resposta */}
                            {reply.attachments && reply.attachments.length > 0 && (
                              <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Anexos ({reply.attachments.length})
                                </Typography>
                                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                                  {reply.attachments.map((attachment, index) => {
                                    console.log('📎 Renderizando anexo:', attachment);
                                    return (
                                      <Card key={index} style={{ minWidth: 200 }}>
                                        <CardContent style={{ padding: '8px 16px' }}>
                                          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                            {getFileIcon(attachment.mime_type)}
                                            <Box flex={1}>
                                              <Typography variant="body2" noWrap>
                                                {attachment.file_name}
                                              </Typography>
                                              <Typography variant="caption" color="textSecondary">
                                                {formatFileSize(attachment.file_size)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </CardContent>
                                        <CardActions style={{ padding: '0 8px 8px' }}>
                                          <Tooltip title="Download">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleDownloadAttachment(attachment)}
                                            >
                                              <DownloadIcon />
                                            </IconButton>
                                          </Tooltip>
                                          {isImageFile(attachment.mime_type) && (
                                            <Tooltip title="Visualizar">
                                              <IconButton
                                                size="small"
                                                onClick={() => handlePreviewAttachment(attachment)}
                                              >
                                                <VisibilityIcon />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                        </CardActions>
                                      </Card>
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < replies.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Formulário de Nova Resposta */}
            {canReply() && (
              <Paper style={{ padding: 16, marginTop: 16 }}>
                <Typography variant="h6" gutterBottom>
                  Nova Resposta
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Digite sua resposta..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  style={{ marginBottom: 16 }}
                />

                {/* Checkbox para resposta interna */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Resposta interna (não visível para o cliente)"
                />

                {/* Upload de anexos */}
                <Box mt={2}>
                  <input
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    id="reply-attachments"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="reply-attachments">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFileIcon />}
                      size="small"
                    >
                      Anexar Arquivos
                    </Button>
                  </label>
                </Box>

                {/* Lista de anexos */}
                {attachments.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Anexos ({attachments.length})
                    </Typography>
                    {attachments.map((file, index) => (
                      <Card key={index} style={{ marginBottom: 8 }}>
                        <CardContent style={{ padding: '8px 16px' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2">
                                {file.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatFileSize(file.size)}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => removeAttachment(index)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {canReply() && (
          <Button
            onClick={handleSendReply}
            color="primary"
            variant="contained"
            startIcon={<SendIcon />}
            disabled={sending || !newReply.trim()}
          >
            {sending ? 'Enviando...' : 'Enviar Resposta'}
          </Button>
        )}
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>

      {/* Modal de Preview de Anexos */}
      <Dialog 
        open={previewModalOpen} 
        onClose={() => setPreviewModalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Visualizar: {previewAttachment?.file_name}
            </Typography>
            <IconButton onClick={() => setPreviewModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewAttachment && (
            <Box textAlign="center">
              {isImageFile(previewAttachment.mime_type) ? (
                <img
                  src={previewAttachment.preview_url}
                  alt={previewAttachment.file_name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh', 
                    objectFit: 'contain' 
                  }}
                />
              ) : (
                <Box p={4}>
                  <Typography variant="h6" gutterBottom>
                    Preview não disponível
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Este tipo de arquivo não pode ser visualizado. 
                    Use o botão de download para abrir o arquivo.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {previewAttachment && (
            <Button
              onClick={() => handleDownloadAttachment(previewAttachment)}
              color="primary"
              startIcon={<DownloadIcon />}
            >
              Download
            </Button>
          )}
          <Button onClick={() => setPreviewModalOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default TicketRepliesModal;
