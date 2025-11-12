#!/bin/bash
echo "🔧 حل Merge Conflict..."
echo "========================"

cd /data/data/com.termux/files/home/tetra-ecosystem

echo "1. دریافت آخرین تغییرات..."
git fetch origin

echo "2. بازنویسی local با remote..."
git reset --hard origin/main

echo "3. اعمال تغییرات vercel.json..."
cat > vercel.json << 'VERCEL'
{
  "version": 2,
  "name": "tetra-ecosystem",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    },
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.js",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.css",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
VERCEL

echo "4. ایجاد .gitignore..."
cat > .gitignore << 'GITIGNORE'
node_modules/
*.log
.env
.vercel
dist
build
GITIGNORE

echo "5. آپلود تغییرات..."
git add .
git commit -m "🚀 استقرار نهایی با پیکربندی Vercel نسخه 2"
git push origin main

echo "✅ انجام شد! حالا به Vercel برگردید و Deploy کنید"
