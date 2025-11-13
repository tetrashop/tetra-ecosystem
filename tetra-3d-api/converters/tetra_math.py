#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import numpy as np
import math

class TetraMathEngine:
    def __init__(self):
        self.optimization_factor = 0.1

    def apply_inventor_formula(self, pixel, x, y, camera_params):
        """اعمال فرمول ریاضی مخترع برای محاسبه عمق"""
        try:
            # استخراج مقادیر RGB با مدیریت overflow
            r, g, b = float(pixel[0]), float(pixel[1]), float(pixel[2])
            
            # محاسبه شدت (intensity) با پیشگیری از overflow
            intensity = (r + g + b) / 3.0 / 255.0
            
            # نرمال‌سازی مختصات
            norm_x = (x - camera_params['center_x']) / camera_params['focal_length']
            norm_y = (y - camera_params['center_y']) / camera_params['focal_length']
            
            # فرمول اصلی مخترع
            depth = (intensity *
                    math.sqrt(norm_x**2 + norm_y**2) *
                    camera_params['rotation_factor'] *
                    camera_params.get('auto_volume', 1.0))
            
            return depth * self.optimization_factor
            
        except Exception as e:
            print(f"خطا در فرمول ریاضی: {e}")
            return 0.0

    def calculate_depth_map(self, image_array, cameras):
        """محاسبه نقشه عمق از چندین دوربین"""
        height, width, _ = image_array.shape
        depth_map = np.zeros((height, width))
        
        for y in range(height):
            for x in range(width):
                total_depth = 0.0
                pixel = image_array[y, x]
                
                # میانگین‌گیری از تمام دوربین‌های مجازی
                for camera in cameras:
                    camera_depth = self.apply_inventor_formula(pixel, x, y, camera)
                    total_depth += camera_depth
                
                depth_map[y, x] = total_depth / len(cameras)
        
        return depth_map
