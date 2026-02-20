"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";

interface AIReport {
  contextPersonal: string;
  profilEmotional: string;
  nevoiPrincipale: string[];
  riscuri: string[];
  recomandariPersonal: string[];
  planSprijin: string[];
  generatedAt: string;
}

interface Evaluation {
  id: string;
  date: string;
  version: number;
  aiReport: string | null;
  observations: string | null;
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
  beneficiary: {
    firstName: string;
    lastName: string;
    code: string;
    age: number;
    sex: string;
    location: string;
    hasFamily: string;
    housingStatus: string;
  };
  evaluator: { name: string; role: string };
}

export default function RapoartePage() {
  return (
    <Suspense fallback={
      <AppLayout title="Rapoarte PDF" backHref="/dashboard">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </AppLayout>
    }>
      <RapoarteContent />
    </Suspense>
  );
}

function RapoarteContent() {
  const searchParams = useSearchParams();
  const evaluationId = searchParams.get("evaluationId");
  const beneficiaryId = searchParams.get("beneficiaryId");

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = beneficiaryId
      ? `/api/evaluari?beneficiaryId=${beneficiaryId}`
      : "/api/evaluari";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvaluations(data);
          if (evaluationId) setSelected(evaluationId);
          else if (data.length > 0) setSelected(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [evaluationId, beneficiaryId]);

  const current = evaluations.find((e) => e.id === selected);
  let report: AIReport | null = null;
  if (current?.aiReport) {
    try { report = JSON.parse(current.aiReport); } catch { /* ignore */ }
  }

  function generatePDF() {
    if (!current || !report) return;

    const b = current.beneficiary;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const emotions = [];
    if (current.sadness) emotions.push("Tristete frecventa");
    if (current.anxiety) emotions.push("Anxietate");
    if (current.anger) emotions.push("Furie");
    if (current.apathy) emotions.push("Apatie");
    if (current.hope) emotions.push("Speranta/motivatie");

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Fisa psihosociala - ${b.firstName} ${b.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #4338ca; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #4338ca; font-size: 18pt; }
    .header .subtitle { color: #666; font-size: 10pt; margin-top: 4px; }
    .section { margin-bottom: 18px; }
    .section h2 { color: #4338ca; font-size: 12pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    .field { font-size: 10pt; }
    .field .label { color: #666; }
    .field .value { font-weight: 600; }
    ul { padding-left: 20px; }
    li { margin-bottom: 3px; font-size: 10pt; }
    .risk { color: #dc2626; }
    .rec { color: #059669; }
    .disclaimer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #999; font-style: italic; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature div { text-align: center; }
    .signature .line { width: 200px; border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 10pt; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>CASA NICOLAE - Hub Intern</h1>
    <div class="subtitle">FISA PSIHOSOCIALA ORIENTATIVA</div>
    <div class="subtitle">Document intern - CONFIDENTIAL</div>
  </div>

  <div class="section">
    <h2>Date identificare</h2>
    <div class="grid">
      <div class="field"><span class="label">Cod intern:</span> <span class="value">${b.code}</span></div>
      <div class="field"><span class="label">Data evaluare:</span> <span class="value">${new Date(current.date).toLocaleDateString("ro-RO")}</span></div>
      <div class="field"><span class="label">Prenume:</span> <span class="value">${b.firstName}</span></div>
      <div class="field"><span class="label">Nume:</span> <span class="value">${b.lastName}</span></div>
      <div class="field"><span class="label">Varsta:</span> <span class="value">${b.age} ani</span></div>
      <div class="field"><span class="label">Sex:</span> <span class="value">${b.sex === "M" ? "Masculin" : "Feminin"}</span></div>
      <div class="field"><span class="label">Locatie:</span> <span class="value">${b.location}</span></div>
      <div class="field"><span class="label">Evaluator:</span> <span class="value">${current.evaluator.name} (${current.evaluator.role})</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Rezumat social</h2>
    <p>${report.contextPersonal}</p>
  </div>

  <div class="section">
    <h2>Comportament observat</h2>
    <div class="grid">
      <div class="field"><span class="label">Comunicare:</span> <span class="value">${current.communicationLevel}</span></div>
      <div class="field"><span class="label">Reactie stres:</span> <span class="value">${current.stressReaction}</span></div>
      <div class="field"><span class="label">Sociabilitate:</span> <span class="value">${current.sociability}</span></div>
      <div class="field"><span class="label">Autonomie:</span> <span class="value">${current.autonomy}</span></div>
      <div class="field"><span class="label">Somn:</span> <span class="value">${current.sleepQuality}</span></div>
      <div class="field"><span class="label">Apetit:</span> <span class="value">${current.appetite}</span></div>
    </div>
    ${emotions.length > 0 ? `<p style="margin-top:8px"><strong>Stare emotionala:</strong> ${emotions.join(", ")}</p>` : ""}
  </div>

  <div class="section">
    <h2>Profil emotional</h2>
    <p>${report.profilEmotional}</p>
  </div>

  <div class="section">
    <h2>Nevoi principale</h2>
    <ul>${report.nevoiPrincipale.map((n) => `<li>${n}</li>`).join("")}</ul>
  </div>

  <div class="section">
    <h2>Riscuri identificate</h2>
    <ul>${report.riscuri.map((r) => `<li class="risk">${r}</li>`).join("")}</ul>
  </div>

  <div class="section">
    <h2>Recomandari pentru personal</h2>
    <ul>${report.recomandariPersonal.map((r) => `<li class="rec">${r}</li>`).join("")}</ul>
  </div>

  <div class="section">
    <h2>Plan de sprijin</h2>
    <ul>${report.planSprijin.map((p, i) => `<li><strong>${i + 1}.</strong> ${p}</li>`).join("")}</ul>
  </div>

  ${current.observations ? `<div class="section"><h2>Observatii</h2><p>${current.observations}</p></div>` : ""}

  <div class="signature">
    <div>
      <div class="line">Evaluator: ${current.evaluator.name}</div>
    </div>
    <div>
      <div class="line">Semnatura responsabil</div>
    </div>
  </div>

  <div class="disclaimer">
    Acest document este orientativ si NU constituie un diagnostic medical sau psihologic.
    Scopul este de a oferi sprijin personalului in intelegerea nevoilor beneficiarului.
    Document generat automat - Casa Nicolae Hub Intern - ${new Date().toLocaleDateString("ro-RO")}
  </div>

  <script>window.print();</script>
</body>
</html>`);
    printWindow.document.close();
  }

  return (
    <AppLayout title="Rapoarte PDF" backHref="/dashboard">
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Selecteaza nota orientativa</h2>
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          ) : evaluations.length === 0 ? (
            <p className="text-sm text-gray-500">Nicio nota orientativa disponibila</p>
          ) : (
            <div className="space-y-2">
              {evaluations.map((ev) => (
                <button key={ev.id} onClick={() => setSelected(ev.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition ${
                    selected === ev.id ? "bg-indigo-50 border-indigo-200 border" : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                  }`}>
                  <p className="font-medium text-gray-900">{ev.beneficiary.firstName} {ev.beneficiary.lastName}</p>
                  <p className="text-xs text-gray-500">v{ev.version} - {new Date(ev.date).toLocaleDateString("ro-RO")}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {current && report ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Fisa - {current.beneficiary.firstName} {current.beneficiary.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">v{current.version} | {new Date(current.date).toLocaleDateString("ro-RO")}</p>
                </div>
                <button onClick={generatePDF}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exporta PDF
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">Context personal</h3>
                  <p className="text-gray-600">{report.contextPersonal}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">Profil emotional</h3>
                  <p className="text-gray-600">{report.profilEmotional}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">Nevoi principale</h3>
                  <ul className="list-disc pl-5 text-gray-600">
                    {report.nevoiPrincipale.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-700 mb-1">Riscuri</h3>
                  <ul className="list-disc pl-5 text-red-600">
                    {report.riscuri.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-700 mb-1">Recomandari</h3>
                  <ul className="list-disc pl-5 text-green-600">
                    {report.recomandariPersonal.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-700 mb-1">Plan de sprijin</h3>
                  <ol className="list-decimal pl-5 text-blue-600">
                    {report.planSprijin.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Selecteaza o nota orientativa pentru a vedea raportul si a genera PDF</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
