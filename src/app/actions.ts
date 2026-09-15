'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// -- Calendars --

export async function getCalendars() {
  return await prisma.calendar.findMany({
    include: {
      zones: true,
      callTargets: true,
      globalPermits: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createCalendar(title: string, zoneNames: string[]) {
  const calendar = await prisma.calendar.create({
    data: {
      title,
      zones: {
        create: zoneNames.map(name => ({ name }))
      }
    }
  });
  revalidatePath('/');
  return calendar;
}

export async function deleteCalendar(id: number) {
  await prisma.calendar.delete({ where: { id } });
  revalidatePath('/');
}

export async function updateCalendar(id: number, data: Partial<{ title: string; requiresDailyCoordination: boolean }>) {
  const cal = await prisma.calendar.update({ where: { id }, data });
  revalidatePath('/');
  return cal;
}

// -- Operators --

export async function getOperators() {
  return await prisma.operator.findMany();
}

export async function addOperator(name: string) {
  const operator = await prisma.operator.create({
    data: {
      name
    }
  });
  revalidatePath('/');
  return operator;
}

export async function deleteOperator(id: number) {
  await prisma.operator.delete({ where: { id } });
  revalidatePath('/');
}

// -- Call Targets --

export async function addCallTarget(calendarId: number, name: string, requiresOpening: boolean = true, requiresClosing: boolean = true, contactNotes: string | null = null) {
  const target = await prisma.callTarget.create({
    data: {
      calendarId,
      name,
      requiresOpening,
      requiresClosing,
      contactNotes
    }
  });
  revalidatePath('/');
  return target;
}

export async function deleteCallTarget(id: number) {
  await prisma.callTarget.delete({ where: { id } });
  revalidatePath('/');
}

// -- Global Permits --

export async function addGlobalPermit(calendarId: number, name: string, expirationDate: Date) {
  const permit = await prisma.globalPermit.create({
    data: {
      calendarId,
      name,
      expirationDate
    }
  });
  revalidatePath('/');
  return permit;
}

export async function deleteGlobalPermit(id: number) {
  await prisma.globalPermit.delete({ where: { id } });
  revalidatePath('/');
}

// -- Flights --

export async function getFlights(calendarId: number) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

  // Auto-finalize coordinations that ended BEFORE today (i.e., endDate < startOfToday)
  try {
    await prisma.flight.updateMany({
      where: {
        calendarId,
        endDate: { lt: startOfToday },
        coordination: {
          notIn: ['Anulada', 'Finalizada']
        }
      },
      data: {
        coordination: 'Finalizada'
      }
    });
  } catch (error) {
    console.error('Failed to auto-finalize past flights:', error);
  }

  return await prisma.flight.findMany({
    where: { calendarId },
    include: { zone: true },
    orderBy: { startDate: 'asc' }
  });
}

// -- External Web Links --

export async function getExternalWebLinks() {
  return await prisma.externalWebLink.findMany({
    orderBy: { createdAt: 'asc' }
  });
}

export async function addExternalWebLink(title: string, url: string, imageUrl?: string) {
  const link = await prisma.externalWebLink.create({
    data: {
      title,
      url,
      imageUrl
    }
  });
  revalidatePath('/');
  return link;
}

export async function deleteExternalWebLink(id: number) {
  await prisma.externalWebLink.delete({ where: { id } });
  revalidatePath('/');
}

export async function getTodayGlobalCoordinations() {
  const today = new Date();
  // We use the start of the local day to uniquely identify "today" for the daily coordination
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

  // Get all calendars that require daily coordination and include their call targets
  const calendars = await prisma.calendar.findMany({
    where: { requiresDailyCoordination: true },
    include: { 
      callTargets: true,
      globalPermits: true
    }
  });

  const results = [];
  
  for (const cal of calendars) {
    const statuses = [];
    for (const target of cal.callTargets) {
      // Upsert the daily status for this target and today's date
      const status = await prisma.dailyCallStatus.upsert({
        where: {
          callTargetId_date: {
            callTargetId: target.id,
            date: startOfToday
          }
        },
        update: {},
        create: {
          callTargetId: target.id,
          date: startOfToday
        },
        include: {
          callTarget: {
            include: { calendar: true }
          }
        }
      });
      statuses.push(status);
    }
    // Only push if there are targets to call for this calendar
    if (statuses.length > 0) {
      results.push({
        calendar: cal,
        statuses: statuses
      });
    }
  }

  return results;
}

export async function updateDailyCallStatus(id: number, data: Partial<{
  opened: boolean;
  openedBy: string | null;
  openedAt: Date | null;
  closed: boolean;
  closedBy: string | null;
  closedAt: Date | null;
  notes: string | null;
}>) {
  const coord = await prisma.dailyCallStatus.update({ where: { id }, data });
  revalidatePath('/');
  return coord;
}

export async function createFlight(data: {
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation?: string;
  calendarId: number;
  zoneId: number;
}) {
  const flight = await prisma.flight.create({ data });
  revalidatePath('/');
  return flight;
}

export async function updateFlight(id: number, data: Partial<{
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string;
  zoneId: number;
}>) {
  const flight = await prisma.flight.update({ where: { id }, data });
  revalidatePath('/');
  return flight;
}

export async function deleteFlight(id: number) {
  await prisma.flight.delete({ where: { id } });
  revalidatePath('/');
}

// -- Zones --

export async function addZone(calendarId: number, name: string) {
  const zone = await prisma.zone.create({
    data: {
      calendarId,
      name
    }
  });
  revalidatePath('/');
  return zone;
}

export async function updateZone(id: number, data: { name?: string }) {
  const zone = await prisma.zone.update({
    where: { id },
    data
  });
  revalidatePath('/');
  return zone;
}

export async function deleteZone(id: number) {
  await prisma.zone.delete({ where: { id } });
  revalidatePath('/');
}

