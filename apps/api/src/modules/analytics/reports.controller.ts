import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';

import { ReportService } from './report.service';
import { SpacesService } from '../spaces/spaces.service';

class GenerateReportDto {
  @IsString()
  spaceId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(['pdf', 'csv'])
  format?: 'pdf' | 'csv';
}

class ReportListItem {
  id!: string;
  name!: string;
  type!: string;
  createdAt!: string;
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportService: ReportService,
    private readonly spacesService: SpacesService
  ) {}

  @Get(':spaceId')
  @ApiOperation({ summary: 'Get available report types for a space' })
  async getAvailableReports(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string
  ): Promise<{ reports: ReportListItem[] }> {
    // Verify user has access to space
    await this.spacesService.getUserSpace(userId, spaceId);

    // Return available report types
    const reports: ReportListItem[] = [
      {
        id: 'financial-summary',
        name: 'Financial Summary Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'transaction-export',
        name: 'Transaction Export',
        type: 'csv',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'budget-performance',
        name: 'Budget Performance Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'net-worth-trend',
        name: 'Net Worth Trend Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
    ];

    return { reports };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a financial report' })
  async generateReport(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateReportDto,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.getUserSpace(userId, dto.spaceId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const format = dto.format || 'pdf';

    if (format === 'csv') {
      const csv = await this.reportService.generateCsvExport(dto.spaceId, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-export-${dto.startDate}-to-${dto.endDate}.csv"`
      );
      res.status(HttpStatus.OK).send(csv);
    } else {
      const pdf = await this.reportService.generatePdfReport(dto.spaceId, startDate, endDate);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-report-${dto.startDate}-to-${dto.endDate}.pdf"`
      );
      res.status(HttpStatus.OK).send(pdf);
    }
  }

  @Get(':spaceId/download/pdf')
  @ApiOperation({ summary: 'Download PDF report' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async downloadPdfReport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.getUserSpace(userId, spaceId);

    const pdf = await this.reportService.generatePdfReport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-report-${startDate}-to-${endDate}.pdf"`
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get(':spaceId/download/csv')
  @ApiOperation({ summary: 'Download CSV export' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async downloadCsvExport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.getUserSpace(userId, spaceId);

    const csv = await this.reportService.generateCsvExport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-export-${startDate}-to-${endDate}.csv"`
    );
    res.status(HttpStatus.OK).send(csv);
  }
}
