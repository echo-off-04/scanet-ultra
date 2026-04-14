import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/join-event/[token] - Public endpoint to join event via QR code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { qrCodeToken: token },
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        description: true,
        user: {
          select: {
            profile: {
              select: { fullName: true, company: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description,
        organizer: event.user?.profile,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/join-event/[token] - Submit contact info to join event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { qrCodeToken: token },
    });

    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();

    // Create contact for the event owner
    const contact = await prisma.contact.create({
      data: {
        userId: event.userId,
        fullName:
          body.full_name ||
          `${body.first_name || ""} ${body.last_name || ""}`.trim(),
        email: body.email,
        phone: body.phone,
        company: body.company,
        jobTitle: body.job_title,
        status: "lead",
        source: "event",
        tags: ["événement", event.name],
        notes: body.notes,
      },
    });

    // Link contact to event
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        eventId: event.id,
      },
    });

    return NextResponse.json(
      { success: true, message: "Contact ajouté avec succès" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
