import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/scan-card - Scan business card using OpenAI Vision
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { frontImage, backImage } = body;

    if (!frontImage) {
      return NextResponse.json(
        { error: "Front image is required" },
        { status: 400 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const images = [
      { type: "image_url" as const, image_url: { url: frontImage } },
    ];
    if (backImage) {
      images.push({
        type: "image_url" as const,
        image_url: { url: backImage },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant spécialisé dans l'extraction d'informations à partir de cartes de visite. Extrais toutes les informations visibles et retourne-les en format JSON avec les champs suivants (tous optionnels):
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "phone": "string",
  "company": "string",
  "jobTitle": "string",
  "website": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "notes": "string (autres infos pertinentes)"
}
Retourne UNIQUEMENT le JSON, sans commentaire ni markdown.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: "Extrais les informations de cette carte de visite:",
              },
              ...images,
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No data extracted" }, { status: 500 });
    }

    // Parse the JSON response
    let extractedData;
    try {
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Failed to parse extracted data" },
        { status: 500 },
      );
    }

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("Error scanning card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
