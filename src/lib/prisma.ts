import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // During Next.js build phase, we might not have a valid DB connection.
  // We return a proxy or a dummy client if we are in the collection phase.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
     return {} as any;
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
