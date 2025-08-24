import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { FxRatesService } from './fx-rates.service';
import { Currency } from '@prisma/client';
import { IsEnum, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class GetRateDto {
  @ApiQuery({ enum: Currency, description: 'Source currency' })
  @IsEnum(Currency)
  from: Currency;

  @ApiQuery({ enum: Currency, description: 'Target currency' })
  @IsEnum(Currency)
  to: Currency;

  @ApiQuery({ required: false, description: 'Date for historical rate (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

class ConvertAmountDto {
  @ApiQuery({ description: 'Amount to convert' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiQuery({ enum: Currency, description: 'Source currency' })
  @IsEnum(Currency)
  from: Currency;

  @ApiQuery({ enum: Currency, description: 'Target currency' })
  @IsEnum(Currency)
  to: Currency;

  @ApiQuery({ required: false, description: 'Date for historical rate (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

class HistoricalRatesDto {
  @ApiQuery({ enum: Currency, description: 'Source currency' })
  @IsEnum(Currency)
  from: Currency;

  @ApiQuery({ enum: Currency, description: 'Target currency' })
  @IsEnum(Currency)
  to: Currency;

  @ApiQuery({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  startDate: string;

  @ApiQuery({ description: 'End date (ISO 8601)' })
  @IsDateString()
  endDate: string;
}

@ApiTags('FX Rates')
@Controller('fx-rates')
export class FxRatesController {
  constructor(private readonly fxRatesService: FxRatesService) {}

  @Get('rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved successfully' })
  async getRate(@Query() query: GetRateDto) {
    const date = query.date ? new Date(query.date) : undefined;
    const rate = await this.fxRatesService.getExchangeRate(query.from, query.to, date);
    
    return {
      from: query.from,
      to: query.to,
      rate,
      date: date || new Date(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiResponse({ status: 200, description: 'Amount converted successfully' })
  async convertAmount(@Query() query: ConvertAmountDto) {
    const date = query.date ? new Date(query.date) : undefined;
    const convertedAmount = await this.fxRatesService.convertAmount(
      query.amount,
      query.from,
      query.to,
      date,
    );
    
    const rate = await this.fxRatesService.getExchangeRate(query.from, query.to, date);
    
    return {
      originalAmount: query.amount,
      convertedAmount,
      from: query.from,
      to: query.to,
      rate,
      date: date || new Date(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('historical')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical exchange rates' })
  @ApiResponse({ status: 200, description: 'Historical rates retrieved successfully' })
  async getHistoricalRates(@Query() query: HistoricalRatesDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    
    const rates = await this.fxRatesService.getHistoricalRates(
      query.from,
      query.to,
      startDate,
      endDate,
    );
    
    return {
      from: query.from,
      to: query.to,
      startDate,
      endDate,
      rates: rates.map(r => ({
        date: r.date,
        rate: r.rate,
        source: r.source,
      })),
      count: rates.length,
    };
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Get supported currencies' })
  @ApiResponse({ status: 200, description: 'Supported currencies retrieved successfully' })
  async getSupportedCurrencies() {
    const currencies = await this.fxRatesService.getSupportedCurrencies();
    
    return {
      currencies,
      count: currencies.length,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check FX rates service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    // Test by getting current USD/MXN rate
    try {
      const rate = await this.fxRatesService.getExchangeRate(Currency.USD, Currency.MXN);
      
      return {
        service: 'fx-rates',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        testRate: {
          from: 'USD',
          to: 'MXN',
          rate,
        },
      };
    } catch (error) {
      return {
        service: 'fx-rates',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch exchange rates',
      };
    }
  }
}