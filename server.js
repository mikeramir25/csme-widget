const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio setup (safe: only runs if vars exist)
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// MAIN ROUTE
app.post('/offer', async (req, res) => {
  try {
    const data = req.body || {};

    const vehicle = [data.year, data.make, data.model].filter(Boolean).join(' ') || 'Unknown Vehicle';

    const message = `
NEW CSME LEAD

Vehicle: ${vehicle}
VIN: ${data.vin || ''}
Mileage: ${data.mileage || ''}
Phone: ${data.phoneNumber || ''}
Email: ${data.emailAddress || ''}
Condition: ${data.mechanicalCondition || ''}
ZIP: ${data.zipCode || ''}

Status: Offer pending review
`.trim();

    // 👉 TEMP: LOG INSTEAD OF EMAIL (fixes Gmail timeout)
    console.log("=== NEW LEAD ===");
    console.log(message);

    // 👉 OPTIONAL TEXT (won’t crash if not set)
    if (client && process.env.TWILIO_PHONE_NUMBER) {
      const numbers = [
        "+17144766108",
        "+17144766095"
      ];

      for (const n of numbers) {
        try {
          await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: n
          });
        } catch (e) {
          console.log("SMS ERROR:", e.message);
        }
      }
    } else {
      console.log("SMS SKIPPED (Twilio not configured)");
    }

    return res.json({ success: true });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({ error: "Failed" });
  }
});

// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('CSME API running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
