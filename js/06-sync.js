    // --- 6. Synchronization on Launch ---
    async function testSupabaseConnection(isManual) {
      initClient();
      var badge = document.getElementById('cloudStatusBadge');
      var errBanner = document.getElementById('connectionErrorBanner');
      var errDetail = document.getElementById('connectionErrorDetail');

      if (badge) {
        badge.className = 'text-[10px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer';
        badge.innerHTML = '<span class="animate-ping text-xs">●</span> جاري التحقق من Supabase...';
      }

      try {
        await dbService.testConnection();
        state.isSupabaseConnected = true;

        if (badge) {
          badge.className = 'text-[10px] text-emerald-400 font-bold flex items-center gap-1 cursor-pointer';
          badge.innerHTML = '<span>●</span> متصل بـ Supabase ✨';
        }
        if (errBanner) errBanner.style.display = 'none';

        if (isManual) window.showStatusToast('تم الاتصال بـ Supabase بنجاح 🟢');
        
        syncFromSupabase(true);
        setupRealtimeSubscriptions();
        return true;
      } catch (err) {
        state.isSupabaseConnected = false;
        console.error('❌ Supabase Connection Test Failed:', err);

        var detailedMsg = formatErrorDetail(err);
        if (badge) {
          badge.className = 'text-[10px] text-rose-400 font-bold flex items-center gap-1 cursor-pointer';
          badge.innerHTML = '<span>●</span> غير متصل بـ Supabase ❌';
        }
        if (errBanner) {
          errBanner.style.display = 'flex';
          if (errDetail) errDetail.textContent = detailedMsg;
        }

        if (isManual) {
          alert('فشل الاتصال بـ Supabase!\n' + detailedMsg);
        }
        return false;
      }
    }

    async function syncFromSupabase(silent) {
      try {
        var results = await Promise.all([dbService.fetchKids(), dbService.fetchTransactions(), dbService.fetchJars()]);
        var remoteKids = results[0], remoteTx = results[1], remoteJars = results[2];

        state.kids = remoteKids || [];
        state.transactions = remoteTx || [];
        state.jars = remoteJars || [];
        ensureActiveJars();
        saveToCache();

        renderShelfView();
        renderAdminKidsTable();
        renderAdminTransactionsTable();

        if (state.activeKidId) {
          var currentKid = state.kids.find(function(k) { return String(k.id) === String(state.activeKidId); });
          if (currentKid) {
            refreshActiveChildView(true);
          } else {
            window.goToShelf();
          }
        }
      } catch (err) {
        console.error('❌ Background sync error:', err);
        if (!silent) {
          window.showStatusToast('تعذر تحديث البيانات من السحابة', true);
        }
      }
    }

