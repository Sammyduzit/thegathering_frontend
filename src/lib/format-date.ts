/**
 * Formats a date in German timezone (Europe/Berlin) for both server and client.
 * Uses Intl.DateTimeFormat to ensure consistent output and avoid hydration mismatches.
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Format and convert from "DD.MM.YYYY, HH:MM:SS" to "YYYY-MM-DD HH:MM:SS"
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
