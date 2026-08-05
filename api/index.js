require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const aiRoutes = require('../services/aiService');
const blockchainRoutes = require('../services/blockchainService');
const nlpRoutes = require('../services/nlpService');
const securityRoutes = require('../services/securityService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// مسیر داده‌ها (فقط در محیط‌های قابل نوشتن استفاده می‌شود)
const dataDir = path.join(__dirname, '..', 'data');
process.env.BLOCKCHAIN_FILE = path.join(dataDir, 'blockchain.json');
process.env.USERS_FILE = path.join(dataDir, 'users.json');

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

app.get('/api', (req, res) => {
  res.json({
    message: 'Tetra Ecosystem v3.2.0',
    status: 'active',
    modules: ['ai', 'blockchain', 'nlp', 'security']
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tetra Ecosystem running on port ${PORT}`);
  });
}

module.exports = app;