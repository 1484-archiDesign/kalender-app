import dayjs from 'dayjs';
import { useAppStore } from '../../store/useAppStore';
import './CalendarHeader.css';

export default function CalendarHeader() {
  const {
    view, currentDate,
    setView, navigatePrev, navigateNext, navigateToday,
    setSettingsOpen, setNotionSettingsOpen,
    notionConfig,
  } = useAppStore();

  const cd = dayjs(currentDate);
  let label = '';
  if (view === 'week') {
    const start = cd.startOf('week');
    const end = cd.endOf('week');
    if (start.month() === end.month()) {
      label = start.format('MMMM YYYY');
    } else {
      label = `${start.format('MMM')} – ${end.format('MMM YYYY')}`;
    }
  } else {
    label = cd.format('MMMM YYYY');
  }

  return (
    <header className="cal-header">
      {/* Left: logo + geo accent */}
      <div className="cal-header__brand">
        <div className="cal-header__logo">
          <span className="cal-header__logo-square cal-header__logo-square--r" />
          <span className="cal-header__logo-square cal-header__logo-square--b" />
          <span className="cal-header__logo-square cal-header__logo-square--y" />
        </div>
        <span className="cal-header__title mono">KALENDER</span>
      </div>

      {/* Center: nav */}
      <div className="cal-header__nav">
        <button className="btn btn--sm btn--icon" onClick={navigatePrev}>‹</button>
        <button className="cal-header__today btn btn--sm" onClick={navigateToday}>TODAY</button>
        <button className="btn btn--sm btn--icon" onClick={navigateNext}>›</button>
        <span className="cal-header__label mono">{label.toUpperCase()}</span>
      </div>

      {/* Right: view switcher + actions */}
      <div className="cal-header__actions">
        <div className="cal-header__view-toggle">
          <button
            className={`cal-header__view-btn mono${view === 'week' ? ' active' : ''}`}
            onClick={() => setView('week')}
          >WEEK</button>
          <button
            className={`cal-header__view-btn mono${view === 'month' ? ' active' : ''}`}
            onClick={() => setView('month')}
          >MONTH</button>
        </div>

        <button
          className={`btn btn--sm${notionConfig ? ' btn--primary' : ''}`}
          onClick={() => setNotionSettingsOpen(true)}
          title="Notion連携設定"
        >
          <span style={{ fontSize: 12 }}>N</span>
          {notionConfig ? ' LINKED' : ' NOTION'}
        </button>

        <button
          className="btn btn--sm btn--icon"
          onClick={() => setSettingsOpen(true)}
          title="フィールド設定"
        >⚙</button>
      </div>
    </header>
  );
}
