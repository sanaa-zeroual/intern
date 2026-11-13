import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CreateBomItemDto } from './dto/create-bom-item.dto';
import { UpdateBomItemDto } from './dto/update-bom-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('equipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentsService.create(createEquipmentDto);
  }

  @Get()
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  findAll() {
    return this.equipmentsService.findAll();
  }

  @Get('tree')
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getTree() {
    return this.equipmentsService.getTree();
  }

  @Get('article/:articleId')
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getArticleEquipments(@Param('articleId') articleId: string) {
    return this.equipmentsService.getArticleEquipments(articleId);
  }

  @Get(':id')
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  findOne(@Param('id') id: string) {
    return this.equipmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentsService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.RESPONSABLE_BDM)
  remove(@Param('id') id: string) {
    return this.equipmentsService.remove(id);
  }

  // --- BOM Endpoints ---

  @Get(':id/bom')
  @Roles(
    UserRole.MAGASINIER,
    UserRole.VIEWER,
    UserRole.BDM,
    UserRole.RESPONSABLE_BDM,
  )
  getEquipmentBom(@Param('id') id: string) {
    return this.equipmentsService.getEquipmentBom(id);
  }

  @Post('bom')
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  addBomItem(@Body() createBomItemDto: CreateBomItemDto) {
    return this.equipmentsService.addBomItem(createBomItemDto);
  }

  @Patch('bom/:id')
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  updateBomItem(
    @Param('id') id: string,
    @Body() updateBomItemDto: UpdateBomItemDto,
  ) {
    return this.equipmentsService.updateBomItem(id, updateBomItemDto);
  }

  @Delete('bom/:id')
  @Roles(UserRole.BDM, UserRole.RESPONSABLE_BDM)
  removeBomItem(@Param('id') id: string) {
    return this.equipmentsService.removeBomItem(id);
  }
}
