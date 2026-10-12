    // --- 9. Granular View Updates ---
    function getTopKid() {
      if (!state.kids || state.kids.length === 0) return null;
      return state.kids.slice().sort(function(a, b) {
        var starsA = calculateKidStars(a.id);
        var starsB = calculateKidStars(b.id);
        return starsB - starsA;
      })[0];
    }

    function renderShelfView() {
      var topKid = getTopKid();
      var shelfGrid = document.getElementById('shelfJarsGrid');
      var topLeaderInfo = document.getElementById('topLeaderInfo');

      if (topLeaderInfo) {
        if (topKid) {
          var topBal = calculateKidBalance(topKid.id);
          var topStars = calculateKidStars(topKid.id);
          topLeaderInfo.innerHTML = 
            '<div class="text-4xl animate-bounce">' + (topKid.avatar || '👦') + '</div>' +
            '<div class="flex-1">' +
              '<h4 class="text-base font-black">' + topKid.name + ' 👑</h4>' +
              '<div class="text-xs text-white/80">المجموع: ' + topBal.toLocaleString() + ' ₺ • <span class="text-amber-300 font-bold">⭐ ' + topStars + ' نجمة</span></div>' +
            '</div>';
        } else {
          topLeaderInfo.innerHTML = '<div class="text-xs text-white/70">أضف مطمورة أولى لتبدأ المنافسة! 🌟</div>';
        }
      }

      if (shelfGrid) {
        if (state.kids.length === 0) {
          shelfGrid.innerHTML = '<div class="col-span-3 text-center py-8 text-white/80 text-xs font-bold">لا توجد مطامير مسجلة في السحابة حتى الآن. اضغط على خيارات المشرف لإضافة مطمورة ➕</div>';
        } else {
          shelfGrid.innerHTML = state.kids.map(function(kid) {
            var bal = calculateKidBalance(kid.id);
            var stars = calculateKidStars(kid.id);
            var isTop = topKid && String(topKid.id) === String(kid.id);
            return '' +
              '<div onclick="window.openChildView(\'' + kid.id + '\')" class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group">' +
                '<div class="relative w-20 h-28 flex flex-col items-center justify-end ' + (isTop ? 'shining-jar' : '') + '">' +
                  (isTop ? '<span class="absolute -top-3 text-2xl z-20 animate-pulse">👑</span>' : '') +
                  '<div class="w-16 h-20 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl border-2 ' + (isTop ? 'border-amber-400 bg-amber-400/20' : 'border-white/40') + ' backdrop-blur-sm p-1.5 flex flex-col justify-between items-center shadow-lg relative overflow-hidden">' +
                    '<span class="text-2xl mt-1">' + (kid.avatar || '👦') + '</span>' +
                    '<span class="text-[9px] font-black ' + (isTop ? 'text-amber-300' : 'text-emerald-300') + '">' + bal + ' ₺</span>' +
                    '<div class="absolute bottom-0 inset-x-0 h-3 bg-white/20 blur-[1px]"></div>' +
                  '</div>' +
                '</div>' +
                '<div class="mt-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-center w-full">' +
                  '<span class="text-[11px] font-black block text-white truncate">' + kid.name + '</span>' +
                  '<span class="text-[9px] font-bold text-amber-300">⭐ ' + stars + '</span>' +
                '</div>' +
              '</div>';
          }).join('');
        }
      }

      renderGlobalTransactionsFeed();
    }

    function renderGlobalTransactionsFeed() {
      var feed = document.getElementById('globalTransactionsFeed');
      var badge = document.getElementById('globalTxTotalBadge');
      if (!feed) return;

      var txs = state.transactions.slice().reverse();
      if (badge) badge.textContent = txs.length + ' حركة';

      if (txs.length === 0) {
        feed.innerHTML = '<div class="text-center text-white/70 text-xs py-4">لا توجد حركات مسجلة حتى الآن ✨</div>';
        return;
      }

      feed.innerHTML = txs.map(function(t) {
        var kid = state.kids.find(function(k) { return String(k.id) === String(t.kid_id); }) || { name: 'مطمورة', avatar: '🏺' };
        var isDep = t.type === 'deposit';
        var formattedDate = new Date(t.created_at || Date.now()).toLocaleDateString('ar-TR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return '' +
          '<div class="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/50 border border-white/10 text-xs hover:bg-slate-900/70 transition">' +
            '<div class="flex items-center gap-2.5">' +
              '<span class="text-xl bg-white/10 w-8 h-8 rounded-xl flex items-center justify-center">' + (kid.avatar || '👦') + '</span>' +
              '<div>' +
                '<div class="flex items-center gap-1.5">' +
                  '<span class="font-black text-white text-[11px]">' + kid.name + '</span>' +
                  '<span class="text-[8px] px-1.5 py-0.2 rounded-md font-black ' + (isDep ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300') + '">' +
                    (isDep ? '⬇️ إيداع' : '⬆️ سحب') +
                  '</span>' +
                '</div>' +
                '<div class="text-[9px] text-white/60 flex items-center gap-1.5 mt-0.5">' +
                  '<span>' + (t.note || 'معاملة مالية') + '</span>' +
                  '<span>•</span>' +
                  '<span>⏱️ ' + formattedDate + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="font-black text-xs ' + (isDep ? 'text-emerald-300' : 'text-rose-300') + '">' +
                (isDep ? '+' : '-') + t.amount + ' ₺' +
              '</span>' +
              (state.isAdmin ? 
                '<button type="button" onclick="window.adminDeleteTransaction(\'' + t.id + '\')" class="text-rose-400 hover:text-white bg-rose-500/20 hover:bg-rose-600 px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer" title="حذف المعاملة من السحابة">✕</button>' 
                : '') +
            '</div>' +
          '</div>';
      }).join('');
    }

    function refreshActiveChildView(preservePhysics) {
      if (!state.activeKidId) return;
      var kid = state.kids.find(function(k) { return String(k.id) === String(state.activeKidId); });
      if (!kid) return;

      var appBody = document.getElementById('appBody');
      if (appBody) appBody.className = 'p-3 md:p-6 theme-' + (kid.theme || 'boy');

      document.getElementById('childName').textContent = kid.name;
      document.getElementById('childAvatar').textContent = kid.avatar || '👦';
      
      var stars = calculateKidStars(kid.id);
      document.getElementById('childStarsBadge').textContent = '⭐ ' + stars;

      var bal = calculateActiveBalance(kid.id);
      document.getElementById('childBalance').textContent = bal.toLocaleString() + ' ₺';

      var goal = kid.goal || 0;
      document.getElementById('childGoalText').textContent = goal > 0 ? ('الهدف: ' + goal.toLocaleString() + ' ₺') : 'بدون هدف';
      var percent = goal > 0 ? Math.min(Math.round((bal / goal) * 100), 100) : 0;
      document.getElementById('childGoalPercent').textContent = percent + '%';
      document.getElementById('childProgressBar').style.width = percent + '%';

      var topKid = getTopKid();
      document.getElementById('rankBadge').textContent = (topKid && String(topKid.id) === String(kid.id)) ? 'المركز #1 👑' : 'بطل التوفير 🏅';

      renderTransactionsList();
      renderClosedJars(kid.id);
      if (!preservePhysics) {
        reloadJarNotes(false);
      }
    }

    window.openChildView = function(kidId) {
      state.activeKidId = kidId;
      document.getElementById('shelfView').style.display = 'none';
      document.getElementById('childView').style.display = 'block';
      updateAdminUI();
      refreshActiveChildView(false);
    };

    window.goToShelf = function() {
      state.activeKidId = null;
      var appBody = document.getElementById('appBody');
      if (appBody) appBody.className = 'p-3 md:p-6 theme-shelf';
      document.getElementById('childView').style.display = 'none';
      document.getElementById('shelfView').style.display = 'block';
      renderShelfView();
      updateAdminUI();
    };

    function renderClosedJars(kidId) {
      var box = document.getElementById('closedJarsRow');
      if (!box) return;
      var closed = getClosedJars(kidId);
      if (closed.length === 0) {
        box.innerHTML = '';
        return;
      }
      box.innerHTML = closed.map(function(j) {
        var b = calculateJarBalance(j.id);
        return '' +
          '<div class="flex flex-col items-center gap-1">' +
            '<div class="glass-jar-wrapper w-16 h-20 flex items-end justify-center pb-1.5 text-[11px] font-black text-white">' + b.toLocaleString() + ' ₺</div>' +
            '<span class="text-[9px] text-white/80 font-bold">' + j.name + '</span>' +
          '</div>';
      }).join('');
    }

    function renderTransactionsList() {
      var list = document.getElementById('transactionsList');
      if (!list) return;

      var activeJar = getActiveJar(state.activeKidId);
      var kidTx = state.transactions
        .filter(function(t) { return activeJar && String(t.jar_id) === String(activeJar.id); })
        .slice().reverse();

      document.getElementById('childTxCount').textContent = kidTx.length + ' حركات';

      if (kidTx.length === 0) {
        list.innerHTML = '<div class="text-center text-white/70 text-xs py-3">المطمورة فارغة حتى الآن! 💰</div>';
        return;
      }

      list.innerHTML = kidTx.map(function(t) {
        var isDep = t.type === 'deposit';
        return '' +
          '<div class="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/10 text-xs">' +
            '<div class="flex items-center gap-2">' +
              '<span class="p-1 rounded-lg ' + (isDep ? 'bg-emerald-400/30 text-emerald-200' : 'bg-rose-400/30 text-rose-200') + ' font-black text-[9px]">' +
                (isDep ? '⬇️ إيداع' : '⬆️ سحب') +
              '</span>' +
              '<div>' +
                '<span class="text-white font-bold block text-[11px]">' + (t.note || 'معاملة مالية') + '</span>' +
                '<span class="text-[8px] text-white/60">' + new Date(t.created_at || Date.now()).toLocaleDateString('ar-TR', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="font-black text-xs ' + (isDep ? 'text-emerald-300' : 'text-rose-300') + '">' +
              (isDep ? '+' : '-') + t.amount + ' ₺' +
            '</span>' +
          '</div>';
      }).join('');
    }

