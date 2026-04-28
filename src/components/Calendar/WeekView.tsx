import { useRef, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types';
import './WeekView.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface DragInfo {
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
}

interface Props {
  onCreateTask: (start: string, end: string) => void;
  onEditTask: (task: Task) => void;
}

export default function WeekView({ onCreateTask, onEditTask }: Props) {
  const { tasks, currentDate, fields } = useAppStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const weekStart = dayjs(currentDate).startOf('week');

  const getSlotFromY = useCallback((y: number, cellH: number): number => {
    const raw = Math.floor(y / cellH * 60);
    return Math.round(raw / 15) * 15;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const col = (e.currentTarget as HTMLElement);
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const mins = getSlotFromY(relY, col.clientHeight / 24);
    setDrag({ dayIndex, startMinutes: mins, endMinutes: mins + 60 });
    setIsDragging(true);
  }, [getSlotFromY]);

  const handleMouseMove = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (!isDragging || !drag || drag.dayIndex !== dayIndex) return;
    const col = e.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const mins = getSlotFromY(relY, col.clientHeight / 24);
    setDrag(d => d ? { ...d, endMinutes: Math.max(mins, d.startMinutes + 15) } : null);
  }, [isDragging, drag, getSlotFromY]);

  const handleMouseUp = useCallback((dayIndex: number) => {
    if (!isDragging || !drag || drag.dayIndex !== dayIndex) {
      setIsDragging(false);
      setDrag(null);
      return;
    }
    const day = weekStart.add(drag.dayIndex, 'day');
    const start = day.startOf('day').add(drag.startMinutes, 'minute').toISOString();
    const end = day.startOf('day').add(drag.endMinutes, 'minute').toISOString();
    setIsDragging(false);
    setDrag(null);
    onCreateTask(start, end);
  }, [isDragging, drag, weekStart, onCreateTask]);

  const tasksForDay = (dayIndex: number) => {
    const day = weekStart.add(dayIndex, 'day');
    return tasks.filter(t => {
      const ts = dayjs(t.startTime);
      return ts.isSame(day, 'day');
    });
  };

  const taskStyle = (t: Task) => {
    const startMins = dayjs(t.startTime).hour() * 60 + dayjs(t.startTime).minute();
    const endMins = dayjs(t.endTime).hour() * 60 + dayjs(t.endTime).minute();
    const durMins = Math.max(endMins - startMins, 15);
    const totalMins = 24 * 60;
    return {
      top: `${(startMins / totalMins) * 100}%`,
      height: `${(durMins / totalMins) * 100}%`,
    };
  };

  const getTaskColor = (t: Task) => {
    if (t.color) return t.color;
    if (t.priority) {
      const pField = fields.find(f => f.id === 'priority');
      const opt = pField?.options?.find(o => o.value === t.priority);
      if (opt?.color) return opt.color;
    }
    if (t.category) {
      const cField = fields.find(f => f.id === 'category');
      const opt = cField?.options?.find(o => o.value === t.category);
      if (opt?.color) return opt.color;
    }
    return 'var(--blue)';
  };

  const dragStyle = (dayIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return null;
    const start = Math.min(drag.startMinutes, drag.endMinutes);
    const end = Math.max(drag.startMinutes, drag.endMinutes);
    const totalMins = 24 * 60;
    return {
      top: `${(start / totalMins) * 100}%`,
      height: `${((end - start) / totalMins) * 100}%`,
    };
  };

  const today = dayjs();

  return (
    <div className="week-view">
      {/* Day headers */}
      <div className="week-view__day-headers">
        <div className="week-view__time-gutter" />
        {DAYS.map((d, i) => {
          const day = weekStart.add(i, 'day');
          const isToday = day.isSame(today, 'day');
          return (
            <div key={i} className={`week-view__day-header${isToday ? ' today' : ''}`}>
              <span className="week-view__day-name">{d}</span>
              <span className={`week-view__day-num${isToday ? ' today' : ''}`}>
                {day.format('D')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div className="week-view__body" ref={gridRef}>
        {/* Time labels */}
        <div className="week-view__time-col">
          {HOURS.map(h => (
            <div key={h} className="week-view__time-cell">
              <span className="week-view__time-label mono">
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, dayIndex) => {
          const dayTasks = tasksForDay(dayIndex);
          const ds = dragStyle(dayIndex);
          return (
            <div
              key={dayIndex}
              className="week-view__day-col"
              onMouseDown={(e) => handleMouseDown(e, dayIndex)}
              onMouseMove={(e) => handleMouseMove(e, dayIndex)}
              onMouseUp={() => handleMouseUp(dayIndex)}
              onMouseLeave={() => {
                if (isDragging && drag?.dayIndex === dayIndex) {
                  handleMouseUp(dayIndex);
                }
              }}
            >
              {/* Hour lines */}
              {HOURS.map(h => (
                <div key={h} className="week-view__hour-line" style={{ top: `${(h / 24) * 100}%` }} />
              ))}

              {/* Drag preview */}
              {ds && (
                <div className="week-view__drag-preview" style={ds} />
              )}

              {/* Tasks */}
              {dayTasks.map(t => (
                <div
                  key={t.id}
                  className={`week-view__task${t.source === 'notion' ? ' notion' : ''}`}
                  style={{ ...taskStyle(t), borderLeftColor: getTaskColor(t) }}
                  onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
                >
                  <span className="week-view__task-title">{t.title}</span>
                  {t.progress && (
                    <span className="week-view__task-badge">{t.progress.toUpperCase()}</span>
                  )}
                </div>
              ))}

              {/* Today indicator */}
              {weekStart.add(dayIndex, 'day').isSame(today, 'day') && (
                <div
                  className="week-view__now-line"
                  style={{ top: `${((today.hour() * 60 + today.minute()) / (24 * 60)) * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
