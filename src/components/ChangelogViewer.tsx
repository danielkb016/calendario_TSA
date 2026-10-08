'use client';

import { useState } from 'react';
import styles from './ChangelogViewer.module.css';

type ChangelogEntry = {
  version: string;
  date: string;
  summary: string;
  details?: string[];
};

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.0.6',
    date: '08/10/2026',
    summary: 'Nuevo Sistema de Permisos a Doble Nivel (Restricciones y Coordinaciones)',
    details: [
      'Arquitectura de permisos dividida en dos niveles: Restricciones (norma) y Coordinaciones (periodos vigentes).',
      'Las exclusiones ("agujeros") ahora se asocian a la coordinación en vigor, manteniendo la coherencia histórica.',
      'Soporte completo para inicio/fin en las coordinaciones, avisando automáticamente en rojo de los "huecos" entre periodos.',
      'Botón de "Copiar" (📋) integrado para duplicar rápidamente los datos de una coordinación en el formulario y agilizar las renovaciones.',
      'Vista Gantt y Banner Diario actualizados para calcular las nuevas reglas de negocio al vuelo.',
      'Rediseño íntegro de la pestaña "Permisos" en Configuración, con diseño por bloques y caja de info didáctica (ℹ️).',
      'El panel reacciona parpadeando en naranja si hay una alerta inmediata programada para el día actual.'
    ]
  },
  {
    version: '0.0.5',
    date: '08/10/2026',
    summary: 'Reorganización de la interfaz del cuadro de mandos: se movió el selector de día encima del panel global, se mejoraron los estilos y se corrigieron colores de alerta meteorológica.'
  },
  {
    version: '0.0.4',
    date: '06/10/2026',
    summary: 'Integración del sistema de previsión meteorológica y parámetros de viento/lluvia configurables desde los ajustes discretos del dashboard.'
  }
];

export default function ChangelogViewer({ currentVersion }: { currentVersion: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.versionBtn}
        title="Ver historial de cambios"
      >
        <div className={styles.versionIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div className={styles.versionTextContainer}>
          <span className={styles.versionLabel}>Versión</span>
          <span className={styles.versionValue}>v{currentVersion}</span>
        </div>
      </button>

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
                      <td>
                        <span style={{ fontWeight: log.details ? 600 : 400 }}>{log.summary}</span>
                        {log.details && log.details.length > 0 && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{ cursor: 'pointer', color: '#0284c7', fontSize: '0.85rem', fontWeight: 600, userSelect: 'none' }}>
                              Ver más detalles
                            </summary>
                            <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155' }}>
                              {log.details.map((detail, idx) => (
                                <li key={idx} style={{ marginBottom: '0.25rem' }}>{detail}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
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
