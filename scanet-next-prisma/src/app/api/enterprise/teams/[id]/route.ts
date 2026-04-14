import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PUT /api/enterprise/teams/[id]
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

    // Handle team member operations
    if (body.action === "add_member") {
      await prisma.teamMember.create({
        data: {
          teamId: id,
          contactId: body.contact_id,
          userId: session.user.id,
          role: body.role || null,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "remove_member") {
      await prisma.teamMember.delete({
        where: { id: body.member_id },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "update_role") {
      await prisma.teamMember.update({
        where: { id: body.member_id },
        data: { role: body.role || null },
      });
      return NextResponse.json({ success: true });
    }

    // Update team details
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        parentTeamId: body.parent_team_id,
      },
    });
    return NextResponse.json(toSnakeCase(team));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/enterprise/teams/[id] - Get team details with members and objectives
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        contact: true,
      },
    });

    const objectives = await prisma.teamObjective.findMany({
      where: { teamId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members, objectives });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/enterprise/teams/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
