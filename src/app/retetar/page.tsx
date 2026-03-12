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
  calories: number | null;
  notes: string | null;
  prepNotes: string | null;
}

const dayNames = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];
const mealTypes = [
  { id: "mic_dejun", label: "Mic dejun", icon: "\u2600\uFE0F" },
  { id: "pranz", label: "Pranz", icon: "\uD83C\uDF7D\uFE0F" },
  { id: "cina", label: "Cina", icon: "\uD83C\uDF19" },
];

const INGREDIENT_CATEGORIES = [
  { name: "Legume", icon: "\uD83E\uDD6C", items: ["ceapa", "morcov", "cartofi", "rosii", "ardei", "varza", "usturoi", "spanac", "fasole verde", "mazare", "dovlecei", "vinete", "sfecla", "telina", "pastarnac", "patrunjel radacina"] },
  { name: "Lactate", icon: "\uD83E\uDDC0", items: ["oua", "branza sarata", "cas", "smantana", "lapte", "unt", "iaurt", "telemea"] },
  { name: "Cereale", icon: "\uD83C\uDF3E", items: ["paste", "orez", "mamaliga", "faina", "paine", "gris", "bulgur", "couscous"] },
  { name: "Carne", icon: "\uD83C\uDF57", items: ["pui", "porc", "vita", "peste", "sunca", "carnati", "afumatura", "ton conserva"] },
  { name: "Conserve", icon: "\uD83E\uDD6B", items: ["fasole boabe", "linte", "naut", "rosii conserva", "bulion", "ulei", "otet", "zahar", "bors"] },
  { name: "Condimente", icon: "\uD83C\uDF3F", items: ["sare", "piper", "boia", "oregano", "cimbru", "dafin", "patrunjel", "marar", "leustean"] },
];

const MEAL_PRESETS = [
  { label: "De post", icon: "\uD83D\uDE4F", value: "de post, fara carne, fara lactate, fara oua" },
  { label: "Cu carne", icon: "\uD83C\uDF56", value: "cu carne" },
  { label: "Supa/Ciorba", icon: "\uD83C\uDF72", value: "supa sau ciorba traditionala romaneasca" },
  { label: "Mic dejun", icon: "\u23F0", value: "mic dejun simplu si consistent" },
  { label: "Pt copii", icon: "\uD83D\uDC76", value: "retete simple, prietenoase pentru copii" },
  { label: "Dulce", icon: "\uD83C\uDF70", value: "desert sau ceva dulce" },
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
  return d === 0 ? 6 : d - 1;
}

function parseRecipes(text: string): string[] {
  const parts = text.split(/(?=\n\d+\.\s)/);
  const recipes = parts.filter(p => p.trim().length > 30);
  return recipes.length >= 2 ? recipes : [];
}

export default function RetetarPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);

  // AI Suggest state
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [extraIngredients, setExtraIngredients] = useState("");
  const [mealType, setMealType] = useState("pranz");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [isListening, setIsListening] = useState(false);

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

  function toggleIngredient(item: string) {
    setSelectedIngredients(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Browserul tau nu suporta dictarea vocala. Incearca Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "ro-RO";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const spoken = transcript.toLowerCase().split(/[,]|\bsi\b|\bcu\b/).map((s: string) => s.trim()).filter(Boolean);
      const allKnown = INGREDIENT_CATEGORIES.flatMap(c => c.items);
      const matched: string[] = [];
      const unmatched: string[] = [];

      for (const word of spoken) {
        const found = allKnown.find(ing => ing.includes(word) || word.includes(ing));
        if (found && !selectedIngredients.includes(found)) {
          matched.push(found);
        } else if (!found) {
          unmatched.push(word);
        }
      }

      if (matched.length > 0) {
        setSelectedIngredients(prev => [...new Set([...prev, ...matched])]);
      }
      if (unmatched.length > 0) {
        setExtraIngredients(prev => prev ? `${prev}, ${unmatched.join(", ")}` : unmatched.join(", "));
      }
    };

    recognition.start();
  }

  const totalIngredientCount = selectedIngredients.length + (extraIngredients.trim() ? extraIngredients.split(",").filter(s => s.trim()).length : 0);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    const allIngredients = [
      ...selectedIngredients,
      ...extraIngredients.split(",").map(s => s.trim()).filter(Boolean),
    ].join(", ");

    if (!allIngredients) return;

    setSuggesting(true);
    setSuggestions("");
    try {
      const res = await fetch("/api/retetar/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: allIngredients,
          mealType,
          preferences: selectedPreset || "",
        }),
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
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{dayNames[selectedDay]}</h2>
            {(() => {
              const totalCal = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
              return totalCal > 0 ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                  Total: {totalCal} kcal
                </span>
              ) : null;
            })()}
          </div>

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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">{meal.title}</p>
                      {meal.calories && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{meal.calories} kcal</span>
                      )}
                    </div>
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
          <div className="mt-3 space-y-3">

            {/* Selected ingredients chips */}
            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 bg-green-50 rounded-2xl p-3 border border-green-100">
                <p className="w-full text-[10px] font-medium text-green-600 mb-1">Selectate ({selectedIngredients.length}):</p>
                {selectedIngredients.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleIngredient(item)}
                    className="bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 active:scale-95 transition"
                  >
                    {item}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {INGREDIENT_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(i)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                    activeCategory === i
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Ingredient grid for active category */}
            <div className="grid grid-cols-3 gap-2">
              {INGREDIENT_CATEGORIES[activeCategory].items.map(item => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleIngredient(item)}
                    className={`py-2.5 px-2 rounded-xl text-sm font-medium text-center transition active:scale-95 ${
                      isSelected
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Voice + extra textarea */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 mb-1 block">Alte ingrediente</label>
                <textarea
                  value={extraIngredients}
                  onChange={(e) => setExtraIngredients(e.target.value)}
                  rows={2}
                  placeholder="Scrie sau dicteaza alte ingrediente..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={startListening}
                className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : "bg-gray-100 active:bg-gray-200"
                }`}
              >
                <svg className={`w-6 h-6 ${isListening ? "text-white" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v4m-4 0h8M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" />
                </svg>
              </button>
            </div>

            {/* Meal type + Presets */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Tip masa</label>
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

            <div className="flex flex-wrap gap-2">
              {MEAL_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSelectedPreset(selectedPreset === preset.value ? null : preset.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-95 ${
                    selectedPreset === preset.value
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  <span>{preset.icon}</span>
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSuggest}
              disabled={suggesting || totalIngredientCount === 0}
              className="w-full py-3.5 bg-green-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              {suggesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  AI-ul gandeste...
                </>
              ) : (
                <>
                  Sugereaza retete
                  {totalIngredientCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {totalIngredientCount} ingrediente
                    </span>
                  )}
                </>
              )}
            </button>

            {/* AI Response - recipe cards */}
            {suggestions && (() => {
              const recipes = parseRecipes(suggestions);
              if (recipes.length > 0) {
                return (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-green-700">Sugestii AI (pt 150 portii):</p>
                    {recipes.map((recipe, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-green-200 p-4 shadow-sm">
                        <div className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                          {recipe.trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="text-[10px] font-medium text-green-700 mb-2">Sugestii AI (pt 150 portii):</p>
                  <div className="text-sm text-green-900 whitespace-pre-line leading-relaxed">
                    {suggestions}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
