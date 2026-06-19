'use client';

import styles from './CollisionWarnings.module.css';

type Flight = {
  id: number;
  operator: string;
  startDate: Date;
  endDate: Date;
  coordination: string;
  zoneId: number;
};

type Zone = {
  id: number;
  name: string;
};

export default function CollisionWarnings({ flights, zones }: { flights: Flight[], zones: Zone[] }) {
  // Find collisions
  const activeFlights = flights.filter(f => f.coordination !== 'Anulada');
  const collisions: { f1: Flight, f2: Flight, zone: Zone }[] = [];

  for (let i = 0; i < activeFlights.length; i++) {
    for (let j = i + 1; j < activeFlights.length; j++) {
      const f1 = activeFlights[i];
      const f2 = activeFlights[j];

      if (f1.zoneId === f2.zoneId) {
        // Check time overlap
        if (f1.startDate < f2.endDate && f1.endDate > f2.startDate) {
          const zone = zones.find(z => z.id === f1.zoneId);
          if (zone) {
            collisions.push({ f1, f2, zone });
          }
        }
      }
    }
  }

  if (collisions.length === 0) return null;

  return (
    <div className={styles.container}>
      {collisions.map((c, i) => (
        <div key={i} className={styles.warningBox}>
          <div className={styles.icon}>⚠️</div>
          <div className={styles.content}>
            <div className={styles.title}>POSIBLE COLISIÓN {i + 1} (mismo espacio/tiempo)</div>
            <div className={styles.details}>
              <strong>{c.zone.name}</strong><br/>
              Entre {c.f1.operator} y {c.f2.operator}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
