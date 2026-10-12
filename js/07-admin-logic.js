    // --- 7. Admin Logic & Math ---
    function getAdminPassword() {
      try {
        return localStorage.getItem('piggy_admin_password') || 'issa123';
      } catch (e) {
        return 'issa123';
      }
    }

    function calculateKidBalance(kidId) {
      return state.transactions
        .filter(function(t) { return String(t.kid_id) === String(kidId); })
        .reduce(function(sum, t) {
          return t.type === 'deposit' ? sum + Number(t.amount) : sum - Number(t.amount);
        }, 0);
    }

    function getActiveJar(kidId) {
      return (state.jars || []).find(function(j) {
        return String(j.kid_id) === String(kidId) && j.status === 'active';
      }) || null;
    }

    function getActiveJarId(kidId) {
      var jar = getActiveJar(kidId);
      return jar ? jar.id : null;
    }

    function getClosedJars(kidId) {
      return (state.jars || []).filter(function(j) {
        return String(j.kid_id) === String(kidId) && j.status === 'closed';
      }).sort(function(a, b) { return String(a.created_at).localeCompare(String(b.created_at)); });
    }

    function calculateJarBalance(jarId) {
      return state.transactions
        .filter(function(t) { return String(t.jar_id) === String(jarId); })
        .reduce(function(sum, t) {
          return t.type === 'deposit' ? sum + Number(t.amount) : sum - Number(t.amount);
        }, 0);
    }

    function calculateActiveBalance(kidId) {
      var jar = getActiveJar(kidId);
      return jar ? calculateJarBalance(jar.id) : 0;
    }

    // Makes sure every kid has exactly one open jar (creates it if missing)
    function ensureActiveJars() {
      (state.kids || []).forEach(function(kid) {
        if (getActiveJar(kid.id)) return;
        var count = (state.jars || []).filter(function(j) { return String(j.kid_id) === String(kid.id); }).length;
        var jar = {
          id: generateUUID(),
          kid_id: kid.id,
          name: 'مطمورة ' + (count + 1),
          status: 'active',
          created_at: new Date().toISOString(),
          closed_at: null
        };
        state.jars.push(jar);
        dbService.insertJar(jar).catch(function(err) {
          console.error('❌ Failed to create jar:', err);
        });
      });
      saveToCache();
    }

    function calculateKidStars(kidId) {
      var bal = calculateKidBalance(kidId);
      if (bal <= 0) return 0;
      return Math.max(0, Math.floor(bal / 10));
    }

    function getKidActualCurrencies(kidId) {
      var activeJar = getActiveJar(kidId);
      if (!activeJar) return [];
      var targetBalance = calculateJarBalance(activeJar.id);
      if (targetBalance <= 0) return [];

      var txs = state.transactions.filter(function(t) { return String(t.jar_id) === String(activeJar.id); });
      var pool = [];
      var stdDenoms = [200, 100, 50, 20, 10, 5, 1];

      txs.forEach(function(t) {
        var amt = Number(t.amount) || 0;
        if (amt <= 0) return;

        if (t.type === 'deposit') {
          if (stdDenoms.indexOf(amt) !== -1) {
            pool.push(amt);
          } else {
            var rem = amt;
            for (var i = 0; i < stdDenoms.length; i++) {
              var d = stdDenoms[i];
              var count = Math.floor(rem / d);
              for (var j = 0; j < count; j++) pool.push(d);
              rem %= d;
            }
          }
        } else if (t.type === 'withdraw') {
          var remW = amt;
          pool.sort(function(a, b) { return b - a; });
          for (var i = pool.length - 1; i >= 0 && remW > 0; i--) {
            if (pool[i] <= remW) {
              remW -= pool[i];
              pool.splice(i, 1);
            }
          }
          if (remW > 0 && pool.length > 0) {
            var bigNote = pool.pop();
            var change = bigNote - remW;
            if (change > 0) {
              var remChange = change;
              for (var k = 0; k < stdDenoms.length; k++) {
                var cd = stdDenoms[k];
                var cCount = Math.floor(remChange / cd);
                for (var cj = 0; cj < cCount; cj++) pool.push(cd);
                remChange %= cd;
              }
            }
          }
        }
      });

      var currentSum = pool.reduce(function(sum, val) { return sum + val; }, 0);

      if (currentSum < targetBalance) {
        var diff = targetBalance - currentSum;
        for (var i = 0; i < stdDenoms.length; i++) {
          var d = stdDenoms[i];
          var cnt = Math.floor(diff / d);
          for (var j = 0; j < cnt; j++) pool.push(d);
          diff %= d;
        }
      } else if (currentSum > targetBalance) {
        var excess = currentSum - targetBalance;
        pool.sort(function(a, b) { return a - b; });
        for (var i = 0; i < pool.length && excess > 0; i++) {
          if (pool[i] <= excess) {
            excess -= pool[i];
            pool.splice(i, 1);
            i--;
          }
        }
      }

      return pool;
    }

    window.handleSimpleAdminLogin = function(e) {
      if (e && e.preventDefault) e.preventDefault();
      var input = document.getElementById('adminSimplePassInput');
      var err = document.getElementById('adminLoginError');
      var entered = input ? input.value.trim() : '';

      if (entered === getAdminPassword()) {
        state.isAdmin = true;
        try {
          localStorage.setItem('kp_admin_session', 'true');
        } catch (e) {}
        window.hideModal('adminLoginModal');
        if (input) input.value = '';
        if (err) err.style.display = 'none';
        updateAdminUI();
        renderGlobalTransactionsFeed();
        window.showStatusToast('مرحباً بك أيها المشرف (Admin) 👑');
      } else {
        if (err) err.style.display = 'block';
      }
    };

    window.logoutAdmin = function() {
      state.isAdmin = false;
      try {
        localStorage.removeItem('kp_admin_session');
      } catch (e) {}
      updateAdminUI();
      renderGlobalTransactionsFeed();
      window.showStatusToast('تم تسجيل خروج الأدمن');
    };

    window.handleChangePassword = function(e) {
      e.preventDefault();
      var oldP = document.getElementById('oldPassInput').value;
      var newP = document.getElementById('newPassInput').value;

      if (oldP !== getAdminPassword()) {
        alert('كلمة المرور الحالية غير صحيحة!');
        return;
      }
      if (!newP || newP.length < 3) {
        alert('كلمة المرور الجديدة قصيرة!');
        return;
      }

      try {
        localStorage.setItem('piggy_admin_password', newP);
      } catch (e) {}
      window.hideModal('changePassModal');
      document.getElementById('oldPassInput').value = '';
      document.getElementById('newPassInput').value = '';
      window.showStatusToast('تم تغيير كلمة المرور بنجاح 🔑');
    };

    function updateAdminUI() {
      var guestBtn = document.getElementById('guestAdminBtn');
      var burgerContainer = document.getElementById('adminBurgerContainer');
      var guestBtnChild = document.getElementById('guestAdminBtnChild');
      var burgerContainerChild = document.getElementById('adminBurgerContainerChild');
      var adminShelf = document.getElementById('adminDepositShelf');
      var adminActions = document.getElementById('adminActionButtons');

      if (state.isAdmin) {
        if (guestBtn) guestBtn.style.display = 'none';
        if (burgerContainer) burgerContainer.style.display = 'block';
        if (guestBtnChild) guestBtnChild.style.display = 'none';
        if (burgerContainerChild) burgerContainerChild.style.display = 'block';
        if (adminShelf) adminShelf.style.display = 'flex';
        if (adminActions) adminActions.style.display = 'flex';
      } else {
        if (guestBtn) guestBtn.style.display = 'flex';
        if (burgerContainer) burgerContainer.style.display = 'none';
        if (guestBtnChild) guestBtnChild.style.display = 'flex';
        if (burgerContainerChild) burgerContainerChild.style.display = 'none';
        if (adminShelf) adminShelf.style.display = 'none';
        if (adminActions) adminActions.style.display = 'none';
      }
    }

