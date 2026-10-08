'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFlights, deleteFlight, getAllFlights } from '@/app/actions';
import FlightModal from './FlightModal';
import FlightTable from './FlightTable';
import CollisionWarnings from './CollisionWarnings';
import styles from './GanttView.module.css';

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string | null;
  zoneId: number;
};

type Operator = {
  id: number;
  name: string;
};

type Calendar = {
  id: number;
  title: string;
  globalPermits: { 
    id: number; 
    name: string; 
    expirationDate: Date;
    warningDays?: number;
    exclusions?: { 
      id: number; 
      startDate: Date; 
      endDate: Date | null; 
      ruleType: string; 
      timeWindowsJson: string | null; 
      reason: string | null; 
    }[];
  }[];
  requiresDailyCoordination: boolean;
  zones: { 
    id: number; 
    name: string;
    calendarName?: string;
  }[];
};

export default function GanttView({ calendar, operators, isAllMode, currentDateIso }: { calendar: Calendar, operators: Operator[], isAllMode?: boolean, currentDateIso?: string }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const router = useRouter();

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const data = isAllMode 
        ? await getAllFlights()
        : await getFlights(calendar.id);
      setFlights(data);
    } catch (e) {
      console.error("Failed to load flights", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [calendar.id]);

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(() => {
    const d = currentDateIso ? new Date(currentDateIso) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const d = currentDateIso ? new Date(currentDateIso) : new Date();
    d.setHours(0, 0, 0, 0);
    setReferenceDate(d);
  }, [currentDateIso]);

  // Calculate start and end date based on viewMode and referenceDate
  let minDate = new Date(referenceDate);
  let maxDate = new Date(referenceDate);

  if (viewMode === 'week') {
    // Start at Monday of referenceDate's week
    const dayOfWeek = referenceDate.getDay(); // 0 is Sunday, 1 is Monday
    const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    minDate.setDate(diff);
    minDate.setHours(0, 0, 0, 0);
    
    maxDate = new Date(minDate);
    maxDate.setDate(minDate.getDate() + 6);
    maxDate.setHours(23, 59, 59, 999);
  } else {
    // Month view
    minDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    maxDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Generate array of days
  const days: Date[] = [];
  let current = new Date(minDate);
  while (current <= maxDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const handlePrev = () => {
    setReferenceDate(prev => {
      const nextDate = new Date(prev);
      if (viewMode === 'week') {
        nextDate.setDate(prev.getDate() - 7);
      } else {
        nextDate.setMonth(prev.getMonth() - 1);
      }
      return nextDate;
    });
  };

  const handleNext = () => {
    setReferenceDate(prev => {
      const nextDate = new Date(prev);
      if (viewMode === 'week') {
        nextDate.setDate(prev.getDate() + 7);
      } else {
        nextDate.setMonth(prev.getMonth() + 1);
      }
      return nextDate;
    });
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setReferenceDate(today);
  };

  const getHeaderLabel = () => {
    if (viewMode === 'week') {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const startStr = minDate.toLocaleDateString('es-ES', options);
      const endStr = maxDate.toLocaleDateString('es-ES', options);
      const year = minDate.getFullYear();
      return `Semana del ${startStr} al ${endStr} (${year})`;
    } else {
      return referenceDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
  };

  const handleCellClick = (zoneId: number, day: Date) => {
    setSelectedZone(zoneId);
    setSelectedDate(day);
  };

  const handleCloseModal = (refresh: boolean) => {
    setSelectedZone(null);
    setSelectedDate(null);
    setEditingFlight(null);
    if (refresh) fetchFlights();
  };

  const handleAddClick = () => {
    if (calendar.zones.length === 0) {
      alert("Por favor, cree al menos una zona de vuelo antes de añadir una coordinación.");
      return;
    }
    setSelectedZone(calendar.zones[0].id);
    setSelectedDate(new Date());
  };

  const activeFlights = flights.filter(f => !['Anulada', 'Finalizada'].includes(f.coordination));
  const historicalFlights = flights.filter(f => ['Anulada', 'Finalizada'].includes(f.coordination))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  // Global permit expiration check
  const expiringPermits: { name: string; expirationDate: Date }[] = [];
  const expiredPermits: { name: string; expirationDate: Date }[] = [];
  const today = new Date();
  
  if (calendar.globalPermits) {
    calendar.globalPermits.forEach(permit => {
      const expDate = new Date(permit.expirationDate);
      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const warningDays = permit.warningDays ?? 30;
      if (daysLeft < 0) {
        expiredPermits.push(permit);
      } else if (daysLeft <= warningDays) {
        expiringPermits.push(permit);
      }
    });
  }

  return (
    <div className={styles.container}>
      {expiredPermits.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontWeight: 'bold' }}>
          ❌ Han caducado los siguientes permisos: {expiredPermits.map(p => p.name).join(', ')}.
        </div>
      )}
      {expiringPermits.length > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', color: '#b45309', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontWeight: 'bold' }}>
          ⚠️ Los siguientes permisos caducan pronto: {expiringPermits.map(p => `${p.name} (${new Date(p.expirationDate).toLocaleDateString()})`).join(', ')}.
        </div>
      )}

      <div className={styles.controlBar}>
        <div className={styles.navigation}>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handlePrev}>&larr; Anterior</button>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handleToday}>Hoy</button>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handleNext}>Siguiente &rarr;</button>
          <span className={styles.dateLabel}>{getHeaderLabel()}</span>
          {currentDateIso && currentDateIso !== new Date().toISOString().split('T')[0] && (
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠️ Histórico
            </span>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.activeMode : ''}`} 
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.activeMode : ''}`} 
            onClick={() => setViewMode('month')}
          >
            Mes
          </button>
        </div>
      </div>

      <CollisionWarnings flights={flights} zones={calendar.zones} />

      <div className={`card ${styles.ganttCard}`}>
        <div className={styles.ganttGrid} style={{ gridTemplateColumns: `var(--zone-column-width, 200px) repeat(${days.length}, minmax(100px, 1fr))` }}>
          {/* Header Row */}
          <div className={`${styles.headerCell} ${styles.zoneHeader}`}>ZONAS DE VUELO</div>
          {days.map((day, i) => {
            const dateStr = day.toDateString();
            const realTodayStr = new Date().toDateString();
            const selectedDateStr = currentDateIso ? new Date(currentDateIso).toDateString() : realTodayStr;
            
            const isRealToday = dateStr === realTodayStr;
            const isSelected = dateStr === selectedDateStr;
            
            let excludedBy: string[] = [];
            if (calendar.globalPermits) {
              for (const permit of calendar.globalPermits) {
                if (permit.exclusions) {
                  for (const ex of permit.exclusions) {
                    const startDateStr = typeof ex.startDate === 'string' 
                      ? ex.startDate.split('T')[0] 
                      : new Date(ex.startDate).toISOString().split('T')[0];
                      
                    const endDateStr = ex.endDate 
                      ? (typeof ex.endDate === 'string' ? ex.endDate.split('T')[0] : new Date(ex.endDate).toISOString().split('T')[0])
                      : startDateStr;
                    
                    const dayStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD
                    
                    if (dayStr >= startDateStr && dayStr <= endDateStr) {
                      let reasonText = '';
                      if (ex.ruleType === 'DENY_ALL' || !ex.ruleType) {
                        reasonText = ex.reason || 'No permitido';
                      } else {
                        const tw = ex.timeWindowsJson ? JSON.parse(ex.timeWindowsJson) : [];
                        const twStr = tw.map((w:any) => `${w.start}-${w.end}`).join(', ');
                        if (ex.ruleType === 'ALLOW_WINDOWS') {
                          reasonText = `Solo permitido: ${twStr} (${ex.reason || 'Sin motivo'})`;
                        } else {
                          reasonText = `Prohibido: ${twStr} (${ex.reason || 'Sin motivo'})`;
                        }
                      }
                      excludedBy.push(`${permit.name}: ${reasonText}`);
                    }
                  }
                }
              }
            }
            
            let highlightClass = '';
            if (isRealToday) highlightClass = styles.todayHeader;
            else if (isSelected) highlightClass = styles.selectedHeader;

            return (
              <div 
                key={i} 
                className={`${styles.headerCell} ${highlightClass}`}
                style={excludedBy.length > 0 ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.5)' } : undefined}
                title={excludedBy.length > 0 ? `PROHIBIDO VOLAR:\n${excludedBy.join('\n')}` : undefined}
              >
                {day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                {excludedBy.length > 0 && (
                  <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: '#ef4444' }}>🚫</div>
                )}
              </div>
            );
          })}

          {calendar.zones.map(zone => {
            return (
            <React.Fragment key={zone.id}>
              <div className={styles.zoneCell}>
                <div className={styles.zoneIcon}>🏔️</div>
                <div className={styles.zoneName}>
                  {isAllMode && zone.calendarName && (
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 'bold' }}>
                      {zone.calendarName}
                    </div>
                  )}
                  {zone.name}
                </div>
              </div>
              
              {days.map((day, i) => {
                const realTodayStr = new Date().toDateString();
                const selectedDateStr = currentDateIso ? new Date(currentDateIso).toDateString() : realTodayStr;
                
                const isRealToday = day.toDateString() === realTodayStr;
                const isSelected = day.toDateString() === selectedDateStr;
                
                let highlightClass = '';
                if (isRealToday) highlightClass = styles.todayColumn;
                else if (isSelected) highlightClass = styles.selectedColumn;
                
                // Find flights for this zone and day
                const dayFlights = flights.filter(f => 
                  f.zoneId === zone.id && 
                  f.startDate <= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59) &&
                  f.endDate >= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0)
                );

                return (
                  <div key={i} className={`${styles.dayCell} ${highlightClass}`} onClick={() => handleCellClick(zone.id, day)}>
                    {dayFlights.map(flight => (
                      <div 
                        key={flight.id} 
                        className={`${styles.flightBlock} ${styles[flight.coordination.toLowerCase()] || styles.default}`}
                        onClick={(e) => { e.stopPropagation(); setEditingFlight(flight); }}
                      >
                        <strong>{flight.operator}</strong>
                        <span>
                          {flight.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {flight.endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {flight.coordination === 'Anulada' && <div className={styles.anuladaStamp}>ANULADA</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          )})}
        </div>
      </div>

      <FlightTable 
        flights={activeFlights} 
        zones={calendar.zones} 
        onEdit={setEditingFlight} 
        onAdd={handleAddClick} 
        title="Coordinaciones Activas"
      />

      <FlightTable 
        flights={historicalFlights} 
        zones={calendar.zones} 
        onEdit={setEditingFlight} 
        title="Historial y Anuladas"
        emptyMessage="No hay coordinaciones en el historial."
      />
      {(selectedZone !== null || editingFlight !== null) && (
        <FlightModal 
          calendarId={calendar.id}
          zones={calendar.zones}
          initialZoneId={selectedZone ?? undefined}
          initialDate={selectedDate ?? undefined}
          editingFlight={editingFlight ?? undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
