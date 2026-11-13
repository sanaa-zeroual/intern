import { LuArchive, LuTriangleAlert, LuX } from "react-icons/lu";
import type { Article } from "../../../types/article.types";

type ArchiveConfirmModalProps = {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export default function ArchiveConfirmModal({
  article,
  isOpen,
  onClose,
  onConfirm,
  loading,
}: ArchiveConfirmModalProps) {
  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <LuArchive size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Archiver l'article
              </h2>
              <p className="font-mono text-xs font-semibold text-slate-500">
                {article.reference}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Message */}
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">
            Voulez-vous vraiment archiver l'article{" "}
            <strong className="text-slate-900">"{article.description}"</strong> ?
          </p>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
            <LuTriangleAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Règle de gestion (Section 5.5 & 14) :</p>
              <p className="mt-0.5">
                Aucune suppression physique n'est effectuée. Cet article passera au statut{" "}
                <span className="font-semibold underline">archivé</span> et sera bloqué pour toute nouvelle entrée ou sortie magasin.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
          >
            {loading ? "Archivage..." : "Confirmer l'archivage"}
          </button>
        </div>
      </div>
    </div>
  );
}
