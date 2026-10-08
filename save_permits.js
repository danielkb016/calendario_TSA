const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const permits = await prisma.globalPermit.findMany({
    include: { exclusions: true }
  });
  fs.writeFileSync('permits_backup.json', JSON.stringify(permits, null, 2));
  console.log('Permits backed up to permits_backup.json');
}
main().catch(console.error);
