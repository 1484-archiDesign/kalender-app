import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import type { Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import './TaskModal.css';

interface Props {
  task: Partial<Task> | null;
  onClose: () => void;
  onSave:   (task: Task) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskModal({ task, onClose, onSave, onDelete }: Props) {
  const { fields } = useAppStore();
  const isNew    = !task?.id;
  const isNotion = task?.source === 'notion';

  const [form, setForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    category: '',
    progress: '',
    priority: '',
    customFields: {} as Record<string, string>,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title:        task.title ?? '',
        startTime:    task.startTime ? dayjs(task.startTime).format('YYYY-MM-DDTHH:mm') : '',
        endTime:      task.endTime   ? dayjs(task.endTime).format('YYYY-MM-DDTHH:mm')   : '',
        category:     task.category  ?? '',
        progress:     task.progress  ?? '',
        priority:     task.priority  ?? '',
        customFields: task.customFields ?? {},
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.startTime || !form.endTime) return;
    setSaving(true);
    const built: Task = {
      id:           task?.id ?? crypto.randomUUID(),
      source:       'local',
      title:        form.title.trim(),
      startTime:    dayjs(form.startTime).toISOString(),
      endTime:      dayjs(form.endTime).toISOString(),
      category:     form.category  || undefined,
      progress:     form.progress  || undefined,
      priority:     form.priority  || undefined,
      customFields: Object.keys(form.customFields).length ? form.customFields : undefined,
    };
    await onSave(built);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    setSaving(true);
    await onDelete(task.id);
    setSaving(false);
    onClose();
  };

  const customFields = fields.filter(f => !f.isDefault);

  if (!task) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{isNew ? 'NEW TASK' : isNotion ? 'NOTION TASK' : 'EDIT TASK'}</h2>
          <button className="modal__close btn btn--icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          {isNotion && (
            <div className="task-modal__notion-badge">
              <span className="mono">N</span> Synced from Notion — read only
            </div>
          )}

          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="タスク名を入力"
              disabled={isNotion}
              autoFocus={isNew}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                disabled={isNotion}
              />
            </div>
            <div className="form-group">
              <label>End</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                disabled={isNotion}
              />
            </div>
          </div>

          {/* Default select fields */}
          {fields.filter(f => f.isDefault && f.type === 'select').map(field => (
            <div key={field.id} className="form-group">
              <label>{field.name}</label>
              <div className="task-modal__select-wrap">
                <select
                  value={(form as unknown as Record<string, string>)[field.id] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}
                  disabled={isNotion}
                >
                  <option value="">—</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {(form as unknown as Record<string, string>)[field.id] && (() => {
                  const opt = field.options?.find(o => o.value === (form as unknown as Record<string, string>)[field.id]);
                  return opt?.color
                    ? <span className="task-modal__color-dot" style={{ background: opt.color }} />
                    : null;
                })()}
              </div>
            </div>
          ))}

          {/* Custom fields */}
          {customFields.length > 0 && (
            <div className="section-label">Custom Fields</div>
          )}
          {customFields.map(field => (
            <div key={field.id} className="form-group">
              <label>{field.name}</label>
              {field.type === 'select' ? (
                <select
                  value={form.customFields[field.id] ?? ''}
                  onChange={e => setForm(f => ({
                    ...f, customFields: { ...f.customFields, [field.id]: e.target.value },
                  }))}
                  disabled={isNotion}
                >
                  <option value="">—</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.customFields[field.id] ?? ''}
                  onChange={e => setForm(f => ({
                    ...f, customFields: { ...f.customFields, [field.id]: e.target.value },
                  }))}
                  disabled={isNotion}
                />
              )}
            </div>
          ))}
        </div>

        <div className="modal__footer">
          {!isNew && !isNotion && (
            <button className="btn btn--red btn--sm" onClick={handleDelete} disabled={saving}>
              DELETE
            </button>
          )}
          <button className="btn btn--sm" onClick={onClose} disabled={saving}>CANCEL</button>
          {!isNotion && (
            <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
              {saving ? '…' : isNew ? 'CREATE' : 'SAVE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
