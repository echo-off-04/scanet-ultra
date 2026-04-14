import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/objectives
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {
      userId: session.user.id,
      status: { not: "cancelled" },
    };
    if (status && status !== "all") {
      where.status = status;
    }

    const objectives = await prisma.personalObjective.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ objectives: objectives.map(toSnakeCase) });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/objectives
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const objective = await prisma.personalObjective.create({
      data: {
        userId: session.user.id,
        title: body.title,
        description: body.description,
        objectiveType:
          body.objective_type ||
          body.objectiveType ||
          body.metric_type ||
          body.metricType ||
          "new_contacts",
        targetValue: body.target_value || body.targetValue || 0,
        currentValue: 0,
        unit: body.unit || "number",
        currency: body.currency || "EUR",
        contactStatusFilter:
          body.contact_status_filter || body.contactStatusFilter || null,
        periodType: body.period_type || body.periodType || "month",
        periodStart:
          body.period_start || body.start_date
            ? new Date(body.period_start || body.start_date)
            : new Date(),
        periodEnd:
          body.period_end || body.end_date
            ? new Date(body.period_end || body.end_date)
            : null,
        priority: body.priority || "medium",
        status: "active",
        eventId: body.event_id || body.eventId || null,
      },
    });
    return NextResponse.json(toSnakeCase(objective), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
