const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const permits = await prisma.globalPermit.findMany({
    include: { coordinations: true }
  });
  console.log(JSON.stringify(permits, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
