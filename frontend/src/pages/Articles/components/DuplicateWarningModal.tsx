import {
  LuTriangleAlert,
  LuShieldAlert,
  LuX,
  LuEye,
  LuArrowLeft,
  LuCheck,
} from "react-icons/lu";
import type { Article, CreateArticleData } from "../../../types/article.types";

type DuplicateWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  duplicates: Article[];
  newArticleData: CreateArticleData;
  onConfirmCreate: () => void;
  onViewArticle: (article: Article) => void;
  onSelectExistingArticle?: (article: Article) => void;
  creating?: boolean;
};

export default function DuplicateWarningModal({
  isOpen,
  onClose,
  duplicates,
  newArticleData,
  onConfirmCreate,
  onViewArticle,
  onSelectExistingArticle,
  creating = false,
}: DuplicateWarningModalProps) {
  if (!isOpen || duplicates.length === 0) {
    return null;
  }

  // Analyze each conflicting article
  const conflicts = duplicates.map((article) => {
    const reasons: { label: string; isStrict: boolean }[] = [];

    const isSameRef =
      article.reference?.trim().toLowerCase() ===
      newArticleData.reference?.trim().toLowerCase();

    if (isSameRef) {
      reasons.push({
        label: `Même référence (${article.reference})`,
        isStrict: true,
      });
    }

    const isSameSap =
      Boolean(article.code_sap_oracle?.trim()) &&
      Boolean(newArticleData.code_sap_oracle?.trim()) &&
      article.code_sap_oracle?.trim().toLowerCase() ===
        newArticleData.code_sap_oracle?.trim().toLowerCase();

    if (isSameSap) {
      reasons.push({
        label: `Même code SAP/Oracle (${article.code_sap_oracle})`,
        isStrict: true,
      });
    }

    const isSimilarDesc =
      Boolean(article.description) &&
      Boolean(newArticleData.description) &&
      (article.description.toLowerCase().includes(newArticleData.description.toLowerCase().trim()) ||
        newArticleData.description.toLowerCase().includes(article.description.toLowerCase().trim()));

    if (isSimilarDesc && !isSameRef) {
      reasons.push({
        label: "Description similaire",
        isStrict: false,
      });
    }

    const isSameBrand =
      Boolean(article.marque?.trim()) &&
      Boolean(newArticleData.marque?.trim()) &&
      article.marque?.trim().toLowerCase() ===
        newArticleData.marque?.trim().toLowerCase();

    if (isSameBrand && reasons.length <= 1) {
      reasons.push({
        label: `Même marque (${article.marque})`,
        isStrict: false,
      });
    }

    const hasStrict = reasons.some((r) => r.isStrict);

    return {
      article,
      reasons,
      hasStrict,
    };
  });

  const hasStrictConflict = conflicts.some((c) => c.hasStrict);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          className={`flex items-start justify-between border-b px-6 py-5 ${
            hasStrictConflict
              ? "bg-red-50/70 border-red-200"
              : "bg-amber-50/70 border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                hasStrictConflict
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {hasStrictConflict ? (
                <LuShieldAlert size={24} />
              ) : (
                <LuTriangleAlert size={24} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-xl font-bold ${
                    hasStrictConflict ? "text-red-900" : "text-amber-900"
                  }`}
                >
                  {hasStrictConflict
                    ? "Doublon strict détecté !"
                    : "Doublons potentiels détectés"}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    hasStrictConflict
                      ? "bg-red-200 text-red-800"
                      : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {duplicates.length} résultat{duplicates.length > 1 ? "s" : ""}
                </span>
              </div>

              <p
                className={`mt-1 text-sm ${
                  hasStrictConflict ? "text-red-700" : "text-amber-700"
                }`}
              >
                {hasStrictConflict
                  ? "Un article avec cette référence ou ce code SAP existe déjà. La création d'un doublon exact est interdite."
                  : "Le système a identifié des articles existants qui ressemblent à votre saisie. Veuillez vérifier avant de poursuivre."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 transition"
            title="Fermer"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* User Saisie Recap */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Votre saisie : </span>
          <span className="font-mono font-bold text-slate-900">
            {newArticleData.reference || "Sans réf"}
          </span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="italic">{newArticleData.description}</span>
          {newArticleData.marque && (
            <>
              <span className="mx-2 text-slate-300">|</span>
              <span>Marque: <strong>{newArticleData.marque}</strong></span>
            </>
          )}
          {newArticleData.code_sap_oracle && (
            <>
              <span className="mx-2 text-slate-300">|</span>
              <span>SAP: <strong className="font-mono">{newArticleData.code_sap_oracle}</strong></span>
            </>
          )}
        </div>

        {/* Duplicate Articles List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Articles existants en conflit dans la base :
          </p>

          {conflicts.map(({ article, reasons, hasStrict }) => (
            <div
              key={article.id}
              className={`rounded-xl border p-4.5 transition hover:shadow-md ${
                hasStrict
                  ? "border-red-200 bg-red-50/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Conflict Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {reasons.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      r.isStrict
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {r.isStrict ? "🛑 " : "⚠️ "}
                    {r.label}
                  </span>
                ))}
              </div>

              {/* Card Main Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {article.reference}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        article.statut === "actif"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {article.statut}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {article.type}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {article.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    {article.marque && (
                      <span>
                        Marque: <strong className="text-slate-700">{article.marque}</strong>
                      </span>
                    )}
                    {article.code_sap_oracle && (
                      <span>
                        Code SAP: <strong className="font-mono text-slate-700">{article.code_sap_oracle}</strong>
                      </span>
                    )}
                    {article.unite && (
                      <span>
                        Unité: <strong className="text-slate-700">{article.unite}</strong>
                      </span>
                    )}
                    {article.famille && (
                      <span>
                        Famille: <strong className="text-slate-700">{article.famille}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions on this article */}
                <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => onViewArticle(article)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <LuEye size={15} />
                    Consulter
                  </button>

                  {onSelectExistingArticle && (
                    <button
                      type="button"
                      onClick={() => onSelectExistingArticle(article)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                    >
                      <LuCheck size={14} />
                      Utiliser cet article
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {hasStrictConflict ? (
                <span className="text-red-700 font-medium">
                  Modification requise : la référence doit être unique dans le système.
                </span>
              ) : (
                <span>
                  Vous pouvez ajuster les champs ou forcer la création si les articles sont distincts.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <LuArrowLeft size={16} />
                Modifier ma saisie
              </button>

              <button
                type="button"
                onClick={onConfirmCreate}
                disabled={hasStrictConflict || creating}
                title={
                  hasStrictConflict
                    ? "Impossible de créer : référence ou code SAP déjà existant"
                    : "Créer malgré les similarités détectées"
                }
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  hasStrictConflict
                    ? "cursor-not-allowed bg-slate-300 opacity-60"
                    : "bg-amber-600 hover:bg-amber-700 shadow-sm"
                }`}
              >
                {creating ? "Création en cours..." : "Confirmer et créer quand même"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
