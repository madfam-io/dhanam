import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { AdminGuard } from '../admin/guards/admin.guard';

import { DocumentsService } from './documents.service';
import { RequestUploadUrlDto, ConfirmUploadDto, ListDocumentsQueryDto } from './dto';

@ApiTags('admin-documents')
@Controller('admin/documents')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DocumentsAdminController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('spaces/:spaceId')
  @ApiOperation({
    summary: 'Admin: Request upload URL for a space',
    description: 'No file-size or quota limits for admin uploads',
  })
  @ApiBadRequestResponse({ description: 'Storage not configured' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  adminRequestUploadUrl(
    @Param('spaceId') spaceId: string,
    @Body() dto: RequestUploadUrlDto,
    @Req() req: Request
  ) {
    return this.documentsService.requestUploadUrl(spaceId, req.user!.id, dto, true);
  }

  @Post('spaces/:spaceId/:id/confirm')
  @ApiOperation({
    summary: 'Admin: Confirm upload for a document',
    description: 'No quota limits for admin confirmations',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiBadRequestResponse({ description: 'File not found in storage' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  adminConfirmUpload(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: Request
  ) {
    return this.documentsService.confirmUpload(spaceId, req.user!.id, id, dto, true);
  }

  @Get()
  @ApiOperation({
    summary: 'Admin: List all documents across spaces',
    description: 'Paginated list of all documents with optional filters',
  })
  adminListAll(@Query() query: ListDocumentsQueryDto) {
    return this.documentsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Admin: Get any document by ID',
    description: 'Retrieve document details regardless of space ownership',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  adminGetDocument(@Param('id') id: string) {
    return this.documentsService.findOneAdmin(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Admin: Hard-delete a document',
    description: 'Permanently removes document from database and R2 storage',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  adminDeleteDocument(@Param('id') id: string, @Req() req: Request) {
    return this.documentsService.deleteDocumentAdmin(id, req.user!.id);
  }
}
