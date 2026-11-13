import { useState, useEffect } from "react";
import {
  LuLayers,
  LuPlus,
  LuSearch,
  LuPencil,
  LuTrash2,
  LuRefreshCw,
  LuChevronRight,
  LuMapPin,
  LuUser,
  LuBoxes,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentBom,
  addBomItem,
  removeBomItem,
} from "../../services/equipments.service";
import { getArticles } from "../../services/articles.service";
import type {
  Equipment,
  BomDetailedItem,
  CreateEquipmentData,
  CreateBomItemData,
} from "../../types/equipment.types";
import type { Article } from "../../types/article.types";

import EquipmentModal from "./components/EquipmentModal";
import BomItemModal from "./components/BomItemModal";

export default function Equipments() {
  const { user } = useAuth();
  const role = user?.role;

  // Permission: BDM & Responsable BDM can edit equipment and BOM
  const canManageBOM = role === "bdm" || role === "responsable_bdm";

  // State
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [bomItems, setBomItems] = useState<BomDetailedItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingBom, setLoadingBom] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  // Modals state
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
  const [parentEquipmentForNew, setParentEquipmentForNew] =
    useState<Equipment | null>(null);

  const [showBomModal, setShowBomModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [equipData, artData] = await Promise.all([
        getEquipments(),
        getArticles(),
      ]);
      setAllEquipments(equipData);
      setArticles(artData);

      // Default selection to first equipment if none selected
      if (equipData.length > 0 && !selectedEquipment) {
        selectEquipment(equipData[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger les données des équipements.");
    } finally {
      setLoading(false);
    }
  }

  async function selectEquipment(eq: Equipment) {
    setSelectedEquipment(eq);
    try {
      setLoadingBom(true);
      const items = await getEquipmentBom(eq.id);
      setBomItems(items);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger la BOM de l'équipement.");
    } finally {
      setLoadingBom(false);
    }
  }

  // Equipment actions
  async function handleSaveEquipment(data: CreateEquipmentData) {
    if (equipmentToEdit) {
      await updateEquipment(equipmentToEdit.id, data);
      setSuccessMessage("Équipement mis à jour avec succès.");
    } else {
      await createEquipment(data);
      setSuccessMessage("Nouvel équipement créé avec succès.");
    }
    const freshEquips = await getEquipments();
    setAllEquipments(freshEquips);
    if (selectedEquipment) {
      const refreshedSelected = freshEquips.find(
        (e) => e.id === selectedEquipment.id
      );
      if (refreshedSelected) setSelectedEquipment(refreshedSelected);
    }
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  async function handleDeleteEquipment(eq: Equipment) {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'équipement "${eq.code_equipement} — ${eq.nom}" ? Cette action est irréversible.`
      )
    ) {
      return;
    }
    try {
      await deleteEquipment(eq.id);
      setSuccessMessage("Équipement supprimé avec succès.");
      const fresh = await getEquipments();
      setAllEquipments(fresh);
      if (selectedEquipment?.id === eq.id) {
        setSelectedEquipment(fresh[0] || null);
        if (fresh[0]) selectEquipment(fresh[0]);
        else setBomItems([]);
      }
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression de l'équipement.");
    }
  }

  // BOM actions
  async function handleAddBomItem(data: CreateBomItemData) {
    await addBomItem(data);
    setSuccessMessage("Article ajouté à la nomenclature BOM.");
    if (selectedEquipment) {
      const freshBom = await getEquipmentBom(selectedEquipment.id);
      setBomItems(freshBom);
    }
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  async function handleRemoveBomItem(bomItemId: string) {
    if (
      !window.confirm(
        "Voulez-vous vraiment retirer cet article de la nomenclature de cet équipement ?"
      )
    ) {
      return;
    }
    try {
      await removeBomItem(bomItemId);
      setSuccessMessage("Article retiré de la BOM.");
      if (selectedEquipment) {
        const freshBom = await getEquipmentBom(selectedEquipment.id);
        setBomItems(freshBom);
      }
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du retrait de l'article de la BOM.");
    }
  }

  // Filtered equipments list
  const filteredEquipments = allEquipments.filter((e) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      e.code_equipement.toLowerCase().includes(q) ||
      e.nom.toLowerCase().includes(q) ||
      e.localisation?.toLowerCase().includes(q) ||
      e.ligne?.toLowerCase().includes(q) ||
      e.zone?.toLowerCase().includes(q)
    );
  });

  // Calculate BOM KPIs
  const totalInstalledParts = bomItems.reduce(
    (sum, item) => sum + item.quantite_installee,
    0
  );
  const countRuptureBom = bomItems.filter(
    (item) => item.statut_disponibilite === "RUPTURE"
  ).length;
  const countPartielBom = bomItems.filter(
    (item) => item.statut_disponibilite === "PARTIEL"
  ).length;
  const totalBomValueMad = bomItems.reduce(
    (sum, item) => sum + item.valeur_disponible_mad,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <LuLayers size={22} />
            </span>
            Gestion BOM & Équipements (Section 10)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nomenclature des installations, équipements, sous-équipements et analyse du stock disponible.
          </p>
        </div>

        {canManageBOM && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEquipmentToEdit(null);
                setParentEquipmentForNew(null);
                setShowEquipmentModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              <LuPlus size={16} />
              Nouvel Équipement
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Equipment Tree / List */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-sm text-slate-900">
              Installations & Équipements ({allEquipments.length})
            </span>
            <button
              onClick={loadData}
              title="Actualiser"
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <LuRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <LuSearch
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Chercher par code, nom, zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-purple-500 focus:outline-hidden"
            />
          </div>

          {/* Equipment Items */}
          <div className="max-h-[620px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
            {filteredEquipments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aucun équipement trouvé.
              </div>
            ) : (
              filteredEquipments.map((eq) => {
                const isSelected = selectedEquipment?.id === eq.id;
                const isChild = !!eq.parent_id;

                return (
                  <div
                    key={eq.id}
                    onClick={() => selectEquipment(eq)}
                    className={`cursor-pointer rounded-xl p-3 text-xs transition-all border ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/50 shadow-xs"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    } ${isChild ? "ml-4" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {isChild && (
                            <span className="text-[10px] text-slate-400">↳</span>
                          )}
                          <span className="font-bold text-slate-900">
                            {eq.code_equipement}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                              eq.criticite === "haute"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : eq.criticite === "moyenne"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {eq.criticite}
                          </span>
                        </div>
                        <p className="font-medium text-slate-700 leading-tight">
                          {eq.nom}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <LuMapPin size={11} />
                          {eq.localisation || eq.zone || eq.ligne || "Non localisé"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            eq.statut === "en_service"
                              ? "bg-emerald-50 text-emerald-700"
                              : eq.statut === "en_maintenance"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {eq.statut.replace("_", " ")}
                        </span>
                        <LuChevronRight
                          size={14}
                          className={
                            isSelected ? "text-purple-600" : "text-slate-300"
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Equipment BOM & Stock Comparison */}
        <div className="lg:col-span-8 space-y-6">
          {selectedEquipment ? (
            <>
              {/* Equipment Header Banner */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                        {selectedEquipment.code_equipement}
                      </span>
                      <span className="text-slate-400 font-light">|</span>
                      <span className="font-bold text-lg text-slate-700">
                        {selectedEquipment.nom}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <LuMapPin size={13} className="text-slate-400" />
                        Zone: {selectedEquipment.zone || "N/A"} · Ligne:{" "}
                        {selectedEquipment.ligne || "N/A"}
                      </span>
                      {selectedEquipment.responsable_technique && (
                        <span className="flex items-center gap-1">
                          <LuUser size={13} className="text-slate-400" />
                          Resp: {selectedEquipment.responsable_technique}
                        </span>
                      )}
                    </div>
                  </div>

                  {canManageBOM && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEquipmentToEdit(selectedEquipment);
                          setParentEquipmentForNew(null);
                          setShowEquipmentModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <LuPencil size={13} />
                        Modifier
                      </button>

                      <button
                        onClick={() => {
                          setEquipmentToEdit(null);
                          setParentEquipmentForNew(selectedEquipment);
                          setShowEquipmentModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 px-3 py-1.5 text-xs font-semibold hover:bg-purple-100"
                        title="Créer un sous-équipement dépendant de celui-ci"
                      >
                        <LuPlus size={13} />
                        Sous-équipement
                      </button>

                      {role === "responsable_bdm" && (
                        <button
                          onClick={() => handleDeleteEquipment(selectedEquipment)}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50"
                          title="Supprimer l'équipement"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* KPI Cards for Selected Equipment BOM */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">
                      Pièces Installées
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {totalInstalledParts}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({bomItems.length} réf)
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                    <p className="text-[11px] font-semibold text-rose-400 uppercase">
                      En Rupture Stock
                    </p>
                    <p className="mt-1 text-xl font-bold text-rose-600">
                      {countRuptureBom}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase">
                      Stock Partiel
                    </p>
                    <p className="mt-1 text-xl font-bold text-amber-600">
                      {countPartielBom}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <p className="text-[11px] font-semibold text-emerald-500 uppercase">
                      Valeur Stock Dispo
                    </p>
                    <p className="mt-1 text-base font-bold text-emerald-700">
                      {totalBomValueMad.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px]">MAD</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* BOM Table - Section 10.6 & 18.4 */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <LuBoxes size={18} className="text-purple-600" />
                      Nomenclature des Pièces & Consommables (BOM)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparaison en temps réel entre le besoin installé et la disponibilité magasin par provenance.
                    </p>
                  </div>

                  {canManageBOM && (
                    <button
                      onClick={() => setShowBomModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm"
                    >
                      <LuPlus size={14} />
                      Affecter un article PDR
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Article / PDR</th>
                        <th className="px-3 py-3.5">Position / Repère</th>
                        <th className="px-3 py-3.5 text-center">Qté Installée</th>
                        <th className="px-3 py-3.5 text-center">Dispo Stock</th>
                        <th className="px-4 py-3.5">Détail par Provenance</th>
                        <th className="px-3 py-3.5 text-center">Statut</th>
                        {canManageBOM && (
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loadingBom ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Chargement de la BOM...
                          </td>
                        </tr>
                      ) : bomItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-slate-400"
                          >
                            Aucune pièce de rechange affectée à cet équipement pour
                            le moment.
                          </td>
                        </tr>
                      ) : (
                        bomItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            {/* Article Reference & Info */}
                            <td className="px-5 py-3">
                              <div className="font-bold text-slate-900">
                                {item.article.reference}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {item.article.description}
                              </div>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[9px] font-medium text-slate-600">
                                  {item.article.type}
                                </span>
                                {item.article_principal_ou_alternatif ===
                                  "alternatif" && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.2 text-[9px] font-medium text-blue-600">
                                    Alternatif
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Position */}
                            <td className="px-3 py-3">
                              <span className="font-medium text-slate-800">
                                {item.position || "—"}
                              </span>
                              {item.frequence_remplacement && (
                                <p className="text-[10px] text-slate-400">
                                  Fréq: {item.frequence_remplacement}
                                </p>
                              )}
                            </td>

                            {/* Installed Quantity */}
                            <td className="px-3 py-3 text-center font-bold text-slate-900">
                              {item.quantite_installee}{" "}
                              <span className="text-[10px] font-normal text-slate-500">
                                {item.unite}
                              </span>
                            </td>

                            {/* Available Stock */}
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`font-bold ${
                                  item.stock_disponible_total === 0
                                    ? "text-rose-600"
                                    : item.stock_disponible_total <
                                      item.quantite_installee
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {item.stock_disponible_total}
                              </span>
                            </td>

                            {/* Provenances Breakdown */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 font-medium">
                                  Annexe D:{" "}
                                  {item.stock_par_provenance["Annexe D"] || 0}
                                </span>
                                <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-purple-700 font-medium">
                                  JESA:{" "}
                                  {item.stock_par_provenance["JESA AM"] || 0}
                                </span>
                                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700 font-medium">
                                  ISE:{" "}
                                  {item.stock_par_provenance["OCP — ISE"] || 0}
                                </span>
                                <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-teal-700 font-medium">
                                  Cess:{" "}
                                  {item.stock_par_provenance["OCP — Cession"] ||
                                    0}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  item.statut_disponibilite === "DISPONIBLE"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.statut_disponibilite === "PARTIEL"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {item.statut_disponibilite === "DISPONIBLE"
                                  ? "En Stock"
                                  : item.statut_disponibilite === "PARTIEL"
                                  ? "Partiel"
                                  : "Rupture"}
                              </span>
                            </td>

                            {/* Actions */}
                            {canManageBOM && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleRemoveBomItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Retirer de la nomenclature"
                                >
                                  <LuTrash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              Sélectionnez un équipement dans la liste pour afficher sa nomenclature BOM.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EquipmentModal
        isOpen={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        onSubmit={handleSaveEquipment}
        equipmentToEdit={equipmentToEdit}
        parentEquipment={parentEquipmentForNew}
        allEquipments={allEquipments}
      />

      <BomItemModal
        isOpen={showBomModal}
        onClose={() => setShowBomModal(false)}
        onSubmit={handleAddBomItem}
        equipment={selectedEquipment}
        articles={articles}
      />
    </div>
  );
}
