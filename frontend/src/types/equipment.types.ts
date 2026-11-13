import type { Article } from './article.types';

export type EquipmentStatus =
  | 'en_service'
  | 'en_maintenance'
  | 'a_l_arret'
  | 'archive';

export type EquipmentCriticality = 'haute' | 'moyenne' | 'basse';

export type Equipment = {
  id: string;
  code_equipement: string;
  nom: string;
  description?: string | null;
  localisation?: string | null;
  zone?: string | null;
  ligne?: string | null;
  statut: EquipmentStatus;
  criticite: EquipmentCriticality;
  responsable_technique?: string | null;
  parent_id?: string | null;
  parent?: Equipment | null;
  children?: Equipment[];
  bom_items?: BomItem[];
  createdAt: string;
  updatedAt: string;
};

export type BomItem = {
  id: string;
  equipment_id: string;
  article_id: string;
  article?: Article;
  quantite_installee: number;
  unite?: string;
  position?: string | null;
  criticite: string;
  commentaire?: string | null;
  article_principal_ou_alternatif: string;
  frequence_remplacement?: string | null;
  createdAt: string;
};

export type BomDetailedItem = {
  id: string;
  equipment_id: string;
  article_id: string;
  article: Article;
  quantite_installee: number;
  unite: string;
  position: string | null;
  criticite: string;
  commentaire: string | null;
  article_principal_ou_alternatif: string;
  frequence_remplacement: string | null;
  stock_disponible_total: number;
  stock_par_provenance: Record<string, number>;
  ecart_besoin_stock: number;
  statut_disponibilite: 'DISPONIBLE' | 'PARTIEL' | 'RUPTURE';
  valeur_disponible_mad: number;
};

export type CreateEquipmentData = {
  code_equipement: string;
  nom: string;
  description?: string;
  localisation?: string;
  zone?: string;
  ligne?: string;
  statut?: EquipmentStatus;
  criticite?: EquipmentCriticality;
  responsable_technique?: string;
  parent_id?: string;
};

export type CreateBomItemData = {
  equipment_id: string;
  article_id: string;
  quantite_installee: number;
  unite?: string;
  position?: string;
  criticite?: string;
  commentaire?: string;
  article_principal_ou_alternatif?: string;
  frequence_remplacement?: string;
};
