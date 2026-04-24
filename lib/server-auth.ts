import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Returns the authenticated user from the Supabase session cookie.
 * Used in Route Handlers to validate the caller without trusting the request body.
 */
export async function getAuthUser(): Promise<{ id: string; email: string | undefined } | null> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in read-only contexts (e.g. RSC) — safe to ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { id: user.id, email: user.email };
}
