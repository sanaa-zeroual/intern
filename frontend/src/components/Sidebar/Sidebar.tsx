import { NavLink } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuFileText,
  LuPackage,
  LuLayers,
} from "react-icons/lu";

import { useAuth } from "../../context/AuthContext";

type UserRole =
  | "magasinier"
  | "viewer"
  | "bdm"
  | "responsable_bdm";

export default function Sidebar() {
  const { user } = useAuth();

  const role = user?.role as UserRole | undefined;

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LuLayoutDashboard,
      allowedRoles: [
        "magasinier",
        "viewer",
        "bdm",
        "responsable_bdm",
      ],
    },
    {
      to: "/articles",
      label: "Articles",
      icon: LuFileText,
      allowedRoles: [
        "magasinier",
        "viewer",
        "bdm",
        "responsable_bdm",
      ],
    },
    {
      to: "/stock",
      label: "Stock",
      icon: LuPackage,
      allowedRoles: [
        "magasinier",
        "viewer",
        "bdm",
        "responsable_bdm",
      ],
    },
    {
      to: "/equipements",
      label: "Équipements & BOM",
      icon: LuLayers,
      allowedRoles: [
        "magasinier",
        "viewer",
        "bdm",
        "responsable_bdm",
      ],
    },
  ];

  const visibleLinks = links.filter((link) =>
    role ? link.allowedRoles.includes(role) : false
  );

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="text-xl font-bold text-green-600">
          OCP
        </div>

        <p className="mt-1 text-xs text-slate-500">
          PDR Maintenance
        </p>

        {user && (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-800">
              {user.name}
            </p>

            <p className="text-xs text-slate-500 capitalize">
              {user.role}
            </p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {visibleLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}