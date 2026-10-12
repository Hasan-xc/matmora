    // --- 12. Instant Boot Lifecycle ---
    window.addEventListener('DOMContentLoaded', function() {
      loadAdminSession();
      loadFromCache();
      renderShelfView();
      updateAdminUI();
      initMatterPhysics();
      if (!state.activeKidId) setPhysicsRunning(false);
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) setPhysicsRunning(false);
        else if (state.activeKidId) setPhysicsRunning(true);
      });

      testSupabaseConnection(false);
    });
