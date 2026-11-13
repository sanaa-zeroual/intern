import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Article } from './article.entity';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  article_id: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ancien_prix: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  nouveau_prix: number;

  @Column({ default: 'MAD' })
  devise: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, default: 1 })
  taux_conversion: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prix_unitaire_mad: number;

  @Column({ nullable: true })
  source_prix: string | null; // e.g. "Facture fournisseur", "Devis OCP", "Catalogue JESA"

  @Column({ type: 'text', nullable: true })
  justification: string | null;

  @Column({ nullable: true })
  user_id: string | null;

  @Column({ nullable: true })
  user_name: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
