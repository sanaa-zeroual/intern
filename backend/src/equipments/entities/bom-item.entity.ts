import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Equipment } from './equipment.entity';
import { Article } from '../../articles/entities/article.entity';

@Entity('bom_items')
@Index(['equipment_id', 'article_id', 'position'], { unique: false })
export class BomItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  equipment_id: string;

  @ManyToOne(() => Equipment, (equipment) => equipment.bom_items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @Column({ type: 'uuid' })
  article_id: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ type: 'int', default: 1 })
  quantite_installee: number;

  @Column({ nullable: true, default: 'pièce' })
  unite: string;

  @Column({ nullable: true })
  position: string; // e.g. "Tambour de tête", "Palier avant"

  @Column({ nullable: true, default: 'moyenne' })
  criticite: string;

  @Column({ nullable: true })
  commentaire: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'principal',
  })
  article_principal_ou_alternatif: string; // 'principal' | 'alternatif'

  @Column({ nullable: true })
  frequence_remplacement: string; // e.g. "Tous les 6 mois", "Annuel"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
