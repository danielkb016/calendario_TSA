'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PilotsModal from './PilotsModal';
import styles from './GlobalHeaderActions.module.css';

type Operator = {
  id: number;
  name: string;
};

export default function GlobalHeaderActions({ operators }: { operators: Operator[] }) {
  const [isPilotsModalOpen, setIsPilotsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        className={styles.pilotsButton}
        onClick={() => setIsPilotsModalOpen(true)}
        title="Gestionar lista de pilotos"
      >
        👥 Lista de Pilotos
      </button>

      {isPilotsModalOpen && (
        <PilotsModal 
          operators={operators}
          onClose={() => setIsPilotsModalOpen(false)} 
          onUpdated={() => {
            router.refresh();
          }} 
        />
      )}
    </>
  );
}
