import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

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
    const { role, ministryId, email, password } = body;

    // Fetch target user to check permissions
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return new NextResponse("Not Found", { status: 404 });

    // Only MASTER can edit another MASTER
    if ((session.user as any).role !== "ADMIN_MASTER" && targetUser.role === "ADMIN_MASTER") {
      return new NextResponse("Unauthorized: Only Master can edit another Master", { status: 401 });
    }

    // Only MASTER can elevate to another MASTER
    if ((session.user as any).role !== "ADMIN_MASTER" && role === "ADMIN_MASTER") {
       return new NextResponse("Unauthorized: Cannot elevate to Master", { status: 401 });
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        ...(role && { role }),
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(typeof ministryId !== "undefined" && { ministryId: ministryId === "" ? null : ministryId })
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
