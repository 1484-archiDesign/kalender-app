import { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import type { Task } from './types';
import { useNotionSync } from './hooks/useNotionSync';
import CalendarHeader from './components/Calendar/CalendarHeader';
import WeekView from './components/Calendar/WeekView';
import MonthView from './components/Calendar/MonthView';
import TaskModal from './components/Task/TaskModal';
import FieldSettings from './components/Settings/FieldSettings';
import NotionSettings from './components/Settings/NotionSettings';
import './App.css';

export default function App() {
  const { view, settingsOpen, notionSettingsOpen } = useAppStore();
  const [taskModal, setTaskModal] = useState<Partial<Task> | null>(null);

  useNotionSync();

  const handleCreateTask = (start: string, end: string) => {
    setTaskModal({ startTime: start, endTime: end, source: 'local' });
  };

  const handleEditTask = (task: Task) => {
    setTaskModal(task);
  };

  return (
    <div className="app">
      <CalendarHeader />

      <main className="app__main">
        {view === 'week' ? (
          <WeekView onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
        ) : (
          <MonthView onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
        )}
      </main>

      {taskModal !== null && (
        <TaskModal task={taskModal} onClose={() => setTaskModal(null)} />
      )}
      {settingsOpen && <FieldSettings />}
      {notionSettingsOpen && <NotionSettings />}
    </div>
  );
}
