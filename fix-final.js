const fs = require('fs');

console.log('🧹 بازنویسی کامل فایل‌ها برای سازگاری با Vercel...');

// ---------- api/index.js ----------
const apiCode = `require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const aiRoutes = require('../services/aiService');
const blockchainRoutes = require('../services/blockchainService');
const nlpRoutes = require('../services/nlpService');
const securityRoutes = require('../services/securityService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// مسیر داده‌ها (فقط در محیط‌های قابل نوشتن استفاده می‌شود)
const dataDir = path.join(__dirname, '..', 'data');
process.env.BLOCKCHAIN_FILE = path.join(dataDir, 'blockchain.json');
process.env.USERS_FILE = path.join(dataDir, 'users.json');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/v3/ai', aiRoutes);
app.use('/api/v3/blockchain', blockchainRoutes);
app.use('/api/v3/nlp', nlpRoutes);
app.use('/api/v3/security', securityRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Tetra Ecosystem v3.2.0',
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

module.exports = app;`;
fs.writeFileSync('api/index.js', apiCode, 'utf8');
console.log('✅ api/index.js بازنویسی شد (بدون writeFileSync اولیه).');

// ---------- services/blockchainService.js ----------
const bcCode = `const express = require('express');
const crypto = require('crypto');
const Joi = require('joi');
const fs = require('fs');
const validate = require('../middleware/validate');
const router = express.Router();

const blockchainFile = process.env.BLOCKCHAIN_FILE;

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
    } catch (e) { /* محیط فقط خواندنی */ }
    return null;
  }
  saveChain() {
    try {
      if (!fs.existsSync(blockchainFile)) {
        // ایجاد فایل در صورت امکان
        fs.mkdirSync(require('path').dirname(blockchainFile), { recursive: true });
      }
      fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2));
    } catch (e) { /* محیط فقط خواندنی */ }
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

module.exports = router;`;
fs.writeFileSync('services/blockchainService.js', bcCode, 'utf8');
console.log('✅ blockchainService.js بازنویسی شد.');

// ---------- services/securityService.js ----------
const secCode = `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const router = express.Router();

const usersFile = process.env.USERS_FILE;

const loadUsers = () => {
  try {
    if (fs.existsSync(usersFile)) return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) { /* محیط فقط خواندنی */ }
  return [];
};
const saveUsers = (users) => {
  try {
    if (!fs.existsSync(usersFile)) {
      fs.mkdirSync(path.dirname(usersFile), { recursive: true });
    }
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (e) { /* محیط فقط خواندنی */ }
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

module.exports = router;`;
fs.writeFileSync('services/securityService.js', secCode, 'utf8');
console.log('✅ securityService.js بازنویسی شد.');

console.log('\n🎉 اصلاحات نهایی انجام شد. حالا دستورات زیر را اجرا کنید:');
console.log('  git add .');
console.log('  git commit -m "حذف کامل writeFileSync از startup"');
console.log('  git push origin main');
