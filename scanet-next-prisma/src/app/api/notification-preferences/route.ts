import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/notification-preferences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let prefs = await prisma.notificationPreference.findFirst({
      where: { userId: session.user.id },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          contactsEnabled: true,
          opportunitiesEnabled: true,
          remindersEnabled: true,
          teamActivityEnabled: true,
          quietHoursEnabled: false,
          emailDigest: "daily",
        },
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notification-preferences
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: body,
      create: { userId: session.user.id, ...body },
    });
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
