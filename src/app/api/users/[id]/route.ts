import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN_MASTER", "ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { role, ministryId } = body;

    // Only MASTER can elevate to another MASTER or edit other MASTERs 
    // Wait, let's keep it simple: Admins can update Leader roles to Admin. 
    // But Master can do anything.
    if ((session.user as any).role !== "ADMIN_MASTER" && role === "ADMIN_MASTER") {
       return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        ...(role && { role }),
        ...(typeof ministryId !== "undefined" && { ministryId: ministryId === "" ? null : ministryId })
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
