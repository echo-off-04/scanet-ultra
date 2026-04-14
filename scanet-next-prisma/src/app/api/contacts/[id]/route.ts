import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyContactUpdated } from "@/lib/notifications";
import { mapContact, toSnakeCase } from "@/lib/apiMappers";

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
        interactions: { orderBy: { interactionDate: "desc" }, take: 20 },
        followUps: { orderBy: { dueDate: "asc" } },
        opportunities: { orderBy: { createdAt: "desc" } },
        contactEvents: { include: { event: true } },
        groupMembers: { include: { group: true } },
      },
    });

    if (!contact)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json(mapContact(contact));
  } catch (error) {
    console.error("Error fetching contact:", error);
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
    const existing = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const body = await request.json();
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        fullName: body.fullName ?? body.full_name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        jobTitle: body.jobTitle ?? body.job_title,
        linkedinUrl: body.linkedinUrl ?? body.linkedin_url,
        avatarUrl: body.avatarUrl ?? body.avatar_url,
        rating: body.rating,
        tags: body.tags,
        notes: body.notes,
        status: body.status,
        source: body.source,
        isMember: body.isMember ?? body.is_member,
        city: body.city,
        region: body.region,
        country: body.country,
        industry: body.industry,
        companySize: body.companySize ?? body.company_size,
        address: body.address,
        website: body.website,
        relationship: body.relationship,
        opportunityAmount: body.opportunityAmount ?? body.opportunity_amount,
        followUpRequired: body.followUpRequired ?? body.follow_up_required,
      },
    });

    await notifyContactUpdated(session.user.id, contact.fullName, contact.id);

    return NextResponse.json(mapContact(contact));
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH is used by ContactProfile, alias to same logic as PUT
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return PUT(request, context);
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
    const existing = await prisma.contact.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
