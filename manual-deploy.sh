#!/bin/bash

echo "🛠️ استقرار دستی Tetra Ecosystem"
echo "================================"

# ایجاد فایل zip برای آپلود دستی
echo "📦 ایجاد فایل ZIP برای آپلود..."
zip -r tetra-ecosystem.zip . -x "*.git*" "*.sh" "*.md" ".env*"

if [ $? -eq 0 ]; then
    echo "✅ فایل tetra-ecosystem.zip با موفقیت ایجاد شد"
    echo ""
    echo "📋 مراحل استقرار دستی:"
    echo "1. به https://vercel.com بروید"
    echo "2. لاگین کنید (با GitHub) "
    echo "3. روی 'Add New...' → 'Project' کلیک کنید"
    echo "4. در قسمت 'Import Project' روی 'Browse' کلیک کنید"
    echo "5. فایل tetra-ecosystem.zip را انتخاب کنید"
    echo "6. نام پروژه را 'tetra-ecosystem' قرار دهید"
    echo "7. روی 'Deploy' کلیک کنید"
    echo ""
    echo "🎯 تنظیمات مهم:"
    echo "   - Build Command: خالی بگذارید"
    echo "   - Output Directory: public"
    echo "   - Install Command: خالی بگذارید"
    echo ""
    echo "🔗 پس از استقرار: https://tetra-ecosystem.vercel.app"
else
    echo "❌ خطا در ایجاد فایل ZIP"
    exit 1
fi
