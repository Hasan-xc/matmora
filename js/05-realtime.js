    // --- 5. Incremental Realtime Handler ---
    function setupRealtimeSubscriptions() {
      if (!supabaseClient || realtimeChannel) return;
      try {
        realtimeChannel = supabaseClient.channel('realtime:kids_piggy_stream')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'kids' }, function(payload) {
            handleKidRealtimeDelta(payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'jars' }, function() {
            syncFromSupabase(true);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, function(payload) {
            handleTransactionRealtimeDelta(payload);
          })
          .subscribe(function(status) {
            if (status === 'SUBSCRIBED') {
              console.log('⚡ Realtime Incremental Stream Subscribed');
            }
          });
      } catch (e) {
        console.warn('Realtime Setup Notice:', e);
      }
    }

    function handleKidRealtimeDelta(payload) {
      var evt = payload.eventType;
      if (evt === 'INSERT') {
        var newKid = payload.new;
        var exists = state.kids.some(function(k) { return String(k.id) === String(newKid.id); });
        if (!exists) {
          state.kids.push(newKid);
          saveToCache();
          renderShelfView();
          renderAdminKidsTable();
        }
      } else if (evt === 'UPDATE') {
        var updated = payload.new;
        var idx = state.kids.findIndex(function(k) { return String(k.id) === String(updated.id); });
        if (idx !== -1) {
          state.kids[idx] = Object.assign({}, state.kids[idx], updated);
          saveToCache();
          renderShelfView();
          renderAdminKidsTable();
          if (String(state.activeKidId) === String(updated.id)) {
            refreshActiveChildView(true);
          }
        }
      } else if (evt === 'DELETE') {
        var oldId = payload.old ? payload.old.id : null;
        if (oldId) {
          state.kids = state.kids.filter(function(k) { return String(k.id) !== String(oldId); });
          state.transactions = state.transactions.filter(function(t) { return String(t.kid_id) !== String(oldId); });
          saveToCache();
          renderShelfView();
          renderAdminKidsTable();
          renderGlobalTransactionsFeed();
          if (String(state.activeKidId) === String(oldId)) {
            window.goToShelf();
          }
        }
      }
    }

    function handleTransactionRealtimeDelta(payload) {
      var evt = payload.eventType;
      if (evt === 'INSERT') {
        var newTx = payload.new;
        var exists = state.transactions.some(function(t) { return String(t.id) === String(newTx.id); });
        if (!exists) {
          state.transactions.push(newTx);
          saveToCache();
          renderGlobalTransactionsFeed();
          renderAdminTransactionsTable();
          renderShelfView();
          if (String(state.activeKidId) === String(newTx.kid_id)) {
            refreshActiveChildView(false);
          }
        }
      } else if (evt === 'DELETE') {
        var oldId = payload.old ? payload.old.id : null;
        if (oldId) {
          state.transactions = state.transactions.filter(function(t) { return String(t.id) !== String(oldId); });
          saveToCache();
          renderGlobalTransactionsFeed();
          renderAdminTransactionsTable();
          renderShelfView();
          if (state.activeKidId) {
            refreshActiveChildView(false);
          }
        }
      }
    }

