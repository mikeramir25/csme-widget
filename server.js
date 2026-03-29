const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { Resend } = require('resend');
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

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// MAIN ROUTE
app.post('/offer', async (req, res) => {
                try {
                                        const data = req.body || {};
                                        const vehicle = [data.year, data.make, data.model].filter(Boolean).join(' ') || 'Unknown Vehicle';

                        const message = `
                        NEW CSME LEAD
                        Vehicle: ${vehicle}
                        VIN: ${data.vin || ''}
                        Trim: ${data.trim || ''}
                        Transmission: ${data.transmission || ''}
                        Engine: ${data.engine || ''}
                        Drivetrain: ${data.drivetrain || ''}
                        Features: ${(data.features || []).join(', ') || 'None selected'}
                        Exterior: ${data.exteriorCondition || ''}
                        Interior: ${data.interiorCondition || ''}
                        Mechanical: ${data.mechanicalCondition || ''}
                        Drivable: ${data.drivableStatus || ''}
                        Mileage: ${data.mileage || ''}
                        Title: ${data.titleStatus || ''}
                        Accidents: ${data.accidents || ''}
                        Keys: ${data.keys || ''}
                        ZIP: ${data.zipCode || ''}
                        Phone: ${data.phoneNumber || ''}
                        Email: ${data.emailAddress || ''}
                        Status: Offer pending review
                                        `.trim();

                        console.log("=== NEW LEAD ===");
                                        console.log(message);

                        // Respond to client immediately so form doesn't hang
                        res.json({ success: true });

                        // Use notificationEmails from payload, fallback to defaults
                        const defaultEmails = ['Mike.CSME@gmail.com', 'Crystal.CSME@gmail.com'];
                                        const emailList = (data.notificationEmails && data.notificationEmails.length > 0)
                                                ? data.notificationEmails
                                                                        : defaultEmails;

                        // Send Email notifications via Resend
                        if (process.env.RESEND_API_KEY) {
                                                        try {
                                                                                                const htmlBody = `
                                                                                                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
                                                                                                  <h2 style="color:#ff1493;margin-bottom:4px;">New CSME Lead</h2>
                                                                                                    <h3 style="color:#111;margin-top:0;">${vehicle}</h3>
                                                                                                      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                                                                                                          <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">VIN</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.vin || ''}</td></tr>
                                                                                                              <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Trim</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.trim || ''}</td></tr>
                                                                                                                  <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Mileage</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.mileage || ''}</td></tr>
                                                                                                                      <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Exterior</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.exteriorCondition || ''}</td></tr>
                                                                                                                          <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Interior</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.interiorCondition || ''}</td></tr>
                                                                                                                              <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Mechanical</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.mechanicalCondition || ''}</td></tr>
                                                                                                                                  <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Title</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.titleStatus || ''}</td></tr>
                                                                                                                                      <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Accidents</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.accidents || ''}</td></tr>
                                                                                                                                          <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">ZIP</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.zipCode || ''}</td></tr>
                                                                                                                                              <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.phoneNumber || ''}</td></tr>
                                                                                                                                                  <tr><td style="padding:8px;font-weight:bold;color:#333;border-bottom:1px solid #eee;">Customer Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.emailAddress || ''}</td></tr>
                                                                                                                                                    </table>
                                                                                                                                                      <p style="margin-top:20px;padding:12px;background:#fff3f8;border-radius:8px;color:#ff1493;font-weight:bold;">Status: Offer Pending Review</p>
                                                                                                                                                      </div>
                                                                                                                                                                                      `.trim();

                                                                const { error } = await resend.emails.send({
                                                                                                                from: 'CSME Lead Alert <mike@carsalesmadeeasy.com>',
                                                                                                                to: emailList,
                                                                                                                subject: `New Lead: ${vehicle} - ${data.phoneNumber || 'No phone'}`,
                                                                                                                text: message,
                                                                                                                html: htmlBody
                                                                        });
                                                                                                if (error) {
                                                                                                                                                console.log("EMAIL ERROR:", error.message);
                                                                                                        } else {
                                                                                                                                                console.log("EMAIL SENT to:", emailList.join(', '));
                                                                                                        }
                                                        } catch (emailErr) {
                                                                                                console.log("EMAIL ERROR:", emailErr.message);
                                                        }
                        } else {
                                                        console.log("EMAIL SKIPPED (RESEND_API_KEY not configured)");
                        }

                        // Send SMS notifications via Twilio
                        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
                                                        const smsNumbers = data.smsNotify && data.smsNotify.length > 0
                                                                ? data.smsNotify
                                                                                                : ["+17144766108", "+17144766095"];
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

                } catch (err) {
                                        console.log("SERVER ERROR:", err);
                                        if (!res.headersSent) {
                                                                        return res.status(500).json({ error: "Failed" });
                                        }
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
