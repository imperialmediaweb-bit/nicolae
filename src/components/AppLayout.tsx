"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import HappyLogo from "./HappyLogo";

interface User {
  id: string;
  name: string;
  role: string;
  username: string;
}

interface Notification {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  medicationId: string;
  medicationName: string;
  category: string;
}

const UserContext = createContext<User | null>(null);
export function useUser() { return useContext(UserContext); }

const navItems = [
  { name: "Acasa", href: "/dashboard", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { name: "Persoane", href: "/beneficiari", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { name: "Note", href: "/evaluari", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { name: "Farmacie", href: "/farmacie", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )},
  { name: "Chat AI", href: "/chat", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )},
];

export default function AppLayout({ children, title, backHref }: { children: React.ReactNode; title?: string; backHref?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Neautorizat");
        return r.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Fetch notifications
  const fetchNotifications = useCallback(() => {
    fetch("/api/notificari")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setNotifCount(data.count);
          setCriticalCount(data.critical);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchNotifications();
      // Refresh every 60s
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [loading, user, fetchNotifications]);

  // Browser notification for critical alerts
  useEffect(() => {
    if (criticalCount > 0 && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        const critical = notifications.filter((n) => n.severity === "critical" && !notifDismissed.has(n.id));
        if (critical.length > 0) {
          new Notification("Casa Nicolae - Alerta Farmacie", {
            body: `${critical.length} alerte critice: ${critical.map((n) => n.medicationName).join(", ")}`,
            icon: "/icon-192.png",
            tag: "pharmacy-alert",
          });
        }
      }
    }
  }, [criticalCount, notifications, notifDismissed]);

  function dismissNotif(id: string) {
    setNotifDismissed((prev) => new Set([...prev, id]));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const activeNotifs = notifications.filter((n) => !notifDismissed.has(n.id));
  const activeBadge = activeNotifs.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <HappyLogo size={80} />
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Top header - mobile optimized */}
        {title && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 safe-top">
            <div className="flex items-center gap-3">
              {backHref && (
                <Link href={backHref} className="p-1 -ml-1">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{title}</h1>
              {/* Profile button in header */}
              <button onClick={() => setProfileOpen(!profileOpen)} className="p-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {/* Notification bell in header */}
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 -mr-2">
                <svg className={`w-6 h-6 ${activeBadge > 0 ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {activeBadge > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1 ${
                    activeNotifs.some((n) => n.severity === "critical") ? "bg-red-500 animate-pulse" : "bg-orange-500"
                  }`}>
                    {activeBadge}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dashboard top buttons (no title header) */}
        {!title && (
          <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
            {/* Profile button */}
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="bg-white rounded-full p-2.5 shadow-lg border border-gray-100 active:scale-95 transition-all">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {/* Notification bell */}
            {activeBadge > 0 && (
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative bg-white rounded-full p-2.5 shadow-lg border border-gray-100 active:scale-95 transition-all">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className={`absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-white text-[11px] font-bold px-1 ${
                  activeNotifs.some((n) => n.severity === "critical") ? "bg-red-500 animate-pulse" : "bg-orange-500"
                }`}>
                  {activeBadge}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Profile/Logout dropdown */}
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setProfileOpen(false)} />
            <div className="fixed top-14 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-400">@{user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3.5 text-left text-sm text-red-600 font-medium flex items-center gap-3 active:bg-red-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Deconectare
              </button>
            </div>
          </>
        )}

        {/* Notifications panel (overlay) */}
        {notifOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setNotifOpen(false)} />
            <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white z-50 shadow-2xl overflow-y-auto safe-top">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Notificari</h2>
                  <p className="text-xs text-gray-400">{activeNotifs.length} active</p>
                </div>
                <div className="flex items-center gap-2">
                  {activeNotifs.length > 0 && (
                    <button onClick={() => setNotifDismissed(new Set(notifications.map((n) => n.id)))}
                      className="text-xs text-indigo-600 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg active:scale-95 transition">
                      Ignora toate
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="p-2 -mr-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {activeNotifs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900">Totul e in regula!</p>
                    <p className="text-sm text-gray-400 mt-1">Nicio alerta activa</p>
                  </div>
                ) : (
                  activeNotifs.map((notif) => (
                    <div key={notif.id} className={`rounded-2xl p-4 border ${
                      notif.severity === "critical"
                        ? "bg-red-50 border-red-100"
                        : "bg-orange-50 border-orange-100"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${
                          notif.severity === "critical" ? "bg-red-100" : "bg-orange-100"
                        }`}>
                          {notif.type === "expirat" || notif.type === "expira_curand" ? (
                            <svg className={`w-5 h-5 ${notif.severity === "critical" ? "text-red-600" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className={`w-5 h-5 ${notif.severity === "critical" ? "text-red-600" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${
                              notif.severity === "critical" ? "text-red-800" : "text-orange-800"
                            }`}>{notif.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              notif.severity === "critical" ? "bg-red-200 text-red-700" : "bg-orange-200 text-orange-700"
                            }`}>{notif.category}</span>
                          </div>
                          <p className={`text-xs mt-1 ${
                            notif.severity === "critical" ? "text-red-600" : "text-orange-600"
                          }`}>{notif.message}</p>
                          <div className="flex items-center gap-2 mt-2.5">
                            <Link href={`/farmacie/${notif.medicationId}`}
                              onClick={() => setNotifOpen(false)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                                notif.severity === "critical"
                                  ? "bg-red-600 text-white active:bg-red-700"
                                  : "bg-orange-600 text-white active:bg-orange-700"
                              } transition`}>
                              Vezi medicament
                            </Link>
                            <button onClick={() => dismissNotif(notif.id)}
                              className="text-xs text-gray-400 px-3 py-1.5 active:bg-gray-100 rounded-lg transition">
                              Ignora
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <main className="px-4 py-4 max-w-lg mx-auto">
          {children}
        </main>

        {/* Bottom navigation - fixed, mobile-optimized */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
          <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isFarmacie = item.href === "/farmacie";
              return (
                <Link key={item.href} href={item.href}
                  className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[56px] transition-all ${
                    isActive ? "bg-indigo-50" : ""
                  }`}>
                  {item.icon(isActive)}
                  <span className={`text-[10px] font-medium ${isActive ? "text-indigo-600" : "text-gray-400"}`}>
                    {item.name}
                  </span>
                  {/* Badge on Farmacie nav item */}
                  {isFarmacie && activeBadge > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold px-0.5 ${
                      activeNotifs.some((n) => n.severity === "critical") ? "bg-red-500" : "bg-orange-500"
                    }`}>
                      {activeBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </UserContext.Provider>
  );
}
