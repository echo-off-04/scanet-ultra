import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/email/scheduled - List scheduled emails
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: { userId: session.user.id },
      include: {
        recipients: {
          select: {
            id: true,
            email: true,
            contactId: true,
            status: true,
            sentAt: true,
          },
        },
      },
      orderBy: { scheduledFor: "desc" },
    });

    return NextResponse.json(emails.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/email/scheduled - Create a scheduled email
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { recipients, ...emailData } = body;

    const email = await prisma.scheduledEmail.create({
      data: {
        userId: session.user.id,
        subject: emailData.subject,
        body: emailData.body,
        scheduledFor: new Date(
          emailData.scheduled_for || emailData.scheduledFor,
        ),
        status: "pending",
        recipients: recipients?.length
          ? {
              create: recipients.map((r: any) => ({
                email: r.email,
                contactId: r.contact_id || r.contactId || null,
                status: "pending",
              })),
            }
          : undefined,
      },
      include: { recipients: true },
    });

    return NextResponse.json(toSnakeCase(email), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
