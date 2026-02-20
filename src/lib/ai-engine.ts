interface EvaluationData {
  beneficiary: {
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    location: string;
    hasFamily: string;
    housingStatus: string;
    familyContactFreq: string | null;
    institutionHistory: string | null;
    knownDiseases: string | null;
    medication: string | null;
    disabilities: string | null;
    priorPsychEval: string;
  };
  evaluation: {
    communicationLevel: string;
    stressReaction: string;
    sociability: string;
    autonomy: string;
    sleepQuality: string;
    appetite: string;
    sadness: boolean;
    anxiety: boolean;
    anger: boolean;
    apathy: boolean;
    hope: boolean;
    observations: string | null;
  };
}

export interface AIReport {
  contextPersonal: string;
  profilEmotional: string;
  nevoiPrincipale: string[];
  riscuri: string[];
  recomandariPersonal: string[];
  planSprijin: string[];
  generatedAt: string;
}

// ---------- SHARED: get API key from DB or env ----------
import { getConfig } from "./config";

async function getAllApiKeys(): Promise<Array<{ provider: string; key: string }>> {
  const keys: Array<{ provider: string; key: string }> = [];

  const openaiKey = await getConfig("OPENAI_API_KEY");
  if (openaiKey && !openaiKey.includes("your-")) {
    keys.push({ provider: "openai", key: openaiKey });
  }

  const anthropicKey = await getConfig("ANTHROPIC_API_KEY");
  if (anthropicKey && !anthropicKey.includes("your-")) {
    keys.push({ provider: "anthropic", key: anthropicKey });
  }

  const geminiKey = await getConfig("GEMINI_API_KEY");
  if (geminiKey && !geminiKey.includes("your-")) {
    keys.push({ provider: "gemini", key: geminiKey });
  }

  return keys;
}

// ---------- SHARED: call AI with automatic fallback ----------
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const providers = await getAllApiKeys();
  if (providers.length === 0) throw new Error("NO_API_KEY");

  let lastError: Error | null = null;

  for (const { provider, key } of providers) {
    try {
      if (provider === "openai") {
        return await callOpenAI(key, systemPrompt, userPrompt);
      } else if (provider === "anthropic") {
        return await callClaude(key, systemPrompt, userPrompt);
      } else {
        return await callGemini(key, systemPrompt, userPrompt);
      }
    } catch (err) {
      console.warn(`Provider ${provider} failed, trying next...`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("ALL_PROVIDERS_FAILED");
}

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API error:", err);
    throw new Error("OPENAI_API_ERROR");
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Claude API error:", err);
    throw new Error("CLAUDE_API_ERROR");
  }

  const result = await response.json();
  return result.content[0].text;
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini API error:", err);
    throw new Error("GEMINI_API_ERROR");
  }

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

// ---------- PROFIL PSIHOSOCIAL ----------
export async function generateAIReport(data: EvaluationData): Promise<AIReport> {
  try {
    return await generateWithClaude(data);
  } catch (error) {
    console.error("AI generation failed, using rule-based:", error);
    return generateRuleBased(data);
  }
}

async function generateWithClaude(data: EvaluationData): Promise<AIReport> {
  const systemPrompt = `Ești un membru experimentat al echipei de sprijin dintr-un centru social. Creezi note orientative interne, personalizate pentru fiecare beneficiar.

REGULI STRICTE:
- NU ești medic, psiholog sau psihiatru. NU pui și NU sugerezi diagnostice.
- NU folosești NICIODATĂ termeni clinici: diagnostic, tulburare, patologie, sindrom, simptom, depresie, PTSD, autism, schizofrenie, sau orice alt termen medical/psihiatric.
- Folosești DOAR limbaj descriptiv și observațional: "s-a observat că...", "personalul a remarcat...", "pare să...", "ar putea beneficia de..."
- NU faci afirmații categorice. Folosești: "se pare", "ar putea", "s-a remarcat", "personalul semnalează".
- Tonul este bland, empatic, orientat spre sprijin practic.
- La "riscuri" — formulezi BLAND: "ar fi util să se acorde atenție la...", "personalul ar putea monitoriza..."
- Recomandările sunt PRACTICE și SIMPLE — ce poate face personalul din centru.

PERSONALIZARE - FOARTE IMPORTANT:
- Fiecare notă trebuie să fie UNICĂ, specifică persoanei respective. NU folosi formulări generice.
- Menționează detalii concrete din datele persoanei: vârstă, situație familială, boli, medicație, istoric.
- Dacă persoana are boli/medicație/dizabilități, include recomandări SPECIFICE pentru acelea.
- Dacă persoana are contact cu familia, sugerează cum poate fi folosit asta în sprijin.
- Dacă e fără adăpost vs. în centru, adaptează complet tonul și sugestiile.
- Recomandările să fie concrete, nu abstracte (ex: "activitate de desen marți/joi" nu "activități creative").
- Planul de sprijin să conțină pași concreți, cu orizont de timp (ex: "în prima săptămână", "lunar").
- Variază stilul de scriere. NU repeta aceleași formule de la un raport la altul.

Răspunzi DOAR în format JSON valid, fără markdown, fără backticks.
Limba: română.
IMPORTANT: Datele introduse pot conține greșeli de scriere (ex: "TRMSI" în loc de "TRIMIS"). Corectează automat în răspuns.`;

  const { beneficiary: b, evaluation: e } = data;
  const userPrompt = `Creează o notă orientativă internă (NU diagnostic, NU evaluare profesională) bazată pe observațiile personalului de mai jos.

INFORMAȚII DESPRE PERSOANĂ:
- Prenume: ${b.firstName}, ${b.age} ani, ${b.sex === "M" ? "masculin" : "feminin"}
- Locație: ${b.location}
- Situație familială: ${b.hasFamily} | Locuire: ${b.housingStatus}
- Contact cu familia: ${b.familyContactFreq || "necunoscut"}
- Istoric instituționalizare: ${b.institutionHistory || "nu"}
- Probleme de sănătate semnalate: ${b.knownDiseases || "nu"} | Medicație: ${b.medication || "nu"}
- Limitări semnalate: ${b.disabilities || "nu"} | Evaluare psihologică anterioară: ${b.priorPsychEval}

CE A OBSERVAT PERSONALUL:
- Comunicare: ${e.communicationLevel}
- Reacție la stres: ${e.stressReaction}
- Sociabilitate: ${e.sociability}
- Autonomie: ${e.autonomy}
- Somn: ${e.sleepQuality}
- Apetit: ${e.appetite}

DISPOZIȚIE OBSERVATĂ:
- Tristețe frecventă: ${e.sadness ? "da" : "nu"}
- Neliniște: ${e.anxiety ? "da" : "nu"}
- Iritabilitate: ${e.anger ? "da" : "nu"}
- Lipsă de interes: ${e.apathy ? "da" : "nu"}
- Speranță/motivație: ${e.hope ? "da" : "nu"}

Note ale personalului: ${e.observations || "fără"}

IMPORTANT: Folosește DOAR limbaj bland, observațional, fără termeni clinici. Formulează totul ca observații ale personalului ("s-a remarcat", "pare să", "ar putea beneficia de").

Răspunde STRICT în acest format JSON (fără alte texte):
{
  "contextPersonal": "paragraf scurt despre situația persoanei, formulat bland (nu folosit numele de familie)",
  "profilEmotional": "paragraf despre ce a observat personalul în comportament și dispoziție (fără termeni clinici)",
  "nevoiPrincipale": ["de ce ar putea avea nevoie persoana 1", "nevoie 2", "..."],
  "riscuri": ["aspect la care personalul ar fi bine să fie atent 1", "aspect 2", "..."],
  "recomandariPersonal": ["sugestie practică pentru echipă 1", "sugestie 2", "..."],
  "planSprijin": ["pas concret de sprijin 1", "pas 2", "..."],
  "generatedAt": "${new Date().toISOString()}"
}`;

  const text = await callAI(systemPrompt, userPrompt);

  // Extract JSON from response (handle if wrapped in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON response");

  const report = JSON.parse(jsonMatch[0]) as AIReport;
  report.generatedAt = new Date().toISOString();
  return report;
}

// ---------- ANALIZA FARMACIE AI ----------
export interface PharmacyInsight {
  sumarGeneral: string;
  alerteUrgente: string[];
  recomandari: string[];
  trenduri: string[];
  generatedAt: string;
}

interface MedicationForAnalysis {
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: string | null;
  category: string;
  logs: Array<{
    action: string;
    quantity: number;
    date: string;
  }>;
}

export async function generatePharmacyInsights(
  medications: MedicationForAnalysis[]
): Promise<PharmacyInsight> {
  try {
    return await generatePharmacyWithClaude(medications);
  } catch (error) {
    console.error("Pharmacy AI failed, using rule-based:", error);
    return generatePharmacyRuleBased(medications);
  }
}

async function generatePharmacyWithClaude(medications: MedicationForAnalysis[]): Promise<PharmacyInsight> {
  const systemPrompt = `Ești un farmacist-șef inteligent care analizează stocul de medicamente al unui centru social.
Analizezi datele și dai RECOMANDĂRI PRACTICE, SCURTE și CLARE.
Identifici probleme, trenduri de consum, și medicamente care ar putea ajunge la 0.
Răspunzi DOAR în format JSON valid, fără markdown, fără backticks.
Limba: română. Fii concis - maxim 1-2 propoziții per item.`;

  const now = new Date();

  const medsData = medications.map(m => {
    const daysToExpiry = m.expiryDate
      ? Math.ceil((new Date(m.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate daily consumption from release logs
    const releaseLogs = m.logs.filter(l => l.action === "eliberare");
    const totalReleased = releaseLogs.reduce((sum, l) => sum + l.quantity, 0);
    const oldestLog = releaseLogs.length > 0
      ? new Date(releaseLogs[releaseLogs.length - 1].date)
      : null;
    const daySpan = oldestLog
      ? Math.max(1, Math.ceil((now.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const dailyConsumption = daySpan > 0 ? (totalReleased / daySpan).toFixed(1) : "0";
    const daysUntilEmpty = daySpan > 0 && parseFloat(dailyConsumption) > 0
      ? Math.floor(m.stock / parseFloat(dailyConsumption))
      : null;

    return {
      nume: m.name,
      categorie: m.category,
      stoc: m.stock,
      stocMinim: m.minStock,
      unitate: m.unit,
      zileExpirare: daysToExpiry,
      consumZilnic: dailyConsumption,
      zileRamase: daysUntilEmpty,
      nrEliberari: releaseLogs.length,
    };
  });

  const userPrompt = `Analizează stocul farmaciei (${medications.length} medicamente):

${JSON.stringify(medsData, null, 2)}

Data curentă: ${now.toISOString().split("T")[0]}

Răspunde STRICT în acest format JSON:
{
  "sumarGeneral": "1-2 propoziții despre starea generală a farmaciei",
  "alerteUrgente": ["alerta urgentă 1 (stoc critic, expirate, etc.)", "..."],
  "recomandari": ["recomandare practică 1", "recomandare 2", "..."],
  "trenduri": ["trend observat 1 (consum mare la X, etc.)", "..."],
  "generatedAt": "${now.toISOString()}"
}`;

  const text = await callAI(systemPrompt, userPrompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON response");

  const insight = JSON.parse(jsonMatch[0]) as PharmacyInsight;
  insight.generatedAt = now.toISOString();
  return insight;
}

function generatePharmacyRuleBased(medications: MedicationForAnalysis[]): PharmacyInsight {
  const now = new Date();
  const alerteUrgente: string[] = [];
  const recomandari: string[] = [];
  const trenduri: string[] = [];

  const lowStock = medications.filter(m => m.stock <= m.minStock);
  const zeroStock = medications.filter(m => m.stock === 0);

  // Check expiry
  const expiringSoon = medications.filter(m => {
    if (!m.expiryDate) return false;
    const days = Math.ceil((new Date(m.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });
  const expired = medications.filter(m => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate) < now;
  });

  // Alerte urgente
  if (zeroStock.length > 0) {
    alerteUrgente.push(`${zeroStock.length} medicamente cu stoc ZERO: ${zeroStock.map(m => m.name).join(", ")}`);
  }
  if (lowStock.length > zeroStock.length) {
    const onlyLow = lowStock.filter(m => m.stock > 0);
    alerteUrgente.push(`${onlyLow.length} medicamente sub stocul minim: ${onlyLow.map(m => `${m.name} (${m.stock}/${m.minStock})`).join(", ")}`);
  }
  if (expired.length > 0) {
    alerteUrgente.push(`${expired.length} medicamente EXPIRATE: ${expired.map(m => m.name).join(", ")} - trebuie retrase imediat!`);
  }
  if (expiringSoon.length > 0) {
    alerteUrgente.push(`${expiringSoon.length} medicamente expiră în 30 zile: ${expiringSoon.map(m => m.name).join(", ")}`);
  }

  // Consumption analysis
  medications.forEach(m => {
    const releaseLogs = m.logs.filter(l => l.action === "eliberare");
    const totalReleased = releaseLogs.reduce((sum, l) => sum + l.quantity, 0);

    if (releaseLogs.length >= 3) {
      const oldestLog = new Date(releaseLogs[releaseLogs.length - 1].date);
      const daySpan = Math.max(1, Math.ceil((now.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRate = totalReleased / daySpan;

      if (dailyRate > 0 && m.stock > 0) {
        const daysLeft = Math.floor(m.stock / dailyRate);
        if (daysLeft <= 7) {
          trenduri.push(`${m.name}: la ritmul actual de consum, stocul se termină în ~${daysLeft} zile`);
        }
      }

      if (dailyRate > 2) {
        trenduri.push(`${m.name}: consum ridicat (${dailyRate.toFixed(1)} ${m.unit}/zi)`);
      }
    }
  });

  // Recomandari
  if (lowStock.length > 0) {
    recomandari.push(`Comandă urgentă pentru: ${lowStock.map(m => m.name).join(", ")}`);
  }
  if (expired.length > 0) {
    recomandari.push("Retrage imediat medicamentele expirate și înregistrează ajustarea de stoc");
  }
  if (expiringSoon.length > 0) {
    recomandari.push("Folosește cu prioritate medicamentele care expiră curând (FIFO)");
  }

  const noLogs = medications.filter(m => m.logs.length === 0 && m.stock > 0);
  if (noLogs.length > 0) {
    recomandari.push(`${noLogs.length} medicamente fără mișcare de stoc - verifică dacă mai sunt necesare`);
  }

  if (alerteUrgente.length === 0) alerteUrgente.push("Nicio alertă urgentă la acest moment");
  if (recomandari.length === 0) recomandari.push("Stocul este bine gestionat, continuă monitorizarea");
  if (trenduri.length === 0) trenduri.push("Insuficiente date pentru a detecta trenduri clare");

  const total = medications.length;
  const okCount = total - lowStock.length;
  const sumarGeneral = `Farmacie cu ${total} medicamente, din care ${okCount} au stoc suficient. ${lowStock.length > 0 ? `${lowStock.length} necesită reaprovizionare urgentă.` : "Toate stocurile sunt la nivel optim."}`;

  return {
    sumarGeneral,
    alerteUrgente,
    recomandari,
    trenduri,
    generatedAt: now.toISOString(),
  };
}

// ---------- NOTA ORIENTATIVA RULE-BASED (fallback) ----------
function generateRuleBased(data: EvaluationData): AIReport {
  const { beneficiary: b, evaluation: e } = data;

  // --- Context personal - specific fiecărei persoane ---
  const housingDesc =
    b.housingStatus === "fara_adapost"
      ? "în prezent fără un loc stabil de locuit"
      : b.housingStatus === "centru"
        ? "găzduit/ă în cadrul centrului"
        : "cu locuință proprie sau la familie";

  const familyDesc =
    b.hasFamily === "da"
      ? b.familyContactFreq
        ? `menține legătura cu familia (${b.familyContactFreq})`
        : "are contact cu familia"
      : b.hasFamily === "partial"
        ? "contactul cu familia este intermitent"
        : "nu are contact cunoscut cu familia";

  const ageGroup = b.age < 30 ? "tânăr" : b.age < 50 ? "adult" : b.age < 65 ? "persoană matură" : "persoană în vârstă";
  const sexDesc = b.sex === "M" ? "un" : "o";

  let contextParts = [`${b.firstName} este ${sexDesc} ${ageGroup} de ${b.age} de ani, ${housingDesc}. Personalul notează că ${familyDesc}.`];
  if (b.institutionHistory) {
    contextParts.push(`Echipa a consemnat un istoric de instituționalizare (${b.institutionHistory}), ceea ce poate influența modul în care ${b.firstName} se raportează la încredere și stabilitate.`);
  }
  if (b.knownDiseases) {
    contextParts.push(`Din punct de vedere al sănătății, au fost semnalate: ${b.knownDiseases}.`);
  }
  if (b.medication) {
    contextParts.push(`Urmează tratament medicamentos: ${b.medication}.`);
  }
  if (b.disabilities) {
    contextParts.push(`Echipa a notat anumite limitări: ${b.disabilities}.`);
  }
  if (b.priorPsychEval && b.priorPsychEval !== "nu") {
    contextParts.push(`Există o evaluare psihologică anterioară (${b.priorPsychEval}).`);
  }

  // --- Profil emotional - bazat pe observatii specifice ---
  const commDesc: Record<string, string> = {
    bun: `${b.firstName} comunică bine, se exprimă clar și este deschis/ă la dialog`,
    moderat: `Comunicarea cu ${b.firstName} este moderată — răspunde la întrebări, dar rareori inițiază conversația`,
    slab: `${b.firstName} comunică puțin, personalul a observat dificultăți în exprimarea nevoilor`,
    absent: `Personalul semnalează absența comunicării verbale la ${b.firstName}, necesitând atenție la limbajul non-verbal`,
  };

  const stressDesc: Record<string, string> = {
    calm: `În situații dificile, ${b.firstName} pare să păstreze calmul`,
    agitat: `Când apar situații neașteptate, ${b.firstName} tinde să devină agitat/ă, ceea ce sugerează că ar putea avea nevoie de sprijin în gestionarea emoțiilor`,
    crize: `Echipa a remarcat că ${b.firstName} poate avea reacții intense în momente de stres, care necesită prezență și calm din partea personalului`,
  };

  const socDesc: Record<string, string> = {
    sociabil: `Se integrează bine în grup și pare să caute compania celorlalți`,
    retras: `Tinde să se retragă și preferă singurătatea, ceea ce nu este neapărat negativ, dar merită atenție`,
    agresiv: `Au fost observate momente de tensiune în relațiile cu ceilalți, personalul trebuie să fie atent la dinamica de grup`,
    normal: `Interacțiunile sociale par echilibrate`,
  };

  const autoDesc: Record<string, string> = {
    independent: `${b.firstName} se descurcă independent în activitățile zilnice`,
    partial: `Are nevoie de sprijin parțial în unele activități, dar se descurcă în multe situații`,
    dependent: `${b.firstName} depinde de ajutorul echipei pentru majoritatea activităților zilnice`,
  };

  let emotionalParts = [
    commDesc[e.communicationLevel] || `Nivelul de comunicare a fost apreciat ca ${e.communicationLevel}`,
    stressDesc[e.stressReaction] || "",
    socDesc[e.sociability] || "",
    autoDesc[e.autonomy] || "",
  ].filter(Boolean);

  const activeEmotions: string[] = [];
  if (e.sadness) activeEmotions.push("momente de tristețe");
  if (e.anxiety) activeEmotions.push("stări de neliniște");
  if (e.anger) activeEmotions.push("episoade de iritabilitate");
  if (e.apathy) activeEmotions.push("lipsa interesului pentru activități");
  if (e.hope) activeEmotions.push("semne de speranță și dorință de mai bine");

  if (activeEmotions.length > 0) {
    emotionalParts.push(`Pe plan emoțional, echipa a remarcat la ${b.firstName}: ${activeEmotions.join(", ")}.`);
  }

  const sleepAppetite = [];
  if (e.sleepQuality === "slab") sleepAppetite.push("somn de calitate slabă, cu posibile treziri frecvente");
  else if (e.sleepQuality === "moderat") sleepAppetite.push("somn cu unele dificultăți");
  if (e.appetite === "scazut") sleepAppetite.push("apetit scăzut, mâncând puțin");
  else if (e.appetite === "excesiv") sleepAppetite.push("apetit crescut, posibil legat de starea emoțională");
  if (sleepAppetite.length > 0) {
    emotionalParts.push(`S-a observat: ${sleepAppetite.join(" și ")}.`);
  }

  if (e.observations) {
    emotionalParts.push(`Personalul a notat în plus: "${e.observations}".`);
  }

  // --- Nevoi specifice persoanei ---
  const nevoi: string[] = [];
  if (b.housingStatus === "fara_adapost") {
    nevoi.push(`${b.firstName} are nevoie urgentă de un spațiu stabil și sigur de locuit`);
  }
  if (b.hasFamily === "nu") {
    nevoi.push(`Fără contact familial, ${b.firstName} ar putea beneficia de o persoană de referință stabilă din echipă`);
  } else if (b.hasFamily === "partial") {
    nevoi.push(`Contactul intermitent cu familia ar putea fi consolidat, dacă ${b.firstName} dorește acest lucru`);
  }
  if (e.autonomy === "dependent") {
    nevoi.push(`Are nevoie de sprijin zilnic, dar și de oportunități mici de independență (ex: alegeri simple la masă, activități)`);
  } else if (e.autonomy === "partial") {
    nevoi.push(`Ar putea fi încurajat/ă să preia mai multe responsabilități, treptat`);
  }
  if (e.sociability === "retras") {
    nevoi.push(`Ar putea beneficia de activități în grupuri mici (2-3 persoane), la propriul ritm, fără presiune`);
  }
  if (e.sadness && e.apathy) {
    nevoi.push(`Pare să aibă nevoie de atenție suplimentară și prezență caldă — recomandăm discuții zilnice scurte`);
  } else if (e.sadness) {
    nevoi.push(`Momente de tristețe semnalate — ${b.firstName} ar putea avea nevoie de mai multă atenție din partea unui membru al echipei`);
  } else if (e.anxiety) {
    nevoi.push(`Stările de neliniște sugerează nevoia de rutine predictibile și un mediu calm`);
  }
  if (b.knownDiseases) {
    nevoi.push(`Monitorizare atentă a stării de sănătate (${b.knownDiseases}) și comunicare cu medicul`);
  }
  if (b.medication) {
    nevoi.push(`Urmărirea administrării corecte a medicației (${b.medication})`);
  }
  if (b.disabilities) {
    nevoi.push(`Adaptarea activităților ținând cont de: ${b.disabilities}`);
  }
  if (nevoi.length === 0) {
    nevoi.push(`Situația lui ${b.firstName} pare echilibrată în acest moment, dar este important să se mențină sprijinul actual`);
  }

  // --- Aspecte de monitorizat ---
  const riscuri: string[] = [];
  if (e.sadness && e.apathy) {
    riscuri.push(`Combinația dintre tristețe și lipsa interesului la ${b.firstName} merită atenție — personalul ar fi bine să observe dacă se accentuează`);
  }
  if (e.anger && e.stressReaction === "crize") {
    riscuri.push(`Momentele de iritabilitate combinate cu reacții intense la stres necesită un plan clar de intervenție blândă`);
  }
  if (e.anger && e.sociability === "agresiv") {
    riscuri.push(`Tensiunile în relații și iritabilitatea pot genera conflicte — echipa ar putea anticipa și preveni aceste situații`);
  }
  if (b.hasFamily === "nu" && (e.sadness || e.apathy)) {
    riscuri.push(`Lipsa suportului familial combinată cu starea emoțională actuală necesită atenție suplimentară din partea echipei`);
  }
  if (e.sleepQuality === "slab") {
    riscuri.push(`Somnul slab poate influența dispoziția și comportamentul pe parcursul zilei`);
  }
  if (e.appetite === "scazut" && e.sleepQuality === "slab") {
    riscuri.push(`Apetitul scăzut combinat cu somnul slab ar trebui discutate cu un medic`);
  }
  if (b.knownDiseases && b.medication) {
    riscuri.push(`Starea de sănătate (${b.knownDiseases}) și medicația necesită monitorizare — orice schimbare trebuie raportată medicului`);
  }
  if (e.sociability === "agresiv") {
    riscuri.push(`Interacțiunile cu ceilalți beneficiari trebuie observate pentru a preveni eventuale conflicte`);
  }
  if (riscuri.length === 0) {
    riscuri.push(`Nu au fost identificate aspecte care să necesite atenție specială la acest moment pentru ${b.firstName}`);
  }

  // --- Recomandări specifice ---
  const recomandari: string[] = [];
  if (e.communicationLevel === "slab" || e.communicationLevel === "absent") {
    recomandari.push(`Folosiți propoziții scurte și clare cu ${b.firstName}, dați-i timp să proceseze și răspundă`);
  } else {
    recomandari.push(`Mențineți dialogul deschis cu ${b.firstName} — pare receptiv/ă la comunicare`);
  }
  if (e.stressReaction === "crize") {
    recomandari.push(`Când ${b.firstName} devine agitat/ă, oferiți-i un spațiu liniștit și prezență calmă, fără a forța discuția`);
  }
  if (e.sociability === "retras") {
    recomandari.push(`Invitați-l/o pe ${b.firstName} la activități de grup, dar fără insistență — respectați ritmul personal`);
  }
  if (e.autonomy === "dependent") {
    recomandari.push(`Oferiți-i lui ${b.firstName} mici alegeri zilnice (ce să mănânce, ce activitate să facă) pentru a construi încrederea în sine`);
  }
  if (e.sadness) {
    recomandari.push(`Fiți atenți la momentele în care ${b.firstName} se retrage — o întrebare simplă "Cum te simți?" poate face diferența`);
  }
  if (e.anxiety) {
    recomandari.push(`Anunțați din timp orice schimbare de rutină — predictibilitatea ajută la reducerea nelinișții`);
  }
  if (b.knownDiseases) {
    recomandari.push(`Monitorizați dacă ${b.firstName} își ia medicația la timp și raportați orice modificare a stării de sănătate`);
  }
  if (e.hope) {
    recomandari.push(`${b.firstName} arată semne de motivație — valorificați acest lucru prin activități care îi dau sens și scop`);
  }
  recomandari.push(`Păstrați o rutină cât mai stabilă și predictibilă pentru ${b.firstName}`);

  // --- Plan de sprijin concret ---
  const plan: string[] = [];
  if (e.sadness || e.anxiety || e.apathy) {
    plan.push(`În prima săptămână: discuții scurte zilnice (5-10 min) cu un membru desemnat al echipei`);
  }
  if (e.sociability === "retras") {
    plan.push(`Săptămânal: invitare la cel puțin o activitate de grup (atelier creativ, plimbare, joc de masă)`);
  }
  if (b.hasFamily === "partial") {
    plan.push(`Lunar: sprijinirea unui apel telefonic sau vizită cu familia, dacă ${b.firstName} dorește`);
  }
  if (b.hasFamily === "nu") {
    plan.push(`Imediat: desemnarea unei persoane de referință din echipă pentru ${b.firstName}`);
  }
  if (b.knownDiseases) {
    plan.push(`La 2 săptămâni: programare control medical pentru ${b.knownDiseases}`);
  }
  if (e.autonomy === "dependent") {
    plan.push(`Zilnic: implicarea lui ${b.firstName} în cel puțin o activitate pe care o poate face singur/ă`);
  }
  if (e.sleepQuality === "slab") {
    plan.push(`Imediat: verificarea condițiilor de somn (zgomot, lumină, temperatură) și stabilirea unei rutine de seară`);
  }
  if (e.appetite === "scazut") {
    plan.push(`Zilnic: oferirea de opțiuni alimentare variate și monitorizarea aportului nutritiv`);
  }
  plan.push(`La 30 de zile: reevaluare și actualizarea notei orientative`);
  plan.push(`Continuu: notarea oricărei schimbări semnificative în comportamentul sau starea lui ${b.firstName}`);

  return {
    contextPersonal: contextParts.join(" "),
    profilEmotional: emotionalParts.join(". ") + ".",
    nevoiPrincipale: nevoi,
    riscuri,
    recomandariPersonal: recomandari,
    planSprijin: plan,
    generatedAt: new Date().toISOString(),
  };
}
