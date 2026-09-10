const axios = require('axios');

const NIBSS_BASE_URL = process.env.NIBSS_BASE_URL || 'https://nibssbyphoenix.onrender.com/api/fintech/onboard';

/**
 * 1. Verify BVN/NIN via NibssByPhoenix API
  */
  const verifyBvnExternal = async (idType, idValue) => {
    try {
        const endpoint = idType === 'BVN' ? '/kyc/verify-bvn' : '/kyc/verify-nin';
            const payload = idType === 'BVN' ? { bvn: idValue } : { nin: idValue };

                const response = await axios.post(`${NIBSS_BASE_URL}${endpoint}`, payload, {
                      headers: {
                              'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${process.env.NIBSS_API_TOKEN}`,
                                            },
                                                });

                                                    return response.data;
                                                      } catch (error) {
                                                          // If external call fails or token is not yet provided, throw clean operational message
                                                              const message = error.response?.data?.message || 'External Nibss verification service error';
                                                                  throw new Error(message);
                                                                    }
                                                                    };

                                                                    /**
                                                                     * 2. Execute Inter-Bank Transfer via NibssByPhoenix API
                                                                      */
                                                                      const sendInterBankTransfer = async ({ sourceAccount, destinationBankCode, destinationAccount, amount, narration }) => {
                                                                        try {
                                                                            const response = await axios.post(
                                                                                  `${NIBSS_BASE_URL}/transfers/inter-bank`,
                                                                                        {
                                                                                                sourceAccountNumber: sourceAccount,
                                                                                                        destinationBankCode,
                                                                                                                destinationAccountNumber: destinationAccount,
                                                                                                                        amount,
                                                                                                                                narration,
                                                                                                                                      },
                                                                                                                                            {
                                                                                                                                                    headers: {
                                                                                                                                                              'Content-Type': 'application/json',
                                                                                                                                                                        'Authorization': `Bearer ${process.env.NIBSS_API_TOKEN}`,
                                                                                                                                                                                },
                                                                                                                                                                                      }
                                                                                                                                                                                          );
                                                                                                                                                                                              return response.data;
                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                    const errorMessage = error.response?.data?.message || 'Nibss inter-bank transfer failed';
                                                                                                                                                                                                        throw new Error(errorMessage);
                                                                                                                                                                                                          }
                                                                                                                                                                                                          };

                                                                                                                                                                                                          module.exports = {
                                                                                                                                                                                                            verifyBvnExternal,
                                                                                                                                                                                                              sendInterBankTransfer,
                                                                                                                                                                                                              };
                                                                                                                                                                                                              
