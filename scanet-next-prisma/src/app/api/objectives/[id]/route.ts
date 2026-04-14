import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  refreshAllObjectives,
  calculateObjectiveValue,
} from "@/lib/objectiveCalculator";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/objectives/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const objective = await prisma.personalObjective.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!objective)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toSnakeCase(objective));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/objectives/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.personalObjective.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Handle special actions
    if (body.action === "refresh") {
      const updated = await refreshAllObjectives(session.user.id);
      return NextResponse.json(toSnakeCase(updated));
    }

    if (body.action === "reactivate") {
      const currentValue = await calculateObjectiveValue(existing as any);
      const objective = await prisma.personalObjective.update({
        where: { id },
        data: {
          status: "active",
          achievedAt: null,
          notified: false,
          currentValue,
        },
      });
      return NextResponse.json(toSnakeCase(objective));
    }

    if (body.action === "cancel") {
      const objective = await prisma.personalObjective.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json(toSnakeCase(objective));
    }

    const objective = await prisma.personalObjective.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        targetValue: body.target_value || body.targetValue,
        priority: body.priority,
        periodEnd: body.end_date
          ? new Date(body.end_date)
          : body.period_end
            ? new Date(body.period_end)
            : undefined,
      },
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

// DELETE /api/objectives/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.personalObjective.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.personalObjective.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
