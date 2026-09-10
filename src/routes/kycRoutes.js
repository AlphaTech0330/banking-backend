const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Customer = require('../models/Customer');
const { authenticateToken } = require('../utils/auth');
const validate = require('../utils/validate');
const { verifyBvnExternal } = require('../services/nibssService');

const kycValidation = [
  body('idType').isIn(['BVN', 'NIN']).withMessage("idType must be 'BVN' or 'NIN'"),
    body('idValue').isNumeric().isLength({ min: 11, max: 11 }).withMessage('ID value must be exactly 11 digits'),
      validate,
      ];

      router.post('/verify', authenticateToken, kycValidation, async (req, res, next) => {
        try {
            const { idType, idValue } = req.body;

                const customer = await Customer.findById(req.customer.id);
                    if (!customer) {
                          return res.status(404).json({ error: 'Customer not found.' });
                              }

                                  if (customer.isVerified) {
                                        return res.status(400).json({ error: 'Customer is already verified.' });
                                            }

                                                let nibssRef = `NIBSS-MOCK-${Date.now()}`;

                                                    // Attempt external call if NIBSS_API_TOKEN is configured in .env
                                                        if (process.env.NIBSS_API_TOKEN) {
                                                              const externalResult = await verifyBvnExternal(idType, idValue);
                                                                    nibssRef = externalResult.reference || nibssRef;
                                                                        }

                                                                            customer.idType = idType;
                                                                                customer.idValue = idValue;
                                                                                    customer.nibssCustomerRef = nibssRef;
                                                                                        customer.isVerified = true;

                                                                                            await customer.save();

                                                                                                res.status(200).json({
                                                                                                      message: 'KYC Verification successful',
                                                                                                            isVerified: customer.isVerified,
                                                                                                                  idType: customer.idType,
                                                                                                                        nibssCustomerRef: customer.nibssCustomerRef,
                                                                                                                            });
                                                                                                                              } catch (error) {
                                                                                                                                  next(error);
                                                                                                                                    }
                                                                                                                                    });

                                                                                                                                    module.exports = router;
                                                                                                                                    