import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Stock,
  StockProvenance,
  PROVENANCE_PRIORITY,
} from './entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from './entities/stock-movement.entity';
import {
  Notification,
  NotificationType,
} from './entities/notification.entity';
import {
  Article,
  ArticleStatut,
} from '../articles/entities/article.entity';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { FindStockQueryDto } from './dto/find-stock-query.dto';

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
  derniere_entree: Date | null;
  derniere_sortie: Date | null;
};

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  /**
   * Section 6.3: Structure du stock par article et par provenance
   */
  async getArticlesStockSummary(
    query: FindStockQueryDto = {},
  ): Promise<ArticleStockSummary[]> {
    // 1. Load articles with optional filtering
    const articlesQuery = this.articleRepository.createQueryBuilder('article');

    if (query.type) {
      articlesQuery.andWhere('article.type = :type', { type: query.type });
    }

    if (query.search) {
      articlesQuery.andWhere(
        '(article.description ILIKE :search OR article.reference ILIKE :search OR article.code_sap_oracle ILIKE :search OR article.marque ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const articles = await articlesQuery.getMany();
    if (articles.length === 0) {
      return [];
    }

    const articleIds = articles.map((a) => a.id);

    // 2. Load all stocks for these articles
    const stocks = await this.stockRepository.find({
      where: { article_id: In(articleIds) },
    });

    const stockMapByArticle: Record<string, Stock[]> = {};
    for (const s of stocks) {
      if (!stockMapByArticle[s.article_id]) {
        stockMapByArticle[s.article_id] = [];
      }
      stockMapByArticle[s.article_id].push(s);
    }

    // 3. Build summary per article
    const standardProvenances = [
      StockProvenance.ANNEXE_D,
      StockProvenance.JESA_AM,
      StockProvenance.OCP_ISE,
      StockProvenance.OCP_CESSION,
    ];

    const results: ArticleStockSummary[] = [];

    for (const article of articles) {
      const articleStocks = stockMapByArticle[article.id] || [];

      let totalDisponible = 0;
      let totalReserve = 0;
      let valeurTotaleMad = 0;
      let latestEntree: Date | null = null;
      let latestSortie: Date | null = null;

      const provenancesMap: Record<string, ProvenanceSummary> = {};

      // Initialize all standard provenances with 0
      for (const prov of standardProvenances) {
        provenancesMap[prov] = {
          quantite_disponible: 0,
          quantite_reservee: 0,
          prix_unitaire: article.prix_unitaire
            ? Number(article.prix_unitaire)
            : null,
          valeur_mad: 0,
        };
      }

      // Populate from existing stock records
      for (const s of articleStocks) {
        const qty = Number(s.quantite_disponible) || 0;
        const res = Number(s.quantite_reservee) || 0;
        const unitPrice =
          s.prix_unitaire != null
            ? Number(s.prix_unitaire)
            : article.prix_unitaire != null
            ? Number(article.prix_unitaire)
            : 0;

        const val = qty * unitPrice;

        provenancesMap[s.provenance] = {
          quantite_disponible: qty,
          quantite_reservee: res,
          prix_unitaire:
            s.prix_unitaire != null ? Number(s.prix_unitaire) : unitPrice || null,
          valeur_mad: val,
        };

        totalDisponible += qty;
        totalReserve += res;
        valeurTotaleMad += val;

        if (s.derniere_entree) {
          const d = new Date(s.derniere_entree);
          if (!latestEntree || d > latestEntree) {
            latestEntree = d;
          }
        }

        if (s.derniere_sortie) {
          const d = new Date(s.derniere_sortie);
          if (!latestSortie || d > latestSortie) {
            latestSortie = d;
          }
        }
      }

      // Check valuation pending status (Section 7.4: JESA/OCP sans prix unitaire)
      const hasJesaOrOcpStock =
        (provenancesMap[StockProvenance.JESA_AM]?.quantite_disponible || 0) > 0 ||
        (provenancesMap[StockProvenance.OCP_ISE]?.quantite_disponible || 0) > 0 ||
        (provenancesMap[StockProvenance.OCP_CESSION]?.quantite_disponible || 0) >
          0;

      const hasNoPrice =
        article.prix_unitaire == null || Number(article.prix_unitaire) === 0;

      const enAttenteValorisation = hasJesaOrOcpStock && hasNoPrice;

      // Status determination
      let statutStock: 'EN_STOCK' | 'STOCK_FAIBLE' | 'RUPTURE' = 'EN_STOCK';
      if (totalDisponible === 0) {
        statutStock = 'RUPTURE';
      } else if (
        article.seuil_min != null &&
        totalDisponible <= article.seuil_min
      ) {
        statutStock = 'STOCK_FAIBLE';
      }

      results.push({
        article,
        stock_total: totalDisponible,
        stock_reserve_total: totalReserve,
        valeur_totale_mad: Number(valeurTotaleMad.toFixed(2)),
        provenances: provenancesMap,
        statut_stock: statutStock,
        en_attente_valorisation: enAttenteValorisation,
        derniere_entree: latestEntree,
        derniere_sortie: latestSortie,
      });
    }

    // Filter by query status if provided
    if (query.statut) {
      if (query.statut === 'EN_ATTENTE_VALORISATION') {
        return results.filter((r) => r.en_attente_valorisation);
      }
      return results.filter((r) => r.statut_stock === query.statut);
    }

    return results;
  }

  /**
   * Section 9.3 & 9.5: Simulation / Calcul du déstockage prioritaire et contrôle de l'OT
   */
  async previewExit(article_id: string, quantite: number) {
    const article = await this.articleRepository.findOneBy({ id: article_id });
    if (!article) {
      throw new NotFoundException(`Article with ID ${article_id} not found.`);
    }

    const stocks = await this.stockRepository.find({
      where: { article_id },
    });

    const stockMap: Record<string, number> = {};
    let totalAvailable = 0;
    for (const s of stocks) {
      const q = Number(s.quantite_disponible) || 0;
      stockMap[s.provenance] = q;
      totalAvailable += q;
    }

    let remaining = quantite;
    let usedOCP = false;
    const breakdown: {
      provenance: string;
      available: number;
      to_deduct: number;
    }[] = [];

    // Order: 1. Annexe D -> 2. JESA AM -> 3. OCP ISE -> 4. OCP Cession -> 5. Autre
    for (const prov of PROVENANCE_PRIORITY) {
      const available = stockMap[prov] || 0;
      const take = Math.min(available, remaining);

      breakdown.push({
        provenance: prov,
        available,
        to_deduct: take,
      });

      if (
        take > 0 &&
        (prov === StockProvenance.OCP_ISE ||
          prov === StockProvenance.OCP_CESSION)
      ) {
        usedOCP = true;
      }

      remaining -= take;
    }

    const canFulfill = totalAvailable >= quantite;
    const otWarningMessage = usedOCP
      ? "Cette sortie utilise une quantité provenant de l'OCP. Le numéro d'OT est obligatoire pour valider la sortie."
      : null;

    return {
      article,
      can_fulfill: canFulfill,
      requested_quantity: quantite,
      total_available: totalAvailable,
      breakdown,
      requires_ot: usedOCP,
      ot_warning_message: otWarningMessage,
    };
  }

  /**
   * Section 7: Processus d'entrée en stock
   */
  async recordEntry(dto: CreateStockEntryDto, user: any) {
    const article = await this.articleRepository.findOneBy({
      id: dto.article_id,
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${dto.article_id} not found.`);
    }

    if (article.statut === ArticleStatut.ARCHIVE) {
      throw new BadRequestException(
        "Impossible d'enregistrer une entrée pour un article archivé.",
      );
    }

    // 1. Find or create stock for this (article_id, provenance)
    let stock = await this.stockRepository.findOne({
      where: {
        article_id: dto.article_id,
        provenance: dto.provenance,
      },
    });

    if (!stock) {
      stock = this.stockRepository.create({
        article_id: dto.article_id,
        provenance: dto.provenance,
        quantite_disponible: 0,
        quantite_reservee: 0,
        prix_unitaire: dto.prix_unitaire || article.prix_unitaire || null,
      });
    }

    stock.quantite_disponible =
      Number(stock.quantite_disponible) + Number(dto.quantite);
    stock.derniere_entree = new Date();

    if (dto.prix_unitaire != null) {
      stock.prix_unitaire = dto.prix_unitaire;
      if (article.prix_unitaire == null) {
        article.prix_unitaire = dto.prix_unitaire;
        await this.articleRepository.save(article);
      }
    }

    await this.stockRepository.save(stock);

    // 2. Create Stock Movement (Section 7.4)
    const movement = this.movementRepository.create({
      type: MovementType.ENTREE,
      article_id: article.id,
      quantite: dto.quantite,
      provenance: dto.provenance,
      details_provenances: { [dto.provenance]: dto.quantite },
      motif: dto.motif,
      reference_document: dto.reference_document,
      user_id: user?.id || null,
      user_name: user?.name || user?.email || 'Magasinier',
      commentaire: dto.commentaire,
    });
    await this.movementRepository.save(movement);

    // 3. Section 7.4 & 7.5: Notification au Responsable BDM pour JESA AM / OCP
    const isJesaOrOcp =
      dto.provenance === StockProvenance.JESA_AM ||
      dto.provenance === StockProvenance.OCP_ISE ||
      dto.provenance === StockProvenance.OCP_CESSION;

    if (isJesaOrOcp) {
      // Mark article as en_attente_prix if no price exists
      if (article.prix_unitaire == null || Number(article.prix_unitaire) === 0) {
        article.statut = ArticleStatut.EN_ATTENTE_PRIX;
        await this.articleRepository.save(article);
      }

      const notif = this.notificationRepository.create({
        type: NotificationType.ENTREE_JESA_OCP,
        titre: `Nouvelle entrée à valoriser (${dto.provenance})`,
        message: `Entrée de ${dto.quantite} ${article.unite} pour l'article ${article.reference} (${article.description}) en provenance de ${dto.provenance}. Le prix unitaire doit être renseigné.`,
        destinataire_role: 'responsable_bdm',
        article_id: article.id,
        article_reference: article.reference,
        mouvement_id: movement.id,
      });
      await this.notificationRepository.save(notif);
    }

    return {
      message: 'Entrée en stock enregistrée avec succès.',
      stock,
      movement,
    };
  }

  /**
   * Section 9: Processus de sortie d'article avec déstockage prioritaire et contrôle N° OT
   */
  async recordExit(dto: CreateStockExitDto, user: any) {
    const article = await this.articleRepository.findOneBy({
      id: dto.article_id,
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${dto.article_id} not found.`);
    }

    if (
      article.statut === ArticleStatut.ARCHIVE ||
      article.statut === ArticleStatut.BLOQUE
    ) {
      throw new BadRequestException(
        `Impossible d'enregistrer une sortie pour un article ${article.statut}.`,
      );
    }

    // 1. Calculate Priority Breakdown
    const preview = await this.previewExit(dto.article_id, dto.quantite);

    if (!preview.can_fulfill) {
      throw new BadRequestException(
        `Stock disponible insuffisant. Quantité totale disponible: ${preview.total_available}, demandée: ${dto.quantite}.`,
      );
    }

    // 2. Section 9.5: Obligation du numéro d'OT pour provenance OCP
    if (preview.requires_ot && (!dto.numero_ot || !dto.numero_ot.trim())) {
      throw new BadRequestException(
        "Cette sortie utilise une quantité provenant de l'OCP. Le numéro d'OT est obligatoire pour valider la sortie.",
      );
    }

    // 3. Apply deductions to stocks
    const deductionMap: Record<string, number> = {};
    for (const item of preview.breakdown) {
      if (item.to_deduct > 0) {
        const stockRow = await this.stockRepository.findOne({
          where: {
            article_id: dto.article_id,
            provenance: item.provenance,
          },
        });

        if (stockRow) {
          stockRow.quantite_disponible =
            Number(stockRow.quantite_disponible) - item.to_deduct;
          stockRow.derniere_sortie = new Date();
          await this.stockRepository.save(stockRow);
          deductionMap[item.provenance] = item.to_deduct;
        }
      }
    }

    // 4. Save Movement (Section 9.6 & 14)
    const movement = this.movementRepository.create({
      type: MovementType.SORTIE,
      article_id: article.id,
      quantite: dto.quantite,
      provenance: Object.entries(deductionMap)
        .map(([prov, q]) => `${prov} (${q})`)
        .join(', '),
      details_provenances: deductionMap,
      numero_ot: dto.numero_ot || null,
      demandeur: dto.demandeur || null,
      motif: dto.motif,
      equipement: dto.equipement || null,
      user_id: user?.id || null,
      user_name: user?.name || user?.email || 'Magasinier',
      commentaire: dto.commentaire,
    });
    await this.movementRepository.save(movement);

    // 5. Check Low Stock or Out of Stock Alerts
    const newTotal = preview.total_available - dto.quantite;
    if (newTotal === 0) {
      const notif = this.notificationRepository.create({
        type: NotificationType.RUPTURE_STOCK,
        titre: `Rupture de stock : ${article.reference}`,
        message: `L'article ${article.reference} (${article.description}) est désormais en rupture de stock.`,
        destinataire_role: 'magasinier',
        article_id: article.id,
        article_reference: article.reference,
        mouvement_id: movement.id,
      });
      await this.notificationRepository.save(notif);
    } else if (article.seuil_min != null && newTotal <= article.seuil_min) {
      const notif = this.notificationRepository.create({
        type: NotificationType.STOCK_FAIBLE,
        titre: `Alerte stock faible : ${article.reference}`,
        message: `L'article ${article.reference} (${article.description}) est à ${newTotal} unités, sous le seuil minimum de ${article.seuil_min}.`,
        destinataire_role: 'magasinier',
        article_id: article.id,
        article_reference: article.reference,
        mouvement_id: movement.id,
      });
      await this.notificationRepository.save(notif);
    }

    return {
      message: 'Sortie de stock enregistrée avec succès.',
      deductions: deductionMap,
      new_total_stock: newTotal,
      movement,
    };
  }

  /**
   * Section 14: Historique des mouvements de stock
   */
  async getMovements(article_id?: string, limit = 50) {
    const qb = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.article', 'article')
      .orderBy('movement.createdAt', 'DESC')
      .take(limit);

    if (article_id) {
      qb.andWhere('movement.article_id = :article_id', { article_id });
    }

    return qb.getMany();
  }

  /**
   * Section 13: Notifications métier
   */
  async getNotifications(role?: string) {
    const qb = this.notificationRepository
      .createQueryBuilder('notif')
      .orderBy('notif.createdAt', 'DESC')
      .take(40);

    if (role && role !== 'admin') {
      qb.andWhere(
        '(notif.destinataire_role = :role OR notif.destinataire_role = :all)',
        {
          role,
          all: 'all',
        },
      );
    }

    return qb.getMany();
  }

  async markNotificationAsRead(id: string) {
    await this.notificationRepository.update({ id }, { lu: true });
    return { success: true };
  }

  /**
   * Section 12: KPI globaux du stock
   */
  async getStockKpi() {
    const allSummary = await this.getArticlesStockSummary();

    let totalArticles = allSummary.length;
    let totalItems = 0;
    let totalValuationMad = 0;
    let countRupture = 0;
    let countFaible = 0;
    let countEnAttenteValorisation = 0;

    const valueByProvenance: Record<string, number> = {
      [StockProvenance.ANNEXE_D]: 0,
      [StockProvenance.JESA_AM]: 0,
      [StockProvenance.OCP_ISE]: 0,
      [StockProvenance.OCP_CESSION]: 0,
    };

    const quantityByProvenance: Record<string, number> = {
      [StockProvenance.ANNEXE_D]: 0,
      [StockProvenance.JESA_AM]: 0,
      [StockProvenance.OCP_ISE]: 0,
      [StockProvenance.OCP_CESSION]: 0,
    };

    for (const item of allSummary) {
      totalItems += item.stock_total;
      totalValuationMad += item.valeur_totale_mad;

      if (item.statut_stock === 'RUPTURE') countRupture++;
      if (item.statut_stock === 'STOCK_FAIBLE') countFaible++;
      if (item.en_attente_valorisation) countEnAttenteValorisation++;

      for (const [prov, data] of Object.entries(item.provenances)) {
        if (valueByProvenance[prov] !== undefined) {
          valueByProvenance[prov] += data.valeur_mad;
          quantityByProvenance[prov] += data.quantite_disponible;
        }
      }
    }

    return {
      total_articles: totalArticles,
      total_stock_items: totalItems,
      valeur_totale_stock_mad: Number(totalValuationMad.toFixed(2)),
      count_rupture: countRupture,
      count_faible: countFaible,
      count_en_attente_valorisation: countEnAttenteValorisation,
      valeur_par_provenance: valueByProvenance,
      quantite_par_provenance: quantityByProvenance,
    };
  }
}
