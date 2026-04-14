import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapOffer } from "@/lib/apiMappers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const offer = await prisma.offer.findFirst({
      where: { id, userId: session.user.id },
      include: { offerPackItems: { include: { pack: true } } },
    });
    if (!offer)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mapOffer(offer));
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
    const existing = await prisma.offer.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Map is_active boolean to status enum
    let status = body.status;
    if (body.is_active !== undefined) {
      status = body.is_active ? "active" : "inactive";
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.price !== undefined)
      updateData.price = body.price != null ? parseFloat(body.price) : null;
    if (body.originalPrice !== undefined || body.original_price !== undefined)
      updateData.originalPrice = body.originalPrice ?? body.original_price;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.billingType !== undefined || body.billing_type !== undefined)
      updateData.billingType = body.billingType ?? body.billing_type;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.hourly_rate !== undefined)
      updateData.hourlyRate =
        body.hourly_rate != null ? parseFloat(body.hourly_rate) : null;
    if (body.estimated_hours !== undefined)
      updateData.estimatedHours =
        body.estimated_hours != null ? parseFloat(body.estimated_hours) : null;
    if (body.daily_rate !== undefined)
      updateData.dailyRate =
        body.daily_rate != null ? parseFloat(body.daily_rate) : null;
    if (body.estimated_days !== undefined)
      updateData.estimatedDays =
        body.estimated_days != null ? parseFloat(body.estimated_days) : null;
    if (body.unit_price !== undefined)
      updateData.unitPrice =
        body.unit_price != null ? parseFloat(body.unit_price) : null;
    if (body.quantity !== undefined)
      updateData.quantity =
        body.quantity != null ? parseInt(body.quantity) : null;
    if (status !== undefined) updateData.status = status;
    if (body.imageUrl !== undefined || body.image_url !== undefined)
      updateData.imageUrl = body.imageUrl ?? body.image_url;
    if (body.features !== undefined) updateData.features = body.features;

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(mapOffer(offer));
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
    const existing = await prisma.offer.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export { PUT as PATCH };
