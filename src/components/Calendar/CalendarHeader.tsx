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
    label = start.month() === end.month()
      ? start.format('MMMM YYYY')
      : `${start.format('MMM')} — ${end.format('MMM YYYY')}`;
  } else {
    label = cd.format('MMMM YYYY');
  }

  return (
    <header className="cal-header">
      {/* Brand */}
      <div className="cal-header__brand">
        <div className="cal-header__logo">
          <div className="cal-header__logo-row">
            <span className="cal-header__logo-sq cal-header__logo-sq--r" />
            <span className="cal-header__logo-sq cal-header__logo-sq--b" />
          </div>
          <div className="cal-header__logo-row">
            <span className="cal-header__logo-sq cal-header__logo-sq--y" />
            <span className="cal-header__logo-sq cal-header__logo-sq--g" />
          </div>
        </div>
        <span className="cal-header__title">KALENDER</span>
      </div>

      {/* Nav */}
      <div className="cal-header__nav">
        <button className="cal-header__arrow" onClick={navigatePrev}>‹</button>
        <button className="cal-header__today" onClick={navigateToday}>TODAY</button>
        <button className="cal-header__arrow" onClick={navigateNext}>›</button>
        <span className="cal-header__label">{label.toUpperCase()}</span>
      </div>

      {/* Right actions */}
      <div className="cal-header__actions">
        <div className="cal-header__view-toggle">
          <button
            className={`cal-header__view-btn${view === 'week' ? ' active' : ''}`}
            onClick={() => setView('week')}
          >WEEK</button>
          <button
            className={`cal-header__view-btn${view === 'month' ? ' active' : ''}`}
            onClick={() => setView('month')}
          >MONTH</button>
        </div>

        <button
          className={`cal-header__notion-btn${notionConfig ? ' linked' : ''}`}
          onClick={() => setNotionSettingsOpen(true)}
        >
          <span className="cal-header__notion-n">N</span>
          {notionConfig ? 'LINKED' : 'NOTION'}
        </button>

        <button
          className="cal-header__settings-btn"
          onClick={() => setSettingsOpen(true)}
          title="Field settings"
        >⚙</button>
      </div>
    </header>
  );
}
