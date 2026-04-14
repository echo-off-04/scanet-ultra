import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyContactCreated } from "@/lib/notifications";
import { syncEventKpis } from "@/lib/eventKpis";
import { mapContact } from "@/lib/apiMappers";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    let contacts;
    if (eventId) {
      // Fetch contacts linked to a specific event
      const contactEvents = await prisma.contactEvent.findMany({
        where: { eventId, contact: { userId: session.user.id } },
        include: {
          contact: {
            include: {
              contactEvents: {
                include: { event: { select: { id: true, name: true } } },
              },
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
      contacts = contactEvents.map((ce) => ce.contact);
    } else {
      contacts = await prisma.contact.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          contactEvents: {
            include: { event: { select: { id: true, name: true } } },
          },
          _count: {
            select: {
              opportunities: true,
              followUps: true,
              interactions: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ contacts: contacts.map(mapContact) });
  } catch (error) {
    console.error("Error fetching contacts:", error);
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
    const { eventId, ...contactData } = body;

    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        fullName: contactData.fullName || contactData.full_name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        jobTitle: contactData.jobTitle || contactData.job_title,
        linkedinUrl: contactData.linkedinUrl || contactData.linkedin_url,
        avatarUrl: contactData.avatarUrl || contactData.avatar_url,
        rating: contactData.rating,
        tags: contactData.tags || [],
        notes: contactData.notes,
        status: contactData.status || "lead",
        source: contactData.source,
        isMember: contactData.isMember || contactData.is_member || false,
        city: contactData.city,
        region: contactData.region,
        country: contactData.country,
        industry: contactData.industry,
        companySize: contactData.companySize || contactData.company_size,
        address: contactData.address,
        website: contactData.website,
        relationship: contactData.relationship,
      },
    });

    if (eventId) {
      await prisma.contactEvent.create({
        data: { contactId: contact.id, eventId, source: "event" },
      });
      await syncEventKpis(eventId);
    }

    await notifyContactCreated(session.user.id, contact.fullName, contact.id);

    return NextResponse.json({ contact: mapContact(contact) }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
