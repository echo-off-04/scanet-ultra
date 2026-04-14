import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/enterprise/teams?enterprise_id=xxx
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const enterpriseId = request.nextUrl.searchParams.get("enterprise_id");
    if (!enterpriseId)
      return NextResponse.json(
        { error: "enterprise_id required" },
        { status: 400 },
      );

    // Verify ownership
    const enterprise = await prisma.enterprise.findFirst({
      where: { id: enterpriseId, ownerId: session.user.id },
    });
    if (!enterprise)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const teams = await prisma.team.findMany({
      where: { enterpriseId },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const result = teams.map((t: any) => ({
      ...t,
      members_count: t._count.members,
    }));

    return NextResponse.json(result.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/enterprise/teams
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Verify enterprise ownership
    const enterprise = await prisma.enterprise.findFirst({
      where: { id: body.enterprise_id, ownerId: session.user.id },
    });
    if (!enterprise)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Calculate level
    let level = 1;
    if (body.parent_team_id) {
      const parent = await prisma.team.findUnique({
        where: { id: body.parent_team_id },
      });
      if (parent) level = parent.level + 1;
    }

    const team = await prisma.team.create({
      data: {
        enterpriseId: body.enterprise_id,
        name: body.name,
        description: body.description || null,
        color: body.color || "#3B82F6",
        parentTeamId: body.parent_team_id || null,
        managerId: session.user.id,
        level,
      },
    });

    return NextResponse.json(toSnakeCase(team), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
