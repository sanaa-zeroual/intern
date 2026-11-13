import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

export enum MovementType {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column()
  article_id: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ type: 'varchar', length: 150 })
  provenance: string;

  // Breakdown of quantities per provenance (especially for sorties using multi-provenances)
  @Column({ type: 'jsonb', nullable: true })
  details_provenances: Record<string, number> | null;

  // Mandatory when sortie consumes from OCP ISE or OCP Cession (Section 9.5)
  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_ot: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  demandeur: string | null;

  @Column({ type: 'varchar', length: 255 })
  motif: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_document: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  equipement: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  user_name: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
