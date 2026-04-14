import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PUT /api/enterprise/groups/[id]
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

    const existingGroup = await prisma.customGroup.findFirst({
      where: { id, enterprise: { ownerId: session.user.id } },
      select: { id: true },
    });
    if (!existingGroup)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Handle member operations
    if (body.action === "add_member" || body.action === "addMember") {
      await prisma.customGroupMember.create({
        data: {
          groupId: id,
          contactId: body.contact_id,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "remove_member" || body.action === "removeMember") {
      await prisma.customGroupMember.delete({
        where: { id: body.member_id },
      });
      return NextResponse.json({ success: true });
    }

    // Update group
    const group = await prisma.customGroup.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
      },
    });
    return NextResponse.json(toSnakeCase(group));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/enterprise/groups/[id] - Get group members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existingGroup = await prisma.customGroup.findFirst({
      where: { id, enterprise: { ownerId: session.user.id } },
      select: { id: true },
    });
    if (!existingGroup)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const members = await prisma.customGroupMember.findMany({
      where: { groupId: id },
      include: { contact: true },
    });

    return NextResponse.json({ members: members.map(toSnakeCase) });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/enterprise/groups/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existingGroup = await prisma.customGroup.findFirst({
      where: { id, enterprise: { ownerId: session.user.id } },
      select: { id: true },
    });
    if (!existingGroup)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.customGroup.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
