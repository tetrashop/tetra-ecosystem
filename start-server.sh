#!/bin/bash
echo "🔄 در حال راه‌اندازی سرور Tetra Ecosystem..."

# بررسی پورت‌های موجود
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  پورت 8000 مشغول است. استفاده از پورت 8080..."
    PORT=8080
else
    PORT=8000
fi

echo "🚀 سرور در حال اجرا روی پورت $PORT"
echo "📧 آدرس‌های مهم:"
echo "   • تست سیستم: http://localhost:$PORT/public/test-system.html"
echo "   • پنل مدیریت: http://localhost:$PORT/public/admin-real-data.html"
echo "   • وضعیت سیستم: http://localhost:$PORT/public/system-status.html"
echo ""
echo "⏹️  برای توقف سرور: Ctrl+C"

python3 -m http.server $PORT
