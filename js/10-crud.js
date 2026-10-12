    // --- 10. CRUD Operations ---

    // A. Instant Optimistic Deposit
    window.depositMoney = function(amount) {
      if (!state.isAdmin) {
        alert('الإيداع متاح للأدمن فقط!');
        return;
      }

      var activeKid = state.kids.find(function(k) { return String(k.id) === String(state.activeKidId); });
      if (!activeKid) return;

      var activeJarRef = getActiveJar(activeKid.id);
      if (!activeJarRef) {
        alert('لا توجد مطمورة مفتوحة لهذا الطفل!');
        return;
      }

      var newTxId = generateUUID();
      var newTx = {
        id: newTxId,
        kid_id: activeKid.id,
        jar_id: activeJarRef.id,
        amount: Number(amount),
        type: 'deposit',
        note: 'إيداع ' + amount + ' ₺',
        created_at: new Date().toISOString()
      };

      state.transactions.push(newTx);
      var oldStars = activeKid.stars || 0;
      var newStars = calculateKidStars(activeKid.id);
      activeKid.stars = newStars;
      saveToCache();

      playAudioTone(amount === 1 ? 'coin' : 'note');
      spawnSingleCurrency(amount);
      refreshActiveChildView(true);
      window.showStatusToast('تم إيداع ' + amount + ' ₺ 🪙');

      (async function() {
        try {
          await dbService.insertTransaction(newTx);
          if (newStars !== oldStars) {
            dbService.updateKid(activeKid.id, { stars: newStars }).catch(function(){});
          }
        } catch (err) {
          console.error('❌ Background deposit sync failed:', err);
          state.transactions = state.transactions.filter(function(t) { return String(t.id) !== String(newTxId); });
          activeKid.stars = oldStars;
          saveToCache();
          refreshActiveChildView(false);
          window.showStatusToast('فشل حفظ الإيداع في السحابة!', true);
          alert('تعذر حفظ الإيداع في Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // B. Instant Optimistic Withdraw
    window.handleWithdraw = function(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (!state.isAdmin) return;

      var activeKid = state.kids.find(function(k) { return String(k.id) === String(state.activeKidId); });
      if (!activeKid) return;

      var amount = parseFloat(document.getElementById('withdrawAmountInput').value);
      var reason = document.getElementById('withdrawReasonInput').value || 'سحب من المطمورة';
      var balance = calculateActiveBalance(state.activeKidId);

      if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ سحب صالح!');
        return;
      }
      if (amount > balance) {
        alert('الرصيد لا يكفي! الرصيد الحالي: ' + balance + ' ₺');
        return;
      }

      var newTxId = generateUUID();
      var newTx = {
        id: newTxId,
        kid_id: state.activeKidId,
        jar_id: getActiveJarId(state.activeKidId),
        amount: Number(amount),
        type: 'withdraw',
        note: reason,
        created_at: new Date().toISOString()
      };

      state.transactions.push(newTx);
      var oldStars = activeKid.stars || 0;
      var newStars = calculateKidStars(state.activeKidId);
      activeKid.stars = newStars;
      saveToCache();

      window.hideModal('withdrawModal');
      document.getElementById('withdrawAmountInput').value = '';
      document.getElementById('withdrawReasonInput').value = '';
      refreshActiveChildView(false);
      playAudioTone('note');
      window.showStatusToast('تم السحب بنجاح');

      (async function() {
        try {
          await dbService.insertTransaction(newTx);
          if (newStars !== oldStars) {
            dbService.updateKid(activeKid.id, { stars: newStars }).catch(function(){});
          }
        } catch (err) {
          console.error('❌ Background withdraw sync failed:', err);
          state.transactions = state.transactions.filter(function(t) { return String(t.id) !== String(newTxId); });
          activeKid.stars = oldStars;
          saveToCache();
          refreshActiveChildView(false);
          window.showStatusToast('فشل حفظ السحب في السحابة!', true);
          alert('تعذر حفظ السحب في Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // C. Instant Optimistic Smash Jar
    window.smashJar = function() {
      if (!state.isAdmin) return;
      var activeKid = state.kids.find(function(k) { return String(k.id) === String(state.activeKidId); });
      if (!activeKid) return;

      var balance = calculateActiveBalance(state.activeKidId);
      if (balance <= 0) {
        alert('المطمورة فارغة بالفعل!');
        return;
      }
      if (!confirm('هل أنت متأكد من رغبتك في كسر المطمورة وتسليم كامل المبلغ (' + balance + ' ₺)؟ ستتم إعادة النجوم إلى 0 ⭐')) return;

      var newTxId = generateUUID();
      var newTx = {
        id: newTxId,
        kid_id: state.activeKidId,
        jar_id: getActiveJarId(state.activeKidId),
        amount: balance,
        type: 'withdraw',
        note: '🔨 كسر المطمورة وتسليم الرصيد 🎉',
        created_at: new Date().toISOString()
      };

      state.transactions.push(newTx);
      var oldStars = activeKid.stars || 0;
      activeKid.stars = 0;
      saveToCache();

      if (window.confetti) window.confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      clearJarPhysics();
      refreshActiveChildView(true);
      window.showStatusToast('تم كسر المطمورة وتصفير النجوم 🔨');

      (async function() {
        try {
          await dbService.insertTransaction(newTx);
          dbService.updateKid(activeKid.id, { stars: 0 }).catch(function(){});
        } catch (err) {
          console.error('❌ Background smash jar sync failed:', err);
          state.transactions = state.transactions.filter(function(t) { return String(t.id) !== String(newTxId); });
          activeKid.stars = oldStars;
          saveToCache();
          refreshActiveChildView(false);
          window.showStatusToast('فشل توثيق كسر المطمورة بالسحابة!', true);
          alert('تعذر توثيق كسر المطمورة في Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // D. Instant Optimistic Add Kid
    window.handleAddKid = function(e) {
      if (e && e.preventDefault) e.preventDefault();

      var name = document.getElementById('kidNameInput').value.trim();
      var theme = document.querySelector('input[name="genderTheme"]:checked') ? document.querySelector('input[name="genderTheme"]:checked').value : 'boy';
      var goal = parseFloat(document.getElementById('kidGoalInput').value) || 0;

      if (!name) {
        alert('يرجى إدخال اسم الطفل.');
        return;
      }

      var avatarMap = { boy: '👦', girl: '👧', green: '🦁' };
      var newKidId = generateUUID();
      var newKid = {
        id: newKidId,
        name: name,
        avatar: avatarMap[theme] || '👦',
        theme: theme,
        goal: goal,
        stars: 0,
        created_at: new Date().toISOString()
      };

      state.kids.push(newKid);
      saveToCache();

      window.hideModal('addKidModal');
      document.getElementById('kidNameInput').value = '';
      document.getElementById('kidGoalInput').value = '';

      renderShelfView();
      window.openChildView(newKid.id);
      window.showStatusToast('تمت إضافة مطمورة ' + name + ' بنجاح ✨');

      (async function() {
        try {
          await dbService.insertKid(newKid);
          ensureActiveJars();
        } catch (err) {
          console.error('❌ Background add kid sync failed:', err);
          state.kids = state.kids.filter(function(k) { return String(k.id) !== String(newKidId); });
          saveToCache();
          renderShelfView();
          window.goToShelf();
          window.showStatusToast('فشل حفظ المطمورة في السحابة!', true);
          alert('تعذر حفظ الطفل في Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // E. Instant Optimistic Edit Kid
    window.openEditKidModal = function() {
      var select = document.getElementById('editKidSelect');
      if (!select) return;
      if (state.kids.length === 0) {
        alert('لا توجد مطامير لتعديلها!');
        return;
      }
      select.innerHTML = state.kids.map(function(k) {
        return '<option value="' + k.id + '">' + (k.avatar || '👦') + ' ' + k.name + '</option>';
      }).join('');
      populateEditKidFields();
      window.showModal('editKidModal');
    };

    window.populateEditKidFields = function() {
      var select = document.getElementById('editKidSelect');
      var kidId = select ? select.value : null;
      var kid = state.kids.find(function(k) { return String(k.id) === String(kidId); });
      if (!kid) return;

      document.getElementById('editKidNameInput').value = kid.name;
      document.getElementById('editKidGoalInput').value = kid.goal || '';
      
      var radios = document.getElementsByName('editGenderTheme');
      for (var i = 0; i < radios.length; i++) {
        radios[i].checked = (radios[i].value === (kid.theme || 'boy'));
      }
    };

    window.handleSaveEditedKid = function(e) {
      if (e && e.preventDefault) e.preventDefault();
      var select = document.getElementById('editKidSelect');
      var kidId = select ? select.value : null;
      var kid = state.kids.find(function(k) { return String(k.id) === String(kidId); });
      if (!kid) return;

      var newName = document.getElementById('editKidNameInput').value.trim();
      var newGoal = parseFloat(document.getElementById('editKidGoalInput').value) || 0;
      var themeRadio = document.querySelector('input[name="editGenderTheme"]:checked');
      var newTheme = themeRadio ? themeRadio.value : 'boy';
      var avatarMap = { boy: '👦', girl: '👧', green: '🦁' };
      var newAvatar = avatarMap[newTheme] || '👦';

      if (!newName) {
        alert('الاسم مطلوب!');
        return;
      }

      var prevSnapshot = { name: kid.name, goal: kid.goal, theme: kid.theme, avatar: kid.avatar };

      kid.name = newName;
      kid.goal = newGoal;
      kid.theme = newTheme;
      kid.avatar = newAvatar;
      saveToCache();

      window.hideModal('editKidModal');
      renderShelfView();
      if (String(state.activeKidId) === String(kid.id)) {
        refreshActiveChildView(true);
      }
      window.showStatusToast('تم تحديث بيانات ' + newName + ' ✨');

      (async function() {
        try {
          await dbService.updateKid(kid.id, {
            name: newName,
            goal: newGoal,
            theme: newTheme,
            avatar: newAvatar
          });
        } catch (err) {
          console.error('❌ Background edit kid sync failed:', err);
          Object.assign(kid, prevSnapshot);
          saveToCache();
          renderShelfView();
          if (String(state.activeKidId) === String(kid.id)) {
            refreshActiveChildView(true);
          }
          window.showStatusToast('فشل حفظ التعديل في السحابة!', true);
          alert('تعذر تحديث بيانات الطفل في Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // F. Instant Delete Kid with Modal and Clear Confirmation
    window.openDeleteKidModal = function() {
      var select = document.getElementById('deleteKidSelect');
      if (!select) return;
      if (state.kids.length === 0) {
        alert('لا توجد مطامير مسجلة لحذفها!');
        return;
      }
      select.innerHTML = state.kids.map(function(k) {
        return '<option value="' + k.id + '">' + (k.avatar || '👦') + ' ' + k.name + '</option>';
      }).join('');
      window.showModal('deleteKidModal');
    };

    window.handleModalDeleteKid = function(e) {
      if (e && e.preventDefault) e.preventDefault();
      var select = document.getElementById('deleteKidSelect');
      var kidId = select ? select.value : null;
      if (!kidId) return;
      window.hideModal('deleteKidModal');
      window.adminDeleteKid(kidId);
    };

    window.adminDeleteKid = function(kidId) {
      var kid = state.kids.find(function(k) { return String(k.id) === String(kidId); });
      var kidName = kid ? kid.name : 'هذا الطفل';

      if (!confirm('هل أنت متأكد تماماً من حذف مطمورة (' + kidName + ') وجميع سجلاتها ومعاملاتها نهائياً من السحابة؟')) return;

      var prevKids = state.kids.slice();
      var prevTx = state.transactions.slice();

      state.kids = state.kids.filter(function(k) { return String(k.id) !== String(kidId); });
      state.transactions = state.transactions.filter(function(t) { return String(t.kid_id) !== String(kidId); });
      state.jars = state.jars.filter(function(j) { return String(j.kid_id) !== String(kidId); });
      saveToCache();

      renderAdminKidsTable();
      renderShelfView();
      if (String(state.activeKidId) === String(kidId)) {
        window.goToShelf();
      }
      window.showStatusToast('تم حذف مطمورة ' + kidName + ' بنجاح');

      (async function() {
        try {
          await dbService.deleteKid(kidId);
        } catch (err) {
          console.error('❌ Background delete kid sync failed:', err);
          state.kids = prevKids;
          state.transactions = prevTx;
          saveToCache();
          renderAdminKidsTable();
          renderShelfView();
          window.showStatusToast('فشل الحذف من السحابة!', true);
          alert('تعذر حذف المطمورة من Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

    // H. Close Jar: puts the current jar aside (filled) and opens an empty one
    window.closeCurrentJar = function() {
      var kidId = state.activeKidId;
      if (!kidId) return;
      var jar = getActiveJar(kidId);
      if (!jar) return;

      var bal = calculateJarBalance(jar.id);
      if (!confirm('إغلاق هذه المطمورة ووضعها جانباً (الرصيد: ' + bal + ' ₺)؟ ستفتح مطمورة جديدة فارغة.')) return;

      var nowIso = new Date().toISOString();
      var count = (state.jars || []).filter(function(j) { return String(j.kid_id) === String(kidId); }).length;
      var newJar = {
        id: generateUUID(),
        kid_id: kidId,
        name: 'مطمورة ' + (count + 1),
        status: 'active',
        created_at: nowIso,
        closed_at: null
      };

      jar.status = 'closed';
      jar.closed_at = nowIso;
      state.jars.push(newJar);
      saveToCache();

      var wrap = document.getElementById('activeJarWrapper');
      if (wrap) wrap.classList.add('jar-slide-down');

      setTimeout(function() {
        clearJarPhysics();
        refreshActiveChildView(false);
        if (wrap) {
          wrap.style.transition = 'none';
          wrap.classList.remove('jar-slide-down');
          void wrap.offsetWidth;
          wrap.style.transition = '';
          wrap.classList.add('jar-fade-in');
          setTimeout(function() { wrap.classList.remove('jar-fade-in'); }, 700);
        }
      }, 650);

      window.showStatusToast('تم إغلاق المطمورة ووضعها جانباً 🫙');

      (async function() {
        try {
          await dbService.updateJar(jar.id, { status: 'closed', closed_at: nowIso });
          await dbService.insertJar(newJar);
        } catch (err) {
          console.error('❌ Close jar sync failed:', err);
          window.showStatusToast('فشل حفظ إغلاق المطمورة في السحابة!', true);
          syncFromSupabase(true);
        }
      })();
    };

    // G. Instant Delete Transaction
    window.adminDeleteTransaction = function(txId) {
      if (!confirm('هل تريد حذف هذه المعاملة؟')) return;

      var deletedTx = state.transactions.find(function(t) { return String(t.id) === String(txId); });
      if (!deletedTx) return;

      var prevTx = state.transactions.slice();

      state.transactions = state.transactions.filter(function(t) { return String(t.id) !== String(txId); });
      saveToCache();

      renderAdminTransactionsTable();
      renderGlobalTransactionsFeed();
      if (state.activeKidId) {
        refreshActiveChildView(false);
      }
      renderShelfView();
      window.showStatusToast('تم حذف المعاملة');

      (async function() {
        try {
          await dbService.deleteTransaction(txId);
        } catch (err) {
          console.error('❌ Background delete transaction sync failed:', err);
          state.transactions = prevTx;
          saveToCache();
          renderAdminTransactionsTable();
          renderGlobalTransactionsFeed();
          if (state.activeKidId) refreshActiveChildView(false);
          renderShelfView();
          window.showStatusToast('فشل حذف المعاملة من السحابة!', true);
          alert('تعذر حذف المعاملة من Supabase:\n' + formatErrorDetail(err));
        }
      })();
    };

