import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  try {
    const spaces = await prisma.space.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(spaces);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN_MASTER", "ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name, description } = await req.json();
    const space = await prisma.space.create({ data: { name, description } });
    return NextResponse.json(space);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
