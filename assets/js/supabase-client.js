/* ==========================================================================
   Ishmar Halal Expo — Supabase client
   Loaded after the Supabase CDN script and before main.js on every page.
   Fill in SUPABASE_URL / SUPABASE_ANON_KEY below with the values from
   Project Settings -> API in your Supabase dashboard. The anon key is
   safe to expose publicly — it only grants what Row Level Security allows.
   ========================================================================== */

const SUPABASE_URL = 'https://wojqljqrxzykhpguvbee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvanFsanFyeHp5a2hwZ3V2YmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc3NTYsImV4cCI6MjEwMDgwMzc1Nn0.vsr-oKe6OL4_McOEErxSaC2j6iIF2SMARNJQ60XWluc';

window.ishmarSupabase = null;

(function initSupabase() {
  const isConfigured =
    SUPABASE_URL && SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20;

  if (!isConfigured) {
    console.warn(
      '[Ishmar] Supabase is not configured yet. ' +
      'Add your Project URL and anon key to assets/js/supabase-client.js. ' +
      'Forms will fall back to a client-only confirmation until then.'
    );
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Ishmar] Supabase library failed to load from CDN.');
    return;
  }

  window.ishmarSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
