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
const TEST_MODE = true;
const TEST_NUMBER = '+16034941235';

// The message to send
const MESSAGE = "Hey, this is a GALA Team text blast test.";

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

  const bindings = numbers.map(num =>
    JSON.stringify({ binding_type: 'sms', address: num })
  );

  try {
    const notification = await twilio.notify
      .services(process.env.TWILIO_NOTIFY_SID)
      .notifications.create({
        toBinding: bindings,
        body: MESSAGE
      });

    console.log('✅ Sent! SID:', notification.sid);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

sendBlast();
