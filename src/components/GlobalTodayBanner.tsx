'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateDailyCallStatus, 
  createDailyCallCycle, 
  updateDailyCallCycle, 
  deleteDailyCallCycle,
  updateCalendarLock
} from '../app/actions';
import OpCoordinationModal from './OpCoordinationModal';
import CalendarSettingsModal from './CalendarSettingsModal';
import styles from './TodayStatusBanner.module.css';

function WeatherBadge({ lat, lng }: { lat: number, lng: number }) {
  const [weather, setWeather] = useState<{windSpeed: number, temp: number, code: number} | null>(null);

  React.useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        if (data.current_weather) {
          setWeather({
            windSpeed: data.current_weather.windspeed,
            temp: data.current_weather.temperature,
            code: data.current_weather.weathercode
          });
        }
      })
      .catch(err => console.error("Error fetching weather:", err));
  }, [lat, lng]);

  if (!weather) return <div className={styles.weatherBadge} style={{ opacity: 0.5 }}>Cargando clima...</div>;

  const getWeatherEmoji = (code: number) => {
    if (code === 0) return '☀️'; // Despejado
    if (code >= 1 && code <= 3) return '⛅'; // Nubes
    if (code >= 51 && code <= 67) return '🌧️'; // Lluvia
    if (code >= 71 && code <= 77) return '❄️'; // Nieve
    if (code >= 95 && code <= 99) return '⛈️'; // Tormenta
    return '🌡️';
  };

  return (
    <div className={styles.weatherBadge}>
      <div className={styles.weatherData}>
        <div className={styles.weatherItem}>
          <span>💨</span> Viento: {weather.windSpeed} km/h
        </div>
        <div className={styles.weatherItem}>
          <span>{getWeatherEmoji(weather.code)}</span> Temp: {weather.temp} °C
        </div>
      </div>
      <div className={styles.coordText}>
        Lat: {lat.toFixed(4)}<br/>Lng: {lng.toFixed(4)}
      </div>
    </div>
  );
}

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
  calendar: { id: number; title: string; isLocked?: boolean; lockReason?: string | null; lat?: number | null; lng?: number | null };
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
  lat?: number | null;
  lng?: number | null;
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

  // Always render the banner so the UI doesn't disappear when empty.
  // if (coordinations.length === 0) {
  //   return null; 
  // }
  const filteredCoordinations = selectedCalendarId === 'all' 
    ? coordinations 
    : coordinations.filter(c => c.calendar.id.toString() === selectedCalendarId);

  const toggleNote = (targetId: number) => {
    setExpandedNotes(prev => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      window.location.href = `/?date=${val}`;
    } else {
      window.location.href = `/`;
    }
  };

  const handleToggleLock = async (calendarId: number, currentIsLocked: boolean) => {
    let reason = null;
    if (!currentIsLocked) {
      reason = window.prompt("Introduce el motivo de bloqueo para esta ubicación (se mantendrá bloqueada los próximos días):");
      if (reason === null) return; // Usuario canceló
      if (!reason.trim()) {
        alert("Debes introducir un motivo para bloquear la ubicación.");
        return;
      }
    }
    try {
      await updateCalendarLock(calendarId, !currentIsLocked, reason);
    } catch (e) {
      console.error("Error al actualizar bloqueo:", e);
      alert("Error al cambiar el estado de bloqueo.");
    }
  };

  const selectedDateStr = currentDateIso || new Date().toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const isHistorical = selectedDateStr !== todayStr;
  const selectedDate = currentDateIso ? new Date(currentDateIso) : new Date();

  return (
    <div className={styles.banner} style={{ margin: '1rem', marginTop: 0 }}>
      <div className={styles.headerContent}>
        {lastRefreshed && (
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', fontSize: '0.65rem', color: '#64748b' }}>
            Actualizado: {lastRefreshed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        
        <h5 className={styles.title}>Coordinaciones Operacionales Diarias (Global)</h5>
        <p className={styles.description}>
          Resumen de ubicaciones y sitios a los que hay que llamar para el día seleccionado.
        </p>

        {isHistorical && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ⚠️ Histórico: {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        <div className={styles.tabsContainer}>
          <button
            onClick={() => setSelectedCalendarId('all')}
            className={`${styles.tabBtn} ${selectedCalendarId === 'all' ? styles.activeTab : ''}`}
          >
            Todas
          </button>
          {coordinations.map(c => (
            <button
              key={c.calendar.id}
              onClick={() => setSelectedCalendarId(c.calendar.id.toString())}
              className={`${styles.tabBtn} ${selectedCalendarId === c.calendar.id.toString() ? styles.activeTab : ''}`}
            >
              {c.calendar.title}
            </button>
          ))}
        </div>

        <div className={styles.datePill}>
          <span>📅</span>
          <input 
            type="date" 
            value={currentDateIso || todayStr}
            onChange={handleDateChange}
          />
        </div>
      </div>

      <div className={styles.grid}>
          {filteredCoordinations.map(coord => {
            const isLocked = !!coord.calendar.isLocked;
            const lockReason = coord.calendar.lockReason;

            return (
              <div 
                key={coord.calendar.id} 
                className={styles.card}
                style={{
                  opacity: isLocked ? 0.7 : 1,
                  filter: isLocked ? 'grayscale(80%)' : 'none'
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.lockIconContainer}>
                    <span style={{ fontSize: '1.8rem' }}>{isLocked ? '🔒' : '📍'}</span>
                  </div>
                  <div className={styles.cardTitleArea}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className={styles.cardTitle} style={{ textDecoration: isLocked ? 'line-through' : 'none' }}>
                        {coord.calendar.title}
                      </h3>
                      {fullCalendars && (
                        <button onClick={() => setEditingCalendarId(coord.calendar.id)} className={styles.actionBtn} style={{ padding: '0.2rem 0.5rem', background: 'transparent' }} title="Editar Configuración">
                          ⚙️
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        id={`lock-${coord.calendar.id}`}
                        checked={isLocked}
                        onChange={() => handleToggleLock(coord.calendar.id, isLocked)}
                        style={{ cursor: 'pointer', accentColor: '#475569' }}
                      />
                      <label htmlFor={`lock-${coord.calendar.id}`} style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}>
                        BLOQUEAR
                      </label>
                    </div>
                    {isLocked && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#fca5a5', fontWeight: 600 }}>
                        Bloqueada: {lockReason}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                  {coord.statuses && coord.statuses.length > 0 && (
                    <div>
                      <div className={styles.sectionLabel}>PERMISOS DIARIOS</div>
                      
                      {coord.statuses.map(status => {
                        const cycles = status.cycles || [];
                        const latestCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;
                        const isCurrentlyOpen = latestCycle && latestCycle.opened && !latestCycle.closed;

                        return (
                        <div key={status.id} className={styles.innerItem} style={{ borderColor: isCurrentlyOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)' }}>
                          <div className={styles.innerItemHeader}>
                            <span className={styles.innerItemName} style={{ color: isCurrentlyOpen ? '#6ee7b7' : '#f1f5f9' }}>
                              {status.callTarget?.name}
                            </span>
                            <div 
                              className={`${styles.statusPill} ${isCurrentlyOpen ? styles.abierta : styles.cerrada}`}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isCurrentlyOpen) {
                                   setQuickActionStatus({ status, cycleId: latestCycle.id });
                                } else {
                                   setQuickActionStatus({ status });
                                }
                              }}
                            >
                              <div className={styles.dot} />
                              {isCurrentlyOpen ? 'ABIERTA' : 'CERRADA'}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {status.callTarget?.contactNotes && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleNote(status.callTarget!.id); }}
                                className={styles.actionBtn}
                              >
                                📞 {expandedNotes[status.callTarget.id] ? 'Ocultar' : 'Contacto'}
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status }); }}
                              className={styles.actionBtn}
                            >
                              📝 Nota
                            </button>
                          </div>

                          {status.callTarget?.contactNotes && expandedNotes[status.callTarget.id] && (
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>
                              {status.callTarget.contactNotes}
                            </div>
                          )}

                          {status.cycles && status.cycles.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                              {status.cycles.map((cycle) => (
                                <div key={cycle.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                    {cycle.opened ? (
                                      <span style={{ color: '#6ee7b7' }}>🟢 Abierto por {cycle.openedBy} ({new Date(cycle.openedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                    ) : (
                                      <span>⏳ Pendiente de apertura</span>
                                    )}
                                    {cycle.closed ? (
                                      <span style={{ color: '#fca5a5' }}>🔴 Cerrado por {cycle.closedBy} ({new Date(cycle.closedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                    ) : null}
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setQuickActionStatus({ status, cycleId: cycle.id }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7 }} title="Editar">✏️</button>
                                </div>
                              ))}
                            </div>
                          )}

                          {status.notes && (
                            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '0.4rem', borderRadius: '4px', borderLeft: '2px solid #f59e0b', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                              <strong>Nota Diaria:</strong> {status.notes}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  )}

                  {coord.statuses.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic', margin: 0, marginBottom: '1rem' }}>No hay sitios a los que llamar.</p>
                  )}
                  
                  {coord.globalPermits && coord.globalPermits.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div className={styles.sectionLabel}>PERMISOS GLOBALES</div>
                      <div className={styles.globalPermitsList}>
                        {coord.globalPermits.map(permit => {
                          const expDate = new Date(permit.expirationDate);
                          const daysLeft = Math.ceil((expDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          let color = '#4ade80';
                          if (daysLeft < 0) color = '#f87171';
                          else if (daysLeft <= 30) color = '#facc15';
                          
                          return (
                            <div key={permit.id} className={styles.globalPermitItem} style={{ borderColor: color }}>
                              <span>{permit.name}</span>
                              <span style={{ color }}>{expDate.toLocaleDateString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {coord.calendar.lat != null && coord.calendar.lng != null && (
                  <WeatherBadge lat={coord.calendar.lat} lng={coord.calendar.lng} />
                )}
              </div>
            );
          })}
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
