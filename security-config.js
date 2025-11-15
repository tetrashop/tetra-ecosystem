// پیکربندی امنیتی پنل شخصی
const SECURITY_CONFIG = {
    // اطلاعات دسترسی منحصر به فرد شما
    USER_ACCESS: {
        PERSONAL_CODE: "137913", // کد دسترسی شخصی شما
        ALLOWED_DEVICES: [
            "mobile-personal",
            "laptop-primary", 
            "private-server"
        ],
        TRUSTED_NETWORKS: [
            "192.168.1.0/24", // شبکه خانگی شما
            "10.0.0.0/8"      // شبکه خصوصی
        ]
    },

    // تنظیمات رمزنگاری
    ENCRYPTION: {
        ALGORITHM: "AES-256-GCM",
        KEY_DERIVATION: "PBKDF2",
        SALT_ROUNDS: 100000
    },

    // کنترل‌های دسترسی
    ACCESS_CONTROL: {
        MAX_LOGIN_ATTEMPTS: 3,
        SESSION_TIMEOUT: 900, // 15 دقیقه
        AUTO_LOCK: true,
        BIOMETRIC_REQUIRED: true
    },

    // پروژه‌های خصوصی شما
    PERSONAL_PROJECTS: {
        SECURITY_SYSTEMS: {
            name: "سیستم‌های امنیتی",
            status: "active",
            access: "private"
        },
        AI_PROJECTS: {
            name: "پروژه‌های هوش مصنوعی", 
            status: "active",
            access: "private"
        },
        FINANCIAL_SYSTEMS: {
            name: "سیستم‌های مالی",
            status: "active", 
            access: "private"
        },
        DATABASES: {
            name: "بانک‌های اطلاعاتی",
            status: "active",
            access: "private"
        }
    },

    // مانیتورینگ امنیتی
    SECURITY_MONITORING: {
        LOG_AUTH_ATTEMPTS: true,
        DETECT_SUSPICIOUS_ACTIVITY: true,
        AUTO_BLOCK_THREATS: true,
        NOTIFY_ON_BREACH: true
    }
};

// صادر کردن برای استفاده در سایر فایل‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SECURITY_CONFIG;
}
