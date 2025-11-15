#!/bin/bash

echo "🚀 شروع استقرار Tetra Ecosystem روی Vercel..."

# بررسی وجود Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 نصب Vercel CLI..."
    npm install -g vercel
fi

# بررسی فایل‌های ضروری
echo "🔍 بررسی فایل‌های ضروری..."
required_files=("vercel.json" "package.json" "public/tetra-ecosystem.html" "public/data-manager.js")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ فایل $file یافت نشد!"
        exit 1
    fi
done

echo "✅ همه فایل‌های ضروری موجود هستند"

# ساخت پروژه
echo "🏗️ در حال ساخت پروژه..."
npm run build

# استقرار روی Vercel
echo "🌐 در حال استقرار روی Vercel..."
vercel --prod

echo "🎉 استقرار با موفقیت انجام شد!"
echo "📧 آدرس دامنه: https://tetra-ecosystem.vercel.app"
echo "🔗 پنل مدیریت: https://tetra-ecosystem.vercel.app/admin-real-data.html"
echo "📊 نظارت: https://tetra-ecosystem.vercel.app/monitoring-dashboard.html"
