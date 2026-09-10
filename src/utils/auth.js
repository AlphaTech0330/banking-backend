const jwt = require('jsonwebtoken');

// Secret key for signing tokens (Fall back to default if not set in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_banking_key_123';

// Middleware to protect banking routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.customer = verified; 
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { authenticateToken, JWT_SECRET };