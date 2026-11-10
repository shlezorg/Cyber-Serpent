/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
(() => {
  'use strict';
  const { $, post, alertMessage, togglePasswords } = window.CS;
  togglePasswords();
  if (new URLSearchParams(window.location.search).get('database') === 'offline') {
    alertMessage('#formMessage', 'MongoDB Atlas is not connected yet. Check the terminal and Atlas Network Access settings.');
  }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (!email || !password) return alertMessage('#formMessage', 'Enter both email and password.');
    const button = $('#submitBtn');
    button.disabled = true; button.textContent = 'Signing you in…';
    alertMessage('#formMessage', '');
    try {
      await post('/api/auth/login', { email, password, remember: $('#remember').checked });
      window.location.replace('/dashboard.html');
    } catch (err) {
      alertMessage('#formMessage', err.message);
      button.disabled = false; button.textContent = 'Sign in →';
    }
  });
})();
