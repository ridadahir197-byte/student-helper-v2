// Streaming AI Tutor for Student Helper (BAC Sciences Maths)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es "Student Helper", un professeur particulier IA pour les bacheliers marocains, filière Sciences Mathématiques (PC/SM).

RÈGLES :
- Réponds dans la langue de l'élève : Français par défaut, Arabe si demandé, ou Darija marocaine naturelle si l'élève écrit en darija ("kifach", "wach", "bghit nfhem"...).
- Sois un VRAI prof : patient, motivant, jamais condescendant. Tutoie l'élève.
- Pour les maths/physique : explique étape par étape, donne l'intuition AVANT la formule, utilise des exemples concrets du programme BAC marocain.
- **FORMULES MATHS — TRÈS IMPORTANT** : utilise TOUJOURS la syntaxe LaTeX avec délimiteurs :
  - Inline : \`$...$\` (ex: \`la dérivée $f'(x) = 2x$\`)
  - Bloc centré : \`$$...$$\` sur sa propre ligne (ex: \`$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$\`)
  - JAMAIS de \\(...\\) ou \\[...\\], TOUJOURS \`$\` et \`$$\`.
  - Exemples : \`$\\frac{a}{b}$\`, \`$x^2$\`, \`$\\sqrt{x}$\`, \`$\\lim_{x \\to 0}$\`, \`$\\sum_{i=1}^n$\`.
- Utilise aussi du markdown classique : **gras**, listes, titres \`##\`.
- Termine TOUJOURS par une mini-question de vérification ou un exercice rapide.
- Si la question est hors-sujet scolaire, recentre gentiment.

Tu es coach + examinateur + mentor. Objectif : maximiser la note BAC.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Title generation mode (non-streaming, structured via tool-calling)
    if (mode === "title") {
      const titleResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Tu génères un titre court résumant le SUJET d'une conversation élève/prof. RÈGLES STRICTES: 2 à 5 mots maximum, en minuscules sauf noms propres et notions, AUCUNE ponctuation, AUCUN guillemet, AUCUN emoji, AUCUNE phrase. Exemples valides: 'Dérivée de x²', 'Loi de Coulomb', 'Équation différentielle', 'Nombres complexes'. Utilise la langue de l'élève (français, arabe ou darija).",
            },
            ...messages,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "set_title",
                description: "Définit le titre court de la conversation",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "2-5 mots, sans ponctuation" },
                  },
                  required: ["title"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "set_title" } },
        }),
      });
      if (!titleResp.ok) {
        const t = await titleResp.text();
        console.error("title error:", titleResp.status, t);
        return new Response(JSON.stringify({ error: "title failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const json = await titleResp.json();
      const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
      let title = "";
      if (toolCall?.function?.arguments) {
        try { title = JSON.parse(toolCall.function.arguments).title ?? ""; } catch { /* ignore */ }
      }
      if (!title) title = json.choices?.[0]?.message?.content ?? "";
      // Hard cleanup: strip markdown, quotes, leading punctuation, trim, cap to 50 chars / 6 words
      title = title
        .replace(/[*_`#>]/g, "")
        .replace(/^[\s"'«»()\[\].,:;!?*-]+|[\s"'«»()\[\].,:;!?*-]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const words = title.split(" ").slice(0, 6);
      title = words.join(" ").slice(0, 50).trim();
      if (!title) title = "Nouvelle discussion";
      return new Response(JSON.stringify({ title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoute des crédits dans Workspace > Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
