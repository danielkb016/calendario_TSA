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

function WeatherBadge({ lat, lng, lastRefreshed }: { lat: number, lng: number, lastRefreshed?: Date }) {
  const [weather, setWeather] = useState<{windSpeed: number, temp: number, code: number, rainProb: number} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [limits, setLimits] = useState({
    rain: 30,
    windYellow: 20,
    windRed: 40,
    tempMax: 35
  });

  React.useEffect(() => {
    const saved = localStorage.getItem('weatherLimits');
    if (saved) {
      try { setLimits(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  React.useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weather_code,precipitation_probability`)
      .then(res => res.json())
      .then(data => {
        if (data.current) {
          setWeather({
            windSpeed: data.current.wind_speed_10m,
            temp: data.current.temperature_2m,
            code: data.current.weather_code,
            rainProb: data.current.precipitation_probability
          });
        }
      })
      .catch(err => console.error("Error fetching weather:", err));
  }, [lat, lng, lastRefreshed]);

  if (!weather) return <div className={styles.weatherBadge} style={{ opacity: 0.5 }}>Cargando clima...</div>;

  const getWeatherEmoji = (code: number) => {
    if (code === 0) return '☀️'; // Despejado
    if (code >= 1 && code <= 3) return '⛅'; // Nubes
    if (code >= 45 && code <= 48) return '🌫️'; // Niebla
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'; // Lluvia / Chubascos
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️'; // Nieve
    if (code >= 95 && code <= 99) return '⛈️'; // Tormenta
    return '🌡️';
  };

  let borderClass = '';
  let windTextClass = '';
  let rainTextClass = '';
  let tempTextClass = '';

  const isRainAlert = weather.code >= 51 || weather.rainProb >= limits.rain;
  const isWindRed = weather.windSpeed >= limits.windRed;
  const isWindYellow = weather.windSpeed >= limits.windYellow && weather.windSpeed < limits.windRed;
  const isTempAlert = weather.temp >= limits.tempMax;

  if (isRainAlert) rainTextClass = styles.textAlertRed;
  if (isWindRed) windTextClass = styles.textAlertRed;
  else if (isWindYellow) windTextClass = styles.textAlertYellow;
  if (isTempAlert) tempTextClass = styles.textAlertRed;

  if (isRainAlert || isWindRed || isTempAlert) {
    borderClass = styles.weatherAlertRed;
  } else if (isWindYellow) {
    borderClass = styles.weatherAlertYellow;
  }

  return (
    <>
      <div className={`${styles.weatherBadge} ${borderClass}`} style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowSettings(true)}
          style={{ position: 'absolute', top: 2, right: 4, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '0.75rem' }}
          title="Ajustar límites de alertas"
        >⚙️</button>
        <div className={styles.weatherData}>
          <div className={`${styles.weatherItem} ${windTextClass}`}>
            <span>💨</span> {weather.windSpeed} km/h
          </div>
          <div className={`${styles.weatherItem} ${tempTextClass}`}>
            <span>{getWeatherEmoji(weather.code)}</span> {weather.temp} °C
          </div>
          <div className={`${styles.weatherItem} ${rainTextClass}`}>
            <span>☔</span> {weather.rainProb}%
          </div>
        </div>
        {weather.code >= 51 && (
          <div style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', fontWeight: 'bold', animation: 'blinkTextRed 1s infinite' }}>
            ⚠️ Lluvia detectada ahora
          </div>
        )}
      </div>

      {showSettings && (
        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Alertas Clima</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Configura a partir de qué valor saltan los colores parpadeantes.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Probabilidad Lluvia (%)</label>
                <input type="number" className={styles.settingsInput} value={limits.rain} onChange={e => setLimits({...limits, rain: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Viento Alerta Amarilla (km/h)</label>
                <input type="number" className={styles.settingsInput} value={limits.windYellow} onChange={e => setLimits({...limits, windYellow: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Viento Alerta Roja (km/h)</label>
                <input type="number" className={styles.settingsInput} value={limits.windRed} onChange={e => setLimits({...limits, windRed: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Temperatura Max (°C)</label>
                <input type="number" className={styles.settingsInput} value={limits.tempMax} onChange={e => setLimits({...limits, tempMax: Number(e.target.value)})} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className={styles.btnSecondary} onClick={() => setShowSettings(false)}>Cerrar</button>
              <button className={styles.btnPrimary} onClick={() => {
                localStorage.setItem('weatherLimits', JSON.stringify(limits));
                setShowSettings(false);
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type PermitExclusion = {
  id: number;
  startDate: Date | string;
  endDate: Date | string | null;
  ruleType: string;
  timeWindowsJson: string | null;
  reason: string | null;
};

type PermitCoordination = {
  id: number;
  startDate: Date | string | null;
  expirationDate: Date | string;
  warningDays?: number;
  exclusions?: PermitExclusion[];
};

type GlobalPermit = {
  id: number;
  name: string;
  coordinations?: PermitCoordination[];
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
  selectedCalendarIds?: number[] | 'all';
}

export default function GlobalTodayBanner({ 
  coordinations, 
  operators, 
  lastRefreshed, 
  currentDateIso, 
  fullCalendars,
  selectedCalendarIds = 'all'
}: GlobalTodayBannerProps) {
  const router = useRouter();
  const [quickActionStatus, setQuickActionStatus] = useState<{ status: DailyCallStatus, cycleId?: number } | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [editingCalendarId, setEditingCalendarId] = useState<number | null>(null);

  const filteredCoordinations = selectedCalendarIds === 'all' 
    ? coordinations 
    : coordinations.filter(c => selectedCalendarIds.includes(c.calendar.id));

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

  const getLocalDateStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateStr();
  const selectedDateStr = currentDateIso || todayStr;
  const isHistorical = selectedDateStr !== todayStr;
  const selectedDate = currentDateIso ? new Date(currentDateIso) : new Date();

  return (
    <div style={{ margin: '1rem', marginTop: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Barra superior de controles de fecha (FUERA del banner) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div className={styles.datePill} style={{ position: 'relative', top: 'auto', left: 'auto', margin: 0 }}>
          <button 
            className={styles.actionBtn} 
            style={{ padding: '0.2rem 0.5rem' }}
            onClick={() => {
              const d = new Date(selectedDateStr);
              d.setDate(d.getDate() - 1);
              window.location.href = `/?date=${d.toISOString().split('T')[0]}`;
            }}
          >
            &larr; Anterior
          </button>
          <button 
            className={styles.actionBtn} 
            style={{ padding: '0.2rem 0.5rem' }}
            onClick={() => window.location.href = `/`}
          >
            Hoy
          </button>
          <button 
            className={styles.actionBtn} 
            style={{ padding: '0.2rem 0.5rem' }}
            onClick={() => {
              const d = new Date(selectedDateStr);
              d.setDate(d.getDate() + 1);
              window.location.href = `/?date=${d.toISOString().split('T')[0]}`;
            }}
          >
            Siguiente &rarr;
          </button>
          <span style={{ marginLeft: '0.5rem' }}>📅</span>
          <input 
            type="date" 
            value={currentDateIso || todayStr}
            onChange={handleDateChange}
          />
        </div>

        {isHistorical && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(4px)' }}>
            ⚠️ Visualizando Histórico: {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Banner de las operaciones */}
      <div className={styles.banner}>
        
        {lastRefreshed && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.65rem', color: '#64748b', textAlign: 'right' }}>
            Actualizado:<br/>{lastRefreshed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

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
                    <div style={{ marginTop: '1rem' }} suppressHydrationWarning>
                      <div className={styles.sectionLabel}>PERMISOS GLOBALES</div>
                      <div className={styles.globalPermitsList} suppressHydrationWarning>
                        {coord.globalPermits.map(permit => {
                          const todayLocalStr = new Date().toLocaleDateString('en-CA');
                          const targetDateStr = currentDateIso || todayLocalStr;

                          // Find active coordination
                          const activeCoord = permit.coordinations?.find(c => {
                            const startStr = c.startDate ? (typeof c.startDate === 'string' ? c.startDate.split('T')[0] : new Date(c.startDate).toISOString().split('T')[0]) : null;
                            const endStr = typeof c.expirationDate === 'string' ? c.expirationDate.split('T')[0] : new Date(c.expirationDate).toISOString().split('T')[0];
                            if (startStr && targetDateStr < startStr) return false;
                            if (targetDateStr > endStr) return false;
                            return true;
                          });

                          let isExcluded = false;
                          let isPartiallyExcluded = false;
                          let statusText = '';
                          let exclusionReason = '';
                          let color = '#4ade80';
                          let bgColor = undefined;
                          let isBlinking = false;
                          let subText = '';

                          if (!activeCoord) {
                            isExcluded = true;
                            statusText = 'Sin coordinación';
                            exclusionReason = 'No hay periodo de coordinación para esta fecha';
                            color = '#ef4444';
                            bgColor = 'rgba(239, 68, 68, 0.1)';
                            subText = statusText;
                          } else {
                            const expDate = new Date(activeCoord.expirationDate);
                            const daysLeft = Math.ceil((expDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
                            const warningDays = activeCoord.warningDays ?? 30;
                            subText = expDate.toLocaleDateString();

                            if (activeCoord.exclusions) {
                              for (const ex of activeCoord.exclusions) {
                                const startDateStr = typeof ex.startDate === 'string' 
                                  ? ex.startDate.split('T')[0] 
                                  : new Date(ex.startDate).toISOString().split('T')[0];
                                  
                                const endDateStr = ex.endDate 
                                  ? (typeof ex.endDate === 'string' ? ex.endDate.split('T')[0] : new Date(ex.endDate).toISOString().split('T')[0])
                                  : startDateStr;
                                
                                  if (targetDateStr >= startDateStr && targetDateStr <= endDateStr) {
                                    if (ex.ruleType === 'DENY_ALL' || !ex.ruleType) {
                                      isExcluded = true;
                                      statusText = 'Excluido hoy';
                                      exclusionReason = ex.reason || 'Sin motivo especificado';
                                    } else {
                                      const tw = ex.timeWindowsJson ? JSON.parse(ex.timeWindowsJson) : [];
                                      
                                      if (targetDateStr === todayLocalStr) {
                                        const currentHourMin = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                        let inWindow = false;
                                        let currentW = null;
                                        for (const w of tw) {
                                          if (currentHourMin >= w.start && currentHourMin <= w.end) {
                                            inWindow = true;
                                            currentW = w;
                                            break;
                                          }
                                        }
                                        tw.sort((a:any, b:any) => a.start.localeCompare(b.start));
                                        const nextW = tw.find((w:any) => currentHourMin < w.start);
                                        
                                        if (ex.ruleType === 'ALLOW_WINDOWS') {
                                          if (!inWindow) {
                                            isExcluded = true;
                                            statusText = nextW ? `Excluido hasta las ${nextW.start}` : 'Excluido resto del día';
                                          } else {
                                            isPartiallyExcluded = true;
                                            statusText = `Excluido a partir de las ${currentW.end}`;
                                          }
                                        } else if (ex.ruleType === 'DENY_WINDOWS') {
                                          if (inWindow) {
                                            isExcluded = true;
                                            statusText = currentW ? `Excluido hasta las ${currentW.end}` : 'Excluido por horas';
                                          } else {
                                            if (nextW) {
                                              isPartiallyExcluded = true;
                                              statusText = `Excluido a partir de las ${nextW.start}`;
                                            }
                                          }
                                        }
                                        exclusionReason = statusText + (ex.reason ? ` (${ex.reason})` : '');
                                      } else {
                                        isExcluded = true; 
                                        const twStr = tw.map((w:any) => `${w.start}-${w.end}`).join(', ');
                                        statusText = ex.ruleType === 'ALLOW_WINDOWS' ? `Permitido: ${twStr}` : `Prohibido: ${twStr}`;
                                        exclusionReason = statusText;
                                      }
                                    }

                                    if (isExcluded || isPartiallyExcluded) {
                                      break;
                                    }
                                  }
                              }
                            }
                            
                            if (isExcluded) {
                              color = '#ef4444';
                              bgColor = 'rgba(239, 68, 68, 0.1)';
                              subText = statusText;
                            } else if (isPartiallyExcluded) {
                              color = '#f97316';
                              bgColor = 'rgba(249, 115, 22, 0.1)';
                              isBlinking = true;
                              subText = statusText;
                            } else if (daysLeft < 0) {
                              color = '#f87171'; // Caducado
                              subText = 'Caducado';
                            } else if (daysLeft <= warningDays) {
                              color = '#facc15'; // Aviso de renovación
                            }
                          }

                          return (
                            <div 
                              key={permit.id} 
                              className={styles.globalPermitItem} 
                              style={{ 
                                borderColor: color, 
                                backgroundColor: bgColor,
                                animation: isBlinking ? 'blinkOrange 2s infinite ease-in-out' : undefined
                              }}
                              title={(isExcluded || isPartiallyExcluded) ? `RESTRICCIÓN:\n${exclusionReason}` : undefined}
                              suppressHydrationWarning
                            >
                              <style suppressHydrationWarning>{`
                                @keyframes blinkOrange {
                                  0% { background-color: rgba(249, 115, 22, 0.1); border-color: #f97316; }
                                  50% { background-color: rgba(249, 115, 22, 0.3); border-color: #f97316; }
                                  100% { background-color: rgba(249, 115, 22, 0.1); border-color: #f97316; }
                                }
                              `}</style>
                              <span suppressHydrationWarning style={{ color: (isExcluded || isPartiallyExcluded) ? color : undefined, fontWeight: (isExcluded || isPartiallyExcluded) ? 'bold' : 'normal' }}>
                                {permit.name} {(isExcluded || isPartiallyExcluded) && <span suppressHydrationWarning style={{fontSize: '0.7rem', color, marginLeft: '0.2rem'}}>⚠️</span>}
                              </span>
                              <span suppressHydrationWarning style={{ color, fontWeight: (isExcluded || isPartiallyExcluded) ? 'bold' : 'normal', fontSize: (isExcluded || isPartiallyExcluded) ? '0.75rem' : undefined }}>
                                {subText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!isHistorical && coord.calendar.lat != null && coord.calendar.lng != null && (
                  <WeatherBadge lat={coord.calendar.lat} lng={coord.calendar.lng} lastRefreshed={lastRefreshed} />
                )}
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
