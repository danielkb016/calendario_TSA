export const dynamic = 'force-dynamic';

import { getCalendars, getOperators, getGlobalCoordinationsForDate, getExternalWebLinks } from './actions';
import DashboardClient from '@/components/DashboardClient';
import GlobalTodayBanner from '@/components/GlobalTodayBanner';
import ExternalLinksHeader from '@/components/ExternalLinksHeader';
import GlobalHeaderActions from '@/components/GlobalHeaderActions';
import styles from './page.module.css';

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  const calendars = await getCalendars();
  const operators = await getOperators();
  const globalCoordinations = await getGlobalCoordinationsForDate(searchParams?.date);
  const externalLinks = await getExternalWebLinks();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>
              COORDINACIONES DRON CENTER
              <span style={{ fontSize: '0.4em', color: '#888', fontWeight: 'normal', verticalAlign: 'super', marginLeft: '0.5rem' }}>v0.0.3</span>
            </h1>
            <p className={styles.subtitle}>Gestión y visualización de operaciones de vuelo en zonas TSA</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <GlobalHeaderActions operators={operators} />
            <ExternalLinksHeader initialLinks={externalLinks} />
          </div>
        </div>
      </header>

      <GlobalTodayBanner coordinations={globalCoordinations} operators={operators} lastRefreshed={new Date()} currentDateIso={searchParams?.date} fullCalendars={calendars} />
      <DashboardClient initialCalendars={calendars} globalOperators={operators} />
    </main>
  );
}
