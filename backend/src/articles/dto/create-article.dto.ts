import { IsEnum, IsString, IsNotEmpty, IsOptional , IsNumber} from 'class-validator';
import { ArticleType, ArticleStatut } from '../entities/article.entity';
export class CreateArticleDto {
  @IsEnum(ArticleType)
  type: ArticleType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  unite: string;

  @IsOptional()
  @IsEnum(ArticleStatut)
  statut?: ArticleStatut;

  @IsOptional()
  @IsString()
  marque?: string;

  @IsOptional()
  @IsString()
  fabricant?: string;

  @IsOptional()
  @IsString()
  code_sap_oracle?: string;

  @IsOptional()
  @IsString()
  famille?: string;

  @IsOptional()
  @IsString()
  sous_famille?: string;

  @IsOptional()
  @IsNumber()
  seuil_min?: number;

  @IsOptional()
  @IsNumber()
  seuil_max?: number;

  @IsOptional()
  @IsNumber()
  stock_securite?: number;

  @IsOptional()
  @IsNumber()
  delai_approvisionnement?: number;

  @IsOptional()
  @IsString()
  criticite?: string;

  @IsOptional()
  @IsNumber()
  prix_unitaire?: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  reference_constructeur?: string;

  // Typologie 4.3: Bande convoyeur
  @IsOptional()
  @IsNumber()
  largeur?: number;

  @IsOptional()
  @IsNumber()
  longueur?: number;

  @IsOptional()
  @IsNumber()
  epaisseur?: number;

  @IsOptional()
  @IsString()
  type_bande?: string;

  @IsOptional()
  @IsNumber()
  nb_plis?: number;

  @IsOptional()
  @IsString()
  revetement?: string;

  // Typologie 4.4: Lubrifiant
  @IsOptional()
  @IsString()
  viscosite?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  conditionnement?: string;

  // Typologie 4.2: Interchangeable
  @IsOptional()
  @IsString()
  article_interchangeable_id?: string;

  @IsOptional()
  @IsString()
  equivalence?: string;
}


