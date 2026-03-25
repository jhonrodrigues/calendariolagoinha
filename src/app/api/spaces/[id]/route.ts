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
    const { name, description } = await req.json();
    const space = await prisma.space.update({ 
      where: { id }, 
      data: { name, description } 
    });
    return NextResponse.json(space);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN_MASTER", "ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.space.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
