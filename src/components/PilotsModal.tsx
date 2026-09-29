'use client';

import { useState } from 'react';
import { addOperator, deleteOperator, updateOperator } from '@/app/actions';
import styles from './PilotsModal.module.css';

type Operator = {
  id: number;
  name: string;
};

export default function PilotsModal({
  operators,
  onClose,
  onUpdated
}: {
  operators: Operator[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [newOperatorName, setNewOperatorName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperatorName.trim()) return;
    setLoading(true);
    try {
      await addOperator(newOperatorName.trim());
      setNewOperatorName('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir el piloto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOperator = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteOperator(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el piloto');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (op: Operator) => {
    setEditingId(op.id);
    setEditName(op.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateOperator(id, editName.trim());
      setEditingId(null);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el piloto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Lista de Pilotos Global</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          <p className={styles.helpText}>Las personas añadidas aquí aparecerán en los desplegables de firma operativa para aperturas y cierres rápidos en todas las ubicaciones.</p>
          
          <form onSubmit={handleAddOperator} className={styles.addForm}>
            <input
              type="text"
              placeholder="Nombre del piloto (ej. Juan Pérez)"
              value={newOperatorName}
              onChange={e => setNewOperatorName(e.target.value)}
              className={styles.input}
            />
            <button
              type="submit"
              disabled={loading || !newOperatorName.trim()}
              className={styles.btnAdd}
            >
              Añadir
            </button>
          </form>

          <div className={styles.operatorList}>
            {operators.length === 0 ? (
              <div className={styles.empty}>No hay pilotos registrados.</div>
            ) : (
              operators.map(op => (
                <div key={op.id} className={styles.operatorItem}>
                  {editingId === op.id ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEdit(op.id)}
                        disabled={loading || !editName.trim()}
                        className={styles.btnSave}
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        className={styles.btnCancel}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.operatorName}>
                        <span className={styles.operatorIcon}>👤</span>
                        {op.name}
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleStartEdit(op)}
                          disabled={loading}
                          className={styles.btnAction}
                          title="Editar nombre"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOperator(op.id, op.name)}
                          disabled={loading}
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          title="Eliminar piloto"
                        >
                          🗑️ Borrar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
