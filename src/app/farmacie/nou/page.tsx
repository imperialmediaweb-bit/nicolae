"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function MedicamentNouPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    dosage: "",
    stock: "0",
    minStock: "5",
    unit: "cutii",
    expiryDate: "",
    notes: "",
    categoryId: "",
  });

  useEffect(() => {
    fetch("/api/farmacie/categorii")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0 && !form.categoryId) {
            setForm((prev) => ({ ...prev, categoryId: data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId) {
      alert("Numele si categoria sunt obligatorii");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/farmacie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/farmacie");
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la salvare");
      }
    } catch {
      alert("Eroare de conexiune");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Medicament nou" backHref="/farmacie">

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
              <option value="">-- Alege --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume medicament *</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dozaj recomandat</label>
            <input type="text" value={form.dosage} onChange={(e) => update("dosage", e.target.value)}
              placeholder="ex: 1 comprimat/zi" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stoc initial</label>
              <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)}
                min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stoc minim alerta</label>
              <input type="number" value={form.minStock} onChange={(e) => update("minStock", e.target.value)}
                min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unitate</label>
              <select value={form.unit} onChange={(e) => update("unit", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                <option value="cutii">Cutii</option>
                <option value="tablete">Tablete</option>
                <option value="fiole">Fiole</option>
                <option value="flacoane">Flacoane</option>
                <option value="tuburi">Tuburi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data expirare</label>
            <input type="date" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => router.push("/farmacie")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition">
              Anuleaza
            </button>
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? "Se salveaza..." : "Salveaza medicament"}
            </button>
          </div>
        </form>
    </AppLayout>
  );
}
