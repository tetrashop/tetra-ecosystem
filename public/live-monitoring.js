// سیستم داده Real-time برای پنل نظارت Tetra
class TetraLiveMonitor {
    constructor() {
        this.metrics = {
            users: 1247,
            revenue: 456000000,
            conversions: 156,
            donations: 892,
            activeServices: 10,
            systemHealth: 98.5
        };
        this.interval = null;
    }

    startLiveUpdates() {
        this.interval = setInterval(() => {
            this.updateMetrics();
            this.broadcastUpdates();
        }, 3000); // بروزرسانی هر 3 ثانیه
    }

    updateMetrics() {
        // شبیه‌سازی داده‌های Real-time
        this.metrics.users += Math.floor(Math.random() * 3);
        this.metrics.revenue += Math.floor(Math.random() * 50000);
        this.metrics.conversions += Math.floor(Math.random() * 2);
        this.metrics.donations += Math.floor(Math.random() * 1);
        
        // نوسان سلامت سیستم
        this.metrics.systemHealth = 98 + (Math.random() * 2 - 1);
        
        // آپدیت تاریخچه
        this.updateHistory();
    }

    updateHistory() {
        const history = JSON.parse(localStorage.getItem('monitoring_history') || '[]');
        history.push({
            timestamp: new Date().toLocaleString('fa-IR'),
            ...this.metrics
        });

        // نگهداری فقط 50 رکورد آخر
        if (history.length > 50) history.shift();
        localStorage.setItem('monitoring_history', JSON.stringify(history));
    }

    broadcastUpdates() {
        // ارسال داده‌ها به تمام پنل‌های فعال
        const event = new CustomEvent('tetraMetricsUpdate', {
            detail: this.metrics
        });
        window.dispatchEvent(event);
    }

    getServiceStatus() {
        return [
            { name: 'تبدیل تصاویر 2D/3D', status: 'up', uptime: '99.9%', response: 42, requests: 1245 },
            { name: 'پردازش زبان طبیعی', status: 'up', uptime: '99.8%', response: 38, requests: 892 },
            { name: 'نویسنده هوشمند', status: 'up', uptime: '99.7%', response: 45, requests: 1567 },
            { name: 'نویسنده کوانتومی', status: 'up', uptime: '99.9%', response: 52, requests: 734 },
            { name: 'شطرنج هوشمند', status: 'up', uptime: '99.6%', response: 28, requests: 456 },
            { name: 'سامانه ضد چندپارگی', status: 'warning', uptime: '98.2%', response: 67, requests: 289 },
            { name: 'نطق مصطلح', status: 'up', uptime: '99.5%', response: 35, requests: 623 },
            { name: 'نگار کوانتوم', status: 'up', uptime: '99.8%', response: 48, requests: 512 },
            { name: 'سیستم محرومین', status: 'up', uptime: '99.9%', response: 32, requests: 834 },
            { name: 'سیستم کمک مالی', status: 'up', uptime: '99.7%', response: 41, requests: 967 }
        ];
    }

    getFinancialData() {
        return {
            todayRevenue: 12450000,
            monthlyRevenue: 245000000,
            activeSubscriptions: 1245,
            conversionRate: 3.2,
            churnRate: 1.8,
            avgTransaction: 124000
        };
    }

    getPerformanceMetrics() {
        return {
            cpu: Math.floor(Math.random() * 30) + 40,
            memory: Math.floor(Math.random() * 25) + 60,
            storage: Math.floor(Math.random() * 20) + 25,
            bandwidth: Math.floor(Math.random() * 30) + 45,
            responseTime: Math.floor(Math.random() * 20) + 30
        };
    }

    stopUpdates() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

// راه‌اندازی سیستم نظارت
window.tetraMonitor = new TetraLiveMonitor();

// شروع اتوماتیک هنگام لود صفحه
document.addEventListener('DOMContentLoaded', function() {
    window.tetraMonitor.startLiveUpdates();
    console.log('🚀 Tetra Live Monitoring Started');
});
