import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Guard: detect misconfigured deployments early rather than hanging on fetch
export function isSupabaseConfigured(): boolean {
  return supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Cookie-based browser client — allows middleware to read the session
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();

// Admin client with service role key — for server-side API routes only
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
