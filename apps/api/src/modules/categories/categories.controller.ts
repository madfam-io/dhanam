import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('categories')
@Controller('spaces/:spaceId/categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories in a space' })
  findAll(@Param('spaceId') spaceId: string, @Req() req: AuthenticatedRequest) {
    return this.categoriesService.findAll(spaceId, req.user!.id);
  }

  @Get('budget/:budgetId')
  @ApiOperation({ summary: 'Get categories by budget' })
  findByBudget(
    @Param('spaceId') spaceId: string,
    @Param('budgetId') budgetId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.findByBudget(spaceId, req.user!.id, budgetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.findOne(spaceId, req.user!.id, id);
  }

  @Get(':id/spending')
  @ApiOperation({ summary: 'Get category spending details' })
  getCategorySpending(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.getCategorySpending(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.create(spaceId, req.user!.id, createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.update(
      spaceId,
      req.user!.id,
      id,
      updateCategoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.remove(spaceId, req.user!.id, id);
  }
}