import {
  LuX,
  LuFileText,
  LuTag,
  LuLayers,
  LuBoxes,
  LuCircleDollarSign,
  LuCalendar,
  LuCheck,
  LuCopy,
} from "react-icons/lu";
import { useState } from "react";
import type { Article } from "../../../types/article.types";

type ArticleDetailsModalProps = {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle?: (article: Article) => void;
};

const TYPE_LABELS: Record<string, string> = {
  pdr: "Pièce de rechange (PDR)",
  interchangeable: "Interchangeable",
  bande_convoyeur: "Bande convoyeur",
  lubrifiant_huile: "Lubrifiant huile",
  lubrifiant_graisse: "Lubrifiant graisse",
  autre_consommable: "Autre consommable",
};

export default function ArticleDetailsModal({
  article,
  isOpen,
  onClose,
  onSelectArticle,
}: ArticleDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !article) {
    return null;
  }

  function handleCopyReference() {
    if (article?.reference) {
      navigator.clipboard.writeText(article.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const statusColors: Record<string, string> = {
    actif: "bg-emerald-50 text-emerald-700 border-emerald-200",
    brouillon: "bg-slate-100 text-slate-700 border-slate-200",
    en_attente_prix: "bg-amber-50 text-amber-700 border-amber-200",
    obsolete: "bg-rose-50 text-rose-700 border-rose-200",
    bloque: "bg-red-50 text-red-700 border-red-200",
    archive: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  const criticalityColors: Record<string, string> = {
    haute: "bg-rose-50 text-rose-700 border-rose-200",
    moyenne: "bg-amber-50 text-amber-700 border-amber-200",
    basse: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <LuFileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {article.reference}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  title="Copier la référence"
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  {copied ? <LuCheck size={14} className="text-green-600" /> : <LuCopy size={14} />}
                </button>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    statusColors[article.statut] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {article.statut || "Non défini"}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-slate-600 line-clamp-1">
                {article.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Fermer"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Main Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500">Type d'article</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {TYPE_LABELS[article.type] || article.type || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Unité de mesure</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {article.unite || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Code SAP / Oracle</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 font-mono">
                {article.code_sap_oracle || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Marque</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {article.marque || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Fabricant</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {article.fabricant || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Réf. Constructeur</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 font-mono">
                {article.reference_constructeur || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Criticité</p>
              <p className="mt-1">
                {article.criticite ? (
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${
                      criticalityColors[article.criticite.toLowerCase()] ||
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {article.criticite}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </p>
            </div>
          </div>

          {/* Typologie Spécifique (Sections 4.2, 4.3, 4.4) */}
          {article.type === "bande_convoyeur" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-3">
                <LuLayers size={14} /> Spécifications Bande Convoyeur (Section 4.3)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Largeur :</span>{" "}
                  <strong className="text-slate-800">{article.largeur ? `${article.largeur} mm` : "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Longueur :</span>{" "}
                  <strong className="text-slate-800">{article.longueur ? `${article.longueur} m` : "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Épaisseur :</span>{" "}
                  <strong className="text-slate-800">{article.epaisseur ? `${article.epaisseur} mm` : "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Type :</span>{" "}
                  <strong className="text-slate-800">{article.type_bande || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Nombre de plis :</span>{" "}
                  <strong className="text-slate-800">{article.nb_plis ?? "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Revêtement :</span>{" "}
                  <strong className="text-slate-800">{article.revetement || "-"}</strong>
                </div>
              </div>
            </div>
          )}

          {(article.type === "lubrifiant_huile" || article.type === "lubrifiant_graisse") && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-3">
                <LuLayers size={14} /> Caractéristiques Lubrifiant (Section 4.4)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Viscosité :</span>{" "}
                  <strong className="text-slate-800">{article.viscosite || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Grade :</span>{" "}
                  <strong className="text-slate-800">{article.grade || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Conditionnement :</span>{" "}
                  <strong className="text-slate-800">{article.conditionnement || "-"}</strong>
                </div>
              </div>
            </div>
          )}

          {article.type === "interchangeable" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3">
                <LuLayers size={14} /> Interchangeabilité (Section 4.2)
              </h3>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">ID Article interchangeable :</span>{" "}
                  <strong className="font-mono text-slate-800">{article.article_interchangeable_id || "Non spécifié"}</strong>
                </div>
                {article.equivalence && (
                  <div>
                    <span className="text-slate-500">Équivalence technique :</span>{" "}
                    <strong className="text-slate-800">{article.equivalence}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classification */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <LuTag size={14} /> Classification
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Famille</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {article.famille || "Non classé"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Sous-famille</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {article.sous_famille || "Non classé"}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Thresholds */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <LuBoxes size={14} /> Paramètres de Stock
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Seuil Min</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {article.seuil_min ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Seuil Max</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {article.seuil_max ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Stock Sécurité</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {article.stock_securite ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Délai Réappro.</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {article.delai_approvisionnement != null
                    ? `${article.delai_approvisionnement} j`
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Valorization */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <LuCircleDollarSign size={14} /> Valorisation
            </h3>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Prix unitaire de référence</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {article.prix_unitaire != null ? Number(article.prix_unitaire).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "Non renseigné"}
                  <span className="ml-1.5 text-sm font-medium text-slate-500">
                    {article.devise || "MAD"}
                  </span>
                </p>
              </div>
              {article.createdAt && (
                <div className="text-right">
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <LuCalendar size={13} /> Enregistré le
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {new Date(article.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          {article.commentaire && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <LuLayers size={14} /> Commentaire
              </h3>
              <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 whitespace-pre-line">
                {article.commentaire}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/60 rounded-b-2xl">
          <p className="text-xs text-slate-400 font-mono">
            ID: {article.id}
          </p>

          <div className="flex items-center gap-3">
            {onSelectArticle && (
              <button
                type="button"
                onClick={() => onSelectArticle(article)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 shadow-sm"
              >
                Utiliser cet article existant
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
