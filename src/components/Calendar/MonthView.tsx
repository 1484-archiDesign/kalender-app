import dayjs from 'dayjs';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types';
import './MonthView.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface Props {
  onCreateTask: (start: string, end: string) => void;
  onEditTask: (task: Task) => void;
}

export default function MonthView({ onCreateTask, onEditTask }: Props) {
  const { tasks, currentDate, fields } = useAppStore();
  const today = dayjs();
  const monthStart = dayjs(currentDate).startOf('month');
  const calStart = monthStart.startOf('week');
  const weeks: dayjs.Dayjs[][] = [];

  let d = calStart;
  while (d.isBefore(monthStart.endOf('month').endOf('week').add(1, 'day'))) {
    const week: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(d);
      d = d.add(1, 'day');
    }
    weeks.push(week);
  }

  const tasksForDay = (day: dayjs.Dayjs) =>
    tasks.filter(t => dayjs(t.startTime).isSame(day, 'day'));

  const getTaskColor = (t: Task) => {
    if (t.color) return t.color;
    if (t.priority) {
      const pField = fields.find(f => f.id === 'priority');
      const opt = pField?.options?.find(o => o.value === t.priority);
      if (opt?.color) return opt.color;
    }
    return 'var(--blue)';
  };

  const handleDayClick = (day: dayjs.Dayjs) => {
    const start = day.hour(9).minute(0).toISOString();
    const end = day.hour(10).minute(0).toISOString();
    onCreateTask(start, end);
  };

  return (
    <div className="month-view">
      {/* Header row */}
      <div className="month-view__header">
        {DAYS.map(d => (
          <div key={d} className="month-view__header-cell mono">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <div className="month-view__grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="month-view__week">
            {week.map((day, di) => {
              const isCurrentMonth = day.month() === monthStart.month();
              const isToday = day.isSame(today, 'day');
              const dayTasks = tasksForDay(day);
              return (
                <div
                  key={di}
                  className={`month-view__day${isCurrentMonth ? '' : ' other-month'}${isToday ? ' today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="month-view__day-num-wrap">
                    <span className={`month-view__day-num mono${isToday ? ' today' : ''}`}>
                      {day.format('D')}
                    </span>
                  </div>
                  <div className="month-view__tasks">
                    {dayTasks.slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        className="month-view__task"
                        style={{ borderLeftColor: getTaskColor(t) }}
                        onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
                      >
                        <span>{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="month-view__more mono">+{dayTasks.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
