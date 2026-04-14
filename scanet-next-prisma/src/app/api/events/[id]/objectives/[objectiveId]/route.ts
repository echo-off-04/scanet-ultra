import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PATCH /api/events/[id]/objectives/[objectiveId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, objectiveId } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.objective_type !== undefined)
      data.objectiveType = body.objective_type;
    if (body.metric_type !== undefined) data.metricType = body.metric_type;
    if (body.target_value !== undefined) data.targetValue = body.target_value;
    if (body.current_value !== undefined)
      data.currentValue = body.current_value;
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.achieved !== undefined) data.achieved = body.achieved;
    if (body.priority !== undefined) data.priority = body.priority;

    const objective = await prisma.eventObjective.update({
      where: { id: objectiveId },
      data,
    });

    return NextResponse.json(toSnakeCase(objective));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[id]/objectives/[objectiveId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, objectiveId } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await prisma.eventObjective.delete({
      where: { id: objectiveId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
