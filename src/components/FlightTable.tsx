'use client';

import styles from './FlightTable.module.css';

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

export default function FlightTable({ flights, zones, onEdit }: { flights: Flight[], zones: Zone[], onEdit: (f: Flight) => void }) {
  const getCoordinationClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado': return 'badge-success';
      case 'pendiente': return 'badge-warning';
      case 'anulada': return 'badge-secondary';
      default: return 'badge-primary';
    }
  };

  return (
    <div className={`card ${styles.tableCard}`}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fechas</th>
              <th>Operador</th>
              <th>Zona de Vuelo</th>
              <th>Horario</th>
              <th>Estado Coordinación</th>
              <th>Situación Actual</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, i) => {
              const zone = zones.find(z => z.id === flight.zoneId);
              return (
                <tr key={flight.id} onClick={() => onEdit(flight)} className={styles.row}>
                  <td className={styles.idCol}>{i + 1}</td>
                  <td>
                    {flight.startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {flight.startDate.toDateString() !== flight.endDate.toDateString() && (
                      <> - {flight.endDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</>
                    )}
                  </td>
                  <td><strong>{flight.operator}</strong></td>
                  <td>{zone?.name}</td>
                  <td>
                    {flight.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} a {flight.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`badge ${getCoordinationClass(flight.coordination)}`}>
                      {flight.coordination.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.situation}>{flight.situation || '-'}</td>
                </tr>
              );
            })}
            {flights.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>No hay vuelos programados. Haz clic en el calendario para añadir uno.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
