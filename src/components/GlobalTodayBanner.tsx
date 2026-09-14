'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OpCoordinationModal from './OpCoordinationModal';
import styles from './TodayStatusBanner.module.css'; // Reusing styles

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

type GlobalCoordination = {
  calendar: { id: number; title: string };
  statuses: DailyCallStatus[];
};

type Operator = {
  id: number;
  name: string;
};

interface GlobalTodayBannerProps {
  coordinations: GlobalCoordination[];
  operators: Operator[];
}

export default function GlobalTodayBanner({ coordinations, operators }: GlobalTodayBannerProps) {
  const router = useRouter();
  const [quickActionStatus, setQuickActionStatus] = useState<DailyCallStatus | null>(null);

  if (coordinations.length === 0) {
    return null; // Don't show the global banner if there's nothing to coordinate today globally
  }

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`} style={{ margin: '1rem', marginTop: 0 }}>
      <div className={styles.icon}>📢</div>
      <div className={styles.content}>
        <h4 className={styles.title}>Coordinaciones Operacionales Diarias (Global)</h4>
        <p className={styles.description}>
          Resumen de todas las ubicaciones y sitios a los que hay que llamar para el día de hoy:
        </p>
        <div className={styles.grid}>
          {coordinations.map(coord => {
            return (
              <div 
                key={coord.calendar.id} 
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.zoneBadge}>
                    📍 {coord.calendar.title}
                  </span>
                </div>
                <div className={styles.cardBody} style={{ padding: '0.5rem 1rem' }}>
                  
                  {coord.statuses.map(status => (
                    <div key={status.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9rem', flex: 1 }}>{status.callTarget?.name}</strong>
                        
                        <div 
                          className={styles.opBubbles}
                          onClick={(e) => { e.stopPropagation(); setQuickActionStatus(status); }}
                          title="Haz clic para gestionar la Apertura/Cierre operativo y notas"
                          style={{ margin: 0 }}
                        >
                          <div className={`${styles.bubble} ${status.opened ? styles.bubbleGreen : styles.bubbleRed}`} title={status.opened ? `Abierto por ${status.openedBy}` : 'Pendiente apertura'}></div>
                          <div className={`${styles.bubble} ${status.closed ? styles.bubbleGreen : status.opened ? styles.bubbleOrange : styles.bubbleRed}`} title={status.closed ? `Cerrado por ${status.closedBy}` : 'Pendiente cierre'}></div>
                          <span className={styles.bubbleText}>Operativa</span>
                        </div>
                      </div>

                      <div className={styles.operatorInfo} style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                        {status.openedBy && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginRight: '0.5rem' }}>Apertura: {status.openedBy}</span>}
                        {status.closedBy && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Cierre: {status.closedBy}</span>}
                      </div>

                      {status.notes && (
                        <div className={styles.timeInfo} style={{ backgroundColor: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid #fbbf24', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                          <strong>📝 Nota:</strong> {status.notes}
                        </div>
                      )}
                    </div>
                  ))}

                  {coord.statuses.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No hay sitios configurados para llamar en este calendario.</p>
                  )}
                  
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {quickActionStatus && (
        <OpCoordinationModal 
          status={quickActionStatus}
          operators={operators} 
          onClose={() => setQuickActionStatus(null)} 
          onUpdated={() => router.refresh()} 
        />
      )}
    </div>
  );
}
