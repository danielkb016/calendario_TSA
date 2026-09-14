'use client';

import React, { useState } from 'react';
import OpCoordinationModal from './OpCoordinationModal';
import styles from './TodayStatusBanner.module.css'; // Reusing styles

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
  calendarId: number;
  zone?: { id: number; name: string };
  calendar?: { id: number; title: string };
};

type Operator = {
  id: number;
  name: string;
};

interface GlobalTodayBannerProps {
  flights: Flight[];
  operators: Operator[];
  onDataUpdated?: () => void;
}

export default function GlobalTodayBanner({ flights, operators, onDataUpdated }: GlobalTodayBannerProps) {
  const [quickActionFlight, setQuickActionFlight] = useState<Flight | null>(null);

  const getFormattedTime = (dateVal: Date) => {
    return new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormattedDate = (dateVal: Date) => {
    return new Date(dateVal).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Only consider active flights (not Anulada)
  const activeFlights = flights.filter(f => f.coordination !== 'Anulada');

  if (activeFlights.length === 0) {
    return null; // Don't show the global banner if there's nothing to coordinate today globally
  }

  return (
    <div className={`${styles.banner} ${styles.yellowBanner}`} style={{ margin: '1rem', marginTop: 0 }}>
      <div className={styles.icon}>📢</div>
      <div className={styles.content}>
        <h4 className={styles.title}>Coordinaciones Operacionales Diarias (Global)</h4>
        <p className={styles.description}>
          Resumen de todas las ubicaciones que requieren llamada de apertura y cierre para hoy:
        </p>
        <div className={styles.grid}>
          {activeFlights.map(flight => {
            const isMultiDay = new Date(flight.startDate).toDateString() !== new Date(flight.endDate).toDateString();

            return (
              <div 
                key={flight.id} 
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.zoneBadge}>
                    📍 {flight.calendar?.title || 'Calendario'} - 🏔️ {flight.zone?.name || 'Zona'}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div 
                    className={styles.opBubbles}
                    onClick={(e) => { e.stopPropagation(); setQuickActionFlight(flight); }}
                    title="Haz clic para gestionar la Apertura/Cierre operativo"
                  >
                    <div className={`${styles.bubble} ${flight.dailyOpOpened ? styles.bubbleGreen : styles.bubbleRed}`} title={flight.dailyOpOpened ? `Abierto por ${flight.dailyOpOpenedBy}` : 'Pendiente apertura'}></div>
                    <div className={`${styles.bubble} ${flight.dailyOpClosed ? styles.bubbleGreen : flight.dailyOpOpened ? styles.bubbleOrange : styles.bubbleRed}`} title={flight.dailyOpClosed ? `Cerrado por ${flight.dailyOpClosedBy}` : 'Pendiente cierre'}></div>
                    <span className={styles.bubbleText}>Operativa</span>
                  </div>
                  
                  <div className={styles.operatorInfo} style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    {flight.dailyOpOpenedBy && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Abierto por: {flight.dailyOpOpenedBy}</div>}
                    {flight.dailyOpClosedBy && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Cerrado por: {flight.dailyOpClosedBy}</div>}
                  </div>

                  <div className={styles.timeInfo}>
                    <strong>Horario:</strong> {getFormattedTime(flight.startDate)} a {getFormattedTime(flight.endDate)}
                    {isMultiDay && (
                      <span className={styles.dateLabel}>
                        ({getFormattedDate(flight.startDate)} - {getFormattedDate(flight.endDate)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {quickActionFlight && (
        <OpCoordinationModal 
          flight={quickActionFlight}
          operators={operators} 
          onClose={() => setQuickActionFlight(null)} 
          onUpdated={() => {
            window.location.reload();
          }} 
        />
      )}
    </div>
  );
}
