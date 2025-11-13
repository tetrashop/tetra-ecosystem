#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math

class CameraSimulator:
    def generate_virtual_cameras(self, base_camera, count=3):
        """تولید دوربین‌های مجازی برای استفاده از قابلیت چنددوربینی"""
        cameras = []
        
        for i in range(count):
            angle_offset = (i - count/2) * 15  # افست زاویه
            
            camera = base_camera.copy()
            camera['rotation_factor'] = base_camera.get('rotation_factor', 0) + angle_offset
            camera['auto_volume'] = self.calculate_auto_volume(i, count)
            camera['focal_length'] = base_camera['focal_length'] * (1 + (i - count/2) * 0.1)
            
            cameras.append(camera)
        
        return cameras
    
    def calculate_auto_volume(self, index, total):
        """محاسبه حجم خودکار بر اساس موقعیت دوربین"""
        return 1.0 + math.sin(index * math.pi / total)
