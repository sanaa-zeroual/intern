import type { Article } from './article.types';

export type StockProvenance =
  | 'Annexe D'
  | 'JESA AM'
  | 'OCP — ISE'
  | 'OCP — Cession'
  | 'Autre';

export type ProvenanceSummary = {
  quantite_disponible: number;
  quantite_reservee: number;
  prix_unitaire: number | null;
  valeur_mad: number;
};

export type ArticleStockSummary = {
  article: Article;
  stock_total: number;
  stock_reserve_total: number;
  valeur_totale_mad: number;
  provenances: Record<string, ProvenanceSummary>;
  statut_stock: 'EN_STOCK' | 'STOCK_FAIBLE' | 'RUPTURE';
  en_attente_valorisation: boolean;
  derniere_entree: string | null;
  derniere_sortie: string | null;
};

export type StockMovement = {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  article_id: string;
  article?: Article;
  quantite: number;
  provenance: string;
  details_provenances?: Record<string, number> | null;
  numero_ot?: string | null;
  demandeur?: string | null;
  motif: string;
  reference_document?: string | null;
  equipement?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  commentaire?: string | null;
  createdAt: string;
};

export type StockKpi = {
  total_articles: number;
  total_stock_items: number;
  valeur_totale_stock_mad: number;
  count_rupture: number;
  count_faible: number;
  count_en_attente_valorisation: number;
  valeur_par_provenance: Record<string, number>;
  quantite_par_provenance: Record<string, number>;
};

export type PreviewExitBreakdown = {
  provenance: string;
  available: number;
  to_deduct: number;
};

export type PreviewExitResponse = {
  article: Article;
  can_fulfill: boolean;
  requested_quantity: number;
  total_available: number;
  breakdown: PreviewExitBreakdown[];
  requires_ot: boolean;
  ot_warning_message: string | null;
};

export type CreateStockEntryData = {
  article_id: string;
  quantite: number;
  provenance: string;
  motif: string;
  reference_document?: string;
  prix_unitaire?: number;
  commentaire?: string;
};

export type CreateStockExitData = {
  article_id: string;
  quantite: number;
  motif: string;
  demandeur?: string;
  numero_ot?: string;
  equipement?: string;
  commentaire?: string;
};

export type StockNotification = {
  id: string;
  type: string;
  titre: string;
  message: string;
  destinataire_role: string;
  article_id?: string;
  article_reference?: string;
  lu: boolean;
  createdAt: string;
};
