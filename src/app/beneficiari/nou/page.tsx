"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

export default function BeneficiarNouPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    firstName: "",
    lastName: "",
    age: "",
    sex: "M",
    location: "",
    hasConsent: false,
    hasFamily: "nu",
    housingStatus: "centru",
    familyContactFreq: "",
    institutionHistory: "",
    knownDiseases: "",
    medication: "",
    disabilities: "",
    priorPsychEval: "nu",
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/beneficiari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/beneficiari");
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

  const stepLabels = ["Date de baza", "Situatie sociala", "Stare medicala"];

  return (
    <AppLayout title="Beneficiar nou" backHref="/beneficiari">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${step > i ? "bg-indigo-600" : step === i + 1 ? "bg-indigo-400" : "bg-gray-200"}`} />
            <p className={`text-[10px] mt-1 text-center ${step === i + 1 ? "text-indigo-600 font-medium" : "text-gray-400"}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date de baza</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cod intern *</label>
                  <input type="text" value={form.code} onChange={(e) => update("code", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie / Centru *</label>
                  <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenume *</label>
                  <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                  <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Varsta *</label>
                  <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select value={form.sex} onChange={(e) => update("sex", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                    <option value="M">Masculin</option>
                    <option value="F">Feminin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="consent" checked={form.hasConsent}
                  onChange={(e) => update("hasConsent", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded" />
                <label htmlFor="consent" className="text-sm text-gray-700">Consimtamant GDPR obtinut</label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Situatie sociala</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Are familie?</label>
                <select value={form.hasFamily} onChange={(e) => update("hasFamily", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="da">Da</option>
                  <option value="nu">Nu</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stare locativa</label>
                <select value={form.housingStatus} onChange={(e) => update("housingStatus", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="fara_adapost">Fara adapost</option>
                  <option value="centru">Centru</option>
                  <option value="familie">Familie</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frecventa contact cu familia</label>
                <input type="text" value={form.familyContactFreq} onChange={(e) => update("familyContactFreq", e.target.value)}
                  placeholder="ex: saptamanal, lunar, deloc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Istoric institutionalizare</label>
                <textarea value={form.institutionHistory} onChange={(e) => update("institutionHistory", e.target.value)}
                  rows={3} placeholder="Descriere pe scurt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stare medicala (optional)</h2>
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">Aceste date sunt optionale si necesita acord explicit.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Boli cunoscute</label>
                <textarea value={form.knownDiseases} onChange={(e) => update("knownDiseases", e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicatie curenta</label>
                <textarea value={form.medication} onChange={(e) => update("medication", e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Handicap / Limitari</label>
                <textarea value={form.disabilities} onChange={(e) => update("disabilities", e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluare psihologica anterioara</label>
                <select value={form.priorPsychEval} onChange={(e) => update("priorPsychEval", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="da">Da</option>
                  <option value="nu">Nu</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-2xl font-medium text-sm active:scale-[0.98] transition-all">
                Inapoi
              </button>
            ) : (
              <button onClick={() => router.push("/beneficiari")}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-2xl font-medium text-sm active:scale-[0.98] transition-all">
                Anuleaza
              </button>
            )}

            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all">
                Urmatorul pas
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? "Se salveaza..." : "Salveaza"}
              </button>
            )}
          </div>
        </div>
    </AppLayout>
  );
}
