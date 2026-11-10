/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
/* Cyber Serpent: original canvas Snake game, event-driven controls and progression. */
(async () => {
  'use strict';
  const { $, api, post, initPage, toast, setText } = window.CS;
  if (!(await initPage('serpent'))) return;

  const canvas = $('#serpentCanvas');
  const ctx = canvas.getContext('2d');
  const GRID = 24;
  const CELL = canvas.width / GRID;
  const DELTA = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const SPEED = { chill: 155, classic: 110, hyper: 79 };
  let state = null;
  let frameHandle = 0;
  let frameLast = 0;
  let accumulator = 0;
  let best = 0;
  let turnLocked = false;
  let touchStart = null;
  const overlay = $('#gameOverlay');
  const overlayTitle = $('#overlayTitle');
  const overlayDescription = $('#overlayDescription');
  const overlayIcon = $('#overlayIcon');
  const overlayStart = $('#overlayStart');
  const pauseBtn = $('#pauseBtn');
  const difficulty = $('#difficulty');
  const setStatus = message => setText('#gameStatus', message);
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const occupied = (x, y) => state.snake.some(s => s.x === x && s.y === y) || same(state.food, { x, y }) || same(state.bonus, { x, y });

  function freeCell() {
    const options = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!occupied(x, y)) options.push({ x, y });
    return options.length ? options[Math.floor(Math.random() * options.length)] : null;
  }
  function updateStats() {
    setText('#score', state?.score || 0);
    setText('#level', state?.level || 1);
    setText('#best', Math.max(best, state?.score || 0));
  }
  function showOverlay(icon, title, description, action) {
    overlayIcon.textContent = icon;
    overlayTitle.textContent = title;
    overlayDescription.textContent = description;
    overlayStart.textContent = action;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function drawGrid() {
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(115,190,82,.075)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID; i++) {
      const p = i * CELL + .5;
      ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height);
      ctx.moveTo(0, p); ctx.lineTo(canvas.width, p);
    }
    ctx.stroke();
    const fade = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 30, canvas.width / 2, canvas.height / 2, 380);
    fade.addColorStop(0, 'rgba(71,150,34,.05)'); fade.addColorStop(1, 'rgba(0,0,0,.1)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function circle(cell, color, glow, radius = 8) {
    if (!cell) return;
    const x = cell.x * CELL + CELL / 2;
    const y = cell.y * CELL + CELL / 2;
    ctx.save(); ctx.shadowBlur = 24; ctx.shadowColor = glow;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffffaa'; ctx.fill();
  }
  function drawSnake() {
    if (!state) return;
    state.snake.forEach((part, i) => {
      const x = part.x * CELL + 2; const y = part.y * CELL + 2;
      ctx.save();
      if (i === 0) { ctx.shadowBlur = 18; ctx.shadowColor = '#a7ff40'; }
      const fill = i === 0 ? '#b1ff53' : (i % 3 === 0 ? '#65d82b' : '#82e93b');
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.roundRect(x, y, CELL - 4, CELL - 4, i === 0 ? 8 : 5); ctx.fill();
      ctx.restore();
      if (i === 0) {
        ctx.fillStyle = '#0b2513';
        const horizontal = Math.abs(state.direction.x) > 0;
        for (const s of [-1, 1]) {
          const eyeX = x + 10 + (horizontal ? state.direction.x * 5 : s * 4);
          const eyeY = y + 10 + (horizontal ? s * 4 : state.direction.y * 5);
          ctx.beginPath(); ctx.arc(eyeX, eyeY, 2.1, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  }
  function draw() { drawGrid(); if (state) { circle(state.food, '#a2ff35', '#a2ff35', 8); circle(state.bonus, '#ffcb59', '#ffc42e', 10); drawSnake(); } }

  function turn(name) {
    if (!state || !state.running || state.paused || turnLocked) return;
    const next = DELTA[name];
    if (!next) return;
    if (next.x === -state.direction.x && next.y === -state.direction.y) return;
    if (next.x === state.direction.x && next.y === state.direction.y) return;
    state.nextDirection = next;
    turnLocked = true; // one turn per game tick prevents rapid 180° reversals
  }
  function tick() {
    if (!state || !state.running || state.paused) return;
    state.direction = state.nextDirection;
    turnLocked = false;
    const head = state.snake[0];
    const next = { x: head.x + state.direction.x, y: head.y + state.direction.y };
    if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) return finish('You hit the wall!');
    const isFood = same(next, state.food);
    const isBonus = same(next, state.bonus);
    const grows = isFood || isBonus;
    // Moving into the current tail cell is legal if the snake does not grow.
    const body = grows ? state.snake : state.snake.slice(0, -1);
    if (body.some(part => same(part, next))) return finish('You crossed your own path!');
    state.snake.unshift(next);
    if (isFood) {
      state.score += 10;
      state.foodEaten++;
      state.food = null;
      if (state.foodEaten % 5 === 0) state.level++;
      if (state.foodEaten % 4 === 0 && state.bonusMilestone !== state.foodEaten) {
        state.bonusMilestone = state.foodEaten;
        if (!state.bonus) { state.bonus = freeCell(); state.bonusExpires = state.ticks + 32; }
      }
      state.food = freeCell();
    } else if (isBonus) {
      state.score += 30;
      state.bonus = null;
    } else state.snake.pop();
    state.ticks++;
    if (state.bonus && state.ticks >= state.bonusExpires) state.bonus = null;
    updateStats();
    if (!state.food) finish('You mastered the whole grid!');
  }
  function frame(timestamp) {
    if (!state?.running) return;
    if (!frameLast) frameLast = timestamp;
    accumulator += Math.min(100, timestamp - frameLast);
    frameLast = timestamp;
    if (!state.paused) {
      const interval = Math.max(48, SPEED[state.difficulty] - (state.level - 1) * 6);
      if (accumulator >= interval) { accumulator %= interval; tick(); }
    } else accumulator = 0;
    draw();
    if (state.running) frameHandle = requestAnimationFrame(frame);
  }
  function startGame() {
    if (state?.running) return;
    const selected = difficulty.value;
    state = {
      runId: crypto.randomUUID(), running: true, paused: false, difficulty: selected,
      snake: [{ x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }],
      direction: DELTA.right, nextDirection: DELTA.right, food: null, bonus: null,
      score: 0, foodEaten: 0, level: 1, ticks: 0, bonusMilestone: 0, bonusExpires: 0,
      startedAt: Date.now(), pausedAt: 0, totalPausedMs: 0, saved: false
    };
    state.food = freeCell(); turnLocked = false; frameLast = 0; accumulator = 0;
    difficulty.disabled = true; pauseBtn.disabled = false; pauseBtn.textContent = 'Ⅱ Pause';
    setText('#saveStatus', 'Your completed run will be saved automatically.');
    setStatus('Run in progress'); updateStats(); hideOverlay(); draw();
    cancelAnimationFrame(frameHandle); frameHandle = requestAnimationFrame(frame);
  }
  function pause() {
    if (!state?.running) return;
    if (state.paused) {
      state.paused = false;
      state.totalPausedMs += Date.now() - state.pausedAt;
      pauseBtn.textContent = 'Ⅱ Pause';
      setStatus('Run in progress'); hideOverlay(); frameLast = 0;
    } else {
      state.paused = true; state.pausedAt = Date.now();
      pauseBtn.textContent = '▶ Resume';
      setStatus('Game paused');
      showOverlay('Ⅱ', 'Paused', 'The grid can wait. Resume when you are ready.', 'Resume →');
    }
  }
  async function saveRun(ended) {
    if (ended.saved) return;
    ended.saved = true;
    setText('#saveStatus', 'Saving score to your player account…');
    const durationMs = Math.max(1000, Date.now() - ended.startedAt - ended.totalPausedMs);
    try {
      await post('/api/scores', {
        game: 'serpent', runId: ended.runId, score: ended.score, difficulty: ended.difficulty,
        level: ended.level, foodEaten: ended.foodEaten, durationMs
      });
      best = Math.max(best, ended.score);
      updateStats();
      setText('#saveStatus', `✓ Score saved: ${ended.score} points. Your leaderboard is updated.`);
    } catch (err) {
      setText('#saveStatus', `Score could not be saved: ${err.message}`);
      toast('Score save failed. Check your database connection.', true);
    }
  }
  function finish(reason) {
    if (!state?.running) return;
    if (state.paused) state.totalPausedMs += Date.now() - state.pausedAt;
    state.running = false; state.paused = false;
    cancelAnimationFrame(frameHandle);
    difficulty.disabled = false; pauseBtn.disabled = true;
    setStatus('Run finished');
    showOverlay('🏁', 'Run complete', `${reason} You earned ${state.score} points and reached level ${state.level}.`, 'Play again →');
    saveRun(state);
  }
  overlayStart.addEventListener('click', () => { if (state?.running && state.paused) pause(); else startGame(); });
  $('#newGameBtn').addEventListener('click', () => { if (state?.running) finish('Run ended early.'); startGame(); });
  pauseBtn.addEventListener('click', pause);
  document.addEventListener('keydown', event => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const code = event.key.toLowerCase();
    const map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    if (map[code]) { event.preventDefault(); turn(map[code]); }
    if (code === ' ' && state?.running) { event.preventDefault(); pause(); }
  });
  document.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => turn(btn.dataset.dir));
  });
  canvas.addEventListener('touchstart', e => {
    const t = e.changedTouches[0]; touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    touchStart = null;
  }, { passive: true });
  try {
    const { stats } = await api('/api/users/me');
    best = stats.find(s => s._id === 'serpent')?.best || 0;
  } catch { /* User is already authenticated; best score is optional. */ }
  updateStats(); draw();
})();
