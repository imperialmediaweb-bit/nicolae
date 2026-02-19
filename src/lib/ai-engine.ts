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

export async function generateAIReport(
  data: EvaluationData
): Promise<AIReport> {
  // If OpenAI API key is configured, use it
  if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your-openai-api-key-here"
  ) {
    return await generateWithOpenAI(data);
  }

  // Otherwise, use rule-based generation
  return generateRuleBased(data);
}

async function generateWithOpenAI(data: EvaluationData): Promise<AIReport> {
  const prompt = buildPrompt(data);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Ești un asistent social specializat în crearea profilurilor orientative de sprijin.
NU pui diagnostice medicale sau psihologice.
Folosești limbaj non-stigmatizant și orientat spre sprijin.
Răspunzi DOAR în format JSON valid.
Limba: română.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  const result = await response.json();
  try {
    return JSON.parse(result.choices[0].message.content);
  } catch {
    return generateRuleBased(data);
  }
}

function buildPrompt(data: EvaluationData): string {
  const { beneficiary: b, evaluation: e } = data;
  return `Creează un profil psihosocial orientativ (NU diagnostic) pentru:

Persoană: ${b.firstName}, ${b.age} ani, ${b.sex === "M" ? "masculin" : "feminin"}
Locație: ${b.location}
Familie: ${b.hasFamily} | Locuire: ${b.housingStatus}
Contact familie: ${b.familyContactFreq || "necunoscut"}
Istoric instituționalizare: ${b.institutionHistory || "necunoscut"}
Condiții medicale: ${b.knownDiseases || "nu"} | Medicație: ${b.medication || "nu"}
Limitări: ${b.disabilities || "nu"} | Evaluare psihologică anterioară: ${b.priorPsychEval}

Comportament observat:
- Comunicare: ${e.communicationLevel}
- Reacție la stres: ${e.stressReaction}
- Sociabilitate: ${e.sociability}
- Autonomie: ${e.autonomy}
- Somn: ${e.sleepQuality}
- Apetit: ${e.appetite}

Stare emoțională:
- Tristețe: ${e.sadness ? "da" : "nu"}
- Anxietate: ${e.anxiety ? "da" : "nu"}
- Furie: ${e.anger ? "da" : "nu"}
- Apatie: ${e.apathy ? "da" : "nu"}
- Speranță/motivație: ${e.hope ? "da" : "nu"}

Observații: ${e.observations || "fără"}

Răspunde în JSON:
{
  "contextPersonal": "...",
  "profilEmotional": "...",
  "nevoiPrincipale": ["...", "..."],
  "riscuri": ["...", "..."],
  "recomandariPersonal": ["...", "..."],
  "planSprijin": ["...", "..."],
  "generatedAt": "${new Date().toISOString()}"
}`;
}

function generateRuleBased(data: EvaluationData): AIReport {
  const { beneficiary: b, evaluation: e } = data;

  // Context personal
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

  // Profil emotional
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

  // Nevoi principale
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

  // Riscuri
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

  // Recomandari
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

  // Plan sprijin
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
