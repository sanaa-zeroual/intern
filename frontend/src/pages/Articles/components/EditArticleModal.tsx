import { useState, useEffect } from "react";
import {
  LuX,
  LuPencil,
  LuLock,
  LuCheck,
  LuRefreshCw,
  LuLayers,
} from "react-icons/lu";

import { useAuth } from "../../../context/AuthContext";
import { updateArticle } from "../../../services/articles.service";
import type { Article, CreateArticleData } from "../../../types/article.types";

type EditArticleModalProps = {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedArticle: Article) => void;
  allArticles: Article[];
};

const ARTICLE_TYPES = [
  { value: "pdr", label: "PDR - Pièce de rechange" },
  { value: "interchangeable", label: "Interchangeable" },
  { value: "bande_convoyeur", label: "Bande convoyeur" },
  { value: "lubrifiant_huile", label: "Lubrifiant huile" },
  { value: "lubrifiant_graisse", label: "Lubrifiant graisse" },
  { value: "autre_consommable", label: "Autre consommable" },
];

const ARTICLE_STATUSES = [
  { value: "actif", label: "Actif" },
  { value: "brouillon", label: "Brouillon" },
  { value: "en_attente_prix", label: "En attente de prix" },
  { value: "obsolete", label: "Obsolète" },
  { value: "bloque", label: "Bloqué" },
  { value: "archive", label: "Archivé" },
];

const CRITICALITY_OPTIONS = [
  { value: "haute", label: "Haute" },
  { value: "moyenne", label: "Moyenne" },
  { value: "basse", label: "Basse" },
];

export default function EditArticleModal({
  article,
  isOpen,
  onClose,
  onSuccess,
  allArticles,
}: EditArticleModalProps) {
  const { user } = useAuth();
  const role = user?.role;

  // Section 3.1: Le magasinier ne doit pas pouvoir modifier les prix unitaires
  const isMagasinier = role === "magasinier";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partial<CreateArticleData>>({});

  useEffect(() => {
    if (article) {
      setFormData({
        type: article.type,
        description: article.description,
        reference: article.reference,
        unite: article.unite,
        statut: article.statut,
        marque: article.marque || "",
        fabricant: article.fabricant || "",
        code_sap_oracle: article.code_sap_oracle || "",
        reference_constructeur: article.reference_constructeur || "",
        famille: article.famille || "",
        sous_famille: article.sous_famille || "",
        seuil_min: article.seuil_min ?? undefined,
        seuil_max: article.seuil_max ?? undefined,
        stock_securite: article.stock_securite ?? undefined,
        delai_approvisionnement: article.delai_approvisionnement ?? undefined,
        criticite: article.criticite || "moyenne",
        prix_unitaire: article.prix_unitaire != null ? Number(article.prix_unitaire) : undefined,
        devise: article.devise || "MAD",
        commentaire: article.commentaire || "",

        // Typologies
        largeur: article.largeur != null ? Number(article.largeur) : undefined,
        longueur: article.longueur != null ? Number(article.longueur) : undefined,
        epaisseur: article.epaisseur != null ? Number(article.epaisseur) : undefined,
        type_bande: article.type_bande || "",
        nb_plis: article.nb_plis ?? undefined,
        revetement: article.revetement || "",
        viscosite: article.viscosite || "",
        grade: article.grade || "",
        conditionnement: article.conditionnement || "",
        article_interchangeable_id: article.article_interchangeable_id || "",
        equivalence: article.equivalence || "",
      });
      setError("");
    }
  }, [article]);

  if (!isOpen || !article) return null;

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!article) return;
    setError("");

    if (!formData.description?.trim() || !formData.reference?.trim() || !formData.unite?.trim()) {
      setError("Les champs description, référence et unité sont obligatoires.");
      return;
    }

    try {
      setSaving(true);

      // Clean payload
      const payload: Partial<CreateArticleData> = {
        ...formData,
        reference: formData.reference?.trim(),
        description: formData.description?.trim(),
        code_sap_oracle: formData.code_sap_oracle?.trim() || undefined,
        marque: formData.marque?.trim() || undefined,
        fabricant: formData.fabricant?.trim() || undefined,
        reference_constructeur: formData.reference_constructeur?.trim() || undefined,
        famille: formData.famille?.trim() || undefined,
        sous_famille: formData.sous_famille?.trim() || undefined,
      };

      // Strip price if magasinier
      if (isMagasinier) {
        delete payload.prix_unitaire;
      }

      const updated = await updateArticle(article.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Impossible de modifier l'article. Vérifiez les informations."
      );
    } finally {
      setSaving(false);
    }
  }

  // Filter out the current article from interchangeable candidates
  const candidateInterchangeables = allArticles.filter((a) => a.id !== article.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <LuPencil size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Modifier l'article
              </h2>
              <p className="font-mono text-xs font-semibold text-slate-500">
                {article.reference}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Données Générales */}
          <div>
            <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Données Générales
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Type d'article *
                </label>
                <select
                  name="type"
                  value={formData.type || "pdr"}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                >
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Référence Article *
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 font-mono px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Statut du cycle de vie *
                </label>
                <select
                  name="statut"
                  value={formData.statut || "actif"}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {ARTICLE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Unité de mesure *
                </label>
                <input
                  type="text"
                  name="unite"
                  value={formData.unite || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Référencement */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Identification & Références
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Marque
                </label>
                <input
                  type="text"
                  name="marque"
                  value={formData.marque || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Fabricant
                </label>
                <input
                  type="text"
                  name="fabricant"
                  value={formData.fabricant || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Code SAP / Oracle
                </label>
                <input
                  type="text"
                  name="code_sap_oracle"
                  value={formData.code_sap_oracle || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 font-mono px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Réf. Constructeur / Fournisseur
                </label>
                <input
                  type="text"
                  name="reference_constructeur"
                  value={formData.reference_constructeur || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 font-mono px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Famille
                </label>
                <input
                  type="text"
                  name="famille"
                  value={formData.famille || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Sous-famille
                </label>
                <input
                  type="text"
                  name="sous_famille"
                  value={formData.sous_famille || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Criticité
                </label>
                <select
                  name="criticite"
                  value={formData.criticite || "moyenne"}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {CRITICALITY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section Spécifique Typologie (Sections 4.2, 4.3, 4.4) */}
          {formData.type === "bande_convoyeur" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
                <LuLayers size={15} /> Spécifications Bande Convoyeur (Section 4.3)
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Largeur (mm)</label>
                  <input
                    type="number"
                    name="largeur"
                    value={formData.largeur ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, largeur: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Longueur (m)</label>
                  <input
                    type="number"
                    name="longueur"
                    value={formData.longueur ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, longueur: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Épaisseur (mm)</label>
                  <input
                    type="number"
                    name="epaisseur"
                    value={formData.epaisseur ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, epaisseur: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Type de bande</label>
                  <input
                    type="text"
                    name="type_bande"
                    value={formData.type_bande || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: EP 400/3"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nombre de plis</label>
                  <input
                    type="number"
                    name="nb_plis"
                    value={formData.nb_plis ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, nb_plis: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Revêtement</label>
                  <input
                    type="text"
                    name="revetement"
                    value={formData.revetement || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Anti-abrasif 4+2"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.type === "lubrifiant_huile" || formData.type === "lubrifiant_graisse") && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">
                <LuLayers size={15} /> Spécifications Lubrifiant (Section 4.4)
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Viscosité</label>
                  <input
                    type="text"
                    name="viscosite"
                    value={formData.viscosite || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: ISO VG 220"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Grade</label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: NLGI 2"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Conditionnement</label>
                  <input
                    type="text"
                    name="conditionnement"
                    value={formData.conditionnement || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Fût 200L, Cartouche 400g"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === "interchangeable" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                <LuLayers size={15} /> Interchangeabilité (Section 4.2)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Article équivalent dans le catalogue</label>
                  <select
                    name="article_interchangeable_id"
                    value={formData.article_interchangeable_id || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  >
                    <option value="">Sélectionner un article équivalent...</option>
                    {candidateInterchangeables.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.reference} — {c.description} ({c.marque || "Sans marque"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Note de compatibilité / Équivalence</label>
                  <input
                    type="text"
                    name="equivalence"
                    value={formData.equivalence || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: 100% compatible dimensionnelle et thermique"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Seuils de stock & Valorisation */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Seuils de stock & Valorisation
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Seuil Min
                </label>
                <input
                  type="number"
                  name="seuil_min"
                  min="0"
                  value={formData.seuil_min ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, seuil_min: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Seuil Max
                </label>
                <input
                  type="number"
                  name="seuil_max"
                  min="0"
                  value={formData.seuil_max ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, seuil_max: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Stock Sécurité
                </label>
                <input
                  type="number"
                  name="stock_securite"
                  min="0"
                  value={formData.stock_securite ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, stock_securite: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Délai réappro. (jours)
                </label>
                <input
                  type="number"
                  name="delai_approvisionnement"
                  min="0"
                  value={formData.delai_approvisionnement ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, delai_approvisionnement: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Règle Magasinier sur le Prix (Section 3.1) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Prix unitaire (MAD)
                  </label>
                  {isMagasinier && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <LuLock size={12} /> Réservé BDM (Sect. 3.1)
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  name="prix_unitaire"
                  step="0.01"
                  min="0"
                  disabled={isMagasinier}
                  value={formData.prix_unitaire ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, prix_unitaire: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  placeholder="0.00"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    isMagasinier
                      ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  }`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Devise
                </label>
                <input
                  type="text"
                  name="devise"
                  disabled={isMagasinier}
                  value={formData.devise || "MAD"}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    isMagasinier
                      ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Commentaire */}
          <div className="pt-2 border-t border-slate-100">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Commentaires
            </label>
            <textarea
              name="commentaire"
              value={formData.commentaire || ""}
              onChange={handleInputChange}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LuRefreshCw size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <LuCheck size={18} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
