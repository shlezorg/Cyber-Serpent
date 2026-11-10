/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
(async () => {
  'use strict';
  const { $, api, integer, formatDate, initPage, toast } = window.CS;
  if (!(await initPage('leaderboard'))) return;
  let active = 'serpent';
  function avatar(user, extraClass = '') {
    const el = document.createElement('span');
    el.className = `avatar ${extraClass}`;
    el.dataset.color = user?.avatarColor || 'lime';
    el.textContent = (user?.displayName || user?.username || '?').charAt(0).toUpperCase();
    return el;
  }
  function renderPodium(leaders) {
    const root = $('#podium'); root.textContent = '';
    for (const [rank, emoji] of [[1, '🥈'], [0, '🥇'], [2, '🥉']]) {
      const p = leaders[rank];
      const box = document.createElement('div'); box.className = 'card podium-card';
      const medal = document.createElement('div'); medal.className = 'rank-medal'; medal.textContent = emoji;
      const name = document.createElement('div'); name.className = 'rank-name'; name.textContent = p ? (p.displayName || p.username) : 'No player yet';
      const points = document.createElement('div'); points.className = 'rank-score'; points.textContent = p ? integer(p.score) : '—';
      box.append(medal, avatar(p, 'rank-avatar'), name, points); root.append(box);
    }
  }
  function renderTable(leaders) {
    const root = $('#leaderboardRows'); root.textContent = '';
    if (!leaders.length) {
      const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 4; td.className = 'empty'; td.textContent = 'No scores yet. Play a game to claim the first spot!'; tr.append(td); root.append(tr); return;
    }
    leaders.forEach((p, index) => {
      const tr = document.createElement('tr');
      const rank = document.createElement('td'); rank.textContent = `#${index + 1}`;
      const player = document.createElement('td');
      const inner = document.createElement('div'); inner.className = 'flex'; inner.style.flexWrap = 'nowrap';
      const a = avatar(p);
      const label = document.createElement('span'); label.textContent = p.displayName || p.username;
      inner.append(a, label); player.append(inner);
      const score = document.createElement('td'); score.className = 'score-green'; score.textContent = integer(p.score);
      const date = document.createElement('td'); date.className = 'muted'; date.textContent = formatDate(p.playedAt);
      tr.append(rank, player, score, date); root.append(tr);
    });
  }
  async function load(game) {
    active = game;
    document.querySelectorAll('.segment').forEach(btn => btn.classList.toggle('active', btn.dataset.game === active));
    $('#leaderboardMode').textContent = game === 'banana' ? 'Banana Challenge' : 'Serpent';
    const root = $('#leaderboardRows'); root.textContent = '';
    const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 4; td.className = 'empty'; td.textContent = 'Loading rankings…'; tr.append(td); root.append(tr);
    try {
      const { leaders } = await api(`/api/scores/leaderboard?game=${encodeURIComponent(game)}&limit=20`);
      if (active !== game) return;
      renderPodium(leaders); renderTable(leaders);
    } catch (err) { toast(err.message, true); renderPodium([]); renderTable([]); }
  }
  document.querySelectorAll('.segment').forEach(btn => btn.addEventListener('click', () => load(btn.dataset.game)));
  load('serpent');
})();
