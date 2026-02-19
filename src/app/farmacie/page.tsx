"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface MedCategory {
  id: string;
  name: string;
  color: string;
  _count: { medications: number };
}

interface Medication {
  id: string;
  name: string;
  description: string | null;
  dosage: string | null;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: string | null;
  category: { id: string; name: string; color: string };
}

interface PharmacyInsight {
  sumarGeneral: string;
  alerteUrgente: string[];
  recomandari: string[];
  trenduri: string[];
  generatedAt: string;
}

export default function FarmaciePage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [categories, setCategories] = useState<MedCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState<Medication | null>(null);
  const [stockAction, setStockAction] = useState("eliberare");
  const [stockQty, setStockQty] = useState("");
  const [stockReason, setStockReason] = useState("");

  // AI Insights
  const [insights, setInsights] = useState<PharmacyInsight | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/farmacie").then((r) => r.json()),
      fetch("/api/farmacie/categorii").then((r) => r.json()),
    ]).then(([meds, cats]) => {
      if (Array.isArray(meds)) setMedications(meds);
      if (Array.isArray(cats)) setCategories(cats);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function loadInsights() {
    if (insights) {
      setInsightsOpen(!insightsOpen);
      return;
    }
    setInsightsOpen(true);
    setInsightsLoading(true);
    fetch("/api/farmacie/insights")
      .then((r) => r.json())
      .then((data) => { if (data.sumarGeneral) setInsights(data); })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }

  const filtered = medications.filter((m) => {
    const matchesCat = selectedCat === "all" || m.category.id === selectedCat;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  async function handleStockUpdate() {
    if (!stockModal || !stockQty) return;
    try {
      const res = await fetch(`/api/farmacie/${stockModal.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: stockAction, quantity: parseInt(stockQty), reason: stockReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setMedications((prev) =>
          prev.map((m) => (m.id === stockModal.id ? { ...m, stock: data.newStock } : m))
        );
        setStockModal(null);
        setStockQty("");
        setStockReason("");
        // Reset insights so next click refetches
        setInsights(null);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Eroare");
    }
  }

  return (
    <AppLayout title="Farmacie" backHref="/dashboard">
      <Link href="/farmacie/nou"
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-3 rounded-2xl font-semibold text-sm mb-4 active:scale-[0.98] transition-all shadow-md">
        + Adauga medicament
      </Link>

      {/* AI Insights button */}
      <button onClick={loadInsights}
        className={`w-full mb-4 rounded-2xl border transition-all active:scale-[0.98] overflow-hidden ${
          insightsOpen ? "border-violet-200 bg-violet-50/50" : "border-gray-100 bg-white shadow-sm"
        }`}>
        <div className="flex items-center gap-3 p-4">
          <div className={`p-2.5 rounded-xl ${insightsOpen ? "bg-violet-100" : "bg-gradient-to-br from-violet-500 to-purple-600"}`}>
            <svg className={`w-5 h-5 ${insightsOpen ? "text-violet-600" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm text-gray-900">Analiza AI Farmacie</p>
            <p className="text-[11px] text-gray-400">Recomandari inteligente stoc & consum</p>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${insightsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* AI Insights panel */}
      {insightsOpen && (
        <div className="mb-5 space-y-3 animate-in">
          {insightsLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">AI analizeaza stocul...</p>
            </div>
          ) : insights ? (
            <>
              {/* Sumar general */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-violet-200 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white text-sm font-medium">{insights.sumarGeneral}</p>
                </div>
              </div>

              {/* Alerte urgente */}
              {insights.alerteUrgente.length > 0 && !insights.alerteUrgente[0].includes("Nicio alertă") && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Alerte urgente</p>
                  </div>
                  <ul className="space-y-1.5">
                    {insights.alerteUrgente.map((a, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trenduri */}
              {insights.trenduri.length > 0 && !insights.trenduri[0].includes("Insuficiente") && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Trenduri consum</p>
                  </div>
                  <ul className="space-y-1.5">
                    {insights.trenduri.map((t, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomandari */}
              {insights.recomandari.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recomandari</p>
                  </div>
                  <ul className="space-y-1.5">
                    {insights.recomandari.map((r, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-gray-400 text-center">
                Generat de AI la {new Date(insights.generatedAt).toLocaleString("ro-RO")}
              </p>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-sm text-gray-500">Nu s-au putut genera insights. Adauga medicamente mai intai.</p>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setSelectedCat("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            selectedCat === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          Toate
        </button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedCat === cat.id ? "text-white" : "text-gray-600 hover:opacity-80"
            }`}
            style={{ backgroundColor: selectedCat === cat.id ? cat.color : `${cat.color}20` }}>
            {cat.name} ({cat._count.medications})
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Cauta medicament..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Niciun medicament gasit</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => (
            <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{med.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${med.category.color}20`, color: med.category.color }}>
                    {med.category.name}
                  </span>
                </div>
                <div className={`text-right ${med.stock <= med.minStock ? "text-red-600" : "text-green-600"}`}>
                  <p className="text-xl font-bold">{med.stock}</p>
                  <p className="text-xs">{med.unit}</p>
                </div>
              </div>

              {med.dosage && <p className="text-xs text-gray-500 mb-1">Dozaj: {med.dosage}</p>}
              {med.description && <p className="text-xs text-gray-500 mb-2">{med.description}</p>}

              {med.stock <= med.minStock && (
                <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-3">Stoc scazut! Minim: {med.minStock} {med.unit}</div>
              )}

              {med.expiryDate && (
                <p className="text-xs text-gray-400 mb-3">Expira: {new Date(med.expiryDate).toLocaleDateString("ro-RO")}</p>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setStockModal(med); setStockAction("eliberare"); }}
                  className="flex-1 text-xs bg-orange-50 text-orange-700 py-1.5 rounded-lg hover:bg-orange-100 transition">
                  Elibereaza
                </button>
                <button onClick={() => { setStockModal(med); setStockAction("adaugare"); }}
                  className="flex-1 text-xs bg-green-50 text-green-700 py-1.5 rounded-lg hover:bg-green-100 transition">
                  Adauga stoc
                </button>
                <Link href={`/farmacie/${med.id}`}
                  className="text-xs bg-gray-50 text-gray-600 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition">
                  Detalii
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {stockAction === "eliberare" ? "Elibereaza" : "Adauga stoc"} - {stockModal.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Stoc curent: {stockModal.stock} {stockModal.unit}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantitate</label>
                <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                  min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motiv</label>
                <input type="text" value={stockReason} onChange={(e) => setStockReason(e.target.value)}
                  placeholder="ex: pentru beneficiar X" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStockModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Anuleaza
              </button>
              <button onClick={handleStockUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Confirma
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
