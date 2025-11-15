#!/bin/bash

echo "🚀 راه‌اندازی سیستم تبدیل پیشرفته 2D به 3D"

# بررسی وجود پایتون
if ! command -v python3 &> /dev/null; then
    echo "❌ پایتون 3 یافت نشد. لطفاً نصب کنید."
    exit 1
fi

# ایجاد محیط مجازی
echo "🔧 ایجاد محیط مجازی..."
python3 -m venv tetra_env
source tetra_env/bin/activate

# نصب requirements
echo "📦 نصب کتابخانه‌های مورد نیاز..."
pip install -r requirements.txt

# راه‌اندازی سرور
echo "🌐 راه‌اندازی سرور Flask..."
python3 app.py
