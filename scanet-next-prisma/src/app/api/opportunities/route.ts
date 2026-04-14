import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapOpportunity } from "@/lib/apiMappers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const opportunities = await prisma.contactOpportunity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(opportunities.map(mapOpportunity));
  } catch (error) {
    console.error("Error fetching opportunities:", error);
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

    const opportunity = await prisma.contactOpportunity.create({
      data: {
        userId: session.user.id,
        contactId: body.contactId || body.contact_id,
        title: body.title,
        description: body.description,
        amount: body.amount,
        currency: body.currency || "EUR",
        status: body.status || "prospect",
        expectedCloseDate:
          body.expectedCloseDate || body.expected_close_date
            ? new Date(body.expectedCloseDate || body.expected_close_date)
            : undefined,
      },
      include: {
        contact: {
          select: { id: true, fullName: true, email: true, company: true },
        },
      },
    });

    return NextResponse.json(mapOpportunity(opportunity), { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
