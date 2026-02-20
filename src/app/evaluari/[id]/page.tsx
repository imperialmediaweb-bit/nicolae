"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function loadData() {
    fetch(`/api/evaluari/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [id]);

  async function regenerateReport() {
    setRegenerating(true);
    setRegenError("");
    try {
      const res = await fetch(`/api/evaluari/${id}`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        loadData();
      } else {
        setRegenError(result.error || "Eroare la regenerare");
      }
    } catch {
      setRegenError("Eroare de conexiune");
    } finally {
      setRegenerating(false);
    }
  }

  async function deleteEvaluation() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/evaluari/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/evaluari");
      } else {
        const result = await res.json();
        setRegenError(result.error || "Eroare la ștergere");
        setShowDeleteConfirm(false);
      }
    } catch {
      setRegenError("Eroare de conexiune");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <AppLayout title="Detalii nota" backHref="/evaluari"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div></AppLayout>;
  }

  if (!data) {
    return <AppLayout title="Detalii nota" backHref="/evaluari"><p className="text-gray-500">Nota nu a fost gasita.</p></AppLayout>;
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

  async function downloadPDF() {
    if (!data) return;

    // Load DejaVu Sans font (supports Romanian diacritics)
    const [fontRegular, fontBold] = await Promise.all([
      fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer()),
      fetch("/fonts/DejaVuSans-Bold.ttf").then((r) => r.arrayBuffer()),
    ]);

    function arrayBufferToBase64(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Register DejaVu Sans fonts
    doc.addFileToVFS("DejaVuSans.ttf", arrayBufferToBase64(fontRegular));
    doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", arrayBufferToBase64(fontBold));
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");

    const pw = doc.internal.pageSize.getWidth();
    const margin = 18;
    const maxW = pw - margin * 2;
    let y = 20;

    function checkPage(need: number) {
      if (y + need > 275) { doc.addPage(); y = 20; }
    }

    function sectionHeading(text: string) {
      checkPage(14);
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 80);
      doc.text(text, margin, y);
      y += 4;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pw - margin, y);
      y += 6;
    }

    function labelValue(l: string, v: string) {
      checkPage(8);
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(l + ":", margin, y);
      doc.setFont("DejaVu", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(v, margin + 42, y);
      y += 6;
    }

    function paragraph(text: string) {
      checkPage(12);
      doc.setFont("DejaVu", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    }

    function bulletList(items: string[], color: [number, number, number] = [40, 40, 40]) {
      items.forEach((item) => {
        checkPage(10);
        doc.setFont("DejaVu", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(item, maxW - 6);
        doc.text("-", margin + 1, y);
        doc.text(lines, margin + 6, y);
        y += lines.length * 4.5 + 1.5;
      });
    }

    // === HEADER ===
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw, 36, "F");
    doc.setFont("DejaVu", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("NOTA ORIENTATIVA INTERNA", pw / 2, 14, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("DejaVu", "normal");
    doc.text(`${data.beneficiary.lastName} ${data.beneficiary.firstName}  |  Cod: ${data.beneficiary.code}`, pw / 2, 22, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Data evaluare: ${new Date(data.date).toLocaleDateString("ro-RO")}  |  Evaluator: ${data.evaluator.name} (${data.evaluator.role})`, pw / 2, 30, { align: "center" });
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

    // === NOTA ORIENTATIVA AI ===
    if (report) {
      sectionHeading("Nota orientativa (generata automat)");

      // Disclaimer in PDF
      checkPage(16);
      doc.setFont("DejaVu", "normal"); doc.setFontSize(7.5); doc.setTextColor(160, 100, 0);
      const disclaimerLines = doc.splitTextToSize(
        "Aceasta nota este generata automat pe baza observatiilor personalului si are caracter strict orientativ. " +
        "NU constituie diagnostic medical, psihologic sau psihiatric si NU inlocuieste evaluarea unui specialist. " +
        "Este destinata exclusiv uzului intern al echipei de sprijin.",
        maxW
      );
      doc.text(disclaimerLines, margin, y);
      y += disclaimerLines.length * 3.5 + 4;

      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("1. Situatia persoanei", margin, y); y += 5;
      paragraph(report.contextPersonal); y += 2;

      checkPage(10);
      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("2. Observatii ale personalului", margin, y); y += 5;
      paragraph(report.profilEmotional); y += 2;

      checkPage(10);
      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("3. De ce ar putea avea nevoie", margin, y); y += 5;
      bulletList(report.nevoiPrincipale, [30, 30, 100]); y += 2;

      checkPage(10);
      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("4. Aspecte de monitorizat", margin, y); y += 5;
      bulletList(report.riscuri, [160, 100, 0]); y += 2;

      checkPage(10);
      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("5. Sugestii pentru echipa", margin, y); y += 5;
      bulletList(report.recomandariPersonal, [20, 120, 50]); y += 2;

      checkPage(10);
      doc.setFont("DejaVu", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 80);
      doc.text("6. Pasi de sprijin propusi", margin, y); y += 5;
      bulletList(report.planSprijin, [40, 40, 40]);
    }

    // === FOOTER ===
    checkPage(20);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pw - margin, y);
    y += 5;
    doc.setFont("DejaVu", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Nota strict orientativa, pentru uzul intern al echipei. Nu constituie si nu inlocuieste un diagnostic.", margin, y);
    y += 3.5;
    doc.text("Pentru evaluare profesionala, consultati un specialist autorizat (psiholog, medic).", margin, y);
    y += 3.5;
    doc.text(`Document generat la ${new Date().toLocaleString("ro-RO")} | Casa Nicolae`, margin, y);

    const fileName = `Fisa_${data.beneficiary.lastName}_${data.beneficiary.firstName}_${new Date(data.date).toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }

  const b = data.beneficiary;

  return (
    <AppLayout title="Nota orientativa" backHref="/evaluari">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-5 mb-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
            {b.firstName.charAt(0)}{b.lastName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{b.firstName} {b.lastName}</h1>
            <p className="text-purple-100 text-xs">Cod: {b.code} | {b.age} ani | {b.location}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-white font-bold text-sm">v{data.version}</p>
            <p className="text-purple-100 text-[10px]">Versiune</p>
          </div>
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-white font-bold text-sm">{new Date(data.date).toLocaleDateString("ro-RO")}</p>
            <p className="text-purple-100 text-[10px]">Data</p>
          </div>
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-white font-bold text-sm truncate">{data.evaluator.name}</p>
            <p className="text-purple-100 text-[10px]">Evaluator</p>
          </div>
        </div>
      </div>

      {regenError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-700">{regenError}</p>
        </div>
      )}

      {/* Behavior summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Comunicare", value: data.communicationLevel, color: "bg-blue-50 text-blue-700" },
          { label: "Stres", value: data.stressReaction, color: "bg-orange-50 text-orange-700" },
          { label: "Social", value: data.sociability, color: "bg-green-50 text-green-700" },
          { label: "Autonomie", value: data.autonomy, color: "bg-purple-50 text-purple-700" },
          { label: "Somn", value: data.sleepQuality, color: "bg-cyan-50 text-cyan-700" },
          { label: "Apetit", value: data.appetite, color: "bg-amber-50 text-amber-700" },
        ].map((item) => (
          <div key={item.label} className={`${item.color} rounded-xl p-2.5 text-center`}>
            <p className="font-bold text-sm capitalize">{item.value}</p>
            <p className="text-[10px] opacity-70">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Emotions row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emotions.map((em) => (
          <span key={em.label} className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            em.value
              ? em.label === "Speranta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-400"
          }`}>
            {em.label}
          </span>
        ))}
      </div>

      {data.observations && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs text-gray-400 mb-1">Observatii evaluator</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.observations}</p>
        </div>
      )}

      {/* AI Report - the main event */}
      {report ? (
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Nota orientativa generata AI</h2>
          </div>

          {/* Section 1 - Context */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">1</span>
              <h3 className="text-sm font-bold text-gray-900">Situatia persoanei</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{report.contextPersonal}</p>
          </div>

          {/* Section 2 - Emotional profile */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2</span>
              <h3 className="text-sm font-bold text-gray-900">Observatii ale personalului</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{report.profilEmotional}</p>
          </div>

          {/* Section 3 - Needs */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
              <h3 className="text-sm font-bold text-blue-900">De ce ar putea avea nevoie</h3>
            </div>
            <ul className="space-y-2">
              {report.nevoiPrincipale.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />{n}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4 - Monitoring */}
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">4</span>
              <h3 className="text-sm font-bold text-amber-900">Aspecte de monitorizat</h3>
            </div>
            <ul className="space-y-2">
              {report.riscuri.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 - Recommendations */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">5</span>
              <h3 className="text-sm font-bold text-emerald-900">Sugestii pentru echipa</h3>
            </div>
            <ul className="space-y-2">
              {report.recomandariPersonal.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 6 - Support plan */}
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-violet-200 text-violet-800 text-[10px] font-bold px-2 py-0.5 rounded-full">6</span>
              <h3 className="text-sm font-bold text-violet-900">Plan de sprijin</h3>
            </div>
            <ul className="space-y-2">
              {report.planSprijin.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-violet-800">
                  <span className="bg-violet-200 text-violet-700 text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-6 text-center mb-5">
          <p className="text-gray-500 text-sm mb-3">Raportul nu a fost generat inca.</p>
          <button onClick={regenerateReport} disabled={regenerating}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition disabled:opacity-50">
            {regenerating ? "Se genereaza..." : "Genereaza raport AI"}
          </button>
        </div>
      )}

      {/* Action buttons - big and prominent */}
      <div className="space-y-3 mb-4">
        {report && (
          <button onClick={downloadPDF}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descarca fisa PDF
          </button>
        )}

        {report && (
          <button onClick={regenerateReport} disabled={regenerating}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            <svg className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {regenerating ? "Se regenereaza..." : "Regenereaza raportul cu AI"}
          </button>
        )}
      </div>

      {/* Delete button */}
      <div className="mt-6 mb-4">
        <button onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Sterge aceasta nota
        </button>
      </div>

      <p className="text-[10px] text-gray-400 text-center px-4 mb-2">
        Nota orientativa interna, generata automat. NU constituie diagnostic medical sau psihologic.
      </p>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-2xl">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Stergi nota?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Nota pentru <strong>{data.beneficiary.firstName} {data.beneficiary.lastName}</strong> din{" "}
              <strong>{new Date(data.date).toLocaleDateString("ro-RO")}</strong> va fi stearsa permanent.
              Aceasta actiune nu poate fi anulata.
            </p>
            <div className="space-y-2">
              <button onClick={deleteEvaluation} disabled={deleting}
                className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
                {deleting ? "Se sterge..." : "Da, sterge definitiv"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-medium text-sm active:scale-[0.98] transition-all">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
