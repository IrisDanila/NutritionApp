/** Date helpers. All "dateKey" strings are local-time YYYY-MM-DD. */

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function prettyDate(key: string): string {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function shortDate(key: string): string {
  const d = keyToDate(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function weekdayLetter(key: string): string {
  return WEEKDAYS[keyToDate(key).getDay()][0];
}

/** Returns the last `n` date keys ending today (oldest first). */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = todayKey();
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

export function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}
