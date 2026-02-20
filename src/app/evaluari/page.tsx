"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface Evaluation {
  id: string;
  date: string;
  version: number;
  communicationLevel: string;
  stressReaction: string;
  sociability: string;
  autonomy: string;
  aiReport: string | null;
  beneficiary: { firstName: string; lastName: string; code: string };
  evaluator: { name: string; role: string };
}

export default function EvaluariPage() {
  const [evaluari, setEvaluari] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluari")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvaluari(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Note orientative" backHref="/dashboard">
      <Link href="/evaluari/nou"
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-2xl font-semibold text-sm mb-4 active:scale-[0.98] transition-all shadow-md">
        + Nota noua
      </Link>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : evaluari.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nicio nota orientativa inca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluari.map((ev) => (
            <Link key={ev.id} href={`/evaluari/${ev.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">v{ev.version}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {ev.beneficiary.firstName} {ev.beneficiary.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(ev.date).toLocaleDateString("ro-RO")} - {ev.evaluator.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {ev.aiReport && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">AI</span>}
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
