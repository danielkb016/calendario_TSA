'use client';

import { useState } from 'react';
import { updateDailyCallStatus } from '@/app/actions';
import styles from './OpCoordinationModal.module.css';

type Operator = {
  id: number;
  name: string;
};

type CallTarget = {
  id: number;
  name: string;
  calendar?: { id: number; title: string };
};

type DailyCallStatus = {
  id: number;
  date: Date;
  opened: boolean;
  openedBy: string | null;
  openedAt: Date | null;
  closed: boolean;
  closedBy: string | null;
  closedAt: Date | null;
  notes: string | null;
  callTargetId: number;
  callTarget?: CallTarget;
};

export default function OpCoordinationModal({
  status,
  operators,
  onClose,
  onUpdated
}: {
  status: DailyCallStatus;
  operators: Operator[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [customUser, setCustomUser] = useState('');
  const [notes, setNotes] = useState(status.notes || '');

  const handleAction = async (action: 'open' | 'close' | 'undo_open' | 'undo_close') => {
    if ((action === 'open' || action === 'close') && !selectedUser) return;
    setLoading(true);
    const user = selectedUser === 'Otro' ? customUser : selectedUser;
    
    try {
      if (action === 'open') {
        await updateDailyCallStatus(status.id, {
          opened: true,
          openedBy: user,
          openedAt: new Date(),
          notes: notes
        });
      } else if (action === 'close') {
        await updateDailyCallStatus(status.id, {
          closed: true,
          closedBy: user,
          closedAt: new Date(),
          notes: notes
        });
      } else if (action === 'undo_open') {
        if (!confirm('¿Seguro que quieres anular la apertura?')) { setLoading(false); return; }
        await updateDailyCallStatus(status.id, {
          opened: false,
          openedBy: null,
          openedAt: null
        });
      } else if (action === 'undo_close') {
        if (!confirm('¿Seguro que quieres anular el cierre?')) { setLoading(false); return; }
        await updateDailyCallStatus(status.id, {
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
      await updateDailyCallStatus(status.id, {
        notes: notes
      });
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar las notas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Firma Operativa: {status.callTarget?.name}</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Apertura:</span>
              {status.opened ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className={styles.statusDone}>
                    ✅ Abierto por {status.openedBy} el {status.openedAt ? new Date(status.openedAt).toLocaleTimeString() : ''}
                  </span>
                  <button className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => handleAction('undo_open')} disabled={loading}>Anular</button>
                </div>
              ) : (
                <span className={styles.statusPending}>❌ Pendiente de abrir</span>
              )}
            </div>
            
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Cierre:</span>
              {status.closed ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className={styles.statusDone}>
                    ✅ Cerrado por {status.closedBy} el {status.closedAt ? new Date(status.closedAt).toLocaleTimeString() : ''}
                  </span>
                  <button className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => handleAction('undo_close')} disabled={loading}>Anular</button>
                </div>
              ) : (
                <span className={styles.statusPending}>❌ Pendiente de cerrar</span>
              )}
            </div>
          </div>

          {(!status.opened || !status.closed) && (
            <div className={styles.actionForm}>
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
                {!status.opened && (
                  <button 
                    className={`${styles.btn} ${styles.btnOpen}`}
                    onClick={() => handleAction('open')}
                    disabled={loading || !selectedUser || (selectedUser === 'Otro' && !customUser.trim())}
                  >
                    Marcar como ABIERTO
                  </button>
                )}
                {status.opened && !status.closed && (
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

          <div className={styles.actionForm} style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <label>Nota del día para {status.callTarget?.name} (opcional):</label>
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
              disabled={loading}
            >
              Guardar Nota
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
