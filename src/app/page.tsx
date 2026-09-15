export const dynamic = 'force-dynamic';

import { getCalendars, getOperators, getTodayGlobalCoordinations, getExternalWebLinks } from './actions';
import DashboardClient from '@/components/DashboardClient';
import GlobalTodayBanner from '@/components/GlobalTodayBanner';
import ExternalLinksHeader from '@/components/ExternalLinksHeader';
import styles from './page.module.css';

export default async function Home() {
  const calendars = await getCalendars();
  const operators = await getOperators();
  const globalCoordinations = await getTodayGlobalCoordinations();
  const externalLinks = await getExternalWebLinks();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>
              Coordinaciones TSA
              <span style={{ fontSize: '0.4em', color: '#888', fontWeight: 'normal', verticalAlign: 'super', marginLeft: '0.5rem' }}>v0.0.2</span>
            </h1>
            <p className={styles.subtitle}>Gestión y visualización de operaciones de vuelo en zonas TSA</p>
          </div>
          <ExternalLinksHeader initialLinks={externalLinks} />
        </div>
      </header>

      <GlobalTodayBanner coordinations={globalCoordinations} operators={operators} />
      <DashboardClient initialCalendars={calendars} globalOperators={operators} />
    </main>
  );
}
