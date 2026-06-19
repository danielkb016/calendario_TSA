'use client';

import { useState } from 'react';
import CalendarCreator from './CalendarCreator';
import GanttView from './GanttView';
import styles from './DashboardClient.module.css';
import { updateCalendar, deleteCalendar } from '@/app/actions';

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
  const [editingCalendarId, setEditingCalendarId] = useState<number | null>(null);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeCalendar = initialCalendars.find(c => c.id === activeCalendarId);

  const handleEditStart = (cal: Calendar, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCalendarId(cal.id);
    setEditTitleVal(cal.title);
  };

  const handleEditSave = async (id: number, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitleVal.trim()) return;
    setIsSaving(true);
    try {
      await updateCalendar(id, editTitleVal.trim());
      setEditingCalendarId(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el título");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres eliminar el calendario "${title}" y todas sus zonas y vuelos asociados?`)) {
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
          const isEditing = editingCalendarId === cal.id;

          return (
            <div
              key={cal.id}
              className={`${styles.tabWrapper} ${isActive ? styles.activeTabWrapper : ''}`}
              onClick={() => !isEditing && setActiveCalendarId(cal.id)}
            >
              {isEditing ? (
                <form 
                  onSubmit={(e) => handleEditSave(cal.id, e)} 
                  className={styles.editForm}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitleVal}
                    onChange={(e) => setEditTitleVal(e.target.value)}
                    className={styles.tabInput}
                    autoFocus
                    disabled={isSaving}
                  />
                  <button type="submit" className={styles.iconBtn} title="Guardar" disabled={isSaving}>
                    ✔️
                  </button>
                  <button 
                    type="button" 
                    className={styles.iconBtn} 
                    title="Cancelar" 
                    onClick={() => setEditingCalendarId(null)}
                    disabled={isSaving}
                  >
                    ❌
                  </button>
                </form>
              ) : (
                <div className={styles.tabContent}>
                  <span className={styles.tabTitle}>{cal.title}</span>
                  {isActive && (
                    <div className={styles.tabActions}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={(e) => handleEditStart(cal, e)}
                        title="Editar título"
                      >
                        ✏️
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        onClick={(e) => handleDelete(cal.id, cal.title, e)}
                        title="Eliminar calendario"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
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
