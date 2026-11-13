
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from 'typeorm';


export enum ArticleType {
  PDR = 'pdr',
  INTERCHANGEABLE = 'interchangeable',
  BANDE_CONVOYEUR = 'bande_convoyeur',
  LUBRIFIANT_HUILE = 'lubrifiant_huile',
  LUBRIFIANT_GRAISSE = 'lubrifiant_graisse',
  AUTRE = 'autre_consommable'
}

export enum ArticleStatut {
  BROUILLON = 'brouillon',
  ACTIF = 'actif',
  EN_ATTENTE_PRIX = 'en_attente_prix',
  OBSOLETE = 'obsolete',
  BLOQUE = 'bloque',
  ARCHIVE = 'archive'
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({type: 'enum', enum: ArticleType})
  type: ArticleType;

  @Column()
  description: string;

  @Column({unique: true})
  reference: string;

  @Column()
  unite: string;

  @Column({ nullable: true })
  marque: string;

  @Column({ nullable: true })
  fabricant: string;

  @Column({ nullable: true, unique: true })
  code_sap_oracle: string;


  @Column({ nullable: true })
  famille: string;

  @Column({ nullable: true })
  sous_famille: string;


  @Column({ type: 'int', nullable: true })
  seuil_min: number;

  @Column({ type: 'int', nullable: true })
  seuil_max: number;

  @Column({ type: 'int', nullable: true })
  stock_securite: number;

  @Column({ type: 'int', nullable: true })
  delai_approvisionnement: number;


  @Column({ nullable: true })
  criticite: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prix_unitaire: number;

  @Column({ nullable: true })
  devise: string;

  @Column({ nullable: true })
  commentaire: string;
  
  @Column({ nullable: true })
  reference_constructeur: string;

  // Typologie 4.3: Bande convoyeur
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  largeur: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  longueur: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  epaisseur: number;

  @Column({ nullable: true })
  type_bande: string;

  @Column({ type: 'int', nullable: true })
  nb_plis: number;

  @Column({ nullable: true })
  revetement: string;

  // Typologie 4.4: Lubrifiant (huile ou graisse)
  @Column({ nullable: true })
  viscosite: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  conditionnement: string;

  // Typologie 4.2: Interchangeable
  @Column({ nullable: true })
  article_interchangeable_id: string;

  @Column({ nullable: true })
  equivalence: string;

  @Column({type: 'enum', enum: ArticleStatut, default: ArticleStatut.BROUILLON})
  statut: ArticleStatut;

  @CreateDateColumn()
  createdAt: Date;
}