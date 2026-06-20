'use client';

import React from 'react';
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

type Zone = {
  id: number;
  name: string;
};

interface TodayStatusBannerProps {
  flights: Flight[];
  zones: Zone[];
  onEditFlight: (flight: Flight) => void;
}

export default function TodayStatusBanner({ flights, zones, onEditFlight }: TodayStatusBannerProps) {
  // Get start and end of today in local time
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  // Filter active (non-cancelled) flights that overlap with today
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
        <div className={styles.icon}>🟢</div>
        <div className={styles.content}>
          <h4 className={styles.title}>Espacio Aéreo Libre</h4>
          <p className={styles.description}>No hay coordinaciones programadas para el día de hoy. ¡Libre para volar!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h4 className={styles.title}>Coordinaciones Activas para Hoy</h4>
        <p className={styles.description}>
          Hay {todayFlights.length} {todayFlights.length === 1 ? 'coordinación' : 'coordinaciones'} programadas para hoy. Revisa los horarios y zonas antes de realizar operaciones:
        </p>
        <div className={styles.grid}>
          {todayFlights.map(flight => {
            const zone = zones.find(z => z.id === flight.zoneId);
            const isMultiDay = new Date(flight.startDate).toDateString() !== new Date(flight.endDate).toDateString();

            return (
              <div 
                key={flight.id} 
                className={styles.card}
                onClick={() => onEditFlight(flight)}
                title="Haga clic para editar la coordinación"
              >
                <div className={styles.cardHeader}>
                  <span className={styles.zoneBadge}>🏔️ {zone?.name || 'Zona desconocida'}</span>
                  <span className={`${styles.statusBadge} ${styles[flight.coordination.toLowerCase()] || ''}`}>
                    {flight.coordination}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.timeInfo}>
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
