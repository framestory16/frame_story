import { createClient } from '@supabase/supabase-js'

// These two values are public by design (they ship in the browser).
// Security comes from the Row Level Security rules in supabase/schema.sql.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://qriipkojtrgerlvexszo.supabase.co'
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3-WiHPpqxUeDNlZfwHpGpg_p7ClzRsP'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const SITE_BUCKET = 'site'
export const ORDER_BUCKET = 'order-photos'
