    // --- 1. Supabase Credentials & Engine Setup ---
    var SUPABASE_PROJECT_URL = 'https://bfexmmzgxoifdmhmjgox.supabase.co';
    var SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZXhtbXpneG9pZmRtaG1qZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTYxMDUsImV4cCI6MjEwNzM3MjEwNX0.1MAug1zQ8PXTuuGUTBDh6yqDjf31I5v9BFNqaEENO3k';
    var supabaseClient = null;
    var realtimeChannel = null;

    function initClient() {
      try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
          supabaseClient = window.supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false },
            realtime: { params: { eventsPerSecond: 10 } }
          });
        }
      } catch (e) {
        console.warn('Supabase JS Client Init Notice:', e);
      }
    }
    initClient();

    function generateUUID() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

