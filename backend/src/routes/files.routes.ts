import { Router } from 'express';
import { FilesController } from '../controllers/files.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Request upload URL
router.post('/upload', FilesController.uploadFile);

// Get file metadata
router.get('/:id', FilesController.getFile);

// Get query-signed download URL
router.get('/:id/download', FilesController.downloadFile);

// Delete file
router.delete('/:id', FilesController.deleteFile);

export default router;
