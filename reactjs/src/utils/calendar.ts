// Calendar export for expiry reminders (insurance / licence due dates).
// Two universal, account-free options — no backend, no notification infra:
//   1. .ics file download (Apple Calendar, Outlook, Google Calendar all import it)
//   2. Google Calendar template link (opens pre-filled "create event" page)
// Dates are all-day events on the expiry date (YYYY-MM-DD -> YYYYMMDD).

export interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string | undefined;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function toCalendarDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}${pad(m || 1)}${pad(d || 1)}`;
}

function nextDayStamp(stamp: string): string {
  const y = Number(stamp.slice(0, 4));
  const m = Number(stamp.slice(4, 6)) - 1;
  const d = Number(stamp.slice(6, 8));
  const t = new Date(Date.UTC(y, m, d));
  t.setUTCDate(t.getUTCDate() + 1);
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
}

function stampNow(): string {
  const t = new Date();
  return (
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}${pad(t.getUTCSeconds())}Z`
  );
}

const escapeICS = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function buildICS(event: CalendarEvent): string {
  const start = toCalendarDate(event.date);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//car-your-log-book//expiry//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.floor(Math.random() * 1e9)}@car-your-log-book`,
    `DTSTAMP:${stampNow()}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextDayStamp(start)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const start = toCalendarDate(event.date);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${nextDayStamp(start)}`,
    details: event.description || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// All-day event on the expiry date. Opens the Outlook.com / Microsoft 365
// "new event" page pre-filled (subject/start/end/body + allday flag).
export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.date,
    enddt: event.date,
    body: event.description || '',
    allday: 'true',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// All-day event (st/end as YYYYMMDD). Opens Yahoo's "new event" page.
export function yahooCalendarUrl(event: CalendarEvent): string {
  const start = toCalendarDate(event.date);
  const params = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: event.title,
    st: start,
    et: nextDayStamp(start),
    desc: event.description || '',
  });
  return `https://calendar.yahoo.com/?${params.toString()}`;
}
