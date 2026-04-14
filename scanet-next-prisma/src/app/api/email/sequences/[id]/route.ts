import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/email/sequences/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const sequence = await prisma.emailSequence.findFirst({
      where: { id, userId: session.user.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!sequence)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toSnakeCase(sequence));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/email/sequences/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.emailSequence.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Handle toggle active action
    if (body.action === "toggle_active") {
      const sequence = await prisma.emailSequence.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
      return NextResponse.json(toSnakeCase(sequence));
    }

    const { steps, ...sequenceData } = body;

    // Update sequence
    const sequence = await prisma.emailSequence.update({
      where: { id },
      data: {
        name: sequenceData.name,
        description: sequenceData.description,
        triggerType: sequenceData.trigger_type || sequenceData.triggerType,
        isActive: sequenceData.is_active ?? sequenceData.isActive,
      },
    });

    // Update steps if provided
    if (steps) {
      // Delete existing steps and recreate
      await prisma.emailSequenceStep.deleteMany({ where: { sequenceId: id } });
      await prisma.emailSequenceStep.createMany({
        data: steps.map((step: any, index: number) => ({
          sequenceId: id,
          stepOrder: step.step_order ?? step.stepOrder ?? index + 1,
          delayDays: step.delay_days ?? step.delayDays ?? 0,
          delayHours: step.delay_hours ?? step.delayHours ?? 0,
          subject: step.subject,
          body: step.body,
          channel: step.channel || "email",
          includeOfferId: step.include_offer_id || step.includeOfferId || null,
        })),
      });
    }

    const updated = await prisma.emailSequence.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json(toSnakeCase(updated));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/email/sequences/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.emailSequence.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.emailSequence.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
