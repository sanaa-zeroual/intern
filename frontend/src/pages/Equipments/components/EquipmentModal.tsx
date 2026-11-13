import { useState, useEffect } from "react";
import { LuX, LuLayers } from "react-icons/lu";
import type { Equipment, CreateEquipmentData } from "../../../types/equipment.types";

type EquipmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEquipmentData) => Promise<void>;
  equipmentToEdit?: Equipment | null;
  parentEquipment?: Equipment | null;
  allEquipments: Equipment[];
};

export default function EquipmentModal({
  isOpen,
  onClose,
  onSubmit,
  equipmentToEdit,
  parentEquipment,
  allEquipments,
}: EquipmentModalProps) {
  const [formData, setFormData] = useState<CreateEquipmentData>({
    code_equipement: "",
    nom: "",
    description: "",
    localisation: "",
    zone: "",
    ligne: "",
    statut: "en_service",
    criticite: "moyenne",
    responsable_technique: "",
    parent_id: undefined,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (equipmentToEdit) {
      setFormData({
        code_equipement: equipmentToEdit.code_equipement || "",
        nom: equipmentToEdit.nom || "",
        description: equipmentToEdit.description || "",
        localisation: equipmentToEdit.localisation || "",
        zone: equipmentToEdit.zone || "",
        ligne: equipmentToEdit.ligne || "",
        statut: equipmentToEdit.statut || "en_service",
        criticite: equipmentToEdit.criticite || "moyenne",
        responsable_technique: equipmentToEdit.responsable_technique || "",
        parent_id: equipmentToEdit.parent_id || undefined,
      });
    } else {
      setFormData({
        code_equipement: "",
        nom: "",
        description: "",
        localisation: parentEquipment?.localisation || "",
        zone: parentEquipment?.zone || "",
        ligne: parentEquipment?.ligne || "",
        statut: "en_service",
        criticite: parentEquipment?.criticite || "moyenne",
        responsable_technique: "",
        parent_id: parentEquipment ? parentEquipment.id : undefined,
      });
    }
    setError("");
  }, [equipmentToEdit, parentEquipment, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code_equipement.trim() || !formData.nom.trim()) {
      setError("Le code et le nom de l'équipement sont obligatoires.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement de l'équipement."
      );
    } finally {
      setSaving(false);
    }
  }

  // Filter out self and descendants to avoid cyclical parenting
  const eligibleParents = allEquipments.filter(
    (e) => !equipmentToEdit || e.id !== equipmentToEdit.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <LuLayers size={20} />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {equipmentToEdit
                  ? `Modifier : ${equipmentToEdit.nom}`
                  : parentEquipment
                  ? `Nouveau sous-équipement (${parentEquipment.code_equipement})`
                  : "Nouvel Équipement / Installation"}
              </h2>
              <p className="text-xs text-slate-500">
                Structure hiérarchique de maintenance (Section 10.2 & 10.3)
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code Équipement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: CV-101, RED-02"
                value={formData.code_equipement}
                onChange={(e) =>
                  setFormData({ ...formData, code_equipement: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de l'équipement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Convoyeur Principal, Réducteur"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Équipement Parent (Hiérarchie)
            </label>
            <select
              value={formData.parent_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parent_id: e.target.value ? e.target.value : undefined,
                })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="">-- Aucun (Équipement racine / Installation) --</option>
              {eligibleParents.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.code_equipement} — {eq.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Localisation
              </label>
              <input
                type="text"
                placeholder="Ex: Atelier Nord"
                value={formData.localisation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, localisation: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Zone
              </label>
              <input
                type="text"
                placeholder="Ex: Broyage, Criblage"
                value={formData.zone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, zone: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ligne / Installation
              </label>
              <input
                type="text"
                placeholder="Ex: Ligne 1"
                value={formData.ligne || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ligne: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut: e.target.value as any,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="en_service">En service</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="a_l_arret">À l'arrêt</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Criticité
              </label>
              <select
                value={formData.criticite}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criticite: e.target.value as any,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsable Technique
              </label>
              <input
                type="text"
                placeholder="Ex: Ingénieur Méc."
                value={formData.responsable_technique || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsable_technique: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes techniques
            </label>
            <textarea
              rows={2}
              placeholder="Caractéristiques ou spécifications..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : equipmentToEdit
                ? "Mettre à jour"
                : "Créer l'équipement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
