const fs = require('fs');
const { execSync } = require('child_process');

// پاکسازی (فقط repair.js و develop.js نگه داشته شوند)
console.log('🧹 آماده‌سازی...');
const keep = ['develop.js','repair.js'];
if (fs.existsSync('.')) {
  fs.readdirSync('.').forEach(f => {
    if (!keep.includes(f)) {
      const stat = fs.statSync(f);
      if (stat.isDirectory()) fs.rmSync(f, { recursive: true, force: true });
      else fs.unlinkSync(f);
    }
  });
}

// ساخت پوشه‌ها
fs.mkdirSync('api', { recursive: true });
fs.mkdirSync('middleware', { recursive: true });
fs.mkdirSync('services', { recursive: true });
fs.mkdirSync('public', { recursive: true });
fs.mkdirSync('data', { recursive: true });

// فایل‌های داده‌ی اولیه
fs.writeFileSync('data/blockchain.json', JSON.stringify([
  { index: 0, timestamp: '01/01/2020', data: 'Genesis Block', previousHash: '0', hash: 'a3ce34c39d1afefc06f6c3eae2e9430605833af4d0328de2990fbc200fa3a8ce', nonce: 0 }
], null, 2));
fs.writeFileSync('data/users.json', '[]');

// ---------------------- فایل‌های پروژه ----------------------
const files = {
  '.env.example': `PORT=3001
JWT_SECRET=change-me-to-a-random-string
BCRYPT_SALT_ROUNDS=12`,

  '.gitignore': `node_modules/
.env
data/*.json
*.log`,

  'package.json': JSON.stringify({
    name: "tetra-ecosystem",
    version: "3.2.0",
    description: "Tetra Ecosystem - Integrated Platform (AI, Blockchain, NLP, Security) with persistence",
    main: "api/index.js",
    scripts: {
      start: "node api/index.js",
      dev: "nodemon api/index.js",
      terminal: "node terminal-ui.js"
    },
    dependencies: {
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
    devDependencies: {
      "nodemon": "^3.0.2"
    },
    engines: {
      node: ">=18"
    }
  }, null, 2),

  'api/index.js': `require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// بارگذاری داده‌های دائمی
const blockchainFile = path.join(__dirname, '..', 'data', 'blockchain.json');
const usersFile = path.join(__dirname, '..', 'data', 'users.json');

// اطمینان از وجود فایل‌ها
if (!fs.existsSync(blockchainFile)) fs.writeFileSync(blockchainFile, '[]');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

// اشتراک‌گذاری مسیرها با سرویس‌ها (از طریق متغیر محیطی یا مستقیم)
process.env.BLOCKCHAIN_FILE = blockchainFile;
process.env.USERS_FILE = usersFile;

const aiRoutes = require('../services/aiService');
const blockchainRoutes = require('../services/blockchainService');
const nlpRoutes = require('../services/nlpService');
const securityRoutes = require('../services/securityService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/v3/ai', aiRoutes);
app.use('/api/v3/blockchain', blockchainRoutes);
app.use('/api/v3/nlp', nlpRoutes);
app.use('/api/v3/security', securityRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({
    message: 'Tetra Ecosystem v3.2.0',
    status: 'active',
    modules: ['ai', 'blockchain', 'nlp', 'security'],
    persistence: 'file-based'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  // بررسی متغیرهای ضروری
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-to-a-random-string') {
    console.warn('⚠️  هشدار: JWT_SECRET امن نیست. لطفاً در .env تغییر دهید.');
  }
  app.listen(PORT, () => {
    console.log(\`Tetra Ecosystem v3.2.0 running on port \${PORT}\`);
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
const natural = require('natural');
const validate = require('../middleware/validate');
const router = express.Router();

const tokenizer = new natural.WordTokenizer();

// Sentiment analysis
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

// Text classification
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

// Extractive summarization (simple)
const summarizeText = (text, numSentences = 2) => {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  if (sentences.length <= numSentences) return text;
  const wordFreq = {};
  const words = tokenizer.tokenize(text.toLowerCase());
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const sentenceScores = sentences.map(s => {
    const tokens = tokenizer.tokenize(s.toLowerCase());
    return tokens.reduce((sum, t) => sum + (wordFreq[t] || 0), 0) / tokens.length;
  });
  const ranked = sentences.map((s, i) => ({ s, score: sentenceScores[i] }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, numSentences).map(r => r.s).join(' ');
};

// Language detection (simple heuristic)
const detectLanguage = (text) => {
  const persianRegex = /[\u0600-\u06FF]/;
  return persianRegex.test(text) ? 'fa' : 'en';
};

const textSchema = Joi.object({ text: Joi.string().trim().min(1).max(5000).required() });
const summarizeSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
  sentences: Joi.number().integer().min(1).max(5).default(2)
});

router.post('/sentiment', validate(textSchema), (req, res) => {
  const sentiment = analyzeSentiment(req.body.text);
  res.json({ success: true, module: 'ai', action: 'sentiment', data: { text: req.body.text, sentiment } });
});

router.post('/classify', validate(textSchema), (req, res) => {
  const category = classifyText(req.body.text);
  res.json({ success: true, module: 'ai', action: 'classify', data: { text: req.body.text, category } });
});

router.post('/summarize', validate(summarizeSchema), (req, res) => {
  const summary = summarizeText(req.body.text, req.body.sentences);
  res.json({ success: true, module: 'ai', action: 'summarize', data: { original_length: req.body.text.length, summary } });
});

router.post('/detect-language', validate(textSchema), (req, res) => {
  const lang = detectLanguage(req.body.text);
  res.json({ success: true, module: 'ai', action: 'detect-language', data: { text: req.body.text, language: lang } });
});

module.exports = router;`,

  'services/blockchainService.js': `const express = require('express');
const crypto = require('crypto');
const Joi = require('joi');
const fs = require('fs');
const validate = require('../middleware/validate');
const router = express.Router();

const blockchainFile = process.env.BLOCKCHAIN_FILE || './data/blockchain.json';

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
    this.difficulty = 2;
    this.chain = this.loadChain() || [this.createGenesisBlock()];
    if (this.chain.length === 0) {
      this.chain.push(this.createGenesisBlock());
      this.saveChain();
    }
  }
  createGenesisBlock() { return new Block(0, '01/01/2020', 'Genesis Block', '0'); }
  getLatestBlock() { return this.chain[this.chain.length - 1]; }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    this.saveChain();
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i], prev = this.chain[i - 1];
      if (curr.hash !== curr.calculateHash()) return false;
      if (curr.previousHash !== prev.hash) return false;
    }
    return true;
  }
  loadChain() {
    try {
      if (fs.existsSync(blockchainFile)) {
        const raw = fs.readFileSync(blockchainFile, 'utf8');
        const data = JSON.parse(raw);
        return data.map(b => {
          const block = new Block(b.index, b.timestamp, b.data, b.previousHash);
          block.hash = b.hash;
          block.nonce = b.nonce;
          return block;
        });
      }
    } catch (e) { console.error('Error loading blockchain:', e); }
    return null;
  }
  saveChain() {
    try {
      fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2));
    } catch (e) { console.error('Error saving blockchain:', e); }
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
const fs = require('fs');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const router = express.Router();

const usersFile = process.env.USERS_FILE || './data/users.json';

const loadUsers = () => {
  try {
    if (fs.existsSync(usersFile)) return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) { console.error('Error loading users:', e); }
  return [];
};
const saveUsers = (users) => {
  try { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); } catch (e) { console.error('Error saving users:', e); }
};

let users = loadUsers();

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
    saveUsers(users);
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
  <title>Tetra Ecosystem v3.2 | پلتفرم یکپارچه</title>
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
    .clear-btn { background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.4rem 0.8rem; font-size: 0.8rem; align-self: flex-end; margin-top: 0.5rem; }
    footer { margin-top: auto; padding: 1.5rem; color: var(--text-secondary); text-align: center; font-size: 0.9rem; width: 100%; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-left: 5px; }
    @media (max-width: 500px) { header h1 { font-size: 2.2rem; } .card { padding: 1.2rem; } button { padding: 0.7rem 1rem; font-size: 0.9rem; } }
  </style>
</head>
<body>
  <header>
    <h1>⚡ Tetra Ecosystem v3.2</h1>
    <p>پلتفرم یکپارچه هوش مصنوعی، بلاک‌چین، پردازش زبان طبیعی و امنیت</p>
    <button id="btn-health" onclick="checkHealth()">🩺 بررسی سلامت سرور</button>
    <div id="health-result" class="result" style="max-width:400px;margin:1rem auto;"></div>
  </header>

  <div class="dashboard">
    <!-- هوش مصنوعی -->
    <div class="card">
      <h2>🤖 هوش مصنوعی</h2>
      <p class="desc">تحلیل احساس، طبقه‌بندی، خلاصه‌سازی، تشخیص زبان</p>
      <div class="input-group"><input type="text" id="ai-text" placeholder="متن خود را وارد کنید ..."></div>
      <div class="flex-row">
        <button id="btn-sentiment" onclick="aiSentiment()">تحلیل احساس</button>
        <button id="btn-classify" onclick="aiClassify()">طبقه‌بندی</button>
        <button id="btn-summarize" onclick="aiSummarize()">خلاصه‌سازی</button>
        <button id="btn-language" onclick="aiDetectLang()">تشخیص زبان</button>
      </div>
      <button class="clear-btn" onclick="clearResult('ai-result')">پاک کردن نتیجه</button>
      <div id="ai-result" class="result"></div>
    </div>

    <!-- بلاک‌چین -->
    <div class="card">
      <h2>⛓️ بلاک‌چین</h2>
      <p class="desc">مشاهده زنجیره، استخراج بلوک و اعتبارسنجی</p>
      <div class="input-group"><input type="text" id="block-data" placeholder="داده‌ی بلوک (متن)"></div>
      <div class="flex-row">
        <button id="btn-chain" onclick="getChain()">📋 زنجیره</button>
        <button id="btn-mine" onclick="mineBlock()">⛏️ استخراج</button>
        <button id="btn-validate" onclick="validateChain()">✅ اعتبارسنجی</button>
      </div>
      <button class="clear-btn" onclick="clearResult('blockchain-result')">پاک کردن نتیجه</button>
      <div id="blockchain-result" class="result"></div>
    </div>

    <!-- NLP -->
    <div class="card">
      <h2>🗣️ پردازش زبان طبیعی</h2>
      <p class="desc">توکنایز، ریشه‌یابی و استخراج کلیدواژه</p>
      <div class="input-group"><textarea id="nlp-text" rows="3" placeholder="متنی برای پردازش ..."></textarea></div>
      <div class="flex-row">
        <button id="btn-tokenize" onclick="nlpTokenize()">برش</button>
        <button id="btn-stem" onclick="nlpStem()">ریشه‌یابی</button>
        <button id="btn-tfidf" onclick="nlpTFIDF()">TF-IDF</button>
      </div>
      <button class="clear-btn" onclick="clearResult('nlp-result')">پاک کردن نتیجه</button>
      <div id="nlp-result" class="result"></div>
    </div>

    <!-- امنیت -->
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
      <button class="clear-btn" onclick="clearResult('security-result')">پاک کردن نتیجه</button>
      <div id="security-result" class="result"></div>
    </div>
  </div>

  <footer>Tetra Ecosystem v3.2.0 | ساخته‌شده با ❤️</footer>

  <script>
    const API_BASE = window.location.origin;

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
      } catch (e) { showResult('health-result', 'سرور در دسترس نیست', true); }
      finally { resetButton('btn-health'); }
    }

    // AI functions
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

    // Blockchain
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

    // Security
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
  console.log(\`\\n=== Tetra Terminal UI v3.2 (\${BASE}) ===\`);
  console.log('1. سلامت سرور');
  console.log('2. تحلیل احساس');
  console.log('3. طبقه‌بندی متن');
  console.log('4. خلاصه‌سازی');
  console.log('5. تشخیص زبان');
  console.log('6. زنجیره بلوکی');
  console.log('7. استخراج بلوک');
  console.log('8. اعتبارسنجی زنجیره');
  console.log('9. توکنایز');
  console.log('10. ریشه‌یابی');
  console.log('11. TF-IDF');
  console.log('12. ثبت‌نام');
  console.log('13. ورود');
  console.log('14. هش');
  console.log('0. خروج');
  const choice = await question('گزینه: ');
  try {
    switch (choice) {
      case '1': console.log(await request('GET', '/api')); break;
      case '2': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/sentiment', { text: t })); break; }
      case '3': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/classify', { text: t })); break; }
      case '4': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/summarize', { text: t, sentences: 2 })); break; }
      case '5': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/ai/detect-language', { text: t })); break; }
      case '6': console.log(await request('GET', '/api/v3/blockchain/chain')); break;
      case '7': { const d = await question('داده بلوک: '); console.log(await request('POST', '/api/v3/blockchain/mine', { data: d })); break; }
      case '8': console.log(await request('GET', '/api/v3/blockchain/validate')); break;
      case '9': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/tokenize', { text: t })); break; }
      case '10': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/stem', { text: t })); break; }
      case '11': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/nlp/tfidf', { text: t })); break; }
      case '12': { const u = await question('نام کاربری: '); const p = await question('رمز: '); console.log(await request('POST', '/api/v3/security/register', { username: u, password: p })); break; }
      case '13': { const u = await question('نام کاربری: '); const p = await question('رمز: '); console.log(await request('POST', '/api/v3/security/login', { username: u, password: p })); break; }
      case '14': { const t = await question('متن: '); console.log(await request('POST', '/api/v3/security/hash', { text: t })); break; }
      case '0': process.exit(0);
      default: console.log('گزینه نامعتبر');
    }
  } catch (e) { console.error('خطا:', e.message); }
  mainMenu();
}
mainMenu();`,

  'README.md': `# Tetra Ecosystem v3.2.0

پلتفرم یکپارچه هوش مصنوعی، بلاک‌چین، پردازش زبان طبیعی و امنیت  
**ویژگی جدید: ذخیره‌سازی دائمی داده‌ها در فایل (JSON)**

## 🚀 شروع سریع

### پیش‌نیازها
- Node.js >= 18
- npm

### نصب
\`\`\`bash
git clone https://github.com/tetrashop/tetra-ecosystem.git
cd tetra-ecosystem
npm install
cp .env.example .env   # تنظیمات دلخواه (حتماً JWT_SECRET را تغییر دهید)
\`\`\`

### اجرای سرور
\`\`\`bash
npm start
\`\`\`

### استفاده از رابط گرافیکی
در مرورگر خود (ترجیحاً Chrome یا Firefox) آدرس \`http://127.0.0.1:3001\` را باز کنید.  
⚠️ **مهم:** باید حتماً از طریق \`http://\` به سرور متصل شوید، نه باز کردن فایل HTML. در اندروید، وای‌فای را روشن نگه دارید.

### استفاده از رابط ترمینال
\`\`\`bash
npm run terminal
\`\`\`
(سرور باید در حال اجرا باشد.)

## 🧩 قابلیت‌های جدید در نسخه ۳.۲

- **هوش مصنوعی پیشرفته:** خلاصه‌سازی متن (استخراجی)، تشخیص زبان (فارسی/انگلیسی)
- **ذخیره‌سازی دائمی:** بلاک‌چین و کاربران در پوشه‌ی \`data\` ذخیره می‌شوند و پس از راه‌اندازی مجدد باقی می‌مانند.
- **واسط کاربری بهبودیافته:** دکمه‌های پاک‌سازی نتیجه، اسپینر بارگذاری، پیام‌های خطای شفاف‌تر
- **بررسی امنیتی:** هشدار در صورت تنظیم نبودن \`JWT_SECRET\`
- **Rate limiting:** محافظت در برابر درخواست‌های بیش از حد

## 📡 API endpoints

### هوش مصنوعی (\`/api/v3/ai\`)
- \`POST /sentiment\` ← تحلیل احساس
- \`POST /classify\` ← طبقه‌بندی موضوع
- \`POST /summarize\` ← خلاصه‌سازی (body: { text, sentences? })
- \`POST /detect-language\` ← تشخیص زبان

### بلاک‌چین (\`/api/v3/blockchain\`)
- \`GET /chain\`
- \`POST /mine\` (body: { data })
- \`GET /validate\`

### NLP (\`/api/v3/nlp\`)
- \`POST /tokenize\` ← توکنایز
- \`POST /stem\` ← ریشه‌یابی
- \`POST /tfidf\` ← استخراج کلیدواژه

### امنیت (\`/api/v3/security\`)
- \`POST /register\` ← ثبت‌نام (JWT)
- \`POST /login\` ← ورود
- \`POST /hash\` ← هش SHA-256

## 🛠️ رفع مشکلات رایج

| مشکل | راه‌حل |
|------|--------|
| خطای \`EADDRINUSE\` | \`killall node\` یا تغییر پورت در \`.env\` |
| دکمه‌های رابط کاربری کار نمی‌کنند | مطمئن شوید آدرس با \`http://127.0.0.1:3001\` شروع می‌شود و فایل مستقیماً باز نشده است. کش مرورگر را پاک کنید. |
| ارور \`JWT_SECRET\` پیش‌فرض | فایل \`.env\` را ویرایش کنید و یک رشته تصادفی جایگزین کنید. |

## 📁 ساختار پروژه
\`\`\`
tetra-ecosystem/
├── api/index.js
├── middleware/
├── services/
├── public/index.html
├── data/               # فایل‌های ذخیره‌سازی (ایجاد خودکار)
├── terminal-ui.js
├── package.json
└── README.md
\`\`\`

## 📄 مجوز
MIT
`
};

// نوشتن فایل‌ها
for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✔ ایجاد شد: ${filePath}`);
}

// نصب وابستگی‌ها (در صورت نیاز)
console.log('\n📦 نصب بسته‌های npm...');
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('✅ نصب کامل شد.');
} catch (e) {
  console.error('⚠️ خطا در نصب. لطفاً دستی اجرا کنید: npm install --legacy-peer-deps');
}

// کپی .env
if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.example', '.env');
  console.log('📄 .env از روی نمونه ساخته شد.');
}

console.log('\n🎉 پروژه با موفقیت توسعه یافت!');
console.log('اکنون با دستور npm start سرور را اجرا کنید.');
console.log('سپس در مرورگر: http://127.0.0.1:3001');
