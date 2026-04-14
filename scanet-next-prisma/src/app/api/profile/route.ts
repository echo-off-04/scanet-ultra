import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName: body.full_name || body.fullName,
        company: body.company,
        jobTitle: body.job_title || body.jobTitle,
        phone: body.phone,
        bio: body.bio,
        website: body.website,
        linkedin: body.linkedin,
        country: body.country,
        city: body.city,
        preferredCurrency: body.preferred_currency || body.preferredCurrency,
        avatarUrl: body.avatar_url || body.avatarUrl,
      },
      create: {
        userId: session.user.id,
        email: session.user.email || "",
        fullName: body.full_name || body.fullName || "",
        company: body.company,
        jobTitle: body.job_title || body.jobTitle,
        phone: body.phone,
        bio: body.bio,
        website: body.website,
        linkedin: body.linkedin,
        country: body.country,
        city: body.city,
        preferredCurrency:
          body.preferred_currency || body.preferredCurrency || "EUR",
        avatarUrl: body.avatar_url || body.avatarUrl,
      },
    });

    return NextResponse.json(toSnakeCase(profile));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/profile - Get current user's profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json(toSnakeCase(profile));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
