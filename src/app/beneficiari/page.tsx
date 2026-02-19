"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface Beneficiary {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: string;
  location: string;
  hasFamily: string;
  housingStatus: string;
  createdAt: string;
  evaluations: { id: string }[];
}

export default function BeneficiariPage() {
  const [beneficiari, setBeneficiari] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/beneficiari")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBeneficiari(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = beneficiari.filter(
    (b) =>
      b.firstName.toLowerCase().includes(search.toLowerCase()) ||
      b.lastName.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  const housingLabels: Record<string, string> = {
    fara_adapost: "Fara adapost",
    centru: "Centru",
    familie: "Familie",
  };

  const housingColors: Record<string, string> = {
    fara_adapost: "bg-red-100 text-red-700",
    centru: "bg-blue-100 text-blue-700",
    familie: "bg-green-100 text-green-700",
  };

  return (
    <AppLayout title="Beneficiari" backHref="/dashboard">
      {/* Search + Add */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cauta dupa nume sau cod..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-400 text-gray-900 text-sm"
        />
      </div>

      <Link href="/beneficiari/nou"
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl font-semibold text-sm mb-4 active:scale-[0.98] transition-all shadow-md">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Adauga beneficiar
      </Link>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-500">Niciun beneficiar gasit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/beneficiari/${b.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {b.firstName[0]}{b.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.firstName} {b.lastName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{b.age} ani</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500">{b.code}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${housingColors[b.housingStatus] || "bg-gray-100 text-gray-600"}`}>
                    {housingLabels[b.housingStatus] || b.housingStatus}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">{b.evaluations?.length || 0} eval.</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
