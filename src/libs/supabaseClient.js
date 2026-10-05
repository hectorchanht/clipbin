import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Without credentials the app still works: everything falls back to
// localStorage ("offline mode"). Cloud features simply stay logged out.
const missingCreds = !supabaseUrl || !supabaseAnonKey
if (missingCreds) {
  // eslint-disable-next-line no-console
  console.warn(
    '[rushbin] REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are not set — running in local-only mode.'
  )
}

export const isCloudConfigured = !missingCreds

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
