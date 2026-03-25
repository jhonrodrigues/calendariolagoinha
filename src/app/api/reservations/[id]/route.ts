import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN_MASTER", "ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  const { id } = await params;

  try {
    const { status } = await req.json();
    const res = await prisma.spaceReservation.update({ 
      where: { id }, 
      data: { status } 
    });
    return NextResponse.json(res);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const user = session.user as any;

  const { id } = await params;

  try {
    const existing = await prisma.spaceReservation.findUnique({ where: { id } });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    // Only Admin or the Creator can delete/withdraw exactly
    if (existing.userId !== user.id && !["ADMIN_MASTER", "ADMIN"].includes(user.role)) {
       return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.spaceReservation.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
