'use client';

import { useState } from 'react';
import { createCalendar } from '@/app/actions';
import styles from './CalendarCreator.module.css';

export default function CalendarCreator({ onCreated, onCancel }: { onCreated: (id: number) => void, onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [zones, setZones] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const handleAddZone = () => setZones([...zones, '']);
  const handleZoneChange = (index: number, value: string) => {
    const newZones = [...zones];
    newZones[index] = value;
    setZones(newZones);
  };
  const handleRemoveZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validZones = zones.map(z => z.trim()).filter(z => z.length > 0);
    if (title.trim() && validZones.length > 0) {
      setLoading(true);
      try {
        const cal = await createCalendar(title, validZones);
        onCreated(cal.id);
      } catch (error) {
        console.error("Error creating calendar", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`card ${styles.creatorCard}`}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Crear Nuevo Calendario TSA</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Título del Calendario</label>
          <input 
            id="title"
            type="text" 
            placeholder="Ej: Calendario Junio 2026" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Zonas de Vuelo</label>
          {zones.map((zone, i) => (
            <div key={i} className={styles.zoneRow}>
              <input 
                type="text" 
                placeholder="Nombre de la zona (Ej: Club Las Encinas)" 
                value={zone}
                onChange={e => handleZoneChange(i, e.target.value)}
                required
                className={styles.input}
              />
              {zones.length > 1 && (
                <button type="button" onClick={() => handleRemoveZone(i)} className={styles.btnRemove}>
                  &times;
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddZone} className={styles.btnAddZone}>
            + Añadir otra zona
          </button>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || !title.trim() || zones.filter(z=>z.trim()).length === 0}>
            {loading ? 'Creando...' : 'Crear Calendario'}
          </button>
        </div>
      </form>
    </div>
  );
}
