'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OpCoordinationModal from './OpCoordinationModal';
import styles from './TodayStatusBanner.module.css'; // Reusing styles

type GlobalPermit = {
  id: number;
  name: string;
  expirationDate: Date;
};

type CallTarget = {
  id: number;
  name: string;
  requiresOpening?: boolean;
  requiresClosing?: boolean;
  contactNotes?: string | null;
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
  globalPermits?: GlobalPermit[];
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
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  if (coordinations.length === 0) {
    return null; // Don't show the global banner if there's nothing to coordinate today globally
  }

  const filteredCoordinations = selectedCalendarId === 'all' 
    ? coordinations 
    : coordinations.filter(c => c.calendar.id.toString() === selectedCalendarId);

  const toggleNote = (targetId: number) => {
    setExpandedNotes(prev => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  const today = new Date();

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`} style={{ margin: '1rem', marginTop: 0 }}>
      <div className={styles.icon}>📢</div>
      <div className={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h5 className={styles.title} style={{ marginBottom: '0.2rem', fontSize: '1rem' }}>Coordinaciones Operacionales Diarias (Global)</h5>
            <p className={styles.description} style={{ margin: 0, fontSize: '0.8rem' }}>
              Resumen de todas las ubicaciones y sitios a los que hay que llamar para el día de hoy.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedCalendarId('all')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedCalendarId === 'all' ? '#3b82f6' : '#e2e8f0',
                color: selectedCalendarId === 'all' ? '#fff' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              Todas las ubicaciones
            </button>
            {coordinations.map(c => (
              <button
                key={c.calendar.id}
                onClick={() => setSelectedCalendarId(c.calendar.id.toString())}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedCalendarId === c.calendar.id.toString() ? '#3b82f6' : '#e2e8f0',
                  color: selectedCalendarId === c.calendar.id.toString() ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                {c.calendar.title}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid} style={{ marginTop: '1rem' }}>
          {filteredCoordinations.map(coord => {
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
                  
                  {/* Global Permits Summary for this calendar */}
                  {coord.globalPermits && coord.globalPermits.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>PERMISOS GLOBALES</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {coord.globalPermits.map(permit => {
                          const expDate = new Date(permit.expirationDate);
                          const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          let color = '#16a34a'; // Green > 30 days
                          let bgColor = '#dcfce7';
                          
                          if (daysLeft < 20) {
                            color = '#dc2626'; // Red < 20 days
                            bgColor = '#fee2e2';
                          } else if (daysLeft <= 30) {
                            color = '#ca8a04'; // Yellow <= 30 days
                            bgColor = '#fef08a';
                          }
                          
                          return (
                            <div key={permit.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: bgColor, color: color, borderRadius: '999px', border: `1px solid ${color}40`, fontWeight: 600 }}>
                              <span>{permit.name}</span>
                              <span style={{ opacity: 0.8, fontWeight: 400 }}>• {expDate.toLocaleDateString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {coord.statuses && coord.statuses.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>PERMISOS DIARIOS</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                          {today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      </div>
                      
                      {coord.statuses.map(status => (
                    <div key={status.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.9rem' }}>{status.callTarget?.name}</strong>
                          
                          {/* Static Contact Notes Collapsible */}
                          {status.callTarget?.contactNotes && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <button 
                                onClick={() => toggleNote(status.callTarget!.id)}
                                style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {expandedNotes[status.callTarget.id] ? 'Ocultar notas de contacto' : 'Ver notas de contacto'}
                              </button>
                              {expandedNotes[status.callTarget.id] && (
                                <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                  {status.callTarget.contactNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className={styles.opBubbles}
                          onClick={(e) => { e.stopPropagation(); setQuickActionStatus(status); }}
                          title="Haz clic para gestionar la Apertura/Cierre operativo y notas diarias"
                          style={{ margin: 0, gap: '1rem', padding: '0.35rem 0.75rem' }}
                        >
                          {(status.callTarget?.requiresOpening ?? true) && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Apertura</span>
                              <div className={`${styles.bubble} ${status.opened ? styles.bubbleGreen : styles.bubbleRed}`} title={status.opened ? `Abierto por ${status.openedBy}` : 'Pendiente apertura'}></div>
                            </div>
                          )}
                          {(status.callTarget?.requiresClosing ?? true) && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cierre</span>
                              <div className={`${styles.bubble} ${status.closed ? styles.bubbleGreen : status.opened ? styles.bubbleOrange : styles.bubbleRed}`} title={status.closed ? `Cerrado por ${status.closedBy}` : 'Pendiente cierre'}></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.operatorInfo} style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                        {status.openedBy && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginRight: '0.5rem' }}>Apertura: {status.openedBy}</span>}
                        {status.closedBy && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Cierre: {status.closedBy}</span>}
                      </div>

                      {status.notes && (
                        <div className={styles.timeInfo} style={{ backgroundColor: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid #fbbf24', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                          <strong>📝 Nota Diaria:</strong> {status.notes}
                        </div>
                      )}
                    </div>
                  ))}
                    </div>
                  )}

                  {coord.statuses.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', margin: 0, marginTop: '0.5rem' }}>No hay sitios configurados para llamar en este calendario.</p>
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
