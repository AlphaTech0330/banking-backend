const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rule array for transfers
const transferValidation = [
  body('receiverAccountNumber')
    .trim()
    .notEmpty()
    .withMessage('Receiver account number is required')
    .isNumeric()
    .withMessage('Account number must contain digits only'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Transfer amount must be a number greater than 0'),
  body('bankCode')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim()
    .escape(),
  validate,
];

// ==========================================
// CORE BANKING ROUTES
// ==========================================

// 1. Name Enquiry (Verify recipient details before transfer)
router.get(
  '/name-enquiry/:accountNumber',
  authenticateToken,
  transactionController.nameEnquiry
);

// 2. Funds Transfer (Handles both Intra-bank and Inter-bank via Nibss)
router.post(
  '/transfer',
  authenticateToken,
  transferValidation,
  transactionController.transfer
);

// 3. Transaction Status Check (Query transaction status by reference)
router.get(
  '/status/:reference',
  authenticateToken,
  transactionController.getTransactionStatus
);

// 4. Account Statement & History (Isolated transaction audit history)
router.get(
  '/statement',
  authenticateToken,
  transactionController.getStatement
);

// MUST BE EXPORTED to prevent "argument handler must be a function" errors in server.js
module.exports = router;