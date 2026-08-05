require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');

// بارگذاری داده‌های دائمی
const blockchainFile = path.join(__dirname, '..', 'data', 'blockchain.json');
const usersFile = path.join(__dirname, '..', 'data', 'users.json');

// اطمینان از وجود فایل‌ها
if (!fs.existsSync(blockchainFile)) fs.writeFileSync(blockchainFile, '[]');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

// اشتراک‌گذاری مسیرها با سرویس‌ها (از طریق متغیر محیطی یا مستقیم)
process.env.BLOCKCHAIN_FILE = blockchainFile;
process.env.USERS_FILE = usersFile;

const aiRoutes = require('../services/aiService');
const blockchainRoutes = require('../services/blockchainService');
const nlpRoutes = require('../services/nlpService');
const securityRoutes = require('../services/securityService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));


app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/v3/ai', aiRoutes);
app.use('/api/v3/blockchain', blockchainRoutes);
app.use('/api/v3/nlp', nlpRoutes);
app.use('/api/v3/security', securityRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({
    message: 'Tetra Ecosystem v3.2.0',
    status: 'active',
    modules: ['ai', 'blockchain', 'nlp', 'security'],
    persistence: 'file-based'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  // بررسی متغیرهای ضروری
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-to-a-random-string') {
    console.warn('⚠️  هشدار: JWT_SECRET امن نیست. لطفاً در .env تغییر دهید.');
  }
  app.listen(PORT, () => {
    console.log(`Tetra Ecosystem v3.2.0 running on port ${PORT}`);
  });
}

module.exports = app;