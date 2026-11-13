import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { BomItem } from './entities/bom-item.entity';
import { Article } from '../articles/entities/article.entity';
import { Stock } from '../stock/entities/stock.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CreateBomItemDto } from './dto/create-bom-item.dto';
import { UpdateBomItemDto } from './dto/update-bom-item.dto';

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
  // Stock comparison fields (Section 10.6 & 18.4)
  stock_disponible_total: number;
  stock_par_provenance: Record<string, number>;
  ecart_besoin_stock: number;
  statut_disponibilite: 'DISPONIBLE' | 'PARTIEL' | 'RUPTURE';
  valeur_disponible_mad: number;
};

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(BomItem)
    private readonly bomItemRepo: Repository<BomItem>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  /**
   * Section 10.2: Création d'équipements
   */
  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    const existing = await this.equipmentRepo.findOne({
      where: { code_equipement: dto.code_equipement },
    });
    if (existing) {
      throw new ConflictException(
        `L'équipement avec le code "${dto.code_equipement}" existe déjà.`,
      );
    }

    if (dto.parent_id) {
      const parent = await this.equipmentRepo.findOneBy({ id: dto.parent_id });
      if (!parent) {
        throw new NotFoundException(
          `Équipement parent avec l'ID ${dto.parent_id} introuvable.`,
        );
      }
    }

    const equip = this.equipmentRepo.create(dto);
    return this.equipmentRepo.save(equip);
  }

  async findAll(): Promise<Equipment[]> {
    return this.equipmentRepo.find({
      relations: ['parent', 'children', 'bom_items'],
      order: { code_equipement: 'ASC' },
    });
  }

  /**
   * Section 10.3: Récupérer la hiérarchie arborescente (Installations -> Équipements -> Sous-équipements)
   */
  async getTree(): Promise<Equipment[]> {
    // Fetch roots (equipments with no parent) and recursively load children
    return this.equipmentRepo.find({
      where: { parent_id: IsNull() },
      relations: [
        'children',
        'children.children',
        'children.children.children',
        'bom_items',
        'bom_items.article',
      ],
      order: { code_equipement: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Equipment> {
    const equip = await this.equipmentRepo.findOne({
      where: { id },
      relations: ['parent', 'children', 'bom_items', 'bom_items.article'],
    });
    if (!equip) {
      throw new NotFoundException(`Équipement avec l'ID ${id} introuvable.`);
    }
    return equip;
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const equip = await this.findOne(id);
    if (dto.code_equipement && dto.code_equipement !== equip.code_equipement) {
      const existing = await this.equipmentRepo.findOne({
        where: { code_equipement: dto.code_equipement },
      });
      if (existing) {
        throw new ConflictException(
          `Le code équipement "${dto.code_equipement}" est déjà utilisé.`,
        );
      }
    }

    Object.assign(equip, dto);
    return this.equipmentRepo.save(equip);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const equip = await this.findOne(id);
    await this.equipmentRepo.remove(equip);
    return { success: true };
  }

  /**
   * Section 10.4: Affecter un article à un équipement
   */
  async addBomItem(dto: CreateBomItemDto): Promise<BomItem> {
    const equip = await this.equipmentRepo.findOneBy({ id: dto.equipment_id });
    if (!equip) {
      throw new NotFoundException(`Équipement ${dto.equipment_id} introuvable.`);
    }

    const article = await this.articleRepo.findOneBy({ id: dto.article_id });
    if (!article) {
      throw new NotFoundException(`Article ${dto.article_id} introuvable.`);
    }

    const bomItem = this.bomItemRepo.create(dto);
    return this.bomItemRepo.save(bomItem);
  }

  async updateBomItem(
    id: string,
    dto: UpdateBomItemDto,
  ): Promise<BomItem> {
    const item = await this.bomItemRepo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Élément BOM avec l'ID ${id} introuvable.`);
    }
    Object.assign(item, dto);
    return this.bomItemRepo.save(item);
  }

  async removeBomItem(id: string): Promise<{ success: boolean }> {
    const item = await this.bomItemRepo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Élément BOM avec l'ID ${id} introuvable.`);
    }
    await this.bomItemRepo.remove(item);
    return { success: true };
  }

  /**
   * Section 10.6 & 18.4: Recherche par équipement avec comparaison Quantité installée vs Stock disponible
   */
  async getEquipmentBom(equipmentId: string): Promise<BomDetailedItem[]> {
    const equip = await this.equipmentRepo.findOneBy({ id: equipmentId });
    if (!equip) {
      throw new NotFoundException(`Équipement ${equipmentId} introuvable.`);
    }

    const bomItems = await this.bomItemRepo.find({
      where: { equipment_id: equipmentId },
      relations: ['article'],
      order: { position: 'ASC' },
    });

    if (bomItems.length === 0) {
      return [];
    }

    const articleIds = bomItems.map((b) => b.article_id);
    const stocks = await this.stockRepo.find({
      where: { article_id: In(articleIds) },
    });

    const stockMapByArticle: Record<string, Record<string, number>> = {};
    const totalStockMap: Record<string, number> = {};

    for (const s of stocks) {
      if (!stockMapByArticle[s.article_id]) {
        stockMapByArticle[s.article_id] = {};
        totalStockMap[s.article_id] = 0;
      }
      const qty = Number(s.quantite_disponible) || 0;
      stockMapByArticle[s.article_id][s.provenance] = qty;
      totalStockMap[s.article_id] += qty;
    }

    return bomItems.map((item) => {
      const totalAvailable = totalStockMap[item.article_id] || 0;
      const provMap = stockMapByArticle[item.article_id] || {
        'Annexe D': 0,
        'JESA AM': 0,
        'OCP — ISE': 0,
        'OCP — Cession': 0,
      };

      let status: 'DISPONIBLE' | 'PARTIEL' | 'RUPTURE' = 'DISPONIBLE';
      if (totalAvailable === 0) {
        status = 'RUPTURE';
      } else if (totalAvailable < item.quantite_installee) {
        status = 'PARTIEL';
      }

      const unitPrice = item.article?.prix_unitaire
        ? Number(item.article.prix_unitaire)
        : 0;

      return {
        id: item.id,
        equipment_id: item.equipment_id,
        article_id: item.article_id,
        article: item.article,
        quantite_installee: item.quantite_installee,
        unite: item.unite || item.article?.unite || 'pièce',
        position: item.position,
        criticite: item.criticite,
        commentaire: item.commentaire,
        article_principal_ou_alternatif: item.article_principal_ou_alternatif,
        frequence_remplacement: item.frequence_remplacement,
        stock_disponible_total: totalAvailable,
        stock_par_provenance: provMap,
        ecart_besoin_stock: totalAvailable - item.quantite_installee,
        statut_disponibilite: status,
        valeur_disponible_mad: Number((totalAvailable * unitPrice).toFixed(2)),
      };
    });
  }

  /**
   * Section 10.5: Récupérer tous les équipements auxquels un article est affecté
   */
  async getArticleEquipments(articleId: string) {
    const bomItems = await this.bomItemRepo.find({
      where: { article_id: articleId },
      relations: ['equipment'],
    });

    return bomItems.map((b) => ({
      bom_item_id: b.id,
      equipment: b.equipment,
      quantite_installee: b.quantite_installee,
      position: b.position,
      criticite: b.criticite,
      article_principal_ou_alternatif: b.article_principal_ou_alternatif,
    }));
  }
}
