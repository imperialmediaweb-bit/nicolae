import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-engine";

// POST - AI suggestion from available ingredients
export async function POST(req: NextRequest) {
  try {
    const { ingredients, mealType, preferences } = await req.json();

    if (!ingredients) {
      return NextResponse.json({ error: "Lista de ingrediente e obligatorie" }, { status: 400 });
    }

    const systemPrompt = `Esti un bucatar expert in bucataria romaneasca si internationala, specializat in mese nutritive si accesibile pentru familii si centre de ingrijire.
Raspunzi DOAR in limba romana.
Esti practic, creativ si dai retete usor de urmat.`;

    const mealLabel = mealType === "mic_dejun" ? "mic dejun" : mealType === "pranz" ? "pranz" : mealType === "cina" ? "cina" : "orice masa";

    const userPrompt = `Am urmatoarele ingrediente disponibile:
${ingredients}

${preferences ? `Preferinte/restrictii: ${preferences}` : ""}

Sugereaza 3 idei de retete pentru ${mealLabel} pe care le pot face din aceste ingrediente.

Pentru fiecare reteta da:
1. **Numele retetei**
2. **Ingrediente necesare** (din lista mea)
3. **Pasi de preparare** (scurt, clar, pas cu pas)
4. **Timp estimat de preparare**
5. **Sfat** (un truc sau o varianta)

Fii creativ dar realist - foloseste ce am disponibil.`;

    const aiResponse = await callAI(systemPrompt, userPrompt);

    return NextResponse.json({ suggestions: aiResponse });
  } catch (err) {
    if (err instanceof Error && err.message === "NO_API_KEY") {
      return NextResponse.json({
        error: "no_api_key",
        suggestions: `**Nu am cheia API configurata pentru AI.**\n\nDar uite cateva idei rapide cu ce ai:\n\n1. **Omleta/Ochiuri** - daca ai oua, e mereu o optiune\n2. **Paste cu ce ai** - fierbe paste, adauga orice legume/branza ai\n3. **Supa rapida** - fierbe legumele, adauga sare, piper, un pic de smantana\n\nConfigureaza o cheie API in Setari pentru sugestii personalizate!`,
      });
    }
    console.error("[AI Suggest]", err);
    return NextResponse.json({ error: "Eroare AI" }, { status: 500 });
  }
}
