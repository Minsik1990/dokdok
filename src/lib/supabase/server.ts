import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// 서버리스 환경에서 커넥션 재사용 (warm start 시 싱글턴)
let cachedClient: SupabaseClient<Database> | null = null;

// Service Role Key로 서버 사이드 전용 접근 (RLS 우회)
// 모든 DB 접근은 Server Components / API Routes에서만 수행
export function createClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return cachedClient;
}
