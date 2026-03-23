const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ---------- EMAIL SETUP ----------
let transporter = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  });
}

// ---------- TWILIO SETUP ----------
let client = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN
) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// ---------- HELPERS ----------
function buildLeadMessage(data) {
  const vehicle = [data.year, data.make, data.model].filter(Boolean).join(' ') || 'Unknown Vehicle';

  return `
NEW CSME LEAD

Vehicle: ${vehicle}
VIN: ${data.vin || ''}
Plate: ${data.plate || ''}
State: ${data.state || ''}
Trim: ${data.trim || ''}
Transmission: ${data.transmission || ''}
Drivetrain: ${data.drivetrain || ''}
Engine: ${data.engine || ''}
Mileage: ${data.mileage || ''}
Title Status: ${data.titleStatus || ''}
Accidents: ${data.accidents || ''}
Keys: ${data.keys || ''}
Exterior: ${data.exteriorCondition || ''}
Interior: ${data.interiorCondition || ''}
Mechanical: ${data.mechanicalCondition || ''}
Drivable: ${data.drivableStatus || ''}
ZIP: ${data.zipCode || ''}
Phone: ${data.phoneNumber || ''}
Email: ${data.emailAddress || ''}
Features: ${(data.features || []).join(', ') || 'None'}

Status: ${data.status || 'Offer pending review'}
`.trim();
}

async function trySendEmail(subject, message, recipients) {
  if (!transporter) {
    console.log('EMAIL SKIPPED: SMTP not configured.');
    return { ok: false, reason: 'SMTP not configured' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipients,
      subject,
      text: message
    });

    console.log('EMAIL SENT');
    return { ok: true };
  } catch (err) {
    console.log('EMAIL ERROR:', err.message);
    return { ok: false, reason: err.message };
  }
}

async function trySendTexts(message, smsNumbers) {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('SMS SKIPPED: Twilio not configured.');
    return { ok: false, reason: 'Twilio not configured' };
  }

  try {
    for (const number of smsNumbers) {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number
      });
    }

    console.log('SMS SENT');
    return { ok: true };
  } catch (err) {
    console.log('SMS ERROR:', err.message);
    return { ok: false, reason: err.message };
  }
}

// ---------- MAIN ROUTE ----------
app.post('/offer', async (req, res) => {
  try {
    const data = req.body || {};
    const message = buildLeadMessage(data);

    console.log('NEW LEAD RECEIVED');
    console.log(message);

    const recipients = [
      'csalesmadeeasy@gmail.com',
      'crystal.csme@gmail.com',
      'mike.csme@gmail.com',
      '28747344@leadsprod.dealercenter.net'
    ];

    const smsNumbers = [
      '+17144766108',
      '+17144766095'
    ];

    const emailResult = await trySendEmail(
      'New Vehicle Lead - CSME',
      message,
      recipients
    );

    const smsResult = await trySendTexts(message, smsNumbers);

    return res.json({
      success: true,
      emailSent: emailResult.ok,
      smsSent: smsResult.ok,
      emailReason: emailResult.reason || null,
      smsReason: smsResult.reason || null
    });
  } catch (err) {
    console.log('ROUTE ERROR:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown server error'
    });
  }
});

// ---------- HEALTH CHECK ----------
app.get('/', (req, res) => {
  res.send('CSME API running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
