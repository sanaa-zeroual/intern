import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BomItem } from './bom-item.entity';

export enum EquipmentStatus {
  EN_SERVICE = 'en_service',
  EN_MAINTENANCE = 'en_maintenance',
  A_L_ARRET = 'a_l_arret',
  ARCHIVE = 'archive',
}

export enum EquipmentCriticality {
  HAUTE = 'haute',
  MOYENNE = 'moyenne',
  BASSE = 'basse',
}

@Entity('equipements')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code_equipement: string;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  localisation: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  ligne: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.EN_SERVICE,
  })
  statut: EquipmentStatus;

  @Column({
    type: 'enum',
    enum: EquipmentCriticality,
    default: EquipmentCriticality.MOYENNE,
  })
  criticite: EquipmentCriticality;

  @Column({ nullable: true })
  responsable_technique: string;

  // Self-referencing relationship for hierarchy: Installation -> Équipement -> Sous-équipement -> Organe
  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @ManyToOne(() => Equipment, (equipment) => equipment.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Equipment | null;

  @OneToMany(() => Equipment, (equipment) => equipment.parent)
  children: Equipment[];

  @OneToMany(() => BomItem, (bomItem) => bomItem.equipment)
  bom_items: BomItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
