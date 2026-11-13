import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { PreviewExitDto } from './dto/preview-exit.dto';
import { FindStockQueryDto } from './dto/find-stock-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getArticlesStockSummary(@Query() query: FindStockQueryDto) {
    return this.stockService.getArticlesStockSummary(query);
  }

  @Get('kpi')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getStockKpi() {
    return this.stockService.getStockKpi();
  }

  @Get('movements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getMovements(@Query('article_id') article_id?: string) {
    return this.stockService.getMovements(article_id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getNotifications(@Req() req: any) {
    return this.stockService.getNotifications(req.user?.role);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markNotificationAsRead(@Param('id') id: string) {
    return this.stockService.markNotificationAsRead(id);
  }

  @Post('preview-exit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  previewExit(@Body() dto: PreviewExitDto) {
    return this.stockService.previewExit(dto.article_id, dto.quantite);
  }

  @Post('entry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAGASINIER, UserRole.RESPONSABLE_BDM)
  recordEntry(@Body() dto: CreateStockEntryDto, @Req() req: any) {
    return this.stockService.recordEntry(dto, req.user);
  }

  @Post('exit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAGASINIER, UserRole.RESPONSABLE_BDM)
  recordExit(@Body() dto: CreateStockExitDto, @Req() req: any) {
    return this.stockService.recordExit(dto, req.user);
  }
}
