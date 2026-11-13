import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

export enum StockProvenance {
  ANNEXE_D = 'Annexe D',
  JESA_AM = 'JESA AM',
  OCP_ISE = 'OCP — ISE',
  OCP_CESSION = 'OCP — Cession',
  AUTRE = 'Autre',
}

// Section 9.3: Règle de priorité de déstockage
export const PROVENANCE_PRIORITY: StockProvenance[] = [
  StockProvenance.ANNEXE_D,
  StockProvenance.JESA_AM,
  StockProvenance.OCP_ISE,
  StockProvenance.OCP_CESSION,
  StockProvenance.AUTRE,
];

@Entity('stocks')
@Index(['article_id', 'provenance'], { unique: true })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  article_id: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({
    type: 'varchar',
    length: 100,
    default: StockProvenance.ANNEXE_D,
  })
  provenance: string;

  @Column({ type: 'int', default: 0 })
  quantite_disponible: number;

  @Column({ type: 'int', default: 0 })
  quantite_reservee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  prix_unitaire: number | null;

  @Column({ type: 'timestamp', nullable: true })
  derniere_entree: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  derniere_sortie: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
