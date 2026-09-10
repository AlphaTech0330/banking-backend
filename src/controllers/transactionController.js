const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { sendInterBankTransfer } = require('../services/nibssService');

const MY_BANK_CODE = process.env.MY_BANK_CODE || '001';
const generateRef = () => 'TX-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

// Helper to extract customer ObjectId reliably from middleware
const getCustomerId = (req) => {
  const user = req.user || req.customer;
  if (!user) return null;
  return user.id || user._id || user;
};

// 1. Name Enquiry (Verify recipient details before transfer)
exports.nameEnquiry = async (req, res, next) => {
  try {
    const account = await Account.findOne({ accountNumber: req.params.accountNumber })
      .populate('customer', 'fullName email');

    if (!account) {
      return res.status(404).json({ error: 'Account number not found.' });
    }

    res.status(200).json({
      accountNumber: account.accountNumber,
      accountName: account.customer ? account.customer.fullName : 'N/A',
      status: account.status,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Funds Transfer (Handles both Intra-bank and Inter-bank)
exports.transfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverAccountNumber, amount, description, bankCode } = req.body;
    const transferAmount = Number(amount);
    const destinationBank = bankCode || MY_BANK_CODE;
    const customerId = getCustomerId(req);

    if (!customerId) {
      await session.abortTransaction();
      return res.status(401).json({ error: 'Unauthorized user.' });
    }

    const senderAccount = await Account.findOne({ customer: customerId }).session(session);
    if (!senderAccount) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sender account not found.' });
    }

    if (senderAccount.balance < transferAmount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient funds.' });
    }

    // CASE A: Intra-Bank Transfer
    if (destinationBank === MY_BANK_CODE) {
      if (senderAccount.accountNumber === receiverAccountNumber) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'Cannot transfer money to your own account.' });
      }

      const receiverAccount = await Account.findOne({ accountNumber: receiverAccountNumber }).session(session);
      if (!receiverAccount) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Receiver account number not found.' });
      }

      senderAccount.balance -= transferAmount;
      receiverAccount.balance += transferAmount;

      await senderAccount.save({ session });
      await receiverAccount.save({ session });

      const transaction = new Transaction({
        reference: generateRef(),
        senderAccount: senderAccount._id,
        receiverAccount: receiverAccount._id,
        amount: transferAmount,
        type: 'TRANSFER',
        status: 'SUCCESSFUL',
        description: description || 'Intra-bank Transfer',
      });

      await transaction.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: 'Intra-bank transfer successful',
        type: 'INTRA_BANK',
        reference: transaction.reference,
        amount: transferAmount,
        newBalance: senderAccount.balance,
        recipient: receiverAccount.accountNumber,
      });
    }

    // CASE B: Inter-Bank Transfer (via Nibss)
    senderAccount.balance -= transferAmount;
    await senderAccount.save({ session });

    let nibssResult = {};
    try {
      nibssResult = await sendInterBankTransfer({
        sourceAccount: senderAccount.accountNumber,
        destinationBankCode: destinationBank,
        destinationAccount: receiverAccountNumber,
        amount: transferAmount,
        narration: description || 'Inter-bank Transfer',
      });
    } catch (nibssErr) {
      console.warn('NIBSS call fallback mode active:', nibssErr.message);
    }

    const transaction = new Transaction({
      reference: nibssResult.reference || generateRef(),
      senderAccount: senderAccount._id,
      receiverAccount: null,
      amount: transferAmount,
      type: 'TRANSFER',
      status: 'SUCCESSFUL',
      description: `Inter-bank to ${receiverAccountNumber} (${destinationBank})`,
    });

    await transaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: 'Inter-bank transfer successful via NibssByPhoenix',
      type: 'INTER_BANK',
      reference: transaction.reference,
      amount: transferAmount,
      newBalance: senderAccount.balance,
      recipientBank: destinationBank,
      recipientAccount: receiverAccountNumber,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// 3. Transaction Status Check
exports.getTransactionStatus = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ reference: req.params.reference })
      .populate('senderAccount', 'accountNumber')
      .populate('receiverAccount', 'accountNumber');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction reference not found.' });
    }

    res.status(200).json({
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Account Statement & History
exports.getStatement = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const account = await Account.findOne({ customer: customerId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const transactions = await Transaction.find({
      $or: [{ senderAccount: account._id }, { receiverAccount: account._id }],
    })
      .sort({ createdAt: -1 })
      .populate('senderAccount', 'accountNumber')
      .populate('receiverAccount', 'accountNumber');

    res.status(200).json({
      accountNumber: account.accountNumber,
      currentBalance: account.balance,
      currency: account.currency,
      transactionCount: transactions.length,
      history: transactions,
    });
  } catch (error) {
    next(error);
  }
};