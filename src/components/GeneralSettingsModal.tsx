'use client';

import { useState } from 'react';
import { updateCalendar, addOperator, deleteOperator } from '@/app/actions';
import styles from './GeneralSettingsModal.module.css';



type Calendar = {
  id: number;
  title: string;
  periodicPermitExpiration: Date | null;
  requiresDailyCoordination: boolean;
};

export default function GeneralSettingsModal({
  calendar,
  onClose,
  onUpdated
}: {
  calendar: Calendar;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  
  // Expiration settings
  const [periodicExp, setPeriodicExp] = useState(
    calendar.periodicPermitExpiration 
      ? new Date(calendar.periodicPermitExpiration).toISOString().split('T')[0] 
      : ''
  );
  const [requiresDaily, setRequiresDaily] = useState(calendar.requiresDailyCoordination);


  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const expDate = periodicExp ? new Date(periodicExp) : null;
      await updateCalendar(calendar.id, { 
        periodicPermitExpiration: expDate,
        requiresDailyCoordination: requiresDaily
      });
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar los ajustes del calendario');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Ajustes Generales del Calendario</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          
          <div className={styles.section}>
            <h4>Configuración de Permisos</h4>
            <div className={styles.formGroup}>
              <label>Fecha de caducidad del permiso periódico global</label>
              <input
                type="date"
                value={periodicExp}
                onChange={e => setPeriodicExp(e.target.value)}
                className={styles.input}
              />
              <p className={styles.helpText}>Se mostrará un aviso en el calendario si quedan menos de 30 días.</p>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
                <input 
                  type="checkbox" 
                  checked={requiresDaily} 
                  onChange={e => setRequiresDaily(e.target.checked)} 
                />
                Requiere coordinación operativa diaria (Apertura/Cierre) en este calendario
              </label>
              <p className={styles.helpText}>Si se marca, se habilitará la firma rápida (🟢/🔴) en todos los vuelos del calendario del día de hoy.</p>
            </div>
            
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className={`${styles.btn} ${styles.btnSave}`}
              style={{ alignSelf: 'flex-start' }}
            >
              Guardar Permiso
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}
