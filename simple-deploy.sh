#!/bin/bash

echo "🚀 استقرار ساده Tetra Ecosystem روی Vercel"
echo "==========================================="

# بررسی فایل‌های ضروری
echo "🔍 بررسی فایل‌های ضروری..."
if [ ! -f "vercel.json" ]; then
    echo "❌ فایل vercel.json یافت نشد!"
    exit 1
fi

if [ ! -d "public" ]; then
    echo "❌ دایرکتوری public یافت نشد!"
    exit 1
fi

echo "✅ همه فایل‌ها موجود هستند"

# ایجاد فایل‌های ضروری اضافی
echo "📦 ایجاد فایل‌های نهایی..."

# ایجاد فایل اصلی index.html برای روت
cat > public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetra Ecosystem - در حال انتقال...</title>
    <script>
        setTimeout(function() {
            window.location.href = 'tetra-ecosystem.html';
        }, 2000);
    </script>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Vazir', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .loading {
            font-size: 1.5rem;
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div>
        <div class="spinner"></div>
        <div class="loading">🚀 در حال انتقال به Tetra Ecosystem...</div>
        <p>اگر انتقال انجام نشد، <a href="tetra-ecosystem.html" style="color: #ffd700;">اینجا کلیک کنید</a></p>
    </div>
</body>
</html>
HTMLEOF

echo "🎉 آماده استقرار!"
echo ""
echo "📋 دستورات بعدی:"
echo "1. ابتدا یک repository در GitHub ایجاد کنید:"
echo "   https://github.com/new"
echo ""
echo "2. سپس فایل‌ها را push کنید:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Deploy Tetra Ecosystem'"
echo "   git branch -M main"
echo "   git remote add origin YOUR_REPO_URL"
echo "   git push -u origin main"
echo ""
echo "3. در Vercel:"
echo "   - به https://vercel.com بروید"
echo "   - با GitHub لاگین کنید"
echo "   - پروژه جدید ایجاد کنید"
echo "   - repository را انتخاب کنید"
echo "   - دکمه Deploy را بزنید"
echo ""
echo "🔗 آدرس نهایی: https://tetra-ecosystem.vercel.app"
echo ""
echo "📞 اگر مشکل داشتید، از روش دستی استفاده کنید:"
echo "   - فایل‌ها را zip کنید"
echo "   - در Vercel آپلود کنید"
