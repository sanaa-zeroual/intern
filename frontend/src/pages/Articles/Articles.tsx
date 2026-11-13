import { useEffect, useState, useRef } from "react";
import {
  LuPlus,
  LuSearch,
  LuPencil,
  LuX,
  LuEye,
  LuArchive,
  LuTriangleAlert,
  LuCheck,
  LuCircleCheck,
  LuRefreshCw,
  LuLock,
  LuLayers,
  LuCircleDollarSign,
  LuDownload,
} from "react-icons/lu";

import { useAuth } from "../../context/AuthContext";
import {
  getArticles,
  createArticle,
  checkArticleDuplicates,
  archiveArticle,
} from "../../services/articles.service";
import type { Article, CreateArticleData } from "../../types/article.types";

import DuplicateWarningModal from "./components/DuplicateWarningModal";
import ArticleDetailsModal from "./components/ArticleDetailsModal";
import EditArticleModal from "./components/EditArticleModal";
import ArchiveConfirmModal from "./components/ArchiveConfirmModal";
import ValuationModal from "./components/ValuationModal";
import { exportToCsv } from "../../utils/exportToCsv";

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

const COMMON_UNITS = [
  "pièce",
  "mètre",
  "litre",
  "kg",
  "rouleau",
  "ensemble",
  "kit",
  "boîte",
];

const INITIAL_FORM: CreateArticleData = {
  type: "pdr",
  description: "",
  reference: "",
  unite: "pièce",
  statut: "actif",
  marque: "",
  fabricant: "",
  code_sap_oracle: "",
  reference_constructeur: "",
  famille: "",
  sous_famille: "",
  seuil_min: undefined,
  seuil_max: undefined,
  stock_securite: undefined,
  delai_approvisionnement: undefined,
  criticite: "moyenne",
  prix_unitaire: undefined,
  devise: "MAD",
  commentaire: "",

  // Typologies
  largeur: undefined,
  longueur: undefined,
  epaisseur: undefined,
  type_bande: "",
  nb_plis: undefined,
  revetement: "",
  viscosite: "",
  grade: "",
  conditionnement: "",
  article_interchangeable_id: "",
  equivalence: "",
};

export default function Articles() {
  const { user } = useAuth();
  const role = user?.role;

  // Section 3.1: Le magasinier ne doit pas pouvoir modifier les prix unitaires
  const isMagasinier = role === "magasinier";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Advanced Filters (Section 11 & Section 3.3)
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterCriticite, setFilterCriticite] = useState("");
  const [filterSansPrix, setFilterSansPrix] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<CreateArticleData>(INITIAL_FORM);

  // Duplicate Check State
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateArticles, setDuplicateArticles] = useState<Article[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [liveDuplicates, setLiveDuplicates] = useState<Article[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals State
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [archivingArticle, setArchivingArticle] = useState<Article | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [articleToValuate, setArticleToValuate] = useState<Article | null>(null);
  const [showValuationModal, setShowValuationModal] = useState(false);

  // Highlighted existing article
  const [highlightedArticleId, setHighlightedArticleId] = useState<string | null>(null);

  // RBAC permissions (Section 3 & Section 15.2)
  const canCreateArticle =
    role === "magasinier" ||
    role === "bdm" ||
    role === "responsable_bdm";

  const canEditArticle =
    role === "magasinier" ||
    role === "bdm" ||
    role === "responsable_bdm";

  const canArchiveArticle =
    role === "bdm" ||
    role === "responsable_bdm";

  // Load Articles
  async function loadArticles() {
    try {
      setLoading(true);
      setError("");
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les articles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  // Real-time inline duplicate check (debounced)
  useEffect(() => {
    if (!showForm) {
      setLiveDuplicates([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const ref = formData.reference.trim();
    const desc = formData.description.trim();
    const sap = formData.code_sap_oracle?.trim() || "";

    if (ref.length < 2 && desc.length < 3 && sap.length < 3) {
      setLiveDuplicates([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const matches = await checkArticleDuplicates({
          reference: ref || undefined,
          description: desc.length >= 3 ? desc : undefined,
          code_sap_oracle: sap || undefined,
          marque: formData.marque?.trim() || undefined,
        });
        setLiveDuplicates(matches);
      } catch (err) {
        console.debug("Live duplicate check notice:", err);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.reference, formData.description, formData.code_sap_oracle, formData.marque, showForm]);

  // Filtered Articles with advanced criteria
  const filteredArticles = articles.filter((article) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      article.description?.toLowerCase().includes(searchValue) ||
      article.reference?.toLowerCase().includes(searchValue) ||
      article.marque?.toLowerCase().includes(searchValue) ||
      article.code_sap_oracle?.toLowerCase().includes(searchValue) ||
      article.reference_constructeur?.toLowerCase().includes(searchValue) ||
      article.famille?.toLowerCase().includes(searchValue);

    const matchesType = !filterType || article.type === filterType;
    const matchesStatut = !filterStatut || article.statut === filterStatut;
    const matchesCriticite = !filterCriticite || article.criticite?.toLowerCase() === filterCriticite.toLowerCase();
    const matchesSansPrix = !filterSansPrix || (article.prix_unitaire == null || Number(article.prix_unitaire) === 0);

    return matchesSearch && matchesType && matchesStatut && matchesCriticite && matchesSansPrix;
  });

  // KPI Quick Stats
  const statsCount = {
    total: articles.length,
    actifs: articles.filter((a) => a.statut === "actif").length,
    sansPrix: articles.filter((a) => a.prix_unitaire == null || Number(a.prix_unitaire) === 0).length,
    archives: articles.filter((a) => a.statut === "archive").length,
  };

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openForm() {
    setFormError("");
    setLiveDuplicates([]);
    setFormData(INITIAL_FORM);
    setShowForm(true);
  }

  function closeForm() {
    if (creating || checkingDuplicates) return;
    setShowForm(false);
    setFormError("");
    setLiveDuplicates([]);
  }

  // Handle Form Submission: Check for Duplicates first
  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (
      !formData.type ||
      !formData.description.trim() ||
      !formData.reference.trim() ||
      !formData.unite.trim()
    ) {
      setFormError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    try {
      setCheckingDuplicates(true);

      const duplicates = await checkArticleDuplicates({
        reference: formData.reference.trim(),
        description: formData.description.trim(),
        code_sap_oracle: formData.code_sap_oracle?.trim() || undefined,
        marque: formData.marque?.trim() || undefined,
        type: formData.type,
      });

      if (duplicates && duplicates.length > 0) {
        setDuplicateArticles(duplicates);
        setShowDuplicateModal(true);
        return;
      }

      await executeCreateArticle();
    } catch (err: any) {
      console.error(err);
      setFormError(
        err?.response?.data?.message ||
          "Erreur lors de la vérification des doublons. Veuillez réessayer."
      );
    } finally {
      setCheckingDuplicates(false);
    }
  }

  // Execute Article Creation
  async function executeCreateArticle() {
    try {
      setCreating(true);
      setFormError("");

      const payload: CreateArticleData = {
        ...formData,
        reference: formData.reference.trim(),
        description: formData.description.trim(),
        code_sap_oracle: formData.code_sap_oracle?.trim() || undefined,
        reference_constructeur: formData.reference_constructeur?.trim() || undefined,
        marque: formData.marque?.trim() || undefined,
        fabricant: formData.fabricant?.trim() || undefined,
        famille: formData.famille?.trim() || undefined,
        sous_famille: formData.sous_famille?.trim() || undefined,
      };

      // Strip price if magasinier
      if (isMagasinier) {
        delete payload.prix_unitaire;
      }

      const newArticle = await createArticle(payload);

      setArticles((prev) => [newArticle, ...prev]);
      setShowDuplicateModal(false);
      setShowForm(false);
      setLiveDuplicates([]);
      setFormData(INITIAL_FORM);

      setHighlightedArticleId(newArticle.id);
      setSuccessMessage(
        `Article ${newArticle.reference} enregistré avec succès.`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Impossible de créer l'article. Veuillez vérifier les informations saisies.";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setCreating(false);
    }
  }

  // View Fiche Article
  function handleViewArticle(article: Article) {
    setSelectedArticle(article);
    setShowDetailsModal(true);
  }

  // Edit Article
  function handleEditArticle(article: Article) {
    setEditingArticle(article);
    setShowEditModal(true);
  }

  // Update Article in Local State after editing
  function handleArticleUpdated(updated: Article) {
    setArticles((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setHighlightedArticleId(updated.id);
    setSuccessMessage(`Article ${updated.reference} mis à jour avec succès.`);
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  // Archive Article
  function handlePromptArchive(article: Article) {
    setArchivingArticle(article);
    setShowArchiveModal(true);
  }

  async function handleConfirmArchive() {
    if (!archivingArticle) return;
    try {
      setArchiving(true);
      await archiveArticle(archivingArticle.id);

      // Update status in state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === archivingArticle.id ? { ...a, statut: "archive" } : a
        )
      );

      setShowArchiveModal(false);
      setSuccessMessage(`Article ${archivingArticle.reference} archivé avec succès.`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'archivage de l'article.");
    } finally {
      setArchiving(false);
    }
  }

  // Select an existing article from duplicates modal
  function handleSelectExistingArticle(article: Article) {
    setShowDuplicateModal(false);
    setShowForm(false);
    setSearch(article.reference);
    setHighlightedArticleId(article.id);
    setSuccessMessage(
      `Article existant ${article.reference} sélectionné. Création de doublon évitée !`
    );
    setTimeout(() => setSuccessMessage(""), 6000);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <LuCircleCheck size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            <LuX size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestion des Articles (PDR)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Référentiel centralisé des pièces de rechange, consommables, bandes convoyeurs et lubrifiants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                "Export_Articles_PDR",
                filteredArticles.map((a) => ({
                  Reference: a.reference,
                  Description: a.description,
                  Type: a.type,
                  Statut: a.statut,
                  Marque: a.marque || "",
                  SAP_Oracle: a.code_sap_oracle || "",
                  Unite: a.unite,
                  Famille: a.famille || "",
                  Criticite: a.criticite || "",
                  Prix_Unitaire_MAD: a.prix_unitaire || "",
                  Seuil_Min: a.seuil_min || "",
                  Seuil_Max: a.seuil_max || "",
                }))
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Exporter la liste actuelle en fichier Excel / CSV"
          >
            <LuDownload size={15} />
            Export Excel
          </button>

          {canCreateArticle && !showForm && (
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-98"
            >
              <LuPlus size={16} />
              Nouvel Article
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards (Section 12.3) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Total Références</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{statsCount.total}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Articles Actifs</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{statsCount.actifs}</p>
        </div>

        <button
          type="button"
          onClick={() => setFilterSansPrix(!filterSansPrix)}
          className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
            filterSansPrix
              ? "border-amber-300 bg-amber-50/80 ring-2 ring-amber-400"
              : "border-slate-200 bg-white hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Sans Prix Renseigné</p>
            {filterSansPrix && <span className="text-[10px] font-bold text-amber-700 uppercase">Filtré</span>}
          </div>
          <p className="mt-1 text-xl font-bold text-amber-600">{statsCount.sansPrix}</p>
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Archivés</p>
          <p className="mt-1 text-xl font-bold text-slate-400">{statsCount.archives}</p>
        </div>
      </div>

      {/* Add Article Form (Collapsible Card) */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg animate-in fade-in duration-200">
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-slate-50/50 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Création d'un article
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Renseignez les informations et vérifiez les doublons avant validation.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={creating || checkingDuplicates}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition disabled:opacity-50"
              title="Fermer"
            >
              <LuX size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            {/* Live Inline Duplicate Alert */}
            {liveDuplicates.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900">
                <div className="flex items-center gap-3">
                  <LuTriangleAlert size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {liveDuplicates.length} doublon(s) potentiel(s) détecté(s) dans la base !
                    </p>
                    <p className="text-xs text-amber-700">
                      Un article avec une référence ou des caractéristiques similaires est déjà enregistré.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDuplicateArticles(liveDuplicates);
                    setShowDuplicateModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition shrink-0"
                >
                  <LuEye size={14} />
                  Examiner les doublons
                </button>
              </div>
            )}

            {/* Section 1: Données obligatoires (Section 5.2) */}
            <div>
              <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Données obligatoires à la création *
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Type d'article */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Type d'article *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
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

                {/* Référence article */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Référence Article *
                    </label>
                    {liveDuplicates.some(
                      (d) =>
                        d.reference?.toLowerCase() ===
                        formData.reference.toLowerCase().trim()
                    ) && (
                      <span className="text-xs font-bold text-red-600">
                        Réf déjà prise !
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Ex: REF-001, SKF-6205..."
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none transition ${
                      liveDuplicates.some(
                        (d) =>
                          d.reference?.toLowerCase() ===
                          formData.reference.toLowerCase().trim()
                      )
                        ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-600 focus:ring-red-100"
                        : "border-slate-300 focus:border-green-600 focus:ring-green-100"
                    }`}
                    required
                  />
                </div>

                {/* Unité de mesure */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Unité de mesure *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="unite"
                      list="common-units"
                      value={formData.unite}
                      onChange={handleInputChange}
                      placeholder="Ex: pièce, mètre, kg..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      required
                    />
                    <datalist id="common-units">
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Statut initial */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Statut de l'article *
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
              </div>

              {/* Description de l'article */}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Description de l'article *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex: Roulement à billes SKF 6205-2RSH"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>
            </div>

            {/* Section 2: Identification & Références fournisseurs (Section 5.3) */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Identification & Références fournisseurs (Section 5.3)
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Marque
                  </label>
                  <input
                    type="text"
                    name="marque"
                    value={formData.marque}
                    onChange={handleInputChange}
                    placeholder="Ex: SKF, FAG, Siemens..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Fabricant / Constructeur
                  </label>
                  <input
                    type="text"
                    name="fabricant"
                    value={formData.fabricant}
                    onChange={handleInputChange}
                    placeholder="Ex: SKF Group"
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
                    value={formData.code_sap_oracle}
                    onChange={handleInputChange}
                    placeholder="Ex: SAP-450098"
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
                    value={formData.reference_constructeur}
                    onChange={handleInputChange}
                    placeholder="Ex: 6205-2RSH"
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
                    value={formData.famille}
                    onChange={handleInputChange}
                    placeholder="Ex: Mécanique, Électrique..."
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
                    value={formData.sous_famille}
                    onChange={handleInputChange}
                    placeholder="Ex: Roulements, Moteurs..."
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

            {/* Dynamic Typology Section (Sections 4.2, 4.3, 4.4) */}
            {formData.type === "bande_convoyeur" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
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
                      placeholder="Ex: 800"
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
                      placeholder="Ex: 120"
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
                      placeholder="Ex: 10"
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
                      placeholder="Ex: 3"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Qualité revêtement</label>
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
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
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
                      placeholder="Ex: Fût 200L, Bidon 20L"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === "interchangeable" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
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
                      {articles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.reference} — {c.description} ({c.marque || "Sans marque"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Note d'équivalence technique</label>
                    <input
                      type="text"
                      name="equivalence"
                      value={formData.equivalence || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Remplacement direct sans adaptation"
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seuil_min: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="0"
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seuil_max: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="0"
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock_securite: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="0"
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        delai_approvisionnement: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="Ex: 15"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Règle Magasinier sur le Prix (Section 3.1) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Prix unitaire estimé (MAD)
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
                    min="0"
                    step="0.01"
                    disabled={isMagasinier}
                    value={formData.prix_unitaire ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prix_unitaire: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder={isMagasinier ? "Attribué par le BDM" : "0.00"}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                      isMagasinier
                        ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Devise
                  </label>
                  <input
                    type="text"
                    name="devise"
                    disabled={isMagasinier}
                    value={formData.devise}
                    onChange={handleInputChange}
                    placeholder="MAD"
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
                Commentaires / Notes techniques
              </label>
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                rows={2}
                placeholder="Spécifications particulières, équipement cible..."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Error Message */}
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={closeForm}
                disabled={creating || checkingDuplicates}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={creating || checkingDuplicates}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition active:scale-98 disabled:opacity-50"
              >
                {checkingDuplicates ? (
                  <>
                    <LuRefreshCw size={16} className="animate-spin" />
                    Vérification des doublons...
                  </>
                ) : creating ? (
                  <>
                    <LuRefreshCw size={16} className="animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <LuCheck size={18} />
                    Valider & Enregistrer l'article
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Filter and Search Bar (Section 11) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <LuSearch
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher par référence, constructeur, description, marque, code SAP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <LuX size={16} />
              </button>
            )}
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-2xs"
          >
            <option value="">Tous les types</option>
            {ARTICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Filter Statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-2xs"
          >
            <option value="">Tous les statuts</option>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Filter Criticité */}
          <select
            value={filterCriticite}
            onChange={(e) => setFilterCriticite(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-2xs"
          >
            <option value="">Toutes criticités</option>
            {CRITICALITY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                Criticité {c.label}
              </option>
            ))}
          </select>

          {(search || filterType || filterStatut || filterCriticite || filterSansPrix) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterType("");
                setFilterStatut("");
                setFilterCriticite("");
                setFilterSansPrix(false);
              }}
              className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              title="Réinitialiser les filtres"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500 shadow-sm">
          <LuRefreshCw size={20} className="animate-spin text-green-600 mr-2" />
          Chargement du catalogue des articles...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadArticles}
            className="text-xs font-bold underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Articles Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Référence
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Description
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Marque
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Code SAP
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Prix (MAD)
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => {
                  const isHighlighted = highlightedArticleId === article.id;
                  const isArchived = article.statut === "archive";

                  return (
                    <tr
                      key={article.id}
                      className={`transition ${
                        isHighlighted
                          ? "bg-green-50/70 ring-2 ring-green-500/30"
                          : isArchived
                          ? "bg-slate-50/50 opacity-65"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Reference */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleViewArticle(article)}
                          className="font-mono font-bold text-slate-900 hover:text-green-600 transition flex items-center gap-1.5"
                          title="Cliquer pour voir la fiche article"
                        >
                          {article.reference}
                        </button>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                        {article.description}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {article.type}
                        </span>
                      </td>

                      {/* Marque */}
                      <td className="px-6 py-4 text-slate-600">
                        {article.marque || "-"}
                      </td>

                      {/* Code SAP / Oracle */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {article.code_sap_oracle || "-"}
                      </td>

                      {/* Prix (MAD) */}
                      <td className="px-6 py-4 text-xs font-medium">
                        {article.prix_unitaire != null ? (
                          <span className="text-slate-900 font-semibold">
                            {Number(article.prix_unitaire).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            article.statut === "actif"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : article.statut === "brouillon"
                              ? "bg-slate-100 text-slate-700"
                              : article.statut === "archive"
                              ? "bg-zinc-100 text-zinc-500 border border-zinc-200"
                              : article.statut === "obsolete"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {article.statut || "actif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Consulter */}
                          <button
                            type="button"
                            onClick={() => handleViewArticle(article)}
                            title="Consulter la fiche article"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <LuEye size={17} />
                          </button>

                          {/* Modifier (RBAC) */}
                          {canEditArticle && !isArchived && (
                            <button
                              type="button"
                              onClick={() => handleEditArticle(article)}
                              title="Modifier l'article"
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                            >
                              <LuPencil size={16} />
                            </button>
                          )}

                          {/* Valoriser le prix (Responsable BDM - Section 8) */}
                          {role === "responsable_bdm" && !isArchived && (
                            <button
                              type="button"
                              onClick={() => {
                                setArticleToValuate(article);
                                setShowValuationModal(true);
                              }}
                              title="Valoriser / Définir le prix unitaire (Section 8)"
                              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <LuCircleDollarSign size={17} />
                            </button>
                          )}

                          {/* Archiver (BDM / Responsable BDM - Section 14) */}
                          {canArchiveArticle && !isArchived && (
                            <button
                              type="button"
                              onClick={() => handlePromptArchive(article)}
                              title="Archiver l'article (Désactivation logique)"
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <LuArchive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredArticles.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-semibold text-slate-700">
                          Aucun article trouvé
                        </p>
                        <p className="text-xs text-slate-400">
                          {search || filterType || filterStatut || filterCriticite || filterSansPrix
                            ? "Essayez d'ajuster vos critères de recherche ou vos filtres."
                            : "Aucun article enregistré pour le moment. Créez-en un avec le bouton ci-dessus."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total affiché : <strong>{filteredArticles.length}</strong> / {articles.length} article{articles.length > 1 ? "s" : ""}
            </span>
            {role === "viewer" ? (
              <span className="italic">
                Mode consultation (Lecture seule)
              </span>
            ) : isMagasinier ? (
              <span className="text-slate-400">
                Droits magasinier : modification des articles sans accès aux prix
              </span>
            ) : (
              <span className="text-slate-400">
                Droits avancés BDM : valorisation et archivage autorisés
              </span>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicateArticles}
        newArticleData={formData}
        onConfirmCreate={executeCreateArticle}
        onViewArticle={handleViewArticle}
        onSelectExistingArticle={handleSelectExistingArticle}
        creating={creating}
      />

      {/* Article Specification Details Modal (Fiche Article) */}
      <ArticleDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        article={selectedArticle}
        onSelectArticle={handleSelectExistingArticle}
      />

      {/* Edit Article Modal (Modification) */}
      <EditArticleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        article={editingArticle}
        onSuccess={handleArticleUpdated}
        allArticles={articles}
      />

      {/* Archive Confirmation Modal (Archivage logique Section 14) */}
      <ArchiveConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        article={archivingArticle}
        onConfirm={handleConfirmArchive}
        loading={archiving}
      />

      {/* Valuation Modal (Section 8) */}
      <ValuationModal
        isOpen={showValuationModal}
        onClose={() => setShowValuationModal(false)}
        article={articleToValuate}
        onPriceUpdated={(updated) => {
          setArticles((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          setSuccessMessage(
            `Prix unitaire de l'article ${updated.reference} mis à jour : ${updated.prix_unitaire} MAD.`
          );
          setTimeout(() => setSuccessMessage(""), 4000);
        }}
      />
    </div>
  );
}