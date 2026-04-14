import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

async function updateScheduledEmail(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.scheduledEmail.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Handle cancel action
    if (body.action === "cancel" || body.status === "cancelled") {
      const email = await prisma.scheduledEmail.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json(toSnakeCase(email));
    }

    const email = await prisma.scheduledEmail.update({
      where: { id },
      data: {
        subject: body.subject,
        body: body.body,
        scheduledFor: body.scheduled_for
          ? new Date(body.scheduled_for)
          : undefined,
      },
    });
    return NextResponse.json(toSnakeCase(email));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/email/scheduled/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return updateScheduledEmail(request, context);
}

// PATCH /api/email/scheduled/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return updateScheduledEmail(request, context);
}

// DELETE /api/email/scheduled/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.scheduledEmail.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.scheduledEmail.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
