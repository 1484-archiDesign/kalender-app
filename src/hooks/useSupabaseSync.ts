import { useEffect, useRef } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { Task, FieldDefinition, NotionConfig } from '../types';

// ── DB row → Task ──────────────────────────────
function rowToTask(r: Record<string, unknown>): Task {
  return {
    id:           r.id as string,
    title:        r.title as string,
    startTime:    r.start_time as string,
    endTime:      r.end_time as string,
    category:     (r.category as string) || undefined,
    progress:     (r.progress as string) || undefined,
    priority:     (r.priority as string) || undefined,
    customFields: (r.custom_fields as Record<string, string>) || undefined,
    source:       (r.source as 'local' | 'notion') || 'local',
    notionId:     (r.notion_id as string) || undefined,
    color:        (r.color as string) || undefined,
  };
}

// ── Task → DB row ──────────────────────────────
function taskToRow(t: Task) {
  return {
    id:            t.id,
    title:         t.title,
    start_time:    t.startTime,
    end_time:      t.endTime,
    category:      t.category ?? null,
    progress:      t.progress ?? null,
    priority:      t.priority ?? null,
    custom_fields: t.customFields ?? {},
    source:        t.source,
    notion_id:     t.notionId ?? null,
    color:         t.color ?? null,
    updated_at:    new Date().toISOString(),
  };
}

export function useSupabaseSync() {
  const store      = useAppStore();
  const initialised = useRef(false);

  // ── 起動時に全データをSupabaseから取得 ──────────
  useEffect(() => {
    if (!isSupabaseEnabled || initialised.current) return;
    initialised.current = true;
    loadAll();

    // ウィンドウがフォーカスされたら再取得（他デバイスの変更を反映）
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function loadAll() {
    if (!supabase) return;
    try {
      // tasks
      const { data: taskRows } = await supabase
        .from('tasks')
        .select('*')
        .order('start_time');
      if (taskRows) {
        const localTasks   = (taskRows as Record<string,unknown>[])
          .filter(r => r.source === 'local')
          .map(rowToTask);
        const notionTasks  = (taskRows as Record<string,unknown>[])
          .filter(r => r.source === 'notion')
          .map(rowToTask);
        store.setAllTasks([...localTasks, ...notionTasks]);
      }

      // fields
      const { data: fieldRow } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'fields')
        .maybeSingle();
      if (fieldRow?.value) {
        store.setFields(fieldRow.value as FieldDefinition[]);
      }

      // notion config
      const { data: notionRow } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'notion_config')
        .maybeSingle();
      if (notionRow?.value) {
        store.setNotionConfig(notionRow.value as NotionConfig);
      }
    } catch {
      // Supabase未設定 or ネットワークエラー → localStorageで継続
    }
  }

  // ── Supabase書き込みヘルパー ───────────────────
  async function sbUpsertTask(task: Task) {
    if (!supabase) return;
    await supabase.from('tasks').upsert(taskToRow(task));
  }

  async function sbDeleteTask(id: string) {
    if (!supabase) return;
    await supabase.from('tasks').delete().eq('id', id);
  }

  async function sbSaveSettings(key: string, value: unknown) {
    if (!supabase) return;
    await supabase.from('app_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });
  }

  return { sbUpsertTask, sbDeleteTask, sbSaveSettings, loadAll };
}
