const fs = require('fs');
const path = require('path');

console.log('🔧 اعمال اصلاحات نهایی برای Vercel...');

// -------- api/index.js --------
let apiContent = fs.readFileSync('api/index.js', 'utf8');

// جایگزینی بلوک کامل مدیریت فایل
apiContent = apiContent.replace(
  /\/\/ بارگذاری داده‌های دائمی[\s\S]*?process\.env\.USERS_FILE = useFileStorage \? usersFile : ':memory:';/,
  `// مدیریت ذخیره‌سازی (Vercel-ready)
const DATA_DIR = path.join(__dirname, '..', 'data');
let useFileStorage = false;
try {
  // تست نوشتن
  const testFile = path.join(DATA_DIR, '.write_test');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(testFile, 'test', 'utf8');
  fs.unlinkSync(testFile);
  useFileStorage = true;
} catch (e) {
  console.warn('⚠️ محیط فقط خواندنی (Vercel). استفاده از حافظه داخلی.');
}

// مسیرهای فایل (در صورت قابل نوشتن بودن)
const blockchainFile = useFileStorage ? path.join(DATA_DIR, 'blockchain.json') : null;
const usersFile = useFileStorage ? path.join(DATA_DIR, 'users.json') : null;

// ایجاد اولیه فایل‌ها (فقط اگر قابل نوشتن باشند)
if (useFileStorage) {
  if (!fs.existsSync(blockchainFile)) fs.writeFileSync(blockchainFile, '[]', 'utf8');
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
}

process.env.BLOCKCHAIN_FILE = blockchainFile || ':memory:';
process.env.USERS_FILE = usersFile || ':memory:';`
);

fs.writeFileSync('api/index.js', apiContent);
console.log('✅ api/index.js اصلاح شد.');

// -------- services/blockchainService.js --------
let bcContent = fs.readFileSync('services/blockchainService.js', 'utf8');

// اصلاح constructor برای پشتیبانی از :memory:
bcContent = bcContent.replace(
  /constructor\(\) \{[\s\S]*?this\.chain = this\.loadChain\(\) \|\| \[this\.createGenesisBlock\(\)\];[\s\S]*?if \(this\.chain\.length === 0\) \{[\s\S]*?this\.saveChain\(\);[\s\S]*?\}/m,
  `constructor() {
    this.difficulty = 2;
    this.chain = this.loadChain() || [this.createGenesisBlock()];
    if (this.chain.length === 0) {
      this.chain.push(this.createGenesisBlock());
      this.saveChain();
    }
  }`
);

// اصلاح loadChain و saveChain برای :memory:
bcContent = bcContent.replace(
  /loadChain\(\) \{[\s\S]*?return null;\s*\}/m,
  `loadChain() {
    if (!blockchainFile || blockchainFile === ':memory:') return null;
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
  }`
);
bcContent = bcContent.replace(
  /saveChain\(\) \{[\s\S]*?\}/m,
  `saveChain() {
    if (!blockchainFile || blockchainFile === ':memory:') return;
    try { fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2)); }
    catch (e) { console.error('Error saving blockchain:', e); }
  }`
);

fs.writeFileSync('services/blockchainService.js', bcContent);
console.log('✅ blockchainService.js اصلاح شد.');

// -------- services/securityService.js --------
let secContent = fs.readFileSync('services/securityService.js', 'utf8');
secContent = secContent.replace(
  /const loadUsers = \(\) => \{[\s\S]*?return \[\];\s*\};/m,
  `const loadUsers = () => {
    if (!usersFile || usersFile === ':memory:') return [];
    try {
      if (fs.existsSync(usersFile)) return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (e) { console.error('Error loading users:', e); }
    return [];
  };`
);
secContent = secContent.replace(
  /const saveUsers = \(users\) => \{[\s\S]*?\};/m,
  `const saveUsers = (users) => {
    if (!usersFile || usersFile === ':memory:') return;
    try { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); }
    catch (e) { console.error('Error saving users:', e); }
  };`
);

fs.writeFileSync('services/securityService.js', secContent);
console.log('✅ securityService.js اصلاح شد.');

console.log('\n🎯 تمام شد. اکنون دستورات زیر را اجرا کنید:');
console.log('  git add .');
console.log('  git commit -m "رفع نهایی مشکل فایل‌سیستم در Vercel"');
console.log('  git push origin main');
