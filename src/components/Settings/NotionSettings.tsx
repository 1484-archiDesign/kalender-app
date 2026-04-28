import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import './NotionSettings.css';

interface Props { onSaved?: () => void; }

export default function NotionSettings({ onSaved }: Props) {
  const { notionConfig, setNotionConfig, clearNotionConfig, setNotionSettingsOpen } = useAppStore();
  const [form, setForm] = useState({
    apiKey: '',
    databaseId: '',
    titleField: 'Name',
    startField: 'Date',
    endField: '',
    categoryField: '',
    progressField: '',
    priorityField: '',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (notionConfig) {
      setForm({
        apiKey: notionConfig.apiKey,
        databaseId: notionConfig.databaseId,
        titleField: notionConfig.fieldMapping.title,
        startField: notionConfig.fieldMapping.startTime,
        endField: notionConfig.fieldMapping.endTime ?? '',
        categoryField: notionConfig.fieldMapping.category ?? '',
        progressField: notionConfig.fieldMapping.progress ?? '',
        priorityField: notionConfig.fieldMapping.priority ?? '',
      });
    }
  }, [notionConfig]);

  const handleSave = () => {
    if (!form.apiKey.trim() || !form.databaseId.trim()) return;
    setNotionConfig({
      apiKey: form.apiKey.trim(),
      databaseId: form.databaseId.trim(),
      fieldMapping: {
        title: form.titleField || 'Name',
        startTime: form.startField || 'Date',
        endTime: form.endField || undefined,
        category: form.categoryField || undefined,
        progress: form.progressField || undefined,
        priority: form.priorityField || undefined,
      },
    });
    onSaved?.();
    setNotionSettingsOpen(false);
  };

  const handleTest = async () => {
    if (!form.apiKey || !form.databaseId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notion-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: form.apiKey, databaseId: form.databaseId, limit: 1 }),
      });
      if (res.ok) {
        setTestResult('✓ Connection successful');
      } else {
        const data = await res.json();
        setTestResult(`✗ ${data.error ?? 'Connection failed'}`);
      }
    } catch {
      setTestResult('✗ Network error — is the server running?');
    }
    setTesting(false);
  };

  return (
    <div className="overlay" onClick={() => setNotionSettingsOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>NOTION INTEGRATION</h2>
          <button className="modal__close btn btn--icon" onClick={() => setNotionSettingsOpen(false)}>✕</button>
        </div>

        <div className="modal__body">
          <div className="notion-settings__intro">
            Notion DB → カレンダーへの一方向同期。
            5分ごとに自動取得します。
          </div>

          <div className="section-label">Authentication</div>

          <div className="form-group">
            <label>Notion API Key</label>
            <input
              type="password"
              placeholder="secret_xxxxxxxxxxxx"
              value={form.apiKey}
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Database ID</label>
            <input
              type="text"
              placeholder="32-char ID from Notion URL"
              value={form.databaseId}
              onChange={e => setForm(f => ({ ...f, databaseId: e.target.value }))}
            />
          </div>

          <div className="section-label">Field Mapping</div>
          <p className="notion-settings__hint">NotionのプロパティID / 名前を入力してください</p>

          <div className="form-row">
            <div className="form-group">
              <label>Title field</label>
              <input type="text" value={form.titleField} onChange={e => setForm(f => ({ ...f, titleField: e.target.value }))} placeholder="Name" />
            </div>
            <div className="form-group">
              <label>Start date field</label>
              <input type="text" value={form.startField} onChange={e => setForm(f => ({ ...f, startField: e.target.value }))} placeholder="Date" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End date field (optional)</label>
              <input type="text" value={form.endField} onChange={e => setForm(f => ({ ...f, endField: e.target.value }))} placeholder="EndDate" />
            </div>
            <div className="form-group">
              <label>Category field (optional)</label>
              <input type="text" value={form.categoryField} onChange={e => setForm(f => ({ ...f, categoryField: e.target.value }))} placeholder="Category" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Progress field (optional)</label>
              <input type="text" value={form.progressField} onChange={e => setForm(f => ({ ...f, progressField: e.target.value }))} placeholder="Status" />
            </div>
            <div className="form-group">
              <label>Priority field (optional)</label>
              <input type="text" value={form.priorityField} onChange={e => setForm(f => ({ ...f, priorityField: e.target.value }))} placeholder="Priority" />
            </div>
          </div>

          {testResult && (
            <div className={`notion-settings__test-result${testResult.startsWith('✓') ? ' ok' : ' ng'}`}>
              {testResult}
            </div>
          )}
        </div>

        <div className="modal__footer">
          {notionConfig && (
            <button className="btn btn--sm btn--red" onClick={() => { clearNotionConfig(); setNotionSettingsOpen(false); }}>
              DISCONNECT
            </button>
          )}
          <button className="btn btn--sm" onClick={handleTest} disabled={testing}>
            {testing ? '...' : 'TEST'}
          </button>
          <button className="btn btn--sm" onClick={() => setNotionSettingsOpen(false)}>CANCEL</button>
          <button className="btn btn--primary btn--sm" onClick={handleSave}>SAVE</button>
        </div>
      </div>
    </div>
  );
}
