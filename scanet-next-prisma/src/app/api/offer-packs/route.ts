import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapOffer } from "@/lib/apiMappers";

// GET /api/offer-packs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const packs = await prisma.offerPack.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            offer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to expected format
    const mapped = packs.map((pack: any) => ({
      ...pack,
      offers: pack.items.map((item: any) => item.offer),
    }));

    return NextResponse.json(mapped.map(mapOffer));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/offer-packs
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { offerIds, ...packData } = body;

    const pack = await prisma.offerPack.create({
      data: {
        userId: session.user.id,
        name: packData.name,
        description: packData.description,
        discountPercentage:
          packData.discount_percentage || packData.discountPercentage,
        price: packData.price,
        status: (packData.is_active ?? true) ? "active" : "inactive",
        imageUrl: packData.image_url || packData.imageUrl,
        items: offerIds?.length
          ? {
              create: offerIds.map((offerId: string) => ({ offerId })),
            }
          : undefined,
      },
      include: {
        items: { include: { offer: true } },
      },
    });

    return NextResponse.json(mapOffer(pack), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
