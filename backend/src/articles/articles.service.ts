import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Article, ArticleStatut } from './entities/article.entity';
import { PriceHistory } from './entities/price-history.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles-query.dto';
import { CheckDuplicatesDto } from './dto/check-duplicate.dto';
import { UpdatePriceDto } from './dto/update-price.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  create(createArticleDto: CreateArticleDto): Promise<Article> {
    const article = this.articlesRepository.create(createArticleDto);
    return this.articlesRepository.save(article);
  }

  async checkDuplicates(dto: CheckDuplicatesDto): Promise<Article[]> {
    const conditions: any[] = [];

    const ref = dto.reference?.trim();
    if (ref && ref.length > 0) {
      conditions.push({ reference: ref });
    }

    const sap = dto.code_sap_oracle?.trim();
    if (sap && sap.length > 0) {
      conditions.push({ code_sap_oracle: sap });
    }

    const desc = dto.description?.trim();
    if (desc && desc.length >= 3) {
      conditions.push({ description: ILike(`%${desc}%`) });
    }

    if (conditions.length === 0) {
      return [];
    }

    return this.articlesRepository.find({ where: conditions });
  }

  findAll(query: FindArticlesQueryDto): Promise<Article[]> {
    const qb = this.articlesRepository.createQueryBuilder('article');

    if (query.type) {
      qb.andWhere('article.type = :type', { type: query.type });
    }

    if (query.statut) {
      qb.andWhere('article.statut = :statut', { statut: query.statut });
    }

    if (query.famille) {
      qb.andWhere('article.famille = :famille', { famille: query.famille });
    }

    if (query.search) {
      qb.andWhere(
        '(article.description ILIKE :search OR article.reference ILIKE :search OR article.code_sap_oracle ILIKE :search OR article.marque ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articlesRepository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, updateArticleDto);
    return this.articlesRepository.save(article);
  }

  async archive(id: string): Promise<Article> {
    const article = await this.findOne(id);
    article.statut = ArticleStatut.ARCHIVE;
    return this.articlesRepository.save(article);
  }

  /**
   * Section 8 & 8.4: Renseignement et valorisation du prix avec historisation obligatoire
   */
  async updatePrice(
    id: string,
    dto: UpdatePriceDto,
    user: any,
  ): Promise<{ article: Article; priceHistory: PriceHistory }> {
    const article = await this.findOne(id);

    const oldPrice = article.prix_unitaire != null ? Number(article.prix_unitaire) : null;
    const rate = dto.taux_conversion != null ? Number(dto.taux_conversion) : 1;
    const priceMad = Number((Number(dto.prix_unitaire) * rate).toFixed(2));

    // Save Price History record (Section 8.4)
    const history = this.priceHistoryRepository.create({
      article_id: article.id,
      ancien_prix: oldPrice,
      nouveau_prix: Number(dto.prix_unitaire),
      devise: dto.devise || article.devise || 'MAD',
      taux_conversion: rate,
      prix_unitaire_mad: priceMad,
      source_prix: dto.source_prix || null,
      justification: dto.justification || null,
      user_id: user?.id || null,
      user_name: user?.name || user?.email || 'Responsable BDM',
    });
    const savedHistory = await this.priceHistoryRepository.save(history);

    // Update article price and activate if was pending price
    article.prix_unitaire = priceMad;
    if (dto.devise) {
      article.devise = dto.devise;
    }
    if (article.statut === ArticleStatut.EN_ATTENTE_PRIX) {
      article.statut = ArticleStatut.ACTIF;
    }

    const updatedArticle = await this.articlesRepository.save(article);

    return {
      article: updatedArticle,
      priceHistory: savedHistory,
    };
  }

  /**
   * Section 8.4: Consulter l'historique des prix d'un article
   */
  async getPriceHistory(articleId: string): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.find({
      where: { article_id: articleId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Section 8.4: Articles en attente de valorisation
   */
  async getPendingValuation(): Promise<Article[]> {
    return this.articlesRepository.find({
      where: [{ statut: ArticleStatut.EN_ATTENTE_PRIX }],
      order: { createdAt: 'DESC' },
    });
  }
}
