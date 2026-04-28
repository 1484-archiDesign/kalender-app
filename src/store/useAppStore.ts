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
      { value: 'work', label: 'Work', color: '#1B4D8E' },
      { value: 'personal', label: 'Personal', color: '#E63329' },
      { value: 'other', label: 'Other', color: '#F5C400' },
    ],
  },
  {
    id: 'progress',
    name: '進捗',
    type: 'select',
    isDefault: true,
    options: [
      { value: 'todo', label: 'TODO', color: '#8A8A8A' },
      { value: 'inprogress', label: 'IN PROGRESS', color: '#1B4D8E' },
      { value: 'done', label: 'DONE', color: '#2A7A2A' },
    ],
  },
  {
    id: 'priority',
    name: '優先度',
    type: 'select',
    isDefault: true,
    options: [
      { value: 'high', label: 'HIGH', color: '#E63329' },
      { value: 'medium', label: 'MEDIUM', color: '#F5C400' },
      { value: 'low', label: 'LOW', color: '#8A8A8A' },
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

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  syncNotionTasks: (tasks: Task[]) => void;

  setView: (view: CalendarView) => void;
  setCurrentDate: (date: string) => void;
  navigatePrev: () => void;
  navigateNext: () => void;
  navigateToday: () => void;

  addField: (field: FieldDefinition) => void;
  updateField: (id: string, updates: Partial<FieldDefinition>) => void;
  deleteField: (id: string) => void;

  setNotionConfig: (config: NotionConfig) => void;
  clearNotionConfig: () => void;

  setSettingsOpen: (open: boolean) => void;
  setNotionSettingsOpen: (open: boolean) => void;
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

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      syncNotionTasks: (notionTasks) =>
        set((s) => {
          const localTasks = s.tasks.filter((t) => t.source === 'local');
          return { tasks: [...localTasks, ...notionTasks] };
        }),

      setView: (view) => set({ view }),
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

      addField: (field) => set((s) => ({ fields: [...s.fields, field] })),
      updateField: (id, updates) =>
        set((s) => ({
          fields: s.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),
      deleteField: (id) =>
        set((s) => ({ fields: s.fields.filter((f) => f.id !== id) })),

      setNotionConfig: (config) => set({ notionConfig: config }),
      clearNotionConfig: () => set({ notionConfig: null }),

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setNotionSettingsOpen: (open) => set({ notionSettingsOpen: open }),
    }),
    {
      name: 'bauhaus-calendar-store',
    }
  )
);
