import { useState, useEffect } from "react";
import {
  LuX,
  LuMinus,
  LuTriangleAlert,
  LuCheck,
  LuLayers,
  LuWrench,
  LuClipboardList,
} from "react-icons/lu";
import type { Article } from "../../../types/article.types";
import {
  previewStockExit,
  recordStockExit,
} from "../../../services/stock.service";
import type {
  PreviewExitResponse,
  CreateStockExitData,
} from "../../../types/stock.types";

type StockExitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articles: Article[];
  defaultArticle?: Article | null;
};

export default function StockExitModal({
  isOpen,
  onClose,
  onSuccess,
  articles,
  defaultArticle,
}: StockExitModalProps) {
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [quantite, setQuantite] = useState<number | "">("");
  const [demandeur, setDemandeur] = useState("");
  const [motif, setMotif] = useState("Maintenance préventive");
  const [numeroOt, setNumeroOt] = useState("");
  const [equipement, setEquipement] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [preview, setPreview] = useState<PreviewExitResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultArticle) {
      setSelectedArticleId(defaultArticle.id);
    } else if (articles.length > 0 && !selectedArticleId) {
      setSelectedArticleId(articles[0].id);
    }
  }, [defaultArticle, articles, isOpen]);

  // Debounced / responsive preview calculation
  useEffect(() => {
    if (!isOpen || !selectedArticleId || !quantite || Number(quantite) <= 0) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingPreview(true);
        setError("");
        const res = await previewStockExit(selectedArticleId, Number(quantite));
        setPreview(res);
      } catch (err: any) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Erreur lors du calcul du déstockage prioritaire."
        );
      } finally {
        setLoadingPreview(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedArticleId, quantite, isOpen]);

  if (!isOpen) return null;

  const currentArticle = articles.find((a) => a.id === selectedArticleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedArticleId) {
      setError("Veuillez sélectionner un article.");
      return;
    }

    if (!quantite || Number(quantite) <= 0) {
      setError("La quantité sortie doit être supérieure à 0.");
      return;
    }

    if (!preview?.can_fulfill) {
      setError(
        `Stock disponible insuffisant. Disponible : ${
          preview?.total_available ?? 0
        }, demandé : ${quantite}.`
      );
      return;
    }

    // Section 9.5: Obligation stricte du numéro d'OT pour provenance OCP
    if (preview?.requires_ot && (!numeroOt || !numeroOt.trim())) {
      setError(
        "Cette sortie utilise une quantité provenant de l'OCP. Le numéro d'OT est obligatoire pour valider la sortie."
      );
      return;
    }

    if (!motif.trim()) {
      setError("Le motif de sortie est obligatoire.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateStockExitData = {
        article_id: selectedArticleId,
        quantite: Number(quantite),
        motif: motif.trim(),
        demandeur: demandeur.trim() || undefined,
        numero_ot: numeroOt.trim() || undefined,
        equipement: equipement.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      };

      await recordStockExit(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de l'enregistrement de la sortie."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <LuMinus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Enregistrer une sortie de stock
              </h2>
              <p className="text-xs text-slate-500">
                Priorité automatique (Annexe D ➔ JESA ➔ OCP) & N° OT obligatoire (CDC Sec. 9)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <LuTriangleAlert size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Article Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Article concerné <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 font-medium"
              required
            >
              <option value="" disabled>
                Sélectionner un article...
              </option>
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.reference} — {art.description}
                </option>
              ))}
            </select>
          </div>

          {/* Quantité demandée */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Quantité à sortir <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 3"
              value={quantite}
              onChange={(e) =>
                setQuantite(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          {/* Real-time Priority Breakdown Display (Section 9.3 & 9.4) */}
          {loadingPreview && (
            <div className="p-3 text-xs text-slate-500 animate-pulse bg-slate-50 rounded-xl border border-slate-200">
              Calcul du déstockage selon la priorité Annexe D ➔ JESA AM ➔ OCP ISE ➔ OCP Cession...
            </div>
          )}

          {preview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <LuLayers size={15} className="text-slate-500" />
                  Règle de priorité appliquée (CDC 9.3) :
                </span>
                <span
                  className={
                    preview.can_fulfill
                      ? "text-emerald-700 font-bold"
                      : "text-red-700 font-bold"
                  }
                >
                  Stock disponible : {preview.total_available}{" "}
                  {currentArticle?.unite || "unités"}
                </span>
              </div>

              {/* Progress / Deduction tags */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {preview.breakdown.map((item) => (
                  <div
                    key={item.provenance}
                    className={`rounded-lg border p-2 text-center text-xs transition ${
                      item.to_deduct > 0
                        ? "border-amber-300 bg-amber-50/80 font-medium text-amber-900"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <p className="truncate text-[11px] font-semibold">
                      {item.provenance}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {item.to_deduct > 0 ? `-${item.to_deduct}` : 0}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Dispo: {item.available}
                    </p>
                  </div>
                ))}
              </div>

              {!preview.can_fulfill && (
                <div className="rounded-lg bg-red-100 p-2.5 text-xs font-semibold text-red-800">
                  Stock insuffisant ! Le stock total ({preview.total_available}) ne permet
                  pas de couvrir la quantité demandée ({preview.requested_quantity}).
                </div>
              )}

              {/* Mandatory OT notice according to CDC Section 9.5 */}
              {preview.requires_ot && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-100/70 p-3.5 text-xs text-amber-950 font-medium leading-relaxed shadow-xs">
                  <LuTriangleAlert
                    size={19}
                    className="shrink-0 text-amber-700 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-900">
                      RÈGLE OBLIGATOIRE (CDC 9.5) :
                    </span>{" "}
                    {preview.ot_warning_message}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Numéro d'OT (Obligatoire si OCP - Section 9.5) */}
          <div
            className={`rounded-xl p-3 transition ${
              preview?.requires_ot
                ? "border-2 border-amber-400 bg-amber-50/40"
                : "border border-transparent"
            }`}
          >
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Numéro d'OT (Ordre de Travail)
              {preview?.requires_ot ? (
                <span className="ml-1 text-red-600 font-bold">* (OBLIGATOIRE)</span>
              ) : (
                <span className="ml-1 text-slate-400 normal-case font-normal">
                  (Facultatif pour Annexe D / JESA)
                </span>
              )}
            </label>
            <div className="relative">
              <LuClipboardList
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={
                  preview?.requires_ot
                    ? "Ex: OT-2026-4412 (Requis pour valider)"
                    : "Ex: OT-2026-4412"
                }
                value={numeroOt}
                onChange={(e) => setNumeroOt(e.target.value)}
                className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2.5 text-sm outline-none transition ${
                  preview?.requires_ot
                    ? "border-amber-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 font-semibold text-slate-900"
                    : "border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                }`}
                required={preview?.requires_ot}
              />
            </div>
          </div>

          {/* Demandeur / Service & Motif */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Demandeur / Service
              </label>
              <input
                type="text"
                placeholder="Ex: Équipe Mécanique / Ligne 1"
                value={demandeur}
                onChange={(e) => setDemandeur(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Motif de sortie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Remplacement préventif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                required
              />
            </div>
          </div>

          {/* Équipement / Installation concernée */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Équipement / Organe de destination
            </label>
            <div className="relative">
              <LuWrench
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Ex: Convoyeur CV-101 / Tambour de commande"
                value={equipement}
                onChange={(e) => setEquipement(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Commentaire
            </label>
            <textarea
              rows={2}
              placeholder="Remarque éventuelle sur la sortie..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                (preview !== null && !preview.can_fulfill) ||
                (preview?.requires_ot && (!numeroOt || !numeroOt.trim()))
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <span>Validation...</span>
              ) : (
                <>
                  <LuCheck size={18} />
                  <span>Valider la sortie</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
