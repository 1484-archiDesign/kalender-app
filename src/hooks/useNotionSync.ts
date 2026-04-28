import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import type { Task } from '../types';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useNotionSync() {
  const { notionConfig, syncNotionTasks, setNotionConfig } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = async () => {
    if (!notionConfig) return;
    try {
      const res = await fetch('/api/notion-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: notionConfig.apiKey,
          databaseId: notionConfig.databaseId,
          fieldMapping: notionConfig.fieldMapping,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const tasks: Task[] = (data.results ?? []).map((item: Record<string, unknown>) => ({
        id: `notion_${item.id}`,
        notionId: item.id as string,
        title: (item.title as string) || 'Untitled',
        startTime: (item.startTime as string) || dayjs().toISOString(),
        endTime: (item.endTime as string) || dayjs().add(1, 'hour').toISOString(),
        category: (item.category as string) || undefined,
        progress: (item.progress as string) || undefined,
        priority: (item.priority as string) || undefined,
        source: 'notion' as const,
      }));
      syncNotionTasks(tasks);
      setNotionConfig({ ...notionConfig, lastSynced: new Date().toISOString() });
    } catch {
      // silent fail — next interval will retry
    }
  };

  useEffect(() => {
    if (!notionConfig) return;
    sync();
    timerRef.current = setInterval(sync, SYNC_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [notionConfig?.apiKey, notionConfig?.databaseId]);
}
