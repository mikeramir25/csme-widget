const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio setup (safe: only runs if vars exist)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
    }
});

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

      console.log("=== NEW LEAD ===");
          console.log(message);

      // Send Email notifications
      const emailList = data.emailNotify || ['Csalesmadeeasy@gmail.com', 'Crystal.csme@gmail.com', 'Mike.csme@gmail.com'];
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                  try {
                            await transporter.sendMail({
                                        from: `"CSME Lead Alert" <${process.env.SMTP_USER}>`,
                                        to: emailList.join(', '),
                                        subject: `New Lead: ${vehicle} - ${data.phoneNumber || 'No phone'}`,
                                        text: message,
                                        html: `<pre style="font-family:Arial,sans-serif;font-size:14px;">${message}</pre>`
                            });
                            console.log("EMAIL SENT to:", emailList.join(', '));
                  } catch (emailErr) {
                            console.log("EMAIL ERROR:", emailErr.message);
                  }
          } else {
                  console.log("EMAIL SKIPPED (SMTP not configured)");
          }

      // Send SMS notifications via Twilio
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
              const smsNumbers = data.smsNotify || ["+17144766108", "+17144766095"];
              for (const n of smsNumbers) {
                        try {
                                    await twilioClient.messages.create({
                                                  body: message,
                                                  from: process.env.TWILIO_PHONE_NUMBER,
                                                  to: n
                                    });
                                    console.log("SMS SENT to:", n);
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
