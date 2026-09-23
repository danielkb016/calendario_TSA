'use client';

import { useState } from 'react';
import { updateDailyCallStatus, updateDailyCallCycle, createDailyCallCycle, deleteDailyCallCycle } from '@/app/actions';
import styles from './OpCoordinationModal.module.css';

type Operator = { id: number; name: string; };

type CallTarget = {
  id: number;
  name: string;
  requiresOpening?: boolean;
  requiresClosing?: boolean;
};

type DailyCallCycle = {
  id: number;
  opened: boolean;
  openedBy: string | null;
  openedAt: Date | null;
  closed: boolean;
  closedBy: string | null;
  closedAt: Date | null;
};

type DailyCallStatus = {
  id: number;
  date: Date;
  notes: string | null;
  callTargetId: number;
  callTarget?: CallTarget;
  cycles?: DailyCallCycle[];
};

export default function OpCoordinationModal({
  status,
  cycleId,
  operators,
  onClose,
  onUpdated
}: {
  status: DailyCallStatus;
  cycleId?: number;
  operators: Operator[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [customUser, setCustomUser] = useState('');
  const [notes, setNotes] = useState(status.notes || '');

  const existingCycle = cycleId ? status.cycles?.find(c => c.id === cycleId) : null;

  const handleAction = async (action: 'open' | 'close' | 'undo_open' | 'undo_close') => {
    if ((action === 'open' || action === 'close') && !selectedUser) return;
    setLoading(true);
    const user = selectedUser === 'Otro' ? customUser : selectedUser;
    
    try {
      let targetCycleId = cycleId;

      if (!targetCycleId && (action === 'open' || action === 'close')) {
        // Create new cycle first
        const newCycle = await createDailyCallCycle(status.id);
        targetCycleId = newCycle.id;
      }

      if (!targetCycleId) return;

      if (action === 'open') {
        await updateDailyCallCycle(targetCycleId, {
          opened: true,
          openedBy: user,
          openedAt: new Date(),
        });
      } else if (action === 'close') {
        await updateDailyCallCycle(targetCycleId, {
          closed: true,
          closedBy: user,
          closedAt: new Date(),
        });
      } else if (action === 'undo_open') {
        if (!confirm('¿Seguro que quieres anular la apertura?')) { setLoading(false); return; }
        await updateDailyCallCycle(targetCycleId, {
          opened: false,
          openedBy: null,
          openedAt: null
        });
      } else if (action === 'undo_close') {
        if (!confirm('¿Seguro que quieres anular el cierre?')) { setLoading(false); return; }
        await updateDailyCallCycle(targetCycleId, {
          closed: false,
          closedBy: null,
          closedAt: null
        });
      }
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la coordinación operativa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await updateDailyCallStatus(status.id, { notes });
      onUpdated();
      if (!cycleId) onClose(); // Only close if we are in the general modal
    } catch (error) {
      console.error(error);
      alert('Error al guardar las notas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCycle = async () => {
    if (!cycleId) return;
    if (!confirm('¿Seguro que quieres eliminar este ciclo completo?')) return;
    setLoading(true);
    try {
      await deleteDailyCallCycle(cycleId);
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el ciclo.');
      setLoading(false);
    }
  }

  const isCreatingNew = !cycleId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>{isCreatingNew ? `Firma Operativa: ${status.callTarget?.name}` : `Gestionar Ciclo: ${status.callTarget?.name}`}</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          
          {/* CYCLE EDITING SECTION */}
          {(!isCreatingNew && existingCycle) && (
            <div className={styles.statusSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>Estado del Ciclo</h4>
                <button onClick={handleDeleteCycle} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Eliminar ciclo</button>
              </div>

              {(status.callTarget?.requiresOpening ?? true) && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel} style={{ color: '#334155' }}>Apertura:</span>
                  {existingCycle.opened ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className={styles.statusDone}>
                        ✅ Abierto por {existingCycle.openedBy} el {existingCycle.openedAt ? new Date(existingCycle.openedAt).toLocaleTimeString() : ''}
                      </span>
                      <button className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => handleAction('undo_open')} disabled={loading}>Anular</button>
                    </div>
                  ) : (
                    <span className={styles.statusPending}>❌ Pendiente de abrir</span>
                  )}
                </div>
              )}
              
              {(status.callTarget?.requiresClosing ?? true) && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel} style={{ color: '#334155' }}>Cierre:</span>
                  {existingCycle.closed ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className={styles.statusDone}>
                        ✅ Cerrado por {existingCycle.closedBy} el {existingCycle.closedAt ? new Date(existingCycle.closedAt).toLocaleTimeString() : ''}
                      </span>
                      <button className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => handleAction('undo_close')} disabled={loading}>Anular</button>
                    </div>
                  ) : (
                    <span className={styles.statusPending}>❌ Pendiente de cerrar</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTION FORM (For new cycle or if current cycle needs action) */}
          {(isCreatingNew || (existingCycle && ((status.callTarget?.requiresOpening ?? true) && !existingCycle.opened || (status.callTarget?.requiresClosing ?? true) && !existingCycle.closed))) && (
            <div className={styles.actionForm} style={!isCreatingNew ? { marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' } : {}}>
              <label>Selecciona quién realiza la llamada a {status.callTarget?.name}:</label>
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                className={styles.select}
              >
                <option value="" disabled>-- Seleccione un responsable --</option>
                {operators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
                <option value="Otro">Otro...</option>
              </select>

              {selectedUser === 'Otro' && (
                <input 
                  type="text" 
                  placeholder="Escribe el nombre..." 
                  value={customUser}
                  onChange={e => setCustomUser(e.target.value)}
                  className={styles.input}
                  autoFocus
                />
              )}

              <div className={styles.buttons}>
                {(status.callTarget?.requiresOpening ?? true) && (!existingCycle || !existingCycle.opened) && (
                  <button 
                    className={`${styles.btn} ${styles.btnOpen}`}
                    onClick={() => handleAction('open')}
                    disabled={loading || !selectedUser || (selectedUser === 'Otro' && !customUser.trim())}
                  >
                    Marcar como ABIERTO
                  </button>
                )}
                {(status.callTarget?.requiresClosing ?? true) && (!existingCycle || !existingCycle.closed) && (!(status.callTarget?.requiresOpening ?? true) || (existingCycle && existingCycle.opened)) && (
                  <button 
                    className={`${styles.btn} ${styles.btnCloseAction}`}
                    onClick={() => handleAction('close')}
                    disabled={loading || !selectedUser || (selectedUser === 'Otro' && !customUser.trim())}
                  >
                    Marcar como CERRADO
                  </button>
                )}
              </div>
            </div>
          )}

          {/* NOTES FORM (Always available) */}
          {isCreatingNew && (
            <div className={styles.actionForm} style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <label>Nota del día general para {status.callTarget?.name} (opcional):</label>
              <textarea 
                placeholder="Ej: Nos indican que hoy el aeródromo cierra antes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px', marginTop: '0.5rem' }}
              />
              <button 
                className="btn" 
                style={{ marginTop: '0.5rem', backgroundColor: '#e2e8f0', color: '#1e293b' }} 
                onClick={handleSaveNotes}
                disabled={loading || notes === (status.notes || '')}
              >
                Guardar Nota
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
