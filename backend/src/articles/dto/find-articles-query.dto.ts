import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ArticleType, ArticleStatut } from '../entities/article.entity';

export class FindArticlesQueryDto {
  @IsOptional()
  @IsEnum(ArticleType)
  type?: ArticleType;

  @IsOptional()
  @IsEnum(ArticleStatut)
  statut?: ArticleStatut;

  @IsOptional()
  @IsString()
  famille?: string;

  @IsOptional()
  @IsString()
  search?: string;
}