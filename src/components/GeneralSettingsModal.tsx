'use client';

import { useState } from 'react';
import { updateCalendar, addCallTarget, deleteCallTarget, addGlobalPermit, deleteGlobalPermit } from '@/app/actions';
import styles from './GeneralSettingsModal.module.css';

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

type Calendar = {
  id: number;
  title: string;
  requiresDailyCoordination: boolean;
  callTargets?: CallTarget[];
  globalPermits?: GlobalPermit[];
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
  
  // Requires Daily Settings
  const [requiresDaily, setRequiresDaily] = useState(calendar.requiresDailyCoordination);
  
  // New Permit State
  const [newPermitName, setNewPermitName] = useState('');
  const [newPermitDate, setNewPermitDate] = useState('');

  // New Call Target State
  const [newTargetName, setNewTargetName] = useState('');
  const [targetReqOpening, setTargetReqOpening] = useState(true);
  const [targetReqClosing, setTargetReqClosing] = useState(true);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateCalendar(calendar.id, { 
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

  // --- Permits ---
  const handleAddPermit = async () => {
    if (!newPermitName.trim() || !newPermitDate) return;
    setLoading(true);
    try {
      await addGlobalPermit(calendar.id, newPermitName.trim(), new Date(newPermitDate));
      setNewPermitName('');
      setNewPermitDate('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir el permiso');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermit = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este permiso?')) return;
    setLoading(true);
    try {
      await deleteGlobalPermit(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el permiso');
    } finally {
      setLoading(false);
    }
  };

  // --- Call Targets ---
  const handleAddTarget = async () => {
    if (!newTargetName.trim()) return;
    setLoading(true);
    try {
      await addCallTarget(calendar.id, newTargetName.trim(), targetReqOpening, targetReqClosing);
      setNewTargetName('');
      setTargetReqOpening(true);
      setTargetReqClosing(true);
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
          
          {/* PERMISOS GLOBALES */}
          <div className={styles.section}>
            <h4>Permisos Globales y Caducidades</h4>
            <p className={styles.helpText}>Añade los permisos asociados a este calendario. Se mostrará un aviso si caducan en menos de 30 días.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                value={newPermitName} 
                onChange={e => setNewPermitName(e.target.value)} 
                placeholder="Nombre (ej: Permiso ENAIRE)..."
                className={styles.input}
                style={{ flex: 2, margin: 0 }}
              />
              <input
                type="date"
                value={newPermitDate}
                onChange={e => setNewPermitDate(e.target.value)}
                className={styles.input}
                style={{ flex: 1, margin: 0 }}
              />
              <button 
                onClick={handleAddPermit} 
                disabled={loading || !newPermitName.trim() || !newPermitDate} 
                className={styles.btn}
              >
                Añadir
              </button>
            </div>

            {calendar.globalPermits && calendar.globalPermits.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {calendar.globalPermits.map(permit => (
                  <li key={permit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    <div>
                      <strong>{permit.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                        Caduca el {new Date(permit.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeletePermit(permit.id)} 
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0.5rem' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No hay permisos añadidos.</p>
            )}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

          {/* COORDINACION OPERATIVA */}
          <div className={styles.section}>
            <h4>Coordinación Operativa Diaria</h4>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={requiresDaily} 
                  onChange={e => setRequiresDaily(e.target.checked)} 
                />
                Requiere coordinación operativa diaria en este calendario
              </label>
              <p className={styles.helpText}>Si se marca, el calendario aparecerá en el Banner Global y requerirá firmas (🟢/🔴).</p>
            </div>
          </div>

          {requiresDaily && (
            <div className={styles.section} style={{ marginTop: '1.5rem' }}>
              <h4>Sitios a llamar</h4>
              <p className={styles.helpText}>Añade los lugares a los que hay que llamar cada día y selecciona si necesitan Apertura, Cierre o ambas.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="text" 
                  value={newTargetName} 
                  onChange={e => setNewTargetName(e.target.value)} 
                  placeholder="Nombre del sitio (ej: Torrejón)..."
                  className={styles.input}
                  style={{ margin: 0 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={targetReqOpening} 
                        onChange={e => setTargetReqOpening(e.target.checked)} 
                      />
                      Req. Apertura
                    </label>
                    <label className={styles.checkboxLabel} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={targetReqClosing} 
                        onChange={e => setTargetReqClosing(e.target.checked)} 
                      />
                      Req. Cierre
                    </label>
                  </div>
                  <button 
                    onClick={handleAddTarget} 
                    disabled={loading || !newTargetName.trim() || (!targetReqOpening && !targetReqClosing)} 
                    className={styles.btn}
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {calendar.callTargets && calendar.callTargets.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {calendar.callTargets.map(target => (
                    <li key={target.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div>
                        <strong>{target.name}</strong>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {target.requiresOpening && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px' }}>Apertura</span>}
                          {target.requiresClosing && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: '4px' }}>Cierre</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTarget(target.id)} 
                        disabled={loading}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0.5rem' }}
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

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className={`${styles.btn} ${styles.btnSave}`}
            >
              Guardar Cambios
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
