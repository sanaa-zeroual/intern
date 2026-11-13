import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBomItemDto {
  @IsUUID()
  @IsNotEmpty()
  equipment_id: string;

  @IsUUID()
  @IsNotEmpty()
  article_id: string;

  @IsNumber()
  @Min(1)
  quantite_installee: number;

  @IsString()
  @IsOptional()
  unite?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  criticite?: string;

  @IsString()
  @IsOptional()
  commentaire?: string;

  @IsString()
  @IsOptional()
  article_principal_ou_alternatif?: string;

  @IsString()
  @IsOptional()
  frequence_remplacement?: string;
}
