import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const ministries = await prisma.ministry.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(ministries);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role === "LEADER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name) return new NextResponse("Name is required", { status: 400 });

    const ministry = await prisma.ministry.create({
      data: { name },
    });
    return NextResponse.json(ministry);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
