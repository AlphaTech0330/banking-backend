require('dotenv').config();
const express = require('express');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const kycRoutes = require('./src/routes/kycRoutes');
const { apiLimiter } = require('./src/middleware/rateLimiter'); // Destructured import
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());

// Apply rate limiter to all /api endpoints before routing
if (apiLimiter) {
  app.use('/api', apiLimiter);
}

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/kyc', kycRoutes);

// Central Error Handler (Must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Digital banking backend running on port ${PORT}`);
  });
});