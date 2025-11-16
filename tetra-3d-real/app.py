from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import os
from optimized_2d_to_3d import Advanced2DTo3DConverter
import base64
from io import BytesIO
import tempfile

app = Flask(__name__)
CORS(app)

converter = Advanced2DTo3DConverter(output_resolution=1024)

@app.route('/convert', methods=['POST'])
def convert_image():
    try:
        # دریافت تصویر از درخواست
        if 'image' not in request.files:
            return jsonify({'error': 'تصویر ارسال نشده'}), 400
        
        image_file = request.files['image']
        quality = request.form.get('quality', 'high')
        output_format = request.form.get('format', 'obj')
        
        # ذخیره موقت تصویر
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            image_file.save(temp_file.name)
            temp_path = temp_file.name
        
        # تبدیل به 3D
        model_3d = converter.convert_2d_to_3d(
            image_path=temp_path,
            output_format=output_format,
            quality=quality
        )
        
        # پاک کردن فایل موقت
        os.unlink(temp_path)
        
        # بازگشت نتیجه
        return jsonify({
            'success': True,
            'model': model_3d,
            'format': output_format,
            'vertices': len(model_3d.split('\n')) - 10  # تخمین تعداد رئوس
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/preview', methods=['POST'])
def generate_preview():
    try:
        # تولید پیش‌نمایش سریع
        image_file = request.files['image']
        
        # پردازش سریع برای پیش‌نمایش
        image_data = image_file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # کاهش رزولوشن برای سرعت
        image = cv2.resize(image, (256, 256))
        
        # محاسبه ساده نقشه عمق
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        depth_map = cv2.Laplacian(gray, cv2.CV_64F)
        
        # کدگذاری پیش‌نمایش
        _, buffer = cv2.imencode('.jpg', depth_map)
        preview_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'preview': f'data:image/jpeg;base64,{preview_base64}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
