import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Supabaseが未設定の場合はnull（localStorage専用モードで動く）
export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseEnabled = !!supabase;
