import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// PATCH /api/contacts/[id]/interactions/[noteId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, noteId } = await params;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const body = await request.json();
    const note = await prisma.contactNote.update({
      where: { id: noteId },
      data: {
        content: body.content,
      },
    });

    return NextResponse.json(toSnakeCase(note));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/contacts/[id]/interactions/[noteId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, noteId } = await params;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    await prisma.contactNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
