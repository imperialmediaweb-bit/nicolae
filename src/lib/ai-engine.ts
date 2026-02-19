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

async function getApiKey(): Promise<{ provider: string; key: string } | null> {
  // Try Anthropic first (preferred)
  const anthropicKey = await getConfig("ANTHROPIC_API_KEY");
  if (anthropicKey && anthropicKey !== "your-anthropic-api-key-here") {
    return { provider: "anthropic", key: anthropicKey };
  }

  // Try OpenAI
  const openaiKey = await getConfig("OPENAI_API_KEY");
  if (openaiKey && openaiKey !== "your-openai-api-key-here") {
    return { provider: "openai", key: openaiKey };
  }

  return null;
}

// ---------- SHARED: call AI API (supports Anthropic + OpenAI) ----------
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const credentials = await getApiKey();
  if (!credentials) throw new Error("NO_API_KEY");

  if (credentials.provider === "anthropic") {
    return callClaude(credentials.key, systemPrompt, userPrompt);
  } else {
    return callOpenAI(credentials.key, systemPrompt, userPrompt);
  }
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

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
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
  const systemPrompt = `Ești un asistent social specializat în crearea profilurilor orientative de sprijin pentru persoane vulnerabile.
NU pui diagnostice medicale sau psihologice.
Folosești limbaj non-stigmatizant, empatic și orientat spre sprijin.
Răspunzi DOAR în format JSON valid, fără markdown, fără backticks.
Limba: română.`;

  const { beneficiary: b, evaluation: e } = data;
  const userPrompt = `Creează un profil psihosocial orientativ (NU diagnostic) bazat pe datele de mai jos.

PERSOANA:
- Nume: ${b.firstName} ${b.lastName}, ${b.age} ani, ${b.sex === "M" ? "masculin" : "feminin"}
- Locație: ${b.location}
- Familie: ${b.hasFamily} | Tip locuire: ${b.housingStatus}
- Contact cu familia: ${b.familyContactFreq || "necunoscut"}
- Istoric instituționalizare: ${b.institutionHistory || "nu"}
- Boli cunoscute: ${b.knownDiseases || "nu"} | Medicație: ${b.medication || "nu"}
- Dizabilități: ${b.disabilities || "nu"} | Evaluare psihologică anterioară: ${b.priorPsychEval}

COMPORTAMENT OBSERVAT:
- Comunicare: ${e.communicationLevel}
- Reacție la stres: ${e.stressReaction}
- Sociabilitate: ${e.sociability}
- Autonomie: ${e.autonomy}
- Somn: ${e.sleepQuality}
- Apetit: ${e.appetite}

STARE EMOȚIONALĂ:
- Tristețe frecventă: ${e.sadness ? "da" : "nu"}
- Anxietate: ${e.anxiety ? "da" : "nu"}
- Furie: ${e.anger ? "da" : "nu"}
- Apatie: ${e.apathy ? "da" : "nu"}
- Speranță/motivație: ${e.hope ? "da" : "nu"}

Observații evaluator: ${e.observations || "fără"}

Răspunde STRICT în acest format JSON (fără alte texte):
{
  "contextPersonal": "paragraf narativ despre context personal, situație socială, istoric",
  "profilEmotional": "paragraf despre starea emoțională observată, pattern-uri comportamentale",
  "nevoiPrincipale": ["nevoie 1", "nevoie 2", "..."],
  "riscuri": ["risc identificat 1", "risc 2", "..."],
  "recomandariPersonal": ["recomandare pentru personal 1", "recomandare 2", "..."],
  "planSprijin": ["pas 1 din plan", "pas 2", "..."],
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

// ---------- PROFIL RULE-BASED (fallback) ----------
function generateRuleBased(data: EvaluationData): AIReport {
  const { beneficiary: b, evaluation: e } = data;

  const housing =
    b.housingStatus === "fara_adapost"
      ? "persoană fără adăpost"
      : b.housingStatus === "centru"
        ? "rezident în centru"
        : "locuiește cu familia";
  const family =
    b.hasFamily === "da"
      ? "are legătură familială"
      : b.hasFamily === "partial"
        ? "legătură familială parțială"
        : "fără suport familial identificat";

  const contextPersonal = `${b.firstName}, ${b.age} ani, ${housing}. ${family}. ${
    b.institutionHistory
      ? `Istoric instituționalizare: ${b.institutionHistory}.`
      : ""
  } ${b.disabilities ? `Limitări semnalate: ${b.disabilities}.` : ""}`;

  const emotions: string[] = [];
  if (e.sadness) emotions.push("semne de tristețe frecventă");
  if (e.anxiety) emotions.push("manifestări de anxietate");
  if (e.anger) emotions.push("episoade de furie");
  if (e.apathy) emotions.push("tendință spre apatie");
  if (e.hope) emotions.push("prezintă speranță și motivație");

  const stressMap: Record<string, string> = {
    calm: "reacționează calm la situații de stres",
    agitat: "prezintă agitație în situații de stres",
    crize: "poate avea reacții intense la stres, necesită atenție",
  };

  const profilEmotional = `Nivel de comunicare ${e.communicationLevel}. ${stressMap[e.stressReaction] || ""}. ${
    emotions.length > 0
      ? `Se observă: ${emotions.join(", ")}.`
      : "Fără semne emoționale deosebite observate."
  } Somn: ${e.sleepQuality}. Apetit: ${e.appetite}.`;

  const nevoi: string[] = [];
  if (b.hasFamily === "nu" || b.hasFamily === "partial")
    nevoi.push("Nevoie de atașament și stabilitate relațională");
  if (b.housingStatus === "fara_adapost")
    nevoi.push("Nevoie urgentă de stabilitate locativă");
  if (e.autonomy === "dependent")
    nevoi.push("Sprijin pentru dezvoltarea autonomiei");
  if (e.sociability === "retras")
    nevoi.push("Stimularea integrării sociale");
  if (e.sadness || e.anxiety || e.apathy)
    nevoi.push("Susținere emoțională continuă");
  if (b.knownDiseases) nevoi.push("Monitorizare și sprijin medical");
  if (nevoi.length === 0) nevoi.push("Menținerea echilibrului actual");

  const riscuri: string[] = [];
  if (e.sadness && e.apathy) riscuri.push("Risc de retragere și izolare");
  if (e.anger && e.stressReaction === "crize")
    riscuri.push("Risc de conflict și auto-vătămare");
  if (b.hasFamily === "nu")
    riscuri.push("Risc de abandon și lipsă suport");
  if (e.sleepQuality === "slab" && e.appetite === "scazut")
    riscuri.push("Semne de deteriorare a stării generale");
  if (e.sociability === "agresiv")
    riscuri.push("Dificultăți în relațiile interpersonale");
  if (riscuri.length === 0) riscuri.push("Fără riscuri majore identificate la momentul evaluării");

  const recomandari: string[] = [
    "Ton calm și structurat în comunicare",
    "Evitarea conflictelor directe",
  ];
  if (e.sociability === "retras")
    recomandari.push("Încurajarea participării la activități de grup");
  if (e.stressReaction === "crize")
    recomandari.push("Tehnici de de-escaladare, spațiu sigur");
  if (e.autonomy === "dependent")
    recomandari.push("Pași mici spre independență, cu încurajare");
  if (e.sadness)
    recomandari.push("Atenție la semne de retragere, discuții deschise");
  recomandari.push("Rutină stabilă și predictibilă");

  const plan: string[] = [];
  if (e.sadness || e.anxiety || e.apathy)
    plan.push("Consiliere individuală săptămânală");
  if (b.hasFamily === "partial")
    plan.push("Program de mediere familială");
  if (b.hasFamily === "nu")
    plan.push("Identificare mentor sau persoană de referință");
  if (b.knownDiseases)
    plan.push("Consultație medicală periodică");
  plan.push("Evaluare de progres la 30 de zile");
  plan.push("Actualizarea planului individual de intervenție");

  return {
    contextPersonal,
    profilEmotional,
    nevoiPrincipale: nevoi,
    riscuri,
    recomandariPersonal: recomandari,
    planSprijin: plan,
    generatedAt: new Date().toISOString(),
  };
}
