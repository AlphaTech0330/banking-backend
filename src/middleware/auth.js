const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Authorization token missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user object containing MongoDB ObjectId
    req.user = decoded; 
    req.customer = decoded; // Ensure backward compatibility

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};