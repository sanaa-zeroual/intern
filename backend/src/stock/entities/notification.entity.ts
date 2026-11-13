import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  ENTREE_JESA_OCP = 'ENTREE_JESA_OCP',
  STOCK_FAIBLE = 'STOCK_FAIBLE',
  RUPTURE_STOCK = 'RUPTURE_STOCK',
  VALORISATION = 'VALORISATION',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'responsable_bdm' })
  destinataire_role: string;

  @Column({ type: 'uuid', nullable: true })
  article_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  article_reference: string | null;

  @Column({ type: 'uuid', nullable: true })
  mouvement_id: string | null;

  @Column({ type: 'boolean', default: false })
  lu: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
