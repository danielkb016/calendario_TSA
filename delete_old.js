const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe('DELETE FROM PermitExclusion');
  await prisma.$executeRawUnsafe('DELETE FROM GlobalPermit');
  console.log('Old records deleted.');
}
main().catch(console.error);
