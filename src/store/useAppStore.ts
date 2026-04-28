import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, FieldDefinition, NotionConfig, CalendarView } from '../types';
import dayjs from 'dayjs';

const DEFAULT_FIELDS: FieldDefinition[] = [
  {
    id: 'category',
    name: 'カテゴリ',
    type: 'select',
    isDefault: true,
    options: [
      { value: 'work',     label: 'Work',     color: '#1B4D8E' },
      { value: 'personal', label: 'Personal', color: '#D62B2B' },
      { value: 'other',    label: 'Other',    color: '#F5C400' },
    ],
  },
  {
    id: 'progress',
    name: '進捗',
    type: 'select',
    isDefault: true,
    options: [
      { value: 'todo',       label: 'TODO',        color: '#8A8378' },
      { value: 'inprogress', label: 'IN PROGRESS', color: '#1B4D8E' },
      { value: 'done',       label: 'DONE',        color: '#2A7A3B' },
    ],
  },
  {
    id: 'priority',
    name: '優先度',
    type: 'select',
    isDefault: true,
    options: [
      { value: 'high',   label: 'HIGH',   color: '#D62B2B' },
      { value: 'medium', label: 'MEDIUM', color: '#F5C400' },
      { value: 'low',    label: 'LOW',    color: '#8A8378' },
    ],
  },
];

interface AppState {
  tasks: Task[];
  fields: FieldDefinition[];
  view: CalendarView;
  currentDate: string;
  notionConfig: NotionConfig | null;
  settingsOpen: boolean;
  notionSettingsOpen: boolean;
  syncing: boolean;

  // ── Task operations ──
  addTask:        (task: Task) => void;
  updateTask:     (id: string, updates: Partial<Task>) => void;
  deleteTask:     (id: string) => void;
  syncNotionTasks:(tasks: Task[]) => void;
  setAllTasks:    (tasks: Task[]) => void;      // Supabase hydration

  // ── Navigation ──
  setView:        (view: CalendarView) => void;
  setCurrentDate: (date: string) => void;
  navigatePrev:   () => void;
  navigateNext:   () => void;
  navigateToday:  () => void;

  // ── Fields ──
  addField:    (field: FieldDefinition) => void;
  updateField: (id: string, updates: Partial<FieldDefinition>) => void;
  deleteField: (id: string) => void;
  setFields:   (fields: FieldDefinition[]) => void; // Supabase hydration

  // ── Notion config ──
  setNotionConfig:   (config: NotionConfig) => void;
  clearNotionConfig: () => void;

  // ── UI ──
  setSettingsOpen:      (open: boolean) => void;
  setNotionSettingsOpen:(open: boolean) => void;
  setSyncing:           (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      fields: DEFAULT_FIELDS,
      view: 'week',
      currentDate: dayjs().startOf('week').toISOString(),
      notionConfig: null,
      settingsOpen: false,
      notionSettingsOpen: false,
      syncing: false,

      // Tasks
      addTask:    (task)    => set(s => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, upd) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...upd } : t) })),
      deleteTask: (id)      => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      setAllTasks:(tasks)   => set({ tasks }),
      syncNotionTasks: (notionTasks) =>
        set(s => ({
          tasks: [...s.tasks.filter(t => t.source === 'local'), ...notionTasks],
        })),

      // Navigation
      setView:        (view) => set({ view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      navigatePrev: () => {
        const { view, currentDate } = get();
        const unit = view === 'week' ? 'week' : 'month';
        set({ currentDate: dayjs(currentDate).subtract(1, unit).toISOString() });
      },
      navigateNext: () => {
        const { view, currentDate } = get();
        const unit = view === 'week' ? 'week' : 'month';
        set({ currentDate: dayjs(currentDate).add(1, unit).toISOString() });
      },
      navigateToday: () => {
        const { view } = get();
        const unit = view === 'week' ? 'week' : 'month';
        set({ currentDate: dayjs().startOf(unit).toISOString() });
      },

      // Fields
      addField:    (f)      => set(s => ({ fields: [...s.fields, f] })),
      updateField: (id, upd)=> set(s => ({ fields: s.fields.map(f => f.id === id ? { ...f, ...upd } : f) })),
      deleteField: (id)     => set(s => ({ fields: s.fields.filter(f => f.id !== id) })),
      setFields:   (fields) => set({ fields }),

      // Notion
      setNotionConfig:   (config) => set({ notionConfig: config }),
      clearNotionConfig: ()       => set({ notionConfig: null }),

      // UI
      setSettingsOpen:       (open) => set({ settingsOpen: open }),
      setNotionSettingsOpen: (open) => set({ notionSettingsOpen: open }),
      setSyncing:            (v)    => set({ syncing: v }),
    }),
    { name: 'bauhaus-calendar-store' }
  )
);
