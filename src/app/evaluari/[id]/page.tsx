"use client";

import { useEffect, useState, use } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface AIReport {
  contextPersonal: string;
  profilEmotional: string;
  nevoiPrincipale: string[];
  riscuri: string[];
  recomandariPersonal: string[];
  planSprijin: string[];
  generatedAt: string;
}

interface EvalData {
  id: string;
  date: string;
  version: number;
  communicationLevel: string;
  stressReaction: string;
  sociability: string;
  autonomy: string;
  sleepQuality: string;
  appetite: string;
  sadness: boolean;
  anxiety: boolean;
  anger: boolean;
  apathy: boolean;
  hope: boolean;
  observations: string | null;
  aiReport: string | null;
  aiGeneratedAt: string | null;
  beneficiary: {
    id: string;
    firstName: string;
    lastName: string;
    code: string;
    age: number;
    sex: string;
    location: string;
  };
  evaluator: { name: string; role: string };
}

export default function EvaluareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/evaluari/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <AppLayout title="Detalii evaluare" backHref="/evaluari"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div></AppLayout>;
  }

  if (!data) {
    return <AppLayout title="Detalii evaluare" backHref="/evaluari"><p className="text-gray-500">Evaluarea nu a fost gasita.</p></AppLayout>;
  }

  let report: AIReport | null = null;
  if (data.aiReport) {
    try { report = JSON.parse(data.aiReport); } catch { /* ignore */ }
  }

  const emotions = [
    { label: "Tristete", value: data.sadness },
    { label: "Anxietate", value: data.anxiety },
    { label: "Furie", value: data.anger },
    { label: "Apatie", value: data.apathy },
    { label: "Speranta", value: data.hope },
  ];

  return (
    <AppLayout title="Detalii evaluare" backHref="/evaluari">
      <div className="max-w-4xl mx-auto">
        <Link href="/evaluari" className="text-sm text-indigo-600 hover:underline">&larr; Inapoi la evaluari</Link>

        <div className="mt-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluare - {data.beneficiary.firstName} {data.beneficiary.lastName}
            </h1>
            <p className="text-gray-500">v{data.version} | {new Date(data.date).toLocaleDateString("ro-RO")} | Evaluator: {data.evaluator.name}</p>
          </div>
          <Link href={`/rapoarte?evaluationId=${data.id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
            Exporta PDF
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Behavior */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comportament observat</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Comunicare", value: data.communicationLevel },
                { label: "Reactie stres", value: data.stressReaction },
                { label: "Sociabilitate", value: data.sociability },
                { label: "Autonomie", value: data.autonomy },
                { label: "Somn", value: data.sleepQuality },
                { label: "Apetit", value: data.appetite },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900 capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stare emotionala</h2>
            <div className="space-y-2">
              {emotions.map((em) => (
                <div key={em.label} className={`flex items-center gap-3 p-2.5 rounded-lg ${em.value ? "bg-red-50" : "bg-gray-50"}`}>
                  <div className={`w-3 h-3 rounded-full ${em.value ? "bg-red-400" : "bg-gray-300"}`} />
                  <span className={`text-sm ${em.value ? "text-red-700 font-medium" : "text-gray-500"}`}>{em.label}</span>
                </div>
              ))}
            </div>
            {data.observations && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Observatii:</p>
                <p className="text-sm text-gray-700">{data.observations}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Report */}
        {report && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil psihosocial orientativ</h2>
                <p className="text-xs text-gray-400">Generat la {new Date(report.generatedAt).toLocaleString("ro-RO")} | NU este diagnostic</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">1. Context personal</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{report.contextPersonal}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">2. Profil emotional</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{report.profilEmotional}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">3. Nevoi principale</h3>
                <ul className="space-y-1">
                  {report.nevoiPrincipale.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500 mt-1">&#x2022;</span>{n}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">4. Riscuri identificate</h3>
                <ul className="space-y-1">
                  {report.riscuri.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                      <span className="mt-1">&#x26A0;</span>{r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">5. Recomandari pentru personal</h3>
                <ul className="space-y-1">
                  {report.recomandariPersonal.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                      <span className="mt-1">&#x2713;</span>{r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">6. Plan de sprijin</h3>
                <ul className="space-y-1">
                  {report.planSprijin.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 font-medium">{i + 1}.</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 italic">
                Acest profil este orientativ si nu constituie un diagnostic medical sau psihologic.
                Scopul este de a oferi sprijin personalului in intelegerea nevoilor beneficiarului.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
