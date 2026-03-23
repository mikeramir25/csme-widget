const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Email setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio setup
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔥 MAIN ROUTE (THIS IS WHAT YOUR WIDGET HITS)
app.post('/offer', async (req, res) => {
  try {
    const data = req.body;

    const vehicle = `${data.year} ${data.make} ${data.model}`;

    const message = `
NEW CSME LEAD

Vehicle: ${vehicle}
VIN: ${data.vin}
Mileage: ${data.mileage}
Phone: ${data.phoneNumber}
Email: ${data.emailAddress}
Condition: ${data.mechanicalCondition}
ZIP: ${data.zipCode}

Status: Offer pending review
`;

    // 📧 SEND EMAILS
    const recipients = [
      "csalesmadeeasy@gmail.com",
      "crystal.csme@gmail.com",
      "mike.csme@gmail.com",
      "28747344@leadsprod.dealercenter.net"
    ];

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipients,
      subject: "New Vehicle Lead - CSME",
      text: message
    });

    // 📱 SEND TEXTS
    const smsNumbers = [
      "+17144766108",
      "+17144766095"
    ];

    for (let number of smsNumbers) {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something failed" });
  }
});

app.get('/', (req, res) => {
  res.send('CSME API running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
