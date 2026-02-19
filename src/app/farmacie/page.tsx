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
