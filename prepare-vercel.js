const fs = require('fs');

console.log('🔄 آماده‌سازی پروژه برای Vercel...');

// 1. ایجاد vercel.json
const vercelConfig = {
  version: 2,
  builds: [
    { src: "api/index.js", use: "@vercel/node" }
  ],
  routes: [
    { src: "/api/(.*)", dest: "api/index.js" },
    { src: "/", dest: "api/index.js" },
    { src: "/(.*)", dest: "api/index.js" }
  ]
};
fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✔ vercel.json ایجاد شد.');

// 2. به‌روزرسانی api/index.js برای Vercel (حذف rate limit در serverless و تنظیم CORS)
let apiIndex = fs.readFileSync('api/index.js', 'utf8');

// حذف require rate-limit
apiIndex = apiIndex.replace(/const rateLimit = require\('express-rate-limit'\);\n?/, '');
// حذف middleware مربوطه
apiIndex = apiIndex.replace(/const limiter = rateLimit\([^)]+\);\n?/, '');
apiIndex = apiIndex.replace(/app\.use\(limiter\);\n?/, '');

// اطمینان از صادرات صحیح module.exports
if (!apiIndex.includes('module.exports = app;')) {
  apiIndex += '\nmodule.exports = app;';
}

fs.writeFileSync('api/index.js', apiIndex);
console.log('✔ api/index.js برای Vercel بهینه‌سازی شد.');

// 3. به‌روزرسانی package.json – اضافه کردن engines و script مخصوص Vercel
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.vercel = "node api/index.js";  // اختیاری
pkg.engines = { node: ">=18" };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✔ package.json به‌روز شد.');

// 4. اضافه کردن .vercelignore (اختیاری)
fs.writeFileSync('.vercelignore', 'node_modules/\n.env\n*.log\n');
console.log('✔ .vercelignore ایجاد شد.');

// 5. به‌روزرسانی README.md با بخش Deploy
let readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('## ☁️ استقرار در Vercel')) {
  const deploySection = `
## ☁️ استقرار در Vercel

1. پروژه را روی گیت‌هاب آپلود کنید.
2. به [Vercel](https://vercel.com) بروید و روی **New Project** کلیک کنید.
3. ریپوی گیت‌هاب را انتخاب کنید.
4. **Environment Variables** را تنظیم کنید:
   - \`PORT\` (اختیاری – Vercel پورت را خودکار می‌دهد)
   - \`JWT_SECRET\` (حتماً یک رشته تصادفی انتخاب کنید)
   - \`BCRYPT_SALT_ROUNDS\` (مثلاً ۱۲)
5. روی **Deploy** کلیک کنید.

⚠️ **توجه:** به دلیل ماهیت serverless، **Rate Limiting** غیرفعال شده است.  
داده‌های بلاک‌چین و کاربران در فایل‌های محلی ذخیره می‌شوند (برای محیط توسعه).  
برای تولید واقعی، از یک دیتابیس استفاده کنید.
`;
  readme += deploySection;
}
fs.writeFileSync('README.md', readme);
console.log('✔ README.md به‌روز شد.');

console.log('\n🎉 پروژه برای Vercel آماده است!');
console.log('حالا دستورات زیر را اجرا کنید:');
console.log('  git add .');
console.log('  git commit -m "آماده‌سازی برای Vercel"');
console.log('  git push origin main');
