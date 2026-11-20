const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** "21 oct" a partir de una fecha ISO (sin depender de Intl, que varía entre motores). */
export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

/** "3:05" o "1:02:10" a partir de segundos. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'FM'
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/** "lun", "mar"… a partir de "AAAA-MM-DD" (sin desfase de zona horaria). */
export function weekdayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}

/** Primer nombre para saludar. */
export function firstName(name: string | undefined | null): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}

/** Saludo según la hora local. */
export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
