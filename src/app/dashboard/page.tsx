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
  categorii: number;
}

interface MedicationItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  category?: { name: string; color: string; icon: string };
}

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<Stats>({ beneficiari: 0, evaluari: 0, medicamente: 0, alerteStoc: 0, categorii: 0 });
  const [lowStock, setLowStock] = useState<MedicationItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/beneficiari").then((r) => r.json()),
      fetch("/api/evaluari").then((r) => r.json()),
      fetch("/api/farmacie").then((r) => r.json()),
      fetch("/api/farmacie/categorii").then((r) => r.json()),
    ]).then(([ben, ev, med, cat]) => {
      const meds = Array.isArray(med) ? med : [];
      const lowStockItems = meds.filter((m: MedicationItem) => m.stock <= m.minStock);
      setLowStock(lowStockItems.slice(0, 3));
      setStats({
        beneficiari: Array.isArray(ben) ? ben.length : 0,
        evaluari: Array.isArray(ev) ? ev.length : 0,
        medicamente: meds.length,
        alerteStoc: lowStockItems.length,
        categorii: Array.isArray(cat) ? cat.length : 0,
      });
    }).catch(() => {});
  }, []);

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    psiholog: "Psiholog",
    asistent: "Asistent social",
    farmacist: "Farmacist",
  };

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <AppLayout>
      {/* Hero greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 mb-6 shadow-lg">
        <div className="absolute top-0 right-0 opacity-10">
          <HappyLogo size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm font-medium">Bun venit,</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">{firstName}!</h1>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mt-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">{roleLabels[user?.role || ""] || user?.role}</span>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.beneficiari}</p>
            <p className="text-[10px] text-indigo-100 font-medium mt-0.5">Beneficiari</p>
          </div>
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.evaluari}</p>
            <p className="text-[10px] text-indigo-100 font-medium mt-0.5">Evaluari</p>
          </div>
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.medicamente}</p>
            <p className="text-[10px] text-indigo-100 font-medium mt-0.5">Medicamente</p>
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.alerteStoc > 0 && (
        <Link href="/farmacie">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 mb-5 active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-xl">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-700 text-sm">{stats.alerteStoc} medicamente sub stoc minim</p>
                {lowStock.length > 0 && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {lowStock.map(m => m.name).join(", ")}
                  </p>
                )}
              </div>
              <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Section: Module principale */}
      <div className="mb-2">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Module principale</h2>
      </div>

      {/* Main feature cards - 2 big cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Card: Farmacie */}
        <Link href="/farmacie">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.97] transition-all h-full">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 pb-5">
              <div className="bg-white/20 w-11 h-11 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">Farmacie</h3>
              <p className="text-purple-100 text-[11px] mt-1">Stoc & medicamente</p>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.medicamente}</p>
                <p className="text-[10px] text-gray-400">medicamente</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">{stats.categorii}</p>
                <p className="text-[10px] text-gray-400">categorii</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Card: Evaluari Psihosociale */}
        <Link href="/evaluari">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.97] transition-all h-full">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 pb-5">
              <div className="bg-white/20 w-11 h-11 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">Evaluari</h3>
              <p className="text-emerald-100 text-[11px] mt-1">Profile psihosociale</p>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.evaluari}</p>
                <p className="text-[10px] text-gray-400">evaluari</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">{stats.beneficiari}</p>
                <p className="text-[10px] text-gray-400">beneficiari</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick actions for main modules */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/farmacie/nou">
          <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3.5 active:scale-[0.97] transition-all">
            <div className="bg-purple-100 p-2 rounded-xl">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Medicament nou</p>
              <p className="text-[10px] text-purple-400">Adauga in stoc</p>
            </div>
          </div>
        </Link>
        <Link href="/evaluari/nou">
          <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-3.5 active:scale-[0.97] transition-all">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Evaluare noua</p>
              <p className="text-[10px] text-emerald-400">Profil psihologic</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Section: Altele */}
      <div className="mb-2">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Altele</h2>
      </div>

      {/* Secondary cards */}
      <div className="space-y-3 mb-6">
        {/* Beneficiari */}
        <Link href="/beneficiari">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Beneficiari</h3>
              <p className="text-xs text-gray-400">Persoane inregistrate in sistem</p>
            </div>
            <div className="text-right mr-1">
              <p className="text-xl font-bold text-blue-600">{stats.beneficiari}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Rapoarte */}
        <Link href="/rapoarte">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Rapoarte PDF</h3>
              <p className="text-xs text-gray-400">Genereaza fise psihosociale</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Adauga beneficiar */}
        <Link href="/beneficiari/nou">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Beneficiar nou</h3>
              <p className="text-xs text-gray-400">Inregistreaza persoana noua</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="w-full py-3.5 text-red-400 text-sm font-medium active:bg-red-50 rounded-2xl transition border border-red-100 bg-red-50/50"
      >
        Deconectare
      </button>
    </AppLayout>
  );
}
