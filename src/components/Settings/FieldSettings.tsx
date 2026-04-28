import { useState } from 'react';
import type { FieldDefinition, FieldOption } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import './FieldSettings.css';

const PRESET_COLORS = [
  '#D62B2B', '#1B4D8E', '#F5C400', '#2A7A3B',
  '#8A3A8A', '#E87820', '#2A7A7A', '#8A8378',
];

interface Props { onSaved?: () => void; }

export default function FieldSettings({ onSaved }: Props) {
  const { fields, addField, updateField, deleteField, setSettingsOpen } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'select' | 'text'>('select');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const id = crypto.randomUUID();
    addField({
      id,
      name: newFieldName.trim(),
      type: newFieldType,
      options: newFieldType === 'select' ? [] : undefined,
    });
    setNewFieldName('');
    setExpandedId(id);
    onSaved?.();
  };

  return (
    <div className="overlay" onClick={() => setSettingsOpen(false)}>
      <div className="modal modal--wide fs-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>FIELD SETTINGS</h2>
          <button className="modal__close btn btn--icon" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>

        <div className="modal__body">

          {fields.map(field => (
            <FieldRow
              key={field.id}
              field={field}
              isExpanded={expandedId === field.id}
              onToggle={() => setExpandedId(expandedId === field.id ? null : field.id)}
              onDelete={() => { deleteField(field.id); }}
              onUpdateField={(updates) => updateField(field.id, updates)}
            />
          ))}

          {/* ── Add new field ── */}
          <div className="fs-add">
            <p className="section-label">NEW FIELD</p>
            <div className="fs-add__row">
              <input
                type="text"
                className="fs-add__name"
                placeholder="フィールド名（例：場所）"
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddField()}
              />
              <div className="fs-add__type-toggle">
                <button
                  className={`fs-add__type-btn${newFieldType === 'select' ? ' active' : ''}`}
                  onClick={() => setNewFieldType('select')}
                >SELECT</button>
                <button
                  className={`fs-add__type-btn${newFieldType === 'text' ? ' active' : ''}`}
                  onClick={() => setNewFieldType('text')}
                >TEXT</button>
              </div>
              <button className="btn btn--primary btn--sm" onClick={handleAddField}>+ ADD</button>
            </div>
          </div>

        </div>

        <div className="modal__footer">
          <button className="btn btn--primary btn--sm" onClick={() => setSettingsOpen(false)}>DONE</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FIELD ROW
   ════════════════════════════════ */
interface FieldRowProps {
  field: FieldDefinition;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateField: (updates: Partial<FieldDefinition>) => void;
}

function FieldRow({ field, isExpanded, onToggle, onDelete, onUpdateField }: FieldRowProps) {
  const [newOptLabel, setNewOptLabel]   = useState('');
  const [newOptColor, setNewOptColor]   = useState(PRESET_COLORS[0]);

  const addOption = () => {
    if (!newOptLabel.trim()) return;
    const opt: FieldOption = {
      value: newOptLabel.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newOptLabel.trim(),
      color: newOptColor,
    };
    onUpdateField({ options: [...(field.options ?? []), opt] });
    setNewOptLabel('');
    setNewOptColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const removeOption = (value: string) =>
    onUpdateField({ options: field.options?.filter(o => o.value !== value) });

  const updateOptionColor = (value: string, color: string) =>
    onUpdateField({ options: field.options?.map(o => o.value === value ? { ...o, color } : o) });

  const updateOptionLabel = (value: string, label: string) =>
    onUpdateField({ options: field.options?.map(o => o.value === value ? { ...o, label } : o) });

  return (
    <div className={`fs-row${isExpanded ? ' expanded' : ''}`}>
      {/* Header */}
      <div className="fs-row__header" onClick={onToggle}>
        <div className="fs-row__left">
          <span className="fs-row__chevron">{isExpanded ? '▼' : '▶'}</span>
          <span className="fs-row__name">{field.name}</span>
          <span className="tag">{field.type}</span>
          {field.isDefault && <span className="tag fs-row__default-tag">DEFAULT</span>}
        </div>
        <div className="fs-row__right" onClick={e => e.stopPropagation()}>
          {/* Color preview dots */}
          {field.options?.slice(0, 4).map(o => (
            <span key={o.value} className="fs-row__dot" style={{ background: o.color ?? '#888' }} />
          ))}
          {!field.isDefault && (
            <button className="btn btn--red btn--sm" onClick={onDelete}>✕</button>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="fs-row__body">
          {/* Rename */}
          <div className="fs-row__rename-row">
            <label>フィールド名</label>
            <input
              type="text"
              defaultValue={field.name}
              onBlur={e => onUpdateField({ name: e.target.value.trim() || field.name })}
            />
          </div>

          {/* Options list (select type only) */}
          {field.type === 'select' && (
            <>
              <p className="fs-row__section-title">
                選択肢 <span>{field.options?.length ?? 0}件</span>
              </p>

              <div className="fs-opts">
                {field.options?.map(opt => (
                  <div key={opt.value} className="fs-opt">
                    {/* Color swatch + picker */}
                    <div className="fs-opt__color-wrap">
                      <span className="fs-opt__swatch" style={{ background: opt.color ?? '#888' }} />
                      <input
                        type="color"
                        value={opt.color ?? '#888888'}
                        onChange={e => updateOptionColor(opt.value, e.target.value)}
                        className="fs-opt__color-input"
                        title="色を変更"
                      />
                    </div>
                    <input
                      type="text"
                      defaultValue={opt.label}
                      onBlur={e => updateOptionLabel(opt.value, e.target.value)}
                      className="fs-opt__label-input"
                    />
                    <button
                      className="fs-opt__remove"
                      onClick={() => removeOption(opt.value)}
                      title="削除"
                    >✕</button>
                  </div>
                ))}

                {/* ── Add option inline ── */}
                <div className="fs-opt fs-opt--new">
                  {/* Color presets */}
                  <div className="fs-opt__presets">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        className={`fs-opt__preset${newOptColor === c ? ' selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setNewOptColor(c)}
                        title={c}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="新しい選択肢（例：東京オフィス）"
                    value={newOptLabel}
                    onChange={e => setNewOptLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addOption()}
                    className="fs-opt__label-input"
                  />
                  <button className="btn btn--primary btn--sm" onClick={addOption}>+ ADD</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
