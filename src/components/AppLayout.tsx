"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import HappyLogo from "./HappyLogo";

interface User {
  id: string;
  name: string;
  role: string;
  username: string;
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
  { name: "Evaluari", href: "/evaluari", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { name: "Farmacie", href: "/farmacie", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )},
  { name: "Rapoarte", href: "/rapoarte", icon: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
];

export default function AppLayout({ children, title, backHref }: { children: React.ReactNode; title?: string; backHref?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
              <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="px-4 py-4 max-w-lg mx-auto">
          {children}
        </main>

        {/* Bottom navigation - fixed, mobile-optimized */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
          <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[56px] transition-all ${
                    isActive ? "bg-indigo-50" : ""
                  }`}>
                  {item.icon(isActive)}
                  <span className={`text-[10px] font-medium ${isActive ? "text-indigo-600" : "text-gray-400"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </UserContext.Provider>
  );
}
