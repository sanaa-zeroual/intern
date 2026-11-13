import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePriceDto {
  @IsNumber()
  @Min(0)
  prix_unitaire: number;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taux_conversion?: number;

  @IsString()
  @IsOptional()
  source_prix?: string;

  @IsString()
  @IsOptional()
  justification?: string;
}
