const fs = require('fs');

// ----- api/index.js -----
let apiIndex = fs.readFileSync('api/index.js', 'utf8');

// جایگزین کردن بخش لود فایل‌ها با منطق مقاوم
apiIndex = apiIndex.replace(
  /const blockchainFile = path\.join\(__dirname, '..', 'data', 'blockchain\.json'\);\s*const usersFile = path\.join\(__dirname, '..', 'data', 'users\.json'\);\s*if \(!fs\.existsSync\(blockchainFile\)\) fs\.writeFileSync\(blockchainFile, '\[\]'\);\s*if \(!fs\.existsSync\(usersFile\)\) fs\.writeFileSync\(usersFile, '\[\]'\);\s*process\.env\.BLOCKCHAIN_FILE = blockchainFile;\s*process\.env\.USERS_FILE = usersFile;/,
  `// استفاده از مسیرهای فایل فقط در صورت امکان نوشتن
const dataDir = path.join(__dirname, '..', 'data');
const blockchainFile = path.join(dataDir, 'blockchain.json');
const usersFile = path.join(dataDir, 'users.json');

let useFileStorage = true;
try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(blockchainFile)) fs.writeFileSync(blockchainFile, '[]', 'utf8');
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
} catch (e) {
  console.warn('⚠️ نمی‌توان در فایل نوشت (محیط serverless). استفاده از حافظه داخلی.');
  useFileStorage = false;
}

process.env.BLOCKCHAIN_FILE = useFileStorage ? blockchainFile : ':memory:';
process.env.USERS_FILE = useFileStorage ? usersFile : ':memory:';`
);

fs.writeFileSync('api/index.js', apiIndex);
console.log('✔ api/index.js اصلاح شد.');

// ----- blockchainService.js -----
let bc = fs.readFileSync('services/blockchainService.js', 'utf8');
bc = bc.replace(
  /const blockchainFile = process\.env\.BLOCKCHAIN_FILE \|\| '\.\/data\/blockchain\.json';/,
  `const blockchainFile = process.env.BLOCKCHAIN_FILE || ':memory:';`
);
// منطق لود و save را مقاوم‌تر می‌کنیم
bc = bc.replace(
  /loadChain\(\) \{[\s\S]*?return null;\s*\}/m,
  `loadChain() {
    if (blockchainFile === ':memory:') return null; // استفاده از زنجیره in-memory
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
bc = bc.replace(
  /saveChain\(\) \{[\s\S]*?\}/m,
  `saveChain() {
    if (blockchainFile === ':memory:') return;
    try { fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2)); }
    catch (e) { console.error('Error saving blockchain:', e); }
  }`
);

fs.writeFileSync('services/blockchainService.js', bc);
console.log('✔ blockchainService.js اصلاح شد.');

// ----- securityService.js -----
let sec = fs.readFileSync('services/securityService.js', 'utf8');
sec = sec.replace(
  /const usersFile = process\.env\.USERS_FILE \|\| '\.\/data\/users\.json';/,
  `const usersFile = process.env.USERS_FILE || ':memory:';`
);
sec = sec.replace(
  /const loadUsers = \(\) => \{[\s\S]*?return \[\];\s*\};/m,
  `const loadUsers = () => {
    if (usersFile === ':memory:') return [];
    try {
      if (fs.existsSync(usersFile)) return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (e) { console.error('Error loading users:', e); }
    return [];
  };`
);
sec = sec.replace(
  /const saveUsers = \(users\) => \{[\s\S]*?\};/m,
  `const saveUsers = (users) => {
    if (usersFile === ':memory:') return;
    try { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); }
    catch (e) { console.error('Error saving users:', e); }
  };`
);

fs.writeFileSync('services/securityService.js', sec);
console.log('✔ securityService.js اصلاح شد.');

// ----- اطمینان از وجود پوشه data با فایل‌های خالی (برای git) -----
if (!fs.existsSync('data')) fs.mkdirSync('data');
fs.writeFileSync('data/.gitkeep', '');
console.log('✔ پوشه data با gitkeep ایجاد شد.');

console.log('\n🎉 همه فایل‌ها برای Vercel بهینه شدند.');
console.log('حالا دستورات زیر را اجرا کنید:');
console.log('  git add .');
console.log('  git commit -m "رفع مشکل فایل‌سیستم در Vercel"');
console.log('  git push origin main');
