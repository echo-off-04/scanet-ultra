import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PUT /api/enterprise/team-objectives/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();

    const objective = await prisma.teamObjective.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        targetValue: body.target_value ?? undefined,
        currentValue: body.current_value ?? undefined,
        unit: body.unit,
        currency: body.currency,
        startDate: body.start_date ? new Date(body.start_date) : undefined,
        endDate: body.end_date ? new Date(body.end_date) : undefined,
        status: body.status,
        priority: body.priority,
        assignedTo: body.assigned_to,
        enterpriseObjectiveId: body.enterprise_objective_id,
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

// DELETE /api/enterprise/team-objectives/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.teamObjective.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
