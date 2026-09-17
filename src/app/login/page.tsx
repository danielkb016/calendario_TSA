'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin } from '../auth';
import styles from './login.module.css';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyPin(pin);
      if (result.success) {
        // Force a full refresh to clear any cached unauthenticated layouts
        window.location.href = '/';
      } else {
        setError(result.error || 'Error al verificar el PIN');
        setPin(''); // Clear on error
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>🔒</div>
        <h1 className={styles.title}>Acceso Restringido</h1>
        <p className={styles.subtitle}>Introduce el PIN de seguridad para acceder a las coordinaciones.</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={styles.input}
              placeholder="••••"
              disabled={loading}
              autoFocus
              autoComplete="off"
            />
          </div>
          
          <button type="submit" className={styles.button} disabled={loading || pin.trim().length === 0}>
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}
