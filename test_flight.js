const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const flight = await prisma.flight.create({
      data: {
        operator: "Test Op",
        zoneId: 1,
        calendarId: 1, // Change if needed
        startDate: new Date("2026-10-16T09:00:00Z"),
        endDate: new Date("2026-10-16T13:30:00Z"),
        coordination: "Confirmado",
        situation: "Pista de Hielo"
      }
    });
    console.log("Success:", flight);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    prisma.$disconnect();
  }
}
test();
