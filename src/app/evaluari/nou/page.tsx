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
      <AppLayout title="Nota orientativa noua" backHref="/evaluari">
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
  const [search, setSearch] = useState("");
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
    <AppLayout title="Nota orientativa noua" backHref="/evaluari">
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
          {step === 1 && (() => {
            const selectedBen = beneficiari.find(b => b.id === form.beneficiaryId);
            const q = search.toLowerCase().trim();
            const filtered = q
              ? beneficiari.filter(b =>
                  `${b.firstName} ${b.lastName} ${b.code}`.toLowerCase().includes(q)
                )
              : beneficiari;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Selecteaza beneficiarul</h2>
                  <a href="/beneficiari/nou?returnTo=evaluari"
                    className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Nou
                  </a>
                </div>

                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cauta dupa nume sau cod..."
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Selected indicator */}
                {selectedBen && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-emerald-800 font-medium">{selectedBen.firstName} {selectedBen.lastName}</span>
                    <button onClick={() => update("beneficiaryId", "")} className="ml-auto text-emerald-500 text-xs">Schimba</button>
                  </div>
                )}

                {/* Beneficiary list */}
                {beneficiari.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">Niciun beneficiar in sistem</p>
                    <p className="text-sm text-gray-500">Adauga un beneficiar folosind butonul de sus.</p>
                  </div>
                ) : !selectedBen && (
                  <div className="max-h-60 overflow-y-auto space-y-2 -mx-1 px-1">
                    {filtered.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Niciun rezultat pentru &quot;{search}&quot;</p>
                      </div>
                    ) : (
                      filtered.map((b) => (
                        <button key={b.id} onClick={() => { update("beneficiaryId", b.id); setSearch(""); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all text-left">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {b.firstName.charAt(0)}{b.lastName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.firstName} {b.lastName}</p>
                            <p className="text-[11px] text-gray-400">{b.code}</p>
                          </div>
                          {!b.hasConsent && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Fara GDPR</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* GDPR warnings */}
                {form.beneficiaryId && !selectedBen?.hasConsent && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700 font-medium">Acest beneficiar nu are consimtamant GDPR!</p>
                    <p className="text-xs text-red-600 mt-1">Nu poti crea nota orientativa fara acord GDPR. Editeaza fisa beneficiarului pentru a adauga acordul.</p>
                  </div>
                )}

                {form.beneficiaryId && selectedBen?.hasConsent && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="evalConsent" checked={form.evalConsent}
                        onChange={(e) => update("evalConsent", e.target.checked)}
                        className="h-5 w-5 text-emerald-600 rounded mt-0.5 flex-shrink-0" />
                      <label htmlFor="evalConsent" className="text-sm text-amber-900 leading-relaxed cursor-pointer">
                        Beneficiarul a fost informat si este de acord. Nota generata este
                        orientativa, nu e diagnostic si nu inlocuieste un specialist.
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                  Dupa salvare, sistemul va genera automat o nota orientativa interna cu sugestii de sprijin
                  pentru echipa. Aceasta NU este un diagnostic si NU inlocuieste evaluarea unui specialist.
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
                {saving ? "Se genereaza..." : "Genereaza nota orientativa"}
              </button>
            )}
          </div>
        </div>
    </AppLayout>
  );
}
