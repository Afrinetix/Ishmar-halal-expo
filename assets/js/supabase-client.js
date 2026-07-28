/* ==========================================================================
   Ishmar Halal Expo — Supabase client
   Loaded after the Supabase CDN script and before main.js on every page.
   Fill in SUPABASE_URL / SUPABASE_ANON_KEY below with the values from
   Project Settings -> API in your Supabase dashboard. The anon key is
   safe to expose publicly — it only grants what Row Level Security allows.
   ========================================================================== */

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

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
