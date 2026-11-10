/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
(() => {
  'use strict';
  const { $, post, alertMessage, togglePasswords } = window.CS;
  togglePasswords();
  $('#signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = $('#username').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    const confirm = $('#confirmPassword').value;
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return alertMessage('#formMessage', 'Use 3–20 letters, numbers or underscores for your username.');
    if (!$('#email').validity.valid || !email) return alertMessage('#formMessage', 'Please enter a valid email address.');
    if (password.length < 8) return alertMessage('#formMessage', 'Your password needs at least 8 characters.');
    if (password !== confirm) return alertMessage('#formMessage', 'Passwords do not match.');
    const button = $('#submitBtn');
    button.disabled = true; button.textContent = 'Creating your account…';
    alertMessage('#formMessage', '');
    try {
      await post('/api/auth/register', { username, email, password });
      window.location.replace('/dashboard.html');
    } catch (err) {
      alertMessage('#formMessage', err.message);
      button.disabled = false; button.textContent = 'Create player account →';
    }
  });
})();
