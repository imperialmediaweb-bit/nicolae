"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  color: string;
}

interface Parent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  beneficiary: { firstName: string; lastName: string; code: string } | null;
  subscription: {
    status: string;
    endDate: string;
    plan: Plan;
  } | null;
}

interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
}

export default function AdminParintiPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", firstName: "", lastName: "", phone: "",
    beneficiaryId: "", planId: "", subscriptionMonths: "1",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/parinti").then((r) => r.json()),
      fetch("/api/admin/abonamente").then((r) => r.json()),
      fetch("/api/beneficiari").then((r) => r.json()),
    ])
      .then(([p, pl, b]) => {
        setParents(Array.isArray(p) ? p : []);
        setPlans(Array.isArray(pl) ? pl : []);
        setBeneficiaries(Array.isArray(b) ? b : []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/parinti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subscriptionMonths: parseInt(form.subscriptionMonths) || 1,
          beneficiaryId: form.beneficiaryId || undefined,
          planId: form.planId || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ email: "", password: "", firstName: "", lastName: "", phone: "", beneficiaryId: "", planId: "", subscriptionMonths: "1" });
        // Refresh
        const updated = await fetch("/api/admin/parinti").then((r) => r.json());
        setParents(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/parinti/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setParents((prev) => prev.map((p) => (p.id === id ? { ...p, active: !active } : p)));
  }

  async function renewSubscription(id: string) {
    const months = prompt("Cate luni vrei sa reinnoiseti?", "1");
    if (!months) return;
    await fetch(`/api/admin/parinti/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionMonths: parseInt(months) }),
    });
    const updated = await fetch("/api/admin/parinti").then((r) => r.json());
    setParents(updated);
  }

  const subStatus = (parent: Parent) => {
    if (!parent.subscription) return { label: "Fara abonament", color: "bg-gray-100 text-gray-500" };
    const end = new Date(parent.subscription.endDate);
    const now = new Date();
    if (parent.subscription.status === "expired" || end < now) return { label: "Expirat", color: "bg-red-100 text-red-700" };
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return { label: `${days} zile ramase`, color: "bg-yellow-100 text-yellow-700" };
    return { label: "Activ", color: "bg-green-100 text-green-700" };
  };

  return (
    <AppLayout title="Parinti & Abonamente" backHref="/dashboard">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-indigo-600">{parents.length}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-green-600">{parents.filter((p) => subStatus(p).label === "Activ").length}</p>
              <p className="text-xs text-gray-400">Activi</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-red-600">{parents.filter((p) => subStatus(p).label === "Expirat").length}</p>
              <p className="text-xs text-gray-400">Expirati</p>
            </div>
          </div>

          {/* Add button */}
          <button onClick={() => setShowForm(!showForm)}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold active:scale-[0.98] transition">
            {showForm ? "Anuleaza" : "+ Adauga parinte"}
          </button>

          {/* Create form */}
          {showForm && (
            <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prenume *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nume *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Parola *</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required placeholder="Parola initiala" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Copil asociat</label>
                <select value={form.beneficiaryId} onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900">
                  <option value="">-- Fara --</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>{b.firstName} {b.lastName} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Plan abonament</label>
                  <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900">
                    <option value="">-- Fara --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.displayName} ({p.price} RON/luna)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Durata (luni)</label>
                  <select value={form.subscriptionMonths} onChange={(e) => setForm({ ...form, subscriptionMonths: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900">
                    <option value="1">1 luna</option>
                    <option value="3">3 luni</option>
                    <option value="6">6 luni</option>
                    <option value="12">12 luni</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50">
                {saving ? "Se salveaza..." : "Creaza cont parinte"}
              </button>
            </form>
          )}

          {/* Parents list */}
          {parents.map((parent) => {
            const status = subStatus(parent);
            return (
              <div key={parent.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${!parent.active ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{parent.firstName} {parent.lastName}</h3>
                    <p className="text-xs text-gray-400">{parent.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                </div>

                {parent.beneficiary && (
                  <p className="text-xs text-gray-500 mb-2">
                    👦 {parent.beneficiary.firstName} {parent.beneficiary.lastName} ({parent.beneficiary.code})
                  </p>
                )}

                {parent.subscription && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-lg text-white" style={{ backgroundColor: parent.subscription.plan.color }}>
                      {parent.subscription.plan.displayName}
                    </span>
                    <span className="text-xs text-gray-400">
                      pana la {new Date(parent.subscription.endDate).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => renewSubscription(parent.id)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-medium">
                    Reinnoieste
                  </button>
                  <button onClick={() => toggleActive(parent.id, parent.active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${parent.active ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                    {parent.active ? "Dezactiveaza" : "Activeaza"}
                  </button>
                </div>
              </div>
            );
          })}

          {parents.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <span className="text-4xl mb-3 block">👨‍👩‍👧</span>
              <p className="font-semibold text-gray-900">Niciun parinte inregistrat</p>
              <p className="text-sm text-gray-400 mt-1">Adauga primul parinte folosind butonul de sus.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
