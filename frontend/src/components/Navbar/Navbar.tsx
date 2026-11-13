import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuBell,
  LuLogOut,
  LuCheck,
  LuTriangleAlert,
  LuPackage,
  LuCircleDollarSign,
  LuClock,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getStockNotifications,
  markNotificationRead,
} from "../../services/stock.service";
import type { StockNotification } from "../../types/stock.types";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll every 30 seconds for background updates
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await getStockNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  async function handleMarkAsRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const roleLabels: Record<string, string> = {
    magasinier: "Magasinier",
    viewer: "Consultation (Viewer)",
    bdm: "Gestionnaire BDM",
    responsable_bdm: "Responsable BDM",
  };

  const roleColors: Record<string, string> = {
    magasinier: "bg-blue-50 text-blue-700 border-blue-200",
    viewer: "bg-slate-50 text-slate-700 border-slate-200",
    bdm: "bg-purple-50 text-purple-700 border-purple-200",
    responsable_bdm: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-slate-900 tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold shadow-sm">
              M
            </span>
            <div className="flex flex-col">
              <span className="leading-tight text-slate-900 font-semibold">
                MC01 Maintenance
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                PDR & Consommables
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-4">
          {/* Notifications Center */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Centre de notifications"
            >
              <LuBell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                        {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={loadNotifications}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Actualiser
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs transition-colors rounded-xl ${
                          notif.lu ? "bg-white opacity-70" : "bg-emerald-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {notif.type === "ENTREE_JESA_OCP" ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                  <LuCircleDollarSign size={14} />
                                </span>
                              ) : notif.type === "RUPTURE_STOCK" ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                  <LuTriangleAlert size={14} />
                                </span>
                              ) : (
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                  <LuPackage size={14} />
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">
                                {notif.titre}
                              </p>
                              <p className="text-slate-600 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                                <LuClock size={11} />
                                {new Date(notif.createdAt).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          {!notif.lu && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              title="Marquer comme lu"
                              className="shrink-0 p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-white"
                            >
                              <LuCheck size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role badge */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-800">
                  {user.name || user.email}
                </span>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    roleColors[user.role] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {roleLabels[user.role] || user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                title="Déconnexion"
              >
                <LuLogOut size={14} />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
