import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { BomItem } from './entities/bom-item.entity';
import { Article } from '../articles/entities/article.entity';
import { Stock } from '../stock/entities/stock.entity';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, BomItem, Article, Stock])],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
  exports: [EquipmentsService],
})
export class EquipmentsModule {}
