const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Debug: check if env vars loaded
console.log('ENV check:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓ loaded' : '✗ missing',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓ loaded' : '✗ missing',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✓ loaded' : '✗ missing',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✓ loaded' : '✗ missing',
  TWILIO_NOTIFY_SID: process.env.TWILIO_NOTIFY_SID ? '✓ loaded' : '✗ missing',
});

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error('❌ Missing Twilio credentials in .env file');
  process.exit(1);
}

const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ============================================
// CONFIGURATION - Edit these before sending!
// ============================================

// TEST MODE: Set to true to only send to test number
const TEST_MODE = false;
const TEST_NUMBER = '+16034941235';

// The message to send
const MESSAGE = "hey everybody! as we gear up for new years week, we wanted to send a final reminder that ticket prices rise to $185 tonight at midnight. we're closing in on venue capacity so if you have groups of friends planning to RSVP, let us know. can't wait to see you all on weds!";

// ============================================

async function sendBlast() {
  let numbers;

  if (TEST_MODE) {
    console.log('🧪 TEST MODE - sending only to:', TEST_NUMBER);
    numbers = [TEST_NUMBER];
  } else {
    // Pull all phone numbers from Supabase guests table
    const { data: guests, error } = await supabase
      .from('guests')
      .select('phone');

    if (error) {
      console.error('❌ Error fetching guests:', error);
      return;
    }

    numbers = guests.map(g => g.phone).filter(Boolean);
    console.log(`📱 Sending to ${numbers.length} guests`);
  }

  const TWILIO_PHONE_NUMBER = '+18333026946';
  let successCount = 0;
  let failedCount = 0;

  for (const num of numbers) {
    try {
      const message = await twilio.messages.create({
        to: num,
        from: TWILIO_PHONE_NUMBER,
        body: MESSAGE,
      });
      console.log(`✅ ${num} - ${message.sid}`);
      successCount++;
    } catch (err) {
      console.error(`❌ ${num} : ${err.message}`);
      failedCount++;
    }
  }

  console.log('=============================');
  console.log(`✅ Sent: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📱 Total: ${numbers.length}`);
}

sendBlast();
