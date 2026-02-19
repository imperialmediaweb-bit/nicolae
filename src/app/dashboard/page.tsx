"use client";

import { useEffect, useState } from "react";
import AppLayout, { useUser } from "@/components/AppLayout";
import Link from "next/link";
import HappyLogo from "@/components/HappyLogo";

interface Stats {
  beneficiari: number;
  evaluari: number;
  medicamente: number;
  alerteStoc: number;
}

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<Stats>({ beneficiari: 0, evaluari: 0, medicamente: 0, alerteStoc: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/beneficiari").then((r) => r.json()),
      fetch("/api/evaluari").then((r) => r.json()),
      fetch("/api/farmacie").then((r) => r.json()),
    ]).then(([ben, ev, med]) => {
      const meds = Array.isArray(med) ? med : [];
      setStats({
        beneficiari: Array.isArray(ben) ? ben.length : 0,
        evaluari: Array.isArray(ev) ? ev.length : 0,
        medicamente: meds.length,
        alerteStoc: meds.filter((m: { stock: number; minStock: number }) => m.stock <= m.minStock).length,
      });
    }).catch(() => {});
  }, []);

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    psiholog: "Psiholog",
    asistent: "Asistent social",
    farmacist: "Farmacist",
  };

  const menuCards = [
    {
      title: "Beneficiari",
      description: "Persoane inregistrate",
      count: stats.beneficiari,
      href: "/beneficiari",
      gradient: "from-blue-500 to-blue-600",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      actions: [
        { label: "Vezi lista", href: "/beneficiari" },
        { label: "+ Adauga", href: "/beneficiari/nou" },
      ],
    },
    {
      title: "Evaluari",
      description: "Profile psihosociale",
      count: stats.evaluari,
      href: "/evaluari",
      gradient: "from-emerald-500 to-green-600",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      actions: [
        { label: "Vezi evaluari", href: "/evaluari" },
        { label: "+ Noua evaluare", href: "/evaluari/nou" },
      ],
    },
    {
      title: "Farmacie",
      description: "Gestiune medicamente",
      count: stats.medicamente,
      href: "/farmacie",
      gradient: "from-purple-500 to-violet-600",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      actions: [
        { label: "Vezi stoc", href: "/farmacie" },
        { label: "+ Adauga", href: "/farmacie/nou" },
      ],
    },
    {
      title: "Rapoarte",
      description: "Genereaza fise PDF",
      count: null,
      href: "/rapoarte",
      gradient: "from-orange-500 to-amber-600",
      icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      actions: [
        { label: "Genereaza PDF", href: "/rapoarte" },
      ],
    },
  ];

  return (
    <AppLayout>
      {/* Header with logo and greeting */}
      <div className="flex items-center gap-4 mb-6">
        <HappyLogo size={50} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Salut, {user?.name?.split(" ")[0] || ""}!
          </h1>
          <p className="text-xs text-gray-500">{roleLabels[user?.role || ""] || user?.role}</p>
        </div>
      </div>

      {/* Alert card for low stock */}
      {stats.alerteStoc > 0 && (
        <Link href="/farmacie">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">{stats.alerteStoc} medicamente cu stoc scazut</p>
                <p className="text-xs text-red-600">Apasa pentru detalii</p>
              </div>
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Main menu cards */}
      <div className="space-y-4">
        {menuCards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-all">
            <Link href={card.href}>
              <div className={`bg-gradient-to-r ${card.gradient} p-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{card.title}</h2>
                      <p className="text-white/70 text-xs">{card.description}</p>
                    </div>
                  </div>
                  {card.count !== null && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{card.count}</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Sub-action buttons */}
            <div className="flex divide-x divide-gray-100">
              {card.actions.map((action) => (
                <Link key={action.href} href={action.href}
                  className="flex-1 py-3 text-center text-sm font-medium text-gray-600 active:bg-gray-50 transition">
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logout button */}
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="w-full mt-6 py-3 text-red-500 text-sm font-medium active:bg-red-50 rounded-2xl transition"
      >
        Deconectare
      </button>
    </AppLayout>
  );
}
