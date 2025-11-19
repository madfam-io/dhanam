import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CryptoService } from './crypto.service';

/**
 * AWS KMS Service for encrypting/decrypting sensitive data
 *
 * In production, uses AWS KMS for provider tokens and sensitive credentials.
 * In development, falls back to local encryption using CryptoService.
 *
 * @see REMEDIATION_PLAN.md - Task 1.5
 */
@Injectable()
export class KmsService implements OnModuleInit {
  private readonly isProduction: boolean;
  private readonly region: string;
  private readonly keyId: string | undefined;
  private kmsClient: any; // AWS KMSClient
  private localCrypto: CryptoService;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    this.keyId = this.configService.get('KMS_KEY_ID');
    this.localCrypto = new CryptoService();
  }

  async onModuleInit() {
    if (this.isProduction) {
      if (!this.keyId) {
        throw new Error(
          'KMS_KEY_ID must be set in production environment for secure token encryption'
        );
      }

      // Dynamically import AWS SDK to avoid requiring it in development
      try {
        const { KMSClient } = await import('@aws-sdk/client-kms');
        this.kmsClient = new KMSClient({ region: this.region });
        // eslint-disable-next-line no-console
        console.log(`✅ KMS Service initialized with region: ${this.region}, key: ${this.keyId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to initialize AWS KMS: ${errorMessage}. ` +
            'Ensure @aws-sdk/client-kms is installed.'
        );
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️  Development mode: Using local encryption instead of AWS KMS');
    }
  }

  /**
   * Encrypt data using AWS KMS (production) or local encryption (development)
   *
   * @param plaintext - The data to encrypt
   * @returns Base64-encoded ciphertext
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!this.isProduction) {
      return this.localCrypto.encrypt(plaintext);
    }

    try {
      const { EncryptCommand } = await import('@aws-sdk/client-kms');

      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, 'utf8') as any,
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.CiphertextBlob).toString('base64');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `KMS encryption failed: ${errorMessage}. ` + 'Ensure IAM role has kms:Encrypt permission.'
      );
    }
  }

  /**
   * Decrypt data using AWS KMS (production) or local encryption (development)
   *
   * @param ciphertext - Base64-encoded ciphertext
   * @returns Decrypted plaintext
   */
  async decrypt(ciphertext: string): Promise<string> {
    if (!this.isProduction) {
      return this.localCrypto.decrypt(ciphertext);
    }

    try {
      const { DecryptCommand } = await import('@aws-sdk/client-kms');

      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(ciphertext, 'base64') as any,
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.Plaintext).toString('utf8');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `KMS decryption failed: ${errorMessage}. ` +
          'Ensure IAM role has kms:Decrypt permission and key is correct.'
      );
    }
  }

  /**
   * Check if KMS is available and properly configured
   */
  isKmsAvailable(): boolean {
    return this.isProduction && !!this.kmsClient && !!this.keyId;
  }

  /**
   * Get encryption method being used
   */
  getEncryptionMethod(): string {
    return this.isKmsAvailable() ? 'AWS KMS' : 'Local Encryption';
  }
}
