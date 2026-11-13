import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuClipboardList,
  LuPackage,
  LuCircleDollarSign,
  LuTriangleAlert,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuRefreshCw,
} from "react-icons/lu";
import { getStockKpi, getStockMovements } from "../../services/stock.service";
import type { StockKpi, StockMovement } from "../../types/stock.types";

export default function Dashboard() {
  const [kpi, setKpi] = useState<StockKpi | null>(null);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");
      const [kpiData, movementsData] = await Promise.all([
        getStockKpi(),
        getStockMovements(),
      ]);
      setKpi(kpiData);
      setRecentMovements((movementsData || []).slice(0, 7));
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la récupération des données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tableau de Bord
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Plateforme de pilotage du stock PDR, consommables & équipements MC01.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
        >
          <LuRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Main KPI Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Articles */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Articles Référencés
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading ? "..." : kpi?.total_articles ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PDR, bandes, lubrifiants
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <LuClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* Total Stock Available */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Unités en Stock
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading ? "..." : kpi?.total_stock_items ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Physiquement disponibles
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <LuPackage size={22} />
            </div>
          </div>
        </div>

        {/* Total Stock Valuation in MAD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Valorisation Globale
              </p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                {loading
                  ? "..."
                  : (kpi?.valeur_totale_stock_mad ?? 0).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                MAD (Dirhams marocains)
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <LuCircleDollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Critical Alerts (Ruptures & Low Stock) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Articles en Alerte
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600">
                  {loading ? "..." : kpi?.count_rupture ?? 0}
                </span>
                <span className="text-xs font-semibold text-rose-500">
                  rupture(s)
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-600 font-medium">
                {loading ? "..." : kpi?.count_faible ?? 0} sous seuil minimum
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <LuTriangleAlert size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Stock by Provenance - Section 6.3 Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Répartition du Stock par Provenance (Section 6.3)
            </h2>
            <p className="text-xs text-slate-500">
              Suivi des quantités physiques et valorisation financière par source d'approvisionnement.
            </p>
          </div>
          <Link
            to="/stock"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Consulter le stock détaillé &rarr;
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Annexe D",
              badge: "Priorité 1",
              color: "border-blue-200 bg-blue-50/40 text-blue-800",
              qty: kpi?.quantite_par_provenance?.["Annexe D"] ?? 0,
              val: kpi?.valeur_par_provenance?.["Annexe D"] ?? 0,
            },
            {
              name: "JESA AM",
              badge: "Priorité 2",
              color: "border-purple-200 bg-purple-50/40 text-purple-800",
              qty: kpi?.quantite_par_provenance?.["JESA AM"] ?? 0,
              val: kpi?.valeur_par_provenance?.["JESA AM"] ?? 0,
            },
            {
              name: "OCP — ISE",
              badge: "Priorité 3 (OT)",
              color: "border-amber-200 bg-amber-50/40 text-amber-800",
              qty: kpi?.quantite_par_provenance?.["OCP — ISE"] ?? 0,
              val: kpi?.valeur_par_provenance?.["OCP — ISE"] ?? 0,
            },
            {
              name: "OCP — Cession",
              badge: "Priorité 4 (OT)",
              color: "border-teal-200 bg-teal-50/40 text-teal-800",
              qty: kpi?.quantite_par_provenance?.["OCP — Cession"] ?? 0,
              val: kpi?.valeur_par_provenance?.["OCP — Cession"] ?? 0,
            },
          ].map((item) => (
            <div
              key={item.name}
              className={`rounded-xl border p-4 ${item.color} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">
                  {item.name}
                </span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/50">
                  {item.badge}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-slate-900">
                  {loading ? "..." : item.qty}{" "}
                  <span className="text-xs font-normal text-slate-500">unités</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {loading
                    ? "..."
                    : item.val.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                  MAD
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Pending Valuation Warning & Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Valuation Attention Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <LuCircleDollarSign size={22} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Valorisation en Attente (Section 8)
                </h3>
                <p className="text-xs text-slate-500">
                  Articles JESA / OCP sans prix unitaire
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600">
                  {loading ? "..." : kpi?.count_en_attente_valorisation ?? 0}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  articles nécessitant validation de prix
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                Les entrées en provenance de JESA AM ou de l'OCP doivent avoir un
                prix unitaire validé par le Responsable BDM pour assurer la
                fiabilité du bilan financier.
              </p>
            </div>
          </div>

          <Link
            to="/stock?filter=EN_ATTENTE_VALORISATION"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            Voir les articles à valoriser &rarr;
          </Link>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Mouvements Récents de Magasin (Section 14)
              </h3>
              <p className="text-xs text-slate-500">
                Dernières entrées et sorties tracées
              </p>
            </div>

            <Link
              to="/stock"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Historique complet
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentMovements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aucun mouvement enregistré pour le moment.
              </div>
            ) : (
              recentMovements.map((mvt) => (
                <div
                  key={mvt.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        mvt.type === "ENTREE"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {mvt.type === "ENTREE" ? (
                        <LuArrowDownLeft size={16} />
                      ) : (
                        <LuArrowUpRight size={16} />
                      )}
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {mvt.article?.reference || "Article"} — {mvt.article?.description || mvt.motif}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {mvt.provenance} · Par {mvt.user_name || "Utilisateur"}
                        {mvt.numero_ot ? ` · OT: ${mvt.numero_ot}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        mvt.type === "ENTREE"
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}
                    >
                      {mvt.type === "ENTREE" ? "+" : "-"}
                      {mvt.quantite}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(mvt.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
