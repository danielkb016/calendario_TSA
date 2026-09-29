'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CalendarCreator from './CalendarCreator';
import GanttView from './GanttView';
import CalendarSettingsModal from './CalendarSettingsModal';
import TodayStatusBanner from './TodayStatusBanner';
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

export default function DashboardClient({ initialCalendars, globalOperators, todayFlights = [] }: { initialCalendars: Calendar[], globalOperators: Operator[], todayFlights?: Flight[] }) {
  const router = useRouter();
  const [activeCalendarId, setActiveCalendarId] = useState<number | 'all'>(
    'all'
  );
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

  // We determine what calendar(s) to show in GanttView.
  // If 'all', we combine all calendars into a "virtual" calendar to pass to GanttView.
  const virtualAllCalendar = useMemo(() => {
    if (activeCalendarId !== 'all') return null;
    return {
      id: 0,
      title: 'Todos',
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresDailyCoordination: false,
      zones: allZones,
      callTargets: [],
      globalPermits: []
    } as Calendar;
  }, [activeCalendarId, allZones]);

  const activeCalendar = activeCalendarId === 'all' 
    ? virtualAllCalendar 
    : initialCalendars.find(c => c.id === activeCalendarId);

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
          setActiveCalendarId(remaining[0].id);
        } else {
          setActiveCalendarId('all');
        }
      } catch (err) {
        console.error(err);
        alert("Error al eliminar el calendario");
      }
    }
  };

  return (
    <div className={styles.dashboard}>
      <div style={{ marginBottom: '1rem' }}>
        <TodayStatusBanner 
          flights={todayFlights} 
          zones={activeCalendarId === 'all' ? allZones : (activeCalendar?.zones || [])} 
          onEditFlight={setGlobalEditingFlight} 
          showCalendarName={activeCalendarId === 'all'}
        />
      </div>
      
      <div className={styles.tabs}>
        <div
          className={`${styles.tabWrapper} ${activeCalendarId === 'all' ? styles.activeTabWrapper : ''}`}
          onClick={() => setActiveCalendarId('all')}
        >
          <span className={styles.tabTitle}>Todos</span>
        </div>
        {initialCalendars.map(cal => {
          const isActive = activeCalendarId === cal.id;

          return (
            <div
              key={cal.id}
              className={`${styles.tabWrapper} ${isActive ? styles.activeTabWrapper : ''}`}
              onClick={() => setActiveCalendarId(cal.id)}
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
                      title="Ajustes del calendario"
                    >
                      ⚙️
                    </button>
                    <button 
                      className={styles.actionBtn} 
                      onClick={(e) => handleDelete(cal.id, cal.title, e)}
                      title="Eliminar calendario"
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
          + Nuevo Calendario
        </button>
      </div>

      {isSettingsOpen && activeCalendar && activeCalendarId !== 'all' && (
        <CalendarSettingsModal 
          calendar={activeCalendar}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={() => router.refresh()}
        />
      )}

      {isCreating ? (
        <CalendarCreator onCreated={(id) => {
          setIsCreating(false);
          setActiveCalendarId(id);
        }} onCancel={() => setIsCreating(false)} />
      ) : activeCalendar ? (
        <GanttView calendar={activeCalendar} operators={globalOperators} isAllMode={activeCalendarId === 'all'} />
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
