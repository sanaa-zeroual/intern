import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateStockEntryDto {
  @IsNotEmpty({ message: "L'identifiant de l'article est obligatoire." })
  @IsUUID('all', { message: "Format d'identifiant d'article invalide." })
  article_id: string;

  @IsNotEmpty({ message: 'La quantité est obligatoire.' })
  @IsNumber({}, { message: 'La quantité doit être un nombre.' })
  @Min(1, { message: 'La quantité entrée doit être supérieure ou égale à 1.' })
  quantite: number;

  // Section 7.3: La provenance est obligatoire. Le système ne doit pas permettre de valider une entrée sans provenance.
  @IsNotEmpty({ message: 'La provenance est obligatoire pour enregistrer une entrée.' })
  @IsString()
  provenance: string;

  @IsNotEmpty({ message: "Le motif d'entrée est obligatoire." })
  @IsString()
  motif: string;

  @IsOptional()
  @IsString()
  reference_document?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Le prix unitaire doit être positif.' })
  prix_unitaire?: number;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
