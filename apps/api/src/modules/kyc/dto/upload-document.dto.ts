import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl } from 'class-validator';

const ALLOWED_DOCUMENT_TYPES = [
  'ine_front',
  'ine_back',
  'passport',
  'curp',
  'proof_of_address',
  'selfie',
] as const;

export type DocumentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of verification document',
    enum: ALLOWED_DOCUMENT_TYPES,
    example: 'ine_front',
  })
  @IsString()
  @IsIn(ALLOWED_DOCUMENT_TYPES)
  documentType: DocumentType;

  @ApiProperty({
    description: 'URL of the uploaded document (e.g. Cloudflare R2 pre-signed URL)',
    example: 'https://storage.dhan.am/kyc/docs/abc123/ine_front.jpg',
  })
  @IsString()
  @IsUrl({ require_tld: false })
  documentUrl: string;
}
