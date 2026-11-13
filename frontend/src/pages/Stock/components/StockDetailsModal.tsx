import {
  LuX,
  LuLayers,
  LuPlus,
  LuMinus,
  LuBoxes,
} from "react-icons/lu";
import type { ArticleStockSummary } from "../../../types/stock.types";

type StockDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  summary: ArticleStockSummary | null;
  onOpenEntry?: () => void;
  onOpenExit?: () => void;
  canManageMovements: boolean;
};

export default function StockDetailsModal({
  isOpen,
  onClose,
  summary,
  onOpenEntry,
  onOpenExit,
  canManageMovements,
}: StockDetailsModalProps) {
  if (!isOpen || !summary) return null;

  const { article, provenances } = summary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <LuBoxes size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {article.reference}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {article.type}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {article.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Stock Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.stock_total}{" "}
                <span className="text-xs font-normal text-slate-500">
                  {article.unite || "unités"}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Valeur Totale (MAD)</p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {summary.valeur_totale_mad.toLocaleString("fr-FR")}{" "}
                <span className="text-xs font-semibold">MAD</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Dernière Entrée</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {summary.derniere_entree
                  ? new Date(summary.derniere_entree).toLocaleDateString("fr-FR")
                  : "Aucune"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Dernière Sortie</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {summary.derniere_sortie
                  ? new Date(summary.derniere_sortie).toLocaleDateString("fr-FR")
                  : "Aucune"}
              </p>
            </div>
          </div>

          {/* Pending Valuation Banner */}
          {summary.en_attente_valorisation && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <span className="font-bold">En attente de valorisation :</span> Cet
              article dispose de stock provenant de JESA AM ou de l'OCP sans prix
              unitaire défini. La valorisation financière est incomplète tant que le
              Responsable BDM n'a pas validé le prix unitaire.
            </div>
          )}

          {/* Detailed Stock Table per Provenance (CDC Section 6.3) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <LuLayers size={16} />
              Détail du stock par provenance
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Provenance</th>
                    <th className="px-4 py-3 text-right">Disponible</th>
                    <th className="px-4 py-3 text-right">Réservé</th>
                    <th className="px-4 py-3 text-right">Prix Unitaire</th>
                    <th className="px-4 py-3 text-right">Valeur (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(provenances).map(([provName, provData]) => {
                    return (
                      <tr
                        key={provName}
                        className={
                          provData.quantite_disponible > 0
                            ? "bg-white font-medium"
                            : "bg-slate-50/40 text-slate-400"
                        }
                      >
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              provData.quantite_disponible > 0
                                ? "bg-green-500"
                                : "bg-slate-300"
                            }`}
                          />
                          <span className="text-slate-900 font-semibold">
                            {provName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {provData.quantite_disponible}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {provData.quantite_reservee}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {provData.prix_unitaire != null
                            ? `${Number(provData.prix_unitaire).toFixed(2)} MAD`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {provData.valeur_mad.toLocaleString("fr-FR")} MAD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>

          {canManageMovements && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExit?.();
                }}
                disabled={summary.stock_total <= 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-40"
              >
                <LuMinus size={14} />
                Sortie Stock
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEntry?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700 shadow-xs"
              >
                <LuPlus size={14} />
                Entrée Stock
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
