-- ================================================
-- KALENDER APP — Supabase Schema
-- Supabase Dashboard > SQL Editor に貼り付けて実行
-- ================================================

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id          text        PRIMARY KEY,
  title       text        NOT NULL,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  category    text,
  progress    text,
  priority    text,
  custom_fields jsonb     DEFAULT '{}',
  source      text        DEFAULT 'local',
  notion_id   text,
  color       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 設定テーブル（フィールド定義・Notion設定など）
CREATE TABLE IF NOT EXISTS app_settings (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- RLS（Row Level Security）は今回無効化
-- 個人利用のため anon キーで全操作を許可
ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_tasks"    ON tasks        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
