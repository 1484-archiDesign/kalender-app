import { useRef, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types';
import './WeekView.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const dayTypeClass = (i: number) =>
  i === 0 ? '--sun' : i === 6 ? '--sat' : '--weekday';

interface DragInfo {
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
}

interface Props {
  onCreateTask: (start: string, end: string) => void;
  onEditTask:   (task: Task) => void;
}

export default function WeekView({ onCreateTask, onEditTask }: Props) {
  const { tasks, currentDate, fields } = useAppStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag]           = useState<DragInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const weekStart = dayjs(currentDate).startOf('week');
  const today     = dayjs();

  /* ── drag helpers ── */
  const getSlotFromY = useCallback((y: number, cellH: number) =>
    Math.round(Math.floor((y / cellH) * 60) / 15) * 15, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const col  = e.currentTarget as HTMLElement;
    const mins = getSlotFromY(e.clientY - col.getBoundingClientRect().top, col.clientHeight / 24);
    setDrag({ dayIndex, startMinutes: mins, endMinutes: mins + 60 });
    setIsDragging(true);
  }, [getSlotFromY]);

  const handleMouseMove = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (!isDragging || !drag || drag.dayIndex !== dayIndex) return;
    const col  = e.currentTarget as HTMLElement;
    const mins = getSlotFromY(e.clientY - col.getBoundingClientRect().top, col.clientHeight / 24);
    setDrag(d => d ? { ...d, endMinutes: Math.max(mins, d.startMinutes + 15) } : null);
  }, [isDragging, drag, getSlotFromY]);

  const handleMouseUp = useCallback((dayIndex: number) => {
    if (!isDragging || !drag || drag.dayIndex !== dayIndex) {
      setIsDragging(false); setDrag(null); return;
    }
    const day   = weekStart.add(drag.dayIndex, 'day');
    const start = day.startOf('day').add(drag.startMinutes, 'minute').toISOString();
    const end   = day.startOf('day').add(drag.endMinutes,   'minute').toISOString();
    setIsDragging(false); setDrag(null);
    onCreateTask(start, end);
  }, [isDragging, drag, weekStart, onCreateTask]);

  /* ── task helpers ── */
  const tasksForDay = (i: number) => {
    const day = weekStart.add(i, 'day');
    return tasks.filter(t => dayjs(t.startTime).isSame(day, 'day'));
  };

  const taskStyle = (t: Task) => {
    const sm = dayjs(t.startTime).hour() * 60 + dayjs(t.startTime).minute();
    const em = dayjs(t.endTime).hour()   * 60 + dayjs(t.endTime).minute();
    return {
      top:    `${(sm / 1440) * 100}%`,
      height: `${(Math.max(em - sm, 15) / 1440) * 100}%`,
    };
  };

  const getBorderColor = (t: Task): string => {
    for (const fid of ['priority', 'category'] as const) {
      const val = (t as unknown as Record<string,string>)[fid];
      if (val) {
        const opt = fields.find(f => f.id === fid)?.options?.find(o => o.value === val);
        if (opt?.color) return opt.color;
      }
    }
    return 'var(--blue)';
  };

  const getColorClass = (t: Task): string => {
    const color = getBorderColor(t).toLowerCase();
    if (color.includes('d62') || color.includes('red'))   return 'week-view__task--red';
    if (color.includes('1b4') || color.includes('blue'))  return 'week-view__task--blue';
    if (color.includes('f5c') || color.includes('yell'))  return 'week-view__task--yellow';
    if (color.includes('2a7') || color.includes('green')) return 'week-view__task--green';
    return 'week-view__task--blue';
  };

  const dragPreviewStyle = (dayIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return null;
    const s = Math.min(drag.startMinutes, drag.endMinutes);
    const e = Math.max(drag.startMinutes, drag.endMinutes);
    return { top: `${(s / 1440) * 100}%`, height: `${((e - s) / 1440) * 100}%` };
  };

  return (
    <div className="week-view">
      {/* ── Day headers ── */}
      <div className="week-view__day-headers">
        <div className="week-view__time-gutter" />
        {DAYS.map((d, i) => {
          const day     = weekStart.add(i, 'day');
          const isToday = day.isSame(today, 'day');
          const type    = dayTypeClass(i);
          return (
            <div key={i} className={`week-view__day-header week-view__day-header${type}${isToday ? ' today' : ''}`}>
              <span className="week-view__day-name">{d}</span>
              <span className={`week-view__day-num${isToday ? ' today' : ''}`}>
                {day.format('D')}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Grid body ── */}
      <div className="week-view__body" ref={gridRef}>
        {/* Time column */}
        <div className="week-view__time-col">
          {HOURS.map(h => (
            <div
              key={h}
              className={`week-view__time-cell${h % 3 === 0 ? ' week-view__time-cell--bold' : ''}`}
            >
              <span className="week-view__time-label">
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, i) => {
          const type     = dayTypeClass(i);
          const dayTasks = tasksForDay(i);
          const ds       = dragPreviewStyle(i);
          return (
            <div
              key={i}
              className={`week-view__day-col week-view__day-col${type}`}
              onMouseDown={e  => handleMouseDown(e, i)}
              onMouseMove={e  => handleMouseMove(e, i)}
              onMouseUp={() => handleMouseUp(i)}
              onMouseLeave={() => { if (isDragging && drag?.dayIndex === i) handleMouseUp(i); }}
            >
              {/* Grid lines */}
              {HOURS.map(h => (
                <div key={h} className={`week-view__hour-line${h % 3 === 0 ? ' week-view__hour-line--bold' : ''}`}
                  style={{ top: `${(h / 24) * 100}%` }} />
              ))}
              {HOURS.map(h => (
                <div key={`h${h}`} className="week-view__half-line"
                  style={{ top: `${((h + 0.5) / 24) * 100}%` }} />
              ))}

              {/* Drag ghost */}
              {ds && <div className="week-view__drag-preview" style={ds} />}

              {/* Tasks */}
              {dayTasks.map(t => (
                <div
                  key={t.id}
                  className={`week-view__task ${getColorClass(t)}${t.source === 'notion' ? ' notion' : ''}`}
                  style={{ ...taskStyle(t), borderLeftColor: getBorderColor(t) }}
                  onClick={e => { e.stopPropagation(); onEditTask(t); }}
                >
                  <span className="week-view__task-title">{t.title}</span>
                  {(t.progress || t.priority) && (
                    <div className="week-view__task-meta">
                      <span className="week-view__task-dot" style={{ background: getBorderColor(t) }} />
                      <span className="week-view__task-badge">
                        {(t.progress ?? t.priority)!.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Now line */}
              {weekStart.add(i, 'day').isSame(today, 'day') && (
                <div className="week-view__now-line"
                  style={{ top: `${((today.hour() * 60 + today.minute()) / 1440) * 100}%` }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
