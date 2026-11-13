import { IsOptional, IsString } from 'class-validator';

export class FindStockQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  provenance?: string;

  @IsOptional()
  @IsString()
  statut?: string; // 'EN_STOCK', 'STOCK_FAIBLE', 'RUPTURE', 'EN_ATTENTE_VALORISATION'

  @IsOptional()
  @IsString()
  type?: string;
}
