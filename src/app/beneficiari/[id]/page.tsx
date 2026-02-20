"use client";

import { useEffect, useState, use } from "react";
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
  evaluator: { name: string; role: string };
}

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
  familyContactFreq: string | null;
  institutionHistory: string | null;
  knownDiseases: string | null;
  medication: string | null;
  disabilities: string | null;
  priorPsychEval: string;
  hasConsent: boolean;
  evaluations: Evaluation[];
}

export default function BeneficiarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/beneficiari/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Detalii beneficiar" backHref="/beneficiari">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout title="Detalii beneficiar" backHref="/beneficiari">
        <p className="text-gray-500">Beneficiarul nu a fost gasit.</p>
      </AppLayout>
    );
  }

  const housingLabels: Record<string, string> = {
    fara_adapost: "Fara adapost",
    centru: "Centru",
    familie: "Familie",
  };

  return (
    <AppLayout title="Detalii beneficiar" backHref="/beneficiari">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/beneficiari" className="text-sm text-indigo-600 hover:underline">&larr; Inapoi la lista</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{data.firstName} {data.lastName}</h1>
          <p className="text-gray-500">Cod: {data.code}</p>
        </div>
        <Link
          href={`/evaluari/nou?beneficiaryId=${data.id}`}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          + Nota noua
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informatii personale</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Varsta:</span>
                <span className="ml-2 font-medium text-gray-900">{data.age} ani</span>
              </div>
              <div>
                <span className="text-gray-500">Sex:</span>
                <span className="ml-2 font-medium text-gray-900">{data.sex === "M" ? "Masculin" : "Feminin"}</span>
              </div>
              <div>
                <span className="text-gray-500">Locatie:</span>
                <span className="ml-2 font-medium text-gray-900">{data.location}</span>
              </div>
              <div>
                <span className="text-gray-500">Locuire:</span>
                <span className="ml-2 font-medium text-gray-900">{housingLabels[data.housingStatus]}</span>
              </div>
              <div>
                <span className="text-gray-500">Familie:</span>
                <span className="ml-2 font-medium text-gray-900">{data.hasFamily}</span>
              </div>
              <div>
                <span className="text-gray-500">Contact familie:</span>
                <span className="ml-2 font-medium text-gray-900">{data.familyContactFreq || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">GDPR:</span>
                <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${data.hasConsent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {data.hasConsent ? "Consimtamant dat" : "Fara consimtamant"}
                </span>
              </div>
            </div>

            {data.institutionHistory && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Istoric institutionalizare:</span>
                <p className="mt-1 text-sm text-gray-900">{data.institutionHistory}</p>
              </div>
            )}
          </div>

          {/* Medical */}
          {(data.knownDiseases || data.medication || data.disabilities) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stare medicala</h2>
              <div className="space-y-3 text-sm">
                {data.knownDiseases && <div><span className="text-gray-500">Boli:</span> <span className="text-gray-900">{data.knownDiseases}</span></div>}
                {data.medication && <div><span className="text-gray-500">Medicatie:</span> <span className="text-gray-900">{data.medication}</span></div>}
                {data.disabilities && <div><span className="text-gray-500">Limitari:</span> <span className="text-gray-900">{data.disabilities}</span></div>}
                <div><span className="text-gray-500">Evaluare psihologica anterioara:</span> <span className="text-gray-900">{data.priorPsychEval}</span></div>
              </div>
            </div>
          )}

          {/* Evaluations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note orientative ({data.evaluations.length})</h2>
            {data.evaluations.length === 0 ? (
              <p className="text-gray-500 text-sm">Nicio nota orientativa inca.</p>
            ) : (
              <div className="space-y-3">
                {data.evaluations.map((ev) => (
                  <Link key={ev.id} href={`/evaluari/${ev.id}`}
                    className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Nota v{ev.version}</p>
                        <p className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString("ro-RO")}</p>
                        <p className="text-xs text-gray-400 mt-1">De: {ev.evaluator.name} ({ev.evaluator.role})</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Com: {ev.communicationLevel}</span>
                        <span className="inline-block px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded ml-1">Stres: {ev.stressReaction}</span>
                        {ev.aiReport && <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded">AI Raport</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Actiuni</h3>
            <div className="space-y-2">
              <Link href={`/evaluari/nou?beneficiaryId=${data.id}`}
                className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
                Nota noua
              </Link>
              <Link href={`/rapoarte?beneficiaryId=${data.id}`}
                className="block w-full text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm">
                Genereaza PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
