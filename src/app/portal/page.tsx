"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardData {
  parent: { firstName: string; lastName: string; email: string };
  child: { firstName: string; lastName: string; age: number; location: string } | null;
  subscription: {
    planName: string;
    planColor: string;
    status: string;
    isActive: boolean;
    daysLeft: number;
    endDate: string;
    features: string[];
  } | null;
  progressNotes: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
  }>;
  recentEvaluations: Array<{
    id: string;
    date: string;
    communicationLevel: string;
    sociability: string;
    autonomy: string;
    observations: string | null;
  }>;
}

const categoryIcons: Record<string, string> = {
  teme: "📝",
  comportament: "🧠",
  sanatate: "💊",
  social: "👥",
  general: "📋",
};

const categoryLabels: Record<string, string> = {
  teme: "Teme & Educatie",
  comportament: "Comportament",
  sanatate: "Sanatate",
  social: "Social",
  general: "General",
};

const levelLabels: Record<string, { label: string; color: string }> = {
  bun: { label: "Bun", color: "text-green-600 bg-green-50" },
  mediu: { label: "Mediu", color: "text-yellow-600 bg-yellow-50" },
  mic: { label: "Necesita atentie", color: "text-red-600 bg-red-50" },
  sociabil: { label: "Sociabil", color: "text-green-600 bg-green-50" },
  retras: { label: "Retras", color: "text-yellow-600 bg-yellow-50" },
  agresiv: { label: "Agresiv", color: "text-red-600 bg-red-50" },
  independent: { label: "Independent", color: "text-green-600 bg-green-50" },
  partial: { label: "Partial", color: "text-yellow-600 bg-yellow-50" },
  dependent: { label: "Dependent", color: "text-red-600 bg-red-50" },
};

// ==================== TIPS SMART ====================

const tipsForParents = [
  { icon: "💡", title: "Rutina zilnica", text: "Stabileste o rutina fixa: dimineata, masa, teme, joaca, seara. Predictibilitatea ii ofera copilului siguranta." },
  { icon: "🎯", title: "Lauda efortul", text: "Lauda efortul, nu rezultatul. 'Te-ai straduit mult!' e mai eficient decat 'Esti destept!'." },
  { icon: "📖", title: "Citit impreuna", text: "15 minute de citit impreuna zilnic dezvolta vocabularul si legatura emotionala." },
  { icon: "🧩", title: "Jocuri educative", text: "Puzzle-urile, jocurile de memorie si constructiile dezvolta gandirea logica." },
  { icon: "🥗", title: "Alimentatie sanatoasa", text: "Implica copilul in prepararea mesei. E un moment de invatare si legatura." },
  { icon: "🏃", title: "Miscare zilnica", text: "30 minute de activitate fizica zilnica imbunatatesc concentrarea si somnul." },
  { icon: "💬", title: "Comunicare deschisa", text: "Intreaba 'Ce ti s-a parut interesant azi?' in loc de 'Ce ai facut la scoala?'." },
  { icon: "😴", title: "Somn suficient", text: "Copiii de 6-12 ani au nevoie de 9-12 ore de somn. Limiteaza ecranele inainte de culcare." },
];

const tipsForKids = [
  { icon: "🌟", title: "Fii curios!", text: "Pune intrebari despre tot ce te inconjoara. Fiecare intrebare te face mai destept!" },
  { icon: "📚", title: "Citeste in fiecare zi", text: "Chiar si 10 minute pe zi. Cartile sunt ca superpowerele - te fac mai puternic!" },
  { icon: "🎨", title: "Deseneaza si creeaza", text: "Nu exista desene gresite. Fiecare desen spune o poveste frumoasa." },
  { icon: "🤝", title: "Fii un prieten bun", text: "Ajuta-i pe ceilalti cand au nevoie. Un zambet poate schimba ziua cuiva!" },
  { icon: "💪", title: "Nu renunta!", text: "Cand ceva e greu, incearca din nou. Fiecare greseala te invata ceva nou." },
];

const recipes = [
  { icon: "🥞", title: "Clatite cu banane", text: "2 oua + 1 banana zdrobita + 2 linguri faina. Mixeaza si coace pe ambele parti. Serveste cu miere!" },
  { icon: "🥪", title: "Sandwich vesel", text: "Paine, branza, rosie, castravete. Decoreaza fata zambitoare din legume pe felie!" },
  { icon: "🍝", title: "Paste cu sos magic", text: "Paste fierte + rosii pasate + un pic de smantana + branza rasa. Gata in 15 min!" },
  { icon: "🥣", title: "Smoothie energizant", text: "1 banana + 5 capsuni + 200ml lapte + 1 lingura miere. Mixeaza 30 secunde!" },
  { icon: "🍪", title: "Biscuiti cu ovaz", text: "200g fulgi ovaz + 2 banane zdrobite + ciocolata. Coace 15 min la 180°C." },
];

const activities = [
  { icon: "🎭", title: "Teatru de papusi", text: "Faceti papusi din sosete vechi si inventati o poveste impreuna. Dezvolta creativitatea!" },
  { icon: "🔬", title: "Experiment: Vulcanul", text: "Bicarbonat + otet + colorant alimentar intr-un pahar. Eruptie garantata!" },
  { icon: "🗺️", title: "Vanatoare de comori", text: "Ascunde biletzele cu indicii prin casa. Ultima duce la un premiu mic!" },
  { icon: "🌱", title: "Gradina in ghiveci", text: "Planteaza seminte de busuioc sau patrunjel. Copilul invata responsabilitatea." },
  { icon: "🎵", title: "Concert acasa", text: "Oale, linguri, cutii - improvizati instrumente muzicale si cantati impreuna!" },
];

export default function PortalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("progres");
  const [weeklyMenu, setWeeklyMenu] = useState<Array<{
    id: string; dayOfWeek: number; mealType: string; title: string;
    description: string; ingredients: string | null; notes: string | null; prepNotes: string | null;
  }>>([]);
  const [menuWeekStart, setMenuWeekStart] = useState("");
  const [menuDay, setMenuDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0=Luni
  });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then((r) => {
        if (r.status === 401) throw new Error("unauth");
        return r.json();
      })
      .then(setData)
      .catch(() => router.push("/portal/login"))
      .finally(() => setLoading(false));

    // Fetch weekly menu
    fetch("/api/retetar")
      .then((r) => r.json())
      .then((data) => {
        setWeeklyMenu(data.meals || []);
        setMenuWeekStart(data.weekStart || "");
      })
      .catch(() => {});
  }, [router]);

  async function handleLogout() {
    await fetch("/api/portal/auth", { method: "DELETE" });
    router.push("/portal/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🏠</span>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { parent, child, subscription, progressNotes, recentEvaluations } = data;
  const features = subscription?.features || [];
  const isActive = subscription?.isActive ?? false;

  const tabs = [
    { id: "progres", label: "Progres", icon: "📊", feature: null },
    { id: "retetar", label: "Meniu", icon: "🍽️", feature: null },
    { id: "tips-parinti", label: "Sfaturi Parinti", icon: "💡", feature: null },
    { id: "tips-copii", label: "Sfaturi Copii", icon: "🌟", feature: null },
    { id: "retete", label: "Retete", icon: "🥗", feature: "retete" },
    { id: "activitati", label: "Activitati", icon: "🎯", feature: "activitati" },
    { id: "evaluari", label: "Evaluari", icon: "📋", feature: "evaluari" },
  ];

  const availableTabs = tabs.filter(
    (t) => t.feature === null || features.includes(t.feature)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 pt-8 pb-6 safe-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-sm">Buna ziua,</p>
              <h1 className="text-xl font-bold">{parent.firstName} {parent.lastName}</h1>
            </div>
            <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm px-3 py-1.5 bg-white/10 rounded-lg">
              Iesire
            </button>
          </div>

          {/* Child card */}
          {child && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  👦
                </div>
                <div>
                  <p className="font-semibold">{child.firstName} {child.lastName}</p>
                  <p className="text-indigo-200 text-sm">{child.age} ani &bull; {child.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription badge */}
          {subscription && (
            <div className={`mt-3 rounded-xl p-3 ${isActive ? "bg-white/10" : "bg-red-500/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📦</span>
                  <span className="font-medium text-sm">{subscription.planName}</span>
                </div>
                {isActive ? (
                  <span className="text-xs bg-green-400/20 text-green-100 px-2 py-0.5 rounded-full">
                    Activ &bull; {subscription.daysLeft} zile ramase
                  </span>
                ) : (
                  <span className="text-xs bg-red-400/30 text-red-100 px-2 py-0.5 rounded-full">
                    Expirat
                  </span>
                )}
              </div>
            </div>
          )}

          {!subscription && (
            <div className="mt-3 rounded-xl p-3 bg-yellow-500/20">
              <p className="text-sm text-yellow-100">⚠️ Nu ai un abonament activ. Contacteaza centrul pentru activare.</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        {/* Tab navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Not active overlay */}
        {!isActive && subscription && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center mb-4">
            <span className="text-4xl mb-3 block">🔒</span>
            <h3 className="font-bold text-red-800 text-lg">Abonament expirat</h3>
            <p className="text-red-600 text-sm mt-2">
              Contacteaza centrul pentru reinnoirea abonamentului si acces complet la portal.
            </p>
          </div>
        )}

        {/* PROGRES TAB */}
        {activeTab === "progres" && isActive && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Progresul lui {child?.firstName || "copilul"}</h2>

            {progressNotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <span className="text-4xl mb-3 block">📊</span>
                <p className="text-gray-500 text-sm">Inca nu sunt note de progres adaugate.</p>
              </div>
            ) : (
              progressNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{categoryIcons[note.category] || "📋"}</span>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {categoryLabels[note.category] || note.category}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(note.createdAt).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{note.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* RETETAR / MENIU TAB */}
        {activeTab === "retetar" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Meniul saptamanii</h2>
              {menuWeekStart && (
                <span className="text-xs text-gray-400">
                  {new Date(menuWeekStart).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} -
                  {" "}{new Date(new Date(menuWeekStart).getTime() + 6 * 86400000).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>

            {/* Day selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {["Lun", "Mar", "Mie", "Joi", "Vin", "Sam", "Dum"].map((name, i) => (
                <button key={i} onClick={() => setMenuDay(i)}
                  className={`min-w-[44px] py-2 rounded-xl text-xs font-medium transition ${
                    menuDay === i ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"
                  }`}>
                  {name}
                </button>
              ))}
            </div>

            {/* Meals for selected day */}
            {[
              { id: "mic_dejun", label: "Mic dejun", icon: "☀️" },
              { id: "pranz", label: "Pranz", icon: "🍽️" },
              { id: "cina", label: "Cina", icon: "🌙" },
            ].map((mt) => {
              const meal = weeklyMenu.find((m) => m.dayOfWeek === menuDay && m.mealType === mt.id);
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
                      {meal.notes && (
                        <p className="text-xs text-purple-600 mt-2 bg-purple-50 rounded-xl p-2">{meal.notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs italic">Meniu nesetat</p>
                  )}
                </div>
              );
            })}

            {weeklyMenu.length === 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <span className="text-3xl block mb-2">🍽️</span>
                <p className="text-gray-500 text-sm">Meniul saptamanii nu a fost inca setat de catre centru.</p>
              </div>
            )}
          </div>
        )}

        {/* EVALUARI TAB */}
        {activeTab === "evaluari" && isActive && features.includes("evaluari") && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Evaluari recente</h2>

            {recentEvaluations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <span className="text-4xl mb-3 block">📋</span>
                <p className="text-gray-500 text-sm">Inca nu sunt evaluari disponibile.</p>
              </div>
            ) : (
              recentEvaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-400 mb-3">
                    {new Date(ev.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Comunicare", value: ev.communicationLevel },
                      { label: "Social", value: ev.sociability },
                      { label: "Autonomie", value: ev.autonomy },
                    ].map((item) => {
                      const level = levelLabels[item.value] || { label: item.value, color: "text-gray-600 bg-gray-50" };
                      return (
                        <div key={item.label} className="text-center">
                          <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${level.color}`}>
                            {level.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {ev.observations && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-xl p-3">{ev.observations}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TIPS PARINTI TAB */}
        {activeTab === "tips-parinti" && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Sfaturi pentru parinti</h2>
            <p className="text-gray-500 text-sm">Idei practice pentru fiecare zi cu copilul tau.</p>
            {tipsForParents.map((tip, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{tip.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIPS COPII TAB */}
        {activeTab === "tips-copii" && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Sfaturi pentru {child?.firstName || "copii"}</h2>
            <p className="text-gray-500 text-sm">Arata-i copilului aceste sfaturi! Sunt scrise special pentru el/ea.</p>
            {tipsForKids.map((tip, i) => (
              <div key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{tip.icon}</span>
                  <div>
                    <h3 className="font-bold text-indigo-900">{tip.title}</h3>
                    <p className="text-indigo-700 text-sm mt-1 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RETETE TAB */}
        {activeTab === "retete" && isActive && features.includes("retete") && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Retete sanatoase si rapide</h2>
            <p className="text-gray-500 text-sm">Retete simple pe care le puteti face impreuna cu copilul.</p>
            {recipes.map((recipe, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{recipe.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{recipe.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITATI TAB */}
        {activeTab === "activitati" && isActive && features.includes("activitati") && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Activitati de facut acasa</h2>
            <p className="text-gray-500 text-sm">Activitati distractive si educative care intaresc legatura parinte-copil.</p>
            {activities.map((act, i) => (
              <div key={i} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{act.icon}</span>
                  <div>
                    <h3 className="font-bold text-emerald-900">{act.title}</h3>
                    <p className="text-emerald-700 text-sm mt-1 leading-relaxed">{act.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
