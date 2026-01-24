import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedDocument {
  key: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'dhanam-documents';
    this.publicUrl =
      this.configService.get<string>('R2_PUBLIC_URL') ||
      `https://${this.bucket}.${accountId}.r2.cloudflarestorage.com`;

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('R2 Storage initialized');
    } else {
      this.logger.warn('R2 Storage not configured - document uploads will be disabled');
    }
  }

  /**
   * Check if R2 storage is configured and available
   */
  isAvailable(): boolean {
    return this.s3Client !== null;
  }

  /**
   * Generate a presigned URL for direct browser upload
   */
  async getPresignedUploadUrl(
    spaceId: string,
    assetId: string,
    filename: string,
    contentType: string,
    category: string = 'general'
  ): Promise<PresignedUrlResult> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    const extension = filename.split('.').pop() || '';
    const key = `spaces/${spaceId}/assets/${assetId}/${category}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'space-id': spaceId,
        'asset-id': assetId,
        category,
      },
    });

    const expiresIn = 3600; // 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      uploadUrl,
      key,
      expiresAt,
    };
  }

  /**
   * Generate a presigned URL for downloading a document
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Upload a file directly (for server-side uploads)
   */
  async uploadFile(
    spaceId: string,
    assetId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
    category: string = 'general'
  ): Promise<UploadedDocument> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    const extension = filename.split('.').pop() || '';
    const key = `spaces/${spaceId}/assets/${assetId}/${category}/${uuidv4()}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          'original-filename': filename,
          'space-id': spaceId,
          'asset-id': assetId,
          category,
        },
      })
    );

    const url = `${this.publicUrl}/${key}`;

    return {
      key,
      url,
      filename,
      fileType: contentType,
      fileSize: buffer.length,
      category,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    this.logger.log(`Deleted file: ${key}`);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the public URL for a file (if bucket has public access)
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
