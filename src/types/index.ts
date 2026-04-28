export type TaskSource = 'local' | 'notion';

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'select' | 'text';
  options?: FieldOption[];
  isDefault?: boolean;
  showOnCalendar?: boolean;
}

export interface Task {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  category?: string;
  progress?: string;
  priority?: string;
  customFields?: Record<string, string>;
  source: TaskSource;
  notionId?: string;
  color?: string;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  fieldMapping: {
    title: string;
    startTime: string;
    endTime?: string;
    category?: string;
    progress?: string;
    priority?: string;
  };
  lastSynced?: string;
}

export type CalendarView = 'week' | 'month';

export interface DragState {
  isDragging: boolean;
  startSlot: { day: number; hour: number; minute: number } | null;
  endSlot: { day: number; hour: number; minute: number } | null;
}
