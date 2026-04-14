import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/email/sequences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sequences = await prisma.emailSequence.findMany({
      where: { userId: session.user.id },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with enrollment counts
    const enriched = await Promise.all(
      sequences.map(async (seq: any) => {
        const [totalCount, activeCount] = await Promise.all([
          prisma.emailSequenceEnrollment.count({
            where: { sequenceId: seq.id },
          }),
          prisma.emailSequenceEnrollment.count({
            where: { sequenceId: seq.id, status: "active" },
          }),
        ]);
        return {
          ...seq,
          enrollments_count: totalCount,
          active_enrollments: activeCount,
        };
      }),
    );

    return NextResponse.json(enriched.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/email/sequences
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { steps, ...sequenceData } = body;

    const sequence = await prisma.emailSequence.create({
      data: {
        userId: session.user.id,
        name: sequenceData.name,
        description: sequenceData.description,
        triggerType:
          sequenceData.trigger_type || sequenceData.triggerType || "manual",
        isActive: sequenceData.is_active ?? true,
        steps: steps?.length
          ? {
              create: steps.map((step: any, index: number) => ({
                stepOrder: step.step_order ?? step.stepOrder ?? index + 1,
                delayDays: step.delay_days ?? step.delayDays ?? 0,
                delayHours: step.delay_hours ?? step.delayHours ?? 0,
                subject: step.subject,
                body: step.body,
                channel: step.channel || "email",
                includeOfferId:
                  step.include_offer_id || step.includeOfferId || null,
              })),
            }
          : undefined,
      },
      include: { steps: true },
    });

    return NextResponse.json(toSnakeCase(sequence), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
