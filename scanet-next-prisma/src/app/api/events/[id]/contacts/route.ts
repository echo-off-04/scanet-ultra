import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapContact } from "@/lib/apiMappers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    // Verify event belongs to user
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contactEvents = await prisma.contactEvent.findMany({
      where: { eventId: id },
      include: {
        contact: {
          include: {
            _count: {
              select: {
                opportunities: true,
                followUps: true,
                interactions: true,
              },
            },
          },
        },
      },
    });

    const contacts = contactEvents.map((ce) => mapContact(ce.contact));

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching event contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 },
      );
    }

    // Verify event and contact belong to user
    const [event, contact] = await Promise.all([
      prisma.event.findFirst({ where: { id, userId: session.user.id } }),
      prisma.contact.findFirst({
        where: { id: contactId, userId: session.user.id },
      }),
    ]);

    if (!event || !contact)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contactEvent = await prisma.contactEvent.upsert({
      where: {
        contactId_eventId: { contactId, eventId: id },
      },
      update: {},
      create: {
        contactId,
        eventId: id,
        source: body.source || "manual",
      },
    });

    return NextResponse.json(contactEvent, { status: 201 });
  } catch (error) {
    console.error("Error adding contact to event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 },
      );
    }

    // Verify event belongs to user
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!event)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.contactEvent.delete({
      where: {
        contactId_eventId: { contactId, eventId: id },
      },
    });

    return NextResponse.json({ message: "Removed" });
  } catch (error) {
    console.error("Error removing contact from event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
