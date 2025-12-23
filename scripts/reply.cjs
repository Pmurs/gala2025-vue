const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const readline = require('readline');

const TWILIO_NUMBER = '+18333026946';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('📱 GALA REPLY TOOL');
console.log('==================');
console.log('Sending from:', TWILIO_NUMBER);
console.log('');

rl.question('To (phone number): ', (to) => {
  // Clean up the number
  let cleanTo = to.replace(/\D/g, '');
  if (!cleanTo.startsWith('1') && cleanTo.length === 10) {
    cleanTo = '1' + cleanTo;
  }
  cleanTo = '+' + cleanTo;
  
  rl.question('Message: ', async (body) => {
    console.log('');
    console.log('Sending to', cleanTo + '...');
    
    try {
      const msg = await twilio.messages.create({
        body: body,
        from: TWILIO_NUMBER,
        to: cleanTo
      });
      console.log('✅ Sent! SID:', msg.sid);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
    
    rl.close();
  });
});


