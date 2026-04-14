import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapOffer } from "@/lib/apiMappers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const offers = await prisma.offer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(offers.map(mapOffer));
  } catch (error) {
    console.error("Error:", error);
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

    // Map billing_type values from component to Prisma enum
    const billingType = body.billingType || body.billing_type || "one_time";

    // Map is_active boolean to status enum
    let status = body.status || "active";
    if (body.is_active !== undefined) {
      status = body.is_active ? "active" : "inactive";
    }

    const offer = await prisma.offer.create({
      data: {
        userId: session.user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        price: body.price != null ? parseFloat(body.price) : null,
        originalPrice: body.originalPrice || body.original_price,
        currency: body.currency || "EUR",
        billingType,
        duration: body.duration,
        hourlyRate:
          body.hourly_rate != null ? parseFloat(body.hourly_rate) : null,
        estimatedHours:
          body.estimated_hours != null
            ? parseFloat(body.estimated_hours)
            : null,
        dailyRate: body.daily_rate != null ? parseFloat(body.daily_rate) : null,
        estimatedDays:
          body.estimated_days != null ? parseFloat(body.estimated_days) : null,
        unitPrice: body.unit_price != null ? parseFloat(body.unit_price) : null,
        quantity: body.quantity != null ? parseInt(body.quantity) : null,
        status,
        imageUrl: body.imageUrl || body.image_url,
        features: body.features || [],
      },
    });
    return NextResponse.json(mapOffer(offer), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
