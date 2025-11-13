#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import psutil
import os

class ResourceManager:
    def __init__(self):
        self.max_threads = 2  # برای سیستم دو هسته‌ای
        
    def check_system_resources(self):
        """بررسی منابع سیستم"""
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        return {
            'memory_available': memory.available,
            'memory_percent': memory.percent,
            'cpu_percent': cpu_percent,
            'cpu_count': os.cpu_count()
        }
    
    def optimize_for_resources(self, image_size):
        """بهینه‌سازی بر اساس منابع موجود"""
        resources = self.check_system_resources()
        
        if resources['memory_percent'] > 80:
            # کاهش سایز برای صرفه‌جویی در حافظه
            return (image_size[0] // 2, image_size[1] // 2)
        elif resources['cpu_percent'] > 70:
            # کاهش کیفیت برای صرفه‌جویی در CPU
            return (image_size[0] // 2, image_size[1] // 2)
        else:
            return image_size
    
    def should_process_tiles(self, image_size):
        """آیا تصویر باید به بخش‌های کوچک تقسیم شود؟"""
        return image_size[0] * image_size[1] > 1000000  # اگر بزرگتر از 1MP
