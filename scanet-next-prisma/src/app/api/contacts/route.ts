import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyContactCreated } from "@/lib/notifications";
import { syncEventKpis } from "@/lib/eventKpis";
import { mapContact } from "@/lib/apiMappers";
import { enrollContactInMatchingSequences } from "@/lib/emailSequences";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const hasEmail = searchParams.get("has_email") === "true";

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
        where: {
          userId: session.user.id,
          ...(hasEmail ? { email: { not: null } } : {}),
        },
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
    const { eventId, selectedRelations, relationshipType, ...contactData } = body;

    const relatedContactIds = Array.from(
      new Set(
        (Array.isArray(selectedRelations) ? selectedRelations : []).filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        ),
      ),
    );

    const contact = await prisma.$transaction(async (tx) => {
      const createdContact = await tx.contact.create({
        data: {
          userId: session.user.id,
          fullName: contactData.fullName || contactData.full_name,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          jobTitle: contactData.jobTitle || contactData.job_title,
          linkedinUrl:
            contactData.linkedinUrl ||
            contactData.linkedin_url ||
            contactData.linkedin,
          avatarUrl: contactData.avatarUrl || contactData.avatar_url,
          rating: contactData.rating,
          tags: contactData.tags || [],
          notes: contactData.notes,
          status: contactData.status || "lead",
          source: contactData.source,
          isMember: Boolean(contactData.isMember ?? contactData.is_member),
          city: contactData.city,
          region: contactData.region,
          country: contactData.country,
          industry: contactData.industry,
          companySize: contactData.companySize || contactData.company_size,
          address: contactData.address,
          website: contactData.website,
          twitter: contactData.twitter,
          relationship: contactData.relationship,
          isFavorite: Boolean(contactData.isFavorite ?? contactData.is_favorite),
          opportunityAmount:
            contactData.opportunityAmount ?? contactData.opportunity_amount,
        },
      });

      if (eventId) {
        await tx.contactEvent.create({
          data: { contactId: createdContact.id, eventId, source: "event" },
        });
      }

      if (relatedContactIds.length > 0) {
        await tx.contactRelationship.createMany({
          data: relatedContactIds.map((relatedContactId) => ({
            contactId: createdContact.id,
            relatedContactId,
            userId: session.user.id,
            relationshipType:
              typeof relationshipType === "string" && relationshipType.length > 0
                ? relationshipType
                : "contact",
          })),
          skipDuplicates: true,
        });
      }

      await enrollContactInMatchingSequences(tx, {
        id: createdContact.id,
        userId: createdContact.userId,
        fullName: createdContact.fullName,
        email: createdContact.email,
        company: createdContact.company,
        jobTitle: createdContact.jobTitle,
        source: createdContact.source,
        status: createdContact.status,
      });

      return createdContact;
    });

    if (eventId) {
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
