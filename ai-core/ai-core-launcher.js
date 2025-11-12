// لانچر سازگار با Node.js برای هسته AI
const { UnifiedAIEngine, QuantumNLP } = require('./unified-ai-engine-common.js');

console.log("🚀 لانچر هسته AI در حال راه‌اندازی...");

// راه‌اندازی موتور AI
const aiEngine = new UnifiedAIEngine();

// پردازش صفحه ۱۵۶ NLP
console.log("📄 در حال پردازش صفحه ۱۵۶ NLP...");
const nlpProcessor = new QuantumNLP();
const page156Content = "محتوای پیشرفته صفحه ۱۵۶ سیستم NLP - پردازش زبان طبیعی کوانتومی برای درک عمیق متون فارسی و انگلیسی با دقت ۹۴٪";
const nlpResult = nlpProcessor.processPage156(page156Content);

console.log("🎯 نتیجه پردازش صفحه ۱۵۶ NLP:");
console.log(JSON.stringify(nlpResult, null, 2));
console.log("✅ هسته AI با موفقیت راه‌اندازی شد");

module.exports = { aiEngine, nlpProcessor };
