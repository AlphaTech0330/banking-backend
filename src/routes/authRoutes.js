const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');

const Customer = require('../models/Customer');
const Account = require('../models/Account');
const { JWT_SECRET, authenticateToken } = require('../utils/auth');
const validate = require('../utils/validate');

// Helper to generate a 10-digit account number (NUBAN style)
const generateAccountNumber = () => {
  return '01' + Math.floor(10000000 + Math.random() * 90000000).toString();
};


const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 3 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').optional().isMobilePhone(),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];


router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const customer = await Customer.create({
      fullName,
      email,
      passwordHash,
      phone,
      isVerified: false,
    });

    res.status(201).json({
      message: 'Registration successful. Proceed to BVN/NIN verification before creating an account.',
      customerId: customer._id,
      isVerified: customer.isVerified,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, customer.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        isVerified: customer.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/create-account', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    
    if (!customer.isVerified) {
      return res.status(403).json({
        error: 'Forbidden. You must successfully verify BVN or NIN before creating an account.',
      });
    }

    
    const existingAccount = await Account.findOne({ customer: customer._id });
    if (existingAccount) {
      return res.status(400).json({
        error: 'Account already exists. Maximum 1 account allowed per customer.',
        accountNumber: existingAccount.accountNumber,
      });
    }

    const account = await Account.create({
      customer: customer._id,
      accountNumber: generateAccountNumber(),
      balance: 15000, 
    });

    res.status(201).json({
      message: 'Account successfully created and pre-funded with ₦15,000.',
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;