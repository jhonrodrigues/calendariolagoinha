import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("file:")) {
    return new NextResponse("Banco de dados SQLite não configurado corretamente.", { status: 500 });
  }

  // Extract path from file://... or file:./...
  let dbPath = dbUrl.replace("file:", "");
  
  // Resolve path relative to cwd if it's relative
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.join(process.cwd(), dbPath);
  }

  try {
    if (!fs.existsSync(dbPath)) {
      return new NextResponse("Arquivo de banco de dados não encontrado.", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);
    
    // Generate a timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-lagoinha-${timestamp}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/octet-stream",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Backup Download Error:", error);
    return new NextResponse("Erro ao acessar o banco de dados.", { status: 500 });
  }
}
