// ══════════════════════════════════════════════
// NEXORA — Supabase Client
// ══════════════════════════════════════════════
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://xdxcczywfincjcbvbecb.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkeGNjenl3ZmluY2pjYnZiZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjA4MTAsImV4cCI6MjA4ODczNjgxMH0.Jhg9yNbMuWtzQ9GPaoJ6KL_nxzht1FLWEHpfDr-J3sE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Auth helpers ──────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/auth.html';
    return null;
  }
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/auth.html';
}
