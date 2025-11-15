#!/bin/bash
echo "🚀 شروع دیپلوی اضطراری Tetra Ecosystem..."

# آپلود فایل اصلی
curl -X POST https://api.vercel.com/v1/now/deployments \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -F "files=@tetra-ecosystem-complete.html"

echo "✅ دیپلوی تکمیل شد!"
