const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const { JWT_SECRET } = require('../middleware/auth');

const generateAccountNumber = () => '01' + Math.floor(10000000 + Math.random() * 90000000).toString();

exports.register = async (req, res, next) => {
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
                                                                                                      next(error);
                                                                                                        }
                                                                                                        };

                                                                                                        exports.login = async (req, res, next) => {
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
                                                                                                                                                                                                                                                  next(error);
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    };

                                                                                                                                                                                                                                                    exports.createAccount = async (req, res, next) => {
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
                                                                                                                                                                                                                                                                                                                                                                                                            next(error);
                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                                                                                                                                                                                              