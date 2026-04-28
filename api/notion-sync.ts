import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FieldMapping {
  title: string;
  startTime: string;
  endTime?: string;
  category?: string;
  progress?: string;
  priority?: string;
}

interface RequestBody {
  apiKey: string;
  databaseId: string;
  fieldMapping?: FieldMapping;
  limit?: number;
}

function extractText(prop: Record<string, unknown>): string {
  if (!prop) return '';
  if (prop.type === 'title') {
    const arr = prop.title as Array<{ plain_text: string }>;
    return arr?.map(t => t.plain_text).join('') ?? '';
  }
  if (prop.type === 'rich_text') {
    const arr = prop.rich_text as Array<{ plain_text: string }>;
    return arr?.map(t => t.plain_text).join('') ?? '';
  }
  if (prop.type === 'select') {
    const sel = prop.select as { name?: string } | null;
    return sel?.name ?? '';
  }
  if (prop.type === 'date') {
    const date = prop.date as { start?: string; end?: string } | null;
    return date?.start ?? '';
  }
  return '';
}

function extractDate(prop: Record<string, unknown>, isEnd = false): string | undefined {
  if (!prop) return undefined;
  if (prop.type === 'date') {
    const date = prop.date as { start?: string; end?: string } | null;
    if (!date) return undefined;
    return isEnd ? (date.end ?? date.start) : date.start;
  }
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, databaseId, fieldMapping, limit } = req.body as RequestBody;

  if (!apiKey || !databaseId) {
    return res.status(400).json({ error: 'apiKey and databaseId are required' });
  }

  const fm: FieldMapping = fieldMapping ?? {
    title: 'Name',
    startTime: 'Date',
  };

  try {
    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: limit ?? 100,
        }),
      }
    );

    if (!notionRes.ok) {
      const err = await notionRes.json();
      return res.status(notionRes.status).json({ error: err.message ?? 'Notion API error' });
    }

    const data = await notionRes.json();
    const results = (data.results ?? []).map((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, Record<string, unknown>>;
      const titleProp = props[fm.title];
      const startProp = props[fm.startTime];
      const endProp = fm.endTime ? props[fm.endTime] : undefined;

      let startDate = extractDate(startProp ?? {});
      if (!startDate) return null;

      let endDate: string | undefined;
      if (endProp) {
        endDate = extractDate(endProp, true);
      } else {
        endDate = extractDate(startProp ?? {}, true);
      }

      // Date-only (no time component) → default 09:00–10:00 local
      const isDateOnly = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
      if (isDateOnly(startDate)) {
        startDate = startDate + 'T09:00:00';
      }
      if (!endDate || isDateOnly(endDate)) {
        // same day as start, +1 hour
        const base = isDateOnly(startDate) ? startDate : startDate.slice(0, 10);
        endDate = base.slice(0, 10) + 'T10:00:00';
      }

      return {
        id: page.id,
        title: extractText(titleProp ?? {}),
        startTime: startDate,
        endTime: endDate,
        category: fm.category ? extractText(props[fm.category] ?? {}) : undefined,
        progress: fm.progress ? extractText(props[fm.progress] ?? {}) : undefined,
        priority: fm.priority ? extractText(props[fm.priority] ?? {}) : undefined,
      };
    }).filter(Boolean);

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
