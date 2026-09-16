const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.dailyCallStatus.findMany();
  let migrated = 0;
  for (const status of statuses) {
    if (status.opened || status.closed) {
      // Check if a cycle already exists
      const existing = await prisma.dailyCallCycle.findFirst({
        where: { dailyCallStatusId: status.id }
      });
      if (!existing) {
        await prisma.dailyCallCycle.create({
          data: {
            dailyCallStatusId: status.id,
            opened: status.opened,
            openedBy: status.openedBy,
            openedAt: status.openedAt,
            closed: status.closed,
            closedBy: status.closedBy,
            closedAt: status.closedAt,
          }
        });
        migrated++;
      }
    }
  }
  console.log(`Migrated ${migrated} records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
