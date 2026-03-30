import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { 
      userId: (session.user as any).id,
      provider: "google"
    }
  });

  return NextResponse.json({
    connected: !!account,
    email: account?.providerAccountId || null
  });
}
