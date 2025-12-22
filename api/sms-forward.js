// Vercel Serverless Function to forward incoming SMS to Jed's phone
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  console.log('Incoming webhook - Method:', req.method);
  console.log('Body:', JSON.stringify(req.body));
  console.log('Query:', JSON.stringify(req.query));
  
  // Get incoming message details from Twilio webhook
  // Twilio sends as application/x-www-form-urlencoded
  const from = req.body?.From || req.query?.From || 'Unknown';
  const body = req.body?.Body || req.query?.Body || '(empty)';
  
  console.log('From:', from, 'Body:', body);
  console.log('Has credentials:', !!accountSid, !!authToken);
  
  // Forward to Jed's phone
  const toPhone = '+16034941235';
  const twilioNumber = '+18333026946';
  
  if (!accountSid || !authToken) {
    console.error('Missing Twilio credentials!');
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
  
  try {
    // Use fetch instead of twilio SDK for serverless compatibility
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toPhone,
        From: twilioNumber,
        Body: `Reply from ${from}: ${body}`
      })
    });
    
    const result = await response.json();
    console.log('Twilio response:', JSON.stringify(result));
    
    // Respond with empty TwiML (no auto-reply to sender)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('Forward error:', error);
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}
