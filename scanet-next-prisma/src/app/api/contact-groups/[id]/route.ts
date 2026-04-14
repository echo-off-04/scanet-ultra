import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PUT /api/contact-groups/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.contactGroup.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Handle member operations
    if (body.action === "add_members" && body.contactIds?.length) {
      await prisma.contactGroupMember.createMany({
        data: body.contactIds.map((contactId: string) => ({
          groupId: id,
          contactId,
        })),
        skipDuplicates: true,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "remove_member" && body.contactId) {
      await prisma.contactGroupMember.deleteMany({
        where: { groupId: id, contactId: body.contactId },
      });
      return NextResponse.json({ success: true });
    }

    const group = await prisma.contactGroup.update({
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

// DELETE /api/contact-groups/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.contactGroup.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.contactGroup.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
