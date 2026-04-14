import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/events/[id]/objectives
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const objectives = await prisma.eventObjective.findMany({
      where: { eventId: id },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(objectives.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/events/[id]/objectives
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const objective = await prisma.eventObjective.create({
      data: {
        eventId: id,
        userId: session.user.id,
        objectiveType: body.objective_type || "primary",
        metricType: body.metric_type || "people_count",
        title: body.title,
        description: body.description || null,
        targetValue: body.target_value || 0,
        currentValue: body.current_value || 0,
        unit: body.unit || "personnes",
        priority: body.priority || 1,
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
