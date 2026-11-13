import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import {
  EquipmentStatus,
  EquipmentCriticality,
} from '../entities/equipment.entity';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  code_equipement: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  localisation?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsString()
  @IsOptional()
  ligne?: string;

  @IsEnum(EquipmentStatus)
  @IsOptional()
  statut?: EquipmentStatus;

  @IsEnum(EquipmentCriticality)
  @IsOptional()
  criticite?: EquipmentCriticality;

  @IsString()
  @IsOptional()
  responsable_technique?: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}
