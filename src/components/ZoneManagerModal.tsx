'use client';

import { useState } from 'react';
import { addZone, updateZone, deleteZone } from '@/app/actions';
import styles from './ZoneManagerModal.module.css';

type Zone = {
  id: number;
  name: string;
  requiresDailyCoordination: boolean;
  periodicPermitExpiration: Date | null;
};

type Calendar = {
  id: number;
  title: string;
  zones: Zone[];
};

export default function ZoneManagerModal({
  calendar,
  onClose,
  onZonesChanged
}: {
  calendar: Calendar;
  onClose: () => void;
  onZonesChanged: () => void;
}) {
  const [newZoneName, setNewZoneName] = useState('');
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRequiresDaily, setEditingRequiresDaily] = useState(false);
  const [editingPeriodicExp, setEditingPeriodicExp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setLoading(true);
    try {
      await addZone(calendar.id, newZoneName.trim());
      setNewZoneName('');
      onZonesChanged();
    } catch (error) {
      console.error(error);
      alert('Error al añadir la zona');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      const expirationDate = editingPeriodicExp ? new Date(editingPeriodicExp) : null;
      await updateZone(id, { 
        name: editingName.trim(), 
        requiresDailyCoordination: editingRequiresDaily, 
        periodicPermitExpiration: expirationDate 
      });
      setEditingZoneId(null);
      onZonesChanged();
    } catch (error) {
      console.error(error);
      alert('Error al guardar los ajustes de la zona');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id: number, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la zona "${name}"? Se borrarán todas las coordinaciones asociadas a ella.`)) {
      setLoading(true);
      try {
        await deleteZone(id);
        onZonesChanged();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar la zona');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`card ${styles.modal}`}>
        <div className={styles.header}>
          <h2>Gestionar Zonas - {calendar.title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          <div className={styles.zoneList}>
            <h3>Zonas Existentes</h3>
            {calendar.zones.length === 0 ? (
              <p className={styles.empty}>No hay zonas en este calendario.</p>
            ) : (
              calendar.zones.map(zone => (
                <div key={zone.id} className={styles.zoneItem}>
                  {editingZoneId === zone.id ? (
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label>Nombre de la zona</label>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className={styles.input}
                          autoFocus
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            checked={editingRequiresDaily} 
                            onChange={e => setEditingRequiresDaily(e.target.checked)} 
                          />
                          Requiere coordinación operativa diaria (Apertura/Cierre)
                        </label>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Fecha de caducidad del permiso periódico (Opcional)</label>
                        <input
                          type="date"
                          value={editingPeriodicExp}
                          onChange={e => setEditingPeriodicExp(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleSaveEdit(zone.id)}
                          disabled={loading || !editingName.trim()}
                          className={`${styles.btn} ${styles.btnSave}`}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingZoneId(null)}
                          disabled={loading}
                          className={styles.btn}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.viewRow}>
                      <span className={styles.zoneName}>{zone.name}</span>
                      <div className={styles.actions}>
                        <button
                          onClick={() => {
                            setEditingZoneId(zone.id);
                            setEditingName(zone.name);
                            setEditingRequiresDaily(zone.requiresDailyCoordination);
                            setEditingPeriodicExp(zone.periodicPermitExpiration ? new Date(zone.periodicPermitExpiration).toISOString().split('T')[0] : '');
                          }}
                          disabled={loading}
                          className={`${styles.btn} ${styles.btnEdit}`}
                          title="Ajustes de zona"
                        >
                          ⚙️ Ajustes
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id, zone.name)}
                          disabled={loading}
                          className={`${styles.btn} ${styles.btnDelete}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddZone} className={styles.addForm}>
            <h3>Añadir Nueva Zona</h3>
            <div className={styles.addInputGroup}>
              <input
                type="text"
                placeholder="Ej. Zona de Pruebas Sur"
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                className={styles.input}
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading || !newZoneName.trim()}
                className="btn btn-primary"
              >
                {loading ? 'Añadiendo...' : 'Añadir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
