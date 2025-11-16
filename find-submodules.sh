#!/bin/bash
echo "🔍 جستجوی تمام submodule ها..."
git submodule status
echo ""
echo "📁 جستجوی فایل .gitmodules..."
find . -name ".gitmodules" -type f
echo ""
echo "📋 لیست فایل های کش شده..."
git ls-files | grep -E "(submodule|module)"
