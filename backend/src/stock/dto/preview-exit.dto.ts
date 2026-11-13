import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class PreviewExitDto {
  @IsNotEmpty({ message: "L'identifiant de l'article est obligatoire." })
  @IsUUID('all', { message: "Format d'identifiant d'article invalide." })
  article_id: string;

  @IsNotEmpty({ message: 'La quantité est obligatoire.' })
  @IsNumber({}, { message: 'La quantité doit être un nombre.' })
  @Min(1, { message: 'La quantité doit être supérieure ou égale à 1.' })
  quantite: number;
}
