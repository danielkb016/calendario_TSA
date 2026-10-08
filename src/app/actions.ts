'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// -- Calendars --

export async function getCalendars() {
  return await prisma.calendar.findMany({
    include: {
      zones: true,
      callTargets: true,
      globalPermits: {
        include: {
          exclusions: true
        }
      },
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

export async function updateCalendar(id: number, data: Partial<{ title: string; requiresDailyCoordination: boolean; lat: number | null; lng: number | null }>) {
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

export async function updateOperator(id: number, name: string) {
  const operator = await prisma.operator.update({
    where: { id },
    data: { name }
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

export async function updateCallTarget(id: number, data: { name?: string; requiresOpening?: boolean; requiresClosing?: boolean; contactNotes?: string | null }) {
  const target = await prisma.callTarget.update({
    where: { id },
    data
  });
  revalidatePath('/');
  return target;
}

// -- Global Permits --

export async function addGlobalPermit(calendarId: number, name: string, expirationDate: Date, warningDays: number = 30) {
  const permit = await prisma.globalPermit.create({
    data: {
      calendarId,
      name,
      expirationDate,
      warningDays
    }
  });
  revalidatePath('/');
  return permit;
}

export async function updateGlobalPermit(id: number, name: string, expirationDate: Date, warningDays: number = 30) {
  const permit = await prisma.globalPermit.update({
    where: { id },
    data: { name, expirationDate, warningDays }
  });
  revalidatePath('/');
  return permit;
}

export async function addPermitExclusion(
  globalPermitId: number, 
  startDate: Date, 
  endDate: Date | null = null, 
  ruleType: string = 'DENY_ALL', 
  timeWindowsJson: string | null = null, 
  reason: string | null = null
) {
  const exclusion = await prisma.permitExclusion.create({
    data: { globalPermitId, startDate, endDate, ruleType, timeWindowsJson, reason }
  });
  revalidatePath('/');
  return exclusion;
}

export async function removePermitExclusion(id: number) {
  await prisma.permitExclusion.delete({ where: { id } });
  revalidatePath('/');
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

export async function getAllFlights() {
  return await prisma.flight.findMany({
    include: { zone: true },
    orderBy: { startDate: 'asc' }
  });
}

export async function getTodayFlights(dateIso?: string) {
  const targetDate = dateIso ? new Date(dateIso) : new Date();
  const startOfToday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  return await prisma.flight.findMany({
    where: {
      startDate: { lte: endOfToday },
      endDate: { gte: startOfToday },
      coordination: {
        notIn: ['Anulada', 'Finalizada']
      }
    },
    include: { zone: true },
    orderBy: { startDate: 'asc' }
  });
}
// -- Call Targets --
export async function updateCalendarLock(id: number, isLocked: boolean, lockReason: string | null) {
  const cal = await prisma.calendar.update({
    where: { id },
    data: { isLocked, lockReason }
  });
  revalidatePath('/');
  return cal;
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

export async function getGlobalCoordinationsForDate(dateIso?: string) {
  const targetDate = dateIso ? new Date(dateIso) : new Date();
  // We use the start of the local day to uniquely identify "the day" for the daily coordination
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);

  // Get calendars and include their call targets and permits
  const calendars = await prisma.calendar.findMany({
    include: { 
      callTargets: true,
      globalPermits: {
        include: {
          exclusions: true
        }
      }
    }
  });

  const results = [];
  
  for (const cal of calendars) {
    const statuses = [];
    for (const target of cal.callTargets) {
      // Upsert the daily status for this target and the requested date
      const status = await prisma.dailyCallStatus.upsert({
        where: {
          callTargetId_date: {
            callTargetId: target.id,
            date: startOfDay
          }
        },
        update: {},
        create: {
          callTargetId: target.id,
          date: startOfDay
        },
        include: {
          callTarget: {
            include: { calendar: true }
          },
          cycles: true
        }
      });
      statuses.push(status);
    }
    // Include if it requires daily coordination or if it has global permits
    if (cal.requiresDailyCoordination || cal.globalPermits.length > 0) {
      results.push({
        calendar: cal,
        statuses: statuses,
        globalPermits: cal.globalPermits
      });
    }
  }

  return results;
}

export async function updateDailyCallStatus(id: number, data: { notes: string | null }) {
  const coord = await prisma.dailyCallStatus.update({ where: { id }, data });
  revalidatePath('/');
  return coord;
}

export async function createDailyCallCycle(statusId: number) {
  const cycle = await prisma.dailyCallCycle.create({
    data: {
      dailyCallStatusId: statusId
    }
  });
  revalidatePath('/');
  return cycle;
}

export async function updateDailyCallCycle(id: number, data: Partial<{
  opened: boolean;
  openedBy: string | null;
  openedAt: Date | null;
  closed: boolean;
  closedBy: string | null;
  closedAt: Date | null;
}>) {
  const cycle = await prisma.dailyCallCycle.update({ where: { id }, data });
  revalidatePath('/');
  return cycle;
}

export async function deleteDailyCallCycle(id: number) {
  await prisma.dailyCallCycle.delete({ where: { id } });
  revalidatePath('/');
}

export async function deleteFutureDailyCallCycles(callTargetId: number, fromDate: Date) {
  // Find all DailyCallStatus for this target on or after the date
  const futureStatuses = await prisma.dailyCallStatus.findMany({
    where: {
      callTargetId: callTargetId,
      date: { gte: fromDate }
    }
  });

  const statusIds = futureStatuses.map(s => s.id);

  // Delete all cycles associated with those statuses
  if (statusIds.length > 0) {
    await prisma.dailyCallCycle.deleteMany({
      where: {
        dailyCallStatusId: { in: statusIds }
      }
    });
  }

  revalidatePath('/');
}

export async function openCoordinationUntilDate(
  statusId: number, 
  currentCycleId: number, 
  untilDateStr: string, 
  user: string, 
  notes: string | null
) {
  // 1. Update current cycle and status
  await prisma.dailyCallCycle.update({
    where: { id: currentCycleId },
    data: { opened: true, openedBy: user, openedAt: new Date() }
  });
  if (notes !== null) {
    await prisma.dailyCallStatus.update({
      where: { id: statusId },
      data: { notes }
    });
  }

  // 2. Fetch current status to get callTargetId and base date
  const currentStatus = await prisma.dailyCallStatus.findUnique({
    where: { id: statusId }
  });
  
  if (!currentStatus) return;

  const untilDate = new Date(untilDateStr);
  untilDate.setHours(0, 0, 0, 0); // ensure we compare start of day
  let iterDate = new Date(currentStatus.date);
  iterDate.setDate(iterDate.getDate() + 1);
  iterDate.setHours(0, 0, 0, 0);

  // 3. Loop until untilDate
  while (iterDate <= untilDate) {
    const iterDateStartOfDay = new Date(iterDate.getTime());
    
    // upsert daily call status
    const status = await prisma.dailyCallStatus.upsert({
      where: {
        callTargetId_date: {
          callTargetId: currentStatus.callTargetId,
          date: iterDateStartOfDay
        }
      },
      update: {
        notes: notes
      },
      create: {
        callTargetId: currentStatus.callTargetId,
        date: iterDateStartOfDay,
        notes: notes
      }
    });

    // create a cycle for it that is already open
    await prisma.dailyCallCycle.create({
      data: {
        dailyCallStatusId: status.id,
        opened: true,
        openedBy: user,
        openedAt: new Date() // recorded as opened at the current real-world time
      }
    });

    iterDate.setDate(iterDate.getDate() + 1);
  }
  
  revalidatePath('/');
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

