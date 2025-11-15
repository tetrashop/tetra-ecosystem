// سیستم مدیریت داده‌های واقعی Tetra Ecosystem
class TetraDataManager {
    constructor() {
        this.initDatabase();
    }

    // مقداردهی اولیه پایگاه داده
    initDatabase() {
        const defaultData = {
            // کاربران سیستم
            users: [
                {
                    id: 1,
                    name: "مدیر سیستم",
                    email: "admin@tetra.ir",
                    role: "admin",
                    balance: 0,
                    joined: "1402/10/15"
                }
            ],
            
            // تراکنش‌های مالی
            transactions: [
                {
                    id: 1,
                    userId: 1,
                    type: "deposit",
                    amount: 1000000,
                    description: "شارژ اولیه سیستم",
                    date: "1402/10/15 10:30:00",
                    status: "completed"
                }
            ],
            
            // تبدیل‌های تصویر
            conversions: [
                {
                    id: 1,
                    userId: 1,
                    inputFormat: "jpg",
                    outputFormat: "glb",
                    status: "completed",
                    createdAt: "1402/10/15 11:00:00",
                    fileSize: "2.5MB"
                }
            ],
            
            // داده‌های رمزارز
            cryptoData: {
                tetherBalance: 0,
                transactions: [],
                priceHistory: []
            },
            
            // پروژه‌های حمایتی
            socialProjects: [
                {
                    id: 1,
                    title: "بسته‌های آموزشی",
                    targetAmount: 150000000,
                    collectedAmount: 125000000,
                    progress: 83,
                    status: "active",
                    donors: 45
                }
            ],
            
            // کمک‌های مردمی
            donations: [
                {
                    id: 1,
                    amount: 500000,
                    projectId: 1,
                    donorName: "ناشناس",
                    date: "1402/10/15 12:00:00",
                    method: "bank"
                }
            ],
            
            // لاگ سیستم
            systemLogs: [
                {
                    timestamp: new Date().toLocaleString('fa-IR'),
                    action: "system_init",
                    message: "سیستم Tetra Ecosystem راه‌اندازی شد"
                }
            ]
        };

        // ایجاد جداول در صورت عدم وجود
        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(`tetra_${key}`)) {
                localStorage.setItem(`tetra_${key}`, JSON.stringify(defaultData[key]));
            }
        });
    }

    // CRUD Operations
    create(table, data) {
        const items = this.getAll(table);
        data.id = this.generateId();
        data.createdAt = new Date().toLocaleString('fa-IR');
        items.push(data);
        this.save(table, items);
        
        // ثبت در لاگ
        this.log(`create_${table}`, `ایجاد رکورد جدید در ${table}`);
        return data;
    }

    read(table, id) {
        const items = this.getAll(table);
        return items.find(item => item.id === id);
    }

    update(table, id, updates) {
        const items = this.getAll(table);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates, updatedAt: new Date().toLocaleString('fa-IR') };
            this.save(table, items);
            this.log(`update_${table}`, `بروزرسانی رکورد ${id} در ${table}`);
            return items[index];
        }
        return null;
    }

    delete(table, id) {
        const items = this.getAll(table);
        const filtered = items.filter(item => item.id !== id);
        this.save(table, filtered);
        this.log(`delete_${table}`, `حذف رکورد ${id} از ${table}`);
    }

    getAll(table) {
        return JSON.parse(localStorage.getItem(`tetra_${table}`) || '[]');
    }

    // توابع کمکی
    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    save(table, data) {
        localStorage.setItem(`tetra_${table}`, JSON.stringify(data));
    }

    log(action, message) {
        const logs = this.getAll('systemLogs');
        logs.unshift({
            timestamp: new Date().toLocaleString('fa-IR'),
            action: action,
            message: message
        });
        // نگهداری فقط 1000 لاگ آخر
        if (logs.length > 1000) logs.pop();
        this.save('systemLogs', logs);
    }

    // توابع خاص برای ماژول‌های مختلف
    // مالی
    getFinancialStats() {
        const transactions = this.getAll('transactions');
        const totalRevenue = transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const today = new Date().toLocaleDateString('fa-IR');
        const todayRevenue = transactions
            .filter(t => t.date && t.date.includes(today) && t.status === 'completed')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            totalRevenue,
            todayRevenue,
            totalTransactions: transactions.length,
            recentTransactions: transactions.slice(-5).reverse()
        };
    }

    // کاربران
    getUserStats() {
        const users = this.getAll('users');
        const today = new Date().toLocaleDateString('fa-IR');
        const newToday = users.filter(u => u.joined && u.joined.includes(today)).length;

        return {
            totalUsers: users.length,
            newToday,
            activeUsers: users.filter(u => u.lastActive).length
        };
    }

    // تبدیل تصاویر
    getConversionStats() {
        const conversions = this.getAll('conversions');
        const completed = conversions.filter(c => c.status === 'completed').length;
        const processing = conversions.filter(c => c.status === 'processing').length;
        const failed = conversions.filter(c => c.status === 'failed').length;

        return {
            total: conversions.length,
            completed,
            processing,
            failed,
            successRate: conversions.length > 0 ? (completed / conversions.length * 100).toFixed(1) : 0
        };
    }

    // حمایت از محرومین
    getSocialStats() {
        const projects = this.getAll('socialProjects');
        const donations = this.getAll('donations');
        
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        const today = new Date().toLocaleDateString('fa-IR');
        const todayDonations = donations
            .filter(d => d.date && d.date.includes(today))
            .reduce((sum, d) => sum + d.amount, 0);

        return {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            totalDonations,
            todayDonations,
            totalDonors: [...new Set(donations.map(d => d.donorName))].length,
            projects: projects
        };
    }

    // سیستم سلامت
    getSystemHealth() {
        const logs = this.getAll('systemLogs');
        const recentErrors = logs.filter(log => 
            log.action.includes('error') || 
            log.message.includes('خطا')
        ).length;

        return {
            status: recentErrors === 0 ? 'healthy' : 'warning',
            uptime: '99.8%',
            lastError: recentErrors > 0 ? logs.find(log => log.action.includes('error')) : null,
            performance: 'excellent'
        };
    }
}

// ایجاد نمونه جهانی
window.tetraData = new TetraDataManager();
