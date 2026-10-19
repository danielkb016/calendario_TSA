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
    version: '0.0.9',
    date: '19/10/2026',
    summary: 'Identificadores de 2º nivel, aviso inteligente de renovación, aislamiento de exclusiones y formato de fecha uniforme (DD/MM/AAAA)',
    details: [
      'Formato uniforme de fecha (DD/MM/AAAA): corrección estricta de formato en toda la plataforma (panel de permisos globales, avisos y modales), garantizando visualización consistente independientemente de la configuración regional o SSR.',
      'Identificador de 2º nivel: posibilidad de asignar un identificador o nombre a cada unidad de coordinación (ej. "NOTAM D5418/26"), visible de un vistazo en una insignia destacada.',
      'Edición directa de coordinaciones: botón de edición rápida (✏️) en cada tarjeta para modificar el identificador, fechas y días de aviso sin eliminar las exclusiones registradas.',
      'Aislamiento de formularios de exclusión: cada tarjeta de coordinación gestiona su propio formulario y estado local de forma aislada, solucionando la duplicación simultánea de texto en "Motivo (opcional)..." o fechas.',
      'Cálculo inteligente del aviso de renovación (amarillo): el aviso de renovación próxima se evalúa respecto a la última coordinación registrada en el horizonte del permiso, evitando falsas alarmas amarillas en periodos intermedios con prórrogas tramitadas.',
      'Integración global: el identificador de la coordinación activa se visualiza automáticamente en el panel diario de Permisos Globales y en las advertencias del Gantt.'
    ]
  },
  {
    version: '0.0.8',
    date: '16/10/2026',
    summary: 'Importación Inteligente de Exclusiones y Coordinaciones con IA (Beta)',
    details: [
      'Extracción automática con IA: nuevo botón "✨ Importar (Beta)" en la gestión de coordinaciones para pegar textos u oficios oficiales y procesar exclusiones automáticamente mediante webhook/LLM (n8n).',
      'Detección de periodos y franjas horarias: extracción estructurada del rango de fechas de la coordinación, exclusiones completas (DENY_ALL) y restricciones horarias específicas (ALLOW_WINDOWS / DENY_WINDOWS).',
      'Modal de previsualización interactivo: interfaz para revisar, seleccionar/deseleccionar las exclusiones detectadas y fusionar días consecutivos antes de guardarlas.',
      'Inserción atómica por lotes: guardado en bloque mediante transacciones Prisma asegurando consistencia y alta velocidad.'
    ]
  },
  {
    version: '0.0.7',
    date: '13/10/2026',
    summary: 'Consistencia en permisos diarios y gestión atómica de firmas operativas',
    details: [
      'Apertura atómica en un único paso: se eliminó la condición de carrera que dejaba ciclos pendientes y hacía que las coordinaciones abiertas pudieran mostrarse temporalmente como cerradas.',
      'Prevención de aperturas duplicadas: el modal ahora detecta si la coordinación ya está en curso y evita que se creen múltiples ciclos abiertos simultáneos.',
      'Acceso directo a notas: la edición de notas del día ahora está siempre disponible sin confundir al usuario con el formulario de nueva llamada.',
      'Garantía de orden cronológico: ordenación estricta por fecha e identificador de ciclos tanto en base de datos como en la interfaz.',
      'Soporte completo de zona horaria en Docker: integración de tzdata en la imagen de producción para garantizar sincronización horaria con Madrid a medianoche.'
    ]
  },
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
