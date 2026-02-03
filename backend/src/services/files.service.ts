import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/aws';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface UploadRequest {
  fileType: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  relatedClaimId?: string;
  relatedAppealId?: string;
  userId: string;
  organizationId: string;
}

export interface UploadResponse {
  id: string;
  originalFilename: string;
  s3Key: string;
  mimeType: string | null;
  sizeBytes: any;
  url: string;
}

export class FilesService {
  static async generatePresignedUploadUrl(data: UploadRequest): Promise<UploadResponse> {
    const fileId = uuidv4();
    const extension = data.originalFilename.split('.').pop();
    const s3Key = `${data.organizationId}/${fileId}/files/${uuidv4()}.${extension}`;

    // Create DB Record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        id: fileId,
        organizationId: data.organizationId,
        uploadedBy: data.userId,
        originalFilename: data.originalFilename,
        s3Key: s3Key,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        fileType: data.fileType,
        relatedClaimId: data.relatedClaimId,
        relatedAppealId: data.relatedAppealId,
      },
    });

    // Generate Presigned URL
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: data.mimeType,
      Metadata: {
        'original-filename': data.originalFilename,
        'organization-id': data.organizationId,
        'uploaded-by': data.userId,
      },
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return {
      id: fileUpload.id,
      originalFilename: fileUpload.originalFilename,
      s3Key: fileUpload.s3Key,
      mimeType: fileUpload.mimeType,
      sizeBytes: Number(fileUpload.sizeBytes), // Convert BigInt to Number for JSON response
      url,
    };
  }

  static async generatePresignedDownloadUrl(
    fileId: string,
    organizationId: string,
  ): Promise<string> {
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
        isDeleted: false,
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.s3Key,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async getFileMetadata(fileId: string, organizationId: string) {
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
        isDeleted: false,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Convert BigInt to Number
    return {
      ...file,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : null,
    };
  }

  static async deleteFile(fileId: string, organizationId: string): Promise<void> {
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
        isDeleted: false,
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Soft delete in DB
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    // Optional: We could also delete from S3, or move to an archive path, or set lifecycle policy.
    // For now, soft delete strictly means marking as deleted in DB.
    // If we wanted to actually delete from S3:
    /*
      await s3Client.send(new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.s3Key
      }));
      */
  }

  static async getFileStream(
    fileId: string,
    organizationId: string,
  ): Promise<NodeJS.ReadableStream> {
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
        isDeleted: false,
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.s3Key,
    });

    const response = await s3Client.send(command);
    return response.Body as NodeJS.ReadableStream;
  }
}
