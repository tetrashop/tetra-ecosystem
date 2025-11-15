#!/bin/bash
echo "🚀 فعال‌سازی تمام پروژه‌های Tetra Ecosystem..."

# ایجاد فایل‌های اصلی
create_file() {
    local filename=$1
    local title=$2
    local description=$3
    
    cat > $filename << HTML
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title - Tetra Ecosystem</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
    <style>
        body { 
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-family: system-ui;
            padding: 50px 20px;
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .btn-active {
            background: #10b981;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ $title</h1>
        <p>$description</p>
        <p>نسخه: ۲.۰.۰ | وضعیت: <strong>فعال</strong></p>
        
        <div style="margin: 30px 0;">
            <button class="btn-active" onclick="alert('سرویس فعال است!')">
                🚀 شروع به کار
            </button>
        </div>
        
        <a href="tetra-ecosystem.html" style="color: white; text-decoration: none;">
            ← بازگشت به پنل اصلی
        </a>
    </div>
</body>
</html>
HTML
    echo "✅ ایجاد شد: $filename"
}

# ایجاد تمام پروژه‌ها
create_file "ai-writer.html" "نویسنده هوشمند" "سیستم تولید محتوای هوشمند با AI پیشرفته"
create_file "quantum-writer.html" "نویسنده کوانتومی" "تولید محتوای مبتنی بر محاسبات کوانتومی"
create_file "speech-system.html" "سیستم نطق مصطلح" "پردازش گفتار و تبدیل متن به صوت طبیعی"
create_file "nlp.html" "پردازش زبان طبیعی" "سیستم پیشرفته NLP برای تحلیل متون"
create_file "donation-system.html" "سیستم کمک مالی" "مدیریت تراکنش‌های مالی و کمک‌های مردمی"
create_file "social-care.html" "سیستم محرومین" "مدیریت کمک‌های اجتماعی و خدمات رفاهی"
create_file "anti-fragmentation.html" "سامانه ضد چندپارگی" "حفاظت از سیستم در برابر تهدیدات امنیتی"
create_file "quantum-design.html" "نگار کوانتوم" "سیستم طراحی مبتنی بر محاسبات کوانتومی"
create_file "system-status.html" "وضعیت سیستم" "مانیتورینگ کامل سلامت و عملکرد سیستم‌ها"

echo "🎉 تمام پروژه‌ها فعال شدند!"
