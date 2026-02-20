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

  const anthropicKey = await getConfig("ANTHROPIC_API_KEY");
  if (anthropicKey && anthropicKey !== "your-anthropic-api-key-here") {
    keys.push({ provider: "anthropic", key: anthropicKey });
  }

  const geminiKey = await getConfig("GEMINI_API_KEY");
  if (geminiKey && geminiKey !== "your-gemini-api-key-here") {
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
      if (provider === "anthropic") {
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
        generationConfig: { temperature: 0.3 },
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
  const systemPrompt = `Ești un membru al echipei de sprijin dintr-un centru social. Rolul tău este să creezi note orientative interne, pentru uz exclusiv al personalului care lucrează direct cu beneficiarii.

REGULI STRICTE:
- NU ești medic, psiholog sau psihiatru. NU pui și NU sugerezi diagnostice.
- NU folosești NICIODATĂ termeni clinici precum: diagnostic, tulburare, patologie, sindrom, simptom, depresie, PTSD, autism, schizofrenie, sau orice alt termen medical/psihiatric.
- Folosești DOAR limbaj descriptiv și observațional: "s-a observat că...", "personalul a remarcat...", "pare să...", "ar putea beneficia de..."
- NU faci afirmații categorice. Folosești formulări ca: "se pare", "ar putea", "s-a remarcat", "personalul semnalează".
- Tonul este bland, empatic, orientat spre sprijin practic. Ca și cum ai vorbi cu un coleg despre cum poți ajuta mai bine o persoană.
- La secțiunea "riscuri" (aspecte de monitorizat) — formulezi BLAND: "ar fi util să se acorde atenție la...", "personalul ar putea monitoriza...", NU "risc de X".
- Recomandările sunt PRACTICE și SIMPLE — ce poate face personalul din centru, NU prescripții medicale.
- Fiecare secțiune trebuie să includă implicit ideea că acestea sunt observații ale personalului, NU concluzii profesionale.

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

  const housing =
    b.housingStatus === "fara_adapost"
      ? "persoană fără adăpost"
      : b.housingStatus === "centru"
        ? "se află în centru"
        : "locuiește cu familia";
  const family =
    b.hasFamily === "da"
      ? "are legătură cu familia"
      : b.hasFamily === "partial"
        ? "contact parțial cu familia"
        : "fără contact familial cunoscut";

  const contextPersonal = `${b.firstName}, ${b.age} ani, ${housing}. ${family}. ${
    b.institutionHistory
      ? `Personalul a notat un istoric de instituționalizare: ${b.institutionHistory}.`
      : ""
  } ${b.disabilities ? `Limitări semnalate de echipă: ${b.disabilities}.` : ""}`;

  const emotions: string[] = [];
  if (e.sadness) emotions.push("personalul a remarcat momente de tristețe");
  if (e.anxiety) emotions.push("s-a observat neliniște");
  if (e.anger) emotions.push("au fost momente de iritabilitate");
  if (e.apathy) emotions.push("pare uneori lipsit de interes");
  if (e.hope) emotions.push("dă semne de speranță și motivație");

  const stressMap: Record<string, string> = {
    calm: "pare să gestioneze calm situațiile dificile",
    agitat: "s-a observat agitație în situații dificile",
    crize: "ar putea avea nevoie de sprijin suplimentar în situații de stres",
  };

  const profilEmotional = `Nivel de comunicare apreciat ca ${e.communicationLevel} de către echipă. ${stressMap[e.stressReaction] || ""}. ${
    emotions.length > 0
      ? `Echipa a observat: ${emotions.join("; ")}.`
      : "Nu au fost semnalate aspecte emoționale deosebite."
  } Somnul a fost apreciat ca ${e.sleepQuality}, apetitul ca ${e.appetite}.`;

  const nevoi: string[] = [];
  if (b.hasFamily === "nu" || b.hasFamily === "partial")
    nevoi.push("Ar putea beneficia de stabilitate și continuitate în relații");
  if (b.housingStatus === "fara_adapost")
    nevoi.push("Ar avea nevoie de un spațiu stabil de locuire");
  if (e.autonomy === "dependent")
    nevoi.push("Ar putea fi sprijinit în dezvoltarea autonomiei, pas cu pas");
  if (e.sociability === "retras")
    nevoi.push("Ar putea beneficia de activități de grup, la propriul ritm");
  if (e.sadness || e.anxiety || e.apathy)
    nevoi.push("Ar putea avea nevoie de o prezență caldă și constant");
  if (b.knownDiseases) nevoi.push("Este bine să fie monitorizat și sprijinit pe partea medicală");
  if (nevoi.length === 0) nevoi.push("Situația pare echilibrată, se recomandă menținerea sprijinului actual");

  const riscuri: string[] = [];
  if (e.sadness && e.apathy) riscuri.push("Ar fi util ca echipa să fie atentă la semne de retragere");
  if (e.anger && e.stressReaction === "crize")
    riscuri.push("Personalul ar putea monitoriza momentele de tensiune pentru a oferi sprijin la timp");
  if (b.hasFamily === "nu")
    riscuri.push("Lipsa contactului familial ar putea influența starea de bine — echipa poate compensa prin prezență");
  if (e.sleepQuality === "slab" && e.appetite === "scazut")
    riscuri.push("Somnul și apetitul necesită atenție — ar fi bine să fie discutate cu un medic");
  if (e.sociability === "agresiv")
    riscuri.push("Personalul ar putea fi atent la interacțiunile cu ceilalți pentru a preveni conflicte");
  if (riscuri.length === 0) riscuri.push("Nu au fost identificate aspecte care să necesite atenție specială la acest moment");

  const recomandari: string[] = [
    "Comunicare calmă, cu răbdare și ton prietenos",
    "Evitarea situațiilor care ar putea genera tensiune",
  ];
  if (e.sociability === "retras")
    recomandari.push("Invitarea blândă la activități comune, fără presiune");
  if (e.stressReaction === "crize")
    recomandari.push("Oferirea unui spațiu liniștit când situația devine dificilă");
  if (e.autonomy === "dependent")
    recomandari.push("Încurajarea micilor pași spre independență, cu răbdare");
  if (e.sadness)
    recomandari.push("Atenție la momentele de retragere, o discuție deschisă poate ajuta");
  recomandari.push("Menținerea unei rutine stabile și predictibile");

  const plan: string[] = [];
  if (e.sadness || e.anxiety || e.apathy)
    plan.push("Discuții individuale regulate cu un membru al echipei");
  if (b.hasFamily === "partial")
    plan.push("Sprijinirea menținerii legăturii cu familia, acolo unde este posibil");
  if (b.hasFamily === "nu")
    plan.push("Identificarea unei persoane de referință din echipă sau voluntari");
  if (b.knownDiseases)
    plan.push("Programarea unui control medical periodic");
  plan.push("Revizuirea acestei note peste 30 de zile");
  plan.push("Ajustarea sprijinului în funcție de evoluție");

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
