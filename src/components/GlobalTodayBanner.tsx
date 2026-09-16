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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
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

            {/* Separador */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }} className={styles.hideOnMobile}></div>

            {/* Selector de Fecha Global */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '999px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>📅 Fecha:</span>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <input 
                type="date" 
                style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                value={currentDateIso || new Date().toISOString().split('T')[0]}
                onChange={handleDateChange}
              />
            </div>
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
                  
                  {coord.statuses && coord.statuses.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>PERMISOS DIARIOS</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                      </div>
                      
                      {coord.statuses.map(status => {
                        const cycles = status.cycles || [];
                        const latestCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;
                        const isCurrentlyOpen = latestCycle && latestCycle.opened && !latestCycle.closed;

                        return (
                        <div key={status.id} style={{ 
                          backgroundColor: isCurrentlyOpen ? '#ecfdf5' : '#ffffff',
                          border: '1px solid',
                          borderColor: isCurrentlyOpen ? '#a7f3d0' : '#e2e8f0',
                          borderLeftWidth: '5px',
                          borderLeftColor: isCurrentlyOpen ? '#10b981' : '#cbd5e1',
                          padding: '1rem', 
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <strong style={{ fontSize: '1.1rem', color: isCurrentlyOpen ? '#065f46' : '#334155' }}>
                                  {status.callTarget?.name}
                                </strong>
                                <div 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (isCurrentlyOpen) {
                                       setQuickActionStatus({ status, cycleId: latestCycle.id });
                                    } else {
                                       setQuickActionStatus({ status });
                                    }
                                  }}
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '999px', backgroundColor: isCurrentlyOpen ? '#10b981' : '#f1f5f9', boxShadow: isCurrentlyOpen ? '0 2px 4px rgba(16,185,129,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)', border: '1px solid', borderColor: isCurrentlyOpen ? '#059669' : '#cbd5e1' }}
                                  title={isCurrentlyOpen ? 'Haz clic para CERRAR' : 'Haz clic para ABRIR'}
                                >
                                  {/* Custom Toggle Track */}
                                  <div style={{ 
                                    width: '36px', height: '18px', borderRadius: '18px', 
                                    backgroundColor: isCurrentlyOpen ? '#34d399' : '#cbd5e1', 
                                    position: 'relative', transition: 'background-color 0.2s' 
                                  }}>
                                    <div style={{
                                      width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white',
                                      position: 'absolute', top: '2px', left: isCurrentlyOpen ? '20px' : '2px',
                                      transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isCurrentlyOpen ? 'white' : '#64748b', letterSpacing: '0.05em' }}>
                                    {isCurrentlyOpen ? 'ABIERTA' : 'CERRADA'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Opciones Adicionales */}
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {status.callTarget?.contactNotes && (
                                  <button 
                                    onClick={() => toggleNote(status.callTarget!.id)}
                                    style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                  >
                                    {expandedNotes[status.callTarget.id] ? 'Ocultar notas de contacto' : 'Ver notas de contacto'}
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status }); }}
                                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  📝 Añadir/Editar Nota
                                </button>
                              </div>
                              
                              {status.callTarget?.contactNotes && expandedNotes[status.callTarget.id] && (
                                <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                                  {status.callTarget.contactNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {status.cycles && status.cycles.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Histórico de Aperturas y Cierres ({status.cycles.length})</span>
                              {status.cycles.map((cycle, idx) => (
                                <div key={cycle.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    {cycle.opened ? (
                                      <span>🟢 Abierto por <strong>{cycle.openedBy}</strong> a las {new Date(cycle.openedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    ) : (
                                      <span>⏳ <em>Pendiente de apertura</em></span>
                                    )}
                                    {cycle.closed ? (
                                      <span>🔴 Cerrado por <strong>{cycle.closedBy}</strong> a las {new Date(cycle.closedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    ) : null}
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status, cycleId: cycle.id }); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.5, padding: '0.2rem' }}
                                    title="Modificar registro"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {status.notes && (
                            <div className={styles.timeInfo} style={{ backgroundColor: '#fffbeb', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid #fbbf24', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                              <strong>📝 Nota Diaria General:</strong> {status.notes}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  )}

                  {coord.statuses.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', margin: 0, marginBottom: '1.5rem' }}>No hay sitios configurados para llamar en este calendario.</p>
                  )}
                  
                  {/* Global Permits Summary for this calendar */}
                  {coord.globalPermits && coord.globalPermits.length > 0 && (
                    <div style={{ paddingTop: '1rem', borderTop: '2px dashed #cbd5e1' }}>
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
