import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/enterprise/team-objectives?team_id=xxx
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const teamId = request.nextUrl.searchParams.get("team_id");
    const enterpriseId = request.nextUrl.searchParams.get("enterprise_id");

    const where: Record<string, unknown> = {};
    if (teamId) where.teamId = teamId;
    if (enterpriseId) {
      where.team = { enterpriseId };
    }

    const objectives = await prisma.teamObjective.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

// POST /api/enterprise/team-objectives
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const objective = await prisma.teamObjective.create({
      data: {
        teamId: body.team_id,
        title: body.title,
        description: body.description || null,
        targetValue: body.target_value ?? null,
        currentValue: body.current_value || 0,
        unit: body.unit || null,
        currency: body.currency || "EUR",
        startDate: body.start_date ? new Date(body.start_date) : null,
        endDate: body.end_date ? new Date(body.end_date) : null,
        status: body.status || "not_started",
        priority: body.priority || "medium",
        enterpriseObjectiveId: body.enterprise_objective_id || null,
        assignedTo: body.assigned_to || null,
        createdBy: session.user.id,
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
