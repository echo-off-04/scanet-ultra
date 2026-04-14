import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
}

Deno.serve(async (req: Request) => {
  console.log("[Edge Function] Nouvelle requête reçue");
  console.log("[Edge Function] Méthode:", req.method);
  console.log("[Edge Function] URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("[Edge Function] Requête OPTIONS (CORS preflight)");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[Edge Function] Lecture du body JSON...");
    const { image, backImage } = await req.json();
    console.log("[Edge Function] Body reçu, taille image:", image ? image.length : "undefined");
    console.log("[Edge Function] Image verso présente:", !!backImage);

    if (!image) {
      console.error("[Edge Function] Erreur: Image manquante");
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[Edge Function] Vérification de la clé OpenAI...");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("[Edge Function] Erreur: Clé OpenAI non configurée");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("[Edge Function] Clé OpenAI trouvée");

    console.log("[Edge Function] Nettoyage du format base64...");
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
    console.log("[Edge Function] Image nettoyée, taille:", base64Image.length);

    let base64BackImage: string | null = null;
    if (backImage) {
      base64BackImage = backImage.replace(/^data:image\/\w+;base64,/, "");
      console.log("[Edge Function] Image verso nettoyée, taille:", base64BackImage.length);
    }

    const analyzeImage = async (imageBase64: string, isBackSide: boolean = false) => {
      console.log(`[Edge Function] Appel API OpenAI (${isBackSide ? 'verso' : 'recto'})...`);

      const systemPrompt = isBackSide
        ? `You are an expert at extracting information from the back side of business cards in any orientation.

CRITICAL INSTRUCTIONS:
1. Read and extract information from the business card REGARDLESS of its orientation
2. The back side often contains additional contact details, social media, or supplementary information
3. Extract ALL contact information you can identify
4. For phone numbers: convert French format (06..., 01...) to international format (+33...)
5. For websites: ensure URLs start with https:// or http://

Return ONLY valid JSON format:
{
  "firstName": "first name if visible",
  "lastName": "last name if visible",
  "email": "email address",
  "phone": "phone number in international format (+33...)",
  "company": "company/organization name",
  "jobTitle": "job title or position",
  "website": "complete website URL with protocol",
  "address": "complete physical address (street, city, postal code, country)"
}

Omit any field that you cannot find.`
        : `You are an expert at extracting information from business cards in any orientation.

CRITICAL INSTRUCTIONS:
1. Read and extract information from the business card REGARDLESS of its orientation (even if rotated 90°, 180°, or 270°)
2. You can read text in any direction - analyze the entire image and find all text elements
3. Extract ALL contact information you can identify, no matter which direction the text faces
4. Be intelligent about identifying which pieces of information correspond to which fields
5. For phone numbers: convert French format (06..., 01...) to international format (+33...)
6. For websites: ensure URLs start with https:// or http://
7. Distinguish between personal first name, last name, job title, and company name correctly
8. SEPARATE first name and last name into different fields

Return ONLY valid JSON format:
{
  "firstName": "first name only (e.g., 'Jean')",
  "lastName": "last name only (e.g., 'Dupont')",
  "email": "email address",
  "phone": "phone number in international format (+33...)",
  "company": "company/organization name",
  "jobTitle": "job title or position",
  "website": "complete website URL with protocol",
  "address": "complete physical address (street, city, postal code, country)"
}

Omit any field that you cannot find. Be precise and thorough in your extraction.
Use context clues to identify information correctly even when text orientation varies.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract all contact information from this business card ${isBackSide ? '(back side)' : '(front side)'}. Read the text in any orientation and identify all contact details.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 600,
          temperature: 0.1
        }),
      });
      console.log(`[Edge Function] Réponse OpenAI reçue (${isBackSide ? 'verso' : 'recto'}), status:`, response.status);
      return response;
    };

    console.log("[Edge Function] Début de l'analyse de l'image recto...");
    let openaiResponse = await analyzeImage(base64Image, false);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("[Edge Function] Erreur OpenAI API:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image with AI", details: errorData }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[Edge Function] Parsing de la réponse JSON (recto)...");
    let result = await openaiResponse.json();
    console.log("[Edge Function] Résultat OpenAI (recto):", JSON.stringify(result, null, 2));

    let content = result.choices[0]?.message?.content;
    console.log("[Edge Function] Contenu extrait (recto):", content);

    if (!content) {
      console.error("[Edge Function] Pas de contenu dans la réponse");
      return new Response(
        JSON.stringify({ error: "No content returned from AI" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[Edge Function] Parsing du JSON extrait (recto)...");
    let extractedData: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("[Edge Function] JSON trouvé via regex:", jsonMatch[0]);
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        console.log("[Edge Function] Parsing direct du contenu");
        extractedData = JSON.parse(content);
      }
      console.log("[Edge Function] Données extraites avec succès (recto):", extractedData);
    } catch (parseError) {
      console.error("[Edge Function] Erreur de parsing:", parseError);
      console.error("[Edge Function] Contenu brut:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", rawContent: content }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (base64BackImage) {
      console.log("[Edge Function] Analyse de l'image verso...");
      const backResponse = await analyzeImage(base64BackImage, true);

      if (backResponse.ok) {
        console.log("[Edge Function] Parsing de la réponse JSON (verso)...");
        const backResult = await backResponse.json();
        console.log("[Edge Function] Résultat OpenAI (verso):", JSON.stringify(backResult, null, 2));

        const backContent = backResult.choices[0]?.message?.content;
        console.log("[Edge Function] Contenu extrait (verso):", backContent);

        if (backContent) {
          try {
            const backJsonMatch = backContent.match(/\{[\s\S]*\}/);
            let backData: any;
            if (backJsonMatch) {
              backData = JSON.parse(backJsonMatch[0]);
            } else {
              backData = JSON.parse(backContent);
            }
            console.log("[Edge Function] Données extraites du verso:", backData);

            extractedData = {
              firstName: extractedData.firstName || backData.firstName,
              lastName: extractedData.lastName || backData.lastName,
              email: extractedData.email || backData.email,
              phone: extractedData.phone || backData.phone,
              company: extractedData.company || backData.company,
              jobTitle: extractedData.jobTitle || backData.jobTitle,
              website: extractedData.website || backData.website,
              address: extractedData.address || backData.address,
            };
            console.log("[Edge Function] Données fusionnées (recto + verso):", extractedData);
          } catch (parseError) {
            console.warn("[Edge Function] Erreur lors du parsing du verso, conservation des données du recto uniquement:", parseError);
          }
        }
      } else {
        console.warn("[Edge Function] Erreur lors de l'analyse du verso, conservation des données du recto uniquement");
      }
    }

    console.log("[Edge Function] Succès! Retour de la réponse");
    return new Response(
      JSON.stringify({ data: extractedData }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Edge Function] Erreur globale:", error);
    console.error("[Edge Function] Type d'erreur:", error.constructor?.name);
    console.error("[Edge Function] Message:", error.message);
    console.error("[Edge Function] Stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: error.constructor?.name,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
