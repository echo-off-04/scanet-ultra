import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapOffer } from "@/lib/apiMappers";

// PUT /api/offer-packs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.offerPack.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const { offerIds, ...packData } = body;

    const pack = await prisma.offerPack.update({
      where: { id },
      data: {
        name: packData.name,
        description: packData.description,
        discountPercentage:
          packData.discount_percentage || packData.discountPercentage,
        price: packData.price,
        status:
          (packData.is_active ?? packData.isActive) === false
            ? "inactive"
            : "active",
        imageUrl: packData.image_url || packData.imageUrl,
      },
    });

    // Update items if offerIds provided
    if (offerIds) {
      await prisma.offerPackItem.deleteMany({ where: { packId: id } });
      if (offerIds.length > 0) {
        await prisma.offerPackItem.createMany({
          data: offerIds.map((offerId: string) => ({ packId: id, offerId })),
        });
      }
    }

    const updated = await prisma.offerPack.findUnique({
      where: { id },
      include: { items: { include: { offer: true } } },
    });

    return NextResponse.json(mapOffer(updated));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/offer-packs/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.offerPack.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.offerPack.delete({ where: { id } });
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
