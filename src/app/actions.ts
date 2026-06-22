'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// -- Calendars --

export async function getCalendars() {
  return await prisma.calendar.findMany({
    include: {
      zones: true,
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

export async function updateCalendar(id: number, title: string) {
  const calendar = await prisma.calendar.update({
    where: { id },
    data: { title }
  });
  revalidatePath('/');
  return calendar;
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

export async function updateZone(id: number, name: string) {
  const zone = await prisma.zone.update({
    where: { id },
    data: { name }
  });
  revalidatePath('/');
  return zone;
}

export async function deleteZone(id: number) {
  await prisma.zone.delete({ where: { id } });
  revalidatePath('/');
}

