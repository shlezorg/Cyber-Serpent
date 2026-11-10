/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
(async () => {
  'use strict';
  const { $, api, patch, post, integer, formatDate, initPage, toast } = window.CS;
  const loggedUser = await initPage('profile');
  if (!loggedUser) return;
  let selectedColor = loggedUser.avatarColor || 'lime';
  let currentUser = loggedUser;
  function renderIdentity(user) {
    currentUser = user;
    $('#profileAvatar').textContent = (user.displayName || user.username).charAt(0).toUpperCase();
    $('#profileAvatar').dataset.color = user.avatarColor;
    $('#profileName').textContent = user.displayName || user.username;
    $('#profileHandle').textContent = `@${user.username}`;
    $('#joinedAt').textContent = `Player since ${formatDate(user.createdAt)}`;
    $('#displayName').value = user.displayName || user.username;
    $('#profileEmail').value = user.email;
    selectedColor = user.avatarColor || 'lime';
    document.querySelectorAll('.color-choice').forEach(btn => btn.classList.toggle('selected', btn.dataset.color === selectedColor));
  }
  renderIdentity(loggedUser);
  try {
    const { stats } = await api('/api/users/me');
    const get = key => stats.find(s => s._id === key) || { sessions: 0, total: 0, best: 0 };
    $('#profileGames').textContent = integer(stats.reduce((n, x) => n + x.sessions, 0));
    $('#profilePoints').textContent = integer(stats.reduce((n, x) => n + x.total, 0));
    $('#profileSerpent').textContent = integer(get('serpent').best);
    $('#profileBanana').textContent = integer(get('banana').best);
  } catch (err) { toast(err.message, true); }
  document.querySelectorAll('.color-choice').forEach(btn => btn.addEventListener('click', () => {
    selectedColor = btn.dataset.color;
    document.querySelectorAll('.color-choice').forEach(c => c.classList.toggle('selected', c === btn));
    $('#profileAvatar').dataset.color = selectedColor;
  }));
  $('#profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const button = $('#profileSave'); button.disabled = true;
    $('#profileMessage').textContent = '';
    try {
      const { user } = await patch('/api/users/me', { displayName: $('#displayName').value.trim(), avatarColor: selectedColor });
      renderIdentity(user);
      $('#profileMessage').className = 'success-text'; $('#profileMessage').textContent = '✓ Profile saved successfully.';
      $('#topAvatar').dataset.color = user.avatarColor; $('#topAvatar').textContent = user.displayName.charAt(0).toUpperCase();
      const sideAvatar = $('#sideAvatar');
      if (sideAvatar) { sideAvatar.dataset.color = user.avatarColor; sideAvatar.textContent = user.displayName.charAt(0).toUpperCase(); }
      if ($('#sideName')) $('#sideName').textContent = user.displayName;
    } catch (err) { $('#profileMessage').className = 'error-text'; $('#profileMessage').textContent = err.message; }
    finally { button.disabled = false; }
  });
  $('#passwordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const button = $('#passwordSave'); button.disabled = true;
    $('#passwordMessage').textContent = '';
    try {
      await post('/api/users/change-password', { currentPassword: $('#currentPassword').value, newPassword: $('#newPassword').value });
      $('#passwordMessage').className = 'success-text'; $('#passwordMessage').textContent = '✓ Password changed. Other devices were signed out.';
      $('#passwordForm').reset();
    } catch (err) { $('#passwordMessage').className = 'error-text'; $('#passwordMessage').textContent = err.message; }
    finally { button.disabled = false; }
  });
})();
