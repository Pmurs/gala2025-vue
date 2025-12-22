const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const TWILIO_NUMBER = '+18333026946';
const YOUR_PHONE = '+16034941235';

async function checkAndForward() {
  console.log('');
  console.log('📬 CHECKING FOR REPLIES...');
  console.log('==========================');
  
  // Get incoming messages from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const messages = await twilio.messages.list({ 
    to: TWILIO_NUMBER,
    dateSentAfter: oneHourAgo,
    limit: 20 
  });
  
  if (messages.length === 0) {
    console.log('No new replies in the last hour.');
    return;
  }
  
  console.log(`Found ${messages.length} replies:\n`);
  
  for (const m of messages) {
    const time = new Date(m.dateCreated).toLocaleTimeString();
    console.log(`[${time}] ${m.from}: ${m.body}`);
    
    // Forward to your phone
    await twilio.messages.create({
      body: `Reply from ${m.from}: ${m.body}`,
      from: TWILIO_NUMBER,
      to: YOUR_PHONE
    });
  }
  
  console.log('\n✅ All forwarded to your phone!');
}

checkAndForward().catch(err => console.error('Error:', err.message));

