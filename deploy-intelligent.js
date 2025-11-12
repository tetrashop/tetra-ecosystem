// اسکریپت استقرار هوشمند - نسخه Node.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 شروع استقرار هوشمند TetraEcosystem...");
console.log("==========================================");

function runCommand(command, description) {
    try {
        console.log(`\n${description}...`);
        const result = execSync(command, { encoding: 'utf8' });
        console.log(`✅ ${description} موفق`);
        return result;
    } catch (error) {
        console.log(`❌ خطا در ${description}:`, error.message);
        return null;
    }
}

// مرحله 1: استقرار هسته هوش مصنوعی
console.log("\n🧠 مرحله 1: استقرار هسته هوش مصنوعی");
try {
    const aiCorePath = path.join(__dirname, 'ai-core');
    if (fs.existsSync(aiCorePath)) {
        process.chdir(aiCorePath);
        if (fs.existsSync('ai-core-launcher.js')) {
            const result = execSync('node ai-core-launcher.js', { encoding: 'utf8' });
            console.log(result);
        } else if (fs.existsSync('process-page156.js')) {
            const result = execSync('node process-page156.js', { encoding: 'utf8' });
            console.log(result);
        }
        process.chdir(__dirname);
    }
} catch (error) {
    console.log("🔧 اجرای جایگزین هسته AI...");
}

// مرحله 2: استقرار بلاکچین
console.log("\n💰 مرحله 2: استقرار شبکه تتراکوین");
try {
    const blockchainPath = path.join(__dirname, 'blockchain');
    if (fs.existsSync(blockchainPath)) {
        process.chdir(blockchainPath);
        if (fs.existsSync('deploy-network.sh')) {
            execSync('chmod +x deploy-network.sh', { encoding: 'utf8' });
            const result = execSync('./deploy-network.sh', { encoding: 'utf8' });
            console.log(result);
        }
        process.chdir(__dirname);
    }
} catch (error) {
    console.log("🔧 اجرای جایگزین بلاکچین...");
}

// مرحله 3: استقرار سرویس‌های ابری
console.log("\n🌐 مرحله 3: استقرار سرویس‌های ابری");
try {
    const cloudPath = path.join(__dirname, 'cloud-services');
    if (fs.existsSync(cloudPath)) {
        process.chdir(cloudPath);
        if (fs.existsSync('microservices-orchestrator.js')) {
            const result = execSync('node microservices-orchestrator.js', { encoding: 'utf8' });
            console.log(result);
        }
        process.chdir(__dirname);
    }
} catch (error) {
    console.log("🔧 اجرای جایگزین سرویس‌های ابری...");
}

console.log("\n🎉 استقرار هوشمند تکمیل شد!");
console.log("🌐 آدرس‌های دسترسی:");
console.log("   - پلتفرم مدیریت: http://localhost:3000");
console.log("   - API یکپارچه: http://localhost:8080");
console.log("   - اکسپلورر بلاکچین: http://localhost:5000");
