    // --- 8. Matter.js Physics & Card-Deck Renderers ---
    var CURRENCY_CONFIG = {
      1:   { type: 'coin', radius: 18 },
      5:   { type: 'note', w: 86, h: 42, grad: ['#581c87', '#7e22ce', '#3b0764'], text: '5', label: 'BEŞ TL' },
      10:  { type: 'note', w: 90, h: 43, grad: ['#9f1239', '#e11d48', '#881337'], text: '10', label: 'ON TL' },
      20:  { type: 'note', w: 94, h: 44, grad: ['#065f46', '#059669', '#064e3b'], text: '20', label: 'YİRMİ TL' },
      50:  { type: 'note', w: 98, h: 45, grad: ['#9a3412', '#ea580c', '#7c2d12'], text: '50', label: 'ELLİ TL' },
      100: { type: 'note', w: 102, h: 46, grad: ['#0369a1', '#0284c7', '#075985'], text: '100', label: 'YÜZ TL' },
      200: { type: 'note', w: 108, h: 48, grad: ['#86198f', '#c026d3', '#701a75'], text: '200', label: 'İKİ YÜZ TL' }
    };

    var audioCtx = null;
    function playAudioTone(type) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        var now = audioCtx.currentTime;

        if (type === 'coin') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1600, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.16);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'note') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
          osc.start(now);
          osc.stop(now + 0.14);
        } else if (type === 'shuffle') {
          [280, 420, 560].forEach(function(freq, i) {
            var sOsc = audioCtx.createOscillator();
            var sGain = audioCtx.createGain();
            sOsc.connect(sGain);
            sGain.connect(audioCtx.destination);
            sOsc.type = 'sine';
            sOsc.frequency.setValueAtTime(freq, now + i * 0.05);
            sGain.gain.setValueAtTime(0.15, now + i * 0.05);
            sGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.12);
            sOsc.start(now + i * 0.05);
            sOsc.stop(now + i * 0.05 + 0.12);
          });
        }
      } catch (e) {}
    }

    var engine = null, render = null, runner = null;
    var physicsActive = true;

    function setPhysicsRunning(on) {
      if (!engine || !render || !runner || !window.Matter) return;
      if (on === physicsActive) return;
      physicsActive = on;
      if (on) {
        window.Matter.Render.run(render);
        window.Matter.Runner.run(runner, engine);
      } else {
        window.Matter.Runner.stop(runner);
        window.Matter.Render.stop(render);
      }
    }
    var isOrganizedMode = false;
    var swirlInterval = null;

    function initMatterPhysics() {
      try {
        if (!window.Matter) return;
        var M = window.Matter;
        var container = document.getElementById('physicsContainer');
        if (!container) return;

        engine = M.Engine.create();
        engine.world.gravity.y = 1.3;

        render = M.Render.create({
          element: container,
          engine: engine,
          options: {
            width: 300,
            height: 350,
            wireframes: false,
            background: 'transparent'
          }
        });

        M.Render.run(render);
        runner = M.Runner.create();
        M.Runner.run(runner, engine);

        var wallOpts = { isStatic: true, render: { visible: false } };
        var ground = M.Bodies.rectangle(150, 360, 400, 50, wallOpts);
        var ceiling = M.Bodies.rectangle(150, -10, 400, 40, wallOpts);
        var leftWall = M.Bodies.rectangle(-20, 175, 50, 420, wallOpts);
        var rightWall = M.Bodies.rectangle(320, 175, 50, 420, wallOpts);
        var leftFunnel = M.Bodies.rectangle(40, 25, 90, 20, { isStatic: true, angle: 0.35, render: { visible: false } });
        var rightFunnel = M.Bodies.rectangle(260, 25, 90, 20, { isStatic: true, angle: -0.35, render: { visible: false } });

        M.World.add(engine.world, [ground, ceiling, leftWall, rightWall, leftFunnel, rightFunnel]);

        M.Events.on(engine, 'beforeUpdate', function() {
          if (isOrganizedMode) return;
          var bodies = engine.world.bodies;
          bodies.forEach(function(body) {
            if (body.isStatic) return;

            var maxSpd = 4.5;
            if (body.velocity.x > maxSpd) M.Body.setVelocity(body, { x: maxSpd, y: body.velocity.y });
            if (body.velocity.x < -maxSpd) M.Body.setVelocity(body, { x: -maxSpd, y: body.velocity.y });
            if (body.velocity.y > maxSpd) M.Body.setVelocity(body, { x: body.velocity.x, y: maxSpd });
            if (body.velocity.y < -maxSpd) M.Body.setVelocity(body, { x: body.velocity.x, y: -maxSpd });

            if (Math.abs(body.angularVelocity) > 0.08) {
              M.Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * 0.08);
            }

            if (body.isNote && Math.abs(body.velocity.y) > 0.5) {
              var flutter = Math.sin(Date.now() * 0.01 + body.id) * 0.00015;
              M.Body.applyForce(body, body.position, { x: flutter * 3, y: 0 });
              M.Body.setAngularVelocity(body, body.angularVelocity * 0.95 + flutter);
            }

            if (body.position.x < 25) M.Body.setPosition(body, { x: 25, y: body.position.y });
            if (body.position.x > 275) M.Body.setPosition(body, { x: 275, y: body.position.y });
            if (body.position.y < 35) M.Body.setPosition(body, { x: body.position.x, y: 35 });
            if (body.position.y > 335) M.Body.setPosition(body, { x: body.position.x, y: 335 });
          });
        });

        M.Events.on(render, 'afterRender', function() {
          var ctx = render.context;
          if (isOrganizedMode) {
            drawOrganizedCardDeck(ctx);
            return;
          }
          var bodies = engine.world.bodies;
          bodies.forEach(function(body) {
            if (!body.denomination) return;
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            drawBanknoteCanvas(ctx, body.denomination);
            ctx.restore();
          });
        });
      } catch (e) {}
    }

    function drawBanknoteCanvas(ctx, denom) {
      var conf = CURRENCY_CONFIG[denom];
      if (!conf) return;

      if (conf.type === 'coin') {
        var r = conf.radius;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
        var goldGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r - 4);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.7, '#f59e0b');
        goldGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = goldGrad;
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.font = '900 13px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', 0, -2);
        ctx.font = 'bold 5px Cairo, sans-serif';
        ctx.fillText('LİRA', 0, 7);
      } else {
        var w = conf.w;
        var h = conf.h;
        var hw = w / 2;
        var hh = h / 2;

        ctx.beginPath();
        ctx.rect(-hw, -hh, w, h);
        var grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        grad.addColorStop(0, conf.grad[0]);
        grad.addColorStop(0.5, conf.grad[1]);
        grad.addColorStop(1, conf.grad[2]);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-hw + 14, -hh + 2, 6, h - 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px Cairo, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(conf.text, -hw + 5, 0);

        ctx.font = 'bold 6px Cairo, sans-serif';
        ctx.fillText('TCMB', -hw + 4, -hh + 6);
        ctx.fillText(conf.text + ' ₺', hw - 17, -hh + 6);
      }
    }

    function drawOrganizedCardDeck(ctx) {
      var currencies = getKidActualCurrencies(state.activeKidId);
      if (currencies.length === 0) return;

      var coins = [];
      var noteGroups = {};
      var order = [200, 100, 50, 20, 10, 5];

      order.forEach(function(d) { noteGroups[d] = []; });

      currencies.forEach(function(c) {
        if (c === 1) {
          coins.push(c);
        } else if (noteGroups[c]) {
          noteGroups[c].push(c);
        }
      });

      var activeNoteTiers = order.filter(function(d) { return noteGroups[d].length > 0; });
      var totalTiers = activeNoteTiers.length + (coins.length > 0 ? 1 : 0);

      var startY = 70;
      var tierHeight = totalTiers > 0 ? Math.min(55, 210 / totalTiers) : 50;

      activeNoteTiers.forEach(function(denom, tierIdx) {
        var items = noteGroups[denom];
        var count = items.length;
        var yPos = startY + (tierIdx * tierHeight);

        var spacingX = Math.min(32, 190 / Math.max(1, count));
        var totalWidth = (count - 1) * spacingX;
        var startX = 150 - (totalWidth / 2);

        items.forEach(function(val, i) {
          var xPos = startX + (i * spacingX);
          var angle = (i - (count - 1) / 2) * 0.05;

          ctx.save();
          ctx.translate(xPos, yPos);
          ctx.rotate(angle);
          ctx.shadowColor = 'rgba(0,0,0,0.38)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 3;
          drawBanknoteCanvas(ctx, val);
          ctx.restore();
        });
      });

      if (coins.length > 0) {
        var countCoins = coins.length;
        var coinY = Math.min(310, startY + (activeNoteTiers.length * tierHeight) + 15);
        var spacingCoinX = Math.min(26, 210 / Math.max(1, countCoins));
        var totalCoinW = (countCoins - 1) * spacingCoinX;
        var startCoinX = 150 - (totalCoinW / 2);

        coins.forEach(function(val, i) {
          var cx = startCoinX + (i * spacingCoinX);
          ctx.save();
          ctx.translate(cx, coinY);
          ctx.shadowColor = 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          drawBanknoteCanvas(ctx, 1);
          ctx.restore();
        });
      }
    }

    function spawnSingleCurrency(amount) {
      if (!engine || !window.Matter) return;
      var M = window.Matter;
      isOrganizedMode = false;
      var startX = 150 + (Math.random() * 20 - 10);
      var startY = 35;
      var conf = CURRENCY_CONFIG[amount];
      if (!conf) return;

      var body;
      if (conf.type === 'coin') {
        body = M.Bodies.circle(startX, startY, conf.radius, {
          restitution: 0.3,
          friction: 0.4,
          render: { visible: false }
        });
      } else {
        body = M.Bodies.rectangle(startX, startY, conf.w, conf.h, {
          chamfer: { radius: 4 },
          restitution: 0.15,
          friction: 0.8,
          angle: (Math.random() * 0.4) - 0.2,
          render: { visible: false }
        });
        body.isNote = true;
      }

      body.denomination = amount;
      M.World.add(engine.world, body);
      M.Body.setVelocity(body, { x: (Math.random() * 1.5) - 0.75, y: 3 });
    }

    function clearJarPhysics() {
      if (!engine || !window.Matter) return;
      var M = window.Matter;
      var bodiesToRemove = engine.world.bodies.filter(function(b) { return !b.isStatic; });
      bodiesToRemove.forEach(function(b) { M.World.remove(engine.world, b); });
    }

    function populateJarBodiesWithoutDrop() {
      clearJarPhysics();
      var currencies = getKidActualCurrencies(state.activeKidId);
      if (!engine || !window.Matter) return;
      var M = window.Matter;

      currencies.forEach(function(amount) {
        var conf = CURRENCY_CONFIG[amount];
        if (!conf) return;
        var posX = 85 + Math.random() * 130;
        var posY = 210 + Math.random() * 105;
        var body;

        if (conf.type === 'coin') {
          body = M.Bodies.circle(posX, posY, conf.radius, {
            restitution: 0.3,
            friction: 0.4,
            render: { visible: false }
          });
        } else {
          body = M.Bodies.rectangle(posX, posY, conf.w, conf.h, {
            chamfer: { radius: 4 },
            restitution: 0.15,
            friction: 0.8,
            angle: (Math.random() - 0.5) * 0.8,
            render: { visible: false }
          });
          body.isNote = true;
        }

        body.denomination = amount;
        M.World.add(engine.world, body);
      });
    }

    function reloadJarNotes(animate) {
      if (animate) {
        clearJarPhysics();
        isOrganizedMode = false;
        var currencies = getKidActualCurrencies(state.activeKidId);
        currencies.forEach(function(denom, idx) {
          setTimeout(function() {
            spawnSingleCurrency(denom);
          }, idx * 45);
        });
      } else {
        populateJarBodiesWithoutDrop();
      }
    }

    window.organizeMoneyLikeCards = function() {
      isOrganizedMode = true;
      if (swirlInterval) {
        clearInterval(swirlInterval);
        swirlInterval = null;
      }
      clearJarPhysics();
      playAudioTone('shuffle');
      window.showStatusToast('تم ترتيب النقود كأوراق اللعب 🎴');
    };

    window.scatterMoneyFreely = function() {
      playAudioTone('shuffle');

      if (isOrganizedMode) {
        isOrganizedMode = false;
        populateJarBodiesWithoutDrop();
      }

      if (!engine || !window.Matter) return;
      var M = window.Matter;
      var bodies = engine.world.bodies.filter(function(b) { return !b.isStatic; });

      if (bodies.length === 0) {
        populateJarBodiesWithoutDrop();
        bodies = engine.world.bodies.filter(function(b) { return !b.isStatic; });
      }

      if (swirlInterval) clearInterval(swirlInterval);

      var centerX = 150;
      var centerY = 240;
      var startTime = Date.now();
      var duration = 1200;

      swirlInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        if (elapsed > duration) {
          clearInterval(swirlInterval);
          swirlInterval = null;
          return;
        }

        var progress = 1 - (elapsed / duration);
        var swirlStrength = 0.00035 * progress;
        var liftStrength = -0.00018 * progress;

        bodies.forEach(function(b) {
          var dx = b.position.x - centerX;
          var dy = b.position.y - centerY;

          var fx = -dy * swirlStrength + (Math.random() - 0.5) * 0.00015;
          var fy = dx * swirlStrength + liftStrength + (Math.random() - 0.5) * 0.00015;

          M.Body.applyForce(b, b.position, { x: fx, y: fy });
          M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.04 * progress);
        });
      }, 16);

      window.showStatusToast('فتل خفيف وهادئ للنقود 🌪️✨');
    };

