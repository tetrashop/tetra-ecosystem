from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os
import sys
from datetime import datetime

# اضافه کردن مسیر فعلی به sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

try:
    from converters.tetra_math import TetraMathEngine
    from converters.camera_simulator import CameraSimulator
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"خطا در import ماژول‌ها: {e}")
    # fallback imports در صورت نیاز
    pass

app = FastAPI(title="Tetra 3D Converter API", version="1.0.0")

# فعال کردن CORS برای ارتباط با داشبورد اصلی
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# دیکشنری برای ذخیره وضعیت jobها
jobs_status = {}

class ConversionResponse(BaseModel):
    job_id: str
    status: str
    message: str
    download_url: str = None

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    download_url: str = None
    created_at: str

@app.post("/convert", response_model=ConversionResponse)
async def convert_image(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...)
):
    if not image.content_type.startswith('image/'):
        raise HTTPException(400, "فایل باید تصویر باشد")
    
    job_id = str(uuid.uuid4())
    
    # ایجاد پوشه temp اگر وجود ندارد
    os.makedirs("temp", exist_ok=True)
    
    # ذخیره موقت فایل آپلود شده
    file_location = f"temp/{job_id}_{image.filename}"
    with open(file_location, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    # تنظیم وضعیت اولیه
    jobs_status[job_id] = {
        "status": "processing",
        "progress": 0,
        "message": "در حال پردازش تصویر...",
        "download_url": None,
        "created_at": datetime.now().isoformat()
    }
    
    # اضافه کردن به پس‌زمینه
    background_tasks.add_task(process_conversion, job_id, file_location)
    
    return ConversionResponse(
        job_id=job_id,
        status="processing",
        message="تصویر در صف پردازش قرار گرفت",
        download_url=f"/download/{job_id}"
    )

@app.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    if job_id not in jobs_status:
        raise HTTPException(404, "Job یافت نشد")
    
    job = jobs_status[job_id]
    return StatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        message=job["message"],
        download_url=job["download_url"],
        created_at=job["created_at"]
    )

@app.get("/download/{job_id}")
async def download_model(job_id: str):
    if job_id not in jobs_status:
        raise HTTPException(404, "Job یافت نشد")
    
    job = jobs_status[job_id]
    if job["status"] != "completed":
        raise HTTPException(400, "پردازش هنوز کامل نشده")
    
    # ایجاد پوشه models اگر وجود ندارد
    os.makedirs("models", exist_ok=True)
    
    output_file = f"models/{job_id}.obj"
    if not os.path.exists(output_file):
        raise HTTPException(404, "فایل مدل یافت نشد")
    
    return FileResponse(
        output_file,
        filename=f"3d_model_{job_id}.obj",
        media_type='application/octet-stream'
    )

def process_conversion(job_id: str, image_path: str):
    try:
        jobs_status[job_id]["progress"] = 20
        jobs_status[job_id]["message"] = "در حال بارگذاری تصویر..."
        
        # بارگذاری تصویر
        image = Image.open(image_path)
        img_array = np.array(image)
        
        jobs_status[job_id]["progress"] = 40
        jobs_status[job_id]["message"] = "در حال تولید دوربین‌های مجازی..."
        
        # تولید دوربین‌های مجازی
        camera_sim = CameraSimulator()
        base_camera = {
            'focal_length': 50.0,
            'center_x': img_array.shape[1] / 2,
            'center_y': img_array.shape[0] / 2,
            'rotation_factor': 0.0
        }
        virtual_cameras = camera_sim.generate_virtual_cameras(base_camera, 3)
        
        jobs_status[job_id]["progress"] = 60
        jobs_status[job_id]["message"] = "در حال اعمال فرمول ریاضی..."
        
        # محاسبه نقشه عمق
        math_engine = TetraMathEngine()
        depth_map = math_engine.calculate_depth_map(img_array, virtual_cameras)
        
        jobs_status[job_id]["progress"] = 80
        jobs_status[job_id]["message"] = "در حال ذخیره مدل 3D..."
        
        # ایجاد پوشه models اگر وجود ندارد
        os.makedirs("models", exist_ok=True)
        
        # ذخیره مدل
        output_file = f"models/{job_id}.obj"
        save_3d_model(depth_map, output_file)
        
        # بروزرسانی وضعیت
        jobs_status[job_id]["status"] = "completed"
        jobs_status[job_id]["progress"] = 100
        jobs_status[job_id]["message"] = "تبدیل با موفقیت انجام شد"
        jobs_status[job_id]["download_url"] = f"/download/{job_id}"
        
        # حذف فایل موقت
        if os.path.exists(image_path):
            os.remove(image_path)
        
    except Exception as e:
        jobs_status[job_id]["status"] = "failed"
        jobs_status[job_id]["message"] = f"خطا در پردازش: {str(e)}"
        if os.path.exists(image_path):
            os.remove(image_path)

def save_3d_model(depth_map, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# مدل 3D تولید شده توسط Tetra Ecosystem\n")
        f.write("# فرمول ریاضی مخترع\n\n")
        
        height, width = depth_map.shape
        for y in range(height):
            for x in range(width):
                z = depth_map[y, x]
                f.write(f"v {x} {y} {z}\n")
        
        for y in range(height - 1):
            for x in range(width - 1):
                v1 = y * width + x + 1
                v2 = y * width + x + 2
                v3 = (y + 1) * width + x + 2
                v4 = (y + 1) * width + x + 1
                f.write(f"f {v1} {v2} {v3} {v4}\n")

@app.get("/")
async def root():
    return {"message": "Tetra 3D Converter API", "status": "active"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Tetra 3D Converter API",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
