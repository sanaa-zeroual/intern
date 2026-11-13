import { useState, useEffect } from "react";
import {
  LuX,
  LuCircleDollarSign,
  LuHistory,
  LuTrendingUp,
  LuCheck,
} from "react-icons/lu";
import type { Article, PriceHistory, UpdatePriceData } from "../../../types/article.types";
import {
  updateArticlePrice,
  getPriceHistory,
} from "../../../services/articles.service";

type ValuationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  onPriceUpdated?: (updatedArticle: Article) => void;
};

export default function ValuationModal({
  isOpen,
  onClose,
  article,
  onPriceUpdated,
}: ValuationModalProps) {
  const [prixUnitaire, setPrixUnitaire] = useState<number | "">("");
  const [devise, setDevise] = useState("MAD");
  const [tauxConversion, setTauxConversion] = useState<number>(1);
  const [sourcePrix, setSourcePrix] = useState("");
  const [justification, setJustification] = useState("");

  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (article && isOpen) {
      setPrixUnitaire(
        article.prix_unitaire != null ? Number(article.prix_unitaire) : ""
      );
      setDevise(article.devise || "MAD");
      setTauxConversion(1);
      setSourcePrix("");
      setJustification("");
      setError("");
      setSuccess("");

      // Load past price history (Section 8.4)
      loadHistory(article.id);
    }
  }, [article, isOpen]);

  async function loadHistory(articleId: string) {
    try {
      setLoadingHistory(true);
      const data = await getPriceHistory(articleId);
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load price history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  if (!isOpen || !article) return null;

  // Real-time calculated price in MAD
  const computedPriceMad =
    typeof prixUnitaire === "number"
      ? Number((prixUnitaire * (tauxConversion || 1)).toFixed(2))
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prixUnitaire === "" || Number(prixUnitaire) <= 0) {
      setError("Le prix unitaire doit être supérieur à zéro.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload: UpdatePriceData = {
        prix_unitaire: Number(prixUnitaire),
        devise,
        taux_conversion: devise === "MAD" ? 1 : Number(tauxConversion),
        source_prix: sourcePrix.trim() || undefined,
        justification: justification.trim() || undefined,
      };

      const result = await updateArticlePrice(article!.id, payload);
      setSuccess("Prix validé et historisé avec succès !");
      if (onPriceUpdated) {
        onPriceUpdated(result.article);
      }
      await loadHistory(article!.id);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de la mise à jour du prix unitaire."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <LuCircleDollarSign size={20} />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Valorisation du Prix Unitaire (Section 8)
              </h2>
              <p className="text-xs text-slate-500">
                Réservé au <span className="font-semibold">Responsable BDM</span> · Valorisation officielle en MAD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Article Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {article.reference}
                </span>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {article.type}
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">{article.description}</p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="text-[11px] text-slate-400">Prix unitaire actuel</p>
              <p className="font-extrabold text-sm text-slate-800">
                {article.prix_unitaire != null
                  ? `${Number(article.prix_unitaire).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })} MAD`
                  : "Non valorisé"}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-medium flex items-center gap-2">
              <LuCheck size={16} />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prix Unitaire <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={prixUnitaire}
                  onChange={(e) =>
                    setPrixUnitaire(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Devise
                </label>
                <select
                  value={devise}
                  onChange={(e) => {
                    setDevise(e.target.value);
                    if (e.target.value === "MAD") setTauxConversion(1);
                    else if (e.target.value === "EUR") setTauxConversion(10.8);
                    else if (e.target.value === "USD") setTauxConversion(10.0);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="MAD">MAD (Dirham marocain)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taux de conversion vers MAD
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  disabled={devise === "MAD"}
                  value={tauxConversion}
                  onChange={(e) => setTauxConversion(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Calculated MAD preview */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <LuTrendingUp size={16} />
                Prix Unitaire converti en MAD :
              </div>
              <span className="text-base font-extrabold text-emerald-700">
                {computedPriceMad.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                MAD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source du prix (Section 8.3)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Devis OCP, Facture JESA, Barème 2026..."
                  value={sourcePrix}
                  onChange={(e) => setSourcePrix(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commentaire / Justification
                </label>
                <input
                  type="text"
                  placeholder="Ex: Validation après négociation bordereau..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {saving ? "Validation..." : "Valider et Historiser le Prix"}
              </button>
            </div>
          </form>

          {/* Section 8.4: Historique des modifications de prix */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <LuHistory size={14} className="text-slate-500" />
              Historique des Modifications de Prix (Section 8.4)
            </h3>

            {loadingHistory ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Chargement de l'historique...
              </p>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Aucune modification de prix enregistrée pour cet article.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-right">Ancien Prix</th>
                      <th className="px-3 py-2 text-right">Nouveau Prix</th>
                      <th className="px-3 py-2">Source & Justification</th>
                      <th className="px-3 py-2">Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {h.ancien_prix != null
                            ? `${Number(h.ancien_prix).toFixed(2)} MAD`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                          {Number(h.prix_unitaire_mad).toFixed(2)} MAD
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          <span className="font-medium text-slate-800">
                            {h.source_prix || "Non précisée"}
                          </span>
                          {h.justification && (
                            <p className="text-slate-500 text-[10px]">
                              {h.justification}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-600">
                          {h.user_name || "Responsable BDM"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
