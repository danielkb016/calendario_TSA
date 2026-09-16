'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OpCoordinationModal from './OpCoordinationModal';
import CalendarSettingsModal from './CalendarSettingsModal';
import styles from './TodayStatusBanner.module.css';

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

type DailyCallCycle = {
  id: number;
  opened: boolean;
  openedBy: string | null;
  openedAt: Date | null;
  closed: boolean;
  closedBy: string | null;
  closedAt: Date | null;
  dailyCallStatusId: number;
};

type DailyCallStatus = {
  id: number;
  date: Date;
  notes: string | null;
  callTargetId: number;
  callTarget?: CallTarget;
  cycles?: DailyCallCycle[];
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

// Simplified full calendar type for the prop
type FullCalendar = {
  id: number;
  title: string;
  requiresDailyCoordination: boolean;
  zones: any[];
  callTargets?: any[];
  globalPermits?: any[];
};

interface GlobalTodayBannerProps {
  coordinations: GlobalCoordination[];
  operators: Operator[];
  lastRefreshed?: Date;
  currentDateIso?: string;
  fullCalendars?: FullCalendar[];
}

export default function GlobalTodayBanner({ coordinations, operators, lastRefreshed, currentDateIso, fullCalendars }: GlobalTodayBannerProps) {
  const router = useRouter();
  const [quickActionStatus, setQuickActionStatus] = useState<{ status: DailyCallStatus, cycleId?: number } | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [editingCalendarId, setEditingCalendarId] = useState<number | null>(null);

  if (coordinations.length === 0) {
    return null; 
  }

  const filteredCoordinations = selectedCalendarId === 'all' 
    ? coordinations 
    : coordinations.filter(c => c.calendar.id.toString() === selectedCalendarId);

  const toggleNote = (targetId: number) => {
    setExpandedNotes(prev => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/?date=${val}`);
    } else {
      router.push(`/`);
    }
  };

  const selectedDate = currentDateIso ? new Date(currentDateIso) : new Date();

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`} style={{ margin: '1rem', marginTop: 0, position: 'relative' }}>
      {lastRefreshed && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '1rem', fontSize: '0.65rem', color: '#64748b' }}>
          Última actualización: {lastRefreshed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
      <div className={styles.icon}>📢</div>
      <div className={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h5 className={styles.title} style={{ marginBottom: '0.2rem', fontSize: '1rem' }}>Coordinaciones Operacionales Diarias (Global)</h5>
            <p className={styles.description} style={{ margin: 0, fontSize: '0.8rem' }}>
              Resumen de todas las ubicaciones y sitios a los que hay que llamar para el día seleccionado.
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
                <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={styles.zoneBadge}>
                    📍 {coord.calendar.title}
                  </span>
                  {fullCalendars && (
                    <button 
                      onClick={() => setEditingCalendarId(coord.calendar.id)}
                      style={{ background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#64748b' }}
                      title="Editar Permisos y Configuración"
                    >
                      ⚙️ Editar
                    </button>
                  )}
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
                          const daysLeft = Math.ceil((expDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          let color = '#16a34a'; // Green > 30 days
                          let bgColor = '#dcfce7';
                          
                          if (daysLeft < 0) {
                            color = '#dc2626'; // Red < 0 days (caducado)
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
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px dashed #cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>PERMISOS DIARIOS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <input 
                            type="date" 
                            style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: '#475569', outline: 'none', cursor: 'pointer' }}
                            value={currentDateIso || new Date().toISOString().split('T')[0]}
                            onChange={handleDateChange}
                          />
                        </div>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      </div>
                      
                      {coord.statuses.map(status => (
                        <div key={status.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong style={{ fontSize: '0.9rem' }}>{status.callTarget?.name}</strong>
                              </div>
                              
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
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                            {status.cycles?.map((cycle, idx) => {
                              const isOpened = cycle.opened && !cycle.closed;
                              const isClosed = cycle.closed;
                              const isPending = !cycle.opened;
                              
                              return (
                                <div key={cycle.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>#{idx + 1}</span>
                                  
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status, cycleId: cycle.id }); }}
                                    style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', opacity: isClosed ? 0.7 : 1, flex: 1 }}
                                    title="Haz clic para gestionar este ciclo"
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {/* Custom Toggle Track */}
                                      <div style={{ 
                                        width: '40px', height: '20px', borderRadius: '20px', 
                                        backgroundColor: isOpened ? '#10b981' : '#cbd5e1', 
                                        position: 'relative', transition: 'background-color 0.2s' 
                                      }}>
                                        {/* Toggle Thumb */}
                                        <div style={{
                                          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white',
                                          position: 'absolute', top: '2px', left: isOpened ? '22px' : '2px',
                                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                      </div>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isOpened ? '#10b981' : '#64748b' }}>
                                        {isOpened ? 'ABIERTA' : 'CERRADA'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      {cycle.opened ? (
                                        <span>🟢 Abierto por <strong>{cycle.openedBy}</strong> a las {new Date(cycle.openedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      ) : null}
                                      {cycle.closed ? (
                                        <span>🔴 Cerrado por <strong>{cycle.closedBy}</strong> a las {new Date(cycle.closedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      ) : null}
                                      {!cycle.opened && !cycle.closed && (
                                        <span>⏳ Pendiente de apertura</span>
                                      )}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status, cycleId: cycle.id }); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}
                                    title="Modificar / Eliminar ciclo y notas"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              );
                            })}
                            
                            {(() => {
                              const cycles = status.cycles || [];
                              const lastCycle = cycles[cycles.length - 1];
                              const reqClose = status.callTarget?.requiresClosing ?? true;
                              const isAllCompleted = cycles.length === 0 || (reqClose ? lastCycle.closed : lastCycle.opened);
                              
                              return isAllCompleted ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px dashed #cbd5e1', opacity: 0.7 }}>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>#{cycles.length + 1}</span>
                                  
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status }); }}
                                    style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}
                                    title="Haz clic para iniciar nuevo ciclo o editar nota general"
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div style={{ 
                                        width: '40px', height: '20px', borderRadius: '20px', 
                                        backgroundColor: '#cbd5e1', 
                                        position: 'relative' 
                                      }}>
                                        <div style={{
                                          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white',
                                          position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                      </div>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>
                                        CERRADA
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.4rem' }}>
                                      <span>✨ Haz clic para abrir (Nuevo Ciclo) o editar notas</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {status.notes && (
                            <div className={styles.timeInfo} style={{ backgroundColor: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid #fbbf24', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                              <strong>📝 Nota Diaria General:</strong> {status.notes}
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
          status={quickActionStatus.status}
          cycleId={quickActionStatus.cycleId}
          operators={operators} 
          onClose={() => setQuickActionStatus(null)} 
          onUpdated={() => router.refresh()} 
        />
      )}

      {editingCalendarId && fullCalendars && (
        <CalendarSettingsModal 
          calendar={fullCalendars.find(c => c.id === editingCalendarId)!}
          onClose={() => setEditingCalendarId(null)}
          onUpdated={() => router.refresh()}
        />
      )}
    </div>
  );
}
