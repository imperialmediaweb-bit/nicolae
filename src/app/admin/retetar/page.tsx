"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";

interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  title: string;
  description: string;
  ingredients: string | null;
  notes: string | null;
  prepNotes: string | null;
}

const dayNames = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];
const mealTypes = [
  { id: "mic_dejun", label: "Mic dejun", icon: "☀️" },
  { id: "pranz", label: "Pranz", icon: "🍽️" },
  { id: "cina", label: "Cina", icon: "🌙" },
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeek(date: Date): string {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  return `${date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function AdminRetetarPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const [form, setForm] = useState({
    dayOfWeek: 0, mealType: "pranz", title: "", description: "", ingredients: "", notes: "", prepNotes: "",
  });

  const loadMeals = useCallback(() => {
    setLoading(true);
    fetch(`/api/retetar?week=${weekStart.toISOString()}`)
      .then((r) => r.json())
      .then((data) => setMeals(data.meals || []))
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => { loadMeals(); }, [loadMeals]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function openNew(dayOfWeek: number, mealType: string) {
    setEditMeal(null);
    setForm({ dayOfWeek, mealType, title: "", description: "", ingredients: "", notes: "", prepNotes: "" });
    setShowForm(true);
  }

  function openEdit(meal: Meal) {
    setEditMeal(meal);
    setForm({
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      title: meal.title,
      description: meal.description,
      ingredients: meal.ingredients || "",
      notes: meal.notes || "",
      prepNotes: meal.prepNotes || "",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/retetar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMeal?.id,
          weekStart: weekStart.toISOString(),
          ...form,
        }),
      });
      setShowForm(false);
      loadMeals();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Stergi aceasta masa?")) return;
    await fetch("/api/retetar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMeals();
  }

  const dayMeals = meals.filter((m) => m.dayOfWeek === selectedDay);

  return (
    <AppLayout title="Retetar Saptamanal" backHref="/admin/useri">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-3 mb-4">
        <button onClick={prevWeek} className="p-2 text-gray-400 active:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">{formatWeek(weekStart)}</p>
          <p className="text-[10px] text-gray-400">Saptamana curenta</p>
        </div>
        <button onClick={nextWeek} className="p-2 text-gray-400 active:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
        {dayNames.map((name, i) => {
          const count = meals.filter((m) => m.dayOfWeek === i).length;
          const dayDate = new Date(weekStart);
          dayDate.setDate(dayDate.getDate() + i);
          const isToday = new Date().toDateString() === dayDate.toDateString();

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex flex-col items-center min-w-[48px] px-3 py-2 rounded-xl text-xs font-medium transition ${
                selectedDay === i
                  ? "bg-indigo-600 text-white shadow-lg"
                  : isToday
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              <span className="text-[10px]">{name.slice(0, 3)}</span>
              <span className="font-bold">{dayDate.getDate()}</span>
              {count > 0 && (
                <span className={`text-[8px] mt-0.5 ${selectedDay === i ? "text-indigo-200" : "text-gray-400"}`}>
                  {count} mese
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">{dayNames[selectedDay]}</h2>

          {/* Meals for selected day */}
          {mealTypes.map((mt) => {
            const meal = dayMeals.find((m) => m.mealType === mt.id);

            return (
              <div key={mt.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mt.icon}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{mt.label}</h3>
                  </div>
                  {meal ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(meal)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium">
                        Editeaza
                      </button>
                      <button onClick={() => handleDelete(meal.id)} className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">
                        Sterge
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => openNew(selectedDay, mt.id)} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-lg font-medium">
                      + Adauga
                    </button>
                  )}
                </div>

                {meal ? (
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{meal.title}</p>
                    <p className="text-gray-600 text-xs mt-1 whitespace-pre-line leading-relaxed">{meal.description}</p>
                    {meal.ingredients && (
                      <div className="mt-2 bg-amber-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-medium text-amber-700 mb-0.5">Ingrediente:</p>
                        <p className="text-xs text-amber-800">{meal.ingredients}</p>
                      </div>
                    )}
                    {meal.prepNotes && (
                      <div className="mt-2 bg-blue-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-medium text-blue-700 mb-0.5">Pregatiri din timp:</p>
                        <p className="text-xs text-blue-800">{meal.prepNotes}</p>
                      </div>
                    )}
                    {meal.notes && (
                      <div className="mt-2 bg-purple-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-medium text-purple-700 mb-0.5">Note:</p>
                        <p className="text-xs text-purple-800">{meal.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs italic">Nicio reteta setata</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-x-3 top-[5%] bottom-[5%] z-50 bg-white rounded-3xl shadow-2xl max-w-md mx-auto overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-900">{editMeal ? "Editeaza masa" : "Adauga masa"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ziua</label>
                  <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900">
                    {dayNames.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Masa</label>
                  <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900">
                    {mealTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>{mt.icon} {mt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Titlu reteta *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required placeholder="Ex: Ciorba de sfecla rosie"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descriere / Reteta</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5} placeholder="Se caleste ceapa cu ardei, se adauga morcov cuburi..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ingrediente</label>
                <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={3} placeholder="Ceapa, morcov, telina, pastarnac, sfecla rosie, cartofi, patrunjel"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pregatiri din timp</label>
                <textarea value={form.prepNotes} onChange={(e) => setForm({ ...form, prepNotes: e.target.value })}
                  rows={2} placeholder="De azi sa toace ceapa, sa dea morcov pe razatoare..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Note speciale</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="Ciorba sa iasa rosie, nu culoarea pamantului"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50">
                {saving ? "Se salveaza..." : editMeal ? "Salveaza" : "Adauga"}
              </button>
            </form>
          </div>
        </>
      )}
    </AppLayout>
  );
}
