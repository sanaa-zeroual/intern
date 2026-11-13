import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  MAGASINIER = 'magasinier',
  VIEWER = 'viewer',
  BDM = 'bdm',
  RESPONSABLE_BDM = 'responsable_bdm',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;
}