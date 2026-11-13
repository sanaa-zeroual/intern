import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuUser,
  LuLayers,
} from "react-icons/lu";
import type { StockMovement } from "../../../types/stock.types";

type StockMovementsListProps = {
  movements: StockMovement[];
  loading: boolean;
};

export default function StockMovementsList({
  movements,
  loading,
}: StockMovementsListProps) {
  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Chargement de l'historique des mouvements...
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
        <LuLayers size={36} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          Aucun mouvement enregistré
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Les entrées et sorties de stock apparaîtront ici avec leur traçabilité complète.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="px-5 py-3.5">Date & Heure</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Article</th>
              <th className="px-5 py-3.5 text-right">Quantité</th>
              <th className="px-5 py-3.5">Provenance(s)</th>
              <th className="px-5 py-3.5">N° OT</th>
              <th className="px-5 py-3.5">Demandeur / Motif</th>
              <th className="px-5 py-3.5">Opérateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => {
              const isEntree = m.type === "ENTREE";
              return (
                <tr key={m.id} className="transition hover:bg-slate-50/70">
                  {/* Date */}
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isEntree
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isEntree ? (
                        <LuArrowDownLeft size={13} />
                      ) : (
                        <LuArrowUpRight size={13} />
                      )}
                      {m.type}
                    </span>
                  </td>

                  {/* Article */}
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">
                      {m.article?.reference || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">
                      {m.article?.description || ""}
                    </p>
                  </td>

                  {/* Quantité */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap font-bold text-slate-900">
                    {isEntree ? `+${m.quantite}` : `-${m.quantite}`}{" "}
                    <span className="text-[10px] font-normal text-slate-500">
                      {m.article?.unite || ""}
                    </span>
                  </td>

                  {/* Provenance */}
                  <td className="px-5 py-3.5 text-slate-700">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                      {m.provenance}
                    </span>
                  </td>

                  {/* N° OT (Section 9.5) */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {m.numero_ot ? (
                      <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        {m.numero_ot}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Demandeur / Motif */}
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-medium text-slate-800">{m.motif}</p>
                    {m.demandeur && (
                      <p className="text-[11px] text-slate-500">
                        Demandeur: {m.demandeur}
                      </p>
                    )}
                    {m.reference_document && (
                      <p className="text-[11px] text-slate-400">
                        Réf BL: {m.reference_document}
                      </p>
                    )}
                  </td>

                  {/* Opérateur */}
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <LuUser size={13} className="text-slate-400" />
                      <span>{m.user_name || "Système"}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
