import { useState, useEffect } from "react";
import { LuX, LuPackage } from "react-icons/lu";
import type { Equipment, CreateBomItemData } from "../../../types/equipment.types";
import type { Article } from "../../../types/article.types";

type BomItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBomItemData) => Promise<void>;
  equipment: Equipment | null;
  articles: Article[];
};

export default function BomItemModal({
  isOpen,
  onClose,
  onSubmit,
  equipment,
  articles,
}: BomItemModalProps) {
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [quantiteInstallee, setQuantiteInstallee] = useState<number>(1);
  const [unite, setUnite] = useState("pièce");
  const [position, setPosition] = useState("");
  const [criticite, setCriticite] = useState("moyenne");
  const [articleTypeRole, setArticleTypeRole] = useState("principal");
  const [frequence, setFrequence] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedArticleId("");
    setArticleSearch("");
    setQuantiteInstallee(1);
    setUnite("pièce");
    setPosition("");
    setCriticite("moyenne");
    setArticleTypeRole("principal");
    setFrequence("");
    setCommentaire("");
    setError("");
  }, [isOpen]);

  if (!isOpen || !equipment) return null;

  // Filter active articles based on search query
  const filteredArticles = articles.filter((a) => {
    if (a.statut === "archive" || a.statut === "obsolete") return false;
    const q = articleSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      a.reference?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.code_sap_oracle?.toLowerCase().includes(q) ||
      a.marque?.toLowerCase().includes(q)
    );
  });

  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedArticleId) {
      setError("Veuillez sélectionner un article à associer.");
      return;
    }
    if (quantiteInstallee <= 0) {
      setError("La quantité installée doit être supérieure à zéro.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSubmit({
        equipment_id: equipment!.id,
        article_id: selectedArticleId,
        quantite_installee: Number(quantiteInstallee),
        unite: unite || selectedArticle?.unite || "pièce",
        position: position.trim() || undefined,
        criticite,
        article_principal_ou_alternatif: articleTypeRole,
        frequence_remplacement: frequence.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'affectation de l'article à la BOM."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <LuPackage size={20} />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Ajouter un article à la BOM (Nomenclature)
              </h2>
              <p className="text-xs text-slate-500">
                Équipement cible :{" "}
                <span className="font-semibold text-slate-700">
                  {equipment.code_equipement} — {equipment.nom}
                </span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Article selection with search */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sélectionner l'article (PDR / Consommable) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Filtrer par référence, description, SAP..."
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs mb-2 focus:border-blue-500 focus:outline-hidden"
            />
            <select
              required
              size={5}
              value={selectedArticleId}
              onChange={(e) => {
                setSelectedArticleId(e.target.value);
                const art = articles.find((a) => a.id === e.target.value);
                if (art && art.unite) {
                  setUnite(art.unite);
                }
              }}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-hidden max-h-36 overflow-y-auto"
            >
              {filteredArticles.length === 0 ? (
                <option disabled>Aucun article trouvé</option>
              ) : (
                filteredArticles.map((art) => (
                  <option key={art.id} value={art.id} className="py-1">
                    [{art.reference}] {art.description} — {art.type}{" "}
                    {art.marque ? `(${art.marque})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedArticle && (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedArticle.reference}
                </p>
                <p className="text-slate-600">{selectedArticle.description}</p>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {selectedArticle.type}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité installée sur la machine <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantiteInstallee}
                onChange={(e) => setQuantiteInstallee(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unité
              </label>
              <input
                type="text"
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                placeholder="pièce, mètre, kg..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Position ou Repère mécanique
              </label>
              <input
                type="text"
                placeholder="Ex: Palier côté commande, Tambour"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Criticité
              </label>
              <select
                value={criticite}
                onChange={(e) => setCriticite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="haute">Haute (Machine bloquante)</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rôle dans la BOM
              </label>
              <select
                value={articleTypeRole}
                onChange={(e) => setArticleTypeRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="principal">Pièce Principale</option>
                <option value="alternatif">Pièce Alternative / Équivalente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fréquence de remplacement
              </label>
              <input
                type="text"
                placeholder="Ex: Tous les 6 mois, 2000 heures..."
                value={frequence}
                onChange={(e) => setFrequence(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commentaire / Instruction de montage
            </label>
            <textarea
              rows={2}
              placeholder="Notes d'installation ou outillage spécifique..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {saving ? "Affectation..." : "Ajouter à la BOM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
