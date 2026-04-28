import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import type { Task } from './types';
import { useNotionSync } from './hooks/useNotionSync';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { isSupabaseEnabled } from './lib/supabase';
import CalendarHeader from './components/Calendar/CalendarHeader';
import WeekView from './components/Calendar/WeekView';
import MonthView from './components/Calendar/MonthView';
import TaskModal from './components/Task/TaskModal';
import FieldSettings from './components/Settings/FieldSettings';
import NotionSettings from './components/Settings/NotionSettings';
import TagFilterPanel from './components/TagFilter/TagFilterPanel';
import './App.css';

export default function App() {
  const { view, settingsOpen, notionSettingsOpen, syncing, fields, notionConfig } = useAppStore();
  const [taskModal, setTaskModal] = useState<Partial<Task> | null>(null);

  const { sbUpsertTask, sbDeleteTask, sbSaveSettings } = useSupabaseSync();
  useNotionSync();

  const store = useAppStore();

  // ── fields / notionConfig が変わるたびに Supabase へ自動保存 ──
  const fieldsInitRef   = useRef(false);
  const notionInitRef   = useRef(false);

  useEffect(() => {
    if (!fieldsInitRef.current) { fieldsInitRef.current = true; return; }
    if (!isSupabaseEnabled) return;
    const t = setTimeout(() => sbSaveSettings('fields', useAppStore.getState().fields), 600);
    return () => clearTimeout(t);
  }, [fields]);

  useEffect(() => {
    if (!notionInitRef.current) { notionInitRef.current = true; return; }
    if (!isSupabaseEnabled || !notionConfig) return;
    sbSaveSettings('notion_config', notionConfig);
  }, [notionConfig]);

  // ── タスク操作 ──
  const handleCreateTask = useCallback((start: string, end: string) => {
    setTaskModal({ startTime: start, endTime: end, source: 'local' });
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskModal(task);
  }, []);

  const handleSaveTask = useCallback(async (task: Task) => {
    const isNew = !store.tasks.find(t => t.id === task.id);
    if (isNew) { store.addTask(task); } else { store.updateTask(task.id, task); }
    if (isSupabaseEnabled) await sbUpsertTask(task);
  }, [store, sbUpsertTask]);

  const handleDeleteTask = useCallback(async (id: string) => {
    store.deleteTask(id);
    if (isSupabaseEnabled) await sbDeleteTask(id);
  }, [store, sbDeleteTask]);

  const handleMoveTask = useCallback(async (id: string, startTime: string, endTime: string) => {
    store.updateTask(id, { startTime, endTime });
    if (isSupabaseEnabled) {
      const task = store.tasks.find(t => t.id === id);
      if (task) await sbUpsertTask({ ...task, startTime, endTime });
    }
  }, [store, sbUpsertTask]);

  return (
    <div className="app">
      <CalendarHeader />

      {syncing && (
        <div className="app__sync-bar">
          <span className="mono">SYNCING…</span>
        </div>
      )}

      <main className="app__main">
        {view === 'week' ? (
          <WeekView onCreateTask={handleCreateTask} onEditTask={handleEditTask} onMoveTask={handleMoveTask} />
        ) : (
          <MonthView onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
        )}
        <TagFilterPanel />
      </main>

      {taskModal !== null && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
      {settingsOpen && <FieldSettings />}
      {notionSettingsOpen && <NotionSettings />}
    </div>
  );
}
