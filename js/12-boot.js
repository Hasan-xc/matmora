    // --- 12. Instant Boot Lifecycle ---
    window.addEventListener('DOMContentLoaded', function() {
      loadAdminSession();
      loadFromCache();
      renderShelfView();
      updateAdminUI();
      initMatterPhysics();

      testSupabaseConnection(false);
    });
