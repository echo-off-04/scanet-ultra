import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyEventCreated } from "@/lib/notifications";
import { randomUUID } from "crypto";
import { mapEvent } from "@/lib/apiMappers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const events = await prisma.event.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contactEvents: true } },
      },
    });

    return NextResponse.json({ events: events.map(mapEvent) });
  } catch (error) {
    console.error("Error fetching events:", error);
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
    const qrCodeToken = randomUUID();

    const event = await prisma.event.create({
      data: {
        userId: session.user.id,
        name: body.name,
        description: body.description,
        category: body.category || "networking",
        eventType: body.eventType || body.event_type || "presentiel",
        status: body.status || "upcoming",
        startDate:
          body.startDate || body.start_date
            ? new Date(body.startDate || body.start_date)
            : undefined,
        endDate:
          body.endDate || body.end_date
            ? new Date(body.endDate || body.end_date)
            : undefined,
        location: body.location,
        imageUrl: body.imageUrl || body.image_url,
        eventDate:
          body.eventDate || body.event_date
            ? new Date(body.eventDate || body.event_date)
            : undefined,
        targetParticipants:
          body.targetParticipants || body.target_participants || 0,
        primaryObjective: body.primaryObjective || body.primary_objective,
        secondaryObjectives:
          body.secondaryObjectives || body.secondary_objectives || [],
        targetAudience: body.targetAudience || body.target_audience || [],
        budget: body.budget || 0,
        qrCodeToken,
      },
    });

    await notifyEventCreated(session.user.id, event.name, event.id);

    return NextResponse.json({ event: mapEvent(event) }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
