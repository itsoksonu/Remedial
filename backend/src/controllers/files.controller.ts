import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FilesService } from '../services/files.service';
import { AppError } from '../middleware/errorHandler';

export class FilesController {
  static async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const { originalFilename, mimeType, sizeBytes, fileType, relatedClaimId, relatedAppealId } =
        req.body;

      if (!originalFilename || !mimeType || !fileType) {
        throw new AppError('Missing required fields: originalFilename, mimeType, fileType', 400);
      }

      const result = await FilesService.generatePresignedUploadUrl({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        originalFilename,
        mimeType,
        sizeBytes,
        fileType,
        relatedClaimId,
        relatedAppealId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const result = await FilesService.getFileMetadata(req.params.id, req.user.organizationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const url = await FilesService.generatePresignedDownloadUrl(
        req.params.id,
        req.user.organizationId,
      );

      // We can either redirect or return the URL. Returning JSON is usually more flexible for SPAs.
      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      await FilesService.deleteFile(req.params.id, req.user.organizationId);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
