'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CalendarCreator from './CalendarCreator';
import GanttView from './GanttView';
import CalendarSettingsModal from './CalendarSettingsModal';
import TodayStatusBanner from './TodayStatusBanner';
import GlobalTodayBanner from './GlobalTodayBanner';
import FlightModal from './FlightModal';
import styles from './DashboardClient.module.css';
import { deleteCalendar } from '@/app/actions';

type Operator = {
  id: number;
  name: string;
};

type GlobalPermit = {
  id: number;
  name: string;
  expirationDate: Date;
};

type CallTarget = {
  id: number;
  name: string;
  requiresOpening: boolean;
  requiresClosing: boolean;
};

type Zone = {
  id: number;
  name: string;
};

type Calendar = {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  requiresDailyCoordination: boolean;
  zones: Zone[];
  callTargets: CallTarget[];
  globalPermits: GlobalPermit[];
};

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string | null;
  zoneId: number;
};

export default function DashboardClient({ 
  initialCalendars, 
  globalOperators, 
  todayFlights = [],
  globalCoordinations,
  currentDateIso
}: { 
  initialCalendars: Calendar[], 
  globalOperators: Operator[], 
  todayFlights?: Flight[],
  globalCoordinations: any[],
  currentDateIso?: string
}) {
  const router = useRouter();
  const [activeCalendarIds, setActiveCalendarIds] = useState<Set<number> | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [globalEditingFlight, setGlobalEditingFlight] = useState<Flight | null>(null);

  const allZones = useMemo(() => {
    const zones: (Zone & { calendarName?: string })[] = [];
    initialCalendars.forEach(cal => {
      cal.zones.forEach(zone => {
        zones.push({ ...zone, calendarName: cal.title });
      });
    });
    return zones;
  }, [initialCalendars]);

  const activeCalendars = useMemo(() => {
    if (activeCalendarIds === 'all') return initialCalendars;
    return initialCalendars.filter(c => activeCalendarIds.has(c.id));
  }, [initialCalendars, activeCalendarIds]);

  const activeZones = useMemo(() => {
    const zones: (Zone & { calendarName?: string })[] = [];
    activeCalendars.forEach(cal => {
      cal.zones.forEach(zone => {
        zones.push({ ...zone, calendarName: cal.title });
      });
    });
    return zones;
  }, [activeCalendars]);

  const virtualCalendar = useMemo(() => {
    if (activeCalendars.length === 1 && activeCalendarIds !== 'all') {
      return activeCalendars[0];
    }
    return {
      id: 0,
      title: activeCalendarIds === 'all' ? 'Todos' : 'Varios Seleccionados',
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresDailyCoordination: false,
      zones: activeZones,
      callTargets: [],
      globalPermits: []
    } as Calendar;
  }, [activeCalendars, activeCalendarIds, activeZones]);

  const activeCalendar = virtualCalendar;

  const handleTabClick = (e: React.MouseEvent, calId: number | 'all') => {
    if (calId === 'all') {
      setActiveCalendarIds('all');
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setActiveCalendarIds(prev => {
        if (prev === 'all') {
          return new Set([calId]);
        }
        const newSet = new Set(prev);
        if (newSet.has(calId)) {
          newSet.delete(calId);
          if (newSet.size === 0) return 'all';
          return newSet;
        } else {
          newSet.add(calId);
          return newSet;
        }
      });
    } else {
      setActiveCalendarIds(new Set([calId]));
    }
  };

  // Auto-refresh every 5 minutes (300,000 ms) to keep daily coordinations updated
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      setLastRefreshed(new Date());
    }, 300000);
    return () => clearInterval(interval);
  }, [router]);

  // Force a hard reload if the user's local day changes (e.g. crossing midnight or waking up a sleeping PC)
  useEffect(() => {
    let initialDateStr = new Date().toDateString();
    
    const checkDayChange = () => {
      if (new Date().toDateString() !== initialDateStr) {
        window.location.reload();
      }
    };

    const interval = setInterval(checkDayChange, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkDayChange();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleDelete = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres eliminar el calendario "${title}" y todas sus zonas y coordinaciones asociadas?`)) {
      try {
        await deleteCalendar(id);
        const remaining = initialCalendars.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveCalendarIds(new Set([remaining[0].id]));
        } else {
          setActiveCalendarIds('all');
        }
      } catch (err) {
        console.error(err);
        alert("Error al eliminar el calendario");
      }
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.tabs} style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <div
          className={`${styles.tabWrapper} ${activeCalendarIds === 'all' ? styles.activeTabWrapper : ''}`}
          onClick={(e) => handleTabClick(e, 'all')}
        >
          <span className={styles.tabTitle}>Todos</span>
        </div>
        {initialCalendars.map(cal => {
          const isActive = activeCalendarIds === 'all' ? false : activeCalendarIds.has(cal.id);

          return (
            <div
              key={cal.id}
              className={`${styles.tabWrapper} ${isActive ? styles.activeTabWrapper : ''}`}
              onClick={(e) => handleTabClick(e, cal.id)}
            >
              {isActive ? (
                <div className={styles.tabContent}>
                  <span className={styles.tabTitle}>{cal.title}</span>
                  <div className={styles.tabActions}>
                    <button 
                      className={styles.actionBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                      }}
                      title="Ajustes de la ubicación"
                    >
                      ⚙️
                    </button>
                    <button 
                      className={styles.actionBtn} 
                      onClick={(e) => handleDelete(cal.id, cal.title, e)}
                      title="Eliminar ubicación"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ) : (
                <span className={styles.tabTitle}>{cal.title}</span>
              )}
            </div>
          );
        })}
        <button 
          className={`${styles.tab} ${styles.addTab}`}
          onClick={() => setIsCreating(true)}
        >
          + Nueva Ubicación
        </button>
      </div>

      <GlobalTodayBanner 
        coordinations={globalCoordinations} 
        operators={globalOperators} 
        lastRefreshed={lastRefreshed} 
        currentDateIso={currentDateIso} 
        fullCalendars={initialCalendars}
        selectedCalendarIds={activeCalendarIds === 'all' ? 'all' : Array.from(activeCalendarIds)}
      />

      <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <TodayStatusBanner 
          flights={todayFlights} 
          zones={activeZones} 
          onEditFlight={setGlobalEditingFlight} 
          showCalendarName={activeCalendarIds === 'all' || activeCalendarIds.size > 1}
          currentDateIso={currentDateIso}
        />
      </div>

      {isSettingsOpen && activeCalendar && activeCalendarIds !== 'all' && activeCalendarIds.size === 1 && (
        <CalendarSettingsModal 
          calendar={activeCalendar}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={() => router.refresh()}
        />
      )}

      {activeCalendar ? (
        <GanttView 
          calendar={activeCalendar} 
          operators={globalOperators} 
          isAllMode={activeCalendarIds === 'all' || activeCalendarIds.size > 1} 
          currentDateIso={currentDateIso} 
        />
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>No hay calendarios</h2>
          <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>
            Crea un nuevo calendario para comenzar a registrar coordinaciones.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setIsCreating(true)}>
            Crear Calendario
          </button>
        </div>
      )}

      {isCreating && (
        <CalendarCreator onCreated={(id) => {
          setIsCreating(false);
          setActiveCalendarIds(new Set([id]));
        }} onCancel={() => setIsCreating(false)} />
      )}

      {globalEditingFlight !== null && (
        <FlightModal 
          calendarId={initialCalendars.find(c => c.zones.some(z => z.id === globalEditingFlight.zoneId))?.id || 0}
          zones={allZones}
          initialZoneId={globalEditingFlight.zoneId}
          initialDate={new Date(globalEditingFlight.startDate)}
          editingFlight={globalEditingFlight}
          onClose={(refresh) => {
            setGlobalEditingFlight(null);
            if (refresh) router.refresh();
          }}
        />
      )}
    </div>
  );
}
