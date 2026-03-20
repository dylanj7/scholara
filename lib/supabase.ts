import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Session {
  id: string;
  student_name: string;
  subject: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'student' | 'assistant';
  content: string;
  created_at: string;
}
