    // --- 11. Admin Tables & Stats ---
    window.openStatsModal = function() {
      var container = document.getElementById('statsContainer');
      if (!container) return;

      var totalMoney = 0;
      var totalStars = 0;
      state.kids.forEach(function(k) { 
        totalMoney += calculateKidBalance(k.id); 
        totalStars += calculateKidStars(k.id);
      });
      var totalTx = state.transactions.length;

      container.innerHTML = 
        '<div class="p-3 bg-slate-800 rounded-2xl border border-white/10 flex justify-between items-center">' +
          '<span class="text-white/70">💰 إجمالي مدخرات العائلة:</span>' +
          '<span class="text-lg font-black text-emerald-400">' + totalMoney.toLocaleString() + ' ₺</span>' +
        '</div>' +
        '<div class="p-3 bg-slate-800 rounded-2xl border border-white/10 flex justify-between items-center">' +
          '<span class="text-white/70">📜 عدد كل الحركات المسجلة:</span>' +
          '<span class="text-base font-bold text-amber-300">' + totalTx + ' حركة</span>' +
        '</div>' +
        '<div class="p-3 bg-slate-800 rounded-2xl border border-white/10 flex justify-between items-center">' +
          '<span class="text-white/70">⭐ إجمالي النجوم المكتسبة:</span>' +
          '<span class="text-base font-bold text-yellow-400">' + totalStars + ' نجمة</span>' +
        '</div>' +
        '<div class="p-3 bg-slate-800 rounded-2xl border border-white/10 flex justify-between items-center">' +
          '<span class="text-white/70">🏺 عدد المطامير النشطة:</span>' +
          '<span class="text-base font-bold text-sky-400">' + state.kids.length + ' أطفال</span>' +
        '</div>';

      window.showModal('statsModal');
    };

    function renderAdminKidsTable() {
      var container = document.getElementById('adminKidsTable');
      if (!container) return;
      if (state.kids.length === 0) {
        container.innerHTML = '<div class="text-xs text-white/50 text-center py-2">لا توجد حسابات أطفال مسجلة</div>';
        return;
      }
      container.innerHTML = state.kids.map(function(kid) {
        var bal = calculateKidBalance(kid.id);
        var stars = calculateKidStars(kid.id);
        return '' +
          '<div class="flex items-center justify-between p-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs">' +
            '<div class="flex items-center gap-2.5">' +
              '<span class="text-xl">' + (kid.avatar || '👦') + '</span>' +
              '<div>' +
                '<div class="font-black text-white">' + kid.name + '</div>' +
                '<div class="text-[10px] text-white/60">الرصيد: <b class="text-emerald-400">' + bal + ' ₺</b> • النجوم: <b class="text-amber-300">' + stars + ' ⭐</b></div>' +
              '</div>' +
            '</div>' +
            '<button type="button" onclick="window.adminDeleteKid(\'' + kid.id + '\')" class="bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer">' +
              'حذف 🗑️' +
            '</button>' +
          '</div>';
      }).join('');
    }

    function renderAdminTransactionsTable() {
      var container = document.getElementById('adminTransactionsTable');
      if (!container) return;
      var txs = state.transactions.slice().reverse();
      if (txs.length === 0) {
        container.innerHTML = '<div class="text-xs text-white/50 text-center py-2">لا توجد حركات مسجلة</div>';
        return;
      }
      container.innerHTML = txs.map(function(t) {
        var kid = state.kids.find(function(k) { return String(k.id) === String(t.kid_id); });
        var isDep = t.type === 'deposit';
        return '' +
          '<div class="flex items-center justify-between p-2 bg-slate-900/60 border border-white/5 rounded-xl text-xs">' +
            '<div>' +
              '<span class="font-bold text-white">' + (kid ? kid.name : 'مطمورة') + ':</span> ' +
              '<span class="text-white/70">' + (t.note || (isDep ? 'إيداع' : 'سحب')) + '</span> ' +
              '<span class="text-[10px] ' + (isDep ? 'text-emerald-400' : 'text-rose-400') + ' font-bold mr-1">(' + (isDep ? '+' : '-') + t.amount + ' ₺)</span>' +
            '</div>' +
            '<button type="button" onclick="window.adminDeleteTransaction(\'' + t.id + '\')" class="text-rose-400 hover:text-rose-200 text-xs px-2 py-0.5 cursor-pointer">' +
              'حذف ✕' +
            '</button>' +
          '</div>';
      }).join('');
    }

