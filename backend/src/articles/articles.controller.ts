import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CheckDuplicatesDto } from './dto/check-duplicate.dto';
import { UpdatePriceDto } from './dto/update-price.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAGASINIER, UserRole.BDM, UserRole.RESPONSABLE_BDM)
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Post('check-duplicates')
  checkDuplicates(@Body() checkDuplicatesDto: CheckDuplicatesDto) {
    return this.articlesService.checkDuplicates(checkDuplicatesDto);
  }

  @Get()
  findAll(@Query() query: FindArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get('pending-valuation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  getPendingValuation() {
    return this.articlesService.getPendingValuation();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Get(':id/price-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getPriceHistory(@Param('id') id: string) {
    return this.articlesService.getPriceHistory(id);
  }

  @Patch(':id/price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONSABLE_BDM)
  updatePrice(
    @Param('id') id: string,
    @Body() dto: UpdatePriceDto,
    @Req() req: any,
  ) {
    return this.articlesService.updatePrice(id, dto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAGASINIER, UserRole.BDM, UserRole.RESPONSABLE_BDM)
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: any,
  ) {
    // Section 3.1: Le magasinier ne doit pas pouvoir modifier les prix unitaires
    if (
      req.user?.role === UserRole.MAGASINIER &&
      updateArticleDto.prix_unitaire !== undefined
    ) {
      delete updateArticleDto.prix_unitaire;
    }
    return this.articlesService.update(id, updateArticleDto);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  archive(@Param('id') id: string) {
    return this.articlesService.archive(id);
  }
}
