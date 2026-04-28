import { useAppStore } from '../../store/useAppStore';
import './TagFilterPanel.css';

export default function TagFilterPanel() {
  const { fields, updateField } = useAppStore();
  const selectFields = fields.filter(f => f.type === 'select');

  const isVisible = (f: typeof fields[0]) =>
    f.isDefault ? f.showOnCalendar !== false : f.showOnCalendar === true;

  return (
    <aside className="tag-filter">
      <div className="tag-filter__header mono">TAGS</div>
      <div className="tag-filter__list">
        {selectFields.map(field => {
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
                {field.options?.slice(0, 3).map(o => (
                  <span
                    key={o.value}
                    className="tag-filter__dot"
                    style={{ background: o.color ?? '#888' }}
                  />
                ))}
              </span>
            </label>
          );
        })}
        {selectFields.length === 0 && (
          <p className="tag-filter__empty mono">no fields</p>
        )}
      </div>
    </aside>
  );
}
