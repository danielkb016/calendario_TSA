'use client';

import { useState } from 'react';
import styles from './ChangelogViewer.module.css';

const CHANGELOG = [
  {
    version: '0.0.6',
    date: '08/10/2026',
    description: 'Implementada personalización avanzada de permisos globales: Ahora es posible configurar los días de antelación para los avisos de caducidad. Se ha rediseñado el sistema de exclusiones de vuelo, permitiendo excluir rangos de días, seleccionar días completos, y definir intervalos de horas dinámicos en los que se permite o prohíbe volar. El panel ahora reacciona en tiempo real, parpadeando en naranja si hay una exclusión próxima en el día actual.'
  },
  {
    version: '0.0.5',
    date: '08/10/2026',
    description: 'Reorganización de la interfaz del cuadro de mandos: se movió el selector de día encima del panel global, se mejoraron los estilos y se corrigieron colores de alerta meteorológica.'
  },
  {
    version: '0.0.4',
    date: '06/10/2026',
    description: 'Integración del sistema de previsión meteorológica y parámetros de viento/lluvia configurables desde los ajustes discretos del dashboard.'
  }
];

export default function ChangelogViewer({ currentVersion }: { currentVersion: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <span 
        onClick={() => setIsOpen(true)}
        style={{ 
          fontSize: '0.4em', 
          color: '#60a5fa', 
          fontWeight: 'normal', 
          verticalAlign: 'super', 
          marginLeft: '0.5rem',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
        title="Ver historial de cambios"
      >
        v{currentVersion}
      </span>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h2>Historial de Versiones</h2>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✖</button>
            </div>
            <div className={styles.content}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Versión</th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {CHANGELOG.map((log) => (
                    <tr key={log.version}>
                      <td className={styles.versionCell}>v{log.version}</td>
                      <td className={styles.dateCell}>{log.date}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
