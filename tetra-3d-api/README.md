# Tetra 3D Converter API

سرویس تبدیل تصویر به مدل سه بعدی برای اکوسیستم تترا

## Endpoints

- `GET /health` - بررسی سلامت سرویس
- `POST /convert` - تبدیل تصویر به مدل 3D
- `GET /status/{job_id}` - بررسی وضعیت پردازش
- `GET /download/{job_id}` - دانلود مدل 3D

## استقرار

```bash
vercel --prod
