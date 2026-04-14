import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  notifyOpportunityStatusChanged,
  notifyHighValueOpportunity,
} from "@/lib/notifications";
import { mapOpportunity } from "@/lib/apiMappers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const opportunity = await prisma.contactOpportunity.findFirst({
      where: { id, userId: session.user.id },
      include: { contact: true },
    });
    if (!opportunity)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mapOpportunity(opportunity));
  } catch (error) {
    console.error("Error:", error);
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
    const existing = await prisma.contactOpportunity.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const opportunity = await prisma.contactOpportunity.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        status: body.status,
        expectedCloseDate: body.expectedCloseDate
          ? new Date(body.expectedCloseDate)
          : undefined,
      },
    });

    // Notify on status change
    if (
      existing.status !== body.status &&
      (body.status === "won" || body.status === "lost")
    ) {
      await notifyOpportunityStatusChanged(
        session.user.id,
        opportunity.title,
        body.status,
        opportunity.id,
        opportunity.amount || undefined,
      );
    }

    if (body.amount && body.amount > 10000 && !existing.amount) {
      await notifyHighValueOpportunity(
        session.user.id,
        opportunity.title,
        body.amount,
        opportunity.id,
      );
    }

    return NextResponse.json(mapOpportunity(opportunity));
  } catch (error) {
    console.error("Error:", error);
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
    const existing = await prisma.contactOpportunity.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.contactOpportunity.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH is an alias for PUT
export { PUT as PATCH };
