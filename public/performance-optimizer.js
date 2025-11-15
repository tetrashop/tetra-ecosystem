// بهینه‌ساز عملکرد Tetra Ecosystem
class TetraPerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.metrics = {
            loadTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    // کش کردن داده‌های پرکاربرد
    cacheData(key, data, ttl = 300000) { // 5 دقیقه پیش‌فرض
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        
        this.cache.set(key, cacheItem);
        return data;
    }

    getCachedData(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.metrics.cacheMisses++;
            return null;
        }

        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.metrics.cacheMisses++;
            return null;
        }

        this.metrics.cacheHits++;
        return item.data;
    }

    // فشرده‌سازی داده‌ها
    compressData(data) {
        try {
            return LZString.compressToUTF16(JSON.stringify(data));
        } catch (error) {
            console.warn('Compression failed, using original data');
            return data;
        }
    }

    decompressData(compressedData) {
        try {
            return JSON.parse(LZString.decompressFromUTF16(compressedData));
        } catch (error) {
            return compressedData;
        }
    }

    // مانیتورینگ عملکرد Real-time
    startPerformanceMonitoring() {
        setInterval(() => {
            const performance = {
                cacheEfficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses || 1),
                memoryUsage: this.getMemoryUsage(),
                loadTime: this.metrics.loadTime
            };
            
            // ذخیره метрики برای تحلیل
            this.saveMetrics(performance);
        }, 60000); // هر 1 دقیقه
    }

    getMemoryUsage() {
        return {
            usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 'N/A',
            totalJSHeapSize: performance.memory ? performance.memory.totalJSHeapSize : 'N/A'
        };
    }

    saveMetrics(metrics) {
        const history = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
        history.push({
            ...metrics,
            timestamp: new Date().toISOString()
        });
        
        // نگهداری فقط 100 رکورد آخر
        if (history.length > 100) history.shift();
        localStorage.setItem('performance_metrics', JSON.stringify(history));
    }
}

// اضافه کردن LZString برای فشرده‌سازی
const LZString = {
    compressToUTF16: function(input) {
        return input; // شبیه‌سازی ساده
    },
    decompressFromUTF16: function(compressed) {
        return compressed; // شبیه‌سازی ساده
    }
};

window.tetraPerformance = new TetraPerformanceOptimizer();
