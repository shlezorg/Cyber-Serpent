/* AI-assisted scaffold: OpenAI ChatGPT. Student must review and acknowledge external/AI code for CIS046-3. */
(async () => {
  'use strict';
  const { $, post, setText, initPage, toast } = window.CS;
  if (!(await initPage('banana'))) return;
  const digits = [...document.querySelectorAll('.digit-btn')];
  let runId = null;
  let questionNonce = null;
  let round = 0;
  let busy = false;
  let completed = false;
  const status = message => setText('#bananaStatus', message);
  const feedback = (text, type = '') => { const el = $('#bananaFeedback'); el.textContent = text; el.className = `banana-feedback ${type}`; };
  const setChoices = enabled => digits.forEach(b => { b.disabled = !enabled; b.classList.remove('selected'); });
  const board = $('#questionBoard');

  function showQuestion(data) {
    runId = data.runId;
    questionNonce = data.nonce;
    round = data.round;
    completed = false;
    setText('#bananaScore', data.score);
    setText('#bananaRound', `${round}/${data.totalRounds}`);
    setText('#questionCaption', `Round ${round} of ${data.totalRounds} · Pick the missing digit`);
    feedback('');
    board.textContent = '';
    const image = document.createElement('img');
    image.src = data.image; image.alt = `Banana API visual math question, round ${round}`;
    image.addEventListener('error', () => { status('Question image could not be displayed.'); });
    board.append(image);
    setChoices(true);
    $('#bananaNext').classList.add('hidden');
    $('#bananaStart').classList.add('hidden');
    if (data.mock) {
      status('LOCAL MOCK MODE: test question only. Set BANANA_MOCK=0 for real Banana API integration.');
    } else status('Choose the correct answer from 0–9.');
  }
  async function start() {
    if (busy) return;
    busy = true; completed = false;
    const btn = $('#bananaStart'); btn.disabled = true;
    feedback(''); status('Loading challenge from the Banana API…');
    setChoices(false);
    try {
      const data = await post('/api/banana/start');
      showQuestion(data);
    } catch (err) { feedback('Unable to start challenge.', 'wrong'); status(err.message); btn.classList.remove('hidden'); }
    finally { busy = false; btn.disabled = false; }
  }
  async function submit(answer, button) {
    if (busy || !runId || !questionNonce || completed) return;
    busy = true; setChoices(false); button.classList.add('selected'); status('Checking your answer securely…');
    try {
      const result = await post('/api/banana/answer', { runId, nonce: questionNonce, answer });
      questionNonce = null;
      setText('#bananaScore', result.score);
      feedback(result.correct ? '+20 points! Correct answer ✓' : `Not quite! The answer was ${result.correctAnswer}.`, result.correct ? 'correct' : 'wrong');
      if (result.complete) {
        completed = true; runId = null;
        setText('#questionCaption', `Challenge complete · ${result.score}/100`);
        status(`Final score: ${result.score}/100. Saved to your player profile.`);
        $('#bananaStart').textContent = 'Play again ↻';
        $('#bananaStart').classList.remove('hidden');
      } else {
        status('Answer recorded. Continue to the next question.');
        $('#bananaNext').classList.remove('hidden');
      }
    } catch (err) { status(err.message); toast(err.message, true); if (questionNonce) setChoices(true); }
    finally { busy = false; }
  }
  async function next() {
    if (busy || !runId || questionNonce || completed) return;
    busy = true; const btn = $('#bananaNext'); btn.disabled = true;
    status('Fetching your next question…');
    try { const data = await post('/api/banana/next', { runId }); showQuestion(data); }
    catch (err) { status(err.message + ' Press Next question to retry.'); }
    finally { busy = false; btn.disabled = false; }
  }
  $('#bananaStart').addEventListener('click', start);
  $('#bananaNext').addEventListener('click', next);
  digits.forEach(button => button.addEventListener('click', () => submit(Number(button.dataset.answer), button)));
})();
