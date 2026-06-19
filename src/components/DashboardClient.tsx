'use client';

import { useState } from 'react';
import CalendarCreator from './CalendarCreator';
import GanttView from './GanttView';
import styles from './DashboardClient.module.css';

type Calendar = {
  id: number;
  title: string;
  zones: { id: number; name: string }[];
};

export default function DashboardClient({ initialCalendars }: { initialCalendars: Calendar[] }) {
  const [activeCalendarId, setActiveCalendarId] = useState<number | null>(
    initialCalendars.length > 0 ? initialCalendars[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);

  const activeCalendar = initialCalendars.find(c => c.id === activeCalendarId);

  return (
    <div className={styles.dashboard}>
      <div className={styles.tabs}>
        {initialCalendars.map(cal => (
          <button
            key={cal.id}
            className={`${styles.tab} ${activeCalendarId === cal.id ? styles.activeTab : ''}`}
            onClick={() => setActiveCalendarId(cal.id)}
          >
            {cal.title}
          </button>
        ))}
        <button 
          className={`${styles.tab} ${styles.addTab}`}
          onClick={() => setIsCreating(true)}
        >
          + Nuevo Calendario
        </button>
      </div>

      {isCreating ? (
        <CalendarCreator onCreated={(id) => {
          setIsCreating(false);
          setActiveCalendarId(id);
        }} onCancel={() => setIsCreating(false)} />
      ) : activeCalendar ? (
        <GanttView calendar={activeCalendar} />
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>No hay calendarios</h2>
          <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>
            Crea un nuevo calendario para comenzar a coordinar vuelos.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setIsCreating(true)}>
            Crear Calendario
          </button>
        </div>
      )}
    </div>
  );
}
