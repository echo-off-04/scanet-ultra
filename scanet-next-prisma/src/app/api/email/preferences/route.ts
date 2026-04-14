import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/email/preferences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let prefs = await prisma.emailPreference.findFirst({
      where: { userId: session.user.id },
    });

    if (!prefs) {
      prefs = await prisma.emailPreference.create({
        data: {
          userId: session.user.id,
          welcomeEmails: true,
          notificationEmails: true,
          marketingEmails: true,
          opportunityEmails: true,
          eventEmails: true,
          digestFrequency: "daily",
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

// PUT /api/email/preferences
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const prefs = await prisma.emailPreference.upsert({
      where: { userId: session.user.id },
      update: {
        welcomeEmails: body.welcome_emails ?? body.welcomeEmails,
        notificationEmails: body.notification_emails ?? body.notificationEmails,
        marketingEmails: body.marketing_emails ?? body.marketingEmails,
        opportunityEmails: body.opportunity_emails ?? body.opportunityEmails,
        eventEmails: body.event_emails ?? body.eventEmails,
        digestFrequency: body.digest_frequency || body.digestFrequency,
      },
      create: {
        userId: session.user.id,
        welcomeEmails: body.welcome_emails ?? body.welcomeEmails ?? true,
        notificationEmails:
          body.notification_emails ?? body.notificationEmails ?? true,
        marketingEmails: body.marketing_emails ?? body.marketingEmails ?? true,
        opportunityEmails:
          body.opportunity_emails ?? body.opportunityEmails ?? true,
        eventEmails: body.event_emails ?? body.eventEmails ?? true,
        digestFrequency:
          body.digest_frequency || body.digestFrequency || "daily",
      },
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
