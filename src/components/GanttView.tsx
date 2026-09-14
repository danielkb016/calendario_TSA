'use client';

import React, { useState, useEffect } from 'react';
import { getFlights } from '@/app/actions';
import FlightModal from './FlightModal';
import FlightTable from './FlightTable';
import CollisionWarnings from './CollisionWarnings';
import ZoneManagerModal from './ZoneManagerModal';
import GeneralSettingsModal from './GeneralSettingsModal';
import TodayStatusBanner from './TodayStatusBanner';
import styles from './GanttView.module.css';

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string | null;
  dailyOpOpened: boolean;
  dailyOpOpenedBy: string | null;
  dailyOpOpenedAt: Date | null;
  dailyOpClosed: boolean;
  dailyOpClosedBy: string | null;
  dailyOpClosedAt: Date | null;
  zoneId: number;
};

type Operator = {
  id: number;
  name: string;
};

type Calendar = {
  id: number;
  title: string;
  periodicPermitExpiration: Date | null;
  requiresDailyCoordination: boolean;
  zones: { 
    id: number; 
    name: string;
  }[];
};

export default function GanttView({ calendar, operators }: { calendar: Calendar, operators: Operator[] }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isManagingZones, setIsManagingZones] = useState(false);
  const [isManagingSettings, setIsManagingSettings] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const data = await getFlights(calendar.id);
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
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

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
  let isExpiringSoon = false;
  let isExpired = false;
  const today = new Date();
  
  if (calendar.periodicPermitExpiration) {
    const expDate = new Date(calendar.periodicPermitExpiration);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      isExpired = true;
    } else if (daysLeft <= 30) {
      isExpiringSoon = true;
    }
  }

  return (
    <div className={styles.container}>
      {isExpired && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontWeight: 'bold' }}>
          ❌ El permiso periódico del calendario ha caducado.
        </div>
      )}
      {isExpiringSoon && !isExpired && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', color: '#b45309', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontWeight: 'bold' }}>
          ⚠️ El permiso periódico del calendario caduca pronto ({new Date(calendar.periodicPermitExpiration!).toLocaleDateString()}).
        </div>
      )}

      {calendar.requiresDailyCoordination && (
        <div className={styles.todayBannerContainer}>
          <TodayStatusBanner 
            flights={flights} 
            zones={calendar.zones} 
            operators={operators}
            onEditFlight={setEditingFlight}
            onDataUpdated={fetchFlights}
          />
        </div>
      )}

      <div className={styles.controlBar}>
        <div className={styles.navigation}>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handlePrev}>&larr; Anterior</button>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handleToday}>Hoy</button>
          <button className="btn" style={{ border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem' }} onClick={handleNext}>Siguiente &rarr;</button>
          <span className={styles.dateLabel}>{getHeaderLabel()}</span>
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--light)' }} onClick={() => setIsManagingZones(true)}>
            🏔️ Zonas de Vuelo
          </button>
          <button className="btn" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--light)' }} onClick={() => setIsManagingSettings(true)}>
            ⚙️ Ajustes Generales
          </button>
        </div>
      </div>

      <CollisionWarnings flights={flights} zones={calendar.zones} />

      <div className={`card ${styles.ganttCard}`}>
        <div className={styles.ganttGrid} style={{ gridTemplateColumns: `var(--zone-column-width, 200px) repeat(${days.length}, minmax(100px, 1fr))` }}>
          {/* Header Row */}
          <div className={`${styles.headerCell} ${styles.zoneHeader}`}>ZONAS DE VUELO</div>
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`${styles.headerCell} ${isToday ? styles.todayHeader : ''}`}>
                {day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            );
          })}

          {/* Zones and Grid */}
          {calendar.zones.map(zone => {
            return (
            <React.Fragment key={zone.id}>
              <div className={styles.zoneCell}>
                <div className={styles.zoneIcon}>🏔️</div>
                <div className={styles.zoneName}>
                  {zone.name}
                </div>
              </div>
              
              {days.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                
                // Find flights for this zone and day
                const dayFlights = flights.filter(f => 
                  f.zoneId === zone.id && 
                  f.startDate <= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59) &&
                  f.endDate >= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0)
                );

                return (
                  <div key={i} className={`${styles.dayCell} ${isToday ? styles.todayColumn : ''}`} onClick={() => handleCellClick(zone.id, day)}>
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

      {isManagingZones && (
        <ZoneManagerModal
          calendar={calendar}
          onClose={() => setIsManagingZones(false)}
          onZonesChanged={() => fetchFlights()}
        />
      )}

      {isManagingSettings && (
        <GeneralSettingsModal 
          calendar={calendar} 
          operators={operators}
          onClose={() => setIsManagingSettings(false)} 
          onUpdated={() => {
            window.location.reload(); // Hard refresh to update parent props since calendar is passed as a prop from server
          }} 
        />
      )}
    </div>
  );
}
