import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/enterprise/groups?enterprise_id=xxx
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

    const groups = await prisma.customGroup.findMany({
      where: { enterpriseId },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = groups.map((g: any) => ({
      ...g,
      members_count: g._count.members,
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

// POST /api/enterprise/groups
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const group = await prisma.customGroup.create({
      data: {
        enterpriseId: body.enterprise_id,
        name: body.name,
        description: body.description || null,
        color: body.color || "#6366F1",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(toSnakeCase(group), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
