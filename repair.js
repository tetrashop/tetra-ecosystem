const fs = require('fs');
const { execSync } = require('child_process');

// پاک‌سازی پوشه‌های قبلی (به‌جز repair.js)
console.log('🧹 پاک‌سازی فایل‌های قدیمی...');
const keep = ['repair.js'];
fs.readdirSync('.').forEach(f => {
  if (!keep.includes(f)) {
    const stat = fs.statSync(f);
    if (stat.isDirectory()) fs.rmSync(f, { recursive: true, force: true });
    else fs.unlinkSync(f);
  }
});

// ساختار پوشه‌ها
fs.mkdirSync('api', { recursive: true });
fs.mkdirSync('middleware', { recursive: true });
fs.mkdirSync('services', { recursive: true });
fs.mkdirSync('public', { recursive: true });

// ------------------- فایل‌ها -------------------
const files = {
  '.env.example': `PORT=3001
JWT_SECRET=change-me-to-a-random-string
BCRYPT_SALT_ROUNDS=12`,

  '.gitignore': `node_modules/
.env
*.log`,

  'package.json': `{
  "name": "tetra-ecosystem",
  "version": "3.1.0",
  "description": "Tetra Ecosystem - Integrated Platform (AI, Blockchain, NLP, Security)",
  "main": "api/index.js",
  "scripts": {
    "start": "node api/index.js",
    "dev": "nodemon api/index.js",
    "terminal": "node terminal-ui.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "joi": "^17.11.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "natural": "^6.10.4",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18"
  }
}`,

  'api/index.js': `require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const aiRoutes = require('../services/aiService');
const blockchainRoutes = require('../services/blockchainService');
const nlpRoutes = require('../services/nlpService');
const securityRoutes = require('../services/securityService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/v3/ai', aiRoutes);
app.use('/api/v3/blockchain', blockchainRoutes);
app.use('/api/v3/nlp', nlpRoutes);
app.use('/api/v3/security', securityRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Tetra Ecosystem v3.1.0',
    status: 'active',
    modules: ['ai', 'blockchain', 'nlp', 'security']
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`Tetra Ecosystem running on port \${PORT}\`);
  });
}

module.exports = app;`,

  'middleware/errorHandler.js': `class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  res.status(statusCode).json({ success: false, error: message });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(\`Route \${req.originalUrl} not found\`, 404));
};

module.exports = { errorHandler, notFoundHandler, AppError };`,

  'middleware/validate.js': `const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ success: false, error: message });
  }
  next();
};
module.exports = validate;`,

  'services/aiService.js': `const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const router = express.Router();

const analyzeSentiment = (text) => {
  const positive = ['خوب', 'عالی', 'مثبت', 'خوشحال', 'عشق', 'عالیه', 'بهترین', 'فوقالعاده', 'شاد'];
  const negative = ['بد', 'ضعیف', 'منفی', 'غمگین', 'ناراحت', 'افتضاح', 'بدترین'];
  const lower = text.toLowerCase();
  let score = 0;
  positive.forEach(w => { if (lower.includes(w)) score++; });
  negative.forEach(w => { if (lower.includes(w)) score--; });
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

const classifyText = (text) => {
  const categories = {
    ورزشی: ['فوتبال', 'ورزش', 'بازی', 'تیم'],
    فناوری: ['هوش مصنوعی', 'فناوری', 'کامپیوتر', 'برنامه'],
    سلامت: ['بیماری', 'درمان', 'پزشک', 'سلامت'],
    سیاسی: ['دولت', 'مجلس', 'انتخابات', 'سیاست'],
  };
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(w => lower.includes(w))) return cat;
  }
  return 'عمومی';
};

const textSchema = Joi.object({ text: Joi.string().trim().min(1).max(1000).required() });

router.post('/sentiment', validate(textSchema), (req, res) => {
  const sentiment = analyzeSentiment(req.body.text);
  res.json({ success: true, module: 'ai', action: 'sentiment', data: { text: req.body.text, sentiment } });
});

router.post('/classify', validate(textSchema), (req, res) => {
  const category = classifyText(req.body.text);
  res.json({ success: true, module: 'ai', action: 'classify', data: { text: req.body.text, category } });
});

module.exports = router;`,

  'services/blockchainService.js': `const express = require('express');
const crypto = require('crypto');
const Joi = require('joi');
const validate = require('../middleware/validate');
const router = express.Router();

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }
  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce)
      .digest('hex');
  }
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
  }
  createGenesisBlock() { return new Block(0, '01/01/2020', 'Genesis Block', '0'); }
  getLatestBlock() { return this.chain[this.chain.length - 1]; }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i], prev = this.chain[i - 1];
      if (curr.hash !== curr.calculateHash()) return false;
      if (curr.previousHash !== prev.hash) return false;
    }
    return true;
  }
}

const tetraChain = new Blockchain();
const blockSchema = Joi.object({ data: Joi.string().min(1).max(500).required() });

router.get('/chain', (req, res) => {
  res.json({ success: true, module: 'blockchain', action: 'chain', data: { chain: tetraChain.chain, length: tetraChain.chain.length } });
});
router.post('/mine', validate(blockSchema), (req, res) => {
  const newBlock = new Block(tetraChain.chain.length, new Date().toISOString(), req.body.data);
  tetraChain.addBlock(newBlock);
  res.status(201).json({ success: true, module: 'blockchain', action: 'mine', data: { block: newBlock } });
});
router.get('/validate', (req, res) => {
  const valid = tetraChain.isChainValid();
  res.json({ success: true, module: 'blockchain', action: 'validate', data: { isValid: valid } });
});

module.exports = router;`,

  'services/nlpService.js': `const express = require('express');
const natural = require('natural');
const Joi = require('joi');
const validate = require('../middleware/validate');
const router = express.Router();

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const textSchema = Joi.object({ text: Joi.string().trim().min(1).max(5000).required() });

router.post('/tokenize', validate(textSchema), (req, res) => {
  const tokens = tokenizer.tokenize(req.body.text);
  res.json({ success: true, module: 'nlp', action: 'tokenize', data: { tokens, count: tokens.length } });
});

router.post('/stem', validate(textSchema), (req, res) => {
  const tokens = tokenizer.tokenize(req.body.text);
  const stems = tokens.map(t => stemmer.stem(t));
  res.json({ success: true, module: 'nlp', action: 'stem', data: { original: tokens, stems } });
});

router.post('/tfidf', validate(textSchema), (req, res) => {
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(req.body.text);
  const terms = tfidf.listTerms(0).slice(0, 10).map(t => ({ term: t.term, tfidf: t.tfidf }));
  res.json({ success: true, module: 'nlp', action: 'tfidf', data: { terms } });
});

module.exports = router;`,

  'services/securityService.js': `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const router = express.Router();

const users = [];

const hashPassword = async (password) => {
  return bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
};

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required()
});
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});
const hashSchema = Joi.object({ text: Joi.string().required() });

const generateToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) throw new AppError('Username already exists', 409);
    const hashed = await hashPassword(password);
    const user = { id: users.length + 1, username, password: hashed };
    users.push(user);
    const token = generateToken({ id: user.id, username });
    res.status(201).json({ success: true, module: 'security', action: 'register', data: { token } });
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError('Invalid credentials', 401);
    const token = generateToken({ id: user.id, username });
    res.json({ success: true, module: 'security', action: 'login', data: { token } });
  } catch (err) { next(err); }
});

router.post('/hash', validate(hashSchema), (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.text).digest('hex');
  res.json({ success: true, module: 'security', action: 'hash', data: { algorithm: 'sha256', hash } });
});

module.exports = router;`,

  'public/index.html': `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Tetra Ecosystem | پلتفرم یکپارچه</title>
  <style>
    :root { --bg: #0a0a1a; --card-bg: #12122e; --accent: #7c6ff7; --accent-hover: #6958f0; --text: #e8e8ff; --text-secondary: #a0a0c0; --success: #00e676; --error: #ff5252; --gold: #ffb74d; --border-radius: 18px; --transition: all 0.25s ease; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Vazirmatn, Segoe UI, Tahoma, sans-serif; background: var(--bg); background-image: radial-gradient(ellipse at 20% 20%, #1a1a40 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #0d0d24 0%, transparent 50%); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 1.5rem; }
    header { width: 100%; max-width: 1200px; text-align: center; margin-bottom: 2.5rem; }
    header h1 { font-size: 3rem; font-weight: 900; background: linear-gradient(135deg, var(--accent), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
    header p { color: var(--text-secondary); font-size: 1.1rem; }
    .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; width: 100%; max-width: 1200px; }
    .card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid rgba(124,111,247,0.15); border-radius: var(--border-radius); padding: 1.8rem; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); transition: var(--transition); display: flex; flex-direction: column; }
    .card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 15px 35px -10px rgba(124,111,247,0.4); }
    .card h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--accent); display: flex; align-items: center; gap: 0.5rem; }
    .card p.desc { color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.6; }
    .input-group { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.2rem; }
    input, textarea { background: rgba(255,255,255,0.06); border: 1px solid rgba(124,111,247,0.25); border-radius: 12px; padding: 0.9rem 1rem; color: var(--text); font-size: 0.95rem; outline: none; transition: var(--transition); font-family: inherit; resize: vertical; }
    input:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,111,247,0.2); background: rgba(255,255,255,0.08); }
    button { background: var(--accent); color: #fff; border: none; border-radius: 12px; padding: 0.8rem 1.4rem; font-size: 0.95rem; cursor: pointer; transition: var(--transition); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; flex: 1; white-space: nowrap; min-width: 90px; }
    button:hover { background: var(--accent-hover); transform: scale(1.02); }
    button:active { transform: scale(0.97); }
    button:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .flex-row { display: flex; gap: 0.7rem; flex-wrap: wrap; }
    .result { margin-top: 1.2rem; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 1rem; white-space: pre-wrap; word-break: break-word; font-family: 'Fira Code', 'Courier New', monospace; font-size: 0.85rem; color: var(--success); max-height: 260px; overflow-y: auto; border-right: 3px solid var(--accent); display: none; line-height: 1.7; }
    .result.show { display: block; }
    .result.error { color: var(--error); border-right-color: var(--error); }
    footer { margin-top: auto; padding: 1.5rem; color: var(--text-secondary); text-align: center; font-size: 0.9rem; width: 100%; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-left: 5px; }
    @media (max-width: 500px) { header h1 { font-size: 2.2rem; } .card { padding: 1.2rem; } button { padding: 0.7rem 1rem; font-size: 0.9rem; } }
  </style>
</head>
<body>
  <header>
    <h1>⚡ Tetra Ecosystem</h1>
    <p>پلتفرم یکپارچه هوش مصنوعی، بلاک‌چین، پردازش زبان طبیعی و امنیت</p>
    <button id="btn-health" onclick="checkHealth()">🩺 بررسی سلامت سرور</button>
    <div id="health-result" class="result" style="max-width:400px;margin:1rem auto;"></div>
  </header>

  <div class="dashboard">
    <div class="card">
      <h2>🤖 هوش مصنوعی</h2>
      <p class="desc">تحلیل احساس و طبقه‌بندی متن</p>
      <div class="input-group"><input type="text" id="ai-text" placeholder="متن خود را وارد کنید ..."></div>
      <div class="flex-row">
        <button id="btn-sentiment" onclick="aiSentiment()">تحلیل احساس</button>
        <button id="btn-classify" onclick="aiClassify()">طبقه‌بندی موضوع</button>
      </div>
      <div id="ai-result" class="result"></div>
    </div>

    <div class="card">
      <h2>⛓️ بلاک‌چین</h2>
      <p class="desc">مشاهده زنجیره، استخراج بلوک و اعتبارسنجی</p>
      <div class="input-group"><input type="text" id="block-data" placeholder="داده‌ی بلوک (متن)"></div>
      <div class="flex-row">
        <button id="btn-chain" onclick="getChain()">📋 زنجیره</button>
        <button id="btn-mine" onclick="mineBlock()">⛏️ استخراج</button>
        <button id="btn-validate" onclick="validateChain()">✅ اعتبارسنجی</button>
      </div>
      <div id="blockchain-result" class="result"></div>
    </div>

    <div class="card">
      <h2>🗣️ پردازش زبان طبیعی</h2>
      <p class="desc">توکنایز، ریشه‌یابی و استخراج کلیدواژه</p>
      <div class="input-group"><textarea id="nlp-text" rows="3" placeholder="متنی برای پردازش ..."></textarea></div>
      <div class="flex-row">
        <button id="btn-tokenize" onclick="nlpTokenize()">برش</button>
        <button id="btn-stem" onclick="nlpStem()">ریشه‌یابی</button>
        <button id="btn-tfidf" onclick="nlpTFIDF()">TF-IDF</button>
      </div>
      <div id="nlp-result" class="result"></div>
    </div>

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
      <div id="security-result" class="result"></div>
    </div>
  </div>

  <footer>Tetra Ecosystem v3.1.0 | ساخته‌شده با ❤️</footer>

  <script>
    // Automatic base URL – works when served via http
    const API_BASE = window.location.origin;

    function showResult(elementId, data, isError = false) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.classList.add('show');
      el.classList.toggle('error', isError);
      el.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    }

    function setButtonLoading(btnId, text = '... در حال پردازش') {
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
      } catch (e) {
        showResult(resultId, 'ارتباط با سرور برقرار نشد', true);
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
      } catch (e) {
        showResult(resultId, 'ارتباط با سرور برقرار نشد', true);
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
      } catch (e) {
        showResult('health-result', 'سرور در دسترس نیست', true);
      } finally {
        resetButton('btn-health');
      }
    }

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
    function getChain() { apiGet('/api/v3/blockchain/chain', 'blockchain-result', 'btn-chain'); }
    function mineBlock() {
      const data = document.getElementById('block-data').value.trim();
      if (!data) return showResult('blockchain-result', 'داده الزامی است', true);
      apiPost('/api/v3/blockchain/mine', { data }, 'blockchain-result', 'btn-mine');
    }
    function validateChain() { apiGet('/api/v3/blockchain/validate', 'blockchain-result', 'btn-validate'); }
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
</html>`,

  'terminal-ui.js': `const readline = require('readline');
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const BASE = \`http://127.0.0.1:\${PORT}\`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname, method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function question(q) { return new Promise(resolve => rl.question(q, resolve)); }

async function mainMenu() {
  console.log(\`\\n=== Tetra Terminal UI (\${BASE}) ===\`);
  console.log('1. سلامت سرور');
  console.log('2. تحلیل احساس');
  console.log('3. طبقه‌بندی متن');
  console.log('4. زنجیره بلوکی');
  console.log('5. استخراج بلوک');
  console.log('6. اعتبارسنجی زنجیره');
  console.log('7. توکنایز');
  console.log('8. ریشه‌یابی');
  console.log('9. TF-IDF');
  console.log('10. ثبت‌نام');
  console.log('11. ورود');
  console.log('12. هش');
  console.log('0. خروج');
  const choice = await question('گزینه: ');
  try {
    switch (choice) {
      case '1': console.log(await request('GET', '/api')); break;
      case '2': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/sentiment', { text: t })); break; }
      case '3': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/classify', { text: t })); break; }
      case '4': console.log(await request('GET', '/api/v3/blockchain/chain')); break;
      case '5': { const d = await question('داده بلوک: '); console.log(await request('POST', '/api/v3/blockchain/mine', { data: d })); break; }
      case '6': console.log(await request('GET', '/api/v3/blockchain/validate')); break;
      case '7': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/tokenize', { text: t })); break; }
      case '8': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/stem', { text: t })); break; }
      case '9': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/tfidf', { text: t })); break; }
      case '10': { const u = await question('نام کاربری: '); const p = await question('رمز: '); console.log(await request('POST', '/api/v3/security/register', { username: u, password: p })); break; }
      case '11': { const u = await question('نام کاربری: '); const p = await question('رمز: '); console.log(await request('POST', '/api/v3/security/login', { username: u, password: p })); break; }
      case '12': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/security/hash', { text: t })); break; }
      case '0': process.exit(0);
      default: console.log('گزینه نامعتبر');
    }
  } catch (e) { console.error('خطا:', e.message); }
  mainMenu();
}
mainMenu();`,

  'README.md': `# Tetra Ecosystem v3.1.0

پلتفرم یکپارچه هوش مصنوعی، بلاک‌چین، پردازش زبان طبیعی و امنیت.

## 🚀 شروع سریع

### پیش‌نیازها
- Node.js >= 18
- npm

### نصب
\`\`\`bash
git clone https://github.com/tetrashop/tetra-ecosystem.git
cd tetra-ecosystem
npm install
cp .env.example .env   # تنظیمات دلخواه (PORT, JWT_SECRET)
\`\`\`

### اجرای سرور
\`\`\`bash
npm start
\`\`\`

### استفاده از رابط گرافیکی
در مرورگر خود (ترجیحاً Chrome یا Firefox) آدرس \`http://127.0.0.1:3001\` را باز کنید.  
(اگر پورت را در \`.env\` تغییر دادید، آن را جایگزین کنید)

⚠️ **نکته مهم:** برای اینکه fetch کار کند، باید حتماً از طریق \`http://\` به سرور متصل شوید، نه با باز کردن مستقیم فایل HTML. در اندروید، وای‌فای را روشن نگه دارید.

### استفاده از رابط ترمینال
\`\`\`bash
npm run terminal
\`\`\`
یا
\`\`\`bash
node terminal-ui.js
\`\`\`
(سرور باید در حال اجرا باشد – می‌توانید از \`start.sh\` استفاده کنید)

## 🧩 قابلیت‌ها

### API endpoints
#### هوش مصنوعی
- \`POST /api/v3/ai/sentiment\` – تحلیل احساس (مثبت/منفی/خنثی)
- \`POST /api/v3/ai/classify\` – طبقه‌بندی موضوع (ورزشی، فناوری، ...)

#### بلاک‌چین
- \`GET /api/v3/blockchain/chain\` – دریافت زنجیره
- \`POST /api/v3/blockchain/mine\` – استخراج بلوک جدید
- \`GET /api/v3/blockchain/validate\` – بررسی اعتبار

#### پردازش زبان طبیعی (NLP)
- \`POST /api/v3/nlp/tokenize\` – شکستن متن
- \`POST /api/v3/nlp/stem\` – ریشه‌یابی
- \`POST /api/v3/nlp/tfidf\` – استخراج کلیدواژه‌ها

#### امنیت
- \`POST /api/v3/security/register\` – ثبت‌نام (JWT)
- \`POST /api/v3/security/login\` – ورود
- \`POST /api/v3/security/hash\` – هش SHA-256

## 🛠️ رفع مشکلات رایج

### خطای \`EADDRINUSE\` (پورت در حال استفاده)
- سرور را با \`Ctrl+C\` متوقف کنید.
- فرآیندهای Node را بکشید: \`killall node\` یا \`pkill node\`.
- پورت را در \`.env\` تغییر دهید: \`PORT=3002\`.

### دکمه‌های رابط کاربری کار نمی‌کنند (نمایش «سرور در دسترس نیست»)
- مطمئن شوید صفحه را از طریق \`http://127.0.0.1:PORT\` باز کرده‌اید، نه از \`file://\`.
- کش مرورگر را پاک کنید (Ctrl+Shift+R).
- وای‌فای اندروید را روشن کنید (حتی بدون اتصال به شبکه).
- از مرورگر دیگری مانند Firefox استفاده کنید.

### خطای \`CORS\` یا \`fetch\` در ترمینال
- از رابط ترمینالی (\`node terminal-ui.js\`) استفاده کنید که با ماژول \`http\` کار می‌کند و مشکلی با CORS ندارد.

## 📁 ساختار پروژه
\`\`\`
tetra-ecosystem/
├── api/
│   └── index.js          // Express server
├── middleware/
│   ├── errorHandler.js
│   └── validate.js
├── services/
│   ├── aiService.js
│   ├── blockchainService.js
│   ├── nlpService.js
│   └── securityService.js
├── public/
│   └── index.html        // رابط گرافیکی
├── terminal-ui.js         // رابط ترمینال
├── .env.example
├── package.json
└── README.md
\`\`\`

## 🤝 مشارکت
پیشنهادات و اصلاحات را از طریق Pull Request ارسال کنید.

## 📄 مجوز
MIT`
};

// نوشتن فایل‌ها
for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✔ ایجاد شد: ${filePath}`);
}

// نصب وابستگی‌ها
console.log('\n📦 نصب بسته‌های npm...');
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('✅ نصب با موفقیت انجام شد.');
} catch (e) {
  console.error('⚠️ خطا در نصب بسته‌ها. لطفاً دستی اجرا کنید: npm install --legacy-peer-deps');
}

// کپی .env در صورت عدم وجود
if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.example', '.env');
  console.log('📄 .env از روی نمونه ساخته شد.');
}

console.log('\n🎉 پروژه با موفقیت ترمیم شد!');
console.log('اکنون می‌توانید با دستور npm start سرور را اجرا کنید.');
console.log('سپس در مرورگر: http://127.0.0.1:3001');
