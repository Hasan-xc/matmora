    // --- 4. High-Performance Direct Supabase REST Driver ---
    async function directRestFetch(path, options) {
      options = options || {};
      var headers = Object.assign({
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      }, options.headers || {});

      var url = SUPABASE_PROJECT_URL + '/rest/v1' + path;
      var res = await fetch(url, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body
      });

      if (!res.ok) {
        var errBody = null;
        try { errBody = await res.json(); } catch(e) {}
        throw (errBody || new Error('HTTP ' + res.status + ': ' + res.statusText));
      }

      if (res.status === 204) return null;
      return await res.json();
    }

    var dbService = {
      testConnection: async function() {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('kids').select('id').limit(1);
            if (!res.error) return true;
          } catch(e) {}
        }
        await directRestFetch('/kids?select=id&limit=1');
        return true;
      },

      fetchKids: async function() {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('kids').select('*').order('created_at', { ascending: true });
            if (!res.error) return res.data || [];
          } catch (e) {}
        }
        return await directRestFetch('/kids?select=*&order=created_at.asc');
      },

      fetchTransactions: async function() {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('transactions').select('*').order('created_at', { ascending: true });
            if (!res.error) return res.data || [];
          } catch (e) {}
        }
        return await directRestFetch('/transactions?select=*&order=created_at.asc');
      },

      fetchJars: async function() {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('jars').select('*').order('created_at', { ascending: true });
            if (!res.error) return res.data || [];
          } catch (e) {}
        }
        return await directRestFetch('/jars?select=*&order=created_at.asc');
      },

      insertJar: async function(jar) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('jars').insert([jar]).select().single();
            if (!res.error) return res.data;
          } catch(e) {}
        }
        var list = await directRestFetch('/jars', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(jar)
        });
        return Array.isArray(list) ? list[0] : list;
      },

      updateJar: async function(id, data) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('jars').update(data).eq('id', id).select().single();
            if (!res.error) return res.data;
          } catch(e) {}
        }
        var list = await directRestFetch('/jars?id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        return Array.isArray(list) ? list[0] : list;
      },

      insertKid: async function(kid) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('kids').insert([kid]).select().single();
            if (!res.error) return res.data;
          } catch(e) {}
        }
        var list = await directRestFetch('/kids', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(kid)
        });
        return Array.isArray(list) ? list[0] : list;
      },

      updateKid: async function(id, data) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('kids').update(data).eq('id', id).select().single();
            if (!res.error) return res.data;
          } catch(e) {}
        }
        var list = await directRestFetch('/kids?id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        return Array.isArray(list) ? list[0] : list;
      },

      deleteKid: async function(id) {
        try {
          await directRestFetch('/transactions?kid_id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
        } catch(e) {}
        return await directRestFetch('/kids?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      },

      insertTransaction: async function(tx) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('transactions').insert([tx]).select().single();
            if (!res.error) return res.data;
          } catch(e) {}
        }
        var list = await directRestFetch('/transactions', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(tx)
        });
        return Array.isArray(list) ? list[0] : list;
      },

      deleteTransaction: async function(id) {
        if (supabaseClient) {
          try {
            var res = await supabaseClient.from('transactions').delete().eq('id', id);
            if (!res.error) return true;
          } catch(e) {}
        }
        return await directRestFetch('/transactions?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      }
    };

