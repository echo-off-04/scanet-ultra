import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/contacts/[id]/interactions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
      include: {
        contactEvents: {
          include: { event: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const [notes, activities, opportunities] = await Promise.all([
      prisma.contactNote.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactActivity.findMany({
        where: { contactId: id },
        orderBy: { activityDate: "desc" },
        take: 20,
      }),
      prisma.contactOpportunity.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const events = contact.contactEvents.map((ce) => ce.event);

    return NextResponse.json({
      notes: notes.map(toSnakeCase),
      activities: activities.map(toSnakeCase),
      opportunities: opportunities.map(toSnakeCase),
      events: events.map(toSnakeCase),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/contacts/[id]/interactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const body = await request.json();

    let result;
    if (body.type === "note") {
      result = await prisma.contactNote.create({
        data: {
          contactId: id,
          userId: session.user.id,
          content: body.content || body.notes || "",
        },
      });
    } else if (body.type === "activity") {
      result = await prisma.contactActivity.create({
        data: {
          contactId: id,
          userId: session.user.id,
          activityType: body.activity_type || body.activityType || "other",
          description: body.description || null,
          activityDate: body.activity_date
            ? new Date(body.activity_date)
            : new Date(),
        },
      });
    } else {
      result = await prisma.interaction.create({
        data: {
          contactId: id,
          userId: session.user.id,
          interactionType: body.type || "note",
          subject: body.subject || null,
          description: body.notes || body.description || null,
          interactionDate: body.date ? new Date(body.date) : new Date(),
        },
      });
    }

    // Update contact updated_at
    await prisma.contact.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(toSnakeCase(result), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
