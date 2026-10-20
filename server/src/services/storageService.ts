import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
}

export class StorageService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (this.isS3()) {
      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
      logger.info(`AWS S3 client initialized for bucket: ${env.AWS_S3_BUCKET} (${env.AWS_REGION})`);
    }
  }

  isS3(): boolean {
    return (
      env.STORAGE_TYPE === 's3' &&
      Boolean(env.AWS_ACCESS_KEY_ID) &&
      Boolean(env.AWS_SECRET_ACCESS_KEY) &&
      Boolean(env.AWS_S3_BUCKET)
    );
  }

  /**
   * Resolves the secure access URL for a stored resume
   */
  async getSecureUrl(fileName: string): Promise<string> {
    if (this.isS3()) {
      return this.getSignedDownloadUrl(fileName);
    }
    return `${env.SERVER_URL}/api/resumes/${fileName}`;
  }

  /**
   * Generates a pre-signed S3 download URL (expires in 15 minutes)
   */
  async getSignedDownloadUrl(fileName: string, expiresInSeconds = 900): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: `resumes/${fileName}`,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Handles storage of uploaded multer file
   */
  async processUpload(file: Express.Multer.File): Promise<UploadResult> {
    const fileName = file.filename;

    if (this.isS3() && this.s3Client) {
      const fileStream = fs.createReadStream(file.path);
      const uploadParams = {
        Bucket: env.AWS_S3_BUCKET,
        Key: `resumes/${fileName}`,
        Body: fileStream,
        ContentType: file.mimetype,
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));
      logger.info(`Uploaded file to AWS S3: resumes/${fileName}`);

      // Clean up local temp file after uploading to S3
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const fileUrl = await this.getSecureUrl(fileName);
      return { fileUrl, fileName: file.originalname };
    }

    // Default to local server storage
    const fileUrl = `${env.SERVER_URL}/api/resumes/${fileName}`;
    logger.info(`File stored locally: ${fileName} -> ${fileUrl}`);

    return {
      fileUrl,
      fileName: file.originalname,
    };
  }

  /**
   * Deletes a file from storage
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      if (this.isS3() && this.s3Client) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: `resumes/${fileName}`,
          })
        );
        logger.info(`Deleted file from S3: resumes/${fileName}`);
        return;
      }

      const filePath = path.join(env.UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted file locally: ${filePath}`);
      }
    } catch (err) {
      logger.error(`Failed to delete file ${fileName}:`, err);
    }
  }

  /**
   * Gets absolute local file path for streaming
   */
  getLocalFilePath(fileName: string): string | null {
    const filePath = path.join(env.UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}

export const storageService = new StorageService();
