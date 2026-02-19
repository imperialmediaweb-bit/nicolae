"use client";

import { useEffect, useState, use } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import jsPDF from "jspdf";

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
    hasConsent: boolean;
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

  function downloadPDF() {
    if (!data) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 18;
    const maxW = pw - margin * 2;
    let y = 20;

    // Strip Romanian diacritics for PDF compatibility (Helvetica doesn't support them)
    function s(text: string): string {
      return text
        .replace(/[ăĂ]/g, (c) => c === "ă" ? "a" : "A")
        .replace(/[âÂ]/g, (c) => c === "â" ? "a" : "A")
        .replace(/[îÎ]/g, (c) => c === "î" ? "i" : "I")
        .replace(/[șȘ]/g, (c) => c === "ș" ? "s" : "S")
        .replace(/[țȚ]/g, (c) => c === "ț" ? "t" : "T")
        .replace(/[şŞ]/g, (c) => c === "ş" ? "s" : "S")
        .replace(/[ţŢ]/g, (c) => c === "ţ" ? "t" : "T");
    }

    function checkPage(need: number) {
      if (y + need > 275) { doc.addPage(); y = 20; }
    }

    function sectionHeading(text: string) {
      checkPage(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 80);
      doc.text(s(text), margin, y);
      y += 4;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pw - margin, y);
      y += 6;
    }

    function labelValue(l: string, v: string) {
      checkPage(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(s(l) + ":", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(s(v), margin + 42, y);
      y += 6;
    }

    function paragraph(text: string) {
      checkPage(12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(s(text), maxW);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    }

    function bulletList(items: string[], color: [number, number, number] = [40, 40, 40]) {
      items.forEach((item) => {
        checkPage(10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(s(item), maxW - 6);
        doc.text("-", margin + 1, y);
        doc.text(lines, margin + 6, y);
        y += lines.length * 4.5 + 1.5;
      });
    }

    // === HEADER ===
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("FISA PSIHOSOCIALA", pw / 2, 14, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(s(`${data.beneficiary.lastName} ${data.beneficiary.firstName}  |  Cod: ${data.beneficiary.code}`), pw / 2, 22, { align: "center" });
    doc.setFontSize(8);
    doc.text(s(`Data evaluare: ${new Date(data.date).toLocaleDateString("ro-RO")}  |  Evaluator: ${data.evaluator.name} (${data.evaluator.role})`), pw / 2, 30, { align: "center" });
    y = 44;

    // === DATE BENEFICIAR ===
    sectionHeading("Date beneficiar");
    labelValue("Nume complet", `${data.beneficiary.lastName} ${data.beneficiary.firstName}`);
    labelValue("Cod intern", data.beneficiary.code);
    labelValue("Varsta", `${data.beneficiary.age} ani`);
    labelValue("Sex", data.beneficiary.sex === "M" ? "Masculin" : "Feminin");
    labelValue("Locatie", data.beneficiary.location);
    labelValue("Acord GDPR", data.beneficiary.hasConsent ? "DA - Consimtamant obtinut" : "NU");
    y += 4;

    // === COMPORTAMENT ===
    sectionHeading("Comportament observat");
    labelValue("Comunicare", data.communicationLevel);
    labelValue("Reactie la stres", data.stressReaction);
    labelValue("Sociabilitate", data.sociability);
    labelValue("Autonomie", data.autonomy);
    labelValue("Calitate somn", data.sleepQuality);
    labelValue("Apetit", data.appetite);
    y += 4;

    // === STARE EMOTIONALA ===
    sectionHeading("Stare emotionala");
    const activeEmotions = emotions.filter((e) => e.value).map((e) => e.label);
    const inactiveEmotions = emotions.filter((e) => !e.value).map((e) => e.label);
    if (activeEmotions.length > 0) labelValue("Prezente", activeEmotions.join(", "));
    if (inactiveEmotions.length > 0) labelValue("Absente", inactiveEmotions.join(", "));
    if (data.observations) {
      y += 2;
      labelValue("Observatii", "");
      y -= 4;
      paragraph(data.observations);
    }
    y += 4;

    // === PROFIL AI ===
    if (report) {
      sectionHeading("Profil psihosocial orientativ (generat AI)");

      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("1. Context personal"), margin, y); y += 5;
      paragraph(report.contextPersonal); y += 2;

      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("2. Profil emotional"), margin, y); y += 5;
      paragraph(report.profilEmotional); y += 2;

      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("3. Nevoi principale"), margin, y); y += 5;
      bulletList(report.nevoiPrincipale, [30, 30, 100]); y += 2;

      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("4. Riscuri identificate"), margin, y); y += 5;
      bulletList(report.riscuri, [180, 30, 30]); y += 2;

      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("5. Recomandari pentru personal"), margin, y); y += 5;
      bulletList(report.recomandariPersonal, [20, 120, 50]); y += 2;

      checkPage(10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text(s("6. Plan de sprijin"), margin, y); y += 5;
      bulletList(report.planSprijin, [40, 40, 40]);
    }

    // === FOOTER ===
    checkPage(20);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pw - margin, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Acest profil este orientativ si nu constituie un diagnostic medical sau psihologic.", margin, y);
    y += 3.5;
    doc.text("Scopul este de a oferi sprijin personalului in intelegerea nevoilor beneficiarului.", margin, y);
    y += 3.5;
    doc.text(s(`Document generat la ${new Date().toLocaleString("ro-RO")} | Casa Nicolae`), margin, y);

    const fileName = `Fisa_${data.beneficiary.lastName}_${data.beneficiary.firstName}_${new Date(data.date).toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }

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
          <button onClick={downloadPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descarca PDF
          </button>
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
