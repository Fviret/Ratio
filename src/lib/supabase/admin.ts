import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client service_role : bypass RLS, côté serveur uniquement, ne jamais exposer au client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
