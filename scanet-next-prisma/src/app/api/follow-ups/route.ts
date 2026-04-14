import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const followUps = await prisma.followUp.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: "asc" },
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            avatarUrl: true,
          },
        },
      },
    });
    return NextResponse.json(followUps.map(toSnakeCase));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const followUp = await prisma.followUp.create({
      data: {
        userId: session.user.id,
        contactId: body.contactId || body.contact_id,
        title: body.title,
        description: body.description,
        dueDate:
          body.dueDate || body.due_date
            ? new Date(body.dueDate || body.due_date)
            : undefined,
        priority: body.priority || "medium",
      },
      include: { contact: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json(toSnakeCase(followUp), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
