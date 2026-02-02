const { db } = require('../lib/firebase');
const nodemailer = require('nodemailer');

// Настройка почтового сервера Microsoft Outlook
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // или "smtp-mail.outlook.com"
  port: 587,
  secure: false, // для порта 587 всегда false
  auth: {
    user: process.env.MAIL_USER, // Твой логин @outlook.com
    pass: process.env.MAIL_PASS, // Твой 16-значный ПАРОЛЬ ПРИЛОЖЕНИЯ
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Настройка CORS (чтобы Android мог достучаться)
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Генерируем код
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Сохраняем код в Firebase (ты говорил, это уже работает)
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // 2. Отправляем письмо через твой Outlook
    await transporter.sendMail({
      from: `"Quire App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Login Code",
      text: `Your login code is: ${code}`,
      html: `<b>Your code is: ${code}</b>`
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("ОШИБКА ОТПРАВКИ:", error);
    res.status(500).json({ error: error.message });
  }
};
