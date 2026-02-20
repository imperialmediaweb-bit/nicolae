"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";

interface Beneficiary {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  hasConsent: boolean;
}

export default function EvaluareNouaPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Evaluare noua" backHref="/evaluari">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </AppLayout>
    }>
      <EvaluareNouaContent />
    </Suspense>
  );
}

function EvaluareNouaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("beneficiaryId") || "";

  const [beneficiari, setBeneficiari] = useState<Beneficiary[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    beneficiaryId: preselectedId,
    evalConsent: false,
    communicationLevel: "mediu",
    stressReaction: "calm",
    sociability: "sociabil",
    autonomy: "partial",
    sleepQuality: "bun",
    appetite: "normal",
    sadness: false,
    anxiety: false,
    anger: false,
    apathy: false,
    hope: false,
    observations: "",
  });

  useEffect(() => {
    fetch("/api/beneficiari")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBeneficiari(data); })
      .catch(() => {});
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.beneficiaryId) {
      alert("Selecteaza un beneficiar");
      return;
    }
    setSaving(true);
    try {
      const { evalConsent: _, ...payload } = form;
      const res = await fetch("/api/evaluari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/evaluari/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Eroare");
      }
    } catch {
      alert("Eroare de conexiune");
    } finally {
      setSaving(false);
    }
  }

  function RadioGroup({ label, field, options }: { label: string; field: string; options: { value: string; label: string }[] }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex gap-2">
          {options.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => update(field, opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                form[field as keyof typeof form] === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function CheckItem({ label, field }: { label: string; field: string }) {
    const checked = form[field as keyof typeof form] as boolean;
    return (
      <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
        checked ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100"
      } border`}>
        <input type="checkbox" checked={checked}
          onChange={(e) => update(field, e.target.checked)}
          className="h-4 w-4 text-indigo-600 rounded" />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  }

  return (
    <AppLayout title="Evaluare noua" backHref="/evaluari">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {["Beneficiar", "Comportament", "Stare emotionala"].map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${step > i ? "bg-emerald-500" : step === i + 1 ? "bg-emerald-400" : "bg-gray-200"}`} />
            <p className={`text-[10px] mt-1 text-center ${step === i + 1 ? "text-emerald-600 font-medium" : "text-gray-400"}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecteaza beneficiarul</h2>
              {beneficiari.length === 0 ? (
                <div className="text-center py-6">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">Niciun beneficiar in sistem</p>
                  <p className="text-sm text-gray-500 mb-5">Trebuie sa adaugi cel putin un beneficiar<br />inainte de a crea o evaluare.</p>
                  <a href="/beneficiari/nou"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-5 py-3 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Adauga beneficiar
                  </a>
                </div>
              ) : (
                <>
                  <select value={form.beneficiaryId} onChange={(e) => update("beneficiaryId", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900">
                    <option value="">-- Alege beneficiar --</option>
                    {beneficiari.map((b) => (
                      <option key={b.id} value={b.id}>{b.firstName} {b.lastName} ({b.code})</option>
                    ))}
                  </select>
                  {form.beneficiaryId && !beneficiari.find(b => b.id === form.beneficiaryId)?.hasConsent && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-700 font-medium">Acest beneficiar nu are consimtamant GDPR!</p>
                      <p className="text-xs text-red-600 mt-1">Nu poti face evaluare fara acord GDPR. Editeaza fisa beneficiarului pentru a adauga acordul.</p>
                    </div>
                  )}

                  {form.beneficiaryId && beneficiari.find(b => b.id === form.beneficiaryId)?.hasConsent && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <h3 className="text-sm font-semibold text-amber-900">Acord si informare evaluare</h3>
                      <div className="text-xs text-amber-800 space-y-2">
                        <p>Inainte de a continua, va rugam sa confirmati urmatoarele:</p>
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Beneficiarul (sau reprezentantul legal) a fost <strong>informat</strong> ca va fi realizata o evaluare psihosociala.</li>
                          <li>Beneficiarul <strong>si-a exprimat acordul</strong> pentru aceasta evaluare.</li>
                          <li>Profilul generat de sistemul AI este <strong>strict orientativ</strong> si <strong>nu constituie un diagnostic</strong> medical, psihologic sau psihiatric.</li>
                          <li>Rezultatele <strong>nu inlocuiesc</strong> evaluarea unui specialist (psiholog, medic, asistent social autorizat).</li>
                          <li>Profilul are rol de <strong>sprijin intern</strong> pentru personalul care lucreaza cu beneficiarul.</li>
                        </ul>
                      </div>
                      <div className="flex items-start gap-3 pt-1">
                        <input type="checkbox" id="evalConsent" checked={form.evalConsent}
                          onChange={(e) => update("evalConsent", e.target.checked)}
                          className="h-5 w-5 text-emerald-600 rounded mt-0.5 flex-shrink-0" />
                        <label htmlFor="evalConsent" className="text-sm text-amber-900 font-medium leading-relaxed cursor-pointer">
                          Confirm ca beneficiarul a fost informat si este de acord cu evaluarea.
                          Inteleg ca profilul generat este orientativ si nu inlocuieste un specialist.
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comportament observat</h2>

              <RadioGroup label="Nivel de comunicare" field="communicationLevel"
                options={[{ value: "mic", label: "Mic" }, { value: "mediu", label: "Mediu" }, { value: "bun", label: "Bun" }]} />

              <RadioGroup label="Reactie la stres" field="stressReaction"
                options={[{ value: "calm", label: "Calm" }, { value: "agitat", label: "Agitat" }, { value: "crize", label: "Crize" }]} />

              <RadioGroup label="Relationare" field="sociability"
                options={[{ value: "retras", label: "Retras" }, { value: "sociabil", label: "Sociabil" }, { value: "agresiv", label: "Agresiv" }]} />

              <RadioGroup label="Autonomie" field="autonomy"
                options={[{ value: "dependent", label: "Dependent" }, { value: "partial", label: "Partial" }, { value: "Independent", label: "Independent" }]} />

              <RadioGroup label="Calitate somn" field="sleepQuality"
                options={[{ value: "bun", label: "Bun" }, { value: "slab", label: "Slab" }]} />

              <RadioGroup label="Apetit" field="appetite"
                options={[{ value: "normal", label: "Normal" }, { value: "scazut", label: "Scazut" }]} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stare emotionala</h2>

              <div className="grid grid-cols-2 gap-3">
                <CheckItem label="Tristete frecventa" field="sadness" />
                <CheckItem label="Anxietate" field="anxiety" />
                <CheckItem label="Furie" field="anger" />
                <CheckItem label="Apatie" field="apathy" />
                <CheckItem label="Speranta / motivatie" field="hope" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observatii</label>
                <textarea value={form.observations} onChange={(e) => update("observations", e.target.value)}
                  rows={4} placeholder="Observatii suplimentare ale evaluatorului..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  Dupa salvare, sistemul AI va genera automat un profil psihosocial orientativ cu recomandari de sprijin.
                  Acesta NU pune diagnostice, ci ofera un profil orientativ.
                </p>
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
              <button onClick={() => router.push("/evaluari")}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-2xl font-medium text-sm active:scale-[0.98] transition-all">
                Anuleaza
              </button>
            )}

            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!form.beneficiaryId || !beneficiari.find(b => b.id === form.beneficiaryId)?.hasConsent || !form.evalConsent)}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100">
                Urmatorul pas
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? "Se genereaza..." : "Genereaza raport AI"}
              </button>
            )}
          </div>
        </div>
    </AppLayout>
  );
}
