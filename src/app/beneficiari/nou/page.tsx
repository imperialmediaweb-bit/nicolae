"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";

export default function BeneficiarNouPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Beneficiar nou" backHref="/beneficiari">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </AppLayout>
    }>
      <BeneficiarNouContent />
    </Suspense>
  );
}

function BeneficiarNouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

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
    familyContactFreq: "deloc",
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
        const data = await res.json();
        if (returnTo === "evaluari") {
          router.push(`/evaluari/nou?beneficiaryId=${data.id}`);
        } else {
          router.push("/beneficiari");
        }
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

  function Btn({ label, value, field }: { label: string; value: string; field: string }) {
    const active = form[field as keyof typeof form] === value;
    return (
      <button type="button" onClick={() => update(field, value)}
        className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
          active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"
        }`}>
        {label}
      </button>
    );
  }

  const stepLabels = ["Date de baza", "Situatie sociala", "Stare medicala"];

  return (
    <AppLayout title="Beneficiar nou" backHref={returnTo === "evaluari" ? "/evaluari/nou" : "/beneficiari"}>
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
                    placeholder="ex: BEN-001"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie / Centru *</label>
                  <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
                    placeholder="ex: Casa Nicolae"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenume *</label>
                  <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
                  <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Varsta *</label>
                  <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)}
                    placeholder="ex: 45"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <div className="flex gap-2">
                    <Btn label="Masculin" value="M" field="sex" />
                    <Btn label="Feminin" value="F" field="sex" />
                  </div>
                </div>
              </div>

              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="consent" checked={form.hasConsent}
                    onChange={(e) => update("hasConsent", e.target.checked)}
                    className="h-5 w-5 text-indigo-600 rounded mt-0.5 flex-shrink-0" />
                  <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold text-gray-900">Consimtamant GDPR *</span>
                    <br />
                    Beneficiarul si-a dat acordul explicit pentru prelucrarea
                    datelor personale, inclusiv date privind starea de sanatate,
                    in scopul furnizarii serviciilor de asistenta sociala.
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Situatie sociala</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Are familie?</label>
                <div className="flex gap-2">
                  <Btn label="Da" value="da" field="hasFamily" />
                  <Btn label="Partial" value="partial" field="hasFamily" />
                  <Btn label="Nu" value="nu" field="hasFamily" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stare locativa</label>
                <div className="flex gap-2">
                  <Btn label="Centru" value="centru" field="housingStatus" />
                  <Btn label="Familie" value="familie" field="housingStatus" />
                  <Btn label="Fara adapost" value="fara_adapost" field="housingStatus" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact cu familia</label>
                <div className="flex gap-2">
                  <Btn label="Zilnic" value="zilnic" field="familyContactFreq" />
                  <Btn label="Saptamanal" value="saptamanal" field="familyContactFreq" />
                  <Btn label="Lunar" value="lunar" field="familyContactFreq" />
                  <Btn label="Deloc" value="deloc" field="familyContactFreq" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Istoric institutionalizare</label>
                <div className="flex gap-2">
                  <Btn label="Nu" value="" field="institutionHistory" />
                  <Btn label="Da, anterior" value="institutionalizare anterioara" field="institutionHistory" />
                  <Btn label="Da, indelungat" value="institutionalizare indelungata" field="institutionHistory" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Stare medicala</h2>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">Optional — selecteaza ce se aplica.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Boli cunoscute</label>
                <div className="flex flex-wrap gap-2">
                  {["Diabet", "Hipertensiune", "Cardiac", "Hepatita", "TBC", "HIV", "Epilepsie", "Altele"].map((b) => {
                    const diseases = form.knownDiseases;
                    const active = diseases.includes(b);
                    return (
                      <button key={b} type="button" onClick={() => {
                        const list = diseases ? diseases.split(", ").filter(Boolean) : [];
                        if (active) update("knownDiseases", list.filter(x => x !== b).join(", "));
                        else update("knownDiseases", [...list, b].join(", "));
                      }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                          active ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 border border-transparent"
                        }`}>
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicatie curenta</label>
                <div className="flex gap-2 mb-2">
                  {["Fara medicatie", "Da, monitorizata", "Da, nemonitorizata"].map((opt) => {
                    const active = form.medication === opt;
                    return (
                      <button key={opt} type="button" onClick={() => update("medication", active ? "" : opt)}
                        className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"
                        }`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limitari / Handicap</label>
                <div className="flex flex-wrap gap-2">
                  {["Locomotoriu", "Vizual", "Auditiv", "Cognitiv", "Psihic", "Fara limitari"].map((d) => {
                    const active = d === "Fara limitari" ? form.disabilities === "" : form.disabilities.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => {
                        if (d === "Fara limitari") { update("disabilities", ""); return; }
                        const list = form.disabilities ? form.disabilities.split(", ").filter(Boolean) : [];
                        if (active) update("disabilities", list.filter(x => x !== d).join(", "));
                        else update("disabilities", [...list, d].join(", "));
                      }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                          active ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-600 border border-transparent"
                        }`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evaluare psihologica anterioara</label>
                <div className="flex gap-2">
                  <Btn label="Nu" value="nu" field="priorPsychEval" />
                  <Btn label="Da" value="da" field="priorPsychEval" />
                </div>
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
              <button onClick={() => router.push(returnTo === "evaluari" ? "/evaluari/nou" : "/beneficiari")}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-2xl font-medium text-sm active:scale-[0.98] transition-all">
                Anuleaza
              </button>
            )}

            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!form.code || !form.firstName || !form.lastName || !form.age || !form.location || !form.hasConsent)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100">
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
