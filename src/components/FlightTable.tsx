'use client';

import React, { useState, useEffect } from 'react';
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

export default function FlightTable({ 
  flights, 
  zones, 
  onEdit,
  onAdd,
  title,
  emptyMessage
}: { 
  flights: Flight[]; 
  zones: Zone[]; 
  onEdit: (f: Flight) => void;
  onAdd?: () => void;
  title: string;
  emptyMessage?: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [flights]);

  const totalPages = Math.max(1, Math.ceil(flights.length / itemsPerPage));
  const currentFlights = flights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <div className={styles.tableHeader}>
        <h3>{title}</h3>
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd} style={{ fontSize: '0.9rem', gap: '0.5rem' }}>
            ➕ Añadir Coordinación
          </button>
        )}
      </div>
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
            {currentFlights.map((flight, i) => {
              const zone = zones.find(z => z.id === flight.zoneId);
              const globalIndex = (currentPage - 1) * itemsPerPage + i + 1;
              return (
                <tr key={flight.id} onClick={() => onEdit(flight)} className={styles.row}>
                  <td className={styles.idCol}>{globalIndex}</td>
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
                <td colSpan={7} className={styles.empty}>
                  {emptyMessage || "No hay coordinaciones programadas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className="btn" 
            style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &larr; Anterior
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-color)', fontWeight: 600 }}>
            Página {currentPage} de {totalPages}
          </span>
          <button 
            className="btn" 
            style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
