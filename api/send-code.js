const { db } = require('../lib/firebase');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER, // Твоя почта @outlook.com
    pass: process.env.MAIL_PASS, // Твой 16-значный пароль приложения
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Сохраняем код в Firebase Firestore
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // 2. Отправляем письмо через Outlook
    await transporter.sendMail({
      from: `"Quire App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Login Code",
      text: `Your login code is: ${code}`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Your Login Code</h2>
              <h1 style="color: #4353E1;">${code}</h1>
              <p>Valid for 5 minutes.</p>
             </div>`
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("SEND_CODE_ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
