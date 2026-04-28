import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import './TagFilterPanel.css';

const MIN_W = 80;
const MAX_W = 320;
const DEFAULT_W = 120;

export default function TagFilterPanel() {
  const { fields, updateField } = useAppStore();
  const [width, setWidth] = useState(DEFAULT_W);
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startW   = useRef(DEFAULT_W);

  const isVisible = (f: typeof fields[0]) =>
    f.isDefault ? f.showOnCalendar !== false : f.showOnCalendar === true;

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current   = e.clientX;
    startW.current   = width;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - ev.clientX;
      setWidth(Math.min(MAX_W, Math.max(MIN_W, startW.current + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [width]);

  return (
    <aside className="tag-filter" style={{ width }}>
      <div className="tag-filter__resize-handle" onMouseDown={handleResizeMouseDown} />

      <div className="tag-filter__header mono">TAGS</div>
      <div className="tag-filter__list">
        {fields.map(field => {
          const visible = isVisible(field);
          return (
            <label key={field.id} className={`tag-filter__row${visible ? ' active' : ''}`}>
              <input
                type="checkbox"
                className="tag-filter__checkbox"
                checked={visible}
                onChange={() => updateField(field.id, { showOnCalendar: !visible })}
              />
              <span className="tag-filter__name">{field.name}</span>
              <span className="tag-filter__dots">
                {field.type === 'select'
                  ? field.options?.slice(0, 3).map(o => (
                      <span key={o.value} className="tag-filter__dot" style={{ background: o.color ?? '#888' }} />
                    ))
                  : <span className="tag-filter__type-label mono">Aa</span>
                }
              </span>
            </label>
          );
        })}
        {fields.length === 0 && (
          <p className="tag-filter__empty mono">no fields</p>
        )}
      </div>
    </aside>
  );
}
