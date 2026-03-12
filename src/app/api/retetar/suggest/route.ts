import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-engine";

// POST - AI suggestion from available ingredients
export async function POST(req: NextRequest) {
  try {
    const { ingredients, mealType, preferences } = await req.json();

    if (!ingredients) {
      return NextResponse.json({ error: "Lista de ingrediente e obligatorie" }, { status: 400 });
    }

    const systemPrompt = `Esti un bucatar-sef expert in bucataria traditionala romaneasca, specializat in gatit la cantina pentru 150 de persoane.
Lucrezi intr-un centru social si gatesti borsuri, ciorbe, supe, sarmale, varza calita, mancaruri de post, tocane, pilaf - mancare romaneasca traditionala de casa.
Cantitatile trebuie sa fie INTOTDEAUNA pentru 150 de portii (gatit la cazan/oala mare).
Raspunzi DOAR in limba romana, simplu si clar, ca pentru bucatarese care nu au experienta cu retete scrise.
Da cantitati in kg, litri, bucati - nu in grame mici.`;

    const mealLabel = mealType === "mic_dejun" ? "mic dejun" : mealType === "pranz" ? "pranz" : mealType === "cina" ? "cina" : "orice masa";

    const userPrompt = `Am urmatoarele ingrediente disponibile in bucatarie:
${ingredients}

${preferences ? `Preferinte/restrictii: ${preferences}` : ""}

Sugereaza 3 retete traditionale romanesti pentru ${mealLabel} pe care le pot gati din aceste ingrediente.
IMPORTANT: Cantitatile sunt pentru 150 DE PORTII (cantina centru social).

Pentru fiecare reteta da:
1. **Numele retetei** (ex: Bors de sfecla rosie, Sarmale in foi de varza, Mancare de fasole de post)
2. **Ingrediente si cantitati** - in KG, LITRI, BUCATI (pt 150 portii!)
3. **Cum se face** - pas cu pas, simplu, ca la bucatarie (nu reteta fancy)
4. **Cat dureaza**
5. **Sfat de bucatareasa** (un truc practic)

Gandeste-te la mancare romaneasca traditionala: borsuri, ciorbe, sarmale, tocanite, pilaf, mancaruri de post, varza calita, mamaliga.
Fii practica si realista - asta e mancare de cantina, nu de restaurant.`;

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
