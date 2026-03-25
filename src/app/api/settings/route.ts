import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    let settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: "default" } });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });
    revalidatePath("/", "layout");
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
