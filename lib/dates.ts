const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function weekDates(anchor: Date = new Date()): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return toISODate(next);
  });
}

export function weekdayLabel(iso: string): string {
  const date = parseISODate(iso);
  const jsDay = date.getDay();
  const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
  return WEEKDAY_LABELS[mondayIndex];
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function formatDayMonth(iso: string): string {
  return parseISODate(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
