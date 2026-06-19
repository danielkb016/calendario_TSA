const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clear existing data to avoid duplicates
  await prisma.flight.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.calendar.deleteMany({});

  // 1. Create Calendar
  const calendar = await prisma.calendar.create({
    data: {
      title: "Zonas TSA Principal",
    },
  });

  // 2. Create Zones
  const zoneEncinas = await prisma.zone.create({
    data: {
      name: "Club Las Encinas",
      calendarId: calendar.id,
    },
  });

  const zoneNorte = await prisma.zone.create({
    data: {
      name: "Urbanizaciones Norte",
      calendarId: calendar.id,
    },
  });

  // 3. Create Flights (June 2026 dates matching the calendar)
  const flightsData = [
    {
      operator: "Future Jet",
      startDate: new Date("2026-06-17T00:00:00Z"),
      endDate: new Date("2026-06-19T23:59:59Z"),
      coordination: "Anulada",
      situation: "Solicitada geografía de vuelo incluyendo nuestro Nido. Pdte. Confirmar que pueden ajustar la operación",
      calendarId: calendar.id,
      zoneId: zoneEncinas.id,
    },
    {
      operator: "Future Jet",
      startDate: new Date("2026-06-22T00:00:00Z"),
      endDate: new Date("2026-06-22T23:59:59Z"),
      coordination: "Confirmado",
      situation: "Solicitada geografía de vuelo incluyendo nuestro Nido. Pdte. Confirmar que pueden ajustar la operación",
      calendarId: calendar.id,
      zoneId: zoneEncinas.id,
    },
    {
      operator: "Dronaire Vuelos",
      startDate: new Date("2026-06-19T10:00:00Z"),
      endDate: new Date("2026-06-19T13:00:00Z"),
      coordination: "Confirmado",
      situation: "Coordinación confirmada",
      calendarId: calendar.id,
      zoneId: zoneEncinas.id,
    },
    {
      operator: "MVB Prods",
      startDate: new Date("2026-06-19T11:00:00Z"),
      endDate: new Date("2026-06-19T12:00:00Z"),
      coordination: "Pendiente",
      situation: "Contacto inicial (en Mayo). A la espera de datos de Operación",
      calendarId: calendar.id,
      zoneId: zoneEncinas.id,
    },
    {
      operator: "Fotografía Inmuebles (via Net2Fly)",
      startDate: new Date("2026-06-18T09:00:00Z"),
      endDate: new Date("2026-06-20T19:00:00Z"),
      coordination: "Confirmado",
      situation: "Coordinación confirmada (con disclaimer...). Contacto Carlos Vallejo.",
      calendarId: calendar.id,
      zoneId: zoneNorte.id,
    },
    {
      operator: "100x100 ... (vía UniversoDrone)",
      startDate: new Date("2026-06-22T09:30:00Z"),
      endDate: new Date("2026-06-24T20:00:00Z"),
      coordination: "Confirmado",
      situation: "Coordinación confirmada",
      calendarId: calendar.id,
      zoneId: zoneEncinas.id,
    },
  ];

  for (const flight of flightsData) {
    await prisma.flight.create({
      data: flight,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
