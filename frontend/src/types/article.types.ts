export type Article = {
  id: string;

  type: string;
  description: string;
  reference: string;
  unite: string;

  marque?: string | null;
  fabricant?: string | null;
  code_sap_oracle?: string | null;

  famille?: string | null;
  sous_famille?: string | null;

  seuil_min?: number | null;
  seuil_max?: number | null;
  stock_securite?: number | null;
  delai_approvisionnement?: number | null;

  criticite?: string | null;

  prix_unitaire?: number | string | null;
  devise?: string | null;

  commentaire?: string | null;

  photo_url?: string | null;
  fiche_technique_url?: string | null;
  plan_url?: string | null;

  statut: string;

  reference_constructeur?: string | null;

  // Typologie 4.3: Bande convoyeur
  largeur?: number | null;
  longueur?: number | null;
  epaisseur?: number | null;
  type_bande?: string | null;
  nb_plis?: number | null;
  revetement?: string | null;

  // Typologie 4.4: Lubrifiant
  viscosite?: string | null;
  grade?: string | null;
  conditionnement?: string | null;

  // Typologie 4.2: Interchangeable
  article_interchangeable_id?: string | null;
  equivalence?: string | null;

  createdAt: string;
};

export type ArticleFilters = {
  type?: string;
  statut?: string;
  famille?: string;
  criticite?: string;
  sans_prix?: boolean;
  search?: string;
};

export type CreateArticleData = {
  type: string;
  description: string;
  reference: string;
  unite: string;

  marque?: string;
  fabricant?: string;
  code_sap_oracle?: string;

  famille?: string;
  sous_famille?: string;

  seuil_min?: number;
  seuil_max?: number;

  stock_securite?: number;
  delai_approvisionnement?: number;

  criticite?: string;

  prix_unitaire?: number;
  devise?: string;

  statut?: string;
  commentaire?: string;

  reference_constructeur?: string;

  // Typologie 4.3: Bande convoyeur
  largeur?: number;
  longueur?: number;
  epaisseur?: number;
  type_bande?: string;
  nb_plis?: number;
  revetement?: string;

  // Typologie 4.4: Lubrifiant
  viscosite?: string;
  grade?: string;
  conditionnement?: string;

  // Typologie 4.2: Interchangeable
  article_interchangeable_id?: string;
  equivalence?: string;
};

export type DuplicateConflict = {
  article: Article;
  isExactMatch: boolean;
  reasons: string[];
};


export type PriceHistory = {
  id: string;
  article_id: string;
  ancien_prix: number | null;
  nouveau_prix: number;
  devise: string;
  taux_conversion: number | null;
  prix_unitaire_mad: number;
  source_prix: string | null;
  justification: string | null;
  user_id: string | null;
  user_name: string | null;
  createdAt: string;
};

export type UpdatePriceData = {
  prix_unitaire: number;
  devise?: string;
  taux_conversion?: number;
  source_prix?: string;
  justification?: string;
};
