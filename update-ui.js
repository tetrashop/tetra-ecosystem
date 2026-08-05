const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Tetra Ecosystem v3.2 | پلتفرم یکپارچه</title>
  <style>
    :root {
      --bg: #0a0a1a;
      --card-bg: #12122e;
      --accent: #7c6ff7;
      --accent-hover: #6958f0;
      --text: #e8e8ff;
      --text-secondary: #a0a0c0;
      --success: #00e676;
      --error: #ff5252;
      --gold: #ffb74d;
      --border-radius: 18px;
      --transition: all 0.25s ease;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: Vazirmatn, Segoe UI, Tahoma, sans-serif;
      background: var(--bg);
      background-image:
        radial-gradient(ellipse at 20% 20%, #1a1a40 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, #0d0d24 0%, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem;
      scroll-behavior: smooth;
    }
    header {
      width: 100%;
      max-width: 1200px;
      text-align: center;
      margin-bottom: 2rem;
    }
    header h1 {
      font-size: 2.8rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.4rem;
      letter-spacing: -0.5px;
    }
    header p {
      color: var(--text-secondary);
      font-size: 1rem;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      width: 100%;
      max-width: 1200px;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(124,111,247,0.15);
      border-radius: var(--border-radius);
      padding: 1.6rem;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: var(--accent);
      box-shadow: 0 15px 35px -10px rgba(124,111,247,0.4);
    }
    .card h2 {
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .card p.desc {
      color: var(--text-secondary);
      margin-bottom: 1.2rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1rem;
    }
    input, textarea {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(124,111,247,0.25);
      border-radius: 12px;
      padding: 0.7rem 0.9rem;
      color: var(--text);
      font-size: 0.95rem;
      outline: none;
      transition: var(--transition);
      font-family: inherit;
      resize: vertical;
    }
    input:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(124,111,247,0.2);
      background: rgba(255,255,255,0.08);
    }
    button {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0.65rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      flex: 1;
      white-space: nowrap;
      min-width: 70px;
    }
    button:hover { background: var(--accent-hover); transform: scale(1.02); }
    button:active { transform: scale(0.97); }
    button:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .flex-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .result {
      margin-top: 1rem;
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      padding: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 0.8rem;
      color: var(--success);
      max-height: 240px;
      overflow-y: auto;
      border-right: 3px solid var(--accent);
      display: none;
      line-height: 1.6;
    }
    .result.show { display: block; }
    .result.error {
      color: var(--error);
      border-right-color: var(--error);
    }
    .result-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .clear-btn {
      background: transparent;
      border: 1px solid var(--text-secondary);
      color: var(--text-secondary);
      padding: 0.3rem 0.7rem;
      font-size: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: var(--transition);
    }
    .clear-btn:hover { border-color: var(--error); color: var(--error); }
    footer {
      margin-top: auto;
      padding: 1.2rem;
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.85rem;
      width: 100%;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
      margin-left: 4px;
    }
    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: #1b1b3a;
      color: #e0e0ff;
      padding: 0.7rem 1.5rem;
      border-radius: 30px;
      border: 1px solid var(--accent);
      font-size: 0.9rem;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease, bottom 0.3s ease;
      pointer-events: none;
    }
    .toast.show {
      opacity: 1;
      bottom: 50px;
    }
    @media (max-width: 500px) {
      header h1 { font-size: 2rem; }
      .card { padding: 1.2rem; }
      button { padding: 0.55rem 0.8rem; font-size: 0.85rem; }
      .flex-row { gap: 0.4rem; }
    }
  </style>
</head>
<body>
  <!-- Toast notification -->
  <div id="toast" class="toast"></div>

  <header>
    <h1>⚡ Tetra Ecosystem</h1>
    <p>پلتفرم یکپارچه هوش مصنوعی، بلاک‌چین، پردازش زبان طبیعی و امنیت</p>
    <div class="flex-row" style="justify-content:center; margin-top:1rem;">
      <button id="btn-health" onclick="checkHealth()">🩺 بررسی سلامت سرور</button>
    </div>
    <div id="health-result" class="result" style="max-width:400px;margin:1rem auto;"></div>
  </header>

  <div class="dashboard">
    <!-- کارت هوش مصنوعی -->
    <div class="card">
      <h2>🤖 هوش مصنوعی</h2>
      <p class="desc">تحلیل احساس، طبقه‌بندی، خلاصه‌سازی و تشخیص زبان</p>
      <div class="input-group">
        <input type="text" id="ai-text" placeholder="متن خود را وارد کنید ..." onkeypress="if(event.key==='Enter') aiSentiment()">
      </div>
      <div class="flex-row">
        <button id="btn-sentiment" onclick="aiSentiment()">تحلیل احساس</button>
        <button id="btn-classify" onclick="aiClassify()">طبقه‌بندی</button>
        <button id="btn-summarize" onclick="aiSummarize()">خلاصه</button>
        <button id="btn-language" onclick="aiDetectLang()">زبان</button>
      </div>
      <div class="result-actions">
        <button class="clear-btn" onclick="clearResult('ai-result')">✕ پاک کردن</button>
      </div>
      <div id="ai-result" class="result"></div>
    </div>

    <!-- کارت بلاک‌چین -->
    <div class="card">
      <h2>⛓️ بلاک‌چین</h2>
      <p class="desc">مشاهده زنجیره، استخراج بلوک و اعتبارسنجی</p>
      <div class="input-group">
        <input type="text" id="block-data" placeholder="داده‌ی بلوک (متن)" onkeypress="if(event.key==='Enter') mineBlock()">
      </div>
      <div class="flex-row">
        <button id="btn-chain" onclick="getChain()">📋 زنجیره</button>
        <button id="btn-mine" onclick="mineBlock()">⛏️ استخراج</button>
        <button id="btn-validate" onclick="validateChain()">✅ اعتبارسنجی</button>
      </div>
      <div class="result-actions">
        <button class="clear-btn" onclick="clearResult('blockchain-result')">✕ پاک کردن</button>
      </div>
      <div id="blockchain-result" class="result"></div>
    </div>

    <!-- کارت NLP -->
    <div class="card">
      <h2>🗣️ پردازش زبان طبیعی</h2>
      <p class="desc">توکنایز، ریشه‌یابی و استخراج کلیدواژه</p>
      <div class="input-group">
        <textarea id="nlp-text" rows="3" placeholder="متنی برای پردازش ..."></textarea>
      </div>
      <div class="flex-row">
        <button id="btn-tokenize" onclick="nlpTokenize()">برش</button>
        <button id="btn-stem" onclick="nlpStem()">ریشه‌یابی</button>
        <button id="btn-tfidf" onclick="nlpTFIDF()">TF-IDF</button>
      </div>
      <div class="result-actions">
        <button class="clear-btn" onclick="clearResult('nlp-result')">✕ پاک کردن</button>
      </div>
      <div id="nlp-result" class="result"></div>
    </div>

    <!-- کارت امنیت -->
    <div class="card">
      <h2>🔐 امنیت</h2>
      <p class="desc">ثبت‌نام، ورود و هش‌سازی</p>
      <div class="input-group">
        <input type="text" id="sec-username" placeholder="نام کاربری">
        <input type="password" id="sec-password" placeholder="رمز عبور">
      </div>
      <div class="flex-row">
        <button id="btn-register" onclick="registerUser()">ثبت‌نام</button>
        <button id="btn-login" onclick="loginUser()">ورود</button>
        <button id="btn-hash" onclick="hashText()"># هش</button>
      </div>
      <div class="result-actions">
        <button class="clear-btn" onclick="clearResult('security-result')">✕ پاک کردن</button>
      </div>
      <div id="security-result" class="result"></div>
    </div>
  </div>

  <footer>Tetra Ecosystem v3.2.0 | ساخته‌شده با ❤️</footer>

  <script>
    const API_BASE = window.location.origin;

    // Toast notification
    function showToast(message, duration = 2000) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), duration);
    }

    function showResult(elementId, data, isError = false) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.classList.add('show');
      el.classList.toggle('error', isError);
      el.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    }

    function clearResult(elementId) {
      const el = document.getElementById(elementId);
      if (el) { el.classList.remove('show'); el.textContent = ''; }
    }

    function setButtonLoading(btnId, text = '...') {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.disabled = true;
      btn.dataset.origHTML = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> ' + text;
    }

    function resetButton(btnId) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.disabled = false;
      if (btn.dataset.origHTML) btn.innerHTML = btn.dataset.origHTML;
    }

    async function apiPost(endpoint, body, resultId, btnId) {
      if (btnId) setButtonLoading(btnId);
      try {
        const res = await fetch(API_BASE + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        showResult(resultId, res.ok ? data : (data.error || data.message || 'خطا'), !res.ok);
        if (res.ok) showToast('✅ عملیات موفق');
        else showToast('❌ ' + (data.error || 'خطا'));
      } catch (e) {
        showResult(resultId, 'ارتباط با سرور برقرار نشد', true);
        showToast('⚠️ خطا در ارتباط');
      } finally {
        if (btnId) resetButton(btnId);
      }
    }

    async function apiGet(endpoint, resultId, btnId) {
      if (btnId) setButtonLoading(btnId);
      try {
        const res = await fetch(API_BASE + endpoint);
        const data = await res.json();
        showResult(resultId, res.ok ? data : (data.error || data.message || 'خطا'), !res.ok);
        if (res.ok) showToast('✅ دریافت موفق');
        else showToast('❌ ' + (data.error || 'خطا'));
      } catch (e) {
        showResult(resultId, 'ارتباط با سرور برقرار نشد', true);
        showToast('⚠️ خطا در ارتباط');
      } finally {
        if (btnId) resetButton(btnId);
      }
    }

    async function checkHealth() {
      setButtonLoading('btn-health');
      try {
        const res = await fetch(API_BASE + '/api');
        const data = await res.json();
        showResult('health-result', data);
        showToast('🟢 سرور فعال است');
      } catch (e) {
        showResult('health-result', 'سرور در دسترس نیست', true);
        showToast('🔴 سرور در دسترس نیست');
      } finally {
        resetButton('btn-health');
      }
    }

    // هوش مصنوعی
    function aiSentiment() {
      const text = document.getElementById('ai-text').value.trim();
      if (!text) return showResult('ai-result', 'لطفاً متنی وارد کنید.', true);
      apiPost('/api/v3/ai/sentiment', { text }, 'ai-result', 'btn-sentiment');
    }
    function aiClassify() {
      const text = document.getElementById('ai-text').value.trim();
      if (!text) return showResult('ai-result', 'لطفاً متنی وارد کنید.', true);
      apiPost('/api/v3/ai/classify', { text }, 'ai-result', 'btn-classify');
    }
    function aiSummarize() {
      const text = document.getElementById('ai-text').value.trim();
      if (!text) return showResult('ai-result', 'لطفاً متنی وارد کنید.', true);
      apiPost('/api/v3/ai/summarize', { text, sentences: 2 }, 'ai-result', 'btn-summarize');
    }
    function aiDetectLang() {
      const text = document.getElementById('ai-text').value.trim();
      if (!text) return showResult('ai-result', 'لطفاً متنی وارد کنید.', true);
      apiPost('/api/v3/ai/detect-language', { text }, 'ai-result', 'btn-language');
    }

    // بلاک‌چین
    function getChain() { apiGet('/api/v3/blockchain/chain', 'blockchain-result', 'btn-chain'); }
    function mineBlock() {
      const data = document.getElementById('block-data').value.trim();
      if (!data) return showResult('blockchain-result', 'داده الزامی است', true);
      apiPost('/api/v3/blockchain/mine', { data }, 'blockchain-result', 'btn-mine');
    }
    function validateChain() { apiGet('/api/v3/blockchain/validate', 'blockchain-result', 'btn-validate'); }

    // NLP
    function nlpTokenize() {
      const text = document.getElementById('nlp-text').value.trim();
      if (!text) return showResult('nlp-result', 'متنی وارد کنید', true);
      apiPost('/api/v3/nlp/tokenize', { text }, 'nlp-result', 'btn-tokenize');
    }
    function nlpStem() {
      const text = document.getElementById('nlp-text').value.trim();
      if (!text) return showResult('nlp-result', 'متنی وارد کنید', true);
      apiPost('/api/v3/nlp/stem', { text }, 'nlp-result', 'btn-stem');
    }
    function nlpTFIDF() {
      const text = document.getElementById('nlp-text').value.trim();
      if (!text) return showResult('nlp-result', 'متنی وارد کنید', true);
      apiPost('/api/v3/nlp/tfidf', { text }, 'nlp-result', 'btn-tfidf');
    }

    // امنیت
    function registerUser() {
      const u = document.getElementById('sec-username').value.trim();
      const p = document.getElementById('sec-password').value;
      if (!u || !p) return showResult('security-result', 'هر دو فیلد الزامی است', true);
      apiPost('/api/v3/security/register', { username: u, password: p }, 'security-result', 'btn-register');
    }
    function loginUser() {
      const u = document.getElementById('sec-username').value.trim();
      const p = document.getElementById('sec-password').value;
      if (!u || !p) return showResult('security-result', 'هر دو فیلد الزامی است', true);
      apiPost('/api/v3/security/login', { username: u, password: p }, 'security-result', 'btn-login');
    }
    function hashText() {
      const p = document.getElementById('sec-password').value.trim();
      const u = document.getElementById('sec-username').value.trim();
      const text = p || u;
      if (!text) return showResult('security-result', 'متنی وارد کنید', true);
      apiPost('/api/v3/security/hash', { text }, 'security-result', 'btn-hash');
    }
  </script>
</body>
</html>`;

// نوشتن فایل
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('✅ public/index.html با موفقیت به‌روزرسانی شد.');
console.log('ویژگی‌های اضافه‌شده:');
console.log('  - اعلان‌های toast برای بازخورد فوری');
console.log('  - دکمه‌های پاک‌سازی نتیجه');
console.log('  - امکان ارسال با فشردن Enter');
console.log('  - طراحی واکنش‌گرا برای موبایل');
console.log('  - نمایش اسپینر حین بارگذاری');
