'use client';

import { useState } from 'react';
import { updateCalendar, addCallTarget, deleteCallTarget } from '@/app/actions';
import styles from './GeneralSettingsModal.module.css';

type CallTarget = {
  id: number;
  name: string;
};

type Calendar = {
  id: number;
  title: string;
  periodicPermitExpiration: Date | null;
  requiresDailyCoordination: boolean;
  callTargets?: CallTarget[];
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
  const [newTargetName, setNewTargetName] = useState('');
  
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

  const handleAddTarget = async () => {
    if (!newTargetName.trim()) return;
    setLoading(true);
    try {
      await addCallTarget(calendar.id, newTargetName.trim());
      setNewTargetName('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir el sitio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarget = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este sitio de llamada?')) return;
    setLoading(true);
    try {
      await deleteCallTarget(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el sitio');
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
              <p className={styles.helpText}>Si se marca, el calendario aparecerá en el Banner Global para la coordinación diaria.</p>
            </div>
            
          </div>

          {requiresDaily && (
            <div className={styles.section} style={{ marginTop: '2rem' }}>
              <h4>Sitios a llamar</h4>
              <p className={styles.helpText}>Añade los lugares a los que hay que llamar cada día (ej: Torrejón, Aeródromo...)</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newTargetName} 
                  onChange={e => setNewTargetName(e.target.value)} 
                  placeholder="Nombre del sitio..."
                  className={styles.input}
                  style={{ flex: 1, margin: 0 }}
                />
                <button 
                  onClick={handleAddTarget} 
                  disabled={loading || !newTargetName.trim()} 
                  className={styles.btn}
                >
                  Añadir
                </button>
              </div>

              {calendar.callTargets && calendar.callTargets.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {calendar.callTargets.map(target => (
                    <li key={target.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', marginBottom: '0.5rem' }}>
                      <span>{target.name}</span>
                      <button 
                        onClick={() => handleDeleteTarget(target.id)} 
                        disabled={loading}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No hay sitios añadidos.</p>
              )}
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className={`${styles.btn} ${styles.btnSave}`}
            >
              Guardar Permiso
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
