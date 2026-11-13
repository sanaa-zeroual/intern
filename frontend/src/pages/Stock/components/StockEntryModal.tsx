import { useState, useEffect } from "react";
import {
  LuX,
  LuPlus,
  LuInfo,
  LuCheck,
  LuTriangleAlert,
  LuFileText,
} from "react-icons/lu";
import type { Article } from "../../../types/article.types";
import { recordStockEntry } from "../../../services/stock.service";
import type { CreateStockEntryData } from "../../../types/stock.types";

type StockEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articles: Article[];
  defaultArticle?: Article | null;
};

const PROVENANCES = [
  { value: "Annexe D", label: "Annexe D (Priorité 1)" },
  { value: "JESA AM", label: "JESA AM (Priorité 2)" },
  { value: "OCP — ISE", label: "OCP — ISE (Priorité 3)" },
  { value: "OCP — Cession", label: "OCP — Cession (Priorité 4)" },
  { value: "Autre", label: "Autre provenance" },
];

const PREDEFINED_MOTIFS = [
  "Réception Annexe D",
  "Réception commande JESA AM",
  "Réception OCP",
  "Régularisation d'inventaire",
  "Retour magasin après non-utilisation",
  "Transfert depuis autre magasin",
];

export default function StockEntryModal({
  isOpen,
  onClose,
  onSuccess,
  articles,
  defaultArticle,
}: StockEntryModalProps) {
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [quantite, setQuantite] = useState<number | "">("");
  const [provenance, setProvenance] = useState("Annexe D");
  const [motif, setMotif] = useState(PREDEFINED_MOTIFS[0]);
  const [customMotif, setCustomMotif] = useState("");
  const [isCustomMotif, setIsCustomMotif] = useState(false);
  const [referenceDocument, setReferenceDocument] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState<number | "">("");
  const [commentaire, setCommentaire] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultArticle) {
      setSelectedArticleId(defaultArticle.id);
      if (defaultArticle.prix_unitaire != null) {
        setPrixUnitaire(Number(defaultArticle.prix_unitaire));
      }
    } else if (articles.length > 0 && !selectedArticleId) {
      setSelectedArticleId(articles[0].id);
    }
  }, [defaultArticle, articles, isOpen]);

  if (!isOpen) return null;

  const currentArticle = articles.find((a) => a.id === selectedArticleId);

  const isJesaOrOcp =
    provenance === "JESA AM" ||
    provenance === "OCP — ISE" ||
    provenance === "OCP — Cession";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedArticleId) {
      setError("Veuillez sélectionner un article.");
      return;
    }

    if (!quantite || Number(quantite) <= 0) {
      setError("La quantité entrée doit être supérieure à 0.");
      return;
    }

    if (!provenance) {
      setError("La provenance est obligatoire (Section 7.3 du CDC).");
      return;
    }

    const finalMotif = isCustomMotif ? customMotif.trim() : motif;
    if (!finalMotif) {
      setError("Le motif d'entrée est obligatoire.");
      return;
    }

    try {
      setLoading(true);
      const payload: CreateStockEntryData = {
        article_id: selectedArticleId,
        quantite: Number(quantite),
        provenance,
        motif: finalMotif,
        reference_document: referenceDocument.trim() || undefined,
        prix_unitaire: prixUnitaire !== "" ? Number(prixUnitaire) : undefined,
        commentaire: commentaire.trim() || undefined,
      };

      await recordStockEntry(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de l'enregistrement de l'entrée."
      );
    } finally {
      setLoading(false);
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <LuPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Enregistrer une entrée en stock
              </h2>
              <p className="text-xs text-slate-500">
                Augmenter la quantité disponible avec provenance obligatoire (CDC Sec. 7)
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

          {/* Article selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Article concerné <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            >
              <option value="" disabled>
                Sélectionner un article...
              </option>
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.reference} — {art.description} ({art.unite || "unité"})
                </option>
              ))}
            </select>
            {currentArticle && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Unité :</span>{" "}
                {currentArticle.unite || "pièce"} |{" "}
                <span className="font-medium text-slate-700">Famille :</span>{" "}
                {currentArticle.famille || "Non classé"}
              </div>
            )}
          </div>

          {/* Provenance (Obligatoire - CDC Sec. 7.3) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Provenance <span className="text-red-500">*</span>
              <span className="ml-2 font-normal text-slate-400 normal-case">
                (Obligatoire selon le cahier des charges)
              </span>
            </label>
            <select
              value={provenance}
              onChange={(e) => setProvenance(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 font-medium"
              required
            >
              {PROVENANCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alert JESA / OCP notification */}
          {isJesaOrOcp && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 leading-relaxed">
              <LuInfo size={17} className="shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-semibold">Règle CDC (Sec. 7.4 & 7.5) :</span> Une
                notification automatique sera envoyée au <strong>Responsable BDM</strong> pour
                renseigner le prix unitaire et assurer la valorisation en MAD.
              </div>
            </div>
          )}

          {/* Quantité & Prix unitaire */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Quantité entrée <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 5"
                value={quantite}
                onChange={(e) =>
                  setQuantite(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Prix unitaire (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Optionnel ou à valoriser"
                value={prixUnitaire}
                onChange={(e) =>
                  setPrixUnitaire(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Motif d'entrée */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Motif d'entrée <span className="text-red-500">*</span>
            </label>
            {!isCustomMotif ? (
              <div className="space-y-2">
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {PREDEFINED_MOTIFS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomMotif(true)}
                  className="text-xs text-green-700 hover:underline"
                >
                  + Saisir un autre motif personnalisé
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Précisez le motif..."
                  value={customMotif}
                  onChange={(e) => setCustomMotif(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsCustomMotif(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  ← Choisir parmi les motifs prédéfinis
                </button>
              </div>
            )}
          </div>

          {/* Référence document (BL / Réception) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              N° Bon de Réception / BL
            </label>
            <div className="relative">
              <LuFileText
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Ex: BL-2026-9812"
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Commentaire ou observation
            </label>
            <textarea
              rows={2}
              placeholder="Remarque éventuelle sur l'état de la pièce ou la livraison..."
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
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <LuCheck size={18} />
                  <span>Valider l'entrée</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
