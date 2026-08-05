const readline = require('readline');
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const BASE = `http://127.0.0.1:${PORT}`;

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
  console.log(`\n=== Tetra Terminal UI v3.2 (${BASE}) ===`);
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
mainMenu();