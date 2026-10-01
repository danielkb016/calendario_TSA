'use client';

import React, { useState } from 'react';
import OpCoordinationModal from './OpCoordinationModal';
import styles from './TodayStatusBanner.module.css';

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  situation: string | null;
  zoneId: number;
};

interface TodayStatusBannerProps {
  flights: Flight[];
  zones: { id: number; name: string; calendarName?: string }[];
  onEditFlight: (flight: Flight) => void;
  showCalendarName?: boolean;
  currentDateIso?: string;
}

export default function TodayStatusBanner({ flights, zones, onEditFlight, showCalendarName = true, currentDateIso }: TodayStatusBannerProps) {

  const selectedDate = currentDateIso ? new Date(currentDateIso) : new Date();
  const todayStr = new Date().toISOString().split('T')[0];
  const isHistorical = currentDateIso && currentDateIso !== todayStr;

  const startOfToday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

  // Filter active (non-cancelled) flights that overlap with selected date
  const todayFlights = flights.filter(f => {
    if (f.coordination === 'Anulada') return false;
    const fStart = new Date(f.startDate);
    const fEnd = new Date(f.endDate);
    return fStart <= endOfToday && fEnd >= startOfToday;
  });

  const getFormattedTime = (dateVal: Date) => {
    return new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormattedDate = (dateVal: Date) => {
    return new Date(dateVal).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (todayFlights.length === 0) {
    return (
      <div className={`${styles.banner} ${styles.greenBanner}`}>
        {isHistorical && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ⚠️ Histórico: {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <div className={styles.icon}>🟢</div>
        <div className={styles.content}>
          <h4 className={styles.title} style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Espacio Aéreo Libre</h4>
          <p className={styles.description} style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {isHistorical ? 'No hubo coordinaciones programadas para este día.' : 'No hay coordinaciones programadas para el día de hoy. ¡Libre para volar!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`}>
      {isHistorical && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          ⚠️ Histórico: {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h4 className={styles.title} style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {isHistorical ? 'Coordinaciones Activas' : 'Coordinaciones Activas para Hoy'}
        </h4>
        <p className={styles.description} style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          Hay {todayFlights.length} {todayFlights.length === 1 ? 'coordinación programada' : 'coordinaciones programadas'} para {isHistorical ? 'este día' : 'hoy'}. Revisa los horarios y zonas antes de realizar operaciones:
        </p>
        <div className={styles.grid}>
          {todayFlights.map(flight => {
            const zone = zones.find(z => z.id === flight.zoneId);
            const isMultiDay = new Date(flight.startDate).toDateString() !== new Date(flight.endDate).toDateString();

            return (
              <div 
                key={flight.id} 
                className={styles.card}
              >
                <div 
                  className={styles.cardHeader}
                  onClick={() => onEditFlight(flight)}
                  title="Haga clic para editar la coordinación general"
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}
                >
                  {showCalendarName && zone?.calendarName && (
                    <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase' }}>
                      {zone.calendarName}
                    </span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span className={styles.zoneBadge}>🏔️ {zone?.name || 'Zona desconocida'}</span>
                    <span className={`${styles.statusBadge} ${styles[flight.coordination.toLowerCase()] || ''}`}>
                      {flight.coordination}
                    </span>
                  </div>
                </div>
                <div className={styles.cardBody}>

                  <div className={styles.timeInfo} onClick={() => onEditFlight(flight)} style={{ cursor: 'pointer' }}>
                    <strong>Horario:</strong> {getFormattedTime(flight.startDate)} a {getFormattedTime(flight.endDate)}
                    {isMultiDay && (
                      <span className={styles.dateLabel}>
                        ({getFormattedDate(flight.startDate)} - {getFormattedDate(flight.endDate)})
                      </span>
                    )}
                  </div>
                  <div className={styles.operatorInfo}>
                    <strong>Operador:</strong> {flight.operator}
                  </div>
                  {flight.situation && (
                    <div className={styles.situationInfo}>
                      <em>{flight.situation}</em>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
