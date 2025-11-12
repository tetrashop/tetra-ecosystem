#!/bin/bash
echo "🔧 رفع مشکلات Git..."
echo "======================"

cd /data/data/com.termux/files/home/tetra-ecosystem

echo "1. حذف remote موجود..."
git remote remove origin

echo "2. اضافه کردن remote جدید..."
git remote add origin https://github.com/tetrashop/tetra-ecosystem.git

echo "3. دریافت تغییرات از GitHub..."
git fetch origin

echo "4. ادغام تغییرات..."
git merge origin/main --allow-unrelated-histories

echo "5. آپلود نهایی..."
git push -u origin main

echo "✅ انجام شد!"
