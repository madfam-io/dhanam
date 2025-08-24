import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { RulesService } from './rules.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, RulesService],
  exports: [CategoriesService, RulesService],
})
export class CategoriesModule {}
