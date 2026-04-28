import { useRef, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types';
import './WeekView.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const dayTypeClass = (i: number) =>
  i === 0 ? '--sun' : i === 6 ? '--sat' : '--weekday';

interface CreateDrag {
  type: 'create';
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
}

interface MoveDrag {
  type: 'move';
  taskId: string;
  duration: number;
  offsetMinutes: number;
  dayIndex: number;
  startMinutes: number;
}

type DragState = CreateDrag | MoveDrag | null;

interface TaskLayout {
  task: Task;
  col: number;
  totalCols: number;
}

function computeLayouts(tasks: Task[]): TaskLayout[] {
  if (tasks.length === 0) return [];
  const sorted = [...tasks].sort(
    (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
  );
  const colEnds: number[] = [];
  const assignments: { task: Task; col: number }[] = [];

  for (const task of sorted) {
    const start = dayjs(task.startTime).valueOf();
    const end   = dayjs(task.endTime).valueOf();
    let assigned = -1;
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= start) { assigned = c; colEnds[c] = end; break; }
    }
    if (assigned === -1) { assigned = colEnds.length; colEnds.push(end); }
    assignments.push({ task, col: assigned });
  }

  return assignments.map(({ task, col }) => {
    const start = dayjs(task.startTime).valueOf();
    const end   = dayjs(task.endTime).valueOf();
    let maxCol = col;
    for (const other of assignments) {
      if (dayjs(other.task.startTime).valueOf() < end &&
          dayjs(other.task.endTime).valueOf()   > start) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    return { task, col, totalCols: maxCol + 1 };
  });
}

interface Props {
  onCreateTask: (start: string, end: string) => void;
  onEditTask:   (task: Task) => void;
  onMoveTask:   (id: string, start: string, end: string) => Promise<void>;
}

export default function WeekView({ onCreateTask, onEditTask, onMoveTask }: Props) {
  const { tasks, currentDate, fields } = useAppStore();
  const gridRef   = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState>(null);

  const weekStart = dayjs(currentDate).startOf('week');
  const today     = dayjs();

  /* ── helpers ── */
  const snapMins = (raw: number) => Math.round(raw / 15) * 15;

  const getMinutesFromY = useCallback((y: number, colH: number) =>
    snapMins(Math.floor((y / colH) * 1440)), []);

  const getPositionFromMouse = useCallback((e: React.MouseEvent) => {
    const body = gridRef.current;
    if (!body) return null;
    const rect = body.getBoundingClientRect();
    const timeColW = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--time-col-w')
    ) || 52;
    const x = e.clientX - rect.left - timeColW;
    const colW = (rect.width - timeColW) / 7;
    const dayIndex = Math.max(0, Math.min(6, Math.floor(x / colW)));
    const y = e.clientY - rect.top + body.scrollTop;
    const minutes = Math.max(0, Math.min(1425, snapMins((y / body.scrollHeight) * 1440)));
    return { dayIndex, minutes };
  }, []);

  /* ── drag: create ── */
  const handleColMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const col  = e.currentTarget as HTMLElement;
    const mins = getMinutesFromY(e.clientY - col.getBoundingClientRect().top, col.clientHeight);
    setDrag({ type: 'create', dayIndex, startMinutes: mins, endMinutes: mins + 60 });
  }, [getMinutesFromY]);

  const handleColMouseMove = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (!drag || drag.type !== 'create' || drag.dayIndex !== dayIndex) return;
    const col  = e.currentTarget as HTMLElement;
    const mins = getMinutesFromY(e.clientY - col.getBoundingClientRect().top, col.clientHeight);
    setDrag(d => d && d.type === 'create' ? { ...d, endMinutes: Math.max(mins, d.startMinutes + 15) } : d);
  }, [drag, getMinutesFromY]);

  const handleColMouseUp = useCallback((dayIndex: number) => {
    if (!drag || drag.type !== 'create' || drag.dayIndex !== dayIndex) {
      setDrag(null); return;
    }
    const day   = weekStart.add(drag.dayIndex, 'day');
    const start = day.startOf('day').add(drag.startMinutes, 'minute').toISOString();
    const end   = day.startOf('day').add(drag.endMinutes,   'minute').toISOString();
    setDrag(null);
    onCreateTask(start, end);
  }, [drag, weekStart, onCreateTask]);

  /* ── drag: move ── */
  const handleTaskMouseDown = useCallback((e: React.MouseEvent, t: Task, dayIndex: number) => {
    e.stopPropagation();
    if (t.source === 'notion') return;
    const sm = dayjs(t.startTime).hour() * 60 + dayjs(t.startTime).minute();
    const em = dayjs(t.endTime).hour()   * 60 + dayjs(t.endTime).minute();
    const col = (e.currentTarget as HTMLElement).closest('.week-view__day-col') as HTMLElement;
    const clickMins = col
      ? getMinutesFromY(e.clientY - col.getBoundingClientRect().top, col.clientHeight)
      : sm;
    setDrag({
      type: 'move',
      taskId: t.id,
      duration: em - sm,
      offsetMinutes: Math.max(0, clickMins - sm),
      dayIndex,
      startMinutes: sm,
    });
  }, [getMinutesFromY]);

  const handleBodyMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || drag.type !== 'move') return;
    const pos = getPositionFromMouse(e);
    if (!pos) return;
    const newStart = Math.max(0, Math.min(1440 - drag.duration, pos.minutes - drag.offsetMinutes));
    setDrag(d => d && d.type === 'move'
      ? { ...d, dayIndex: pos.dayIndex, startMinutes: newStart }
      : d);
  }, [drag, getPositionFromMouse]);

  const handleBodyMouseUp = useCallback(async () => {
    if (!drag || drag.type !== 'move') { setDrag(null); return; }
    const day   = weekStart.add(drag.dayIndex, 'day');
    const start = day.startOf('day').add(drag.startMinutes, 'minute').toISOString();
    const end   = day.startOf('day').add(drag.startMinutes + drag.duration, 'minute').toISOString();
    const captured = drag;
    setDrag(null);
    await onMoveTask(captured.taskId, start, end);
  }, [drag, weekStart, onMoveTask]);

  /* ── task style helpers ── */
  const taskPositionStyle = (t: Task, layout: TaskLayout) => {
    const sm = dayjs(t.startTime).hour() * 60 + dayjs(t.startTime).minute();
    const em = dayjs(t.endTime).hour()   * 60 + dayjs(t.endTime).minute();
    const colW = 100 / layout.totalCols;
    return {
      top:    `${(sm / 1440) * 100}%`,
      height: `${(Math.max(em - sm, 15) / 1440) * 100}%`,
      left:   `${layout.col * colW + 0.5}%`,
      width:  `calc(${colW}% - 4px)`,
      right:  'auto' as const,
    };
  };

  const moveGhostStyle = (drag: MoveDrag) => {
    const colW = 100;
    return {
      top:    `${(drag.startMinutes / 1440) * 100}%`,
      height: `${(drag.duration / 1440) * 100}%`,
      left:   `${0.5}%`,
      width:  `calc(${colW}% - 4px)`,
      right:  'auto' as const,
    };
  };

  const getBorderColor = (t: Task): string => {
    for (const fid of ['priority', 'category'] as const) {
      const val = (t as unknown as Record<string, string>)[fid];
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

  // default fields visible unless explicitly turned off; custom fields need opt-in
  const calendarFields = fields.filter(f =>
    f.type === 'select' &&
    (f.isDefault ? f.showOnCalendar !== false : f.showOnCalendar === true)
  );

  const getTagBadges = (t: Task) => {
    const badges: { label: string; color: string }[] = [];
    for (const field of calendarFields) {
      const val = field.isDefault
        ? (t as unknown as Record<string, string>)[field.id]
        : t.customFields?.[field.id];
      if (!val) continue;
      const opt = field.options?.find(o => o.value === val);
      if (opt) badges.push({ label: opt.label, color: opt.color ?? 'var(--gray-3)' });
    }
    return badges;
  };

  const dragPreviewStyle = (dayIndex: number) => {
    if (!drag || drag.type !== 'create' || drag.dayIndex !== dayIndex) return null;
    const s = Math.min(drag.startMinutes, drag.endMinutes);
    const e = Math.max(drag.startMinutes, drag.endMinutes);
    return { top: `${(s / 1440) * 100}%`, height: `${((e - s) / 1440) * 100}%` };
  };

  const movingTaskId = drag?.type === 'move' ? drag.taskId : null;

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
      <div
        className="week-view__body"
        ref={gridRef}
        onMouseMove={handleBodyMouseMove}
        onMouseUp={handleBodyMouseUp}
        onMouseLeave={handleBodyMouseUp}
      >
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
          const dayTasks = tasks.filter(t => dayjs(t.startTime).isSame(weekStart.add(i, 'day'), 'day'));
          const layouts  = computeLayouts(dayTasks);
          const ds       = dragPreviewStyle(i);
          const isMovingHere = drag?.type === 'move' && drag.dayIndex === i;

          return (
            <div
              key={i}
              className={`week-view__day-col week-view__day-col${type}`}
              onMouseDown={e => handleColMouseDown(e, i)}
              onMouseMove={e => handleColMouseMove(e, i)}
              onMouseUp={() => handleColMouseUp(i)}
              onMouseLeave={() => { if (drag?.type === 'create' && drag.dayIndex === i) handleColMouseUp(i); }}
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

              {/* Create drag ghost */}
              {ds && <div className="week-view__drag-preview" style={ds} />}

              {/* Move ghost */}
              {isMovingHere && drag?.type === 'move' && (
                <div
                  className="week-view__move-ghost"
                  style={moveGhostStyle(drag)}
                />
              )}

              {/* Tasks */}
              {layouts.map(layout => {
                const t      = layout.task;
                const isMoving = t.id === movingTaskId;
                const badges = getTagBadges(t);
                return (
                  <div
                    key={t.id}
                    className={`week-view__task ${getColorClass(t)}${t.source === 'notion' ? ' notion' : ''}${isMoving ? ' moving' : ''}`}
                    style={{ ...taskPositionStyle(t, layout), borderLeftColor: getBorderColor(t) }}
                    onMouseDown={e => handleTaskMouseDown(e, t, i)}
                    onClick={e => { if (!movingTaskId) { e.stopPropagation(); onEditTask(t); } }}
                  >
                    <span className="week-view__task-title">{t.title}</span>
                    {badges.length > 0 && (
                      <div className="week-view__task-meta">
                        {badges.map((b, bi) => (
                          <span key={bi} className="week-view__task-badge" style={{ color: b.color }}>
                            {b.label.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

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
