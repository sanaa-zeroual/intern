import { useState, useEffect } from "react";
import {
  LuPlus,
  LuMinus,
  LuSearch,
  LuRefreshCw,
  LuBoxes,
  LuCircleDollarSign,
  LuTriangleAlert,
  LuEye,
  LuHistory,
  LuClock,
  LuDownload,
} from "react-icons/lu";

import { useAuth } from "../../context/AuthContext";
import {
  getStockSummaries,
  getStockKpi,
  getStockMovements,
} from "../../services/stock.service";
import { getArticles } from "../../services/articles.service";
import { exportToCsv } from "../../utils/exportToCsv";
import type {
  ArticleStockSummary,
  StockKpi,
  StockMovement,
} from "../../types/stock.types";
import type { Article } from "../../types/article.types";

import StockEntryModal from "./components/StockEntryModal";
import StockExitModal from "./components/StockExitModal";
import StockDetailsModal from "./components/StockDetailsModal";
import StockMovementsList from "./components/StockMovementsList";

export default function Stock() {
  const { user } = useAuth();
  const role = user?.role;

  /*
    Rôles CDC (Section 3 & 15.2):
    - Magasinier : consulter stock par provenance, entrée, sortie, historique
    - Viewer : consultation uniquement
    - BDM : consultation détaillée, suivi des mouvements et valorisation
    - Responsable BDM : consultation, entrée, sortie, validation prix JESA/OCP
  */
  const canManageStockMovements =
    role === "magasinier" || role === "responsable_bdm";

  // Active Tab: 'stock' | 'movements'
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");

  // State
  const [summaries, setSummaries] = useState<ArticleStockSummary[]>([]);
  const [kpi, setKpi] = useState<StockKpi | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");

  // Modals state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedSummary, setSelectedSummary] =
    useState<ArticleStockSummary | null>(null);

  // Load stock data & KPI
  async function loadStockData() {
    try {
      setLoading(true);
      setError("");
      const [sumData, kpiData, artData] = await Promise.all([
        getStockSummaries(),
        getStockKpi(),
        getArticles(),
      ]);
      setSummaries(sumData);
      setKpi(kpiData);
      setArticles(artData);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger les données du stock.");
    } finally {
      setLoading(false);
    }
  }

  // Load movements history
  async function loadMovements() {
    try {
      setLoadingMovements(true);
      const data = await getStockMovements();
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  }

  useEffect(() => {
    loadStockData();
  }, []);

  useEffect(() => {
    if (activeTab === "movements") {
      loadMovements();
    }
  }, [activeTab]);

  function handleActionSuccess(msg: string) {
    setSuccessMessage(msg);
    loadStockData();
    if (activeTab === "movements") {
      loadMovements();
    }
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  function openEntryForArticle(article: Article) {
    setSelectedArticle(article);
    setShowEntryModal(true);
  }

  function openExitForArticle(article: Article) {
    setSelectedArticle(article);
    setShowExitModal(true);
  }

  function openDetails(summary: ArticleStockSummary) {
    setSelectedSummary(summary);
    setShowDetailsModal(true);
  }

  // Filtered summaries
  const filteredSummaries = summaries.filter((item) => {
    const s = search.toLowerCase().trim();
    const art = item.article;

    const matchesSearch =
      !s ||
      art.description?.toLowerCase().includes(s) ||
      art.reference?.toLowerCase().includes(s) ||
      art.marque?.toLowerCase().includes(s) ||
      art.code_sap_oracle?.toLowerCase().includes(s);

    let matchesStatut = true;
    if (filterStatut === "EN_STOCK") matchesStatut = item.statut_stock === "EN_STOCK";
    if (filterStatut === "STOCK_FAIBLE") matchesStatut = item.statut_stock === "STOCK_FAIBLE";
    if (filterStatut === "RUPTURE") matchesStatut = item.statut_stock === "RUPTURE";
    if (filterStatut === "EN_ATTENTE_VALORISATION") matchesStatut = item.en_attente_valorisation;

    return matchesSearch && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs animate-in fade-in">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <LuTriangleAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Stock par Provenance
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              MC01 - Maintenance
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Suivi détaillé par provenance (Annexe D, JESA AM, OCP), valorisation en MAD et déstockage prioritaire.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeTab === "stock") {
                exportToCsv(
                  "Rapport_Stock_Global",
                  filteredSummaries.map((s) => ({
                    Reference: s.article.reference,
                    Description: s.article.description,
                    Type: s.article.type,
                    Stock_Total: s.stock_total,
                    Annexe_D: s.provenances["Annexe D"]?.quantite_disponible || 0,
                    JESA_AM: s.provenances["JESA AM"]?.quantite_disponible || 0,
                    OCP_ISE: s.provenances["OCP — ISE"]?.quantite_disponible || 0,
                    OCP_Cession:
                      s.provenances["OCP — Cession"]?.quantite_disponible || 0,
                    Prix_Unitaire_MAD: s.article.prix_unitaire || "",
                    Valeur_Totale_MAD: s.valeur_totale_mad,
                    Statut_Stock: s.statut_stock,
                    En_Attente_Valorisation: s.en_attente_valorisation
                      ? "OUI"
                      : "NON",
                  }))
                );
              } else {
                exportToCsv(
                  "Rapport_Mouvements_Stock",
                  movements.map((m) => ({
                    Date: m.createdAt,
                    Type: m.type,
                    Article: m.article?.reference || m.article_id,
                    Quantite: m.quantite,
                    Provenance: m.provenance,
                    Numero_OT: m.numero_ot || "",
                    Demandeur: m.demandeur || "",
                    Motif: m.motif,
                    Utilisateur: m.user_name || "",
                  }))
                );
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Exporter en fichier Excel / CSV"
          >
            <LuDownload size={15} />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => loadStockData()}
            title="Rafraîchir les données"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition"
          >
            <LuRefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          {canManageStockMovements && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(null);
                  setShowEntryModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-green-700"
              >
                <LuPlus size={18} />
                Entrée en Stock
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(null);
                  setShowExitModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 shadow-xs"
              >
                <LuMinus size={18} />
                Sortie de Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards (Section 12.3) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Stock Quantity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Quantité Totale
            </span>
            <div className="rounded-lg bg-green-50 p-2 text-green-700">
              <LuBoxes size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {kpi?.total_stock_items ?? "0"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sur {kpi?.total_articles ?? 0} références au catalogue
          </p>
        </div>

        {/* Total Valuation in MAD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Valorisation Stock
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <LuCircleDollarSign size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {kpi?.valeur_totale_stock_mad?.toLocaleString("fr-FR") ?? "0"}{" "}
            <span className="text-xs font-semibold">MAD</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Valeur globale en dirhams
          </p>
        </div>

        {/* Low Stock & Out of Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Alertes Stock
            </span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <LuTriangleAlert size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-rose-700">
              {kpi?.count_rupture ?? 0}
            </p>
            <span className="text-xs text-rose-600 font-medium">ruptures</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-bold text-amber-700">
              {kpi?.count_faible ?? 0}
            </span>
            <span className="text-[11px] text-amber-600">faibles</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sous le seuil minimum de sécurité
          </p>
        </div>

        {/* Pending Valuation (JESA / OCP) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              À Valoriser (JESA/OCP)
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <LuClock size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {kpi?.count_en_attente_valorisation ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Articles sans prix validé par BDM
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "stock"
              ? "border-green-600 text-green-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LuBoxes size={17} />
          <span>État du Stock par Provenance</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {summaries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "movements"
              ? "border-green-600 text-green-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LuHistory size={17} />
          <span>Historique des Mouvements (Traçabilité)</span>
        </button>
      </div>

      {/* TAB 1: Stock Table */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <LuSearch
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher par référence, désignation, code SAP, marque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">Tous les statuts de stock</option>
                <option value="EN_STOCK">En stock (Disponible)</option>
                <option value="STOCK_FAIBLE">Stock faible (Sous seuil min)</option>
                <option value="RUPTURE">Rupture de stock (0 unité)</option>
                <option value="EN_ATTENTE_VALORISATION">
                  En attente de valorisation (JESA/OCP)
                </option>
              </select>
            </div>
          </div>

          {/* Main Stock Table as structured in CDC Section 6.3 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-5 py-4">Article</th>
                    <th className="px-4 py-4 text-center">Stock Total</th>
                    <th className="px-4 py-4 text-center bg-blue-50/50 text-blue-900 border-x border-slate-100">
                      Annexe D
                    </th>
                    <th className="px-4 py-4 text-center bg-indigo-50/50 text-indigo-900 border-r border-slate-100">
                      JESA AM
                    </th>
                    <th className="px-4 py-4 text-center bg-emerald-50/50 text-emerald-900 border-r border-slate-100">
                      OCP — ISE
                    </th>
                    <th className="px-4 py-4 text-center bg-purple-50/50 text-purple-900 border-r border-slate-100">
                      OCP — Cession
                    </th>
                    <th className="px-4 py-4 text-right">Valeur Totale</th>
                    <th className="px-4 py-4 text-center">Statut</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.map((item) => {
                    const art = item.article;
                    const annexeD = item.provenances["Annexe D"]?.quantite_disponible ?? 0;
                    const jesa = item.provenances["JESA AM"]?.quantite_disponible ?? 0;
                    const ocpIse = item.provenances["OCP — ISE"]?.quantite_disponible ?? 0;
                    const ocpCession = item.provenances["OCP — Cession"]?.quantite_disponible ?? 0;

                    return (
                      <tr
                        key={art.id}
                        className="transition hover:bg-slate-50/80 group"
                      >
                        {/* Article Info */}
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 group-hover:text-green-700 transition">
                            {art.reference}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {art.description}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                            {art.code_sap_oracle && (
                              <span>SAP: {art.code_sap_oracle}</span>
                            )}
                            {art.famille && <span>• {art.famille}</span>}
                          </div>
                        </td>

                        {/* Stock Total */}
                        <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-sm ${
                              item.stock_total === 0
                                ? "bg-red-50 text-red-700"
                                : item.statut_stock === "STOCK_FAIBLE"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {item.stock_total}
                          </span>
                        </td>

                        {/* Provenance: Annexe D */}
                        <td className="px-4 py-3.5 text-center font-semibold text-slate-800 bg-blue-50/20 border-x border-slate-100">
                          {annexeD > 0 ? (
                            <span className="font-bold text-blue-900">
                              {annexeD}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* Provenance: JESA AM */}
                        <td className="px-4 py-3.5 text-center font-semibold text-slate-800 bg-indigo-50/20 border-r border-slate-100">
                          {jesa > 0 ? (
                            <span className="font-bold text-indigo-900">
                              {jesa}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* Provenance: OCP ISE */}
                        <td className="px-4 py-3.5 text-center font-semibold text-slate-800 bg-emerald-50/20 border-r border-slate-100">
                          {ocpIse > 0 ? (
                            <span className="font-bold text-emerald-900">
                              {ocpIse}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* Provenance: OCP Cession */}
                        <td className="px-4 py-3.5 text-center font-semibold text-slate-800 bg-purple-50/20 border-r border-slate-100">
                          {ocpCession > 0 ? (
                            <span className="font-bold text-purple-900">
                              {ocpCession}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* Total Value MAD */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {item.valeur_totale_mad > 0 ? (
                            <span>
                              {item.valeur_totale_mad.toLocaleString("fr-FR")} MAD
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">
                              0,00 MAD
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {item.statut_stock === "RUPTURE" && (
                            <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                              Rupture
                            </span>
                          )}
                          {item.statut_stock === "STOCK_FAIBLE" && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              Stock Faible
                            </span>
                          )}
                          {item.statut_stock === "EN_STOCK" && (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              En Stock
                            </span>
                          )}

                          {item.en_attente_valorisation && (
                            <div className="mt-1">
                              <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                Prix à valider
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetails(item)}
                              title="Consulter le détail du stock"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                              <LuEye size={16} />
                            </button>

                            {canManageStockMovements && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEntryForArticle(art)}
                                  title="Enregistrer une entrée"
                                  className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition"
                                >
                                  <LuPlus size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openExitForArticle(art)}
                                  disabled={item.stock_total <= 0}
                                  title="Enregistrer une sortie"
                                  className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <LuMinus size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-sm text-slate-400"
                      >
                        {loading
                          ? "Chargement de l'inventaire en cours..."
                          : "Aucun article trouvé dans l'inventaire."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Movements History (CDC Section 14) */}
      {activeTab === "movements" && (
        <StockMovementsList
          movements={movements}
          loading={loadingMovements}
        />
      )}

      {/* Entry Modal */}
      <StockEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        onSuccess={() => handleActionSuccess("Entrée en stock enregistrée avec succès.")}
        articles={articles}
        defaultArticle={selectedArticle}
      />

      {/* Exit Modal with Priority Preview & Mandatory OT control */}
      <StockExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onSuccess={() => handleActionSuccess("Sortie de stock enregistrée avec succès.")}
        articles={articles}
        defaultArticle={selectedArticle}
      />

      {/* Details Modal */}
      <StockDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        summary={selectedSummary}
        canManageMovements={canManageStockMovements}
        onOpenEntry={() => {
          if (selectedSummary) openEntryForArticle(selectedSummary.article);
        }}
        onOpenExit={() => {
          if (selectedSummary) openExitForArticle(selectedSummary.article);
        }}
      />
    </div>
  );
}