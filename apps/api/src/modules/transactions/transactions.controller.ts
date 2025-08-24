import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionsFilterDto,
} from './dto';
import { Request } from 'express';

@ApiTags('transactions')
@Controller('spaces/:spaceId/transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions in a space' })
  findAll(
    @Param('spaceId') spaceId: string,
    @Query() filter: TransactionsFilterDto,
    @Req() req: Request,
  ) {
    return this.transactionsService.findAll(spaceId, req.user!.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by id' })
  findOne(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.transactionsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: Request,
  ) {
    return this.transactionsService.create(spaceId, req.user!.id, createTransactionDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: Request,
  ) {
    return this.transactionsService.update(
      spaceId,
      req.user!.id,
      id,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  remove(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.transactionsService.remove(spaceId, req.user!.id, id);
  }

  @Post('bulk-categorize')
  @ApiOperation({ summary: 'Bulk categorize transactions' })
  bulkCategorize(
    @Param('spaceId') spaceId: string,
    @Body() body: { transactionIds: string[]; categoryId: string },
    @Req() req: Request,
  ) {
    return this.transactionsService.bulkCategorize(
      spaceId,
      req.user!.id,
      body.transactionIds,
      body.categoryId,
    );
  }
}