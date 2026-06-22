export const dynamic = 'force-dynamic';

import { getCalendars } from './actions';
import DashboardClient from '@/components/DashboardClient';
import styles from './page.module.css';

export default async function Home() {
  const calendars = await getCalendars();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Coordinaciones TSA
            <span style={{ fontSize: '0.4em', color: '#888', fontWeight: 'normal', verticalAlign: 'super', marginLeft: '0.5rem' }}>v0.0.1</span>
          </h1>
          <p className={styles.subtitle}>Gestión y visualización de operaciones de vuelo en zonas TSA</p>
        </div>
      </header>

      <DashboardClient initialCalendars={calendars} />
    </main>
  );
}
