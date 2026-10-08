const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const data = JSON.parse(fs.readFileSync('permits_backup.json', 'utf8'));

  for (const permit of data) {
    const p = await prisma.globalPermit.create({
      data: {
        id: permit.id,
        name: permit.name,
        calendarId: permit.calendarId,
        coordinations: {
          create: {
            expirationDate: new Date(permit.expirationDate),
            warningDays: permit.warningDays,
            exclusions: {
              create: permit.exclusions.map(ex => ({
                id: ex.id,
                startDate: new Date(ex.startDate),
                endDate: ex.endDate ? new Date(ex.endDate) : null,
                ruleType: ex.ruleType,
                timeWindowsJson: ex.timeWindowsJson,
                reason: ex.reason
              }))
            }
          }
        }
      }
    });
  }
  console.log('Restored');
}
main().catch(console.error);
