import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateStockExitDto {
  @IsNotEmpty({ message: "L'identifiant de l'article est obligatoire." })
  @IsUUID('all', { message: "Format d'identifiant d'article invalide." })
  article_id: string;

  @IsNotEmpty({ message: 'La quantité sortie est obligatoire.' })
  @IsNumber({}, { message: 'La quantité doit être un nombre.' })
  @Min(1, { message: 'La quantité sortie doit être supérieure ou égale à 1.' })
  quantite: number;

  @IsNotEmpty({ message: 'Le motif de sortie est obligatoire.' })
  @IsString()
  motif: string;

  @IsOptional()
  @IsString()
  demandeur?: string;

  // Section 9.5: Le numéro d'OT est contrôlé par le service dès qu'une provenance OCP est consommée
  @IsOptional()
  @IsString()
  numero_ot?: string;

  @IsOptional()
  @IsString()
  equipement?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
