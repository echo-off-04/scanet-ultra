import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/enterprise/objectives?enterprise_id=xxx
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

    const objectives = await prisma.enterpriseObjective.findMany({
      where: { enterpriseId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
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

// POST /api/enterprise/objectives
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const objective = await prisma.enterpriseObjective.create({
      data: {
        enterpriseId: body.enterprise_id,
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
