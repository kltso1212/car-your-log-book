import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  buildICS,
  downloadICS,
  googleCalendarUrl,
  outlookCalendarUrl,
  yahooCalendarUrl,
  type CalendarEvent,
} from '../utils/calendar';

// One 🔔 button beside an expiry date. Opens a dialog to pick how the
// reminder gets into the user's calendar (all frontend-only, no account or
// backend needed). Methods are data-driven — add entries to METHODS.
interface Props {
  title: string;
  date: string; // YYYY-MM-DD expiry
  filename: string;
  description?: string;
}

export default function CalendarButtons({ title, date, filename, description }: Props) {
  const [open, setOpen] = useState(false);
  if (!date) return null;
  const event: CalendarEvent = { title, date, description };

  // Brand icons live in reactjs/public/*.png (served at site root).
  const icon = (src: string, alt: string): ReactNode => (
    <img className="cal-icon" src={src} alt={alt} width={20} height={20} />
  );

  const METHODS: Array<{ key: string; label: ReactNode; hint: string; run: () => void }> = [
    {
      // This IS the Apple Calendar path: iPhone Safari opens the .ics and
      // offers 「加入行事曆」. Also imports into Outlook / Google Calendar.
      key: 'ics',
      label: '📥 下載行事曆檔案 (.ics)',
      hint: 'iPhone：下載後按「加入行事曆」；Outlook / Google 日曆亦可匯入',
      run: () => {
        downloadICS(filename, buildICS(event));
        setOpen(false);
      },
    },
    {
      key: 'google',
      label: (
        <>
          {icon('/google.png', 'Google')} 加入 Google 日曆
        </>
      ),
      hint: '開啟已填好的 Google 日曆新增活動頁',
      run: () => {
        window.open(googleCalendarUrl(event), '_blank', 'noopener,noreferrer');
        setOpen(false);
      },
    },
    {
      key: 'outlook',
      label: (
        <>
          {icon('/microsoft.png', 'Microsoft')} 加入 Outlook 日曆
        </>
      ),
      hint: '開啟已填好的 Outlook.com 新增活動頁',
      run: () => {
        window.open(outlookCalendarUrl(event), '_blank', 'noopener,noreferrer');
        setOpen(false);
      },
    },
    {
      key: 'yahoo',
      label: (
        <>
          {icon('/yahoo.png', 'Yahoo')} 加入 Yahoo 日曆
        </>
      ),
      hint: '開啟已填好的 Yahoo 日曆新增活動頁',
      run: () => {
        window.open(yahooCalendarUrl(event), '_blank', 'noopener,noreferrer');
        setOpen(false);
      },
    },
  ];

  return (
    <span className="cal-buttons">
      <button
        type="button"
        className="icon-button"
        title="加入行事曆提醒"
        aria-label="加入行事曆提醒"
        onClick={() => setOpen(true)}
      >
        🔔
      </button>
      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>🔔 加入行事曆提醒</h2>
            <p className="hint">
              {title}（{date}）
            </p>
            <div className="cal-list">
              {METHODS.map(m => (
                <button key={m.key} type="button" className="cal-item" onClick={m.run}>
                  <span className="cal-item-label">{m.label}</span>
                  <span className="cal-item-hint">{m.hint}</span>
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
