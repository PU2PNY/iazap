import { Router } from "express";
import TicketController from "../controllers/TicketController";
import multer from "multer";
import path from "path";

const routes = Router();

// Configuração do multer mais simples para teste
const simpleUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 arquivos por vez
  }
});

// Configuração do multer para upload de arquivos em memória (para processamento posterior)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|webp|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Rotas do plugin de Suporte
routes.get('/tickets', TicketController.index);
routes.get('/tickets/:id', TicketController.show);
routes.post('/tickets', simpleUpload.array('attachments', 5), TicketController.store);
routes.put('/tickets/:id', TicketController.update);
routes.post('/tickets/:id/attachments', upload.single('file'), TicketController.uploadAttachment);
routes.get('/tickets/:id/history', TicketController.getHistory);
routes.get('/companies', TicketController.getCompanies);

// Rotas para respostas dos tickets
routes.post('/tickets/:id/replies', upload.array('attachments', 5), TicketController.createReply);
routes.get('/tickets/:id/replies', TicketController.getReplies);

export default routes;
