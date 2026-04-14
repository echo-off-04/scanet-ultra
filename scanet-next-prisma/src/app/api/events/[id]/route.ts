import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { syncEventKpis } from "@/lib/eventKpis";
import { mapEvent, toSnakeCase } from "@/lib/apiMappers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
      include: {
        contactEvents: {
          include: {
            contact: {
              select: {
                id: true,
                fullName: true,
                email: true,
                company: true,
                status: true,
                avatarUrl: true,
              },
            },
          },
        },
        teamEvents: { include: { team: true } },
      },
    });

    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(mapEvent(event));
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        eventType: body.eventType ?? body.event_type,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        location: body.location,
        imageUrl: body.imageUrl ?? body.image_url,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        targetParticipants: body.targetParticipants ?? body.target_participants,
        actualParticipants: body.actualParticipants ?? body.actual_participants,
        peopleApproached: body.peopleApproached ?? body.people_approached,
        primaryObjective: body.primaryObjective ?? body.primary_objective,
        secondaryObjectives:
          body.secondaryObjectives ?? body.secondary_objectives,
        targetAudience: body.targetAudience ?? body.target_audience,
        budget: body.budget,
        revenue: body.revenue,
      },
    });

    if (
      body.peopleApproached !== undefined ||
      body.people_approached !== undefined
    ) {
      await syncEventKpis(id);
    }

    return NextResponse.json(mapEvent(event));
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH is an alias for PUT
export { PUT as PATCH };
