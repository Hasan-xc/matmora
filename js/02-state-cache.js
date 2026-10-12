    // --- 2. State & Fast Cache Management ---
    var state = {
      activeKidId: null,
      isAdmin: false,
      isSupabaseConnected: false,
      kids: [],
      transactions: []
    };

    function loadAdminSession() {
      try {
        state.isAdmin = localStorage.getItem('kp_admin_session') === 'true';
      } catch (e) {
        state.isAdmin = false;
      }
    }

    function saveToCache() {
      try {
        localStorage.setItem('kp_kids_cache', JSON.stringify(state.kids));
        localStorage.setItem('kp_tx_cache', JSON.stringify(state.transactions));
      } catch (e) {}
    }

    function loadFromCache() {
      try {
        var k = localStorage.getItem('kp_kids_cache');
        var t = localStorage.getItem('kp_tx_cache');
        if (k) {
          var parsedK = JSON.parse(k);
          if (Array.isArray(parsedK)) state.kids = parsedK;
        }
        if (t) {
          var parsedT = JSON.parse(t);
          if (Array.isArray(parsedT)) state.transactions = parsedT;
        }
      } catch (e) {}
    }

    function formatErrorDetail(err) {
      if (!err) return 'خطأ غير محدد';
      if (typeof err === 'string') return err;
      var parts = [];
      if (err.message) parts.push(err.message);
      if (err.details) parts.push('تفاصيل: ' + err.details);
      if (err.hint) parts.push('تلميح: ' + err.hint);
      if (err.code) parts.push('الرمز: ' + err.code);
      return parts.length > 0 ? parts.join(' | ') : JSON.stringify(err);
    }

