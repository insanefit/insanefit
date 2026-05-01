import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.generated'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseCredentials
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null
