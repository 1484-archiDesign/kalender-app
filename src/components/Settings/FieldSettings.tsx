import { useState } from 'react';
import type { FieldDefinition, FieldOption } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import './FieldSettings.css';

export default function FieldSettings() {
  const { fields, addField, updateField, deleteField, setSettingsOpen } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'select' | 'text'>('select');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    addField({
      id: crypto.randomUUID(),
      name: newFieldName.trim(),
      type: newFieldType,
      options: newFieldType === 'select' ? [] : undefined,
    });
    setNewFieldName('');
  };

  const handleAddOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const label = prompt('選択肢のラベルを入力');
    if (!label?.trim()) return;
    const newOpt: FieldOption = {
      value: label.trim().toLowerCase().replace(/\s+/g, '_'),
      label: label.trim(),
      color: '#8A8580',
    };
    updateField(fieldId, { options: [...(field.options ?? []), newOpt] });
  };

  const handleRemoveOption = (fieldId: string, optValue: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: field.options?.filter(o => o.value !== optValue) });
  };

  const handleOptionColorChange = (fieldId: string, optValue: string, color: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, {
      options: field.options?.map(o => o.value === optValue ? { ...o, color } : o),
    });
  };

  const handleOptionLabelChange = (fieldId: string, optValue: string, label: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, {
      options: field.options?.map(o => o.value === optValue ? { ...o, label } : o),
    });
  };

  return (
    <div className="overlay" onClick={() => setSettingsOpen(false)}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>FIELD SETTINGS</h2>
          <button className="modal__close btn btn--icon" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>

        <div className="modal__body">
          {fields.map(field => (
            <FieldRow
              key={field.id}
              field={field}
              isExpanded={editingId === field.id}
              onToggle={() => setEditingId(editingId === field.id ? null : field.id)}
              onDelete={() => !field.isDefault && deleteField(field.id)}
              onAddOption={() => handleAddOption(field.id)}
              onRemoveOption={(v) => handleRemoveOption(field.id, v)}
              onColorChange={(v, c) => handleOptionColorChange(field.id, v, c)}
              onLabelChange={(v, l) => handleOptionLabelChange(field.id, v, l)}
              onRename={(name) => updateField(field.id, { name })}
            />
          ))}

          {/* Add new field */}
          <div className="field-settings__add">
            <div className="section-label">ADD NEW FIELD</div>
            <div className="field-settings__add-row">
              <input
                type="text"
                placeholder="フィールド名"
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddField()}
              />
              <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as 'select' | 'text')}>
                <option value="select">Select</option>
                <option value="text">Text</option>
              </select>
              <button className="btn btn--primary btn--sm" onClick={handleAddField}>+ ADD</button>
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--sm btn--primary" onClick={() => setSettingsOpen(false)}>DONE</button>
        </div>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: FieldDefinition;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddOption: () => void;
  onRemoveOption: (v: string) => void;
  onColorChange: (v: string, c: string) => void;
  onLabelChange: (v: string, l: string) => void;
  onRename: (name: string) => void;
}

function FieldRow({ field, isExpanded, onToggle, onDelete, onAddOption, onRemoveOption, onColorChange, onLabelChange, onRename }: FieldRowProps) {
  return (
    <div className="field-row">
      <div className="field-row__header" onClick={onToggle}>
        <div className="field-row__meta">
          <span className="field-row__name">{field.name}</span>
          <span className="tag">{field.type}</span>
          {field.isDefault && <span className="tag" style={{ color: 'var(--gray-3)', borderColor: 'var(--gray-2)' }}>default</span>}
        </div>
        <div className="field-row__actions" onClick={e => e.stopPropagation()}>
          {!field.isDefault && (
            <button className="btn btn--sm btn--red" onClick={onDelete}>✕</button>
          )}
          <span className="field-row__toggle">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="field-row__body">
          <div className="field-row__rename">
            <input
              type="text"
              defaultValue={field.name}
              onBlur={e => onRename(e.target.value)}
              placeholder="フィールド名"
            />
          </div>

          {field.type === 'select' && (
            <div className="field-row__options">
              <div className="section-label">OPTIONS</div>
              {field.options?.map(opt => (
                <div key={opt.value} className="field-row__option">
                  <input
                    type="color"
                    value={opt.color ?? '#8A8580'}
                    onChange={e => onColorChange(opt.value, e.target.value)}
                    className="field-row__color-input"
                    title="色を変更"
                  />
                  <input
                    type="text"
                    defaultValue={opt.label}
                    onBlur={e => onLabelChange(opt.value, e.target.value)}
                    className="field-row__option-label"
                  />
                  <button className="btn btn--sm btn--icon" onClick={() => onRemoveOption(opt.value)}>✕</button>
                </div>
              ))}
              <button className="btn btn--sm" onClick={onAddOption}>+ Add Option</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
