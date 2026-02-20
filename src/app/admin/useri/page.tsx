"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  psiholog: "Psiholog",
  asistent: "Asistent social",
  farmacist: "Farmacist",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  psiholog: "bg-purple-100 text-purple-700",
  asistent: "bg-blue-100 text-blue-700",
  farmacist: "bg-emerald-100 text-emerald-700",
};

export default function AdminUseriPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("asistent");

  function loadUsers() {
    fetch("/api/admin/useri")
      .then((r) => {
        if (r.status === 403) throw new Error("forbidden");
        if (!r.ok) throw new Error("err");
        return r.json();
      })
      .then(setUsers)
      .catch((err) => {
        if (err.message === "forbidden") setError("Doar administratorii pot accesa aceasta pagina.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  function openNew() {
    setEditUser(null);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("asistent");
    setFormError("");
    setShowForm(true);
  }

  function openEdit(u: UserItem) {
    setEditUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword("");
    setFormRole(u.role);
    setFormError("");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");

    try {
      if (editUser) {
        // Update
        const body: Record<string, unknown> = { id: editUser.id, name: formName, role: formRole };
        if (formPassword) body.password = formPassword;

        const res = await fetch("/api/admin/useri", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || "Eroare"); return; }
      } else {
        // Create
        if (!formUsername || !formName || !formPassword) {
          setFormError("Completeaza toate campurile");
          return;
        }
        const res = await fetch("/api/admin/useri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formUsername, name: formName, password: formPassword, role: formRole }),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || "Eroare"); return; }
      }

      setShowForm(false);
      loadUsers();
    } catch {
      setFormError("Eroare de retea");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserItem) {
    await fetch("/api/admin/useri", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    loadUsers();
  }

  if (error) {
    return (
      <AppLayout title="Gestionare utilizatori" backHref="/dashboard">
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin" backHref="/dashboard">
      {/* Setari & Chei API - card prominent */}
      <Link href="/setari">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 rounded-2xl p-4 mb-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-md">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm">Setari & Chei API</h3>
            <p className="text-violet-100 text-xs">Configureaza AI (Claude, Gemini), SMS Twilio</p>
          </div>
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Utilizatori section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Utilizatori</h2>
        <button onClick={openNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-xs active:scale-[0.98] transition-all shadow-sm">
          + Nou
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${!u.active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                  {roleLabels[u.role] || u.role}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(u)}
                  className="flex-1 text-xs text-indigo-600 font-medium py-2 bg-indigo-50 rounded-xl active:scale-95 transition">
                  Editeaza
                </button>
                <button onClick={() => toggleActive(u)}
                  className={`flex-1 text-xs font-medium py-2 rounded-xl active:scale-95 transition ${
                    u.active ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                  }`}>
                  {u.active ? "Dezactiveaza" : "Activeaza"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-x-4 top-[15%] z-50 bg-white rounded-3xl shadow-2xl max-w-md mx-auto overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{editUser ? "Editeaza utilizator" : "Utilizator nou"}</h3>
            </div>

            <div className="p-5 space-y-4">
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="ex: maria.pop"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Maria Popescu"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editUser ? "Parola noua (lasa gol daca nu schimbi)" : "Parola"}
                </label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minim 6 caractere"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <button key={value} onClick={() => setFormRole(value)}
                      className={`text-sm py-2.5 px-3 rounded-xl font-medium transition-all ${
                        formRole === value
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl">
                Anuleaza
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl disabled:opacity-50">
                {saving ? "Se salveaza..." : editUser ? "Salveaza" : "Creeaza"}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
