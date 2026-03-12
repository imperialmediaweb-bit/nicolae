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
  { id: "mic_dejun", label: "Mic dejun", icon: "\u2600\uFE0F" },
  { id: "pranz", label: "Pranz", icon: "\uD83C\uDF7D\uFE0F" },
  { id: "cina", label: "Cina", icon: "\uD83C\uDF19" },
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

function getTodayDayOfWeek(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // Convert Sunday=0 to Monday-based (0=Mon, 6=Sun)
}

export default function RetetarPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);

  // AI Suggest state
  const [showSuggest, setShowSuggest] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType] = useState("cina");
  const [preferences, setPreferences] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState("");

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

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredients.trim()) return;
    setSuggesting(true);
    setSuggestions("");
    try {
      const res = await fetch("/api/retetar/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, mealType, preferences }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || "Nu am putut genera sugestii.");
    } catch {
      setSuggestions("Eroare la generarea sugestiilor. Incearca din nou.");
    } finally {
      setSuggesting(false);
    }
  }

  const dayMeals = meals.filter((m) => m.dayOfWeek === selectedDay);

  return (
    <AppLayout title="Meniu Saptamanal">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-3 mb-4">
        <button onClick={prevWeek} className="p-2 text-gray-400 active:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">{formatWeek(weekStart)}</p>
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

          {mealTypes.map((mt) => {
            const meal = dayMeals.find((m) => m.mealType === mt.id);

            return (
              <div key={mt.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{mt.icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{mt.label}</h3>
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
                  <p className="text-gray-400 text-xs italic">Nu e setat inca</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Suggest section */}
      <div className="mt-6">
        <button
          onClick={() => setShowSuggest(!showSuggest)}
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
            showSuggest
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-green-600 text-white shadow-lg active:scale-[0.98]"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Ce gatesc cu ce am?
        </button>

        {showSuggest && (
          <form onSubmit={handleSuggest} className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ce ingrediente ai in frigider? *</label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={3}
                required
                placeholder="Ex: cartofi, ceapa, morcov, branza, oua, smantana, mamaliga..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tip masa</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900"
                >
                  {mealTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.icon} {mt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preferinte</label>
                <input
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="Ex: de post, fara lactate"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={suggesting || !ingredients.trim()}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {suggesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  AI-ul gandeste...
                </>
              ) : (
                "Sugereaza retete"
              )}
            </button>

            {suggestions && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-[10px] font-medium text-green-700 mb-2">Sugestii AI:</p>
                <div className="text-sm text-green-900 whitespace-pre-line leading-relaxed prose-sm">
                  {suggestions}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </AppLayout>
  );
}
