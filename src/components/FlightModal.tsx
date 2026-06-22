'use client';

import { useState, useEffect } from 'react';
import { createFlight, updateFlight, deleteFlight } from '@/app/actions';
import styles from './FlightModal.module.css';

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string | null;
  zoneId: number;
};

type Zone = {
  id: number;
  name: string;
};

export default function FlightModal({
  calendarId,
  zones,
  initialZoneId,
  initialDate,
  editingFlight,
  onClose
}: {
  calendarId: number;
  zones: Zone[];
  initialZoneId?: number;
  initialDate?: Date;
  editingFlight?: Flight;
  onClose: (refresh: boolean) => void;
}) {
  const [operator, setOperator] = useState('');
  const [zoneId, setZoneId] = useState(zones[0]?.id || 0);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [coordination, setCoordination] = useState('Pendiente');
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingFlight) {
      setOperator(editingFlight.operator);
      setZoneId(editingFlight.zoneId);
      setStartDate(editingFlight.startDate.toISOString().split('T')[0]);
      setStartTime(editingFlight.startDate.toTimeString().slice(0, 5));
      setEndDate(editingFlight.endDate.toISOString().split('T')[0]);
      setEndTime(editingFlight.endDate.toTimeString().slice(0, 5));
      setCoordination(editingFlight.coordination);
      setSituation(editingFlight.situation || '');
    } else if (initialDate && initialZoneId) {
      setZoneId(initialZoneId);
      const dateStr = initialDate.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    }
  }, [editingFlight, initialDate, initialZoneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    try {
      if (editingFlight) {
        await updateFlight(editingFlight.id, {
          operator,
          zoneId,
          startDate: start,
          endDate: end,
          coordination,
          situation
        });
      } else {
        await createFlight({
          operator,
          zoneId,
          startDate: start,
          endDate: end,
          coordination,
          situation,
          calendarId
        });
      }
      onClose(true);
    } catch (error) {
      console.error(error);
      alert('Error guardando la coordinación');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (editingFlight && confirm('¿Estás seguro de que deseas eliminar esta coordinación?')) {
      setLoading(true);
      await deleteFlight(editingFlight.id);
      onClose(true);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.modal}`}>
        <h2>{editingFlight ? 'Editar Coordinación' : 'Nueva Coordinación'}</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Operador</label>
            <input required type="text" value={operator} onChange={e => setOperator(e.target.value)} placeholder="Ej: Future Jet" />
          </div>

          <div className={styles.formGroup}>
            <label>Zona de Vuelo</label>
            <select value={zoneId} onChange={e => setZoneId(Number(e.target.value))}>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Fecha Inicio</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Hora Inicio</label>
              <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Fecha Fin</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Hora Fin</label>
              <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Coordinación</label>
              <select value={coordination} onChange={e => setCoordination(e.target.value)}>
                <option value="Confirmado">Confirmado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Anulada">Anulada</option>
                <option value="Finalizada">Finalizada</option>
                <option value="No Confirmado">No Confirmado</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Situación Actual (Notas)</label>
            <textarea value={situation} onChange={e => setSituation(e.target.value)} rows={3} placeholder="Detalles de la coordinación..." />
          </div>

          <div className={styles.actions}>
            {editingFlight && (
              <button type="button" className={`btn ${styles.btnDelete}`} onClick={handleDelete} disabled={loading}>
                Eliminar
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" className="btn" onClick={() => onClose(false)} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
