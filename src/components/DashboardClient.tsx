'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarCreator from './CalendarCreator';
import GanttView from './GanttView';
import CalendarSettingsModal from './CalendarSettingsModal';
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

export default function DashboardClient({ initialCalendars, globalOperators }: { initialCalendars: Calendar[], globalOperators: Operator[] }) {
  const router = useRouter();
  const [activeCalendarId, setActiveCalendarId] = useState<number | null>(
    initialCalendars.length > 0 ? initialCalendars[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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

  const activeCalendar = initialCalendars.find(c => c.id === activeCalendarId);

  const handleDelete = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres eliminar el calendario "${title}" y todas sus zonas y coordinaciones asociadas?`)) {
      try {
        await deleteCalendar(id);
        const remaining = initialCalendars.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveCalendarId(remaining[0].id);
        } else {
          setActiveCalendarId(null);
        }
      } catch (err) {
        console.error(err);
        alert("Error al eliminar el calendario");
      }
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.tabs}>
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

      {isSettingsOpen && activeCalendar && (
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
        <GanttView calendar={activeCalendar} operators={globalOperators} />
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
    </div>
  );
}
