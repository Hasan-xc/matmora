    // --- 3. UI Helpers ---
    window.showModal = function(id) {
      var m = document.getElementById(id);
      if (m) {
        m.style.display = 'flex';
        if (id === 'adminLoginModal') {
          setTimeout(function() {
            var inp = document.getElementById('adminSimplePassInput');
            if (inp) { inp.value = ''; inp.focus(); }
          }, 40);
        }
      }
    };

    window.hideModal = function(id) {
      var m = document.getElementById(id);
      if (m) m.style.display = 'none';
    };

    window.openAdminDrawer = function() {
      document.getElementById('adminDrawerOverlay').style.display = 'block';
      document.getElementById('adminDrawer').style.display = 'flex';
    };

    window.closeAdminDrawer = function() {
      document.getElementById('adminDrawerOverlay').style.display = 'none';
      document.getElementById('adminDrawer').style.display = 'none';
    };

    window.showStatusToast = function(msg, isError) {
      var toast = document.getElementById('statusToast');
      var text = document.getElementById('statusToastMsg');
      var icon = document.getElementById('statusToastIcon');
      if (toast && text) {
        text.textContent = msg;
        if (icon) icon.textContent = isError ? '❌' : '🟢';
        toast.className = isError 
          ? 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000000] transition-all duration-300 opacity-100 pointer-events-auto bg-rose-950 text-rose-100 text-xs px-4 py-2.5 rounded-full border border-rose-500 shadow-2xl flex items-center gap-2 max-w-[90vw]'
          : 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000000] transition-all duration-300 opacity-100 pointer-events-auto bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 max-w-[90vw]';
        
        setTimeout(function() {
          toast.style.opacity = '0';
          toast.style.pointerEvents = 'none';
        }, 3200);
      }
    };

