const { db } = require('../lib/firebase');
const Brevo = require('@getbrevo/brevo');

// Инициализация Brevo API
let apiInstance = new Brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

module.exports = async (req, res) => {
  // Настройка CORS для Android
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Сохраняем код в Firebase (это работает 100%)
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // 2. Отправляем письмо через API Brevo
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Your Quire Login Code";
    sendSmtpEmail.htmlContent = `<html><body><h1>Your code is: ${code}</h1></body></html>`;
    sendSmtpEmail.sender = { "name": "Quire App", "email": process.env.BREVO_SENDER };
    sendSmtpEmail.to = [{ "email": email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return res.status(200).json({ success: true });
  } catch (error) {
    // Логируем ошибку, чтобы её было видно в Vercel Logs
    console.error("BREVO_ERROR_DETAIL:", error.response ? error.response.body : error.message);
    return res.status(500).json({ error: "Failed to send email via Brevo" });
  }
};
