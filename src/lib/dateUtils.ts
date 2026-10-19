/**
 * Date utility functions for consistent DD/MM/YYYY date formatting across the application.
 */

/**
 * Formats a Date object, ISO string, or 'YYYY-MM-DD' string strictly to 'DD/MM/YYYY'.
 * Ensures 2-digit day and month with 4-digit year, preventing SSR/client locale discrepancies.
 */
export function formatDateDMY(val: Date | string | null | undefined): string {
  if (!val) return '';

  if (typeof val === 'string') {
    // If it's already in DD/MM/YYYY or D/M/YYYY
    const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${day}/${month}/${year}`;
    }

    // If it's in YYYY-MM-DD or ISO string (e.g. 2026-10-18T00:00:00.000Z)
    const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
    }
  }

  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
