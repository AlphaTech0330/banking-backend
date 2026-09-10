require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const onboardBank = async () => {
  try {
    console.log('🔄 Connecting to NibssByPhoenix Fintech Onboarding API...');

    const payload = {
      name: process.env.MY_BANK_NAME || 'ALP Bank',
      bankCode: process.env.MY_BANK_CODE || '269',
      email: process.env.BANK_ADMIN_EMAIL || 'showunmibabajide0330@gmail.com',
      callbackUrl: 'http://localhost:4000/api/kyc/nibss-callback',
    };

    const response = await axios.post(
      'https://nibssbyphoenix.onrender.com/api/fintech/onboard',
      payload
    );

    saveCredentials(response.data);
  } catch (error) {
    if (error.response && error.response.data && error.response.data.apiKey) {
      console.log('⚠️ Bank already onboarded. Retrieved existing credentials:');
      saveCredentials(error.response.data);
    } else {
      console.error('❌ Onboarding failed:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      } else {
        console.error(error.message);
      }
    }
  }
};

const saveCredentials = (data) => {
  const clientId = data.apiKey || data.clientId || data.client_id;
  const clientSecret = data.apiSecret || data.clientSecret || data.client_secret;

  console.log('--------------------------------------------------');
  console.log(`Bank Name:     ${data.bankName}`);
  console.log(`Bank Code:     ${data.bankCode}`);
  console.log(`API Key:       ${clientId}`);
  console.log(`API Secret:    ${clientSecret}`);
  console.log('--------------------------------------------------');

  const envPath = path.join(__dirname, '../../.env');
  const envContent = `\n# NIBSS Live Credentials\nNIBSS_CLIENT_ID=${clientId}\nNIBSS_CLIENT_SECRET=${clientSecret}\nMY_BANK_CODE=${data.bankCode}\n`;
  fs.appendFileSync(envPath, envContent);
  console.log(' Credentials successfully updated in .env!');
};

onboardBank();