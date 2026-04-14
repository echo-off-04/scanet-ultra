import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/enterprise - Get all enterprises owned by the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const enterprises = await prisma.enterprise.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(enterprises.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/enterprise - Create enterprise
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const enterprise = await prisma.enterprise.create({
      data: {
        name: body.name,
        description: body.description || null,
        industry: body.industry || null,
        size: body.size || null,
        logoUrl: body.logo_url || null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(toSnakeCase(enterprise), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/enterprise - Update enterprise
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...data } = body;

    // Verify ownership
    const enterprise = await prisma.enterprise.findFirst({
      where: { id, ownerId: session.user.id },
    });
    if (!enterprise)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.enterprise.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        industry: data.industry,
        size: data.size,
        logoUrl: data.logo_url,
      },
    });

    return NextResponse.json(toSnakeCase(updated));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
