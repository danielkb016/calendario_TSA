'use client';

import { useState } from 'react';
import { updateFlight } from '@/app/actions';
import styles from './OpCoordinationModal.module.css';

// TODO: En el futuro esto podría venir de la base de datos
const OPERATORS = ['Dani', 'Coordinador Base', 'Piloto al mando', 'Operador Dron'];

type Flight = {
  id: number;
  dailyOpOpened: boolean;
  dailyOpOpenedBy: string | null;
  dailyOpOpenedAt: Date | null;
  dailyOpClosed: boolean;
  dailyOpClosedBy: string | null;
  dailyOpClosedAt: Date | null;
};

export default function OpCoordinationModal({
  flight,
  onClose,
  onUpdated
}: {
  flight: Flight;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [customUser, setCustomUser] = useState('');

  const handleAction = async (action: 'open' | 'close') => {
    if (!selectedUser) return;
    setLoading(true);
    const user = selectedUser === 'Otro' ? customUser : selectedUser;
    
    try {
      if (action === 'open') {
        await updateFlight(flight.id, {
          dailyOpOpened: true,
          dailyOpOpenedBy: user,
          dailyOpOpenedAt: new Date()
        });
      } else {
        await updateFlight(flight.id, {
          dailyOpClosed: true,
          dailyOpClosedBy: user,
          dailyOpClosedAt: new Date()
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Firma Operativa (Apertura/Cierre)</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Apertura:</span>
              {flight.dailyOpOpened ? (
                <span className={styles.statusDone}>
                  ✅ Abierto por {flight.dailyOpOpenedBy} el {flight.dailyOpOpenedAt ? new Date(flight.dailyOpOpenedAt).toLocaleString() : ''}
                </span>
              ) : (
                <span className={styles.statusPending}>❌ Pendiente de abrir</span>
              )}
            </div>
            
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Cierre:</span>
              {flight.dailyOpClosed ? (
                <span className={styles.statusDone}>
                  ✅ Cerrado por {flight.dailyOpClosedBy} el {flight.dailyOpClosedAt ? new Date(flight.dailyOpClosedAt).toLocaleString() : ''}
                </span>
              ) : (
                <span className={styles.statusPending}>❌ Pendiente de cerrar</span>
              )}
            </div>
          </div>

          {(!flight.dailyOpOpened || !flight.dailyOpClosed) && (
            <div className={styles.actionForm}>
              <label>Selecciona quién realiza la llamada:</label>
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                className={styles.select}
              >
                <option value="" disabled>-- Seleccione un responsable --</option>
                {OPERATORS.map(op => (
                  <option key={op} value={op}>{op}</option>
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
                {!flight.dailyOpOpened && (
                  <button 
                    className={`${styles.btn} ${styles.btnOpen}`}
                    onClick={() => handleAction('open')}
                    disabled={loading || !selectedUser || (selectedUser === 'Otro' && !customUser.trim())}
                  >
                    Marcar como ABIERTO
                  </button>
                )}
                {flight.dailyOpOpened && !flight.dailyOpClosed && (
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
        </div>
      </div>
    </div>
  );
}
